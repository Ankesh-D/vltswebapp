import { ToastService } from '../../../core/services/toast.service';
import { MAP_BASEMAPS, createLeafletBasemap } from '../../../shared/components/map-layer-options/map-basemaps';
import { MapLayerOptionsComponent } from '../../../shared/components/map-layer-options/map-layer-options.component';
import { CommonModule } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { Component, DestroyRef, EventEmitter, HostListener, Input, NgZone, OnDestroy, OnInit, OnChanges, SimpleChanges, Output, inject, DOCUMENT, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, catchError, concatMap, finalize, from, of, toArray, timer, exhaustMap } from 'rxjs';
import L from 'leaflet';
import moment from 'moment';
import dayjs, { Dayjs } from 'dayjs';
import { NgxDaterangepickerMd, LOCALE_CONFIG, LocaleService } from 'ngx-daterangepicker-material';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { AlertService } from '../../../core/services/alert.service';
import { apiField, numericValue } from './panic-session.model';
import { VehicleService } from '../../../core/services/vehicle.service';
import { LeafletMapComponent } from '../../../shared/components/leaflet-map/leaflet-map.component';
import { HistoryPoint, PanicSession, historyPoints, historyRequests, parsePanicTime, validCoordinates } from './panic-session.model';


@Component({
    selector: 'app-panic-session-map',
    imports: [MapLayerOptionsComponent, CommonModule, FormsModule, A11yModule, LeafletMapComponent, NgxDaterangepickerMd, TimepickerModule],
    providers: [{ provide: LOCALE_CONFIG, useValue: {} }, LocaleService],
    templateUrl: './panic-session-map.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './panic-session-map.component.scss'
})
export class PanicSessionMapComponent implements OnInit, OnDestroy, OnChanges {

erssSubmitting = false;
erssMessage = '';
erssMessageType: 'success' | 'error' | '' = '';


  @Input({ required: true }) session!: PanicSession;
  @Input() vehicleTracking = false;
  @Input() actionDialogOpen = false;
  @Input() sessions: PanicSession[] = [];
  @Output() closed = new EventEmitter<void>();
  @Output() resolveRequested = new EventEmitter<PanicSession>();
  private readonly toast = inject(ToastService);
  private readonly vehicleService = inject(VehicleService);
  private readonly alertService = inject(AlertService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly zone = inject(NgZone);
  private readonly document = inject(DOCUMENT);
  private initialized = false;
  private map?: L.Map;
  private trackLayer?: L.LayerGroup;
  private historyArrows?: L.LayerGroup;
  private liveArrows?: L.LayerGroup;
  private playbackMarker?: L.Marker;
  private historyPlaybackActive = false;
  private panicMarker?: L.Marker;
  private historySubscription?: Subscription;
  private liveSubscription?: Subscription;
  private liveLayer?: L.LayerGroup;
  private liveMarker?: L.Marker;
  private liveTrail?: L.Polyline;
  private sessionLayer?: L.LayerGroup;
  liveActive = false;
  livePoint?: HistoryPoint;
  liveMessage = '';
  liveIgnition = '—';
  liveGpsStatus = '—';
  private liveCoordinates: L.LatLngTuple[] = [];
  private liveRoutePoints: HistoryPoint[] = [];
  private resizeObserver?: ResizeObserver;
  private animationFrame: number | null = null;
  private liveAnimationFrame: number | null = null;
  private previousOverflow?: string;
  panelCollapsed = false;
  activeTab: 'vehicle' | 'history' = 'vehicle';
  loading = false;
  historyMessage = '';
  mapMessage = '';
  points: HistoryPoint[] = [];
  playbackIndex = 0;
  playing = false;
  playbackSpeed = 5;
  completedDays = 0;
  requestedDays = 0;
  historyDate: { startDate: Dayjs; endDate: Dayjs } | null = null;
  fromTime: Date | null = null;
  toTime: Date | null = null;
  calendarOpen = false;
  isLayerSwitcherOpen = false;
  activeMapStyle = 'streets-v11';
  showPoliceStations = false;
  policeLoading = false;
  layerMessage = '';
  private tileLayers: Record<string, L.TileLayer> = {};
  private currentTileLayer?: L.TileLayer;
  private policeLayer?: L.LayerGroup;
  private policeSubscription?: Subscription;
  filterError = '';
  rangeMode: 'session' | 'custom' = 'session';
  get latestHistoryDate(): Dayjs { return dayjs(moment().utcOffset(330).format('YYYY-MM-DD')); }
  rangeStart: Date | null = null;
  rangeEnd: Date | null = null;
  get currentPoint(): HistoryPoint | undefined { return this.points[this.playbackIndex]; }
  get contactPhone(): string { return this.session.ownerPhone.replace(/[^+0-9]/g, ''); }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized) return;
    if (changes['session']) this.updateSession(this.session);
    if (changes['sessions']) { this.drawSessions(); this.fitSessions(); }
  }
  ngOnInit(): void {
    this.initialized = true;
    if (this.vehicleTracking) {
      this.resetVehicleHistoryRange();
      this.startLive();
      return;
    }
    if (!validCoordinates(this.session.latitude, this.session.longitude)) {
      this.mapMessage = 'The session has no valid panic coordinates. Available history will still be plotted.';
    }
    this.loadHistory();
    
  }

  @HostListener('document:keydown.escape') onEscape(): void {
    if (this.actionDialogOpen) return;
    if (this.calendarOpen) { this.calendarOpen = false; return; }
    if (this.isLayerSwitcherOpen) { this.isLayerSwitcherOpen = false; return; }
    this.closed.emit();
  }
  @HostListener('document:click', ['$event']) onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('#panic-history-date, ngx-daterangepicker-material')) this.calendarOpen = false;
  }

  initializeMap(host: HTMLElement): void {
    this.previousOverflow = this.document.body.style.overflow;
    this.document.body.style.overflow = 'hidden';
    const hasPosition = validCoordinates(this.session.latitude, this.session.longitude);
    const center: L.LatLngExpression = hasPosition ? [this.session.latitude!, this.session.longitude!] : [22.9868, 87.855];
    this.map = L.map(host, { center, zoom: hasPosition ? 14 : 7, zoomControl: false });
    this.map.attributionControl.setPrefix(false);
    this.map.attributionControl.setPosition('bottomleft');
    L.control.zoom({ position: 'topleft' }).addTo(this.map);
    this.tileLayers = Object.fromEntries(MAP_BASEMAPS.map(style => [style.id, createLeafletBasemap(style.id)]));
    this.currentTileLayer = this.tileLayers['streets-v11'].addTo(this.map);
    for (const [id, layer] of Object.entries(this.tileLayers)) {
      layer.on('tileerror', () => {
        if (this.activeMapStyle !== id || id === 'streets-v11') return;
        this.zone.run(() => { this.changeMapStyle('streets-v11'); this.layerMessage = 'Selected layer is unavailable. Streets restored.'; });
      });
    }
    this.policeLayer = L.layerGroup().addTo(this.map);
    this.trackLayer = L.layerGroup().addTo(this.map);
    this.liveLayer = L.layerGroup().addTo(this.map);
    this.sessionLayer = L.layerGroup().addTo(this.map);
    this.historyArrows = L.layerGroup().addTo(this.map);
    this.liveArrows = L.layerGroup().addTo(this.map);
    this.map.on('zoomend', () => this.refreshRouteArrows());
    this.drawSessions();
    if (hasPosition && !this.vehicleTracking) {
      this.panicMarker = L.marker(center, {
        icon: L.icon({ iconUrl: 'assets/mapimages/alertimage/panic.png', iconSize: [38, 38], iconAnchor: [19, 38], popupAnchor: [0, -32] }),
        zIndexOffset: 1200
      }).addTo(this.map).bindPopup(this.popup('Last panic event', this.session.lastEventTime, this.session.lastEventLocation));
    }
    this.resizeObserver = new ResizeObserver(() => this.map?.invalidateSize());
    this.resizeObserver.observe(host);
    this.map.invalidateSize();
    this.drawHistory();
    if (this.sessions.length > 1) this.fitSessions();
    if (this.livePoint) this.drawLivePoint(this.livePoint);
  }

  generateHistory(): void {
    const date = this.historyDate?.startDate?.format('YYYY-MM-DD') ?? '';
    const start = this.fromTime ? parsePanicTime(`${date} ${moment(this.fromTime).format('HH:mm')}:00`) : null;
    const end = this.toTime ? parsePanicTime(`${date} ${moment(this.toTime).format('HH:mm')}:00`) : null;
    if (!start || !end) { this.filterError = 'Select a valid date, From time and To time.'; return; }
    if (start >= end) { this.filterError = 'From time must be earlier than To time.'; return; }
    if (end > new Date()) { this.filterError = 'Select a time range that ends before now.'; return; }
    this.loadHistory(start, end);
  }

  private resetVehicleHistoryRange(): void {
    const now = moment().utcOffset(330);
    const date = dayjs(now.format('YYYY-MM-DD'));
    this.historyDate = { startDate: date, endDate: date };
    this.fromTime = new Date(2000, 0, 1, 0, 0);
    this.toTime = new Date(2000, 0, 1, now.hour(), now.minute());
    this.rangeStart = now.clone().startOf('day').toDate();
    this.rangeEnd = now.toDate();
  }

  resumeLive(): void {
    this.historySubscription?.unsubscribe();
    this.pause();
    this.historyPlaybackActive = false;
    this.activeTab = 'vehicle';
    this.startLive();
  }

  loadHistory(selectedStart?: Date, selectedEnd?: Date): void {
    this.historySubscription?.unsubscribe();
    this.stopLive();
    this.pause();
    this.trackLayer?.clearLayers();
    this.historyArrows?.clearLayers();
    this.playbackMarker = undefined;
    this.historyPlaybackActive = false;
    this.points = [];
    this.playbackIndex = 0;
    this.historyMessage = '';
    this.filterError = '';
    this.rangeMode = selectedStart && selectedEnd ? 'custom' : 'session';
    this.rangeStart = selectedStart ?? (this.vehicleTracking ? moment().utcOffset(330).startOf('day').toDate() : parsePanicTime(this.session.lastEventTime));
    this.rangeEnd = selectedEnd ?? new Date();
    if (this.rangeMode === 'session') {
      const first = moment(this.rangeStart ?? this.rangeEnd).utcOffset(330);
      const last = moment(this.rangeEnd).utcOffset(330);
      const date = dayjs(first.format('YYYY-MM-DD'));
      this.historyDate = { startDate: date, endDate: date };
      this.fromTime = new Date(2000, 0, 1, first.hour(), first.minute());
      this.toTime = first.isSame(last, 'day') ? new Date(2000, 0, 1, last.hour(), last.minute()) : new Date(2000, 0, 1, 23, 59);
    }
    if (!this.rangeStart || this.rangeStart > this.rangeEnd) {
      this.historyMessage = 'The last panic event time is invalid or in the future. History cannot be requested.';
      if (this.rangeMode === 'session') this.startLive();
      return;
    }
    const vehicle = this.session.vehicleNumber.trim();
    if (!vehicle || /^(NA|N\/A|-)$/i.test(vehicle)) {
      this.historyMessage = 'Vehicle number is unavailable for the history request.';
      return;
    }
    const requests = historyRequests(vehicle, this.rangeStart, this.rangeEnd);
    this.requestedDays = requests.length;
    this.completedDays = 0;
    this.loading = true;
    let failedDays = 0;
    const start = this.rangeStart;
    const end = this.rangeEnd;
    this.historySubscription = from(requests).pipe(
      concatMap(request => this.vehicleService.getVehicleHistory(request).pipe(
        catchError(error => {
          if (this.isNoHistoryResponse(error?.error)) return of(error.error);
          failedDays++;
          return of(null);
        })
      )),
      concatMap(response => {
        this.completedDays++;
        if (this.isNoHistoryResponse(response)) return of([] as any[]);
        if (response && (response.status === false || (response.statuscode != null && Number(response.statuscode) !== 200))) {
          failedDays++;
          return of([] as any[]);
        }
        const rows = response?.entity?.listData;
        if (response && !Array.isArray(rows)) failedDays++;
        return of(Array.isArray(rows) ? rows : []);
      }),
      toArray(),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading = false)
    ).subscribe(days => {
      this.points = historyPoints(days.flat(), start, end);
      if (failedDays) this.historyMessage = `${failedDays} day(s) could not be loaded. Any displayed track is incomplete; retry to load the full range.`;
      else if (this.points.length === 1) this.historyMessage = 'Only one history point is available in this range.';
      this.drawHistory();
      if (this.rangeMode === 'session') this.startLive();
    });
  }

  private vehicleLabel(entry: PanicSession): HTMLElement {
    const label = this.document.createElement('span'); label.textContent = entry.vehicleNumber || entry.chassisNumber; return label;
  }
  selectVehicle(entry: PanicSession): void {
    if (entry.sessionId === this.session.sessionId) return;
    this.updateSession(entry);
  }
  private updateSession(entry: PanicSession): void {
    this.session = entry;
    this.panicMarker?.remove();
    this.panicMarker = undefined;
    this.mapMessage = '';
    if (this.map && validCoordinates(entry.latitude, entry.longitude)) {
      this.panicMarker = L.marker([entry.latitude!, entry.longitude!], {
        icon: L.icon({ iconUrl: 'assets/mapimages/alertimage/panic.png', iconSize: [38, 38], iconAnchor: [19, 38] }), zIndexOffset: 1200
      }).addTo(this.map).bindPopup(this.popup('Last panic event', entry.lastEventTime, entry.lastEventLocation));
    }
    this.loadHistory();
  }

  private drawSessions(): void {
    this.sessionLayer?.clearLayers();
    if (!this.sessionLayer) return;
    for (const entry of this.sessions) {
      if (!validCoordinates(entry.latitude, entry.longitude)) continue;
      L.marker([entry.latitude!, entry.longitude!], { icon: L.icon({ iconUrl: 'assets/mapimages/alertimage/panic.png', iconSize: [30, 30], iconAnchor: [15, 30] }) })
        .bindTooltip(this.vehicleLabel(entry))
        .on('click', () => this.zone.run(() => this.selectVehicle(entry))).addTo(this.sessionLayer);
    }
  }

  fitSessions(): void {
    const coordinates: L.LatLngTuple[] = this.sessions.filter(entry => validCoordinates(entry.latitude, entry.longitude))
      .map(entry => [entry.latitude!, entry.longitude!]);
    if (this.map && coordinates.length) this.map.fitBounds(L.latLngBounds(coordinates), { padding: [45, 45], maxZoom: 15 });
  }

  private startLive(): void {
    this.stopLive();
    const vehicle = this.session.vehicleNumber.trim();
    if (!vehicle || /^(NA|N\/A|-)$/i.test(vehicle)) return;
    this.liveActive = true;
    const last = this.points[this.points.length - 1];
    if (last) { this.liveCoordinates = [[last.latitude, last.longitude]]; this.liveRoutePoints = [last]; }
    this.liveSubscription = timer(0, 10000).pipe(
      exhaustMap(() => this.vehicleService.getLiveTrack(vehicle, false).pipe(catchError(() => of(null)))),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(response => {
      const entity: any = response?.entity;
      const rows = Array.isArray(entity) ? entity : entity?.listData ?? entity?.details;
      const row = rows?.[0] ?? (entity && typeof entity === 'object' ? entity : null);
      if (response?.status === false || !row) { this.liveMessage = 'Live update unavailable; retrying automatically.'; return; }
      const latitude = numericValue(apiField(row, 38)), longitude = numericValue(apiField(row, 39));
      const time = parsePanicTime(apiField(row, 35) ?? row.pollingdate);
      if (!validCoordinates(latitude, longitude) || !time) { this.liveMessage = 'Waiting for a valid live position.'; return; }
      this.liveMessage = '';
      if (apiField(row, 9)) this.session.vendorName = String(apiField(row, 9));
      if (this.vehicleTracking) {
        this.session.lastEventTime = String(apiField(row, 35) ?? '');
        this.session.lastEventLocation = String(row.address ?? '');
        const updateText = (field: 'chassisNumber' | 'rto' | 'ownerName' | 'ownerPhone' | 'imeiNumber' | 'modelName', index: number) => {
          const value = String(apiField(row, index) ?? '').trim();
          if (value) this.session[field] = value;
        };
        updateText('chassisNumber', 14);
        updateText('rto', 19);
        updateText('ownerName', 25);
        updateText('ownerPhone', 26);
        updateText('imeiNumber', 4);
        updateText('modelName', 31);
        this.liveIgnition = apiField(row, 45) == null ? '—' : String(apiField(row, 45)) === '1' ? 'On' : 'Off';
        this.liveGpsStatus = apiField(row, 41) == null ? '—' : String(apiField(row, 41)) === '1' ? 'Active' : 'Inactive';
        this.session.latitude = latitude;
        this.session.longitude = longitude;
      }
      const previous = this.livePoint ?? last;
      if (previous && time <= previous.time) return;
      const point: HistoryPoint = { latitude: latitude!, longitude: longitude!, time, speed: numericValue(apiField(row, 40)) };
      this.livePoint = point;
      const latest = this.liveCoordinates[this.liveCoordinates.length - 1];
      if (!latest || latest[0] !== point.latitude || latest[1] !== point.longitude) { this.liveCoordinates.push([point.latitude, point.longitude]); this.liveRoutePoints.push(point); }
      this.drawLivePoint(point);
    });
  }

  private drawLivePoint(point: HistoryPoint): void {
    if (!this.map || !this.liveLayer) return;
    const position: L.LatLngTuple = [point.latitude, point.longitude];
    if (!this.liveMarker) {
      const lastHistoryPoint = this.points[this.points.length - 1];
      const initialPosition: L.LatLngTuple = lastHistoryPoint
        ? [lastHistoryPoint.latitude, lastHistoryPoint.longitude] : position;
      this.liveMarker = L.marker(initialPosition, { icon: this.vehicleIcon(), zIndexOffset: 1400 })
        .addTo(this.liveLayer);
      if (!this.points.length && this.sessions.length < 2) this.map.setView(position, 15);
    }
    this.animateLiveVehicle(position);
    this.liveMarker.bindPopup(this.trackingPopup(point, true), { className: 'vts-pro-popup', maxWidth: 290 });
    this.syncVehicleMarkerVisibility();
    if (!this.liveTrail) this.liveTrail = L.polyline(this.liveCoordinates, { color: '#16876d', weight: 4, opacity: .95 }).addTo(this.liveLayer);
    else this.liveTrail.setLatLngs(this.liveCoordinates);
    this.drawRouteArrows(this.liveCoordinates, this.liveArrows, '#16876d');
  }

  private animateLiveVehicle(position: L.LatLngTuple): void {
    if (this.liveAnimationFrame !== null) cancelAnimationFrame(this.liveAnimationFrame);
    this.liveAnimationFrame = null;
    const marker = this.liveMarker;
    if (!marker) return;
    const current = marker.getLatLng();
    const from: L.LatLngTuple = [current.lat, current.lng];
    if (from[0] === position[0] && from[1] === position[1]) return;
    this.rotateVehicle(marker, from, position);
    const started = performance.now();
    // Interpolate between received GPS positions over the live polling interval.
    // A new update starts from the currently rendered position, avoiding a jump.
    this.zone.runOutsideAngular(() => {
      const frame = (now: number) => {
        if (this.liveMarker !== marker) return;
        const fraction = Math.min(1, Math.max(0, (now - started) / 10000));
        const rendered: L.LatLngTuple = [
          from[0] + (position[0] - from[0]) * fraction,
          from[1] + (position[1] - from[1]) * fraction
        ];
        marker.setLatLng(rendered);
        this.liveTrail?.setLatLngs([...this.liveCoordinates.slice(0, -1), rendered]);
        if (fraction < 1) this.liveAnimationFrame = requestAnimationFrame(frame);
        else this.liveAnimationFrame = null;
      };
      this.liveAnimationFrame = requestAnimationFrame(frame);
    });
  }

  private stopLive(): void {
    this.liveSubscription?.unsubscribe();
    if (this.liveAnimationFrame !== null) cancelAnimationFrame(this.liveAnimationFrame);
    this.liveAnimationFrame = null;
    this.liveActive = false;
    this.liveLayer?.clearLayers();
    this.liveArrows?.clearLayers();
    this.liveMarker = undefined; this.liveTrail = undefined;
    this.livePoint = undefined; this.liveCoordinates = []; this.liveRoutePoints = []; this.liveMessage = '';
  }

  private isNoHistoryResponse(response: any): boolean {
    return response?.status === true && typeof response.entity === 'string'
      && response.entity.trim().toLowerCase() === 'no data found';
  }

  private syncVehicleMarkerVisibility(): void {
    if (!this.trackLayer || !this.liveLayer) return;
    const showLive = !!this.liveMarker && !this.historyPlaybackActive;
    if (this.playbackMarker) {
      if (showLive) this.trackLayer.removeLayer(this.playbackMarker);
      else if (!this.trackLayer.hasLayer(this.playbackMarker)) this.playbackMarker.addTo(this.trackLayer);
    }
    if (this.liveMarker) {
      if (showLive && !this.liveLayer.hasLayer(this.liveMarker)) this.liveMarker.addTo(this.liveLayer);
      else if (!showLive) this.liveLayer.removeLayer(this.liveMarker);
    }
  }

  selectTab(tab: 'vehicle' | 'history'): void {
    this.activeTab = tab;
    if (tab === 'vehicle') {
      this.pause();
      this.historyPlaybackActive = false;
      this.syncVehicleMarkerVisibility();
      if (this.vehicleTracking && !this.liveActive) this.resumeLive();
    }
  }

  private drawHistory(): void {
    if (!this.map || !this.trackLayer || !this.points.length) return;
    const coordinates: L.LatLngTuple[] = this.points.map(point => [point.latitude, point.longitude]);
    if (coordinates.length > 1) {
      L.polyline(coordinates, { color: '#fff', weight: 7, opacity: .85 }).addTo(this.trackLayer);
      L.polyline(coordinates, { color: '#b56f0a', weight: 4, opacity: .95 }).addTo(this.trackLayer);
      this.drawRouteArrows(coordinates, this.historyArrows, '#b56f0a');
    }
    const first = this.points[0], last = this.points[this.points.length - 1];
    L.circleMarker(coordinates[0], { radius: 7, color: '#fff', weight: 2, fillColor: '#319777', fillOpacity: 1 })
      .addTo(this.trackLayer).bindPopup(this.popup('First recorded position', first.time.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), `${first.latitude}, ${first.longitude}`, first.speed));
    L.circleMarker(coordinates[coordinates.length - 1], { radius: 7, color: '#fff', weight: 2, fillColor: '#ce566c', fillOpacity: 1 })
      .addTo(this.trackLayer).bindPopup(this.popup('Latest recorded position', last.time.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), `${last.latitude}, ${last.longitude}`, last.speed));
    this.playbackIndex = this.points.length - 1;
    this.playbackMarker = L.marker(coordinates[this.playbackIndex], {
      icon: this.vehicleIcon(), zIndexOffset: 1000
    }).addTo(this.trackLayer).on('click', () => {
      const point = this.currentPoint;
      if (point) this.playbackMarker?.bindPopup(this.trackingPopup(point, false), { className: 'vts-pro-popup', maxWidth: 290 }).openPopup();
    });
    if (coordinates.length > 1) this.rotateVehicle(this.playbackMarker, coordinates[coordinates.length - 2], coordinates[coordinates.length - 1]);
    this.syncVehicleMarkerVisibility();
    this.fitTrack();
  }

  changeMapStyle(style: string): void {
    const layer = this.tileLayers[style];
    if (!this.map || !layer) return;
    if (this.currentTileLayer) this.map.removeLayer(this.currentTileLayer);
    this.currentTileLayer = layer.addTo(this.map);
    this.activeMapStyle = style;
    this.isLayerSwitcherOpen = false;
    this.layerMessage = '';
  }
  togglePoliceStations(): void {
    this.policeSubscription?.unsubscribe();
    this.policeLayer?.clearLayers();
    if (!this.showPoliceStations || !this.map) return;
    this.policeLoading = true;
    this.layerMessage = '';
    this.policeSubscription = this.alertService.getPoliceStationDetails({ param1: '', param2: 1, param3: 20 })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.policeLoading = false))
      .subscribe({
        next: response => {
          const entity = response.entity;
          const rows = entity?.listData ?? entity?.listdata ?? entity?.details;
          if (response.status === false || !Array.isArray(rows)) { this.layerMessage = 'Police stations are unavailable.'; return; }
          if (!rows.length) this.layerMessage = 'No police stations found.';
          for (const row of rows) {
            const latitude = numericValue(apiField(row, 9)), longitude = numericValue(apiField(row, 10));
            if (!this.showPoliceStations || !this.policeLayer || !validCoordinates(latitude, longitude)) continue;
            const popup = this.document.createElement('div');
            for (const text of [apiField(row, 2) ?? 'Police station', apiField(row, 7) ?? '', apiField(row, 8) ?? '']) {
              const line = this.document.createElement('div'); line.textContent = String(text); popup.append(line);
            }
            L.marker([latitude!, longitude!], { icon: L.icon({ iconUrl: 'assets/mapimages/police-station.png', iconSize: [26, 26], iconAnchor: [13, 26] }) })
              .bindPopup(popup).addTo(this.policeLayer);
          }
        },
        error: () => this.layerMessage = 'Could not load police stations. Toggle off and on to retry.'
      });
  }

  fitTrack(): void {
    if (!this.map) return;
    const coordinates: L.LatLngTuple[] = this.points.map(point => [point.latitude, point.longitude]);
    for (const entry of this.sessions) if (validCoordinates(entry.latitude, entry.longitude)) coordinates.push([entry.latitude!, entry.longitude!]);
    if (validCoordinates(this.session.latitude, this.session.longitude)) coordinates.push([this.session.latitude!, this.session.longitude!]);
    if (coordinates.length) this.map.fitBounds(L.latLngBounds(coordinates), { paddingTopLeft: [45, 65], paddingBottomRight: this.map.getSize().x > 700 && !this.panelCollapsed ? [370, 50] : [40, 50], maxZoom: 16 });
  }
  focusPanic(): void {
    if (!this.panicMarker || !this.map) return;
    this.map.setView(this.panicMarker.getLatLng(), 16);
    this.panicMarker.openPopup();
  }
  play(): void {
    if (this.points.length < 2 || this.playing || !this.playbackMarker) return;
    this.historyPlaybackActive = true;
    this.syncVehicleMarkerVisibility();
    if (this.playbackIndex >= this.points.length - 1) this.seek(0);
    this.playing = true;
    this.animateStep();
  }
  pause(): void {
    this.playing = false;
    if (this.animationFrame !== null) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = null;
  }
  private animateStep(): void {
    if (!this.playing || this.playbackIndex >= this.points.length - 1) { this.pause(); return; }
    const fromPoint = this.points[this.playbackIndex], toPoint = this.points[this.playbackIndex + 1];
    this.rotateVehicle(this.playbackMarker, [fromPoint.latitude, fromPoint.longitude], [toPoint.latitude, toPoint.longitude]);
    const start = performance.now();
    const duration = 1000 / this.playbackSpeed;
    this.zone.runOutsideAngular(() => {
      const frame = (now: number) => {
        if (!this.playing) return;
        const fraction = Math.min(1, (now - start) / duration);
        this.playbackMarker?.setLatLng([
          fromPoint.latitude + (toPoint.latitude - fromPoint.latitude) * fraction,
          fromPoint.longitude + (toPoint.longitude - fromPoint.longitude) * fraction
        ]);
        if (fraction < 1) this.animationFrame = requestAnimationFrame(frame);
        else this.zone.run(() => { this.playbackIndex++; this.animateStep(); });
      };
      this.animationFrame = requestAnimationFrame(frame);
    });
  }
  seek(index: number): void {
    this.pause();
    this.historyPlaybackActive = true;
    this.syncVehicleMarkerVisibility();
    this.playbackIndex = Math.max(0, Math.min(index, this.points.length - 1));
    const point = this.currentPoint;
    if (point) {
      this.playbackMarker?.setLatLng([point.latitude, point.longitude]);
      const next = this.points[this.playbackIndex + 1];
      const previous = this.points[this.playbackIndex - 1];
      if (next) this.rotateVehicle(this.playbackMarker, [point.latitude, point.longitude], [next.latitude, next.longitude]);
      else if (previous) this.rotateVehicle(this.playbackMarker, [previous.latitude, previous.longitude], [point.latitude, point.longitude]);
    }
  }
  onSeek(event: Event): void { this.seek(Number((event.target as HTMLInputElement).value)); }
  changeSpeed(): void { if (this.playing) { this.pause(); this.play(); } }

  private refreshRouteArrows(): void {
    this.drawRouteArrows(this.points.map(point => [point.latitude, point.longitude]), this.historyArrows, '#b56f0a');
    this.drawRouteArrows(this.liveCoordinates, this.liveArrows, '#16876d');
  }

  private drawRouteArrows(coordinates: L.LatLngTuple[], layer: L.LayerGroup | undefined, color: string): void {
    layer?.clearLayers();
    if (!this.map || !layer || coordinates.length < 2) return;
    const zoom = this.map.getZoom();
    const spacing = Math.max(45, Math.min(240, 80 * Math.pow(2, (15 - zoom) / 3)));
    const maxArrows = Math.min(600, Math.max(12, Math.round(150 * Math.pow(2, (zoom - 15) / 2))));
    let distanceToArrow = spacing / 2;
    let count = 0;
    for (let index = 1; index < coordinates.length && count < maxArrows; index++) {
      const start = this.map.project(coordinates[index - 1], zoom);
      const end = this.map.project(coordinates[index], zoom);
      const length = start.distanceTo(end);
      if (!length) continue;
      const angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI;
      while (distanceToArrow <= length && count < maxArrows) {
        const fraction = distanceToArrow / length;
        const position = this.map.unproject(L.point(start.x + (end.x - start.x) * fraction, start.y + (end.y - start.y) * fraction), zoom);
        L.marker(position, {
          interactive: true, keyboard: true, title: 'View route point', zIndexOffset: 600,
          icon: L.divIcon({ className: 'panic-direction',
            html: `<span style="display:grid;place-items:center;width:20px;height:20px;border-radius:50%;background:white;box-shadow:0 1px 4px rgba(0,0,0,.3)"><span style="display:block;transform:rotate(${angle}deg);color:${color};font-size:15px;line-height:16px">➤</span></span>`,
            iconSize: [20, 20], iconAnchor: [10, 10] })
        }).addTo(layer).on('click', event => {
          const live = layer === this.liveArrows;
          const point = (live ? this.liveRoutePoints : this.points)[index];
          if (!point || !this.map) return;
          L.popup({ className: 'vts-pro-popup', maxWidth: 290, offset: [0, -15] })
            .setLatLng((event.target as L.Marker).getLatLng())
            .setContent(this.trackingPopup(point, live)).openOn(this.map);
        });
        count++;
        distanceToArrow += spacing;
      }
      distanceToArrow -= length;
    }
  }

  private vehicleIcon(): L.DivIcon {
    return L.divIcon({
      className: 'panic-vehicle-marker',
      html: '<img src="assets/mapimages/car/green.png" alt="Vehicle" style="display:block;width:16px;height:26px;transform-origin:center" />',
      iconSize: [16, 26], iconAnchor: [8, 13]
    });
  }

  private rotateVehicle(marker: L.Marker | undefined, from: L.LatLngTuple, to: L.LatLngTuple): void {
    if (!this.map || !marker || (from[0] === to[0] && from[1] === to[1])) return;
    const start = this.map.project(from), end = this.map.project(to);
    const angle = Math.atan2(end.x - start.x, start.y - end.y) * 180 / Math.PI;
    const image = marker.getElement()?.querySelector('img');
    if (image) image.style.transform = `rotate(${angle}deg)`;
  }

  private trackingPopup(point: HistoryPoint, live: boolean): HTMLElement {
    const node = (tag: string, cls: string, text?: string): HTMLElement => {
      const el = this.document.createElement(tag);
      el.className = cls;
      if (text !== undefined) el.textContent = text;
      return el;
    };
    const card = node('div', 'vts-popup-pro');
    const header = node('div', 'vts-popup-pro__header' + (live ? ' vts-popup-pro__header--live' : ''));
    const title = node('div', 'vts-popup-pro__title-row');
    const badge = node('div', 'vts-popup-pro__icon-badge');
    badge.append(node('i', 'fa fa-car'));
    const name = node('div', 'vts-popup-pro__title-text');
    name.append(node('span', 'vts-popup-pro__vehicle-no', this.session.vehicleNumber || this.session.chassisNumber || 'Vehicle'));
    name.append(node('span', live ? 'vts-popup-pro__live-tag' : 'vts-popup-pro__vehicle-class', live ? '● LIVE' : 'History point'));
    title.append(badge, name);
    const chip = node('div', 'vts-popup-pro__speed-chip');
    chip.style.background = point.speed === null ? '#64748b' : point.speed > 50 ? '#ef4444' : point.speed > 30 ? '#f59e0b' : '#22c55e';
    chip.append(node('span', 'vts-popup-pro__speed-val', point.speed === null ? '—' : String(point.speed)), node('span', 'vts-popup-pro__speed-unit', ' km/h'));
    header.append(title, chip);
    const body = node('div', 'vts-popup-pro__body');
    const grid = node('div', 'vts-popup-pro__info-grid');
    const field = (label: string, value: string, icon: string): HTMLElement => {
      const cell = node('div', 'vts-popup-pro__info-cell');
      const badge = node('div', 'vts-popup-pro__info-icon');
      badge.append(node('i', 'fa ' + icon));
      const content = node('div', 'vts-popup-pro__info-content');
      content.append(node('span', 'vts-popup-pro__info-label', label), node('span', 'vts-popup-pro__info-value', value || '—'));
      cell.append(badge, content);
      return cell;
    };
    grid.append(field(live ? 'Updated' : 'Time', point.time.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), 'fa-clock-o'), field('Vehicle class', this.session.vehicleClass, 'fa-truck'));
    const coords = node('div', 'vts-popup-pro__coord-row');
    coords.append(node('i', 'fa fa-map-marker'), node('span', 'vts-popup-pro__coord-text', `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`));
    const footer = node('div', 'vts-popup-pro__status-footer');
    const dot = node('span', '');
    dot.style.cssText = `width:7px;height:7px;border-radius:50%;background:${point.speed === null ? '#64748b' : point.speed > 0 ? '#22c55e' : '#f59e0b'}`;
    footer.append(dot, node('span', '', point.speed === null ? 'Speed unavailable' : point.speed > 0 ? 'Moving' : live ? 'Parked' : 'Stopped'));
    body.append(grid, coords, footer);
    card.append(header, body);
    return card;
  }

  private popup(title: string, time: string, location: string, speed?: number | null): HTMLElement {
    const element = (tag: string, className: string, text?: string): HTMLElement => {
      const node = this.document.createElement(tag);
      node.className = className;
      if (text !== undefined) node.textContent = text;
      return node;
    };
    const content = element('div', 'panic-marker-card');
    const live = title === 'Live vehicle position';
    const start = title === 'First recorded position';
    content.classList.add(live || start ? 'marker-card-green' : 'marker-card-red');
    const header = element('div', 'marker-card-header');
    const badge = element('span', 'marker-card-badge');
    const icon = element('i', live ? 'fa fa-car' : start ? 'fa fa-play' : 'fa fa-map-marker');
    icon.setAttribute('aria-hidden', 'true');
    badge.append(icon);
    const heading = element('div', 'marker-card-heading');
    heading.append(element('strong', '', this.session.vehicleNumber || this.session.chassisNumber || 'Vehicle'), element('small', '', title));
    header.append(badge, heading);
    if (speed != null) {
      const chip = element('div', 'marker-card-speed');
      chip.append(element('strong', '', String(speed)), element('small', '', 'km/h'));
      header.append(chip);
    }
    const body = element('div', 'marker-card-body');
    const row = (label: string, value: string, iconClass: string): HTMLElement => {
      const item = element('div', 'marker-card-row');
      const rowIcon = element('i', 'fa ' + iconClass);
      rowIcon.setAttribute('aria-hidden', 'true');
      const details = element('div', 'marker-card-value');
      details.append(element('span', '', label), element('strong', '', value || '—'));
      item.append(rowIcon, details);
      return item;
    };
    body.append(row('Event time', time, 'fa-clock-o'), row('Vehicle class', this.session.vehicleClass, 'fa-truck'), row('RTO', this.session.rto, 'fa-building-o'), row('Location / coordinates', location, 'fa-map-marker'));
    content.append(header, body);
    return content;
  }
  ngOnDestroy(): void {
    this.historySubscription?.unsubscribe();
    this.policeSubscription?.unsubscribe();
    this.stopLive();
    this.pause();
    this.resizeObserver?.disconnect();
    this.map?.remove();
    if (this.previousOverflow !== undefined) this.document.body.style.overflow = this.previousOverflow;
  }
pushToErss(): void {
  if (this.erssSubmitting) {
    return;
  }

  const sessionId = this.session?.sessionId?.trim();
  if (!sessionId) {
    this.erssMessage = 'Panic session ID is missing.';
    this.erssMessageType = 'error';
    return;
  }

  const req = { param1: '0', param2: sessionId, param3: '0' };

  this.erssSubmitting = true;
  this.erssMessage = '';
  this.erssMessageType = '';

  this.vehicleService
    .pushToErssSosSession(req)
    .pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.erssSubmitting = false;
      })
    )
    .subscribe({
      next: response => {
        if (
          response?.status === false ||
          (response?.statuscode != null &&
            Number(response.statuscode) !== 200)
        ) {
          this.erssMessage =
            response?.message || 'Failed to push to ERSS.';
          this.erssMessageType = 'error';
          return;
        }

        this.erssMessage =
          (typeof response.entity === 'string' ? response.entity.trim() : '') || response.message || 'ERSS request processed successfully.';
        this.erssMessageType = 'success';
        this.toast.show(this.erssMessage, 'success');
      },

      error: (error: any) => {
        this.erssMessage =
          error?.error?.message ||
          error?.message ||
          'Unable to push to ERSS. Please try again.';

        this.erssMessageType = 'error';
      }
    });
}
}
