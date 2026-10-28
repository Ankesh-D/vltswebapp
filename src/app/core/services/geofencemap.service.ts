import { createLeafletBasemap } from '../../shared/components/map-layer-options/map-basemaps';
import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-draw';
import 'leaflet.markercluster';
import { Subject } from 'rxjs';
import { MapScaleUtil } from '../utils/map-scale.util';

export interface GeofenceCoordinates {
  lat: number;
  lng: number;
}

export type GeofenceDrawType = 'circle' | 'polygon' | 'rectangle';

export interface GeofenceShape {
  type: GeofenceDrawType;
  coordinates: GeofenceCoordinates[];
  center?: GeofenceCoordinates;
  radius?: number;
}

export interface GeofenceVehicleClusterResult {
  total: number;
  inside: number;
  outside: number;
}

@Injectable({
  providedIn: 'root'
})
export class GeofencemapService {
  private map: L.Map | null = null;
  private baseTileLayer: L.TileLayer | null = null;
  private drawnItems: L.FeatureGroup | null = null;
  private vehicleClusterLayer: any = null;
  private liveRouteLayer: L.LayerGroup | null = null;
  private liveMarker: L.Marker | null = null;
  private historyRouteLayer: L.LayerGroup | null = null;
  private historyArrowsLayer: L.LayerGroup | null = null;
  private historyStartMarker: L.Marker | null = null;
  private historyEndMarker: L.Marker | null = null;
  private historyMarker: L.Marker | null = null;
  private drawControl: any = null;
  private activeDrawer: any = null;
  private mapElement: HTMLElement | null = null;
  private readonly defaultCenter: L.LatLngExpression = [22.978624, 87.7478];
  private currentMapStyle = 'streets-v11';

  private geofenceSubject = new Subject<GeofenceShape | null>();
  readonly geofence$ = this.geofenceSubject.asObservable();

  initializeMap(container: HTMLElement | string): void {
    const mapElement = typeof container === 'string' ? document.getElementById(container) : container;

    if (!mapElement) {
      setTimeout(() => this.initializeMap(container), 100);
      return;
    }

    this.mapElement = mapElement;
    const rect = mapElement.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0) {
      setTimeout(() => this.initializeMap(container), 100);
      return;
    }

    if (this.map) {
      this.map.invalidateSize();
      return;
    }

    this.fixDefaultMarkerIcon();

    this.map = L.map(mapElement, {
      center: this.defaultCenter,
      zoom: 8,
      minZoom: 3,
      maxZoom: 19,
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true
    });

    L.control.zoom({ position: 'topleft' }).addTo(this.map);
    MapScaleUtil.addLeafletScale(this.map);

    this.baseTileLayer = this.createBaseTileLayer(this.currentMapStyle);
    this.baseTileLayer.addTo(this.map);

    this.drawnItems = new L.FeatureGroup();
    this.map.addLayer(this.drawnItems);
    this.liveRouteLayer = L.layerGroup().addTo(this.map);
    this.historyRouteLayer = L.layerGroup().addTo(this.map);
    this.historyArrowsLayer = L.layerGroup().addTo(this.map);
    this.addDrawControl();
    this.bindDrawEvents();

    this.map.whenReady(() => {
      setTimeout(() => this.map?.invalidateSize(), 80);
    });
  }

  getMap(): L.Map | null {
    return this.map;
  }

  startDraw(type: GeofenceDrawType, color = '#1d9d74'): void {
    if (!this.map || !this.drawnItems) {
      if (this.mapElement) {
        this.initializeMap(this.mapElement);
      }
      return;
    }

    this.clearGeofence();
    this.activeDrawer?.disable();
    this.activeDrawer = this.createDrawer(type, color);
    this.activeDrawer.enable();
  }

  startPolygonDraw(color = '#1d9d74'): void {
    this.startDraw('polygon', color);
  }

  showGeofence(geofence: GeofenceShape, color = '#1d9d74'): void {
    if (!this.map || !this.drawnItems) {
      return;
    }

    this.clearGeofence();
    const layer = this.createLayerFromShape(geofence, color);

    if (!layer) {
      return;
    }

    this.drawnItems.addLayer(layer);
    this.fitLayer(layer);
    this.enableLayerEditing(layer);
    this.emitGeofence();
  }

  clearGeofence(): void {
    this.activeDrawer?.disable();
    this.drawnItems?.clearLayers();
    this.geofenceSubject.next(null);
  }

  showVehicleClusters(vehicles: any[], geofence: GeofenceShape | null, mode: 'inside' | 'outside' | 'all' = 'all'): GeofenceVehicleClusterResult {
    if (!this.map) {
      return { total: 0, inside: 0, outside: 0 };
    }

    this.clearVehicleClusters();
    const normalizedVehicles = vehicles
      .map(vehicle => this.normalizeVehicle(vehicle))
      .filter((vehicle): vehicle is any => !!vehicle);

    const insideVehicles = geofence
      ? normalizedVehicles.filter(vehicle => this.isPointInsideGeofence({ lat: vehicle.latitude, lng: vehicle.longitude }, geofence))
      : normalizedVehicles;
    const outsideVehicles = geofence
      ? normalizedVehicles.filter(vehicle => !this.isPointInsideGeofence({ lat: vehicle.latitude, lng: vehicle.longitude }, geofence))
      : [];

    const vehiclesToShow = mode === 'inside'
      ? insideVehicles
      : mode === 'outside'
        ? outsideVehicles
        : normalizedVehicles;

    const result = {
      total: normalizedVehicles.length,
      inside: insideVehicles.length,
      outside: geofence ? outsideVehicles.length : 0
    };

    if (vehiclesToShow.length === 0) {
      return result;
    }

    this.vehicleClusterLayer = (L as any).markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 60
    });

    vehiclesToShow.forEach(vehicle => {
      const marker = L.marker(this.toLatLngTuple(vehicle.latitude, vehicle.longitude), {
        icon: this.createVehicleIcon(vehicle)
      });
      marker.bindPopup(this.getClusterPopupHtml(vehicle));
      this.vehicleClusterLayer?.addLayer(marker);
    });

    this.vehicleClusterLayer.addTo(this.map);
    const bounds = this.vehicleClusterLayer.getBounds();
    if (bounds.isValid()) {
      this.map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 });
    }

    return result;
  }

  clearVehicleClusters(): void {
    if (this.map && this.vehicleClusterLayer) {
      this.map.removeLayer(this.vehicleClusterLayer);
    }
    this.vehicleClusterLayer = null;
  }

  changeMapStyle(style: string): void {
    this.currentMapStyle = style;

    if (!this.map) {
      return;
    }

    if (this.baseTileLayer) {
      this.map.removeLayer(this.baseTileLayer);
    }

    this.baseTileLayer = this.createBaseTileLayer(style);
    this.baseTileLayer.addTo(this.map);
    this.baseTileLayer.bringToBack();
  }

  private createBaseTileLayer(style: string): L.TileLayer {
    return createLeafletBasemap(style);
  }

  showLiveVehicle(data: any, path: GeofenceCoordinates[]): void {
    if (!this.map) {
      return;
    }

    const vehicle = this.normalizeVehicle(data);
    if (!vehicle) {
      return;
    }

    this.clearVehicleClusters();
    this.clearLiveVehicle();
    this.liveRouteLayer?.clearLayers();

    if (path.length > 1) {
      L.polyline(path.map(point => this.toLatLngTuple(point.lat, point.lng)), {
        color: '#0d6efd',
        weight: 4,
        opacity: 0.85,
        lineJoin: 'round',
        lineCap: 'round'
      }).addTo(this.liveRouteLayer as L.LayerGroup);
    }

    this.liveMarker = L.marker(this.toLatLngTuple(vehicle.latitude, vehicle.longitude), {
      icon: this.createVehicleIcon(vehicle, 34),
      zIndexOffset: 1000
    }).addTo(this.map);
    this.liveMarker.bindPopup(this.getLivePopupHtml(data));
    this.map.setView(this.toLatLngTuple(vehicle.latitude, vehicle.longitude), Math.max(this.map.getZoom(), 15));
  }

  clearLiveVehicle(): void {
    if (this.map && this.liveMarker) {
      this.map.removeLayer(this.liveMarker);
    }
    this.liveMarker = null;
    this.liveRouteLayer?.clearLayers();
  }

  showHistoryTrack(historyList: any[]): GeofenceCoordinates[] {
    if (!this.map) {
      return [];
    }

    this.clearHistoryTrack();
    const points = historyList
      .map(item => ({
        item,
        lat: Number(item?.param4 ?? item?.lat ?? item?.latitude),
        lng: Number(item?.param5 ?? item?.lng ?? item?.longitude)
      }))
      .filter(point => Number.isFinite(point.lat) && Number.isFinite(point.lng) && (point.lat !== 0 || point.lng !== 0));

    if (points.length < 2) {
      return [];
    }

    const coordinates = points.map(point => this.toLatLngTuple(point.lat, point.lng));
    L.polyline(coordinates, {
      color: '#dc2626',
      weight: 4,
      opacity: 0.85,
      lineJoin: 'round',
      lineCap: 'round'
    }).addTo(this.historyRouteLayer as L.LayerGroup);

    const start = points[0];
    const end = points[points.length - 1];
    this.historyStartMarker = L.marker(this.toLatLngTuple(start.lat, start.lng), { icon: this.createStartEndIcon('#198754', 'S') })
      .addTo(this.map)
      .bindPopup(this.getHistoryPopupHtml('Start Point', start.item));
    this.historyEndMarker = L.marker(this.toLatLngTuple(end.lat, end.lng), { icon: this.createStartEndIcon('#dc3545', 'E') })
      .addTo(this.map)
      .bindPopup(this.getHistoryPopupHtml('End Point', end.item));
    this.historyMarker = L.marker(this.toLatLngTuple(start.lat, start.lng), {
      icon: this.createVehicleIcon(start.item, 34),
      zIndexOffset: 1000
    }).addTo(this.map);

    points.forEach((point, index) => {
      if (index === 0 || index % 10 !== 0) {
        return;
      }
      L.circleMarker(this.toLatLngTuple(point.lat, point.lng), {
        radius: 4,
        color: '#dc2626',
        weight: 1,
        fillColor: '#fff',
        fillOpacity: 1
      }).addTo(this.historyArrowsLayer as L.LayerGroup).bindPopup(this.getHistoryPopupHtml('History Point', point.item));
    });

    const bounds = L.latLngBounds(coordinates);
    this.map.fitBounds(bounds, { padding: [32, 32] });

    return points.map(point => ({ lat: point.lat, lng: point.lng }));
  }

  moveHistoryMarker(point: GeofenceCoordinates, data?: any): void {
    if (!this.historyMarker) {
      return;
    }
    this.historyMarker.setLatLng(this.toLatLngTuple(point.lat, point.lng));
    if (data) {
      this.historyMarker.setIcon(this.createVehicleIcon(data, 34));
    }
  }

  clearHistoryTrack(): void {
    this.historyRouteLayer?.clearLayers();
    this.historyArrowsLayer?.clearLayers();

    [this.historyStartMarker, this.historyEndMarker, this.historyMarker].forEach(marker => {
      if (this.map && marker) {
        this.map.removeLayer(marker);
      }
    });

    this.historyStartMarker = null;
    this.historyEndMarker = null;
    this.historyMarker = null;
  }

  invalidateSize(): void {
    setTimeout(() => this.map?.invalidateSize(), 80);
  }

  destroyMap(): void {
    this.activeDrawer?.disable();
    this.activeDrawer = null;
    this.drawControl = null;
    this.drawnItems = null;
    this.vehicleClusterLayer = null;
    this.liveRouteLayer = null;
    this.liveMarker = null;
    this.historyRouteLayer = null;
    this.historyArrowsLayer = null;
    this.historyStartMarker = null;
    this.historyEndMarker = null;
    this.historyMarker = null;
    this.mapElement = null;

    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private addDrawControl(): void {
    if (!this.map || !this.drawnItems) {
      return;
    }

    this.drawControl = new (L.Control as any).Draw({
      position: 'topright',
      draw: {
        polygon: {
          allowIntersection: true,
          showArea: true,
          shapeOptions: this.getShapeOptions()
        },
        rectangle: {
          showArea: true,
          shapeOptions: this.getShapeOptions()
        },
        circle: {
          shapeOptions: this.getShapeOptions()
        },
        marker: false,
        circlemarker: false,
        polyline: false
      },
      edit: {
        featureGroup: this.drawnItems,
        remove: true
      }
    });

    this.map.addControl(this.drawControl);
  }

  private bindDrawEvents(): void {
    if (!this.map || !this.drawnItems) {
      return;
    }

    this.map.on((L as any).Draw.Event.CREATED, (event: L.LeafletEvent) => {
      const createdEvent = event as any;
      this.drawnItems?.clearLayers();
      this.drawnItems?.addLayer(createdEvent.layer);
      this.enableLayerEditing(createdEvent.layer);
      this.emitGeofence(createdEvent.layerType as GeofenceDrawType);
    });

    this.map.on((L as any).Draw.Event.EDITED, () => {
      this.enableExistingLayerEditing();
      this.emitGeofence();
    });
    this.map.on((L as any).Draw.Event.DELETED, () => this.geofenceSubject.next(null));
  }

  private emitGeofence(layerType?: GeofenceDrawType): void {
    let geofence: GeofenceShape | null = null;

    this.drawnItems?.eachLayer((layer: L.Layer) => {
      geofence = this.getShapeFromLayer(layer, layerType);
    });

    this.geofenceSubject.next(geofence);
  }

  private createDrawer(type: GeofenceDrawType, color: string): any {
    const drawMap = this.map as any;

    if (type === 'circle') {
      return new (L as any).Draw.Circle(drawMap, {
        shapeOptions: this.getShapeOptions(color)
      });
    }

    if (type === 'rectangle') {
      return new (L as any).Draw.Rectangle(drawMap, {
        showArea: true,
        shapeOptions: this.getShapeOptions(color)
      });
    }

    return new (L as any).Draw.Polygon(drawMap, {
      allowIntersection: false,
      showArea: true,
      shapeOptions: this.getShapeOptions(color)
    });
  }

  private createLayerFromShape(geofence: GeofenceShape, color: string): L.Layer | null {
    if (geofence.type === 'circle' && geofence.center && geofence.radius) {
      return L.circle([geofence.center.lat, geofence.center.lng], {
        ...this.getShapeOptions(color),
        radius: geofence.radius
      });
    }

    if (geofence.type === 'rectangle' && geofence.coordinates.length >= 2) {
      const bounds = L.latLngBounds(geofence.coordinates.map(point => L.latLng(point.lat, point.lng)));
      return L.rectangle(bounds, this.getShapeOptions(color));
    }

    if (geofence.type === 'polygon' && geofence.coordinates.length >= 3) {
      return L.polygon(geofence.coordinates.map(point => L.latLng(point.lat, point.lng)), this.getShapeOptions(color));
    }

    return null;
  }

  private getShapeFromLayer(layer: L.Layer, layerType?: GeofenceDrawType): GeofenceShape | null {
    if (layer instanceof L.Circle) {
      const center = layer.getLatLng();
      return {
        type: 'circle',
        center: this.toCoordinate(center),
        radius: Number(layer.getRadius().toFixed(2)),
        coordinates: [this.toCoordinate(center)]
      };
    }

    if (layer instanceof L.Rectangle || layerType === 'rectangle') {
      const bounds = (layer as L.Rectangle).getBounds();
      return {
        type: 'rectangle',
        coordinates: [
          this.toCoordinate(bounds.getNorthWest()),
          this.toCoordinate(bounds.getNorthEast()),
          this.toCoordinate(bounds.getSouthEast()),
          this.toCoordinate(bounds.getSouthWest())
        ]
      };
    }

    if (layer instanceof L.Polygon) {
      const latLngs = layer.getLatLngs()[0] as L.LatLng[];
      return {
        type: 'polygon',
        coordinates: latLngs.map(point => this.toCoordinate(point))
      };
    }

    return null;
  }

  private enableExistingLayerEditing(): void {
    this.drawnItems?.eachLayer((layer: L.Layer) => this.enableLayerEditing(layer));
  }

  private enableLayerEditing(layer: L.Layer): void {
    const editableLayer = layer as L.Layer & {
      editing?: {
        enable: () => void;
        disable?: () => void;
      };
      bringToFront?: () => void;
    };

    editableLayer.bringToFront?.();
    setTimeout(() => editableLayer.editing?.enable(), 0);
    layer.off('click');
    layer.off('edit');
    layer.on('click', () => {
      editableLayer.bringToFront?.();
      editableLayer.editing?.enable();
    });
    layer.on('edit', () => this.emitGeofence());
  }

  private fitLayer(layer: L.Layer): void {
    if (!this.map) {
      return;
    }

    if (layer instanceof L.Circle) {
      this.map.fitBounds(layer.getBounds(), { padding: [24, 24], maxZoom: 16 });
      return;
    }

    if (layer instanceof L.Polygon) {
      this.map.fitBounds(layer.getBounds(), { padding: [24, 24], maxZoom: 16 });
    }
  }

  private toCoordinate(point: L.LatLng): GeofenceCoordinates {
    return {
      lat: Number(point.lat.toFixed(6)),
      lng: Number(point.lng.toFixed(6))
    };
  }

  private getShapeOptions(color = '#1d9d74'): L.PolylineOptions {
    return {
      color,
      weight: 3,
      opacity: 0.95,
      fillColor: color,
      fillOpacity: 0.24
    };
  }

  private fixDefaultMarkerIcon(): void {
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'assets/marker-icon-2x.png',
      iconUrl: 'assets/marker-icon.png',
      shadowUrl: 'assets/marker-shadow.png'
    });
  }

  private normalizeVehicle(vehicle: any): any | null {
    const latitude = Number(vehicle?.latitude ?? vehicle?.param38 ?? vehicle?.param4 ?? vehicle?.lat);
    const longitude = Number(vehicle?.longitude ?? vehicle?.param39 ?? vehicle?.param5 ?? vehicle?.lng);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || (latitude === 0 && longitude === 0)) {
      return null;
    }

    const speed = Number(vehicle?.vehiclespeed ?? vehicle?.param40 ?? vehicle?.param8 ?? vehicle?.speed ?? 0);
    const direction = Number(vehicle?.vehicledirection ?? vehicle?.param43 ?? vehicle?.direction ?? 0);
    const ignitionOn = speed > 0
      || vehicle?.ignitionstatus === '1'
      || vehicle?.ignitionstatus === 'On'
      || vehicle?.param45 === '1'
      || vehicle?.param12 === '1';

    return {
      ...vehicle,
      latitude,
      longitude,
      vehiclespeed: speed,
      direction,
      ignitionstatus: ignitionOn ? '1' : '0'
    };
  }

  private toLatLngTuple(lat: number, lng: number): L.LatLngTuple {
    return [lat, lng];
  }

  private createVehicleIcon(vehicle: any, size = 28): L.DivIcon {
    const iconUrl = this.getVehicleIconUrl(vehicle);
    const direction = Number(vehicle?.direction ?? vehicle?.vehicledirection ?? vehicle?.param43 ?? 0);

    return L.divIcon({
      className: 'vehicle-marker-div-custom',
      html: `<div style="width:${size}px;height:${size}px;transform:rotate(${direction}deg)">
        <img src="${iconUrl}" width="${size}" height="${size}" style="object-fit:contain;filter:drop-shadow(0 1px 2px rgba(0,0,0,.45))"/>
      </div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  }

  private getVehicleIconUrl(vehicle: any): string {
    const vehicleClass = String(vehicle?.vehicleclassname ?? '').toLowerCase();
    const speed = Number(vehicle?.vehiclespeed ?? vehicle?.param40 ?? vehicle?.param8 ?? vehicle?.speed ?? 0);
    const ignitionOn = speed > 0 || vehicle?.ignitionstatus === '1' || vehicle?.ignitionstatus === 'On' || vehicle?.param45 === '1' || vehicle?.param12 === '1';

    if (vehicleClass.includes('ambulance')) return 'assets/mapimages/NewVehiles/ambulance.png';
    if (vehicleClass.includes('goodscarrier')) return 'assets/mapimages/NewVehiles/goodscarrier-.png';
    if (vehicleClass.includes('motorcab')) return 'assets/mapimages/NewVehiles/motorcab.png';
    if (vehicleClass.includes('police')) return 'assets/mapimages/NewVehiles/police.png';
    if (vehicleClass.includes('privatecar')) return 'assets/mapimages/NewVehiles/privatecar.png';
    if (vehicleClass.includes('schoolbus')) return 'assets/mapimages/NewVehiles/schoolbus-.png';

    return ignitionOn ? (speed > 0 ? 'assets/mapimages/car/green.png' : 'assets/mapimages/car/yellow.png') : 'assets/mapimages/car/red.png';
  }

  private isPointInsideGeofence(point: GeofenceCoordinates, geofence: GeofenceShape): boolean {
    if (geofence.type === 'circle' && geofence.center && geofence.radius) {
      return this.map ? this.map.distance([point.lat, point.lng], [geofence.center.lat, geofence.center.lng]) <= geofence.radius : false;
    }

    const polygon = geofence.coordinates;
    if (polygon.length < 3) {
      return false;
    }

    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lng;
      const yi = polygon[i].lat;
      const xj = polygon[j].lng;
      const yj = polygon[j].lat;
      const intersect = ((yi > point.lat) !== (yj > point.lat))
        && (point.lng < ((xj - xi) * (point.lat - yi)) / ((yj - yi) || Number.EPSILON) + xi);
      if (intersect) {
        inside = !inside;
      }
    }

    return inside;
  }

  private getClusterPopupHtml(vehicle: any): string {
    const vehicleNo = vehicle?.vehicleregno || vehicle?.param13 || vehicle?.vehicleno || 'N/A';
    const speed = Number(vehicle?.vehiclespeed || vehicle?.param40 || vehicle?.speed || 0);
    const ignition = vehicle?.ignitionstatus === '1' ? 'On' : 'Off';

    return `<div class="vts-popup-pro">
      <div class="vts-popup-pro__header">
        <strong>${vehicleNo}</strong>
        <span>${speed} km/h</span>
      </div>
      <div class="vts-popup-pro__body">
        <div>Ignition: ${ignition}</div>
        <div>${Number(vehicle.latitude).toFixed(5)}, ${Number(vehicle.longitude).toFixed(5)}</div>
        <button class="vts-popup-pro__track-btn" onclick="document.dispatchEvent(new CustomEvent('vts-track-live', {detail:'${vehicleNo}'}))">Track Live</button>
      </div>
    </div>`;
  }

  private getLivePopupHtml(data: any): string {
    const vehicleNo = data?.param13 || data?.vehicleno || 'N/A';
    const speed = data?.param40 || data?.speed || 0;
    const time = data?.param35 || data?.pollingdate || '';
    return `<div class="vts-popup-pro"><strong>${vehicleNo}</strong><div>${speed} km/h</div><div>${time}</div></div>`;
  }

  private getHistoryPopupHtml(title: string, item: any): string {
    const vehicleNo = item?.param15 || item?.param13 || item?.vehicleno || 'N/A';
    const speed = item?.param8 || item?.speed || 0;
    const time = item?.param3 || item?.pollingdate || '';
    return `<div class="vts-popup-pro"><strong>${title}</strong><div>${vehicleNo}</div><div>${speed} km/h</div><div>${time}</div></div>`;
  }

  private createStartEndIcon(color: string, label: string): L.DivIcon {
    return L.divIcon({
      className: 'start-end-marker-div',
      html: `<div style="width:24px;height:24px;border-radius:50%;background:${color};color:#fff;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;box-shadow:0 1px 4px rgba(0,0,0,.4)">${label}</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  }
}