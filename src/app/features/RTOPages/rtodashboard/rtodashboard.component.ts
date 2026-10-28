import { Component, Inject, NgZone, PLATFORM_ID, OnDestroy, ViewChild, ElementRef, ViewChildren, QueryList, AfterViewInit, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import { BaseApiService } from '../../../core/services/base-api.service';

@Component({
    selector: 'app-rtodashboard',
    imports: [CommonModule, FormsModule],
    templateUrl: './rtodashboard.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './rtodashboard.component.scss'
})
export class RTODashboardComponent implements OnDestroy, AfterViewInit, OnInit {
  totalRecords: number = 0;

  // Widget Data
  manufacturerCount: number = 0;
  dealersCount: number = 0;
  devicesCount: number = 0;
  newAssetsCount: number = 0;
  oldAssetsCount: number = 0;
  approvedAssetsCount: number = 0;
  pendingAssetsCount: number = 0;
  loadingWidgets: boolean = false;

  // Graph loading and data states
  loadingTodayGraph: boolean = false;
  loadingVendorGraph: boolean = false;
  loadingClasswiseGraph: boolean = false;
  todayGraphData: any[] = [];
  vendorGraphData: any[] = [];
  classwiseGraphData: any[] = [];

  // Tab State
  activeTab: string = 'today';
  showclasswiseDetails: boolean = false;
  showTodayDetails: boolean = false;
  showVendorDetails: boolean = false;
  todayInstallationData: any[] = [];
  vendorInstallationData: any[] = [];
  installationSummaryData: any[] = [];

  @ViewChildren('tabItem') tabElements!: QueryList<ElementRef>;
  sliderLeft: number = 0;
  sliderWidth: number = 0;

  private root!: am5.Root;
  private vendorRoot!: am5.Root;
  private classwiseRoot!: am5.Root;

  // Details loading states
  loadingTodayDetails: boolean = false;
  loadingVendorDetails: boolean = false;
  loadingInstallationSummary: boolean = false;

  private baseApiService = inject(BaseApiService);
  searchText: string = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [20, 50, 100, 200, 500];
  totalCount = 0;
  pageCount = 0;

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private zone: NgZone) {
    //console.log('RTODashboardComponent: Constructor initialized');
  }

  

  // ViewChild setter to detect when the graph container is added to the DOM (due to *ngIf)
  @ViewChild('todayGraph') set graphContainer(content: ElementRef) {
    if (content) {
      this.createGraph();
    } 
    else {
      this.disposeGraph();
    }
  }

  // ViewChild setter to detect when the graph container is added to the DOM (due to *ngIf)
  @ViewChild('classwiseInstallationGraph') set classwisegraphContainer(content: ElementRef) {
    if (content) {
  this.ClassWisecreateGraph();
    } else {
      this.disposeClasswiseGraph();
    }
  }

  // ViewChild for Vendor Graph
  @ViewChild('vendorGraph') set vendorGraphContainer(content: ElementRef) {
    if (content) {
      this.createVendorGraph();
    } else {
      this.disposeVendorGraph();
    }
  }


  

  ngOnInit() {
    //console.log('RTODashboardComponent: ngOnInit called');
    this.DashboardCounts();
  }

  ngAfterViewInit() {
    // Initial tab selection (Select first tab by default)
    setTimeout(() => {
      this.selectTab('today', 0);
    })
  }

  DashboardCounts() {
    //console.log('DashboardCounts initiated');
    this.loadingWidgets = true;
    this.baseApiService.apiCall('psv_dashboardcount', 'POST', {}).subscribe({
      next: (response: any) => {
        //console.log('DashboardCounts response:', response);
        if (response.status && response.entity && response.entity.dashboardcount && response.entity.dashboardcount.length > 0) {
          const data = response.entity.dashboardcount[0];
          this.manufacturerCount = Number(data.total_vendor) || 0;
          this.dealersCount = Number(data.total_dealer) || 0;
          this.devicesCount = Number(data.total_device) || 0;
          this.newAssetsCount = Number(data.total_installed_new) || 0;
          this.oldAssetsCount = Number(data.total_installed_old) || 0;
          this.approvedAssetsCount = Number(data.total_approve) || 0;
          this.pendingAssetsCount = Number(data.total_pending) || 0;
        }
        this.loadingWidgets = false;
      },
      error: (error) => {
        console.error('Error fetching dashboard counts:', error);
        this.loadingWidgets = false;
      }
    });
  }

  selectTab(tab: string, index: number) {
    this.activeTab = tab;
    if (this.tabElements) {
      const currentTab = this.tabElements.toArray()[index];
      if (currentTab) {
        this.sliderLeft = currentTab.nativeElement.offsetLeft;
        this.sliderWidth = currentTab.nativeElement.offsetWidth;
      }
    }
    if (tab === 'today' && !this.showTodayDetails) {
      setTimeout(() => this.createGraph(), 100);
    } else if (tab === 'vendor' && !this.showVendorDetails) {
      setTimeout(() => this.createVendorGraph(), 100);
    } else if (tab === 'summary') {
      this.loadingInstallationSummary = true;
      this.InstallationSummary();
    } else if (tab === 'classwise' && !this.showclasswiseDetails) {
      setTimeout(() => this.ClassWisecreateGraph(), 100);
    }
  }

  createGraph() {
    this.disposeGraph(); // Ensure any existing instance is cleaned up
    this.loadingTodayGraph = true;

    if (isPlatformBrowser(this.platformId)) {
      this.zone.runOutsideAngular(() => {
        let root = am5.Root.new("todayInstallationGraph");
        root._logo?.dispose();

        root.setThemes([
          am5themes_Animated.new(root)
        ]);

        let chart = root.container.children.push(am5xy.XYChart.new(root, {
          panX: true,
          panY: true,
          wheelX: "panX",
          wheelY: "zoomX",
          pinchZoomX: true,
          paddingLeft: 0,
          paddingRight: 1
        }));

        // Set custom colors to match dashboard theme
        chart.get("colors")?.set("colors", [
          am5.color(0x5e72e4), // Primary Blue
          am5.color(0x2dce89), // Success Green
          am5.color(0x11cdef), // Info Cyan
          am5.color(0xf5365c), // Danger Red
          am5.color(0xfb6340), // Orange
          am5.color(0xffd600), // Yellow
          am5.color(0x8965e0), // Purple
          am5.color(0x2bffc6), // Teal
          am5.color(0xff928b), // Salmon
          am5.color(0x32325d)  // Dark Blue
        ]);

        let cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
        cursor.lineY.set("visible", false);

        let xRenderer = am5xy.AxisRendererX.new(root, { 
          minGridDistance: 30, 
          minorGridEnabled: true
        });

        xRenderer.labels.template.setAll({
          rotation: -90,
          centerY: am5.p50,
          centerX: am5.p100,
          paddingRight: 15
        });

        xRenderer.grid.template.setAll({
          location: 1
        });

        let xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
          maxDeviation: 0.3,
          categoryField: "vendor",
          renderer: xRenderer,
          tooltip: am5.Tooltip.new(root, {})
        }));

        let yRenderer = am5xy.AxisRendererY.new(root, {
          strokeOpacity: 0.1
        });

        let yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
          maxDeviation: 0.3,
          renderer: yRenderer
        }));

        let series = chart.series.push(am5xy.ColumnSeries.new(root, {
          name: "Series 1",
          xAxis: xAxis,
          yAxis: yAxis,
          valueYField: "value",
          sequencedInterpolation: true,
          categoryXField: "vendor",
          tooltip: am5.Tooltip.new(root, {
            labelText: "{valueY}"
          })
        }));

        series.columns.template.setAll({ cornerRadiusTL: 5, cornerRadiusTR: 5, strokeOpacity: 0 });
        
        series.columns.template.adapters.add("fill", (fill: any, target: any) => {
          return chart.get("colors")?.getIndex(series.columns.indexOf(target));
        });

        series.columns.template.adapters.add("stroke", (stroke: any, target: any) => {
          return chart.get("colors")?.getIndex(series.columns.indexOf(target));
        });

        // Fetch data from the API
        this.baseApiService.apiCall('psv_vendorwiseinstallation', 'POST', { param5: 'todayinstalled' }).subscribe({
          next: (response: any) => {
            //console.log('Today Installation API Response:', response);
            let data: any[] = [];

            if (response.status && response.entity && response.entity.vendorwiseinstallation) {
              data = response.entity.vendorwiseinstallation.map((item: any) => ({
                vendor: item.vendorname,
                value: Number(item.total_installed) || 0 // Ensure value is a number
              }));
            }
            this.todayGraphData = data;
            this.loadingTodayGraph = false;

            if (data.length === 0) { this.disposeGraph(); return; }
            xAxis.data.setAll(data);
            series.data.setAll(data);

            series.appear(1000);
            chart.appear(1000, 100);
          },
          error: (error) => {
            console.error('Error fetching today installation data:', error);
            this.todayGraphData = [];
            this.loadingTodayGraph = false;
          }
        });

        this.root = root;
      });
    }
  }

  createVendorGraph() {
    this.disposeVendorGraph();
    this.loadingVendorGraph = true;

    if (isPlatformBrowser(this.platformId)) {
      this.zone.runOutsideAngular(() => {
        let root = am5.Root.new("vendorInstallationGraph");
        root._logo?.dispose();

        root.setThemes([
          am5themes_Animated.new(root)
        ]);

        let chart = root.container.children.push(am5xy.XYChart.new(root, {
          panX: true,
          panY: true,
          wheelX: "panX",
          wheelY: "zoomX",
          pinchZoomX: true,
          paddingLeft: 0,
          paddingRight: 1
        }));

        // Different Colors for Vendor Graph
        chart.get("colors")?.set("colors", [
          am5.color(0x6c5ce7), // Purple
          am5.color(0x00cec9), // Teal
          am5.color(0xff7675), // Pink
          am5.color(0xfdcb6e), // Yellow
          am5.color(0xe17055), // Orange
          am5.color(0x0984e3), // Blue
          am5.color(0x00b894), // Green
          am5.color(0x636e72)  // Grey
        ]);

        let cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
        cursor.lineY.set("visible", false);

        let xRenderer = am5xy.AxisRendererX.new(root, { 
          minGridDistance: 30, 
          minorGridEnabled: true
        });

        xRenderer.labels.template.setAll({
          rotation: -90,
          centerY: am5.p50,
          centerX: am5.p100,
          paddingRight: 15
        });

        let xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
          maxDeviation: 0.3,
          categoryField: "vendor",
          renderer: xRenderer,
          tooltip: am5.Tooltip.new(root, {})
        }));

        let yRenderer = am5xy.AxisRendererY.new(root, {
          strokeOpacity: 0.1
        });

        let yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
          maxDeviation: 0.3,
          renderer: yRenderer
        }));

        let series = chart.series.push(am5xy.ColumnSeries.new(root, {
          name: "Series 1",
          xAxis: xAxis,
          yAxis: yAxis,
          valueYField: "value",
          sequencedInterpolation: true,
          categoryXField: "vendor",
          tooltip: am5.Tooltip.new(root, {
            labelText: "{valueY}"
          })
        }));

        // Decreased Width (40%) and Rounded Corners
        series.columns.template.setAll({ 
          cornerRadiusTL: 5, 
          cornerRadiusTR: 5, 
          strokeOpacity: 0,
          width: am5.percent(40) 
        });
        
        series.columns.template.adapters.add("fill", (fill: any, target: any) => {
          return chart.get("colors")?.getIndex(series.columns.indexOf(target));
        });

        series.columns.template.adapters.add("stroke", (stroke: any, target: any) => {
          return chart.get("colors")?.getIndex(series.columns.indexOf(target));
        });

        // Fetch data from the API
        this.baseApiService.apiCall('psv_vendorwiseinstallation', 'POST', { param5: 'todayinstalled' }).subscribe({
          next: (response: any) => {
            //console.log('Vendor Wise Installation API Response:', response);
            let data: any[] = [];

            if (response.status && response.entity && response.entity.vendorwiseinstallation) {
              data = response.entity.vendorwiseinstallation.map((item: any) => ({
                vendor: item.vendorname,
                value: Number(item.total_installed) || 0 // Ensure value is a number
              }));
            }
            this.vendorGraphData = data;
            this.loadingVendorGraph = false;

            if (data.length === 0) { this.disposeVendorGraph(); return; }
            xAxis.data.setAll(data);
            series.data.setAll(data);

            series.appear(1000);
            chart.appear(1000, 100);
          },
          error: (error) => {
            console.error('Error fetching vendor wise installation data:', error);
            this.vendorGraphData = [];
            this.loadingVendorGraph = false;
          }
        });

        this.vendorRoot = root;
      });
    }
  }

   ClassWisecreateGraph() {
    this.disposeClasswiseGraph();
    this.loadingClasswiseGraph = true;

    if (isPlatformBrowser(this.platformId)) {
      this.zone.runOutsideAngular(() => {
        let root = am5.Root.new("classwiseInstallationGraph");
        root._logo?.dispose();

        root.setThemes([
          am5themes_Animated.new(root)
        ]);

        let chart = root.container.children.push(am5xy.XYChart.new(root, {
          panX: true,
          panY: true,
          wheelX: "panX",
          wheelY: "zoomX",
          pinchZoomX: true,
          paddingLeft: 0,
          paddingRight: 1
        }));

        // Set custom colors to match dashboard theme
        chart.get("colors")?.set("colors", [
          am5.color(0x5e72e4), // Primary Blue
          am5.color(0x2dce89), // Success Green
          am5.color(0x11cdef), // Info Cyan
          am5.color(0xf5365c), // Danger Red
          am5.color(0xfb6340), // Orange
          am5.color(0xffd600), // Yellow
          am5.color(0x8965e0), // Purple
          am5.color(0x2bffc6), // Teal
          am5.color(0xff928b), // Salmon
          am5.color(0x32325d)  // Dark Blue
        ]);

        let cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
        cursor.lineY.set("visible", false);

        let xRenderer = am5xy.AxisRendererX.new(root, { 
          minGridDistance: 30, 
          minorGridEnabled: true
        });

        xRenderer.labels.template.setAll({
          rotation: -90,
          centerY: am5.p50,
          centerX: am5.p100,
          paddingRight: 15
        });

        xRenderer.grid.template.setAll({
          location: 1
        });

        let xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
          maxDeviation: 0.3,
          categoryField: "vendor",
          renderer: xRenderer,
          tooltip: am5.Tooltip.new(root, {})
        }));

        let yRenderer = am5xy.AxisRendererY.new(root, {
          strokeOpacity: 0.1
        });

        let yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
          maxDeviation: 0.3,
          renderer: yRenderer
        }));

        let series = chart.series.push(am5xy.ColumnSeries.new(root, {
          name: "Series 1",
          xAxis: xAxis,
          yAxis: yAxis,
          valueYField: "value",
          sequencedInterpolation: true,
          categoryXField: "vendor",
          tooltip: am5.Tooltip.new(root, {
            labelText: "{valueY}"
          })
        }));

        series.columns.template.setAll({ cornerRadiusTL: 5, cornerRadiusTR: 5, strokeOpacity: 0 });
        
        series.columns.template.adapters.add("fill", (fill: any, target: any) => {
          return chart.get("colors")?.getIndex(series.columns.indexOf(target));
        });

        series.columns.template.adapters.add("stroke", (stroke: any, target: any) => {
          return chart.get("colors")?.getIndex(series.columns.indexOf(target));
        });

        // Fetch data from the API
        this.baseApiService.apiCall('psv_classwisecount', 'POST', { }).subscribe({
          next: (response: any) => {
            //console.log('Class Wise Installation API Response:', response);
            let data: any[] = [];

            if (response.status && response.entity && response.entity.classwisecount) {
              data = response.entity.classwisecount.map((item: any) => ({
                vendor: item.classname,
                value: Number(item.total_count) || 0 // Ensure value is a number
              }));
            }
            this.classwiseGraphData = data;
            this.loadingClasswiseGraph = false;

            if (data.length === 0) { this.disposeClasswiseGraph(); return; }
            xAxis.data.setAll(data);
            series.data.setAll(data);

            series.appear(1000);
            chart.appear(1000, 100);
          },
          error: (error) => {
            console.error('Error fetching class wise installation data:', error);
            this.classwiseGraphData = [];
            this.loadingClasswiseGraph = false;
          }
        });

        this.classwiseRoot = root;
      });
    }
  }

  toggletodayDetails(){
    this.showTodayDetails = !this.showTodayDetails;
    if (this.showTodayDetails) {
      this.todaysdetails();
    }
    
  }



  toggleclasswiseDetails(){
    this.showclasswiseDetails = !this.showclasswiseDetails;
    if (this.showclasswiseDetails) {
     // this.todaysdetails();
    }
    
  }

  toggleVendorDetails() {
    this.showVendorDetails = !this.showVendorDetails;
    if (this.showVendorDetails) {
      this.vendorwisedetails();
    }
  }

  todaysdetails() {
    this.loadingTodayDetails = true;
    this.todayInstallationData = []; // Clear previous data

    const request = {
      param1: "", // searchby
      param2: "1", // pageno
      param3: "10", // itemperpage
      param5: "todayinstalled", // filter type
      param6: ""
    };

    this.baseApiService.apiCall('psv_vendorwiseinstallationdetails', 'POST', request).subscribe({
      next: (response: any) => {
        if (response.status && response.entity && response.entity.listData) {
          this.todayInstallationData = response.entity.listData.map((item: any) => ({
            vendorName: item.param3,
            installed: item.param4,
            approved: item.param5,
            pending: item.param6
          }));
          this.totalRecords = Number(response.entity.param1) || 0;
          this.totalCount = Number(response.entity.param1) || 0;
          this.pageCount = this.todayInstallationData.length < this.pageSize ? this.todayInstallationData.length : this.pageSize;
        }
        this.loadingTodayDetails = false;
      },
      error: (error) => {
        console.error('Error fetching vendor wise details:', error);
        this.todayInstallationData = [];
        this.totalRecords = 0;
        this.loadingTodayDetails = false;
      }
    });
  }

  vendorwisedetails() {
    this.loadingVendorDetails = true;
    this.vendorInstallationData = []; // Clear previous data

    const request = {
      param1: "", // searchby
      param2: "1", // pageno
      param3: "10", // itemperpage
      param5: "todayinstalled/all", // filter type
      param6: ""
    };

    this.baseApiService.apiCall('psv_vendorwiseinstallationdetails', 'POST', request).subscribe({
      next: (response: any) => {
        if (response.status && response.entity && response.entity.listData) {
          this.vendorInstallationData = response.entity.listData.map((item: any) => ({
            vendorName: item.param3,
            installed: item.param4,
            approved: item.param5,
            pending: item.param6
          }));
          this.totalRecords = Number(response.entity.param1) || 0;
          this.totalCount = Number(response.entity.param1) || 0;
          this.pageCount = this.vendorInstallationData.length < this.pageSize ? this.vendorInstallationData.length : this.pageSize;
        }
        this.loadingVendorDetails = false;
      },
      error: (error) => {
        console.error('Error fetching vendor wise details:', error);
        this.vendorInstallationData = [];
        this.totalRecords = 0;
        this.loadingVendorDetails = false;
      }
    });
  }

  InstallationSummary() {
    this.loadingInstallationSummary = true;
    this.installationSummaryData = [];

    const request = {
      param5: "",
      param6: ""
    };

    this.baseApiService.apiCall('psv_installationsummary', 'POST', request).subscribe({
      next: (response: any) => {
        if (response.status && response.entity && response.entity.installationsummary) {
          this.installationSummaryData = response.entity.installationsummary.map((item: any) => ({
            vendorName: item.vendorname,
            installed: item.total_installed,
            approvedReceived: item.total_approve_received,
            approvedNotReceived: item.total_approve_not_received,
            pending: item.total_pending
          }));
        }
        this.loadingInstallationSummary = false;
      },
      error: (error) => {
        console.error('Error fetching installation summary:', error);
        this.loadingInstallationSummary = false;
      }
    });
  }

  searchRawData(pageNo: number = 1) {
    this.loadingVendorDetails = true;
    this.vendorInstallationData = []; // Clear previous data

    const request = {
      param1: "", // searchby
      param2: "1", // pageno
      param3: "10", // itemperpage
      param5: "todayinstalled/all", // filter type
      param6: ""
    };

    this.baseApiService.apiCall('psv_vendorwiseinstallationdetails', 'POST', request).subscribe({
      next: (response: any) => {
        if (response.status && response.entity && response.entity.listData) {
          this.vendorInstallationData = response.entity.listData.map((item: any) => ({
            srno: item.param1,
            vendorName: item.param3,
            installed: item.param4,
            approved: item.param5,
            pending: item.param6
          }));
          this.totalRecords = Number(response.entity.param1) || 0;
          this.totalCount = Number(response.entity.param1) || 0;
          this.pageCount = this.vendorInstallationData.length < this.pageSize ? this.vendorInstallationData.length : this.pageSize;
        }
        this.loadingVendorDetails = false;
      },
      error: (error) => {
        console.error('Error fetching vendor wise details:', error);
        this.vendorInstallationData = [];
        this.totalRecords = 0;
        this.loadingVendorDetails = false;
      }
    });
  }

  onPageChange(page: number) {
    this.searchRawData(page);
  }

  onPageSizeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newSize = target.value;
    this.pageSize = newSize === 'All' ? this.totalCount : parseInt(newSize);
    this.currentPage = 1;
    this.searchRawData(1);
  }

  getTotalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pages: number[] = [];
    const maxPages = Math.min(totalPages, 8);
    for (let i = 1; i <= maxPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  getPaginatedData(): any[] {
    return this.vendorInstallationData;
  }

  getSearchDetails() {
    this.currentPage = 1;
    this.searchRawData(1);
  }

  disposeGraph() {
    if (this.root) {
      this.zone.runOutsideAngular(() => {
        this.root.dispose();
      });
    }
  }

  disposeVendorGraph() {
    if (this.vendorRoot) {
      this.zone.runOutsideAngular(() => {
        this.vendorRoot.dispose();
      });
    }
  }

  disposeClasswiseGraph() {
    if (this.classwiseRoot) {
      this.zone.runOutsideAngular(() => {
        this.classwiseRoot.dispose();
      });
    }
  }

  ngOnDestroy() {
    this.disposeGraph();
    this.disposeVendorGraph();
    this.disposeClasswiseGraph();
  }
}
