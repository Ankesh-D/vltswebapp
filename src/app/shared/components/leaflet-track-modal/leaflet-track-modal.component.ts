import { createLeafletBasemap } from '../map-layer-options/map-basemaps';
import { MapLayerOptionsComponent } from '../map-layer-options/map-layer-options.component';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import dayjs from 'dayjs';
import * as turf from '@turf/turf';
import L from 'leaflet';
import { VehicleService } from '../../../core/services/vehicle.service';
import { AlertService } from '../../../core/services/alert.service';
import { ToastComponent } from '../../../features/assets/inactive-assets/toast.component';
import { LeafletMapComponent } from '../leaflet-map/leaflet-map.component';

declare var $: any;

@Component({
    selector: 'app-leaflet-track-modal',
    imports: [MapLayerOptionsComponent, CommonModule, FormsModule, TimepickerModule, ToastComponent, LeafletMapComponent],
    templateUrl: './leaflet-track-modal.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './leaflet-track-modal.component.scss'
})
export class LeafletTrackModalComponent implements OnChanges, OnDestroy {
  @Input() visible = false;
  @Input() trackingId = '';
  @Input() trackingLabel = 'Vehicle No';
  @Input() headerTint = '#abbbff';
  @Input() selectedItem: any = null;
  @Output() closed = new EventEmitter<void>();

  private mapHostElement: HTMLElement | null = null;
  private map: L.Map | null = null;
  private currentTileLayer: L.TileLayer | L.TileLayer.WMS | null = null;
  private liveTrackingInterval: any = null;
  private liveAnimationId: number | null = null;
  private animationFrameId: number | null = null;
  private liveRouteLayer = L.layerGroup();
  private liveArrowsLayer = L.layerGroup();
  private liveAlertsLayer = L.layerGroup();
  private historyRouteLayer = L.layerGroup();
  private historyArrowsLayer = L.layerGroup();
  private historyAlertsLayer = L.layerGroup();
  private policeStationMarkers: L.Marker[] = [];

  liveMarker: L.Marker | null = null;
  historyMarker: L.Marker | null = null;
  historyStartMarker: L.Marker | null = null;
  historyEndMarker: L.Marker | null = null;

  showPlaybackControls = true;
  isLayerSwitcherOpen = false;
  isLegendOpen = false;
  activeMapStyle = 'streets-v11';
  loading = false;
  isHistoryLoading = false;
  isHistoryPlaying = false;
  errorMessage: string | null = null;
  errorType: 'error' | 'success' = 'error';

  vehicleTrackingData: any = null;
  liveRouteCoordinates: [number, number][] = [];
  liveArrowCoordinates: [number, number][] = [];
  alertFeatures: any[] = [];
  historyDataList: any[] = [];
  historyPlaybackIndex = 0;
  speedSliderValue = 1;
  isFirstLiveTrack = true;
  poiData: any = {};

  historyDate = dayjs().format('YYYY-MM-DD');
  fromTime: Date = dayjs().startOf('day').toDate();
  toTime: Date = dayjs().endOf('day').toDate();

  vehiclenolive: any = '';
  speedlive: any = '';
  ignitionlive: any = '';
  gpslive: any = '';
  pollingtimelive: any = '';
  customerlive: any = '';
  deviceserialnolive: any = '';
  IMEINolive: any = '';
  Vendorlive: any = '';
  ICCIDlive: any = '';

  readonly alertIconMappings = {
    overspeed: 'assets/mapimages/alertimage/overspeed_new.png',
    impact: 'assets/mapimages/alertimage/emergency.png',
    'main battery reconnect': 'assets/mapimages/alertimage/batterycharge.png',
    'power disconnect': 'assets/mapimages/alertimage/powerDisconnect.png',
    'ignition on': 'assets/mapimages/alertimage/ignitionOn.png',
    'ignition off': 'assets/mapimages/alertimage/ignitionOff.png',
    'harsh acceleration': 'assets/mapimages/alertimage/harshacceleration_new.png',
    'harsh brake': 'assets/mapimages/alertimage/harshbrake_new.png',
    'geofence entry': 'assets/mapimages/alertimage/geofenceentry.png',
    'geofence exit': 'assets/mapimages/alertimage/geofenceexit.png',
    panic: 'assets/mapimages/alertimage/emergency.png',
    'low battery': 'assets/mapimages/alertimage/batterylow.png',
    'route deviation': 'assets/mapimages/alertimage/routedev3.png',
    tamper: 'assets/mapimages/alertimage/tamper.png',
    tilt: 'assets/mapimages/alertimage/tilt.png',
    default: 'assets/mapimages/alertimage/others.png'
  };

  alertLegends = Object.entries(this.alertIconMappings).map(([label, icon]) => ({ label, icon }));

  constructor(
    private vehicleService: VehicleService,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']) {
      if (this.visible) {
        this.openTracker();
      } else {
        this.destroyTracker();
      }
    }
  }

  onMapReady(mapElement: HTMLElement): void {
    this.mapHostElement = mapElement;
    if (this.visible) {
      this.initializeMap();
    }
  }

  private openTracker(): void {
    this.errorMessage = null;
    this.showPlaybackControls = true;
    this.isLegendOpen = false;
    this.isLayerSwitcherOpen = false;
    this.historyDataList = [];
    this.historyPlaybackIndex = 0;
    this.liveRouteCoordinates = [];
    this.liveArrowCoordinates = [];
    this.alertFeatures = [];
    this.isFirstLiveTrack = true;
    $('#livedetailsinfo').hide();
    $('#historydetailsinfo').hide();

    setTimeout(() => {
      this.initializeMap();
      this.startLivePolling();
    }, 100);
  }

  private startLivePolling(): void {
    if (!this.trackingId) {
      this.errorMessage = `${this.trackingLabel} is required for tracking`;
      return;
    }
    this.loadVehicleTracking(true);
    if (this.liveTrackingInterval) {
      clearInterval(this.liveTrackingInterval);
    }
    this.liveTrackingInterval = setInterval(() => this.loadVehicleTracking(false), 10000);
  }

  initializeMap(): void {
    if (!this.mapHostElement || this.map) {
      this.map?.invalidateSize();
      return;
    }

    const rect = this.mapHostElement.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      setTimeout(() => this.initializeMap(), 100);
      return;
    }

    this.map = L.map(this.mapHostElement, {
      center: [22.978624, 87.74780],
      zoom: 8,
      minZoom: 3,
      maxZoom: 20,
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true
    });

    L.control.zoom({ position: 'topleft' }).addTo(this.map);
    this.switchBaseLayer(this.activeMapStyle);
    this.addWmsLayer();
    this.liveRouteLayer.addTo(this.map);
    this.liveArrowsLayer.addTo(this.map);
    this.liveAlertsLayer.addTo(this.map);
    this.historyRouteLayer.addTo(this.map);
    this.historyArrowsLayer.addTo(this.map);
    this.historyAlertsLayer.addTo(this.map);
    this.map.on('zoomend', () => {
      this.renderLiveArrows();
      this.renderHistoryArrows();
      this.updatePoliceStationMarkers();
    });
    this.loadPoliceStations();
    setTimeout(() => this.map?.invalidateSize(), 50);
  }

  changeMapStyle(style: string): void {
    this.activeMapStyle = style;
    this.switchBaseLayer(style);
    this.isLayerSwitcherOpen = false;
  }

  private switchBaseLayer(style: string): void {
    if (!this.map) {
      return;
    }
    const nextLayer = this.createTileLayer(style);
    if (this.currentTileLayer && this.map.hasLayer(this.currentTileLayer)) {
      this.map.removeLayer(this.currentTileLayer);
    }
    this.currentTileLayer = nextLayer;
    this.currentTileLayer.addTo(this.map);
  }

  private createTileLayer(style: string): L.TileLayer | L.TileLayer.WMS {
    return createLeafletBasemap(style);
  }

  private addWmsLayer(): void {
    if (!this.map) return;
    L.tileLayer.wms('https://vlts.wb.gov.in/geoserver/wbsdcmap/wms?', {
      layers: 'wbsdcmap:india_state',
      format: 'image/png',
      transparent: true,
      version: '1.1.0',
      opacity: 0.35
    }).addTo(this.map);
  }

  loadVehicleTracking(showLoader = true): void {
    this.loading = showLoader;
    this.vehicleService.getLiveTrack(this.trackingId, showLoader).subscribe({
      next: (response: any) => {
        this.loading = false;
        const entity = response?.entity;
        if (response?.status && Array.isArray(entity) && entity.length) {
          this.vehicleTrackingData = entity[0];
          this.updateLiveVehiclePosition(this.vehicleTrackingData);
        } else {
          this.errorMessage = 'No tracking data found';
        }
      },
      error: (error: any) => {
        this.loading = false;
        this.errorMessage = error?.error?.entity || 'Error loading tracking data';
      }
    });
  }

  private updateLiveVehiclePosition(vehicleData: any): void {
    if (!this.map || !vehicleData) return;
    const lat = Number(vehicleData.param38);
    const lng = Number(vehicleData.param39);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
      return;
    }

    this.plotAlert(vehicleData);
    this.updateLivePanel(vehicleData);
    const next: [number, number] = [lat, lng];

    if (this.isFirstLiveTrack || !this.liveMarker) {
      this.liveMarker?.remove();
      this.liveMarker = L.marker(next, { icon: this.createVehicleIcon(vehicleData, 0) })
        .bindPopup(this.createLivePopupHtml(vehicleData), { maxWidth: 320, className: 'vehicle-custom-popup' })
        .addTo(this.map);
      this.liveRouteCoordinates = [next];
      this.liveArrowCoordinates = [next];
      this.drawPolyline(this.liveRouteLayer, this.liveRouteCoordinates, '#007bff');
      this.renderLiveArrows();
      this.map.flyTo(next, 15);
      this.isFirstLiveTrack = false;
      return;
    }

    this.animateLiveMarker(this.liveMarker.getLatLng(), next, vehicleData);
  }

  private animateLiveMarker(start: L.LatLng, end: [number, number], vehicleData: any): void {
    if (!this.liveMarker) return;
    if (this.liveAnimationId) {
      cancelAnimationFrame(this.liveAnimationId);
    }

    const startPoint = turf.point([start.lng, start.lat]);
    const endPoint = turf.point([end[1], end[0]]);
    const distance = turf.distance(startPoint, endPoint);
    if (distance < 0.001) {
      this.liveMarker.setLatLng(end);
      this.commitLivePoint(end, vehicleData);
      return;
    }

    const heading = turf.bearing(startPoint, endPoint);
    const startSpeed = Number(this.speedlive) || 0;
    const endSpeed = Number(vehicleData.param40) || 0;
    const startTime = performance.now();
    const duration = 10000;

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentLat = start.lat + (end[0] - start.lat) * progress;
      const currentLng = start.lng + (end[1] - start.lng) * progress;
      this.liveMarker?.setLatLng([currentLat, currentLng]);
      this.liveMarker?.setIcon(this.createVehicleIcon(vehicleData, heading));
      this.speedlive = Math.round(startSpeed + (endSpeed - startSpeed) * progress);
      this.poiData.latitude = currentLat;
      this.poiData.longitude = currentLng;
      this.drawPolyline(this.liveRouteLayer, [...this.liveRouteCoordinates, [currentLat, currentLng]], '#007bff');
      this.addLiveArrowPoint([currentLat, currentLng]);
      this.cdr.detectChanges();

      if (progress < 1) {
        this.liveAnimationId = requestAnimationFrame(step);
      } else {
        this.commitLivePoint(end, vehicleData, heading);
      }
    };

    this.liveAnimationId = requestAnimationFrame(step);
  }

  private commitLivePoint(point: [number, number], vehicleData: any, heading = Number(vehicleData.param43) || 0): void {
    if (!this.liveRouteCoordinates.length || this.liveRouteCoordinates[this.liveRouteCoordinates.length - 1][0] !== point[0] || this.liveRouteCoordinates[this.liveRouteCoordinates.length - 1][1] !== point[1]) {
      this.liveRouteCoordinates.push(point);
    }
    this.liveMarker?.setLatLng(point);
    this.liveMarker?.setIcon(this.createVehicleIcon(vehicleData, heading));
    this.liveMarker?.setPopupContent(this.createLivePopupHtml(vehicleData));
    this.drawPolyline(this.liveRouteLayer, this.liveRouteCoordinates, '#007bff');
    this.addLiveArrowPoint(point);
    this.renderLiveArrows();
    this.updateLivePanel(vehicleData);
    this.liveAnimationId = null;
  }

  private plotAlert(vehicleData: any): void {
    const alertId = vehicleData.param47;
    const alertName = vehicleData.param48;
    const lat = Number(vehicleData.param38);
    const lng = Number(vehicleData.param39);
    if (!alertId || alertId === '01' || !alertName || alertName === 'NA' || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return;
    }

    const marker = L.marker([lat, lng], {
      icon: L.divIcon({
        className: 'alert-icon-marker',
        html: `<img src="${this.getAlertIconPath(alertName)}" alt="${alertName}" style="display:block;width:22px;height:22px;object-fit:contain;" />`,
        iconSize: [22, 22],
        iconAnchor: [18, 18]
      })
    }).bindPopup(`<div class="alert-popup"><strong>${alertName}</strong><div>Time: ${vehicleData.param35 || '-'}</div></div>`);
    this.liveAlertsLayer.addLayer(marker);
  }

  showHistoryTrack(trackingId: string): void {
    if (!trackingId || this.isHistoryLoading) return;
    this.stopLivePolling();
    this.clearHistoryLayers();
    const payload = {
      param1: trackingId,
      param2: $('#historydate').val(),
      param3: dayjs(this.fromTime).format('hh:mm A'),
      param4: dayjs(this.toTime).format('hh:mm A')
    };

    this.isHistoryLoading = true;
    this.vehicleService.getVehicleHistory(payload).subscribe({
      next: (response: any) => {
        this.isHistoryLoading = false;
        const historyEntity = response?.entity;
        const listData = historyEntity?.listData || [];
        if (!historyEntity?.param1 && !listData.length) {
          this.errorMessage = 'No history data found.';
          return;
        }
        this.historyDataList = listData
          .map((item: any) => ({ ...item, param7: item.param4, param8: item.param5 }))
          .filter((item: any) => Number(item.param7) && Number(item.param8));
        this.displayHistory(historyEntity, trackingId);
      },
      error: () => {
        this.isHistoryLoading = false;
        this.errorMessage = 'Error loading history data.';
      }
    });
  }

  private displayHistory(historyData: any, trackingId: string): void {
    if (!this.map || !historyData?.param1) return;
    const routeGeoJson = JSON.parse(historyData.param1);
    const coordinates = (routeGeoJson?.geometry?.coordinates || []).map((coord: any[]) => [Number(coord[1]), Number(coord[0])] as [number, number]);
    if (!coordinates.length) {
      this.errorMessage = 'No history route found.';
      return;
    }

    this.drawPolyline(this.historyRouteLayer, coordinates, '#ef6c00');
    this.renderHistoryArrows(coordinates);
    this.historyStartMarker?.remove();
    this.historyEndMarker?.remove();
    this.historyStartMarker = L.marker(coordinates[0], { icon: this.createEdgeIcon('start') }).addTo(this.map);
    this.historyEndMarker = L.marker(coordinates[coordinates.length - 1], { icon: this.createEdgeIcon('end') }).addTo(this.map);
    this.map.fitBounds(L.latLngBounds(coordinates), { padding: [30, 30] });
    this.historyPlaybackIndex = 0;
    const first = this.historyDataList[0];
    if (first) {
      this.updateHistoryPanel({
        vehicleno: first.param1 || trackingId,
        speed: first.param21 || first.param6 || '0',
        time: first.param3 || first.param35,
        ignition: first.param9 === '1' ? 'On' : 'Off',
        lat: first.param7,
        lng: first.param8
      });
    }
    this.plotHistoryAlerts();
  }

  playHistory(): void {
    if (this.isHistoryPlaying || this.historyDataList.length < 2) return;
    this.isHistoryPlaying = true;
    if (!this.historyMarker) {
      const current = this.historyDataList[this.historyPlaybackIndex];
      this.historyMarker = L.marker([Number(current.param7), Number(current.param8)], {
        icon: this.createVehicleIcon(current, Number(current.param43) || 0)
      }).addTo(this.map!);
    }
    this.animateHistoryStep();
  }

  private animateHistoryStep(): void {
    if (!this.isHistoryPlaying || this.historyPlaybackIndex >= this.historyDataList.length - 1 || !this.historyMarker) {
      this.isHistoryPlaying = false;
      return;
    }
    const startItem = this.historyDataList[this.historyPlaybackIndex];
    const endItem = this.historyDataList[this.historyPlaybackIndex + 1];
    const start = L.latLng(Number(startItem.param7), Number(startItem.param8));
    const end = L.latLng(Number(endItem.param7), Number(endItem.param8));
    const from = turf.point([start.lng, start.lat]);
    const to = turf.point([end.lng, end.lat]);
    const distance = turf.distance(from, to);
    const heading = distance > 0.001 ? turf.bearing(from, to) : Number(endItem.param43) || 0;
    const duration = Math.max((distance * 30000) / (this.speedSliderValue || 1), 16);
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      if (!this.isHistoryPlaying || !this.historyMarker) return;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const currentLat = start.lat + (end.lat - start.lat) * progress;
      const currentLng = start.lng + (end.lng - start.lng) * progress;
      this.historyMarker.setLatLng([currentLat, currentLng]);
      this.historyMarker.setIcon(this.createVehicleIcon(endItem, heading));
      this.poiData.latitude = currentLat;
      this.poiData.longitude = currentLng;
      this.speedlive = Math.round((Number(startItem.param6) || 0) + ((Number(endItem.param6) || 0) - (Number(startItem.param6) || 0)) * progress);
      this.pollingtimelive = startItem.param35 || startItem.param3;
      this.ignitionlive = startItem.param9 === '1' ? 'On' : 'Off';
      this.cdr.detectChanges();

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.historyPlaybackIndex++;
        this.animateHistoryStep();
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  pauseHistory(): void {
    this.isHistoryPlaying = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  stopHistory(): void {
    this.pauseHistory();
    this.historyPlaybackIndex = 0;
    this.historyMarker?.remove();
    this.historyMarker = null;
  }

  restartHistory(): void {
    this.stopHistory();
    this.playHistory();
  }

  onSpeedChange(event: any): void {
    this.speedSliderValue = Number(event.target.value);
    if (this.isHistoryPlaying) {
      this.pauseHistory();
      this.playHistory();
    }
  }

  goLive(): void {
    this.stopHistory();
    this.clearHistoryLayers();
    this.startLivePolling();
  }

  closeModal(): void {
    this.destroyTracker();
    this.closed.emit();
  }

  private destroyTracker(): void {
    this.stopLivePolling();
    this.pauseHistory();
    this.liveMarker?.remove();
    this.historyMarker?.remove();
    this.historyStartMarker?.remove();
    this.historyEndMarker?.remove();
    this.clearPoliceStationMarkers();
    this.liveRouteLayer.clearLayers();
    this.liveArrowsLayer.clearLayers();
    this.liveAlertsLayer.clearLayers();
    this.historyRouteLayer.clearLayers();
    this.historyArrowsLayer.clearLayers();
    this.historyAlertsLayer.clearLayers();
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.mapHostElement = null;
    this.liveMarker = null;
    this.historyMarker = null;
    this.historyStartMarker = null;
    this.historyEndMarker = null;
    this.liveRouteCoordinates = [];
    this.liveArrowCoordinates = [];
    this.historyDataList = [];
  }

  private stopLivePolling(): void {
    if (this.liveTrackingInterval) {
      clearInterval(this.liveTrackingInterval);
      this.liveTrackingInterval = null;
    }
    if (this.liveAnimationId) {
      cancelAnimationFrame(this.liveAnimationId);
      this.liveAnimationId = null;
    }
  }

  private drawPolyline(layer: L.LayerGroup, coordinates: [number, number][], color: string): void {
    layer.clearLayers();
    if (coordinates.length < 2) return;
    L.polyline(coordinates, { color, weight: 4 }).addTo(layer);
  }

  private addLiveArrowPoint(point: [number, number]): void {
    const previous = this.liveArrowCoordinates[this.liveArrowCoordinates.length - 1];
    if (!previous) {
      this.liveArrowCoordinates.push(point);
      return;
    }

    const distanceKm = turf.distance(turf.point([previous[1], previous[0]]), turf.point([point[1], point[0]]));
    if (distanceKm >= 0.025) {
      this.liveArrowCoordinates.push(point);
      this.renderLiveArrows();
    }
  }

  private renderLiveArrows(coordinates: [number, number][] = this.liveArrowCoordinates): void {
    this.renderArrowMarkers(this.liveArrowsLayer, coordinates, '#007bff');
  }

  private renderHistoryArrows(coordinates?: [number, number][]): void {
    const points = coordinates || this.historyDataList.map((item: any) => [Number(item.param7), Number(item.param8)] as [number, number]);
    this.renderArrowMarkers(this.historyArrowsLayer, points, '#ef6c00');
  }

  private renderArrowMarkers(layer: L.LayerGroup, coordinates: [number, number][], color: string): void {
    layer.clearLayers();
    if (!this.map || coordinates.length < 2) return;
    const zoom = this.map.getZoom();
    const step = zoom >= 18 ? 1 : zoom >= 16 ? 2 : zoom >= 14 ? 4 : zoom >= 12 ? 8 : zoom >= 10 ? 16 : 32;
    const arrowIndexes = new Set<number>();

    for (let index = step; index < coordinates.length; index += step) {
      arrowIndexes.add(index);
    }
    // Keep one final direction indicator visible even when the route is sparse.
    arrowIndexes.add(coordinates.length - 1);

    arrowIndexes.forEach((index) => {
      // Select the display points by zoom, but calculate heading from the adjacent
      // GPS point and place the arrow at a true route coordinate.
      const prev = coordinates[Math.max(0, index - 1)];
      const curr = coordinates[index];
      const bearing = turf.bearing(turf.point([prev[1], prev[0]]), turf.point([curr[1], curr[0]]));
      L.marker(curr, {
        interactive: false,
        icon: L.divIcon({
          className: 'route-arrow-marker',
          // The SVG faces north by default, matching Turf's north-based bearing.
          html: `<div style="width:20px;height:20px;transform:rotate(${bearing}deg);transform-origin:center;"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 2L20 20L12 16L4 20Z" fill="${color}" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 6V14" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/></svg></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      }).addTo(layer);
    });
  }

  private plotHistoryAlerts(): void {
    this.historyAlertsLayer.clearLayers();
    this.historyDataList.forEach((item: any) => {
      const alertId = item.param12;
      const alertName = item.param13;
      const lat = Number(item.param7);
      const lng = Number(item.param8);
      if (!alertId || alertId === '0' || alertId === '1' || !alertName || !lat || !lng) return;
      L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'alert-icon-marker',
          html: `<img src="${this.getAlertIconPath(alertName)}" alt="${alertName}" style="display:block;width:36px;height:36px;object-fit:contain;" />`,
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        })
      }).bindPopup(`<div class="alert-popup"><strong>${alertName}</strong><div>Time: ${item.param3 || '-'}</div></div>`).addTo(this.historyAlertsLayer);
    });
  }

  private updateLivePanel(vehicleData: any): void {
    this.vehiclenolive = vehicleData.param13 || 'N/A';
    this.speedlive = vehicleData.param40 || '0';
    this.ignitionlive = vehicleData.param45 === '1' ? 'On' : 'Off';
    this.gpslive = vehicleData.param41 === '1' ? 'Valid' : 'In Valid';
    this.pollingtimelive = vehicleData.param35 || 'N/A';
    this.customerlive = `${vehicleData.param25 || 'N/A'} / ${vehicleData.param26 || 'N/A'}`;
    this.poiData.latitude = Number(vehicleData.param38) || 0;
    this.poiData.longitude = Number(vehicleData.param39) || 0;
    this.deviceserialnolive = vehicleData.param5 || 'N/A';
    this.IMEINolive = vehicleData.param4 || 'N/A';
    this.Vendorlive = vehicleData.param9 || 'N/A';
    this.ICCIDlive = vehicleData.param6 || 'N/A';
    this.cdr.detectChanges();
  }

  private updateHistoryPanel(props: any): void {
    this.poiData = {
      ...props,
      latitude: Number(props.lat),
      longitude: Number(props.lng)
    };
    this.cdr.detectChanges();
  }

  hasValidPlaybackLocation(): boolean {
    const latitude = Number(this.poiData?.latitude);
    const longitude = Number(this.poiData?.longitude);
    return Number.isFinite(latitude) && Number.isFinite(longitude) && (latitude !== 0 || longitude !== 0);
  }

  private createVehicleIcon(properties: any, angle: number): L.DivIcon {
    const vehicleClass = String(properties?.vehicleclassname || '').toLowerCase();
    const speed = Number(properties?.param40 || properties?.param6 || 0);
    const moving = speed > 0;
    let iconUrl = 'assets/mapimages/car/red.png';
    if (vehicleClass.includes('ambulance')) iconUrl = 'assets/mapimages/NewVehiles/ambulance.png';
    else if (vehicleClass.includes('goodscarrier')) iconUrl = 'assets/mapimages/NewVehiles/goodscarrier-.png';
    else if (vehicleClass.includes('motorcab')) iconUrl = 'assets/mapimages/NewVehiles/motorcab.png';
    else if (vehicleClass.includes('police')) iconUrl = 'assets/mapimages/NewVehiles/police.png';
    else if (vehicleClass.includes('privatecar')) iconUrl = 'assets/mapimages/NewVehiles/privatecar.png';
    else if (vehicleClass.includes('schoolbus')) iconUrl = 'assets/mapimages/NewVehiles/schoolbus-.png';
    else if (moving) iconUrl = 'assets/mapimages/car/green.png';
    else iconUrl = 'assets/mapimages/car/yellow.png';

    return L.divIcon({
      className: 'live-vehicle-marker-div',
      html: `<div class="live-vehicle-marker" style="width:36px;height:36px;transform:rotate(${angle}deg);transform-origin:center;"><img src="${iconUrl}" alt="vehicle" style="display:block;width:36px;height:36px;object-fit:contain;"></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18]
    });
  }

  private createLivePopupHtml(vehicleData: any): string {
    const longitude = Number(vehicleData.param39) || 0;
    const latitude = Number(vehicleData.param38) || 0;
    return `
      <div class="vehicle-popup-card">
        <div class="vehicle-popup-card__title">${vehicleData.param13 || 'N/A'}</div>
        <div><strong>Polling:</strong> ${vehicleData.param35 || 'N/A'}</div>
        <div><strong>Speed:</strong> ${vehicleData.param40 || '0'} km/hr</div>
        <div><strong>Ignition:</strong> ${vehicleData.param45 === '1' ? 'On' : 'Off'}</div>
        <div><strong>GPS:</strong> ${vehicleData.param41 === '1' ? 'Valid' : 'In Valid'}</div>
        <div><strong>Location:</strong> ${latitude.toFixed(4)}, ${longitude.toFixed(4)}</div>
      </div>
    `;
  }

  private createEdgeIcon(type: 'start' | 'end'): L.DivIcon {
    const iconUrl = type === 'start' ? 'assets/mapimages/startpointroute.png' : 'assets/mapimages/endpointroute.png';
    return L.divIcon({
      className: `${type}-route-point`,
      html: `<img src="${iconUrl}" alt="${type}" style="display:block;width:24px;height:24px;object-fit:contain;" />`,
      iconSize: [24, 24],
      iconAnchor: [11, 21]
    });
  }

  private getAlertIconPath(alertName: string): string {
    const lower = String(alertName || '').toLowerCase();
    const exact = Object.keys(this.alertIconMappings).find((key) => key !== 'default' && lower.includes(key));
    return this.alertIconMappings[exact as keyof typeof this.alertIconMappings] || this.alertIconMappings.default;
  }

  private loadPoliceStations(): void {
    this.clearPoliceStationMarkers();
    this.alertService.getPoliceStationDetails({ param1: '', param2: 1, param3: 20 }).subscribe({
      next: (response: any) => {
        if (!this.map) return;
        const stations = response?.entity?.listData;
        if (!Array.isArray(stations)) return;
        stations.forEach((station: any) => {
          const lat = Number(station?.param9);
          const lng = Number(station?.param10);
          if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return;
          const marker = L.marker([lat, lng], {
            icon: L.divIcon({
              className: 'police-station-leaflet-icon',
              html: `<span style="display:block;width:24px;height:24px;background:url('assets/mapimages/police-station.png') center/contain no-repeat;"></span>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            })
          }).bindPopup(`<div class="police-popup-card"><strong>${station?.param2 || 'Police Station'}</strong><div>${lat.toFixed(5)}, ${lng.toFixed(5)}</div></div>`);
          marker.addTo(this.map!);
          this.policeStationMarkers.push(marker);
        });
        this.updatePoliceStationMarkers();
      }
    });
  }

  private updatePoliceStationMarkers(): void {
    if (!this.map) return;
    const visible = this.map.getZoom() >= 12;
    this.policeStationMarkers.forEach((marker) => marker.setOpacity(visible ? 1 : 0));
  }

  private clearPoliceStationMarkers(): void {
    this.policeStationMarkers.forEach((marker) => marker.remove());
    this.policeStationMarkers = [];
  }

  private clearHistoryLayers(): void {
    this.stopHistory();
    this.historyRouteLayer.clearLayers();
    this.historyArrowsLayer.clearLayers();
    this.historyAlertsLayer.clearLayers();
    this.historyStartMarker?.remove();
    this.historyEndMarker?.remove();
    this.historyStartMarker = null;
    this.historyEndMarker = null;
  }

  ngOnDestroy(): void {
    this.destroyTracker();
  }
}
