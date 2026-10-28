import { createLeafletBasemap } from '../../../shared/components/map-layer-options/map-basemaps';
import { MapLayerOptionsComponent } from '../../../shared/components/map-layer-options/map-layer-options.component';
import { Component, OnInit, AfterViewInit, ChangeDetectorRef, OnDestroy, NgZone, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertService, AlertListResponse, ApiResponse } from '../../../core/services/alert.service';
import { ActivatedRoute, Router } from '@angular/router';
import { VehicleService } from '../../../core/services/vehicle.service'; // Import VehicleService
import Swal from 'sweetalert2';
import { NavigationStart } from '@angular/router';
import { filter } from 'rxjs/operators';
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import { Subscription } from 'rxjs';
import * as turf from '@turf/turf';
import dayjs from 'dayjs';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { ToastComponent } from '../../assets/inactive-assets/toast.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ToastService } from '../../../core/services/toast.service';

declare var $: any;
declare var jAlert: any;
import L from 'leaflet';
import 'leaflet.markercluster';

@Component({
    selector: 'app-today-alert',
    imports: [MapLayerOptionsComponent, CommonModule, FormsModule, NgxDaterangepickerMd, TimepickerModule, ToastComponent, NgSelectModule],
    templateUrl: './today-alert.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./today-alert.component.scss']
})
export class TodayAlertComponent implements OnInit, AfterViewInit, OnDestroy {
  roleId: any;
  alertDetails: any[] = [];
  loading = false;
  historyLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  searchText: string = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [20, 50, 100, 200, 500];
  totalCount = 0;
  pageCount = 0;
  alertType: string = '';

  sortKey: string = '';
  reverse: boolean = false;

  viewMode: 'map' | 'grid' | 'chart' | 'restalertgrid' = 'grid';

  // Map & Charts
  map: L.Map | null = null;
  private mainBasemap?: L.TileLayer;
  private singleBasemap?: L.TileLayer;
  private alertClusters?: L.MarkerClusterGroup;
  private singleHistoryLayers = L.layerGroup();
  private singleLiveLayers = L.layerGroup();
  private singleLiveRoute?: L.Polyline;
  private mapResizeObservers = new Map<L.Map, ResizeObserver>();
  private policeStationsSub?: Subscription;
  private liveTrackingSub?: Subscription;
  private historyTrackingSub?: Subscription;
  private modalGeneration = 0;
  private trackingGeneration = 0;
  alertCountChart: any;
  lineChart: any;
  hourwiseChart: any;

  // Data
  alertCounts: any[] = [];
  mapAlerts: any[] = [];
  hourlyCounts: any[] = [];

  // Filters & State
  selectedAlertId: string = '';
  selectedAlertName: string = '';
  formattedDate: string = '';
  headingMsg: string = 'Alert';

  // Alert Type List
  alertTypeList: any[] = [];
  selectedAlertType: any = null;
  get alertWidgetPage(): boolean { return this.route.snapshot.data['alertWidgetPage'] === true; }
  get alertWidgetName(): string { return this.route.snapshot.queryParamMap.get('alertName') || 'Alert details'; }
  isAlertTypeLoading: boolean = false;

  // Live Tracking for Single Alert Map
  singleAlertLiveVehicleId: string = '';
  singleAlertLiveData: any;
  singleAlertLiveMarker: any = null;
  singleAlertAlertMarker: any = null;
  singleAlertStaticVehicleMarker: any = null;
  singleAlertAnimationFrameId: number | null = null;
  singleAlertLivePathCoordinates: any[] = [];
  singleAlertLiveInterval: any;
  singleAlertInfoPanelData: any = {}; // For displaying live info in the modal

  private alertRefreshTimer: any;
  getAlertDetailVehiclesAPI: Subscription | null = null;
  singlemapAlertsSub: Subscription | null = null;
  AllmapAlertsSub: Subscription | null = null;
  chartAlertsSub: Subscription | null = null;
  getVehicleWiseAlertAPI: Subscription | null = null;
  type: string = '';
  // History Playback State
  historyDataList: any[] = [];
  historyPlaybackIndex: number = 0;
  isHistoryPlaying: boolean = false;
  historyTimer: any = null;
  speedSliderValue: number = 5;

  // History Tracking State
  poiData: any = {};
  liveMarker: any = null;
  historyStartMarker: any = null;
  historyEndMarker: any = null;
  animationFrameId: number | null = null;
  isPanelCollapsed: boolean = false;

  // Single Alert Modal History State (separate from main map history)
  singleAlertHistoryMarker: any = null;
  singleAlertHistoryStartMarker: any = null;
  singleAlertHistoryEndMarker: any = null;
  singleAlertHistoryAnimationFrameId: number | null = null;
  vendorList: any[] = [];
  selectedVendorFilter: any = null
  vehicletype: any = "NEW";
  expandedRow: number | null = null;
  vehicleWiseData: any[] = [];
  viewType: string = 'NEW'

  isApiCalling = false;
  isLayersVisible = false;
  showPoliceStations = true;
  currentStyle = 'streets-v11';
  private policeStationMarkers: L.Marker[] = [];

   isLegendOpen: boolean = false;
  isClusterLegendCollapsed: boolean = false;
  readonly clusterLegendRanges = [
    { label: '1 - 9 vehicles', color: '#27ae60' },
    { label: '10 - 29 vehicles', color: '#f39c12' },
    { label: '30 - 79 vehicles', color: '#e74c3c' },
    { label: '80+ vehicles', color: '#6c5ce7' }
  ];

  constructor(
    private alertService: AlertService,
    private vehicleService: VehicleService, // Inject VehicleService
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
    private zone: NgZone,
    public dashboardService: DashboardService,
    public toastService: ToastService
  ) {
    this.toastService.pageName = 'Current Day Alerts';
    this.roleId = sessionStorage.getItem('roleid');
    this.router.events
      .pipe(filter(event => event instanceof NavigationStart))
      .subscribe(() => {
        this.stopApiCalls();
      });
  }

  toggleClusterLegend(event?: Event): void {
    event?.stopPropagation();
    event?.preventDefault();
    this.isClusterLegendCollapsed = !this.isClusterLegendCollapsed;
    this.cdr.detectChanges();
  }

  stopApiCalls() {
    if (this.alertRefreshTimer) {
      clearTimeout(this.alertRefreshTimer);
      this.alertRefreshTimer = null;
    }
  }
  goToControlCenterDashboard(): void {
    void this.router.navigate(['/ControlCenterDashboard']);
  }
  async ngOnInit() {
    this.selectedAlertType = {
  param1: '10',
  param2: 'Panic'
};
    this.formatCurrentDate();
    if (this.roleId != '11') {
      this.loadVendorList();
    }
    // Initialize poiData with default date/time values
    this.poiData = {
      historyDate: dayjs(),
      fromTime: dayjs().startOf('day').toDate(),
      toTime: dayjs().endOf('day').toDate(),
      vehicleno: ''
    };
    if (this.alertWidgetPage) {
      const alertId = this.route.snapshot.queryParamMap.get('alertId');
      if (!alertId) { this.errorMessage = 'Select an alert widget from the dashboard.'; return; }
      this.selectedAlertType = { param1: alertId, param2: this.alertWidgetName };
      this.viewMode = 'grid';
      this.getAlertList();
      this.getTodayAlerts(1, true);
      return;
    }
    this.route.params.subscribe(params => {
      if (params['type']) {
        // You can now access params['type'] and params['date'] here
        this.type = params['type'];
      }
    });
    await this.getAlertList();
    setTimeout(() => {
      if (this.type.toLowerCase() == 'emergency') {
        this.viewMode = 'grid';
        this.selectedAlertType = this.alertTypeList.find(alert => alert.param1 == 10) || null;
      } else if (this.type.toLowerCase() == 'overspeed') {
        this.viewMode = 'restalertgrid';
        this.selectedAlertType = this.alertTypeList.find(alert => alert.param1 == 17) || null;
      } else if (this.type.toLowerCase() == 'harshbrake') {
        this.viewMode = 'restalertgrid';
        this.selectedAlertType = this.alertTypeList.find(alert => alert.param1 == 13) || null;
      }

      this.getTodayAlerts(1, true);
    }, 600);

  }

  ngAfterViewInit() {
    if (this.viewMode === 'map') {
      setTimeout(() => {
        this.initializeMap();
      }, 0); // Defer to ensure view is rendered
    }
    // Expose component instance to window for popup button callbacks
    (window as any).alertComponentInstance = this;
  }
  isComponentAlive = true;
  ngOnDestroy() {
    this.isComponentAlive = false; // 👈 STOP EVERYTHING

    if (this.alertRefreshTimer) {
      clearTimeout(this.alertRefreshTimer);
      this.alertRefreshTimer = null;
    }

    if (this.singleAlertLiveInterval) {
      clearInterval(this.singleAlertLiveInterval);
      this.singleAlertLiveInterval = null;
    }

    this.getAlertDetailVehiclesAPI?.unsubscribe();

    // Cleanup history tracking resources
    this.clearAllLayers();
    this.modalGeneration++;
    this.historyTrackingSub?.unsubscribe();
    this.policeStationsSub?.unsubscribe();
    this.singlemapAlertsSub?.unsubscribe();
    this.AllmapAlertsSub?.unsubscribe();
    this.chartAlertsSub?.unsubscribe();
    this.getVehicleWiseAlertAPI?.unsubscribe();
    this.clearPoliceStationMarkers();
    this.clearSingleAlertPreviewMarkers();
    if (this.map) this.disposeLeafletMap(this.map);
    if (this.singleAlertMap) this.disposeLeafletMap(this.singleAlertMap);
    this.map = this.singleAlertMap = null;

    // Remove window reference to prevent memory leaks
    if ((window as any).alertComponentInstance === this) {
      (window as any).alertComponentInstance = null;
    }
  }
  loadVendorList() {
    this.dashboardService.getVendorList().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.vendorList = response.entity;
        }
      },
      error: (error) => {
        { }
      }
    });
  }

  getAlertList() {
    this.isAlertTypeLoading = true;
    this.alertService.getAlertTypeList().subscribe({
      next: (response: any) => {
        this.isAlertTypeLoading = false;
        if (response.status && response.entity) {
          this.alertTypeList = response.entity;
        }
      },
      error: (err: any) => {
        this.isAlertTypeLoading = false;
        this.alertTypeList = [];
      }
    });
  }
  onVendorFilterChange(event: any) {
    this.getTodayAlerts(1, true);
  }

  getUnresolvedAlertsCountForChart() {
    this.alertService.getUnresolvedAlertsCount({
      param1: this.searchText,
      param2: '1',
      param3: '10',
      param4: 'Unresolved'
    }).subscribe({});
  }

  formatCurrentDate() {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    const dateFormatter = new Intl.DateTimeFormat('en-US', options);
    const parts = dateFormatter.formatToParts(date);

    const day = parts.find(p => p.type === 'day')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const year = parts.find(p => p.type === 'year')?.value;

    this.formattedDate = `${day}-${month}-${year}`;
  }

  // --- Grid View Logic ---

  getTodayAlerts(page: number = 1, showLoader: boolean = true) {

    if (!this.isComponentAlive) return;

    if (this.isApiCalling) return;

this.isApiCalling = true;
      
    if (!this.isComponentAlive) return;

    // ✅ Abort previous request if still pending
    if (this.getAlertDetailVehiclesAPI) {
      this.getAlertDetailVehiclesAPI.unsubscribe();
      this.getAlertDetailVehiclesAPI = null;
    }

    if (this.alertRefreshTimer) {
      clearTimeout(this.alertRefreshTimer);
      this.alertRefreshTimer = null;
    }

    this.loading = true;
    this.currentPage = page;
    const request = {
      param1: this.searchText, // search text
      param2: String(this.currentPage), // page no
      param3: this.pageSize === this.totalCount ? 'All' : String(this.pageSize), // items per page
      param4: this.formattedDate, // date
      param5: this.selectedAlertType ? this.selectedAlertType.param1 : "", // Handle null case when dropdown is cleared
      param6: "", //stateid
      param7: this.selectedVendorFilter ? String(this.selectedVendorFilter.param1) : '',
      param8: "",
      param9: this.alertType,
      param10: "",
      param11: this.vehicletype ? this.vehicletype : "", //vehicle type old/new filter
      pdfexcel: "" // Pass download type if set, else empty
    };

    this.getAlertDetailVehiclesAPI = this.alertService.getAlertDetailVehicles(request, showLoader).subscribe({
      next: (response: ApiResponse<AlertListResponse>) => {
        this.isApiCalling = false;
        if (!this.isComponentAlive) return; // Component destroyed, ignore response

        this.loading = false;
        // this.isFirstLoad = false;
        if (response.status && response.entity) {
          this.alertDetails = response.entity.listData || [];
          this.totalCount = response.entity.param1 || 0;

          // Logic to calculate page_count (items on current page)
          if (this.alertDetails.length < this.pageSize) {
            this.pageCount = this.alertDetails.length;
          } else {
            this.pageCount = this.pageSize;
          }

          // Clear error message when data loads successfully
          if (this.alertDetails.length > 0) {
            this.errorMessage = null;
          } else {
            this.isApiCalling = false;
            this.errorMessage = 'Current Day Alerts Are Not Available!';
          }
        } else {
          this.isApiCalling = false;
          this.alertDetails = [];
          this.totalCount = 0;
          this.pageCount = 0;
          this.errorMessage = 'Current Day Alerts Are Not Available!';
        }

        this.cdr.detectChanges();

        // ✅ Set interval only after successful response completes
        if (this.viewMode === 'grid' && this.isComponentAlive) {
          this.alertRefreshTimer = setTimeout(() => {
            this.getTodayAlerts(this.currentPage, false);
          }, 10000);
        }
      },
      error: (error: any) => {
        this.isApiCalling = false;
        if (!this.isComponentAlive) return; // Component destroyed, ignore error

        this.loading = false;
        this.alertDetails = [];
        this.totalCount = 0;
        this.pageCount = 0;

        this.cdr.detectChanges();

        // ✅ Set interval even on error for retry
        if (this.viewMode === 'grid' && this.isComponentAlive) {
          this.alertRefreshTimer = setTimeout(() => {
            this.getTodayAlerts(this.currentPage, false);
          }, 60000);   //10000
        }
      }
    });
  }

  // isFirstLoad = true;
  getSearchDetails() {
    this.currentPage = 1;
    // Clear previous alerts from map before loading new ones
    if (this.viewMode === 'map') {
      this.clearAlertLayers();
    }
    console.log("selectedAlertType", this.selectedAlertType)
    this.getTodayAlerts(1);
  }

  reloadData() {
    this.searchText = '';
    this.currentPage = 1;
    this.getTodayAlerts(1);
  }

  sort(key: string) {
    this.sortKey = key;
    this.reverse = !this.reverse;
    this.alertDetails.sort((a, b) => {
      const valA = (a as any)[key];
      const valB = (b as any)[key];
      let comparison = 0;
      if (valA > valB) {
        comparison = 1;
      } else if (valA < valB) {
        comparison = -1;
      }
      return this.reverse ? comparison * -1 : comparison;
    });
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.getTodayAlerts(page);
  }

  onPageSizeChange(event: Event) {
    const newSize = (event.target as HTMLSelectElement).value;
    this.pageSize = newSize === 'All' ? this.totalCount : Number(newSize);
    this.currentPage = 1;
    this.getTodayAlerts(1);
  }

  getTotalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const currentPage = this.currentPage;
    const maxPagesToShow = 5;
    const pages: number[] = [];

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    // Add first page
    pages.push(1);

    // Add ellipsis or pages
    if (currentPage > 3) {
      pages.push(-1); // Ellipsis
    }

    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    if (currentPage <= 3) {
      start = 2;
      end = 4;
    }

    if (currentPage >= totalPages - 2) {
      start = totalPages - 3;
      end = totalPages - 1;
    }

    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    // Add ellipsis or pages
    if (currentPage < totalPages - 2) {
      pages.push(-1); // Ellipsis
    }

    // Add last page
    if (!pages.includes(totalPages)) {
      pages.push(totalPages);
    }

    return pages;
  }

  getPaginatedData(): any[] {
    return this.alertDetails;
  }

  setViewMode(mode: 'map' | 'grid' | 'chart' | 'restalertgrid') {
    this.expandedRow = null;
    this.vehicleWiseData = [];
    if (this.viewMode === 'map' && mode !== 'map') {
      this.AllmapAlertsSub?.unsubscribe();
      this.policeStationsSub?.unsubscribe();
      this.clearAlertLayers();
      this.clearPoliceStationMarkers();
      if (this.map) this.disposeLeafletMap(this.map);
      this.map = null;
    }
    this.viewMode = mode;

    if (mode !== 'grid' && this.alertRefreshTimer) {
      clearTimeout(this.alertRefreshTimer);
      this.alertRefreshTimer = null;

    }

    if (mode === 'map') {
      setTimeout(() => {
        if (!this.map) {
          this.initializeMap();
        } else {
          this.map.invalidateSize({ pan: false });
          this.GetAllAlertsMap();
        }
      }, 200);
    } else if (mode === 'chart') {
      // When switching to chart view, show the pie chart by default.
      setTimeout(() => this.getEventAlertCount(), 0);
    } else if (mode === 'grid') {
      this.alertType = "";
      this.selectedAlertType = this.alertTypeList.find(alert => alert.param1 == 10) || null;
      this.totalCount = 0;
      this.selectedVendorFilter = null;
      this.vehicletype = "NEW";
      this.viewType = "NEW";
      this.alertDetails = [];
      this.getTodayAlerts(1);
    }
    else if (mode === 'restalertgrid') {
      this.totalCount = 0;
      this.alertType = "otheralerts";
      this.selectedAlertType = null;
      this.selectedVendorFilter = null;
      this.vehicletype = "NEW";
      this.viewType = "NEW";
      this.alertDetails = [];
      this.getTodayAlerts(1);
    }
  }
  // --- Pie Chart Logic ---
  getEventAlertCount(showLoader: boolean = true) {
    // ✅ Abort previous request if still pending
    if (this.chartAlertsSub) {
      this.chartAlertsSub.unsubscribe();
      this.chartAlertsSub = null;
    }

    if (this.alertRefreshTimer) {
      clearTimeout(this.alertRefreshTimer);
      this.alertRefreshTimer = null;
    }

    const request = {
      param1: "",
      param2: String(this.currentPage),
      param3: String(this.pageSize),
      param4: ""
    };

    this.chartAlertsSub = this.alertService.getAlertUnresolvingHistoryCount(request, showLoader).subscribe({
      next: (response: ApiResponse<AlertListResponse>) => {
        if (!this.isComponentAlive) return; // Component destroyed, ignore response

        if (response.status && response.entity && response.entity.listData) {
          const data = response.entity.listData;

          if (data.length === 0) {
            this.errorMessage = 'Current Day Alerts Are Not Available!';
            this.renderAlertCountChart([{
              category: "No Data Found",
              value: 0,
              alertid: "",
              alertname: ""
            }]);
          } else {
            this.errorMessage = null; // Clear error when data loads
            const chartData = data.map((item: any) => ({
              category: item.param3,
              value: item.param4,
              alertid: item.param2,
              alertname: item.param3
            }));

            this.renderAlertCountChart(chartData);
          }

          this.cdr.detectChanges();

          // ✅ Only set interval after successful response completes
          if (this.viewMode === 'chart' && this.isComponentAlive) {
            this.alertRefreshTimer = setTimeout(() => {
              this.getEventAlertCount(false); // Call again without loader
            }, 60000);
          }
        }
      },

      error: (err: any) => {
        if (!this.isComponentAlive) return; // Component destroyed, ignore error

        this.cdr.detectChanges();

        // ✅ Set interval even on error for retry
        if (this.viewMode === 'chart' && this.isComponentAlive) {
          this.alertRefreshTimer = setTimeout(() => {
            this.getEventAlertCount(false); // Retry without loader
          }, 60000);
        }
      }
    });
  }

  renderAlertCountChart(data: any[]) {
    if (typeof am4core === 'undefined') return;

    am4core.ready(() => {
      // If chart container isn't in the DOM, or if the hour-wise chart is showing, don't render pie chart.
      // This prevents errors on init and during auto-refresh.
      if (!document.getElementById('alertschartdiv') || this.hourwiseChart) {
        return;
      }
      am4core.useTheme(am4themes_animated);

      if (this.hourwiseChart) {
        this.hourwiseChart.dispose();
        this.hourwiseChart = null;
      }
      if (this.alertCountChart) this.alertCountChart.dispose();

      const chart = am4core.create("alertschartdiv", am4charts.XYChart3D);
      if (chart.logo) chart.logo.disabled = true;

      chart.data = data;

      // Create axes
      let categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
      categoryAxis.dataFields.category = "category";
      categoryAxis.renderer.labels.template.rotation = -45;
      categoryAxis.renderer.labels.template.hideOversized = false;
      categoryAxis.renderer.minGridDistance = 20;
      categoryAxis.renderer.labels.template.horizontalCenter = "right";
      categoryAxis.renderer.labels.template.verticalCenter = "middle";
      categoryAxis.renderer.labels.template.fontSize = 10;
      categoryAxis.renderer.cellStartLocation = 0.2;
      categoryAxis.renderer.cellEndLocation = 0.8;
      if (categoryAxis.tooltip) {
        categoryAxis.tooltip.label.rotation = 270;
        categoryAxis.tooltip.label.horizontalCenter = "right";
        categoryAxis.tooltip.label.verticalCenter = "middle";
      }

      let valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
      valueAxis.title.text = "Alert Count";
      valueAxis.title.fontWeight = "bold";

      // Create series
      let series = chart.series.push(new am4charts.ColumnSeries3D());
      series.dataFields.valueY = "value";
      series.dataFields.categoryX = "category";
      series.name = "Alerts";
      series.tooltipText = "{categoryX}: [bold]{valueY}[/]";
      series.columns.template.fillOpacity = .8;

      series.columns.template.cursorOverStyle = am4core.MouseCursorStyle.pointer;
      let columnTemplate = series.columns.template;
      columnTemplate.strokeWidth = 2;
      columnTemplate.strokeOpacity = 1;
      columnTemplate.stroke = am4core.color("#FFFFFF");

      columnTemplate.adapter.add("fill", function (fill, target) {
        if (target.dataItem) { return chart.colors.getIndex(target.dataItem.index); }
        return fill;
      });

      columnTemplate.adapter.add("stroke", function (stroke, target) {
        if (target.dataItem) { return chart.colors.getIndex(target.dataItem.index); }
        return stroke;
      });

      chart.cursor = new am4charts.XYCursor();
      chart.cursor.lineX.strokeOpacity = 0;
      chart.cursor.lineY.strokeOpacity = 0;



      this.alertCountChart = chart;
    });
  }

  getHeadingMessage(alertid: string): string {
    switch (alertid) {
      case '3': return 'Power Disconnect';
      case '4': return 'Internal Battery Low';
      case '5': return 'Battery Charge';
      case '9': return 'Tamper';
      case '10': case '26': return 'Emergency';
      case '13': return 'Harsh Brake';
      case '14': return 'Harsh Acceleration';
      case '15': return 'Rash Turning';
      case '17': case '25': return 'Overspeed';
      case '18': return 'Geofence Entry';
      case '19': return 'Geofence Exit';
      case '22': return 'Tilt Alert';
      case '30': return 'Route Deviation';
      case '8': return 'Ignition Off';
      case '7': return 'Ignition On';
      default: return 'Alert';
    }
  }

  getHourCChart() {
    if (typeof am4core === 'undefined' || typeof am4charts === 'undefined') {
      this.errorMessage = 'Chart library failed to load. Please refresh the page.';
      return;
    }

    // am4core.ready ensures that the chart libraries are fully loaded
    // before we try to use them.
    am4core.ready(() => {
      const request = {
        param1: "",
        param2: "1", // page
        param3: "1000", // get all data for chart
        param4: this.selectedAlertName // can be empty
      };

      this.alertService.getAlertUnresolvingHistoryTimeCount(request).subscribe({
        next: (response: ApiResponse<AlertListResponse>) => {
          if (response.status && response.entity && response.entity.listData) {
            this.hourlyCounts = response.entity.listData;
            this.renderHourwiseChart(this.hourlyCounts);
          } else {
            this.renderHourwiseChart([]);
          }
        },
        error: (err: any) => {
          this.renderHourwiseChart([]);
        }
      });
    });
  }

  renderHourwiseChart(data: any[]) {
    // This function now assumes am4core is ready because it's called from getHourCChart.
    am4core.useTheme(am4themes_animated);

    // Dispose pie chart if it exists to prevent "Chart not disposed" error
    if (this.alertCountChart) {
      this.alertCountChart.dispose();
      this.alertCountChart = null;
    }

    if (this.hourwiseChart) {
      this.hourwiseChart.dispose();
    }

    const chart = am4core.create("alertschartdiv", am4charts.XYChart3D);
    this.hourwiseChart = chart;

    if (chart.logo) chart.logo.disabled = true;

    const chartData = data.map(item => {
      const dateTimeString = item.param6; // e.g., "17-Feb-2026 04:00 PM"
      const dateTimeParts = dateTimeString.split(' '); // ["17-Feb-2026", "04:00", "PM"]
      const dateParts = dateTimeParts[0].split('-'); // ["17", "Feb", "2026"]
      const timeParts = dateTimeParts[1].split(':'); // ["04", "00"]

      const day = parseInt(dateParts[0], 10);
      const monthStr = dateParts[1];
      const year = parseInt(dateParts[2], 10);
      let hour = parseInt(timeParts[0], 10);
      const minute = parseInt(timeParts[1], 10);
      const ampm = dateTimeParts[2];

      const monthMap: { [key: string]: number } = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      const month = monthMap[monthStr];

      if (ampm === 'PM' && hour < 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;

      return {
        "date": new Date(year, month, day, hour, minute), // Keep for sorting
        "timeCategory": `${day}-${monthStr}-${year} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${ampm}`, // For category axis
        "count": Number(item.param4)
      };
    }).sort((a, b) => a.date.getTime() - b.date.getTime());

    chart.data = chartData;

    // Create axes
    const categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
    categoryAxis.dataFields.category = "timeCategory";
    categoryAxis.renderer.labels.template.rotation = -45;
    categoryAxis.renderer.labels.template.hideOversized = false;
    categoryAxis.renderer.minGridDistance = 20;
    categoryAxis.renderer.labels.template.horizontalCenter = "right";
    categoryAxis.renderer.labels.template.verticalCenter = "middle";
    categoryAxis.renderer.labels.template.fontSize = 10;
    categoryAxis.renderer.cellStartLocation = 0.2;
    categoryAxis.renderer.cellEndLocation = 0.8;
    if (categoryAxis.tooltip) {
      categoryAxis.tooltip.label.rotation = 270;
      categoryAxis.tooltip.label.horizontalCenter = "right";
      categoryAxis.tooltip.label.verticalCenter = "middle";
    }

    const valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
    valueAxis.title.text = "Alert Counts";
    valueAxis.title.fontWeight = "bold";

    // Create series
    const series = chart.series.push(new am4charts.ColumnSeries3D());
    series.dataFields.valueY = "count";
    series.dataFields.categoryX = "timeCategory";
    series.name = "Alerts";
    series.tooltipText = "{categoryX}: [bold]{valueY}[/]";
    series.columns.template.fillOpacity = .8;

    const columnTemplate = series.columns.template;
    columnTemplate.strokeWidth = 2;
    columnTemplate.strokeOpacity = 1;
    columnTemplate.stroke = am4core.color("#FFFFFF");

    columnTemplate.events.on("hit", (ev) => {
      // Use NgZone to run navigation inside Angular's zone, as amCharts events are outside.
      this.zone.run(() => {
        //console.log(`Chart column clicked. Navigating to /VendorWiseDetails with filter: ${this.selectedAlertName}`);
        this.router.navigate(['/VendorWiseDetails', this.selectedAlertName, '0', '0']);
      });
    });

    columnTemplate.adapter.add("fill", (fill, target) => {
      if (target.dataItem) {
        return chart.colors.getIndex(target.dataItem.index);
      }
      return fill;
    });
    columnTemplate.adapter.add("stroke", (stroke, target) => {
      if (target.dataItem) {
        return chart.colors.getIndex(target.dataItem.index);
      }
      return stroke;
    });

    chart.cursor = new am4charts.XYCursor();
    chart.cursor.lineX.strokeOpacity = 0;
    chart.cursor.lineY.strokeOpacity = 0;

    chart.padding(20, 20, 20, 20);
    chart.colors.step = 3;
    chart.responsive.enabled = true;

    if (chartData.length === 0) {
      let label = chart.createChild(am4core.Label);
      label.text = "No data to display for the selected alert type.";
      label.align = "center";
      label.valign = "middle";
      label.fontSize = 16;
    }
  }

  // --- Map Logic ---

  initializeMap() {
    if (!this.isComponentAlive || this.viewMode !== 'map' || !document.getElementById('map')) return;
    if (this.map) this.disposeLeafletMap(this.map);
    this.map = this.createLeafletMap('map', [22.978624, 87.74780], 8);
    this.mainBasemap = createLeafletBasemap(this.currentStyle).addTo(this.map);
    this.addWmsLayer(this.map);
    if (this.showPoliceStations) this.loadPoliceStations();
    this.GetAllAlertsMap();
  }

  private createLeafletMap(container: string, center: L.LatLngExpression, zoom: number): L.Map {
    const map = L.map(container, { center, zoom, minZoom: 4, maxZoom: 18, attributionControl: false });
    const poweredBy = new L.Control({ position: 'bottomright' });
    poweredBy.onAdd = () => {
      const el = L.DomUtil.create('div', 'leaflet-powered-by-dimts');
      el.textContent = 'Power by DIMTS';
      L.DomEvent.disableClickPropagation(el);
      return el;
    };
    poweredBy.addTo(map);
    
    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    observer.observe(map.getContainer());
    this.mapResizeObservers.set(map, observer);
    return map;
  }

  private disposeLeafletMap(map: L.Map): void {
    this.mapResizeObservers.get(map)?.disconnect();
    this.mapResizeObservers.delete(map);
    map.remove();
  }

  private createLeafletMarker(element: HTMLElement, coordinates: [number, number], rotation = 0, anchor?: L.PointExpression): L.Marker {
    const width = parseInt(element.style.width) || 28;
    const height = parseInt(element.style.height) || 28;
    const marker = L.marker([coordinates[1], coordinates[0]], {
      icon: L.divIcon({ className: 'today-alert-marker', html: element, iconSize: [width, height], iconAnchor: anchor || [width / 2, height / 2] })
    });
    marker.on('add', () => this.rotateLeafletMarker(marker, rotation));
    return marker;
  }

  private rotateLeafletMarker(marker: L.Marker, rotation: number): void {
    const content = marker.getElement()?.firstElementChild as HTMLElement | null;
    if (content) content.style.transform = `rotate(${rotation}deg)`;
  }

  toggleLayers(): void {
    this.isLayersVisible = !this.isLayersVisible;
  }

  togglePoliceStations(): void {
    if (!this.showPoliceStations) {
      this.policeStationsSub?.unsubscribe();
      this.clearPoliceStationMarkers();
    } else if (this.map || this.singleAlertMap) this.loadPoliceStations();
  }

  singleAlertStyle = 'streets-v11';

  changeSingleAlertMapStyle(style: string): void {
    this.singleAlertStyle = style;
    if (!this.singleAlertMap) return;
    const layer = createLeafletBasemap(style).addTo(this.singleAlertMap);
    this.singleBasemap?.remove();
    this.singleBasemap = layer;
  }

  changeMapStyle(style: string): void {
    this.currentStyle = style;
    if (!this.map) return;
    const layer = createLeafletBasemap(style).addTo(this.map);
    this.mainBasemap?.remove();
    this.mainBasemap = layer;
  }

  private addWmsLayer(map: L.Map): void {
    L.tileLayer.wms('https://vlts.wb.gov.in/geoserver/wbsdcmap/wms', {
      layers: 'wbsdcmap:india_state', format: 'image/png', transparent: true, version: '1.1.1', zIndex: 200
    }).addTo(map);
  }


  private loadPoliceStations(): void {
    this.clearPoliceStationMarkers();
    this.policeStationsSub?.unsubscribe();
    this.policeStationsSub = this.alertService.getPoliceStationDetails({ param1: '', param2: 1, param3: 20 }).subscribe({
      next: (response: any) => {
        const stations = response?.entity?.listData;
        if (!this.isComponentAlive || (!this.map && !this.singleAlertMap) || !this.showPoliceStations || !Array.isArray(stations)) return;
        [this.map, this.singleAlertMap].forEach(map => {
          if (!map) return;
          stations.forEach((station: any) => {
            const lat = Number(station?.param9); const lng = Number(station?.param10);
            if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return;
            const el = document.createElement('div');
            el.className = 'police-station-map-marker';
            el.style.width = '34px'; el.style.height = '34px'; el.style.cursor = 'pointer';
            el.style.background = "url('assets/mapimages/police-station.png') center/contain no-repeat";
            this.policeStationMarkers.push(this.createLeafletMarker(el, [lng, lat])
              .bindPopup(this.createPoliceStationPopup(station, lat, lng), { className: 'police-station-popup', maxWidth: 235 })
              .addTo(map));

          });
        });
      },
      error: () => { /* Alert map remains usable if police station API fails. */ }
    });
  }

  private createPoliceStationPopup(station: any, lat: number, lng: number): HTMLElement {
    const root = document.createElement('div'); root.className = 'police-popup-card';
    const header = document.createElement('div'); header.className = 'police-popup-card__header';
    const badge = document.createElement('div'); badge.className = 'police-popup-card__badge';
    const image = document.createElement('img'); image.src = 'assets/mapimages/police-station.png'; image.alt = 'Police station';
    badge.append(image);
    const heading = document.createElement('div'); heading.className = 'police-popup-card__heading';
    const title = document.createElement('strong'); const type = document.createElement('small');
    title.textContent = String(station?.param2 || 'Police Station'); type.textContent = String(station?.param3 || 'Police Station');
    heading.append(title, type); header.append(badge, heading); root.append(header);
    const body = document.createElement('div'); body.className = 'police-popup-card__body';
    [['District', station?.param7 || '-'], ['State', station?.param8 || '-'], ['Location', `${lat.toFixed(5)}, ${lng.toFixed(5)}`]].forEach(([label, value]) => {
      const row = document.createElement('div');
      row.className = 'police-popup-card__row';
      const key = document.createElement('span');
      const val = document.createElement('b');
      key.textContent = String(label);
      val.textContent = String(value);
      row.append(key, val);
      body.append(row);
    });
    const link = document.createElement('a'); link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.className = 'police-popup-card__action';
    const stationName = String(station?.param2 || 'Police Station');
    const googleMapsQuery = `${stationName} Police Station, ${lat},${lng}`;
    link.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(googleMapsQuery)}`;
    link.title = `Show ${stationName} on Google Maps`;
    link.textContent = 'Locate Police Station'; body.append(link); root.append(body); return root;
  }

  private clearPoliceStationMarkers(): void {
    this.policeStationMarkers.forEach(marker => marker.remove());
    this.policeStationMarkers = [];
  }

  private getAlertIconUrl(alertId: string): string {
    const images = [
      { id: 'powerdisconnect-image', url: 'assets/images/mapimages/alertimage/powerdisconnect.png' },
      { id: 'batterylow-image', url: 'assets/images/mapimages/alertimage/batterylow.png' },
      { id: 'batterycharge-image', url: 'assets/images/mapimages/alertimage/batterycharge.png' },
      { id: 'tamper-image', url: 'assets/images/mapimages/alertimage/tamper.png' },
      { id: 'panic-image', url: 'assets/images/mapimages/alertimage/panic.png' },
      { id: 'harshbrake-image', url: 'assets/images/mapimages/alertimage/harshbrake_new.png' },
      { id: 'harshacceleration-image', url: 'assets/images/mapimages/alertimage/harshacceleration_new.png' },
      { id: 'rashturning-image', url: 'assets/images/mapimages/alertimage/rashturning.png' },
      { id: 'overspeed-image', url: 'assets/images/mapimages/alertimage/overspeed_new.png' },
      { id: 'geofenceentry-image', url: 'assets/images/mapimages/alertimage/geofenceentry.png' },
      { id: 'geofenceexit-image', url: 'assets/images/mapimages/alertimage/geofenceexit.png' },
      { id: 'tilt-image', url: 'assets/images/mapimages/alertimage/tilt.png' },
      { id: 'routedeviation-image', url: 'assets/images/mapimages/alertimage/routedeviation.png' },
      { id: 'ignitionoff-image', url: 'assets/images/mapimages/alertimage/ignitionOff.png' },
      { id: 'ignitionon-image', url: 'assets/images/mapimages/alertimage/ignitionOn.png' },
      { id: 'otheralert-image', url: 'assets/images/mapimages/alertimage/alertbell_new.png' }
    ];

    return images.find(image => image.id === this.getAlertImageId(String(alertId)))!.url;
  }

  getAlertImageId(alertid: string): string {
    switch (alertid) {
      case '3': return 'powerdisconnect-image';
      case '4': return 'batterylow-image';
      case '5': return 'batterycharge-image';
      case '9': return 'tamper-image';
      case '10': case '26': return 'panic-image';
      case '13': return 'harshbrake-image';
      case '14': return 'harshacceleration-image';
      case '15': return 'rashturning-image';
      case '17': case '25': return 'overspeed-image';
      case '18': return 'geofenceentry-image';
      case '19': return 'geofenceexit-image';
      case '22': return 'tilt-image';
      case '30': return 'routedeviation-image';
      case '8': return 'ignitionoff-image';
      case '7': return 'ignitionon-image';
      default: return 'otheralert-image';
    }
  }

  GetAllAlertsMap(showLoader: boolean = true) {
    if (!this.map) return;

    // ✅ Abort previous request if still pending
    if (this.AllmapAlertsSub) {
      this.AllmapAlertsSub.unsubscribe();
      this.AllmapAlertsSub = null;
    }

    if (this.alertRefreshTimer) {
      clearTimeout(this.alertRefreshTimer);
      this.alertRefreshTimer = null;
    }

    // ⚠️ ONLY clear layers on first call or manual search, NOT on interval updates
    // Check if this is NOT an interval call (showLoader = true means manual/first call)
    if (showLoader === true) {
      this.clearAlertLayers();
    }
    const request = {
      param1: "",
      param2: "10", //itemperpage
      param3: "",
      param4: this.formattedDate,
      param5: (typeof this.selectedAlertType === 'string' ? this.selectedAlertType : this.selectedAlertType?.param1) || "10", // Handle null case when dropdown is cleared
      param6: "10",
      param7: "",
      param8: "",
      param9: "",
      param10: "",
      param11: this.vehicletype,
      pdfexcel: ""
    };

    this.AllmapAlertsSub = this.alertService
      .getAlertDetailVehicles(request, showLoader)
      .subscribe({
        next: (response: ApiResponse<AlertListResponse>) => {
          if (!this.isComponentAlive) return; // Component destroyed, ignore response

          if (response.status && response.entity && response.entity.listData && response.entity.listData.length > 0) {
            this.mapAlerts = response.entity.listData;
            this.plotAlertsOnMap(this.mapAlerts);
            this.errorMessage = null; // Clear error message when data loads successfully
          } else {
            this.clearAlertLayers();
            this.errorMessage = 'Current Day Alerts Are Not Available!';
          }

          this.cdr.detectChanges();

          // ✅ Only set interval after successful response completes
          if (this.viewMode === 'map' && this.isComponentAlive) {
            this.alertRefreshTimer = setTimeout(() => {
              this.GetAllAlertsMap(false);
            }, 60000);
          }
        },
        error: (err: any) => {
          if (!this.isComponentAlive) return; // Component destroyed, ignore error

          this.cdr.detectChanges();

          // ✅ Set interval even on error for retry
          if (this.viewMode === 'map' && this.isComponentAlive) {
            this.alertRefreshTimer = setTimeout(() => {
              this.GetAllAlertsMap(false);
            }, 60000);
          }
        }
      });
  }

  plotAlertsOnMap(data: any[]) {
    if (!this.map || this.viewMode !== 'map') return;
    this.clearAlertLayers();
    this.alertClusters = L.markerClusterGroup({
      maxClusterRadius: 50, disableClusteringAtZoom: 15,
      iconCreateFunction: cluster => {
        const count = cluster.getChildCount();
        const color = count < 10 ? '#27ae60' : count < 30 ? '#f39c12' : count < 80 ? '#e74c3c' : '#6c5ce7';
        const radius = count < 10 ? 18 : count < 30 ? 22 : count < 80 ? 26 : 30;
        return L.divIcon({ className: 'today-alert-cluster', html: `<span style="background:${color}">${count}</span>`, iconSize: [radius * 2, radius * 2] });
      }
    });
    data.forEach(item => {
      const coordinates = this.getAlertCoordinates(item);
      if (!coordinates) return;
      const props = {
        vehicleno: item.param9, speed: item.param21, latitude: String(coordinates[1]), longitude: String(coordinates[0]),
        deviceno: item.param25, imeino: item.param4, alertname: item.param8, eventtime: item.param3,
        direction: item.param23, ignition: item.param20 === '1' ? 'On' : 'Off'
      };
      const marker = L.marker([coordinates[1], coordinates[0]], {
        icon: L.icon({ iconUrl: this.getAlertIconUrl(item.param2), iconSize: [28, 28], iconAnchor: [14, 14] })
      }).bindPopup(this.createPopupContent(props), { maxWidth: 320, className: 'alert-map-popup' });
      marker.on('click', () => { this.poiData.vehicleno = props.vehicleno; });
      this.alertClusters!.addLayer(marker);
    });
    this.alertClusters.addTo(this.map);
  }

  clearAlertLayers() {
    this.alertClusters?.clearLayers();
    this.alertClusters?.remove();
    this.alertClusters = undefined;
  }


  private getAlertCoordinates(item: any): [number, number] | null {
    const fallbackLat = Number(item?.param6);
    const fallbackLng = Number(item?.param7);
    const fallbackCoordinates = this.isValidCoordinatePair(fallbackLng, fallbackLat)
      ? [fallbackLng, fallbackLat] as [number, number]
      : null;

    const geometryValue = item?.param27;
    if (typeof geometryValue !== 'string' || !geometryValue.trim()) {
      return fallbackCoordinates;
    }

    try {
      const parsedGeometry = JSON.parse(geometryValue);
      const rawCoordinates = parsedGeometry?.features?.geometry?.coordinates
        || parsedGeometry?.geometry?.coordinates
        || parsedGeometry?.features?.[0]?.geometry?.coordinates;

      if (!Array.isArray(rawCoordinates) || rawCoordinates.length < 2) {
        return fallbackCoordinates;
      }

      const first = Number(rawCoordinates[0]);
      const second = Number(rawCoordinates[1]);
      if (!Number.isFinite(first) || !Number.isFinite(second)) {
        return fallbackCoordinates;
      }

      const directCoordinates = [first, second] as [number, number];
      const swappedCoordinates = [second, first] as [number, number];

      if (fallbackCoordinates) {
        if (this.coordinatesRoughlyMatch(directCoordinates, fallbackCoordinates)) {
          return directCoordinates;
        }
        if (this.coordinatesRoughlyMatch(swappedCoordinates, fallbackCoordinates)) {
          return swappedCoordinates;
        }
      }

      if (this.isValidCoordinatePair(directCoordinates[0], directCoordinates[1])) {
        return directCoordinates;
      }
      if (this.isValidCoordinatePair(swappedCoordinates[0], swappedCoordinates[1])) {
        return swappedCoordinates;
      }
    } catch {
      return fallbackCoordinates;
    }

    return fallbackCoordinates;
  }

  private isValidCoordinatePair(lng: number, lat: number): boolean {
    return Number.isFinite(lng) && Number.isFinite(lat) && Math.abs(lng) <= 180 && Math.abs(lat) <= 90;
  }

  private coordinatesRoughlyMatch(a: [number, number], b: [number, number]): boolean {
    return Math.abs(a[0] - b[0]) < 0.0001 && Math.abs(a[1] - b[1]) < 0.0001;
  }

  clearAllLayers() {
    // Stop any ongoing history playback
    this.pauseHistory();
    this.historyPlaybackIndex = 0;

    // Cancel animation frames
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.singleAlertAnimationFrameId) {
      cancelAnimationFrame(this.singleAlertAnimationFrameId);
      this.singleAlertAnimationFrameId = null;
    }
    if (this.singleAlertHistoryAnimationFrameId) {
      cancelAnimationFrame(this.singleAlertHistoryAnimationFrameId);
      this.singleAlertHistoryAnimationFrameId = null;
    }

    // Clear single alert live tracking
    this.clearSingleAlertLiveTrackingLayers();

    // Clear single alert history tracking
    this.clearSingleAlertHistoryLayers();

    // Remove alert layers
    this.clearAlertLayers();

    // Clear alert polling timer to prevent re-adding alert layers during history
    if (this.alertRefreshTimer) {
      clearTimeout(this.alertRefreshTimer);
      this.alertRefreshTimer = null;
    }

    // Remove history markers from main map
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

    // Clear history data
    this.historyDataList = [];
  }

  clearSingleAlertHistoryLayers() {
    this.pauseHistory();
    // Stop any ongoing history animation on single alert map
    if (this.singleAlertHistoryAnimationFrameId) {
      cancelAnimationFrame(this.singleAlertHistoryAnimationFrameId);
      this.singleAlertHistoryAnimationFrameId = null;
    }

    // Remove history marker from single alert map
    if (this.singleAlertHistoryMarker) {
      this.singleAlertHistoryMarker.remove();
      this.singleAlertHistoryMarker = null;
    }
    if (this.singleAlertHistoryStartMarker) {
      this.singleAlertHistoryStartMarker.remove();
      this.singleAlertHistoryStartMarker = null;
    }
    if (this.singleAlertHistoryEndMarker) {
      this.singleAlertHistoryEndMarker.remove();
      this.singleAlertHistoryEndMarker = null;
    }

    this.singleHistoryLayers.clearLayers();
  }

  createPopupContent(props: any): string {
    const vehicleNo = props.vehicleno || 'N/A';
    const alertName = props.alertname || 'Alert';
    const eventTime = props.eventtime || 'N/A';
    const speed = props.speed || '0';
    const ignition = props.ignition || 'N/A';
    const lat = props.latitude || props.param6 || '0';
    const lng = props.longitude || props.param7 || '0';
    const imei = props.imeino || props.param4 || 'N/A';
    const ignitionColor = ignition.toLowerCase() === 'on' ? '#28a745' : '#dc3545';
    const ignitionBg = ignition.toLowerCase() === 'on' ? '#e8f5e9' : '#fdecea';

    return `
       <div style="width: 219px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; overflow: hidden; border-radius: 8px; background: #fff; box-shadow: 0 10px 25px rgba(0,0,0,0.15);">
         <!-- Header -->
         <div style="background: linear-gradient(135deg, #0b58b9, #1e3a8a); color: #fff; padding: 1px 12px; display: flex; align-items: center; gap: 8px; position: relative;">
           <div style="background: rgba(255,255,255,0.2); width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
             <i class="fa fa-bell" style="font-size: 13px;"></i>
           </div>
           <div style="flex-grow: 1; overflow: hidden;">
             <div style="font-weight: 700; font-size: 13px; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">${vehicleNo}</div>
             <div style="font-size: 10px; opacity: 0.85;">${alertName}</div>
           </div>
          
         </div>

         <!-- Content Section -->
         <div style="padding: 12px;">
           <!-- Status Row -->
           <div style="display: flex; gap: 8px; margin-bottom: 10px;">
             <div style="flex: 1; background: #f4f7fa; padding: 6px 8px; border-radius: 4px; text-align: center;">
               <div style="font-size: 9px; color: #72849a; text-transform: uppercase; font-weight: 600; margin-bottom: 2px;">Speed</div>
               <div style="font-size: 12px; font-weight: 700; color: #1a202c;">${speed} <small style="font-weight: 400; font-size: 9px;">km/h</small></div>
             </div>
             <div style="flex: 1; background: ${ignitionBg}; padding: 6px 8px; border-radius: 4px; text-align: center;">
               <div style="font-size: 9px; color: #72849a; text-transform: uppercase; font-weight: 600; margin-bottom: 2px;">Ignition</div>
               <div style="font-size: 12px; font-weight: 700; color: ${ignitionColor};">${ignition}</div>
             </div>
           </div>

           <!-- Info Lines -->
           <div style="display: flex; flex-direction: column; gap: 6px;">
             <div style="display: flex; align-items: center; gap: 8px; font-size: 11px; color: #4a5568;">
               <i class="fa fa-calendar-o" style="color: #0b58b9; width: 12px; text-align: center;"></i>
               <span>${eventTime}</span>
             </div>
             <div style="display: flex; align-items: center; gap: 8px; font-size: 11px; color: #4a5568;">
               <i class="fa fa-map-marker" style="color: #0b58b9; width: 12px; text-align: center;"></i>
               <span>${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}</span>
             </div>
           </div>
         </div>

         <!-- Action Buttons Footer -->
         <div style="padding: 8px 12px 12px; background: #f8fafc; border-top: 1px solid #edf2f7; display: flex; gap: 8px;">
           <button onclick="window.alertComponentInstance.openSingleAlertMapWithData(${JSON.stringify(props).replace(/"/g, '&quot;')})" 
             style="flex: 1; background: #fff; border: 1px solid #0b58b9; color: #0b58b9; padding: 6px 0; border-radius: 4px; font-size: 10px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 4px;">
             <i class="fa fa-history"></i> History
           </button>
           <button onclick="window.alertComponentInstance.startLiveTrackingFromPopup('${vehicleNo}', '${imei}', ${lat}, ${lng})" 
             style="flex: 1; background: #0b58b9; border: 1px solid #0b58b9; color: white; padding: 6px 0; border-radius: 4px; font-size: 10px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 4px;">
             <i class="fa fa-play"></i> Live Track
           </button>
         </div>
       </div>
     `;
  }

  // Method called from popup's "History Track" button
  openSingleAlertMapWithData(props: any) {
    // Convert popup props to alert format expected by openSingleAlertMap
    const alert = {
      param2: this.getAlertIdFromName(props.alertname) || '10',
      param6: props.latitude || props.param6 || '0',
      param7: props.longitude || props.param7 || '0',
      param9: props.vehicleno || 'N/A',
      param4: props.imeino || props.param4 || 'N/A',
      param8: props.alertname || 'Alert',
      param3: props.eventtime || 'N/A'
    };
    // Open modal and start history tracking
    this.openSingleAlertMapWithMode(alert, 'history');
    
  }

  // Method called from popup's "Live Track" button
   startLiveTrackingFromPopup(vehicleNo: string, imei: string, lat: number, lng: number) {
     // Create alert object from popup data
     const alert = {
       param2: '10', // Default alert ID
       param6: lat,
       param7: lng,
       param9: vehicleNo,
       param4: imei,
       param8: 'Alert',
       param3: new Date().toLocaleString()
     };
     // Open modal and start live tracking
     this.openSingleAlertMapWithMode(alert, 'live');
   }

   // ==========================================
   // Vehicle Info Panel (Slide-in from right-bottom)
   // ==========================================

   openVehicleInfoPanel(props: any, type: string = 'popup') {
     this.vehicleInfoPanelData = {
       vehicleno: props.vehicleno || 'N/A',
       alertname: props.alertname || 'Alert',
       eventtime: props.eventtime || 'N/A',
       speed: props.speed || '0',
       ignition: props.ignition || 'N/A',
       latitude: props.latitude || props.param6 || 'N/A',
       longitude: props.longitude || props.param7 || 'N/A',
       imeino: props.imeino || props.param4 || 'N/A',
       deviceno: props.deviceno || 'N/A',
       serialNo: props.serialNo || 'N/A',
       vendor: props.vendor || 'N/A',
       iccidno: props.iccidno || 'N/A',
       customerName: props.customerName || 'N/A',
       gpsStatus: props.gpsStatus || 'N/A'
     };
     this.vehicleInfoPanelType = type;
     this.showVehicleInfoPanel = true;
   }

   closeVehicleInfoPanel() {
     this.showVehicleInfoPanel = false;
     this.vehicleInfoPanelData = {};
     this.vehicleInfoPanelType = '';
   }

   openSingleAlertMapWithDataFromPanel() {
   
     if (this.vehicleInfoPanelData.vehicleno) {
       const alert = {
         param2: this.getAlertIdFromName(this.vehicleInfoPanelData.alertname) || '10',
         param6: this.vehicleInfoPanelData.latitude || '0',
         param7: this.vehicleInfoPanelData.longitude || '0',
         param9: this.vehicleInfoPanelData.vehicleno,
         param4: this.vehicleInfoPanelData.imeino || 'N/A',
         param8: this.vehicleInfoPanelData.alertname || 'Alert',
         param3: this.vehicleInfoPanelData.eventtime || 'N/A'
       };
       this.closeVehicleInfoPanel();
       this.openSingleAlertMapWithMode(alert, 'history');
     }
   }

  // Helper to get alert ID from alert name
  getAlertIdFromName(alertName: string): string {
    const mapping: { [key: string]: string } = {
      'Power Disconnect': '3',
      'Internal Battery Low': '4',
      'Battery Charge': '5',
      'Tamper': '9',
      'Emergency': '10',
      'Harsh Brake': '13',
      'Harsh Acceleration': '14',
      'Rash Turning': '15',
      'Overspeed': '17',
      'Geofence Entry': '18',
      'Geofence Exit': '19',
      'Tilt Alert': '22',
      'Route Deviation': '30',
      'Ignition Off': '8',
      'Ignition On': '7'
    };
    return mapping[alertName] || '10';
  }

  // Open single alert map with specific tracking mode
  openSingleAlertMapWithMode(alert: any, mode: 'live' | 'history') {
    const generation = ++this.modalGeneration;
    this.pauseHistory();
    this.historyTrackingSub?.unsubscribe();
    this.clearSingleAlertPreviewMarkers();
    this.selectedSingleAlert = alert;
    this.showSingleAlertModal = true;
    this.isSingleInfoCollapsed = false;
    this.singleAlertModalMode = mode;

    // Clear any existing tracking data
    this.clearSingleAlertHistoryLayers();
    this.clearSingleAlertLiveTrackingLayers();
    this.historyDataList = [];
    this.historyPlaybackIndex = 0;
    this.isHistoryPlaying = false;

    // Wait for modal DOM to render
    setTimeout(() => {
      if (!this.isComponentAlive || generation !== this.modalGeneration || !this.showSingleAlertModal) return;
      this.initializeSingleAlertMap(alert);

      // After map is initialized, start the appropriate tracking
      setTimeout(() => {
        if (!this.isComponentAlive || generation !== this.modalGeneration || !this.showSingleAlertModal || !this.singleAlertMap) return;
        if (mode === 'live') {
          // Start live tracking
          this.startSingleAlertLiveTracking(alert.param9, [Number(alert.param7), Number(alert.param6)]);
        } else if (mode === 'history') {
          // Start history tracking
          this.showHistoryTrack(alert.param9);
        }
      }, 500);
    }, 100);
  }

  resizeMap(width: number, height: number) {
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
      mapContainer.style.width = width + '%';
      mapContainer.style.height = height + 'px';
      if (this.map) {
        this.map.invalidateSize({ pan: false });
      }
    }
  }

  // --- Single Alert Map Modal Logic ---

  showSingleAlertModal: boolean = false;
  singleAlertMap: L.Map | null = null;
  selectedSingleAlert: any = null;
  isSingleInfoCollapsed: boolean = false;
  isVehiclePlotted: boolean = false;
  singleAlertModalMode: 'live' | 'history' | null = null; // Added to track modal's current mode

   // Vehicle Info Panel (Slide-in from right-bottom)
   showVehicleInfoPanel: boolean = false;
   vehicleInfoPanelData: any = {};
   vehicleInfoPanelType: string = '';

  openSingleAlertMap(alert: any) {
    this.openSingleAlertMapWithMode(alert, 'live');
  }

  closeSingleAlertModal() {
    this.modalGeneration++;
    this.pauseHistory();
    this.historyTrackingSub?.unsubscribe();
    this.showSingleAlertModal = false;
    if (this.singleAlertMap) {
      this.disposeLeafletMap(this.singleAlertMap);
      this.singleAlertMap = null;
    }
    this.clearSingleAlertLiveTrackingLayers(); // Clear live tracking when modal closes
    this.clearSingleAlertHistoryLayers(); // Clear history tracking when modal closes
    this.clearSingleAlertPreviewMarkers();
    this.selectedSingleAlert = null;
    this.singleAlertModalMode = null; // Clear the mode when closing
    this.isVehiclePlotted = false;
  }

  backToLiveTrack() {
    this.closeSingleAlertModal();
    this.setViewMode('map');
  }

  toggleSingleInfoPanel() {
    this.isSingleInfoCollapsed = !this.isSingleInfoCollapsed;
  }

  initializeSingleAlertMap(alert: any) {
    if (!this.isComponentAlive || !this.showSingleAlertModal || !document.getElementById('singleAlertMap')) return;
    const coordinates = this.getAlertCoordinates(alert);
    if (!coordinates) { this.errorMessage = 'Invalid coordinates for this alert'; return; }
    if (this.singleAlertMap) this.disposeLeafletMap(this.singleAlertMap);
    this.singleAlertMap = this.createLeafletMap('singleAlertMap', [coordinates[1], coordinates[0]], 14);
    this.singleBasemap = createLeafletBasemap(this.singleAlertStyle).addTo(this.singleAlertMap);
    this.addWmsLayer(this.singleAlertMap);
    this.singleHistoryLayers.addTo(this.singleAlertMap);
    this.singleLiveLayers.addTo(this.singleAlertMap);
    this.renderSingleAlertPreviewMarkers(coordinates[0], coordinates[1], this.getAlertIconUrl(alert.param2), this.singleAlertModalMode !== 'live');
    if (this.showPoliceStations) this.loadPoliceStations();
  }


  private renderSingleAlertPreviewMarkers(lng: number, lat: number, alertIconUrl: string, showVehicleMarker: boolean = true): void {
    if (!this.singleAlertMap) return;

    if (this.singleAlertAlertMarker) {
      this.singleAlertAlertMarker.remove();
      this.singleAlertAlertMarker = null;
    }

    if (this.singleAlertStaticVehicleMarker) {
      this.singleAlertStaticVehicleMarker.remove();
      this.singleAlertStaticVehicleMarker = null;
    }

    this.singleAlertAlertMarker = this.createLeafletMarker(this.createCustomMarkerElement(alertIconUrl), [lng, lat], 0, [10, 28])
      .addTo(this.singleAlertMap);



    if (showVehicleMarker) {
      const vehicleEl = document.createElement('div');
      vehicleEl.className = 'single-alert-live-marker';
      vehicleEl.style.backgroundImage = 'url(assets/mapimages/car/green.png)';
      vehicleEl.style.width = '20px';
      vehicleEl.style.height = '28px';
      vehicleEl.style.backgroundSize = 'contain';
      vehicleEl.style.backgroundRepeat = 'no-repeat';
      vehicleEl.style.backgroundPosition = 'center';

      // Offset vehicle marker slightly so it doesn't sit exactly under the alert icon.
      this.singleAlertStaticVehicleMarker = this.createLeafletMarker(vehicleEl, [lng, lat], 0, [-8, 20]).addTo(this.singleAlertMap);
    }
  }

  createCustomMarkerElement(url: string) {
    const el = document.createElement('div');
    el.style.backgroundImage = `url(${url})`;
    el.style.width = '20px';
    el.style.height = '28px';
    el.style.backgroundSize = 'contain';
    el.style.backgroundRepeat = 'no-repeat';
    el.style.backgroundPosition = 'center';
    return el;
  }

  // ==========================================
  // Live Tracking for Single Alert Map
  // ==========================================

  startSingleAlertLiveTracking(vehicleId: string, initialCoords: [number, number]) {
    this.singleAlertLiveVehicleId = vehicleId;
    this.clearSingleAlertLiveTrackingLayers(); // Clear previous live tracking elements on this map
    const generation = this.trackingGeneration;
    this.singleAlertLivePathCoordinates = [initialCoords]; // Start path from alert location

    // Clear previous interval before starting a new one
    if (this.singleAlertLiveInterval) {
      clearInterval(this.singleAlertLiveInterval);
      this.singleAlertLiveInterval = null;
    }      

    const fetchSingleAlertLive = (showLoader: boolean = false) => {
      this.liveTrackingSub?.unsubscribe();
      this.liveTrackingSub = this.vehicleService.getLiveTrack(this.singleAlertLiveVehicleId, showLoader).subscribe({
        next: (response: any) => {
          if (!this.isComponentAlive || generation !== this.trackingGeneration || !this.singleAlertMap || !this.showSingleAlertModal) return;
          if (!response.entity || response.entity.length === 0) return;

          this.singleAlertLiveData = response.entity[0];
          const coords = [Number(this.singleAlertLiveData.param39), Number(this.singleAlertLiveData.param38)];
          if (!this.isValidCoordinatePair(coords[0], coords[1]) || (coords[0] === 0 && coords[1] === 0)) return;
          const rotation = Number(this.singleAlertLiveData.param43) || 0;

          if (!this.singleAlertLiveMarker) {
            // Initial marker creation
            const el = document.createElement('div');
            el.className = 'single-alert-live-marker';
            el.style.backgroundImage = 'url(assets/mapimages/car/green.png)'; // Use a car icon
            el.style.width = '20px';
            el.style.height = '28px';
            el.style.backgroundSize = 'contain';
            el.style.backgroundRepeat = 'no-repeat';
            el.style.backgroundPosition = 'center';

            this.singleAlertLiveMarker = this.createLeafletMarker(el, coords as [number, number], rotation).addTo(this.singleAlertMap!);
            this.drawSingleAlertLiveTrail(this.singleAlertLivePathCoordinates);
            this.singleAlertMap!.flyTo([coords[1], coords[0]], 14);
          } else {
            this.animateSingleAlertMarkerTo(coords as [number, number], rotation);
          }

          // Update the info panel data
          this.singleAlertInfoPanelData = {
            type: 'live',
            vehicleno: this.singleAlertLiveData.param13,
            speed: this.singleAlertLiveData.param40,
            pollingdate: this.singleAlertLiveData.param35,
            ignition: this.singleAlertLiveData.param45 === '1' ? 'On' : 'Off',
            latitude: Number(this.singleAlertLiveData.param38),
            longitude: Number(this.singleAlertLiveData.param39),
            gpsStatus: this.singleAlertLiveData.param41 === '1' ? 'Active' : 'Inactive',
            customerName: this.singleAlertLiveData.param25,
            serialNo: this.singleAlertLiveData.param5,
            imeiNo: this.singleAlertLiveData.param4,
            vendor: this.singleAlertLiveData.param9,
            iccidno: this.singleAlertLiveData.param6,
          };
          this.isVehiclePlotted = true; // Show the panel now
          this.cdr.detectChanges(); // Trigger change detection for the info panel

          // ✅ Only set interval after successful response
          if (this.isComponentAlive && !this.singleAlertLiveInterval) {
            this.singleAlertLiveInterval = setInterval(() => {
              fetchSingleAlertLive(false); // Call again without loader
            }, 10000);
          }
        },
        error: (err: any) => {
          if (!this.isComponentAlive || generation !== this.trackingGeneration || !this.showSingleAlertModal) return;
          console.error('Error fetching single alert live track', err);
          // ✅ Set interval even on error for retry
          if (this.isComponentAlive && !this.singleAlertLiveInterval) {
            this.singleAlertLiveInterval = setInterval(() => {
              fetchSingleAlertLive(false); // Retry without loader
            }, 10000);
          }
        }
      });
    };

    fetchSingleAlertLive(true); // Make the first call with loader
  }

  animateSingleAlertMarkerTo(targetLngLat: [number, number], targetRotation: number) {
    if (!this.singleAlertLiveMarker) return;

    const startLngLat = this.singleAlertLiveMarker.getLatLng();
    const startLng = startLngLat.lng;
    const startLat = startLngLat.lat;
    const startTime = performance.now();
    const duration = 10000; // 10 seconds to match polling interval for smooth movement

    if (startLng === targetLngLat[0] && startLat === targetLngLat[1]) return;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const currentLng = startLng + (targetLngLat[0] - startLng) * progress;
      const currentLat = startLat + (targetLngLat[1] - startLat) * progress;

      if (this.singleAlertLiveMarker) {
        this.singleAlertLiveMarker.setLatLng([currentLat, currentLng]);
        this.rotateLeafletMarker(this.singleAlertLiveMarker, targetRotation);
      }

      const currentPath = [...this.singleAlertLivePathCoordinates, [currentLng, currentLat]];
      this.drawSingleAlertLiveTrail(currentPath);

      if (progress < 1) {
        this.singleAlertAnimationFrameId = requestAnimationFrame(animate);
      } else {
        this.singleAlertAnimationFrameId = null;
        this.singleAlertLivePathCoordinates.push(targetLngLat);
        this.drawSingleAlertLiveTrail(this.singleAlertLivePathCoordinates);
      }
    };

    if (this.singleAlertAnimationFrameId) {
      cancelAnimationFrame(this.singleAlertAnimationFrameId);
    }
    this.singleAlertAnimationFrameId = requestAnimationFrame(animate);
  }

  drawSingleAlertLiveTrail(coordinates: any[]) {
    if (!this.singleAlertMap || coordinates.length < 2) return;
    const points: L.LatLngTuple[] = coordinates.map(point => [point[1], point[0]]);
    if (this.singleLiveRoute) this.singleLiveRoute.setLatLngs(points);
    else this.singleLiveRoute = L.polyline(points, { color: '#009C4E', weight: 4 }).addTo(this.singleLiveLayers);
    this.updateRouteArrows(points, this.singleLiveLayers, true);
  }

  private updateRouteArrows(points: L.LatLngTuple[], group: L.LayerGroup, live = false): void {
    group.eachLayer(layer => { if (layer instanceof L.Marker) group.removeLayer(layer); });
    if (!this.singleAlertMap) return;
    let spacing = 0;
    for (let i = 1; i < points.length; i++) {
      const previous = this.singleAlertMap.latLngToLayerPoint(points[i - 1]);
      const current = this.singleAlertMap.latLngToLayerPoint(points[i]);
      spacing += previous.distanceTo(current);
      if (spacing < (live ? 50 : 70)) continue;
      spacing = 0;
      const bearing = turf.bearing(turf.point([points[i - 1][1], points[i - 1][0]]), turf.point([points[i][1], points[i][0]]));
      L.marker(points[i], { interactive: false, icon: L.divIcon({ className: 'today-route-arrow', html: `<span style="transform:rotate(${bearing - 90}deg)">➤</span>`, iconSize: [16, 16], iconAnchor: [8, 8] }) }).addTo(group);
    }
  }


  clearSingleAlertLiveTrackingLayers() {
    if (this.singleAlertLiveInterval) {
      clearInterval(this.singleAlertLiveInterval);
      this.singleAlertLiveInterval = null;
    }
    if (this.singleAlertAnimationFrameId) {
      cancelAnimationFrame(this.singleAlertAnimationFrameId);
      this.singleAlertAnimationFrameId = null;
    }
    if (this.singleAlertLiveMarker) {
      this.singleAlertLiveMarker.remove();
      this.singleAlertLiveMarker = null;
    }
    if (this.singleAlertStaticVehicleMarker) {
      this.singleAlertStaticVehicleMarker.remove();
      this.singleAlertStaticVehicleMarker = null;
    }

    this.trackingGeneration++;
    this.liveTrackingSub?.unsubscribe();
    this.singleLiveLayers.clearLayers();
    this.singleLiveRoute = undefined;
    this.singleAlertLivePathCoordinates = [];
    this.singleAlertInfoPanelData = {}; // Clear info panel data
  }

  private clearSingleAlertPreviewMarkers(): void {
    if (this.singleAlertAlertMarker) {
      this.singleAlertAlertMarker.remove();
      this.singleAlertAlertMarker = null;
    }
    if (this.singleAlertStaticVehicleMarker) {
      this.singleAlertStaticVehicleMarker.remove();
      this.singleAlertStaticVehicleMarker = null;
    }
  }

  goToAdminDashboard() {
    this.router.navigate(['/AdminDashboard']);
  }

  // ==========================================
  // History Tracking
  // ==========================================

  showHistoryTrack(vehicleNo: string) {
    if (!vehicleNo) {
      this.errorMessage = 'No vehicle selected for history tracking';
      return;
    }

    // Check if single alert map is ready
    if (!this.singleAlertMap) {
      this.errorMessage = 'Map is not ready. Please try again.';
      return;
    }

    this.clearSingleAlertLiveTrackingLayers();
    // Clear previous history from single alert map
    this.clearSingleAlertHistoryLayers();

    // Perform history track on single alert map
    this.performHistoryTrack(vehicleNo);
  }

  private performHistoryTrack(vehicleNo: string) {
    const fromTimeFormatted = this.poiData.fromTime ? dayjs(this.poiData.fromTime).format('hh:mm A') : '12:00 AM';
    const toTimeFormatted = this.poiData.toTime ? dayjs(this.poiData.toTime).format('hh:mm A') : '11:59 PM';
    const historyDate = this.poiData.historyDate ? this.poiData.historyDate.format('DD-MMM-YYYY') : dayjs().format('DD-MMM-YYYY');

    const data = {
      param1: vehicleNo,
      param2: historyDate,
      param3: fromTimeFormatted,
      param4: toTimeFormatted
    };

    // Only clear single alert history, not all layers
    this.clearSingleAlertHistoryLayers();
    this.historyPlaybackIndex = 0;
    this.historyLoading = true;

    const generation = this.modalGeneration;
    this.historyTrackingSub?.unsubscribe();
    this.historyTrackingSub = this.vehicleService.getVehicleHistory(data).subscribe({
      next: (response: any) => {
        if (!this.isComponentAlive || generation !== this.modalGeneration || !this.showSingleAlertModal) return;
        this.historyLoading = false;

        // Check if response.entity is a string (error message) or an object (data)
        if (typeof response.entity === 'string' || !response.entity || !response.entity.listData) {
          this.errorMessage = typeof response.entity === 'string' ? response.entity : 'No history data found for this vehicle and time range.';
          return;
        }

        if (response.entity.listData.length > 0) {
          const rawList = response.entity?.listData || [];

          this.historyDataList = rawList.filter((item: any) => {
            const [lng, lat] = this.getCoordinates(item);
            const isValid = !isNaN(lng) && !isNaN(lat) && lng !== 0 && lat !== 0;
            if (!isValid) {
              this.errorMessage = 'Filtered out item: ' + item.param4 + ', ' + item.param5 + ', ' + item.param14?.substring(0, 50);
            }
            return isValid;
          });

          if (this.historyDataList.length === 0) {
            this.errorMessage = 'No valid coordinate data found in history. Check console for details.';
          }

          this.displayHistory(response.entity, vehicleNo);
        } else {
          this.errorMessage = 'No history data found for this vehicle and time range.';
        }
      },
      error: (err: any) => {
        this.historyLoading = false;
        this.errorMessage = 'Error fetching history data. Please try again.';
      }
    });
  }

  displayHistory(historyData: any, vehicleNo: string) {
    if (!this.singleAlertMap) {
      this.errorMessage = 'Single alert map not initialized';
      return;
    }

    this.singleAlertMap.invalidateSize({ pan: false });

    let coordinates: any[] = [];
    let routeGeoJson: any;

    // 1. Attempt to parse GeoJSON from param1 if it looks like a JSON string
    if (historyData.param1 && typeof historyData.param1 === 'string' && historyData.param1.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(historyData.param1);
        if (parsed.geometry && Array.isArray(parsed.geometry.coordinates)) {
          routeGeoJson = parsed;
          coordinates = parsed.geometry.coordinates;
        } else if (parsed.type === 'FeatureCollection' && parsed.features?.[0]?.geometry) {
          routeGeoJson = parsed.features[0];
          coordinates = routeGeoJson.geometry.coordinates;
        }
      } catch (e) {
        this.errorMessage = 'Failed to parse param1 as JSON';
        coordinates = [];
      }
    } else {
      this.errorMessage = 'param1 is not JSON, will use historyDataList fallback';
    }

    // 2. Fallback: Build route from historyDataList if GeoJSON is missing or invalid
    if ((!coordinates || coordinates.length === 0) && this.historyDataList && this.historyDataList.length > 0) {
      coordinates = this.historyDataList.map(item => {
        const coords = this.getCoordinates(item);
        return coords;
      });
      routeGeoJson = {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: coordinates },
        properties: {}
      };

    } else {

    }

    // Ensure vehicle number is consistent in the list if provided
    if (this.historyDataList && this.historyDataList.length > 0 && vehicleNo) {
      this.historyDataList.forEach(item => item.param1 = vehicleNo);
    }

    if (this.historyDataList && this.historyDataList.length > 0) {
      this.isVehiclePlotted = true;
      const startItem = this.historyDataList[0];
      const [lng, lat] = this.getCoordinates(startItem);
      
      const historyProps = {
        vehicleno: vehicleNo || startItem.param15 || 'Vehicle',
        speed: startItem.speed || Number(startItem.param6) || 0,
        time: startItem.param3 || 'N/A',
        ignition: startItem.param9 === '1' ? 'On' : 'Off',
        lat: lat,
        lng: lng
      };

      this.updateHistoryPanel(historyProps);

      // Populate singleAlertInfoPanelData so the UI shows data immediately
      this.singleAlertInfoPanelData = {
        ...this.singleAlertInfoPanelData,
        ...historyProps,
        type: 'history',
        pollingdate: historyProps.time,
        latitude: lat,
        longitude: lng
      };
    }


    this.singleHistoryLayers.clearLayers();
    const validCoordinates: L.LatLngTuple[] = coordinates
      .filter((coord: any) => Array.isArray(coord) && this.isValidCoordinatePair(Number(coord[0]), Number(coord[1])))
      .map((coord: any) => [Number(coord[1]), Number(coord[0])]);
    if (validCoordinates.length) {
      L.polyline(validCoordinates, { color: '#ff4d00', weight: 5 }).addTo(this.singleHistoryLayers);
      this.updateRouteArrows(validCoordinates, this.singleHistoryLayers);
      this.singleAlertMap.fitBounds(L.latLngBounds(validCoordinates), { padding: [50, 50], maxZoom: 16 });
    }
    if (this.historyDataList.length) {
      const start = this.historyDataList[0];
      const end = this.historyDataList[this.historyDataList.length - 1];
      this.singleAlertHistoryMarker?.remove();
      this.singleAlertHistoryMarker = this.createLeafletMarker(this.createMarkerElement(), this.getCoordinates(start), this.getHeading(start)).addTo(this.singleAlertMap);
      this.singleAlertHistoryStartMarker = this.createLeafletMarker(this.createStartEndMarker('start'), this.getCoordinates(start))
        .bindPopup(this.getHistoryPopupHTML('Start Point', start), { className: 'arrow-popup', maxWidth: 320 }).addTo(this.singleAlertMap);
      this.singleAlertHistoryEndMarker = this.createLeafletMarker(this.createStartEndMarker('end'), this.getCoordinates(end))
        .bindPopup(this.getHistoryPopupHTML('End Point', end), { className: 'arrow-popup', maxWidth: 320 }).addTo(this.singleAlertMap);
    }
  }

  createStartEndMarker(type: 'start' | 'end') {
    const el = document.createElement('div');
    el.style.width = '35px';
    el.style.height = '35px';
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
      <button type="button" onclick="window.alertComponentInstance.singleAlertMap.closePopup()"
      style="position: absolute; top: 0; right: 5px; border: none; background: none; font-size: 23px; 
      font-weight: bold; color: #dc3545; cursor: pointer;  padding: 0; z-index: 10;">&times;</button>
    <button type="button" onclick="window.alertComponentInstance.backToLiveTrack()" 
    style="position: absolute; top: 5px; right: 25px; border: none; background: #28a745; color: white; 
    padding: 2px 6px; border-radius: 3px; font-size: 9px; cursor: pointer; z-index: 10; font-weight: 600;">Live Track</button>
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
      ${(item.speed !== undefined && item.speed !== null) || item.param6 ? `
      <div class="row no-gutters mb-1">
          <div class="col-4 text-muted">Speed:</div>
          <div class="col-8">${item.speed || item.param6} km/hr</div>
      </div>` : ''}

      <!-- Polling DateTime -->
      ${item.pollingdate || item.param22 || item.param3 ? `
      <div class="row no-gutters mb-1">
          <div class="col-4 text-muted">Polling DateTime:</div>
          <div class="col-8">${item.pollingdate || item.param22 || item.param3}</div>
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
      ${(item.latitude || item.param4) ? `
      <div class="row no-gutters mb-1">
          <div class="col-4 text-muted">Loc:</div>
          <div class="col-8">${Number(item.latitude || item.param4).toFixed(4)}, ${Number(item.longitude || item.param5).toFixed(4)}</div>
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
    el.style.width = '20px';
    el.style.height = '28px';

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

  /**
   * Parse coordinates from param14 CSV string
   * Format: $1,AEPL,513716301109_0E,EA,10,L,869128061588249,XXXXXXXXXX,1,23042026,102127,23.240471,N,87.054344,E,...
   * Indices: latitude at index 11, longitude at index 13 (0-based after split by comma)
   */
  parseCoordinatesFromParam14(param14: string): { lat: number; lng: number } {
    if (!param14 || typeof param14 !== 'string') {
      return { lat: 0, lng: 0 };
    }

    try {
      const parts = param14.split(',');
      // param14 format: ...,lat,direction,lng,direction,...
      // Index 11 = latitude value, index 12 = N/S, index 13 = longitude value, index 14 = E/W
      const latStr = parts[11]?.trim();
      const latDir = parts[12]?.trim();
      const lngStr = parts[13]?.trim();
      const lngDir = parts[14]?.trim();

      let lat = 0;
      let lng = 0;

      if (latStr && !isNaN(Number(latStr))) {
        lat = Number(latStr);
        if (latDir === 'S' || latDir === 's') lat = -lat;
      }

      if (lngStr && !isNaN(Number(lngStr))) {
        lng = Number(lngStr);
        if (lngDir === 'W' || lngDir === 'w') lng = -lng;
      }

      return { lat, lng };
    } catch (e) {
      return { lat: 0, lng: 0 };
    }
  }

  /**
   * Get coordinates from history data item
   * Returns [longitude, latitude] for GeoJSON
   */
  getCoordinates(item: any): [number, number] {
    // Try to get from explicit lat/lng properties first
    if (item.lat !== undefined && item.lng !== undefined) {
      return [Number(item.lng), Number(item.lat)];
    }

    // Try param5 (longitude) and param4 (latitude)
    const lng = Number(item.param5);
    const lat = Number(item.param4);


    if (!isNaN(lng) && !isNaN(lat) && lng !== 0 && lat !== 0) {
      return [lng, lat];
    }

    // Try to parse from param14 (CSV string with more precise coordinates)
    if (item.param14) {
      const coords = this.parseCoordinatesFromParam14(item.param14);
      if (coords.lat !== 0 || coords.lng !== 0) {
        return [coords.lng, coords.lat];
      }
    }

    return [0, 0];
  }

  /**
   * Get heading/direction from history data item
   */
  getHeading(item: any): number {
    return Number(item.heading || item.param43 || item.param8 || 0);
  }

  updateHistoryPanel(props: any) {
    // Preserve existing historyDate, fromTime, toTime while updating other fields
    this.poiData = {
      ...this.poiData,
      ...props,
      type: 'history',
      vehicleno: props.vehicleno,
      speed: props.speed,
      pollingdate: props.time, // Assuming time string contains date
      ignition: props.ignition,
      latitude: Number(props.latitude || props.lat),
      longitude: Number(props.longitude || props.lng)
    };
    this.isPanelCollapsed = false;
    this.isSingleInfoCollapsed = false;
    this.cdr.detectChanges();
  }

  // ==========================================
  // History Playback Controls
  // ==========================================

  playHistory() {
    if (this.isHistoryPlaying) return;
    if (this.historyDataList && this.historyPlaybackIndex >= this.historyDataList.length - 1) {
      this.historyPlaybackIndex = 0;
    }

    // Create the moving marker if it doesn't exist on single alert map
    if (!this.singleAlertHistoryMarker && this.historyDataList && this.historyDataList.length > 0) {
      const currentPoint = this.historyDataList[this.historyPlaybackIndex];
      const el = this.createMarkerElement();
      const [lng, lat] = this.getCoordinates(currentPoint);
      const heading = this.getHeading(currentPoint);
      this.singleAlertHistoryMarker = this.createLeafletMarker(el, [lng, lat], heading).addTo(this.singleAlertMap!);
    }
    if (!this.singleAlertMap || this.historyDataList.length < 2) return;
    this.isHistoryPlaying = true;

    this.animateHistoryStep();
  }

  animateHistoryStep() {
    if (!this.isHistoryPlaying) return;

    if (this.historyDataList && this.historyPlaybackIndex >= this.historyDataList.length - 1) {
      this.pauseHistory();
      return;
    }

    const startItem = this.historyDataList[this.historyPlaybackIndex];
    const endItem = this.historyDataList[this.historyPlaybackIndex + 1];

    const [startLng, startLat] = this.getCoordinates(startItem);
    const [endLng, endLat] = this.getCoordinates(endItem);

    // Calculate distance for smooth speed-based animation
    const from = turf.point([startLng, startLat]);
    const to = turf.point([endLng, endLat]);
    const distance = turf.distance(from, to, { units: 'kilometers' } as any);

    // Calculate bearing so vehicle points towards next point (Visual Direction)
    let heading = endItem.heading || Number(endItem.param43) || 0;
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

      if (this.singleAlertHistoryMarker) {
        this.singleAlertHistoryMarker.setLatLng([currentLat, currentLng]);
        this.rotateLeafletMarker(this.singleAlertHistoryMarker, heading);
      }

      // Interpolate coordinates and speed for smooth UI updates during animation
      const startSpeed = Number(startItem.speed || startItem.param6 || 0);
      const endSpeed = Number(endItem.speed || endItem.param6 || 0);
      const currentSpeed = Math.round(startSpeed + (endSpeed - startSpeed) * progress);

      this.poiData.latitude = currentLat;
      this.poiData.longitude = currentLng;
      this.poiData.speed = currentSpeed;

      this.singleAlertInfoPanelData.latitude = currentLat;
      this.singleAlertInfoPanelData.longitude = currentLng;
      this.singleAlertInfoPanelData.speed = currentSpeed;

      this.cdr.detectChanges();

      if (progress < 1) {
        this.singleAlertHistoryAnimationFrameId = requestAnimationFrame(animate);
      } else {
        // Step complete
        this.historyPlaybackIndex++;

        // Update Panel with final values for this segment
        this.poiData = {
          ...this.poiData,
          speed: endItem.speed || Number(endItem.param6) || 0,
          pollingdate: endItem.param3 || 'N/A',
          latitude: endLat,
          longitude: endLng,
          ignition: endItem.param9 === '1' ? 'On' : 'Off'
        };

        this.singleAlertInfoPanelData = {
          ...this.singleAlertInfoPanelData,
          speed: this.poiData.speed,
          pollingdate: this.poiData.pollingdate,
          latitude: this.poiData.latitude,
          longitude: this.poiData.longitude,
          ignition: this.poiData.ignition
        };

        this.cdr.detectChanges();


        // Next step
        this.animateHistoryStep();
      }
    };

    this.singleAlertHistoryAnimationFrameId = requestAnimationFrame(animate);
  }

  pauseHistory() {
    this.isHistoryPlaying = false;
    if (this.historyTimer) {
      clearInterval(this.historyTimer);
      this.historyTimer = null;
    }
    if (this.singleAlertHistoryAnimationFrameId) {
      cancelAnimationFrame(this.singleAlertHistoryAnimationFrameId);
      this.singleAlertHistoryAnimationFrameId = null;
    }
  }

  stopHistory() {
    this.pauseHistory();
    this.historyPlaybackIndex = 0;

    if (this.singleAlertHistoryMarker) {
      this.singleAlertHistoryMarker.remove();
      this.singleAlertHistoryMarker = null;
    }
    if (this.historyDataList && this.historyDataList.length > 0) {
      const item = this.historyDataList[0];
      const [lng, lat] = this.getCoordinates(item);
      this.updateHistoryPanel({
        vehicleno: item.param15 || this.poiData.vehicleno || 'N/A',
        speed: item.speed || Number(item.param6) || 0,
        time: item.param3 || 'N/A',
        ignition: item.param9 === '1' ? 'On' : 'Off',
        lat: lat,
        lng: lng
      });

    }
  }

  restartHistory() {
    this.stopHistory();
    this.playHistory();
  }

  onSpeedChange(event: any) {
    this.speedSliderValue = Number((event.target as HTMLInputElement).value);
    if (this.isHistoryPlaying) {
      this.pauseHistory();
      this.playHistory(); // Restart with new speed
    }
  }
  downloadType: string = "";
  downloadPDFExcel(event: any) {
    if(this.getAlertDetailVehiclesAPI) {
      this.getAlertDetailVehiclesAPI.unsubscribe();
    }
    this.downloadType = event.target.value;
    const request = {
      param1: this.searchText, // search text
      param2: "", // page no
      param3: "", // items per page
      param4: this.formattedDate, // date
      param5: this.selectedAlertType ? String(this.selectedAlertType.param1) : "", // Handle null case when dropdown is cleared
      param6: "", //stateid
      param7: this.selectedVendorFilter ? String(this.selectedVendorFilter.param1) : '',
      param8: "",
      param9: this.alertType,
      param10: "",
      param11: this.vehicletype ? String(this.vehicletype) : "", //vehicle type old/new filter
      pdfexcel: this.downloadType != '' ? this.downloadType : "" // Pass download type if set, else empty
    };

    this.getAlertDetailVehiclesAPI = this.alertService.getAlertDetailVehicles(request, true).subscribe({
      next: (response: any) => {
        if (response.statuscode == 200) {
          this.dashboardService.commonFileDownload(response.entity)
        } else {
          this.toastService.show('No Data Found', 'error')
        }
      },
      error: (err: any) => {
        console.error('Download error:', err);
        this.errorMessage = 'Error downloading data. Please try again.';
      }
    });
  }

  getVehicleWiseAlert(index: number, data: any) {
    const request = {
     
      param1: data.param2,//alertid
      param2: "",//pageno
      param3: "",//itemperpage
      param4: "",//searchby
      param5: data.param17,//vehicleid
      param6: "",//vendorid
      param7: "",//alertdate

    }
    this.stopApiCalls();
    this.getVehicleWiseAlertAPI = this.alertService.getVehiclewiseAlerts(request, true).subscribe({
      next: (response: any) => {
        if (response.statuscode == 200) {
          this.vehicleWiseData = response.entity.listData;
          this.toggleRow(index)
        }
      },
      error: (err: any) => {
        this.getTodayAlerts(1, true);
        console.error('Error:', err);
        this.errorMessage = 'Error loading data. Please try again.';
      }
    });
  }

  toggleRow(index: number) {
    console.log(index, this.expandedRow);
    this.expandedRow = this.expandedRow === index ? null : index;
    console.log(this.expandedRow)
  }

  setView(view: string) {
    this.viewType = view;
    this.vehicletype = view;
    this.getTodayAlerts(1, true);
    this.cdr.detectChanges();
  }

 GetAllOnMapsetView(view: string) {
    this.viewType = view;
    this.vehicletype = view;
    this.GetAllAlertsMap();
    this.cdr.detectChanges();
  }

}
