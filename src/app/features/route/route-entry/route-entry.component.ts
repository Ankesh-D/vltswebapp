import { createLeafletBasemap } from '../../../shared/components/map-layer-options/map-basemaps';
import { MapLayerOptionsComponent } from '../../../shared/components/map-layer-options/map-layer-options.component';
import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import * as L from 'leaflet';
import 'leaflet-draw';
import { RouteService, RouteEntryRequest, RouteUpdateRequest } from '../../../core/services/route.service';
import { POIService } from '../../../core/services/poi.service';
import { ToastService } from '../../../core/services/toast.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { ToastComponent } from '../../assets/inactive-assets/toast.component';
import { MapScaleUtil } from '../../../core/utils/map-scale.util';
import { AlertService } from '../../../core/services/alert.service';
import { LeafletMapComponent } from '../../../shared/components/leaflet-map/leaflet-map.component';

export class RouteModel {
  remarks: string = "";
  routeId: string = "";
  routeName: string = "";
  routeType: string = "";
  geom: any = [];
  activationStatus: boolean = false;
  styleColour: string = "#000000";
  sourcePoiId: string = "";
  destinationPoiId: string = "";
  routeDescription: string = "";
  customerid: string = '';
}

@Component({
    selector: 'app-route-entry',
    imports: [MapLayerOptionsComponent, CommonModule, FormsModule, RouterModule, NgSelectModule, ToastComponent, LeafletMapComponent],
    templateUrl: './route-entry.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./route-entry.component.scss']
})
export class RouteEntryComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('routeForm') routeForm!: NgForm;
  @ViewChild('deleteForm') deleteForm!: NgForm;

  // Map Properties
  map!: L.Map;
  drawnItems: L.FeatureGroup = new L.FeatureGroup();
  poiMarkerLayer: L.LayerGroup = new L.LayerGroup();
  routePointLayer: L.LayerGroup = new L.LayerGroup();
  drawControl: any;
  private currentTileLayer: L.TileLayer | null = null;
  private sourcePoiMarker: L.CircleMarker | null = null;
  private destinationPoiMarker: L.CircleMarker | null = null;
  private mapHostElement: HTMLElement | null = null;

  // Data Properties
  roleId: string | null = sessionStorage.getItem('roleid');
  customerList: any[] = [];
  poiData: any[] = [];
  routeData: any[] = [];
  reasonlist: any[] = [];
  poiArr: any[] = []; // Stores current route coordinates

  // Objects for ngModel
  customerObj: any = null;
  sourcePOIObj: any = null;
  destinationPOIObj: any = null;
  routeEntry = new RouteModel();

  // State Properties
  submitted = false;
  toUpdate = false;
  totalcount = 0;
  deletesubmitted = false;
  deleteremark = "";
  deletereasonObj: any = null;
  receivedData: any = null;

  // Search/Request objects (Mocking CommonRequest)
  routedetailsReq = {
    searchParameter: '',
    pageNo: 1,
    itemPerPage: 20
  };

  // Service Mocks for missing "cs" pageActivities logic
  cs = {
    pageActivities: (param: any, val: any, master: string, field: string, type: string, update: boolean) => {
      console.log(`Activity: ${field} changed to ${val}`);
    },
    addressValidation: (event: any) => { return true; }
  };

  selectedRoute: any = "";
  showDeleteModal = false;
  deleteRemark: string = "";
  totalRouteDistance = "0 m";
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLayersVisible = false;
  currentStyle: string = 'streets-v11';
  showPoliceStations = true;
    private policeStationMarkers: L.Marker[] = [];

  constructor(
    private router: Router,
    private routeService: RouteService,
    private poiService: POIService,
    private alertService: AlertService,
    private toast: ToastService,
    private vehicleService: VehicleService,
    private cdr: ChangeDetectorRef
  ) { 
    this.toast.pageName = 'Route Entry'; // Set page name for toast service
  }

  ngOnInit() {
    this.getRouteDetails();
    this.getCustomerList();
    this.getPoiDetails();
    this.getReason();
  }

  ngAfterViewInit() {
    setTimeout(() => this.initializeMap(), 200);
  }

  onMapReady(mapElement: HTMLElement): void {
    this.mapHostElement = mapElement;
    this.initializeMap();
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  initializeMap() {
    if (!this.mapHostElement || this.map) {
      return;
    }

    this.map = L.map(this.mapHostElement, {
      preferCanvas: true,
      zoomSnap: 1,
      zoomDelta: 1,
      fadeAnimation: false,
      zoomControl: false
    }).setView([22.9786, 87.7478], 8);

    L.control.zoom({ position: 'topleft' }).addTo(this.map);
    MapScaleUtil.addLeafletScale(this.map);
    setTimeout(() => this.moveRouteZoomControlTopLeft(), 0);

    this.currentTileLayer = this.createMapTileLayer(this.currentStyle);
    this.currentTileLayer.addTo(this.map);
    this.currentTileLayer.bringToBack();

    // Add WMS Layer for India State boundaries
    L.tileLayer.wms('https://vlts.wb.gov.in/geoserver/wbsdcmap/wms?', {
      layers: 'wbsdcmap:india_state',
      format: 'image/png',
      transparent: true,
      version: '1.1.1', // Consistent with other components
      attribution: 'Powered by DIMTS'
    }).addTo(this.map);


    this.map.addLayer(this.drawnItems);
    this.map.addLayer(this.poiMarkerLayer);
    this.map.addLayer(this.routePointLayer);

    // Initialize Draw Control
    this.drawControl = new L.Control.Draw({
      draw: {
        polyline: { shapeOptions: { color: 'blue', weight: 4 } },
        polygon: false, circle: false, rectangle: false, marker: false, circlemarker: false
      },
      edit: { featureGroup: this.drawnItems }
    });
    this.map.addControl(this.drawControl);

    this.map.on(L.Draw.Event.CREATED, (e: any) => {
      this.drawnItems.clearLayers();
      const layer = e.layer;
      this.drawnItems.addLayer(layer);
      this.updatePoiArrFromLayer(layer);
    });

    this.map.on(L.Draw.Event.EDITED, (e: any) => {
      e.layers.eachLayer((layer: any) => {
        this.updatePoiArrFromLayer(layer);
      });
    });

    setTimeout(() => {
      this.map.invalidateSize();
      this.moveRouteZoomControlTopLeft();
    }, 500);

    // Leaflet's initial load can fire during setView(), so load these directly.
    this.loadPoliceStations();
  }

   private loadPoliceStations(): void {
        this.clearPoliceStationMarkers();
        if (!this.showPoliceStations) return;
    
        this.alertService.getPoliceStationDetails({ param1: '', param2: 1, param3: 20 }).subscribe({
          next: (response: any) => {
            const stations = response?.entity?.listData;
            const mapView = this.map;
            if (!mapView || !this.showPoliceStations || !Array.isArray(stations)) return;
    
            mapView.setZoom(Math.max(mapView.getZoom(), 14));

            stations.forEach((station: any) => {
              const lat = Number(station?.param9); const lng = Number(station?.param10);
              if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return;
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
                .addTo(mapView);
              this.policeStationMarkers.push(marker);
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
          const row = document.createElement('div'), key = document.createElement('span'), val = document.createElement('b'); key.textContent = String(label); val.textContent = String(value); row.append(key, val); body.append(row);
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

  togglePoliceStations(): void {
    if (this.showPoliceStations) {
      this.loadPoliceStations();
    } else {
      this.clearPoliceStationMarkers();
    }
  }

  private moveRouteZoomControlTopLeft(): void {
    const mapContainer = document.getElementById('routeMap');
    const zoomControl = mapContainer?.querySelector('.leaflet-control-zoom');
    const topLeftContainer = mapContainer?.querySelector('.leaflet-top.leaflet-left');

    if (zoomControl && topLeftContainer && zoomControl.parentElement !== topLeftContainer) {
      topLeftContainer.appendChild(zoomControl);
    }
  }

  updatePoiArrFromLayer(layer: any) {
    const latlngs = layer.getLatLngs();
    this.poiArr = latlngs.map((latlng: any) => [latlng.lng, latlng.lat]);
    this.syncRouteGeometry();
    this.renderRoutePointMarkers();
    this.cdr.detectChanges();
  }

  private syncRouteGeometry(): void {
    const geom = { type: 'LineString', coordinates: this.poiArr };
    this.routeEntry.geom = JSON.stringify(geom);
    this.updateTotalRouteDistance();
  }

  private renderRoutePointMarkers(): void {
    this.routePointLayer.clearLayers();

    this.poiArr.forEach((coordinate: any, index: number) => {
      const latLng = this.getLatLngFromRouteCoordinate(coordinate);
      if (!latLng) {
        return;
      }

      const pointMarker = L.circleMarker(latLng, {
        radius: 6,
        color: '#ffffff',
        weight: 2,
        fillColor: '#0b58b9',
        fillOpacity: 1,
        interactive: true
      });

      pointMarker.on('contextmenu', (event: L.LeafletMouseEvent) => {
        if (event.originalEvent) {
          L.DomEvent.preventDefault(event.originalEvent);
        }
        this.openRoutePointDeletePopup(index, event.latlng);
      });

      pointMarker.bindTooltip(`Point ${index + 1}`, {
        direction: 'top',
        opacity: 0.85,
        sticky: true
      });

      pointMarker.addTo(this.routePointLayer);
    });
  }

  private openRoutePointDeletePopup(index: number, latLng: L.LatLng): void {
    if (!this.map) {
      return;
    }

    const popupContent = document.createElement('div');
    popupContent.className = 'route-point-delete-popup';

    const message = document.createElement('div');
    message.className = 'route-point-delete-message';
    message.textContent = `Do you want to delete route point ${index + 1}?`;

    const actions = document.createElement('div');
    actions.className = 'route-point-delete-actions';

    const yesButton = document.createElement('button');
    yesButton.type = 'button';
    yesButton.className = 'route-point-delete-yes';
    yesButton.textContent = 'Yes';
    yesButton.addEventListener('click', () => this.deleteRoutePoint(index));

    const noButton = document.createElement('button');
    noButton.type = 'button';
    noButton.className = 'route-point-delete-no';
    noButton.textContent = 'No';
    noButton.addEventListener('click', () => this.map.closePopup());

    actions.appendChild(yesButton);
    actions.appendChild(noButton);
    popupContent.appendChild(message);
    popupContent.appendChild(actions);

    L.popup({
      closeButton: true,
      autoClose: true,
      closeOnClick: false,
      className: 'route-point-confirm-popup'
    })
      .setLatLng(latLng)
      .setContent(popupContent)
      .openOn(this.map);
  }

  private deleteRoutePoint(index: number): void {
    if (this.poiArr.length <= 2) {
      this.map.closePopup();
      this.toast.show('Route must have minimum 2 points', 'error');
      return;
    }

    this.poiArr.splice(index, 1);
    this.redrawRoutePolylineFromPoiArr();
    this.syncRouteGeometry();
    this.renderRoutePointMarkers();
    this.map.closePopup();
    this.toast.show('Route point deleted', 'success');
    this.cdr.detectChanges();
  }

  private redrawRoutePolylineFromPoiArr(): void {
    this.drawnItems.clearLayers();

    const latLngs = this.poiArr
      .map((coordinate: any) => this.getLatLngFromRouteCoordinate(coordinate))
      .filter((latLng): latLng is L.LatLng => !!latLng);

    if (latLngs.length >= 2) {
      L.polyline(latLngs, {
        color: this.routeEntry.styleColour || 'black',
        weight: 4
      }).addTo(this.drawnItems);
    }
  }

  selectRoute() {
    this.drawnItems.clearLayers();
    this.routePointLayer.clearLayers();
    this.poiArr = [];
    this.updateTotalRouteDistance();
    // @ts-ignore - Type compatibility issue with leaflet-draw types
    const DrawPolyline = (L.Draw as any).Polyline;
    const polylineDrawer = new DrawPolyline(this.map, this.drawControl.options.draw.polyline);
    polylineDrawer.enable();
  }

  getCustomerList() {
    this.vehicleService.getVendorListNew().subscribe((res: any) => {
      this.customerList = res.entity || [];
    });
  }

  getPoiDetails() {
    this.poiService.getRoutePOIDetails({
      param8: '',
      param9: '',
      param10: ''
    }).subscribe((res: any) => {
      this.poiData = res?.entity?.listData || [];

      if (this.toUpdate && this.receivedData) {
        this.sourcePOIObj = this.findPoiById(this.getRoutePoiId(this.receivedData, 'source'));
        this.destinationPOIObj = this.findPoiById(this.getRoutePoiId(this.receivedData, 'destination'));

        if (this.sourcePOIObj) this.placePoiMarker(this.sourcePOIObj, 'Source');
        if (this.destinationPOIObj) this.placePoiMarker(this.destinationPOIObj, 'Destination');
        this.updateTotalRouteDistance();
      }
    });
  }

  getRouteDetails() {
    this.loading = true;
    this.errorMessage = null;
    const req = {
      param1: this.routedetailsReq.searchParameter,
      param2: this.routedetailsReq.pageNo.toString(),
      param3: this.routedetailsReq.itemPerPage.toString()
    };
    this.routeService.getRouteDetails(req).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res?.status && res?.entity) {
          this.routeData = res.entity.listData || [];
          this.totalcount = Number(res.entity.param1 || 0);
        } else {
          this.routeData = [];
          this.totalcount = 0;
          this.errorMessage = typeof res?.entity === 'string' ? res.entity : 'Route details not found';
        }
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        this.loading = false;
        this.routeData = [];
        this.totalcount = 0;
        this.errorMessage = error?.error?.entity || 'Error loading route details';
        this.toast.show(this.errorMessage || 'Error loading route details', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  searchData() {
    this.routedetailsReq.pageNo = 1;
    this.getRouteDetails();
  }

  refreshdata() {
    this.routedetailsReq.searchParameter = "";
    this.getRouteDetails();
  }

  getReason() {
    // Assuming a generic roster for reasons exists
    this.reasonlist = [{ param1: '1', param2: 'Testing' }, { param1: '2', param2: 'Route Changed' }];
  }

  setData(item: any) {
    this.toUpdate = true;
    this.receivedData = item;
    this.routeEntry = new RouteModel();
    this.routeEntry.routeId = item.param2;
    this.routeEntry.routeName = item.param3;
    this.routeEntry.routeType = this.getRouteType(item);
    this.routeEntry.routeDescription = this.getRouteDescription(item);
    this.routeEntry.geom = this.getRouteGeometry(item);
    this.routeEntry.styleColour = this.getRouteStyleColor(item);
    this.sourcePOIObj = null;
    this.destinationPOIObj = null;

    this.getPoiDetails();

    // Handle Map visualization
    this.drawnItems.clearLayers();
    this.poiMarkerLayer.clearLayers();

    try {
      const geomData = JSON.parse(this.routeEntry.geom || '{"coordinates": []}');
      this.poiArr = geomData.coordinates || [];
      if (this.poiArr.length > 0) {
        const latlngs = this.poiArr.map(c => L.latLng(c[1], c[0]));
        const polyline = L.polyline(latlngs, { color: this.routeEntry.styleColour, weight: 4 }).addTo(this.drawnItems);
        this.renderRoutePointMarkers();
        this.map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
      }
      this.updateTotalRouteDistance();
    } catch (e) {
      console.error("Invalid geometry data", e);
      this.updateTotalRouteDistance();
    }
  }

  insertRoute(form: NgForm) {
    this.submitted = true;
    if (form.invalid || this.poiArr.length === 0) {
      this.toast.show('Please complete the form and draw a route', 'error');
      return;
    }

    this.loading = true;
    const req = this.buildRoutePayload('');

    this.routeService.putRoute(req).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res?.status) {
          this.toast.show(res.entity || 'Route inserted successfully', 'success');
          this.resetForm();
          this.getRouteDetails();
        } else {
          const message = typeof res?.entity === 'string' ? res.entity : 'Route insert failed';
          this.toast.show(message, 'error');
        }
      },
      error: (error: any) => {
        this.loading = false;
        this.toast.show(error?.error?.entity || 'Error inserting route', 'error');
      }
    });
  }

  updateRoute(form: NgForm) {
    this.submitted = true;
    if (form.invalid || this.poiArr.length === 0) {
      this.toast.show('Please complete the form and draw a route', 'error');
      return;
    }

    this.loading = true;
    const req = this.buildRoutePayload(this.routeEntry.routeId);

    this.routeService.editRoute(req).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res?.status) {
          this.toast.show(res.entity || 'Route updated successfully', 'success');
          this.resetForm();
          this.getRouteDetails();
        } else {
          const message = typeof res?.entity === 'string' ? res.entity : 'Route update failed';
          this.toast.show(message, 'error');
        }
      },
      error: (error: any) => {
        this.loading = false;
        this.toast.show(error?.error?.entity || 'Error updating route', 'error');
      }
    });
  }

  deleteRoute() {
    this.deletesubmitted = true;
    if (!this.selectedRoute) {
      this.toast.show('Please select route to delete', 'error');
      return;
    }
    if (!this.deleteRemark || this.deleteRemark.trim().length < 10) {
      this.toast.show('Please enter minimum 10 characters remark', 'error');
      return;
    }
    this.loading = true;
    this.routeService.deleteRoute(this.selectedRoute.param2, this.deleteRemark.trim()).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res?.status) {
          const message = res.entity || 'Route deleted successfully!';
          this.successMessage = message;
          this.toast.show(message, 'success');
          this.closeDeleteModal();
          this.resetForm();
          this.getRouteDetails();
        } else {
          const message = typeof res?.entity === 'string' ? res.entity : 'Route delete failed';
          this.errorMessage = message;
          this.toast.show(message, 'error');
        }
      },
      error: (error: any) => {
        this.loading = false;
        const message = error?.error?.entity || 'Error deleting route';
        this.errorMessage = message;
        this.toast.show(message, 'error');
      }
    });
  }

  private buildRoutePayload(routeId: string): RouteEntryRequest & RouteUpdateRequest {
    const coord = JSON.stringify({ type: 'LineString', coordinates: this.poiArr });

    return {
      routeid: routeId,
      routename: this.routeEntry.routeName?.trim() || '',
      routetype: this.routeEntry.routeType || 'route',
      coord,
      description: this.routeEntry.routeDescription?.trim() || '',
      stylecolor: this.normalizeRouteColor(this.routeEntry.styleColour),
      sourcepoiid: this.getPoiId(this.sourcePOIObj),
      destinationpoiid: this.getPoiId(this.destinationPOIObj),
      vehiclespeed: '80',
      remarks: this.toUpdate ? this.routeEntry.remarks?.trim() || '' : ''
    };
  }

  private getRouteDescription(item: any): string {
    return item?.param9 || item?.param10 || item?.description || item?.routeDescription || '';
  }

  private getRouteType(item: any): string {
    return this.isGeometryJson(item?.param4) ? 'route' : item?.param4 || 'route';
  }

  private getRouteGeometry(item: any): string {
    if (this.isGeometryJson(item?.param5)) {
      return item.param5;
    }

    if (this.isGeometryJson(item?.param4)) {
      return item.param4;
    }

    return JSON.stringify({ type: 'LineString', coordinates: [] });
  }

  private getRouteStyleColor(item: any): string {
    const colorCandidates = [
      item?.stylecolor,
      item?.styleColor,
      item?.styleColour,
      item?.routecolor,
      item?.routeColor,
      item?.routecolour,
      item?.routeColour,
      item?.colour,
      item?.color,
      item?.param7,
      item?.param8,
      item?.param12
    ];

    const responseValues = item && typeof item === 'object' ? Object.values(item) : [];
    const validColor = [...colorCandidates, ...responseValues].find(color => this.isValidRouteColor(color));
    return this.normalizeRouteColor(validColor);
  }

  private normalizeRouteColor(color: any): string {
    return this.isValidRouteColor(color) ? String(color).trim() : '#000000';
  }

  private isValidRouteColor(color: any): boolean {
    const value = String(color ?? '').trim();

    if (!value || value === '0') {
      return false;
    }

    return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value)
      || /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/i.test(value)
      || /^(black|blue|red|green|yellow|orange|purple|pink|brown|gray|grey|white|cyan|magenta|lime|navy|teal|maroon|olive)$/i.test(value);
  }

  private getRoutePoiId(item: any, type: 'source' | 'destination'): string {
    const candidates = type === 'source'
      ? [item?.param13, item?.sourcePoiId, item?.sourcepoiid, item?.source_poi_id, item?.param8]
      : [item?.param14, item?.destinationPoiId, item?.destinationpoiid, item?.destination_poi_id, item?.param9];

    const matchingId = candidates.find(candidate => this.findPoiById(candidate));
    return matchingId ? String(matchingId) : '';
  }

  private isGeometryJson(value: any): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed?.coordinates);
    } catch {
      return false;
    }
  }

  resetForm() {
    this.toUpdate = false;
    this.submitted = false;
    this.deletesubmitted = false;
    this.routeEntry = new RouteModel();
    this.poiArr = [];
    this.totalRouteDistance = "0 m";
    this.drawnItems.clearLayers();
    this.routePointLayer.clearLayers();
    this.poiMarkerLayer.clearLayers();
    this.sourcePoiMarker = null;
    this.destinationPoiMarker = null;
    this.sourcePOIObj = null;
    this.destinationPOIObj = null;
    if (this.routeForm) this.routeForm.resetForm();
  }

  selectSourcePOI() {
    if (this.sourcePOIObj && this.isSamePoi(this.sourcePOIObj, this.destinationPOIObj)) {
      this.destinationPOIObj = null;
      this.removePoiMarker('Destination');
    }

    if (this.sourcePOIObj) {
      this.placePoiMarker(this.sourcePOIObj, 'Source');
    } else {
      this.removePoiMarker('Source');
    }
    this.updateTotalRouteDistance();
  }

  selectDestinationPOI() {
    if (this.destinationPOIObj) {
      this.placePoiMarker(this.destinationPOIObj, 'Destination');
    } else {
      this.removePoiMarker('Destination');
    }
    this.updateTotalRouteDistance();
  }

  placePoiMarker(poi: any, label: string) {
    const lat = parseFloat(poi.param7); // Assuming param7 is lat based on your service
    const lng = parseFloat(poi.param8); // Assuming param8 is lng

    if (!isNaN(lat) && !isNaN(lng)) {
      this.removePoiMarker(label);

      const markerColor = label === 'Source' ? '#12a150' : '#d93025';
      const marker = L.circleMarker([lat, lng], {
        radius: 8,
        color: '#ffffff',
        weight: 2,
        fillColor: markerColor,
        fillOpacity: 1
      })
        .bindPopup(`
            <div class="route-poi-popup">
              <strong>${label} POI</strong><br>
              <span>${this.escapeHtml(this.getPoiName(poi))}</span><br>
              <small>Lat: ${lat}</small><br>
              <small>Lng: ${lng}</small>
            </div>
          `)
        .addTo(this.poiMarkerLayer);

      if (label === 'Source') {
        this.sourcePoiMarker = marker;
      } else {
        this.destinationPoiMarker = marker;
      }

      this.fitPoiMarkers();
    }
  }

  private updateTotalRouteDistance(): void {
    const routeDistance = this.calculateRouteDistanceFromCoordinates();

    if (routeDistance > 0) {
      this.totalRouteDistance = this.formatDistance(routeDistance);
      return;
    }

    const poiDistance = this.calculateSelectedPoiDistance();
    this.totalRouteDistance = poiDistance > 0 ? this.formatDistance(poiDistance) : "0 m";
  }

  private calculateRouteDistanceFromCoordinates(): number {
    if (this.poiArr.length < 2) {
      return 0;
    }

    return this.poiArr.reduce((total: number, coordinate: any, index: number) => {
      if (index === 0) {
        return total;
      }

      const previous = this.poiArr[index - 1];
      const currentLatLng = this.getLatLngFromRouteCoordinate(coordinate);
      const previousLatLng = this.getLatLngFromRouteCoordinate(previous);

      return currentLatLng && previousLatLng
        ? total + previousLatLng.distanceTo(currentLatLng)
        : total;
    }, 0);
  }

  private calculateSelectedPoiDistance(): number {
    const sourceLatLng = this.getLatLngFromPoi(this.sourcePOIObj);
    const destinationLatLng = this.getLatLngFromPoi(this.destinationPOIObj);

    return sourceLatLng && destinationLatLng ? sourceLatLng.distanceTo(destinationLatLng) : 0;
  }

  private getLatLngFromRouteCoordinate(coordinate: any): L.LatLng | null {
    if (!Array.isArray(coordinate) || coordinate.length < 2) {
      return null;
    }

    const lng = Number(coordinate[0]);
    const lat = Number(coordinate[1]);
    return Number.isFinite(lat) && Number.isFinite(lng) ? L.latLng(lat, lng) : null;
  }

  private getLatLngFromPoi(poi: any): L.LatLng | null {
    const lat = Number(poi?.param7);
    const lng = Number(poi?.param8);
    return Number.isFinite(lat) && Number.isFinite(lng) ? L.latLng(lat, lng) : null;
  }

  private formatDistance(distanceInMeters: number): string {
    if (distanceInMeters >= 1000) {
      return `${(distanceInMeters / 1000).toFixed(2)} km`;
    }

    return `${Math.round(distanceInMeters)} m`;
  }

  isDestinationPoiDisabled(item: any): boolean {
    return this.isSamePoi(item, this.sourcePOIObj);
  }

  getPoiName(poi: any): string {
    return poi?.param3 || poi?.param2 || '';
  }

  private findPoiById(poiId: any): any {
    const value = String(poiId || '').trim();
    if (!value) {
      return null;
    }

    return this.poiData.find(poi =>
      String(this.getPoiId(poi)).trim() === value ||
      String(this.getPoiName(poi)).trim().toLowerCase() === value.toLowerCase()
    ) || null;
  }

  private getPoiId(poi: any): string {
    return poi?.param2 ? String(poi.param2) : '';
  }

  private isSamePoi(first: any, second: any): boolean {
    return !!first && !!second && this.getPoiId(first) === this.getPoiId(second);
  }

  private removePoiMarker(label: string): void {
    const marker = label === 'Source' ? this.sourcePoiMarker : this.destinationPoiMarker;

    if (marker) {
      this.poiMarkerLayer.removeLayer(marker);
    }

    if (label === 'Source') {
      this.sourcePoiMarker = null;
    } else {
      this.destinationPoiMarker = null;
    }
  }

  private fitPoiMarkers(): void {
    const markerLatLngs = [this.sourcePoiMarker, this.destinationPoiMarker]
      .filter((marker): marker is L.CircleMarker => !!marker)
      .map(marker => marker.getLatLng());

    if (markerLatLngs.length === 1) {
      this.map.setView(markerLatLngs[0], 14);
      return;
    }

    if (markerLatLngs.length > 1) {
      this.map.fitBounds(L.latLngBounds(markerLatLngs), { padding: [40, 40], maxZoom: 14 });
    }
  }

  private escapeHtml(value: string): string {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };

    return value.replace(/[&<>"']/g, character => entities[character] || character);
  }

  exportPdfExcel(type: string) {
    // Implementation similar to other list components using routeService
    this.toast.show(`Exporting ${type}...`, 'info');
  }

  showSwitcher() {
    const icon = document.getElementById('charticonRoute');
    if (icon) {
      icon.style.display = icon.style.display === 'none' ? 'block' : 'none';
    }
  }

  SwitchLayer(layerIndex: number) {
    // Logic to switch between satellite, street, etc.
    this.toast.show('Switching map layer', 'info');
  }

  // Mock mapService property for popup binding in HTML
  mapService = {
    poiData: {
      poiname: '',
      poirange: 0,
      poilocation: '',
      latitude: 0,
      longitude: 0,
      customerName: ''
    }
  };

  navigateToMapTracking() {
    this.router.navigate(['/mapViewAll']);
  }

  goBack() {
    this.router.navigate(['/route']);
  }

  openDeleteModal(item: any) {
    this.selectedRoute = item;
    this.deleteRemark = '';
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedRoute = null;
    this.deleteRemark = '';
    document.body.classList.remove('modal-open');
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());
  }

  // ==========================================
  // UI Interaction Methods
  // ==========================================

  changeMapStyle(style: string): void {
    this.currentStyle = style;

    if (this.currentTileLayer) {
      this.map.removeLayer(this.currentTileLayer);
    }

    this.currentTileLayer = this.createMapTileLayer(style);
    this.currentTileLayer.addTo(this.map);
    this.currentTileLayer.bringToBack();
    this.moveRouteZoomControlTopLeft();
  }

  private createMapTileLayer(style: string): L.TileLayer {
    return createLeafletBasemap(style);
  }

  toggleLayers() {
    this.isLayersVisible = !this.isLayersVisible;
  }
}
