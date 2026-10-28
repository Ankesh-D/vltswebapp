import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, Output, inject } from '@angular/core';

export type RtoPeriod = 'all' | 'today' | 'weekly' | 'monthly' | 'yearly';

interface RtoCount { label: string; count: number; share: number; color: string; }
interface RtoColumn extends RtoCount { x: number; y: number; barWidth: number; barHeight: number; showLabel: boolean; code: string; }

@Component({
  selector: 'app-rto-column-chart', standalone: true, imports: [CommonModule],
  templateUrl: './rto-column-chart.component.html', styleUrl: './rto-column-chart.component.scss'
})
export class RtoColumnChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() items: RtoCount[] = [];
  @Input() period: RtoPeriod = 'all';
  @Input() loading = false;
  @Input() error = '';
  @Output() periodChange = new EventEmitter<RtoPeriod>();
  readonly periods: { value: RtoPeriod; label: string; description: string }[] = [
    { value: 'all', label: 'All Time', description: 'All available sessions' },
    { value: 'today', label: 'Today', description: 'Today' },
    { value: 'weekly', label: 'Weekly', description: 'Last 7 days, including today' },
    { value: 'monthly', label: 'Monthly', description: 'Last 30 days, including today' },
    { value: 'yearly', label: 'Yearly', description: 'Current calendar year' }
  ];
  @Output() selected = new EventEmitter<string>();
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly zone = inject(NgZone);
  private observer?: ResizeObserver;
  width = 500;
  height = 280;
  columns: RtoColumn[] = [];
  hovered: RtoColumn | null = null;
  get tooltipLeft(): number { return Math.max(8, Math.min(this.width - 218, (this.hovered?.x ?? 0) - 105)); }
  get tooltipTop(): number { return Math.max(8, Math.min(this.height - 90, (this.hovered?.y ?? 0) + 22)); }

  ngOnChanges(): void { this.hovered = null; this.layout(); }
  ngAfterViewInit(): void {
    this.observer = new ResizeObserver(entries => {
      const rect = entries[0].contentRect;
      if (!rect.width || !rect.height) return;
      this.zone.run(() => { this.width = rect.width; this.height = Math.max(100, rect.height - 44); this.layout(); });
    });
    this.observer.observe(this.host.nativeElement);
  }
  private layout(): void {
    const count = this.items.length;
    if (!count) { this.columns = []; return; }
    const slot = Math.max(1, (this.width - 45) / count);
    const plotHeight = Math.max(20, this.height - 75);
    const maximum = Math.max(1, ...this.items.map(item => item.count));
    this.columns = this.items.map((item, index) => ({ ...item,
      x: 33 + (index + .5) * slot, y: this.height - 52,
      barWidth: Math.max(.5, Math.min(19, slot * .64)), barHeight: item.count / maximum * plotHeight,
      showLabel: true,
      code: item.label.match(/WB\s*[-–]?\s*\d+/i)?.[0].replace(/\s+/g, '') ?? item.label.slice(0, 12)
    }));
  }
  get ticks(): { y: number; count: number }[] {
    const maximum = Math.max(1, ...this.items.map(item => item.count));
    return [0, 25, 50, 75, 100].map(percent => ({ y: this.height - 52 - (this.height - 75) * percent / 100, count: maximum * percent / 100 }));
  }

  changePeriod(period: RtoPeriod): void {
    if (period !== this.period) { this.hovered = null; this.periodChange.emit(period); }
  }

  activate(event: Event, column: RtoColumn): void { event.preventDefault(); this.selected.emit(column.label); }
  ngOnDestroy(): void { this.observer?.disconnect(); }
}
