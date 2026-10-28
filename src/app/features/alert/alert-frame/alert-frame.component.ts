import { addMapBasemapControl } from '../../../shared/components/map-layer-options/map-basemaps';
import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { AlertService } from '../../../core/services/alert.service';
import { configureMapboxAccessToken } from '../../../core/utils/mapbox-config';

declare var mapboxgl: any;
declare var MapboxDraw: any;
declare var $: any;
declare var jAlert: any;

@Component({
    selector: 'app-alert-frame',
    imports: [FormsModule],
    templateUrl: './alert-frame.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./alert-frame.component.scss']
})
export class AlertFrameComponent implements OnInit, AfterViewInit {
  map: any;
  panicAlerts: any[] = [];
  loading = false;

  constructor(
    private alertService: AlertService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.getPanicAlerts();
  }

  ngAfterViewInit() {
    this.initializeMap();
  }

  initializeMap() {
    setTimeout(() => {
      if (typeof mapboxgl !== 'undefined') {
        if (!configureMapboxAccessToken(mapboxgl)) return;
        this.map = new mapboxgl.Map({
          container: 'alertmap',
          style: 'mapbox://styles/mapbox/streets-v11',
          center: [77.1025, 28.7041],
          zoom: 4,
          minZoom: 4
        });
        addMapBasemapControl(this.map, 'mapbox');

        this.map.addControl(new mapboxgl.NavigationControl());

        this.map.on('load', () => {
          this.plotPanicAlerts();
        });
      }
    }, 500);
  }

  getPanicAlerts() {
    this.loading = true;
    const request = {
      param1: '',
      param2: '1',
      param3: '100',
      param4: '',
      param5: ''
    };

    this.alertService.getPanicAlerts(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.panicAlerts = response.entity.listData || [];
          if (this.map) {
            this.plotPanicAlerts();
          }
        } else {
          this.panicAlerts = [];
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.panicAlerts = [];
        console.error('Error fetching panic alerts:', error);
        jAlert('Error fetching panic alerts.');
        this.cdr.detectChanges();
      }
    });
  }

  plotPanicAlerts() {
    if (!this.map || !this.panicAlerts.length) return;

    // Clear existing markers
    const markers = document.querySelectorAll('.panic-marker');
    markers.forEach(m => m.remove());

    this.panicAlerts.forEach((alert, index) => {
      const lat = parseFloat(alert.param28 || '0');
      const lon = parseFloat(alert.param27 || '0');
      
      if (lat && lon) {
        const el = document.createElement('div');
        el.className = 'panic-marker';
        el.style.width = '25px';
        el.style.height = '25px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = 'red';
        el.style.cursor = 'pointer';
        el.style.border = '2px solid white';
        el.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';

        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div style="font-size: 11px;">
              <strong>Vehicle:</strong> ${alert.param11 || 'NA'}<br>
              <strong>Time:</strong> ${alert.param5 || 'NA'}<br>
              <strong>Location:</strong> ${lat}, ${lon}
            </div>
          `);

        new mapboxgl.Marker(el)
          .setLngLat([lon, lat])
          .setPopup(popup)
          .addTo(this.map);
      }
    });

    // Fit map to show all markers
    if (this.panicAlerts.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      this.panicAlerts.forEach(alert => {
        const lat = parseFloat(alert.param28 || '0');
        const lon = parseFloat(alert.param27 || '0');
        if (lat && lon) {
          bounds.extend([lon, lat]);
        }
      });
      if (!bounds.isEmpty()) {
        this.map.fitBounds(bounds, { padding: 50 });
      }
    }
  }
}
