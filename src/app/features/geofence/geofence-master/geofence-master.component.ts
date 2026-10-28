import { MapLayerOptionsComponent } from '../../../shared/components/map-layer-options/map-layer-options.component';
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import * as L from 'leaflet';
import { Subscription } from 'rxjs';
import {
  GeofenceCoordinates,
  GeofenceDrawType,
  GeofenceShape,
  GeofencemapService
} from '../../../core/services/geofencemap.service';
import { GeofencePayload, GeofenceService, PoiCategory } from '../../../core/services/geofence.service';
import { AlertService } from '../../../core/services/alert.service';
import { ToastService } from '../../../core/services/toast.service';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';

export class InsertGeofence {
  customerid = '';
  pageName = '';
  pageURL = '';
  geofenceid = '';
  geofencename = '';
  geofencetype = '';
  categoryid = '';
  categoryname = '';
  coord1: any = '';
  radius = '';
  activationstaus = 'false';
  stylealternatecolor = '#1d9d74';
  coord2 = '';
  remarks = '';
}

@Component({
    selector: 'app-geofence-master',
    imports: [MapLayerOptionsComponent, CommonModule, FormsModule, NgSelectModule, CommonTableComponent],
    templateUrl: './geofence-master.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './geofence-master.component.scss'
})
export class GeofenceMasterComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('geofenceForm') geofenceForm?: NgForm;
  @ViewChild('deleteForm') deleteForm?: NgForm;
  @ViewChild('geofenceMapContainer') geofenceMapContainer?: ElementRef<HTMLElement>;

  roleId = sessionStorage.getItem('roleid') || localStorage.getItem('rid') || '';

  customerList: any[] = [];
  routeDetails: any[] = [];
  geofenceDetails: any[] = [];
  readonly tableColumns: CommonTableColumn<any>[] = [
    { key: 'param1', label: '#' },
    { key: 'param3', label: 'Geofence Name' },
    { key: 'param4', label: 'Type' },
    { key: 'param6', label: 'Create Date' },
    { key: 'view', label: 'View', className: 'actionbody' },
    { key: 'delete', label: 'Delete', className: 'actionbody' }
  ];
  reasonList: any[] = [];

  customerObj: any = null;
  deletereasonObj: any = null;
  categoryObj: PoiCategory | null = null;
  insertGeofenceReqParam = new InsertGeofence();
  private currentGeofenceShape: GeofenceShape | null = null;

  detailsParam = {
    searchParameter: '',
    searchTyp: '',
    filter1: '',
    filter2: '',
    pageNo: '',
    itemPerPage: '',
    pageId: '1'
  };

  submitted = false;
  deletesubmitted = false;
  toUpdate = false;
  totalcount = 0;
  deleteremark = '';
  isLayerSwitcherOpen = false;
  activeMapStyle = 'streets-v11';
  showPoliceStations = true;
  private policeStationMarkers: L.Marker[] = [];
  selectedGeofenceType: GeofenceDrawType = 'polygon';
  geofenceShapeOptions: { label: string; value: GeofenceDrawType; icon: string }[] = [
    { label: 'Circle', value: 'circle', icon: 'fa-circle-o' },
    { label: 'Polygon', value: 'polygon', icon: 'fa-pencil' },
    { label: 'Rectangle', value: 'rectangle', icon: 'fa-square-o' }
  ];
  categoryList: PoiCategory[] = [];
  private mapSubscription?: Subscription;
  loading = false;

  constructor(
    private geofencemapService: GeofencemapService,
    private geofenceService: GeofenceService,
    private alertService: AlertService,
    private toast: ToastService
  ) {
    this.toast.pageName = 'Geofence Master'; // Set page name for toast service
  }

  ngOnInit(): void {
    this.detailsParam.pageNo = '1';
    this.detailsParam.itemPerPage = '20';
    this.reasonList = [
      { param1: '1', param2: 'Wrong entry' },
      { param1: '2', param2: 'No longer required' },
      { param1: '3', param2: 'Updated geofence area' }
    ];
    this.poiCategoryList();
    this.getRouteDetails();
    this.getGeofenceDetails();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.geofenceMapContainer?.nativeElement) {
        this.geofencemapService.initializeMap(this.geofenceMapContainer.nativeElement);
        this.loadPoliceStations();
      }
    }, 100);

    this.mapSubscription = this.geofencemapService.geofence$.subscribe(geofence => {
      this.currentGeofenceShape = geofence;
      this.insertGeofenceReqParam.coord1 = geofence ? JSON.stringify(geofence) : '';
      if (geofence) {
        this.selectedGeofenceType = geofence.type;
        this.insertGeofenceReqParam.radius = geofence.type === 'circle' && geofence.radius
          ? this.metersToKilometersDisplay(geofence.radius)
          : '';
      }
    });
  }

  ngOnDestroy(): void {
    this.clearPoliceStationMarkers();
    this.mapSubscription?.unsubscribe();
    this.geofencemapService.destroyMap();
  }

  addGeofence(): void {
    this.geofencemapService.startDraw(this.selectedGeofenceType, this.insertGeofenceReqParam.stylealternatecolor);
  }

  toggleLayerPanel(): void {
    this.isLayerSwitcherOpen = !this.isLayerSwitcherOpen;
  }

  changeMapStyle(style: string): void {
    this.activeMapStyle = style;
    this.geofencemapService.changeMapStyle(style);
  }

  togglePoliceStations(): void {
    if (this.showPoliceStations) {
      this.loadPoliceStations();
    } else {
      this.clearPoliceStationMarkers();
    }
  }

  private loadPoliceStations(retryCount = 0): void {
    this.clearPoliceStationMarkers();
    if (!this.showPoliceStations) {
      return;
    }

    const mapView = this.geofencemapService.getMap();
    if (!mapView) {
      if (retryCount < 10) {
        setTimeout(() => this.loadPoliceStations(retryCount + 1), 150);
      }
      return;
    }

    this.alertService.getPoliceStationDetails({ param1: '', param2: 1, param3: 20 }).subscribe({
      next: (response: any) => {
        const stations = response?.entity?.listData;
        const currentMap = this.geofencemapService.getMap();
        if (!currentMap || !this.showPoliceStations || !Array.isArray(stations)) {
          return;
        }

        currentMap.setZoom(Math.max(currentMap.getZoom(), 14));

        stations.forEach((station: any) => {
          const lat = Number(station?.param9);
          const lng = Number(station?.param10);
          if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
            return;
          }

          const icon = L.icon({
            iconUrl: 'assets/mapimages/police-station.png',
            iconSize: [24, 24],
            iconAnchor: [27, 27],
            popupAnchor: [0, -30]
          });

          const marker = L.marker([lat, lng], { icon })
            .bindPopup(this.createPoliceStationPopup(station, lat, lng), {
              className: 'police-station-popup',
              maxWidth: 235
            })
            .addTo(currentMap);

          this.policeStationMarkers.push(marker);
        });
      },
      error: () => {
        /* Map remains usable if police station API fails. */
      }
    });
  }

  private createPoliceStationPopup(station: any, lat: number, lng: number): HTMLElement {
    const root = document.createElement('div');
    root.className = 'police-popup-card';

    const header = document.createElement('div');
    header.className = 'police-popup-card__header';

    const image = document.createElement('img');
    image.src = 'assets/mapimages/police-station.png';
    image.alt = 'Police station';

    const heading = document.createElement('div');
    const title = document.createElement('strong');
    const type = document.createElement('small');
    title.textContent = String(station?.param2 || 'Police Station');
    type.textContent = String(station?.param3 || 'Police Station');
    heading.append(title, type);
    header.append(image, heading);
    root.append(header);

    const body = document.createElement('div');
    body.className = 'police-popup-card__body';

    [
      ['District', station?.param7 || '-'],
      ['State', station?.param8 || '-'],
      ['Location', `${lat.toFixed(5)}, ${lng.toFixed(5)}`]
    ].forEach(([label, value]) => {
      const row = document.createElement('div');
      const key = document.createElement('span');
      const val = document.createElement('b');
      key.textContent = String(label);
      val.textContent = String(value);
      row.append(key, val);
      body.append(row);
    });

    const link = document.createElement('a');
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    const stationName = String(station?.param2 || 'Police Station');
    const googleMapsQuery = `${stationName} Police Station, ${lat},${lng}`;
    link.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(googleMapsQuery)}`;
    link.title = `Show ${stationName} on Google Maps`;
    link.textContent = 'Locate Police Station';
    body.append(link);
    root.append(body);

    return root;
  }

  private clearPoliceStationMarkers(): void {
    this.policeStationMarkers.forEach(marker => marker.remove());
    this.policeStationMarkers = [];
  }

  selectGeofenceType(type: GeofenceDrawType): void {
    this.selectedGeofenceType = type;
    this.insertGeofenceReqParam.geofencetype = type;

    if (type !== 'circle') {
      this.insertGeofenceReqParam.radius = '';
    }
  }

  onCategoryChange(): void {
    this.insertGeofenceReqParam.categoryid = this.categoryObj?.param1 || '';
    this.insertGeofenceReqParam.categoryname = this.categoryObj?.param2 || '';
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowedKeys.includes(event.key) || /^[0-9]$/.test(event.key)) {
      return;
    }

    event.preventDefault();
  }

  onRadiusInput(value: string): void {
    this.insertGeofenceReqParam.radius = this.sanitizeKilometerRadius(value);
    this.updateCircleRadiusInPayload();
  }

  insertGeofence(geofenceForm: NgForm): void {
    this.insertGeofenceReqParam.customerid = this.customerObj?.param1 || '';
    this.onCategoryChange();
    this.updateCircleRadiusInPayload();
    this.submitted = true;

    if (geofenceForm.invalid || !this.currentGeofenceShape) {
      return;
    }

    const payload = this.buildGeofencePayload();
    this.loading = true;
    this.geofenceService.insertGeofence(payload).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (this.isSuccessResponse(res)) {
          this.toast.show(this.getResponseMessage(res, 'Geofence saved successfully'), 'success');
          this.resetForm();
          this.getGeofenceDetails();
        } else {
          this.toast.show(this.getResponseMessage(res, 'Geofence insert failed'), 'error');
        }
      },
      error: (error: any) => {
        this.loading = false;
        this.toast.show(error?.error?.entity || 'Error inserting geofence', 'error');
      }
    });
  }

  updateGeofence(geofenceForm: NgForm): void {
    this.insertGeofenceReqParam.customerid = this.customerObj?.param1 || '';
    this.onCategoryChange();
    this.updateCircleRadiusInPayload();
    this.submitted = true;

    if (geofenceForm.invalid || !this.currentGeofenceShape) {
      return;
    }

    const payload = this.buildGeofencePayload();
    this.loading = true;
    this.geofenceService.updateGeofence(payload).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (this.isSuccessResponse(res)) {
          this.toast.show(this.getResponseMessage(res, 'Geofence updated successfully'), 'success');
          this.resetForm();
          this.getGeofenceDetails();
        } else {
          this.toast.show(this.getResponseMessage(res, 'Geofence update failed'), 'error');
        }
      },
      error: (error: any) => {
        this.loading = false;
        this.toast.show(error?.error?.entity || 'Error updating geofence', 'error');
      }
    });
  }

  getRouteDetails(): void {
    this.geofenceService.getRouteDetails({
      param1: this.detailsParam.searchParameter || '',
      param2: this.detailsParam.pageNo || '1',
      param3: this.detailsParam.itemPerPage || '20',
      param4: this.detailsParam.filter1 || '',
      param5: this.detailsParam.filter2 || ''
    }).subscribe({
      next: (res: any) => {
        this.routeDetails = res?.status ? res?.entity?.listData || [] : [];
      },
      error: () => {
        this.routeDetails = [];
      }
    });
  }

  getGeofenceDetails(): void {
    this.loading = true;
    this.geofenceService.getGeofenceDetails({
      param1: this.detailsParam.searchParameter || '',
      param2: this.detailsParam.pageNo || '1',
      param3: this.detailsParam.itemPerPage || '20',
      param4: '',
      param5: ''
    }).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res?.status && res?.entity) {
          this.geofenceDetails = res.entity.listData || [];
          this.totalcount = Number(res.entity.param1 || this.geofenceDetails.length || 0);
        } else {
          this.geofenceDetails = [];
          this.totalcount = 0;
        }
      },
      error: (error: any) => {
        this.loading = false;
        this.geofenceDetails = [];
        this.totalcount = 0;
        alert(error?.error?.entity || 'Error loading geofence details');
      }
    });
  }

  poiCategoryList(): void {
    this.geofenceService.poiCategoryList().subscribe({
      next: (res: any) => {
        this.categoryList = res?.status && Array.isArray(res?.entity) ? res.entity : [];
        this.setSelectedCategory();
      },
      error: () => {
        this.categoryList = [];
        this.categoryObj = null;
      }
    });
  }

  refreshdata(): void {
    this.detailsParam = {
      searchParameter: '',
      searchTyp: '',
      filter1: '',
      filter2: '',
      pageNo: '1',
      itemPerPage: '20',
      pageId: '1'
    };
    this.getRouteDetails();
    this.getGeofenceDetails();
  }

  expotPDFExcel(type: 'pdf' | 'excel' | string): void {
    void type;
  }

  setData(item: any): void {
    this.toUpdate = true;
    this.insertGeofenceReqParam.geofenceid = item?.param2 || '';
    this.insertGeofenceReqParam.geofencename = item?.param3 || '';
    this.insertGeofenceReqParam.geofencetype = String(item?.param4 || '').toLowerCase();
    this.insertGeofenceReqParam.stylealternatecolor = item?.param8 || '#1d9d74';
    this.insertGeofenceReqParam.customerid = item?.customerid || '';
    this.insertGeofenceReqParam.categoryid = item?.param9 || item?.categoryid || '';
    this.insertGeofenceReqParam.categoryname = item?.param10 || item?.categoryname || '';

    this.customerObj = this.customerList.find(customer => customer.param1 === this.insertGeofenceReqParam.customerid) || null;
    this.setSelectedCategory();
    this.insertGeofenceReqParam.coord1 = item?.geometry || item?.param5 || item?.coord || item?.coord1 || '';
    const radiusInMeters = item?.param7 || item?.radius || '';
    this.insertGeofenceReqParam.radius = radiusInMeters;
    const geofence = this.parseGeofenceShape(this.insertGeofenceReqParam.coord1, this.insertGeofenceReqParam.geofencetype, radiusInMeters);

    if (geofence) {
      this.currentGeofenceShape = geofence;
      this.selectedGeofenceType = geofence.type;
      this.insertGeofenceReqParam.radius = geofence.type === 'circle' && geofence.radius
        ? this.metersToKilometersDisplay(geofence.radius)
        : '';
      this.geofencemapService.showGeofence(geofence, this.insertGeofenceReqParam.stylealternatecolor);
    } else {
      this.currentGeofenceShape = null;
      this.geofencemapService.clearGeofence();
    }
  }

  resetForm(): void {
    this.toUpdate = false;
    this.submitted = false;
    this.deletesubmitted = false;
    this.customerObj = null;
    this.deletereasonObj = null;
    this.categoryObj = null;
    this.currentGeofenceShape = null;
    this.deleteremark = '';
    this.selectedGeofenceType = 'polygon';
    this.insertGeofenceReqParam = new InsertGeofence();
    this.geofencemapService.clearGeofence();

    this.geofenceForm?.resetForm();
    this.deleteForm?.resetForm();
  }

  deleteGeofence(deleteForm: NgForm): void {
    this.deletesubmitted = true;

    if (deleteForm.invalid || !this.insertGeofenceReqParam.geofenceid) {
      return;
    }

    const reason = this.deletereasonObj?.param2 ? `${this.deletereasonObj.param2} - ` : '';
    this.loading = true;
    this.geofenceService.deleteGeofence({
      geofenceid: this.insertGeofenceReqParam.geofenceid,
      remarks: `${reason}${this.deleteremark}`.trim()
    }).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res?.status) {
          this.getGeofenceDetails();
          this.closeDeleteModal();
          this.resetForm();
        } else {
          alert(typeof res?.entity === 'string' ? res.entity : 'Geofence delete failed');
        }
      },
      error: (error: any) => {
        this.loading = false;
        alert(error?.error?.entity || 'Error deleting geofence');
      }
    });
  }

  private buildGeofencePayload(): GeofencePayload {
    return {
      geofenceid: this.insertGeofenceReqParam.geofenceid || '',
      geofencename: this.insertGeofenceReqParam.geofencename.trim(),
      geofencetype: this.selectedGeofenceType,
      coord: this.buildGeometryPayload(),
      radius: this.selectedGeofenceType === 'circle' ? this.kilometersToMetersString(this.insertGeofenceReqParam.radius) : '',
      stylealternatecolor: this.insertGeofenceReqParam.stylealternatecolor || '#1d9d74',
      categoryid: this.insertGeofenceReqParam.categoryid || '',
      remarks: this.insertGeofenceReqParam.remarks || ''
    };
  }

  private buildGeometryPayload(): string {
    if (!this.currentGeofenceShape) {
      return '';
    }

    if (this.currentGeofenceShape.type === 'circle') {
      const center = this.currentGeofenceShape.center || this.currentGeofenceShape.coordinates[0];
      return center ? JSON.stringify({ type: 'Point', coordinates: [center.lng, center.lat] }) : '';
    }

    const coordinates = this.currentGeofenceShape.coordinates
      .map(point => [Number(point.lng), Number(point.lat)])
      .filter(point => Number.isFinite(point[0]) && Number.isFinite(point[1]));

    if (coordinates.length < 3) {
      return '';
    }

    // A GeoJSON polygon ring must be closed. Leaflet keeps the closing edge
    // implicit, so repeat the first point before sending the shape to the API.
    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      coordinates.push([...first]);
    }

    return JSON.stringify({ type: 'Polygon', coordinates: [coordinates] });
  }

  private closeDeleteModal(): void {
    const closeButton = document.getElementById('closebtn') as HTMLButtonElement | null;
    closeButton?.click();
  }

  private setSelectedCategory(): void {
    this.categoryObj = this.categoryList.find(category => category.param1 === this.insertGeofenceReqParam.categoryid) || null;
  }

  private isSuccessResponse(response: any): boolean {
    return response?.status === true || response?.stattus === true;
  }

  private getResponseMessage(response: any, fallback: string): string {
    return typeof response?.entity === 'string' && response.entity.trim()
      ? response.entity
      : fallback;
  }

  private parseGeofenceShape(value: any, type?: string, radius?: string): GeofenceShape | null {
    if (!value) {
      return null;
    }

    if (Array.isArray(value)) {
      const coordinates = this.normalizeCoordinates(value);
      return coordinates.length > 0 ? { type: 'polygon', coordinates } : null;
    }

    try {
      const parsed = JSON.parse(value);
      return this.normalizeGeofenceShape(parsed);
    } catch {
      return this.parseCoordinateString(value, type, radius);
    }
  }

  private normalizeGeofenceShape(value: any): GeofenceShape | null {
    if (Array.isArray(value)) {
      const coordinates = this.normalizeCoordinates(value);
      return coordinates.length > 0 ? { type: 'polygon', coordinates } : null;
    }

    if (value?.type === 'LineString') {
      const coordinates = this.normalizeGeoJsonCoordinates(value.coordinates);
      return coordinates.length >= 2 ? { type: 'polygon', coordinates } : null;
    }

    if (value?.type === 'Polygon') {
      const coordinates = this.normalizeGeoJsonCoordinates(value.coordinates?.[0]);
      return coordinates.length >= 3 ? { type: 'polygon', coordinates } : null;
    }

    if (value?.type === 'Point') {
      const center = this.normalizeGeoJsonCoordinate(value.coordinates);
      const radius = Number(this.insertGeofenceReqParam.radius);
      return center && Number.isFinite(radius) && radius > 0
        ? { type: 'circle', center, radius, coordinates: [center] }
        : null;
    }

    const type = value?.type as GeofenceDrawType;
    if (!['circle', 'polygon', 'rectangle'].includes(type)) {
      return null;
    }

    if (type === 'circle') {
      const center = this.normalizeCoordinate(value?.center || value?.coordinates?.[0]);
      const radius = Number(value?.radius);
      return center && Number.isFinite(radius) && radius > 0
        ? { type, center, radius, coordinates: [center] }
        : null;
    }

    const coordinates = this.normalizeCoordinates(value?.coordinates);
    const minimumPoints = type === 'rectangle' ? 2 : 3;
    return coordinates.length >= minimumPoints ? { type, coordinates } : null;
  }

  private parseCoordinateString(value: string, type?: string, radius?: string): GeofenceShape | null {
    const geofenceType = String(type || '').toLowerCase();
    const coordinates = value
      .split(/[|;]/)
      .map(pair => {
        const [lat, lng] = pair.split(',').map(item => Number(item.trim()));
        return { lat, lng };
      })
      .filter(point => Number.isFinite(point.lat) && Number.isFinite(point.lng));

    if (coordinates.length === 0) {
      return null;
    }

    if (geofenceType === 'circle') {
      const circleRadius = Number(radius);
      return Number.isFinite(circleRadius) && circleRadius > 0
        ? { type: 'circle', center: coordinates[0], radius: circleRadius, coordinates: [coordinates[0]] }
        : null;
    }

    if (geofenceType === 'rectangle' && coordinates.length >= 2) {
      return { type: 'rectangle', coordinates };
    }

    return coordinates.length >= 3 ? { type: 'polygon', coordinates } : null;
  }

  private normalizeCoordinates(value: any): GeofenceCoordinates[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((point: any) => {
        if (Array.isArray(point) && point.length >= 2) {
          return { lat: Number(point[0]), lng: Number(point[1]) };
        }

        return {
          lat: Number(point?.lat ?? point?.latitude),
          lng: Number(point?.lng ?? point?.lon ?? point?.longitude)
        };
      })
      .filter((point: GeofenceCoordinates) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
  }

  private normalizeGeoJsonCoordinates(value: any): GeofenceCoordinates[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((point: any) => this.normalizeGeoJsonCoordinate(point))
      .filter((point: GeofenceCoordinates | null): point is GeofenceCoordinates => !!point);
  }

  private normalizeGeoJsonCoordinate(point: any): GeofenceCoordinates | null {
    if (!Array.isArray(point) || point.length < 2) {
      return null;
    }

    const coordinate = {
      lat: Number(point[1]),
      lng: Number(point[0])
    };

    return Number.isFinite(coordinate.lat) && Number.isFinite(coordinate.lng) ? coordinate : null;
  }

  private normalizeCoordinate(point: any): GeofenceCoordinates | null {
    const coordinate = Array.isArray(point) && point.length >= 2
      ? { lat: Number(point[0]), lng: Number(point[1]) }
      : {
          lat: Number(point?.lat ?? point?.latitude),
          lng: Number(point?.lng ?? point?.lon ?? point?.longitude)
        };

    return Number.isFinite(coordinate.lat) && Number.isFinite(coordinate.lng) ? coordinate : null;
  }

  private updateCircleRadiusInPayload(): void {
    if (this.selectedGeofenceType !== 'circle' || !this.currentGeofenceShape?.center) {
      return;
    }

    const radius = Number(this.kilometersToMetersString(this.insertGeofenceReqParam.radius));
    if (!Number.isFinite(radius) || radius <= 0) {
      return;
    }

    this.currentGeofenceShape = {
      ...this.currentGeofenceShape,
      radius,
      coordinates: [this.currentGeofenceShape.center]
    };
    this.insertGeofenceReqParam.coord1 = JSON.stringify(this.currentGeofenceShape);
    this.geofencemapService.showGeofence(this.currentGeofenceShape, this.insertGeofenceReqParam.stylealternatecolor);
  }

  private sanitizeKilometerRadius(value: string): string {
    return String(value || '').replace(/[^0-9]/g, '').slice(0, 8);
  }

  private kilometersToMetersString(value: string): string {
    const radiusInKilometers = Number(value);
    if (!Number.isFinite(radiusInKilometers) || radiusInKilometers <= 0) {
      return '';
    }

    return String(Math.round(radiusInKilometers * 1000));
  }

  private metersToKilometersDisplay(value: number | string): string {
    const radiusInMeters = Number(value);
    if (!Number.isFinite(radiusInMeters) || radiusInMeters <= 0) {
      return '';
    }

    return String(Math.round(radiusInMeters / 1000));
  }
}
