import { addMapBasemapControl } from '../../../shared/components/map-layer-options/map-basemaps';
import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DeviceService, Device } from '../../../core/services/device.service';
import { CommonDataToolbarComponent } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ToastComponent } from './toast.component';
import { VehicleService } from '../../../core/services/vehicle.service';
import { ToastService } from '../../../core/services/toast.service';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';
import { configureMapboxAccessToken } from '../../../core/utils/mapbox-config';

declare var $: any;

@Component({
    selector: 'app-inactive-assets',
    imports: [CommonModule, FormsModule, RouterModule, CommonDataToolbarComponent, LoadingComponent, ToastComponent, CommonTableComponent],
    templateUrl: './inactive-assets.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./inactive-assets.component.scss']
})
export class InactiveAssetsComponent implements OnInit, AfterViewInit {
  toString(value: any): string {
    return value != null ? String(value) : '';
  }
  devices: any[] = [];
  readonly tableColumns: CommonTableColumn<any>[] = [
    { key: 'param1', label: '#', width: '30px' },
    { key: 'param11', label: 'Vehicle / Chassis No.', sortable: true },
    { key: 'param5', headers: ['Serial No.', 'IMEI No.'], sortable: true },
    { key: 'param6', label: 'ICCID No.', sortable: true },
    { key: 'param18', label: 'Customer Details', sortable: true },
    { key: 'param8', label: 'Vendor', sortable: true },
    { key: 'param22', label: 'Last Polling Time', sortable: true, width: '130px', clickable: () => true },
    { key: 'param30', label: 'Last Emergency Alert', sortable: true, width: '130px' },
    { key: 'param27', headers: ['Last Speed(Km/hrs)', 'Ignition'], sortable: true, width: '92px' },
    { key: 'param25', headers: ['Latitude', 'Longitude'] },
    { key: 'param28', headers: ['Polling Status', 'GPS Valid'], sortable: true }
  ];
  loading = false;
  errorMessage: string | null = null;
  searchText: string = '';
 pageCount = 0;
  selectedDays: string = '5'; // Default 5 days
  daysOptions = [
    { value: '1', label: '1 Day' },
    { value: '3', label: '3 Days' },
    { value: '5', label: '5 Days' },
    { value: '7', label: '7 Days' },
    { value: '30', label: '30 Days' }
  ];
  pageSizeOptions = [20];
  currentPage = 1;
  pageSize = 20;
  totalCount = 0;
  // ===== Tracking Modal State =====
showTrackModal: boolean = false;
selectedVehicleNo: string = '';
selectedDevice: any = null;
    selectedDownloadType: string = '';
isExporting: boolean = false;

// Map state
map: any = null;
liveMarker: any = null;
showLayersToggle: boolean = false;
vehicleTrackingData: any = null;

  sortKey: string = '';
  reverse: boolean = false;
  vehicleType: string = 'New';
  constructor(
     private  toast:ToastService,
     private vehicleService: VehicleService,
    private deviceService: DeviceService,
    private cdr: ChangeDetectorRef
  ) {
    this.toast.pageName = 'Inactive Assets'; // Set page name for toast service
  }
  
  ngOnInit() {
    this.loadInactiveAssets();
  }
  
  ngAfterViewInit() {
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.select2) {
        $('.searchable').select2();
        // $('#days').on('change', (e: any) => {
        //   this.selectedDays = e.target.value;
        //   this.loadInactiveAssets();
        // });
      }
    }, 200);
  }
  onChangeVehicleType(type: string) {
    this.vehicleType = type;
    this.currentPage = 1;
    this.totalCount = 0;
    this.loadInactiveAssets();
  }
  
  loadInactiveAssets(page: number = 1) {
    this.currentPage = page;
    this.loading = true;
    this.errorMessage = null;
    this.devices = [];
    this.totalCount = 0;
    
    const request = {
      param1: this.searchText?.trim() || "", 
      param2: "DownVehicle",  //serch
      param3:  this.selectedDays,
      param4: this.currentPage.toString(),
      param5: this.pageSize.toString(),
      param6: '',
      param7: '',
      param8: '',
      param9: '',
      param10: '',
      param11: '',
      param12: '',
      param13: '',
      param14: this.vehicleType, // New/Old
      param15: '',
      
   pdfexcel:""
    };
    
    this.deviceService.getInactiveAssets(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.devices = response.entity.listData || [];
          this.totalCount = response.entity.param1 || 0;
        } else {
          let msg = typeof response?.entity === 'string' ? response.entity : 'Failed to load inactive assets';
          if (!msg || msg.trim() === '' || msg === 'No message available') {
            msg = 'Failed to load inactive assets. Please try again.';
          }
          this.errorMessage = msg;
          this.devices = [];
        }
        this.updatePageSizeOptions();
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        let msg = error?.error?.message || error?.message || 'Error loading inactive assets. Please try again.';
        if (!msg || msg.trim() === '' || msg === 'No message available') {
          msg = 'Error loading inactive assets. Please try again.';
        }
        this.errorMessage = msg;
        this.devices = [];
        console.error('Error loading inactive assets:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  getInactiveAssetsDetails(page: number) {
    this.loadInactiveAssets(page);
  }
  
  sort(column: string) {
    if (this.sortKey === column) {
      this.reverse = !this.reverse;
    } else {
      this.sortKey = column;
      this.reverse = false;
    }
  }
  
  // trackinactivevehicle(device: Device) {
  //   // Navigate to map tracking with vehicle details
  //   const vehicleNo = device.param11 || '';
  //   if (vehicleNo) {
  //     window.open(`/mapViewAll?vehicle=${encodeURIComponent(vehicleNo)}`, '_blank');
  //   }
  // }
  
  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pages: number[] = [];
    const maxPages = 8;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);
    
    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }
  
  getTotalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

trackinactivevehicle(device: any) {
  this.selectedDevice = device;

  // SAME param jo table me vehicle no dikhata hai
  this.selectedVehicleNo = device.param11 || device.param22 || '';

  if (!this.selectedVehicleNo) {
this.toast.show('Vehicle number not available', 'error');

    return;
  }

  this.showTrackModal = true;

  // DOM render hone do
  setTimeout(() => {
    this.initializeMap();
    this.loadVehicleTracking();
  }, 400);
}

  toggleLayers() {
    this.showLayersToggle = !this.showLayersToggle;
    this.cdr.detectChanges();
  }
  closeModal() {
  if (this.liveMarker) {
    try { this.liveMarker.remove(); } catch {}
    this.liveMarker = null;
  }

  if (this.map) {
    try { this.map.remove(); } catch {}
    this.map = null;
  }

  this.showTrackModal = false;
  this.showLayersToggle = false;
  this.selectedVehicleNo = '';
  this.selectedDevice = null;
}
 initializeMap() {
    try {
      // Check if mapboxgl is available
      if (typeof (window as any).mapboxgl === 'undefined') {
        console.error('Mapbox GL JS is not loaded');
       this.toast.show('Map library is not loaded. Please refresh the page.', 'error');

        return;
      }

      const mapboxgl = (window as any).mapboxgl;

      // Set Mapbox access token
      if (!configureMapboxAccessToken(mapboxgl)) {
        this.toast.show('Map service is not configured. Please contact support.', 'error');
        return;
      }

      // Initialize map
      this.map = new mapboxgl.Map({
        container: 'map1',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [87.74780, 22.978624], // Default center (Delhi/NCR)
        zoom: 8,
        minZoom: 4,
        preserveDrawingBuffer: true,
        attributionControl: false
      });
      addMapBasemapControl(this.map, 'mapbox');

      // Add controls
      this.map.addControl({
        onAdd: () => {
          const container = document.createElement('div');
          container.className = 'mapboxgl-ctrl mapboxgl-ctrl-attrib';
          container.innerHTML = '<div class="mapboxgl-ctrl-attrib-inner">Powered by DIMTS</div>';
          return container;
        },
        onRemove: () => { }
      }, 'bottom-right');
      // Add navigation controls
      this.map.addControl(new mapboxgl.NavigationControl());

      this.map.on('load', () => {
        this.map.addSource('wms-source', {
          type: 'raster',
          tiles: [
            'https://vlts.wb.gov.in/geoserver/wbsdcmap/wms?' +
            'service=WMS&version=1.1.1&request=GetMap' +
            '&layers=wbsdcmap:india_state' +
            '&styles=' +
            '&bbox={bbox-epsg-3857}' +     // ✅ required
            '&width=256&height=256' +
            '&srs=EPSG:3857' +             // ✅ required
            '&format=image/png' +          // ✅ must be image
            '&transparent=true'
          ],
          tileSize: 256
        });

        this.map.addLayer({
          id: 'wms-layer',
          type: 'raster',
          source: 'wms-source'
        });
      });

      // Layers toggle is handled via Angular (click) event

      // Setup layer checkboxes
      this.setupLayerCheckboxes();

    } catch (error) {
      console.error('Error initializing map:', error);
   this.toast.show('Error initializing map. Please try again.', 'error');

    }
  }
   loadVehicleTracking() {
    if (!this.selectedVehicleNo) {
this.toast.show('Vehicle number is required for tracking', 'error');

      return;
    }

    this.loading = true;

    this.vehicleService.getLiveTrack(this.selectedVehicleNo).subscribe({
      next: (response) => {
        this.loading = false;
        if (response?.status && response?.entity && response.entity.length > 0) {
          this.vehicleTrackingData = response.entity[0];
          this.showVehiclePosition(this.vehicleTrackingData);
        } else {this.closeModal()
        this.toast.show('No tracking data found for this vehicle', 'error');

        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading vehicle tracking:', error);
        this.toast.show(error?.error?.entity || 'Error loading vehicle tracking data', 'error');
        this.closeModal()

      }
    });
  }
  setupLayerCheckboxes() {
    // Setup layer toggle checkboxes (placeholder - layers functionality can be enhanced later)
    const layerIds = [
      'Delhi_Psv_All',
      'National_District_region',
      'Delhi_Noida_Rd_Highways_polyline',
      'Delhi_Noida_Rd_ACH_polyline',
      'Delhi_Noida_Landuse_region',
      'Delhi_Noida_Locality_region',
      'Delhi_Noida_POI_point'
    ];

    layerIds.forEach(layerId => {
      const checkbox = document.getElementById(layerId) as HTMLInputElement;
      if (checkbox) {
        checkbox.onchange = () => {
          // Layer toggle functionality - can be implemented based on requirements
          //console.log(`Layer ${layerId} toggled:`, checkbox.checked);
        };
      }
    });
  }
   showVehiclePosition(vehicleData: any) {
    if (!this.map || !vehicleData) return;

    try {
      // Remove existing marker
      if (this.liveMarker) {
        this.liveMarker.remove();
        this.liveMarker = null;
      }

      // Get coordinates (param39 = longitude, param38 = latitude)
      const longitude = Number(vehicleData.param39) || 77.1025;
      const latitude = Number(vehicleData.param38) || 28.7041;
      const coordinates: [number, number] = [longitude, latitude];

      // Get direction/heading
      const heading = vehicleData.param43 || '0';
      const direction = this.getDirection(heading);

      // Determine ignition and GPS status colors
      const ignitionStatus = vehicleData.param45 === '1' ? 'On' : 'Off';
      const ignitionColor = vehicleData.param45 === '1' ? 'green' : 'red';

      const gpsStatus = vehicleData.param41 === '1' ? 'Valid' : 'In Valid';
      const gpsColor = vehicleData.param41 === '1' ? 'green' : 'red';

      // Create popup content
      const popupContent = `
        <style>
          .vehicle-custom-popup .mapboxgl-popup-content {
            padding: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
          }
          .vehicle-custom-popup .mapboxgl-popup-tip {
            border-top-color: #ffffff !important;
          }
          .vehicle-custom-popup .mapboxgl-popup-close-button {
            color: #ffffff !important;
    font-size: 18px !important;
    right: 0px !important;
    top: 0px !important;
    z-index: 134 !important;
          }
          .vehicle-custom-popup .mapboxgl-popup-close-button:hover {
            background-color: rgba(255,255,255,0.2) !important;
            border-radius: 50%;
          }
        </style>
        <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; width: 280px; background-color: #ffffff; border-radius: 6px; box-shadow: 0 3px 10px rgba(0,0,0,0.2); overflow: hidden;">
          
          <!-- Header -->
          <div style="background-color: #28a745; color: #ffffff; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 600; font-size: 13px;">Vehicle Details</span>
            <span style="background: rgba(255,255,255,0.2); padding: 2px 18px; border-radius: 4px; font-size: 11px;">${vehicleData.param13 || 'N/A'}</span>
          </div>

          <!-- Vehicle Info -->
          <div style="padding: 10px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #f0f0f0;"><td style="color: #666; padding: 0px 0; width: 40%;">Polling Time</td><td style="color: #333; font-weight: 500; padding: 0px 0; text-align: right;">${vehicleData.param35 || 'N/A'}</td></tr>
              <tr style="border-bottom: 1px solid #f0f0f0;"><td style="color: #666; padding: 0px 0;">Speed</td><td style="color: #333; font-weight: 500; padding: 0px 0; text-align: right;">${vehicleData.param40 || '0'} km/hr</td></tr>
              <tr style="border-bottom: 1px solid #f0f0f0;"><td style="color: #666; padding: 0px 0;">Ignition</td><td style="padding: 0px 0; text-align: right; font-weight: 600; color: ${ignitionColor}">${ignitionStatus}</td></tr>
              <tr style="border-bottom: 1px solid #f0f0f0;"><td style="color: #666; padding: 0px 0;">GPS Status</td><td style="padding: 0px 0; text-align: right; font-weight: 600; color: ${gpsColor}">${gpsStatus}</td></tr>
              <tr style="border-bottom: 1px solid #f0f0f0;"><td style="color: #666; padding: 0px 0;">Customer</td><td style="color: #333; font-weight: 500; padding: 0px 0; text-align: right;">${vehicleData.param25 || 'N/A'} / ${vehicleData.param26 || 'N/A'}</td></tr>
              <tr><td style="color: #666; padding: 0px 0;">Location</td><td style="color: #333; font-weight: 500; padding: 0px 0; text-align: right;">${latitude.toFixed(4)}, ${longitude.toFixed(4)}</td></tr>
            </table>
          </div>

          <!-- Device Header -->
          <div style="background-color: #dddddd; color: #333; padding: 6px 12px; font-weight: 600; font-size: 11px; border-top: 1px solid #eee; border-bottom: 1px solid #eee; text-transform: uppercase; letter-spacing: 0.5px;">
            Device Information
          </div>

          <!-- Device Info -->
          <div style="padding: 10px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="color: #666; padding: 0px 0; width: 40%;">Serial No:</td><td style="color: #333; font-weight: 500; padding: 0px 0; text-align: right;">${vehicleData.param5 || 'N/A'}</td></tr>
              <tr><td style="color: #666; padding: 0px 0; width: 40%;">IMEI No:</td><td style="color: #333; font-weight: 500; padding: 0px 0; text-align: right;">${vehicleData.param4 || 'N/A'}</td></tr>
              <tr><td style="color: #666; padding: 0px 0; width: 40%;">Vendor:</td><td style="color: #333; font-weight: 500; padding: 0px 0; text-align: right;">${vehicleData.param9 || 'N/A'}</td></tr>
              <tr><td style="color: #666; padding: 0px 0; width: 40%;">ICCID:</td><td style="color: #333; font-weight: 500; padding: 0px 0; word-break: break-all; text-align: right;">${vehicleData.param6 || 'N/A'}</td></tr>
            </table>
          </div>
        </div>
      `;

      // Create marker element
      const el = document.createElement('div');
      el.className = 'marker';

      // Use a simple colored marker with arrow indicator
      // You can replace this with an image path if car icons are available
      el.style.width = '35px';
      el.style.height = '35px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = ignitionStatus === 'On' ? '#28a745' : '#dc3545'; // Green if ignition on, red if off
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.4)';
      el.style.position = 'relative';
      el.style.cursor = 'pointer';

      // Add arrow indicator for direction
      const arrow = document.createElement('div');
      arrow.style.width = '0';
      arrow.style.height = '0';
      arrow.style.borderLeft = '6px solid transparent';
      arrow.style.borderRight = '6px solid transparent';
      arrow.style.borderBottom = '10px solid white';
      arrow.style.position = 'absolute';
      arrow.style.top = '-8px';
      arrow.style.left = '50%';
      arrow.style.transform = `translateX(-50%) rotate(${direction}deg)`;
      arrow.style.transformOrigin = 'center bottom';
      el.appendChild(arrow);

      // Try to load car icon if available (optional enhancement)
      const carIconPath = 'assets/mapimages/car/green.png';
      const img = new Image();
      img.onload = () => {
        el.style.backgroundImage = `url(${carIconPath})`;
        el.style.backgroundColor = 'transparent';
        el.style.backgroundSize = 'contain';
        el.style.backgroundRepeat = 'no-repeat';
        el.style.backgroundPosition = 'center';
        el.style.boxShadow = 'none';

        el.style.border = 'none';
        if (arrow.parentNode) {
          arrow.remove();
        }
      };
      img.onerror = () => {
        // Keep the colored circle marker
      };
      img.src = carIconPath;

      const mapboxgl = (window as any).mapboxgl;

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: 10,
        className: 'vehicle-custom-popup',
        maxWidth: '300px'
      }).setHTML(popupContent);

      // Create and add marker
      this.liveMarker = new mapboxgl.Marker(el)
        .setLngLat(coordinates)
        .setPopup(popup)
        .addTo(this.map);

      // Fly to vehicle location
      this.map.flyTo({
        center: coordinates,
        essential: true,
        zoom: 12
      });

    } catch (error) {
      console.error('Error showing vehicle position:', error);
    this.toast.show('Error displaying vehicle on map', 'error');

    }
  }
    reloadData() {
     this.searchText = '';        // optional: clear search
  this.currentPage = 1;        // optional: reset page
  this.loadInactiveAssets();
  
  }
  getDirection(heading: string | number): number {
    const input = typeof heading === 'string' ? parseFloat(heading) : heading;

    if (input >= 345 && input < 15) return 0;
    if (input >= 15 && input < 60) return 45;
    if (input >= 60 && input < 120) return 90;
    if (input >= 120 && input < 160) return 135;
    if (input >= 160 && input < 210) return 180;
    if (input >= 210 && input < 235) return 225;
    if (input >= 235 && input < 290) return 270;
    if (input >= 290 && input < 345) return 315;
    return 0;
  }
    getSearchDetails() {
    this.currentPage = 1;
    this.loadInactiveAssets();
  }

onPageSizeChange(size: number) {
  //console.log('PageSize selected:', size);
  //console.log('Total count:', this.totalCount);

  this.pageSize = size;
  this.currentPage = 1;
  this.loadInactiveAssets();
}


   updatePageSizeOptions() {
    const options = [20];
    if (this.totalCount > 50) options.push(50);
    if (this.totalCount > 100) options.push(100);
    if (this.totalCount > 200) options.push(200);
    if (this.totalCount > 500) options.push(500);
    if (this.totalCount > 1000) options.push(1000);
    if (this.totalCount > 0) options.push(this.totalCount);
    this.pageSizeOptions = options;
  }


getEndRecord(): number {
  const end = this.currentPage * this.pageSize;
  return end > this.totalCount ? this.totalCount : end;
}
onDaysChange() {
  this.currentPage = 1;
  this.loadInactiveAssets();
}
onDownloadChange() {
  //console.log("Dropdown Changed:", this.selectedDownloadType);

  if (this.selectedDownloadType === 'Excel') {
    this.exportToExcel();
  }

  this.selectedDownloadType = '';
}

exportToExcel() {

  this.isExporting = true;

  const request = {
    param1: this.searchText?.trim() || "",
    param2: "DownVehicle",
    param3: this.selectedDays,
    param4: this.currentPage.toString(),
    param5: this.pageSize.toString(),
    param6: '',
    param7: '',
    param8: '',
    param9: '',
    param10: '',
    param11: '',
    param12: '',
    param13: '',
    param14: this.vehicleType, // New/Old
    param15: '',
    pdfexcel: "excel",
    type: ""
  };

  this.deviceService.getInactiveAssets(request)
    .subscribe({
      next: (response: any) => {

        this.isExporting = false;

        if (response?.status && typeof response.entity === 'string') {

          const fileUrl = response.entity;

          // 🔥 Direct Download (No New Tab)
          const link = document.createElement('a');
          link.href = fileUrl;
          link.download = fileUrl.split('/').pop() || 'report.xls';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          this.toast.show('Excel downloaded successfully', 'success');

        } else {
          this.toast.show('Failed to generate Excel', 'error');
        }
      },

      error: (error) => {
        this.isExporting = false;
        console.error(error);
        this.toast.show('Error exporting Excel', 'error');
      }
    });
}




}
