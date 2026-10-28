import {
  Component,
  OnInit,
  OnDestroy,
  NgZone,
  ChangeDetectorRef,
  ChangeDetectionStrategy
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import {
  DashboardService,
  DashboardCounts,
  CompanyWiseDevice,
  RTOWiseDevice,
} from "../../core/services/dashboard.service";
import {
  MenuService,
  MenuItem,
  SubMenuItem,
} from "../../core/services/menu.service";
import { LoadingComponent } from "../../shared/components/loading/loading.component";
import { ErrorMessageComponent } from "../../shared/components/error-message/error-message.component";
import { NgSelectModule } from "@ng-select/ng-select";
import { NgxDaterangepickerMd } from "ngx-daterangepicker-material";
import {
  DeviceService,
  AssetsDetailsRequest,
  Device,
} from "../../core/services/device.service";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import {
  CompanywiseDeviceDetailsReq,
  CompanywiseDeviceTodayActivationDetailsReq,
  CompanywiseDeviceTodayInstalledDetailsReq,
  WeeklyActivationChartReq,
} from "../../core/model/request.model";
import { ToastService } from "../../core/services/toast.service";
import moment from "moment";

declare var $: any;
declare var AmCharts: any;

@Component({
    selector: "app-dashboard",
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        NgSelectModule,
        NgxDaterangepickerMd,
    ],
    templateUrl: "./dashboard.component.html",
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ["./dashboard.component.scss"]
})
// LoadingComponent,

//     ErrorMessageComponent
export class DashboardComponent implements OnInit, OnDestroy {
  counts: DashboardCounts = {
    param1: 0,
    param2: 0,
    param3: 0,
    param4: 0,
    param5: 0,
    param6: 0,
    param7: 0,
    param8: 0,
    param9: 0,
    param10: 0,
    param11: 0,
    param12: 0,
    param13: 0,
    param19: 0,
    vendorTotal: 0,
    dealerTotal: 0,
    customerTotal: 0,
    devicesTotal: 0,
    totalInstalled: 0,
    totalActivated: 0,
    totalPending: 0,
    vendorActive: 0,
    dealerActive: 0,
    rtoTotal: 0,
    rtoActive: 0,
    newVehicle: 0,
    oldVehicle: 0,
  };
  private vendorDeviceChart: am5.Root | null = null;
  showTrackModal: boolean = false;
  selectedVehicleNo: any;
  private currentdayChart: am5.Root | null = null;
  private currentdayActivationChart: am5.Root | null = null;
  // private last7Root: am5.Root | null = null;
  private last7Root: any = null;
  last7ActivationData: any[] = [];

  overdspeedcount = 0;
  harshbreak = 0;
  emergency = 0;
  vendorlist: any[] = [];
  mfgdata: CompanyWiseDevice[] = [];
  rtowisedevicedetails: RTOWiseDevice[] = [];
  subrtolist: any[] = [];

  totaldevice = 0;
  totalvehicle = 0;
  connteceddevice = 0;
  notconnteceddevice = 0;
  neverconnteceddevice = 0;
  activatedvehicle = 0;
  pendingvehicle = 0;

  compcharthead = "Company Wise Device Details";
  vendorname = "";
  rtoname = "";

  totalrto = 0;
  rtonewvehicle = 0;
  rtooldvehicle = 0;
  rtototalvehicle = 0;
  rtoactivatedvehicle = 0;
  rtopendingvehicle = 0;
  rtoconnteceddevice = 0;
  rtonotconnteceddevice = 0;
  rtoneverconnteceddevice = 0;

  loading = false;
  errorMessage = "";

  middleTab: string = "vendor";
  // Filter properties
  selectedVendorFilter: string | null = null;
  selectedRTOFilter: string | null = null;
  fromDate: string = "01-Jan-2021";
  toDate: string = "";
  selectedDateRange: {
    startDate: Date | string;
    endDate: Date | string;
  } | null = null;
  vehicledet: Device[] = [];
  searchText = "";
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [20, 50, 100, 200, 500];
  totalCount = 0;
  pageCount = 0;
  // Sorting
  sortKey: string = "";
  reverse: boolean = false;
  isExporting: boolean = false;
  selectedDownloadType: string = "";

  mfgdata1: any[] = [];
  totalActivationCount: number = 0;
  totalInstalledCount: number = 0;
  // Store chart instances for cleanup
  private weeklyActivationChart: any = null;
  dateObj: any;

  constructor(
    private dashboardService: DashboardService,
    private router: Router,
    private zone: NgZone,
    private deviceService: DeviceService,
    private cdr: ChangeDetectorRef,
    public toastService: ToastService,
  ) {
    this.toastService.pageName = "Admin Dashboard"; // Set page name for toast service
  }
  lockBackButton() {
    for (let i = 0; i < 100; i++) {
      history.pushState(null, "", location.href);
    }

    window.onpopstate = () => {
      history.pushState(null, "", location.href);
    };
  }
  ngOnInit() {
    // this.renderVendorDeviceChart()
    this.lockBackButton(); // Call the function to lock back button
    // Verify authentication before loading data
    const principalKey = sessionStorage.getItem("principalKey");
    if (!principalKey) {
      this.errorMessage = "Please login to view dashboard data";
      //
      // Redirect to login if not authenticated
      this.router.navigate(["/login"]);
      return;
    }

    // Initialize default date range (from 01-Jan-2021 to today)
    // ✅ Default date range = Today to Today
    const today = new Date();

    this.fromDate = this.formatDate(today);
    this.toDate = this.formatDate(today);

    this.selectedDateRange = {
      startDate: today,
      endDate: today,
    };

    this.loadDashboardData();
    this.loadVendorList();
    this.loadRTOList();
  }
  formatRTOName(name: string): string {
    if (!name) return "";

    name = name.trim();

    // ✅ Extract WB code (WB-01 / WB01 / WB65)
    const codeMatch = name.match(/WB[-]?\d+/i);
    const code = codeMatch
      ? codeMatch[0].toUpperCase().replace("WB", "WB-")
      : "";

    // Fix WB65 -> WB-65
    const formattedCode = code.replace(/WB-(\d{2})/, "WB-$1");

    // ✅ Remove everything after "-" (Transport Vehicles etc.)
    let clean = name.split(" - ")[0];

    // ✅ Remove WB code from string
    clean = clean.replace(/WB[-]?\d+--?/i, "").trim();

    // ✅ Take only first word as city
    const city = clean.split(/[ ,(]/)[0];

    // Capitalize
    const finalCity =
      city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();

    return `${formattedCode}--${finalCity}`;
  }
  formatDate(date: Date): string {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const day = String(date.getDate()).padStart(2, "0");
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  loadVendorList() {
    this.dashboardService.getVendorList().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.vendorlist = response.entity;
        }
      },
      error: (error) => {
        {
        }
      },
    });
  }

  loadRTOList() {
    this.dashboardService.getRTOList().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.subrtolist = response.entity;
        }
      },
      error: (error) => {
        {
        }
      },
    });
  }
  viewType: string = "New";

setView(type: string) {
  this.viewType = type;

 

  this.loading = true;
  this.mfgdata = [];

  this.loadCompanyWiseDevices();
}

  loadDashboardData() {
    this.loading = true;
    this.errorMessage = "";

    this.dashboardService.getStateDashboardCount().subscribe({
      next: (response: any) => {
        if (response && response.status && response.entity) {
          this.loading = false;
          const entity = response.entity;
          this.counts = {
            param1: Number(entity.param1) || 0,
            param2: Number(entity.param2) || 0,
            param3: Number(entity.param3) || 0,
            param4: Number(entity.param4) || 0,
            param5: Number(entity.param5) || 0,
            param6: Number(entity.param6) || 0,
            param7: Number(entity.param7) || 0,
            param8: Number(entity.param8) || 0,
            param9: Number(entity.param9) || 0,
            param10: Number(entity.param10) || 0,
            param11: Number(entity.param11) || 0,
            param12: Number(entity.param12) || 0,
            param13: Number(entity.param13) || 0,
            param19: Number(entity.param19) || 0,

            // Add convenience properties
            vendorTotal: Number(entity.param1) || 0,
            dealerTotal: Number(entity.param2) || 0,
            customerTotal: Number(entity.param3) || 0,
            devicesTotal: Number(entity.param4) || 0,
            totalInstalled: Number(entity.param5) || 0,
            totalActivated: Number(entity.param6) || 0,
            totalPending: Number(entity.param7) || 0,
            vendorActive: Number(entity.param8) || 0,
            dealerActive: Number(entity.param9) || 0,
            rtoTotal: Number(entity.param10) || 0,
            rtoActive: Number(entity.param11) || 0,
            newVehicle: Number(entity.param14) || 0,
            oldVehicle: Number(entity.param15) || 0,
            todaysactivated: Number(entity.param19) || 0,
          };
        } else {
          this.errorMessage =
            typeof response?.entity === "string"
              ? response.entity
              : "Failed to load dashboard data";
        }
        this.loadCompanyWiseDevices();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = "Error loading dashboard data";
        {
        }
        {
        }
        {
        }
        {
        }
        // Still try to load other data
        this.loadCompanyWiseDevices();
      },
    });
  }

  passvendorid: string = "";
  rtoViewType: string = "NewVehicle"; // default
  setRTOView(type: string) {
    this.rtoViewType = type;
    this.loading = true;
    this.loadRTOWiseDevices();
  }
  public companywiseDeviceDetailsReq: CompanywiseDeviceDetailsReq =
    new CompanywiseDeviceDetailsReq();
  loadCompanyWiseDevices() {
    console.log("date------------->", this.dateObj);
    const vendorId = this.selectedVendorFilter || "";
    this.companywiseDeviceDetailsReq.param5 = vendorId; // ✅ set vendor filter in request object
    this.companywiseDeviceDetailsReq.param6 = this.viewType; // ✅ set view type in request object
    this.loading = true; // ✅ ADD (important)

    // console.log('API TYPE =>', this.viewType); // ✅ DEBUG

    this.dashboardService
      .getCompanyWiseDeviceDetails(this.companywiseDeviceDetailsReq)
      .subscribe({
        next: (response) => {
          // console.log('API RESPONSE =>', response);

          if (response.status && response.entity) {
            this.mfgdata = response.entity.countlistData || [];
            this.loading = false;

            // Calculate totals
            this.totaldevice = this.mfgdata.reduce(
              (s, m) => s + (Number(m.param4) || 0),
              0,
            );
            this.totalvehicle = this.mfgdata.reduce(
              (s, m) => s + (Number(m.param6) || 0),
              0,
            );
            this.connteceddevice = this.mfgdata.reduce(
              (s, m) => s + (Number(m.param9) || 0),
              0,
            );
            this.notconnteceddevice = this.mfgdata.reduce(
              (s, m) => s + (Number(m.param10) || 0),
              0,
            );
            this.neverconnteceddevice = this.mfgdata.reduce(
              (s, m) => s + (Number(m.param11) || 0),
              0,
            );
            this.activatedvehicle = this.mfgdata.reduce(
              (s, m) => s + (Number(m.param7) || 0),
              0,
            );
            this.pendingvehicle = this.mfgdata.reduce(
              (s, m) => s + (Number(m.param8) || 0),
              0,
            );
            this.loading = false;

            // Vendor name
            this.vendorname =
              vendorId && this.mfgdata.length > 0
                ? this.mfgdata[0].param3 || ""
                : "";

            // 🔥 ADD THIS (force refresh before chart)
            this.cdr.detectChanges();

            // Render chart
            setTimeout(() => this.renderVendorDeviceChart(), 100);
          }

          this.loadTodayAlerts();
        },
        error: () => {
          this.mfgdata = [];
          this.totaldevice = 0;
          this.totalvehicle = 0;
          this.connteceddevice = 0;
          this.notconnteceddevice = 0;
          this.neverconnteceddevice = 0;
          this.activatedvehicle = 0;
          this.pendingvehicle = 0;
          this.loading = false; // ✅ ADD
          this.loadTodayAlerts();
        },
      });
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
              console.log("getDate called");
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
                this.loadCompanyWiseDevices();
              } catch (error) {}
            },
          );
          this.dateObj = (
            document.getElementById("datepicker") as HTMLInputElement
          ).value;
          
        });
      }

  showRTOColumn: boolean = true;
  loadRTOWiseDevices() {
    const fromDate = this.fromDate || "01-Jan-2021";
    const toDate = this.toDate || this.formatDate(new Date());
    const rtoFilter = this.selectedRTOFilter ?? "";

    this.dashboardService
      .getRTOWiseDeviceCount(
        "details",
        fromDate,
        toDate,
        rtoFilter,
        this.rtoViewType, // 🔥 THIS IS MAIN FIX
      )
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.status && response.entity) {
            this.rtowisedevicedetails = response.entity.countlistData || [];
            this.totalrto = response.entity.param1 || 0;
            // Reset totals before calculating
            this.rtonewvehicle = 0;
            this.rtooldvehicle = 0;
            this.rtototalvehicle = 0;
            this.rtoactivatedvehicle = 0;
            this.rtopendingvehicle = 0;
            this.rtoconnteceddevice = 0;
            this.rtonotconnteceddevice = 0;
            this.rtoneverconnteceddevice = 0;

            // Calculate totals
            this.rtowisedevicedetails.forEach((rto) => {
              this.rtonewvehicle += Number(rto.param13) || 0;
              this.rtooldvehicle += Number(rto.param14) || 0;
              this.rtototalvehicle += Number(rto.param6) || 0;
              this.rtoactivatedvehicle += Number(rto.param7) || 0;
              this.rtopendingvehicle += Number(rto.param8) || 0;
              this.rtoconnteceddevice += Number(rto.param9) || 0;
              this.rtonotconnteceddevice += Number(rto.param10) || 0;
              this.rtoneverconnteceddevice += Number(rto.param11) || 0;
            });
          }
        },
        error: (error) => {
          this.loading = false;
          {
          }
        },
      });
  }

  loadTodayAlerts() {
    this.dashboardService.getTodayAlerts().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.loading = false;
          if (response.entity !== "No Data Available") {
            this.overdspeedcount = Number(response.entity.param1) || 0;
            this.harshbreak = Number(response.entity.param2) || 0;
            this.emergency = Number(response.entity.param3) || 0;
          } else {
            this.overdspeedcount = 0;
            this.harshbreak = 0;
            this.emergency = 0;
          }
        } else {
          this.overdspeedcount = 0;
          this.harshbreak = 0;
        }
      },
      error: (error) => {
        {
        }
        this.overdspeedcount = 0;
        this.harshbreak = 0;
        this.emergency = 0;
        //this.loadWeeklyActivation();
      },
    });
  }

  loadWeeklyActivation() {
    let request: WeeklyActivationChartReq = new WeeklyActivationChartReq();
    this.dashboardService.getWeeklyActivation(request).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response.statuscode === 200 && response.entity?.listData) {
          this.last7ActivationData = response.entity.listData.map(
            (item: any) => {
              const date = new Date(item.param2);

              const label = date.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
              });

              return {
                date: label,
                activated: Number(item.param3) || 0,
                newActivated: Number(item.param4) || 0,
                existingActivated: Number(item.param5) || 0,
              };
            },
          );

          //console.log("Chart Data:", this.last7ActivationData);

          setTimeout(() => {
            this.renderLast7ActivationChart();
          }, 300);
        }
      },
    });
  }

  //   renderLast7ActivationChart() {
  //     const chartId = "last7Chart";
  //     const container = document.getElementById(chartId);

  //     // Wait for the container to be in the DOM.
  //     if (!container) {
  //       setTimeout(() => this.renderLast7ActivationChart(), 100);
  //       return;
  //     }

  //     if (!this.last7ActivationData.length) return;

  //     // Dispose the previous chart instance to avoid memory leaks.
  //     if (this.last7Root) {
  //       this.last7Root.dispose();
  //     }

  //     let root = am5.Root.new(chartId);
  //     this.last7Root = root; // Store the new instance for disposal.

  //     root._logo?.dispose();

  //     root.setThemes([am5themes_Animated.new(root)]);

  //     let chart = root.container.children.push(
  //       am5xy.XYChart.new(root, {
  //         panX: false,
  //         panY: false,
  //         wheelX: "panX",
  //         wheelY: "zoomX",
  //         paddingLeft: 0,
  //         layout: root.verticalLayout,
  //       }),
  //     );

  //     // Add cursor
  //     chart.set("cursor", am5xy.XYCursor.new(root, {}));

  //     // Legend
  //     let legend = chart.children.push(
  //       am5.Legend.new(root, {
  //         centerX: am5.p50,
  //         x: am5.p50,
  //       }),
  //     );
  //     legend.labels.template.setAll({
  //       fontSize: 11,
  //     });

  //     // X Axis
  //     let xRenderer = am5xy.AxisRendererX.new(root, {
  //       cellStartLocation: 0.2,
  //       cellEndLocation: 0.8,
  //       minGridDistance: 30,
  //     });

  //     xRenderer.labels.template.setAll({
  //       rotation: -45,
  //       centerY: am5.p50,
  //       centerX: am5.p100,
  //       paddingRight: 10,
  //       fontSize: 10,
  //     });

  //     let xAxis = chart.xAxes.push(
  //       am5xy.CategoryAxis.new(root, {
  //         categoryField: "date",
  //         renderer: xRenderer,
  //       }),
  //     );

  //     xAxis.data.setAll(this.last7ActivationData);

  //     // Y Axis
  //     let yAxis = chart.yAxes.push(
  //       am5xy.ValueAxis.new(root, {
  //         renderer: am5xy.AxisRendererY.new(root, {
  //           strokeOpacity: 0.1,
  //         }),
  //       }),
  //     );
  //     yAxis.get("renderer").labels.template.setAll({
  //       fontSize: 10,
  //     });

  //     // Professional Colors
  //     const seriesColors: Record<string, am5.Color> = {
  //       activated: am5.color(0x2196f3),
  //       newActivated: am5.color(0x4caf50),
  //       existingActivated: am5.color(0xff9800),
  //     };

  //     const makeSeries = (name: string, field: string, showTotal = false) => {

  //   const series = chart.series.push(
  //     am5xy.ColumnSeries.new(root, {
  //       name,
  //       xAxis,
  //       yAxis,
  //       valueYField: field,
  //       categoryXField: "date",
  //       stacked: true
  //     })
  //   );

  //   series.columns.template.setAll({
  //       width: am5.percent(80),
  //       strokeWidth: 1,
  //       cornerRadiusTL: 6,
  //       cornerRadiusTR: 6,
  //       shadowColor: am5.color(0x000000),
  //       shadowBlur: 6,
  //       shadowOffsetX: 3,
  //       shadowOffsetY: 3,
  //       shadowOpacity: 0.25
  // });

  //   series.data.setAll(this.last7ActivationData);

  //   // Value inside each stack
  //   series.bullets.push(() => {
  //     return am5.Bullet.new(root, {
  //       locationY: 0.5,
  //       sprite: am5.Label.new(root, {
  //         text: "{valueY}",
  //         populateText: true,
  //         centerX: am5.percent(50),
  //         centerY: am5.percent(50),
  //         fontSize: 10,
  //         fill: am5.color(0xffffff)
  //       })
  //     });
  //   });

  //   legend.data.push(series);
  //   series.appear();

  //   return series;
  // };
  // const installationSeries = makeSeries("Installation", "newActivated");
  //   const renewalSeries = makeSeries("Renewal", "existingActivated");
  //       renewalSeries.bullets.push(() => {
  //         return am5.Bullet.new(root, {
  //           locationY: 1,
  //           sprite: am5.Label.new(root, {
  //             text: "{activated}",
  //             populateText: true,
  //             centerX: am5.percent(50),
  //             centerY: am5.percent(100),
  //             dy: 0,
  //             fontSize: 11,
  //             fontWeight: "700",
  //             fill: am5.color(0x000000)
  //           })
  //         });
  //       });

  //     // Scrollbar
  //     // chart.set(
  //     //   "scrollbarX",
  //     //   am5.Scrollbar.new(root, {
  //     //     orientation: "horizontal",
  //     //   }),
  //     // );

  //     chart.appear(1000, 100);
  //   }
  renderLast7ActivationChart() {
    if (!this.last7ActivationData?.length) {
      return;
    }

    // this.last7ActivationData = this.last7ActivationData.map(x => ({
    //   ...x,
    //   total: Number(x.newActivated) + Number(x.existingActivated)
    // }));

    am4core.useTheme(am4themes_animated);

    if (this.last7Root) {
      this.last7Root.dispose();
    }

    let chart = am4core.create("last7Chart", am4charts.XYChart3D);
    if (chart.logo) {
      chart.logo.disabled = true;
    }
    this.last7Root = chart;

    chart.data = this.last7ActivationData;

    chart.padding(20, 20, 20, 20);

    // 3D Settings
    chart.depth = 40;
    chart.angle = 25;

    // X Axis
    let categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
    categoryAxis.dataFields.category = "date";
    categoryAxis.renderer.minGridDistance = 30;

    categoryAxis.renderer.labels.template.rotation = -45;
    categoryAxis.renderer.labels.template.horizontalCenter = "right";
    categoryAxis.renderer.labels.template.verticalCenter = "middle";

    categoryAxis.renderer.labels.template.fontSize = 12;

    // Y Axis
    let valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
    valueAxis.min = 0;
    valueAxis.renderer.labels.template.fontSize = 12;

    // Legend
    chart.legend = new am4charts.Legend();
    chart.legend.position = "bottom";
    chart.legend.labels.template.fontSize = 12;

    const createSeries = (
      name: string,
      field: string,
      color: am4core.Color,
      showTotal = false,
    ) => {
      let series = chart.series.push(new am4charts.ConeSeries());

      series.name = name;

      series.dataFields.valueY = field;
      series.dataFields.categoryX = "date";

      series.stacked = true;

      series.columns.template.width = am4core.percent(30);
      series.columns.template.fill = color;
      series.columns.template.stroke = color;

      series.tooltipText =
        "[bold]{name}[/]\n" + "{categoryX}\n" + "Value : {valueY}";

      // Value inside cylinder
      let valueLabel = series.bullets.push(new am4charts.LabelBullet());

      valueLabel.label.text = "{valueY}";
      valueLabel.label.fill = am4core.color("#fff");
      valueLabel.locationY = 0.5;
      valueLabel.label.fontSize = 10;

      // ✅ Grand total label, attached to the TOP-most stacked series so it
      // shares the same 3D depth/row as its own cone and lands directly
      // above the real top of the combined stack (instead of drifting to
      // the ground plane the way a separate series would in a 3D chart).
      if (showTotal) {
        const totalBullet = series.bullets.push(new am4charts.LabelBullet());

        totalBullet.locationY = 1;
        totalBullet.label.text = "{activated}";
        totalBullet.label.fontWeight = "bold";
        totalBullet.label.fontSize = 12;
        totalBullet.label.fill = am4core.color("#000");
        totalBullet.label.horizontalCenter = "middle";
        totalBullet.label.verticalCenter = "bottom";

        totalBullet.adapter.add("dy", (dy, target) => {
          const dataItem = target.dataItem as am4charts.ConeSeriesDataItem;
          if (dataItem && dataItem.column.height) {
            return -(dataItem.column.pixelHeight * 1.22);
          }

          return -10;
        });
        console.log("Data Item:", totalBullet.dy);
      }

      return series;
    };

    createSeries("Installation", "newActivated", am4core.color("#00C853"));

    createSeries(
      "Renewal",
      "existingActivated",
      am4core.color("#FF6D00"),
      true,
    );

    chart.cursor = new am4charts.XYCursor();
  }

  renderVendorDeviceChart() {
    const chartId = "vendordevicechart";
    const container = document.getElementById(chartId);

    if (!container || container.offsetWidth === 0) {
      setTimeout(() => this.renderVendorDeviceChart(), 200);
      return;
    }

    if (this.vendorDeviceChart) {
      this.vendorDeviceChart.dispose();
    }

    let root = am5.Root.new(chartId);
    this.vendorDeviceChart = root;

    root._logo?.dispose();

    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: true,
        panY: false,
        paddingLeft: 10,
        wheelX: "panX",
        wheelY: "zoomX",
        layout: root.verticalLayout,
      }),
    );

    chart.set("paddingBottom", 20);
    chart.set("paddingRight", 10);

    const legend = chart.children.push(
      am5.Legend.new(root, {
        centerX: am5.p50,
        x: am5.p50,
      }),
    );

    legend.labels.template.setAll({ fontSize: 11 });
    legend.valueLabels.template.setAll({ fontSize: 10 });

    // ✅ FIX START (MIN HEIGHT LOGIC)
    const MIN_BAR = 3;
    const data: any[] = [];

    if (this.mfgdata && this.mfgdata.length > 0) {
      this.mfgdata.forEach((item) => {
        const installed = Number(item.param7) || 0;
        const received = Number(item.param9) || 0;
        const notReceived = Number(item.param10) || 0;

        data.push({
          vendor: item.param3 || "Unknown",
          vendorId: item.param2,

          // 👉 visual bars (minimum height)
          installed: installed > 0 ? Math.max(installed, MIN_BAR) : 0,
          received: received > 0 ? Math.max(received, MIN_BAR) : 0,
          notReceived: notReceived > 0 ? Math.max(notReceived, MIN_BAR) : 0,

          // 👉 original values (for labels)
          installed_real: installed,
          received_real: received,
          notReceived_real: notReceived,
        });
      });
    }
    // ✅ FIX END

    const xRenderer = am5xy.AxisRendererX.new(root, {
      cellStartLocation: 0.1,
      cellEndLocation: 0.9,
      minGridDistance: 30,
    });

    xRenderer.labels.template.setAll({
      rotation: -45,
      centerY: am5.p50,
      centerX: am5.p100,
      paddingRight: 10,
      fontSize: 10,
      fill: am5.color(0x666666),
      oversizedBehavior: "wrap",
      maxWidth: 150,
      populateText: true,
    });
    xRenderer.labels.template.adapters.add("text", (text, target) => {
      let dataItem = target.dataItem;

      if (dataItem) {
        let category = (dataItem.dataContext as any)?.vendor;

        if (category && category.length > 15) {
          return category.substring(0, 15) + "...";
        }

        return category;
      }

      return text;
    });

    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: "vendor",
        renderer: xRenderer,
      }),
    );

    xAxis.data.setAll(data);

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {}),
        extraMax: 0.10,
      }),
    );

    yAxis.get("renderer").labels.template.setAll({
      fontSize: 10,
      fill: am5.color(0x666666),
    });

    const seriesColors: Record<string, am5.Color> = {
      installed: am5.color(0x22bbad),
      received: am5.color(0xff9800),
      notReceived: am5.color(0xe91e63),
    };

    // ✅ LABEL FIX MAP
    const realFieldMap: any = {
      installed: "installed_real",
      received: "received_real",
      notReceived: "notReceived_real",
    };

    const makeSeries = (name: string, fieldName: string) => {
      const series = chart.series.push(
        am5xy.ColumnSeries.new(root, {
          name: name,
          xAxis: xAxis,
          yAxis: yAxis,
          valueYField: fieldName,
          categoryXField: "vendor",
          stacked: true,
        }),
      );

      series.columns.template.setAll({
        fill: seriesColors[fieldName],
        stroke: seriesColors[fieldName],
        width: am5.percent(95), // 🔥 wider bars
        cornerRadiusTL: 4,
        cornerRadiusTR: 4,
        tooltipText: "{name}\n{categoryX}: {" + realFieldMap[fieldName] + "}",
        strokeOpacity: 0,
      });

      series.columns.template.events.on("click", (event: any) => {
        const dataItem = event.target.dataItem;
        if (dataItem) {
          const context = dataItem.dataContext as {
            vendor: string;
            vendorId: string;
          };
          const value = dataItem.get("valueY");

          if (!context || value === 0) return;

          this.zone.run(() => {
            this.router.navigate([
              "/VendorWiseDetails",
              context.vendorId,
              "0",
              "0",
            ]);
          });
        }
      });

      series.data.setAll(data);

      // ✅ LABEL SHOW ORIGINAL VALUE
      series.bullets.push(() => {
        return am5.Bullet.new(root, {
          locationY: 0.5, // 🔥 center inside bar
          sprite: am5.Label.new(root, {
            text: `{${realFieldMap[fieldName]}}`,
            centerX: am5.p50,
            centerY: am5.p50, // 🔥 perfectly center
            populateText: true,
            fontSize: 9,
            fill: am5.color(0xffffff), // 🔥 white for visibility
            oversizedBehavior: "none",
          }),
        });
      });

      series.appear(800);
      legend.data.push(series);
    };

    makeSeries("Received", "received");
    makeSeries("Not Received", "notReceived");

    // ✅ "Installed" is no longer a stacked bar segment — it's the total
    // (Received + Not Received), shown as a count label above the stack.
    const topSeries = chart.series.getIndex(chart.series.length - 1);
    if (topSeries) {
      topSeries.bullets.push(() => {
        return am5.Bullet.new(root, {
          locationY: 1,
          sprite: am5.Label.new(root, {
            text: `{installed_real}`,
            centerX: am5.p50,
            centerY: am5.p100,
            dy: -6,
            populateText: true,
            fontSize: 12,
            fontWeight: "bold",
            fill: am5.color(0x000000),
          }),
        });
      });
    }

    chart.set(
      "scrollbarX",
      am5.Scrollbar.new(root, {
        orientation: "horizontal",
      }),
    );

    chart.appear(1000, 100);
  }

  renderWeeklyActivationChart(data: any[]) {
    // Check if AmCharts 4 is available
    if (typeof (window as any).am4core === "undefined") {
      //
      return;
    }

    // Check if container exists
    const container = document.getElementById("RTOWiseVehicle");
    if (!container) {
      //
      setTimeout(() => {
        this.renderWeeklyActivationChart(data);
      }, 200);
      return;
    }

    // Prepare chart data
    const pdata: any[] = [];
    if (data && data.length > 0) {
      data.forEach((item: any) => {
        pdata.push({
          date: item.param2 || "", // date
          new: Number(item.param4) || 0, // new
          old: Number(item.param5) || 0, // old
          color1: "#22bbad",
          color2: "#14edcb",
        });
      });
    } else {
      pdata.push({
        date: "No Data Available",
        new: 0,
        old: 0,
      });
    }

    try {
      // Use AmCharts 4
      (window as any).am4core.useTheme((window as any).am4themes_animated);

      // Destroy existing chart if it exists
      if (this.weeklyActivationChart) {
        this.weeklyActivationChart.dispose();
        this.weeklyActivationChart = null;
      }

      const chart = (window as any).am4core.create(
        "RTOWiseVehicle",
        (window as any).am4charts.XYChart,
      );

      // Store chart instance for cleanup
      this.weeklyActivationChart = chart;

      chart.numberFormatter.numberFormat = "#";

      if (chart.logo) {
        chart.logo.disabled = true;
      }

      // Add data
      chart.data = pdata;

      // Create axes
      const categoryAxis = chart.xAxes.push(
        new (window as any).am4charts.CategoryAxis(),
      );
      categoryAxis.dataFields.category = "date";
      categoryAxis.renderer.grid.template.location = 0;
      categoryAxis.renderer.minGridDistance = 6;
      categoryAxis.renderer.labels.template.wrap = true;

      const valueAxis = chart.yAxes.push(
        new (window as any).am4charts.ValueAxis(),
      );
      valueAxis.title.fontWeight = "100";
      valueAxis.min = 0;
      valueAxis.renderer.labels.template.adapter.add("text", (text: string) => {
        if (!text || typeof text !== "string") {
          return "";
        }
        return text.match(/\./) ? "" : text;
      });
      valueAxis.renderer.grid.template.disabled = true;

      // Create series
      const series = chart.series.push(
        new (window as any).am4charts.ColumnSeries(),
      );
      series.dataFields.valueY = "new";
      series.dataFields.categoryX = "date";
      series.columns.template.propertyFields.fill = "color1";
      series.clustered = false;
      series.tooltipText = "New : [bold]{valueY}[/]";

      const series2 = chart.series.push(
        new (window as any).am4charts.ColumnSeries(),
      );
      series2.dataFields.valueY = "old";
      series2.dataFields.categoryX = "date";
      series2.columns.template.propertyFields.fill = "color2";
      series2.clustered = false;
      series2.columns.template.width = (window as any).am4core.percent(50);
      series2.tooltipText = "Old : [bold]{valueY}[/]";

      chart.cursor = new (window as any).am4charts.XYCursor();
      chart.cursor.lineX.disabled = true;
      chart.cursor.lineY.disabled = true;
    } catch (e) {
      // {}
    }
  }

  allvendorstatus() {
    // Show all vendor status view
    this.compcharthead = "Company Wise Device Details";
    // this.selectedVendorFilter = null; // Keep selected vendor

    // Reset vendor name display
    // this.vendorname = '';

    // Reload company wise devices with no filter
    this.loadCompanyWiseDevices();
  }

  day1vendorstatus() {
    this.loading = true;
    // Show last 1 day vendor status
    this.compcharthead = "Last 1 Day Device Details";

    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = this.formatDate(yesterday);

    const vendorFilter = this.selectedVendorFilter || "";
    let request: CompanywiseDeviceTodayInstalledDetailsReq =
      new CompanywiseDeviceTodayInstalledDetailsReq();
    request.param1 = vendorFilter; // Vendor filter
    request.param2 = yesterdayStr; // Date filter
    this.dashboardService
      .getCompanyWiseDTodayInstalledDetails(request)
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.status && (response.entity as any).listData) {
            this.mfgdata = (response.entity as any).listData || [];
            // Calculate totals from mfgdata
            const todayInstalledTotal = this.mfgdata.reduce(
              (s, m: any) => s + (Number(m.param4) || 0),
              0,
            );

            this.totaldevice = todayInstalledTotal;
            this.totalvehicle = todayInstalledTotal;
            this.activatedvehicle = todayInstalledTotal;
            this.connteceddevice = 0; // Not available in this API response
            this.notconnteceddevice = 0; // Not available in this API response
            this.neverconnteceddevice = 0; // Not available in this API response
            this.pendingvehicle = 0; // Not available in this API response
            // Chart rendering is now handled by the .add() method below.
          } else {
            this.mfgdata = [];
            this.totaldevice = 0;
            this.totalvehicle = 0;
            this.connteceddevice = 0;
            this.notconnteceddevice = 0;
            this.neverconnteceddevice = 0;
            this.activatedvehicle = 0;
            this.pendingvehicle = 0;
          }
        },
        error: (error) => {
          this.loading = false;
          this.mfgdata = [];
          this.totaldevice = 0;
          this.totalvehicle = 0;
          this.connteceddevice = 0;
          this.notconnteceddevice = 0;
          this.neverconnteceddevice = 0;
          this.activatedvehicle = 0;
          this.pendingvehicle = 0;
        },
      })
      .add(() => {
        // Always attempt to render the chart after the API call completes.
        // This will render an empty chart if there's no data, fixing the "chart not showing" issue.
        setTimeout(() => this.currentdaychart(), 100);
      });
  }

  currentdaychart() {
    if (!this.mfgdata || this.mfgdata.length === 0) return;

    // ✅ Dispose old chart
    if (this.currentdayChart) {
      this.currentdayChart.dispose();
    }

    let root = am5.Root.new("currentdaystatuschart");
    this.currentdayChart = root;

    // ✅ Remove amCharts logo
    root._logo?.dispose();

    root.setThemes([am5themes_Animated.new(root)]);

    // ✅ Chart
    let chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: true,
        panY: false,
        wheelX: "panX",
        wheelY: "zoomX",
        pinchZoomX: true,
        layout: root.verticalLayout,
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: 40,
      }),
    );

    // ✅ Cursor
    let cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
    cursor.lineY.set("visible", false);

    // ✅ X Axis
    let xRenderer = am5xy.AxisRendererX.new(root, {
      minGridDistance: 40,
    });

    xRenderer.labels.template.setAll({
      rotation: -45,
      centerY: am5.p50,
      centerX: am5.p100,
      paddingTop: 10,
      fontSize: 10,
      fill: am5.color(0x555555),
      oversizedBehavior: "wrap",
      maxWidth: 120,
      populateText: true,
    });

    // ✅ Trim label after 15 chars
    xRenderer.labels.template.adapters.add("text", (text, target) => {
      let dataItem = target.dataItem;

      if (dataItem) {
        let category = (dataItem.dataContext as any)?.vendor;

        if (category && category.length > 15) {
          return category.substring(0, 15) + "...";
        }

        return category;
      }

      return text;
    });

    let xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: "vendor",
        renderer: xRenderer,
      }),
    );

    // ✅ Y Axis
    let yRenderer = am5xy.AxisRendererY.new(root, {
      strokeOpacity: 0.15,
    });

    yRenderer.labels.template.setAll({
      fontSize: 11,
      fill: am5.color(0x555555),
    });

    let yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        min: 0,
        renderer: yRenderer,
      }),
    );

    // ✅ Convert API Data
    const chartData = this.mfgdata.map((item: any) => ({
      vendor: item.param3 || "Unknown",
      count: Number(item.param4) || 0,
    }));

    xAxis.data.setAll(chartData);

    // ✅ Series
    let series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: "Installed Vehicles",
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "count",
        categoryXField: "vendor",
        clustered: true,
      }),
    );

    // ✅ SMALL BAR WIDTH
    series.columns.template.setAll({
      width: am5.percent(50), // 🔥 small slim bars
      cornerRadiusTL: 6,
      cornerRadiusTR: 6,
      strokeOpacity: 0,
      tooltipText: "{categoryX}: {valueY}",
    });

    // ✅ Multi Colors
    const colors = [
      am5.color(0x3b82f6),
      am5.color(0x10b981),
      am5.color(0xf59e0b),
      am5.color(0xef4444),
      am5.color(0x8b5cf6),
      am5.color(0x06b6d4),
    ];

    series.columns.template.adapters.add("fill", function (fill, target) {
      return colors[series.columns.indexOf(target) % colors.length];
    });

    series.columns.template.adapters.add("stroke", function (stroke, target) {
      return colors[series.columns.indexOf(target) % colors.length];
    });

    series.bullets.push(() => {
      return am5.Bullet.new(root, {
        locationY: 0.5,
        sprite: am5.Label.new(root, {
          text: "{valueY}",
          populateText: true,
          centerX: am5.p50,
          centerY: am5.p50,

          // ✅ BOLD COUNT
          fontSize: 14,
          fontWeight: "900",

          fill: am5.color(0xffffff),

          // ✅ Extra visibility
          shadowColor: am5.color(0x000000),
          shadowBlur: 2,
          shadowOffsetX: 1,
          shadowOffsetY: 1,
        }),
      });
    });

    series.data.setAll(chartData);

    // ✅ Animation
    series.appear(1000);
    chart.appear(1000, 100);
  }

  onDateRangeChange(
    range: { startDate: Date | string; endDate: Date | string } | null,
  ) {
    if (!range) {
      return;
    }
    const start =
      range.startDate instanceof Date
        ? range.startDate
        : new Date(range.startDate);
    const end =
      range.endDate instanceof Date ? range.endDate : new Date(range.endDate);
    this.fromDate = this.formatDate(start);
    this.toDate = this.formatDate(end);
    // Do not auto-load here; wait for user to click the Search button (like original UI)
  }

  applyDateFilter() {
    // Apply the currently selected date range and RTO filter
    this.loadRTOWiseDevices();
  }

  onVendorFilterChangeModel(value: any) {
    this.selectedVendorFilter = value?.param1 || null;
    this.loadCompanyWiseDevices();
  }

  onRTOFilterChangeModel(value: string | null) {
    this.selectedRTOFilter = value;

    // Update RTO name label for summary table header (matches original behavior)
    if (this.selectedRTOFilter) {
      const selected = this.subrtolist.find(
        (r) => r.param1 === this.selectedRTOFilter,
      );
      this.rtoname = selected ? selected.param2 : "";
    } else {
      this.rtoname = "";
    }

    this.loadRTOWiseDevices();
  }
  chartInterval: any;
  switchMiddleTab(tab: string) {
  try {
    if (this.chartInterval) {
      clearInterval(this.chartInterval);
      this.chartInterval = null;
    }
  } catch (error) {}

  this.middleTab = tab;

  console.log(this.middleTab);

  if (tab === "vendor") {
    this.viewType = "New"; // default New
    this.loadVendorList();
    this.loadCompanyWiseDevices();
  }

  if (tab === "vendordevicechart") {
    this.viewType = "New"; // default New
    // this.loadCompanyWiseDevices();
    this.getDate();

    setTimeout(() => this.renderVendorDeviceChart(), 100);
  }

  if (tab === "polling counts") {
    // ✅ Polling Counts = OLD by default
    this.viewType = "Old";

    this.loading = true;
    this.mfgdata = [];

    this.loadCompanyWiseDevices();

    setTimeout(() => this.renderVendorDeviceChart(), 100);
  }

  if (tab === "currentdaystatus") {
    this.currentDayInstallationChart();
    this.currentDayActivationChart();

    this.chartInterval = setInterval(() => {
      this.currentDayInstallationChart();
      this.currentDayActivationChart();
    }, 180000);
  }

  if (tab === "last7Chart") {
    setTimeout(() => {
      this.loadWeeklyActivation();
    }, 200);
  }

  if (tab === "rto") {
    setTimeout(() => this.loadRTOWiseDevices(), 100);
  }
}

  // current day installation chart
  currentDayInstallationChart() {
    this.loading = true;
    this.dashboardService
      .getCompanyWiseDTodayInstalledDetails(this.currentDayInstallationReq)
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.status && (response.entity as any).listData) {
            this.mfgdata = (response.entity as any).listData || [];
            this.totalInstalledCount = this.mfgdata.reduce(
              (sum, item) => sum + (Number(item.param4) || 0),
              0,
            );
          } else {
            this.mfgdata = [];
          }
        },
        error: () => {
          this.loading = false;
          this.mfgdata = [];
        },
      })
      .add(() => {
        // Always render the chart after the API call to ensure it appears even if empty.
        setTimeout(() => this.currentdaychart(), 100);
      });
  }
  //current day activation chart
  public currentDayActivationReq: CompanywiseDeviceTodayActivationDetailsReq =
    new CompanywiseDeviceTodayActivationDetailsReq();
  public currentDayInstallationReq: CompanywiseDeviceTodayInstalledDetailsReq =
    new CompanywiseDeviceTodayInstalledDetailsReq();
  currentDayActivationChart() {
    this.dashboardService
      .getCompanyWiseDTodayActivationDetails(this.currentDayActivationReq)
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.status && (response.entity as any).listData) {
            this.mfgdata1 = (response.entity as any).listData || [];
            this.totalActivationCount = this.mfgdata1.reduce(
              (sum, item) => sum + (Number(item.param4) || 0),
              0,
            );
          } else {
            this.mfgdata1 = [];
          }
        },
        error: () => {
          this.loading = false;
          this.mfgdata1 = [];
        },
      })
      .add(() => {
        // Always render the chart after the API call to ensure it appears even if empty.
        setTimeout(() => this.currentdayActivationchart(), 100);
      });
  }
  // Navigation methods for widget links
  navigateToDealer(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.router.navigate(["/dealer"]).catch((err) => {});
  }

  navigateToRTO(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.router.navigate(["/rto"]).catch((err) => {});
  }

  navigateToDevice(
    event?: Event,
    type: string = "0",
    filter: string = "0",
    rto: string = "0",
  ) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    //console.log('Routing Params:', { type, filter, rto });

    this.router.navigate(["/AssetSatus"], {
      queryParams: {
        filter: filter,
        type: type,
        rto: rto,
      },
    });
  }
  vehicleType: string = ""; // 'Old' or 'New'
  globtype: string = "";
  navigateToVehicle(type: string) {
    this.vehicleType = type; // ✅ store filter
    this.currentPage = 1;

    this.showTrackModal = true;
    this.selectedVehicleNo = type;

    this.loadVehicleData(); // ✅ use common function
  }
  loadVehicleData() {
    // const request: AssetsDetailsRequest = {
    //   param1: this.searchText.trim(),
    //   param2: this.currentPage,
    //   param3: this.pageSize,
    //   param4: this.vehicleType, // ✅ हमेशा same रहेगा
    //   param5: '',
    //   param6: '',
    //   param7: ''
    // };

    const request: AssetsDetailsRequest = {
      param1: this.searchText.trim(),
      param2: this.currentPage,
      param3: this.pageSize,
      param4: this.viewType,

      param9: "",
      param10: "", // filter name
      param11: "", // filter value
      param12: this.vehicleType, // Activated / Not activated
      param13: "", // Pending / Approved
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
      },
    });
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
    this.vehicleType = "";
    this.globtype = "";
    this.searchText = "";

    // ✅ reset selection
    this.selectedVehicleNo = null;

    this.cdr.detectChanges();
  }

  navigateToAlert(event?: Event, type: string = "0", date: string = "0") {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // ✅ Store selected alert
    this.selectedAlertType = type;

    // ✅ Navigate
    this.router.navigate(["/TodayAlert", type, date]).catch((err) => {});
  }
  selectedAlertType: string = "";
  ngOnDestroy() {
    // Clean up AmCharts instances
    try {
      // Clean up AmCharts 4 chart
      if (this.weeklyActivationChart) {
        if (typeof this.weeklyActivationChart.dispose === "function") {
          this.weeklyActivationChart.dispose();
        }
        this.weeklyActivationChart = null;
      }

      // Clean up Vendor Device Chart (AmCharts 5)
      if (this.vendorDeviceChart) {
        if (typeof this.vendorDeviceChart.dispose === "function") {
          this.vendorDeviceChart.dispose();
        }
        this.vendorDeviceChart = null;
      }

      // Clean up Last 7 Day Activation Chart (AmCharts 5)
      if (this.last7Root) {
        this.last7Root.dispose();
        this.last7Root = null;
      }
    } catch (e) {
      {
      }
    }
  }

  showChart: boolean = true;

  getSearchDetails() {
    this.currentPage = 1;
    this.navigateToVehicle("");
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
  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;

    this.loadVehicleData(); // ✅ vehicleType lost नहीं होगा
  }

  onPageChange(page: number) {
    if (page < 1) return;
    const totalPages = this.getTotalPages();
    if (this.totalCount > 0 && page > totalPages) return;
    this.currentPage = page;
    this.loadVehicleData();
  }

  reloadData() {
    this.searchText = "";
    this.currentPage = 1;
    this.navigateToVehicle("");
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

  onDownloadChange() {
    if (this.selectedDownloadType === "Excel") {
      this.exportToExcel();
    }

    // reset dropdown
    setTimeout(() => {
      this.selectedDownloadType = "";
    }, 300);
  }
  downloadRTOExcel() {
    const fromDate = this.fromDate || "01-Jan-2021";
    const toDate = this.toDate || this.formatDate(new Date());
    const rtoFilter = this.selectedRTOFilter ?? "";

    this.loading = true;

    this.dashboardService
      .getRTOWiseDeviceCount(
        "details",
        fromDate,
        toDate,
        rtoFilter,
        this.rtoViewType,
        "excel", // ✅ IMPORTANT
      )
      .subscribe({
        next: (response) => {
          this.loading = false;

          // ✅ NORMAL DASHBOARD DATA
          if (response.status && response.entity?.countlistData) {
            this.rtowisedevicedetails = response.entity.countlistData || [];
          }

          // ✅ EXCEL DOWNLOAD
          if (response.status && typeof response.entity === "string") {
            const link = document.createElement("a");
            link.href = response.entity;
            link.setAttribute("download", "");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        },

        error: (error) => {
          this.loading = false;
          console.error(error);
        },
      });
  }
  exportToExcel() {
    this.isExporting = true;

    const request: AssetsDetailsRequest = {
      param1: this.globtype,
      param2: 0,
      param3: 0,
      param4: "",
      param5: "",
      param6: "",
      param7: "",
    };

    this.deviceService.getAssetsDetails(request).subscribe({
      next: (response) => {
        if (response?.status && typeof response.entity === "string") {
          const link = document.createElement("a");
          link.href = response.entity;
          link.setAttribute("download", "");
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          this.errorMessage = "Failed to generate Excel";
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error("API Error:", error);
      },
    });
  }

  currentdayActivationchart() {
    if (!this.mfgdata1 || this.mfgdata1.length === 0) return;

    // ✅ Dispose old chart
    if (this.currentdayActivationChart) {
      this.currentdayActivationChart.dispose();
    }

    let root = am5.Root.new("currentdayactivationchart");
    this.currentdayActivationChart = root;

    // ✅ Remove amCharts logo
    root._logo?.dispose();

    root.setThemes([am5themes_Animated.new(root)]);

    // ✅ Chart
    let chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: true,
        panY: false,
        wheelX: "panX",
        wheelY: "zoomX",
        pinchZoomX: true,
        layout: root.verticalLayout,
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: 40,
      }),
    );

    // ✅ Cursor
    let cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
    cursor.lineY.set("visible", false);

    // ✅ X Axis
    let xRenderer = am5xy.AxisRendererX.new(root, {
      minGridDistance: 40,
    });

    xRenderer.labels.template.setAll({
      rotation: -45,
      centerY: am5.p50,
      centerX: am5.p100,
      paddingTop: 10,
      fontSize: 10,
      fill: am5.color(0x555555),
      oversizedBehavior: "wrap",
      maxWidth: 120,
      populateText: true,
    });

    // ✅ Trim label after 15 chars
    xRenderer.labels.template.adapters.add("text", (text, target) => {
      let dataItem = target.dataItem;

      if (dataItem) {
        let category = (dataItem.dataContext as any)?.vendor;

        if (category && category.length > 15) {
          return category.substring(0, 15) + "...";
        }

        return category;
      }

      return text;
    });

    let xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: "vendor",
        renderer: xRenderer,
      }),
    );

    // ✅ Y Axis
    let yRenderer = am5xy.AxisRendererY.new(root, {
      strokeOpacity: 0.15,
    });

    yRenderer.labels.template.setAll({
      fontSize: 11,
      fill: am5.color(0x555555),
    });

    let yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        min: 0,
        renderer: yRenderer,
      }),
    );

    // ✅ Convert API Data
    const chartData = this.mfgdata1.map((item: any) => ({
      vendor: item.param3 || "Unknown",
      count: Number(item.param4) || 0,
    }));

    xAxis.data.setAll(chartData);

    // ✅ Series
    let series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: "Activated Vehicles",
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "count",
        categoryXField: "vendor",
        clustered: true,
      }),
    );

    // ✅ SMALL BAR WIDTH
    series.columns.template.setAll({
      width: am5.percent(50), // 🔥 small slim bars
      cornerRadiusTL: 6,
      cornerRadiusTR: 6,
      strokeOpacity: 0,
      tooltipText: "{categoryX}: {valueY}",
    });

    // ✅ Multi Colors
    const colors = [
      am5.color(0x3b82f6),
      am5.color(0x10b981),
      am5.color(0xf59e0b),
      am5.color(0xef4444),
      am5.color(0x8b5cf6),
      am5.color(0x06b6d4),
    ];

    series.columns.template.adapters.add("fill", function (fill, target) {
      return colors[series.columns.indexOf(target) % colors.length];
    });

    series.columns.template.adapters.add("stroke", function (stroke, target) {
      return colors[series.columns.indexOf(target) % colors.length];
    });

    series.bullets.push(() => {
      return am5.Bullet.new(root, {
        locationY: 0.5,
        sprite: am5.Label.new(root, {
          text: "{valueY}",
          populateText: true,
          centerX: am5.p50,
          centerY: am5.p50,

          // ✅ BOLD COUNT
          fontSize: 14,
          fontWeight: "900",

          fill: am5.color(0xffffff),

          // ✅ Extra visibility
          shadowColor: am5.color(0x000000),
          shadowBlur: 2,
          shadowOffsetX: 1,
          shadowOffsetY: 1,
        }),
      });
    });

    series.data.setAll(chartData);

    // ✅ Animation
    series.appear(1000);
    chart.appear(1000, 100);
  }
  exportToExcelFile(type: string) {
    if (type == "vendorgrid" || type == "vendordevicechart") {
      let companywiseDeviceDetailsReq = new CompanywiseDeviceDetailsReq();

      companywiseDeviceDetailsReq.pdfexcel = "vendorstatusexcel";

      // ✅ Send New / Old
      companywiseDeviceDetailsReq.param6 = this.viewType;

      // Optional Vendor Filter
      companywiseDeviceDetailsReq.param5 = this.selectedVendorFilter || "";

      this.dashboardService
        .getCompanyWiseDeviceDetails(companywiseDeviceDetailsReq)
        .subscribe({
          next: (response: any) => {
            if (response.statuscode == 200) {
              this.toastService.commonFileDownload(response.entity);
            }
          },
        });
    } else if(type == "pollingcounts" ) {
      let companywiseDeviceDetailsReq = new CompanywiseDeviceDetailsReq();

      companywiseDeviceDetailsReq.pdfexcel = "pollingcounts";

      // ✅ Send New / Old
      companywiseDeviceDetailsReq.param6 = "old";

      // Optional Vendor Filter
      companywiseDeviceDetailsReq.param5 =  "";

      this.dashboardService
        .getCompanyWiseDeviceDetails(companywiseDeviceDetailsReq)
        .subscribe({
          next: (response: any) => {
            if (response.statuscode == 200) {
              this.toastService.commonFileDownload(response.entity);
            }
          },
        });
    } else if
     (type == "currentDayActivation") {
      let request: CompanywiseDeviceTodayActivationDetailsReq =
        new CompanywiseDeviceTodayActivationDetailsReq();
      request.pdfexcel = "excel"; // ✅ set export type in request object

      this.dashboardService
        .getCompanyWiseDTodayActivationDetails(request)
        .subscribe({
          next: (response: any) => {
            if (response.statuscode == 200) {
              this.toastService.commonFileDownload(response.entity);
            }
          },
        });
    } else if (type == "currentDayInstallation") {
      let request: CompanywiseDeviceTodayInstalledDetailsReq =
        new CompanywiseDeviceTodayInstalledDetailsReq();
      request.pdfexcel = "excel"; // ✅ set export type in request object
      this.dashboardService
        .getCompanyWiseDTodayInstalledDetails(request)
        .subscribe({
          next: (response: any) => {
            if (response.statuscode == 200) {
              this.toastService.commonFileDownload(response.entity);
            }
          },
        });
    } else if (type == "last7DayActivation") {
      let request: WeeklyActivationChartReq = new WeeklyActivationChartReq();
      request.pdfexcel = "excel"; // ✅ set export type in request object
      this.dashboardService.getWeeklyActivation(request).subscribe({
        next: (response: any) => {
          if (response.statuscode == 200) {
            this.toastService.commonFileDownload(response.entity);
          }
        },
      });
    } else if (type == "rto") {
      this.downloadRTOExcel();
    }
    // else if() {

    // }
  }
}
