import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  ChangeDetectionStrategy
} from '@angular/core';
import { NgZone } from '@angular/core';

import { AlertService } from '../../../core/services/alert.service';
import * as am5xy from "@amcharts/amcharts5/xy";

import { timer, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';

import * as am5 from "@amcharts/amcharts5";
import * as am5percent from "@amcharts/amcharts5/percent";

import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

@Component({
    selector: 'app-current-day-alerts',
    imports: [],
    templateUrl: './current-day-alerts.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './current-day-alerts.component.scss'
})
export class CurrentDayAlertsComponent implements OnInit, OnDestroy {

  @ViewChild('chartDiv', { static: true }) chartDiv!: ElementRef;

  private root!: am5.Root;
  private destroy$ = new Subject<void>();

  alertCounts: any[] = [];
  gridData: any[] = [];
  showGrid = false;
showAlertModal = false;
modalData: any[] = [];
selectedAlertName = '';

  todayDate = this.formatDate(new Date());

  constructor(private alertService: AlertService,
      private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.startAutoRefresh();
  }

  // 🔁 AUTO REFRESH EVERY 30 SEC
 startAutoRefresh() {

  this.alertService.getCurrentDayAlertsCount()
    .subscribe(res => {

      const alerts = res.entity?.listData || [];

      this.alertCounts = alerts.map(a => ({
        name: a.param3,
        value: Number(a.param4),
        id: a.param2
      }));

      this.renderChart();

      // ⏱ restart timer AFTER response
      setTimeout(() => this.startAutoRefresh(), 30000);
    });
}
renderChart() {

  if (this.root) this.root.dispose();

  this.root = am5.Root.new(this.chartDiv.nativeElement);
  this.root.setThemes([am5themes_Animated.new(this.root)]);

  const chart = this.root.container.children.push(
    am5xy.XYChart.new(this.root, {
      panX: false,
      panY: false
    })
  );

  const xAxis = chart.xAxes.push(
    am5xy.CategoryAxis.new(this.root, {
      categoryField: "name",
      renderer: am5xy.AxisRendererX.new(this.root, {
        minGridDistance: 20
      })
    })
  );

  const yAxis = chart.yAxes.push(
    am5xy.ValueAxis.new(this.root, {
      renderer: am5xy.AxisRendererY.new(this.root, {})
    })
  );

  xAxis.data.setAll(this.alertCounts);

  const series = chart.series.push(
    am5xy.ColumnSeries.new(this.root, {
      name: "Alerts",
      xAxis,
      yAxis,
      valueYField: "value",
      categoryXField: "name"
    })
  );

  series.data.setAll(this.alertCounts);

  // 🎯 CLICK EVENT
  series.columns.template.setAll({
    interactive: true,
    cursorOverStyle: "pointer"
  });

  series.columns.template.events.on("click", (ev: any) => {

    const data = ev.target.dataItem?.dataContext;
    if (!data) return;

    this.zone.run(() => {
      this.openAlertModal(data.id, data.name);
    });

  });

}





  loadDetails(alertId: string) {

    this.alertService
      .getCurrentDayAlertDetails(alertId, this.todayDate)
      .subscribe(res => {
        // this.gridData =  res.entity.listData || [];
        this.showGrid = true;
      });

  }

  formatDate(date: Date) {
    return date.toLocaleDateString('en-GB',{
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace(/ /g,'-');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.root) {
      this.root.dispose();
    }
  }

  closeAlertModal() {
  this.showAlertModal = false;
}

openAlertModal(alertId: string, alertName: string) {

  this.selectedAlertName = alertName;

  this.alertService
    .getCurrentDayAlertDetails(alertId, this.todayDate)
    .subscribe(res => {

      this.zone.run(() => {
        this.modalData = res.entity?.listData || [];
        this.showAlertModal = true;
      });

    });
}


getColorByIndex(index: number): string {

  const palette = [
    "#eb5757", // red
    "#2f80ed", // blue
    "#27ae60", // green
    "#f2c94c", // yellow
    "#9b51e0", // purple
    "#56ccf2", // sky
    "#f2994a", // orange
    "#6fcf97", // mint
    "#ff6b6b",
    "#4ecdc4",
    "#1a73e8",
    "#ff9f43",
    "#10ac84",
    "#341f97",
    "#ff4757",
    "#3742fa",
    "#ffa502",
    "#2ed573",
    "#5352ed",
    "#70a1ff"
  ];

  return palette[index % palette.length];
}


}
