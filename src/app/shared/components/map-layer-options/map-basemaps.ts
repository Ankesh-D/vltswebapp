import * as L from 'leaflet';
import type { Map as MapboxMap } from 'mapbox-gl';

export const MAP_BASEMAPS = [
  { id: 'streets-v11', name: 'Streets', description: 'OpenStreetMap', icon: 'fa-road', tiles: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '© OpenStreetMap contributors', maxZoom: 19 },
  { id: 'satellite-v9', name: 'Satellite', description: 'Esri World Imagery', icon: 'fa-globe', tiles: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: '© Esri', maxZoom: 19 },
  { id: 'googlestreet', name: 'Google Street', description: 'Google road map', icon: 'fa-road', tiles: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', attribution: '© Google', maxZoom: 20 },
  { id: 'googlehybrid', name: 'Google Hybrid', description: 'Satellite with labels', icon: 'fa-globe', tiles: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', attribution: '© Google', maxZoom: 20 },
  { id: 'tomtom', name: 'TomTom', description: 'TomTom Basic Map', icon: 'fa-map', tiles: 'https://api.tomtom.com/map/1/wms/?key=I18s7OByirZU7TldZeRYxdjYpiaPgqww', attribution: '© TomTom', maxZoom: 20 }
] as const;

export function createLeafletBasemap(id: 'tomtom'): L.TileLayer.WMS;
export function createLeafletBasemap(id: string): L.TileLayer;
export function createLeafletBasemap(id: string): L.TileLayer {
  const style = MAP_BASEMAPS.find(item => item.id === id) ?? MAP_BASEMAPS[0];
  const options = { maxZoom: style.maxZoom, attribution: style.attribution, zIndex: 0 };
  if (style.id === 'tomtom') {
    return L.tileLayer.wms(style.tiles, { ...options, layers: 'basic', styles: '', format: 'image/png', transparent: false, version: '1.1.1', crs: L.CRS.EPSG3857, uppercase: true });
  }
  return L.tileLayer(style.tiles, options);
}

interface BasemapState { initialLayers: string[]; selected: string; ready: boolean; }
const mapboxStates = new WeakMap<MapboxMap, BasemapState>();

/** Capture the original base style before a page adds its alert/route overlays. */
export function registerMapboxBasemaps(map: MapboxMap, selected = 'streets-v11'): void {
  if (mapboxStates.has(map)) return;
  const state: BasemapState = { initialLayers: [], selected, ready: false };
  mapboxStates.set(map, state);
  const capture = () => {
    state.initialLayers = (map.getStyle()?.layers ?? []).map(layer => layer.id);
    state.ready = true;
    switchMapboxBasemap(map, state.selected);
  };
  map.on('style.load', capture);
  map.on('remove', () => { map.off('style.load', capture); mapboxStates.delete(map); });
  if (map.isStyleLoaded()) capture();
}

/** Switch only the base raster, retaining custom sources, images, markers and layers. */
export function switchMapboxBasemap(map: MapboxMap, id: string): void {
  if (!mapboxStates.has(map)) registerMapboxBasemaps(map, id);
  const state = mapboxStates.get(map)!;
  const style = MAP_BASEMAPS.find(item => item.id === id) ?? MAP_BASEMAPS[0];
  state.selected = style.id;
  if (!state.ready) return;
  state.initialLayers.forEach(layer => {
    if (map.getLayer(layer)) map.setLayoutProperty(layer, 'visibility', 'none');
  });
  const sourceId = `psv-basemap-${style.id}`;
  if (!map.getSource(sourceId)) {
    const tiles = style.id === 'tomtom'
      ? `${style.tiles}&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=basic&STYLES=&FORMAT=image/png&TRANSPARENT=false&SRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256`
      : style.tiles;
    map.addSource(sourceId, { type: 'raster', tiles: [tiles], tileSize: 256, maxzoom: style.maxZoom, attribution: style.attribution });
  }
  if (!map.getLayer(sourceId)) {
    map.addLayer({ id: sourceId, type: 'raster', source: sourceId }, map.getStyle()?.layers?.[0]?.id);
  }
  MAP_BASEMAPS.forEach(item => {
    const layerId = `psv-basemap-${item.id}`;
    if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', item.id === style.id ? 'visible' : 'none');
  });
  map.fire('psv:basemapchange', { id: style.id });
}

/** Native control for maps without an Angular layer menu (including service-owned maps). */
export function addMapBasemapControl(map: MapboxMap | L.Map, engine: 'mapbox' | 'leaflet', initial = 'streets-v11'): void {
  const root = document.createElement('div');
  root.className = engine === 'mapbox' ? 'psv-basemap-control mapboxgl-ctrl' : 'psv-basemap-control';
  const toggle = document.createElement('button');
  toggle.type = 'button'; toggle.className = 'psv-basemap-toggle';
  toggle.innerHTML = '<i class="fa fa-map" aria-hidden="true"></i> Layers';
  toggle.setAttribute('aria-expanded', 'false');
  const panel = document.createElement('section');
  panel.className = 'psv-basemap-panel'; panel.hidden = true; panel.setAttribute('aria-label', 'Map layers');
  const header = document.createElement('header');
  header.innerHTML = '<span><i class="fa fa-map" aria-hidden="true"></i> Map Layers</span>';
  const close = document.createElement('button');
  close.type = 'button'; close.textContent = '×'; close.setAttribute('aria-label', 'Close map layers');
  header.append(close); panel.append(header);
  const options = document.createElement('div'); options.className = 'psv-basemap-options'; panel.append(options);
  const attribution = document.createElement('small'); attribution.className = 'psv-basemap-attribution'; panel.append(attribution);
  root.append(toggle, panel);
  const open = (value: boolean) => {
    if (value) panel.style.maxHeight = `${Math.max(100, (map.getContainer?.()?.clientHeight || 420) - 80)}px`;
    panel.hidden = !value;
    toggle.setAttribute('aria-expanded', String(value));
    if (!value) toggle.focus();
  };
  toggle.onclick = () => open(panel.hidden === true); close.onclick = () => open(false);
  root.onkeydown = event => { if (event.key === 'Escape') { event.stopPropagation(); open(false); } };
  let currentLayer: L.TileLayer | undefined;
  const buttons: HTMLButtonElement[] = [];
  const updateSelection = (id: string) => {
    buttons.forEach((button, index) => { const active = MAP_BASEMAPS[index].id === id; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
    attribution.textContent = MAP_BASEMAPS.find(style => style.id === id)?.attribution ?? '';
  };
  const select = (id: string) => {
    if (engine === 'mapbox') {
      switchMapboxBasemap(map as MapboxMap, id);
    } else {
      const leafletMap = map as L.Map;
      // Leave WMS boundaries, markers, geofences and track groups in place.
      leafletMap.eachLayer(layer => {
        if (layer === currentLayer || (layer instanceof L.TileLayer && !(layer instanceof L.TileLayer.WMS))) leafletMap.removeLayer(layer);
      });
      currentLayer = createLeafletBasemap(id).addTo(leafletMap);
      currentLayer.bringToBack();
    }
    updateSelection(id);
  };
  MAP_BASEMAPS.forEach(style => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'psv-basemap-option';
    button.innerHTML = `<span class="psv-basemap-icon"><i class="fa ${style.icon}" aria-hidden="true"></i></span><span class="psv-basemap-info"><strong>${style.name}</strong><small>${style.description}</small></span><i class="fa fa-check psv-basemap-check" aria-hidden="true"></i>`;
    button.onclick = () => select(style.id); buttons.push(button); options.append(button);
  });
  if (engine === 'leaflet') {
    L.DomEvent.disableClickPropagation(root); L.DomEvent.disableScrollPropagation(root);
    const control = new L.Control({ position: 'topright' }); control.onAdd = () => root; control.addTo(map as L.Map);
    // Page code may add its initial tiles immediately after constructing the map.
    let removed = false;
    (map as L.Map).once('unload', () => removed = true);
    queueMicrotask(() => { if (!removed) select(initial); });
  } else {
    const mapboxMap = map as MapboxMap;
    registerMapboxBasemaps(mapboxMap, initial);
    mapboxMap.addControl({ onAdd: () => root, onRemove: () => root.remove() }, 'top-right');
    updateSelection(initial);
    const syncSelection = (event: { id: string }) => updateSelection(event.id);
    mapboxMap.on('psv:basemapchange', syncSelection);
    mapboxMap.on('remove', () => mapboxMap.off('psv:basemapchange', syncSelection));
    root.addEventListener('pointerdown', event => event.stopPropagation());
    root.addEventListener('wheel', event => event.stopPropagation());
  }
}
