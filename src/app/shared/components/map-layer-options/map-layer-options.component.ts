import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { MAP_BASEMAPS } from './map-basemaps';

@Component({
  selector: 'app-map-layer-options',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="psv-basemap-options" role="group" aria-label="Base map layers">
      @for (style of styles; track style.id) {
        <button type="button" class="psv-basemap-option" [class.active]="isActive(style.id)" [attr.aria-pressed]="isActive(style.id)" (click)="selected.emit(style.id)">
          <span class="psv-basemap-icon"><i class="fa {{ style.icon }}" aria-hidden="true"></i></span>
          <span class="psv-basemap-info"><strong>{{ style.name }}</strong><small>{{ style.description }}</small></span>
          <i class="fa fa-check psv-basemap-check" aria-hidden="true"></i>
        </button>
      }
    </div>
    <small class="psv-basemap-attribution">{{ attribution }}</small>
  `
})
export class MapLayerOptionsComponent {
  @Input() active = 'streets-v11';
  @Output() selected = new EventEmitter<string>();
  readonly styles = MAP_BASEMAPS;
  get attribution(): string { return this.styles.find(style => this.isActive(style.id))?.attribution ?? ''; }
  isActive(id: string): boolean { return id === (this.active === 'openstreet' ? 'streets-v11' : this.active); }
}
