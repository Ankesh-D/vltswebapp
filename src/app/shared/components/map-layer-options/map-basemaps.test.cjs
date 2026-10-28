// Run with: node src/app/shared/components/map-layer-options/map-basemaps.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { test } = require('node:test');

class Element {
  constructor() { this.children = []; this.attributes = {}; this.style = {}; this.classes = new Set(); }
  append(...children) { this.children.push(...children); }
  setAttribute(key, value) { this.attributes[key] = value; }
  getAttribute(key) { return this.attributes[key]; }
  addEventListener() {}
  remove() {}
  focus() { this.focused = true; }
  classList = {
    add: value => this.classes.add(value),
    toggle: (value, active) => active ? this.classes.add(value) : this.classes.delete(value),
    contains: value => this.classes.has(value)
  };
}
class TileLayer {
  constructor(url, options) { this.url = url; this.options = options; }
  addTo(map) { map.layers.push(this); return this; }
  bringToBack() { this.back = true; }
}
class WMS extends TileLayer {}
TileLayer.WMS = WMS;
const tileLayer = (url, options) => new TileLayer(url, options);
tileLayer.wms = (url, options) => new WMS(url, options);
const leaflet = {
  TileLayer, tileLayer, CRS: { EPSG3857: 'EPSG:3857' },
  DomEvent: { disableClickPropagation() {}, disableScrollPropagation() {} },
  Control: class { addTo(map) { map.control = this.onAdd(); } }
};
const pending = [];
const moduleExports = {};
const source = fs.readFileSync(`${__dirname}/map-basemaps.ts`, 'utf8');
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
  exports: moduleExports, require: name => { assert.equal(name, 'leaflet'); return leaflet; },
  document: { createElement: () => new Element() }, queueMicrotask: fn => pending.push(fn), WeakMap
});
const { MAP_BASEMAPS, createLeafletBasemap, registerMapboxBasemaps, switchMapboxBasemap, addMapBasemapControl } = moduleExports;
class MapboxMap {
  constructor(loaded = true) { this.ready = loaded; this.layers = [{ id: 'roads', type: 'line' }, { id: 'labels', type: 'symbol' }]; this.sources = new Map(); this.events = new Map(); }
  on(name, fn) { this.events.set(name, [...(this.events.get(name) || []), fn]); }
  off(name, fn) { this.events.set(name, (this.events.get(name) || []).filter(item => item !== fn)); }
  fire(name, data = {}) { for (const fn of [...(this.events.get(name) || [])]) fn(data); }
  isStyleLoaded() { return this.ready; }
  getStyle() { return { layers: this.layers }; }
  getLayer(id) { return this.layers.find(layer => layer.id === id); }
  getSource(id) { return this.sources.get(id); }
  addSource(id, source) { assert(!this.sources.has(id)); this.sources.set(id, source); }
  addLayer(layer, before) { const index = this.layers.findIndex(item => item.id === before); this.layers.splice(index < 0 ? this.layers.length : index, 0, layer); }
  setLayoutProperty(id, property, value) { this.getLayer(id)[property] = value; }
  addControl(control) { this.control = control.onAdd(this); }
}
const visible = map => map.layers.filter(layer => layer.id.startsWith('psv-basemap-') && layer.visibility === 'visible');

test('all five choices use their advertised providers, including real TomTom WMS', () => {
  assert.equal(MAP_BASEMAPS.length, 5);
  for (const style of MAP_BASEMAPS) assert.equal(createLeafletBasemap(style.id).options.attribution, style.attribution);
  const tomtom = createLeafletBasemap('tomtom');
  assert(tomtom instanceof WMS);
  assert.match(tomtom.url, /api\.tomtom\.com/);
  assert.equal(tomtom.options.layers, 'basic');
  assert.equal(tomtom.options.zIndex, 0, 'base maps stay below WMS boundaries');
  assert.match(createLeafletBasemap('googlestreet').url, /google\.com.*lyrs=m/);
  assert.match(createLeafletBasemap('googlehybrid').url, /google\.com.*lyrs=y/);
});

test('changing every Mapbox base keeps alert/track/WMS overlays and data intact', () => {
  const map = new MapboxMap(); registerMapboxBasemaps(map);
  const overlay = { id: 'panic-route', type: 'line', visibility: 'visible' };
  const data = { type: 'geojson', data: { features: [{ id: 'vehicle' }] } };
  map.layers.push(overlay); map.sources.set('live-vehicles', data);
  for (const style of [...MAP_BASEMAPS, ...MAP_BASEMAPS]) {
    switchMapboxBasemap(map, style.id);
    assert.equal(visible(map).length, 1);
    assert.equal(visible(map)[0].id, `psv-basemap-${style.id}`);
    assert.equal(map.getLayer('panic-route'), overlay);
    assert.equal(overlay.visibility, 'visible');
    assert.equal(map.getSource('live-vehicles'), data);
    assert(map.layers.indexOf(visible(map)[0]) < map.layers.indexOf(overlay));
  }
  assert.equal(map.sources.size, 6);
  assert.equal(map.getLayer('labels').visibility, 'none');
});

test('latest selection before Mapbox style loads wins', () => {
  const map = new MapboxMap(false); registerMapboxBasemaps(map);
  switchMapboxBasemap(map, 'satellite-v9'); switchMapboxBasemap(map, 'googlehybrid');
  assert.equal(map.sources.size, 0);
  map.ready = true; map.fire('style.load');
  assert.equal(visible(map)[0].id, 'psv-basemap-googlehybrid');
});

test('popup maps have independent selections and clean up their listeners', () => {
  const main = new MapboxMap(), popup = new MapboxMap();
  registerMapboxBasemaps(main); registerMapboxBasemaps(popup);
  switchMapboxBasemap(popup, 'tomtom');
  assert.equal(visible(main)[0].id, 'psv-basemap-streets-v11');
  assert.equal(visible(popup)[0].id, 'psv-basemap-tomtom');
  popup.fire('remove'); assert.equal(popup.events.get('style.load').length, 0);
});

test('native Leaflet dropdown retains boundaries, markers and routes through all choices', () => {
  const osm = createLeafletBasemap('streets-v11'), boundary = new WMS('boundaries', {}), route = { id: 'track' }, marker = { id: 'vehicle' };
  const map = { layers: [osm, boundary, route, marker], events: {},
    eachLayer(fn) { [...this.layers].forEach(fn); }, removeLayer(layer) { this.layers = this.layers.filter(item => item !== layer); }, once(name, fn) { this.events[name] = fn; }
  };
  addMapBasemapControl(map, 'leaflet'); pending.splice(0).forEach(fn => fn());
  const root = map.control, panel = root.children[1], options = panel.children[1];
  assert.equal(options.children.length, 5);
  root.children[0].onclick(); assert.equal(panel.hidden, false);
  for (const button of options.children) {
    button.onclick();
    for (const overlay of [boundary, route, marker]) assert(map.layers.includes(overlay));
    assert.equal(map.layers.length, 4);
    assert.equal(button.getAttribute('aria-pressed'), 'true');
  }
  panel.children[0].children[0].onclick(); assert.equal(panel.hidden, true); assert(root.children[0].focused);
});

test('destroying a Leaflet map before its queued setup avoids adding tiles', () => {
  const map = { once(name, fn) { this.unload = fn; } };
  addMapBasemapControl(map, 'leaflet'); map.unload(); pending.splice(0).forEach(fn => fn());
});

test('native Mapbox menu tracks changes triggered by other map controls', () => {
  const map = new MapboxMap(); addMapBasemapControl(map, 'mapbox');
  switchMapboxBasemap(map, 'satellite-v9');
  const buttons = map.control.children[1].children[1].children;
  assert.equal(buttons[1].getAttribute('aria-pressed'), 'true');
  assert.equal(buttons[0].getAttribute('aria-pressed'), 'false');
});
