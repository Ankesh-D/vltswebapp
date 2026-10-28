import { Component, OnInit, ChangeDetectionStrategy } from "@angular/core";
import moment from "moment";
import { AlertService } from "../../../core/services/alert.service";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { NgSelectModule } from "@ng-select/ng-select";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
// import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import am5index from "@amcharts/amcharts5/index";
// import am5percent from "@amcharts/amcharts5/percent";
import * as am5percent from "@amcharts/amcharts5/percent";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import { getElement } from "@amcharts/amcharts4/core";
import { AlertGraphViewReq } from "../../../core/model/request.model";
import { AlertGraphViewResp } from "../../../core/model/response.model";
declare var $: any;

@Component({
    selector: "app-alert-graph-view",
    imports: [CommonModule, FormsModule, NgSelectModule],
    templateUrl: "./alert-graph-view.component.html",
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: "./alert-graph-view.component.scss"
})
export class AlertGraphViewComponent implements OnInit {
  dateObj: any;
  alertTypeList: any = [];
  vehicleTypeList: any = [];
  selectedAlertType: any = null;
  selectedVehicleType: any = null;
  isAlertTypeLoading: boolean = false;
  vehicleType: string = "NEW";
  eventData: any[] = [];
  AlertName: string = "";
    // { category: "Internal Battery Low", value: 40, id: "4" },
    // { category: "Internal Battery Low Removed", value: 55, id: "5" },
    // { category: "Main Battery Disconnect", value: 60, id: "3" },
    // { category: "Over Speed", value: 85, id: "17" },
    // { category: "Panic", value: 105, id: "10" },
    // { category: "Rash Turning", value: 40, id: "15" },
    // { category: "Tampered", value: 42, id: "9" },
  // ];
  eventChartFlag: boolean = true;

  constructor(private alertService: AlertService) {

  }
  async ngOnInit() {
    console.log("AlertGraphViewComponent ngOnInit called");
    this.getDate();
    this.loadAlertList();
    setTimeout(() => {
      this.getEventChartData();
    }, 500)
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
            this.getEventChartData();
          } catch (error) {}
        },
      );
      this.dateObj = (
        document.getElementById("datepicker") as HTMLInputElement
      ).value;
      
    });
  }

  loadAlertList() {
    this.isAlertTypeLoading = true;
    this.alertService.getAlertTypeList().subscribe({
      next: (response: any) => {
        this.isAlertTypeLoading = false;
        if (response.statuscode == 200) {
          this.alertTypeList = response.entity;
          this.alertTypeList.unshift({ param1: "all", param2: "All Alerts" });
          setTimeout(()=> {
            this.selectedAlertType = this.alertTypeList[0];
            console.log("this.selectedAlertType", this.selectedAlertType);
          }, 500)
        }
      },
      error: (err: any) => {
        this.isAlertTypeLoading = false;
        this.alertTypeList = [];
      },
    });
  }
  resetFilters() {
    this.selectedAlertType = this.alertTypeList[0];
    this.selectedVehicleType = null;
    this.eventChartFlag = true;
    setTimeout(() => {
      this.getDate();
    }, 100);
    setTimeout(() => {
      this.getEventChartData();
    }, 300);
  }
  setView(view: string) {
    this.vehicleType = view;
    this.getEventChartData();
  }
  onAlertTypeChange(event: any) {
    this.selectedAlertType = event;
    if(this.selectedAlertType?.param1 == "all") {
      this.getEventChartData();
    } else {
      this.eventChartFlag = false;
      this.getDateWiseChartData(this.selectedAlertType?.param1, '');
    }
    // this.getEventChartData();
  }
  onVehicleTypeChange(event: any) {
    this.selectedVehicleType = event;
    this.getEventChartData();
  }

  getEventChartData() {
    let daterange = this.dateObj.split(" - ")
    const req: AlertGraphViewReq = new AlertGraphViewReq();
    req.param10 = daterange[1];
    req.param4 = daterange[0];
    req.param5 = this.selectedAlertType?.param1 || "all";
    // req.param2 = this.vehicleType;
    // req.param3 = this.dateObj;
    this.alertService.getAlertChartOverviewData(req).subscribe({
      next: (response: any) => {
        if(response.statuscode == 200) {
          this.eventData = response.entity.listData;
          // need to modify data to match chart format
          this.eventData = this.eventData.map((item) => ({
              category: item.param3,
              value: item.param4,
              id: item.param2
            }));
          this.eventChartFlag = true;
          if(this.selectedAlertType?.param1 == "all") {
            this.createEventChart();
          } else {
            this.dateWiseChartData = response.entity.listData;
            // need to modify data with date and count for date chart
            this.dateWiseChartData = this.dateWiseChartData.map((item) => ({
              date: item.param2,
              count: item.param4,
            }));
            this.getDateWiseChartData(this.selectedAlertType?.param1, '');
          }
        } else {
          this.eventData = [];
        }
      },
      error: (err: any) => {},
    });
  }
  getDateWiseChartData(eventId: string, opfrom: string) {
   let daterange = this.dateObj.split(" - ")
    const req: AlertGraphViewReq = new AlertGraphViewReq();
    req.param10 = daterange[1];
    req.param4 = daterange[0];
    req.param5 = eventId;
    // req.param2 = this.vehicleType;
    
    this.alertService.getAlertChartOverviewData(req).subscribe({
      next: (response: any) => {
        if(response.statuscode == 200) {
          let res: any[] = response.entity.listData;
          if(res.length > 1) {
            res = res.sort((a, b) => new Date(a.param2).getTime() - new Date(b.param2).getTime());
          }
          this.dateWiseChartData = res;
          // need to modify data with date and count for date chart
         const data = this.dateWiseChartData
            .map((item) => ({
              date: moment(item.param2).format("DD-MMM"),
              count: Number(item.param4),
            }));
          this.eventChartFlag = false;
          opfrom=='graph' ? this.createDateChart(data, this.dateWiseChartData[0]?.param3) : this.createDateChart(data, this.selectedAlertType?.param2);
        } else {
          this.dateWiseChartData = [];
          this.eventChartFlag = false;
        }
      },
      error: (err: any) => {},
    });
  }
  createEventChart() {
    // Dispose previous chart
    try {
      am5.array.each(am5.registry.rootElements, (root: any) => {
        if (root.dom?.id === "eventChart") root.dispose();
      });
    } catch (e) {}

    const root = am5.Root.new("eventChart");
    if (root._logo) root._logo.dispose();

    root.setThemes([am5themes_Animated.new(root)]);

    const colorSet = am5.ColorSet.new(root, {
      colors: [
        am5.color("#FF5722"),
        am5.color("#FF9800"),
        am5.color("#FBC02D"),
        am5.color("#8BC34A"),
        am5.color("#4CAF50"),
        am5.color("#00BCD4"),
        am5.color("#2196F3"),
        am5.color("#673AB7"),
        am5.color("#E91E63")
      ],
      reuse: false
    });
    

    // ── Outer wrapper: title on top, row below ──────────────────────────────
    const wrapper = root.container.children.push(
      am5.Container.new(root, {
        width: am5.percent(100),
        height: am5.percent(100),
        layout: root.verticalLayout
      })
    );

    // Title
    wrapper.children.push(
      am5.Label.new(root, {
        text: "Alert Wise Event Count",
        fontSize: 18,
        fontWeight: "600",
        textAlign: "center",
        centerX: am5.p50,
        x: am5.p50,
        paddingBottom: 10,
        paddingTop: 6
      })
    );
    
    // ── Inner row: pie LEFT  |  legend RIGHT ───────────────────────────────
    const row = wrapper.children.push(
      am5.Container.new(root, {
        width: am5.percent(100),
        height: am5.percent(90),
        layout: root.horizontalLayout
      })
    );

    // Left – Pie chart
    const chart = row.children.push(
      am5percent.PieChart.new(root, {
        width: am5.percent(45),
        height: am5.percent(80),
        innerRadius: am5.percent(60)
      })
    );
    const total = this.eventData.reduce(
        (sum, item) => sum + Number(item.value),
        0
      );

      chart.seriesContainer.children.push(
        am5.Label.new(root, {
          x: am5.p0,
          y: am5.p0,
          centerX: am5.p50,
          centerY: am5.p50,
          textAlign: "center",
          populateText: true,
           fontWeight: "700",
          fill: am5.color(0x333333),
          text: `[fontSize:14, fontWeight:700]Total[/]\n[bold fontSize:28]${total}[/]`
        })
      );
    

    const series = chart.series.push(
      am5percent.PieSeries.new(root, {
        valueField: "value",
        categoryField: "category",
        legendLabelText: "{category}",
        legendValueText: "{value}"
      })
    );
    
    series.set("colors", colorSet);
    series.data.setAll(this.eventData);
   
    series.slices.template.setAll({
      strokeOpacity: 0,
     interactive: true,
      toggleKey: "none",
      cursorOverStyle: "pointer",
      tooltipText: "[bold]{category}[/]\nCount : {value}",
      // cursorOverStyle: "pointer"
    });

    series.labels.template.setAll({ visible: false });
    series.ticks.template.setAll({ visible: false });

    series.slices.template.states.create("hover", { scale: 1.05 });
   
    // Click → drill down to date-wise bar chart
    // series.slices.template.events.on("click", (ev) => {
    //   console.log("Clicked slice:", ev.target.dataItem?.dataContext);
    // })
    // series.slices.template.events.on("click", (ev) => {
    //   const data = ev.target.dataItem?.dataContext as any;
    //   if (data?.id && data?.category) {
    //     this.loadDateWiseChart(data.id, data.category);
    //   }
    // });

    // Right – Legend
    const legend = row.children.push(
      am5.Legend.new(root, {
        width: am5.percent(45),
        height: am5.percent(100),
        layout: root.verticalLayout,
        centerY: am5.p50,
        y: am5.p50,
        paddingTop: 50,
        verticalScrollbar: am5.Scrollbar.new(root, { orientation: "vertical" })
      })
    );

    legend.labels.template.setAll({
      fontSize: 13,
      fontWeight: "500",
      width: 240,
      oversizedBehavior: "wrap"
    });

    legend.valueLabels.template.setAll({
      textAlign: "right",
      fontWeight: "700",
      width: 50
    });
    


    legend.data.setAll(series.dataItems);
    series.events.on("datavalidated", () => {

  series.slices.each((slice) => {

    slice.events.on("click", () => {

      const data = slice.dataItem?.dataContext as any;
      if (data?.id && data?.category) {
        this.AlertName = data?.category;
        this.selectedAlertType = this.alertTypeList.find((item: any) => item.param1 === data.id);

        this.getDateWiseChartData(data.id, 'graph');
      }

    });

  });

});
    series.appear(1000, 100);
    chart.appear(1000, 100);
    
  }
  private createDateChart(data: any[], eventName: string) {
    am5.array.each(am5.registry.rootElements, (root: any) => {
      if (root?.dom?.id === "dateChart") {
        root.dispose();
      }
    });

    const root = am5.Root.new("dateChart");
    if (root._logo) root._logo.dispose();

    root.setThemes([am5themes_Animated.new(root)]);

    // Same color palette as event chart
    const colorPalette = [
      am5.color("#FF5722"),
      am5.color("#FF8A65"),
      am5.color("#FDD835"),
      am5.color("#CDDC39"),
      am5.color("#4CAF50"),
      am5.color("#29B6F6"),
      am5.color("#00C853"),
      am5.color("#7B1FA2"),
      am5.color("#1565C0"),
      am5.color("#BA68C8"),
      am5.color("#E91E63"),
      am5.color("#FF7043"),
      am5.color("#26C6DA"),
      am5.color("#66BB6A"),
    ];

    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: false,
        panY: false,
        wheelX: "none",
        wheelY: "none",
        paddingTop: 30,
        paddingBottom: 20,
        paddingLeft: 10,
        paddingRight: 20,
      }),
    );

    // Chart title
    // chart.children.unshift(
    //   am5.Label.new(root, {
    //     text: eventName,
    //     fontSize: 14,
    //     fontWeight: "600",
    //     x: am5.p50,
    //     centerX: am5.p50,
    //     paddingTop: 0,
    //     fill: am5.color("#333333"),
    //   }),
    // );

    // X Axis
    const xRenderer = am5xy.AxisRendererX.new(root, { minGridDistance: 25 });
    xRenderer.labels.template.setAll({
      fontSize: 12,
      fontWeight: "500",
      fill: am5.color("#333333"),
      paddingTop: 8,
    });
    xRenderer.grid.template.set("visible", false);

    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: "date",
        renderer: xRenderer,
      }),
    );
    xAxis.children.push(
        am5.Label.new(root, {
          text: "Date Range : " + this.dateObj,
          x: am5.p50,
          centerX: am5.p50,
          fontWeight: "600",
          paddingTop: 10,
          fontSize: 12,
        })
      );
    xAxis.data.setAll(data);

    // Y Axis
    const yRenderer = am5xy.AxisRendererY.new(root, {});
    yRenderer.grid.template.setAll({ strokeOpacity: 0.08 });
    yRenderer.labels.template.setAll({ fontSize: 12 });

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, { min: 0, renderer: yRenderer, extraMax: 0.15 }),
    );
    
    yAxis.children.unshift(
      am5.Label.new(root, {
        rotation: -90,
        text: "Alert Count",
        y: am5.p50,
        centerX: am5.p50,
        fontWeight: "600",
        fontSize: 12,
      })
    );
    const tooltip = am5.Tooltip.new(root, {
        labelText: "[bold]{categoryX}[/]\nCount : {valueY}",
      });

      tooltip.label.setAll({
        fontSize: 12, // Change to your desired size
        fontWeight: "400", // Optional
      });
    const series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: eventName,
        xAxis,
        yAxis,
        valueYField: "count",
        categoryXField: "date",
        sequencedInterpolation: true,
        tooltip: tooltip,  
      }),
    );
    
    series.data.setAll(data);

    // Wide bars with rounded tops
    series.columns.template.setAll({
      width: am5.percent(70),
      maxWidth: 60,
      strokeOpacity: 0,
      cornerRadiusTL: 6,
      cornerRadiusTR: 6,
      cursorOverStyle: "pointer",
    });

    // Distinct color per bar
    series.columns.template.adapters.add("fill", (_fill, target) => {
      const idx = series.dataItems.indexOf(target.dataItem!);
      return colorPalette[idx >= 0 ? idx % colorPalette.length : 0];
    });
    series.columns.template.adapters.add("stroke", (_stroke, target) => {
      const idx = series.dataItems.indexOf(target.dataItem!);
      return colorPalette[idx >= 0 ? idx % colorPalette.length : 0];
    });

    // Hover
    series.columns.template.states.create("hover", { scale: 1.03 });

    // Count label on top of each bar
    series.bullets.push(() =>
      am5.Bullet.new(root, {
        locationY: 1,
        sprite: am5.Label.new(root, {
          text: "{valueY}",
          centerX: am5.p50,
          centerY: am5.p100,
          populateText: true,
          fontWeight: "700",
          fontSize: 12,
          fill: am5.color("#222222"),
          dy: -6,
        }),
      }),
    );

    chart.set("cursor", am5xy.XYCursor.new(root, { behavior: "none" }));

    series.appear(1000);
    chart.appear(1000, 100);
  }
  dateWiseChartData: any[] = [];
  loadDateWiseChart(eventId: string, eventName: string) {
    // const res: any[] = [
    //   { date: "01-Jun", count: 10 },
    //   { date: "02-Jun", count: 20 },
    //   { date: "03-Jun", count: 25 },
    //   { date: "04-Jun", count: 10 },
    //   { date: "05-Jun", count: 10 },
    //   { date: "06-Jun", count: 10 },
    // ];
    this.eventChartFlag = false;
    // this.alertService
    //     .getDateWiseData(eventId)
    //     .subscribe(res => {

    // this.dateWiseChartData = res;
    this.createDateChart(this.dateWiseChartData, eventName);

    // });
  }
  toggleChartView() {
    this.eventChartFlag = !this.eventChartFlag;
    if (this.eventChartFlag) {
      setTimeout(() => {
        this.getEventChartData();
      }, 300);
    }
  }
  
}
