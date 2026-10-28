import { createLeafletBasemap } from '../../../shared/components/map-layer-options/map-basemaps';
import { MapLayerOptionsComponent } from '../../../shared/components/map-layer-options/map-layer-options.component';
import { Component, OnInit, AfterViewInit, ChangeDetectorRef, OnDestroy, NgZone, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LiveEmergencyVehiclesRequest } from '../../../core/services/alert.service'; // Import the new interface
import { AlertService } from '../../../core/services/alert.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ToastComponent } from '../../assets/inactive-assets/toast.component';
import { ToastService } from '../../../core/services/toast.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { VehicleService } from '../../../core/services/vehicle.service';
import * as turf from '@turf/turf';
import dayjs from 'dayjs';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';

import L from 'leaflet';
declare var $: any;

@Component({
    selector: 'app-sos-alert',
    imports: [MapLayerOptionsComponent, CommonModule, FormsModule, NgxDaterangepickerMd, TimepickerModule, ToastComponent, NgSelectModule, CommonTableComponent],
    templateUrl: './sos-alert.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./sos-alert.component.scss']
})
export class SosAlertComponent implements OnInit, AfterViewInit, OnDestroy {
  alertDetails: any[] = [];
  readonly tableColumns: CommonTableColumn<any>[] = [
    { key: 'param1', label: '#' },
    { key: 'vehicle', headers: ['Vehicle No.', 'Chassis No.'], sortable: true, sortKey: 'param11' },
    { key: 'param8', label: 'Vendor Name', sortable: true },
    { key: 'device', headers: ['Serial No.', 'IMEI No.'], sortable: true, sortKey: 'param5' },
    { key: 'param6', label: 'ICCID No.', sortable: true },
    { key: 'param18', label: 'Customer', sortable: true },
    { key: 'param22', label: 'Alert Time', sortable: true },
    { key: 'map', label: 'Panic Alert with Map View', sortable: true, sortKey: 'param30' },
    { key: 'speed', headers: ['Speed(Km/hrs)', 'Ignition'], sortable: true, sortKey: 'param27' }
  ];
  loading = false;

  searchText: string = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [20, 50, 100, 200, 500];
  totalCount = 0;
  pageCount = 0;

  // Panel Controls
  selectedEmergency: any = null;
  isInfoPanelCollapsed = false;
  isInfoPanelVisible = false;
  activePanelTab: 'vehicle' | 'device' | 'alert' = 'vehicle'; // Default active tab

  sortKey: string = '';
  reverse: boolean = false;

  // Modal controls
  showRawStringModal = false;
  showMapModal = false;
  pctstr = '';
  safeMapUrl: SafeResourceUrl | null = null;
  map: L.Map | null = null;
  private mainBasemap?: L.TileLayer;
  private singleBasemap?: L.TileLayer;
  private singleHistoryLayers = L.layerGroup();
  private historyAlertLayers = L.layerGroup();
  private historyArrowLayers = L.layerGroup();
  private singleLiveLayers = L.layerGroup();
  private singleLiveRoute?: L.Polyline;
  private historyRoute?: L.Polyline;
  private mapResizeObservers = new Map<L.Map, ResizeObserver>();
  private policeStationsSub?: Subscription;
  private liveTrackingSub?: Subscription;
  private historyTrackingSub?: Subscription;
  private emergencyDetailsSub?: Subscription;
  private mapGeneration = 0;
  private trackingGeneration = 0;
  private modalGeneration = 0;
  emergencyMarker: any;
  private policeStationMarkers: L.Marker[] = [];
  errorMessage: string | null = null;
  successMessage: string | null = null;
  private refreshInterval: any;
  vehicleType: string = "NEW";
  pageName: string = "";
  protected readonly Number = Number;

  // Tracking State (Integrated from TodayAlert)
  singleAlertMap: L.Map | null = null;
  singleAlertModalMode: 'live' | 'history' | null = null;
  singleAlertLiveVehicleId: string = '';
  singleAlertLiveData: any;
  singleAlertLiveMarker: any = null;
  singleAlertAnimationFrameId: number | null = null;
  singleAlertLivePathCoordinates: any[] = [];
  singleAlertLiveInterval: any;
  singleAlertInfoPanelData: any = {};
  isVehiclePlotted: boolean = false;
  isSingleInfoCollapsed: boolean = false;
  isComponentAlive: boolean = true;

  historyDataList: any[] = [];
  historyPlaybackIndex: number = 0;
  isHistoryPlaying: boolean = false;
  historyTimer: any = null;
  speedSliderValue: number = 5;
  historyLoading: boolean = false;

  singleAlertHistoryMarker: any = null;
  singleAlertHistoryStartMarker: any = null;
  singleAlertHistoryEndMarker: any = null;
  singleAlertHistoryAnimationFrameId: number | null = null;
  isLayersVisible = false;
  showPoliceStations = false;
  currentStyle = 'streets-v11';

  poiData: any = {};
  alertRefreshTimer: any; // Used in clearAllLayers
  selectedSingleAlert: any = null;
  showSingleAlertModal: boolean = false; // Moved to class property

  alertIconMappings = {
    'overspeed': { name: 'alert-overspeed', path: 'assets/images/mapimages/alertimage/overspeed_new.png' },
    'impact': { name: 'alert-impact', path: 'assets/images/mapimages/alertimage/emergency.png' },
    'main battery reconnect': { name: 'alert-battery-reconnect', path: 'assets/images/mapimages/alertimage/batterycharge.png' },
    'power disconnect': { name: 'alert-power-disconnect', path: 'assets/images/mapimages/alertimage/powerDisconnect.png' },
    'ignition on': { name: 'alert-ignition-on', path: 'assets/images/mapimages/alertimage/ignitionOn.png' },
    'ignition off': { name: 'alert-ignition-off', path: 'assets/images/mapimages/alertimage/ignitionOff.png' },
    'harsh acceleration': { name: 'alert-harsh-acceleration', path: 'assets/images/mapimages/alertimage/harshacceleration_new.png' },
    'harsh brake': { name: 'alert-harsh-brake', path: 'assets/images/mapimages/alertimage/harshbrake_new.png' },
    'geofence entry': { name: 'alert-geofence-entry', path: 'assets/images/mapimages/alertimage/geofenceentry.png' },
    'geofence exit': { name: 'alert-geofence-exit', path: 'assets/images/mapimages/alertimage/geofenceexit.png' },
    'panic': { name: 'alert-panic', path: 'assets/images/mapimages/alertimage/emergency.png' },
    'low battery': { name: 'alert-low-battery', path: 'assets/images/mapimages/alertimage/batterylow.png' },
    'route deviation': { name: 'alert-route-deviation', path: 'assets/images/mapimages/alertimage/routedev3.png' },
    'tamper': { name: 'alert-tamper', path: 'assets/images/mapimages/alertimage/tamper.png' },
    'tilt': { name: 'alert-tilt', path: 'assets/images/mapimages/alertimage/tilt.png' },
    'default': { name: 'alert-default', path: 'assets/images/mapimages/alertimage/others.png' }
  };

  constructor(
    private alertService: AlertService,
    private vehicleService: VehicleService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    public toastService: ToastService,
    public router: Router
  ) { 
    this.toastService.pageName = 'SOS Alerts Details';
  }

  ngOnInit() {
    const lastElement = this.router.url.split('/').filter(x => x).pop();
    // this.pageName
    this.BindTable();
    this.refreshInterval = setInterval(() => {
      this.BindTable();
    }, 180000);

    // Porting AngularJS popup tab functions to window for HTML popups
    (window as any).VehicleDetails = this.VehicleDetails.bind(this);
    (window as any).DeviceDetails = this.DeviceDetails.bind(this);
    (window as any).AlertDetails = this.AlertDetails.bind(this);

    // Expose component instance to window for side panel tab functions
    (window as any).sosAlertComponent = this;

    // Expose component instance to window for popup button callbacks
    (window as any).alertComponentInstance = this;

    // Initialize poiData with default date/time values
    this.poiData = {
      historyDate: dayjs(),
      fromTime: dayjs().startOf('day').toDate(),
      toTime: dayjs().endOf('day').toDate(),
      vehicleno: ''
    };

  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.select2) {
        $('.searchable').select2();
      }
    }, 200);
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.isComponentAlive = false;
    if (this.singleAlertLiveInterval) {
      clearInterval(this.singleAlertLiveInterval);
    }
    this.clearAllLayers();
    this.mapGeneration++;
    this.modalGeneration++;
    this.emergencyDetailsSub?.unsubscribe();
    this.policeStationsSub?.unsubscribe();
    this.clearPoliceStationMarkers();
    if (this.singleAlertMap && this.singleAlertMap !== this.map) this.disposeLeafletMap(this.singleAlertMap);
    if (this.map) this.disposeLeafletMap(this.map);
    this.map = this.singleAlertMap = null;
    if ((window as any).sosAlertComponent === this) {
      (window as any).sosAlertComponent = null;
      delete (window as any).VehicleDetails;
      delete (window as any).DeviceDetails;
      delete (window as any).AlertDetails;
    }

    // Remove window reference to prevent memory leaks
    if ((window as any).alertComponentInstance === this) {
      (window as any).alertComponentInstance = null;
    }

    try { if (this.detailsAPI) { this.detailsAPI.unsubscribe() } } catch (error) { }
  }
  detailsAPI!: Subscription;
  BindTable() {
    try { if (this.detailsAPI) { this.detailsAPI.unsubscribe() } } catch (error) { }
    this.loading = true;
    const request = {
      param1: (this.searchText || '').trim(),//searchby
      param2: "LiveEmergencyVehicles",//searchtype -- DownVehicle, LiveEmergencyVehicles,NotConnected,LiveVehicles,   Connected,NeverConnected,GetStatus
      param3: "",//values
      param4: this.currentPage.toString(),
      param5: this.pageSize.toString(),
      param6: "",//state
      param7: "",//discrict
      param8: "",//searchby(connected/not connected/etc...)
      param9: "",//filterbyvehicleclass
      param10: "",//fromdate
      param11: "",//todate
      param12: "",//fromtime
      param13: "",//totime
      param14: this.vehicleType ? this.vehicleType : 'NEW',//vehicletype -> new/old
      param15: "",//gpsfilter -> valid/invalid'
      pdfexcel: "",
      type: ''
    };

    this.detailsAPI = this.alertService.getLiveEmergencyVehiclesCompliance(request, true).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.alertDetails = response.entity.listData || [];
          this.totalCount = response.entity.param1 || 0;
          if (this.alertDetails.length < this.pageSize) {
            this.pageCount = this.alertDetails.length;
          } else {
            this.pageCount = this.pageSize;
          }
        } else {
          this.alertDetails = [];
          this.totalCount = 0;
          this.pageCount = 0;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.alertDetails = [];
        this.totalCount = 0;
        this.pageCount = 0;
        this.errorMessage = 'Error fetching SOS alerts.';
        this.cdr.detectChanges();
      }
    });
  }

  setView(type: string) {
    this.vehicleType = type;
    this.BindTable();

  }

  getSearchDetails() {
    this.currentPage = 1;
    this.BindTable();
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  reloadData() {
    this.searchText = '';
    this.currentPage = 1;
    this.pageSize = 20;
    this.BindTable();
    this.refreshInterval = setInterval(() => {
      this.BindTable();
    }, 180000);
  }

  sort(key: string) {
    this.sortKey = key;
    this.reverse = !this.reverse;
    this.alertDetails.sort((a, b) => {
      const valA = (a as any)[key];
      const valB = (b as any)[key];
      let comparison = 0;
      if (valA > valB) {
        comparison = 1;
      } else if (valA < valB) {
        comparison = -1;
      }
      return this.reverse ? comparison * -1 : comparison;
    });
  }
  downloadPDFExcel(event: any) {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    let docType = event.target.value;
    this.loading = true;
    const request = {
      param1: (this.searchText || '').trim(),//searchby
      param2: "LiveEmergencyVehicles",//searchtype -- DownVehicle, LiveEmergencyVehicles,NotConnected,LiveVehicles,   Connected,NeverConnected,GetStatus
      param3: "",//values
      param4: this.currentPage.toString(),
      param5: this.pageSize.toString(),
      param6: "",//state
      param7: "",//discrict
      param8: "",//searchby(connected/not connected/etc...)
      param9: "",//filterbyvehicleclass
      param10: "",//fromdate
      param11: "",//todate
      param12: "",//fromtime
      param13: "",//totime
      param14: this.vehicleType ? this.vehicleType : 'NEW',//vehicletype -> new/old
      param15: "",//gpsfilter -> valid/invalid'
      pdfexcel: docType,
      type: 'sosalert'
    };

    this.alertService.getLiveEmergencyVehiclesCompliance(request, true).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response.statuscode == 200) {
          this.toastService.commonFileDownload(response.entity);

        } else {
          this.toastService.show(response.entity, 'error')
        }
        this.refreshInterval = setInterval(() => {
          this.BindTable();
        }, 180000);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.alertDetails = [];
        this.totalCount = 0;
        this.pageCount = 0;
        this.errorMessage = 'Error fetching SOS alerts.';
        this.cdr.detectChanges();
      }
    });
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.BindTable();
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  onPageSizeChange(event: Event) {
    const newSize = (event.target as HTMLSelectElement).value;
    this.pageSize = newSize === 'All' ? this.totalCount : Number(newSize);
    this.currentPage = 1;
    this.BindTable();
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  getTotalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  getPageNumbers(): (number | string)[] {
    const totalPages = this.getTotalPages();
    const currentPage = this.currentPage;
    const pages: (number | string)[] = [];

    if (totalPages <= 10) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    } else if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    } else {
      return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
    }
  }

  getPaginatedData(): any[] {
    return this.alertDetails;
  }

  // Tab switching logic for Leaflet Popups (AngularJS port)
  VehicleDetails() {
    $('#vehicleContent').show(); $('#deviceContent, #alertContent').hide();
    $('#vehicleAct').addClass('active').css('background', '#ddd');
    $('#deviceAct, #alertAct').removeClass('active').css('background', 'transparent');
  }

  DeviceDetails() {
    $('#deviceContent').show(); $('#vehicleContent, #alertContent').hide();
    $('#deviceAct').addClass('active').css('background', '#ddd');
    $('#vehicleAct, #alertAct').removeClass('active').css('background', 'transparent');
  }

  AlertDetails() {
    $('#alertContent').show(); $('#vehicleContent, #deviceContent').hide();
    $('#alertAct').addClass('active').css('background', '#ddd');
    $('#vehicleAct, #deviceAct').removeClass('active').css('background', 'transparent');
  }

  alertmapopen(data: any) {
    // Using IMEI (param4) is generally more unique for tracking, falling back to vehicle no
    const vehicleNo = data.param4 || data.param11 || data.param10;
    $('#openMapViewModalPanic').modal('show');
    this.OpenModelPanic(vehicleNo);
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
  closeMapModal() {
    this.loading = false;
    $('#openMapViewModalPanic').modal('hide');
    this.showMapModal = false;
    this.mapGeneration++;
    this.emergencyDetailsSub?.unsubscribe();
    this.clearAllLayers();
    this.clearPoliceStationMarkers();
    this.policeStationsSub?.unsubscribe();
    if (this.singleAlertMap === this.map) this.singleAlertMap = null;
    if (this.map) this.disposeLeafletMap(this.map);
    this.map = null;
    this.isVehiclePlotted = false;
    this.isInfoPanelVisible = false;
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    this.refreshInterval = setInterval(() => {
      this.BindTable();
    }, 180000);
  }

  OpenModelPanic(vehicleNo: string) {
    const generation = ++this.mapGeneration;
    this.showMapModal = true;
    this.emergencyDetailsSub?.unsubscribe();
    setTimeout(() => {
      if (!this.isComponentAlive || !this.showMapModal || generation !== this.mapGeneration) return;
      const mapContainer = document.getElementById('map1');
      if (!mapContainer) return;
      this.clearAllLayers();
      this.clearPoliceStationMarkers();
      if (this.singleAlertMap && this.singleAlertMap !== this.map) this.disposeLeafletMap(this.singleAlertMap);
      if (this.map) this.disposeLeafletMap(this.map);
      this.map = this.createLeafletMap('map1', [28.7041, 77.1025], 4);
      this.mainBasemap = createLeafletBasemap(this.currentStyle).addTo(this.map);
      this.singleAlertMap = this.map;
      this.attachTrackingLayers(this.map);
      if (this.showPoliceStations) this.loadPoliceStations();
      // Fetch details for the specific vehicle using the new compliance API
      this.emergencyDetailsSub = this.alertService.getLiveEmergencyVehiclesCompliance({
        param1: vehicleNo || (this.searchText || '').trim(),//searchby
        param2: "LiveEmergencyVehicles",//searchtype -- DownVehicle, LiveEmergencyVehicles,NotConnected,LiveVehicles,   Connected,NeverConnected,GetStatus
        param3: "",//values
        param4: '1',
        param5: '1',
        param6: "",//state
        param7: "",//discrict
        param8: "",//searchby(connected/not connected/etc...)
        param9: "",//filterbyvehicleclass
        param10: "",//fromdate
        param11: "",//todate
        param12: "",//fromtime
        param13: "",//totime
        param14: this.vehicleType ? this.vehicleType : 'NEW',//vehicletype -> new/old
        param15: "",//gpsfilter -> valid/invalid'
        pdfexcel: "",
        type: ''
      }, false).subscribe({
        next: (response: any) => {
          if (!this.isComponentAlive || !this.showMapModal || generation !== this.mapGeneration) return;
          if (response?.entity?.listData?.length > 0) {
            $('#openMapViewModalPanic').modal({ backdrop: 'static', keyboard: false, show: true });
            const alertData = response.entity.listData[0];
            this.plotEmergencyAlert(alertData);
            // Resize map after modal is shown to ensure proper dimensions
            setTimeout(() => {
              if (this.map) {
                this.map.invalidateSize({ pan: false });
              }
            }, 200);
          } else {
            this.errorMessage = "No Data Found for this vehicle's emergency alert.";
          }
        },
        error: () => this.errorMessage = "Error fetching emergency details."
      });
    }, 500);
  }

  private createLeafletMap(container: string, center: L.LatLngExpression, zoom: number): L.Map {
    const map = L.map(container, { center, zoom, minZoom: 4, maxZoom: 18, attributionControl: false });
    const poweredBy = new L.Control({ position: 'bottomright' });
    poweredBy.onAdd = () => {
      const el = L.DomUtil.create('div', 'leaflet-powered-by-dimts');
      el.textContent = 'Power by DIMTS';
      L.DomEvent.disableClickPropagation(el);
      return el;
    };
    poweredBy.addTo(map);

    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    observer.observe(map.getContainer());
    this.mapResizeObservers.set(map, observer);
    return map;
  }

  private disposeLeafletMap(map: L.Map): void {
    this.mapResizeObservers.get(map)?.disconnect();
    this.mapResizeObservers.delete(map);
    map.remove();
  }

  private createLeafletMarker(element: HTMLElement, coordinates: [number, number], rotation = 0, anchor?: L.PointExpression): L.Marker {
    const width = parseInt(element.style.width) || 28;
    const height = parseInt(element.style.height) || 28;
    const marker = L.marker([coordinates[1], coordinates[0]], {
      icon: L.divIcon({ className: 'today-alert-marker', html: element, iconSize: [width, height], iconAnchor: anchor || [width / 2, height / 2] })
    });
    marker.on('add', () => this.rotateLeafletMarker(marker, rotation));
    return marker;
  }

  private rotateLeafletMarker(marker: L.Marker, rotation: number): void {
    const content = marker.getElement()?.firstElementChild as HTMLElement | null;
    if (content) content.style.transform = `rotate(${rotation}deg)`;
  }

  private attachTrackingLayers(map: L.Map): void {
    this.singleHistoryLayers.addTo(map);
    this.historyAlertLayers.addTo(map);
    this.historyArrowLayers.addTo(map);
    this.singleLiveLayers.addTo(map);
  }

  private isValidCoordinates(coordinates: [number, number]): boolean {
    const [lng, lat] = coordinates;
    return Number.isFinite(lng) && Number.isFinite(lat) && Math.abs(lng) <= 180 && Math.abs(lat) <= 90 && !(lng === 0 && lat === 0);
  }

  private loadPoliceStations(): void {
    this.clearPoliceStationMarkers();
    this.policeStationsSub?.unsubscribe();
    this.policeStationsSub = this.alertService.getPoliceStationDetails({ param1: '', param2: 1, param3: 20 }).subscribe({
      next: (response: any) => {
        const stations = response?.entity?.listData;
        const targetMap = this.singleAlertMap || this.map;
        if (!this.isComponentAlive || !this.showPoliceStations || !targetMap || !Array.isArray(stations)) return;
        stations.forEach((station: any) => {
          const lat = Number(station?.param9); const lng = Number(station?.param10);
          if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return;
          const el = document.createElement('div');
          el.className = 'police-station-map-marker';
          el.style.width = '34px'; el.style.height = '34px'; el.style.cursor = 'pointer';
          el.style.background = "url('assets/mapimages/police-station.png') center/contain no-repeat";
          this.policeStationMarkers.push(this.createLeafletMarker(el, [lng, lat])
            .bindPopup(this.createPoliceStationPopup(station, lat, lng), { className: 'police-station-popup', maxWidth: 235 }).addTo(targetMap));
        });
      },
      error: () => { /* Alert map remains usable if police station API fails. */ }
    });
  }

  private createPoliceStationPopup(station: any, lat: number, lng: number): HTMLElement {
    const root = document.createElement('div'); root.className = 'police-popup-card';
    const header = document.createElement('div'); header.className = 'police-popup-card__header';
    const image = document.createElement('img'); image.src = 'assets/mapimages/police-station.png'; image.alt = 'Police station';
    const heading = document.createElement('div'); const title = document.createElement('strong'); const type = document.createElement('small');
    title.textContent = String(station?.param2 || 'Police Station'); type.textContent = String(station?.param3 || 'Police Station');
    heading.append(title, type); header.append(image, heading); root.append(header);
    const body = document.createElement('div'); body.className = 'police-popup-card__body';
    [['District', station?.param7 || '-'], ['State', station?.param8 || '-'], ['Location', `${lat.toFixed(5)}, ${lng.toFixed(5)}`]].forEach(([label, value]) => {
      const row=document.createElement('div'),key=document.createElement('span'),val=document.createElement('b');key.textContent=String(label);val.textContent=String(value);row.append(key,val);body.append(row);
    });
    const link = document.createElement('a'); link.target = '_blank'; link.rel = 'noopener noreferrer';
    const stationName = String(station?.param2 || 'Police Station');
    const googleMapsQuery = `${stationName} Police Station, ${lat},${lng}`;
    link.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(googleMapsQuery)}`;
    link.title = `Show ${stationName} on Google Maps`;
    link.textContent = 'Locate Police Station'; body.append(link); root.append(body); return root;
  }

  private clearPoliceStationMarkers(): void {
    this.policeStationMarkers.forEach(marker => marker.remove());
    this.policeStationMarkers = [];
  }

  toggleLayers(): void {
    this.isLayersVisible = !this.isLayersVisible;
  }

  togglePoliceStations(): void {
    if (!this.showPoliceStations) {
      this.policeStationsSub?.unsubscribe();
      this.clearPoliceStationMarkers();
    } else if (this.singleAlertMap || this.map) this.loadPoliceStations();
  }

  singleAlertStyle = 'streets-v11';

  changeSingleAlertMapStyle(style: string): void {
    this.singleAlertStyle = style;
    if (!this.singleAlertMap) return;
    if (this.singleAlertMap === this.map) { this.changeMapStyle(style); return; }
    const layer = createLeafletBasemap(style).addTo(this.singleAlertMap);
    this.singleBasemap?.remove();
    this.singleBasemap = layer;
  }

  changeMapStyle(style: string): void {
    this.currentStyle = style;
    if (!this.map) return;
    const layer = createLeafletBasemap(style).addTo(this.map);
    this.mainBasemap?.remove();
    this.mainBasemap = layer;
  }


  plotEmergencyAlert(AlertData: any) {
    this.selectedEmergency = AlertData;
    this.isInfoPanelVisible = true;
    this.isInfoPanelCollapsed = false;

    // FIX: Use fallback coordinates. SOS JSON uses param25/26, Live Track uses param38/39.
    const lat = Number(AlertData.param25 || AlertData.param38 || AlertData.param53 || 0);
    const lng = Number(AlertData.param26 || AlertData.param39 || AlertData.param54 || 0);
    const latlon: [number, number] = [lng, lat]; // [Lng, Lat]

    const gpsStatus = (AlertData.param28 === '1' || AlertData.param28 === 'Valid') ? 'Valid' : 'Invalid';
    const gpsColor = gpsStatus === 'Valid' ? '#28a745' : '#dc3545';
    const ignStatus = (AlertData.param29 === '1' || AlertData.param29 === 'ON' || AlertData.param29 === 'On') ? 'On' : 'Off';
    const ignColor = ignStatus === 'On' ? '#28a745' : '#dc3545';

    // Initialize the info panel with default SOS alert data from the selected record
    this.singleAlertInfoPanelData = {
      type: 'sos',
      vehicleno: AlertData.param10 || AlertData.param13,
      speed: AlertData.param27,
      pollingdate: AlertData.param12 + (AlertData.param24 ? ' ' + AlertData.param24 : ''),
      ignition: ignStatus,
      latitude: lat,
      longitude: lng,
      gpsStatus: gpsStatus,
      customerName: AlertData.param18 || 'N/A',
      serialNo: AlertData.param5 || 'N/A',
      imeiNo: AlertData.param4 || 'N/A',
      vendor: AlertData.param9 || 'N/A',
      iccidno: AlertData.param6 || 'N/A',
    };
    this.isVehiclePlotted = true;

    // Prepare properties for the popup action buttons
    const vehicleNoDisplay = AlertData.param10; // Use param13 for vehicle number display
    const imei = AlertData.param4;
    const vehicleIdForTracking = AlertData.param2; // Use param2 for the actual vehicle ID expected by getLiveTrack
    const props = {
      alertname: 'Emergency',
      latitude: lat,
      longitude: lng,
      vehicleno: vehicleNoDisplay,
      imeino: imei,
      eventtime: AlertData.param12
    };

    const shodata = `
      <div class="sos-premium-popup">
        <div class="popup-header">
          <span class="vehicle-no">${AlertData.param10}</span>
          <span class="badge-sos">SOS ACTIVE</span> <!-- Use param13 for vehicle number -->
        </div>
        <div class="popup-body">
          <div class="info-grid">
            <div class="item"><span>Speed</span><strong>${AlertData.param27} <small>km/h</small></strong></div>
            <div class="item"><span>Ignition</span><strong style="color:${ignColor}">${ignStatus}</strong></div>
          </div>
          <div class="info-list">
            <div class="line"><i class="fa fa-calendar"></i> ${AlertData.param12}</div>
            <div class="line"><i class="fa fa-map-marker"></i> ${latlon[1].toFixed(5)}, ${latlon[0].toFixed(5)}</div>
          </div>
        </div>
        <!-- Action Buttons Footer -->
         <div style="padding: 8px 12px 12px; background: #f8fafc; border-top: 1px solid #edf2f7; display: flex; gap: 8px;">
            <button onclick="window.alertComponentInstance.openSingleAlertMapWithData('${vehicleIdForTracking}', ${lng}, ${lat}, '${AlertData.param10}')" 
              style="flex: 1; background: #fff; border: 1px solid #0b58b9; color: #0b58b9; padding: 6px 0; border-radius: 4px; font-size: 10px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 4px;"> <!-- Use param13 for vehicle number -->
              <i class="fa fa-history"></i> History
            </button>
            <button onclick="window.alertComponentInstance.startLiveTrackingFromPopup('${vehicleIdForTracking}', ${lng}, ${lat}, '${vehicleNoDisplay}')" 
              style="flex: 1; background: #0b58b9; border: 1px solid #0b58b9; color: white; padding: 6px 0; border-radius: 4px; font-size: 10px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 4px;">
              <i class="fa fa-play"></i> Live Track
            </button>
          </div>
      </div>`;


    const el = document.createElement('div');
    el.className = 'sos-panic-marker';
    el.style.backgroundImage = 'url(assets/images/mapimages/alertimage/panic.png)';
    el.style.backgroundSize = 'contain';
    el.style.width = '25px';
    el.style.height = '25px';
    el.style.cursor = 'pointer';
    el.style.filter = 'drop-shadow(0 0 8px rgba(229, 57, 53, 0.6))';

    if (this.emergencyMarker) this.emergencyMarker.remove();

    if (!this.map || !this.isValidCoordinates(latlon)) { this.errorMessage = 'Invalid emergency coordinates'; return; }
    this.emergencyMarker = this.createLeafletMarker(el, latlon).bindPopup(shodata, { maxWidth: 320 }).addTo(this.map);
    this.map.flyTo([lat, lng], 14);

    this.cdr.detectChanges();
  }

  openRawStringModal(rawString: string) {
    this.pctstr = rawString || 'NA';
    this.showRawStringModal = true;
    this.cdr.detectChanges();
    $("#installcust").modal('show');
  }

  toggleInfoPanel() {
    this.isInfoPanelCollapsed = !this.isInfoPanelCollapsed;
  }

  closeInfoPanel() {
    this.isInfoPanelVisible = false;
    this.selectedEmergency = null;
  }

  setActivePanelTab(tab: 'vehicle' | 'device' | 'alert') {
    this.activePanelTab = tab;
  }

  openGoogleMaps(lat: any, lon: any) {
    const url = `https://www.google.com/maps?q=${Number(lat).toFixed(5)},${Number(lon).toFixed(5)}`;
    window.open(url, '_blank');
  }

  // ==========================================
  // Live Tracking for Single Alert Map
  // ==========================================

  startSingleAlertLiveTracking(vehicleId: string, initialCoords: [number, number]) { // vehicleId is now AlertData.param2
    this.clearSingleAlertHistoryLayers();
    this.singleAlertLiveVehicleId = vehicleId;
    this.clearSingleAlertLiveTrackingLayers(); // Clear previous live tracking elements on this map
    const generation = this.trackingGeneration;
    this.singleAlertLivePathCoordinates = [initialCoords]; // Start path from alert location

    // Clear previous interval before starting a new one
    if (this.singleAlertLiveInterval) {
      clearInterval(this.singleAlertLiveInterval);
      this.singleAlertLiveInterval = null;
    }

    const fetchSingleAlertLive = (showLoader: boolean = false) => {
      this.liveTrackingSub?.unsubscribe();
      this.liveTrackingSub = this.vehicleService.getLiveTrack(this.singleAlertLiveVehicleId, showLoader).subscribe({
        next: (response: any) => {
          if (!this.isComponentAlive || generation !== this.trackingGeneration || !this.singleAlertMap) return;
          if (!response.entity || response.entity.length === 0) return;

          this.singleAlertLiveData = response.entity[0];
          const coords = [Number(this.singleAlertLiveData.param39), Number(this.singleAlertLiveData.param38)];
          if (!this.isValidCoordinates(coords as [number, number])) return;
          const rotation = Number(this.singleAlertLiveData.param43) || 0;

          if (!this.singleAlertLiveMarker) {
            // Initial marker creation
            const el = document.createElement('div');
            el.className = 'single-alert-live-marker';
            el.style.backgroundImage = 'url(assets/mapimages/car/green.png)'; // Use a car icon
            el.style.width = '20px';
            el.style.height = '28px';
            el.style.backgroundSize = 'contain';
            el.style.backgroundRepeat = 'no-repeat';
            el.style.backgroundPosition = 'center';

            this.singleAlertLiveMarker = this.createLeafletMarker(el, coords as [number, number], rotation).addTo(this.singleAlertMap!);

            // Add fetched point to path if it has moved from the initial alert location
            if (coords[0] !== initialCoords[0] || coords[1] !== initialCoords[1]) {
              this.singleAlertLivePathCoordinates.push(coords as [number, number]);
            }

            this.drawSingleAlertLiveTrail(this.singleAlertLivePathCoordinates);
            this.singleAlertMap!.flyTo([coords[1], coords[0]], 14); // Fly to vehicle
          } else {
            this.animateSingleAlertMarkerTo(coords as [number, number], rotation);
          }

          // Update the info panel data
          this.singleAlertInfoPanelData = {
            type: 'live',
            vehicleno: this.singleAlertLiveData.param13,
            speed: this.singleAlertLiveData.param40,
            pollingdate: this.singleAlertLiveData.param35,
            ignition: this.singleAlertLiveData.param45 === '1' ? 'On' : 'Off',
            latitude: Number(this.singleAlertLiveData.param38),
            longitude: Number(this.singleAlertLiveData.param39),
            gpsStatus: this.singleAlertLiveData.param41 === '1' ? 'Active' : 'Inactive',
            customerName: this.singleAlertLiveData.param25,
            serialNo: this.singleAlertLiveData.param5,
            imeiNo: this.singleAlertLiveData.param4,
            vendor: this.singleAlertLiveData.param9,
            iccidno: this.singleAlertLiveData.param6,
          };
          this.isVehiclePlotted = true; // Show the panel now
          this.cdr.detectChanges(); // Trigger change detection for the info panel

          // ✅ Only set interval after successful response
          if (this.isComponentAlive && !this.singleAlertLiveInterval) {
            this.singleAlertLiveInterval = setInterval(() => {
              fetchSingleAlertLive(false); // Call again without loader
            }, 10000);
          }
        },
        error: (err: any) => {
          if (!this.isComponentAlive || generation !== this.trackingGeneration || !this.singleAlertMap) return;
          console.error('Error fetching single alert live track', err);
          // ✅ Set interval even on error for retry
          if (this.isComponentAlive && !this.singleAlertLiveInterval) {
            this.singleAlertLiveInterval = setInterval(() => {
              fetchSingleAlertLive(false); // Retry without loader
            }, 10000);
          }
        }
      });
    };

    fetchSingleAlertLive(true); // Make the first call with loader
  }

  animateSingleAlertMarkerTo(targetLngLat: [number, number], targetRotation: number) {
    if (!this.singleAlertLiveMarker) return;

    const startLngLat = this.singleAlertLiveMarker.getLatLng();
    const startLng = startLngLat.lng;
    const startLat = startLngLat.lat;
    const startTime = performance.now();
    const duration = 10000; // 10 seconds to match polling interval for smooth movement
    if (startLng === targetLngLat[0] && startLat === targetLngLat[1]) return;
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const currentLng = startLng + (targetLngLat[0] - startLng) * progress;
      const currentLat = startLat + (targetLngLat[1] - startLat) * progress;

      if (this.singleAlertLiveMarker) {
        this.singleAlertLiveMarker.setLatLng([currentLat, currentLng]);
        this.rotateLeafletMarker(this.singleAlertLiveMarker, targetRotation);
      }

      const currentPath = [...this.singleAlertLivePathCoordinates, [currentLng, currentLat]];
      this.drawSingleAlertLiveTrail(currentPath);

      if (progress < 1) {
        this.singleAlertAnimationFrameId = requestAnimationFrame(animate);
      } else {
        this.singleAlertAnimationFrameId = null;
        this.singleAlertLivePathCoordinates.push(targetLngLat);
        this.drawSingleAlertLiveTrail(this.singleAlertLivePathCoordinates);
      }
    };

    if (this.singleAlertAnimationFrameId) {
      cancelAnimationFrame(this.singleAlertAnimationFrameId);
    }
    this.singleAlertAnimationFrameId = requestAnimationFrame(animate);
  }

  drawSingleAlertLiveTrail(coordinates: any[]) {
    if (!this.singleAlertMap || coordinates.length < 2) return;
    const points: L.LatLngTuple[] = coordinates.map(point => [point[1], point[0]]);
    if (this.singleLiveRoute) this.singleLiveRoute.setLatLngs(points);
    else this.singleLiveRoute = L.polyline(points, { color: '#009C4E', weight: 4 }).addTo(this.singleLiveLayers);
    this.updateRouteArrows(points, this.singleLiveLayers, true);
  }

  private updateRouteArrows(points: L.LatLngTuple[], group: L.LayerGroup, live = false): void {
    group.eachLayer(layer => { if (layer instanceof L.Marker) group.removeLayer(layer); });
    if (!this.singleAlertMap) return;
    let spacing = 0;
    for (let i = 1; i < points.length; i++) {
      const previous = this.singleAlertMap.latLngToLayerPoint(points[i - 1]);
      const current = this.singleAlertMap.latLngToLayerPoint(points[i]);
      spacing += previous.distanceTo(current);
      if (spacing < (live ? 50 : 70)) continue;
      spacing = 0;
      const bearing = turf.bearing(turf.point([points[i - 1][1], points[i - 1][0]]), turf.point([points[i][1], points[i][0]]));
      L.marker(points[i], { interactive: false, icon: L.divIcon({ className: 'today-route-arrow', html: `<span style="transform:rotate(${bearing - 90}deg)">➤</span>`, iconSize: [16, 16], iconAnchor: [8, 8] }) }).addTo(group);
    }
  }




  clearSingleAlertLiveTrackingLayers() {
    if (this.singleAlertLiveInterval) {
      clearInterval(this.singleAlertLiveInterval);
      this.singleAlertLiveInterval = null;
    }
    if (this.singleAlertAnimationFrameId) {
      cancelAnimationFrame(this.singleAlertAnimationFrameId);
      this.singleAlertAnimationFrameId = null;
    }
    if (this.singleAlertLiveMarker) {
      this.singleAlertLiveMarker.remove();
      this.singleAlertLiveMarker = null;
    }

    this.trackingGeneration++;
    this.liveTrackingSub?.unsubscribe();
    this.singleLiveLayers.clearLayers();
    this.singleLiveRoute = undefined;
    this.singleAlertLivePathCoordinates = [];
    this.singleAlertInfoPanelData = {}; // Clear info panel data
  }

  backToLiveTrack() {
    this.singleAlertModalMode = 'live';
    this.clearSingleAlertHistoryLayers();
    if (this.selectedSingleAlert) {
      const vehicleno = this.selectedSingleAlert.vehicleno;
      const lng = Number(this.selectedSingleAlert.longitude || this.selectedSingleAlert.param26 || this.selectedSingleAlert.param7);
      const lat = Number(this.selectedSingleAlert.latitude || this.selectedSingleAlert.param25 || this.selectedSingleAlert.param6);
      this.startSingleAlertLiveTracking(this.selectedSingleAlert.param2 || this.selectedSingleAlert.imeino || vehicleno, [lng, lat]);
    }
  }

  pauseHistory() {
    this.isHistoryPlaying = false;
    if (this.historyTimer) {
      clearInterval(this.historyTimer);
      this.historyTimer = null;
    }
  }

  onSpeedChange(event: any) {
    this.speedSliderValue = Number(event.target.value);
    if (this.isHistoryPlaying) {
      this.pauseHistory();
      this.playHistory();
    }
  }

  stopHistory() {
    this.pauseHistory();
    this.historyPlaybackIndex = 0;
    if (this.historyDataList.length > 0) {
      this.plotHistoryMarker(this.historyDataList[0]);
    }
  }

  restartHistory() {
    this.stopHistory();
    this.playHistory();
  }

  playHistory() {
    if (this.isHistoryPlaying || !this.singleAlertMap || this.historyDataList.length === 0) return;
    if (this.historyPlaybackIndex >= this.historyDataList.length) this.historyPlaybackIndex = 0;
    this.isHistoryPlaying = true;

    const playNext = () => {
      if (this.historyPlaybackIndex < this.historyDataList.length) {
        this.plotHistoryMarker(this.historyDataList[this.historyPlaybackIndex]);
        this.historyPlaybackIndex++;
      } else {
        this.pauseHistory();
      }
    };

    const interval = Math.max(100, 1000 / this.speedSliderValue);
    this.historyTimer = setInterval(playNext, interval);
  }

  showHistoryTrack(vehicleno: any) {
    this.historyLoading = true;
    this.clearSingleAlertHistoryLayers();
    this.clearSingleAlertLiveTrackingLayers();
    this.singleAlertModalMode = 'history';
    this.historyPlaybackIndex = 0;

    const req = {
      param1: vehicleno,
      param2: this.poiData.historyDate ? dayjs(this.poiData.historyDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
      param3: this.poiData.fromTime ? dayjs(this.poiData.fromTime).format('HH:mm') : '00:00',
      param4: dayjs(this.poiData.toTime).format('HH:mm')
    };

    const targetMap = this.singleAlertMap;
    this.historyTrackingSub = this.vehicleService.getVehicleHistory(req).subscribe({
      next: (res: any) => {
        if (!this.isComponentAlive || !targetMap || this.singleAlertMap !== targetMap) return;
        this.historyLoading = false;
        if (res.status && res.entity && res.entity.listData && res.entity.listData.length > 0) {
          this.historyDataList = res.entity.listData.filter((item: any) => this.isValidCoordinates(this.getCoordinates(item)));
          this.historyPlaybackIndex = 0;
          this.displayHistory(res.entity, vehicleno);
        } else {
          this.toastService.show('No history data found', 'error');
        }
      },
      error: () => {
        this.historyLoading = false;
        this.toastService.show('Error loading history data', 'error');
      }
    });
  }

  getCoordinates(item: any): [number, number] {
    return [Number(item.param5 || 0), Number(item.param4 || 0)];
  }

  getHeading(item: any): number {
    return Number(item.param8) || 0;
  }

  createMarkerElement() {
    const el = document.createElement('div');
    el.className = 'history-marker';
    el.style.backgroundImage = 'url(assets/mapimages/car/green.png)';
    el.style.width = '20px';
    el.style.height = '28px';
    el.style.backgroundSize = 'contain';
    el.style.backgroundRepeat = 'no-repeat';
    el.style.backgroundPosition = 'center';
    return el;
  }

  updateHistoryPanel(props: any) {
    this.poiData = {
      ...this.poiData,
      ...props,
      type: 'history',
      vehicleno: props.vehicleno,
      speed: props.speed,
      pollingdate: props.time,
      ignition: props.ignition,
      latitude: Number(props.lat),
      longitude: Number(props.lng)
    };
    this.isSingleInfoCollapsed = false;
    this.cdr.detectChanges();
  }

  displayHistory(historyData: any, vehicleNo: string) {
    if (!this.singleAlertMap) {
      this.errorMessage = 'Single alert map not initialized';
      return;
    }

    // Prepare point features for ignition status plotting
    const pointFeatures = this.historyDataList.map((item: any, index: number) => {
      const [lng, lat] = this.getCoordinates(item);
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lng, lat] },
        properties: {
          index: index,
          icon: item.param12 === '1' ? 'ign-on' : 'ign-off',
          vehicleno: vehicleNo || item.param15 || 'Vehicle',
          speed: item.speed || item.param9 || item.param6 || 0,
          time: item.param3 || 'N/A',
          ignition: item.param12 === '1' ? 'On' : 'Off',
          lat: lat,
          lng: lng
        }
      };
    });

    // Extract alert features from historyDataList
    const historyAlertFeatures: any[] = [];
    this.historyDataList.forEach((item: any) => {
      const alertId = item.param12; // Assuming param12 indicates an alert type or status
      const alertName = item.param13; // Assuming param13 contains the alert name

      // Define what constitutes an "alert" based on your data.
      // For example, if param12 is not '0' or '1' (non-alert states) and alertName exists.
      if (alertId && alertId !== '0' && alertId !== '1' && alertName) {
        const lat = Number(item.param4); // Assuming param4 is latitude
        const lng = Number(item.param5); // Assuming param5 is longitude

        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
          historyAlertFeatures.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [lng, lat] },
            properties: {
              alertName: alertName,
              time: item.param3, // Assuming param3 is time
              icon: this.getAlertIconName(alertName) // Use the existing helper to get the icon name
            }
          });
        }
      }
    });

    this.singleAlertMap.invalidateSize({ pan: false });

    let coordinates: any[] = [];
    let routeGeoJson: any;

    // 1. Attempt to parse GeoJSON from param1 if it looks like a JSON string
    if (historyData.param1 && typeof historyData.param1 === 'string' && historyData.param1.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(historyData.param1);
        if (parsed.geometry && Array.isArray(parsed.geometry.coordinates)) {
          routeGeoJson = parsed;
          coordinates = parsed.geometry.coordinates;
        } else if (parsed.type === 'FeatureCollection' && parsed.features?.[0]?.geometry) {
          routeGeoJson = parsed.features[0];
          coordinates = routeGeoJson.geometry.coordinates;
        }
      } catch (e) {
        this.errorMessage = 'Failed to parse param1 as JSON';
        coordinates = [];
      }
    }

    // 2. Fallback: Build route from historyDataList
    if ((!coordinates || coordinates.length === 0) && this.historyDataList && this.historyDataList.length > 0) {
      coordinates = this.historyDataList.map(item => this.getCoordinates(item));
      routeGeoJson = {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: coordinates },
        properties: {}
      };
    }

    if (this.historyDataList && this.historyDataList.length > 0) {
      this.isVehiclePlotted = true;
      const startItem = this.historyDataList[0];
      const [lng, lat] = this.getCoordinates(startItem);

      const historyProps = {
        vehicleno: vehicleNo || startItem.param15 || 'Vehicle',
        speed: startItem.speed || Number(startItem.param9) || 0,
        time: startItem.param3 || 'N/A',
        ignition: startItem.param12 === '1' ? 'On' : 'Off',
        lat: lat,
        lng: lng
      };

      this.updateHistoryPanel(historyProps);

      this.singleAlertInfoPanelData = {
        ...this.singleAlertInfoPanelData,
        ...historyProps,
        type: 'history',
        pollingdate: historyProps.time,
        latitude: lat,
        longitude: lng
      };
    }

    this.singleHistoryLayers.clearLayers();
    this.historyAlertLayers.clearLayers();
    this.historyArrowLayers.clearLayers();
    this.historyRoute = undefined;
    pointFeatures.forEach(point => {
      const props = point.properties;
      if (!this.isValidCoordinates([props.lng, props.lat])) return;
      const iconUrl = props.icon === 'ign-on' ? 'assets/images/mapimages/alertimage/ignitionOn.png' : 'assets/images/mapimages/alertimage/ignitionOff.png';
      const marker = L.marker([props.lat, props.lng], { icon: L.icon({ iconUrl, iconSize: [20, 20], iconAnchor: [10, 10] }) })
        .bindPopup(this.getHistoryPopupHTML('Vehicle Status', props), { maxWidth: 320 }).addTo(this.singleHistoryLayers);
      marker.on('click', () => {
        this.historyPlaybackIndex = props.index;
        this.updateHistoryPanel(props);
        this.singleAlertHistoryMarker?.setLatLng([props.lat, props.lng]);
      });
    });
    const validCoordinates: [number, number][] = coordinates.filter((point: any) => Array.isArray(point) && this.isValidCoordinates([Number(point[0]), Number(point[1])]))
      .map((point: any) => [Number(point[0]), Number(point[1])]);
    if (validCoordinates.length) {
      this.drawHistoryRoute(validCoordinates);
      this.singleAlertMap.fitBounds(L.latLngBounds(validCoordinates.map(point => [point[1], point[0]] as L.LatLngTuple)), { padding: [50, 50], maxZoom: 16 });
    }
    this.plotHistoryAlerts(historyAlertFeatures);
    if (this.historyDataList.length) {
      const start = this.historyDataList[0];
      const end = this.historyDataList[this.historyDataList.length - 1];
      this.singleAlertHistoryMarker?.remove();
      this.singleAlertHistoryMarker = this.createLeafletMarker(this.createMarkerElement(), this.getCoordinates(start), this.getHeading(start)).addTo(this.singleAlertMap);
      this.singleAlertHistoryStartMarker?.remove();
      this.singleAlertHistoryEndMarker?.remove();
      this.singleAlertHistoryStartMarker = this.createLeafletMarker(this.createStartEndMarker('start'), this.getCoordinates(start))
        .bindPopup(this.getHistoryPopupHTML('Start Point', start), { className: 'arrow-popup', maxWidth: 320, closeButton: false }).addTo(this.singleAlertMap);
      this.singleAlertHistoryEndMarker = this.createLeafletMarker(this.createStartEndMarker('end'), this.getCoordinates(end))
        .bindPopup(this.getHistoryPopupHTML('End Point', end), { className: 'arrow-popup', maxWidth: 320, closeButton: false }).addTo(this.singleAlertMap);
    }
  }

  plotHistoryAlerts(features: any[]) {
    this.historyAlertLayers.clearLayers();
    if (!this.singleAlertMap) return;
    features.forEach(feature => {
      const [lng, lat] = feature.geometry.coordinates;
      if (!this.isValidCoordinates([lng, lat])) return;
      const props = feature.properties;
      const icon = Object.values(this.alertIconMappings).find(item => item.name === props.icon) || this.alertIconMappings.default;
      const content = document.createElement('div');
      const title = document.createElement('strong'); title.textContent = 'Alert Triggered';
      const type = document.createElement('div'); type.textContent = `Type: ${props.alertName}`;
      const time = document.createElement('div'); time.textContent = `Time: ${props.time}`;
      content.append(title, type, time);
      L.marker([lat, lng], { icon: L.icon({ iconUrl: icon.path, iconSize: [24, 24], iconAnchor: [12, 12] }) })
        .bindPopup(content).addTo(this.historyAlertLayers);
    });
  }

  getAlertIconName(alertName: string): string {
    if (!alertName) {
      return this.alertIconMappings['default'].name;
    }
    const lowerAlertName = alertName.toLowerCase();
    // Check for more specific matches first
    if (lowerAlertName.includes('main battery reconnect')) return this.alertIconMappings['main battery reconnect'].name;
    if (lowerAlertName.includes('power disconnect')) return this.alertIconMappings['power disconnect'].name;

    // General partial matches
    for (const key in this.alertIconMappings) {
      if (key !== 'default' && lowerAlertName.includes(key)) {
        return this.alertIconMappings[key as keyof typeof this.alertIconMappings].name;
      }
    }

    return this.alertIconMappings['default'].name;
  }

  createStartEndMarker(type: 'start' | 'end') {
    const el = document.createElement('div');
    el.style.width = '35px';
    el.style.height = '35px';
    el.style.cursor = 'pointer';
    el.style.zIndex = '0';
    el.title = type === 'start' ? 'Start Point' : 'End Point';
    const img = new Image();
    img.src = type === 'start' ? 'assets/mapimages/startpointroute.png' : 'assets/mapimages/endpointroute.png';
    img.onload = () => {
      el.style.backgroundImage = `url(${img.src})`;
      el.style.backgroundSize = 'contain';
      el.style.backgroundRepeat = 'no-repeat';
      el.style.backgroundPosition = 'center';
    };
    img.onerror = () => {
      el.innerHTML = type === 'start' ? 'S' : 'E';
      el.style.backgroundColor = type === 'start' ? '#28a745' : '#dc3545';
      el.style.color = 'white';
      el.style.borderRadius = '50%';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.fontWeight = 'bold';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    };
    return el;
  }

  getHistoryPopupHTML(title: string, item: any) {
    const ignition = item.ignition || (item.param12 === '1' ? 'On' : 'Off');
    const ignColor = (ignition === 'On' || item.param12 === '1') ? '#28a745' : '#dc3545';

    return `
  <div class="p-2" style="font-size: 11px; border: 1px solid #bcbcbc; color: #333; font-family: sans-serif; min-width: 221px !important; position: relative;">
    <button type="button" onclick="window.alertComponentInstance.singleAlertMap.closePopup()" style="position: absolute; top: 0; right: 5px; border: none; background: none; font-size: 23px; font-weight: bold; color: #dc3545; cursor: pointer; padding: 0; z-index: 10;">&times;</button>
    <div style="background-color: #b4d2c6; font-weight: bold; font-size: 12px; margin-bottom: 5px; color: #000000; border-bottom: 1px solid #eee; padding-bottom: 2px;">${title}</div>
    <div class="row no-gutters mb-1">
      <div class="col-4 text-muted">Vehicle:</div>
      <div class="col-8 fw-bold">${item.vehicleno || item.param15 || 'N/A'}</div>
    </div>
    <div class="row no-gutters mb-1">
      <div class="col-4 text-muted">Speed:</div>
      <div class="col-8">${item.speed || item.param9 || item.param6 || 0} km/hr</div>
    </div>
    <div class="row no-gutters mb-1">
      <div class="col-4 text-muted">Time:</div>
      <div class="col-8">${item.time || item.param3 || 'N/A'}</div>
    </div>
    <div class="row no-gutters mb-1">
      <div class="col-4 text-muted">Ignition:</div>
      <div class="col-8">
        <span style="color: ${ignColor}; font-weight: bold;">${ignition}</span>
      </div>
    </div>
    <div class="row no-gutters mb-1">
      <div class="col-4 text-muted">Loc:</div>
      <div class="col-8">${Number(item.lat || item.param4 || 0).toFixed(5)}, ${Number(item.lng || item.param5 || 0).toFixed(5)}</div>
    </div>
  </div>`;
  }

  drawHistoryRoute(coordinates: any[]) {
    if (!this.singleAlertMap) return;
    const points: L.LatLngTuple[] = coordinates.map(point => [point[1], point[0]]);
    if (this.historyRoute) this.historyRoute.setLatLngs(points);
    else this.historyRoute = L.polyline(points, { color: '#ff4d00', weight: 5 }).addTo(this.singleHistoryLayers);
    this.updateRouteArrows(points, this.historyArrowLayers);
  }

  plotHistoryMarker(data: any) {
    if (!this.singleAlertMap) return;
    const coords = this.getCoordinates(data);
    if (!this.isValidCoordinates(coords)) return;
    if (!this.singleAlertHistoryMarker) this.singleAlertHistoryMarker = this.createLeafletMarker(this.createMarkerElement(), coords, this.getHeading(data)).addTo(this.singleAlertMap);
    else {
      this.singleAlertHistoryMarker.setLatLng([coords[1], coords[0]]);
      this.rotateLeafletMarker(this.singleAlertHistoryMarker, this.getHeading(data));
    }
    this.singleAlertMap.panTo([coords[1], coords[0]], { animate: false });
    this.singleAlertInfoPanelData = {
      ...this.singleAlertInfoPanelData, pollingdate: data.param3, speed: data.param9,
      ignition: data.param12 === '1' ? 'On' : 'Off', latitude: coords[1], longitude: coords[0]
    };
    this.cdr.detectChanges();
  }


  openSingleAlertMapWithData(vehicleId: string, lng: any, lat: any, vehicleno: string) {
    this.zone.run(() => {
      const isPanicModalOpen = $('#openMapViewModalPanic').hasClass('show');

      this.clearSingleAlertHistoryLayers();
      this.clearSingleAlertLiveTrackingLayers();
      this.selectedSingleAlert = {
        param2: vehicleId,
        imeino: vehicleId, // Store IMEI here for backToLiveTrack
        param4: vehicleId, // Store IMEI here for backToLiveTrack
        vehicleno: vehicleno,
        latitude: lat,
        longitude: lng,
        param9: vehicleno
      };

      this.singleAlertModalMode = 'history';

      if (isPanicModalOpen) {
        // Reuse Panic Modal Map
        this.singleAlertMap = this.map;
        this.showHistoryTrack(vehicleno);
      } else {
        this.showSingleAlertModal = true;
        this.initSingleAlertMap(this.selectedSingleAlert);
      }
    });
  }

  startLiveTrackingFromPopup(vehicleId: string, lng: any, lat: any, vehicleno: string) {
    this.zone.run(() => {
      const isPanicModalOpen = $('#openMapViewModalPanic').hasClass('show');

      this.clearSingleAlertHistoryLayers();
      this.clearSingleAlertLiveTrackingLayers();
      this.selectedSingleAlert = {
        param2: vehicleId, // Keep param2 as well if it's used elsewhere for vehicle ID
        imeino: vehicleId, // Store IMEI here for backToLiveTrack
        param4: vehicleId, // Store IMEI here for backToLiveTrack
        vehicleno: vehicleno,
        latitude: lat,
        longitude: lng,
        param9: vehicleno
      };
      this.singleAlertModalMode = 'live';

      if (isPanicModalOpen) {
        // Reuse Panic Modal Map
        this.singleAlertMap = this.map;
        // Remove existing emergency marker/popup to clean up the view
        if (this.emergencyMarker) this.emergencyMarker.remove();
        this.startSingleAlertLiveTracking(vehicleId, [Number(lng), Number(lat)]);
      } else {
        this.showSingleAlertModal = true;
        this.initSingleAlertMap(this.selectedSingleAlert);
      }
    });
  }

  initSingleAlertMap(data: any) {
    const generation = ++this.modalGeneration;
    setTimeout(() => {
      if (!this.isComponentAlive || !this.showSingleAlertModal || generation !== this.modalGeneration || this.showMapModal) return;
      if (!document.getElementById('singleAlertMap')) return;
      const lng = Number(data.longitude || data.param26 || data.param7 || data.param39 || 0);
      const lat = Number(data.latitude || data.param25 || data.param6 || data.param38 || 0);
      if (!this.isValidCoordinates([lng, lat])) { this.errorMessage = 'Invalid alert coordinates'; return; }
      this.clearAllLayers();
      this.clearPoliceStationMarkers();
      if (this.singleAlertMap && this.singleAlertMap !== this.map) this.disposeLeafletMap(this.singleAlertMap);
      this.singleAlertMap = this.createLeafletMap('singleAlertMap', [lat, lng], 14);
      this.singleBasemap = createLeafletBasemap(this.singleAlertStyle).addTo(this.singleAlertMap);
      this.attachTrackingLayers(this.singleAlertMap);
      if (this.showPoliceStations) this.loadPoliceStations();
      if (this.singleAlertModalMode === 'live') this.startSingleAlertLiveTracking(data.param2 || data.vehicleno, [lng, lat]);
      else {
        this.isVehiclePlotted = true;
        this.singleAlertInfoPanelData = { pollingdate: data.eventtime || data.Param22, speed: '0', ignition: 'NA', latitude: lat, longitude: lng };
        this.showHistoryTrack(data.vehicleno || data.param9);
      }
    }, 500);
  }


  toggleSingleInfoPanel() {
    this.isSingleInfoCollapsed = !this.isSingleInfoCollapsed;
  }

  closeSingleAlertModal() {
    this.modalGeneration++;
    this.policeStationsSub?.unsubscribe();
    this.clearPoliceStationMarkers();
    this.showSingleAlertModal = false;
    this.isLayersVisible = false;
    this.clearAllLayers();
    if (this.singleAlertMap && this.singleAlertMap !== this.map) this.disposeLeafletMap(this.singleAlertMap);
    this.singleAlertMap = null;
    this.selectedSingleAlert = null;
    this.singleAlertModalMode = null;
    this.isVehiclePlotted = false;
  }

  clearAlertLayers() {
    if (this.emergencyMarker) {
      this.emergencyMarker.remove();
      this.emergencyMarker = null;
    }
  }

  clearAllLayers() {
    this.clearAlertLayers();
    this.clearSingleAlertLiveTrackingLayers();
    this.clearSingleAlertHistoryLayers();
    if (this.alertRefreshTimer) {
      clearTimeout(this.alertRefreshTimer);
    }
  }

  clearSingleAlertHistoryLayers() {
    if (this.singleAlertHistoryAnimationFrameId) {
      cancelAnimationFrame(this.singleAlertHistoryAnimationFrameId);
      this.singleAlertHistoryAnimationFrameId = null;
    }
    if (this.singleAlertHistoryMarker) {
      this.singleAlertHistoryMarker.remove();
      this.singleAlertHistoryMarker = null;
    }
    if (this.singleAlertHistoryStartMarker) {
      this.singleAlertHistoryStartMarker.remove();
      this.singleAlertHistoryStartMarker = null;
    }
    if (this.singleAlertHistoryEndMarker) {
      this.singleAlertHistoryEndMarker.remove();
      this.singleAlertHistoryEndMarker = null;
    }
    this.pauseHistory();
    this.historyTrackingSub?.unsubscribe();
    this.singleHistoryLayers.clearLayers();
    this.historyAlertLayers.clearLayers();
    this.historyArrowLayers.clearLayers();
    this.historyRoute = undefined;
  }
}
