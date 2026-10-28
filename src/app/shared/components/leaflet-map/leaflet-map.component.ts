import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-leaflet-map',
    imports: [CommonModule],
    template: `
    <div class="leaflet-map-shell" [ngClass]="containerClass">
      <div
        #mapHost
        [id]="mapId"
        class="leaflet-map-host"
        [ngClass]="mapClass"
        [ngStyle]="mapStyles">
      </div>
      <div class="leaflet-map-footer">Power by DIMTS</div>
      <ng-content></ng-content>
    </div>
  `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .leaflet-map-shell {
      position: relative;
      width: 100%;
      height: 100%;
    }

    .leaflet-map-host {
      width: 100%;
      height: 100%;
    }

    .leaflet-map-footer {
      position: absolute;
      right: 8px;
      bottom: 8px;
      z-index: 401;
      padding: 2px 6px;
      font-size: 10px;
      line-height: 1.2;
      color: #334155;
      background: rgba(255, 255, 255, 0.92);
      border-radius: 4px;
      box-shadow: 0 1px 4px rgba(15, 23, 42, 0.15);
      pointer-events: none;
    }
  `]
})
export class LeafletMapComponent implements AfterViewInit {
  @Input() mapId: string | null = null;
  @Input() containerClass = '';
  @Input() mapClass = '';
  @Input() mapStyles: Record<string, string> = {};
  @Output() mapReady = new EventEmitter<HTMLElement>();

  @ViewChild('mapHost', { static: true }) private mapHost!: ElementRef<HTMLElement>;

  ngAfterViewInit(): void {
    this.mapReady.emit(this.mapHost.nativeElement);
  }
}
