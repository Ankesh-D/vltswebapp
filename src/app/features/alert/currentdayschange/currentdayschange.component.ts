import { addMapBasemapControl } from '../../../shared/components/map-layer-options/map-basemaps';
import { Component, OnInit, AfterViewInit, ChangeDetectorRef, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertService, AlertListResponse, ApiResponse } from '../../../core/services/alert.service';
import { VehicleService } from '../../../core/services/vehicle.service'; // Import VehicleService
import Swal from 'sweetalert2';

import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import { ToastService } from '../../../core/services/toast.service';
import { AlertGraphViewComponent } from '../alert-graph-view/alert-graph-view.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ActivatedRoute } from '@angular/router';
import { RtoColumnChartComponent } from '../../dashboard/rto-column-chart/rto-column-chart.component';
import { Subscription } from 'rxjs';
import moment from 'moment';
import { VehicleClassWiseAlertCountReq } from '../../../core/model/request.model';
import { configureMapboxAccessToken } from '../../../core/utils/mapbox-config';

declare var $: any;
declare var jAlert: any;
declare var mapboxgl: any;

interface PanicCount {
  id?: string;
  label: string;
  count: number;
  percent: number;
  share: number;
  color: string;
  offset: number;
}

@Component({
    selector: 'app-currentdayschange',
    imports: [CommonModule, FormsModule, AlertGraphViewComponent, NgSelectModule, RtoColumnChartComponent],
    templateUrl: './currentdayschange.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './currentdayschange.component.scss'
})
export class CurrentdayschangeComponent implements OnInit, AfterViewInit, OnDestroy {
  roleId: any;
  alertDetails: any[] = [];
  loading = false;
  errorMessage: string = '';

  searchText: string = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [20, 50, 100, 200, 500];
  totalCount = 0;
  pageCount = 0;

  sortKey: string = '';
  reverse: boolean = false;

  viewMode: 'map' | 'grid' | 'chart' | 'restalertgrid' | 'rtowisealert' | 'vclasswisealert' = 'grid';

  // Map & Charts
  map: any;
  alertCountChart: any;
  lineChart: any;
  hourwiseChart: any;

  // Data
  alertCounts: any[] = [];
  mapAlerts: any[] = [];
  hourlyCounts: any[] = [];
  vehicleClassCounts: PanicCount[] = [];
  rtoPanicCounts: PanicCount[] = [];
  vehicleClassCountsLoading = false;
  rtoPanicCountsLoading = false;
  vehicleClassCountsError = '';
  rtoPanicCountsError = '';
  private panicChartRequests: Subscription[] = [];
  private readonly panicChartPalette = ['#65a764', '#e7ad43', '#5cb9a5', '#dd7f87', '#6daed6', '#ab90c5', '#a0be70'];

  // Filters & State
  selectedAlertId: string = '';
  selectedAlertName: string = '';
  formattedDate: string = '';
  headingMsg: string = 'Alert';

  // Live Tracking for Single Alert Map
  singleAlertLiveVehicleId: string = '';
  singleAlertLiveData: any;
  singleAlertLiveMarker: any = null;
  singleAlertAnimationFrameId: number | null = null;
  singleAlertLivePathCoordinates: any[] = [];
  singleAlertLiveInterval: any;
  singleAlertInfoPanelData: any = {}; // For displaying live info in the modal

  private alertRefreshTimer: any;
  getAlertDetailVehiclesAPI: any;

  vehicleType: string = 'NEW';
  type: string = '';

  selectedVendorFilter: any = null;
  alertTypeList: any[] = [];
  isAlertTypeLoading: boolean = false;
  dateObj: any = [];
  constructor(
    private alertService: AlertService,
    private vehicleService: VehicleService, // Inject VehicleService
    private cdr: ChangeDetectorRef,
    private toastService: ToastService,
    private dashboardService: DashboardService, // Assuming you have a DashboardService for vendor list
    private route: ActivatedRoute,
  ) {
    this.dateObj = [];
    this.roleId = sessionStorage.getItem('roleid');
    this.toastService.pageName = 'Current Day Alerts (Alert Analysis)';
  }

  // ngOnInit() {
  //   this.formatCurrentDate();   
  //   this.getTodayAlerts(1, true);
  // }
  async ngOnInit() {
    this.selectedAlertType = {
      param1: '10',
      param2: 'Panic'
    };
    this.formatCurrentDate();
    this.loadPanicCharts();

    if (this.roleId != '11') {
      this.loadVendorList();
    }
    // Initialize poiData with default date/time values
    // this.poiData = {
    //   historyDate: dayjs(),
    //   fromTime: dayjs().startOf('day').toDate(),
    //   toTime: dayjs().endOf('day').toDate(),
    //   vehicleno: ''
    // };
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
  }

  ngOnDestroy() {
    this.panicChartRequests.forEach(request => request.unsubscribe());
    this.getAlertDetailVehiclesAPI?.unsubscribe();
    if (this.alertCountChart) this.alertCountChart.dispose();
    if (this.lineChart) this.lineChart.dispose();
    if (this.hourwiseChart) this.hourwiseChart.dispose();
    // Note: You may also want to clear any active setTimeout intervals here to prevent memory leaks.
    // clearTimeout(this.alertRefreshTimer);
    try {
      clearTimeout(this.alertRefreshTimer)
    } catch (error) {
      clearTimeout(this.alertRefreshTimer)
    }
    this.clearSingleAlertLiveTrackingLayers(); // Clear single alert live tracking
    if (this.alertRefreshTimer) {
      clearTimeout(this.alertRefreshTimer);
      this.alertRefreshTimer = null;
    }
    if (this.map) this.map.remove();
  }
  public vehicleClassWisePanicCountReq: VehicleClassWiseAlertCountReq = new VehicleClassWiseAlertCountReq();
  private loadPanicCharts(): void {
    this.vehicleClassCountsLoading = true;
    this.rtoPanicCountsLoading = true;
    this.vehicleClassCountsError = '';
    this.rtoPanicCountsError = '';
    this.vehicleClassWisePanicCountReq.param1 = this.dateObj.split(' - ')[0];
    this.vehicleClassWisePanicCountReq.param2 = this.dateObj.split(' - ')[1];
    this.panicChartRequests.push(this.alertService.getVehicleClassWisePanicCounts(this.vehicleClassWisePanicCountReq).subscribe({
      next: response => {
        const rows = this.panicCountRows(response);
        if (rows === null) {
          this.vehicleClassCountsError = 'Vehicle class panic counts are unavailable.';
        } else {
          this.vehicleClassCounts = this.toPanicCounts(rows);
          if (rows.length && !this.vehicleClassCounts.length) {
            this.vehicleClassCountsError = 'Vehicle class count response could not be read.';
          }
        }
        this.vehicleClassCountsLoading = false;
      },
      error: () => {
        this.vehicleClassCountsError = 'Could not load vehicle class panic counts.';
        this.vehicleClassCountsLoading = false;
      }
    }));


  }
  getRtoPanicCounts(): void {
    this.panicChartRequests.push(this.alertService.getRtoWisePanicCounts().subscribe({
      next: response => {
        const rows = this.panicCountRows(response);
        if (rows === null) {
          this.rtoPanicCountsError = 'RTO panic counts are unavailable.';
        } else {
          this.rtoPanicCounts = this.toPanicCounts(rows);
          if (rows.length && !this.rtoPanicCounts.length) {
            this.rtoPanicCountsError = 'RTO count response could not be read.';
          }
        }
        this.rtoPanicCountsLoading = false;
      },
      error: () => {
        this.rtoPanicCountsError = 'Could not load RTO panic counts.';
        this.rtoPanicCountsLoading = false;
      }
    }));
  }
  getDate() {
    $(() => {
      $('input[name="date"]').daterangepicker({
        timePicker: false,
        // "alwaysShowCalendars": true,
        startDate: moment().subtract(7, "days"),
        endDate: moment().startOf("hour").add(32, "hour"),
        opens: "center",
        drops: "down",
        locale: {
          format: "DD-MMM-YYYY",
        },
        ranges: {
          Today: [moment(), moment()],
          Yesterday: [
            moment().subtract(1, "days"),
            moment().subtract(1, "days"),
          ],
          "This Week": [moment().startOf("week"), moment().endOf("week")],
          "Last 7 Days": [
            moment().subtract(7, "days"),
            moment().subtract(1, "days"),
          ],
          "This Month": [moment().startOf("month"), moment().endOf("month")],
        },
        maxDate: new Date(),
        minYear: 2022,
        maxYear: parseInt(moment().format("YYYY"), 10),
        // minDate : moment().subtract(3,'months'),
        function(startDate: any, endDate: any) {
          $("#datepicker").html(
            startDate.format("DD-MMM-YYYY") +
            " : " +
            endDate.format("DD-MMM-YYYY"),
          );
        },
      });
      $('input[name="date"]').on(
        "hide.daterangepicker",
        (ev: any, picker: any) => {
          try {
            this.dateObj = ev.target.value;
            this.loadPanicCharts();
          } catch (error) { }
        },
      );
      this.dateObj = (
        document.getElementById("datepicker") as HTMLInputElement
      ).value;

    });
  }

  private panicCountRows(response: any): any[] | null {
    if (response?.status === false || (response?.statuscode != null && Number(response.statuscode) !== 200)) return null;
    const data = response?.entity ?? response?.Entity ?? response;
    if (Array.isArray(data)) return data;
    if (!data || typeof data !== 'object') return null;
    const listKey = Object.keys(data).find(key => ['details', 'listdata'].includes(key.toLowerCase()));
    if (listKey !== undefined) return Array.isArray(data[listKey]) ? data[listKey] : null;
    return this.panicField(data, 1) != null ? [data] : null;
  }

  private panicField(row: any, index: number): unknown {
    if (!row || typeof row !== 'object') return undefined;
    const key = Object.keys(row).find(name => name.toLowerCase() === `param${index}`);
    return key === undefined ? undefined : row[key];
  }

  private toPanicCounts(rows: any[]): PanicCount[] {
    const entries = rows.map(row => ({
      id: String(row.vehicleclassid ?? row.vehicleClassId ?? row.rtoid ?? row.rtoId ?? row.id ?? ''),
      label: String(this.panicField(row, 1) ?? '').trim(),
      count: Number(this.panicField(row, 2))
    })).filter(item => !!item.label && Number.isFinite(item.count) && item.count >= 0)
      .sort((first, second) => second.count - first.count || first.label.localeCompare(second.label));
    const total = entries.reduce((sum, item) => sum + item.count, 0);
    const maximum = Math.max(1, ...entries.map(item => item.count));
    let offset = 0;
    return entries.map((item, index) => {
      const share = total ? item.count / total * 100 : 0;
      const result = {
        ...item,
        percent: item.count / maximum * 100,
        share,
        color: this.panicChartPalette[index % this.panicChartPalette.length],
        offset
      };
      offset += share;
      return result;
    });
  }

  get vehicleClassPanicTotal(): number {
    return this.vehicleClassCounts.reduce((total, item) => total + item.count, 0);
  }

  get rtoPanicTotal(): number {
    return this.rtoPanicCounts.reduce((total, item) => total + item.count, 0);
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

  setView(view: string) {
    // this.viewType = view;
    this.vehicleType = view;
    this.getTodayAlerts(1, true);
    this.cdr.detectChanges();
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
    if (this.alertRefreshTimer) {
      clearTimeout(this.alertRefreshTimer);
      this.alertRefreshTimer = null;
    }

    this.loading = showLoader;
    this.currentPage = page;

    // const request = {
    //   param1: this.searchText, // search text
    //   param2: String(this.currentPage), // page no
    //   param3: this.pageSize === this.totalCount ? 'All' : String(this.pageSize), // items per page
    //   param4: this.formattedDate, // date
    //   param5: "", //"10", // alertid
    //   param6: "", //"10",
    //   param7: "All",
    //   param8: "",
    //   param9: this.alertType,
    //   param10: "",
    //   pdfexcel: this.vehicleType ? this.vehicleType : "", //vehicle type old/new filter
    // };
    const request = {
      param1: this.searchText, // search text
      param2: String(this.currentPage), // page no
      param3: this.pageSize === this.totalCount ? 'All' : String(this.pageSize), // items per page
      param4: this.formattedDate, // date
      param5: this.selectedAlertType ? this.selectedAlertType.param1 : "", // Handle null case when dropdown is cleared
      param6: "10", //stateid
      param7: this.selectedVendorFilter ? String(this.selectedVendorFilter.param1) : 'All',
      param8: "",
      param9: this.alertType,
      param10: "",
      param11: "", //this.vehicletype ? this.vehicletype : "", //vehicle type old/new filter
      pdfexcel: "" // Pass download type if set, else empty
    };

    this.getAlertDetailVehiclesAPI = this.alertService.getAlertDetailVehicles(request, showLoader).subscribe({
      next: (response: ApiResponse<AlertListResponse>) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.alertDetails = response.entity.listData || [];
          this.totalCount = response.entity.param1 || 0;

          // Logic to calculate page_count (items on current page)
          if (this.alertDetails.length < this.pageSize) {
            this.pageCount = this.alertDetails.length;
          } else {
            this.pageCount = this.pageSize;
          }
        } else {
          this.alertDetails = [];
          this.totalCount = 0;
          this.pageCount = 0;
        }

        if (this.viewMode === 'grid' || this.viewMode === 'chart') {
          this.alertRefreshTimer = setTimeout(() => {
            this.getTodayAlerts(this.currentPage, false); // ❌ no loader on auto-refresh
          }, 10000);
        }
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        this.loading = false;
        this.alertDetails = [];
        this.totalCount = 0;
        this.pageCount = 0;
        if (this.viewMode === 'grid' || this.viewMode === 'chart') {
          this.alertRefreshTimer = setTimeout(() => {
            this.getTodayAlerts(this.currentPage);
          }, 10000);
        }
        this.cdr.detectChanges();
      }
    });
  }

  downloadPDFExcel(event: any) {
    this.loading = true;
    let type = event.target.value;
    const request = {
      param1: this.searchText, // search text
      param2: "", // page no
      param3: "", // items per page
      param4: this.formattedDate, // date
      param5: "10", // alertid
      param6: "10",
      param7: "All",
      param8: "",
      param9: "",
      param10: "",
      param11: this.vehicleType ? this.vehicleType : "", //vehicle type old/new filter
      pdfexcel: type
    };
    this.getAlertDetailVehiclesAPI = this.alertService.getAlertDetailVehicles(request, this.loading).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response.statuscode == 200) {
          this.vehicleService.commonFileDownload(response.entity);
        } else {
          this.toastService.show('Something went wrong', 'error')
        }
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        this.loading = false;
        this.alertDetails = [];
        this.totalCount = 0;
        this.pageCount = 0;
        if (this.viewMode === 'grid' || this.viewMode === 'chart') {
          this.alertRefreshTimer = setTimeout(() => {
            this.getTodayAlerts(this.currentPage);
          }, 10000);
        }
        this.cdr.detectChanges();
      }
    });

  }
  getSearchDetails() {
    this.currentPage = 1;
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

  selectedAlertType: any = null;
  vendorList: any[] = [];
  alertType: string = "";
  setViewMode(mode: 'map' | 'grid' | 'chart' | 'restalertgrid' | 'rtowisealert' | 'vclasswisealert') {
    this.alertType = "";
    this.viewMode = mode;

    if (this.alertRefreshTimer) {
      clearTimeout(this.alertRefreshTimer);
      this.alertRefreshTimer = null;
    }

    if (mode === 'map') {
      setTimeout(() => {
        if (!this.map) {
          this.initializeMap();
        } else {
          this.map.resize();
          this.GetAllAlertsMap();
        }
      }, 200);
    }

    // if (mode === 'chart') {
    //   setTimeout(() => this.getEventAlertCount(), 150);
    // }

    if (mode === 'grid') {
      this.selectedAlertType = {
        param1: '10',
        param2: 'Panic'
      };
      this.getTodayAlerts(1);
    }

    else if (mode === 'restalertgrid') {
      this.totalCount = 0;
      this.alertType = "otheralerts";
      this.selectedAlertType = null;
      // this.selectedVendorFilter = null;
      // this.vehicletype = "NEW";
      // this.viewType = "NEW";
      this.alertDetails = [];
      this.getTodayAlerts(1);
    }
    else if (mode === 'vclasswisealert') {

      this.getDate();
      setTimeout(() => {
        this.loadPanicCharts();
      }, 1000);
    }
    else if (mode === 'rtowisealert') {
      this.getRtoPanicCounts();
    }
  }


  // --- Pie Chart Logic ---

  getEventAlertCount() {

    this.alertService.getCurrentDayAlertsCount('', '1', '20', '')
      .subscribe({
        next: (response) => {

          if (!response.status || !response.entity?.listData) {
            return;
          }

          const chartData = response.entity.listData.map((item: any) => ({
            category: item.param3,
            value: Number(item.param4),
            alertid: item.param2,
            alertname: item.param3
          }));

          this.renderAlertCountChart(chartData);

          // auto refresh
          this.alertRefreshTimer = setTimeout(() => {
            if (this.viewMode === 'chart') {
              this.getEventAlertCount();
            }
          }, 30000);
        },
        error: (err) => console.error("Chart API Error", err)
      });
  }


  renderAlertCountChart(data: any[]) {

    if (!document.getElementById('alertschartdiv')) return;

    data.sort((a, b) => b.value - a.value);

    if (this.alertCountChart) {
      this.alertCountChart.dispose();
    }

    am4core.useTheme(am4themes_animated);

    const chart = am4core.create("alertschartdiv", am4charts.XYChart3D);
    this.alertCountChart = chart;

    chart.data = data;
    chart.padding(20, 20, 20, 20);
    chart.colors.step = 3;
    chart.scrollbarX = new am4core.Scrollbar();

    // X Axis
    const categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
    categoryAxis.dataFields.category = "category";
    categoryAxis.renderer.minGridDistance = 10;
    categoryAxis.renderer.labels.template.rotation = -45;
    categoryAxis.renderer.labels.template.wrap = true;
    categoryAxis.renderer.labels.template.maxWidth = 120;

    // Y Axis
    const valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
    valueAxis.title.text = "Alert Count";

    // Series
    const series = chart.series.push(new am4charts.ColumnSeries3D());
    series.dataFields.valueY = "value";
    series.dataFields.categoryX = "category";
    series.tooltipText = "{category}\nCount: [bold]{value}[/]";

    // Unique colors
    series.columns.template.adapter.add("fill", (fill: any, target: any) =>
      target?.dataItem ? chart.colors.getIndex(target.dataItem.index) : fill
    );
    series.columns.template.adapter.add("stroke", (stroke: any, target: any) =>
      target?.dataItem ? chart.colors.getIndex(target.dataItem.index) : stroke
    );

    // Label on top
    const labelBullet = series.bullets.push(new am4charts.LabelBullet());
    labelBullet.label.text = "{value}";
    labelBullet.label.dy = -10;
    labelBullet.label.fontSize = 10;

    // Hover
    const hoverState = series.columns.template.states.create("hover");
    hoverState.properties.fillOpacity = 1;
    hoverState.properties.scale = 1.05;

    // Cursor
    chart.cursor = new am4charts.XYCursor();
    chart.cursor.lineX.strokeOpacity = 0;
    chart.cursor.lineY.strokeOpacity = 0;

    // Click filter
    series.columns.template.events.on("hit", (event: any) => {
      const context = event.target.dataItem?.dataContext;
      if (!context) return;

      this.selectedAlertId = context.alertid;
      this.selectedAlertName = context.category;
      this.viewMode = 'grid';
      this.getFilteredAlerts(1);
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
      Swal.fire('Error', 'Chart library failed to load. Please refresh the page.', 'error');
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

      this.alertService.getAlertUnresolvingHistory(request).subscribe({
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
    categoryAxis.dataFields.category = "category";

    // 🔽 SHOW ALL LABELS
    categoryAxis.renderer.minGridDistance = 10;
    categoryAxis.renderer.labels.template.rotation = -45;
    categoryAxis.renderer.labels.template.wrap = true;
    categoryAxis.renderer.labels.template.maxWidth = 120;
    categoryAxis.renderer.labels.template.horizontalCenter = "right";
    categoryAxis.renderer.labels.template.verticalCenter = "middle";

    // 🔽 SCROLL ENABLE (if many alerts)
    chart.scrollbarX = new am4core.Scrollbar();

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
    if (typeof mapboxgl === 'undefined') return;

    if (!configureMapboxAccessToken(mapboxgl)) return;
    this.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [87.74780, 22.978624],
      zoom: 8,
      minZoom: 4,
      attributionControl: false
    });
    addMapBasemapControl(this.map, 'mapbox');

    this.map.addControl(new mapboxgl.FullscreenControl());
    this.map.addControl(new mapboxgl.NavigationControl());

    // Add custom attribution control
    this.map.addControl(new (class {
      onAdd(map: any) {
        const container = document.createElement('div');
        container.className = 'mapboxgl-ctrl mapboxgl-ctrl-attrib';
        container.innerHTML = '<span class="mapboxgl-ctrl-attrib-inner">Powered by DIMTS</span>';
        return container;
      }
      onRemove() { }
    })(), 'bottom-right');

    this.map.on('load', () => {
      // Add WMS source and layer for India State boundaries
      this.map.addSource('wms-source', {
        type: 'raster',
        tiles: [
          'https://vlts.wb.gov.in/geoserver/wbsdcmap/wms?' +
          'service=WMS&version=1.1.1&request=GetMap' +
          '&layers=wbsdcmap:india_state' +
          '&styles=' +
          '&bbox={bbox-epsg-3857}' +     // ✅ required
          '&width=256&height=256' +
          '&srs=EPSG:3857' +             // ✅ required
          '&format=image/png' +          // ✅ must be image
          '&transparent=true'
        ],
        tileSize: 256
      });

      this.map.addLayer({
        id: 'wms-layer',
        type: 'raster',
        source: 'wms-source'
      });
      this.loadAlertImages();
      this.GetAllAlertsMap();
    });

    // Popup logic
    this.map.on('click', 'alertlayer', (e: any) => {
      const coordinates = e.features[0].geometry.coordinates.slice();
      const props = e.features[0].properties;

      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(this.createPopupContent(props))
        .addTo(this.map);
    });

    this.map.on('mouseenter', 'alertlayer', () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });
    this.map.on('mouseleave', 'alertlayer', () => {
      this.map.getCanvas().style.cursor = '';
    });
  }

  loadAlertImages() {
    const images = [
      { id: 'powerdisconnect-image', url: 'assets/images/mapimages/alertimage/powerdisconnect.png' },
      { id: 'batterylow-image', url: 'assets/images/mapimages/alertimage/batterylow.png' },
      { id: 'batterycharge-image', url: 'assets/images/mapimages/alertimage/batterycharge.png' },
      { id: 'tamper-image', url: 'assets/images/mapimages/alertimage/tamper.png' },
      { id: 'panic-image', url: 'assets/images/mapimages/alertimage/panic.gif' },
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

    images.forEach(img => {
      if (!this.map.hasImage(img.id)) {
        this.map.loadImage(img.url, (error: any, image: any) => {
          if (!error) this.map.addImage(img.id, image);
        });
      }
    });
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

  GetAllAlertsMap() {
    if (!this.map) return;

    const request = {
      param1: "",
      param2: "",
      param3: "",
      param4: this.formattedDate,
      param5: this.selectedAlertId || '',

      param6: "10",
      param7: "All",
      param8: "",
      param9: "",
      param10: ""
    };

    const fetchDataAndRefresh = () => {
      this.alertService.getAlertDetailVehicles(request).subscribe({
        next: (response: ApiResponse<AlertListResponse>) => {
          if (response.status && response.entity && response.entity.listData) {
            this.mapAlerts = response.entity.listData;
            this.plotAlertsOnMap(this.mapAlerts); // This calls setData
          }

          // After data is updated, fade the layer back in.
          if (this.map.getLayer('alertlayer')) {
            this.map.setPaintProperty('alertlayer', 'icon-opacity', 1);
          }

          if (this.viewMode === 'map') {
            this.alertRefreshTimer = setTimeout(() => {
              this.GetAllAlertsMap();
            }, 10000);
          }
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('Error fetching map alerts', err);
          // On error, fade the layer back in to show the old data.
          if (this.map.getLayer('alertlayer')) {
            this.map.setPaintProperty('alertlayer', 'icon-opacity', 1);
          }

          if (this.viewMode === 'grid' || this.viewMode === 'chart') {
            this.alertRefreshTimer = setTimeout(() => {
              this.getTodayAlerts(this.currentPage);
            }, 10000);
          }
          this.cdr.detectChanges();
        }
      });
    };

    if (this.map.getLayer('alertlayer')) {
      this.map.setPaintProperty('alertlayer', 'icon-opacity', 0);
      setTimeout(fetchDataAndRefresh, 500); // Wait for fade-out to finish
    } else {
      fetchDataAndRefresh();
    }
  }

  plotAlertsOnMap(data: any[]) {
    const features = data.map(item => ({
      type: 'Feature',
      properties: {
        vehicleno: item.param9,
        speed: item.param21,
        latitude: item.param6,
        longitude: item.param7,
        deviceno: item.param25,
        imeino: item.param4,
        alertname: item.param8,
        eventtime: item.param3,
        direction: item.param23,
        ignition: item.param20 === '1' ? 'On' : 'Off',
        iconimage: this.getAlertImageId(item.param2)
      },
      geometry: {
        type: 'Point',
        coordinates: [Number(item.param7), Number(item.param6)]
      }
    }));

    if (this.map.getSource('alertsource')) {
      this.map.getSource('alertsource').setData({
        type: 'FeatureCollection',
        features: features
      });
    } else {
      this.map.addSource('alertsource', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: features
        }
      });

      this.map.addLayer({
        id: 'alertlayer',
        type: 'symbol',
        source: 'alertsource',
        layout: {
          'icon-image': ['get', 'iconimage'],
          'icon-size': 0.09, // Adjusted size
          'icon-allow-overlap': true,
          'icon-ignore-placement': true
        },
        paint: {
          'icon-opacity': 1,
          'icon-opacity-transition': {
            duration: 500, // milliseconds
            delay: 0
          }
        }
      });
    }
  }

  clearAlertLayers() {
    if (this.map && this.map.getLayer('alertlayer')) {
      this.map.removeLayer('alertlayer');
    }
    if (this.map && this.map.getSource('alertsource')) {
      this.map.removeSource('alertsource');
    }
  }

  createPopupContent(props: any): string {
    return `
      <div style="padding:5px;">
        <strong>Vehicle:</strong> ${props.vehicleno}<br>
        <strong>Alert:</strong> ${props.alertname}<br>
        <strong>Time:</strong> ${props.eventtime}<br>
        <strong>Speed:</strong> ${props.speed} km/h<br>
        <strong>Ignition:</strong> ${props.ignition}
      </div>
    `;
  }

  resizeMap(width: number, height: number) {
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
      mapContainer.style.width = width + '%';
      mapContainer.style.height = height + 'px';
      if (this.map) {
        this.map.resize();
      }
    }
  }

  // --- Single Alert Map Modal Logic ---

  showSingleAlertModal: boolean = false;
  singleAlertMap: any;
  selectedSingleAlert: any = null;
  isSingleInfoCollapsed: boolean = false;

  openSingleAlertMap(alert: any) {
    this.selectedSingleAlert = alert;
    this.showSingleAlertModal = true;
    this.isSingleInfoCollapsed = false;

    // Wait for modal DOM to render
    setTimeout(() => {
      this.initializeSingleAlertMap(alert);
    }, 100);
  }

  closeSingleAlertModal() {
    this.showSingleAlertModal = false;
    if (this.singleAlertMap) {
      this.singleAlertMap.remove();
      this.singleAlertMap = null;
    }
    this.clearSingleAlertLiveTrackingLayers(); // Clear live tracking when modal closes
    this.selectedSingleAlert = null;
  }

  toggleSingleInfoPanel() {
    this.isSingleInfoCollapsed = !this.isSingleInfoCollapsed;
  }

  initializeSingleAlertMap(alert: any) {
    if (typeof mapboxgl === 'undefined') return;

    const lat = Number(alert.param6);
    const lng = Number(alert.param7);

    if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
      Swal.fire('Error', 'Invalid coordinates for this alert', 'error');
      return;
    }

    if (!configureMapboxAccessToken(mapboxgl)) return;

    this.singleAlertMap = new mapboxgl.Map({
      container: 'singleAlertMap',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [lng, lat],
      zoom: 14,
      attributionControl: false
    });
    addMapBasemapControl(this.singleAlertMap, 'mapbox');

    this.singleAlertMap.addControl(new mapboxgl.NavigationControl());
    this.singleAlertMap.addControl(new mapboxgl.FullscreenControl());

    // Add custom attribution control
    this.singleAlertMap.addControl(new (class {
      onAdd(map: any) {
        const container = document.createElement('div');
        container.className = 'mapboxgl-ctrl mapboxgl-ctrl-attrib';
        container.innerHTML = '<span class="mapboxgl-ctrl-attrib-inner">Powered by DIMTS</span>';
        return container;
      }
      onRemove() { }
    })(), 'bottom-right');

    this.singleAlertMap.on('load', () => {
      const imageId = this.getAlertImageId(alert.param2);
      // Find the URL for this image ID from our existing list or define it
      const images = [
        { id: 'powerdisconnect-image', url: 'assets/images/mapimages/alertimage/powerdisconnect.png' },
        { id: 'batterylow-image', url: 'assets/images/mapimages/alertimage/batterylow.png' },
        { id: 'batterycharge-image', url: 'assets/images/mapimages/alertimage/batterycharge.png' },
        { id: 'tamper-image', url: 'assets/images/mapimages/alertimage/tamper.png' },
        { id: 'panic-image', url: 'assets/images/mapimages/alertimage/panic.gif' },
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

      const imgObj = images.find(img => img.id === imageId) || images.find(img => img.id === 'otheralert-image');

      if (imgObj) {
        this.singleAlertMap.loadImage(imgObj.url, (error: any, image: any) => {
          if (!error) {
            if (!this.singleAlertMap.hasImage(imageId)) {
              this.singleAlertMap.addImage(imageId, image);
            }
            // Add marker using a DOM element for better control or a symbol layer
            new mapboxgl.Marker({ element: this.createCustomMarkerElement(imgObj.url) })
              .setLngLat([lng, lat])
              .addTo(this.singleAlertMap);

            // Start live tracking from the alert location, using IMEI (param4) as vehicle identifier
            this.startSingleAlertLiveTracking(alert.param9, [lng, lat]);
          }
        });
      }
    });
  }

  createCustomMarkerElement(url: string) {
    const el = document.createElement('div');
    el.style.backgroundImage = `url(${url})`;
    el.style.width = '40px';
    el.style.height = '40px';
    el.style.backgroundSize = 'contain';
    el.style.backgroundRepeat = 'no-repeat';
    return el;
  }

  // ==========================================
  // Live Tracking for Single Alert Map
  // ==========================================

  startSingleAlertLiveTracking(vehicleId: string, initialCoords: [number, number]) {
    this.singleAlertLiveVehicleId = vehicleId;
    this.clearSingleAlertLiveTrackingLayers(); // Clear previous live tracking elements on this map
    this.singleAlertLivePathCoordinates = [initialCoords]; // Start path from alert location

    const fetchSingleAlertLive = (showLoader: boolean = false) => {
      this.vehicleService.getLiveTrack(this.singleAlertLiveVehicleId, showLoader).subscribe({
        next: (response: any) => {
          if (!response.entity || response.entity.length === 0) return;

          this.singleAlertLiveData = response.entity[0];
          const coords = [Number(this.singleAlertLiveData.param39), Number(this.singleAlertLiveData.param38)];
          const rotation = Number(this.singleAlertLiveData.param43) || 0;

          if (!this.singleAlertLiveMarker) {
            // Initial marker creation
            const el = document.createElement('div');
            el.className = 'single-alert-live-marker';
            el.style.backgroundImage = 'url(assets/mapimages/car/green.png)'; // Use a car icon
            el.style.width = '40px';
            el.style.height = '40px';
            el.style.backgroundSize = 'contain';
            el.style.backgroundRepeat = 'no-repeat';
            el.style.backgroundPosition = 'center';

            this.singleAlertLiveMarker = new mapboxgl.Marker(el)
              .setLngLat(coords as [number, number])
              .setRotation(rotation)
              .addTo(this.singleAlertMap);

            this.drawSingleAlertLiveTrail(this.singleAlertLivePathCoordinates);
            this.singleAlertMap.flyTo({ center: coords as [number, number], essential: true, zoom: 14 }); // Fly to vehicle
          } else {
            this.animateSingleAlertMarkerTo(coords as [number, number], rotation);
          }

          // Update the info panel data
          this.singleAlertInfoPanelData = {
            type: 'live',
            vehicleno: this.singleAlertLiveData.param13,
            speed: this.singleAlertLiveData.param40,
            pollingdate: this.singleAlertLiveData.param35,
            ignition: this.singleAlertLiveData.param20 === '1' ? 'On' : 'Off',
            latitude: Number(this.singleAlertLiveData.param38),
            longitude: Number(this.singleAlertLiveData.param39),
            gpsStatus: this.singleAlertLiveData.param41 === '1' ? 'Active' : 'Inactive',
            customerName: this.singleAlertLiveData.param25,
            serialNo: this.singleAlertLiveData.param5,
            imeiNo: this.singleAlertLiveData.param4,
            vendor: this.singleAlertLiveData.param9,
            iccidno: this.singleAlertLiveData.param6,
          };
          this.cdr.detectChanges(); // Trigger change detection for the info panel
        },
        error: (err: any) => console.error('Error fetching single alert live track', err)
      });
    };

    fetchSingleAlertLive(true);
    this.singleAlertLiveInterval = setInterval(() => {
      fetchSingleAlertLive(false); // ❌ no loader
    }, 10000);
  }

  animateSingleAlertMarkerTo(targetLngLat: [number, number], targetRotation: number) {
    if (!this.singleAlertLiveMarker) return;

    const startLngLat = this.singleAlertLiveMarker.getLngLat();
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
        this.singleAlertLiveMarker.setLngLat([currentLng, currentLat]);
        this.singleAlertLiveMarker.setRotation(targetRotation);
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

    const sourceId = 'singleAlertLiveRouteSource';
    const layerId = 'singleAlertLiveRouteLayer';
    const arrowLayerId = 'singleAlertLiveArrowLayer';

    const geojson: any = {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: coordinates },
      properties: {}
    };

    if (this.singleAlertMap.getSource(sourceId)) {
      (this.singleAlertMap.getSource(sourceId) as any).setData(geojson);
    } else {
      this.singleAlertMap.addSource(sourceId, { type: 'geojson', data: geojson });

      this.singleAlertMap.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#009C4E', 'line-width': 4 }
      });

      this.singleAlertMap.addLayer({
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

    const sourceId = 'singleAlertLiveRouteSource';
    const layerId = 'singleAlertLiveRouteLayer';
    const arrowLayerId = 'singleAlertLiveArrowLayer';

    if (this.singleAlertMap && this.singleAlertMap.getStyle()) {
      if (this.singleAlertMap.getLayer(arrowLayerId)) this.singleAlertMap.removeLayer(arrowLayerId);
      if (this.singleAlertMap.getLayer(layerId)) this.singleAlertMap.removeLayer(layerId);
      if (this.singleAlertMap.getSource(sourceId)) this.singleAlertMap.removeSource(sourceId);
    }
    this.singleAlertLivePathCoordinates = [];
    this.singleAlertInfoPanelData = {}; // Clear info panel data
  }
  getFilteredAlerts(page: number = 1) {

    this.loading = true;
    this.currentPage = page;

    const request = {
      param1: this.searchText,
      param2: String(this.currentPage),
      param3: String(this.pageSize),
      param4: this.formattedDate,
      param5: this.selectedAlertId,   // ✅ FILTER BY ALERT ID
      param6: "",
      param7: "All",
      param8: "",
      param9: "",
      param10: "",
      pdfexcel: ""
    };

    this.alertService.getAlertDetailVehicles(request)
      .subscribe({
        next: (response) => {

          this.loading = false;

          if (response.status && response.entity) {
            this.alertDetails = response.entity.listData || [];
            this.totalCount = response.entity.param1 || 0;
          } else {
            this.alertDetails = [];
            this.totalCount = 0;
          }

          this.cdr.detectChanges();
        },
        error: () => {
          this.loading = false;
          this.alertDetails = [];
        }
      });
  }


}
