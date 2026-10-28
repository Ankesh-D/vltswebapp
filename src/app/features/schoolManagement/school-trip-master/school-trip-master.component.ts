import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { saveAs } from 'file-saver';

import { ToastService } from '../../../core/services/toast.service';
import { SchoolTripService } from '../../../core/services/school-trip.service';
import { SchoolManagementService } from '../../../core/services/school-management.service';
import { TripService } from '../../../core/services/trip.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import {
  SchoolmapboxService,
  SchoolMapMarkerDrag,
  SchoolMapPoint,
  SchoolMapRouteResult
} from '../../../core/services/schoolmapbox.service';
import {
  SchoolTripMasterDeleteReq,
  SchoolTripMasterDetailsReq,
  SchoolTripMasterFormReq,
  SchoolTripStop
} from '../../../core/model/request.model';
import { SchoolTripMasterDetailsResp } from '../../../core/model/response.model';

interface GridColumn {
  key: string;
  label: string;
  visible: boolean;
}

/** Lightweight VM used to back Source/Destination/Vehicle/Driver ng-select options. */
interface LookupOption {
  code: string;
  name: string;
  latitude?: number;
  longitude?: number;
}

@Component({
    selector: 'app-school-trip-master',
    imports: [CommonModule, FormsModule, NgSelectModule, NgbPaginationModule],
    templateUrl: './school-trip-master.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './school-trip-master.component.scss'
})
export class SchoolTripMasterComponent implements OnInit, OnDestroy {
  @ViewChild('masterForm') masterForm!: NgForm;
  @ViewChild('deleteForm') deleteForm!: NgForm;

  readonly mapContainerId = 'schoolTripMapContainer';

  // ==================== Grid / list state ====================
  detailsToggle = true; // true = grid view, false = form view
  loading = false;
  searchText = '';
  pageSize: any = 10;
  currentPage: any = 1;
  totalCount = 0;
  pageCount = 0;
  pageSizeOptions: any[] = [10, 25, 50, 100];
  detailData: SchoolTripMasterDetailsResp[] = [];
  detailsRequest: SchoolTripMasterDetailsReq = new SchoolTripMasterDetailsReq();
  deleteRequest: SchoolTripMasterDeleteReq = new SchoolTripMasterDeleteReq();
  sortKey = 'param4';
  sortDir: 'asc' | 'desc' = 'asc';
  selectedDownloadType = '';
  showColumnChooser = false;
  expandedRow: number | null = null;

  columns: GridColumn[] = [
    { key: 'tripcode', label: 'Trip Code', visible: true },
    { key: 'tripname', label: 'Trip Name', visible: true },
    { key: 'triptype', label: 'Type', visible: true },
    { key: 'vehicle', label: 'Vehicle', visible: true },
    { key: 'driver', label: 'Driver', visible: true },
    { key: 'source', label: 'Source', visible: true },
    { key: 'destination', label: 'Destination', visible: true },
    { key: 'starttime', label: 'Start Time', visible: true },
    { key: 'endtime', label: 'End Time', visible: true },
    { key: 'distance', label: 'Distance (km)', visible: true },
    { key: 'duration', label: 'Duration (min)', visible: false },
    { key: 'status', label: 'Status', visible: true }
  ];

  // ==================== Form state ====================
  updateFlag = false;
  viewOnly = false;
  formSubmitted = false;
  formDirty = false;
  isSaving = false;
  isMapAddMode = false;

  tripForm: SchoolTripMasterFormReq = new SchoolTripMasterFormReq();
  stops: SchoolTripStop[] = [];

  tripTypeList = ['Pickup', 'Drop'];
  academicSessionList: string[] = this.buildAcademicSessions();

  vehicleObj: LookupOption | null = null;
  vehicleList: LookupOption[] = [];
  driverObj: LookupOption | null = null;
  driverList: LookupOption[] = [];
  attendantObj: LookupOption | null = null;
  attendantList: LookupOption[] = []; // No Attendant Master API exists yet in this codebase; left empty until one is available.
  sourceObj: LookupOption | null = null;
  destinationObj: LookupOption | null = null;
  poiList: LookupOption[] = [];

  private subs: Subscription[] = [];

  constructor(
    public toastService: ToastService,
    private schoolTripService: SchoolTripService,
    private schoolService: SchoolManagementService,
    private tripService: TripService,
    private vehicleService: VehicleService,
    private mapboxService: SchoolmapboxService
  ) {
    this.toastService.pageName = 'School Trip Master';
  }

  ngOnInit(): void {
    this.getDetails('init');
    this.loadVehicleList();
    this.loadDriverList();
    this.loadPoiList();
    this.subscribeMapEvents();
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.mapboxService.destroyMap();
  }

  @HostListener('window:beforeunload', ['$event'])
  warnBeforeUnload(event: BeforeUnloadEvent): void {
    if (!this.detailsToggle && this.formDirty) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  private buildAcademicSessions(): string[] {
    const year = new Date().getFullYear();
    const list: string[] = [];
    for (let y = year - 1; y <= year + 1; y++) {
      list.push(`${y}-${y + 1}`);
    }
    return list;
  }

  // ============================================================
  // Lookup data
  // ============================================================
  private loadVehicleList(): void {
    const request = {
      selectvendorid: '', selectroleid: '', routeid: '', poiid: '',
      selectcustomerid: '', vehicleclassid: '', searchtype: '', rtoid: '', searchby: ''
    };
    this.vehicleService.getVehicleListV2(request).subscribe({
      next: (response: any) => {
        if (response.statuscode == 200) {
          this.vehicleList = (response.entity || []).map((v: any) => ({ code: v.param1, name: v.param2 }));
        }
      },
      error: () => { /* vehicle list is a non-blocking convenience lookup */ }
    });
  }

  private loadDriverList(): void {
    const request: any = { param1: '', param2: 1, param3: 200, param4: '' };
    this.schoolService.getDriverDetails(request).subscribe({
      next: (response: any) => {
        if (response.statuscode == 200) {
          this.driverList = (response.entity?.listData || []).map((d: any) => ({ code: d.param2, name: d.param3 }));
        }
      },
      error: () => { /* driver list is a non-blocking convenience lookup */ }
    });
  }

  private loadPoiList(): void {
    this.tripService.getPOIRoster().subscribe({
      next: (response: any) => {
        if (response.statuscode == 200) {
          this.poiList = (response.entity || []).map((p: any) => ({
            code: p.param2,
            name: p.param3,
            latitude: parseFloat(p.param7),
            longitude: parseFloat(p.param8)
          }));
        }
      },
      error: () => { /* POI list is a non-blocking convenience lookup */ }
    });
  }

  // ============================================================
  // Grid / list
  // ============================================================
  getDetails(type: string = ''): void {
    if (type === 'init' || type === 'reload') {
      this.detailsRequest = new SchoolTripMasterDetailsReq();
      this.searchText = '';
      this.currentPage = 1;
    }
    if (type === 'search') {
      this.detailsRequest.param1 = this.searchText;
      this.detailsRequest.param2 = 1;
      this.currentPage = 1;
    }
    this.detailsRequest.param3 = this.pageSize;
    this.loading = true;
    this.schoolTripService.getTripDetails(this.detailsRequest).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response.statuscode == 200) {
          this.detailData = response.entity?.listData || [];
          this.totalCount = response.entity?.param1 || 0;
          this.pageCount = Math.ceil(this.totalCount / this.pageSize);
        } else {
          this.toastService.show(response.message, 'error');
          this.detailData = [];
          this.totalCount = 0;
          this.pageCount = 0;
        }
      },
      error: (error) => {
        this.loading = false;
        console.log(error);
        this.toastService.show('An error occurred while fetching trip details.', 'error');
      }
    });
  }
  getSearchDetails(): void { this.getDetails('search'); }
  reloadData(): void { this.getDetails('reload'); }
  onPageSizeChange(): void { this.detailsRequest.param2 = 1; this.currentPage = 1; this.getDetails(); }
  onPageChange(page: number): void { this.detailsRequest.param2 = page; this.getDetails(); }

  sortBy(key: string): void {
    this.sortDir = (this.sortKey === key && this.sortDir === 'asc') ? 'desc' : 'asc';
    this.sortKey = key;
    this.detailData = [...this.detailData].sort((a: any, b: any) => {
      const va = (a[key] ?? '').toString().toLowerCase();
      const vb = (b[key] ?? '').toString().toLowerCase();
      return this.sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }

  toggleColumn(col: GridColumn): void { col.visible = !col.visible; }
  isColumnVisible(key: string): boolean { return this.columns.find(c => c.key === key)?.visible !== false; }

  toggleTimeline(index: number): void { this.expandedRow = this.expandedRow === index ? null : index; }
  getStopsFromRow(row: SchoolTripMasterDetailsResp): SchoolTripStop[] {
    try { return row.param16 ? JSON.parse(row.param16) : []; } catch { return []; }
  }

  // ---- Export / Print ----
  exportToExcel(): void {
    const visibleCols = this.columns.filter(c => c.visible);
    const headerRow = visibleCols.map(c => c.label);
    const rows = this.detailData.map((row: any) => visibleCols.map(c => this.getCellValue(row, c.key)));
    const csv = [headerRow, ...rows]
      .map(r => r.map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'SchoolTripMaster.csv');
  }
  printGrid(): void { window.print(); }
  onDownloadChange(): void {
    if (this.selectedDownloadType === 'Excel') { this.exportToExcel(); }
    if (this.selectedDownloadType === 'PDF') { window.print(); }
    setTimeout(() => this.selectedDownloadType = '', 400);
  }
  private getCellValue(row: any, key: string): string {
    const map: any = {
      tripcode: row.param3, tripname: row.param4, triptype: row.param5, vehicle: row.param6,
      driver: row.param7, source: row.param9, destination: row.param10, starttime: row.param11,
      endtime: row.param12, distance: row.param14, duration: row.param15, status: row.param13
    };
    return map[key] ?? '';
  }

  // ============================================================
  // Form: navigation / lifecycle
  // ============================================================
  toggleDetails(): void {
    if (!this.detailsToggle && this.formDirty) {
      if (!confirm('You have unsaved changes. Are you sure you want to leave without saving?')) {
        return;
      }
    }
    this.detailsToggle = !this.detailsToggle;
    if (!this.detailsToggle) {
      this.resetForm();
      setTimeout(() => this.initMapForForm(), 150);
    }
  }

  addNewTrip(): void {
    this.updateFlag = false;
    this.viewOnly = false;
    this.toggleDetails();
  }

  private initMapForForm(): void {
    this.mapboxService.initializeMap(this.mapContainerId);
    this.mapboxService.enableClickToAddStop(this.isMapAddMode && !this.viewOnly);
    this.renderCurrentState();
  }

  private subscribeMapEvents(): void {
    this.subs.push(this.mapboxService.addStopRequested$.subscribe(pt => this.addStopFromMap(pt.latitude, pt.longitude)));
    this.subs.push(this.mapboxService.markerDragged$.subscribe(drag => this.onMarkerDragged(drag)));
    this.subs.push(this.mapboxService.routeCalculated$.subscribe(result => this.applyRouteResult(result)));
    this.subs.push(this.mapboxService.mapError$.subscribe(msg => this.toastService.show(msg, 'error')));
  }

  toggleMapAddMode(): void {
    this.isMapAddMode = !this.isMapAddMode;
    this.mapboxService.enableClickToAddStop(this.isMapAddMode);
  }
  toggleSatelliteView(): void { this.mapboxService.toggleSatellite(); }
  resetRouteView(): void { this.mapboxService.resetRoute(); this.recalcRoute(); }

  // ============================================================
  // Source / Destination / Vehicle / Driver / Attendant selection
  // ============================================================
  onSourceChange(): void {
    if (this.sourceObj) {
      this.tripForm.sourceid = this.sourceObj.code;
      this.tripForm.sourcename = this.sourceObj.name;
      this.tripForm.sourcelatitude = String(this.sourceObj.latitude ?? '');
      this.tripForm.sourcelongitude = String(this.sourceObj.longitude ?? '');
    }
    this.formDirty = true;
    this.renderCurrentState();
  }
  onDestinationChange(): void {
    if (this.destinationObj) {
      this.tripForm.destinationid = this.destinationObj.code;
      this.tripForm.destinationname = this.destinationObj.name;
      this.tripForm.destinationlatitude = String(this.destinationObj.latitude ?? '');
      this.tripForm.destinationlongitude = String(this.destinationObj.longitude ?? '');
    }
    this.formDirty = true;
    this.renderCurrentState();
  }
  onVehicleChange(): void { this.tripForm.vehicleid = this.vehicleObj?.code || ''; this.formDirty = true; }
  onDriverChange(): void { this.tripForm.driverid = this.driverObj?.code || ''; this.formDirty = true; }
  onAttendantChange(): void { this.tripForm.attendantid = this.attendantObj?.code || ''; this.formDirty = true; }

  // ============================================================
  // Map <-> Stops synchronisation
  // ============================================================
  private renderCurrentState(): void {
    if (this.sourceObj?.latitude != null && this.sourceObj?.longitude != null) {
      this.mapboxService.setSourceMarker(this.sourceObj.latitude, this.sourceObj.longitude, this.sourceObj.name, !this.viewOnly);
    }
    if (this.destinationObj?.latitude != null && this.destinationObj?.longitude != null) {
      this.mapboxService.setDestinationMarker(this.destinationObj.latitude, this.destinationObj.longitude, this.destinationObj.name, !this.viewOnly);
    }
    this.mapboxService.renderStopMarkers(this.buildMapStops(), !this.viewOnly);
    this.recalcRoute();
  }

  private buildMapStops(): SchoolMapPoint[] {
    return this.stops.map(s => ({
      sequence: s.sequence,
      label: s.stopname || `Stop ${s.sequence}`,
      latitude: parseFloat(s.latitude),
      longitude: parseFloat(s.longitude),
      arrival: s.arrivaltime,
      departure: s.departuretime,
      studentCount: s.studentcount
    }));
  }

  recalcRoute(): void {
    if (!this.sourceObj?.latitude || !this.destinationObj?.latitude) { return; }
    const points: SchoolMapPoint[] = [
      { sequence: 0, label: this.sourceObj.name, latitude: this.sourceObj.latitude, longitude: this.sourceObj.longitude! },
      ...this.buildMapStops(),
      { sequence: -1, label: this.destinationObj.name, latitude: this.destinationObj.latitude, longitude: this.destinationObj.longitude! }
    ];
    this.mapboxService.drawRoute(points);
  }

  private applyRouteResult(result: SchoolMapRouteResult): void {
    this.tripForm.totaldistance = result.totalDistanceKm;
    this.tripForm.estimatedduration = result.totalDurationMin;
    // Each leg ends at a stop (the final leg ends at the destination and is not stored on a stop).
    result.legs.forEach((leg, i) => {
      if (i < this.stops.length) {
        this.stops[i].distance = leg.distanceKm;
        this.stops[i].estimatedtraveltime = leg.durationMin;
      }
    });
  }

  private onMarkerDragged(drag: SchoolMapMarkerDrag): void {
    this.formDirty = true;
    if (drag.markerType === 'source' && this.sourceObj) {
      this.sourceObj = { ...this.sourceObj, latitude: drag.latitude, longitude: drag.longitude };
      this.tripForm.sourcelatitude = String(drag.latitude);
      this.tripForm.sourcelongitude = String(drag.longitude);
      this.mapboxService.reverseGeocode(drag.latitude, drag.longitude).then(addr => {
        this.sourceObj!.name = addr;
        this.tripForm.sourcename = addr;
      });
    } else if (drag.markerType === 'destination' && this.destinationObj) {
      this.destinationObj = { ...this.destinationObj, latitude: drag.latitude, longitude: drag.longitude };
      this.tripForm.destinationlatitude = String(drag.latitude);
      this.tripForm.destinationlongitude = String(drag.longitude);
      this.mapboxService.reverseGeocode(drag.latitude, drag.longitude).then(addr => {
        this.destinationObj!.name = addr;
        this.tripForm.destinationname = addr;
      });
    } else if (drag.markerType === 'stop' && drag.stopIndex !== undefined) {
      const stop = this.stops[drag.stopIndex];
      if (stop) {
        stop.latitude = drag.latitude.toFixed(6);
        stop.longitude = drag.longitude.toFixed(6);
        this.mapboxService.reverseGeocode(drag.latitude, drag.longitude).then(addr => stop.stopname = addr);
      }
    }
    this.recalcRoute();
  }

  // ============================================================
  // Stops CRUD
  // ============================================================
  addStop(): void {
    const stop = new SchoolTripStop();
    stop.sequence = this.stops.length + 1;
    this.stops.push(stop);
    this.formDirty = true;
  }

  addStopFromMap(latitude: number, longitude: number): void {
    const stop = new SchoolTripStop();
    stop.sequence = this.stops.length + 1;
    stop.latitude = latitude.toFixed(6);
    stop.longitude = longitude.toFixed(6);
    this.stops.push(stop);
    this.formDirty = true;
    this.renderCurrentState();
    this.mapboxService.reverseGeocode(latitude, longitude).then(address => {
      stop.stopname = address;
    });
  }

  removeStop(index: number): void {
    if (!confirm('Remove this stop?')) { return; }
    this.stops.splice(index, 1);
    this.renumberStops();
    this.renderCurrentState();
    this.formDirty = true;
  }

  moveStopUp(index: number): void {
    if (index === 0) { return; }
    [this.stops[index - 1], this.stops[index]] = [this.stops[index], this.stops[index - 1]];
    this.renumberStops();
    this.renderCurrentState();
    this.formDirty = true;
  }

  moveStopDown(index: number): void {
    if (index === this.stops.length - 1) { return; }
    [this.stops[index + 1], this.stops[index]] = [this.stops[index], this.stops[index + 1]];
    this.renumberStops();
    this.renderCurrentState();
    this.formDirty = true;
  }

  private renumberStops(): void {
    this.stops.forEach((s, i) => s.sequence = i + 1);
  }

  onStopFieldChange(): void {
    this.formDirty = true;
    this.recalcRoute();
  }

  // ============================================================
  // Trip summary (Card 3)
  // ============================================================
  get totalStops(): number { return this.stops.length; }
  get firstStopName(): string { return this.stops[0]?.stopname || this.sourceObj?.name || '-'; }
  get lastStopName(): string { return this.stops[this.stops.length - 1]?.stopname || this.destinationObj?.name || '-'; }

  // ============================================================
  // Business rule validation
  // ============================================================
  validateTrip(): string[] {
    const errors: string[] = [];
    const f = this.tripForm;

    if (!f.tripname?.trim()) { errors.push('Trip Name is required.'); }
    if (f.tripname && this.detailData.some(d => d.param2 !== f.tripid && d.param4?.toLowerCase() === f.tripname.toLowerCase())) {
      errors.push('Trip Name must be unique.');
    }
    if (!f.tripcode?.trim()) { errors.push('Trip Code is required.'); }
    if (f.tripcode && this.detailData.some(d => d.param2 !== f.tripid && d.param3?.toLowerCase() === f.tripcode.toLowerCase())) {
      errors.push('Trip Code must be unique.');
    }
    if (!f.triptype) { errors.push('Trip Type is required.'); }
    if (!f.vehicleid) { errors.push('Vehicle is required.'); }
    if (!f.driverid) { errors.push('Driver is required.'); }
    if (!f.sourceid) { errors.push('Source is required.'); }
    if (!f.destinationid) { errors.push('Destination is required.'); }
    if (f.sourceid && f.destinationid && f.sourceid === f.destinationid) { errors.push('Source and Destination cannot be the same.'); }
    if (!f.starttime) { errors.push('Start Time is required.'); }
    if (!f.endtime) { errors.push('End Time is required.'); }
    if (f.starttime && f.endtime && f.endtime <= f.starttime) { errors.push('End Time must be greater than Start Time.'); }
    if (this.stops.length === 0) { errors.push('At least one stop is required.'); }

    // Overlapping vehicle/driver timing checks against the currently loaded trip list.
    const overlaps = (aStart: string, aEnd: string, bStart: string, bEnd: string) => aStart < bEnd && bStart < aEnd;
    if (f.starttime && f.endtime) {
      this.detailData.forEach(d => {
        if (d.param2 === f.tripid) { return; } // skip self when editing
        if (f.vehicleid && d.param6 === f.vehicleid && overlaps(f.starttime, f.endtime, d.param11, d.param12)) {
          errors.push(`Vehicle is already assigned to trip "${d.param4}" during an overlapping time.`);
        }
        if (f.driverid && d.param7 === f.driverid && overlaps(f.starttime, f.endtime, d.param11, d.param12)) {
          errors.push(`Driver is already assigned to trip "${d.param4}" during an overlapping time.`);
        }
      });
    }

    // Stop level validation.
    const seenCoords = new Set<string>();
    let previousDeparture = f.starttime;
    this.stops.forEach((s, i) => {
      const label = `Stop ${i + 1}`;
      if (!s.stopname?.trim()) { errors.push(`${label}: Stop Name is required.`); }
      if (!s.latitude || !s.longitude) { errors.push(`${label}: Latitude/Longitude is required.`); }
      if (!s.arrivaltime) { errors.push(`${label}: Arrival time is required.`); }
      if (!s.departuretime) { errors.push(`${label}: Departure time is required.`); }
      if (s.arrivaltime && s.departuretime && s.departuretime < s.arrivaltime) { errors.push(`${label}: Departure must be on/after Arrival.`); }
      if (s.arrivaltime && previousDeparture && s.arrivaltime < previousDeparture) { errors.push(`${label}: Arrival must be on/after the previous stop's departure.`); }
      if (s.departuretime) { previousDeparture = s.departuretime; }

      if (s.latitude && s.longitude) {
        const coordKey = `${s.latitude},${s.longitude}`;
        if (seenCoords.has(coordKey)) { errors.push(`${label}: Duplicate coordinates are not allowed.`); }
        seenCoords.add(coordKey);
      }
      const nameKey = s.stopname?.trim().toLowerCase();
      if (nameKey && this.stops.filter(x => x.stopname?.trim().toLowerCase() === nameKey).length > 1) {
        errors.push(`${label}: Duplicate stop name "${s.stopname}".`);
      }
      if (s.distance < 0) { errors.push(`${label}: Distance cannot be negative.`); }
      if (s.estimatedtraveltime < 0) { errors.push(`${label}: Travel time cannot be negative.`); }
    });

    if (this.stops.length && f.starttime && this.stops[0].arrivaltime && this.stops[0].arrivaltime < f.starttime) {
      errors.push("First stop arrival must be on/after the Trip Start Time.");
    }
    const lastStop = this.stops[this.stops.length - 1];
    if (lastStop && f.endtime && lastStop.departuretime && lastStop.departuretime > f.endtime) {
      errors.push('Last stop departure must be on/before the Trip End Time.');
    }

    return Array.from(new Set(errors));
  }

  // ============================================================
  // CRUD: Create / Edit / View / Copy / Delete / Activate-Deactivate
  // ============================================================
  setData(row: SchoolTripMasterDetailsResp, action: 'edit' | 'view' | 'copy'): void {
    this.updateFlag = action === 'edit';
    this.viewOnly = action === 'view';

    this.tripForm = new SchoolTripMasterFormReq();
    this.tripForm.tripid = action === 'copy' ? '' : row.param2;
    this.tripForm.tripcode = action === 'copy' ? `${row.param3}-COPY` : row.param3;
    this.tripForm.tripname = action === 'copy' ? `${row.param4} (Copy)` : row.param4;
    this.tripForm.triptype = row.param5;
    this.tripForm.vehicleid = row.param6;
    this.tripForm.driverid = row.param7;
    this.tripForm.attendantid = row.param8;
    this.tripForm.sourcename = row.param9;
    this.tripForm.destinationname = row.param10;
    this.tripForm.starttime = row.param11;
    this.tripForm.endtime = row.param12;
    this.tripForm.status = action === 'copy' ? 'Active' : row.param13;
    this.tripForm.totaldistance = Number(row.param14) || 0;
    this.tripForm.estimatedduration = Number(row.param15) || 0;
    this.tripForm.academicsession = row.param17;

    this.stops = this.getStopsFromRow(row).map(s => Object.assign(new SchoolTripStop(), s));
    this.sourceObj = this.poiList.find(p => p.name === row.param9) || null;
    this.destinationObj = this.poiList.find(p => p.name === row.param10) || null;
    this.driverObj = this.driverList.find(d => d.code === row.param7) || null;
    this.vehicleObj = this.vehicleList.find(v => v.code === row.param6) || null;
    if (this.sourceObj) { this.tripForm.sourceid = this.sourceObj.code; }
    if (this.destinationObj) { this.tripForm.destinationid = this.destinationObj.code; }

    this.detailsToggle = false;
    this.formDirty = false;
    setTimeout(() => this.initMapForForm(), 150);
  }

  onSubmit(masterForm: NgForm): void {
    this.formSubmitted = true;
    const errors = this.validateTrip();
    if (masterForm.invalid || errors.length) {
      errors.forEach(e => this.toastService.show(e, 'error'));
      this.scrollToFirstInvalid();
      return;
    }

    this.tripForm.tripstops = this.stops;
    this.isSaving = true;
    const request$ = this.updateFlag
      ? this.schoolTripService.updateTripDetails(this.tripForm)
      : this.schoolTripService.insertTripDetails(this.tripForm);

    request$.subscribe({
      next: (response: any) => {
        this.isSaving = false;
        if (response.statuscode == 200) {
          this.toastService.show(`Trip ${this.updateFlag ? 'updated' : 'created'} successfully.`, 'success');
          this.formDirty = false;
          this.detailsToggle = true;
          this.resetForm();
          this.getDetails('reload');
        } else {
          this.toastService.show(response.message || 'Failed to save the trip.', 'error');
        }
      },
      error: (error) => {
        this.isSaving = false;
        console.log(error);
        this.toastService.show('An error occurred while saving the trip.', 'error');
      }
    });
  }

  private scrollToFirstInvalid(): void {
    setTimeout(() => {
      const invalidEl = document.querySelector('.school-trip-form .ng-invalid.ng-touched, .school-trip-form .is-invalid');
      if (invalidEl) { (invalidEl as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    }, 100);
  }

  resetForm(): void {
    this.masterForm?.resetForm();
    this.tripForm = new SchoolTripMasterFormReq();
    this.stops = [];
    this.sourceObj = null;
    this.destinationObj = null;
    this.driverObj = null;
    this.vehicleObj = null;
    this.attendantObj = null;
    this.updateFlag = false;
    this.viewOnly = false;
    this.formSubmitted = false;
    this.formDirty = false;
    this.isMapAddMode = false;
    this.mapboxService.resetRoute();
  }

  openDeleteModal(row: SchoolTripMasterDetailsResp): void {
    this.deleteRequest = new SchoolTripMasterDeleteReq();
    this.deleteRequest.tripid = row.param2;
    this.toastService.openModal('deleteModal');
  }
  closeDeleteModal(): void { this.toastService.closeModal('deleteModal'); }
  confirmDelete(): void {
    if (this.deleteForm?.invalid) { return; }
    this.schoolTripService.deleteTripDetails(this.deleteRequest).subscribe({
      next: (response: any) => {
        if (response.statuscode == 200) {
          this.toastService.show('Trip deleted successfully.', 'success');
          this.closeDeleteModal();
          this.getDetails('reload');
        } else {
          this.toastService.show(response.message || 'Failed to delete the trip.', 'error');
        }
      },
      error: (error) => {
        console.log(error);
        this.toastService.show('An error occurred while deleting the trip.', 'error');
      }
    });
  }

  toggleStatus(row: SchoolTripMasterDetailsResp): void {
    const req = new SchoolTripMasterFormReq();
    req.tripid = row.param2;
    req.status = row.param13 === 'Active' ? 'Inactive' : 'Active';
    this.schoolTripService.changeTripStatus(req).subscribe({
      next: (response: any) => {
        if (response.statuscode == 200) {
          this.toastService.show(`Trip ${req.status === 'Active' ? 'activated' : 'deactivated'} successfully.`, 'success');
          this.getDetails();
        } else {
          this.toastService.show(response.message || 'Failed to update trip status.', 'error');
        }
      },
      error: (error) => {
        console.log(error);
        this.toastService.show('An error occurred while updating the trip status.', 'error');
      }
    });
  }
}

