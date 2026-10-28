import { createLeafletBasemap } from '../../shared/components/map-layer-options/map-basemaps';
import { MapLayerOptionsComponent } from '../../shared/components/map-layer-options/map-layer-options.component';
import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet-draw';
import moment from 'moment';
import { VehicleService } from '../../core/services/vehicle.service';
import { Subject, Subscription } from 'rxjs';
import { RouteEntryRequest, RouteService } from '../../core/services/route.service';
import { AlertService } from '../../core/services/alert.service';
import { POIService } from '../../core/services/poi.service';
import { VehicleGroupService } from '../../core/services/vehicle-group.service';
import { ToastService } from '../../core/services/toast.service';
import { Router } from '@angular/router';

// Mock Service Interface (Replace with your actual VehicleService import)
declare var $: any;
import { POIEntryRequest, POIUpdateRequest } from '../../core/services/poi.service';
import { interval } from 'rxjs';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import localeData from 'dayjs/plugin/localeData';
import isoWeek from 'dayjs/plugin/isoWeek';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { ToastComponent } from '../assets/inactive-assets/toast.component';
import * as turf from '@turf/turf';
import { LeafletMapComponent } from '../../shared/components/leaflet-map/leaflet-map.component';

dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.extend(localizedFormat);
dayjs.extend(localeData);
dayjs.extend(isoWeek);
dayjs.extend(weekOfYear);

declare var $: any;

@Component({
    selector: 'app-plain-map-tracking',
    imports: [MapLayerOptionsComponent, CommonModule, FormsModule, ToastComponent, NgxDaterangepickerMd, NgSelectModule, TimepickerModule, LeafletMapComponent],
    templateUrl: './plain-map-tracking.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './plain-map-tracking.component.scss'
})
export class PlainMapTrackingComponent implements OnInit, AfterViewInit, OnDestroy {
  private mapResizeObserver?: ResizeObserver;
  private mapHostElement: HTMLElement | null = null;
  readonly trackingOptions = [
    { id: 'vehicle', name: 'By Vehicle' },
    { id: 'imeino', name: 'By IMEI NO.' }
  ];

  private readonly indiaMapCenter: L.LatLngExpression = [22.5937, 78.9629];
  private readonly indiaMapZoom = 5;

  // Map & Layers
  map!: L.Map;
  vehicleLayer!: L.LayerGroup;
  liveRouteLayer!: L.LayerGroup;
  liveArrowsLayer!: L.LayerGroup;
  liveAlertsLayer!: L.LayerGroup;
  historyRouteLayer!: L.LayerGroup;
  historyArrowsLayer!: L.LayerGroup;
  historyAlertsLayer!: L.LayerGroup;
  startMarker: L.Marker | null = null;
  endMarker: L.Marker | null = null;
  liveMarker: L.Marker | null = null;
  private liveAlertKeys = new Set<string>();
  historyMarker: L.Marker | null = null;

  // Tile Layers
  currentTileLayer: L.TileLayer | null = null;
  streetTileLayer!: L.TileLayer;
  satelliteTileLayer!: L.TileLayer;
  osmTileLayer!: L.TileLayer;
  googleStreetTileLayer!: L.TileLayer;
  googleHybridTileLayer!: L.TileLayer;
  tomtomTileLayer!: L.TileLayer.WMS;
  private tomTomFallbackApplied = false;

  wmsLayer: L.TileLayer.WMS | null = null;
  autocompleteVehicleList: any[] = [];
  autocompleteImeiList: any[] = [];
  selectedVehicleFromSearch: any;
  isVehicleSearchLoading = false;
  vehicleSearchInput = new Subject<string>();
  imeiSearchInput = new Subject<string>();
  selectedImeiFromSearch: any;

  // UI State
  panelOpen = false;
  isFilterPanelOpen = false;
  isHeaderCollapsed = false;
  activeTab: 'live' | 'history' = 'live';
  isLoadingLiveTrack = false;

  isLayerSwitcherOpen = false;
  activeMapStyle: string = 'tomtom';
  viewType: string = 'NEW-activated'; // Initialize viewType to 'NEW'

  // Toggle methods for panels - ensures only one panel is open at a time
  toggleFilterPanel() {
    if (this.isFilterPanelOpen) {
      this.isFilterPanelOpen = false;
    } else {
      this.isFilterPanelOpen = true;
      this.isLayerSwitcherOpen = false;
    }
  }

  switchTab(tab: 'live' | 'history') {
    this.activeTab = tab;
    if (tab === 'live') {
      // Stop history playback if running
      this.stopHistory();

      // Clear all history data completely
      this.clearHistoryOnMap();
      this.historyPathCoordinates = [];
      this.historyDataList = [];

      // If vehicle is selected, start fresh live tracking (this will clear live data too)
      if (this.selectedVehicleFromSearch) {
        this.showLiveTrack(this.selectedVehicleFromSearch);
      }
    } else {
      // History tab selection should not clear the current live track.
      // Live route/layers are cleared only when the user explicitly plots history.
      this.stopHistory();
      this.clearHistoryOnMap();
    }
    this.cdr.detectChanges();
  }

  toggleLayerPanel() {
    if (this.isLayerSwitcherOpen) {
      this.isLayerSwitcherOpen = false;
    } else {
      this.isLayerSwitcherOpen = true;
      this.isFilterPanelOpen = false;
    }
  }

  onTrackingOptionChange(option: any) {
    const selectedOption = typeof option === 'string' ? option : option?.id || '';
    this.trackingOption = selectedOption;
    this.isFilterPanelOpen = selectedOption === 'vehicle' || selectedOption === 'imeino';
    this.isLayerSwitcherOpen = false;

    if (selectedOption === 'vehicle') {
      this.selectedImeiFromSearch = null;
      this.autocompleteImeiList = [];
    }

    if (selectedOption === 'imeino') {
      this.selectedVehicleFromSearch = null;
      this.autocompleteVehicleList = [];
    }

    this.cdr.detectChanges();
  }

  // Data Sources
  vehiclesData: any[] = [];
  vehiclesGroupData: any[] = [];
  poiDetails: any[] = [];
  routeDetails: any[] = [];
  alertData: any[] = [];
  groupList: any[] = [];
  alertTypeList: any[] = [];
  routeList: any[] = [];
  poiList: any[] = [];

  // Pagination
  pageNo = 1;
  itemsPerPage = 10;
  totalCount = 0;
  firstRowCount = 0;
  lastRowCount = 0;
  lastPageNo = 0;

  // Filters & Inputs
  trackingOption: string = 'vehicle';
  searchVehicleText: string = '';
  searchAlertText: string = '';
  searchRouteText: string = '';
  searchPoiText: string = '';
  selectedGroupId: string = '';
  selectedAlertId: string = '';
  alertDate: any;

  // Live & History
  liveVehicleId: string = '';
  liveData: any;
  historyData: any;
  isLiveTracking = false;
  private animationFrameId: number | null = null;
  livePathCoordinates: [number, number][] = [];
  livePathDataPoints: any[] = []; // Store data points with speed info
  historyStartMarker: L.Marker | null = null;
  historyEndMarker: L.Marker | null = null;
  historyPathCoordinates: [number, number][] = [];
  playbackSpeed = 1;
  historyProgress = 0; // 0 to 1

  // POI & Route Editing
  poiId: string = '';
  latitude: number = 0;
  longitude: number = 0;
  routeCoordinates: any;
  vehicleClassFilter: string = '';
  rtoList: any[] = [];
  vehicleClassList: any[] = [];
  vendorList: any[] = [];
  rtoFilter: any;
  vendorFilter: any;

  // Intervals & Subscriptions
  private gridInterval: any;
  private liveInterval: any;
  private clusterInterval: any;
  private subscriptions: Subscription[] = [];
  private trackLiveHandler: any;
  private isLiveUpdatePending = false;
  private readonly clusterRefreshDelayMs = 30000;
  private clusterRequestId = 0;
  private isClusterRefreshEnabled = false;

  // UI State
  isLayersVisible = false;
  isSidePanelOpen = false;
  isLegendCollapsed = false;
  isTopToolbarCollapsed = false;
  isPanelCollapsed = false;

  // History Playback State
  historyDataList: any[] = [];
  historyPlaybackIndex: number = 0;
  isHistoryPlaying: boolean = false;
  isSavingHistoryRoute: boolean = false;
  historyTimer: any = null;
  speedSliderValue: number = 5;

  stateCount = 0;
  outstateCount = 0;
  poiData: any = {};
  errorMessage: string | null = null;

  // Stats
  counts = { total: 0, moving: 0, parked: 0, offline: 0 };
  errorType: 'error' | 'success' = 'error';
  historyDate: any; fromTime: any; toTime: any;

  // Store original data for refresh
  private vehiclesSourceData: any = null;
  drawnItems!: L.FeatureGroup;
  routeName: string = '';

  get isHistoryRouteReady(): boolean {
    return this.historyPathCoordinates.length >= 2;
  }

  get isRouteNameValid(): boolean {
    const routeName = this.routeName.trim();
    return routeName.length >= 3 && routeName.length <= 50 && /^[A-Za-z0-9 _-]+$/.test(routeName);
  }

  showPoliceStations = true;
  private policeStationMarkers: L.Marker[] = [];
  private readonly policeStationMinZoom = 8;
  private readonly policeStationBaseSize = 18;
  private readonly policeStationMaxSize = 52;
  private readonly policeStationPaneName = 'policeStationPane';

  constructor(
    private vehicleService: VehicleService,
    private routeService: RouteService,
    private alertService: AlertService,
    private poiService: POIService,
    private vehicleGroupService: VehicleGroupService,
    private toast: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.toast.pageName = 'Map Tracking New'; // Set page name for toast service
  }

  ngOnInit(): void {

    console.log('L', L);
    this.autocompleteVehicleList = [];
    this.vehicleSearchInput.subscribe(searchText => this.onVehicleSearch(searchText));
    this.imeiSearchInput.subscribe(searchText => this.onImeiSearch(searchText));

    // Initialize Datepicker to Current Date
    this.historyDate = moment();

    this.fromTime = new Date();
    this.fromTime.setHours(0, 0, 0, 0);

    this.toTime = new Date();
    this.toTime.setHours(23, 59, 0, 0);

    this.loadVehicleClassRoster();
    this.loadVendorList();

  }

  ngAfterViewInit() {
    // We use a setTimeout to ensure the map container element has been rendered
    // and sized by the browser before Leaflet tries to initialize.
    requestAnimationFrame(() => setTimeout(() => this.initializeMap(), 100));
  }

  onMapReady(mapElement: HTMLElement): void {
    this.mapHostElement = mapElement;
    this.mapResizeObserver?.disconnect();
    this.mapResizeObserver = new ResizeObserver(() => this.map?.invalidateSize({ pan: false }));
    this.mapResizeObserver.observe(mapElement);
    this.initializeMap();
  }

  ngOnDestroy() {
    this.mapResizeObserver?.disconnect();
    if (this.gridInterval) clearInterval(this.gridInterval);
    if (this.liveInterval) clearInterval(this.liveInterval);
    this.isClusterRefreshEnabled = false;
    if (this.clusterInterval) clearTimeout(this.clusterInterval);

    this.subscriptions.forEach(s => s.unsubscribe());

    if (this.trackLiveHandler) {
      document.removeEventListener('vts-track-live', this.trackLiveHandler);
    }

    if (this.map) {
      this.map.remove();
    }
  }

  initializeMap() {
    if (!this.mapHostElement || this.map) {
      return;
    }

    // Check if container has proper size
    const rect = this.mapHostElement.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0) {
      setTimeout(() => this.initializeMap(), 100);
      return;
    }

    // Fix for Leaflet default marker icons in webpack/Angular
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'assets/marker-icon-2x.png',
      iconUrl: 'assets/marker-icon.png',
      shadowUrl: 'assets/marker-shadow.png',
    });

    // Initialize map with OpenStreetMap tiles
    this.map = L.map(this.mapHostElement, {
      center: this.indiaMapCenter,
      zoom: this.indiaMapZoom,
      minZoom: 3,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true // Performance 
    });

    // Keep zoom controls on the left, before the compact top toolbar.
    L.control.zoom({
      position: 'topleft'
    }).addTo(this.map);

    // Define tile layers
    this.streetTileLayer = createLeafletBasemap('streets-v11');

    this.satelliteTileLayer = createLeafletBasemap('satellite-v9');

    this.osmTileLayer = createLeafletBasemap('streets-v11');

    this.googleStreetTileLayer = createLeafletBasemap('googlestreet');

    this.googleHybridTileLayer = createLeafletBasemap('googlehybrid');

    this.tomtomTileLayer = createLeafletBasemap('tomtom');

    this.tomtomTileLayer.on('tileerror', () => {
      if (this.tomTomFallbackApplied || this.currentTileLayer !== this.tomtomTileLayer) {
        return;
      }

      this.tomTomFallbackApplied = true;
      this.map.removeLayer(this.tomtomTileLayer);
      this.currentTileLayer = this.streetTileLayer;
      this.activeMapStyle = 'streets-v11';
      this.currentTileLayer.addTo(this.map);
      this.cdr.detectChanges();
    });

    // TomTom WMS remains the visible default base map.
    this.currentTileLayer = this.tomtomTileLayer;
    this.currentTileLayer.addTo(this.map);

    // Keep clustered vehicles in their own pane, always above every base/WMS tile.
    if (!this.map.getPane('vehicleClusterPane')) {
      const clusterPane = this.map.createPane('vehicleClusterPane');
      clusterPane.style.zIndex = '650';
      clusterPane.style.pointerEvents = 'auto';
    }

    if (!this.map.getPane(this.policeStationPaneName)) {
      const policePane = this.map.createPane(this.policeStationPaneName);
      policePane.style.zIndex = '660';
      policePane.style.pointerEvents = 'auto';
    }

    // Add WMS Layer (India State) as overlay after base tiles are added
    this.addWMSLayer();

    // Create layer groups - IMPORTANT: Add all layers to map for proper rendering
    this.vehicleLayer = L.geoJSON().addTo(this.map);
    this.liveRouteLayer = L.layerGroup().addTo(this.map);
    this.liveArrowsLayer = L.layerGroup().addTo(this.map);
    this.liveAlertsLayer = L.layerGroup().addTo(this.map);
    this.historyRouteLayer = L.layerGroup().addTo(this.map);
    this.historyArrowsLayer = L.layerGroup().addTo(this.map);
    this.historyAlertsLayer = L.layerGroup().addTo(this.map);

    // Handle map load event to ensure tiles are loaded
    this.map.whenReady(() => {
      // Add zoom listener to update arrow density dynamically
      this.map.on('zoomend', () => {
        if (this.isLiveTracking) this.renderLiveArrows();
        if (this.historyDataList.length > 0) this.renderHistoryArrows();
        this.updatePoliceStationMarkers();
      });

      // Ensure map tiles are properly aligned
      this.map.invalidateSize();

    });

    // Load images and initial data
    this.loadImagesAndInitialData();
    // Leaflet's initial load can fire during setView(), so load these directly.
    this.loadPoliceStations();
  }

  private loadPoliceStations(): void {
    this.clearPoliceStationMarkers();
    if (!this.showPoliceStations) return;

    this.alertService.getPoliceStationDetails({ param1: '', param2: 1, param3: 20 }).subscribe({
      next: (response: any) => {
        const stations = response?.entity?.listData;
        const mapView = this.map;
        if (!mapView || !this.showPoliceStations || !Array.isArray(stations)) return;

        stations.forEach((station: any) => {
          const lat = Number(station?.param9); const lng = Number(station?.param10);
          if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return;
          const marker = L.marker([lat, lng], {
            icon: this.createPoliceStationLeafletIcon(mapView.getZoom()),
            pane: this.policeStationPaneName
          })
            .bindPopup(this.createPoliceStationPopup(station, lat, lng), {
              className: 'police-station-popup',
              maxWidth: 235
            })
            .addTo(mapView);
          this.policeStationMarkers.push(marker);
        });

        this.updatePoliceStationMarkers();
        mapView.off('zoomend', this.updatePoliceStationMarkers);
        mapView.on('zoomend', this.updatePoliceStationMarkers);
      },
      error: () => { /* Alert map remains usable if police station API fails. */ }
    });
  }

  private createPoliceStationPopup(station: any, lat: number, lng: number): HTMLElement {
    const root = document.createElement('div'); root.className = 'police-popup-card';
    const header = document.createElement('div'); header.className = 'police-popup-card__header';
    const image = document.createElement('img'); image.src = 'assets/mapimages/police-station.png'; image.alt = 'Police station';
    const heading = document.createElement('div'); const title = document.createElement('strong'); const type = document.createElement('small');
    title.textContent = String(station?.param2 || 'Police Station'); type.textContent = String(station?.param3 || 'Police Station');
    heading.append(title, type); header.append(image, heading); root.append(header);
    const body = document.createElement('div'); body.className = 'police-popup-card__body';
    [['District', station?.param7 || '-'], ['State', station?.param8 || '-'], ['Location', `${lat.toFixed(5)}, ${lng.toFixed(5)}`]].forEach(([label, value]) => {
      const row = document.createElement('div'), key = document.createElement('span'), val = document.createElement('b'); key.textContent = String(label); val.textContent = String(value); row.append(key, val); body.append(row);
    });
    const link = document.createElement('a'); link.target = '_blank'; link.rel = 'noopener noreferrer';
    const stationName = String(station?.param2 || 'Police Station');
    const googleMapsQuery = `${stationName} Police Station, ${lat},${lng}`;
    link.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(googleMapsQuery)}`;
    link.title = `Show ${stationName} on Google Maps`;
    link.textContent = 'Locate Police Station'; body.append(link); root.append(body); return root;
  }

  private clearPoliceStationMarkers(): void {
    this.map?.off('zoomend', this.updatePoliceStationMarkers);
    this.policeStationMarkers.forEach(marker => marker.remove());
    this.policeStationMarkers = [];
  }

  togglePoliceStations(): void {
    if (this.showPoliceStations) {
      this.loadPoliceStations();
    } else {
      this.clearPoliceStationMarkers();
    }
  }

  private readonly updatePoliceStationMarkers = (): void => {
    if (!this.map) return;

    const zoom = this.map.getZoom();
    const isVisible = zoom >= this.policeStationMinZoom;

    this.policeStationMarkers.forEach(marker => {
      marker.setIcon(this.createPoliceStationLeafletIcon(zoom));
      marker.setOpacity(isVisible ? 1 : 0);
    });
  };

  private createPoliceStationLeafletIcon(zoom: number): L.DivIcon {
    const size = this.getPoliceStationIconSize(zoom);
    return L.divIcon({
      className: 'police-station-leaflet-icon',
      html: `<span style="display:block;width:${size}px;height:${size}px;background:url('assets/mapimages/police-station.png') center/contain no-repeat;"></span>`,
      iconSize: [size, size],
      iconAnchor: [Math.round(size / 2), Math.round(size / 2)],
      popupAnchor: [0, -Math.round(size / 2)]
    });
  }

  private getPoliceStationIconSize(zoom: number): number {
    const normalizedZoom = Math.max(this.policeStationMinZoom, Math.min(zoom, 18));
    const size = this.policeStationBaseSize + ((normalizedZoom - this.policeStationMinZoom) * 5);
    return Math.max(this.policeStationBaseSize, Math.min(size, this.policeStationMaxSize));
  }

  private addWMSLayer() {
    // Added WMS layer logic for India State boundaries using Leaflet's WMS tile layer
    L.tileLayer.wms('https://vlts.wb.gov.in/geoserver/wbsdcmap/wms?', {
      layers: 'wbsdcmap:india_state',
      format: 'image/png',
      transparent: true,
      version: '1.1.0', // Updated to match your URL
      attribution: 'Powered by DIMTS',
      opacity: 0.35,
      zIndex: 500 // Higher z-index to stay above base maps
    }).addTo(this.map);
  }

  loadImagesAndInitialData() {
    // Preload vehicle type images
    const vehicleTypeImages: { name: string, url: string }[] = [
      { name: 'ambulance', url: 'assets/mapimages/NewVehiles/ambulance.png' },
      { name: 'goodscarrier', url: 'assets/mapimages/NewVehiles/goodscarrier-.png' },
      { name: 'motorcab', url: 'assets/mapimages/NewVehiles/motorcab.png' },
      { name: 'police', url: 'assets/mapimages/NewVehiles/police.png' },
      { name: 'privatecar', url: 'assets/mapimages/NewVehiles/privatecar.png' },
      { name: 'schoolbus', url: 'assets/mapimages/NewVehiles/schoolbus-.png' },
      { name: 'redcar', url: 'assets/mapimages/car/red.png' },
      { name: 'greencar', url: 'assets/mapimages/car/green.png' },
      { name: 'yellowcar', url: 'assets/mapimages/car/yellow.png' },
    ];

    // Load vehicle images
    vehicleTypeImages.forEach(imgInfo => {
      const img = new Image();
      img.src = imgInfo.url;
      img.onload = () => { };
      img.onerror = () => {
        console.warn(`Failed to load image: ${imgInfo.name}`);
      };
    });

    // Generate canvas-based fallback colored icons
    this.generateColoredVehicleIcons();

  }

  /**
   * Generates programmatic colored circle icons as fallback for vehicle types
   */
  private generateColoredVehicleIcons() {
    // Icons are generated dynamically in the showAllClusters method
    // using canvas-based markers
  }

  private getVehicleIcon(properties: any): string {
    const vehicleClass = (properties.vehicleclassname || '').toLowerCase();
    const speed = Number(properties.vehiclespeed || 0);
    let ignitionOn = properties.ignitionstatus === '1' || (properties.ignitionstatus || '').toLowerCase() === 'on' || properties.ignitionstatus === 'On';

    // Data Correction: If a vehicle is moving, its ignition must be on.
    if (speed > 0) {
      ignitionOn = true;
    }

    // Map vehicle class names to icon types
    if (vehicleClass.includes('ambulance')) return 'ambulance';
    if (vehicleClass.includes('goodscarrier')) return 'goodscarrier';
    if (vehicleClass.includes('motorcab')) return 'motorcab';
    if (vehicleClass.includes('police')) return 'police';
    if (vehicleClass.includes('privatecar')) return 'privatecar';
    if (vehicleClass.includes('schoolbus')) return 'schoolbus';

    // Default: use color-coded generic car icon
    if (ignitionOn) {
      return speed > 0 ? 'greencar' : 'yellowcar';
    }
    return 'redcar';
  }

  private getVehicleIconUrl(properties: any): string {
    // Normalize properties from different data sources (live, history)
    const vehicleClass = (properties.vehicleclassname || this.liveData?.vehicleclassname || '').toLowerCase();
    const speed = Number(properties.param40 || properties.param8 || properties.speed || properties.vehiclespeed || 0);

    let ignitionOn =
      properties.param45 === '1' ||
      properties.param12 === '1' ||
      properties.ignitionstatus === '1' ||
      (properties.ignitionstatus || '').toLowerCase() === 'on';

    // Data Correction: If a vehicle is moving, its ignition must be on.
    if (speed > 0) {
      ignitionOn = true;
    }

    // Map vehicle class names to actual file paths
    if (vehicleClass.includes('ambulance')) return 'assets/mapimages/NewVehiles/ambulance.png';
    if (vehicleClass.includes('goodscarrier')) return 'assets/mapimages/NewVehiles/goodscarrier-.png';
    if (vehicleClass.includes('motorcab')) return 'assets/mapimages/NewVehiles/motorcab.png';
    if (vehicleClass.includes('police')) return 'assets/mapimages/NewVehiles/police.png';
    if (vehicleClass.includes('privatecar')) return 'assets/mapimages/NewVehiles/privatecar.png';
    if (vehicleClass.includes('schoolbus')) return 'assets/mapimages/NewVehiles/schoolbus-.png';

    // Default: use color-coded generic car icon
    if (ignitionOn) {
      return speed > 0 ? 'assets/mapimages/car/green.png' : 'assets/mapimages/car/yellow.png';
    }
    return 'assets/mapimages/car/red.png';
  }

  loadRTORoster() {
    this.vehicleService.getRTORosterNew(this.vendorFilter, this.rtoFilter).subscribe({
      next: (response) => {
        if (response?.status && response?.entity) {
          this.rtoList = Array.isArray(response.entity) ? response.entity : [];
        }
      },
      error: (error) => { }
    });
  }

  loadVendorList() {
    this.vehicleService.getVendorListNew().subscribe({
      next: (response) => {
        if (response?.status && response?.entity) {
          this.vendorList = Array.isArray(response.entity) ? response.entity : [];
        }
      },
      error: (error) => {
        console.error('Error loading vendor list:', error);
      }
    });
  }

  loadVehicleClassRoster() {
    this.vehicleService.getVehicleClassRoster().subscribe({
      next: (response) => {
        if (response?.status && response?.entity) {
          this.vehicleClassList = Array.isArray(response.entity) ? response.entity : [];
        }
      },
      error: (error) => { }
    });
  }

  onRTOFilterChange(event: any) {
    this.rtoFilter = event.param1 || '';
  }

  onVendorFilterChange(event: any) {
    this.vendorFilter = event.param1 || '';
    this.loadRTORoster();
  }

  onVehicleClassFilterChange(event: any) {
    this.vehicleClassFilter = event.param1 || '';
  }

  showVehiclePopup(props: any, latlng: L.LatLng) {
    const vehicleNo = props.vehicleregno || 'N/A';
    const speed = props.vehiclespeed || 0;
    const ignition = (props.ignitionstatus === '1' || props.ignitionstatus === 'On') ? 'On' : 'Off';
    const ignColor = ignition === 'On' ? '#00dc32' : '#dc3545';
    const ignBg = ignition === 'On' ? 'rgba(40,167,69,0.1)' : 'rgba(220,53,69,0.1)';
    const speedVal = Number(speed || 0);
    const speedColor = speedVal > 50 ? '#fd011aff' : speedVal > 30 ? '#fd7302ff' : '#00dc32';
    const lat = Number(props.latitude).toFixed(5);
    const lng = Number(props.longitude).toFixed(5);
    const vehicleClass = props.vehicleclassname || '';

    const statusClass = speedVal > 0 ? 'moving' : 'parked';
    const statusText = speedVal > 0 ? 'Moving' : 'Parked';
    const statusDot = speedVal > 0 ? '#00dc32' : '#f59e0b';

    const popupHtml = `
      <div class="vts-popup-pro">
        <div class="vts-popup-pro__header">
          <div class="vts-popup-pro__title-row">
            <div class="vts-popup-pro__icon-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            </div>
            <div class="vts-popup-pro__title-text">
              <span class="vts-popup-pro__vehicle-no">${vehicleNo}</span>
              ${vehicleClass ? '<span class="vts-popup-pro__vehicle-class">' + vehicleClass + '</span>' : ''}
            </div>
          </div>
          <div class="vts-popup-pro__speed-chip" style="background:${speedColor}; margin-right:25px;">
            <span class="vts-popup-pro__speed-val">${speed}</span>
            <span class="vts-popup-pro__speed-unit">km/h</span>
          </div>
        </div>
        <div class="vts-popup-pro__body">
          <div class="vts-popup-pro__info-grid">
            <div class="vts-popup-pro__info-cell">
              <div class="vts-popup-pro__info-icon"><i class="fa fa-bolt" style="color:${ignColor}"></i></div>
              <div class="vts-popup-pro__info-content">
                <span class="vts-popup-pro__info-label">Ignition</span>
                <span class="vts-popup-pro__info-value vts-popup-pro__ign-badge" style="color:${ignColor};background:${ignBg}">${ignition}</span>
              </div>
            </div>
            <div class="vts-popup-pro__info-cell">
              <div class="vts-popup-pro__info-icon"><i class="fa fa-cog" aria-hidden="true"></i></div>
              <div class="vts-popup-pro__info-content">
                <span class="vts-popup-pro__info-label">Status</span>
                <span class="vts-popup-pro__info-value"><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${statusDot};margin-right:4px;"></span>${statusText}</span>
              </div>
            </div>
          </div>
          <div class="vts-popup-pro__coord-row">
            <i class="fa fa-map-signs" aria-hidden="true"></i>
            <span class="vts-popup-pro__coord-text">${lat}, ${lng}</span>
          </div>
          <button class="vts-popup-pro__track-btn" onclick="document.dispatchEvent(new CustomEvent('vts-track-live', {detail:'${vehicleNo}'}))">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff" stroke="none"><polygon points="5,3 19,12 5,21"/></svg>
            Track Live
          </button>
        </div>
      </div>`;

    L.popup({ className: 'vts-pro-popup', maxWidth: 290, offset: [0, -20] })
      .setLatLng(latlng)
      .setContent(popupHtml)
      .openOn(this.map);

    // Listen for "Track Live" button click from popup
    this.trackLiveHandler = ((e: CustomEvent) => {
      const vehicleNo = e.detail;
      if (!vehicleNo) return;
      const vehicleToTrack = {
        param2: vehicleNo,
        vehicleno: vehicleNo
      };
      this.onVehicleSelected(vehicleToTrack);
    }) as EventListener;
    document.addEventListener('vts-track-live', this.trackLiveHandler);
  }

  showPopup(data: any, coordinates: any) {
    this.poiData = data;
    this.poiData.historyDate = dayjs();
    this.poiData.fromTime = dayjs().startOf('day').toDate();
    this.poiData.toTime = dayjs().endOf('day').toDate();
    this.isPanelCollapsed = false;
    this.cdr.detectChanges();
  }

  // --- Search & Selection ---
  onVehicleSearch(term: string) {
    const searchTerm = (term || '').trim();
    const lastFourDigits = searchTerm.replace(/\D/g, '').slice(-4);

    if (lastFourDigits.length < 4) {
      this.autocompleteVehicleList = [];
      this.isVehicleSearchLoading = false;
      return;
    }

    this.isVehicleSearchLoading = true;
    const data = {
      "selectvendorid": this.vendorFilter || "",
      "selectroleid": "",
      "routeid": "",
      "poiid": "",
      "selectcustomerid": "",
      "vehicleclassid": this.vehicleClassFilter || "",
      "rtoid": this.rtoFilter || "",
      "searchby": lastFourDigits,
      "searchtype": "activated"
    };

    this.vehicleService.getAutoSearchVehicle(data).subscribe({
      next: (res: any) => {
        const entity = res?.entity;
        this.autocompleteVehicleList = Array.isArray(entity)
          ? entity
          : Array.isArray(entity?.listData)
            ? entity.listData
            : [];
        this.isVehicleSearchLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.autocompleteVehicleList = [];
        this.isVehicleSearchLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onImeiSearch(term: string) {
    const searchTerm = (term || '').trim();
    const lastDigits = searchTerm.replace(/\D/g, '').slice(-5);

    if (lastDigits.length < 4) {
      this.autocompleteImeiList = [];
      this.isVehicleSearchLoading = false;
      return;
    }

    this.isVehicleSearchLoading = true;
    const data = {
      subrtoid: this.rtoFilter || "",
      searchby: lastDigits,
      "companyid": "",
    };

    this.vehicleService.getDeviceList(data).subscribe({
      next: (res: any) => {
        const entity = res?.entity;
        this.autocompleteImeiList = Array.isArray(entity) ? entity : [];
        this.isVehicleSearchLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.autocompleteImeiList = [];
        this.isVehicleSearchLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onVehicleSelected(vehicle: any) {
    if (!vehicle) {
      this.selectedVehicleFromSearch = null;
      this.selectedImeiFromSearch = null;
      this.autocompleteVehicleList = [];
      this.autocompleteImeiList = [];
      return;
    }

    this.selectedVehicleFromSearch = vehicle;
    if (this.trackingOption === 'vehicle') {
      this.selectedImeiFromSearch = null;
    } else if (this.trackingOption === 'imeino') {
      this.selectedImeiFromSearch = vehicle;
    }
    this.panelOpen = false;
    this.activeTab = 'live';
    this.showLiveTrack(vehicle);
  }

  onImeiSelected(device: any) {
    if (!device) {
      this.selectedImeiFromSearch = null;
      this.autocompleteImeiList = [];
      return;
    }

    this.selectedImeiFromSearch = device;
    this.panelOpen = false;
    this.activeTab = 'live';
    this.showLiveTrack({
      ...device,
      imei: device.param2,
      vehicleno: device.param2
    });
  }

  // --- Live Tracking ---
  showLiveTrack(vehicleData: any) {

    // Prevents multiple simultaneous API calls while a request is already in progress
    if (this.isLoadingLiveTrack) {
      return;
    }

    if (this.map) {
      this.map.closePopup();
    }

    this.stopHistory();
    this.clearHistoryOnMap();
    this.stopLiveTracking();
    this.liveData = { ...vehicleData };
    this.panelOpen = false;

    this.liveVehicleId = vehicleData.param2 || vehicleData.vehicleno;
    if (!this.liveVehicleId) {
      this.errorMessage = "Could not start tracking: Vehicle ID is missing.";
      this.cdr.detectChanges();
      return;
    }

    this.isLoadingLiveTrack = true;
    this.isLiveTracking = true;
    this.livePathCoordinates = [];
    this.livePathDataPoints = [];

    this.vehicleService.getLiveTrack(this.liveVehicleId, false).subscribe({
      next: (res: any) => {
        this.isLoadingLiveTrack = false;
        if (res.entity == "No Data Found") {
          this.errorMessage = res.entity;
          this.isLiveTracking = false;
          this.panelOpen = false;
          this.selectedVehicleFromSearch = null;
          this.cdr.detectChanges();
          return;
        }
        const data = Array.isArray(res.entity) ? res.entity[0] : res.entity;
        

        // Clear vehicle cluster markers - properly remove and recreate layer
        if (this.vehicleLayer) {
          try {
            this.map.removeLayer(this.vehicleLayer);
          } catch (e) {
            // Layer might not be on map, that's OK
          }
          this.vehicleLayer = L.geoJSON().addTo(this.map);
        }

        this.updatePanelData(data);
        this.panelOpen = true;

        const lat = Number(data.param38 || data.lat);
        const lng = Number(data.param39 || data.lng);

        if (isNaN(lng) || isNaN(lat) || (lng === 0 && lat === 0)) {
          this.errorMessage = "Vehicle has invalid coordinates, cannot start tracking.";
          this.isLiveTracking = false;
          this.cdr.detectChanges();

          return;
        }

        const startCoord: [number, number] = [lat, lng];
        this.livePathCoordinates.push(startCoord);

        // Center map
        this.map.setView(startCoord, 16);
        setTimeout(() => {
          this.map.invalidateSize();
          this.followLiveVehicle(startCoord, true);
        });

        // Setup layers
        this.setupLiveLayers();

        // Create marker
        this.createLiveMarker(startCoord, data);
        this.plotLiveAlert(data);

        // Initialize tracking history with the first point
        this.livePathDataPoints.push({
          ...data, // API all parameters (param13, param38, etc.) include 
          coordinate: startCoord,
          speed: Number(data.param40 || data.speed || 0),
          time: data.param35 || data.pollingdate,
          ignition: data.param45 === '1' ? 'On' : 'Off',
          heading: Number(data.param43 || 0)
        });

        // Start polling
        this.liveInterval = setInterval(() => {
          this.fetchLiveUpdate();
        }, 5000);
      },
      error: (err) => {
        this.isLoadingLiveTrack = false;
        this.errorMessage = "Failed to fetch initial vehicle location.";
        this.isLiveTracking = false;
        this.panelOpen = false;
        this.selectedVehicleFromSearch = null;
        this.cdr.detectChanges();
      }
    });
  }

  setupLiveLayers() {
    // Clear existing layers
    this.liveRouteLayer.clearLayers();
    this.liveArrowsLayer.clearLayers();
    this.liveAlertsLayer.clearLayers();
    this.liveAlertKeys.clear();

    // Add to map
    this.liveRouteLayer.addTo(this.map);
    this.liveArrowsLayer.addTo(this.map);

    // Ensure arrow images
    this.addArrowImage();
  }

  createLiveMarker(coord: [number, number], data: any) {
    if (this.liveMarker) {
      this.map.removeLayer(this.liveMarker);
    }

    const iconUrl = this.getVehicleIconUrl(data);
    const speed = Number(data.param40 || data.speed || 0);
    const ignitionOn = data.param45 === '1' || (data.ignitionstatus === '1' || data.ignitionstatus === 'On');

    // Determine color based on speed/ignition status
    let markerColor = '#dc3545'; // Red - offline
    if (ignitionOn) {
      markerColor = speed > 0 ? '#28a745' : '#ffc107'; // Green - moving, Yellow - parked
    }

    const customIcon = L.divIcon({
      className: 'live-vehicle-marker-div-custom',
      html: `<div class="live-vehicle-marker-wrapper" style="transform: rotate(${data.param43 || 0}deg); width: 20px; height: 28px;">
        <div class="live-vehicle-marker-container" style="position: relative; width: 20px; height: 28px;">
        <img 
          src="${iconUrl}" 
          alt="vehicle" 
          style="
            width: 100%;
            height: 100%;
            object-fit: contain;
            filter: drop-shadow(0 0 2px rgba(0,0,0,0.5));
          "
          onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
        />
        <div 
          class="live-vehicle-marker-fallback" 
          style="
            display: none;
            width: 100%;
            height: 100%;
            background-color: ${markerColor};
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 0 4px rgba(0,0,0,0.4);
          "
        ></div>
        </div>
      </div>`,
      iconSize: L.point(20, 28),
      iconAnchor: L.point(10, 14),
      popupAnchor: L.point(0, -14)
    });

    this.liveMarker = L.marker(coord as any, { icon: customIcon, zIndexOffset: 1000 }).addTo(this.map);

    // Add popup
    const popup = this.createPopupInstance(data);
    this.liveMarker.bindPopup(popup);
  }

  fetchLiveUpdate() {
    if (!this.liveVehicleId) return;
    if (this.isLiveUpdatePending) return;

    this.isLiveUpdatePending = true;
    this.vehicleService.getLiveTrack(this.liveVehicleId, false).subscribe({
      next: (res: any) => {
        this.isLiveUpdatePending = false;
        const data = Array.isArray(res.entity) ? res.entity[0] : res.entity;
        if (data) {
          this.processLiveUpdate(data);
        }
      },
      error: (err) => {
        this.isLiveUpdatePending = false;
        console.error(err);
      }
    });
  }

  processLiveUpdate(data: any) {
    const newLat = Number(data.param38);
    const newLng = Number(data.param39);

    if (isNaN(newLng) || isNaN(newLat)) return;

    this.updatePanelData(data);

    if (!this.liveMarker) return;

    // Update marker icon
    const iconUrl = this.getVehicleIconUrl(data);
    const markerEl = (this.liveMarker as any)._icon;
    if (markerEl) {
      markerEl.style.backgroundImage = `url(${iconUrl})`;
    }

    const startCoord = this.liveMarker.getLatLng();
    const startCoordArr: [number, number] = [startCoord.lat, startCoord.lng];
    const endCoord: [number, number] = [newLat, newLng];

    // Check if moved
    if (startCoordArr[0] === endCoord[0] && startCoordArr[1] === endCoord[1]) {
      this.followLiveVehicle(endCoord, true);
      this.plotLiveAlert(data);
      return;
    }

    // Commit current position before animation
    const lastCommittedCoord = this.livePathCoordinates[this.livePathCoordinates.length - 1];
    if (lastCommittedCoord[0] !== startCoordArr[0] || lastCommittedCoord[1] !== startCoordArr[1]) {
      this.livePathCoordinates.push(startCoordArr);
    }

    this.animateLiveMovement(startCoordArr, endCoord, data);
  }

  animateLiveMovement(start: [number, number], end: [number, number], data: any) {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);

    // Turf expects [longitude, latitude]
    const fromPoint = turf.point([start[1], start[0]]);
    const toPoint = turf.point([end[1], end[0]]);
    const heading = turf.bearing(fromPoint, toPoint);

    const startTime = performance.now();
    const duration = 5000;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      let progress = elapsed / duration;
      if (progress > 1) progress = 1;

      const currentLat = start[0] + (end[0] - start[0]) * progress;
      const currentLng = start[1] + (end[1] - start[1]) * progress;

      if (this.liveMarker) {
        this.liveMarker.setLatLng([currentLat, currentLng]);
        this.followLiveVehicle([currentLat, currentLng]);
        const markerElement = this.liveMarker.getElement();
        if (markerElement) {
          const wrapper = markerElement.querySelector('.live-vehicle-marker-wrapper') as HTMLElement;
          if (wrapper) wrapper.style.transform = `rotate(${heading}deg)`;
        }
      }

      const tempPath = [...this.livePathCoordinates, [currentLat, currentLng] as [number, number]];
      this.updateLiveRouteLine(tempPath);

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        // Animation Complete
        this.livePathCoordinates.push(end);
        this.followLiveVehicle(end, true);
        this.updateLiveRouteLine(this.livePathCoordinates);
        this.plotLiveAlert(data);

        // Update arrows
        this.updateLiveArrows(data);

        // Update popup content if open
        if (this.liveMarker && this.liveMarker.getPopup()?.isOpen()) {
          this.liveMarker.closePopup();
          this.liveMarker.bindPopup(this.createPopupInstance(data)).openPopup();
        }
      }
    };
    this.animationFrameId = requestAnimationFrame(animate);
  }

  private plotLiveAlert(data: any): void {
    const alertId = String(data?.param47 || '').trim();
    const alertName = String(data?.param48 || '').trim();
    const lat = Number(data?.param38); const lng = Number(data?.param39);
    if (!alertId || alertId === '01' || !alertName || alertName.toLowerCase() === 'na' || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const key = `${alertId}|${data?.param35 || ''}|${lat}|${lng}`;
    if (this.liveAlertKeys.has(key)) return;
    this.liveAlertKeys.add(key);

    const icon = L.icon({ iconUrl: this.getLiveAlertIcon(alertName), iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -18] });
    const content = this.createAlertPopupContent(alertName, alertId, data?.param13, data?.param35, data?.param40, lat, lng);
    L.marker([lat, lng], { icon, zIndexOffset: 1200 }).bindPopup(content).addTo(this.liveAlertsLayer);
  }

  private getLiveAlertIcon(alertName: string): string {
    const name = alertName.toLowerCase();
    const mappings: Array<[string, string]> = [
      ['overspeed', 'overspeed_new.png'], ['impact', 'emergency.png'], ['main battery reconnect', 'batterycharge.png'],
      ['power disconnect', 'powerDisconnect.png'], ['ignition on', 'ignitionOn.png'], ['ignition off', 'ignitionOff.png'],
      ['harsh acceleration', 'harshacceleration_new.png'], ['harsh brake', 'harshbrake_new.png'],
      ['geofence entry', 'geofenceentry.png'], ['geofence exit', 'geofenceexit.png'], ['panic', 'panic.png'],
      ['low battery', 'batterylow.png'], ['route deviation', 'routedev3.png'], ['tamper', 'tamper.png'], ['tilt', 'tilt.png']
    ];
    return `assets/mapimages/alertimage/${mappings.find(([key]) => name.includes(key))?.[1] || 'others.png'}`;
  }

  private followLiveVehicle(coord: [number, number], immediate = false) {
    if (!this.map || !this.isLiveTracking) return;

    if (immediate) {
      this.map.setView(coord, Math.max(this.map.getZoom(), 16), { animate: true });
      return;
    }

    this.map.panTo(coord, { animate: false });
  }

  updateLiveRouteLine(coordinates: [number, number][]) {
    this.liveRouteLayer.clearLayers();

    if (coordinates.length < 2) return;

    const polyline = L.polyline(coordinates, {
      color: '#007bff',
      weight: 5,
      opacity: 0.8,
      lineJoin: 'round',
      lineCap: 'round'
    }).addTo(this.liveRouteLayer);
  }

  updateLiveArrows(data: any) {
    // Add the latest point to history
    const currentCoord = this.livePathCoordinates[this.livePathCoordinates.length - 1];
    this.livePathDataPoints.push({
      ...data, // Live update ka pura data yahan bhi spread karein
      coordinate: currentCoord,
      speed: Number(data.param40 || data.speed || 0),
      time: data.param35 || data.pollingdate,
      ignition: data.param45 === '1' ? 'On' : 'Off',
      heading: Number(data.param43 || 0)
    });

    this.renderLiveArrows();
  }

  private renderLiveArrows() {
    if (!this.liveArrowsLayer || !this.livePathDataPoints.length) return;
    this.liveArrowsLayer.clearLayers();

    const zoom = this.map.getZoom();
    const stride = zoom >= 18 ? 1 :
      zoom >= 16 ? 2 :
        zoom >= 14 ? 4 :
          zoom >= 12 ? 8 :
            zoom >= 10 ? 16 : 32;

    for (let i = 1; i < this.livePathDataPoints.length; i += stride) {
      const point = this.livePathDataPoints[i];
      const prevPoint = this.livePathDataPoints[i - 1];

      // Turf expects [longitude, latitude]
      const from = turf.point([prevPoint.coordinate[1], prevPoint.coordinate[0]]);
      const to = turf.point([point.coordinate[1], point.coordinate[0]]);
      const heading = turf.bearing(from, to);

      const arrowIcon = this.createModernArrowIcon(point.speed, heading);

      L.marker(point.coordinate as any, { icon: arrowIcon })
        .addTo(this.liveArrowsLayer)
        .on('click', () => this.showLivePointPopup(point));
    }
  }

  /**
   * Displays a detailed popup when a live tracking arrow is clicked
   */
  showLivePointPopup(point: any) {

    const vehicleNo = point.param13 || point.vehicleno || 'N/A';
    const speed = point.param40 || point.speed || 0;
    const time = point.param35 || point.time || 'N/A';
    const lat = Number(point.param38 || point.lat).toFixed(5);
    const lng = Number(point.param39 || point.lng).toFixed(5);
    const ignition = (point.param45 === '1' || point.ignition === 'On') ? 'On' : 'Off';
    const ignColor = ignition === 'On' ? '#22c55e' : '#ef4444';
    const ignBg = ignition === 'On' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)';
    const speedVal = Number(speed);
    const speedColor = speedVal > 50 ? '#ef4444' : speedVal > 30 ? '#f59e0b' : '#22c55e';
    const address = point.param25 || point.address || '';
    const statusText = speedVal > 0 ? 'Moving' : 'Parked';
    const statusDot = speedVal > 0 ? '#22c55e' : '#f59e0b';

    const popupHtml = `
      <div class="vts-popup-pro">
        <div class="vts-popup-pro__header vts-popup-pro__header--live">
          <div class="vts-popup-pro__title-row">
            <div class="vts-popup-pro__icon-badge vts-popup-pro__icon-badge--pulse">
              <i class="fa fa-car"></i>
            </div>
            <div class="vts-popup-pro__title-text">
              <span class="vts-popup-pro__vehicle-no">${vehicleNo}</span>
              <span class="vts-popup-pro__live-tag">● LIVE</span>
            </div>
          </div>
          <div class="vts-popup-pro__speed-chip" style="background:${speedColor}">
            <span class="vts-popup-pro__speed-val">${speed}</span>
            <span class="vts-popup-pro__speed-unit">km/h</span>
          </div>
        </div>
        <div class="vts-popup-pro__body">
          <div class="vts-popup-pro__info-grid">
            <div class="vts-popup-pro__info-cell">
              <div class="vts-popup-pro__info-icon"><i class="fa fa-bolt" style="color:${ignColor}"></i></div>
              <div class="vts-popup-pro__info-content">
                <span class="vts-popup-pro__info-label">Ignition</span>
                <span class="vts-popup-pro__info-value vts-popup-pro__ign-badge" style="color:${ignColor};background:${ignBg}">${ignition}</span>
              </div>
            </div>
            <div class="vts-popup-pro__info-cell">
              <div class="vts-popup-pro__info-icon"><i class="fa fa-clock-o"></i></div>
              <div class="vts-popup-pro__info-content">
                <span class="vts-popup-pro__info-label">Updated</span>
                <span class="vts-popup-pro__info-value">${time}</span>
              </div>
            </div>
          </div>
          <div class="vts-popup-pro__coord-row">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span class="vts-popup-pro__coord-text">${lat}, ${lng}</span>
          </div>
          ${address ? '<div class="vts-popup-pro__address-row"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span class="vts-popup-pro__address-text">' + address + '</span></div>' : ''}
          <div class="vts-popup-pro__status-footer">
            <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${statusDot}"></span>
            <span>${statusText}</span>
          </div>
        </div>
      </div>
    `;

    L.popup({
      className: 'vts-pro-popup',
      offset: L.point(0, -15),
      maxWidth: 280
    })
      .setLatLng(point.coordinate)
      .setContent(popupHtml)
      .openOn(this.map);
  }

  private renderHistoryArrows() {
    if (!this.historyArrowsLayer || !this.historyDataList.length) return;
    this.historyArrowsLayer.clearLayers();

    const zoom = this.map.getZoom();
    const stride = zoom >= 18 ? 1 :
      zoom >= 16 ? 2 :
        zoom >= 14 ? 5 :
          zoom >= 12 ? 10 :
            zoom >= 10 ? 20 : 40;

    for (let i = 1; i < this.historyDataList.length; i += stride) {
      const item = this.historyDataList[i];
      const prevItem = this.historyDataList[i - 1];

      const from = turf.point([Number(prevItem.param5), Number(prevItem.param4)]);
      const to = turf.point([Number(item.param5), Number(item.param4)]);
      const heading = turf.bearing(from, to);

      const speed = Number(item.param8 || 0);
      const arrowIcon = this.createModernArrowIcon(speed, heading);

      L.marker([Number(item.param4), Number(item.param5)], { icon: arrowIcon })
        .addTo(this.historyArrowsLayer)
        .on('click', () => this.showHistoryPointPopup(item));
    }
  }

  /**
   * Creates a modern, attractive navigation arrow using CSS clip-path
   */
  private createModernArrowIcon(speed: number, heading: number) {
    // Speed based colors: Green (Fast), Yellow (Medium), Red (Slow/Stop)
    const arrowColor = speed > 50 ? '#00E676' : speed > 30 ? '#FFD600' : '#FF5252';

    return L.divIcon({
      className: 'modern-vts-arrow',
      html: `
        <div style="transform: rotate(${heading}deg); width: 22px; height: 22px; position: relative; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4));">
          <!-- Outer Glow/Border -->
          <div style="position: absolute; inset: 0; background: white; clip-path: polygon(50% 0%, 100% 100%, 50% 78%, 0% 100%);"></div>
          <!-- Inner Color Fill -->
          <div style="position: absolute; inset: 2.5px; background: ${arrowColor}; clip-path: polygon(50% 0%, 100% 100%, 50% 78%, 0% 100%);"></div>
        </div>`,
      iconSize: L.point(22, 22),
      iconAnchor: L.point(11, 11)
    });
  }

  private createPopupInstance(data: any) {
    return L.popup({
      className: 'vts-pro-popup',
      maxWidth: 290,
      offset: [0, -20]
    }).setContent(this.getPopupHTML(data));
  }

  openLivePopup(lngLat: any, data: any) {
    L.popup({
      closeOnClick: false,
      className: 'vts-pro-popup',
      maxWidth: 290
    })
      .setLatLng(lngLat)
      .setContent(this.getPopupHTML(data))
      .openOn(this.map);
  }

  getPopupHTML(data: any) {
    const vehicleNo = data.param13 || data.vehicleno || 'N/A';
    const speed = data.param40 || data.speed || 0;
    const time = data.param35 || data.pollingdate || 'N/A';
    const lat = Number(data.param38 || data.lat).toFixed(5);
    const lng = Number(data.param39 || data.lng).toFixed(5);
    const ignition = (data.param45 === '1' || data.ignition === 'On') ? 'On' : 'Off';
    const ignColor = ignition === 'On' ? '#22c55e' : '#ef4444';
    const ignBg = ignition === 'On' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)';
    const speedVal = Number(speed);
    const speedColor = speedVal > 50 ? '#ef4444' : speedVal > 30 ? '#f59e0b' : '#22c55e';
    const address = data.param25 || data.address || '';
    const statusText = speedVal > 0 ? 'Moving' : 'Parked';
    const statusDot = speedVal > 0 ? '#22c55e' : '#f59e0b';

    return `
      <div class="vts-popup-pro">
        <div class="vts-popup-pro__header vts-popup-pro__header--live">
          <div class="vts-popup-pro__title-row">
            <div class="vts-popup-pro__icon-badge vts-popup-pro__icon-badge--pulse">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            </div>
            <div class="vts-popup-pro__title-text">
              <span class="vts-popup-pro__vehicle-no">${vehicleNo}</span>
              <span class="vts-popup-pro__live-tag">● LIVE</span>
            </div>
          </div>
          <div class="vts-popup-pro__speed-chip" style="background:${speedColor}">
            <span class="vts-popup-pro__speed-val">${speed}</span>
            <span class="vts-popup-pro__speed-unit">km/h</span>
          </div>
        </div>
        <div class="vts-popup-pro__body">
          <div class="vts-popup-pro__info-grid">
            <div class="vts-popup-pro__info-cell">
              <div class="vts-popup-pro__info-icon"><i class="fa fa-bolt" style="color:${ignColor}"></i></div>
              <div class="vts-popup-pro__info-content">
                <span class="vts-popup-pro__info-label">Ignition</span>
                <span class="vts-popup-pro__info-value vts-popup-pro__ign-badge" style="color:${ignColor};background:${ignBg}">${ignition}</span>
              </div>
            </div>
            <div class="vts-popup-pro__info-cell">
              <div class="vts-popup-pro__info-icon"><i class="fa fa-clock-o"></i></div>
              <div class="vts-popup-pro__info-content">
                <span class="vts-popup-pro__info-label">Updated</span>
                <span class="vts-popup-pro__info-value">${time}</span>
              </div>
            </div>
          </div>
          <div class="vts-popup-pro__coord-row">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span class="vts-popup-pro__coord-text">${lat}, ${lng}</span>
          </div>
          ${address ? '<div class="vts-popup-pro__address-row"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span class="vts-popup-pro__address-text">' + address + '</span></div>' : ''}
          <div class="vts-popup-pro__status-footer">
            <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${statusDot}"></span>
            <span>${statusText}</span>
          </div>
        </div>
      </div>
    `;
  }

  stopLiveTracking() {
    if (this.liveInterval) clearInterval(this.liveInterval);
    this.isLiveTracking = false;
    this.isLiveUpdatePending = false;
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);

    // Clear layers
    if (this.liveRouteLayer) this.liveRouteLayer.clearLayers();
    if (this.liveArrowsLayer) this.liveArrowsLayer.clearLayers();
    if (this.liveAlertsLayer) this.liveAlertsLayer.clearLayers();
    this.liveAlertKeys.clear();
    if (this.liveMarker) {
      this.map.removeLayer(this.liveMarker);
      this.liveMarker = null;
    }

    // Clear data points
    this.livePathDataPoints = [];
  }

  updatePanelData(data: any) {
    this.liveData = {
      ...this.liveData,
      vehicleno: data.param13 || data.vehicleno,
      speed: data.param40 || data.speed,
      time: data.param35 || data.pollingdate,
      ignition: data.param45 === '1' ? 'On' : 'Off',
      lat: Number(data.param38),
      lng: Number(data.param39),
      gpsStatus: data.param41 === '1' ? 'Active' : 'Inactive',
      address: data.address || 'Not available',

      chassisNo: data.param14,
      engineNo: data.param15,
      vehicleMake: data.param30,
      vehicleModel: data.param31,
      rtoName: data.param19,

      customerName: data.param25,
      customerMobile: data.param26,

      imei: data.param4,
      vendorName: data.param9,

      alert: data.param48 && data.param48 !== 'NA' ? data.param48 : null,
    };
  }

  // --- History Playback ---

  clearHistoryOnMap() {
    if (!this.map) return;

    if (this.historyRouteLayer) this.historyRouteLayer.clearLayers();
    if (this.historyArrowsLayer) this.historyArrowsLayer.clearLayers();
    if (this.historyAlertsLayer) this.historyAlertsLayer.clearLayers();

    if (this.historyStartMarker) {
      this.map.removeLayer(this.historyStartMarker);
      this.historyStartMarker = null;
    }
    if (this.historyEndMarker) {
      this.map.removeLayer(this.historyEndMarker);
      this.historyEndMarker = null;
    }
    if (this.historyMarker) {
      this.map.removeLayer(this.historyMarker);
      this.historyMarker = null;
    }

    this.historyPathCoordinates = [];
    this.historyDataList = [];
  }

  showHistoryTrack() {
    this.stopLiveTracking();
    this.activeTab = 'history';
    this.clearHistoryOnMap();

    const fromTime = moment(this.fromTime).format('hh:mm A');
    const toTime = moment(this.toTime).format('hh:mm A');
    const date = $('#historydate').val();  //moment(this.historyDate).format('YYYY-MM-DD');

    const payload = { param1: this.liveData.vehicleno, param2: date, param3: fromTime, param4: toTime };

    this.vehicleService.getVehicleHistory(payload).subscribe((res: any) => {
      const historyList = res.entity?.listData;
      if (!Array.isArray(historyList) || historyList.length === 0) {
        this.errorMessage = "No history data found for the selected time range.";
        this.errorType = 'error';
        this.cdr.detectChanges();
        return;
      }

      this.historyDataList = [];
      this.historyPathCoordinates = historyList.map((h: any) => {
        if (h && h.param5 != null && h.param4 != null) {
          const lng = Number(h.param5);
          const lat = Number(h.param4);
          if (!isNaN(lng) && !isNaN(lat) && (lng !== 0 || lat !== 0)) {
            this.historyDataList.push(h);
            return [lat, lng] as [number, number];
          }
        }
        return null;
      }).filter((p: any): p is [number, number] => p !== null);

      if (this.historyPathCoordinates.length < 2) {
        this.errorMessage = "Not enough valid history data to draw a path.";
        this.errorType = 'error';
        this.cdr.detectChanges();
        return;
      }

      // Add route line
      if (!this.historyRouteLayer) this.historyRouteLayer = L.layerGroup().addTo(this.map);
      this.historyRouteLayer.clearLayers();
      const historyPolyline = L.polyline(this.historyPathCoordinates, {
        color: '#dc2626',
        weight: 4,
        opacity: 0.8,
        lineJoin: 'round',
        lineCap: 'round'
      }).addTo(this.historyRouteLayer);

      // Add direction arrows using density logic
      if (!this.historyArrowsLayer) this.historyArrowsLayer = L.layerGroup().addTo(this.map);
      this.historyArrowsLayer.clearLayers();
      this.renderHistoryArrows();
      this.renderHistoryAlerts();

      // Add start marker
      const startItem = this.historyDataList[0];
      const startIcon = this.createStartEndIcon('start');
      this.historyStartMarker = L.marker([Number(startItem.param4), Number(startItem.param5)], { icon: startIcon })
        .addTo(this.map)
        .bindPopup(this.getPointPopupHTML('Start Point', startItem));

      // Add end marker
      const endItem = this.historyDataList[this.historyDataList.length - 1];
      const endIcon = this.createStartEndIcon('end');
      this.historyEndMarker = L.marker([Number(endItem.param4), Number(endItem.param5)], { icon: endIcon })
        .addTo(this.map)
        .bindPopup(this.getPointPopupHTML('End Point', endItem));

      // Create history vehicle marker
      const vehicleIconUrl = this.getVehicleIconUrl(endItem);
      const vehicleIcon = L.divIcon({
        className: 'history-vehicle-marker-div',
        html: `<div class="history-vehicle-marker" style="
          width: 20px;
          height: 28px;
          background-image: url(${vehicleIconUrl});
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
        "></div>`,
        iconSize: L.point(20, 28),
        iconAnchor: L.point(10, 14)
      });

      this.historyMarker = L.marker([Number(startItem.param4), Number(startItem.param5)], { icon: vehicleIcon, zIndexOffset: 1000 })
        .addTo(this.map);

      // Set initial orientation based on first movement
      if (this.historyDataList.length >= 2) {
        const firstP = turf.point([Number(startItem.param5), Number(startItem.param4)]);
        const secondP = turf.point([Number(this.historyDataList[1].param5), Number(this.historyDataList[1].param4)]);
        const initialHeading = turf.bearing(firstP, secondP);
        const markerEl = this.historyMarker.getElement();
        if (markerEl) {
          const inner = markerEl.querySelector('.history-vehicle-marker') as HTMLElement;
          if (inner) inner.style.transform = `rotate(${initialHeading}deg)`;
        }
      }

      // Reset playback
      this.historyPlaybackIndex = 0;
      this.isHistoryPlaying = false;
      this.updatePanelDataFromHistory(startItem);

      // Fit bounds
      const bounds = L.latLngBounds(this.historyPathCoordinates);
      this.map.fitBounds(bounds, { padding: [50, 50] });
      this.cdr.detectChanges();
    });
  }

  private renderHistoryAlerts(): void {
    this.historyAlertsLayer.clearLayers();
    this.historyDataList.forEach(item => {
      const alertId = String(item?.param12 || '').trim();
      const alertName = String(item?.param13 || '').trim();
      const lat = Number(item?.param4); const lng = Number(item?.param5);
      if (!alertId || alertId === '01' || !alertName || alertName.toLowerCase() === 'na' || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const icon = L.icon({ iconUrl: this.getLiveAlertIcon(alertName), iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -18] });
      const content = this.createAlertPopupContent(alertName, alertId, this.liveData?.vehicleno, item?.param3, item?.param6, lat, lng);
      L.marker([lat, lng], { icon, zIndexOffset: 900 }).bindPopup(content).addTo(this.historyAlertsLayer);
    });
  }

  private createAlertPopupContent(name: any, id: any, vehicle: any, time: any, speed: any, lat: number, lng: number): HTMLElement {
    const root = document.createElement('div'); root.className = 'compact-alert-card';
    const header = document.createElement('div'); header.className = 'compact-alert-card__header';
    const badge = document.createElement('span'); badge.className = 'compact-alert-card__badge'; badge.textContent = '!';
    const heading = document.createElement('div'); const title = document.createElement('strong');
    title.textContent = String(name || 'Alert'); heading.append(title); header.append(badge, heading); root.append(header);
    const body = document.createElement('div'); body.className = 'compact-alert-card__body';
    [['Vehicle', vehicle || '-'], ['Speed', `${Number(speed || 0)} km/h`], ['Time', time || '-'], ['Location', `${lat.toFixed(5)}, ${lng.toFixed(5)}`]].forEach(([label, value]) => {
      const row = document.createElement('div'), key = document.createElement('span'), val = document.createElement('b'); key.textContent = String(label); val.textContent = String(value); row.append(key, val); body.append(row);
    });
    root.append(body); return root;
  }

  saveHistoryRoute() {
    if (!this.isHistoryRouteReady) {
      this.toast.show('Please plot history track before saving route', 'error');
      return;
    }

    if (!this.isRouteNameValid) {
      this.toast.show('Please enter a valid route name', 'error');
      return;
    }

    this.isSavingHistoryRoute = true;
    const req = this.buildHistoryRoutePayload();

    this.routeService.putRoute(req).subscribe({
      next: (res: any) => {
        this.isSavingHistoryRoute = false;
        if (res?.status) {
          this.toast.show(res.entity || 'Route saved successfully', 'success');
        } else {
          const message = typeof res?.entity === 'string' ? res.entity : 'Route save failed';
          this.toast.show(message, 'error');
        }
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        this.isSavingHistoryRoute = false;
        this.toast.show(error?.error?.entity || 'Error saving route', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  private buildHistoryRoutePayload(): RouteEntryRequest {
    const coordinates = this.historyPathCoordinates.map(([lat, lng]) => [lng, lat]);
    const coord = JSON.stringify({ type: 'LineString', coordinates });
    const date = $('#historydate').val() || moment(this.historyDate).format('DD-MMM-YYYY');
    const fromTime = moment(this.fromTime).format('hh:mm A');
    const toTime = moment(this.toTime).format('hh:mm A');
    const vehicleNo = this.liveData?.vehicleno || 'Vehicle';

    return {
      routeid: '',
      routename: this.routeName.trim(),
      routetype: 'route',
      coord,
      description: `History track route for ${vehicleNo}`,
      stylecolor: '#dc2626',
      sourcepoiid: '',
      destinationpoiid: '',
      vehiclespeed: '80'
    };
  }

  onRouteNameChange(value: string) {
    this.routeName = (value || '').replace(/[^A-Za-z0-9 _-]/g, '').slice(0, 50);
  }

  showHistoryPointPopup(item: any) {
    const ignColor = item.param12 === '1' ? '#22c55e' : '#ef4444';
    const ignBg = item.param12 === '1' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)';
    const speedVal = Number(item.param6 || 0);
    const speedColor = speedVal > 50 ? '#ef4444' : speedVal > 30 ? '#f59e0b' : '#22c55e';
    const statusText = speedVal > 0 ? 'Moving' : 'Stopped';
    const statusDot = speedVal > 0 ? '#22c55e' : '#f59e0b';

    const lat = Number(item.param4).toFixed(5);
    const lng = Number(item.param5).toFixed(5);
    const vehicleNo = item.param15 || this.liveData.vehicleno || 'N/A';

    const popupHtml = `
      <div class="vts-popup-pro">
        <div class="vts-popup-pro__header">
          <div class="vts-popup-pro__title-row">
            <div class="vts-popup-pro__icon-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            </div>
            <div class="vts-popup-pro__title-text">
              <span class="vts-popup-pro__vehicle-no">${vehicleNo}</span>
            </div>
          </div>
          <div class="vts-popup-pro__speed-chip" style="background:${speedColor}">
            <span class="vts-popup-pro__speed-val">${item.param8}</span>
            <span class="vts-popup-pro__speed-unit">km/h</span>
          </div>
        </div>
        <div class="vts-popup-pro__body">
          <div class="vts-popup-pro__info-grid">
            <div class="vts-popup-pro__info-cell">
              <div class="vts-popup-pro__info-icon"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
              <div class="vts-popup-pro__info-content">
                <span class="vts-popup-pro__info-label">Time</span>
                <span class="vts-popup-pro__info-value">${item.param3}</span>
              </div>
            </div>
            <div class="vts-popup-pro__info-cell">
              <div class="vts-popup-pro__info-icon"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="${ignColor}" stroke-width="2.5" stroke-linecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div>
              <div class="vts-popup-pro__info-content">
                <span class="vts-popup-pro__info-label">Ignition</span>
                <span class="vts-popup-pro__info-value vts-popup-pro__ign-badge" style="color:${ignColor};background:${ignBg}">${item.param12 === '1' ? 'On' : 'Off'}</span>
              </div>
            </div>
          </div>
          <div class="vts-popup-pro__coord-row">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span class="vts-popup-pro__coord-text">${lat}, ${lng}</span>
          </div>
          <div class="vts-popup-pro__status-footer">
            <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${statusDot}"></span>
            <span>${statusText}</span>
          </div>
        </div>
      </div>`;

    const popupOptions: L.PopupOptions = {
      className: 'vts-pro-popup',
      offset: L.point(0, -20), // Adjusted offset for better positioning
      maxWidth: 280
    };
    L.popup(popupOptions)
      .setLatLng([Number(item.param4), Number(item.param5)])
      .setContent(popupHtml)
      .openOn(this.map);
  }

  getPointPopupHTML(title: string, item: any): string {
    const vehicleNo = item.param1 || this.liveData.vehicleno || 'N/A';
    const time = item.param3 || 'N/A';
    const speed = item.param8 || 0;
    const ignition = item.param12 === '1' ? 'On' : 'Off';
    const lat = Number(item.param4).toFixed(5);
    const lng = Number(item.param5).toFixed(5);
    const isStart = title === 'Start Point';
    const accentGradient = isStart ? 'linear-gradient(135deg, #059669, #10b981)' : 'linear-gradient(135deg, #dc2626, #ef4444)';
    const accentColor = isStart ? '#059669' : '#dc2626';
    const ignColor = ignition === 'On' ? '#22c55e' : '#ef4444';
    const ignBg = ignition === 'On' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)';
    const speedVal = Number(speed || 0);
    const speedColor = speedVal > 50 ? '#ef4444' : speedVal > 30 ? '#f59e0b' : '#22c55e';

    return `
    <div class="vts-popup-pro">
      <div class="vts-popup-pro__header" style="background:${accentGradient}">
        <div class="vts-popup-pro__title-row">
          <div class="vts-popup-pro__icon-badge" style="background:rgba(255,255,255,0.2)">
            ${isStart ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16" fill="#fff" stroke="none"/></svg>' : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><rect x="9" y="8" width="6" height="8" rx="1" fill="#fff" stroke="none"/></svg>'}
          </div>
          <div class="vts-popup-pro__title-text">
            <span class="vts-popup-pro__vehicle-no">${title}</span>
            <span class="vts-popup-pro__vehicle-class">${vehicleNo}</span>
          </div>
        </div>
        <div class="vts-popup-pro__speed-chip" style="background:${speedColor}">
          <span class="vts-popup-pro__speed-val">${speed}</span>
          <span class="vts-popup-pro__speed-unit">km/h</span>
        </div>
      </div>
      <div class="vts-popup-pro__body">
        <div class="vts-popup-pro__info-grid">
          <div class="vts-popup-pro__info-cell">
            <div class="vts-popup-pro__info-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
            <div class="vts-popup-pro__info-content">
              <span class="vts-popup-pro__info-label">Time</span>
              <span class="vts-popup-pro__info-value">${time}</span>
            </div>
          </div>
          <div class="vts-popup-pro__info-cell">
            <div class="vts-popup-pro__info-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${ignColor}" stroke-width="2.5" stroke-linecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div>
            <div class="vts-popup-pro__info-content">
              <span class="vts-popup-pro__info-label">Ignition</span>
              <span class="vts-popup-pro__info-value vts-popup-pro__ign-badge" style="color:${ignColor};background:${ignBg}">${ignition}</span>
            </div>
          </div>
        </div>
        <div class="vts-popup-pro__coord-row">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span class="vts-popup-pro__coord-text">${lat}, ${lng}</span>
        </div>
      </div>
    </div>
    `;
  }

  addArrowImage() {
    // Arrow images are created dynamically using CSS
  }

  createStartEndIcon(type: 'start' | 'end') {
    const color = type === 'start' ? '#28a745' : '#dc3545';
    const iconHtml = type === 'start'
      ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="${color}" stroke="#fff" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16" fill="#fff" stroke="none"/></svg>`
      : `<svg width="24" height="24" viewBox="0 0 24 24" fill="${color}" stroke="#fff" stroke-width="2"><circle cx="12" cy="12" r="10"/><rect x="9" y="8" width="6" height="8" rx="1" fill="#fff" stroke="none"/></svg>`;

    return L.divIcon({
      className: 'start-end-marker-div',
      html: iconHtml,
      iconSize: L.point(24, 24),
      iconAnchor: L.point(12, 12)
    });
  }

  playHistory() {
    if (this.isHistoryPlaying) return;

    if (this.historyPlaybackIndex >= this.historyDataList.length - 1) {
      this.historyPlaybackIndex = 0;
    }

    this.isHistoryPlaying = true;
    this.animateHistoryStep();
  }

  animateHistoryStep() {
    if (!this.isHistoryPlaying) return;

    if (this.historyPlaybackIndex >= this.historyDataList.length - 1) {
      this.stopHistory();
      return;
    }

    const startItem = this.historyDataList[this.historyPlaybackIndex];
    const endItem = this.historyDataList[this.historyPlaybackIndex + 1];

    const startLng = Number(startItem.param5);
    const startLat = Number(startItem.param4);
    const endLng = Number(endItem.param5);
    const endLat = Number(endItem.param4);

    const from = turf.point([startLng, startLat]);
    const to = turf.point([endLng, endLat]);
    const distance = turf.distance(from, to, { units: 'kilometers' } as unknown as Parameters<typeof turf.distance>[2]);

    const heading = turf.bearing(from, to);

    let duration = (distance * 10000) / (this.speedSliderValue || 1);
    if (duration < 50) duration = 50;

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      if (!this.isHistoryPlaying) return;

      const elapsed = currentTime - startTime;
      let progress = elapsed / duration;
      if (progress > 1) progress = 1;

      const currentLng = startLng + (endLng - startLng) * progress;
      const currentLat = startLat + (endLat - startLat) * progress;

      if (this.historyMarker) {
        this.historyMarker.setLatLng([currentLat, currentLng]);

        const markerElement = this.historyMarker.getElement();
        if (markerElement) {
          const innerDiv = markerElement.querySelector('.history-vehicle-marker') as HTMLElement;
          if (innerDiv) {
            innerDiv.style.transform = `rotate(${heading}deg)`;
            const iconUrl = this.getVehicleIconUrl(endItem);
            innerDiv.style.backgroundImage = `url(${iconUrl})`;
          }
        }
      }

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.historyPlaybackIndex++;
        this.updatePanelDataFromHistory(endItem);
        this.cdr.detectChanges();

        this.animateHistoryStep();
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  restartHistory() {
    if (!this.historyDataList || this.historyDataList.length === 0) {
      return;
    }

    this.stopHistory();
    this.historyPlaybackIndex = 0;

    // Immediately reset the vehicle marker to the start position
    if (this.historyMarker) {
      const startItem = this.historyDataList[0];
      this.historyMarker.setLatLng([Number(startItem.param4), Number(startItem.param5)]);
      this.updatePanelDataFromHistory(startItem);

      // Reset the rotation to face the first path segment
      const markerEl = this.historyMarker.getElement();
      if (markerEl && this.historyDataList.length >= 2) {
        const innerDiv = markerEl.querySelector('.history-vehicle-marker') as HTMLElement;
        if (innerDiv) {
          const firstP = turf.point([Number(startItem.param5), Number(startItem.param4)]);
          const secondP = turf.point([Number(this.historyDataList[1].param5), Number(this.historyDataList[1].param4)]);
          const initialHeading = turf.bearing(firstP, secondP);
          innerDiv.style.transform = `rotate(${initialHeading}deg)`;
        }
      }
    }

    this.playHistory();
    this.cdr.detectChanges();
  }

  private updatePanelDataFromHistory(item: any) {
    const historyDateTime = this.parseHistoryDateTime(item?.param3 || item?.pollingdate);

    this.liveData = {
      ...this.liveData,
      speed: Number(item?.param6 ?? item?.speed ?? 0),
      time: historyDateTime || this.liveData?.time,
      lat: Number(item?.param4 ?? item?.lat ?? this.liveData?.lat),
      lng: Number(item?.param5 ?? item?.lng ?? this.liveData?.lng),
      ignition: item?.param12 === '1' ? 'On' : 'Off'
    };
  }

  private parseHistoryDateTime(value: any): Date | null {
    if (!value) {
      return null;
    }

    const parsed = moment(value, [
      'DD-MMM-YYYY hh:mm:ss A',
      'DD-MMM-YYYY hh:mm A',
      'DD-MM-YYYY hh:mm:ss A',
      'DD-MM-YYYY hh:mm A',
      'YYYY-MM-DD HH:mm:ss',
      'YYYY-MM-DDTHH:mm:ss'
    ], true);

    if (parsed.isValid()) {
      return parsed.toDate();
    }

    const fallback = moment(value);
    return fallback.isValid() ? fallback.toDate() : null;
  }

  stopHistory() {
    this.isHistoryPlaying = false;
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
  }

  onSpeedChange(event: any) {
    this.speedSliderValue = Number(event.target.value);
  }

  // Refresh cluster data
  refreshClusterData() {
    // Data refresh is handled by the API call
  }

  changeMapStyle(style: string) {
    if (style === 'tomtom') {
      this.tomTomFallbackApplied = false;
    }
    this.activeMapStyle = style;

    // Remove current tile layer
    if (this.map && this.currentTileLayer) {
      this.map.removeLayer(this.currentTileLayer);
    }

    // Add new tile layer
    switch (style) {
      case 'satellite-v9':
        this.currentTileLayer = this.satelliteTileLayer;
        break;
      case 'googlestreet':
        this.currentTileLayer = this.googleStreetTileLayer;
        break;
      case 'googlehybrid':
        this.currentTileLayer = this.googleHybridTileLayer;
        break;
      case 'tomtom':
        this.currentTileLayer = this.tomtomTileLayer;
        break;
      default:
        this.currentTileLayer = this.streetTileLayer;
    }

    if (this.map && this.currentTileLayer) {
      this.currentTileLayer.addTo(this.map);
    }
  }

  // Load vehicle images separately
  loadVehicleImages() {
    // Images are preloaded in loadImagesAndInitialData
  }

  enableDraw() {
    const drawControl = new L.Control.Draw({
      draw: {
        polygon: false,
        rectangle: false,
        circle: false,
        marker: false,
        circlemarker: false,
        polyline: {
          shapeOptions: {
            color: '#f357a1',
            weight: 6,
            opacity: 0.9,
            clickable: true
          },
          metric: true,
          repeatMode: false,
          showLength: true
        }
      },
      edit: {
        featureGroup: this.drawnItems
      }
    });

    this.map.addControl(drawControl);

    this.map.on(L.Draw.Event.CREATED, (e: any) => {
      const layer = e.layer;
      this.drawnItems.addLayer(layer);

      if (layer.bringToFront) {
        layer.bringToFront();
      }

      layer.on('click', () => {
        if (layer.editing) {
          layer.editing.enable();
        }
      });

      this.updateRouteCoordinates();
      this.toast.show('Route drawn! Use Edit button to modify.', 'success');
    });


    this.map.on(L.Draw.Event.EDITED, (e: any) => {
      this.updateRouteCoordinates();
      this.toast.show('Route updated successfully!', 'success');
    });

    this.map.on(L.Draw.Event.DELETED, () => {
      this.routeCoordinates = null;
      this.toast.show('Route removed.', 'info');
    });


    this.map.on(L.Draw.Event.EDITSTART, () => {
      this.drawnItems.eachLayer((layer: any) => {
        if (layer.bringToFront) layer.bringToFront();
      });
      console.log('Edit mode active. Click vertices to drag.');
    });
  }


  private updateRouteCoordinates() {
    const allCoords: any[] = [];

    this.drawnItems.eachLayer((layer: any) => {
      if (layer instanceof L.Polyline) {
        const latlngs = layer.getLatLngs();
        // Leaflet polyline multi-array 
        const points = Array.isArray(latlngs[0]) ? latlngs[0] : latlngs;

        const coords = points.map((p: any) => ({
          lat: p.lat,
          lng: p.lng
        }));
        allCoords.push(...coords);
      }
    });

    this.routeCoordinates = allCoords.length > 0 ? JSON.stringify(allCoords) : null;
    console.log('Current Drawn Route Coords:', this.routeCoordinates);
  }


}
