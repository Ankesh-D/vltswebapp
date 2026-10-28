import { addMapBasemapControl } from '../../shared/components/map-layer-options/map-basemaps';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ApiResponse } from './base-api.service';
import { NotificationService } from './notification.service';
import { Router } from '@angular/router';
import { configureMapboxAccessToken } from '../utils/mapbox-config';

export interface LiveTrackPoint {
  param13: string; // Vehicle No
  param33: string; // Location
  param34: string; // Connection Status
  param35: string; // Last Update
  param38: string; // Latitude
  param39: string; // Longitude
  param40: string; // Speed
  param45: string; // Ignition ('1' or '0')
  param46: string; // Status (e.g., 'normal', 'Panic', 'run', 'stop')
}

@Injectable({
  providedIn: 'root'
})
export class MapboxService {
  http = inject(HttpClient);
  notificationService = inject(NotificationService);
  map: any = null;

  // Vehicle and route properties
  private vehicleSourceId = 'vehicle-source';
  private vehicleLayerId = 'vehicle-layer';
  private vehiclePulseLayerId = 'vehicle-pulse-layer';
  private routeSourceId = 'route-source';
  private routeLayerId = 'route-layer';
  private routeArrowLayerId = 'route-arrow-layer';
  private pulsingArrowIconId = 'pulsing-arrow';

  // Animation properties
  animationFrameId: any = null;
  private animationStartTime: number = 0;
  private animationDuration: number = 3000; // 3 seconds to travel between points
  private currentPointIndex: number = 0;
  private pathCoordinates: [number, number][] = [];
  private pathData: LiveTrackPoint[] = [];

  // Subject to emit current vehicle data for other components (like an info panel)
  private currentVehicleData = new BehaviorSubject<LiveTrackPoint | null>(null);
  public currentVehicleData$ = this.currentVehicleData.asObservable();

  // Subject to emit when no track data is found, allowing components to react (e.g., close a modal)
  private noTrackDataSubject = new Subject<string | null>();
  public noTrackData$ = this.noTrackDataSubject.asObservable();

  // Info Panel Reference
  private infoPanelDiv: HTMLElement | null = null;
  private activePopup: any = null;
  errorMessage: string | null = null;

  constructor(private router: Router) { }

  /**
   * Initializes the Mapbox map.
   * @param containerId The ID of the HTML element where the map will be rendered.
   */
  initializeMap(containerId: string) {
    try {
      // Ensure mapboxgl is loaded
      if (typeof (window as any).mapboxgl === 'undefined') {
        this.notificationService.showError('Map library is not loaded. Please refresh the page.');
        return;
      }

      const mapboxgl = (window as any).mapboxgl;
      if (!configureMapboxAccessToken(mapboxgl)) {
        this.notificationService.showError('Map service is not configured. Please contact support.');
        return;
      }

      this.map = new mapboxgl.Map({
        container: containerId,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [87.74780, 22.978624], // Default center
        zoom: 8,
        minZoom: 3,
        maxZoom: 18,
        preserveDrawingBuffer: true,
        interactive: true,
        attributionControl: false
      });
      addMapBasemapControl(this.map, 'mapbox');

      // Add controls
      this.map.addControl({
        onAdd: () => {
          const container = document.createElement('div');
          container.className = 'mapboxgl-ctrl mapboxgl-ctrl-attrib';
          container.innerHTML = '<div class="mapboxgl-ctrl-attrib-inner">Powered by DIMTS</div>';
          return container;
        },
        onRemove: () => {}
      }, 'bottom-right');
      this.map.addControl(new mapboxgl.FullscreenControl());
      this.map.addControl(new mapboxgl.NavigationControl());
      this.map.addControl(new mapboxgl.ScaleControl());

      // On map load, load the custom vehicle icon
      this.map.on('load', () => {
        
        // 1. Generate Pulsing Arrow Icon
        this.generatePulsingArrowIcon();

        // 2. Load all vehicle status icons
        // The map will attempt to load these icons first. Fallback is only used if these fail (404).
        const iconPaths = {
          green: 'assets/mapimages/car/green.png',
          red: 'assets/mapimages/car/red.png',
          yellow: 'assets/mapimages/car/yellow.png',
          blue: 'assets/mapimages/car/blue.png'
        };

        Object.entries(iconPaths).forEach(([color, path]) => {
          this.map.loadImage(path, (error: any, image: any) => {
            if (error) {
              this.errorMessage = `Error loading ${color} vehicle icon: ${error.message}`;
              this.generateFallbackIcon(color);
              return;
            }
            const iconId = `vehicle-icon-${color}`;
            if (!this.map.hasImage(iconId)) {
              this.map.addImage(iconId, image, { sdf: false }); // Using PNGs, sdf is not needed unless they are single color
            }
          });
        });
      });

    } catch (error) {
     
      this.notificationService.showError('Error initializing map. Please try again.');
    }
  }

  /**
   * Generates a pulsing arrow icon for the route.
   */
  private generatePulsingArrowIcon() {
    const size = 150;
    const map = this.map;

    const pulsingArrow = {
      width: size,
      height: size,
      data: new Uint8Array(size * size * 4),
      context: null as any,

      onAdd: function (this: any) {
        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        this.context = canvas.getContext('2d', { willReadFrequently: true });
      },

      render: function (this: any) {
        const radius = (size / 2) * 0.3;
        const context = this.context as CanvasRenderingContext2D;

        // Clear
        context.clearRect(0, 0, this.width, this.height);

        // Inner circle (solid)
        context.beginPath();
        context.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2);
        context.fillStyle = 'rgba(0, 100, 255, 1)';
        context.strokeStyle = 'white';
        context.lineWidth = 4;
        context.fill();
        context.stroke();

        // Draw an arrow inside the inner circle
        context.beginPath();
        context.moveTo(this.width / 2 + radius * 0.6, this.height / 2); // Arrow tip (points right)
        context.lineTo(this.width / 2 - radius * 0.4, this.height / 2 - radius * 0.5);
        context.lineTo(this.width / 2 - radius * 0.4, this.height / 2 + radius * 0.5);
        context.closePath();
        context.fillStyle = 'white';
        context.fill();

        this.data = context.getImageData(0, 0, this.width, this.height).data;
        
        return true;
      }
    };

    if (!this.map.hasImage(this.pulsingArrowIconId)) {
        this.map.addImage(this.pulsingArrowIconId, pulsingArrow, { pixelRatio: 2 });
    }
  }

  /**
   * Generates a fallback icon if the image fails to load.
   */
  private generateFallbackIcon(color: string) {
    const size = 60;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (ctx) {
      // Draw circle
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
      
      // Set color
      let fillStyle = color;
      switch (color) {
        case 'green': fillStyle = '#28a745'; break;
        case 'red': fillStyle = '#dc3545'; break;
        case 'yellow': fillStyle = '#ffc107'; break;
        case 'blue': fillStyle = '#007bff'; break;
      }
      ctx.fillStyle = fillStyle;
      
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Draw arrow (triangle pointing up)
      ctx.beginPath();
      ctx.moveTo(size / 2, 10);
      ctx.lineTo(size / 2 - 8, size / 2 + 6);
      ctx.lineTo(size / 2 + 8, size / 2 + 6);
      ctx.closePath();
      ctx.fillStyle = 'white';
      ctx.fill();

      const iconId = `vehicle-icon-${color}`;
      if (!this.map.hasImage(iconId)) {
        const imageData = ctx.getImageData(0, 0, size, size);
        this.map.addImage(iconId, imageData, { pixelRatio: 1 });
      }
    }
  }

  /**
   * Starts the live vehicle tracking process.
   * @param requestParam The parameter for the API request (e.g., vehicle ID).
   */
  liveVehicleTrack(requestParam: string) {
    this.stopLiveTrack(); // Clear any previous tracking

    this.http.post<ApiResponse<LiveTrackPoint[]>>('/psv_get_livetrack', { param5: requestParam }).subscribe({
      next: (response) => {
        if (response && response.status && response.entity && response.entity.length > 0) {
          this.pathData = response.entity;

          this.pathCoordinates = this.pathData.map((p: LiveTrackPoint) => [parseFloat(p.param39), parseFloat(p.param38)]);

          // Add a check for invalid coordinates which can stop rendering
          const invalidPoints = this.pathCoordinates.filter(coord => isNaN(coord[0]) || isNaN(coord[1]));
          if (invalidPoints.length > 0) {
            const message = 'Received invalid location data for the track.';
            this.noTrackDataSubject.next(message);
            return;
          }

          if (this.pathCoordinates.length < 2) {
            if (this.pathCoordinates.length === 1) {
              // If there's only one point, show a static marker.
              this.setupTrackingLayers(true);
              this.createOrUpdateInfoPanel();
              this.currentVehicleData.next(this.pathData[0]); // Show data for static marker
              this.map.flyTo({ center: this.pathCoordinates[0], zoom: 15 });
            } else {
              // If there are no points, show a notification and close the modal.
              const message = 'No valid track points found for this vehicle.';
              this.noTrackDataSubject.next(message);
            }
            return;
          }

          this.map.flyTo({ center: this.pathCoordinates[0], zoom: 16 });
          this.setupTrackingLayers();
          this.createOrUpdateInfoPanel();
          this.currentPointIndex = 0;
          this.animationStartTime = performance.now();
          this.animateVehicle();
        } else {
          // This block handles API errors, empty entity, or status:false
          this.errorMessage = response?.message || 'Could not retrieve vehicle track data. The vehicle may not have a recent travel history.';
          this.noTrackDataSubject.next(this.errorMessage);
        }
      },
      error: (err) => {
        const message = 'An error occurred while fetching the track data.';
        this.notificationService.showError(message);
        this.noTrackDataSubject.next(message); // Also notify on HTTP error
      }
    });
  }

  /**
   * Sets up the necessary Mapbox sources and layers for tracking.
   * @param isStatic If true, only the vehicle marker is shown without a route.
   */
  private setupTrackingLayers(isStatic = false) {
    const initialData = this.pathData[0];
    const initialIconType = this.getVehicleIconType(initialData);

    // 1. Add Route Source and Layers (Background) - Added BEFORE vehicle layer so it appears below
    if (!isStatic) {
      this.map.addSource(this.routeSourceId, {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} }
      });

      this.map.addLayer({
        id: this.routeLayerId,
        source: this.routeSourceId,
        type: 'line',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3887be',
          'line-width': 5,
          'line-opacity': 0.8
        }
      });

      // Direction Arrow Layer
      this.map.addLayer({
        id: this.routeArrowLayerId,
        type: 'symbol',
        source: this.routeSourceId,
        layout: {
          'symbol-placement': 'line',
          'symbol-spacing': 150,
          'icon-image': this.pulsingArrowIconId, // Use the new pulsing arrow
          'icon-size': 0.8,
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'icon-rotation-alignment': 'map' // Ensures arrow aligns with the line direction
        },
        paint: {
          // No paint properties needed for custom animated icon
        }
      });
    }

    // 2. Add Vehicle Source and Layer (Foreground) - Added AFTER route layer so it appears on top
    this.map.addSource(this.vehicleSourceId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: this.pathCoordinates[0] },
        properties: { 
          vehicleData: JSON.stringify(initialData),
          iconType: initialIconType
        }
      }
    });

    this.map.addLayer({
      id: this.vehicleLayerId,
      source: this.vehicleSourceId,
      type: 'symbol',
      layout: {
        'icon-image': [
          'match',
          ['get', 'iconType'],
          'green', 'vehicle-icon-green',
          'red', 'vehicle-icon-red',
          'yellow', 'vehicle-icon-yellow',
          'blue', 'vehicle-icon-blue',
          'vehicle-icon-blue' // Default icon
        ],
        'icon-size': 0.07, 
        'icon-rotate': ['get', 'bearing'], // Will be set during animation
        'icon-rotation-alignment': 'map',
        'icon-allow-overlap': true,
        'icon-ignore-placement': true
      },
      paint: {
        // No paint properties needed
      }
    });

    // 3. Setup Popup on Click
    this.map.on('click', this.vehicleLayerId, (e: any) => {
      const properties = e.features[0].properties;
      const coordinates = e.features[0].geometry.coordinates.slice();
      const vehicleData = JSON.parse(properties.vehicleData);

      if (this.activePopup) {
        this.activePopup.remove();
      }

      const popupHtml = this.getPopupHtml(vehicleData);

      this.activePopup = new (window as any).mapboxgl.Popup({ closeOnClick: true, closeButton: true })
        .setLngLat(coordinates)
        .setHTML(popupHtml)
        .addTo(this.map);

      this.activePopup.on('close', () => {
        this.activePopup = null;
      });
    });

    this.map.on('mouseenter', this.vehicleLayerId, () => { this.map.getCanvas().style.cursor = 'pointer'; });
    this.map.on('mouseleave', this.vehicleLayerId, () => { this.map.getCanvas().style.cursor = ''; });
  }

  private getPopupHtml(vehicleData: LiveTrackPoint): string {
    const status = (vehicleData.param46 || '').toLowerCase();
    let statusColor = '#6c757d'; // grey
    let textColor = 'white';

    if (status.includes('run') || status.includes('mov')) {
      statusColor = '#28a745'; // green
    } else if (status.includes('stop') || status.includes('idle')) {
      statusColor = '#ffc107'; // yellow
      textColor = '#333';
    } else if (status.includes('offline') || status.includes('not')) {
      statusColor = '#dc3545'; // red
    }

    return `
        <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px;
        border: 1px solid #3386c8; min-width: 260px; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.15); background: white;">
            <div style="background: linear-gradient(135deg, #3386c8, #2a6592); color: white; padding: 3px 8px; font-weight: 600; font-size: 15px; border-bottom: 1px solid rgba(0,0,0,0.1);">
                Vehicle Information
            </div>
            <div style="padding: 0;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="border-bottom: 1px solid #f0f0f0;">
                    <td style="padding: 2px 15px; color: #666; font-weight: 500; width: 40%; font-size:13px;">Vehicle No</td><td style="padding: 2px 15px; color: #333; font-weight: 600; text-align: left; font-size:11px;">${vehicleData.param13 || 'N/A'}</td></tr>
                    <tr style="border-bottom: 1px solid #f0f0f0;">
                    <td style="padding: 2px 15px; color: #666; font-weight: 500; font-size:13px;">Speed</td><td style="padding: 2px 15px; color: #333; font-weight: 600; text-align: left; font-size:11px;">${vehicleData.param40 || '0'} km/h</td></tr>
                    <tr style="border-bottom: 1px solid #f0f0f0;">
                    <td style="padding: 2px 15px; color: #666; font-weight: 500; font-size:13px;">Last Update</td><td style="padding: 2px 15px; color: #333; font-weight: 600; text-align: left; font-size:11px;">${vehicleData.param35 || 'N/A'}</td></tr>
                    <tr><td style="padding: 2px 15px; color: #666; font-weight: 500; font-size:13px;">Status</td><td style="padding: 2px 15px; text-align: left;">
                        <span style="display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; background-color: ${statusColor}; color: ${textColor}; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            ${vehicleData.param46 || 'N/A'}
                        </span>
                    </td></tr>
                </table>
            </div>
        </div>`;
  }

  /**
   * Creates or updates the bottom-right info panel.
   */
  private createOrUpdateInfoPanel() {
    if (!this.infoPanelDiv) {
        const mapContainer = this.map.getContainer();
        
        // 1. Inject CSS for the panel (Attractive & Animated)
        if (!document.getElementById('live-track-panel-styles')) {
            const style = document.createElement('style');
            style.id = 'live-track-panel-styles';
            style.innerHTML = `
                .live-track-info-panel {
                    position: absolute;
                    bottom: 30px;
                    right: 10px;
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(5px);
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
                    width: 300px;
                    font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    overflow: hidden;
                    z-index: 1000;
                    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                .live-track-header {
                    background: linear-gradient(135deg, #3887be, #2a6592);
                    color: white;
                    padding: 6px 15px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: pointer;
                    user-select: none;
                }
                .live-track-header h4 {
                    margin: 0;
                    font-size: 15px;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                }
                .live-track-toggle {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    padding: 5px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .live-track-toggle::after {
                    content: '';
                    display: inline-block;
                    width: 8px;
                    height: 8px;
                    border-right: 2px solid white;
                    border-bottom: 2px solid white;
                    transform: rotate(45deg);
                    transition: transform 0.3s ease;
                    margin-bottom: 3px;
                }
                .live-track-info-panel.collapsed .live-track-toggle::after {
                    transform: rotate(-135deg);
                    margin-bottom: -3px;
                }
                .live-track-content {
                    padding: 15px;
                    display: grid;
                    grid-template-columns: 1fr 1.2fr;
                    gap: 10px 5px;
                    font-size: 13px;
                    transition: max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease;
                    max-height: 300px;
                    opacity: 1;
                }
                .live-track-info-panel.collapsed .live-track-content {
                    max-height: 0;
                    opacity: 0;
                    padding: 0 15px;
                }
                .lt-label { color: #666; font-weight: 500; }
                .lt-value { font-weight: 600; color: #333; text-align: right; }
                .lt-status-badge {
                    display: inline-block;
                    padding: 3px 10px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
            `;
            document.head.appendChild(style);
        }

        this.infoPanelDiv = document.createElement('div');
        this.infoPanelDiv.className = 'live-track-info-panel';
        
        // Create internal structure once
        this.infoPanelDiv.innerHTML = `
            <div class="live-track-header" id="ltHeader">
                <h4>Live Tracking</h4>
                <button class="live-track-toggle" id="ltToggle"></button>
            </div>
            <div class="live-track-content">
                <div class="lt-label">Vehicle No:</div>
                <div class="lt-value" id="lt-vehicle-no">-</div>
                
                <div class="lt-label">Speed:</div>
                <div class="lt-value" id="lt-speed">-</div>
                
                <div class="lt-label">Status:</div>
                <div class="lt-value" style="text-align: right;"><span id="lt-status" class="lt-status-badge">-</span></div>
                
                <div class="lt-label">Location:</div>
                <div class="lt-value" id="lt-location" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;">-</div>
                
                <div class="lt-label">Last Update:</div>
                <div class="lt-value" id="lt-update">-</div>
            </div>
        `;

        mapContainer.appendChild(this.infoPanelDiv);

        // Add toggle functionality
        const header = this.infoPanelDiv.querySelector('#ltHeader');
        if (header) {
            header.addEventListener('click', () => {
                this.infoPanelDiv?.classList.toggle('collapsed');
            });
        }

        // Subscribe to data updates
        this.currentVehicleData$.subscribe(data => {
            if (data && this.infoPanelDiv) {
                this.updatePanelContent(data);
            }
        });
    }
    this.infoPanelDiv.style.display = 'block';
  }

  private updatePanelContent(data: LiveTrackPoint) {
      if (!this.infoPanelDiv) return;
      
      // Helper to safely set text content
      const setText = (id: string, text: string) => {
          const el = this.infoPanelDiv?.querySelector(`#${id}`);
          if (el) el.textContent = text;
      };

      setText('lt-vehicle-no', data.param13 || '-');
      
      // Update Speed with color
      const speedEl = this.infoPanelDiv.querySelector('#lt-speed');
      if (speedEl) {
          const speed = parseFloat(data.param40 || '0');
          speedEl.textContent = `${speed} km/h`;
          (speedEl as HTMLElement).style.color = speed > 0 ? '#28a745' : '#666';
      }

      // Update Status with badge color
      const statusEl = this.infoPanelDiv.querySelector('#lt-status');
      if (statusEl) {
          statusEl.textContent = data.param46 || '-';
          const status = (data.param46 || '').toLowerCase();
          let bg = '#6c757d'; // grey
          if (status.includes('run') || status.includes('mov')) bg = '#28a745'; // green
          else if (status.includes('stop') || status.includes('idle')) bg = '#ffc107'; // yellow
          else if (status.includes('offline') || status.includes('not')) bg = '#dc3545'; // red
          
          (statusEl as HTMLElement).style.backgroundColor = bg;
          (statusEl as HTMLElement).style.color = (status.includes('stop') || status.includes('idle')) ? '#333' : 'white';
      }

      setText('lt-location', data.param33 || '-');
      setText('lt-update', data.param35 || '-');
  }

  /**
   * The core animation loop, called with requestAnimationFrame.
   */
  private animateVehicle() {
    if (this.currentPointIndex >= this.pathCoordinates.length - 1) {
      //console.log('Tracking finished.');
      this.currentVehicleData.next(this.pathData[this.pathData.length - 1]); // Emit final data
      return;
    }

    const segmentIndex = this.currentPointIndex;
    const startPoint = this.pathCoordinates[segmentIndex];
    const endPoint = this.pathCoordinates[segmentIndex + 1];
    const segmentData = this.pathData[segmentIndex];

    // Emit current data for info panel
    this.currentVehicleData.next(segmentData);

    const elapsedTime = performance.now() - this.animationStartTime;
    const progress = Math.min(elapsedTime / this.animationDuration, 1);

    const lng = startPoint[0] + (endPoint[0] - startPoint[0]) * progress;
    const lat = startPoint[1] + (endPoint[1] - startPoint[1]) * progress;
    const currentPoint: [number, number] = [lng, lat];

    // Update popup position and content if active
    if (this.activePopup) {
      this.activePopup.setLngLat(currentPoint);
      this.activePopup.setHTML(this.getPopupHtml(segmentData));
    }

    // Follow the vehicle as it moves
    this.map.panTo(currentPoint, { duration: 0 });

    const iconType = this.getVehicleIconType(segmentData);
    const bearing = this.calculateBearing(startPoint, endPoint);

    const vehicleFeature = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: currentPoint },
      properties: { 
        bearing: bearing, 
        vehicleData: JSON.stringify(segmentData),
        iconType: iconType
      }
    };
    (this.map.getSource(this.vehicleSourceId) as any)?.setData(vehicleFeature);

    const currentPath = [...this.pathCoordinates.slice(0, this.currentPointIndex + 1), currentPoint];
    const lineSoFar = {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: currentPath },
      properties: {}
    };
    (this.map.getSource(this.routeSourceId) as any)?.setData(lineSoFar);

    if (progress >= 1) {
      this.currentPointIndex++;
      this.animationStartTime = performance.now();
    }

    this.animationFrameId = requestAnimationFrame(this.animateVehicle.bind(this));
  }

  private getVehicleIconType(vehicleData: LiveTrackPoint): string {
    const speed = parseFloat(vehicleData.param40 || '0');
    const ignition = vehicleData.param45; // '1' or '0'
    const connectionStatus = vehicleData.param34;
    const alertStatus = vehicleData.param46; // 'normal' or other things like 'Panic'

    if (connectionStatus === 'Not Connected' || ignition !== '1') {
        return 'blue'; // Offline or Ignition Off
    }

    if (alertStatus && alertStatus.toLowerCase() !== 'normal') {
        return 'red'; // Panic, SOS, or other alert status
    }

    if (speed > 5) {
        return 'green'; // Running/Moving
    } else {
        return 'yellow'; // Stopped/Idle with ignition on
    }
  }

  private calculateBearing(start: [number, number], end: [number, number]): number {
    const startLng = this.toRad(start[0]);
    const startLat = this.toRad(start[1]);
    const endLng = this.toRad(end[0]);
    const endLat = this.toRad(end[1]);

    const y = Math.sin(endLng - startLng) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) -
              Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);

    return this.toDeg(Math.atan2(y, x));
  }

  private toRad(deg: number): number { return deg * (Math.PI / 180); }
  private toDeg(rad: number): number { return rad * (180 / Math.PI); }

  /**
   * Stops the live tracking and cleans up map layers and sources.
   */
  public stopLiveTrack() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (!this.map) return;

    // Remove layers and sources if they exist
    ['click', 'mouseenter', 'mouseleave'].forEach(event => this.map.off(event, this.vehicleLayerId));
    if (this.map.getLayer(this.vehicleLayerId)) this.map.removeLayer(this.vehicleLayerId);
    if (this.map.getLayer(this.routeArrowLayerId)) this.map.removeLayer(this.routeArrowLayerId);
    if (this.map.getLayer(this.routeLayerId)) this.map.removeLayer(this.routeLayerId);
    if (this.map.getSource(this.vehicleSourceId)) this.map.removeSource(this.vehicleSourceId);
    if (this.map.getSource(this.routeSourceId)) this.map.removeSource(this.routeSourceId);

    if (this.activePopup) {
      this.activePopup.remove();
      this.activePopup = null;
      
    }

    // Reset properties
    this.pathCoordinates = [];
    this.pathData = [];
    this.currentPointIndex = 0;
    this.currentVehicleData.next(null);
    
    if (this.infoPanelDiv) {
        this.infoPanelDiv.style.display = 'none';
    }
  }
  
}