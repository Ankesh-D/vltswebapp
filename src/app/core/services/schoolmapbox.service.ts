import { addMapBasemapControl, switchMapboxBasemap } from '../../shared/components/map-layer-options/map-basemaps';
import { Injectable, NgZone } from '@angular/core';
import { Subject } from 'rxjs';
import mapboxgl from 'mapbox-gl';
import { configureMapboxAccessToken } from '../utils/mapbox-config';

/** A single point that needs to be plotted / routed through on the map. */
export interface SchoolMapPoint {
  sequence: number;
  label: string;
  latitude: number;
  longitude: number;
  arrival?: string;
  departure?: string;
  studentCount?: number;
}

/** Result of a leg (the segment between two consecutive route points). */
export interface SchoolMapRouteLeg {
  distanceKm: number;
  durationMin: number;
}

/** Aggregated result emitted every time the route is (re)calculated. */
export interface SchoolMapRouteResult {
  totalDistanceKm: number;
  totalDurationMin: number;
  legs: SchoolMapRouteLeg[];
  geometry: any;
}

export interface SchoolMapMarkerDrag {
  markerType: 'source' | 'destination' | 'stop';
  stopIndex?: number;
  latitude: number;
  longitude: number;
}

/**
 * Centralised Mapbox GL logic for the School Trip Master module.
 *
 * Responsibilities:
 *  - Create/destroy a single Mapbox map instance (never re-created on updates).
 *  - Plot School / Source / Destination / Stop markers with numbered, colour-coded pins.
 *  - Draw the driving route (Mapbox Directions API) through Source -> Stops -> Destination.
 *  - Support click-to-add-stop and drag-to-reposition with reverse geocoding.
 *  - Provide map controls (navigation, fullscreen, geolocate, satellite/street toggle).
 *
 * All map/DOM concerns live here so components stay focused on business/UI logic.
 */
@Injectable({
  providedIn: 'root'
})
export class SchoolmapboxService {

  private readonly accessToken = window.__runtimeConfig?.mapboxAccessToken?.trim() ?? '';
  private readonly streetsStyle = 'mapbox://styles/mapbox/streets-v11';

  private readonly routeSourceId = 'school-trip-route-source';
  private readonly routeLayerId = 'school-trip-route-layer';
  private readonly routeCasingLayerId = 'school-trip-route-casing-layer';

  private map: mapboxgl.Map | null = null;
  private schoolMarker: mapboxgl.Marker | null = null;
  private sourceMarker: mapboxgl.Marker | null = null;
  private destinationMarker: mapboxgl.Marker | null = null;
  private stopMarkers: mapboxgl.Marker[] = [];
  private activePopup: mapboxgl.Popup | null = null;
  private clickHandler: ((e: mapboxgl.MapMouseEvent) => void) | null = null;
  private isSatellite = false;
  private lastRoutePoints: SchoolMapPoint[] = [];

  /** Emits {lat,lng} when the user clicks the map while "add stop" mode is enabled. */
  public addStopRequested$ = new Subject<{ latitude: number; longitude: number }>();
  /** Emits whenever a source/destination/stop marker is dragged to a new position. */
  public markerDragged$ = new Subject<SchoolMapMarkerDrag>();
  /** Emits the freshly calculated route (distance/duration per leg + total). */
  public routeCalculated$ = new Subject<SchoolMapRouteResult>();
  /** Emits a human readable message whenever a Mapbox call fails. */
  public mapError$ = new Subject<string>();

  constructor(private zone: NgZone) {
    if (this.accessToken) {
      configureMapboxAccessToken(mapboxgl);
    }
  }

  /** Whether the map instance has already been created. */
  get isInitialized(): boolean {
    return !!this.map;
  }

  getMap(): mapboxgl.Map | null {
    return this.map;
  }

  /**
   * Creates the Mapbox map exactly once. Subsequent calls are no-ops so the
   * map is never destroyed/recreated while the user edits the form.
   */
  initializeMap(containerId: string, center: [number, number] = [78.9629, 20.5937], zoom = 5): void {
    if (!this.accessToken || !configureMapboxAccessToken(mapboxgl)) {
      return;
    }
    if (this.map) {
      // Container may have been re-rendered (e.g. toggling grid/form view) - just resize.
      setTimeout(() => this.map?.resize(), 200);
      return;
    }
    try {
      this.map = new mapboxgl.Map({
        container: containerId,
        style: this.streetsStyle,
        center,
        zoom,
        minZoom: 2,
        maxZoom: 19,
        attributionControl: false
      });
      addMapBasemapControl(this.map, 'mapbox');
      this.map.on('psv:basemapchange', (event: { id: string }) => {
        this.isSatellite = event.id === 'satellite-v9';
      });

      this.map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right');
      this.map.addControl(new mapboxgl.FullscreenControl(), 'top-right');
      this.map.addControl(new mapboxgl.ScaleControl({ unit: 'metric' }), 'bottom-left');
      this.map.addControl(new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
        showUserHeading: true
      }), 'top-right');

      this.map.on('load', () => this.map?.resize());
      this.map.on('error', (e: any) => {
        this.zone.run(() => this.mapError$.next(e?.error?.message || 'Map failed to load a resource.'));
      });
    } catch (err) {
      this.mapError$.next('Unable to initialize the map. Please refresh the page.');
    }
  }

  /** Enables/disables "click on map to add a stop" mode. */
  enableClickToAddStop(enable: boolean): void {
    if (!this.map) { return; }
    if (this.clickHandler) {
      this.map.off('click', this.clickHandler);
      this.clickHandler = null;
      this.map.getCanvas().style.cursor = '';
    }
    if (enable) {
      this.clickHandler = (e: mapboxgl.MapMouseEvent) => {
        this.zone.run(() => {
          this.addStopRequested$.next({ latitude: e.lngLat.lat, longitude: e.lngLat.lng });
        });
      };
      this.map.on('click', this.clickHandler);
      this.map.getCanvas().style.cursor = 'crosshair';
    }
  }

  setSchoolMarker(latitude: number, longitude: number, label = 'School'): void {
    if (!this.map || isNaN(latitude) || isNaN(longitude)) { return; }
    this.schoolMarker?.remove();
    const el = this.buildPinElement('#6f42c1', 'S');
    this.schoolMarker = new mapboxgl.Marker({ element: el })
      .setLngLat([longitude, latitude])
      .setPopup(new mapboxgl.Popup({ offset: 20 }).setHTML(`<strong>${this.escape(label)}</strong>`))
      .addTo(this.map);
  }

  setSourceMarker(latitude: number, longitude: number, label = 'Source', draggable = true): void {
    if (!this.map || isNaN(latitude) || isNaN(longitude)) { return; }
    this.sourceMarker?.remove();
    const el = this.buildPinElement('#28a745', 'A');
    this.sourceMarker = new mapboxgl.Marker({ element: el, draggable })
      .setLngLat([longitude, latitude])
      .setPopup(this.buildPopup({ sequence: 0, label, latitude, longitude }))
      .addTo(this.map);

    if (draggable) {
      this.sourceMarker.on('dragend', () => {
        const lngLat = this.sourceMarker!.getLngLat();
        this.zone.run(() => this.markerDragged$.next({ markerType: 'source', latitude: lngLat.lat, longitude: lngLat.lng }));
      });
    }
  }

  setDestinationMarker(latitude: number, longitude: number, label = 'Destination', draggable = true): void {
    if (!this.map || isNaN(latitude) || isNaN(longitude)) { return; }
    this.destinationMarker?.remove();
    const el = this.buildPinElement('#dc3545', 'B');
    this.destinationMarker = new mapboxgl.Marker({ element: el, draggable })
      .setLngLat([longitude, latitude])
      .setPopup(this.buildPopup({ sequence: -1, label, latitude, longitude }))
      .addTo(this.map);

    if (draggable) {
      this.destinationMarker.on('dragend', () => {
        const lngLat = this.destinationMarker!.getLngLat();
        this.zone.run(() => this.markerDragged$.next({ markerType: 'destination', latitude: lngLat.lat, longitude: lngLat.lng }));
      });
    }
  }

  /** Renders numbered blue stop markers, replacing any previously rendered stop markers. */
  renderStopMarkers(stops: SchoolMapPoint[], draggable = true): void {
    if (!this.map) { return; }
    this.stopMarkers.forEach(m => m.remove());
    this.stopMarkers = [];

    stops.forEach((stop, index) => {
      if (isNaN(stop.latitude) || isNaN(stop.longitude)) { return; }
      const el = this.buildPinElement('#007bff', String(stop.sequence));
      const marker = new mapboxgl.Marker({ element: el, draggable })
        .setLngLat([stop.longitude, stop.latitude])
        .setPopup(this.buildPopup(stop))
        .addTo(this.map!);

      if (draggable) {
        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          this.zone.run(() => this.markerDragged$.next({
            markerType: 'stop', stopIndex: index, latitude: lngLat.lat, longitude: lngLat.lng
          }));
        });
      }
      this.stopMarkers.push(marker);
    });
  }

  /**
   * Requests a driving route from Mapbox Directions API through the given ordered
   * points (Source -> Stops in sequence -> Destination), draws it on the map and
   * emits the total/per-leg distance & duration.
   */
  async drawRoute(points: SchoolMapPoint[]): Promise<void> {
    if (!this.map) { return; }
    const valid = points.filter(p => !isNaN(p.latitude) && !isNaN(p.longitude));
    this.lastRoutePoints = valid;

    if (valid.length < 2) {
      this.clearRouteLayer();
      return;
    }

    const coordsParam = valid.map(p => `${p.longitude},${p.latitude}`).join(';');
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordsParam}` +
      `?geometries=geojson&overview=full&steps=false&annotations=distance,duration&access_token=${this.accessToken}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Directions API returned ${response.status}`);
      }
      const data = await response.json();
      const route = data?.routes?.[0];
      if (!route) {
        throw new Error('No route could be found between the selected points.');
      }

      this.paintRoute(route.geometry);
      this.fitToBounds(valid.map(p => [p.longitude, p.latitude] as [number, number]));

      const legs: SchoolMapRouteLeg[] = (route.legs || []).map((leg: any) => ({
        distanceKm: Math.round((leg.distance / 1000) * 100) / 100,
        durationMin: Math.round(leg.duration / 60)
      }));

      const result: SchoolMapRouteResult = {
        totalDistanceKm: Math.round((route.distance / 1000) * 100) / 100,
        totalDurationMin: Math.round(route.duration / 60),
        legs,
        geometry: route.geometry
      };
      this.zone.run(() => this.routeCalculated$.next(result));
    } catch (err: any) {
      // Graceful fallback: draw a straight-line route and use haversine distance
      // so the UI keeps working even if the Directions API is unreachable.
      this.zone.run(() => this.mapError$.next(err?.message || 'Could not calculate the driving route. Showing a straight-line estimate instead.'));
      this.drawStraightLineFallback(valid);
    }
  }

  /** Removes the current route layer/source (used by "Reset Route"). */
  resetRoute(): void {
    this.clearRouteLayer();
  }

  /** Re-runs route calculation using the last set of points (e.g. after a stop edit). */
  async recalculateLastRoute(): Promise<void> {
    if (this.lastRoutePoints.length) {
      await this.drawRoute(this.lastRoutePoints);
    }
  }

  /** Fits the map viewport so every supplied [lng, lat] pair is visible. */
  fitToBounds(coords: [number, number][]): void {
    if (!this.map || coords.length === 0) { return; }
    if (coords.length === 1) {
      this.map.flyTo({ center: coords[0], zoom: 14 });
      return;
    }
    const bounds = coords.reduce((b, c) => b.extend(c), new mapboxgl.LngLatBounds(coords[0], coords[0]));
    this.map.fitBounds(bounds, { padding: 60, maxZoom: 16, duration: 600 });
  }

  /** Toggles between street-map and satellite styles, preserving markers/route. */
  toggleSatellite(): void {
    if (!this.map) { return; }
    this.isSatellite = !this.isSatellite;
    switchMapboxBasemap(this.map, this.isSatellite ? 'satellite-v9' : 'streets-v11');
  }

  /** Reverse geocodes a coordinate to a human readable address using the Mapbox Geocoding API. */
  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${this.accessToken}&limit=1`;
    try {
      const response = await fetch(url);
      if (!response.ok) { throw new Error('Geocoding request failed'); }
      const data = await response.json();
      return data?.features?.[0]?.place_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    } catch {
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  }

  /** Cleans up all markers, layers, sources, listeners and destroys the map. Call from ngOnDestroy. */
  destroyMap(): void {
    this.enableClickToAddStop(false);
    this.stopMarkers.forEach(m => m.remove());
    this.stopMarkers = [];
    this.schoolMarker?.remove();
    this.sourceMarker?.remove();
    this.destinationMarker?.remove();
    this.schoolMarker = this.sourceMarker = this.destinationMarker = null;
    this.activePopup?.remove();
    this.activePopup = null;
    this.lastRoutePoints = [];
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  // ---------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------

  private paintRoute(geometry: any): void {
    if (!this.map) { return; }
    const geojson: any = { type: 'Feature', properties: {}, geometry };
    const source = this.map.getSource(this.routeSourceId) as mapboxgl.GeoJSONSource | undefined;
    if (source) {
      source.setData(geojson);
      return;
    }
    this.map.addSource(this.routeSourceId, { type: 'geojson', data: geojson });
    this.map.addLayer({
      id: this.routeCasingLayerId,
      type: 'line',
      source: this.routeSourceId,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#0d3c73', 'line-width': 9, 'line-opacity': 0.35 }
    });
    this.map.addLayer({
      id: this.routeLayerId,
      type: 'line',
      source: this.routeSourceId,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#1f7aec', 'line-width': 5 }
    });
  }

  private clearRouteLayer(): void {
    if (!this.map) { return; }
    if (this.map.getLayer(this.routeLayerId)) { this.map.removeLayer(this.routeLayerId); }
    if (this.map.getLayer(this.routeCasingLayerId)) { this.map.removeLayer(this.routeCasingLayerId); }
    if (this.map.getSource(this.routeSourceId)) { this.map.removeSource(this.routeSourceId); }
    this.lastRoutePoints = [];
  }

  /** Straight-line haversine based fallback route when the Directions API is unavailable. */
  private drawStraightLineFallback(points: SchoolMapPoint[]): void {
    const coordinates = points.map(p => [p.longitude, p.latitude]);
    this.paintRoute({ type: 'LineString', coordinates });
    this.fitToBounds(coordinates as [number, number][]);

    const legs: SchoolMapRouteLeg[] = [];
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      const km = this.haversineKm(points[i - 1], points[i]);
      total += km;
      legs.push({ distanceKm: Math.round(km * 100) / 100, durationMin: Math.round((km / 30) * 60) }); // assume 30km/h avg
    }
    this.routeCalculated$.next({
      totalDistanceKm: Math.round(total * 100) / 100,
      totalDurationMin: legs.reduce((s, l) => s + l.durationMin, 0),
      legs,
      geometry: { type: 'LineString', coordinates }
    });
  }

  private haversineKm(a: SchoolMapPoint, b: SchoolMapPoint): number {
    const R = 6371;
    const dLat = this.toRad(b.latitude - a.latitude);
    const dLng = this.toRad(b.longitude - a.longitude);
    const lat1 = this.toRad(a.latitude);
    const lat2 = this.toRad(b.latitude);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  private toRad(deg: number): number {
    return deg * Math.PI / 180;
  }

  private buildPinElement(color: string, text: string): HTMLDivElement {
    const el = document.createElement('div');
    el.className = 'school-trip-marker';
    el.style.background = color;
    el.style.width = '26px';
    el.style.height = '26px';
    el.style.borderRadius = '50% 50% 50% 0';
    el.style.transform = 'rotate(-45deg)';
    el.style.border = '2px solid #fff';
    el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.4)';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';

    const span = document.createElement('span');
    span.textContent = text;
    span.style.transform = 'rotate(45deg)';
    span.style.color = '#fff';
    span.style.fontSize = '11px';
    span.style.fontWeight = '700';
    el.appendChild(span);
    return el;
  }

  private buildPopup(point: SchoolMapPoint): mapboxgl.Popup {
    const title = point.sequence === 0 ? `Source: ${point.label}` : point.sequence === -1 ? `Destination: ${point.label}` : `Stop ${point.sequence}: ${point.label}`;
    const html = `
      <div style="font-size:12px; min-width:180px;">
        <strong>${this.escape(title)}</strong>
        ${point.arrival ? `<div>Arrival: ${this.escape(point.arrival)}</div>` : ''}
        ${point.departure ? `<div>Departure: ${this.escape(point.departure)}</div>` : ''}
        ${point.studentCount ? `<div>Students: ${point.studentCount}</div>` : ''}
        <div>Lat/Lng: ${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}</div>
      </div>`;
    return new mapboxgl.Popup({ offset: 20 }).setHTML(html);
  }

  private escape(text: string): string {
    const div = document.createElement('div');
    div.textContent = text ?? '';
    return div.innerHTML;
  }
}
