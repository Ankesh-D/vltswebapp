import { addMapBasemapControl, switchMapboxBasemap } from '../../../shared/components/map-layer-options/map-basemaps';
import { Component, OnInit, ChangeDetectorRef, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VehicleService, Vehicle, VehicleRequest } from '../../../core/services/vehicle.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import dayjs from 'dayjs';
import * as turf from '@turf/turf';
import type mapboxgl from 'mapbox-gl';
import { ToastComponent } from '../../assets/inactive-assets/toast.component';
import { Subscription } from 'rxjs';
import { AlertService } from '../../../core/services/alert.service';
import { ToastService } from '../../../core/services/toast.service';
import { LeafletTrackModalComponent } from '../../../shared/components/leaflet-track-modal/leaflet-track-modal.component';
import { CommonDataToolbarComponent } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { CommonPaginationComponent } from '../../../shared/components/common-pagination/common-pagination.component';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';
import { configureMapboxAccessToken } from '../../../core/utils/mapbox-config';

declare var $: any;

@Component({
    selector: 'app-vehicle-list',
    imports: [CommonModule, FormsModule, RouterModule, NgSelectModule, NgxDaterangepickerMd,
        TimepickerModule, ToastComponent, LeafletTrackModalComponent, CommonDataToolbarComponent,
        CommonPaginationComponent, CommonTableComponent],
    templateUrl: './vehicle-list.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./vehicle-list.component.scss']
})
export class VehicleListComponent implements OnInit, OnDestroy {
  roleId: any;
  vehicles: any[] = [];
  loading = false;
  errorMessage: string | null = null;
  searchText = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [20, 50, 100, 200, 500];
  totalCount = 0;
  pageCount = 0;
  isExporting: boolean = false;
  isHistoryLoading = false;
  // Route parameters
  dash: string = '';  // 'dashboard' or other
  type: string = '';   // 'Old' or 'New'
  date: string = '';   // Date filter

  // Asset Status filters
  rtoFilter: string = '';
  statusFilter: string = 'Connected';
  vehicleClassFilter: string = '';
  activationFilter: 'activated' | 'notactivated' = 'activated';

  // Filter dropdowns data
  rtoList: any[] = [];
  vehicleClassList: any[] = [];

  // Sorting
  sortKey: string = '';
  reverse: boolean = false;
  readonly tableColumns: CommonTableColumn[] = [
    { key: 'index', label: '#', width: '3%' },
    { key: 'param10', label: 'Vehicle/Chassis No.', sortable: true, width: '11%' },
    { key: 'param5', label: 'Serial No./IMEI No.', sortable: true, width: '10%' },
    { key: 'param6', label: 'ICCID No.', sortable: true, width: '8%' },
    { key: 'param18', label: 'Customer Details', sortable: true, width: '12%' },
    { key: 'param8', label: 'Vendor', sortable: true, showSortIndicator: false, width: '7%' },
    { key: 'param22', label: 'Polling Datetime', sortable: true, width: '10%' },
    { key: 'param25', label: 'Latitude/Longitude', sortable: true, width: '9%' },
    { key: 'param29', label: 'Speed (Km/hrs)/Ignition', sortable: true, cellClass: 'changehead2', width: '10%' },
    { key: 'param33', label: 'Location', sortable: true, showSortIndicator: false, width: '12%' },
    { key: 'status', label: 'Polling Status/GPS Status', width: '8%' }
  ];

  // Page mode - detect if Asset Status or Assets Details
  isAssetStatus: boolean = false;

  // Modal state
  selectedVehicle: any = null;
  selectedVehicleNo: string = '';
  showTrackModal: boolean = false;

  panelData: any = null;
  isPanelCollapsed: boolean = false;
  isHistorySectionOpen: boolean = false;

  // Map tracking state
  map: any = null;
  liveMarker: any = null;
  vehicleTrackingData: any = null;
  showLayersToggle: boolean = false;
  isLayerSwitcherOpen: boolean = false;
  activeMapStyle: string = 'streets-v11';
  liveRouteCoordinates: any[] = [];
  isFirstLiveTrack: boolean = true;
  liveAnimationId: any = null;
  alertFeatures: any[] = [];
  alertIconMappings = {
    'overspeed': { name: 'alert-overspeed', path: 'assets/mapimages/alertimage/overspeed_new.png' },
    'impact': { name: 'alert-impact', path: 'assets/mapimages/alertimage/emergency.png' },
    'main battery reconnect': { name: 'alert-battery-reconnect', path: 'assets/mapimages/alertimage/batterycharge.png' },
    'power disconnect': { name: 'alert-power-disconnect', path: 'assets/mapimages/alertimage/powerDisconnect.png' },
    'ignition on': { name: 'alert-ignition-on', path: 'assets/mapimages/alertimage/ignitionOn.png' },
    'ignition off': { name: 'alert-ignition-off', path: 'assets/mapimages/alertimage/ignitionOff.png' },
    'harsh acceleration': { name: 'alert-harsh-acceleration', path: 'assets/mapimages/alertimage/harshacceleration_new.png' },
    'harsh brake': { name: 'alert-harsh-brake', path: 'assets/mapimages/alertimage/harshbrake_new.png' },
    'geofence entry': { name: 'alert-geofence-entry', path: 'assets/mapimages/alertimage/geofenceentry.png' },
    'geofence exit': { name: 'alert-geofence-exit', path: 'assets/mapimages/alertimage/geofenceexit.png' },
    'panic': { name: 'alert-panic', path: 'assets/mapimages/alertimage/emergency.png' },
    'low battery': { name: 'alert-low-battery', path: 'assets/mapimages/alertimage/batterylow.png' },
    'route deviation': { name: 'alert-route-deviation', path: 'assets/mapimages/alertimage/routedev3.png' },
    'tamper': { name: 'alert-tamper', path: 'assets/mapimages/alertimage/tamper.png' },
    'tilt': { name: 'alert-tilt', path: 'assets/mapimages/alertimage/tilt.png' },
    'default': { name: 'alert-default', path: 'assets/mapimages/alertimage/others.png' }
  };

  alertLegends: any[] = [];
  isLegendOpen: boolean = false;

  // timer
  setTimer: any;
  reloadInterval: any = 60000; // 60 seconds
  liveTrackingInterval: any = null;
  reloadObj = [
    { param1: '10 Sec', param2: 10000 },
    { param1: "30 Sec", param2: 30000 },
    { param1: "1 min", param2: 60000 },
    { param1: "2 min ", param2: 120000 },
    { param1: "3 min ", param2: 180000 }
  ]; // in seconds


  // Playback Control Properties
  showPlaybackControls: boolean = true;
  speedSliderValue: number = 1;
  isHistoryPlaying: boolean = false;
  playbackTimer: any = null;
  historyDate: any;
  fromTime: Date;
  toTime: Date;
  historyDataList: any[] = [];
  historyPlaybackIndex: number = 0;
  animationFrameId: any = null;
  historyStartMarker: any = null;
  historyEndMarker: any = null;
  historyTimer: any = null;
  poiData: any = {};
  errorType: 'error' | 'success' = 'error';
  getAssetStatusDetailsAPI?: Subscription;
  showPoliceStations = true;
  private policeStationMarkers: any[] = [];
  private readonly policeStationMinZoom = 12;
  private readonly policeStationBaseSize = 18;
  private readonly policeStationMaxSize = 42;

  constructor(
    private vehicleService: VehicleService,
    private route: ActivatedRoute,
    private router: Router,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {
    this.toast.pageName = 'Vehicle Status Details'; // Set page name for toast service

    // Initialize history date/time pickers
    this.historyDate = dayjs();
    this.fromTime = dayjs().startOf('day').toDate();
    this.toTime = dayjs().endOf('day').toDate();
    this.alertLegends = Object.entries(this.alertIconMappings).map(([key, value]) => ({
      label: key.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      icon: value.path
    }));
  }
  onVehicleOrGpsChange() {
    this.currentPage = 1;
    this.loadVehicles();
  }
  ngOnInit() {
    this.roleId = sessionStorage.getItem('roleid');
    console.log(this.roleId)
    this.vehicleTypeFilter = '';
    this.statusFilter = 'Connected';
    this.gpsFilter = '';
    this.isHistorySectionOpen = false;
    // Check the route URL to determine mode
    const currentUrl = this.router.url;
    $('#livedetailsinfo').hide();
    $('#historydetailsinfo').hide();

    this.route.params.subscribe(params => {
      // Check if route has dash/type/date params - if not, it's Asset Status
      const hasAssetDetailsParams = params['dash'] !== undefined || params['type'] !== undefined || params['date'] !== undefined;

      // Also check URL path - if it contains 'assetstatus', it's Asset Status
      const isAssetStatusRoute = currentUrl.toLowerCase().includes('assetstatus') || currentUrl.toLowerCase().includes('assetsatus');

      this.dash = params['dash'] || '';
      if (isAssetStatusRoute) {
        // For AssetStatus, type is now a query parameter
        this.type = this.route.snapshot.queryParams['type'] || '';
      } else {
        // For other routes like /vehicle/:dash/:type/:date, it's a route parameter
        this.type = params['type'] || '';
      }
      this.date = params['date'] || '0';

      // Determine if Asset Status mode - check both URL path and params
      this.isAssetStatus = isAssetStatusRoute || !hasAssetDetailsParams;

      // Load filter dropdowns for Asset Status
      if (this.isAssetStatus) {
        this.loadRTORoster();
        this.loadVehicleClassRoster();
      }

      // Reload data with new params
      this.loadVehicles(true);
    });
  }
  private isDestroyed = false;

  ngOnDestroy(): void {
    this.isDestroyed = true;

    if (this.setTimer) {
      clearTimeout(this.setTimer);
    }

    if (this.liveTrackingInterval) {
      clearInterval(this.liveTrackingInterval);
    }
    if (this.getAssetStatusDetailsAPI) {
      this.getAssetStatusDetailsAPI.unsubscribe();
    }
  }
  onChangeInterval(event: any) {
    this.reloadInterval = event.param2;
    clearTimeout(this.setTimer);
    this.setTimer = setTimeout(() => {
      this.loadVehicles(false); // ❌ loader OFF
    }, this.reloadInterval);
  }

  loadRTORoster(rtoId?: string) {
    this.vehicleService.getRTORoster(rtoId).subscribe({
      next: (response) => {
        if (response?.status && response?.entity) {
          this.rtoList = Array.isArray(response.entity) ? response.entity : [];
        }
      },
      error: (error) => {

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
      error: (error) => {

      }
    });
  }

  onRTOFilterChange() {
    this.currentPage = 1;
    this.loadVehicles();
  }

  onStatusFilterChange() {
    this.currentPage = 1;
    this.loadVehicles();
  }

  onActivationFilterChange(value: 'activated' | 'notactivated') {
    if (this.activationFilter === value) {
      return;
    }

    this.activationFilter = value;
    this.currentPage = 1;
    this.loadVehicles();
  }

  onVehicleClassFilterChange(event: any) {
    this.vehicleClassFilter = event.target.value || '';
    this.currentPage = 1;
    this.loadVehicles();
  }
  vehicleTypeFilter: string = '';
  gpsFilter: string = '';

  loadVehicles(showLoader: boolean = true) {
    if (this.getAssetStatusDetailsAPI) {
      this.getAssetStatusDetailsAPI.unsubscribe();
    }
    this.loading = showLoader; // 🔥 FIX
    this.errorMessage = '';
    if (this.isAssetStatus) {
      // Asset Status API call
      const request = {
        param1: this.searchText.trim(),
        param2: this.activationFilter,
        param3: '',
        param4: this.currentPage.toString(),
        param5: this.pageSize.toString(),
        param6: '',
        param7: this.rtoFilter || '',
        param8: this.statusFilter || 'Connected',
        param9: this.vehicleClassFilter || '',
        // ✅ ADD
        param14: this.vehicleTypeFilter || '',
        param15: this.gpsFilter,
        pdfexcel: "",
        type: "assetstatus"
      };



      this.getAssetStatusDetailsAPI = this.vehicleService.getAssetStatusDetails(request, showLoader).subscribe({
        next: (response) => {
          this.loading = false;
          if (response?.statuscode === 200 && response?.entity) {
            if (response.entity.listData !== undefined) {
              this.vehicles = response.entity.listData || [];
              if (response.entity.param1 !== undefined && response.entity.param1 !== null) {
                this.totalCount = Number(response.entity.param1) || 0;
              }
            } else if (Array.isArray(response.entity)) {
              this.vehicles = response.entity;
              this.totalCount = response.entity.length;
            } else {
              this.vehicles = [];
              this.totalCount = 0;
            }
            if (!this.isDestroyed && !this.showTrackModal) {
              this.setTimer = setTimeout(() => {
                this.loadVehicles(false);
              }, this.reloadInterval);
            }
            this.pageCount = this.vehicles.length < this.pageSize ? this.vehicles.length : this.pageSize;
            this.updatePageSizeOptions();
            this.cdr.detectChanges();
          } else {
            const errorMsg = typeof response?.entity === 'string'
              ? response.entity
              : 'Failed to load asset status';
            this.errorMessage = errorMsg;
            this.vehicles = [];
            this.totalCount = 0;
            this.pageCount = 0;
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = 'Error loading asset status. Please try again.';
          this.vehicles = [];
          clearTimeout(this.setTimer);
          this.cdr.detectChanges();
        }
      });
    } else {
      // Original Assets Details API call (for backward compatibility)
      const request: VehicleRequest = {
        param1: this.searchText.trim(),
        param2: this.type === '0' ? 'Total' : this.type,
        param3: this.currentPage.toString(),
        param4: this.pageSize.toString(),
        param5: this.date !== '0' ? this.date : ''
      };

      this.vehicleService.getVehicleDetailsByType(request, showLoader).subscribe({
        next: (response) => {
          this.loading = false;
          if (response?.status && response?.entity) {
            if (response.entity.listData !== undefined) {
              this.vehicles = response.entity.listData || [];
              if (response.entity.param1 !== undefined && response.entity.param1 !== null) {
                this.totalCount = Number(response.entity.param1) || 0;
              }
            } else {
              this.vehicles = [];
            }
            this.pageCount = this.vehicles.length < this.pageSize ? this.vehicles.length : this.pageSize;
            this.updatePageSizeOptions();
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = 'Error loading vehicles. Please try again.';
          this.vehicles = [];

          this.cdr.detectChanges();
        }
      });
    }
  }

  updatePageSizeOptions() {
    const options = [20];
    if (this.totalCount > 50) options.push(50);
    if (this.totalCount > 100) options.push(100);
    if (this.totalCount > 200) options.push(200);
    if (this.totalCount > 500) options.push(500);
    if (this.totalCount > 0) options.push(this.totalCount);
    this.pageSizeOptions = options;
  }

  onPageSizeChange(size: number | string) {
    if (size === 'All' || size === this.totalCount) {
      this.pageSize = this.totalCount;
    } else {
      this.pageSize = Number(size);
    }
    this.currentPage = 1;
    this.loadVehicles();
  }

  onPageChange(page: number) {
    if (page < 1) return;
    const totalPages = this.getTotalPages();
    if (this.totalCount > 0 && page > totalPages) return;
    this.currentPage = page;
    this.loadVehicles(false);
  }

  reloadData() {
    this.searchText = '';
    this.currentPage = 1;
    this.loadVehicles(false);
  }

  getSearchDetails() {
    this.currentPage = 1;
    this.loadVehicles();
  }

  sort(key: string) {
    if (this.sortKey === key) {
      this.reverse = !this.reverse;
    } else {
      this.sortKey = key;
      this.reverse = false;
    }
    this.cdr.detectChanges();
  }

  goHome() {
    this.router.navigate(['/dashboard']);
  }

  goToAdminDashboard() {
    this.router.navigate(['/AdminDashboard']);
  }



  trackVehicle(vehicle: any) {
    // The shared Leaflet modal owns map setup, polling, and history playback.
    this.selectedVehicle = vehicle;
    this.selectedVehicleNo = vehicle.param10 || '';
    this.showTrackModal = true;

    if (this.setTimer) {
      clearTimeout(this.setTimer);
    }
  }

  toggleLayers() {
    this.showLayersToggle = !this.showLayersToggle;
    this.cdr.detectChanges();
  }

  toggleLayerPanel() {
    this.isLayerSwitcherOpen = !this.isLayerSwitcherOpen;
    this.cdr.detectChanges();
  }

  closeModal() {
    this.showTrackModal = false;
    this.selectedVehicle = null;
    this.selectedVehicleNo = '';

    this.loadVehicles(false);
  }

  // ==========================================
  // History Tracking
  // ==========================================

  showHistoryTrack(vehicleNo: string) {
    if (this.isHistoryLoading) return;

    const fromTimeFormatted = this.poiData.fromTime ? dayjs(this.poiData.fromTime).format('hh:mm A') : dayjs(this.fromTime).format('hh:mm A');
    const toTimeFormatted = this.poiData.toTime ? dayjs(this.poiData.toTime).format('hh:mm A') : dayjs(this.toTime).format('hh:mm A');

    const data = {
      param1: vehicleNo,
      param2: $('#historydate').val(),
      param3: fromTimeFormatted,
      param4: toTimeFormatted
    };

    // Stop any ongoing live tracking animation and clear live layers before showing history.
    if (this.liveAnimationId) {
      cancelAnimationFrame(this.liveAnimationId);
      this.liveAnimationId = null;
    }
    if (this.liveTrackingInterval) {
      clearInterval(this.liveTrackingInterval);
      this.liveTrackingInterval = null;
    }
    this.clearAllLayers(); // Clear all existing layers (including live track)

    this.isHistoryLoading = true;

    this.vehicleService.getVehicleHistory(data).subscribe({

      next: (response: any) => {
        if (!response || !response.entity) {
          this.errorMessage = 'No history data found';
          this.isHistoryLoading = false;
          return;
        }

        const listData = response.entity.listData || [];
        let coordinates: any[] = [];
        try {
          if (response.entity.param1) {
            const geoJson = JSON.parse(response.entity.param1);
            if (geoJson.geometry && geoJson.geometry.coordinates) {
              coordinates = geoJson.geometry.coordinates;
            }
          }
        } catch (e) {
          console.error("Error parsing history GeoJSON", e);
        }

        if (listData.length === 0 && coordinates.length === 0) {
          this.errorMessage = ('No history data found.');
          this.isHistoryLoading = false;
          return;
        }

        // Filter if data exists, otherwise empty array
        const historyAlertFeatures: any[] = [];
        $('#livedetailsinfo').hide();
        $('#historydetailsinfo').show();
        this.historyDataList = listData.map((item: any) => {
          const newItem = { ...item };
          // The API response for history can be inconsistent.
          // The animation code expects latitude in `param7` and longitude in `param8`.
          // The response provides lat/lng in `param4` and `param5`.
          // This mapping normalizes the data to ensure `param7` and `param8` hold the coordinates for playback.
          newItem.param7 = item.param4; // Latitude
          newItem.param8 = item.param5; // Longitude

          // Check for history alerts based on param12 (alertidx) and param13 (alertname)
          const alertId = item.param12;
          const alertName = item.param13;

          // Assuming '0' or '1' are non-alert states. Adjust if needed.
          if (alertId && alertId !== '0' && alertId !== '1' && alertName) {
            const lat = Number(newItem.param7);
            const lng = Number(newItem.param8);
            if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
              historyAlertFeatures.push({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [lng, lat] },
                properties: {
                  alertName: alertName || `Alert ID: ${alertId}`,
                  time: item.param3,
                  icon: this.getAlertIconName(alertName)
                }
              });
            }
          }
          return newItem;
        })
          .filter((item: any) => {
            // Ensure the coordinates are valid numbers before using them.
            const lat = Number(item.param7);
            const lng = Number(item.param8);
            return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
          });

        this.displayHistory(response.entity, vehicleNo);
        this.isHistoryLoading = false;

        if (historyAlertFeatures.length > 0) {
          this.plotHistoryAlerts(historyAlertFeatures);
        }
      },
      error: (err: any) => {
        console.error('Error fetching history', err);
        this.errorMessage = 'Error loading history data.';
        this.isHistoryLoading = false;
      }
    });
  }

  createStartEndMarker(type: 'start' | 'end') {
    const el = document.createElement('div');
    el.style.width = '35px';
    el.style.height = '35px';
    el.style.cursor = 'pointer';
    el.style.zIndex = '10';
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
        <div style="padding: 5px; text-align: center; color: #333; font-family: sans-serif;">
            <div style="font-weight: bold; font-size: 11px; margin-bottom: 3px; color: #007bff;">${title}</div>
            <div style="font-size: 10px;">
                <div><i class="fa fa-clock-o"></i> ${item.param3}</div>
                <div style="margin-top:2px;">${Number(item.param7).toFixed(5)}, ${Number(item.param8).toFixed(5)}</div>
            </div>
        </div>
      `;
  }

  updateHistoryPanel(props: any) {
    this.poiData = {
      ...props,
      type: 'history',
      vehicleno: props.vehicleno,
      speed: props.speed,
      pollingdate: props.time, // Assuming time string contains date
      ignition: props.ignition,

      latitude: Number(props.lat),
      longitude: Number(props.lng)
    };
    this.isPanelCollapsed = false;
    this.cdr.detectChanges();
  }

  getAlertIconName(alertName: string): string {
    if (!alertName) {
      return this.alertIconMappings['default'].name;
    }
    const lowerAlertName = alertName.toLowerCase();
    // Check for more specific matches first
    if (lowerAlertName.includes('main battery reconnect')) return this.alertIconMappings['main battery reconnect'].name;
    if (lowerAlertName.includes('power disconnect')) return this.alertIconMappings['power disconnect'].name;

    // General partial matches
    for (const key in this.alertIconMappings) {
      if (key !== 'default' && lowerAlertName.includes(key)) {
        return this.alertIconMappings[key as keyof typeof this.alertIconMappings].name;
      }
    }

    return this.alertIconMappings['default'].name;
  }

  // ==========================================
  // History Playback Controls
  // ==========================================

  playHistory() {
    if (this.isHistoryPlaying) return;
    if (this.historyPlaybackIndex >= this.historyDataList.length - 1) {
      this.historyPlaybackIndex = 0;
    }

    // Create the moving marker if it doesn't exist
    if (!this.liveMarker && this.historyDataList.length > 0) {
      const currentPoint = this.historyDataList[this.historyPlaybackIndex];
      const el = this.createMarkerElement();
      const mapboxgl = (window as any).mapboxgl;
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
    const startSpeed = Number(startItem.param6) || 0;
    const endSpeed = Number(endItem.param6) || 0;

    // Calculate distance for smooth speed-based animation
    const from = turf.point([startLng, startLat]);
    const to = turf.point([endLng, endLat]);
    const distance = turf.distance(from, to);

    // Calculate bearing so vehicle points towards next point (Visual Direction)
    let heading = Number(endItem.param43) || 0;
    if (distance > 0.001) {
      heading = turf.bearing(from, to);
    } else if (this.liveMarker) {
      heading = this.liveMarker.getRotation();
    }

    // Calculate duration: Distance * Factor / Slider
    // Adjust factor (e.g., 10000) to tune base speed. Higher factor = Slower animation.
    // Increased factor to 30000 for smoother, slower base speed (approx 30s per km at 1x)
    let duration = (distance * 30000) / (this.speedSliderValue || 1);

    // Minimum duration of 1 frame (16ms) to prevent instant jumps, but allow fast movement
    if (duration < 16) duration = 16;

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      if (!this.isHistoryPlaying) return;

      const elapsed = currentTime - startTime;
      let progress = elapsed / duration;
      if (progress > 1) progress = 1;

      // Interpolate position
      const currentLng = startLng + (endLng - startLng) * progress;
      const currentLat = startLat + (endLat - startLat) * progress;

      if (this.liveMarker) {
        this.liveMarker.setLngLat([currentLng, currentLat]);
        this.liveMarker.setRotation(heading);
      }

      const currentSpeed = startSpeed + (endSpeed - startSpeed) * progress;

      // Update panel data by using the 'live' variables, which the template is already bound to.
      this.speedlive = String(Math.round(currentSpeed));
      this.pollingtimelive = startItem.param35 || startItem.param3;
      this.ignitionlive = startItem.param9 === '1' ? 'On' : 'Off';

      // Also update poiData for map marker and location display
      this.poiData.latitude = currentLat;
      this.poiData.longitude = currentLng;

      this.cdr.detectChanges();

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        // Step complete
        this.historyPlaybackIndex++;

        // Update Panel
        this.speedlive = String(endItem.param21 || 0);
        this.pollingtimelive = endItem.param35;
        this.ignitionlive = endItem.param9 === '1' ? 'On' : 'Off';
        this.poiData.latitude = endLat;
        this.poiData.longitude = endLng;

        this.cdr.detectChanges();

        // Update Arrow Filter
        if (this.map.getLayer('history-arrow-layer')) {
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
    if (this.historyDataList.length > 0) {
      const item = this.historyDataList[0];
      this.updateHistoryPanel({
        vehicleno: item.param1 || item.param9 || 'N/A',
        speed: item.param21,
        time: item.param3 || item.param35,
        ignition: item.param9 === '1' ? 'On' : 'Off',
        lat: item.param7,
        lng: item.param8
      });

      // Show all arrows again when stopped
      if (this.map.getLayer('history-arrow-layer')) {
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

  initializeMap() {
    try {
      // Check if mapboxgl is available
      if (typeof (window as any).mapboxgl === 'undefined') {

        this.errorMessage = ('Map library is not loaded. Please refresh the page.');
        return;
      }

      const mapboxgl = (window as any).mapboxgl;

      // Set Mapbox access token
      if (!configureMapboxAccessToken(mapboxgl)) return;

      // Initialize map
      this.map = new mapboxgl.Map({
        container: 'map1',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [87.74780, 22.978624], // Default center (Delhi/NCR)
        zoom: 8,
        minZoom: 4,
        preserveDrawingBuffer: true,
        attributionControl: false
      });
      addMapBasemapControl(this.map, 'mapbox', this.activeMapStyle);

      // Add controls
      this.map.addControl({
        onAdd: () => {
          const container = document.createElement('div');
          container.className = 'mapboxgl-ctrl mapboxgl-ctrl-attrib';
          container.innerHTML = '<div class="mapboxgl-ctrl-attrib-inner">Powered by DIMTS</div>';
          return container;
        },
        onRemove: () => { }
      }, 'bottom-right');
      // Add navigation controls
      this.map.addControl(new mapboxgl.NavigationControl());
      this.map.once('load', () => this.configureMapStyleArtifacts());

    } catch (error) {

      this.errorMessage = ('Error initializing map. Please try again.');
    }
  }

  private configureMapStyleArtifacts(): void {
    if (!this.map) return;
    this.addWmsOverlayLayer();
    this.addLiveRouteLayers();
    this.addAlertLayers();
    this.loadPoliceStations();
    this.refreshMapVisuals();
  }

  private addWmsOverlayLayer(): void {
    if (!this.map || this.map.getSource('wms-source')) return;

    this.map.addSource('wms-source', {
      type: 'raster',
      tiles: [
        'https://vlts.wb.gov.in/geoserver/wbsdcmap/wms?' +
        'service=WMS&version=1.1.1&request=GetMap' +
        '&layers=wbsdcmap:india_state' +
        '&styles=' +
        '&bbox={bbox-epsg-3857}' +
        '&width=256&height=256' +
        '&srs=EPSG:3857' +
        '&format=image/png' +
        '&transparent=true'
      ],
      tileSize: 256
    });

    this.map.addLayer({
      id: 'wms-layer',
      type: 'raster',
      source: 'wms-source'
    });
  }

  private addLiveRouteLayers(): void {
    if (!this.map || this.map.getSource('liveroutesource')) return;

    this.map.addSource('liveroutesource', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: []
        }
      }
    });

    this.map.addLayer({
      id: 'liveroutelayer',
      type: 'line',
      source: 'liveroutesource',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#007bff', 'line-width': 4 }
    });

    this.map.addLayer({
      id: 'livearrowlayer',
      type: 'symbol',
      source: 'liveroutesource',
      layout: {
        'symbol-placement': 'line',
        'symbol-spacing': 75,
        'text-field': '➤',
        'text-size': 16,
        'text-allow-overlap': true,
        'text-ignore-placement': true,
        'text-keep-upright': false
      },
      paint: { 'text-color': '#ffffff', 'text-halo-color': '#007bff', 'text-halo-width': 2 }
    });
  }

  private addAlertLayers(): void {
    if (!this.map || this.map.getSource('alertsource')) return;

    this.map.addSource('alertsource', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

    this.map.addLayer({
      id: 'alertlayer-circle',
      type: 'circle',
      source: 'alertsource',
      paint: {
        'circle-radius': 6,
        'circle-color': '#d9534f',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    });

    this.map.addLayer({
      id: 'alertlayer',
      type: 'symbol',
      source: 'alertsource',
      layout: {
        'icon-image': ['get', 'icon'],
        'icon-size': 0.8,
        'icon-allow-overlap': true,
        'icon-ignore-placement': true
      }
    });

    const showLiveAlertPopup = (e: any) => {
      if (!e.features || e.features.length === 0) return;
      const coordinates = e.features[0].geometry.coordinates.slice();
      const { alertName, time } = e.features[0].properties;

      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      new (window as any).mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(`<div style="padding: 5px; font-family: sans-serif; font-size: 12px; text-align: center;"><div style="font-weight: bold; color: #d9534f;">${alertName}</div><div style="font-size: 10px; color: #555;">Time: ${time}</div></div>`)
        .addTo(this.map);
    };

    this.map.on('click', 'alertlayer', showLiveAlertPopup);
    this.map.on('click', 'alertlayer-circle', showLiveAlertPopup);
  }

  private refreshMapVisuals(): void {
    if (this.liveRouteCoordinates.length > 0) {
      const routeSource = this.map?.getSource('liveroutesource') as mapboxgl.GeoJSONSource;
      routeSource?.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: this.liveRouteCoordinates
        }
      });
    }

    if (this.alertFeatures.length > 0) {
      const alertSource = this.map?.getSource('alertsource') as mapboxgl.GeoJSONSource;
      alertSource?.setData({
        type: 'FeatureCollection',
        features: this.alertFeatures
      });
    }
  }

  changeMapStyle(style: string): void {
    this.activeMapStyle = style;
    if (this.map) switchMapboxBasemap(this.map, style);
  }





  private loadPoliceStations(): void {
    this.clearPoliceStationMarkers();
    if (!this.showPoliceStations) return;

    this.alertService.getPoliceStationDetails({ param1: '', param2: 1, param3: 20 }).subscribe({
      next: (response: any) => {
        const stations = response?.entity?.listData;
        if (!this.map || !this.showPoliceStations || !Array.isArray(stations)) return;
        stations.forEach((station: any) => {
          const lat = Number(station?.param9); const lng = Number(station?.param10);
          if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return;
          const el = document.createElement('div');
          el.className = 'police-station-map-marker';
          el.style.cursor = 'pointer';
          el.style.background = "url('assets/mapimages/police-station.png') center/contain no-repeat";
          const popup = new (window as any).mapboxgl.Popup({ offset: 24, className: 'police-station-popup', maxWidth: '235px' })
            .setDOMContent(this.createPoliceStationPopup(station, lat, lng));
          this.policeStationMarkers.push(new (window as any).mapboxgl.Marker({ element: el, anchor: 'center' })
            .setLngLat([lng, lat]).setPopup(popup).addTo(this.map));
        });
        this.updatePoliceStationMarkersForZoom();
        this.map.off('zoom', this.updatePoliceStationMarkersForZoom);
        this.map.on('zoom', this.updatePoliceStationMarkersForZoom);
      },
      error: () => { /* Alert map remains usable if police station API fails. */ }
    });
  }

  private readonly updatePoliceStationMarkersForZoom = (): void => {
    if (!this.map) return;
    const zoom = this.map.getZoom();
    const isVisible = zoom >= this.policeStationMinZoom;
    const size = this.getPoliceStationSize(zoom);

    this.policeStationMarkers.forEach(marker => {
      const element = marker?.getElement?.() as HTMLElement | undefined;
      if (!element) return;
      element.style.display = isVisible ? 'block' : 'none';
      element.style.width = `${size}px`;
      element.style.height = `${size}px`;
    });
  };

  private getPoliceStationSize(zoom: number): number {
    const normalizedZoom = Math.max(this.policeStationMinZoom, Math.min(zoom, 18));
    const size = this.policeStationBaseSize + ((normalizedZoom - this.policeStationMinZoom) * 4);
    return Math.max(this.policeStationBaseSize, Math.min(size, this.policeStationMaxSize));
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
    this.map?.off('zoom', this.updatePoliceStationMarkersForZoom);
    this.policeStationMarkers.forEach(marker => marker.remove());
    this.policeStationMarkers = [];
  }

  setupLayerCheckboxes() {
    // Setup layer toggle checkboxes (placeholder - layers functionality can be enhanced later)
    const layerIds = [
      'Delhi_Psv_All',
      'National_District_region',
      'Delhi_Noida_Rd_Highways_polyline',
      'Delhi_Noida_Rd_ACH_polyline',
      'Delhi_Noida_Landuse_region',
      'Delhi_Noida_Locality_region',
      'Delhi_Noida_POI_point'
    ];

    layerIds.forEach(layerId => {
      const checkbox = document.getElementById(layerId) as HTMLInputElement;
      if (checkbox) {
        checkbox.onchange = () => {
          // Layer toggle functionality - can be implemented based on requirements

        };
      }
    });
  }
  loadVehicleTracking(showLoader: boolean = true) {
    if (!this.selectedVehicleNo) {
      this.errorMessage = ('Vehicle number is required for tracking');
      return;
    }
    this.loading = showLoader;


    this.vehicleService.getLiveTrack(this.selectedVehicleNo, showLoader).subscribe({
      next: (response) => {
        this.loading = false;
        
        if (response?.status && response?.entity && response.entity.length > 0) {
          this.vehicleTrackingData = response.entity[0];

          this.updateLiveVehiclePosition(this.vehicleTrackingData);
        } else {
          this.errorMessage = ('No tracking data found for this vehicle');
        }
      },
      error: (error) => {
        this.loading = false;

        this.errorMessage = (error?.error?.entity || 'Error loading vehicle tracking data');
      }
    });
  }

  getDirection(heading: string | number): number {
    const input = typeof heading === 'string' ? parseFloat(heading) : heading;

    if (input >= 345 && input < 15) return 0;
    if (input >= 15 && input < 60) return 45;
    if (input >= 60 && input < 120) return 90;
    if (input >= 120 && input < 160) return 135;
    if (input >= 160 && input < 210) return 180;
    if (input >= 210 && input < 235) return 225;
    if (input >= 235 && input < 290) return 270;
    if (input >= 290 && input < 345) return 315;
    return 0;
  }

  updateLivePanel(vehicleData: any) {
    if (!vehicleData) return;
    $('#livedetailsinfo').show();
    $('#historydetailsinfo').hide();

    this.vehiclenolive = vehicleData.param13 || 'N/A';
    this.speedlive = vehicleData.param40 || '0';
    this.ignitionlive = vehicleData.param45 === '1' ? 'On' : 'Off';
    this.gpslive = vehicleData.param41 === '1' ? 'Valid' : 'In Valid';
    this.pollingtimelive = vehicleData.param35 || 'N/A';
    this.customerlive = `${vehicleData.param25 || 'N/A'} / ${vehicleData.param26 || 'N/A'}`;
    const longitude = Number(vehicleData.param39) || 0;
    const latitude = Number(vehicleData.param38) || 0;
    this.poiData.latitude = latitude;
    this.poiData.longitude = longitude;
    this.locationlive = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    this.deviceserialnolive = vehicleData.param5 || 'N/A';
    this.IMEINolive = vehicleData.param4 || 'N/A';
    this.Vendorlive = vehicleData.param9 || 'N/A';
    this.ICCIDlive = vehicleData.param6 || 'N/A';
    this.cdr.detectChanges();
  }

  hasValidPlaybackLocation(): boolean {
    const latitude = Number(this.poiData?.latitude);
    const longitude = Number(this.poiData?.longitude);

    return Number.isFinite(latitude) && Number.isFinite(longitude) && (latitude !== 0 || longitude !== 0);
  }

  createLiveVehiclePopup(vehicleData: any): mapboxgl.Popup {
    const longitude = Number(vehicleData.param39) || 0;
    const latitude = Number(vehicleData.param38) || 0;
    const ignitionStatus = vehicleData.param45 === '1' ? 'On' : 'Off';
    const ignitionColor = vehicleData.param45 === '1' ? 'green' : 'red';
    const gpsStatus = vehicleData.param41 === '1' ? 'Valid' : 'In Valid';
    const gpsColor = vehicleData.param41 === '1' ? 'green' : 'red';

    const popupContent = `
        <style>
          .vehicle-custom-popup .mapboxgl-popup-content { padding: 0 !important; background: transparent !important; box-shadow: none !important; border: none !important; }
          .vehicle-custom-popup .mapboxgl-popup-tip { border-top-color: #ffffff !important; }
          .vehicle-custom-popup .mapboxgl-popup-close-button { color: #ffffff !important; font-size: 18px !important; right: 0px !important; top: 0px !important; z-index: 134 !important; }
          .vehicle-custom-popup .mapboxgl-popup-close-button:hover { background-color: rgba(255,255,255,0.2) !important; border-radius: 50%; }
        </style>
        <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; width: 280px; background-color: #ffffff; border-radius: 6px; box-shadow: 0 3px 10px rgba(0,0,0,0.2); overflow: hidden;">
          <div style="background-color: #28a745; color: #ffffff; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 600; font-size: 13px;">Vehicle Details</span>
            <span style="background: rgba(255,255,255,0.2); padding: 2px 18px; border-radius: 4px; font-size: 11px;">${vehicleData.param13 || 'N/A'}</span>
          </div>
          <div style="padding: 10px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #f0f0f0;"><td style="color: #666; padding: 0px 0; width: 40%;">Polling Time</td><td style="color: #333; font-weight: 500; padding: 0px 0; text-align: right;">${vehicleData.param35 || 'N/A'}</td></tr>
              <tr style="border-bottom: 1px solid #f0f0f0;"><td style="color: #666; padding: 0px 0;">Speed</td><td style="color: #333; font-weight: 500; padding: 0px 0; text-align: right;">${vehicleData.param40 || '0'} km/hr</td></tr>
              <tr style="border-bottom: 1px solid #f0f0f0;"><td style="color: #666; padding: 0px 0;">Ignition</td><td style="padding: 0px 0; text-align: right; font-weight: 600; color: ${ignitionColor}">${ignitionStatus}</td></tr>
              <tr style="border-bottom: 1px solid #f0f0f0;"><td style="color: #666; padding: 0px 0;">GPS Status</td><td style="padding: 0px 0; text-align: right; font-weight: 600; color: ${gpsColor}">${gpsStatus}</td></tr>
              <tr style="border-bottom: 1px solid #f0f0f0;"><td style="color: #666; padding: 0px 0;">Customer</td><td style="color: #333; font-weight: 500; padding: 0px 0; text-align: right;">${vehicleData.param25 || 'N/A'} / ${vehicleData.param26 || 'N/A'}</td></tr>
              <tr><td style="color: #666; padding: 0px 0;">Location</td><td style="color: #333; font-weight: 500; padding: 0px 0; text-align: right;">${latitude.toFixed(4)}, ${longitude.toFixed(4)}</td></tr>
            </table>
          </div>
          <div style="background-color: #dddddd; color: #333; padding: 6px 12px; font-weight: 600; font-size: 11px; border-top: 1px solid #eee; border-bottom: 1px solid #eee; text-transform: uppercase; letter-spacing: 0.5px;">Device Information</div>
          <div style="padding: 10px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="color: #666; padding: 0px 0; width: 40%;">Serial No:</td><td style="color: #333; font-weight: 500; padding: 0px 0; text-align: right;">${vehicleData.param5 || 'N/A'}</td></tr>
              <tr><td style="color: #666; padding: 0px 0; width: 40%;">IMEI No:</td><td style="color: #333; font-weight: 500; padding: 0px 0; text-align: right;">${vehicleData.param4 || 'N/A'}</td></tr>
              <tr><td style="color: #666; padding: 0px 0; width: 40%;">Vendor:</td><td style="color: #333; font-weight: 500; padding: 0px 0; text-align: right;">${vehicleData.param9 || 'N/A'}</td></tr>
              <tr><td style="color: #666; padding: 0px 0; width: 40%;">ICCID:</td><td style="color: #333; font-weight: 500; padding: 0px 0; word-break: break-all; text-align: right;">${vehicleData.param6 || 'N/A'}</td></tr>
            </table>
          </div>
        </div>
      `;
    const mapboxgl = (window as any).mapboxgl;
    return new mapboxgl.Popup({
      offset: 10,
      className: 'vehicle-custom-popup',
      maxWidth: '300px'
    }).setHTML(popupContent);
  }

  animateLiveMarker(start: mapboxgl.LngLat, end: [number, number], vehicleData: any) {
    if (this.liveAnimationId) {
      cancelAnimationFrame(this.liveAnimationId);
    }

    const startPoint = turf.point([start.lng, start.lat]);
    const endPoint = turf.point(end);
    const distance = turf.distance(startPoint, endPoint);

    // The duration should match the polling interval to make the movement appear continuous.
    // The polling is set to 10000ms in trackVehicle().
    // This avoids the vehicle stopping and waiting for the next API update.
    const duration = 10000;

    if (distance < 0.001) { // ~1 meter, snap to end
      if (this.liveMarker) this.liveMarker.setLngLat(end);
      this.updateLiveRouteData(end, true); // Final update
      return;
    }

    const heading = turf.bearing(startPoint, endPoint);
    const startSpeed = Number(this.speedlive) || 0;
    const endSpeed = Number(vehicleData.param40) || 0;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      let progress = elapsed / duration;
      if (progress > 1) progress = 1;

      const currentLng = start.lng + (end[0] - start.lng) * progress;
      const currentLat = start.lat + (end[1] - start.lat) * progress;

      if (this.liveMarker) {
        this.liveMarker.setLngLat([currentLng, currentLat]);
        this.liveMarker.setRotation(heading);
      }

      // Interpolate panel data for smooth updates
      const currentSpeed = startSpeed + (endSpeed - startSpeed) * progress;
      this.speedlive = Math.round(currentSpeed);
      this.locationlive = `${currentLat.toFixed(4)}, ${currentLng.toFixed(4)}`;
      this.cdr.detectChanges();

      // Update route progressively
      this.updateLiveRouteData([currentLng, currentLat], false);

      if (progress < 1) {
        this.liveAnimationId = requestAnimationFrame(animate);
      } else {
        this.updateLivePanel(vehicleData); // Ensure final data is accurate
        this.liveAnimationId = null;
        // Final update to snap route to the end point
        this.updateLiveRouteData(end, true);
      }
    };

    this.liveAnimationId = requestAnimationFrame(animate);
  }

  updateLiveRouteData(coordinate: [number, number], isFinal: boolean) {
    const source = this.map.getSource('liveroutesource');
    if (!source) return;

    // Create a temporary array for drawing.
    // This includes the committed route plus the new animated coordinate.
    let coordinatesToDraw = [...this.liveRouteCoordinates];

    if (isFinal) {
      // When the animation for a segment is complete, permanently add the coordinate
      // to the main route array.
      const lastPoint = this.liveRouteCoordinates[this.liveRouteCoordinates.length - 1];
      if (!lastPoint || lastPoint[0] !== coordinate[0] || lastPoint[1] !== coordinate[1]) {
        this.liveRouteCoordinates.push(coordinate);
        coordinatesToDraw = this.liveRouteCoordinates; // Use the updated full route for the final draw
      }
    } else {
      // During animation, just append the current interpolated point for drawing.
      // Don't add it to the permanent `liveRouteCoordinates` array yet.
      coordinatesToDraw.push(coordinate);
    }

    (source as mapboxgl.GeoJSONSource).setData({
      'type': 'Feature',
      'properties': {},
      'geometry': {
        'type': 'LineString',
        'coordinates': coordinatesToDraw
      }
    });
  }

  updateLiveVehiclePosition(vehicleData: any) {
    if (!this.map || !vehicleData) return;
    const mapboxgl = (window as any).mapboxgl;

    const newLng = Number(vehicleData.param39);
    const newLat = Number(vehicleData.param38);

    if (isNaN(newLng) || isNaN(newLat) || (newLng === 0 && newLat === 0)) {
      console.error("Invalid coordinates for live tracking:", vehicleData);
      return;
    }
    const newCoordinates: [number, number] = [newLng, newLat];

    this.plotAlert(vehicleData);

    this.updateLivePanel(vehicleData);

    if (this.isFirstLiveTrack || !this.liveMarker) {
      if (this.liveMarker) this.liveMarker.remove();
      const el = this.createMarkerElement();
      const popup = this.createLiveVehiclePopup(vehicleData);

      this.liveMarker = new mapboxgl.Marker(el)
        .setLngLat(newCoordinates)
        .setPopup(popup)
        .addTo(this.map);

      this.liveRouteCoordinates = [newCoordinates];
      this.map.flyTo({ center: newCoordinates, zoom: 15 });
      this.isFirstLiveTrack = false;

      // Initial route setup
      this.updateLiveRouteData(newCoordinates, true);
    } else {
      const startCoordinates = this.liveMarker.getLngLat();
      this.animateLiveMarker(startCoordinates, newCoordinates, vehicleData);

      // Update popup content for the next click
      const popup = this.createLiveVehiclePopup(vehicleData);
      this.liveMarker.setPopup(popup);
    }

  }

  plotAlert(vehicleData: any) {
    const alertId = vehicleData.param47;
    const alertName = vehicleData.param48;

    // Assuming '01' and 'NA' are non-alert states.
    if (alertId && alertId !== '01' && alertName && alertName !== 'NA') {
      const lng = Number(vehicleData.param39);
      const lat = Number(vehicleData.param38);

      if (isNaN(lng) || isNaN(lat) || (lng === 0 && lat === 0)) {
        return; // Don't plot if coordinates are invalid
      }

      const newAlertFeature = {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [lng, lat]
        },
        properties: {
          alertName: alertName,
          time: vehicleData.param35
        }
      };

      this.alertFeatures.push(newAlertFeature);

      const source = this.map.getSource('alertsource') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: this.alertFeatures
        });
      }
    }
  }

  plotHistoryAlerts(alertFeatures: any[]) {
    if (!this.map) return;
    const mapboxgl = (window as any).mapboxgl;

    const imagesToLoad = Object.values(this.alertIconMappings);
    const imageLoadPromises = imagesToLoad.map(imgInfo => {
      return new Promise<void>((resolve) => {
        if (this.map.hasImage(imgInfo.name)) {
          return resolve();
        }
        this.map.loadImage(imgInfo.path, (error: any, image: any) => {
          if (error) {
            console.warn(`Failed to load alert icon: ${imgInfo.name}`, error);
          } else if (image && !this.map.hasImage(imgInfo.name)) {
            this.map.addImage(imgInfo.name, image);
          }
          resolve(); // Always resolve so one missing icon doesn't break everything
        });
      });
    });

    const addLayerAndSource = () => {
      // Clean up previous history alert layers before adding new ones
      if (this.map.getLayer('history-alert-layer')) this.map.removeLayer('history-alert-layer');
      if (this.map.getLayer('history-alert-circle-layer')) this.map.removeLayer('history-alert-circle-layer');
      if (this.map.getSource('history-alert-source')) this.map.removeSource('history-alert-source');

      this.map.addSource('history-alert-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: alertFeatures
        }
      });

      // 1. Add Circle Layer (Red Dot) - Ensures visibility even if icon fails
      this.map.addLayer({
        id: 'history-alert-circle-layer',
        type: 'circle',
        source: 'history-alert-source',
        paint: {
          'circle-radius': 6,
          'circle-color': '#d9534f', // Red color
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      this.map.addLayer({
        id: 'history-alert-layer',
        type: 'symbol',
        source: 'history-alert-source',
        layout: {
          'icon-image': ['get', 'icon'], // Use the property from GeoJSON
          'icon-size': 0.04, // Adjust size as needed
          'icon-allow-overlap': true,
          'icon-ignore-placement': true
        }
      });

      // Add popup on click for alerts (Handle both icon and circle clicks)
      const showPopup = (e: any) => {
        if (!e.features || e.features.length === 0) return;
        const coordinates = e.features[0].geometry.coordinates.slice();
        const { alertName, time } = e.features[0].properties;

        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(`<div style="padding: 5px; font-family: sans-serif; font-size: 12px; text-align: center;">
                      <div style="font-weight: bold; color: #d9534f;">${alertName}</div>
                      <div style="font-size: 10px; color: #555;">Time: ${time}</div>
                   </div>`)
          .addTo(this.map);
      };

      this.map.on('click', 'history-alert-layer', showPopup);
      this.map.on('click', 'history-alert-circle-layer', showPopup);
    };

    Promise.all(imageLoadPromises).then(() => {
      addLayerAndSource();
    });
  }

  vehiclenolive: any = ""; speedlive: any = ""; ignitionlive: any = ""; gpslive: any = "";
  pollingtimelive: any = ""; customerlive: any = ""; locationlive: any = "";
  deviceserialnolive: any = ""; IMEINolive: any = ""; Vendorlive: any = ""; ICCIDlive: any = "";
  displayHistory(historyData: any, vehicleNo?: string) {

    if (!historyData || !historyData.param1) return;
    const mapboxgl = (window as any).mapboxgl;

    const routeGeoJson = JSON.parse(historyData.param1);
    const coordinates = routeGeoJson.geometry.coordinates;

    // Fallback: If historyDataList is empty but we have a route, generate list from coordinates
    // We also try to merge metadata from the original listData if available, to ensure popup data shows up
    if (this.historyDataList.length === 0 && coordinates && coordinates.length > 0) {
      $('#livedetailsinfo').hide();
      $('#historydetailsinfo').show();
      const rawList = historyData.listData || [];
      this.historyDataList = coordinates.map((coord: any[], index: number) => {
        const rawItem = rawList[index] || {};
        return {
          ...rawItem, // Keep original metadata if available
          param1: vehicleNo || rawItem.param1 || rawItem.param15 || 'Vehicle',
          param21: rawItem.param21 || rawItem.param6 || '0',
          param3: rawItem.param3 || 'N/A',
          param20: rawItem.param20 || '0',
          param43: rawItem.param43 || '0',
          param2: rawItem.param2 || 'N/A',    //imeino
          param4: rawItem.param4 || '0', // Latitude
          param5: rawItem.param5 || '0',  // Longitude
          param6: rawItem.param6 || 'N/A',   //vehiclespeed
          param7: rawItem.param7 === '1' ? 'Valid' : 'In Valid',   //gpsstatus
          param9: rawItem.param9 ? (rawItem.param9 === '1' ? 'On' : 'Off') : 'N/A',   //ignitionnumber
          param15: rawItem.param15 || vehicleNo || 'Vehicle'

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
        param1: vehicleNo || startItem.param1 || startItem.param15 || 'Vehicle',
        param21: startItem.param21 || startItem.param6 || '0',
        param3: startItem.param3 || 'N/A',
        param20: startItem.param20 || '0',
        param43: startItem.param43 || '0',
        param2: startItem.param2 || 'N/A',    //imeino
        param4: startItem.param4, // Latitude
        param5: startItem.param5,  // Longitude
        param6: startItem.param6 || '0',   //vehiclespeed
        param7: startItem.param7 === '1' ? 'Valid' : 'In Valid',   //gpsstatus
        param9: startItem.param9 ? (startItem.param9 === '1' ? 'On' : 'Off') : 'N/A',   //ignitionnumber
        param15: startItem.param15 || vehicleNo || 'Vehicle'
      });
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

    // Filter valid coordinates to prevent "Invalid LngLat object" error
    const validCoordinates = coordinates.filter((coord: any) =>
      Array.isArray(coord) && coord.length >= 2 && !isNaN(coord[0]) && !isNaN(coord[1])
    );

    if (validCoordinates.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
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
        speed: item.param21 || item.param6 || 0,
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

  updatePanelData(item: any) {
    if (!item) return;
    this.panelData = {
      vehicleNo: item.param10 || this.selectedVehicleNo,
      time: item.param3 || 'N/A',
      speed: item.param21 || '0',
      ignition: (item.param20 === '1' || item.param29 === 'ON') ? 'On' : 'Off',
      gps: (item.param28 === 'Valid' || item.param41 === '1') ? 'Valid' : 'Invalid',
      lat: Number(item.param7) || 0,
      lng: Number(item.param8) || 0
    };
    this.cdr.detectChanges();
  }

  createMarkerElement() {
    const el = document.createElement('div');
    el.style.width = '40px';
    el.style.height = '40px';
    el.style.cursor = 'pointer';

    const img = new Image();
    img.src = 'assets/mapimages/car/green.png';

    img.onload = () => {
      el.style.backgroundImage = `url(${img.src})`;
      el.style.backgroundSize = 'contain';
      el.style.backgroundRepeat = 'no-repeat';
      el.style.backgroundPosition = 'center';
    };

    img.onerror = () => {
      el.style.width = '35px';
      el.style.height = '35px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#28a745';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.4)';
    };

    return el;
  }

  clearHistoryLayers() {
    this.stopHistory();
    this.historyDataList = [];

    if (this.map.getLayer('historylayer')) {
      this.map.removeLayer('historylayer');
    }
    if (this.map.getSource('historysource')) {
      this.map.removeSource('historysource');
    }
    if (this.historyStartMarker) {
      this.historyStartMarker.remove();
      this.historyStartMarker = null;
    }
    if (this.historyEndMarker) {
      this.historyEndMarker.remove();
      this.historyEndMarker = null;
    }
    if (this.liveMarker) {
      this.liveMarker.remove();
      this.liveMarker = null;
    }
  }

  clearAllLayers() {
    // if (this.liveInterval) clearInterval(this.liveInterval);

    // this.isLiveTracking = false;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.liveMarker) {
      this.liveMarker.remove();
      this.liveMarker = null;
    }
    if (this.historyStartMarker) {
      this.historyStartMarker.remove();
      this.historyStartMarker = null;
    }
    if (this.historyEndMarker) {
      this.historyEndMarker.remove();
      this.historyEndMarker = null;
    }

    this.removeLayerSource('livesource', 'livelayer');
    if (this.map.getLayer('history-route-arrow-layer')) this.map.removeLayer('history-route-arrow-layer');
    this.removeLayerSource('historysource', 'historylayer');
    if (this.map.getLayer('livearrowlayer')) this.map.removeLayer('livearrowlayer');
    this.removeLayerSource('liveroutesource', 'liveroutelayer');
    this.removeLayerSource('alertsource', 'alertlayer');
    if (this.map.getLayer('alertlayer-circle')) this.map.removeLayer('alertlayer-circle');

    if (this.map.getLayer('mainunclusterclusterPoint')) this.map.removeLayer('mainunclusterclusterPoint');
    if (this.map.getLayer('mainclusterPoint')) this.map.removeLayer('mainclusterPoint');
    if (this.map.getLayer('mainclusterLayer')) this.map.removeLayer('mainclusterLayer');
    if (this.map.getSource('mainclusterSource')) this.map.removeSource('mainclusterSource');

    // Clear History specific layers
    this.removeLayerSource('history-start-end-source', 'history-start-end-layer');
    this.removeLayerSource('history-alert-source', 'history-alert-layer');
    if (this.map.getLayer('history-alert-circle-layer')) this.map.removeLayer('history-alert-circle-layer');
    this.removeLayerSource('history-arrow-source', 'history-arrow-layer');
    if (this.historyTimer) clearInterval(this.historyTimer);
    this.isHistoryPlaying = false;
    this.historyPlaybackIndex = 0;


  }

  removeLayerSource(sourceId: string, layerId: string) {
    if (this.map.getLayer(layerId)) this.map.removeLayer(layerId);
    if (this.map.getSource(sourceId)) this.map.removeSource(sourceId);
  }

  getTotalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  getPageNumbers(): number[] {
    const total = this.getTotalPages();
    const pages: number[] = [];
    const maxPages = 8;

    if (total <= maxPages) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push(-1);
        pages.push(total);
      } else if (this.currentPage >= total - 3) {
        pages.push(1);
        pages.push(-1);
        for (let i = total - 4; i <= total; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push(-1);
        for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(-1);
        pages.push(total);
      }
    }
    return pages;
  }

  shouldShowPage(page: number): boolean {
    return page !== -1;
  }

  // Helper method to check if string has length
  hasLength(value: any): boolean {
    return value && String(value).length > 0;
  }
  // getVehicleDetailsByType

  exportToExcel() {

    this.isExporting = true;

    const request = {
      param1: this.searchText.trim(),
      param2: this.activationFilter,
      param3: '',
      param4: this.currentPage.toString(),
      param5: this.pageSize.toString(),
      param6: '', // State filter (empty for now)
      param7: this.rtoFilter || '',
      param8: this.statusFilter || 'Connected',
      param9: this.vehicleClassFilter || '',
      param14: this.vehicleTypeFilter || '',
      param15: this.gpsFilter,
      "pdfexcel": "excel",
      "type": "assetstatus"
    };



    this.vehicleService.getAssetStatusDetails(request).subscribe({
      next: (response: any) => {

        this.isExporting = false;

        if (response?.status && typeof response.entity === 'string') {

          const link = document.createElement('a');
          link.href = response.entity;
          link.setAttribute('download', '');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

        } else {
          this.errorMessage = ('Failed to generate Excel');
        }
      },
      error: () => {
        this.isExporting = false;
        this.errorMessage = ('Error exporting Excel');
      }
    });
  }


}
