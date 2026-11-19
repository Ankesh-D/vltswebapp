import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { POIService, POI, POIRequest, POIUpdateRequest } from '../../../core/services/poi.service';
import { ToastComponent } from '../../assets/inactive-assets/toast.component';
import { ToastService } from '../../../core/services/toast.service';
import { CommonDataToolbarComponent } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { DataTableColumn, DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
    selector: 'app-poi-list',
    imports: [CommonModule, FormsModule, RouterModule, ToastComponent, CommonDataToolbarComponent, DataTableComponent, PaginationComponent],
    templateUrl: './poi-list.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./poi-list.component.scss']
})
export class POIListComponent implements OnInit {
  pois: POI[] = [];
  loading = false;
  searchText = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions: number[] = [10, 20, 50, 100];
  totalCount = 0;
  pageCount = 0;
  
  // Sorting
  sortKey: string = '';
  reverse: boolean = false;
  @ViewChild('poiIconCell', { static: true }) poiIconCell!: TemplateRef<{ $implicit: POI }>;
  readonly tableColumns: DataTableColumn<POI>[] = [
    { key: 'param1', header: '#', value: poi => poi.param1 || 'NA' },
    { key: 'param3', header: 'POI Name', sortKey: 'param3', value: poi => poi.param3 || 'NA' },
    { key: 'param7', header: 'Latitude', sortKey: 'param7', width: '90px', value: poi => poi.param7 || 'NA' },
    { key: 'param8', header: 'Longitude', sortKey: 'param8', width: '90px', value: poi => poi.param8 || 'NA' },
    { key: 'param9', header: 'Range(km)', sortKey: 'param9', width: '70px', value: poi => poi.param9 || poi.param6 || 'NA' },
    { key: 'icon', header: 'Icon', sortKey: 'param5', width: '65px' },
    { key: 'createdDate', header: 'Created Date Time', sortKey: 'param10', width: '150px', value: poi => this.getCreatedDateTime(poi) },
    {
      key: 'actions',
      header: 'Action',
      actions: [
        { label: 'Edit', icon: 'fa-edit', tone: 'primary', className: 'btn-outline-primary me-2 shadow-sm', run: poi => this.openEditModal(poi) },
        { label: 'Delete', icon: 'fa-trash', tone: 'danger', className: 'btn-outline-danger shadow-sm', run: poi => this.openDeleteModal(poi) }
      ]
    }
  ];
  
  // Selected POI for edit/delete
  selectedPOI: POI | null = null;
  editPoiName: string = '';
  editPoiIcon: string = '';
  editLatitude: string = '';
  editLongitude: string = '';
  editRange: string = '';
  editRemark: string = '';
  deleteRemark: string = '';
  formErrors: { [key: string]: boolean } = {};
  
  // POI Icon options (same as entry)
  poiIcons = [
    { value: '', label: 'Select Icon' },
    { value: 'railway', label: 'Railway' },
    { value: 'airport', label: 'AirPort' },
    { value: 'bar', label: 'Bar' },
    { value: 'building', label: 'Building' },
    { value: 'coffeehouse', label: 'Coffee House' },
    { value: 'education', label: 'Education' },
    { value: 'flag', label: 'Flag' },
    { value: 'garden', label: 'Garden' },
    { value: 'hospital', label: 'Hospital' },
    { value: 'industry', label: 'Industry' },
    { value: 'mapicon', label: 'Map Icon' },
    { value: 'market', label: 'Market' },
    { value: 'office', label: 'Office' },
    { value: 'postoffice', label: 'Post Office' },
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'stopmarker', label: 'Stop Marker' },
    { value: 'temple', label: 'Temple' },
    { value: 'water', label: 'Water' }
  ];
  
  editImageUrl: string = '';
  
  showEditModal = false;
  showDeleteModal = false;

  errorMessage: string | null = null;
  successMessage: string | null = null;
  
  constructor(
    private poiService: POIService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public toastService: ToastService
  ) {
    this.toastService.pageName = 'POI Master Details'; // Set page name for toast service
  }
  
  ngOnInit() {
    const iconColumn = this.tableColumns.find(column => column.key === 'icon');
    if (iconColumn) iconColumn.cellTemplate = this.poiIconCell;
    this.loadPOIs();
  }
  
  loadPOIs() {
    this.loading = true;
    this.errorMessage = '';
    
    const request: POIRequest = {
      param5: this.searchText || '',
      param8: this.currentPage.toString(),
      param9: this.pageSize.toString()
    };
    
    this.poiService.getPOIDetails(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.pois = response.entity.listData || [];
          this.totalCount = response.entity.param1 || 0;
          this.pageCount = this.pois.length;
          this.updatePageSizeOptions();
        } else {
          this.errorMessage = typeof response.entity === 'string' ? response.entity : 'Failed to load POIs';
          this.pois = [];
          this.totalCount = 0;
          this.pageCount = 0;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.entity || 'Error loading POIs';
        this.pois = [];
        this.totalCount = 0;
        this.pageCount = 0;
        this.cdr.detectChanges();
      }
    });
  }
  
  getSearchDetails() {
    this.currentPage = 1;
    this.loadPOIs();
  }
  
  reloadData() {
    this.searchText = '';
    this.currentPage = 1;
    this.pageSize = 20;
    this.loadPOIs();
  }
  
  sort(key: string) {
    if (this.sortKey === key) {
      this.reverse = !this.reverse;
    } else {
      this.sortKey = key;
      this.reverse = false;
    }
    
    this.pois.sort((a, b) => {
      const aVal = String(a[key as keyof POI] ?? '');
      const bVal = String(b[key as keyof POI] ?? '');
      return this.reverse 
        ? bVal.localeCompare(aVal)
        : aVal.localeCompare(bVal);
    });
  }
  
  onPageChange(page: number): void {
    if (page > 0 && page <= Math.ceil(this.totalCount / this.pageSize)) {
      this.currentPage = page;
      this.loadPOIs();
    }
  }
  
  onPageSizeChange(size: number | string): void {
    this.pageSize = size === 'All' || Number(size) === this.totalCount ? this.totalCount : Number(size);
    this.currentPage = 1;
    this.loadPOIs();
  }
  
  updatePageSizeOptions(): void {
    const options = [20];
    if (this.totalCount > 50) options.push(50);
    if (this.totalCount > 100) options.push(100);
    if (this.totalCount > 200) options.push(200);
    if (this.totalCount > 500) options.push(500);
    if (this.totalCount > 1000) options.push(1000);
    if (this.totalCount > 0 && this.totalCount < 100 && !options.includes(this.totalCount)) {
      options.push(this.totalCount);
    }
    this.pageSizeOptions = options;
  }
  
  getIconNameFromPath(iconPath: string): string {
    if (!iconPath) return '';
    const parts = iconPath.split('/');
    const filename = parts[parts.length - 1];
    return filename.replace('.png', '').replace('map_icon', 'mapicon');
  }
  
  getCreatedDateTime(poi: POI): string {
    return poi.param10 || 'NA';
  }
  
  openEditModal(poi: POI) {
    this.selectedPOI = { ...poi };
    this.editPoiName = poi.param3 || '';
    this.editPoiIcon = this.getIconNameFromPath(poi.param4 || poi.param5 || '');
    this.editLatitude = poi.param7 || '';
    this.editLongitude = poi.param8 || '';
    this.editRange = poi.param9 || poi.param6 || '';
    this.editRemark = '';
    this.updateEditImageUrl();
    this.showEditModal = true;
  }
  
  onEditPoiIconChange() {
    this.updateEditImageUrl();
  }
  
  updateEditImageUrl() {
    const iconPathMap: { [key: string]: string } = {
      'railway': 'assets/poiicons/railway.png',
      'airport': 'assets/poiicons/airport.png',
      'bar': 'assets/poiicons/bar.png',
      'building': 'assets/poiicons/building.png',
      'coffeehouse': 'assets/poiicons/coffeehouse.png',
      'education': 'assets/poiicons/education.png',
      'flag': 'assets/poiicons/flag.png',
      'garden': 'assets/poiicons/garden.png',
      'hospital': 'assets/poiicons/hospital.png',
      'industry': 'assets/poiicons/industry.png',
      'mapicon': 'assets/poiicons/map_icon.png',
      'market': 'assets/poiicons/market.png',
      'office': 'assets/poiicons/office.png',
      'postoffice': 'assets/poiicons/postoffice.png',
      'restaurant': 'assets/poiicons/restaurant.png',
      'stopmarker': 'assets/poiicons/stopmark.png',
      'temple': 'assets/poiicons/temple.png',
      'water': 'assets/poiicons/water.png'
    };
    
    if (this.editPoiIcon && iconPathMap[this.editPoiIcon]) {
      this.editImageUrl = iconPathMap[this.editPoiIcon];
    } else {
      this.editImageUrl = '';
    }
  }
  
  closeEditModal() {
    this.showEditModal = false;
    this.selectedPOI = null;
    this.editRemark = '';
  }
  
  submitEdit() {
    if (!this.selectedPOI) return;
    
    if (!this.editPoiName || this.editPoiName.trim() === '') {
      alert('POI Name is required.');
      return;
    }
    if (!this.editPoiIcon || this.editPoiIcon === '') {
      alert('POI Icon is required.');
      return;
    }
    if (!this.editRemark || this.editRemark.trim().length < 10) {
      alert('Remark must be at least 10 characters long.');
      return;
    }
    
    const iconPathMap: { [key: string]: string } = {
      'railway': 'assets/poiicons/railway.png',
      'airport': 'assets/poiicons/airport.png',
      'bar': 'assets/poiicons/bar.png',
      'building': 'assets/poiicons/building.png',
      'coffeehouse': 'assets/poiicons/coffeehouse.png',
      'education': 'assets/poiicons/education.png',
      'flag': 'assets/poiicons/flag.png',
      'garden': 'assets/poiicons/garden.png',
      'hospital': 'assets/poiicons/hospital.png',
      'industry': 'assets/poiicons/industry.png',
      'mapicon': 'assets/poiicons/map_icon.png',
      'market': 'assets/poiicons/market.png',
      'office': 'assets/poiicons/office.png',
      'postoffice': 'assets/poiicons/postoffice.png',
      'restaurant': 'assets/poiicons/restaurant.png',
      'stopmarker': 'assets/poiicons/stopmark.png',
      'temple': 'assets/poiicons/temple.png',
      'water': 'assets/poiicons/water.png'
    };
    
    const iconPath = iconPathMap[this.editPoiIcon] || '';
    
    const updateData: POIUpdateRequest = {
      param1: this.selectedPOI.param2 || '',
      param2: this.editPoiName.trim(),
      param3: '',
      param4: iconPath,
      param5: this.editPoiName.trim(),
      param6: this.editRange.trim(),
      param7: this.editLatitude.trim(),
      param8: this.editLongitude.trim()
    };
    
    this.loading = true;
    this.poiService.editPOI(updateData).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status) {
          alert(response.entity || 'POI updated successfully!');
          this.closeEditModal();
          this.loadPOIs();
        } else {
          this.errorMessage = typeof response.entity === 'string' ? response.entity : 'Update failed.';
          
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.entity || 'Error updating POI';
      }
    });
  }
  
  openDeleteModal(poi: POI) {
    this.selectedPOI = poi;
    this.deleteRemark = '';
    this.showDeleteModal = true;
  }
  
  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedPOI = null;
    this.deleteRemark = '';
  }
  
  submitDelete() {
    if (!this.selectedPOI) return;
    
    if (!this.deleteRemark || this.deleteRemark.trim().length < 10) {
      alert('Remark must be at least 10 characters long.');
      return;
    }
    
    if (confirm('Are you sure you want to delete this POI? This action cannot be undone.')) {
      this.loading = true;
      this.poiService.deletePOI(this.selectedPOI.param2 || '', this.deleteRemark.trim()).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.status) {
            alert(response.entity || 'POI deleted successfully!');
            this.closeDeleteModal();
            this.loadPOIs();
          } else {
            this.errorMessage = typeof response.entity === 'string' ? response.entity : 'Delete failed.';
            
          }
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error?.error?.entity || 'Error deleting POI';
        }
      });
    }
  }
  
  goHome() {
    this.router.navigate(['/dashboard']);
  }

   onPoiNameInput(event: any) {
    const input = event.target as HTMLInputElement;
    // Allowed: a-z, A-Z, 0-9, Space, -, ., (, ), /
    let sanitizedValue = input.value.replace(/[^a-zA-Z0-9 \-\.\(\)\/]/g, '');
    if (input.value !== sanitizedValue) {
      input.value = sanitizedValue;
    }
    this.editPoiName = sanitizedValue;
  }

  onLatitudeInput(event: any) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/[^0-9.-]/g, '');

    if (value.includes('-', 1)) value = value.charAt(0) + value.slice(1).replace(/-/g, '');

    const parts = value.split('.');
    if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');

    // Auto-insert decimal point after 2 digits if missing (e.g., 453456 -> 45.3456)
    if (!value.includes('.') && value.replace('-', '').length > 2) {
      const dotIndex = value.startsWith('-') ? 3 : 2;
      value = value.slice(0, dotIndex) + '.' + value.slice(dotIndex);
    }

    this.editLatitude = value;
    input.value = value;
    this.checkLatitude();
  }

  onLongitudeInput(event: any) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/[^0-9.-]/g, '');

    if (value.includes('-', 1)) value = value.charAt(0) + value.slice(1).replace(/-/g, '');

    const parts = value.split('.');
    if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');

    // Auto-insert decimal point after 2 digits if missing
    if (!value.includes('.') && value.replace('-', '').length > 2) {
      const dotIndex = value.startsWith('-') ? 3 : 2;
      value = value.slice(0, dotIndex) + '.' + value.slice(dotIndex);
    }

    this.editLongitude = value;
    input.value = value;
    this.checkLongitude();
  }

  onRangeInput(event: any) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/[^0-9.]/g, ''); // Allow only numbers and one dot

    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }

    this.editRange = value;
    input.value = value; // Update input value to reflect sanitization
    this.checkRange(); // Trigger validation on input
  }
  checkLongitude() {
    const lon = this.editLatitude;
    if (!lon) {
      this.formErrors['longitude'] = false;
      return;
    }
    
    if (lon[2] === '.') {
      if (lon.length < 6 || lon.length > 9) {
        this.formErrors['longitude'] = true;
      } else {
        this.formErrors['longitude'] = false;
      }
    } else if (lon[3] === '.') {
      if (lon.length < 7 || lon.length > 10) {
        this.formErrors['longitude'] = true;
      } else {
        this.formErrors['longitude'] = false;
      }
    } else {
      this.formErrors['longitude'] = true;
    }
  }
  
  checkRange() {
    const rangeVal = parseFloat(this.editRange);
    // Assuming a reasonable range for POI is between 0.1 and 500 km
    if (isNaN(rangeVal) || rangeVal <= 0 || rangeVal > 500) {
      this.formErrors['range'] = true;
    } else {
      this.formErrors['range'] = false;
    }
  }

   checkLatitude() {
    const lat = this.editLatitude;
    if (!lat) {
      this.formErrors['latitude'] = false;
      return;
    }
    
    if (lat[2] === '.') {
      if (lat.length < 6 || lat.length > 9) {
        this.formErrors['latitude'] = true;
      } else {
        this.formErrors['latitude'] = false;
      }
    } else if (lat[3] === '.') {
      if (lat.length < 7 || lat.length > 10) {
        this.formErrors['latitude'] = true;
      } else {
        this.formErrors['latitude'] = false;
      }
    } else {
      this.formErrors['latitude'] = true;
    }
  }
}
