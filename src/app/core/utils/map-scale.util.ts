import * as L from 'leaflet';
import mapboxgl from 'mapbox-gl';

type ScalePosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export class MapScaleUtil {
  private static readonly earthCircumference = 40075016.686;
  private static readonly cssPixelSizeMeters = 0.0002645833333;
  private static readonly poweredByLabel = 'Power by DIMTS';

  static addLeafletScale(map: L.Map, position: L.ControlPosition = 'bottomleft'): void {
    if (!map || (map as any).__ratioScaleControlAdded) {
      return;
    }

    const RatioScaleControl = L.Control.extend({
      options: { position },
      onAdd: () => {
        const container = L.DomUtil.create('div', 'ratio-scale-control');
        L.DomEvent.disableClickPropagation(container);

        const updateScale = () => {
          const center = map.getCenter();
          const ratio = MapScaleUtil.calculateScaleRatio(center.lat, map.getZoom(), 256);
          container.innerHTML = `<span>Scale</span><strong>1:${MapScaleUtil.formatRatio(ratio)}</strong>`;
        };

        map.on('zoomend moveend resize', updateScale);
        updateScale();
        return container;
      }
    });

    map.addControl(new RatioScaleControl());
    (map as any).__ratioScaleControlAdded = true;
  }

  static addLeafletPoweredBy(map: L.Map, position: L.ControlPosition = 'bottomright'): void {
    if (!map || (map as any).__poweredByDimtsControlAdded) {
      return;
    }

    const PoweredByControl = L.Control.extend({
      options: { position },
      onAdd: () => {
        const container = L.DomUtil.create('div', 'leaflet-powered-by-dimts');
        container.textContent = MapScaleUtil.poweredByLabel;
        L.DomEvent.disableClickPropagation(container);
        return container;
      }
    });

    map.addControl(new PoweredByControl());
    (map as any).__poweredByDimtsControlAdded = true;
  }

  static addMapboxScale(map: mapboxgl.Map, position: ScalePosition = 'bottom-left'): void {
    if (!map || (map as any).__ratioScaleControlAdded) {
      return;
    }

    const control = {
      onAdd: () => {
        const container = document.createElement('div');
        container.className = 'ratio-scale-control mapbox-ratio-scale-control';

        const updateScale = () => {
          const center = map.getCenter();
          const ratio = MapScaleUtil.calculateScaleRatio(center.lat, map.getZoom(), 512);
          container.innerHTML = `<span>Scale</span><strong>1:${MapScaleUtil.formatRatio(ratio)}</strong>`;
        };

        map.on('zoom', updateScale);
        map.on('move', updateScale);
        map.on('resize', updateScale);
        updateScale();
        return container;
      },
      onRemove: () => undefined
    };

    map.addControl(control as mapboxgl.IControl, position);
    (map as any).__ratioScaleControlAdded = true;
  }

  private static calculateScaleRatio(latitude: number, zoom: number, tileSize: number): number {
    const latitudeRadians = latitude * Math.PI / 180;
    const metersPerPixel = Math.cos(latitudeRadians) * MapScaleUtil.earthCircumference / (tileSize * Math.pow(2, zoom));
    return metersPerPixel / MapScaleUtil.cssPixelSizeMeters;
  }

  private static formatRatio(value: number): string {
    const rounded = value >= 100000
      ? Math.round(value / 10000) * 10000
      : value >= 10000
        ? Math.round(value / 1000) * 1000
        : Math.round(value / 100) * 100;

    return Math.max(rounded, 1).toLocaleString('en-IN');
  }
}
