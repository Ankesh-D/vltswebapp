import { ErssSessionDetailsComponent } from '../erss-session-details/erss-session-details.component';
import { CommonModule } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { Component, DestroyRef, ElementRef, NgZone, OnInit, OnDestroy, HostListener, ViewChild, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, finalize, map, of, Subscription, switchMap } from 'rxjs';
import { PanicSession, apiField, numericValue } from '../panic-session-map/panic-session.model';
import { PanicSessionMapComponent } from '../panic-session-map/panic-session-map.component';
import { RtoColumnChartComponent, RtoPeriod } from '../rto-column-chart/rto-column-chart.component';
import { PanicActionComponent } from '../panic-action/panic-action.component';
import { VehicleService } from '../../../core/services/vehicle.service';
import { AlertService } from '../../../core/services/alert.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { BaseApiService } from '../../../core/services/base-api.service';
import { VehicleClassWiseAlertCountReq } from '../../../core/model/request.model';
import moment from 'moment';
declare var $: any;
interface PanicCount { id?: string; label: string; count: number; percent: number; share: number; color: string; offset: number; }
interface AlertTypeCount { id: string; label: string; count: number | null; icon: string; tone: string; }

const ALERT_TYPE_WIDGETS: Omit<AlertTypeCount, 'count'>[] = [
  { id: '14', label: 'Harsh Acceleration', icon: 'fa-tachometer', tone: 'tone-amber' },
  { id: '13', label: 'Harsh Braking', icon: 'fa-ban', tone: 'tone-red' },
  { id: '4', label: 'Internal Battery Low', icon: 'fa-battery-quarter', tone: 'tone-blue' },
  { id: '5', label: 'Internal Battery Low Removed', icon: 'fa-battery-full', tone: 'tone-green' },
  { id: '3', label: 'Main Battery Disconnect', icon: 'fa-plug', tone: 'tone-orange' },
  { id: '17', label: 'Over Speed', icon: 'fa-dashboard', tone: 'tone-red' },
  { id: '10', label: 'Panic', icon: 'fa-bell', tone: 'tone-rose' },
  { id: '15', label: 'Rash Turning', icon: 'fa-repeat', tone: 'tone-teal' },
  { id: '9', label: 'Tampered', icon: 'fa-shield', tone: 'tone-violet' }
];

@Component({
    selector: 'app-control-center-dashboard',
    imports: [ErssSessionDetailsComponent, CommonModule, A11yModule, FormsModule, RouterModule, PanicSessionMapComponent, PanicActionComponent, RtoColumnChartComponent],
    templateUrl: './control-center-dashboard.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './control-center-dashboard.component.scss'
})
export class ControlCenterDashboardComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly sessionsPage = this.route.snapshot.data['sessionsPage'] === true;
  readonly sessionWidget = this.sessionsPage ? (this.route.snapshot.queryParamMap.get('widget') ?? '') : '';
  readonly widgetCount = numericValue(this.route.snapshot.queryParamMap.get('count'));
  openSessionWorklist(widget: string, count: number | null): void {
    if (count === 0 && widget !== 'Push to ERSS') return;
    void this.router.navigate(['/ControlCenterDashboard/sessions'], {
      queryParams: { widget, ...(count !== null ? { count } : {}) }
    });
  }

  readonly erssSessionsPage = this.sessionsPage && this.sessionWidget === 'Push to ERSS';
  @ViewChild(ErssSessionDetailsComponent) private erssDetails?: ErssSessionDetailsComponent;
  private readonly alertService = inject(AlertService);
  private readonly vehicleService = inject(VehicleService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dashboardService = inject(DashboardService);
   private baseApiService = inject(BaseApiService);
  readonly palette = ['#65a764', '#e7ad43', '#5cb9a5', '#dd7f87', '#6daed6', '#ab90c5', '#a0be70'];
  searchTerm = '';
  sessions: PanicSession[] = [];
  selectedSession: PanicSession | null = null;
  actionSession: PanicSession | null = null;
  plottedSessions: PanicSession[] = [];
  viewportWidth = window.innerWidth;
  viewportHeight = window.innerHeight;
  @HostListener('window:resize') resizeCharts(): void { this.viewportWidth = window.innerWidth; this.viewportHeight = window.innerHeight; }
  get expandedClassColumns(): number { return Math.max(1, this.vehicleClassCounts.length); }
  get expandedColumnHeight(): number {
    const rows = Math.max(1, Math.ceil(this.vehicleClassCounts.length / this.expandedClassColumns));
    return Math.max(35, Math.min(300, (this.viewportHeight - 180) / rows - 70));
  }
  expandedChart: 'class' | 'rto' | null = null;
  activeChartTab: 'dashboard' | 'class' | 'rto' = 'dashboard';
  filterClass = '';
  filterRto = '';
  filterVendor = '';
  vendorList: any[] = [];
  selectedSeriesCount: number | null = null;
  private classRoster: any[] | null = null;
  private rtoRoster: any[] | null = null;
  rtoList: any[] = [];
  get hasFilters(): boolean { return !!(this.filterClass || this.filterRto || this.filterVendor); }
  get matchingSessions(): PanicSession[] {
    return this.sessions;
  }
  get vendorOptions(): { id: string; name: string }[] {
    return this.vendorList.map(row => ({
      id: String(apiField(row, 1) ?? '').trim(),
      name: String(apiField(row, 2) ?? '').trim()
    })).filter(vendor => !!vendor.id && !!vendor.name)
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  @HostListener('document:keydown.escape') closeChart(): void { this.expandedChart = null; }
  setActiveChartTab(tab: 'class' | 'rto'): void {
    this.expandedChart = null;
    this.activeChartTab = tab;
  }
  showDashboard(): void {
    this.expandedChart = null;
    this.activeChartTab = 'dashboard';
  }
  isDraggingAlertMarquee = false;
  alertMarqueeOffset = 0;
  alertMarqueeDelay = 0;
  private marqueeDragStartX = 0;
  private marqueeDragStartOffset = 0;
  private marqueeLoopWidth = 0;
  private alertMarqueeDragged = false;
  openAlertWorklist(item: AlertTypeCount, keyboard = false): void {
    if ((!keyboard && this.alertMarqueeDragged) || item.count === null || item.count <= 0 || !item.id) return;
    void this.router.navigate(['/ControlCenterDashboard/alerts'], {
      queryParams: { alertId: item.id, alertName: item.label }
    });
  }
  startAlertMarqueeDrag(event: PointerEvent): void {
    if (event.button !== 0) return;
    const viewport = event.currentTarget as HTMLElement;
    const track = viewport.querySelector<HTMLElement>('.alert-count-track');
    const group = track?.querySelector<HTMLElement>('.alert-count-group:not([aria-hidden="true"])');
    if (!track || !group) return;
    const transform = getComputedStyle(track).transform;
    this.marqueeDragStartOffset = transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m41;
    this.marqueeLoopWidth = group.getBoundingClientRect().width;
    if (!this.marqueeLoopWidth) return;
    this.marqueeDragStartX = event.clientX;
    this.alertMarqueeDragged = false;
    this.alertMarqueeOffset = this.marqueeDragStartOffset;
    this.isDraggingAlertMarquee = true;
  }
  moveAlertMarquee(event: PointerEvent): void {
    if (!this.isDraggingAlertMarquee) return;
    if (Math.abs(event.clientX - this.marqueeDragStartX) > 5) {
      this.alertMarqueeDragged = true;
      const viewport = event.currentTarget as HTMLElement;
      if (!viewport.hasPointerCapture(event.pointerId)) viewport.setPointerCapture(event.pointerId);
    }
    this.alertMarqueeOffset = this.marqueeDragStartOffset + event.clientX - this.marqueeDragStartX;
  }
  endAlertMarqueeDrag(): void {
    if (!this.isDraggingAlertMarquee || !this.marqueeLoopWidth) return;
    const phase = ((-this.alertMarqueeOffset % this.marqueeLoopWidth) + this.marqueeLoopWidth) % this.marqueeLoopWidth;
    this.alertMarqueeDelay = -(phase / this.marqueeLoopWidth) * 38000;
    this.isDraggingAlertMarquee = false;
    this.alertMarqueeOffset = 0;
  }
  selectChart(kind: 'class' | 'rto', label: string): void {
    this.sessionRequest?.unsubscribe();
    this.selectedSession = null; this.plottedSessions = [];
    this.filterClass = kind === 'class' ? label : '';
    this.filterRto = kind === 'rto' ? label : '';
    this.filterVendor = '';
    this.searchTerm = '';
    const item = (kind === 'class' ? this.vehicleClassCounts : this.rtoCounts).find(row => row.label === label);
    this.selectedSeriesCount = item?.count ?? null;
    if (item && item.count > 0) this.pageSize = item.count;
    this.expandedChart = null;
    this.searchSessions();
  }
  clearFilters(): void {
    this.filterClass = this.filterRto = this.filterVendor = '';
    this.selectedSeriesCount = null; this.pageSize = 20; this.searchSessions();
  }
  openMap(session: PanicSession): void { this.plottedSessions = this.hasFilters ? this.matchingSessions : []; this.selectedSession = session; }
  plotMatching(): void {
    this.plottedSessions = this.matchingSessions;
    this.selectedSession = this.plottedSessions[0] ?? null;
  }
  sessionsLoading = false;
  sessionsError = '';
  currentPage = 1;
  pageSize = 20;
  sessionTotal: number | null = null;
  private sessionRequest?: Subscription;
  vehicleClassCounts: PanicCount[] = [];
  rtoCounts: PanicCount[] = [];
  rtoPeriod: RtoPeriod = 'all';
  private rtoCountRequest?: Subscription;
  totalSessions: number | null = null;
  openSessions: number | null = null;
  autoClosedSessions: number | null = null;
  tamperedSessions: number | null = null;
  operatorClosedSessions: number | null = null;
  pushedToErssSessions: number | null = null;
  alertTypeCounts: AlertTypeCount[] = ALERT_TYPE_WIDGETS.map(item => ({ ...item, count: null }));
  alertWidgetsLoading = false;
  alertWidgetsError = '';
  countsLoading = false;
  classLoading = false;
  rtoLoading = false;
  countsError = '';
  classError = '';
  rtoError = '';
  lastUpdated: Date | null = null;
  rtodateObj = '';
  public vehicleClassWisePanicCountReq: VehicleClassWiseAlertCountReq =  new VehicleClassWiseAlertCountReq();
  ngOnInit(): void {
    if (this.erssSessionsPage) return;
    this.dateObj = moment().subtract(7, "days").format("DD-MMM-YYYY") + ' - ' + moment().format("DD-MMM-YYYY");
    this.rtodateObj = moment().subtract(7, "days").format("DD-MMM-YYYY") + ' - ' + moment().format("DD-MMM-YYYY");
    this.refresh(); 
    this.loadVendorList(); 
    this.loadRTORoster();
    this.getVehicleClassWisePanicCounts();
  }
  get loading(): boolean { return !!this.erssDetails?.loading || this.countsLoading || this.classLoading || this.rtoLoading || this.sessionsLoading || this.alertWidgetsLoading; }
  get classTotal(): number { return this.vehicleClassCounts.reduce((total, item) => total + item.count, 0); }
  get rtoTotal(): number { return this.rtoCounts.reduce((total, item) => total + item.count, 0); }


  dateObj = ''; 
  private rtoDateRange?: { param1: string; param2: string };
  private readonly datePickerZone = inject(NgZone);
  private readonly datePickerInputs = new Map<'class' | 'rto', HTMLInputElement>();

  @ViewChild('classDatePicker') set classDatePicker(input: ElementRef<HTMLInputElement> | undefined) {
    this.initializeDatePicker('class', input?.nativeElement);
  }

  @ViewChild('rtoDatePicker') set rtoDatePicker(input: ElementRef<HTMLInputElement> | undefined) {
    this.initializeDatePicker('rto', input?.nativeElement);
  }

  private initializeDatePicker(kind: 'class' | 'rto', input?: HTMLInputElement): void {
    const previous = this.datePickerInputs.get(kind);
    if (previous === input) return;
    if (previous) {
      $(previous).off('.panicChart');
      $(previous).data('daterangepicker')?.remove();
      this.datePickerInputs.delete(kind);
    }
    if (!input || typeof $ === 'undefined' || !$.fn.daterangepicker) return;
    this.datePickerInputs.set(kind, input);
    const classDates = this.dateObj.split(' - ');
    const rtoDates = this.rtodateObj.split(' - ');
    const start = kind === 'class' ? moment(classDates[0], 'DD-MMM-YYYY')
      : this.rtoDateRange ? moment(this.rtoDateRange.param1, 'YYYY-MM-DD') : moment().subtract(7, 'days');
    const end = kind === 'class' ? moment(classDates[1], 'DD-MMM-YYYY')
      : this.rtoDateRange ? moment(this.rtoDateRange.param2, 'YYYY-MM-DD') : moment();

      const startrto = kind === 'rto' ? moment(rtoDates[0], 'DD-MMM-YYYY')
      : this.rtoDateRange ? moment(this.rtoDateRange.param1, 'YYYY-MM-DD') : moment().subtract(7, 'days');
    const endrto = kind === 'rto' ? moment(rtoDates[1], 'DD-MMM-YYYY')
      : this.rtoDateRange ? moment(this.rtoDateRange.param2, 'YYYY-MM-DD') : moment();
    $(input).daterangepicker({
      timePicker: false,
      autoUpdateInput: false,
      startDate: start,
      endDate: end,
      opens: 'left',
      drops: 'down',
      locale: { format: 'DD-MMM-YYYY' },
      ranges: {
        Today: [moment(), moment()],
        Yesterday: [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
        'This Week': [moment().startOf('week'), moment()],
        'Last 7 Days': [moment().subtract(6, 'days'), moment()],
        'This Month': [moment().startOf('month'), moment()]
      },
      maxDate: moment(),
      minYear: 2022,
      maxYear: moment().year()
    });
    // The popup must also appear above the expanded chart overlay.
    $(input).data('daterangepicker').container.css('z-index', 11001);
    input.value = kind === 'class' ? this.dateObj : this.rtoDateRange
      ? start.format('DD-MMM-YYYY') + ' - ' + end.format('DD-MMM-YYYY') : '';
    $(input).on('apply.daterangepicker.panicChart', (_event: unknown, picker: any) => {
      this.datePickerZone.run(() => {
        input.value = picker.startDate.format('DD-MMM-YYYY') + ' - ' + picker.endDate.format('DD-MMM-YYYY');
        if (kind === 'class') {
          this.dateObj = input.value;
          this.getVehicleClassWisePanicCounts();
        } else {
          this.rtoDateRange = {
            param1: picker.startDate.format('YYYY-MM-DD'),
            param2: picker.endDate.format('YYYY-MM-DD')
          };
          this.loadRtoCounts();
        }
      });
    });

    //  rto
     input.value = kind === 'rto' ? this.rtodateObj : this.rtoDateRange
      ? startrto.format('DD-MMM-YYYY') + ' - ' + endrto.format('DD-MMM-YYYY') : '';
    $(input).on('apply.daterangepicker.panicChart', (_event: unknown, picker: any) => {
      this.datePickerZone.run(() => {
        input.value = picker.startDate.format('DD-MMM-YYYY') + ' - ' + picker.endDate.format('DD-MMM-YYYY');
        if (kind === 'rto') {
          this.rtodateObj = input.value;
          this.getVehicleClassWisePanicCounts();
        } else {
          this.rtoDateRange = {
            param1: picker.startDate.format('YYYY-MM-DD'),
            param2: picker.endDate.format('YYYY-MM-DD')
          };
          this.loadRtoCounts();
        }
      });
    });
  }

  ngOnDestroy(): void {
    for (const kind of [...this.datePickerInputs.keys()]) this.initializeDatePicker(kind);
  }

    get rtoVehicleCount(): number {
  return this.rtoCounts.reduce((total, item) => total + item.count, 0);
}
param7Sessions: number | null = null;
  refresh(): void {
    if (this.erssSessionsPage) { this.erssDetails?.load(); return; }
    if (this.loading) return;
    if (this.sessionsPage) {
      this.loadSessions();
      if (!this.vehicleClassCounts.length) this.loadSessionClassOptions();
      return;
    }
    this.countsLoading = this.classLoading = this.rtoLoading = true;
    this.countsError = this.classError = this.rtoError = '';
    this.loadSessions();
    this.getAlerts(false);
    this.alertService.getPanicDashboardCount('ControlCenterDashboard')
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.countsLoading = false))
      .subscribe({
        next: response => {
          const row = this.rows(response)?.[0];
          if (!row) { this.countsError = 'Panic summary is unavailable.'; return; }
          this.totalSessions = this.count(this.field(row, 1));
          this.openSessions = this.count(this.field(row, 2));
          this.autoClosedSessions = this.count(this.field(row, 3));
          this.tamperedSessions = this.count(this.field(row, 4));
          this.operatorClosedSessions = this.count(this.field(row, 5));
          this.pushedToErssSessions = this.count(this.field(row, 6));
          this.param7Sessions = this.count(this.field(row, 7));
          this.lastUpdated = new Date();
        },
        error: () => this.countsError = 'Could not load panic summary. Please refresh.'
      });
    
    this.loadRtoCounts();
  }
  getVehicleClassWisePanicCounts(): void {
    this.classLoading = true;
    this.classError = '';
    this.vehicleClassWisePanicCountReq.param1 = this.dateObj.split(' - ')[0];
    this.vehicleClassWisePanicCountReq.param2 = this.dateObj.split(' - ')[1];
    this.alertService.getVehicleClassWisePanicCounts(this.vehicleClassWisePanicCountReq)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.classLoading = false))
      .subscribe({
        next: response => {
          if (!this.success(response)) { this.classError = 'Vehicle class counts are unavailable.'; return; }
          const rows = this.rows(response);
          const counts = rows === null ? [] : this.chartRows(rows);
          if (rows === null || (rows.length > 0 && counts.length === 0)) {
            this.classError = 'Vehicle class count response could not be read.';
            return;
          }
          this.vehicleClassCounts = counts;
        },
        error: () => this.classError = 'Could not load vehicle class counts. Please refresh.'
      });
  }

  changeRtoPeriod(period: RtoPeriod): void {
    this.rtoDateRange = undefined;
    this.rtoPeriod = period;
    this.loadRtoCounts();
  }

  private loadRtoCounts(): void {
    this.rtoCountRequest?.unsubscribe();
    this.rtoLoading = true;
    this.rtoError = '';
    this.rtoCounts = [];
    let range = this.rtoDateRange;
    if (!range && this.rtoPeriod !== 'all') {
      const end = new Date();
      const start = new Date(end);
      if (this.rtoPeriod === 'weekly') start.setDate(start.getDate() - 6);
      if (this.rtoPeriod === 'monthly') start.setDate(start.getDate() - 29);
      if (this.rtoPeriod === 'yearly') start.setMonth(0, 1);
      const format = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      // Date parameters must match the rtowisepaniccounts backend contract.
      range = { param1: format(start), param2: format(end) };
    }
    this.rtoCountRequest = this.alertService.getRtoWisePanicCounts(range)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.rtoLoading = false))
      .subscribe({
        next: response => {
          if (!this.success(response)) { this.rtoError = 'RTO counts are unavailable.'; return; }
          const rows = this.rows(response);
          const counts = rows === null ? [] : this.chartRows(rows);
          if (rows === null || (rows.length > 0 && counts.length === 0)) {
            this.rtoError = 'RTO count response could not be read.';
            return;
          }
          this.rtoCounts = counts;
        },
        error: () => this.rtoError = 'Could not load RTO counts. Please refresh.'
      });
  }

  loadVendorList() {
    this.dashboardService.getVendorList().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        if (response.status && Array.isArray(response.entity)) {
          this.vendorList = response.entity;
        }
      },
      error: (error) => {
        { }
      }
    });
  }

  loadRTORoster() {
    this.vehicleService.getRTORosterNew(this.filterVendor, this.filterRto).subscribe({
      next: (response) => {
        if (response?.status && response?.entity) {
          this.rtoList = Array.isArray(response.entity) ? response.entity : [];
        }
      },
      error: (error) => { }
    });
  }

  private loadSessionClassOptions(): void {
    this.classLoading = true;
    this.classError = '';
    this.alertService.getVehicleClassWisePanicCounts(this.vehicleClassWisePanicCountReq)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.classLoading = false))
      .subscribe({
        next: response => {
          const rows = this.rows(response);
          if (rows) this.vehicleClassCounts = this.chartRows(rows);
          else this.classError = 'Vehicle class filters are unavailable.';
        },
        error: () => this.classError = 'Could not load vehicle class filters.'
      });
  }

  alertsList: any[] = [];

  getAlerts(showLoader: boolean = true): void {
    this.alertWidgetsLoading = showLoader;
    this.alertWidgetsError = '';
    const payload = { param1: '', param2: 'NA', param3: 'NA', param4: '' };
    this.baseApiService.apiCall('psv_count_vigilant_alert_on_buzzer', 'POST', payload)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.alertWidgetsLoading = false))
      .subscribe({
        next: (response: any) => {
          const rows = this.rows(response);
          if (rows === null) {
            this.alertsList = [];
            this.alertTypeCounts = [];
            this.alertWidgetsError = 'Alert counts are unavailable.';
            return;
          }
          this.alertsList = rows;
          this.alertTypeCounts = rows.map(row => {
            const id = String(this.field(row, 2) ?? '').trim();
            const style = ALERT_TYPE_WIDGETS.find(item => item.id === id);
            return {
              id,
              label: String(this.field(row, 3) ?? '').trim(),
              count: this.count(this.field(row, 4)),
              icon: style?.icon ?? 'fa-bell',
              tone: style?.tone ?? 'tone-blue'
            };
          });
        },
        error: () => {
          this.alertsList = [];
          this.alertTypeCounts = [];
          this.alertWidgetsError = 'Could not load alert counts. Please refresh.';
        }
      });
  }

  get hasNextPage(): boolean {
    return this.sessionTotal === null ? this.sessions.length === this.pageSize : this.currentPage * this.pageSize < this.sessionTotal;
  }
  get sessionPageCount(): number | null {
    return this.sessionTotal === null ? null : Math.max(1, Math.ceil(this.sessionTotal / this.pageSize));
  }
  get sessionRangeStart(): number { return this.sessions.length ? (this.currentPage - 1) * this.pageSize + 1 : 0; }
  get sessionRangeEnd(): number { return this.sessions.length ? (this.currentPage - 1) * this.pageSize + this.sessions.length : 0; }

  onClassChange(label: string): void {
    this.filterClass = label;
    this.filterRto = '';
    this.selectedSeriesCount = null;
    this.selectedSession = null;
    this.plottedSessions = [];
    this.searchSessions();
  }

  onRtoChange(rtoId: string): void {
    this.filterRto = rtoId;
    this.filterClass = '';
    this.selectedSeriesCount = null;
    this.selectedSession = null;
    this.plottedSessions = [];
    this.searchSessions();
  }

  searchSessions(): void { this.currentPage = 1; this.loadSessions(); }
  changePageSize(): void { this.currentPage = 1; this.loadSessions(); }
  changePage(direction: number): void {
    if (this.sessionsLoading || (direction < 0 && this.currentPage === 1) || (direction > 0 && !this.hasNextPage)) return;
    this.currentPage += direction;
    this.loadSessions();
  }
  loadSessions(): void {
    this.sessionRequest?.unsubscribe();
    this.sessionsLoading = true;
    this.sessionsError = '';
    this.sessions = [];
    const widgetTotal = this.sessionWidget && !this.hasFilters && !this.searchTerm.trim()
      && this.widgetCount !== null && this.widgetCount >= 0 ? this.widgetCount : null;
    this.sessionTotal = widgetTotal;
    if (widgetTotal === 0) { this.currentPage = 1; this.sessionsLoading = false; return; }
    if (widgetTotal !== null) {
      this.currentPage = Math.min(this.currentPage, Math.max(1, Math.ceil(widgetTotal / this.pageSize)));
    }
    if (this.selectedSeriesCount === 0 && this.hasFilters) { this.sessionTotal = 0; this.sessionsLoading = false; return; }
    const page = this.currentPage, size = this.pageSize, search = this.searchTerm.trim();
    this.sessionRequest = this.resolveFilters().pipe(
      switchMap(ids => this.alertService.getOpenPanicSessionDetails({
        param1: search || this.sessionWidget, param2: String(page), param3: String(size),
        param4: '', param5: '', param6: ids.classId, param7: ids.rtoId, param8: this.filterVendor,
        pagename: 'ControlCenterDashboard'
      })), takeUntilDestroyed(this.destroyRef), finalize(() => this.sessionsLoading = false)).subscribe({
      next: response => {
        if (!this.success(response)) { this.sessionsError = 'Open panic sessions are unavailable.'; return; }
        const entity = response?.entity;
        const rows = Array.isArray(entity) ? entity : (entity?.listData ?? entity?.listdata ?? entity?.details ?? []);
        if (!Array.isArray(rows)) { this.sessionsError = 'Invalid open-session response.'; return; }
        const total = numericValue(entity?.totalCount ?? entity?.Param1 ?? entity?.param1);
        this.sessionTotal = widgetTotal ?? (total !== null && total >= 0 ? total : this.selectedSeriesCount);
        const remaining = widgetTotal === null ? size : Math.max(0, widgetTotal - (page - 1) * size);
        this.sessions = this.mapSessions(rows.slice(0, Math.min(size, remaining)));
      },
      error: error => this.sessionsError = error?.status != null ? 'Could not load open panic sessions. Please retry.' : (error?.message || 'Could not load open panic sessions. Please retry.')
    });
  }
  private mapSessions(rows: any[]): PanicSession[] {
    const text = (row: any, index: number) => String(apiField(row, index) ?? '').trim();
    const namedText = (row: any, field: string) => {
      const key = Object.keys(row).find(key => key.replace(/_/g, '').toLowerCase() === field.toLowerCase());
      return key ? String(row[key] ?? '').trim() : '';
    };
   return rows.map(row => {
  return {
    sessionId: text(row, 2),
    vehicleNumber: text(row, 3),
    chassisNumber: text(row, 4),
    vehicleId: text(row, 5),
    imeiNumber: text(row, 6),
    vehicleClass: text(row, 7),
    rto: text(row, 8),
    ownerName: text(row, 9),
    ownerPhone: text(row, 10),
    lastEventTime: text(row, 11),
    lastEventLocation: text(row, 12),
    latitude: numericValue(apiField(row, 13)),
    longitude: numericValue(apiField(row, 14)),
    status: namedText(row, 'status') || 'Open',
    vendorName: text(row, 15),
    modelName: text(row, 16),
    deviceSerialNo: text(row, 17),
    iccid: text(row, 18),
    primaryMsisdn: text(row, 19),
    primaryNetwork: text(row, 20),
    fallbackMsisdn: text(row, 21),
    fallbackNetwork: text(row, 22),
    deviceActivationDate: text(row, 23),
    deviceActivatedUpto: text(row, 24),
    dealerName: text(row, 25)
  };
});
  }
  private resolveFilters(): Observable<{ classId: string; rtoId: string }> {
    const resolve = (kind: 'class' | 'rto', label: string): Observable<string> => {
      if (!label) return of('');
      if (kind === 'rto' && this.rtoList.some(row => String(apiField(row, 1) ?? '') === label)) return of(label);
      const item = (kind === 'class' ? this.vehicleClassCounts : this.rtoCounts).find(row => row.label === label);
      if (item?.id) return of(String(item.id));
      const cached = kind === 'class' ? this.classRoster : this.rtoRoster;
      const request = cached ? of(cached) : (kind === 'class' ? this.vehicleService.getVehicleClassRoster() : this.vehicleService.getRTORosterNew()).pipe(map(response => {
        const entity = response.entity;
        const rows = Array.isArray(entity) ? entity : entity?.listData ?? entity?.listdata ?? entity?.details;
        if (response.status === false || !Array.isArray(rows)) throw new Error('Could not load ' + kind + ' filter IDs.');
        if (kind === 'class') this.classRoster = rows; else this.rtoRoster = rows;
        return rows;
      }));
      return request.pipe(map(rows => {
        const row = rows.find(entry => String(apiField(entry, 1) ?? '') === label || (kind === 'class' ? this.sameCategory(String(apiField(entry, 2) ?? ''), label) : this.sameRto(String(apiField(entry, 2) ?? ''), label)));
        const id = row ? String(apiField(row, 1) ?? '').trim() : '';
        if (!id) throw new Error('No ' + kind + ' ID found for ' + label + '.');
        return id;
      }));
    };
    return resolve('class', this.filterClass).pipe(switchMap(classId => resolve('rto', this.filterRto).pipe(map(rtoId => ({ classId, rtoId })))));
  }
  private sameCategory(value: string, selected: string): boolean {
    const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, '');
    return normalize(value) === normalize(selected);
  }
  private sameRto(value: string, selected: string): boolean {
    const code = (text: string) => text.match(/\bWB[\s,–-]*(\d{1,2})\b/i)?.[1];
    const actualCode = code(value), selectedCode = code(selected);
    return actualCode && selectedCode ? Number(actualCode) === Number(selectedCode) : this.sameCategory(value, selected);
  }
  ownerPhoneLink(value: string): string { return value.replace(/[^+0-9]/g, ''); }

  private success(response: any): boolean {
    return response?.status !== false && (response?.statuscode == null || Number(response.statuscode) === 200);
  }
  private rows(response: any): any[] | null {
    if (!this.success(response)) return null;
    const data = response?.entity ?? response?.Entity ?? response;
    if (Array.isArray(data)) return data;
    if (!data || typeof data !== 'object') return null;
    // Panic count APIs return entity.details; other dashboard APIs return listData/listdata.
    const listKey = Object.keys(data).find(key => key.toLowerCase() === 'details')
      ?? Object.keys(data).find(key => key.toLowerCase() === 'listdata');
    if (listKey !== undefined) return Array.isArray(data[listKey]) ? data[listKey] : null;
    return this.field(data, 1) != null ? [data] : null;
  }
  private field(row: any, index: number): unknown {
    if (!row || typeof row !== 'object') return undefined;
    const key = Object.keys(row).find(name => name.toLowerCase() === 'param' + index);
    return key === undefined ? undefined : row[key];
  }
  private count(value: unknown): number | null {
    if (value == null || String(value).trim() === '') return null;
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
  }
  private chartRows(rows: any[]): PanicCount[] {
    const entries = rows.map(row => ({ id: String(row.vehicleclassid ?? row.vehicleClassId ?? row.rtoid ?? row.rtoId ?? row.id ?? ''), label: String(this.field(row, 1) ?? '').trim(), count: this.count(this.field(row, 2)) }))
      .filter((item): item is { id: string; label: string; count: number } => !!item.label && item.count !== null)
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    const total = entries.reduce((sum, item) => sum + item.count, 0);
    const maximum = Math.max(1, ...entries.map(item => item.count));
    let offset = 0;
    return entries.map((item, index) => {
      const share = total ? item.count / total * 100 : 0;
      const result = { ...item, percent: item.count / maximum * 100, share, offset, color: this.palette[index % this.palette.length] };
      offset += share;
      return result;
    });
  }
}
