import { createLeafletBasemap } from '../../shared/components/map-layer-options/map-basemaps';
import { MapLayerOptionsComponent } from '../../shared/components/map-layer-options/map-layer-options.component';
import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
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
import { ToastService } from '../../core/services/toast.service';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import localeData from 'dayjs/plugin/localeData';
import isoWeek from 'dayjs/plugin/isoWeek';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { ToastComponent } from '../assets/inactive-assets/toast.component';
import * as turf from '@turf/turf';
import { POIService } from '../../core/services/poi.service';
import { MapScaleUtil } from '../../core/utils/map-scale.util';


dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.extend(localizedFormat);
dayjs.extend(localeData);
dayjs.extend(isoWeek);
declare var $: any;
dayjs.extend(weekOfYear);

@Component({
    selector: 'app-location-wise-vehicle-details',
    imports: [MapLayerOptionsComponent, CommonModule, FormsModule, ToastComponent, NgxDaterangepickerMd, NgSelectModule, TimepickerModule],
    templateUrl: './location-wise-vehicle-details.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './location-wise-vehicle-details.component.scss'
})
export class LocationWiseVehicleDetailsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapElement') mapElement!: ElementRef;
  private mapResizeObserver?: ResizeObserver;
  private readonly vehicleMarkerSize = L.point(20, 28);
  private readonly vehicleMarkerAnchor = L.point(10, 14);
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
  isHistoryTracking = false;

  isLayerSwitcherOpen = false;
  activeMapStyle: string = 'tomtom';
  viewType: string = 'NEW-activated'; // Initialize viewType to 'NEW'
  geofenceOption: 'poi' | 'geofence' | 'route' = 'poi';
  geofenceClusterMode: '' | 'inside' | 'outside' = '';
  selectedGeofencePoiId: any = null;
  selectedGeofenceClusterId: string = '';
  showPoliceStations = true;
  private policeStationMarkers: L.Marker[] = [];
  private readonly policeStationMinZoom = 12;
  private readonly policeStationBaseSize = 18;
  private readonly policeStationMaxSize = 42;

  // Toggle methods for panels - ensures only one panel is open at a time
  toggleFilterPanel() {
    this.getPOIDetails()
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
  drawnItems!: L.FeatureGroup;
  routeName: string = '';
  selectedPoiId: any = null;

  get isHistoryRouteReady(): boolean {
    return this.historyPathCoordinates.length >= 2;
  }

  get isRouteNameValid(): boolean {
    const routeName = this.routeName.trim();
    return routeName.length >= 3 && routeName.length <= 50 && /^[A-Za-z0-9 _-]+$/.test(routeName);
  }

  private poiMarkers: L.Marker[] = [];
  private geofencePoiCircle: L.Circle | null = null;
  private vehicleClusterPopup: L.Popup | null = null;
  private readonly policeStationPaneName = 'policeStationPane';
  private isClusterRefreshEnabled = false;
  private clusterRequestId = 0;
  private readonly clusterRefreshDelayMs = 30000;
  // Store original data for refresh
  private vehiclesSourceData: any = null;

  constructor(
    private vehicleService: VehicleService,
    private routeService: RouteService,
    private alertService: AlertService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef, private poiService: POIService,
  ) {
    this.toast.pageName = 'Map Tracking New'; // Set page name for toast service
  }

  ngOnInit(): void {

    console.log('L', L);
    this.autocompleteVehicleList = [];
    this.vehicleSearchInput.subscribe(searchText => this.onVehicleSearch(searchText));
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
    this.mapResizeObserver = new ResizeObserver(() => {
      this.map?.invalidateSize({ pan: false });
    });
    this.mapResizeObserver.observe(this.mapElement.nativeElement);
    // We use a setTimeout to ensure the map container element has been rendered
    // and sized by the browser before Leaflet tries to initialize.
    requestAnimationFrame(() => setTimeout(() => this.initializeMap(), 100));
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
    if (!this.mapElement) {
      return;
    }

    // Check if container has proper size
    const rect = this.mapElement.nativeElement.getBoundingClientRect();

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
    this.map = L.map(this.mapElement.nativeElement, {
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
    MapScaleUtil.addLeafletPoweredBy(this.map, 'bottomright');

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
      });

      // Ensure map tiles are properly aligned
      this.map.invalidateSize();

      this.isClusterRefreshEnabled = true;

      // Initial load of vehicle clusters
      this.clusterDataFun(true); // Initial load with loader
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
          const marker = L.marker([lat, lng], { icon: this.createPoliceStationLeafletIcon(mapView.getZoom()) })
            .bindPopup(this.createPoliceStationPopup(station, lat, lng), {
              className: 'police-station-popup',
              maxWidth: 235
            })
            .addTo(mapView);
          this.policeStationMarkers.push(marker);
        });
        this.updatePoliceStationMarkersForZoom();
        mapView.off('zoomend', this.updatePoliceStationMarkersForZoom);
        mapView.on('zoomend', this.updatePoliceStationMarkersForZoom);
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
    this.map?.off('zoomend', this.updatePoliceStationMarkersForZoom);
    this.policeStationMarkers.forEach(marker => marker.remove());
    this.policeStationMarkers = [];
  }

  private readonly updatePoliceStationMarkersForZoom = (): void => {
    if (!this.map) return;
    const zoom = this.map.getZoom();
    const isVisible = zoom >= this.policeStationMinZoom;
    const icon = this.createPoliceStationLeafletIcon(zoom);

    this.policeStationMarkers.forEach(marker => {
      marker.setIcon(icon);
      marker.setOpacity(isVisible ? 1 : 0);
    });
  };

  private createPoliceStationLeafletIcon(zoom: number): L.Icon {
    const size = this.getPoliceStationSize(zoom);
    return L.icon({
      iconUrl: 'assets/mapimages/police-station.png',
      iconSize: [size, size],
      iconAnchor: [Math.round(size / 2), Math.round(size / 2)],
      popupAnchor: [0, -Math.round(size / 2)]
    });
  }

  private getPoliceStationSize(zoom: number): number {
    const normalizedZoom = Math.max(this.policeStationMinZoom, Math.min(zoom, 18));
    const size = this.policeStationBaseSize + ((normalizedZoom - this.policeStationMinZoom) * 4);
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


  clusterDataFun(showLoader: boolean = true) {
    this.clearClusterRefresh();
    const requestId = ++this.clusterRequestId;

    // Always hide loader first, then show only if needed
    //this.isLoadingLiveTrack = showLoader;

    // Stop any active tracking before showing all clusters
    this.stopLiveTracking();
    this.clearHistoryOnMap();
    this.panelOpen = false;
    this.selectedVehicleFromSearch = null;
    this.liveData = null;

    const data = {
      param1: "", // searchby
      param2: "", // pageno
      param3: "", // itemperpage - fetching large number for clustering
      param4: this.vendorFilter || "", // vendorid
      param5: this.rtoFilter || "", // rtoid
      param6: this.vehicleClassFilter || "", // vehicleclassid
      param7: this.selectedVehicleFromSearch || "", // vehicleid
      param8: this.viewType,
      param9: this.selectedPoiId || "", // poiid
    };

    this.vehicleService.getClusterOnClassMap(data, showLoader).subscribe({
      next: (response: any) => {
        if (requestId !== this.clusterRequestId) {
          return;
        }

        // Always hide loader in next handler
        // this.isLoadingLiveTrack = false;

        if (!response) {
          this.errorMessage = "No response from server.";
          this.scheduleClusterRefresh();
          return;
        }

        if (!response.status) {
          this.errorMessage = response.message || "API returned error status.";
          this.scheduleClusterRefresh();
          return;
        }

        if (!response.entity) {
          this.errorMessage = "No entity data in response.";
          this.scheduleClusterRefresh();
          return;
        }

        const listData = response.entity.listData;

        if (!Array.isArray(listData)) {
          this.errorMessage = "Invalid list data format.";
          this.scheduleClusterRefresh();
          return;
        }

        // Update counts
        this.errorMessage = null;
        this.counts = {
          total: listData.length,
          moving: listData.filter((item: any) => Number(item.vehiclespeed) > 0).length,
          parked: listData.filter((item: any) => Number(item.vehiclespeed) === 0 && (item.ignitionstatus === '1' || item.ignitionstatus === 'On')).length,
          offline: listData.filter((item: any) => item.ignitionstatus !== '1').length,
        };

        this.showAllClusters(listData, () => this.scheduleClusterRefresh());
      },
      error: (err: any) => {
        if (requestId !== this.clusterRequestId) {
          return;
        }

        // Always hide loader in error handler
        this.isLoadingLiveTrack = false;
        this.errorMessage = 'Failed to load cluster data: ' + (err.message || 'Unknown error');
        this.scheduleClusterRefresh();
      }
    });
  }

  private clearClusterRefresh() {
    if (this.clusterInterval) {
      clearTimeout(this.clusterInterval);
      this.clusterInterval = null;
    }
  }

  private scheduleClusterRefresh() {
    if (!this.isClusterRefreshEnabled || !this.map) {
      return;
    }

    this.clearClusterRefresh();
    this.clusterInterval = setTimeout(() => {
      this.clusterInterval = null;

      if (!this.isLiveTracking && !this.isHistoryPlaying) {
        this.clusterDataFun(false);
        return;
      }

      this.scheduleClusterRefresh();
    }, this.clusterRefreshDelayMs);
  }

  showAllClusters(listData: any[], afterRender?: () => void) {
    if (!this.map || !listData || listData.length === 0) {
      afterRender?.();
      return;
    }

    // Clear existing vehicle markers by removing and re-adding the layer
    if (this.vehicleLayer) {
      try {
        this.map.removeLayer(this.vehicleLayer);
      } catch (e) { }
    }

    // Prepare features
    const validData = listData.filter((item: any) => {
      const lat = Number(item.latitude || item.param38 || item.param4 || item.lat || 0);
      const lng = Number(item.longitude || item.param39 || item.param5 || item.lng || 0);
      item.latitude = lat;
      item.longitude = lng;
      return lat !== 0 && lng !== 0 && !isNaN(lat) && !isNaN(lng);
    });

    if (validData.length === 0) {
      // Keep the default India-wide viewport when there is no cluster data.
      this.map.setView(this.indiaMapCenter, this.indiaMapZoom);
      afterRender?.();
      return;
    }

    // Create GeoJSON features with vehicle icons
    const features = {
      type: 'FeatureCollection' as const,
      features: validData.map((item: any) => {
        const lat = Number(item.latitude || item.param38 || item.param4 || item.lat);
        const lng = Number(item.longitude || item.param39 || item.param5 || item.lng);
        const speed = Number(item.vehiclespeed || item.param40 || item.param8 || 0);
        const direction = item.vehicledirection || item.param43 || 0;

        let ignitionOn = item.ignitionstatus === '1' || item.ignitionstatus === 'On' || item.param45 === '1' || item.param12 === '1';
        if (speed > 0) ignitionOn = true;

        const normalizedItem = { ...item, latitude: lat, longitude: lng, vehiclespeed: speed, ignitionstatus: ignitionOn ? '1' : '0' };
        const iconUrl = this.getVehicleIconUrl(normalizedItem);

        return {
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [lng, lat]
          },
          properties: {
            ...item,
            latitude: lat,
            longitude: lng,
            iconUrl: iconUrl,
            speed: speed,
            ignition: ignitionOn,
            direction: direction,
            icon: this.getVehicleIcon(normalizedItem)
          }
        };
      })
    };

    // Store for refresh
    this.vehiclesSourceData = features;
    const Leaflet = (window as any).L;
    const markerClusterGroup = L.markerClusterGroup({
      chunkedLoading: true, // performance boost
      maxClusterRadius: 60,
      clusterPane: 'vehicleClusterPane'
    });

    features.features.forEach((feature: any) => {
      const coords = feature.geometry.coordinates;
      const props = feature.properties;

      const latlng = L.latLng(coords[1], coords[0]);

      const customIcon = L.divIcon({
        className: 'vehicle-marker-div-custom',
        html: `<div style="transform: rotate(${props.direction || 0}deg); width: ${this.vehicleMarkerSize.x}px; height: ${this.vehicleMarkerSize.y}px;">
               <img src="${props.iconUrl}" width="${this.vehicleMarkerSize.x}" height="${this.vehicleMarkerSize.y}" style="object-fit: contain;"/>
             </div>`,
        iconSize: this.vehicleMarkerSize,
        iconAnchor: this.vehicleMarkerAnchor
      });

      const marker = L.marker(latlng, { icon: customIcon, pane: 'vehicleClusterPane' });

      marker.on('click', () => {
        this.showVehiclePopup(props, latlng);
      });

      markerClusterGroup.addLayer(marker);
    });

    this.map.addLayer(markerClusterGroup);
    this.vehicleLayer = markerClusterGroup;



    // Do not auto-fit cluster bounds here. This method also runs during the
    // background refresh, which must not override the user's map position or
    // the initial India-wide viewport.

    this.cdr.detectChanges();
    afterRender?.();
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
             <div class="vts-popup-pro__speed-chip" style="background:${speedColor}; margin-right:7px;">
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

  onVehicleSelected(vehicle: any) {
    if (!vehicle) {
      this.selectedVehicleFromSearch = null;
      this.autocompleteVehicleList = [];
      return;
    }

    this.selectedVehicleFromSearch = vehicle;
    this.panelOpen = false;
    this.activeTab = 'live';
    this.showLiveTrack(vehicle);
  }

  loadVendorList() {
    this.vehicleService.getVendorListNew().subscribe({
      next: (response: any) => {
        if (response?.status && response?.entity) {
          this.vendorList = Array.isArray(response.entity) ? response.entity : [];
        }
      },
      error: () => {
        this.vendorList = [];
      }
    });
  }

  loadVehicleClassRoster() {
    this.vehicleService.getVehicleClassRoster().subscribe({
      next: (response: any) => {
        if (response?.status && response?.entity) {
          this.vehicleClassList = Array.isArray(response.entity) ? response.entity : [];
        }
      },
      error: () => {
        this.vehicleClassList = [];
      }
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
    // Clear cluster interval to stop auto-refresh when live tracking starts
    this.clearClusterRefresh();
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
        if (res.entity == "No data found") {
          this.errorMessage = "No data found.";
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
          // Initial load of vehicle clusters
          this.clusterDataFun(true); // Initial load with loader
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
      html: `<div class="live-vehicle-marker-wrapper" style="transform: rotate(${data.param43 || 0}deg); width: ${this.vehicleMarkerSize.x}px; height: ${this.vehicleMarkerSize.y}px;">
           <div class="live-vehicle-marker-container" style="position: relative; width: ${this.vehicleMarkerSize.x}px; height: ${this.vehicleMarkerSize.y}px;">
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
      iconSize: this.vehicleMarkerSize,
      iconAnchor: this.vehicleMarkerAnchor,
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
      maxWidth: 260,
      minWidth: 0
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
             width: ${this.vehicleMarkerSize.x}px;
             height: ${this.vehicleMarkerSize.y}px;
             background-image: url(${vehicleIconUrl});
             background-size: contain;
             background-repeat: no-repeat;
             background-position: center;
           "></div>`,
        iconSize: this.vehicleMarkerSize,
        iconAnchor: this.vehicleMarkerAnchor
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


  onGeofencePoiChange(selectedPoi?: any): void {
    this.clearGeofenceMapLayers();
    

    const selectedPoiId = selectedPoi?.param2 ?? selectedPoi?.id ?? selectedPoi?.value ?? selectedPoi ?? this.selectedGeofencePoiId;
    this.selectedPoiId = selectedPoiId ?? null;
    this.selectedGeofencePoiId = selectedPoiId ?? null;
    this.selectedGeofenceClusterId = String(selectedPoiId || '');

    if (!selectedPoiId) {
      this.errorMessage = null;
      return;
    }

    this.isLiveTracking = false;
    this.isHistoryTracking = false;
    this.isHistoryPlaying = false;
    this.geofenceOption = 'poi';
    this.geofenceClusterMode = 'inside';

    const poi = selectedPoi?.param7 !== undefined
      ? selectedPoi
      : this.poiDetails.find((item: any) => String(item.param2) === String(selectedPoiId));

    if (!poi) {
      this.errorMessage = 'Selected POI details were not found.';
      return;
    }

    const latitude = Number(poi.param7);
    const longitude = Number(poi.param8);
    const radiusKm = Number(poi.param9);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(radiusKm) ||
      radiusKm <= 0
    ) {
      this.errorMessage =
        'The selected POI has invalid coordinates or radius.';
      return;
    }

    this.errorMessage = null;

    const poiFeatureArray = [
      {
        type: 'Feature',
        properties: {
          type: 'poi',
          longitude,
          latitude,
          poiname: poi.param6 || poi.param3,
          poirange: radiusKm,
          iconUrl:
            poi.param5 ||
            'assets/images/mapimages/markers/marker_new.png'
        },
        geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        }
      }
    ];

    this.poiPlot(poiFeatureArray);
    this.circlePlot([poi]);
    this.clusterDataFun();
    this.showPopup(
      {
        ...poiFeatureArray[0].properties,
        param6: poi.param6 || poi.param3,
        param7: latitude,
        param8: longitude,
        param9: radiusKm
      },
      [longitude, latitude]
    );
  }

  clearGeofenceMapLayers() {
    if (!this.map) return;

    this.clearPOIMarkers();
    if (this.geofencePoiCircle) {
      this.map.removeLayer(this.geofencePoiCircle);
      this.geofencePoiCircle = null;
    }
    if (this.vehicleClusterPopup) {
      this.map.closePopup(this.vehicleClusterPopup);
      this.vehicleClusterPopup = null;
    }
  }

  circlePlot(circleData: any[]) {
    if (!this.map) return;

    if (this.geofencePoiCircle) {
      this.map.removeLayer(this.geofencePoiCircle);
      this.geofencePoiCircle = null;
    }

    const poi = Array.isArray(circleData) ? circleData[0] : null;
    if (!poi) return;

    const latitude = Number(poi.param7);
    const longitude = Number(poi.param8);
    const radiusKm = Number(poi.param9);
    const radiusMeters = radiusKm * 1000;

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(radiusMeters) ||
      radiusMeters <= 0
    ) {
      return;
    }

    this.geofencePoiCircle = L.circle([latitude, longitude], {
      radius: radiusMeters,
      color: '#2563eb',
      weight: 2,
      fillColor: '#60a5fa',
      fillOpacity: 0.18
    }).addTo(this.map);

    const bounds = this.geofencePoiCircle.getBounds();
    if (bounds.isValid()) {
      this.map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    }
  }

  showVehicleClusterPopup(data: any, coordinates: any, vehicleId: string) {
    if (this.vehicleClusterPopup) {
      this.map.closePopup(this.vehicleClusterPopup);
      this.vehicleClusterPopup = null;
    }

    const popupElement = this.createVehicleClusterPopupElement(data, vehicleId);
    const lat = Array.isArray(coordinates) ? Number(coordinates[1]) : Number(coordinates?.lat);
    const lng = Array.isArray(coordinates) ? Number(coordinates[0]) : Number(coordinates?.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return;
    }

    this.vehicleClusterPopup = L.popup({
      closeButton: true,
      autoClose: true,
      closeOnClick: true,
      maxWidth: 285,
      className: 'vehicle-cluster-map-popup',
      offset: L.point(0, -18)
    })
      .setLatLng([lat, lng])
      .setContent(popupElement);

    this.vehicleClusterPopup.openOn(this.map);
  }

  createVehicleClusterPopupElement(data: any, vehicleId: string): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'vehicle-popup-card';

    const vehicleNo = data.vehicleno || vehicleId || 'N/A';
    const vehicleClass = data.param31 || data.vehicleClass || data.vehicleclassname || data.vehicleClassName || data.vehicleclass || 'N/A';
    const speed = data.speed ?? 0;
    const ignition = data.ignition || 'N/A';
    const latitude = Number(data.latitude);
    const longitude = Number(data.longitude);
    const speedValue = Number(speed || 0);
    const ignitionClass = ignition === 'On' ? 'is-on' : 'is-off';
    const speedClass = speedValue > 50 ? 'is-fast' : speedValue > 0 ? 'is-moving' : 'is-stop';

    wrapper.innerHTML = `
        <div class="vehicle-popup-card__header">
          <div class="vehicle-popup-card__title">
            <span class="vehicle-popup-card__icon"><i class="fa fa-car"></i></span>
            <div>
              <strong></strong>
              <small class="vehicle-class"></small>
            </div>
          </div>
        </div>
        <div class="vehicle-popup-card__chips">
          <span class="vehicle-popup-card__chip ignition-chip"><i class="fa fa-bolt"></i><b class="ignition"></b></span>
          <span class="vehicle-popup-card__chip speed-chip"><i class="fa fa-tachometer"></i><b class="speed"></b></span>
        </div>
        <div class="vehicle-popup-card__coord">
          <i class="fa fa-map-marker"></i>
          <span>Lat/Lng</span>
          <b></b>
        </div>
        <button type="button" class="vehicle-popup-card__track">
          <i class="fa fa-location-arrow"></i>
          <span>Live Track</span>
        </button>
      `;

    const title = wrapper.querySelector('.vehicle-popup-card__header strong');
    const vehicleClassEl = wrapper.querySelector('.vehicle-class');
    const ignitionEl = wrapper.querySelector('.ignition');
    const speedEl = wrapper.querySelector('.speed');
    const coordEl = wrapper.querySelector('.vehicle-popup-card__coord b');
    const trackButton = wrapper.querySelector('.vehicle-popup-card__track') as HTMLButtonElement | null;
    const ignitionChip = wrapper.querySelector('.ignition-chip');
    const speedChip = wrapper.querySelector('.speed-chip');

    if (title) title.textContent = vehicleNo;
    if (vehicleClassEl) vehicleClassEl.textContent = vehicleClass;
    if (ignitionEl) ignitionEl.textContent = ignition;
    if (speedEl) speedEl.textContent = `${speedValue} km/h`;
    ignitionChip?.classList.add(ignitionClass);
    speedChip?.classList.add(speedClass);
    if (coordEl) {
      coordEl.textContent = `${Number.isFinite(latitude) ? latitude.toFixed(6) : 'N/A'}, ${Number.isFinite(longitude) ? longitude.toFixed(6) : 'N/A'}`;
    }



    return wrapper;
  }

  getVehiclePopupDataFromFeature(properties: any, coordinates: any[]) {
    const speed = properties?.['vehiclespeed'] ?? properties?.['speed'] ?? properties?.['param40'] ?? 0;
    const ignitionValue = properties?.['ignitionstatus'] ?? properties?.['ignition'] ?? properties?.['param45'];
    const ignition = ignitionValue === '1' || ignitionValue === 'On' || Number(speed) > 0 ? 'On' : 'Off';

    return {
      type: 'cluster',
      vehicleno: properties?.['vehicleno'] || properties?.['vehicleregno'] || properties?.['description'] || properties?.['param13'] || 'N/A',
      vehicleClass: properties?.['param31'] || properties?.['vehicleclassname'] || properties?.['vehicleClassName'] || properties?.['vehicleclass'] || 'N/A',
      speed,
      ignition,
      latitude: Number(properties?.['latitude'] ?? properties?.['lat'] ?? properties?.['param38'] ?? coordinates?.[1]),
      longitude: Number(properties?.['longitude'] ?? properties?.['lng'] ?? properties?.['param39'] ?? coordinates?.[0])
    };
  }



  clearPOIMarkers() {
    this.poiMarkers.forEach((marker: L.Marker) => marker.remove());
    this.poiMarkers = [];
  }

  getPOIDetails() {

    this.clearPOIMarkers();

    const data = {
      param5: this.searchPoiText.trim(),
      param8: this.pageNo.toString(),
      param9: this.itemsPerPage.toString()
    };

    this.poiService.getPOIDetails(data).subscribe({
      next: (response: any) => {
        this.poiDetails = response.entity.listData || [];
        if (this.poiDetails.length > 0) {
          this.totalCount = response.entity.param1;
        }
      }
    });
  }

  poiPlot(features: any[]) {
    this.clearPOIMarkers();

    const validCoordinates: [number, number][] = [];

    features.forEach((feature: any) => {
      const coordinates = feature.geometry?.coordinates;
      if (!Array.isArray(coordinates) || coordinates.length < 2) return;

      const lng = Number(coordinates[0]);
      const lat = Number(coordinates[1]);
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;

      validCoordinates.push([lat, lng]);

      const iconUrl = feature.properties?.iconUrl || 'assets/images/mapimages/markers/marker_new.png';
      const icon = L.divIcon({
        className: 'poi-marker',
        html: `<span style="display:block;width:35px;height:35px;background:url('${iconUrl}') center/contain no-repeat;"></span>`,
        iconSize: [35, 35],
        iconAnchor: [18, 35],
        popupAnchor: [0, -30]
      });

      const marker = L.marker([lat, lng], { icon }).addTo(this.map);
      marker.on('click', () => {
        this.showPopup(feature.properties, [lng, lat]);
      });

      this.poiMarkers.push(marker);
    });

    if (validCoordinates.length > 0) {
      const bounds = L.latLngBounds(validCoordinates);
      this.map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    }
  }

 togglePoliceStations(): void {
    if (this.showPoliceStations) {
      this.loadPoliceStations();
    } else {
      this.clearPoliceStationMarkers();
    }
  }


}
