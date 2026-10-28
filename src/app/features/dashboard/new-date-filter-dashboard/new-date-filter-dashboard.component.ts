
import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DashboardService, CompanyWiseDevice, RTOWiseDevice } from '../../../core/services/dashboard.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { ToastService } from '../../../core/services/toast.service';
import moment from 'moment';
import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import am4themes_animated from '@amcharts/amcharts4/themes/animated';
import { Subscription } from 'rxjs';
import { DeviceService,AssetsDetailsRequest } from '../../../core/services/device.service';
am4core.useTheme(am4themes_animated);

declare var $: any;
export class DashboardCounts {
  param1: number = 0;  // vendorTotal
  param2: number = 0;  // dealerTotal
  param3: number = 0;  // customerTotal
  param4: number = 0;  // devicesTotal
  param5: number = 0;  // totalInstalled
  param6: number = 0;  // totalActivated
  param7: number = 0;  // totalPending
  param8: number = 0;  // vendorActive
  param9: number = 0;  // dealerActive
  param10: number = 0; // rtoTotal
  param11: number = 0; // rtoActive
  param12: number = 0; // newVehicle
  param13: number = 0; // oldVehicle
  param14: number = 0; // totalAlerts
  param15: number = 0; // 
  // Convenience getters (computed properties)
  vendorTotal?: number =0;
  dealerTotal?: number =0;
  customerTotal?: number =0;
  devicesTotal?: number =0;
  totalInstalled?: number =0;
  totalActivated?: number =0;
  totalPending?: number =0;
  vendorActive?: number =0;
  dealerActive?: number =0;
  rtoTotal?: number =0;
  rtoActive?: number =0;
  newVehicle?: number =0;
  oldVehicle?: number =0;
}
@Component({
    selector: 'app-new-date-filter-dashboard',
    imports: [CommonModule, FormsModule, RouterModule, NgxDaterangepickerMd],
    templateUrl: './new-date-filter-dashboard.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./new-date-filter-dashboard.component.scss']
})
export class NewDateFilterDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  counts: DashboardCounts = new DashboardCounts();

  mfgdata: CompanyWiseDevice[] = [];
  rtowisedevicedetails: RTOWiseDevice[] = [];
  classwiseAlerts: any[] = [];

  loading = false;
  errorMessage = '';

  // Date filter
  dateFilterType: string = 'today'; // 'today', 'last4hrs', 'yesterday', 'last7days', 'custom'
  fromDate: string = '';
  toDate: string = '';
  fromTime: string = '';
  toTime: string = '';
showClasswiseSection: boolean = false;
  // Computed dates
  computedFromDate: string = '';
  computedToDate: string = '';

  // Chart instances
  private vendorStatusChart: any = null;
  private vehicleClasswiseAlertsChart: any = null;
  private rtoStatusChart: any = null;

  detailstitle: string = 'Date Filter Dashboard Details';
  selectedDateRange: any;
  sevenDaysAgo: any = moment().subtract(7, 'days').format('DD-MMM-YYYY');

  today: any = moment().format('DD-MMM-YYYY');
  getDateFilterCompanyWiseDeviceCountAPI?: Subscription;
  getDateFilterRTOWiseDeviceCountAPI?: Subscription;
  getDateFilterClasswiseAlertsAPI?: Subscription;
  getStateDashboardCountAPI?: Subscription;
  timerFlag: boolean = true;
  constructor(
     private deviceService: DeviceService,
    private dashboardService: DashboardService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public toast: ToastService
  ) {
    this.toast.pageName = 'Date Filter Dashboard'; // Set page name for toast service
   }

  ngOnInit() {
    const principalKey = sessionStorage.getItem('principalKey');
    if (!principalKey) {
      this.errorMessage = 'Please login to view dashboard data';
      this.router.navigate(['/login']);
      return;
    }

    this.initializeDateFilter();

    // this.loadCompanyWiseDevices();
    // this.loadClasswiseAlerts();
    // this.loadRTOWiseDevices();    
    // this.getDashboardCounts();
    this.timeOut = true;
    this.reloadData();
  }

  ngAfterViewInit() {
    this.initializeDatePicker();
    this.initializeTimePicker();
  }

  ngOnDestroy() {
    // Clean up charts
    if (this.vendorStatusChart) {
      this.vendorStatusChart.dispose();
    }
    if (this.vehicleClasswiseAlertsChart) {
      this.vehicleClasswiseAlertsChart.dispose();
    }
    if (this.rtoStatusChart) {
      this.rtoStatusChart.dispose();
    }

    // Clean up datepickers
    try {
      if (typeof $ !== 'undefined' && $.fn.datepicker) {
        $('.datepick').datepicker('destroy');
      }
    } catch (e) {
      console.error('Error cleaning up datepickers:', e);
    }
    // Unsubscribe from API subscriptions
    // this.getDateFilterCompanyWiseDeviceCountAPI?.unsubscribe();
    // this.getDateFilterRTOWiseDeviceCountAPI?.unsubscribe();
    // this.getDateFilterClasswiseAlertsAPI?.unsubscribe();
    // this.getStateDashboardCountAPI?.unsubscribe();
    this.timerFlag = false;
    if (this.timeOut) {
      clearInterval(this.timeOut);
    }
  }
  timeOut: any;
    reloadData() {
    if (this.timerFlag) {
      this.timeOut = setInterval(() => {
        // this.loadCompanyWiseDevices();
        // this.loadClasswiseAlerts();
        // this.loadRTOWiseDevices();
        // this.getDashboardCounts();
      }, 30000);
    }
  }

  getDashboardCounts() {
    this.getStateDashboardCountAPI = this.dashboardService.getStateDashboardCount().subscribe({
      next: (response) => {
        if (response && response.status && response.entity) {
          const entity: any = response.entity;
          this.counts.vendorTotal = Number(entity.param1) || 0;
          this.counts.dealerTotal = Number(entity.param2) || 0;
          this.counts.customerTotal = Number(entity.param3) || 0;
          this.counts.devicesTotal = Number(entity.param4) || 0;
          this.counts.totalInstalled = Number(entity.param5) || 0;
          this.counts.totalActivated = Number(entity.param6) || 0;
          this.counts.totalPending = Number(entity.param7) || 0;
          this.counts.vendorActive = Number(entity.param8) || 0;
          this.counts.dealerActive = Number(entity.param9) || 0;
          this.counts.rtoTotal = Number(entity.param10) || 0;
          this.counts.rtoActive = Number(entity.param11) || 0;
          this.counts.newVehicle = Number(entity.param14) || 0;
          this.counts.oldVehicle = Number(entity.param15) || 0;
        }
      },
      error: (error: any) => {
        console.error('Error loading dashboard counts:', error);
        this.errorMessage = 'Error loading dashboard counts';
      }
    });
  }


  onDateRangeChange(event: any) {
    if (event && event.startDate && event.endDate) {
      this.fromDate = this.formatDate(event.startDate.toDate());
      this.toDate = this.formatDate(event.endDate.toDate());
    }
  }
  initializeDateFilter() {
    const today = new Date();
    this.computedToDate = this.formatDate(today);

    switch (this.dateFilterType) {
      case 'today':
        this.computedFromDate = moment().startOf('day').format('DD-MMM-YYYY') + ' 12:00 AM';
        this.computedToDate = moment().endOf('day').format('DD-MMM-YYYY') + ' 11:59 PM';
        break;
      case 'last4hrs':
        const fourHoursAgo = new Date(today.getTime() - 4 * 60 * 60 * 1000);
        this.computedFromDate = moment().subtract(4, 'hours').format('DD-MMM-YYYY') + ' 12:00 AM';
        this.computedToDate = moment().format('DD-MMM-YYYY') + ' 11:59 PM';
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        this.computedFromDate = moment(yesterday).startOf('day').format('DD-MMM-YYYY') + ' 12:00 AM';
        this.computedToDate = moment(yesterday).endOf('day').format('DD-MMM-YYYY') + ' 11:59 PM';
        break;
      case 'last7days':
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        this.computedFromDate = moment(sevenDaysAgo).startOf('day').format('DD-MMM-YYYY') + ' 12:00 AM';
        this.computedToDate = moment(today).endOf('day').format('DD-MMM-YYYY') + ' 11:59 PM';
        break;
      case 'custom':
        const sevenDaysAgoDefault = new Date(today);
        sevenDaysAgoDefault.setDate(sevenDaysAgoDefault.getDate() - 7);
        this.fromDate = this.fromDate || this.formatDate(sevenDaysAgoDefault);
        this.toDate = this.toDate || this.formatDate(today);
        this.computedFromDate = this.fromDate;
        this.computedToDate = this.toDate;
        this.selectedDateRange = {
          startDate: moment(this.fromDate, 'DD-MMM-YYYY'),
          endDate: moment(this.toDate, 'DD-MMM-YYYY')
        };
        break;
      default:
        this.computedFromDate = this.formatDate(today);
        this.computedToDate = this.formatDate(today);
        break;
    }
    this.loadCompanyWiseDevices();
    this.loadClasswiseAlerts();
    this.loadRTOWiseDevices();
    this.getDashboardCounts();
  }

  initializeDatePicker() {
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.datepicker) {
        $('.datepick').datepicker({
          format: 'dd-M-yyyy',
          startDate: '01-Jan-2021',
          endDate: '+0d',
          autoclose: true,
          orientation: 'bottom auto',
          todayHighlight: true
        });

        const today = new Date();
        $('#fromdate').datepicker('setDate', new Date('2021-01-01'));
        $('#todate').datepicker('setDate', today);

        this.fromDate = this.formatDate(new Date('2021-01-01'));
        this.toDate = this.formatDate(today);

        $('#fromdate').on('changeDate', (e: any) => {
          if (e.date) {
            this.fromDate = this.formatDate(e.date);
            $('#fromdate').val(this.fromDate);
          }
        });

        $('#todate').on('changeDate', (e: any) => {
          if (e.date) {
            this.toDate = this.formatDate(e.date);
            $('#todate').val(this.toDate);
          }
        });
      }
    }, 200);
  }

  initializeTimePicker() {
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.timepicker) {
        $('.timepicker1').timepicker({
          showMeridian: false,
          minuteStep: 1
        });
        $('.timepicker2').timepicker({
          showMeridian: false,
          minuteStep: 1
        });
      }
    }, 200);
  }

  onDateFilterChange() {
    const customDateDiv = document.querySelector('.customedatediv') as HTMLElement;
    if (this.dateFilterType === 'custom') {
      if (customDateDiv) {
        customDateDiv.style.display = 'block';
      }
      // Default to last 7 days when switching to custom
      const sevenDaysAgo = moment().subtract(7, 'days');
      const todayMoment = moment();
      this.selectedDateRange = {
        startDate: sevenDaysAgo,
        endDate: todayMoment
      };
      this.fromDate = sevenDaysAgo.format('DD-MMM-YYYY');
      this.toDate = todayMoment.format('DD-MMM-YYYY');
      const fromTimeDiv = document.getElementById('fromtimediv');
      const toTimeDiv = document.getElementById('totimediv');
      if (fromTimeDiv) fromTimeDiv.style.display = 'block';
      if (toTimeDiv) toTimeDiv.style.display = 'block';
    } else {
      if (customDateDiv) {
        customDateDiv.style.display = 'none';
      }
      const fromTimeDiv = document.getElementById('fromtimediv');
      const toTimeDiv = document.getElementById('totimediv');
      if (fromTimeDiv) fromTimeDiv.style.display = 'none';
      if (toTimeDiv) toTimeDiv.style.display = 'none';

      this.initializeDateFilter();
      // this.loadDashboardData();
    }
  }

  viewDetails() {
    if (this.dateFilterType === 'custom') {
      if (!this.fromDate || !this.toDate) {
        this.toast.show('Please select From Date and To Date', 'error');
        // alert('Please select From Date and To Date');
        return;
      }
      this.computedFromDate = this.selectedDateRange.startDate.format('DD-MMM-YYYY') + ' 12:00 AM';
      this.computedToDate = this.selectedDateRange.endDate.format('DD-MMM-YYYY') + ' 11:59 PM';

      // Add time if provided
      if (this.fromTime) {
        this.computedFromDate += ' ' + this.fromTime;
      }
      if (this.toTime) {
        this.computedToDate += ' ' + this.toTime;
      }
    }

    this.loadCompanyWiseDevices();
    this.loadClasswiseAlerts();
    this.loadRTOWiseDevices();
    this.getDashboardCounts();
  }

  // loadDashboardData() {

  // this.loading = true;
  // this.errorMessage = '';

  // this.dashboardService.getDateFilterDashboardCount(this.computedFromDate, this.computedToDate).subscribe({
  //   next: (response) => {
  //     if (response && response.status && response.entity) {
  //       const entity = response.entity;
  //       this.counts.vendorTotal = Number(entity.param1) || 0;

  //       this.counts.dealerTotal = Number(entity.param2) || 0;
  //       this.counts.customerTotal = Number(entity.param3) || 0;
  //       this.counts.devicesTotal = Number(entity.param4) || 0;
  //       this.counts.totalInstalled = Number(entity.param5) || 0;
  //       this.counts.totalActivated = Number(entity.param6) || 0;
  //       this.counts.totalPending = Number(entity.param7) || 0;
  //       this.counts.vendorActive = Number(entity.param8) || 0;
  //       this.counts.dealerActive = Number(entity.param9) || 0;
  //       this.counts.rtoTotal = Number(entity.param10) || 0;
  //       this.counts.rtoActive = Number(entity.param11) || 0;
  //       this.counts.newVehicle = Number(entity.param12) || 0;
  //       this.counts.oldVehicle = Number(entity.param13) || 0;
  // this.counts.totalAlerts = Number(entity.param14) || 0;

  // this.counts = {
  //   param1: Number(entity.param1) || 0,
  //   param2: Number(entity.param2) || 0,
  //   param3: Number(entity.param3) || 0,
  //   param4: Number(entity.param4) || 0,
  //   param5: Number(entity.param5) || 0,
  //   param6: Number(entity.param6) || 0,
  //   param7: Number(entity.param7) || 0,
  //   param8: Number(entity.param8) || 0,
  //   param9: Number(entity.param9) || 0,
  //   param10: Number(entity.param10) || 0,
  //   param11: Number(entity.param11) || 0,
  //   param12: Number(entity.param12) || 0,
  //   param13: Number(entity.param13) || 0,
  //   vendorTotal: Number(entity.param1) || 0,
  //   dealerTotal: Number(entity.param2) || 0,
  //   customerTotal: Number(entity.param3) || 0,
  //   devicesTotal: Number(entity.param4) || 0,
  //   totalInstalled: Number(entity.param5) || 0,
  //   totalActivated: Number(entity.param6) || 0,
  //   totalPending: Number(entity.param7) || 0,
  //   vendorActive: Number(entity.param8) || 0,
  //   dealerActive: Number(entity.param9) || 0,
  //   rtoTotal: Number(entity.param10) || 0,
  //   rtoActive: Number(entity.param11) || 0,
  //   newVehicle: Number(entity.param12) || 0,
  //   oldVehicle: Number(entity.param13) || 0
  // };
  // }
  // this.loadCompanyWiseDevices();
  //   },
  //   error: (error) => {
  //     this.loading = false;
  //     this.errorMessage = 'Error loading dashboard data';
  //     console.error('Dashboard API Error:', error);
  //     this.loadCompanyWiseDevices();
  //   }
  // });
  // }

  loadCompanyWiseDevices() {
    // this.getDateFilterCompanyWiseDeviceCountAPI?.unsubscribe();
    this.getDateFilterCompanyWiseDeviceCountAPI = this.dashboardService.getDateFilterCompanyWiseDeviceCount('', 'NA', 'NA', '', this.computedFromDate, this.computedToDate).subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.mfgdata = response.entity.countlistData || [];
          setTimeout(() => this.renderVendorStatusChart(), 100);
        } else {
          this.mfgdata = [];
          setTimeout(() => this.renderVendorStatusChart(), 100);
        }
      },
      error: (error) => {
        console.error('Error loading company wise devices:', error);
        this.mfgdata = [];
        setTimeout(() => this.renderVendorStatusChart(), 100);
      }
    });
  }

  loadRTOWiseDevices() {
    // this.getDateFilterRTOWiseDeviceCountAPI?.unsubscribe();
    this.getDateFilterRTOWiseDeviceCountAPI = this.dashboardService.getDateFilterRTOWiseDeviceCount('', '1', '1000', 'Details', this.computedFromDate, this.computedToDate).subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.rtowisedevicedetails = response.entity.countlistData || [];
          setTimeout(() => this.renderRTOStatusChart(), 100);
        } else {
          this.rtowisedevicedetails = [];
          setTimeout(() => this.renderRTOStatusChart(), 100);
        }

      },
      error: (error) => {
        console.error('Error loading RTO wise devices:', error);
        this.rtowisedevicedetails = [];
        setTimeout(() => this.renderRTOStatusChart(), 100);
        // this.loadClasswiseAlerts();
      }
    });
  }

loadClasswiseAlerts() {
  this.getDateFilterClasswiseAlertsAPI = this.dashboardService
    .getDateFilterClasswiseAlerts('vehicleclasswisealertcount', this.computedFromDate, this.computedToDate)
    .subscribe({
      next: (response) => {
        this.loading = false;

        if (response.status && response.entity && response.entity.listData?.length > 0) {
          this.classwiseAlerts = response.entity.listData;
          this.showClasswiseSection = true;  // ✅ show
          setTimeout(() => this.renderVehicleClasswiseAlertsChart(), 200);
        } else {
          this.classwiseAlerts = [];
          this.showClasswiseSection = false; // ❌ hide पूरा section
        }

        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading classwise alerts:', error);

        this.classwiseAlerts = [];
        this.showClasswiseSection = false; // ❌ hide on error
        this.cdr.detectChanges();
      }
    });
}

  renderVendorStatusChart() {
    if (this.vendorStatusChart) {
      this.vendorStatusChart.dispose();
      this.vendorStatusChart = null;
    }

    const chart = am4core.create('VendorStatus', am4charts.XYChart3D);
    chart.depth = 20;
    chart.angle = 30;
    chart.logo.disabled = true;
    this.vendorStatusChart = chart;

    chart.data = this.mfgdata && this.mfgdata.length > 0
      ? this.mfgdata.map(v => ({
        vendor: v.param45 || 'N/A',
        installed: Number(v.param6) || 0,
        activated: Number(v.param7) || 0,
        pending: Number(v.param8) || 0
      }))
      : [{ vendor: 'No Data', installed: 0, activated: 0, pending: 0 }];

    // Category axis (X)
    const categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
    categoryAxis.dataFields.category = 'vendor';
    categoryAxis.renderer.labels.template.rotation = -45;
    categoryAxis.renderer.labels.template.horizontalCenter = 'right';
    categoryAxis.renderer.labels.template.verticalCenter = 'middle';
    categoryAxis.renderer.grid.template.disabled = true;

    // Value axis (Y)
    const valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
    valueAxis.title.text = 'Device Count';
    valueAxis.renderer.grid.template.strokeOpacity = 0.1;
    valueAxis.min = 0;
    valueAxis.maxPrecision = 0;
    valueAxis.events.on('datavalidated', (ev: any) => {
      const axis = ev.target;
      if (axis.max < 10) { axis.max = 10; }
    });

    // Helper to create a stacked 3D column series
    const createSeries = (field: string, name: string, color: string) => {
      const series = chart.series.push(new am4charts.ColumnSeries3D());
      series.dataFields.valueY = field;
      series.dataFields.categoryX = 'vendor';
      series.name = name;
      series.stacked = true;
      series.columns.template.fill = am4core.color(color);
      series.columns.template.stroke = am4core.color(color);
      series.columns.template.tooltipText = '{name}\n{categoryX}: [bold]{valueY}[/]';
      series.columns.template.width = am4core.percent(40); // Set max column width to 40%
      series.columns.template.maxWidth = 40; // Set max width in pixels
      return series;
    };

    createSeries('installed', 'Installed', '#b3e983');
    // createSeries('activated', 'Activated', '#88dbc3');
    createSeries('pending', 'Pending', '#efeb90');

    // Legend
    chart.legend = new am4charts.Legend();
    chart.legend.position = 'top';

    // Cursor
    chart.cursor = new am4charts.XYCursor();
    chart.cursor.lineX.disabled = true;
    chart.cursor.lineY.disabled = true;
  }

  renderVehicleClasswiseAlertsChart() {
    if (this.vehicleClasswiseAlertsChart) {
      this.vehicleClasswiseAlertsChart.dispose();
      this.vehicleClasswiseAlertsChart = null;
    }

    const chart = am4core.create('VehicleClasswiseAlerts', am4charts.PieChart);
    chart.logo.disabled = true;
    this.vehicleClasswiseAlertsChart = chart;

    chart.data = this.classwiseAlerts && this.classwiseAlerts.length > 0
      ? this.classwiseAlerts.map(a => ({
        vehicleClass: a.param3 || 'N/A',
        alertCount: Number(a.param4) || 0
      }))
      : [{ vehicleClass: 'No Data', alertCount: 0 }];

    const series = chart.series.push(new am4charts.PieSeries());
    series.dataFields.value = 'alertCount';
    series.dataFields.category = 'vehicleClass';
    series.slices.template.tooltipText = '{category}: [bold]{value}[/]';
    series.slices.template.stroke = am4core.color('#fff');
    series.slices.template.strokeWidth = 1;
    series.slices.template.strokeOpacity = 1;
    series.labels.template.text = '{category}: {value}';
    series.labels.template.fontSize = 10;

    chart.legend = new am4charts.Legend();
    chart.legend.position = 'bottom';
    chart.legend.labels.template.fontSize = 10;
  }

renderRTOStatusChart() {
  // Dispose old chart
  if (this.rtoStatusChart) {
    this.rtoStatusChart.dispose();
    this.rtoStatusChart = null;
  }

  // Create chart
  let chart = am4core.create("RTOStatus", am4charts.XYChart3D);
  chart.paddingBottom = 30;
  chart.angle = 35;
  chart.logo.disabled = true;
  this.rtoStatusChart = chart;

  const colors = this.getcolor();

  // Prepare data with RANDOM COLORS (stable index based)
  const chartData = this.rtowisedevicedetails && this.rtowisedevicedetails.length > 0
    ? this.rtowisedevicedetails.map((r, index) => ({
        title: r.param3 || 'N/A',      // RTO Code
        value: Number(r.param4) || 0,   // Vehicle Count
        color: colors[index % colors.length] // ✅ stable random
      }))
    : [];

  chart.data = chartData;

  // X Axis (RTO Code)
  let categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
  categoryAxis.dataFields.category = "title";
  categoryAxis.renderer.grid.template.disabled = true;
  categoryAxis.renderer.minGridDistance = 20;

let labelTemplate = categoryAxis.renderer.labels.template;

labelTemplate.rotation = -45;  // ❌ -90 hatao
labelTemplate.wrap = true;     // ✅ wrap enable
labelTemplate.maxWidth = 120;  // ✅ control width
labelTemplate.truncate = false;
labelTemplate.fontSize = 10;

  // Y Axis
  let valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
  valueAxis.title.text = "Number of Vehicles";
  valueAxis.min = 0;
  valueAxis.maxPrecision = 0;
  valueAxis.renderer.grid.template.strokeOpacity = 0.1;

  // Series
  let series = chart.series.push(new am4charts.ConeSeries());
  series.dataFields.valueY = "value";
  series.dataFields.categoryX = "title";

  // ✅ Apply RANDOM COLORS
  series.columns.template.propertyFields.fill = "color";
  series.columns.template.propertyFields.stroke = "color";

  // Tooltip (clean)
  series.columns.template.tooltipText = "Vehicles: [bold]{valueY}[/]";

  // ✅ Show ONLY number (no duplicate label)
  let labelBullet = series.bullets.push(new am4charts.LabelBullet());
  labelBullet.label.text = "{valueY}";
  labelBullet.label.fill = am4core.color("#000");
  labelBullet.label.fontSize = 12;
  labelBullet.label.dy = -10;

  // Column width
  series.columns.template.width = am4core.percent(40);
  series.columns.template.maxWidth = 30;

  // Cursor
  chart.cursor = new am4charts.XYCursor();
  chart.cursor.lineX.disabled = true;
  chart.cursor.lineY.disabled = true;
}

  formatDate(date: Date): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(date.getDate()).padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
// navigateToVehicle(event?: Event, type: string = '', date: string = '0', count?: number) {
//     if (event) {
//       event.preventDefault();
//       event.stopPropagation();
//     }
//     this.router.navigate(['/AssetSatus'], { queryParams: { count: count, type: type } }).catch(err => { });
//   }
  getcolor() {
    var color = [];
    color.push("#FF0F00");
    color.push("#FF9E01");
    color.push("#FF6600");
    color.push("#FCD202");
    color.push("#F8FF01");
    color.push("#B0DE09");
    color.push("#04D215");
    color.push("#0D8ECF");
    color.push("#0D52D1");
    color.push("#2A0CD0");
    color.push("#8A0CCF");
    color.push("#CD0D74");
    color.push("#754DEB");
    color.push("#DDDDDD");
    color.push("#333333");
    color.push("#FF0F00");
    color.push("#FF9E01");
    color.push("#FF6600");
    color.push("#FCD202");
    color.push("#F8FF01");
    color.push("#FF0F00");
    color.push("#FF9E01");
    color.push("#FF6600");
    color.push("#FF9E01");
    color.push("#FF6600");
    color.push("#FCD202");
    color.push("#F8FF01");
    color.push("#B0DE09");
    color.push("#04D215");
    color.push("#0D8ECF");
    color.push("#0D52D1");
    color.push("#2A0CD0");
    color.push("#8A0CCF");
    color.push("#CD0D74");
    color.push("#754DEB");
    color.push("#DDDDDD");
    color.push("#333333");
    color.push("#FF0F00");
    color.push("#FF9E01");
    color.push("#FF6600");
    color.push("#FCD202");
    color.push("#F8FF01");
    color.push("#FF0F00");
    color.push("#FF9E01");
    color.push("#FF6600");
    color.push("#FF9E01");
    color.push("#FF6600");
    color.push("#FCD202");
    color.push("#F8FF01");
    color.push("#B0DE09");
    color.push("#04D215");
    color.push("#0D8ECF");
    color.push("#0D52D1");
    color.push("#2A0CD0");
    color.push("#8A0CCF");
    color.push("#CD0D74");
    color.push("#754DEB");
    color.push("#DDDDDD");
    color.push("#333333");
    color.push("#FF0F00");
    color.push("#FF9E01");
    color.push("#FF6600");
    color.push("#FCD202");
    color.push("#F8FF01");
    color.push("#FF0F00");
    color.push("#FF9E01");
    color.push("#FF6600");
    color.push("#FF9E01");
    color.push("#FF6600");
    color.push("#FCD202");
    color.push("#F8FF01");
    color.push("#B0DE09");
    color.push("#04D215");
    color.push("#0D8ECF");
    color.push("#0D52D1");
    color.push("#2A0CD0");
    color.push("#8A0CCF");
    color.push("#CD0D74");
    color.push("#754DEB");
    color.push("#DDDDDD");
    color.push("#333333");
    color.push("#F8FF01");
    color.push("#B0DE09");
    color.push("#04D215");
    color.push("#0D8ECF");
    color.push("#0D52D1");
    color.push("#2A0CD0");
    color.push("#8A0CCF");
    color.push("#CD0D74");
    color.push("#754DEB");
    color.push("#DDDDDD");
    color.push("#333333");
    color.push("#FF0F00");
    color.push("#FF9E01");
    color.push("#FF6600");
    color.push("#FCD202");
    color.push("#F8FF01");
    color.push("#FF0F00");
    return color;
  }
// ---------------------------------------
sortKey: string = '';
 reverse: boolean = false;
  sort(key: string) {
    if (this.sortKey === key) {
      this.reverse = !this.reverse;
    } else {
      this.sortKey = key;
      this.reverse = false;
    }
    this.cdr.detectChanges();
  }
  isExporting: boolean = false;
   pageSizeOptions = [20, 50, 100, 200, 500];
   onPageSizeChange(size: number) {
  this.pageSize = size;
  this.currentPage = 1;

  this.loadVehicleData(); // ✅ vehicleType lost नहीं होगा
}
loadVehicleData() {
  const request: AssetsDetailsRequest = {
    param1: this.searchText.trim(),
    param2: this.currentPage,
    param3: this.pageSize,
    param4: this.vehicleType, // ✅ हमेशा same रहेगा
    param5: '',
    param6: '',
    param7: ''
  };

  this.deviceService.getAssetsDetails(request).subscribe({
    next: (response) => {    
      if (response?.status) {                    
        this.vehicledet = response.entity.listData || [];
        this.totalCount = Number(response.entity.param1) || 0;
        this.pageCount = this.vehicledet.length;
        // this.pageCount = Math.ceil(this.totalCount / this.pageSize);
      }
      this.cdr.detectChanges();
    },
    error: (error) => {
      console.error("API Error:", error);
    }
  });
}

navigateToVehicle(type: string) {
  this.vehicleType = type;   // ✅ store filter
  this.currentPage = 1;

  this.showTrackModal = true;
  this.selectedVehicleNo = type;

  this.loadVehicleData(); // ✅ use common function
}
  vehicledet: Device[] = [];
    showTrackModal: boolean = false;
  totalCount = 0;
  pageCount = 0;
selectedDownloadType: string = '';
currentPage = 1;
  pageSize = 20;

  globtype: string = '';
  vehicleType: string = '';
    searchText = '';
      selectedVehicleNo: any;
    closeModal() {
  this.showTrackModal = false;

  // ✅ reset all modal related data
  this.vehicledet = [];
  this.totalCount = 0;
  this.pageCount = 0;

  // ✅ reset pagination
  this.currentPage = 1;
  this.pageSize = 20;

  // ✅ reset filters
  this.vehicleType = '';
  this.globtype = '';
  this.searchText = '';

  // ✅ reset selection
  this.selectedVehicleNo = null;

  this.cdr.detectChanges();
}
 getSearchDetails() {
    this.currentPage = 1;
    this.navigateToVehicle('');
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
  onPageChange(page: number) {
    if (page < 1) return;
    const totalPages = this.getTotalPages();
    if (this.totalCount > 0 && page > totalPages) return;
    this.currentPage = page;
 this.loadVehicleData();
  }
 onDownloadChange() {

    if (this.selectedDownloadType === 'Excel') {
      // this.exportToExcel();
    }

    // reset dropdown
    setTimeout(() => {
      this.selectedDownloadType = '';
    }, 300);
  }



}
export interface Device {
  param1: string;      // rowNumber
  param2?: string;     // Vehicle ID or other
  param3?: string;     // Device ID or other
  param4: string;      // IMEI No
  param5: string;      // Serial No
  param6: string;      // ICCID No
  param7: string;      // Vendor Name
  param8?: string;     // Dealer Name
  param11?: string;    // Vehicle/Chassis No
  param14?: string;    // Activation Date
  param18?: string;    // RTO Name
  param19?: string;    // Vehicle Type
  param26: string;     // Activation Status
  param28?: string;    // Customer Name
  param29?: string;    // Customer Mobile
  param43?: string;    // Installation Date
  param45?: string;    // Polling Status
  param56?: string;    // M2M Code
  param67?: string;    // Installation Date (alternative format)
  [key: string]: any;  // Additional properties for flexible response handling
}