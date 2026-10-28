
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, Output, ViewChild, inject, ChangeDetectionStrategy } from '@angular/core';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';

export type RtoPeriod = 'all' | 'today' | 'weekly' | 'monthly' | 'yearly';

interface RtoCount { label: string; count: number; share: number; color: string; }
interface RtoColumn extends RtoCount { x: number; y: number; barWidth: number; barHeight: number; showLabel: boolean; code: string; }

@Component({
    selector: 'app-rto-column-chart', imports: [],
    templateUrl: './rto-column-chart.component.html', changeDetection: ChangeDetectionStrategy.Eager,
 styleUrl: './rto-column-chart.component.scss'
})
export class RtoColumnChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() items: RtoCount[] = [];
  @Input() period: RtoPeriod = 'all';
  @Input() loading = false;
  @Input() error = '';
  @Output() periodChange = new EventEmitter<RtoPeriod>();
  @Output() selected = new EventEmitter<string>();
  @ViewChild('chartContainer', { static: true }) private chartContainer!: ElementRef<HTMLDivElement>;
  private readonly zone = inject(NgZone);
  private root?: am5.Root;
  private chart?: am5xy.XYChart;
  private xAxis?: am5xy.CategoryAxis<am5xy.AxisRendererX>;
  private series?: am5xy.ColumnSeries;

  ngOnChanges(): void {
    this.zone.runOutsideAngular(() => this.updateData());
  }

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      const root = this.root = am5.Root.new(this.chartContainer.nativeElement);
      root._logo?.dispose();
      root.numberFormatter.set('numberFormat', '#,###');
      const chart = this.chart = root.container.children.push(am5xy.XYChart.new(root, {
        panX: false, panY: false, wheelX: 'none', wheelY: 'none',
        paddingTop: 20, paddingRight: 12, paddingBottom: 0, paddingLeft: 0
      }));
      const xRenderer = am5xy.AxisRendererX.new(root, { minGridDistance: 15, cellStartLocation: 0.15, cellEndLocation: 0.85 });
      xRenderer.grid.template.set('visible', false);
      xRenderer.labels.template.setAll({
        rotation: -65, centerX: am5.p100, centerY: am5.p50,
        fontSize: 9, fill: am5.color(0x344936), paddingTop: 8
      });
      xRenderer.labels.template.adapters.add('text', (text, target) => {
        const item = target.dataItem?.dataContext as (RtoCount & { code: string }) | undefined;
        return item?.code ?? text;
      });
      this.xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
        categoryField: 'label', renderer: xRenderer
      }));
      const yRenderer = am5xy.AxisRendererY.new(root, { minGridDistance: 35 });
      yRenderer.labels.template.setAll({ fontSize: 10, fill: am5.color(0x344936) });
      yRenderer.grid.template.setAll({ stroke: am5.color(0xe3eadd), strokeOpacity: 1, strokeDasharray: [3, 4] });
      const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
        min: 0, extraMax: 0.15, maxPrecision: 0, renderer: yRenderer
      }));
      const series = this.series = chart.series.push(am5xy.ColumnSeries.new(root, {
        name: 'Panic sessions', xAxis: this.xAxis, yAxis,
        valueYField: 'count', categoryXField: 'label',
        tooltip: am5.Tooltip.new(root, {
          labelText: '{label}\n[bold]{valueY.formatNumber("#,###")}[/] panic sessions\n{share.formatNumber("0.0")}% of total'
        })
      }));
      series.columns.template.setAll({
        templateField: 'columnSettings', width: am5.percent(90),
        tooltipText: '{label}\n[bold]{valueY.formatNumber("#,###")}[/] panic sessions\n{share.formatNumber("0.0")}% of total',
        showTooltipOn: 'hover',
        strokeOpacity: 0, cornerRadiusTL: 3, cornerRadiusTR: 3,
        cursorOverStyle: 'pointer', focusable: true, role: 'button',
        ariaLabel: '{label}: {valueY} panic sessions. View open sessions and map.'
      });
      series.columns.template.states.create('hover', { fillOpacity: 0.8 });
      series.columns.template.events.on('click', event => {
        const item = event.target.dataItem?.dataContext as RtoCount | undefined;
        if (item && !this.loading && !this.error) {
          this.zone.run(() => this.selected.emit(item.label));
        }
      });
      series.bullets.push(() => am5.Bullet.new(root, {
        locationY: 1, sprite: am5.Label.new(root, {
          text: '{valueY}', populateText: true, centerX: am5.p50, centerY: am5.p100,
          fontSize: 9, fill: am5.color(0x263d2c), dy: -3
        })
      }));
      this.updateData();
    });
  }

  private updateData(): void {
    if (!this.root || !this.series || !this.xAxis || !this.chart) return;
    const data = this.loading || this.error ? [] : this.items.map(item => ({
      ...item,
      count: Number.isFinite(item.count) ? Math.max(0, item.count) : 0,
      share: Number.isFinite(item.share) ? Math.max(0, item.share) : 0,
      code: item.label.match(/WB\s*[-–]?\s*\d+/i)?.[0].replace(/\s+/g, '') ?? item.label.slice(0, 12),
      columnSettings: { fill: am5.color(item.color || '#2d6746'), stroke: am5.color(item.color || '#2d6746') }
    }));
    this.xAxis.data.setAll(data);
    this.series.data.setAll(data);
    // Keep dense RTO lists readable and allow horizontal navigation.
    this.series.set('minBulletDistance', 20);
    // if (data.length > 20) {
    //   if (!this.chart.get('scrollbarX')) this.chart.set('scrollbarX', am5.Scrollbar.new(this.root, { orientation: 'horizontal', height: 8 }));
    //   this.xAxis.zoom(0, 20 / data.length);
    // } else {
    //   this.xAxis.zoom(0, 1);
      // const scrollbar = this.chart.get('scrollbarX');
      // this.chart.set('scrollbarX', undefined);
      // scrollbar?.dispose();
    //}
  }

  ngOnDestroy(): void {
    this.zone.runOutsideAngular(() => this.root?.dispose());
  }
}
