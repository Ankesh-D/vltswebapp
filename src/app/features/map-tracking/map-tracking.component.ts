import { createLeafletBasemap } from '../../shared/components/map-layer-options/map-basemaps';
import { MapLayerOptionsComponent } from '../../shared/components/map-layer-options/map-layer-options.component';
import { Component, OnInit, AfterViewInit, ChangeDetectorRef, OnDestroy, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { VehicleService } from '../../core/services/vehicle.service';
import { RouteService, RouteEntryRequest, RouteUpdateRequest } from '../../core/services/route.service';
import { AlertService } from '../../core/services/alert.service';
import { POIService, POIEntryRequest, POIUpdateRequest } from '../../core/services/poi.service';
import { VehicleGroupService } from '../../core/services/vehicle-group.service';
import { Subscription, interval } from 'rxjs';
import type {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  Point
} from 'geojson';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import localeData from 'dayjs/plugin/localeData';
import isoWeek from 'dayjs/plugin/isoWeek';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { ToastComponent } from '../assets/inactive-assets/toast.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';

import mapboxgl from 'mapbox-gl';
import L from 'leaflet';
import 'leaflet.markercluster';
import * as turf from '@turf/turf';
import { GeofenceService } from '../../core/services/geofence.service';
import { ToastService } from '../../core/services/toast.service';
import { MapScaleUtil } from '../../core/utils/map-scale.util';

dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.extend(localizedFormat);
dayjs.extend(localeData);
dayjs.extend(isoWeek);
dayjs.extend(weekOfYear);

declare var $: any;

@Component({
    selector: 'app-map-tracking',
    imports: [MapLayerOptionsComponent, CommonModule, FormsModule, NgxDaterangepickerMd, NgSelectModule, TimepickerModule],
    templateUrl: './map-tracking.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./map-tracking.component.scss']
})
export class MapTrackingComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  // Map
  map!: any;
  private currentTileLayer: L.TileLayer | L.TileLayer.WMS | null = null;
  private layerRegistry = new Map<string, L.Layer>();
  private popupLayerRegistry = new Map<string, L.Popup>();
  private clusterLayer: L.MarkerClusterGroup | null = null;
  private historyArrowMarkers: L.Marker[] = [];
  private historyRouteLayer: L.Polyline | null = null;
  private geofenceLayers: L.Layer[] = [];
  private liveTrailLayer: L.Polyline | null = null;
  private routeLayer: L.Polyline | null = null;
  private geofenceCircleLayers: L.Layer[] = [];
  private polygonLayer: L.Layer | null = null;

  // Data Sources
  vehiclesData: any[] = [];
  vehiclesGroupData: any[] = [];
  poiDetails: any[] = [];
  routeDetails: any[] = [];
  geoPoiDetails: any[] = [];
  geoRouteDetails: any[] = [];
  DistrictList: any[] = [];
  alertData: any[] = [];
  clusterData: any = null;
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
  trackingOption: string = 'vehicle'; // 'vehicle', 'group', 'district', 'alert', 'poi', 'route'
  searchVehicleText: string = '';
  searchAlertText: string = '';
  searchRouteText: string = '';
  searchPoiText: string = '';
  selectedGroupId: any = null;
  selectedAlertId: any = null;
  alertDate: any = dayjs();
  isAlertLoading = false;
  alertSearchTriggered = false;

  // Live & History
  liveVehicleId: string = '';
  liveData: any;
  historyData: any;
  isLiveTracking = false;
  isHistoryTracking = false;
  liveMarker: any = null;
  historyStartMarker: any = null;
  historyEndMarker: any = null;
  vehicleClusterPopup: any = null;
  animationFrameId: number | null = null;
  livePathCoordinates: any[] = [];
  private liveAlertMarkers: any[] = [];
  private liveAlertKeys = new Set<string>();

  // POI & Route Editing
  poiMarker!: any;
  poiMarkers: any[] = [];
  alertMarker: any = null;
  poiId: string = '';
  latitude: number = 0;
  longitude: number = 0;
  routeCoordinates: any;
  selectedPoiId: any = null;
  selectedRouteId: any = null;
  routeVehicleFilter: 'route' | 'onroute' | 'offroute' = 'route';

  // Intervals & Subscriptions
  private gridInterval: any;
  private liveInterval: any;
  private clusterInterval: any;
  private subscriptions: Subscription[] = [];
  private clusterVehicleEventsBound = false;
  private geofenceClusterMarkers: any[] = [];
  private trackingModeToken = 0;
  // UI State
  isLayersVisible = false;
  isSidePanelOpen = false;
  viewType: string = 'NEW-activated'; // Initialize viewType to 'NEW'
  currentStyle: string = 'openstreet';
  tblviewType: string = 'NEW'; // Initialize viewType to 'NEW'
  isPanelCollapsed = false;

  // History Playback State
  historyDataList: any[] = [];
  historyPlaybackIndex: number = 0;
  isHistoryPlaying: boolean = false;
  historyTimer: any = null;
  speedSliderValue: number = 5;
  vehicleRefreshTimer: any;

  stateCount = 0;
  outstateCount = 0;
  poiData: any = {};
  errorMessage: string | null = null;
  filternameval: string | null = null;
  geofenceOption: 'poi' | 'geofence' | 'route' = 'poi';
  polygonDetails: any[] = [];
  selectedGeofencePoiId: any = null;
  selectedPolygonId: any = null;
  selectedGeofenceRouteId: any = null;
  selectedGeofenceClusterId = '';
  geofenceClusterMode: '' | 'inside' | 'outside' = '';
  selectedDistrictId: any = null;
  showPoliceStations = true;
  private policeStationMarkers: any[] = [];

  constructor(
    private vehicleService: VehicleService,
    private routeService: RouteService,
    private alertService: AlertService,
    private poiService: POIService,
    private vehicleGroupService: VehicleGroupService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private geofenceService: GeofenceService,
    private toast: ToastService
  ) {
    this.toast.pageName = 'Map Tracking'; // Set page name for toast service
  }

  ngOnInit() {
    this.getAlertTypes();
  }

  ngAfterViewInit() {
    this.initializeMap();
    this.initializePlugins();
  }

  ngOnDestroy() {
    if (this.gridInterval) clearInterval(this.gridInterval);
    if (this.vehicleRefreshTimer) {
      clearTimeout(this.vehicleRefreshTimer);
      this.vehicleRefreshTimer = null;
    }
    if (this.liveInterval) clearInterval(this.liveInterval);
    if (this.clusterInterval) clearInterval(this.clusterInterval);

    this.subscriptions.forEach(s => s.unsubscribe());

    if (this.map) {
      this.map.remove();
    }
  }

  initializeMap() {
    if (!this.mapContainer?.nativeElement) {
      this.errorMessage = 'Map container not found.';
      return;
    }

    this.map = L.map(this.mapContainer.nativeElement, {
      center: [22.978624, 87.74780],
      zoom: 10,
      minZoom: 3,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true,
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true,
      inertia: true
    });

    L.control.zoom({ position: 'topright' }).addTo(this.map);
    L.control.scale({ position: 'bottomleft', imperial: false }).addTo(this.map);
    MapScaleUtil.addLeafletPoweredBy(this.map);

    this.changeMapStyle('openstreet');

    const wmsLayer = L.tileLayer.wms('https://vlts.wb.gov.in/geoserver/wbsdcmap/wms?', {
      layers: 'wbsdcmap:india_state',
      format: 'image/png',
      transparent: true,
      version: '1.1.1',
      attribution: 'Powered by DIMTS',
      opacity: 0.35,
      updateWhenIdle: true,
      keepBuffer: 2
    });
    // Load the optional transparent boundary overlay after the base tiles so it
    // never delays the first usable map frame.
    this.currentTileLayer?.once('load', () => wmsLayer.addTo(this.map));
    this.layerRegistry.set('wms-layer', wmsLayer);

    this.setupMapEvents();
    this.loadPoliceStations();
    this.map.whenReady(() => {
      this.trackingOption = 'vehicle';
      const loadClusters = () => this.loadDefaultVehicleClusters();
      // Avoid competing with the initial tile requests and blocking the first
      // interactive map frame with cluster-marker rendering.
      if (this.currentTileLayer) this.currentTileLayer.once('load', loadClusters);
      else loadClusters();
    });
  }

  initializePlugins() {
    try {
      // Legacy jQuery support if needed for specific UI elements not yet migrated
      $(document).ready(() => {
        try {
          if ($.fn && $.fn.select2 && $('.searchable').length > 0) {
            $('.searchable').select2({});
          }
        } catch (err) {
          let msg = 'Select2 init failed.';
          this.errorMessage = msg;

        }
      });
    } catch (e) {
      let msg = e instanceof Error ? e.message : 'jQuery init failed.';
      this.errorMessage = msg;
    }
  }

  loadMapImages() {
    const images = [
      { name: 'car-image', url: 'assets/mapimages/car/green.png' },
      { name: 'poi-image', url: 'assets/images/mapimages/markers/marker_new.png' },
      // Add alert images here as needed
    ];

    images.forEach(img => {
      this.map.loadImage(img.url, (error: any, image: any) => {
        if (error) {
        }
        if (image && !this.map.hasImage(img.name)) {
          this.map.addImage(img.name, image);
        }
      });
    });
  }

  // ==============================option============
  // Tracking Options Change Handler
  // ==========================================
  onTrackingOptionChange(option: string) {
    const nextOption =
      typeof option === 'string'
        ? option
        : (option as any)?.id || this.trackingOption;

    this.trackingOption = nextOption;

    this.clearAllLayers();
    this.resetPagination();
    this.selectedGroupId = null;
    this.selectedDistrictId = null;
    this.selectedAlertId = null;
    this.selectedPoiId = null;
    this.selectedRouteId = null;
    this.selectedGeofencePoiId = null;
    this.selectedPolygonId = null;
    this.selectedGeofenceRouteId = null;
    this.selectedGeofenceClusterId = '';
    this.geofenceClusterMode = '';
    this.routeVehicleFilter = 'route';
    this.vehiclesData = [];
    this.vehiclesGroupData = [];
    this.poiDetails = [];
    this.routeDetails = [];
    this.alertData = [];
    this.errorMessage = null;
    this.clearAllLayers();
    this.removeLayerSource('poisource', 'poilayer');
    this.removeLayerSource('circle-source', 'circle-layer');
    this.clearPOIMarkers();

    switch (this.trackingOption) {
      case 'vehicle':
        this.getAllVehicles();
        this.clusterDataFun();
        break;
      case 'group':
        this.getGroupDetails();
        break;
      case 'district':
        this.loadDistrictList();
        break;
      case 'alert':
        this.alertSearchTriggered = false;
        this.getEmergencyAlert();
        break;
      case 'poi':
        this.getPOIDetails();
        break;
      case 'route':
        this.getRouteDetails();
        break;
      case 'geofence':
        this.selectGeofenceOption(this.geofenceOption || 'poi');
        break;
    }
  }

  // ==========================================
  // UI Interaction Methods
  // ==========================================

  changeMapStyle(style: string) {
    if (!this.map) return;
    this.currentStyle = style === 'openstreet' ? 'streets-v11' : style;
    if (this.currentTileLayer) this.map.removeLayer(this.currentTileLayer);
    this.currentTileLayer = createLeafletBasemap(this.currentStyle).addTo(this.map);
    this.currentTileLayer.bringToBack();
    this.raiseClusterLayers();
  }

  private restoreClustersAfterStyleChange(): void {
    if (!this.map || !this.clusterData || this.isLiveTracking || this.isHistoryTracking) return;

    this.showAllClusters(this.clusterData);
    this.raiseClusterLayers();
  }

  private showOpenStreetBase(): void {
    this.changeMapStyle('openstreet');
  }

  /** Keep vehicle clusters above raster base maps such as OpenStreetMap. */
  private raiseClusterLayers(): void {
    if (!this.map) return;
    this.clusterLayer?.bringToFront();
    this.geofenceClusterMarkers.forEach(marker => marker?.bringToFront?.());
    this.poiMarkers.forEach(marker => marker?.bringToFront?.());
    this.liveMarker?.bringToFront?.();
    this.historyStartMarker?.bringToFront?.();
    this.historyEndMarker?.bringToFront?.();
  }

  toggleLayers() {
    this.isLayersVisible = !this.isLayersVisible;
  }

  hideShowGeoLayers(layerId: string) {
    const layer = this.layerRegistry.get(layerId);
    if (layer) {
      if (this.map.hasLayer(layer)) this.map.removeLayer(layer);
      else layer.addTo(this.map);
    }
  }

  togglePoliceStations(): void {
    if (this.showPoliceStations) {
      this.loadPoliceStations();
    } else {
      this.clearPoliceStationMarkers();
    }
  }

  private getPoliceStationIconSize(): [number, number] {
    if (!this.map || typeof this.map.getZoom !== 'function') {
      return [22, 22];
    }

    const zoom = Number(this.map.getZoom()) || 10;
    const width = Math.max(14, Math.min(30, Math.round(zoom * 1.4)));
    const height = Math.max(18, Math.min(38, Math.round(zoom * 1.8)));
    return [width, height];
  }

  private updatePoliceStationMarkerSize(): void {
    if (!this.showPoliceStations || !this.policeStationMarkers.length) return;

    const [width, height] = this.getPoliceStationIconSize();

    this.policeStationMarkers.forEach((marker: any) => {
      const element = marker?.getElement?.();
      if (element) {
        element.style.width = `${width}px`;
        element.style.height = `${height}px`;
        return;
      }

      const icon = marker?.options?.icon;
      if (icon && marker.setIcon) {
        const nextIcon = L.icon({
          iconUrl: 'assets/mapimages/police-station.png',
          iconSize: [width, height],
          iconAnchor: [Math.round(width / 2), Math.round(height / 2)],
          popupAnchor: [0, -Math.round(height / 2)]
        });
        marker.setIcon(nextIcon);
      }
    });
  }

  openNav() {
    this.isSidePanelOpen = true;
    this.refreshCurrentView();
  }

  closeNav() {
    this.isSidePanelOpen = false;

    if (this.vehicleRefreshTimer) {
      clearTimeout(this.vehicleRefreshTimer);
      this.vehicleRefreshTimer = null;
    }
  }

  refreshVehicle() {
    this.pageNo = 1;
    this.getAllVehicles();
  }

  refreshAlert() {
    this.pageNo = 1;
    this.getEmergencyAlert();
  }

  refreshPoi() {
    this.pageNo = 1;
    this.getPOIDetails();
  }

  refreshRoute() {
    this.pageNo = 1;
    this.getRouteDetails();
  }

  stateFilterData(type: string) {
    const isChecked = (document.getElementById(type) as HTMLInputElement)?.checked;
    if (isChecked) {
      // Logic to show
    } else {
      // Logic to hide
    }
  }

  loadDistrictList() {
    this.routeService.getDistrictList({}).subscribe({
      next: (response: any) => {
        this.DistrictList = response.entity || [];
      },
      error: (err: any) => console.error(err)
    });
  }

  onDistrictChange(eventOrShowLoader: any = true) {
    const showLoader = typeof eventOrShowLoader === 'boolean' ? eventOrShowLoader : true;
    if (eventOrShowLoader && typeof eventOrShowLoader === 'object') {
      this.selectedDistrictId = eventOrShowLoader.param1 || eventOrShowLoader.id || this.selectedDistrictId;
    }

    this.clearClusterLayers();
    this.clusterDataFun(showLoader);
  }

  private getClusterFilterName() {
    if (this.trackingOption === 'geofence') {
      if (!this.selectedGeofenceClusterId) return "";
      if (!this.geofenceClusterMode) return this.geofenceOption;

      const separator = this.geofenceOption === 'route' ? '-' : '@';
      return `${this.geofenceOption}${separator}${this.geofenceClusterMode}`;
    }

    if (this.trackingOption === 'route') {
      return this.selectedRouteId ? this.routeVehicleFilter : "";
    }

    if (this.trackingOption === 'district') {
      return this.selectedDistrictId ? 'district' : "";
    }

    // Default vehicle load intentionally sends param16="vehicle" with an
    // empty param17, as required by the polling API.
    return this.trackingOption === 'vehicle' ? 'vehicle' : "";
  }

  private getClusterFilterValue() {
    if (this.trackingOption === 'geofence') {
      return this.selectedGeofenceClusterId || "";
    }

    if (this.trackingOption === 'district') {
      return this.selectedDistrictId || "";
    }

    if (this.trackingOption === 'route') {
      return this.selectedRouteId || "";
    }

    return "";
  }

  private getFilterClusterFilterName() {
    if (this.trackingOption === 'geofence') {
      if (!this.selectedGeofenceClusterId) return "";
      if (!this.geofenceClusterMode) return this.geofenceOption;

      if (this.geofenceOption === 'route') {
        return this.geofenceClusterMode === 'inside'
          ? 'onroute'
          : 'offroute';
      }

      return `${this.geofenceOption}@${this.geofenceClusterMode}`;
    }

    if (this.trackingOption === 'route') {
      return this.selectedRouteId ? this.routeVehicleFilter : "";
    }

    if (this.trackingOption === 'district') {
      return this.selectedDistrictId ? 'district' : "";
    }

    // Default vehicle load intentionally sends param16="vehicle" with an
    // empty param17, as required by the polling API.
    return this.trackingOption === 'vehicle' ? 'vehicle' : "";
  }

  private loadClusterData(showLoader: boolean = true) {
    const data = this.getFilterClusterRequestData();
    this.vehicleService.getPollingVehicleDetails(data, showLoader).subscribe({
      next: (response: any) => {
        this.clusterData = this.parseClusterData(response);
        this.showAllClusters(this.clusterData);
        if (this.trackingOption === 'district' && this.selectedDistrictId) {
          this.fitMapToClusterData(this.clusterData);
        }
      }
    });
  }

  /** Load the unfiltered vehicle clusters shown when the map first opens. */
  loadDefaultVehicleClusters(): void {
    // "All" must leave the previously selected route/geofence/district mode;
   
    this.clearAllLayers();
    this.clearGeofenceMapLayers();

    this.trackingOption = 'vehicle';
    this.routeVehicleFilter = 'route';
    this.selectedRouteId = null;
    this.selectedDistrictId = null;
    this.selectedGeofenceClusterId = '';
    this.selectedGeofencePoiId = null;
    this.selectedPolygonId = null;
    this.selectedGeofenceRouteId = null;
    this.geofenceClusterMode = '';

    this.pageNo = 1;
    this.resetPagination();
    this.getAllVehicles();

    // Keep the unfiltered request explicit so no previous UI filter can leak
    // into the All-clusters API call.
    const data = {
      param5: '',
      param8: this.viewType,
      param9: '',
      param10: '',
      param11: '',
      param12: '',
      param13: '',
      param14: '',
      param15: '',
      param16: 'vehicle',
      param17: ''
    };

    this.vehicleService.getPollingVehicleDetails(data, true).subscribe({
      next: (response: any) => {
        this.clusterData = this.parseClusterData(response);
        this.showAllClusters(this.clusterData);
      },
      error: (err: any) => console.error('Unable to load default vehicle clusters', err)
    });
  }

   private getFilterClusterRequestData() {
    return {
      "param5": "",//"SEARCHBY",
      "param8": this.viewType,
      "param9": "", //"groupid",
      "param10": "", //"vehicleid",
      "param11": "", //"vehicleclassid",
      "param12": "", //"customerid",
      "param13": "", //"alertid",
      "param14": "", //"rtoid",
      "param15": "", //"vendorid",
      "param16": this.getFilterClusterFilterName(), // filtername
      "param17": this.getClusterFilterValue() // filtervalue
    };
  }


private loadFiltersClusters(): void {
  // Filtered cluster views replace live/history tracking. Reset these flags
  // here as well as in the selection handlers because this method is also
  // called directly when the inside/outside mode changes.
  this.isLiveTracking = false;
  this.isHistoryTracking = false;
  this.isHistoryPlaying = false;

  this.clearClusterLayers();

  const data = this.getFilterClusterRequestData();
  this.vehicleService
    .getPollingVehicleDetails(data, true)
    .subscribe({
      next: (response: any) => {
        try {
          const parsedData = this.parseClusterData(response);
          this.clusterData = parsedData;

          if (!Array.isArray(this.clusterData?.features)) {
            return;
          }

          if (this.clusterData.features.length === 0) {
            return;
          }
          this.showAllFilterClusters(this.clusterData);
          const verifyRenderedLayers = () => {
            this.fitMapToClusterData(this.clusterData);
            this.raiseClusterLayers();
          };

          // Layer creation may be deferred until the selected base style has
          // loaded, so verify after the map lifecycle event instead of using a
          // fixed delay that can fire before showAllClusters renders anything.
          if (this.map?.isStyleLoaded()) {
            this.map.once('idle', verifyRenderedLayers);
          } else {
            this.map?.once('style.load', () => {
              this.map.once('idle', verifyRenderedLayers);
            });
          }
        } catch (error) {
        }
      },
      error: (err: any) => {
      }
    });
}

showAllFilterClusters(clusterData: any): void {
  
  if (!this.map) {
    return;
  }

  if (
    !clusterData ||
    clusterData.type !== 'FeatureCollection' ||
    !Array.isArray(clusterData.features)
  ) {
    return;
  }

  if (clusterData.features.length === 0) {
    return;
  }

  // Geofence cluster plotting time live/history tracking  stop .
  if (this.trackingOption === 'geofence') {
    this.isLiveTracking = false;
    this.isHistoryTracking = false;
    this.isHistoryPlaying = false;

    if (this.historyTimer) {
      clearInterval(this.historyTimer);
      this.historyTimer = null;
    }

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  const renderClusters = (): void => {
    try {
      // Existing cluster source/layers  remove .
      this.clearClusterLayers();

      const validFeatures = clusterData.features.filter((feature: any) => {
        const coordinates = feature?.geometry?.coordinates;

        if (
          feature?.type !== 'Feature' ||
          feature?.geometry?.type !== 'Point' ||
          !Array.isArray(coordinates) ||
          coordinates.length < 2
        ) {
          return false;
        }

        const longitude = Number(coordinates[0]);
        const latitude = Number(coordinates[1]);

        return (
          Number.isFinite(longitude) &&
          Number.isFinite(latitude) &&
          longitude >= -180 &&
          longitude <= 180 &&
          latitude >= -90 &&
          latitude <= 90
        );
      });

      if (!validFeatures.length) {
        return;
      }

     const normalizedClusterData = {
  type: 'FeatureCollection' as const,
  features: validFeatures
};
      this.map.addSource('mainclusterSource', {
        type: 'geojson',
        data: normalizedClusterData,
        cluster: true,
        clusterRadius: 50,
        clusterMaxZoom: 14
      });
      // Cluster circle
      this.map.addLayer({
        id: 'mainclusterLayer',
        type: 'circle',
        source: 'mainclusterSource',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#51bbd6',
            100,
            '#f1f075',
            750,
            '#f28cb1'
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            100,
            30,
            750,
            40
          ],
          'circle-opacity': 1,
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff'
        }
      });

      // Cluster count
      this.map.addLayer({
        id: 'mainclusterPoint',
        type: 'symbol',
        source: 'mainclusterSource',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-size': 14,
          'text-allow-overlap': true,
          'text-ignore-placement': true
        },
        paint: {
          'text-color': '#000000'
        }
      });

      this.raiseClusterLayers();
      // Vehicle icon add .
      const carImage = 'assets/mapimages/car/green.png';

      const addVehicleIconLayer = (): void => {
        if (!this.map.getSource('mainclusterSource')) {
          return;
        }

        if (this.map.getLayer('mainunclusterclusterPoint')) {
          this.map.removeLayer('mainunclusterclusterPoint');
        }

        this.map.addLayer({
          id: 'mainunclusterclusterPoint',
          type: 'symbol',
          source: 'mainclusterSource',
          filter: ['!', ['has', 'point_count']],
          layout: {
            'icon-image': 'statevehicle',
            'icon-size': 0.06,
            'icon-allow-overlap': true,
            'icon-ignore-placement': true
          }
        });

        // Icon successfully add circle hide karein.
        if (this.map.getLayer('mainunclusterFallbackPoint')) {
          this.map.setLayoutProperty(
            'mainunclusterFallbackPoint',
            'visibility',
            'none'
          );
        }

        this.raiseClusterLayers();
      };

      if (this.map.hasImage('statevehicle')) {
        addVehicleIconLayer();
      } else {
        this.map.loadImage(
          carImage,
          (error: any, image: any) => {
            if (error || !image) {
              return;
            }

            if (!this.map.hasImage('statevehicle')) {
              this.map.addImage('statevehicle', image);
            }

            addVehicleIconLayer();
          }
        );
      }

      this.map.once('idle', () => {
        try {
          this.raiseClusterLayers();

          const sourceFeatures = this.map.querySourceFeatures(
            'mainclusterSource'
          );

          const renderedClusters =
            this.map.queryRenderedFeatures(undefined, {
              layers: ['mainclusterLayer']
            });

          const renderedVehicles =
            this.map.queryRenderedFeatures(undefined, {
              layers: this.map.getLayer(
                'mainunclusterclusterPoint'
              )
                ? ['mainunclusterclusterPoint']
                : ['mainunclusterFallbackPoint']
            });

          // Vehicles are already rendered by mainunclusterclusterPoint.
          // Do not add geofence DOM markers here because their unclustered
          // marker is the green dot that appears on top of each vehicle icon.
          this.clearGeofenceClusterMarkers();
        } catch (error) {
        }
      });
    } catch (error) {
    }
  };

  if (this.map.isStyleLoaded()) {
    renderClusters();
    return;
  }

  const waitForStyle = (): void => {
    if (this.map?.isStyleLoaded()) {
      renderClusters();
      return;
    }

    this.map.once('idle', waitForStyle);
  };

  this.map.once('idle', waitForStyle);
}

  // ==========================================
  // Data Fetching Methods
  // ==========================================

  private getVehicleRosterFilterName(): string {
    if (this.trackingOption === 'geofence') {
      if (!this.selectedGeofenceClusterId) return '';
      if (!this.geofenceClusterMode) return this.geofenceOption;

      const separator = this.geofenceOption === 'route' ? '-' : '@';
      return `${this.geofenceOption}${separator}${this.geofenceClusterMode}`;
    }

    return this.trackingOption === 'route' ? this.routeVehicleFilter : this.trackingOption;
  }

  private getVehicleRosterFilterValue(): string {
    if (this.trackingOption === 'geofence') {
      return String(this.selectedGeofenceClusterId || '');
    }

    return this.trackingOption === 'route' ? String(this.selectedRouteId || '') : '';
  }

  getAllVehicles(showLoader: boolean = true) {

    if (this.vehicleRefreshTimer) {
      clearTimeout(this.vehicleRefreshTimer);
    }

    const data = {
      param1: this.searchVehicleText,
      param2: this.pageNo.toString(),
      param3: this.itemsPerPage.toString(),
      param8: '',//groupid
      param9: '',    //speed
      param10: this.tblviewType,    //vehicletype -> new/old
      param11: "activated",
      param12: this.getVehicleRosterFilterName(), // route/onroute/offroute when Route Details is active
      param13: this.getVehicleRosterFilterValue() // selected route id
    };

    this.vehicleService
      .getVehicleRosterDetailsByGroupId(data, showLoader).subscribe({
        next: (response: any) => {
          this.vehiclesData = response.entity.listData || [];
          if (this.vehiclesData.length > 0) {
            this.totalCount = response.entity.param1;
            this.firstRowCount = this.vehiclesData[0].param1;
            this.lastRowCount = this.vehiclesData[this.vehiclesData.length - 1].param1;
            this.lastPageNo = Math.ceil(this.totalCount / this.itemsPerPage);
          } else {
            this.resetPagination();
          }

          if (this.isSidePanelOpen && this.trackingOption === 'vehicle') {
            this.vehicleRefreshTimer = setTimeout(() => {
              this.getAllVehicles(false);
            }, 60000); // 1 minute interval
          }
          this.cdr.detectChanges();
        },
        error: (err: any) => console.error(err)
      });
  }

  getGroupVehicles() {
    this.clearAllLayers();
    if (!this.selectedGroupId) return;

    const data = {
      param1: '',
      param2: this.pageNo.toString(),
      param3: this.itemsPerPage.toString(),
      param8: this.selectedGroupId,
      param9: '',
      param10: '',
      param11: "activated",
      param12: this.getVehicleRosterFilterName(),
      param13: this.getVehicleRosterFilterValue()
    };

    this.vehicleService.getVehicleRosterDetailsByGroupId(data).subscribe({
      next: (response: any) => {
        const entity = response?.entity;
        const groupRows = entity?.listData || entity || response?.listData || response || [];
        this.vehiclesGroupData = Array.isArray(groupRows) ? groupRows : [];

        if (this.vehiclesGroupData.length > 0) {
          this.totalCount = entity?.param1 || this.vehiclesGroupData.length;
          this.firstRowCount = this.vehiclesGroupData[0].param1;
          this.lastRowCount = this.vehiclesGroupData[this.vehiclesGroupData.length - 1].param1;
          this.lastPageNo = Math.ceil(this.totalCount / this.itemsPerPage);
        } else {
          this.resetPagination();
        }

        this.cdr.detectChanges();
      }
    });
  }

  getEmergencyAlert(showLoader: boolean = true) {
    if (this.isAlertLoading) return;

    this.alertSearchTriggered = true;
    this.isAlertLoading = true;
    this.vehiclesData = [];
    this.alertData = [];
    const data = {
      param1: this.searchAlertText,
      param2: this.pageNo,
      param3: this.itemsPerPage,
      param4: this.formatPickerDate(this.alertDate),
      param5: this.selectedAlertId,
      param7: "All",
      pdfexcel: ""
    };
    this.alertService.getAlertDetailVehicles(data, showLoader).subscribe({
      next: (response: any) => {
        this.alertData = response.entity.listData || [];
        if (this.alertData.length > 0) {
          this.totalCount = response.entity.param1;
        } else {
          this.resetPagination();
        }
        this.isAlertLoading = false;
      },
      error: (err: any) => {
        this.isAlertLoading = false;
      }
    });
  }

  private formatPickerDate(dateValue: any): string {
    const selectedDate = dateValue?.startDate || dateValue;

    if (!selectedDate) {
      return '';
    }

    if (typeof selectedDate.format === 'function') {
      return selectedDate.format('DD-MMM-YYYY');
    }

    return dayjs(selectedDate).isValid() ? dayjs(selectedDate).format('DD-MMM-YYYY') : '';
  }

  getPOIDetails() {
    this.removeLayerSource('poisource', 'poilayer');
    this.removeLayerSource('circle-source', 'circle-layer');
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
        } else {
          this.resetPagination();
        }
      }
    });
  }

  onPoiChange(selectedPoiValue?: any) {
    this.clearAllLayers();
    this.removeLayerSource('poisource', 'poilayer');
    this.removeLayerSource('circle-source', 'circle-layer');
    this.clearPOIMarkers();

    if (!this.poiDetails.length) {
      return;
    }

    const selectedId =
      selectedPoiValue?.param1 ||
      selectedPoiValue?.param2 ||
      selectedPoiValue ||
      this.selectedPoiId;

    this.selectedPoiId = selectedId;

    const selectedPois = selectedId
      ? this.poiDetails.filter((poi: any) =>
          String(poi.param1) === String(selectedId) ||
          String(poi.param2) === String(selectedId) ||
          String(poi.param3) === String(selectedId) ||
          String(poi.param6) === String(selectedId)
        )
      : this.poiDetails;

    if (selectedPois.length > 0) {
      const poiFeatureArray = selectedPois.map((poi: any) => ({
        type: 'Feature',
        properties: {
          type: "poi",
          longitude: poi.param8,
          latitude: poi.param7,
          poiname: poi.param3 || poi.param6,
          poirange: poi.param9,
          iconUrl: poi.param5 || 'assets/images/mapimages/markers/marker_new.png'
        },
        geometry: {
          type: 'Point',
          coordinates: [Number(poi.param8), Number(poi.param7)]
        }
      }));

      this.poiPlot(poiFeatureArray);
      // this.circlePlot(selectedPois);
    }
  }

  getGeofencePOIDetails() {
    this.removeLayerSource('poisource', 'poilayer');
    this.removeLayerSource('circle-source', 'circle-layer');
    this.clearPOIMarkers();

    const data = {
      param5: "",
      param8: "",
      param9: ""
    };

    this.poiService.getPOIDetails(data).subscribe({
      next: (response: any) => {
        this.geoPoiDetails = response.entity.listData || [];
        if (this.geoPoiDetails.length > 0) {
          this.totalCount = response.entity.param1;
        } else {
          this.resetPagination();
        }
      }
    });
  }

  getRouteDetails() {
    this.removeLayerSource('routesource', 'routelayer');

    const data = {
      param1: this.searchRouteText.trim(),
      param2: this.pageNo.toString(),
      param3: this.itemsPerPage.toString()
    };

    this.routeService.getRouteDetails(data).subscribe({
      next: (response: any) => {
        this.routeDetails = response.entity.listData || [];
        if (this.routeDetails.length > 0) {
          this.totalCount = response.entity.param1;
        } else {
          this.resetPagination();
        }
      }
    });
  }

  onRouteChange(selectedRouteValue?: any) {
    const routeId = selectedRouteValue?.param2 || selectedRouteValue || this.selectedRouteId;
    this.selectedRouteId = routeId;

    if (!routeId) {
      this.removeLayerSource('routesource', 'routelayer');
      this.vehiclesData = [];
      this.routeVehicleFilter = 'route';
      this.resetPagination();
      return;
    }

    const selectedRoute = this.routeDetails.find((route: any) => String(route.param2) === String(routeId));
    if (!selectedRoute) {
      this.errorMessage = 'Selected route details not found.';
      return;
    }

    // A newly selected route should show its on-route vehicles by default in
    // both the table and map, and keep the On-route button selected.
    this.routeVehicleFilter = 'onroute';
    this.pageNo = 1;
    this.vehiclesData = [];
    this.showRoute(selectedRoute);
    this.getAllVehicles();
    this.clusterDataFun();
  }

  setRouteVehicleFilter(filter: 'onroute' | 'offroute'): void {
    if (!this.selectedRouteId) return;

    this.routeVehicleFilter = filter;
    this.pageNo = 1;
    this.clearClusterLayers();
    this.getAllVehicles();
    this.clusterDataFun();
  }

  selectGeofenceOption(option: 'poi' | 'geofence' | 'route') {
    this.clearGeofenceMapLayers();
    this.clearClusterLayers();
    this.geofenceOption = option;
    this.selectedGeofencePoiId = null;
    this.selectedPolygonId = null;
    this.selectedGeofenceRouteId = null;
    this.selectedGeofenceClusterId = '';
    this.geofenceClusterMode = 'inside';

    if (option === 'poi') {
      this.getGeofencePOIDetails();
    } else if (option === 'geofence') {
      this.loadGeofencePolygonList();
    } else if (option === 'route') {
      this.loadGeofenceRouteList();
    }
  }

  clearGeofenceMapLayers() {
    if (!this.map) return;

    this.geofenceCircleLayers.forEach(layer => this.map.removeLayer?.(layer));
    this.geofenceCircleLayers = [];
    if (this.polygonLayer) {
      this.map.removeLayer?.(this.polygonLayer);
      this.polygonLayer = null;
    }
    if (this.routeLayer && this.isLeafletMapInstance()) {
      this.map.removeLayer(this.routeLayer);
      this.routeLayer = null;
    }
    this.removeLayerSource('poisource', 'poilayer');
    this.removeLayerSource('circle-source', 'circle-layer');
    this.clearPOIMarkers();
    this.removeLayerSource('routesource', 'routelayer');
    this.removeLayerSource('polygon-source', 'polygon-fill-layer');
    this.removeLayerSource('polygon-line-source', 'polygon-line-layer');
  }

  loadGeofencePolygonList() {
    this.geofenceService.getGeofenceDetails({
      param1: '',
      param2: '',
      param3: '',
      param4: '',
      param5: ''
    }).subscribe({
      next: (response: any) => {
        const entity = response?.entity;
        const geofenceRows = entity?.listData || entity || response?.listData || [];
        this.polygonDetails = Array.isArray(geofenceRows)
          ? geofenceRows.map((geofence: any, index: number) => ({
            ...geofence,
            param1: geofence.geofenceid || geofence.id || geofence.param2 || String(index + 1),
            param2: geofence.geofencename || geofence.name || geofence.geofenceName || geofence.param3 || `Geofence ${index + 1}`,
            rawGeofenceId: geofence.geofenceid || geofence.id || geofence.param2 || String(index + 1)
          }))
          : [];
      },
      error: (err: any) => console.error(err)
    });
  }

  loadGeofenceRouteList() {
    const data = {
      param1: '',
      param2: '',
      param3: '',
      param5: '',
      param8: '',
      param9: ''
    };

    this.routeService.getRouteDetails(data).subscribe({
      next: (response: any) => {
        this.geoRouteDetails = response.entity?.listData || [];
      },
      error: (err: any) => console.error(err)
    });
  }

  onGeofencePoiChange(selectedPoi?: any): void {
  this.clearGeofenceMapLayers();
  this.clearClusterLayers();

  this.selectedGeofenceClusterId = String(
    this.selectedGeofencePoiId || ''
  );

  if (!this.selectedGeofencePoiId) {
    return;
  }

  // Cluster rendering 
  this.isLiveTracking = false;
  this.isHistoryTracking = false;
  this.isHistoryPlaying = false;

  this.geofenceOption = 'poi';
  this.geofenceClusterMode = 'inside';

  const poi = selectedPoi || this.geoPoiDetails.find(
    (item: any) =>
      String(item.param2) === String(this.selectedGeofencePoiId)
  );

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
  this.loadFiltersClusters();

  // Bind the vehicles matching the same POI inside/outside filter in the
  // left-side table.
  this.pageNo = 1;
  this.vehiclesData = [];
  this.getAllVehicles();
}

  onPolygonChange() {
    this.clearGeofenceMapLayers();
    if (!this.selectedPolygonId) return;

    const selectedPolygon = this.polygonDetails.find((polygon: any) =>
      String(polygon.rawGeofenceId || polygon.geofenceid || polygon.param1) === String(this.selectedPolygonId)
    );
    const geofenceId = selectedPolygon?.rawGeofenceId || selectedPolygon?.geofenceid || selectedPolygon?.param1 || this.selectedPolygonId;
    this.selectedGeofenceClusterId = String(geofenceId || '');

    this.geofenceService.getGeofenceDetails({
      param1: '',    // searchby
      param2: '',
      param3: '',
      param4: '', // vehicleid
      param5: String(geofenceId) // geofenceid
    }).subscribe({
      next: (response: any) => {
        const entity = response?.entity;
        const rows = entity?.listData || entity || response?.listData || [];
        const detailRows = Array.isArray(rows) ? rows : [rows];
        const selectedDetail = detailRows.find((item: any) =>
          String(item?.geofenceid || item?.param2 || item?.param1 || item?.id) === String(geofenceId)
        ) || detailRows[0] || {};

        const geofenceForPlot = {
          ...(selectedPolygon || {}),
          ...selectedDetail
        };
        const geojson = this.getGeofenceGeometry(geofenceForPlot);

        if (geojson) {
          this.plotSelectedPolygon(geojson);
          this.loadFiltersClusters();
          return;
        }

        this.plotGeofenceFromListFallback(selectedPolygon, true);
      },
      error: (err: any) => {
        this.plotGeofenceFromListFallback(selectedPolygon, true);
      }
    });
  }

  plotGeofenceFromListFallback(selectedPolygon: any, refreshClusters = false) {
    const geojson = this.getGeofenceGeometry(selectedPolygon);
    if (geojson) {
      this.plotSelectedPolygon(geojson);
      if (refreshClusters) {
        this.loadFiltersClusters();
      }
      return;
    }
  }

  setGeofenceClusterMode(mode: 'inside' | 'outside') {
    this.geofenceClusterMode = mode;

    if (this.trackingOption === 'geofence' && this.selectedGeofenceClusterId) {
      this.loadFiltersClusters();
      this.pageNo = 1;
      this.vehiclesData = [];
      this.getAllVehicles();
    }
  }

  getGeofenceGeometry(geofence: any): any {
    if (!geofence) return null;

    const geometryValue =
      geofence.geometry ||
      geofence.geojson ||
      geofence.geofencejson ||
      geofence.geofencecoordinates ||
      geofence.coordinates ||
      geofence.latlng ||
      geofence.param5 ||
      geofence.coord ||
      geofence.coord1 ||
      geofence.param6 ||
      geofence.param7 ||
      geofence.param4;

    if (!geometryValue) return null;

    let parsedGeometry = geometryValue;
    if (typeof parsedGeometry === 'string') {
      try {
        parsedGeometry = JSON.parse(parsedGeometry);
      } catch {
        const coordinates = this.parseGeofenceCoordinateString(parsedGeometry);
        return coordinates.length >= 4 ? { type: 'Polygon', coordinates: [coordinates] } : null;
      }
    }

    if (parsedGeometry.type === 'FeatureCollection') {
      const feature = parsedGeometry.features?.[0];
      if (!feature) return null;

      const geometry = this.normalizeGeofenceGeometry(feature.geometry, geofence);
      return geometry ? { ...feature, geometry } : null;
    }

    if (parsedGeometry.type === 'LineString') {
      const coordinates = this.normalizePolygonRing(parsedGeometry.coordinates);
      return coordinates.length >= 4 ? { type: 'Polygon', coordinates: [coordinates] } : null;
    }

    if (parsedGeometry.type === 'Point') {
      return this.createCirclePolygonFromPoint(parsedGeometry, geofence);
    }

    if (parsedGeometry.type === 'Feature') {
      const geometry = this.normalizeGeofenceGeometry(parsedGeometry.geometry, geofence);
      return geometry ? { ...parsedGeometry, geometry } : null;
    }

    if (parsedGeometry.type === 'Polygon' || parsedGeometry.type === 'MultiPolygon') {
      return this.normalizeGeofenceGeometry(parsedGeometry, geofence);
    }

    if (Array.isArray(parsedGeometry)) {
      const coordinates = this.normalizePolygonRing(parsedGeometry);
      return {
        type: 'Polygon',
        coordinates: coordinates.length >= 4 ? [coordinates] : parsedGeometry
      };
    }

    if (parsedGeometry.coordinates) {
      return this.normalizeGeofenceGeometry(parsedGeometry, geofence);
    }

    return null;
  }

  normalizeGeofenceGeometry(geometry: any, geofence: any = {}): any {
    if (!geometry) return null;

    if (geometry.type === 'LineString') {
      const ring = this.normalizePolygonRing(geometry.coordinates);
      return ring.length >= 4 ? { type: 'Polygon', coordinates: [ring] } : null;
    }

    if (geometry.type === 'Polygon') {
      const ring = this.normalizePolygonRing(geometry.coordinates?.[0] || geometry.coordinates);
      return ring.length >= 4 ? { type: 'Polygon', coordinates: [ring] } : null;
    }

    if (geometry.type === 'MultiPolygon') {
      return geometry;
    }

    if (geometry.type === 'Point' && geometry.coordinates) {
      return this.createCirclePolygonFromPoint(geometry, geofence);
    }

    if (Array.isArray(geometry.coordinates)) {
      const ring = this.normalizePolygonRing(geometry.coordinates);
      return ring.length >= 4 ? { type: 'Polygon', coordinates: [ring] } : null;
    }

    return null;
  }

  createCirclePolygonFromPoint(geometry: any, geofence: any): any {
    const radiusMeters = Number(geofence?.radius ?? geofence?.param7 ?? geofence?.geofenceradius ?? 0);
    const coordinates = geometry?.coordinates;

    if (!Array.isArray(coordinates) || coordinates.length < 2 || !Number.isFinite(radiusMeters) || radiusMeters <= 0) {
      return null;
    }

    const circle = turf.circle([Number(coordinates[0]), Number(coordinates[1])], radiusMeters / 1000, {
      steps: 64,
      units: 'kilometers'
    });

    return circle.geometry;
  }

  normalizePolygonRing(value: any): number[][] {
    if (!Array.isArray(value)) return [];

    const flattened = Array.isArray(value[0]?.[0]) ? value[0] : value;
    const ring = flattened
      .map((point: any) => {
        if (Array.isArray(point) && point.length >= 2) {
          const first = Number(point[0]);
          const second = Number(point[1]);
          return Math.abs(first) <= 90 && Math.abs(second) > 90 ? [second, first] : [first, second];
        }

        const lat = Number(point?.lat ?? point?.latitude);
        const lng = Number(point?.lng ?? point?.lon ?? point?.longitude);
        return [lng, lat];
      })
      .filter((point: number[]) => Number.isFinite(point[0]) && Number.isFinite(point[1]));

    if (ring.length > 2) {
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        ring.push([...first]);
      }
    }

    return ring;
  }

  parseGeofenceCoordinateString(value: string): number[][] {
    const ring = value
      .split(/[|;]/)
      .map(pair => {
        const [first, second] = pair.split(',').map(item => Number(item.trim()));
        if (!Number.isFinite(first) || !Number.isFinite(second)) return null;

        return Math.abs(first) <= 90 && Math.abs(second) > 90
          ? [second, first]
          : [first, second];
      })
      .filter((point: number[] | null): point is number[] => !!point);

    if (ring.length > 2) {
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        ring.push([...first]);
      }
    }

    return ring;
  }

  onGeofenceRouteChange() {
    this.clearGeofenceMapLayers();
    this.selectedGeofenceClusterId = String(this.selectedGeofenceRouteId || '');
    if (!this.selectedGeofenceRouteId) {
      this.clearClusterLayers();
      return;
    }

    const selectedRoute = this.geoRouteDetails.find((route: any) =>
      String(route.param2) === String(this.selectedGeofenceRouteId)
    );
    if (!selectedRoute) return;

    this.showRoute(selectedRoute);
    this.loadFiltersClusters();
  }

  plotSelectedPolygon(geojson: any) {
    if (this.isLeafletMapInstance()) {
      if (this.polygonLayer) {
        this.map.removeLayer(this.polygonLayer);
        this.polygonLayer = null;
      }

      const polygonFeature = geojson.type === 'Feature'
        ? geojson
        : { type: 'Feature', geometry: geojson, properties: {} };
      const geometry = polygonFeature.geometry;
      const boundsPoints: [number, number][] = [];

      if (geometry?.type === 'Polygon') {
        const latLngs = (geometry.coordinates?.[0] || [])
          .filter((coord: any[]) => Array.isArray(coord) && coord.length >= 2)
          .map((coord: any[]) => [Number(coord[1]), Number(coord[0])] as [number, number])
          .filter(([lat, lng]: [number, number]) => Number.isFinite(lat) && Number.isFinite(lng));

        if (!latLngs.length) return;
        this.polygonLayer = L.polygon(latLngs, {
          color: '#15803d',
          weight: 3,
          fillColor: '#86efac',
          fillOpacity: 0.22
        }).addTo(this.map);
        boundsPoints.push(...latLngs);
      } else if (geometry?.type === 'MultiPolygon') {
        const polygons = geometry.coordinates
          .map((polygon: any) =>
            (polygon?.[0] || [])
              .filter((coord: any[]) => Array.isArray(coord) && coord.length >= 2)
              .map((coord: any[]) => [Number(coord[1]), Number(coord[0])] as [number, number])
              .filter(([lat, lng]: [number, number]) => Number.isFinite(lat) && Number.isFinite(lng))
          )
          .filter((polygon: [number, number][]) => polygon.length > 0);

        if (!polygons.length) return;
        this.polygonLayer = L.polygon(polygons, {
          color: '#15803d',
          weight: 3,
          fillColor: '#86efac',
          fillOpacity: 0.22
        }).addTo(this.map);
        polygons.forEach((polygon: [number, number][]) => boundsPoints.push(...polygon));
      }

      if (boundsPoints.length) {
        this.map.fitBounds(L.latLngBounds(boundsPoints), { padding: [40, 40] });
      }
      return;
    }

    this.removeLayerSource('polygon-source', 'polygon-fill-layer');
    this.removeLayerSource('polygon-line-source', 'polygon-line-layer');

    const polygonFeature = geojson.type === 'Feature'
      ? geojson
      : { type: 'Feature', geometry: geojson, properties: {} };

    this.map.addSource('polygon-source', {
      type: 'geojson',
      data: polygonFeature
    });

    this.map.addLayer({
      id: 'polygon-fill-layer',
      type: 'fill',
      source: 'polygon-source',
      paint: {
        'fill-color': '#22c55e',
        'fill-opacity': 0.22
      }
    });

    this.map.addSource('polygon-line-source', {
      type: 'geojson',
      data: polygonFeature
    });

    this.map.addLayer({
      id: 'polygon-line-layer',
      type: 'line',
      source: 'polygon-line-source',
      paint: {
        'line-color': '#15803d',
        'line-width': 3
      }
    });

    const coordinates = polygonFeature.geometry?.coordinates?.flat(2) || [];
    if (coordinates.length >= 2) {
      const points = polygonFeature.geometry.coordinates.flat(Infinity);
      const lngLatPairs: any[] = [];
      for (let i = 0; i < points.length; i += 2) {
        lngLatPairs.push([Number(points[i]), Number(points[i + 1])]);
      }
      const validPairs = lngLatPairs.filter(pair => !isNaN(pair[0]) && !isNaN(pair[1]));
      if (validPairs.length > 0) {
        const bounds = new mapboxgl.LngLatBounds(validPairs[0], validPairs[0]);
        validPairs.forEach(pair => bounds.extend(pair));
        this.map.fitBounds(bounds, { padding: 50, maxZoom: 16 });
      }
    }
  }

  getGroupDetails() {
    const data = { param1: "", param2: "", param3: "", param8: "" };
    this.vehicleGroupService.getVehicleGroupDetails(data).subscribe({
      next: (res: any) => {
        this.groupList = res.entity.listData || [];
      },
      error: (err: any) => console.error(err)
    });
  }

  getAlertTypes() {
    this.alertService.getAlertTypeDetails().subscribe({
      next: (res: any) => {
        this.alertTypeList = res.entity || [];
      },
      error: (err: any) => console.error(err)
    });
  }

  getRouteList() {
    // Implement service call to fetch route list
  }

  getPoiList() {
    // Implement service call to fetch POI list
  }

  // ==========================================
  // Map Plotting
  // ==========================================

  poiPlot(features: any[]) {
    this.clearPOIMarkers();

    if (this.isLeafletMapInstance()) {
      const validLatLngs: [number, number][] = [];

      features.forEach((feature: any) => {
        const coordinates = feature.geometry?.coordinates;
        if (!Array.isArray(coordinates) || coordinates.length < 2) return;

        const lng = Number(coordinates[0]);
        const lat = Number(coordinates[1]);
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;

        const marker = L.marker([lat, lng], {
          icon: L.icon({
            iconUrl: feature.properties?.iconUrl || 'assets/images/mapimages/markers/marker_new.png',
            iconSize: [24, 30],
            iconAnchor: [12, 30],
            popupAnchor: [0, -24]
          })
        }).addTo(this.map);

        marker.on('click', () => {
          this.showPopup(feature.properties, [lng, lat]);
        });

        this.poiMarkers.push(marker);
        validLatLngs.push([lat, lng]);
      });

      if (validLatLngs.length === 1) {
        this.map.setView(validLatLngs[0], 16);
      } else if (validLatLngs.length > 1) {
        this.map.fitBounds(L.latLngBounds(validLatLngs), { padding: [40, 40] });
      }

      return;
    }

    this.map.addSource('poisource', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: features }
    });

    const validCoordinates = features
      .map((feature: any) => feature.geometry?.coordinates)
      .filter((coordinates: any) =>
        Array.isArray(coordinates) &&
        coordinates.length >= 2 &&
        !isNaN(Number(coordinates[0])) &&
        !isNaN(Number(coordinates[1]))
      );

    features.forEach((feature: any) => {
      const coordinates = feature.geometry?.coordinates;
      if (!Array.isArray(coordinates) || coordinates.length < 2) return;

      const lng = Number(coordinates[0]);
      const lat = Number(coordinates[1]);
      if (isNaN(lng) || isNaN(lat)) return;

      const el = document.createElement('div');
      el.className = 'poi-marker';
      el.style.backgroundImage = `url(${feature.properties?.iconUrl || 'assets/images/mapimages/markers/marker_new.png'})`;
      el.style.width = '35px';
      el.style.height = '35px';
      el.style.backgroundSize = 'contain';
      el.style.backgroundRepeat = 'no-repeat';
      el.style.backgroundPosition = 'center';
      el.style.cursor = 'pointer';

      const marker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .addTo(this.map);

      el.addEventListener('click', () => {
        this.showPopup(feature.properties, [lng, lat]);
      });

      this.poiMarkers.push(marker);
    });

    if (validCoordinates.length > 0) {
      const bounds = new mapboxgl.LngLatBounds(validCoordinates[0], validCoordinates[0]);
      validCoordinates.forEach((coordinates: any) => bounds.extend(coordinates));
      this.map.fitBounds(bounds, { padding: 60, maxZoom: 16 });
    }
  }

  circlePlot(circleData: any[]) {
    const circleFeatures = circleData.reduce((features: any[], c: any) => {
      const longitude = Number(c.param8);
      const latitude = Number(c.param7);
      const radiusKm = Number(c.param9);

      if (!Number.isFinite(longitude) || !Number.isFinite(latitude) ||
          !Number.isFinite(radiusKm) || radiusKm <= 0) {
        return features;
      }

      const center = turf.point([longitude, latitude]);
      features.push(turf.circle(center, radiusKm, {
        steps: 50,
        units: 'kilometers'
      } as any));
      return features;
    }, []);

    if (!circleFeatures.length) return;

    if (this.isLeafletMapInstance()) {
      this.geofenceCircleLayers.forEach(layer => this.map.removeLayer?.(layer));
      this.geofenceCircleLayers = [];

      const boundsPoints: [number, number][] = [];
      circleFeatures.forEach((feature: any) => {
        const latLngs = (feature?.geometry?.coordinates?.[0] || [])
          .filter((coord: any[]) => Array.isArray(coord) && coord.length >= 2)
          .map((coord: any[]) => [Number(coord[1]), Number(coord[0])] as [number, number])
          .filter(([lat, lng]: [number, number]) => Number.isFinite(lat) && Number.isFinite(lng));

        if (!latLngs.length) return;

        const layer = L.polygon(latLngs, {
          color: '#6366f1',
          weight: 1,
          fillColor: '#93c5fd',
          fillOpacity: 0.28
        }).addTo(this.map);

        this.geofenceCircleLayers.push(layer);
        boundsPoints.push(...latLngs);
      });

      if (boundsPoints.length) {
        this.map.fitBounds(L.latLngBounds(boundsPoints), { padding: [40, 40] });
      }
      return;
    }

    this.map.addSource('circle-source', {
      type: 'geojson',
      data: turf.featureCollection(circleFeatures)
    });

    this.map.addLayer({
      id: 'circle-layer',
      type: 'fill',
      source: 'circle-source',
      paint: {
        'fill-color': 'lightblue',
        'fill-opacity': 0.4,
        'fill-outline-color': 'blue'
      }
    });

    const bounds = turf.bbox(turf.featureCollection(circleFeatures));
    this.map.fitBounds(
      [[bounds[0], bounds[1]], [bounds[2], bounds[3]]],
      { padding: 60, maxZoom: 16 }
    );
  }

  routePlot(features: any[]) {
    if (!this.map || !features.length) return;

    if (this.isLeafletMapInstance()) {
      if (this.routeLayer) {
        this.map.removeLayer(this.routeLayer);
        this.routeLayer = null;
      }

      const latLngs = features
        .flatMap((feature: any) => this.getRouteCoordinates(feature?.geometry))
        .filter((coord: any) => Array.isArray(coord) && coord.length >= 2)
        .map((coord: any[]) => [Number(coord[1]), Number(coord[0])] as [number, number])
        .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));

      if (!latLngs.length) {
        return;
      }

      this.routeLayer = L.polyline(latLngs, {
        color: '#dc2626',
        weight: 5,
        opacity: 0.9
      }).addTo(this.map);
      return;
    }

    const data = { type: 'FeatureCollection', features: features };
    if (this.map.getLayer('routelayer')) {
      this.map.removeLayer('routelayer');
    }

    const existingSource = this.map.getSource('routesource') as mapboxgl.GeoJSONSource | undefined;

    if (existingSource) {
      existingSource.setData(data as any);
    } else {
      this.map.addSource('routesource', {
        type: 'geojson',
        data: data as any
      });
    }

    if (!this.map.getLayer('routelayer')) {
      this.map.addLayer({
        id: 'routelayer',
        type: 'line',
        source: 'routesource',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#dc2626', 'line-width': 5 }
      });
    }
  }

  // ==========================================
  // Live Tracking
  // ==========================================

  serialNo: any; imeiNo: any; vendor: any; iccidno: any; vehicleno: any; customerName: any;

  showLiveTrack(vehicleData: any) {
    this.liveVehicleId = vehicleData.param2;
    const preserveSelectedRoute = this.trackingOption === 'route' && !!this.selectedRouteId;
    this.clearAllLayers(false, preserveSelectedRoute);
    const requestToken = ++this.trackingModeToken;
    this.isHistoryTracking = false;
    this.isLiveTracking = true;
    this.livePathCoordinates = [];

    const fetchLive = (showLoader: boolean = false) => {
      this.vehicleService.getLiveTrack(this.liveVehicleId, showLoader).subscribe({
        next: (response: any) => {
          if (requestToken !== this.trackingModeToken || !this.isLiveTracking) return;
          if (!response.entity || response.entity.length === 0) return;

          this.liveData = response.entity[0];
          const coords = [Number(this.liveData.param39), Number(this.liveData.param38)];
          if (!this.isWithinIndiaBounds(coords[0], coords[1])) return;

          if (this.livePathCoordinates.length === 0) {
            if (this.isLeafletMapInstance()) {
              this.map.setView([coords[1], coords[0]], 14);
            } else {
              this.map.flyTo({ center: coords as [number, number], essential: true, zoom: 14 });
            }
            this.livePathCoordinates.push(coords);

            // Create initial marker
            if (this.isLeafletMapInstance()) {
              this.liveMarker = L.marker([coords[1], coords[0]], {
                icon: L.icon({
                  iconUrl: 'assets/mapimages/car/green.png',
                  iconSize: [26, 32],
                  iconAnchor: [13, 16]
                })
              }).addTo(this.map);
            } else {
              const el = document.createElement('div');
              el.className = 'live-marker';
              el.style.backgroundImage = 'url(assets/mapimages/car/green.png)';
              el.style.width = '40px';
              el.style.height = '40px';
              el.style.backgroundSize = 'contain';
              el.style.backgroundRepeat = 'no-repeat';
              el.style.backgroundPosition = 'center';

              this.liveMarker = new mapboxgl.Marker(el)
                .setLngLat(coords as [number, number])
                .setRotation(Number(this.liveData.param43) || 0)
                .addTo(this.map);
            }
            this.plotLiveAlert(this.liveData);

            this.drawLiveTrail(this.livePathCoordinates);
            this.serialNo = this.liveData.param5;
            this.imeiNo = this.liveData.param4;
            this.vendor = this.liveData.param9;
            this.iccidno = this.liveData.param6;
            this.vehicleno = this.liveData.param13;
            this.customerName = this.liveData.param25;

            const popupData = {
              type: 'live',
              vehicleno: this.liveData.param13,
              speed: this.liveData.param40,
              pollingdate: this.liveData.param35,
              ignition: this.liveData.param45 === '1' ? 'On' : 'Off',
              latitude: Number(this.liveData.param38),
              longitude: Number(this.liveData.param39),
              gpsStatus: this.liveData.param41 === '1' ? 'Active' : 'Inactive',
              customerName: this.liveData.param25,
              serialNo: this.liveData.param5,
              imeiNo: this.liveData.param4,
              vendor: this.liveData.param9,
              iccidno: this.liveData.param6,
            };



            this.showPopup(popupData, coords);
          } else {
            this.animateMarkerTo(coords as [number, number], Number(this.liveData.param43) || 0, this.liveData);
            // Update popup data if panel is open
            if (this.poiData && this.poiData.type === 'live') {
              this.poiData.speed = this.liveData.param40;
              this.poiData.pollingdate = this.liveData.param35;
              this.poiData.latitude = Number(this.liveData.param38);
              this.poiData.longitude = Number(this.liveData.param39);

            }
          }
        }
      });
    };

    fetchLive();
    this.liveInterval = setInterval(fetchLive, 10000);
  }

  private plotLiveAlert(data: any): void {
    const alertId = String(data?.param47 || '').trim();
    const alertName = String(data?.param48 || '').trim();
    const lng = Number(data?.param39); const lat = Number(data?.param38);
    if (!alertId || alertId === '01' || !alertName || alertName.toLowerCase() === 'na' || !Number.isFinite(lat) || !Number.isFinite(lng) || !this.isWithinIndiaBounds(lng, lat)) return;
    const key = `${alertId}|${data?.param35 || ''}|${lat}|${lng}`;
    if (this.liveAlertKeys.has(key)) return;
    this.liveAlertKeys.add(key);

    const popupContent = this.createAlertPopupContent(alertName, alertId, data?.param13, data?.param35, data?.param40, lat, lng);
    let marker: any;

    if (this.isLeafletMapInstance()) {
      marker = L.marker([lat, lng], {
        icon: L.icon({
          iconUrl: this.getLiveAlertIcon(alertName),
          iconSize: [23, 23],
          iconAnchor: [15, 15]
        })
      }).bindPopup(popupContent, { maxWidth: 230 }).addTo(this.map);
    } else {
      const el = document.createElement('div');
      el.style.width = '23px'; el.style.height = '23px'; el.style.cursor = 'pointer';
      el.style.background = `url('${this.getLiveAlertIcon(alertName)}') center/contain no-repeat`;
      marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([lng, lat]).setPopup(new mapboxgl.Popup({ offset: 28, className: 'tracking-alert-popup', maxWidth: '230px' }).setDOMContent(popupContent)).addTo(this.map);
    }

    this.liveAlertMarkers.push(marker);
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

  animateMarkerTo(targetLngLat: [number, number], targetRotation: number, livePoint?: any) {
    if (!this.liveMarker) return;

    if (this.isLeafletMapInstance()) {
      this.liveMarker.setLatLng([targetLngLat[1], targetLngLat[0]]);
      this.livePathCoordinates.push(targetLngLat);
      this.drawLiveTrail(this.livePathCoordinates);
      if (livePoint) this.plotLiveAlert(livePoint);
      return;
    }

    const startLngLat = this.liveMarker.getLngLat();
    const startLng = startLngLat.lng;
    const startLat = startLngLat.lat;
    const startTime = performance.now();
    const duration = 10000; // 10 seconds to match polling interval for smooth movement

    // If coordinates haven't changed, don't animate
    if (startLng === targetLngLat[0] && startLat === targetLngLat[1]) {
      if (livePoint) this.plotLiveAlert(livePoint);
      return;
    }

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const currentLng = startLng + (targetLngLat[0] - startLng) * progress;
      const currentLat = startLat + (targetLngLat[1] - startLat) * progress;

      if (this.liveMarker) {
        this.liveMarker.setLngLat([currentLng, currentLat]);
        this.liveMarker.setRotation(targetRotation);
      }

      // Draw trail smoothly following the vehicle
      const currentPath = [...this.livePathCoordinates, [currentLng, currentLat]];
      this.drawLiveTrail(currentPath);

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.animationFrameId = null;
        this.livePathCoordinates.push(targetLngLat);
        this.drawLiveTrail(this.livePathCoordinates);
        if (livePoint) this.plotLiveAlert(livePoint);
      }
    };

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.animationFrameId = requestAnimationFrame(animate);
  }

  drawLiveTrail(coordinates: any[]) {
    if (!this.map || coordinates.length < 2) return;

    if (this.isLeafletMapInstance()) {
      const latLngs = coordinates
        .filter((coord: any[]) => Array.isArray(coord) && coord.length >= 2 && this.isWithinIndiaBounds(Number(coord[0]), Number(coord[1])))
        .map((coord: any[]) => [Number(coord[1]), Number(coord[0])] as [number, number]);

      if (latLngs.length < 2) return;

      if (!this.liveTrailLayer) {
        this.liveTrailLayer = L.polyline(latLngs, {
          color: '#0f9d58',
          weight: 4,
          opacity: 0.9
        }).addTo(this.map);
      } else {
        this.liveTrailLayer.setLatLngs(latLngs);
      }

      return;
    }

    const sourceId = 'liveroutesource';
    const layerId = 'liveroutelayer';
    const arrowLayerId = 'livearrowlayer';

    const geojson: any = {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: coordinates },
      properties: {}
    };

    if (this.map.getSource(sourceId)) {
      (this.map.getSource(sourceId) as any).setData(geojson);
    } else {
      this.map.addSource(sourceId, { type: 'geojson', data: geojson });

      this.map.addLayer({
        id: 'liveroutelayer',
        type: 'line',
        source: 'liveroutesource',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#009C4E', 'line-width': 4 }
      });

      // Add direction arrows layer with new pattern
      this.map.addLayer({
        id: arrowLayerId,
        type: 'symbol',
        source: sourceId,
        layout: {
          'symbol-placement': 'line',
          'symbol-spacing': 50,
          'text-field': '➤',
          'text-size': 16,
          'text-allow-overlap': true,
          'text-ignore-placement': true,
          'text-keep-upright': false
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#015C2F',
          'text-halo-width': 2
        }
      });
    }
  }

  trackAlert(item: any) {
    this.clearAllLayers();
    const lat = Number(item.param6);
    const lng = Number(item.param7);
    const alertIconUrl = this.getAlertIconUrl(item);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return;
    }

    if (this.isLeafletMapInstance()) {
      this.map.setView([lat, lng], 12);
    } else {
      this.map.flyTo({
        center: [lng, lat],
        zoom: 12,
        essential: true
      });
    }

    const alertFeature = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      properties: {
        type: "alert",
        vehicleno: item.param9,
        alertname: item.param8,
        eventtime: item.param3,
        speed: item.param21,
        latitude: lat,
        longitude: lng,
        imeino: item.param4,
        ignition: item.param20 === '1' ? 'On' : 'Off',
        iconUrl: alertIconUrl
      }
    };

    this.plotAlertMarker(alertFeature, alertIconUrl);
    this.showPopup(alertFeature.properties, [lng, lat]);
  }

  private plotAlertMarker(alertFeature: any, iconUrl: string) {
    if (this.alertMarker) {
      this.alertMarker.remove();
    }

    const [lng, lat] = alertFeature.geometry.coordinates;

    if (this.isLeafletMapInstance()) {
      const markerHtml = `
        <div style="display:flex;flex-direction:column;align-items:center;min-width:74px;cursor:pointer;">
          <div style="background-image:url(${iconUrl});width:34px;height:34px;background-size:contain;background-repeat:no-repeat;background-position:center;"></div>
          <div style="margin-top:2px;padding:1px 5px;background:rgba(255,255,255,.96);border:1px solid #94a3b8;border-radius:10px;color:#0f172a;font-size:9px;font-weight:700;line-height:12px;text-align:center;box-shadow:0 2px 8px rgba(15,23,42,.16);white-space:nowrap;max-width:110px;overflow:hidden;text-overflow:ellipsis;">
            ${alertFeature.properties.alertname || ''}
          </div>
        </div>
      `;

      this.alertMarker = L.marker([lat, lng], {
        icon: L.divIcon({
          html: markerHtml,
          className: 'leaflet-alert-marker',
          iconSize: [74, 48],
          iconAnchor: [17, 24]
        })
      }).addTo(this.map);

      this.alertMarker.on('click', () => {
        this.showPopup(alertFeature.properties, [lng, lat]);
      });
      return;
    }

    const el = document.createElement('div');
    el.className = 'alert-marker';
    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    el.style.alignItems = 'center';
    el.style.width = '150px';
    el.style.cursor = 'pointer';

    const iconEl = document.createElement('div');
    iconEl.style.backgroundImage = `url(${iconUrl})`;
    iconEl.style.width = '36px';
    iconEl.style.height = '36px';
    iconEl.style.backgroundSize = 'contain';
    iconEl.style.backgroundRepeat = 'no-repeat';
    iconEl.style.backgroundPosition = 'center';

    const labelEl = document.createElement('div');
    labelEl.innerText = alertFeature.properties.alertname || '';
    labelEl.style.marginTop = '2px';
    labelEl.style.padding = '1px 5px';
    labelEl.style.background = 'rgba(255, 255, 255, 0.95)';
    labelEl.style.border = '1px solid #444';
    labelEl.style.borderRadius = '3px';
    labelEl.style.color = '#111';
    labelEl.style.fontSize = '10px';
    labelEl.style.fontWeight = '600';
    labelEl.style.lineHeight = '13px';
    labelEl.style.textAlign = 'center';
    labelEl.style.boxShadow = '0 1px 3px rgba(0,0,0,0.25)';
    labelEl.style.whiteSpace = 'normal';

    el.appendChild(iconEl);
    el.appendChild(labelEl);

    this.alertMarker = new mapboxgl.Marker(el)
      .setLngLat([lng, lat])
      .addTo(this.map);

    el.addEventListener('click', () => {
      this.showPopup(alertFeature.properties, [lng, lat]);
    });
  }

  private getAlertIconUrl(item: any): string {
    const alertName = (item.param8 || item.param13 || '').toLowerCase().trim();
    const normalizedAlertName = alertName.replace(/[^a-z0-9]/g, '');
    const alertIconMap: Record<string, string> = {
      'overspeed': 'assets/images/mapimages/alertimage/overspeed_new.png',
      'over speed': 'assets/images/mapimages/alertimage/overspeed_new.png',
      'panic': 'assets/images/mapimages/alertimage/panic.png',
      'tamper': 'assets/images/mapimages/alertimage/tamper.png',
      'tilt': 'assets/images/mapimages/alertimage/tilt.png',
      'low battery': 'assets/images/mapimages/alertimage/batterylow.png',
      'internal battery low removed': 'assets/images/mapimages/alertimage/interbnalbattrylow.png',
      'main battery disconnect': 'assets/images/mapimages/alertimage/powerDisconnect.png',
      'power disconnect': 'assets/images/mapimages/alertimage/powerDisconnect.png',
      'main battery reconnect': 'assets/images/mapimages/alertimage/batterycharge.png',
      'ignition on': 'assets/images/mapimages/alertimage/ignitionOn.png',
      'ignition off': 'assets/images/mapimages/alertimage/ignitionOff.png',
      'harsh acceleration': 'assets/images/mapimages/alertimage/harshacceleration_new.png',
      'harsh brake': 'assets/images/mapimages/alertimage/harshbrake_new.png',
      'rush turning': 'assets/images/mapimages/alertimage/Rashturning.png',
      'rash turning': 'assets/images/mapimages/alertimage/Rashturning.png',
      'geofence entry': 'assets/images/mapimages/alertimage/geofenceentry.png',
      'geofence exit': 'assets/images/mapimages/alertimage/geofenceexit.png',
      'route deviation': 'assets/images/mapimages/alertimage/routedev3.png'
    };
    const normalizedAlertIconMap: Record<string, string> = {
      overspeed: 'assets/images/mapimages/alertimage/overspeed_new.png',
      panic: 'assets/images/mapimages/alertimage/panic.png',
      tamper: 'assets/images/mapimages/alertimage/tamper.png',
      tilt: 'assets/images/mapimages/alertimage/tilt.png',
      lowbattery: 'assets/images/mapimages/alertimage/batterylow.png',
      internalbatterylowremoved: 'assets/images/mapimages/alertimage/interbnalbattrylow.png',
      mainbatterydisconnect: 'assets/images/mapimages/alertimage/powerDisconnect.png',
      powerdisconnect: 'assets/images/mapimages/alertimage/powerDisconnect.png',
      mainbatteryreconnect: 'assets/images/mapimages/alertimage/batterycharge.png',
      ignitionon: 'assets/images/mapimages/alertimage/ignitionOn.png',
      ignitionoff: 'assets/images/mapimages/alertimage/ignitionOff.png',
      harshacceleration: 'assets/images/mapimages/alertimage/harshacceleration_new.png',
      harshbrake: 'assets/images/mapimages/alertimage/harshbrake_new.png',
      rushturning: 'assets/images/mapimages/alertimage/Rashturning.png',
      rashturning: 'assets/images/mapimages/alertimage/Rashturning.png',
      rashturn: 'assets/images/mapimages/alertimage/Rashturning.png',
      roughturning: 'assets/images/mapimages/alertimage/Rashturning.png',
      geofenceentry: 'assets/images/mapimages/alertimage/geofenceentry.png',
      geofenceexit: 'assets/images/mapimages/alertimage/geofenceexit.png',
      routedeviation: 'assets/images/mapimages/alertimage/routedev3.png'
    };
    const assetNameIconMap: Record<string, string> = {
      alertbell: 'assets/images/mapimages/alertimage/alertbell.png',
      alertbellnew: 'assets/images/mapimages/alertimage/alertbell_new.png',
      interbnalbattrylow: 'assets/images/mapimages/alertimage/interbnalbattrylow.png',
      internalbatterylow: 'assets/images/mapimages/alertimage/interbnalbattrylow.png',
      batterycharge: 'assets/images/mapimages/alertimage/batterycharge.png',
      batterylow: 'assets/images/mapimages/alertimage/batterylow.png',
      emergency: 'assets/images/mapimages/alertimage/emergency.png',
      geofenceentry: 'assets/images/mapimages/alertimage/geofenceentry.png',
      geofenceexit: 'assets/images/mapimages/alertimage/geofenceexit.png',
      geofenceout: 'assets/images/mapimages/alertimage/geofenceout.png',
      harshbreak: 'assets/images/mapimages/alertimage/harsh_break.png',
      harshbrake: 'assets/images/mapimages/alertimage/harshbrake_new.png',
      harshacceleration: 'assets/images/mapimages/alertimage/harshacceleration_new.png',
      harshacceln: 'assets/images/mapimages/alertimage/HarshAcceln.png',
      ignitionoff: 'assets/images/mapimages/alertimage/ignitionOff.png',
      ignitionon: 'assets/images/mapimages/alertimage/ignitionOn.png',
      overspeed: 'assets/images/mapimages/alertimage/overspeed_new.png',
      panic: 'assets/images/mapimages/alertimage/panic.png',
      powerdisconnect: 'assets/images/mapimages/alertimage/powerDisconnect.png',
      rashturning: 'assets/images/mapimages/alertimage/Rashturning.png',
      routedev: 'assets/images/mapimages/alertimage/routedev3.png',
      routedeviation: 'assets/images/mapimages/alertimage/routedeviation.png',
      tamper: 'assets/images/mapimages/alertimage/tamper.png',
      tilt: 'assets/images/mapimages/alertimage/tilt.png',
      wiretamper: 'assets/images/mapimages/alertimage/wiretamper.png'
    };

    if (alertIconMap[alertName]) {
      return alertIconMap[alertName];
    }

    if (normalizedAlertIconMap[normalizedAlertName]) {
      return normalizedAlertIconMap[normalizedAlertName];
    }

    if (assetNameIconMap[normalizedAlertName]) {
      return assetNameIconMap[normalizedAlertName];
    }

    const apiIconPath = item.statusimgparam1 || item.param14;

    if (apiIconPath) {
      const fileName = apiIconPath.split('/').pop();
      if (apiIconPath.startsWith('assets/') || apiIconPath.startsWith('http')) {
        return apiIconPath;
      }
      if (fileName) {
        return `assets/images/mapimages/alertimage/${fileName}`;
      }
    }

    return 'assets/images/mapimages/alertimage/alertbell_new.png';
  }

  // ==========================================
  // History Tracking
  // ==========================================

  showHistoryTrack(vehicleNo: string) {
    const isRouteHistory = this.trackingOption === 'route' && !!this.selectedRouteId;
    const selectedRoute = isRouteHistory
      ? this.routeDetails.find((route: any) => String(route?.param2) === String(this.selectedRouteId))
      : null;
    const selectedRouteName = selectedRoute?.param3 || '';
    const fromTimeFormatted = this.poiData.fromTime ? dayjs(this.poiData.fromTime).format('hh:mm A') : '12:00 AM';
    const toTimeFormatted = this.poiData.toTime ? dayjs(this.poiData.toTime).format('hh:mm A') : '11:59 PM';

    const data = {
      param1: vehicleNo,
      param2: $('#historydate').val(),
      param3: fromTimeFormatted,
      param4: toTimeFormatted,
      param5: "",
      param6: "routecheck",
      param7: selectedRouteName,
    };

    this.clearAllLayers(false, isRouteHistory);
    const requestToken = ++this.trackingModeToken;
    this.isHistoryTracking = true;
    this.vehicleService.getVehicleHistory(data).subscribe({

      next: (response: any) => {
        if (requestToken !== this.trackingModeToken) return;
        if (!response || !response.entity || !response.entity.listData || response.entity.listData.length === 0) {
          // Even if listData is empty, we might have param1 (GeoJSON). 
          // We will handle empty listData in displayHistory
        }

        // Filter if data exists, otherwise empty array
        this.historyDataList = (response.entity?.listData || []).filter((item: any) =>
          !isNaN(Number(item.param7)) && !isNaN(Number(item.param8)) && Number(item.param7) !== 0 && Number(item.param8) !== 0
        );

        this.displayHistory(response.entity, vehicleNo, isRouteHistory);
      }
    });
  }

  displayHistory(historyData: any, vehicleNo?: string, plotRouteDeviation = false) {

    if (!historyData || !historyData.param1) return;

    const routeGeoJson = JSON.parse(historyData.param1);
    const coordinates = routeGeoJson.geometry.coordinates;

    // Fallback: If historyDataList is empty but we have a route, generate list from coordinates
    // We also try to merge metadata from the original listData if available, to ensure popup data shows up
    if (this.historyDataList.length === 0 && coordinates && coordinates.length > 0) {
      const rawList = historyData.listData || [];
      this.historyDataList = coordinates.map((coord: any[], index: number) => {
        const rawItem = rawList[index] || {};
        return {
          ...rawItem, // Keep original metadata if available
          param1: vehicleNo || rawItem.param1 || rawItem.param15 || historyData.param15 || 'Vehicle',
          param21: rawItem.param21 || rawItem.param6 || '0',
          param3: rawItem.param3 || 'N/A',
          param20: rawItem.param20 || '0',
          param7: coord[1],
          param8: coord[0],
          param43: rawItem.param43 || '0'
        };
      });
    }

    // Ensure vehicle number is consistent in the list if provided
    if (this.historyDataList.length > 0 && vehicleNo) {
      this.historyDataList.forEach(item => item.param1 = vehicleNo);
    }

    if (this.historyDataList.length > 0) {
      const startItem = this.historyDataList[0];
      this.updateHistoryPanel({
        vehicleno: vehicleNo || startItem.param1 || startItem.param9 || startItem.param15 || 'Vehicle',
        speed: this.getHistorySpeed(startItem),
        time: startItem.param3,
        ignition: startItem.param20 === '1' || startItem.param27 === 'On' ? 'On' : 'Off',
        lat: startItem.param7,
        lng: startItem.param8,
        gpsStatus: startItem.param28 === 'Valid' || startItem.param41 === '1' ? 'Active' : undefined
      });
    }

    if (this.isLeafletMapInstance()) {
      this.displayLeafletHistory(coordinates, vehicleNo);
      return;
    }

    // Safety: Remove existing history layers/sources if they exist to prevent crashes
    if (this.map.getLayer('historylayer')) this.map.removeLayer('historylayer');
    if (this.map.getLayer('history-route-arrow-layer')) this.map.removeLayer('history-route-arrow-layer');
    if (this.map.getSource('historysource')) this.map.removeSource('historysource');

    this.map.addSource('historysource', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [routeGeoJson] }
    });

    this.map.addLayer({
      id: 'historylayer',
      type: 'line',
      source: 'historysource',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': 'orange', 'line-width': 4 }
    });
    this.plotHistoryAlerts(this.historyDataList, vehicleNo);

    const rawHistoryItems = Array.isArray(historyData?.listData) ? historyData.listData : [];
    this.plotHistoryRouteDeviation(
      rawHistoryItems.length >= 2 ? rawHistoryItems : this.historyDataList,
      coordinates,
      plotRouteDeviation
    );

    // Filter valid coordinates to prevent "Invalid LngLat object" error
    const validCoordinates = coordinates.filter((coord: any) =>
      Array.isArray(coord) && coord.length >= 2 && !isNaN(coord[0]) && !isNaN(coord[1])
    );

    if (validCoordinates.length > 0) {
      const bounds = new mapboxgl.LngLatBounds(validCoordinates[0], validCoordinates[0]);
      for (const coord of validCoordinates) { bounds.extend(coord); }
      this.map.fitBounds(bounds, { padding: 20 });
    }

    // Plot Vehicle at Start
    if (this.historyDataList.length > 0) {
      const startItem = this.historyDataList[0];

      // Remove existing marker if any
      if (this.liveMarker) {
        this.liveMarker.remove();
      }

      const el = this.createMarkerElement();
      this.liveMarker = new mapboxgl.Marker(el)
        .setLngLat([Number(startItem.param8), Number(startItem.param7)])
        .setRotation(Number(startItem.param43) || 0)
        .addTo(this.map);
    }

    // Add New Directional Arrows Layer (On the line)
    if (this.map.getLayer('history-route-arrow-layer')) this.map.removeLayer('history-route-arrow-layer');

    this.map.addLayer({
      id: 'history-route-arrow-layer',
      type: 'symbol',
      source: 'historysource',
      layout: {
        'symbol-placement': 'line',
        'symbol-spacing': 50,
        'text-field': '➤',
        'text-size': 16,
        'text-allow-overlap': true,
        'text-ignore-placement': true,
        'text-keep-upright': false
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': '#015C2F',
        'text-halo-width': 2
      }
    });

    // 2. Add Directional Arrows Layer (Individual points)
    const arrowFeatures = this.historyDataList.map((item: any, index: number) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [Number(item.param8), Number(item.param7)]
      },
      properties: {
        index: index,
        heading: Number(item.param43) || 0,
        vehicleno: vehicleNo || item.param1 || item.param9, // Adjust based on API response
        speed: item.param21,
        time: item.param3,
        ignition: item.param9 === '1' ? 'On' : 'Off',
        lat: item.param7,
        lng: item.param8
      }
    }));

    // Safety: Remove existing arrow source/layer
    if (this.map.getLayer('history-arrow-layer')) this.map.removeLayer('history-arrow-layer');
    if (this.map.getSource('history-arrow-source')) this.map.removeSource('history-arrow-source');

    this.map.addSource('history-arrow-source', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: arrowFeatures }
    });

    this.map.addLayer({
      id: 'history-arrow-layer',
      type: 'symbol',
      source: 'history-arrow-source',
      // layout: {
      //   'text-field': '➤',
      //   'text-size': 14,
      //   'text-rotate': ['get', 'heading'],
      //   'text-allow-overlap': true,
      //   'text-ignore-placement': true,
      //   'text-keep-upright': false
      // },
      paint: {
        'text-color': '#000000',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1
      }
    });

    // 4. Add Start and End Icons using Custom Markers (HTML)
    if (this.historyDataList.length > 0) {
      const startItem = this.historyDataList[0];
      const endItem = this.historyDataList[this.historyDataList.length - 1];

      // Create Start Marker
      const startEl = this.createStartEndMarker('start');
      const startPopup = new mapboxgl.Popup({ offset: 25, closeButton: false, className: 'arrow-popup' })
        .setHTML(this.getHistoryPopupHTML('Start Point', startItem));

      this.historyStartMarker = new mapboxgl.Marker(startEl)
        .setLngLat([Number(startItem.param8), Number(startItem.param7)])
        .setPopup(startPopup)
        .addTo(this.map);

      // Create End Marker
      const endEl = this.createStartEndMarker('end');
      const endPopup = new mapboxgl.Popup({ offset: 25, closeButton: false, className: 'arrow-popup' })
        .setHTML(this.getHistoryPopupHTML('End Point', endItem));

      this.historyEndMarker = new mapboxgl.Marker(endEl)
        .setLngLat([Number(endItem.param8), Number(endItem.param7)])
        .setPopup(endPopup)
        .addTo(this.map);
    }
  }

  /** Render history using Leaflet layers. The remaining branch in displayHistory serves legacy Mapbox maps. */
  private displayLeafletHistory(coordinates: any[], vehicleNo?: string): void {
    const latLngs: [number, number][] = coordinates
      .filter((coordinate: any) => Array.isArray(coordinate) && Number.isFinite(Number(coordinate[0])) && Number.isFinite(Number(coordinate[1])))
      .map((coordinate: any) => [Number(coordinate[1]), Number(coordinate[0])]);

    if (!latLngs.length) return;

    if (this.historyRouteLayer) this.map.removeLayer(this.historyRouteLayer);
    this.historyArrowMarkers.forEach(marker => marker.remove());
    this.historyArrowMarkers = [];
    this.liveAlertMarkers.forEach(marker => marker.remove());
    this.liveAlertMarkers = [];
    this.liveAlertKeys.clear();

    this.historyRouteLayer = L.polyline(latLngs, { color: 'orange', weight: 4, lineJoin: 'round', lineCap: 'round' }).addTo(this.map);

    const arrowStep = Math.max(1, Math.ceil((latLngs.length - 1) / 50));
    for (let index = arrowStep; index < latLngs.length; index += arrowStep) {
      const previous = latLngs[index - 1];
      const current = latLngs[index];
      const bearing = turf.bearing(turf.point([previous[1], previous[0]]), turf.point([current[1], current[0]]));
      const arrow = L.marker(current, {
        interactive: false,
        icon: L.divIcon({
          className: 'history-route-arrow-marker',
          html: `<div style="width:16px;height:16px;transform:rotate(${bearing}deg);transform-origin:center;"><svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2L20 20L12 16L4 20Z" fill="#015C2F" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        })
      }).addTo(this.map);
      this.historyArrowMarkers.push(arrow);
    }

    const edgeIcon = (type: 'start' | 'end') => L.divIcon({
      className: `${type}-route-point`,
      html: `<img src="assets/mapimages/${type === 'start' ? 'startpointroute.png' : 'endpointroute.png'}" alt="${type}" style="display:block;width:20px;height:20px;object-fit:contain;" />`,
      iconSize: [20, 20],
      iconAnchor: [10, 18]
    });
    const startItem = this.historyDataList[0];
    const endItem = this.historyDataList[this.historyDataList.length - 1];
    this.historyStartMarker?.remove();
    this.historyEndMarker?.remove();
    this.historyStartMarker = L.marker(latLngs[0], { icon: edgeIcon('start') })
      .bindPopup(this.getHistoryPopupHTML('Start Point', startItem))
      .addTo(this.map);
    this.historyEndMarker = L.marker(latLngs[latLngs.length - 1], { icon: edgeIcon('end') })
      .bindPopup(this.getHistoryPopupHTML('End Point', endItem))
      .addTo(this.map);

    this.plotLeafletHistoryAlerts(this.historyDataList, vehicleNo);
    this.map.fitBounds(L.latLngBounds(latLngs), { padding: [20, 20] });
  }

  private plotLeafletHistoryAlerts(items: any[], vehicleNo?: string): void {
    items.forEach(item => {
      const alertId = String(item?.param12 || '').trim();
      const alertName = String(item?.param13 || '').trim();
      const lat = Number(item?.param7);
      const lng = Number(item?.param8);
      if (!alertId || alertId === '01' || !alertName || alertName.toLowerCase() === 'na' || !Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const icon = L.divIcon({
        className: 'alert-icon-marker',
        html: `<img src="${this.getLiveAlertIcon(alertName)}" alt="${alertName}" style="display:block;width:28px;height:28px;object-fit:contain;" />`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      const marker = L.marker([lat, lng], { icon })
        .bindPopup(this.createAlertPopupContent(alertName, alertId, vehicleNo || item?.param1, item?.param3, this.getHistorySpeed(item), lat, lng))
        .addTo(this.map);
      this.liveAlertMarkers.push(marker);
    });
  }

  private plotHistoryAlerts(items: any[], vehicleNo?: string): void {
    items.forEach(item => {
      const alertId = String(item?.param12 || '').trim();
      const alertName = String(item?.param13 || '').trim();
      const lng = Number(item?.param8); const lat = Number(item?.param7);
      if (!alertId || alertId === '01' || !alertName || alertName.toLowerCase() === 'na' || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const key = `history|${alertId}|${item?.param3 || ''}|${lat}|${lng}`;
      if (this.liveAlertKeys.has(key)) return;
      this.liveAlertKeys.add(key);
      const el = document.createElement('div');
      el.style.width = '28px'; el.style.height = '28px'; el.style.cursor = 'pointer';
      el.style.background = `url('${this.getLiveAlertIcon(alertName)}') center/contain no-repeat`;
      const content = this.createAlertPopupContent(alertName, alertId, vehicleNo || item?.param1, item?.param3, this.getHistorySpeed(item), lat, lng);
      this.liveAlertMarkers.push(new mapboxgl.Marker({ element: el, anchor: 'center' }).setLngLat([lng, lat])
        .setPopup(new mapboxgl.Popup({ offset: 24, className: 'tracking-alert-popup', maxWidth: '230px' }).setDOMContent(content)).addTo(this.map));
    });
  }

  private createAlertPopupContent(name: any, id: any, vehicle: any, time: any, speed: any, lat: number, lng: number): HTMLElement {
    const root = document.createElement('div'); root.className = 'compact-alert-card';
    const header = document.createElement('div'); header.className = 'compact-alert-card__header';
    const badge = document.createElement('span'); badge.className = 'compact-alert-card__badge'; badge.textContent = '!';
    const title = document.createElement('div');
    const strong = document.createElement('strong'); strong.textContent = String(name || 'Alert');
    title.append(strong); header.append(badge, title); root.append(header);
    const body = document.createElement('div'); body.className = 'compact-alert-card__body';
    [['Vehicle', vehicle || '-'], ['Speed', `${Number(speed || 0)} km/h`], ['Time', time || '-'], ['Location', `${lat.toFixed(5)}, ${lng.toFixed(5)}`]].forEach(([label, value]) => {
      const row = document.createElement('div'); const key = document.createElement('span'); const val = document.createElement('b');
      key.textContent = String(label); val.textContent = String(value); row.append(key, val); body.append(row);
    });
    root.append(body); return root;
  }

  /** Blue overlay for OFFROUTE portions, enabled only from Route Details history. */
  private plotHistoryRouteDeviation(historyItems: any[], routeCoordinates: any[], enabled: boolean): void {
    this.removeLayerSource('history-route-deviation-source', 'history-route-deviation-layer');
    if (!enabled || !Array.isArray(historyItems) || historyItems.length < 2) return;

    const normalizeStatus = (value: any) => String(value || '').replace(/[\s_-]/g, '').toUpperCase();
    const isOffRouteStatus = (value: any) => normalizeStatus(value).includes('OFFROUTE');
    const getCoordinate = (item: any, index: number): number[] | null => {
      const candidates = [
        [item?.param8, item?.param7],
        [item?.param5, item?.param4],
        [item?.param26, item?.param25],
        Array.isArray(routeCoordinates?.[index]) ? routeCoordinates[index] : null
      ];

      for (const candidate of candidates) {
        if (!Array.isArray(candidate) || candidate.length < 2) continue;
        const lng = Number(candidate[0]);
        const lat = Number(candidate[1]);
        if (Number.isFinite(lng) && Number.isFinite(lat) && Math.abs(lng) <= 180 && Math.abs(lat) <= 90 && (lng !== 0 || lat !== 0)) {
          return [lng, lat];
        }
      }
      return null;
    };
    const features: any[] = [];

    for (let index = 1; index < historyItems.length; index++) {
      const previous = historyItems[index - 1];
      const current = historyItems[index];
      const previousCoordinate = getCoordinate(previous, index - 1);
      const currentCoordinate = getCoordinate(current, index);
      const isOffRoute = isOffRouteStatus(previous?.param22) || isOffRouteStatus(current?.param22);

      if (previousCoordinate && currentCoordinate && isOffRoute) {
        features.push({
          type: 'Feature',
          properties: { status: 'OFFROUTE' },
          geometry: { type: 'LineString', coordinates: [previousCoordinate, currentCoordinate] }
        });
      }
    }

    if (!features.length) return;

    this.map.addSource('history-route-deviation-source', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features } as any
    });
    this.map.addLayer({
      id: 'history-route-deviation-layer',
      type: 'line',
      source: 'history-route-deviation-source',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#0b58b9', 'line-width': 6, 'line-opacity': 0.96 }
    });
  }

  createStartEndMarker(type: 'start' | 'end') {
    const el = document.createElement('div');
    el.style.width = '24px';
    el.style.height = '24px';
    el.style.cursor = 'pointer';
    el.style.zIndex = '0';
    el.title = type === 'start' ? 'Start Point' : 'End Point';

    const img = new Image();
    img.src = type === 'start' ? 'assets/mapimages/startpointroute.png' : 'assets/mapimages/endpointroute.png';

    img.onload = () => {
      el.style.backgroundImage = `url(${img.src})`;
      el.style.backgroundSize = 'contain';
      el.style.backgroundRepeat = 'no-repeat';
      el.style.backgroundPosition = 'center';
    };

    img.onerror = () => {
      el.innerHTML = type === 'start' ? 'S' : 'E';
      el.style.backgroundColor = type === 'start' ? '#28a745' : '#dc3545';
      el.style.color = 'white';
      el.style.borderRadius = '50%';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.fontWeight = 'bold';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    };

    return el;
  }

  getHistoryPopupHTML(title: string, item: any) {
    return `
<div class="p-2" style=" font-size: 11px; border: 1px solid #bcbcbc; color: #333;
    font-family: sans-serif; min-width: 221px !important; position: relative;">
    <button type="button" onclick="this.closest('.mapboxgl-popup').remove()" 
    style="position: absolute; top: 0; right: 5px; border: none; background: none; font-size: 23px; 
    font-weight: bold; color: #dc3545; cursor: pointer;  padding: 0; z-index: 10;">&times;</button>
    <div style="    background-color: #b4d2c6;
    font-weight: bold;
    font-size: 12px;
    margin-bottom: 5px;
    color: #000000;
    border-bottom: 1px solid #eee;
    padding-bottom: 0px;">${title}</div>
    <!-- Vehicle -->
    <div class="row no-gutters mb-1">
        <div class="col-4 text-muted">Vehicle:</div>
        <div class="col-8 fw-bold">${item.vehicleno || item.param10 || item.param1 || 'N/A'}</div>
    </div>
    
    <!-- Speed -->
    ${(item.speed !== undefined && item.speed !== null) || item.param29 || item.param21 ? `
    <div class="row no-gutters mb-1">
        <div class="col-4 text-muted">Speed:</div>
        <div class="col-8">${item.speed || item.param29 || item.param21} km/hr</div>
    </div>` : ''}

    <!-- Polling DateTime -->
    ${item.pollingdate || item.param3 ? `
    <div class="row no-gutters mb-1">
        <div class="col-4 text-muted">Polling DateTime:</div>
        <div class="col-8">${item.pollingdate || item.param3}</div>
    </div>` : ''}

    ${item.param22 ? `
    <div class="row no-gutters mb-1">
        <div class="col-4 text-muted">Route Status:</div>
        <div class="col-8 fw-bold">${item.param22}</div>
    </div>` : ''}

    <!-- Ignition -->
    ${item.ignition || item.param27 || item.param20 ? `
    <div class="row no-gutters mb-1">
        <div class="col-4 text-muted">Ignition:</div>
        <div class="col-8">
            <span class="badge ${(item.ignition === 'On' || item.param27 === 'On' || item.param20 === '1') ? 'badge-success' : 'badge-danger'}">
                ${item.ignition || item.param27 || (item.param20 === '1' ? 'On' : 'Off')}
            </span>
        </div>
    </div>` : ''}

    <!-- GPS Status -->
    <div class="row no-gutters mb-1">
        <div class="col-4 text-muted">GPS Status:</div>
        <div class="col-8">
            <span class="badge ${(item.gpsStatus === 'Active' || item.param28 === 'Valid' || item.param41 === '1') ? 'badge-success' : 'badge-danger'}">
                ${item.gpsStatus || item.param28 || (item.param41 === '1' ? 'Valid' : 'Invalid')}
            </span>
        </div>
    </div>

    <!-- Customer -->
    <div class="row no-gutters mb-1">
        <div class="col-4 text-muted">Customer:</div>
        <div class="col-8">${item.customerName || item.param18 || item.param25 || 'N/A'}</div>
    </div>

    <!-- Location -->
    ${(item.latitude || item.param25 || item.param7) ? `
    <div class="row no-gutters mb-1">
        <div class="col-4 text-muted">Loc:</div>
        <div class="col-8">${Number(item.latitude || item.param25 || item.param7).toFixed(4)}, ${Number(item.longitude || item.param26 || item.param8).toFixed(4)}</div>
    </div>` : ''}

    <!-- Device Header -->
    <div style="     background-color: #b4d2c6;
    font-weight: bold;
    font-size: 12px;
    margin-bottom: 5px;
    color: #000000;
    border-bottom: 1px solid #eee;
    padding-bottom: 0px;">
        Device Information
    </div>

    <!-- Device Info -->
    <div>   
        <table class="p-2" style="width: 100%; border-collapse: collapse; font-size: 11px; color: #333;">
            <tr>
                <td style="color: #666; padding: 0px 0; width: 32%;">Serial No:</td>
                <td style="color: #333; font-weight: 500; padding: 0px 0; text-align: left;">${item.serialNo || item.param5 || 'N/A'}</td>
            </tr>
            <tr>
                <td style="color: #666; padding: 0px 0; width: 32%;">IMEI No:</td>
                <td style="color: #333; font-weight: 500; padding: 0px 0; text-align: left;">${item.imeiNo || item.param4 || 'N/A'}</td>
            </tr>
            <tr>
                <td style="color: #666; padding: 0px 0; width: 32%;">Vendor:</td>
                <td style="color: #333; font-weight: 500; padding: 0px 0; text-align: left;">${item.vendor || item.param9 || 'N/A'}</td>
            </tr>
            <tr>
                <td style="color: #666; padding: 0px 0; width: 32%;">ICCID:</td>
                <td style="color: #333; font-weight: 500; padding: 0px 0; word-break: break-all; text-align: left;">${item.iccidno || item.param6 || 'N/A'}</td>
            </tr>
        </table>
    </div>
</div>
    `;
  }

  createMarkerElement() {
    const el = document.createElement('div');
    el.className = 'history-marker';
    el.style.width = '35px';
    el.style.height = '35px';

    const img = new Image();
    img.src = 'assets/mapimages/car/green.png';

    img.onload = () => {
      el.style.backgroundImage = `url(${img.src})`;
      el.style.backgroundSize = 'contain';
      el.style.backgroundRepeat = 'no-repeat';
      el.style.backgroundPosition = 'center';
    };

    img.onerror = () => {
      el.style.backgroundColor = '#007bff';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    };

    return el;
  }

  updateHistoryPanel(props: any) {
    const previousData = this.poiData || {};
    this.poiData = {
      ...previousData,
      ...props,
      type: 'history',
      vehicleno: props.vehicleno || previousData.vehicleno,
      speed: props.speed ?? previousData.speed,
      pollingdate: props.time || previousData.pollingdate,
      ignition: props.ignition || previousData.ignition,
      gpsStatus: props.gpsStatus || previousData.gpsStatus,
      customerName: props.customerName || previousData.customerName || '',
      serialNo: this.getValidDeviceField(props.serialNo, previousData.serialNo),
      imeiNo: this.getValidDeviceField(props.imeiNo, previousData.imeiNo),
      vendor: this.getValidDeviceField(props.vendor, previousData.vendor),
      iccidno: this.getValidDeviceField(props.iccidno, previousData.iccidno),
      latitude: props.lat !== undefined ? Number(props.lat) : previousData.latitude,
      longitude: props.lng !== undefined ? Number(props.lng) : previousData.longitude
    };
    this.isPanelCollapsed = false;
    this.cdr.detectChanges();
  }

  getValidDeviceField(primaryValue: any, fallbackValue: any): string {
    if (this.isValidDeviceField(primaryValue)) {
      return String(primaryValue);
    }

    if (this.isValidDeviceField(fallbackValue)) {
      return String(fallbackValue);
    }

    return '';
  }

  isValidDeviceField(value: any): boolean {
    if (value === undefined || value === null) return false;

    const text = String(value).trim();
    if (!text || text === '0' || text.toLowerCase() === 'null' || text.toLowerCase() === 'undefined') {
      return false;
    }

    return !/^-?\d{1,3}\.\d+$/.test(text);
  }

  getHistorySpeed(item: any): any {
    const speedCandidates = [
      item.speed,
      item.param40,
      item.param29,
      item.param21,
      item.param6
    ];

    const speed = speedCandidates.find(value =>
      value !== undefined &&
      value !== null &&
      value !== '' &&
      !isNaN(Number(value))
    );

    return speed ?? 0;
  }

  // ==========================================
  // History Playback Controls
  // ==========================================

  playHistory() {
    if (this.isHistoryPlaying) return;
    if (this.historyPlaybackIndex >= this.historyDataList.length - 1) {
      this.historyPlaybackIndex = 0;
    }

    if (this.isLeafletMapInstance()) {
      if (!this.liveMarker && this.historyDataList.length > 0) {
        const currentPoint = this.historyDataList[this.historyPlaybackIndex];
        this.liveMarker = L.marker([Number(currentPoint.param7), Number(currentPoint.param8)], {
          icon: L.icon({
            iconUrl: 'assets/mapimages/car/green.png',
            iconSize: [26, 32],
            iconAnchor: [13, 16]
          })
        }).addTo(this.map);
      }
      this.isHistoryPlaying = true;
      this.animateHistoryStep();
      return;
    }

    // Create the moving marker if it doesn't exist
    if (!this.liveMarker && this.historyDataList.length > 0) {
      const currentPoint = this.historyDataList[this.historyPlaybackIndex];
      const el = this.createMarkerElement();
      this.liveMarker = new mapboxgl.Marker(el)
        .setLngLat([Number(currentPoint.param8), Number(currentPoint.param7)])
        .setRotation(Number(currentPoint.param43) || 0)
        .addTo(this.map);
    }

    this.isHistoryPlaying = true;

    // Reset arrow visibility to build up trail
    if (this.map.getLayer('history-arrow-layer')) {
      this.map.setFilter('history-arrow-layer', ['<=', ['get', 'index'], this.historyPlaybackIndex]);
    }

    this.animateHistoryStep();
  }

  animateHistoryStep() {
    if (!this.isHistoryPlaying) return;

    if (this.historyPlaybackIndex >= this.historyDataList.length - 1) {
      this.pauseHistory();
      return;
    }

    const startItem = this.historyDataList[this.historyPlaybackIndex];
    const endItem = this.historyDataList[this.historyPlaybackIndex + 1];

    const startLng = Number(startItem.param8);
    const startLat = Number(startItem.param7);
    const endLng = Number(endItem.param8);
    const endLat = Number(endItem.param7);

    // Calculate distance for smooth speed-based animation
    const from = turf.point([startLng, startLat]);
    const to = turf.point([endLng, endLat]);
    const distance = turf.distance(from, to, { units: 'kilometers' } as any);

    // Calculate bearing so vehicle points towards next point (Visual Direction)
    let heading = Number(endItem.param43) || 0;
    if (distance > 0) {
      heading = turf.bearing(from, to);
    }

    // Calculate duration: Distance * Factor / Slider
    // Adjust factor (e.g., 10000) to tune base speed. Higher factor = Slower animation.
    let duration = (distance * 10000) / (this.speedSliderValue || 1);

    // Minimum duration to prevent instant jumps, but fast for very close points
    if (duration < 100) duration = 100;
    if (distance < 0.005) duration = 50; // For stops/duplicate points

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      if (!this.isHistoryPlaying) return;

      const elapsed = currentTime - startTime;
      let progress = elapsed / duration;
      if (progress > 1) progress = 1;

      // Interpolate position
      const currentLng = startLng + (endLng - startLng) * progress;
      const currentLat = startLat + (endLat - startLat) * progress;

      if (this.liveMarker && this.isLeafletMapInstance()) {
        this.liveMarker.setLatLng([currentLat, currentLng]);
      } else if (this.liveMarker) {
        this.liveMarker.setLngLat([currentLng, currentLat]);
        this.liveMarker.setRotation(heading);
      }

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        // Step complete
        this.historyPlaybackIndex++;

        // Update Panel
        this.poiData = {
          ...this.poiData,
          speed: this.getHistorySpeed(endItem),
          pollingdate: endItem.param3,
          latitude: endLat,
          longitude: endLng,
          ignition: endItem.param20 === '1' || endItem.param27 === 'On' ? 'On' : 'Off'
        };

        this.cdr.detectChanges();

        // Update Arrow Filter
        if (!this.isLeafletMapInstance() && this.map.getLayer('history-arrow-layer')) {
          this.map.setFilter('history-arrow-layer', ['<=', ['get', 'index'], this.historyPlaybackIndex]);
        }

        // Next step
        this.animateHistoryStep();
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  pauseHistory() {
    this.isHistoryPlaying = false;
    if (this.historyTimer) {
      clearInterval(this.historyTimer);
      this.historyTimer = null;
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  stopHistory() {
    this.pauseHistory();
    this.historyPlaybackIndex = 0;

    if (this.liveMarker) {
      this.liveMarker.remove();
      this.liveMarker = null;
    }
    if (this.liveTrailLayer) {
      this.map?.removeLayer?.(this.liveTrailLayer);
      this.liveTrailLayer = null;
    }
    this.liveAlertMarkers.forEach(marker => marker.remove());
    this.liveAlertMarkers = [];
    this.liveAlertKeys.clear();
    if (this.historyDataList.length > 0) {
      const item = this.historyDataList[0];
      this.updateHistoryPanel({
        vehicleno: item.param1 || item.param9 || 'N/A',
        speed: this.getHistorySpeed(item),
        time: item.param3,
        ignition: item.param20 === '1' || item.param27 === 'On' ? 'On' : 'Off',
        lat: item.param7,
        lng: item.param8
      });

      // Show all arrows again when stopped
      if (!this.isLeafletMapInstance() && this.map.getLayer('history-arrow-layer')) {
        this.map.setFilter('history-arrow-layer', null);
      }
    }
  }

  restartHistory() {
    this.stopHistory();
    this.playHistory();
  }

  onSpeedChange(event: any) {
    this.speedSliderValue = Number(event.target.value);
    if (this.isHistoryPlaying) {
      this.pauseHistory();
      this.playHistory(); // Restart with new speed
    }
  }

  // ==========================================
  // Clustering
  // ==========================================

  showAllVehicleClusters(): void {
    // The cluster renderer intentionally ignores data while live/history mode is
    // active. "All" exits those modes first so the successful API response is
    // actually rendered on the map.
    this.clearAllLayers();
    this.clusterDataFun();
  }

  clusterDataFun(showLoader: boolean = true) {
    if (
      (this.trackingOption === 'geofence' && this.selectedGeofenceClusterId) ||
      (this.trackingOption === 'district' && this.selectedDistrictId)
    ) {
      this.clearClusterLayers();
    }

    this.loadClusterData(showLoader);
  }

  private isLeafletMapInstance(): boolean {
    return !!this.map && typeof this.map.addLayer === 'function' && typeof this.map.getSource !== 'function';
  }

  private isWithinIndiaBounds(lng: number, lat: number): boolean {
    return lng >= 68 && lng <= 98.5 && lat >= 6 && lat <= 38.5;
  }

  clearClusterLayers() {
    if (!this.map) return;

    this.clearGeofenceClusterMarkers();

    if (this.clusterLayer && this.isLeafletMapInstance()) {
      this.map.removeLayer(this.clusterLayer);
      this.clusterLayer = null;
    }

    if (this.isLeafletMapInstance()) {
      return;
    }

    ['mainunclusterclusterPoint', 'mainunclusterFallbackPoint', 'mainclusterPoint', 'mainclusterLayer'].forEach(layer => {
      if (this.map.getLayer(layer)) {
        this.map.removeLayer(layer);
      }
    });

    if (this.map.getSource('mainclusterSource')) {
      this.map.removeSource('mainclusterSource');
    }

  }

  showAllClusters(clusterData: any) {
    if (this.isLiveTracking || this.isHistoryTracking || !this.map || !clusterData) return;

    if (this.isLeafletMapInstance()) {
      this.renderLeafletClusters(clusterData);
      return;
    }

    const isPoiGeofenceCluster =
      this.trackingOption === 'geofence' && this.geofenceOption === 'poi';

    // A style switch temporarily makes addSource/addLayer unavailable. Keep the
    // response and render it as soon as the selected base style is ready.
    if (!this.map.isStyleLoaded()) {
      this.map.once('style.load', () => {
        if (!this.isLiveTracking && !this.isHistoryTracking) {
          this.showAllClusters(clusterData);
        }
      });
      return;
    }

    // Clear history layers before showing clusters
    if (this.historyTimer) {
      clearInterval(this.historyTimer);
      this.historyTimer = null;
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.isHistoryPlaying = false;
    this.historyPlaybackIndex = 0;

    if (this.liveMarker) { this.liveMarker.remove(); this.liveMarker = null; }
    if (this.historyStartMarker) { this.historyStartMarker.remove(); this.historyStartMarker = null; }
    if (this.historyEndMarker) { this.historyEndMarker.remove(); this.historyEndMarker = null; }

    this.removeLayerSource('historysource', 'historylayer');
    this.removeLayerSource('history-arrow-source', 'history-arrow-layer');
    if (this.map.getLayer('history-route-arrow-layer')) {
      this.map.removeLayer('history-route-arrow-layer');
    }

    // Recreate the source so its clustering options cannot remain stale from a
    // previous vehicle/geofence request. GeoJSONSource#setData only replaces
    // the data; it does not update cluster, clusterRadius or clusterMaxZoom.
    if (this.map.getSource('mainclusterSource')) {
      this.clearClusterLayers();
    }

    const sourceOptions: any = {
      type: 'geojson',
      data: clusterData,
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50
    };

    this.map.addSource('mainclusterSource', sourceOptions);

    this.map.addLayer({
      id: 'mainclusterLayer',
      type: 'circle',
      source: 'mainclusterSource',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#51bbd6',
          100,
          '#f1f075',
          750,
          '#f28cb1'
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20,
          100,
          30,
          750,
          40
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff'
      }
    });

    this.raiseClusterLayers();

    this.map.addLayer({
      id: 'mainclusterPoint',
      type: 'symbol',
      source: 'mainclusterSource',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12
      }
    });

    // mainclusterPoint is added after the first raiseClusterLayers() call.
    // Raise the complete stack once all cluster layers created synchronously
    // so the circle and its count always stay together above map overlays.
    this.raiseClusterLayers();
    this.map.once('idle', () => this.raiseClusterLayers());
    if (this.trackingOption === 'geofence') {
      this.map.once('idle', () => this.renderGeofenceClusterMarkers(clusterData));
    }

    // Load image for unclustered points (individual vehicles)
    const carImage = 'assets/mapimages/car/green.png';
    if (!this.map.hasImage('statevehicle')) {
      this.map.loadImage(carImage, (error: any, image: any) => {
        if (error) {
          return;
        }
        if (!this.map.hasImage('statevehicle')) this.map.addImage('statevehicle', image);
        this.addUnclusteredLayer(
          isPoiGeofenceCluster ? 0.015 : 0.055,
          isPoiGeofenceCluster
        );
      });
    } else {
      this.addUnclusteredLayer(
        isPoiGeofenceCluster ? 0.015 : 0.055,
        isPoiGeofenceCluster
      );
    }
  }

  private renderLeafletClusters(clusterData: any): void {
    const features = Array.isArray(clusterData?.features) ? clusterData.features : [];
    this.clearClusterLayers();

    if (!features.length) {
      return;
    }

    const markers = L.markerClusterGroup({
      maxClusterRadius: 50,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      disableClusteringAtZoom: 15
    });

    features.forEach((feature: any) => {
      if (feature?.geometry?.type !== 'Point') {
        return;
      }

      const coordinates = feature.geometry.coordinates;
      const lng = Number(coordinates?.[0]);
      const lat = Number(coordinates?.[1]);
      if (!Number.isFinite(lng) || !Number.isFinite(lat) || !this.isWithinIndiaBounds(lng, lat)) {
        return;
      }

      const props = feature.properties || {};
      const marker = L.marker([lat, lng], {
        icon: L.icon({
          iconUrl: 'assets/mapimages/car/green.png',
          iconSize: [19, 24],
          iconAnchor: [9.5, 12]
        })
      });

      marker.on('click', () => {
        const popupData = this.getVehiclePopupDataFromFeature(props, [lng, lat]) as any;
        const vehicleId = String(
          props?.['description'] ||
          props?.['param2'] ||
          props?.['vehicleno'] ||
          props?.['vehicleregno'] ||
          popupData.vehicleno ||
          ''
        );
        const popupElement = this.createVehicleClusterPopupElement(popupData, vehicleId);
        marker.bindPopup(popupElement, {
          maxWidth: 285,
          className: 'vehicle-cluster-leaflet-popup'
        }).openPopup();
      });

      markers.addLayer(marker);
    });

    this.clusterLayer = markers;
    this.map.addLayer(markers);
    this.fitMapToClusterData(clusterData);
  }

  private parseClusterData(response: any) {
    const rawClusterData = response?.entity?.clusterData;
    if (!rawClusterData) {
      return {
        type: 'FeatureCollection',
        features: []
      };
    }

    const clusterData = typeof rawClusterData === 'string' ? JSON.parse(rawClusterData) : rawClusterData;
    return this.normalizeClusterCoordinates(clusterData);
  }

  /**
   * Geofence results are rendered as DOM markers as well as Mapbox layers.
   * DOM markers stay above raster/WMS layers, so POI clusters cannot disappear
   * because of style/layer ordering in the legacy map screen.
   */
  private renderGeofenceClusterMarkers(clusterData: any): void {
    if (!this.map || this.trackingOption !== 'geofence') return;

    this.clearGeofenceClusterMarkers();
    const sourceFeatures = this.map.getSource('mainclusterSource')
      ? this.map.querySourceFeatures('mainclusterSource')
      : [];
    const features = sourceFeatures.length ? sourceFeatures : (clusterData?.features || []);
    const seen = new Set<string>();

    features.forEach((feature: any) => {
      if (feature?.geometry?.type !== 'Point') return;
      const coordinates = feature.geometry.coordinates;
      const lng = Number(coordinates?.[0]);
      const lat = Number(coordinates?.[1]);
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;

      const properties = feature.properties || {};
      const count = Number(properties.point_count || 0);
      // Individual vehicles are rendered by their vehicle icon layer.
      // Do not add the legacy green DOM dot for unclustered points.
      if (count <= 0) return;

      const key = count > 0
        ? `cluster-${properties.cluster_id ?? `${lng}-${lat}-${count}`}`
        : `point-${properties.description ?? `${lng}-${lat}`}`;
      if (seen.has(key)) return;
      seen.add(key);

      const element = document.createElement('div');
      element.style.display = 'flex';
      element.style.alignItems = 'center';
      element.style.justifyContent = 'center';
      element.style.border = '2px solid #fff';
      element.style.borderRadius = '50%';
      element.style.boxShadow = '0 1px 5px rgba(0,0,0,.55)';
      element.style.color = '#111';
      element.style.fontWeight = '700';
      element.style.fontSize = '12px';
      element.style.cursor = 'pointer';

      const size = count >= 750 ? 80 : count >= 100 ? 60 : 40;
      element.style.width = `${size}px`;
      element.style.height = `${size}px`;
      element.style.background = count >= 750 ? '#f28cb1' : count >= 100 ? '#f1f075' : '#51bbd6';
      element.textContent = String(count);

      this.geofenceClusterMarkers.push(
        new mapboxgl.Marker({ element, anchor: 'center' }).setLngLat([lng, lat]).addTo(this.map)
      );
    });
  }

  private clearGeofenceClusterMarkers(): void {
    this.geofenceClusterMarkers.forEach(marker => marker.remove());
    this.geofenceClusterMarkers = [];
  }

  private normalizeClusterCoordinates(clusterData: any) {
    if (!clusterData?.features?.length) return clusterData;

    clusterData.features = clusterData.features.map((feature: any) => {
      if (feature?.geometry?.type !== 'Point' || !Array.isArray(feature.geometry.coordinates)) {
        return feature;
      }

      const first = Number(feature.geometry.coordinates[0]);
      const second = Number(feature.geometry.coordinates[1]);
      if (!Number.isFinite(first) || !Number.isFinite(second)) {
        return feature;
      }

      const looksLikeLatLng = first >= 5 && first <= 40 && second >= 60 && second <= 100;
      feature.geometry.coordinates = looksLikeLatLng ? [second, first] : [first, second];
      return feature;
    }).filter((feature: any) => {
      if (feature?.geometry?.type !== 'Point') return true;

      const coordinates = feature.geometry.coordinates;
      if (!Array.isArray(coordinates) || coordinates.length < 2) return false;

      const lng = Number(coordinates[0]);
      const lat = Number(coordinates[1]);
      return Number.isFinite(lng) && Number.isFinite(lat) &&
        lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90 &&
        this.isWithinIndiaBounds(lng, lat);
    });

    return clusterData;
  }

 private fitMapToClusterData(clusterData: any): void {
  if (!this.map || !Array.isArray(clusterData?.features)) {
    return;
  }

  const coordinates: [number, number][] =
    clusterData.features
      .map((feature: any) => {
        const coordinate = feature?.geometry?.coordinates;

        if (!Array.isArray(coordinate) || coordinate.length < 2) {
          return null;
        }

        const longitude = Number(coordinate[0]);
        const latitude = Number(coordinate[1]);

        if (
          !Number.isFinite(longitude) ||
          !Number.isFinite(latitude) ||
          longitude < -180 ||
          longitude > 180 ||
          latitude < -90 ||
          latitude > 90
        ) {
          return null;
        }

        return [longitude, latitude] as [number, number];
      })
      .filter(
        (coordinate: [number, number] | null):
          coordinate is [number, number] => coordinate !== null
      );

  if (!coordinates.length) {
    return;
  }

  if (this.isLeafletMapInstance()) {
    if (coordinates.length === 1) {
      this.map.setView([coordinates[0][1], coordinates[0][0]], 15);
      return;
    }

    const bounds = L.latLngBounds(coordinates.map(([lng, lat]) => [lat, lng] as [number, number]));
    this.map.fitBounds(bounds, { padding: [40, 40] });
    return;
  }

  if (coordinates.length === 1) {
    this.map.easeTo({
      center: coordinates[0],
      zoom: 15,
      duration: 500
    });

    return;
  }

  const bounds = new mapboxgl.LngLatBounds();

  coordinates.forEach((coordinate) => {
    bounds.extend(coordinate);
  });

  this.map.fitBounds(bounds, {
    padding: 80,
    maxZoom: 15,
    duration: 500
  });
}

  addUnclusteredLayer(
    iconSize: number = 0.055,
    hideFallbackPoint: boolean = false
  ) {

    if (this.map.getLayer('mainunclusterclusterPoint')) return;

    this.map.addLayer({
      id: 'mainunclusterclusterPoint',
      type: 'symbol',
      source: 'mainclusterSource',
      filter: ['!', ['has', 'point_count']],
      layout: {
        'icon-image': 'statevehicle',
        'icon-size': iconSize,
        'icon-ignore-placement': true,
        'icon-allow-overlap': true
      }
    });

    if (
      hideFallbackPoint &&
      this.map.getLayer('mainunclusterFallbackPoint')
    ) {
      this.map.setLayoutProperty(
        'mainunclusterFallbackPoint',
        'visibility',
        'none'
      );
    }

    this.raiseClusterLayers();

    if (this.clusterVehicleEventsBound) return;
    this.clusterVehicleEventsBound = true;

    // Handle click on individual vehicle
    this.map.on('click', 'mainunclusterclusterPoint', (e: any) => {
      if (this.isLiveTracking) { return; }
      const features = this.map.queryRenderedFeatures(e.point, { layers: ['mainunclusterclusterPoint'] });
      if (!features.length) return;

      const feature = features[0];
      if (feature.geometry.type !== 'Point') { return; }
      const coordinates = feature.geometry.coordinates.slice();
      // The vehicle ID is usually stored in the 'description' property in your GeoJSON
      const props = feature.properties || {};
      const vehicleId = props['description'] || props['vehicleno'] || props['vehicleregno'] || props['param2'] || props['param13'];

      if (vehicleId) {
        this.vehicleService.getLiveTrack(vehicleId).subscribe({
          next: (response) => {
            if (response.status && response.entity && response.entity.length > 0) {
              const data = response.entity[0];
              const popupData = {
                type: 'cluster',
                vehicleno: data.param13,
                vehicleClass: data.param31 || data.vehicleclassname || data.vehicleClassName || data.vehicleclass || 'N/A',
                speed: data.param40,
                pollingdate: data.param35, // Consistent with live tracking
                ignition: data.param45 === '1' ? 'On' : 'Off',
                latitude: Number(data.param38),
                longitude: Number(data.param39),
                // Add missing device info
                gpsStatus: data.param41 === '1' ? 'Active' : 'Inactive',
                customerName: data.param25,
                serialNo: data.param5,
                imeiNo: data.param4,
                vendor: data.param9,
                iccidno: data.param6,
              };
              this.showVehicleClusterPopup(popupData, coordinates, vehicleId);
              return;
            }

            this.showVehicleClusterPopup(this.getVehiclePopupDataFromFeature(props, coordinates), coordinates, vehicleId);
          },
          error: () => {
            this.showVehicleClusterPopup(this.getVehiclePopupDataFromFeature(props, coordinates), coordinates, vehicleId);
          }
        });
      }
    });

    this.map.on('mouseenter', 'mainunclusterclusterPoint', () => { this.map.getCanvas().style.cursor = 'pointer'; });
    this.map.on('mouseleave', 'mainunclusterclusterPoint', () => { this.map.getCanvas().style.cursor = ''; });
  }

  private loadPoliceStations(): void {
    this.clearPoliceStationMarkers();
    if (!this.showPoliceStations) return;

    this.alertService.getPoliceStationDetails({ param1: '', param2: 1, param3: 20 }).subscribe({
      next: (response: any) => {
        const stations = response?.entity?.listData;
        if (!this.map || !this.showPoliceStations || !Array.isArray(stations)) return;
        const [width, height] = this.getPoliceStationIconSize();
        stations.forEach((station: any) => {
          const lat = Number(station?.param9); const lng = Number(station?.param10);
          if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return;

          if (this.isLeafletMapInstance()) {
            const leafletMarker = L.marker([lat, lng], {
              icon: L.icon({
                iconUrl: 'assets/mapimages/police-station.png',
                iconSize: [width, height],
                iconAnchor: [Math.round(width / 2), Math.round(height / 2)],
                popupAnchor: [0, -Math.round(height / 2)]
              })
            }).bindPopup(this.createPoliceStationPopup(station, lat, lng), {
              maxWidth: 235,
              className: 'police-station-popup leaflet-police-popup'
            }).addTo(this.map);

            this.policeStationMarkers.push(leafletMarker);
            return;
          }

          const el = document.createElement('div');
          el.className = 'police-station-map-marker';
          el.style.width = `${width}px`;
          el.style.height = `${height}px`;
          el.style.cursor = 'pointer';
          el.style.background = "url('assets/mapimages/police-station.png') center/contain no-repeat";
          const popup = new mapboxgl.Popup({ offset: 24, className: 'police-station-popup', maxWidth: '235px' })
            .setDOMContent(this.createPoliceStationPopup(station, lat, lng));
          this.policeStationMarkers.push(new mapboxgl.Marker({ element: el, anchor: 'center' })
            .setLngLat([lng, lat]).setPopup(popup).addTo(this.map));
        });

        if (this.map && typeof this.map.off === 'function') {
          this.map.off('zoomend', this.updatePoliceStationMarkerSize, this);
          this.map.on('zoomend', this.updatePoliceStationMarkerSize, this);
        }
      },
      error: () => { /* Alert map remains usable if police station API fails. */ }
    });
  }

  private createPoliceStationPopup(station: any, lat: number, lng: number): HTMLElement {
    const root = document.createElement('div'); root.className = 'police-popup-card';
    const header = document.createElement('div'); header.className = 'police-popup-card__header';
    const imageWrap = document.createElement('div'); imageWrap.className = 'police-popup-card__badge';
    const image = document.createElement('img'); image.src = 'assets/mapimages/police-station.png'; image.alt = 'Police station';
    imageWrap.append(image);

    const heading = document.createElement('div'); heading.className = 'police-popup-card__title';
    const title = document.createElement('strong');
    const type = document.createElement('small');
    title.textContent = String(station?.param2 || 'Police Station');
    type.textContent = String(station?.param3 || 'Emergency Help Point');
    heading.append(title, type);

    header.append(imageWrap, heading);
    root.append(header);

    const body = document.createElement('div'); body.className = 'police-popup-card__body';
    [
      { label: 'District', value: station?.param7 || '-' },
      { label: 'State', value: station?.param8 || '-' },
      { label: 'Location', value: `${lat.toFixed(5)}, ${lng.toFixed(5)}` }
    ].forEach(({ label, value }) => {
      const row = document.createElement('div'); row.className = 'police-popup-card__row';
      const key = document.createElement('span'); key.className = 'police-popup-card__label';
      key.textContent = String(label);
      const val = document.createElement('b'); val.textContent = String(value);
      row.append(key, val); body.append(row);
    });

    const link = document.createElement('a'); link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.className = 'police-popup-card__action';
    const stationName = String(station?.param2 || 'Police Station');
    const googleMapsQuery = `${stationName} Police Station, ${lat},${lng}`;
    link.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(googleMapsQuery)}`;
    link.title = `Show ${stationName} on Google Maps`;
    link.innerHTML = '<span>Locate Police Station</span>';
    body.append(link); root.append(body); return root;
  }

  private clearPoliceStationMarkers(): void {
    this.policeStationMarkers.forEach(marker => marker.remove());
    this.policeStationMarkers = [];
  }

  // ==========================================
  // Helpers
  // ==========================================

  clearAllLayers(preserveMapMarkers: boolean = false, preserveSelectedRoute: boolean = false) {
    this.trackingModeToken++;
    if (this.liveInterval) clearInterval(this.liveInterval);
    if (this.clusterInterval) clearInterval(this.clusterInterval);
    this.isLiveTracking = false;
    this.isHistoryTracking = false;

    if (this.vehicleClusterPopup) {
      this.vehicleClusterPopup.remove();
      this.vehicleClusterPopup = null;
    }

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.liveMarker) {
      this.liveMarker.remove();
      this.liveMarker = null;
    }
    this.liveAlertMarkers.forEach(marker => marker.remove());
    this.liveAlertMarkers = [];
    this.liveAlertKeys.clear();
    if (this.historyStartMarker) {
      this.historyStartMarker.remove();
      this.historyStartMarker = null;
    }
    if (this.historyEndMarker) {
      this.historyEndMarker.remove();
      this.historyEndMarker = null;
    }

    if (this.isLeafletMapInstance()) {
      if (this.historyRouteLayer) {
        this.map.removeLayer(this.historyRouteLayer);
        this.historyRouteLayer = null;
      }
      this.historyArrowMarkers.forEach(marker => marker.remove());
      this.historyArrowMarkers = [];
      if (this.routeLayer) {
        this.map.removeLayer(this.routeLayer);
        this.routeLayer = null;
      }
      if (this.alertMarker) {
        this.alertMarker.remove();
        this.alertMarker = null;
      }
      if (this.poiMarker) {
        this.poiMarker.remove();
        this.poiMarker = null as any;
      }
      this.clearPOIMarkers();
      this.clearClusterLayers();
      return;
    }

    this.removeLayerSource('livesource', 'livelayer');
    if (this.map.getLayer('history-route-arrow-layer')) this.map.removeLayer('history-route-arrow-layer');
    this.removeLayerSource('historysource', 'historylayer');
    if (this.map.getLayer('livearrowlayer')) this.map.removeLayer('livearrowlayer');
    this.removeLayerSource('liveroutesource', 'liveroutelayer');
    this.removeLayerSource('alertsource', 'alertlayer');
    if (!preserveSelectedRoute) {
      this.removeLayerSource('routesource', 'routelayer');
    }
    this.removeLayerSource('poisource', 'poilayer');
    this.removeLayerSource('circle-source', 'circle-layer');
    this.removeLayerSource('polygon-source', 'polygon-fill-layer');
    this.removeLayerSource('polygon-line-source', 'polygon-line-layer');

    // Cluster Layers Removal
    const clusterLayers = ['mainunclusterclusterPoint', 'mainunclusterFallbackPoint', 'mainclusterPoint', 'mainclusterLayer'];
    clusterLayers.forEach(layer => {
      if (this.map.getLayer(layer)) {
        this.map.removeLayer(layer);
      }
    });

    if (this.map.getSource('mainclusterSource')) this.map.removeSource('mainclusterSource');

    // Clear History specific layers
    this.removeLayerSource('history-start-end-source', 'history-start-end-layer');
    this.removeLayerSource('history-arrow-source', 'history-arrow-layer');
    this.removeLayerSource('history-route-deviation-source', 'history-route-deviation-layer');
    if (this.historyTimer) clearInterval(this.historyTimer);
    this.isHistoryPlaying = false;
    this.historyPlaybackIndex = 0;

    if (this.poiMarker) {
      this.poiMarker.remove();
      this.poiMarker = null as any;
    }
    if (!preserveMapMarkers) {
      this.clearPOIMarkers();
    }

    if (!preserveMapMarkers && this.alertMarker) {
      this.alertMarker.remove();
      this.alertMarker = null;
    }
  }

  removeLayerSource(sourceId: string, layerId: string) {
    if (!this.map || this.isLeafletMapInstance()) return;
    if (this.map.getLayer(layerId)) this.map.removeLayer(layerId);
    if (this.map.getSource(sourceId)) this.map.removeSource(sourceId);
  }

  clearPOIMarkers() {
    this.poiMarkers.forEach(marker => marker.remove());
    this.poiMarkers = [];
  }

  resetPagination() {
    this.totalCount = 0;
    this.firstRowCount = 0;
    this.lastRowCount = 0;
    this.lastPageNo = 0;
  }

  // ==========================================
  // POI & Route CRUD
  // ==========================================

  dragMarkerInsert() {
    if (this.poiMarker) this.poiMarker.remove();

    const el = document.createElement('div');
    el.className = 'marker';
    el.style.backgroundImage = 'url(assets/images/mapimages/markers/marker_new.png)';
    el.style.width = '35px';
    el.style.height = '35px';
    el.style.backgroundSize = 'cover';

    const center = this.map.getCenter();
    this.latitude = center.lat;
    this.longitude = center.lng;

    this.poiMarker = new mapboxgl.Marker(el, { draggable: true })
      .setLngLat(center)
      .addTo(this.map);

    this.poiMarker.on('dragend', () => {
      const lngLat = this.poiMarker.getLngLat();
      this.latitude = lngLat.lat;
      this.longitude = lngLat.lng;
      this.cdr.detectChanges();
    });

    this.map.flyTo({ center: center, zoom: 12 });
  }

  dragMarkerUpdate(poi: any) {
    if (this.poiMarker) this.poiMarker.remove();

    this.poiId = poi.param2;
    this.latitude = Number(poi.param7);
    this.longitude = Number(poi.param8);

    const el = document.createElement('div');
    el.className = 'marker';
    el.style.backgroundImage = 'url(assets/images/mapimages/markers/marker_new.png)';
    el.style.width = '35px';
    el.style.height = '35px';
    el.style.backgroundSize = 'cover';

    this.poiMarker = new mapboxgl.Marker(el, { draggable: true })
      .setLngLat([this.longitude, this.latitude])
      .addTo(this.map);

    this.poiMarker.on('dragend', () => {
      const lngLat = this.poiMarker.getLngLat();
      this.latitude = lngLat.lat;
      this.longitude = lngLat.lng;
      this.cdr.detectChanges();
    });

    this.map.flyTo({ center: [this.longitude, this.latitude], zoom: 12 });
  }

  showPOI(poi: any) {
    this.map.flyTo({
      center: [Number(poi.param8), Number(poi.param7)],
      zoom: 14,
      essential: true
    });
  }

  showRoute(route: any) {
    if (!this.map || !route) return;

    const plot = () => {
      if (!this.isLeafletMapInstance()) {
        this.map.resize();
      }
      this.removeLayerSource('routesource', 'routelayer');
      if (this.routeLayer && this.isLeafletMapInstance()) {
        this.map.removeLayer(this.routeLayer);
        this.routeLayer = null;
      }

      const geometry = this.parseRouteGeometry(this.getRouteGeometryValue(route));
      const coordinates = this.getRouteCoordinates(geometry);

      if (!geometry || coordinates.length < 2) {
        this.errorMessage = 'Selected route does not have valid coordinates.';
        return;
      }

      const routeObj = {
        type: 'Feature',
        geometry,
        properties: {
          routeId: route.param2,
          routeName: route.param3
        }
      };

      this.routePlot([routeObj]);

      if (this.isLeafletMapInstance()) {
        const latLngBounds = L.latLngBounds(
          coordinates.map((coord: any[]) => [Number(coord[1]), Number(coord[0])] as [number, number])
        );
        this.map.fitBounds(latLngBounds, { padding: [40, 40] });
      } else {
        const bounds = new mapboxgl.LngLatBounds(coordinates[0] as any, coordinates[0] as any);
        coordinates.forEach(coord => bounds.extend(coord as any));
        this.map.fitBounds(bounds, { padding: 60, maxZoom: 16 });
      }
    };

    if (this.isLeafletMapInstance()) {
      plot();
    } else if (this.map.isStyleLoaded()) {
      plot();
    } else {
      this.map.once('load', plot);
    }
  }

  private getRouteGeometryValue(route: any): any {
    return route?.param5 ||
      route?.coord ||
      route?.coordinates ||
      route?.geometry ||
      route?.routecoord ||
      route?.routecoordinates ||
      route?.param4 ||
      route?.param6 ||
      route?.param7 ||
      route?.param8;
  }

  private parseRouteGeometry(routeJson: any): any {
    if (!routeJson) return null;

    let parsed = routeJson;
    if (typeof routeJson === 'string') {
      try {
        parsed = JSON.parse(routeJson);
      } catch (error) {
        return null;
      }
    }

    if (Array.isArray(parsed)) {
      const coordinates = this.normalizeRouteCoordinates(parsed);
      return coordinates.length >= 2
        ? { type: 'LineString', coordinates }
        : null;
    }

    const geometry = parsed?.type === 'Feature'
      ? parsed.geometry
      : parsed?.type === 'FeatureCollection'
        ? parsed.features?.[0]?.geometry
        : parsed?.type && parsed?.coordinates
          ? parsed
          : parsed?.coordinates
            ? { type: 'LineString', coordinates: parsed.coordinates }
            : null;

    if (!geometry?.coordinates) return null;

    if (geometry.type === 'LineString') {
      return {
        type: 'LineString',
        coordinates: this.normalizeRouteCoordinates(geometry.coordinates)
      };
    }

    if (geometry.type === 'MultiLineString') {
      return {
        type: 'MultiLineString',
        coordinates: geometry.coordinates
          .map((line: any[]) => this.normalizeRouteCoordinates(line))
          .filter((line: number[][]) => line.length >= 2)
      };
    }

    return geometry;
  }

  private normalizeRouteCoordinates(coordinates: any[]): number[][] {
    if (!Array.isArray(coordinates)) return [];

    return coordinates
      .map((coord: any) => {
        if (!Array.isArray(coord) && typeof coord === 'object' && coord) {
          const lat = Number(coord.lat ?? coord.latitude ?? coord.param4 ?? coord.param38);
          const lng = Number(coord.lng ?? coord.lon ?? coord.long ?? coord.longitude ?? coord.param5 ?? coord.param39);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
          return [lng, lat];
        }

        if (!Array.isArray(coord) || coord.length < 2) return null;

        const first = Number(coord[0]);
        const second = Number(coord[1]);
        if (!Number.isFinite(first) || !Number.isFinite(second)) return null;

        return Math.abs(first) <= 90 && Math.abs(second) > 90
          ? [second, first]
          : [first, second];
      })
      .filter((coord: number[] | null): coord is number[] => !!coord);
  }

  private getRouteCoordinates(geometry: any): number[][] {
    if (!geometry?.coordinates) return [];

    if (geometry.type === 'LineString') {
      return geometry.coordinates;
    }

    if (geometry.type === 'MultiLineString') {
      return geometry.coordinates.flat();
    }

    return [];
  }

  showPopup(data: any, coordinates: any) {
    this.poiData = data;
    this.poiData.historyDate = dayjs();
    this.poiData.fromTime = dayjs().startOf('day').toDate();
    this.poiData.toTime = dayjs().endOf('day').toDate();
    this.isPanelCollapsed = false;
    // We are using Angular template for popup, so we don't need mapbox popup here
    // But we need to trigger change detection
    this.cdr.detectChanges();
  }

  showVehicleClusterPopup(data: any, coordinates: any, vehicleId: string) {
    if (this.vehicleClusterPopup) {
      this.vehicleClusterPopup.remove();
      this.vehicleClusterPopup = null;
    }

    const popupElement = this.createVehicleClusterPopupElement(data, vehicleId);
    this.vehicleClusterPopup = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: true,
      maxWidth: '285px',
      offset: 18,
      className: 'vehicle-cluster-map-popup'
    })
      .setLngLat(coordinates)
      .setDOMContent(popupElement)
      .addTo(this.map);
  }

  createVehicleClusterPopupElement(data: any, vehicleId: string): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'vehicle-popup-card';

    const vehicleNo = data.vehicleno || vehicleId || 'N/A';
    const vehicleClass = data.param31 || data.vehicleClass || data.vehicleclassname || data.vehicleClassName || data.vehicleclass || 'PSV Vehicle';
    const speed = data.speed ?? 0;
    const ignition = data.ignition || 'N/A';
    const latitude = Number(data.latitude);
    const longitude = Number(data.longitude);
    const gpsStatus = data.gpsStatus || 'Active';
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
        <span class="vehicle-popup-card__gps"><i class="fa fa-signal"></i><b class="gps-status"></b></span>
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
    const gpsStatusEl = wrapper.querySelector('.gps-status');
    const coordEl = wrapper.querySelector('.vehicle-popup-card__coord b');
    const trackButton = wrapper.querySelector('.vehicle-popup-card__track') as HTMLButtonElement | null;
    const ignitionChip = wrapper.querySelector('.ignition-chip');
    const speedChip = wrapper.querySelector('.speed-chip');

    if (title) title.textContent = vehicleNo;
    if (vehicleClassEl) vehicleClassEl.textContent = vehicleClass;
    if (ignitionEl) ignitionEl.textContent = ignition;
    if (speedEl) speedEl.textContent = `${speedValue} km/h`;
    if (gpsStatusEl) gpsStatusEl.textContent = gpsStatus;
    ignitionChip?.classList.add(ignitionClass);
    speedChip?.classList.add(speedClass);
    if (coordEl) {
      coordEl.textContent = `${Number.isFinite(latitude) ? latitude.toFixed(6) : 'N/A'}, ${Number.isFinite(longitude) ? longitude.toFixed(6) : 'N/A'}`;
    }

    trackButton?.addEventListener('click', () => {
      this.vehicleClusterPopup?.remove();
      this.vehicleClusterPopup = null;
      this.showLiveTrack({ param2: vehicleId, param13: vehicleNo });
    });

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
      gpsStatus: (properties?.['gpsstatus'] || properties?.['param41']) === '1' || properties?.['gpsstatus'] === 'Active'
        ? 'Active'
        : 'Inactive',
      latitude: Number(properties?.['latitude'] ?? properties?.['lat'] ?? properties?.['param38'] ?? coordinates?.[1]),
      longitude: Number(properties?.['longitude'] ?? properties?.['lng'] ?? properties?.['param39'] ?? coordinates?.[0])
    };
  }

  setupMapEvents() {
    const layers = ['poilayer', 'livelayer', 'alertlayer'];

    layers.forEach(layer => {
      this.map.on('click', layer, (e: any) => {
        if (e.features && e.features[0]) {
          const props = e.features[0].properties;
          this.showPopup(props, e.lngLat);
        }
      });
    });

    // History Arrow Click
    this.map.on('click', 'history-arrow-layer', (e: any) => {
      if (e.features && e.features[0]) {
        const props = e.features[0].properties;
        this.historyPlaybackIndex = props.index;
        this.updateHistoryPanel(props);

        if (this.liveMarker) this.liveMarker.setLngLat([props.lng, props.lat]);
        else {
          const el = this.createMarkerElement();
          this.liveMarker = new mapboxgl.Marker(el).setLngLat([props.lng, props.lat]).addTo(this.map);
        }

        new mapboxgl.Popup({ closeButton: false, className: 'arrow-popup', maxWidth: '200px', offset: 15 })
          .setLngLat([props.lng, props.lat])
          .setHTML(`
            <div style="padding: 5px; text-align: center; color: #333; font-family: sans-serif;">
                <div style="font-weight: bold; font-size: 11px; margin-bottom: 3px; color: #007bff;">${props.vehicleno}</div>
                <div style="font-size: 10px; display: flex; justify-content: center; gap: 8px;">
                    <span><i class="fa fa-clock-o"></i> ${props.time.split(' ')[1] || props.time}</span>
                    <span><i class="fa fa-tachometer"></i> ${props.speed} km/h</span>
                </div>
            </div>
          `)
          .addTo(this.map);
      }
    });
    this.map.on('mouseenter', 'history-arrow-layer', () => { this.map.getCanvas().style.cursor = 'pointer'; });
    this.map.on('mouseleave', 'history-arrow-layer', () => { this.map.getCanvas().style.cursor = ''; });
  }

  nextPage() {
    this.pageNo++;
    this.refreshCurrentView();
  }

  prevPage() {
    if (this.pageNo > 1) {
      this.pageNo--;
      this.refreshCurrentView();
    }
  }

  refreshCurrentView() {
    if (this.trackingOption === 'vehicle') this.getAllVehicles();
    else if (this.trackingOption === 'group') this.getGroupVehicles();
    else if (this.trackingOption === 'alert') this.getEmergencyAlert();
    else if (this.trackingOption === 'poi') this.getPOIDetails();
    else if (this.trackingOption === 'route') {
      if (this.selectedRouteId) this.getAllVehicles();
      else this.getRouteDetails();
    }
    else if (this.trackingOption === 'geofence') {
      if (this.selectedGeofenceClusterId) this.getAllVehicles();
    }
  }

   loading = false;geofenceDetails: any[] = [];
    getGeofenceDetails(): void {
    this.loading = true;
    this.geofenceService.getGeofenceDetails({
      param1:  '',
      param2: '',
      param3: '',
      param4: '',
      param5: ''
    }).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res?.status && res?.entity) {
          this.geofenceDetails = res.entity.listData || [];
        } else {
          this.geofenceDetails = [];
        }
      },
      error: (error: any) => {
        this.loading = false;
        this.geofenceDetails = [];
        alert(error?.error?.entity || 'Error loading geofence details');
      }
    });
  }


}
