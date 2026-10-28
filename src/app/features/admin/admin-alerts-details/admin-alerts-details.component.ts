import { addMapBasemapControl } from '../../../shared/components/map-layer-options/map-basemaps';
import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { AlertService } from '../../../core/services/alert.service';
import { ToastService } from '../../../core/services/toast.service';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';
import { configureMapboxAccessToken } from '../../../core/utils/mapbox-config';
declare var $: any;
declare var jAlert: any;
declare var mapboxgl: any;

@Component({
    selector: 'app-admin-alerts-details',
    imports: [CommonModule, FormsModule, RouterModule, CommonTableComponent],
    templateUrl: './admin-alerts-details.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./admin-alerts-details.component.scss']
})
export class AdminAlertsDetailsComponent implements OnInit, AfterViewInit {
  
  alertDetails: any[] = [];
  readonly tableColumns: CommonTableColumn<any>[] = [
    { key: 'param1', label: '#' },
    { key: 'param7', headers: ['Vehicle No.', 'Chassis No.'], sortable: true },
    { key: 'param18', label: 'Event Time', sortable: true },
    { key: 'param25', headers: ['Latitude', 'Longitude'], sortable: true, width: '110px' },
    { key: 'param15', label: 'Alert Type', sortable: true, visible: () => this.title === 'Emergency' },
    { key: 'param16', label: 'Vendor', sortable: true, visible: () => this.roleId !== '11' },
    { key: 'param9', label: 'Customer Details', sortable: true, width: '145px' },
    { key: 'param35', label: 'RTO Name', sortable: true }
  ];
  loading = false;

  alertType: string = '';
  date: string = '';
  title: string = 'Emergency';

  searchText: string = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [20, 50, 100, 200, 500];
  totalCount = 0;
  pageCount = 0;

  sortKey: string = '';
  reverse: boolean = false;

  roleId: string = '';
  map: any;

  constructor(
    private toast: ToastService,
    private alertService: AlertService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.roleId = sessionStorage.getItem('roleId') || '';
    this.route.params.subscribe(params => {
      this.alertType = params['type'] === '0' ? '' : (params['type'] || '');
      this.date = params['date'] === '0' ? '' : (params['date'] || '');

      if (this.alertType === '') {
        this.title = 'Emergency';
      } else if (this.alertType === 'Harsh') {
        this.title = 'Harsh Braking';
      } else {
        this.title = this.alertType;
      }

      this.getAlertDetails();
    });
  }

  ngAfterViewInit() {
    // Component initialization
  }

  getAlertDetails() {
    this.loading = true;
    const request = {
      param1: this.searchText,
      param2: String(this.currentPage),
      param3: String(this.pageSize),
      param4: this.alertType,
      param5: this.date
    };

    this.alertService.getDashboardAlertCount(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          if (typeof response.entity === 'string' && response.entity === 'NO DATA FOUND') {
            this.alertDetails = [];
            this.totalCount = 0;
            this.pageCount = 0;
          } else {
            this.alertDetails = response.entity.listData || [];
            this.totalCount = response.entity.param1 || 0;
            this.pageCount = this.alertDetails.length;
          }
        } else {
          this.alertDetails = [];
          this.totalCount = 0;
          this.pageCount = 0;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.alertDetails = [];
        this.totalCount = 0;
        this.pageCount = 0;
        console.error('Error fetching alert details:', error);
      this.toast.show('Error fetching alert details.', 'error');

        this.cdr.detectChanges();
      }
    });
  }

  getSearchDetails() {
    this.getAlertDetails();
  }

  reloadData() {
    this.searchText = '';
    this.getAlertDetails();
  }

  sort(key: string) {
    this.sortKey = key;
    this.reverse = !this.reverse;
    this.alertDetails.sort((a, b) => {
      const valA = (a as any)[key];
      const valB = (b as any)[key];
      let comparison = 0;
      if (valA > valB) {
        comparison = 1;
      } else if (valA < valB) {
        comparison = -1;
      }
      return this.reverse ? comparison * -1 : comparison;
    });
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.getAlertDetails();
  }

  onPageSizeChange(event: Event) {
    const newSize = (event.target as HTMLSelectElement).value;
    this.pageSize = newSize === 'All' ? this.totalCount : Number(newSize);
    this.currentPage = 1;
    this.getAlertDetails();
  }

  getTotalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  }

  openMapView(vehicleNo: string, alertData: any) {
    // Open map view modal with vehicle location
    $('#alertModal').modal('show');
    this.initializeMap(alertData);
  }

  initializeMap(alertData: any) {
    setTimeout(() => {
      if (typeof mapboxgl !== 'undefined') {
        if (!configureMapboxAccessToken(mapboxgl)) return;
        
        if (this.map) {
          this.map.remove();
        }

        const lat = parseFloat(alertData.param25 || '28.7041');
        const lon = parseFloat(alertData.param24 || '77.1025');

        this.map = new mapboxgl.Map({
          container: 'alertMap',
          style: 'mapbox://styles/mapbox/streets-v11',
          center: [lon, lat],
          zoom: 12
        });
        addMapBasemapControl(this.map, 'mapbox');

        this.map.addControl(new mapboxgl.NavigationControl());

        const el = document.createElement('div');
        el.className = 'marker';
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = 'red';
        el.style.cursor = 'pointer';
        el.style.border = '2px solid white';
        el.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';

        new mapboxgl.Marker(el)
          .setLngLat([lon, lat])
          .addTo(this.map);
      }
    }, 500);
  }
}
