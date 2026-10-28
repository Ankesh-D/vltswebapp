import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { RouteService, Route, RouteRequest, RouteListResponse } from '../../../core/services/route.service';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';

@Component({
    selector: 'app-route-list',
    imports: [CommonModule, FormsModule, RouterModule, CommonTableComponent],
    templateUrl: './route-list.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./route-list.component.scss']
})
export class RouteListComponent implements OnInit {
  routes: Route[] = [];
  loading = false;
  errorMessage = '';
  searchText = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions: number[] = [10, 20, 50, 100];
  totalCount = 0;
  pageCount = 0;
  
  // Sorting
  sortKey: string = '';
  reverse: boolean = false;
  readonly tableColumns: CommonTableColumn<Route>[] = [
    { key: 'param1', label: '#', width: '60px', value: route => route.param1 || 'NA' },
    { key: 'param3', label: 'Route Name', sortable: true, value: route => route.param3 || 'NA' },
    { key: 'param11', label: 'Speed (km/hr)', sortable: true, width: '90px', value: route => route.param11 || 'NA' },
    {
      key: 'actions',
      label: 'Action',
      width: '150px',
      actions: [
        { label: 'Edit', icon: 'fa fa-edit', tone: 'primary', className: 'btn-outline-primary me-2 shadow-sm', run: route => this.openEditModal(route) },
        { label: 'Delete', icon: 'fa fa-trash', tone: 'danger', className: 'btn-outline-danger shadow-sm', run: route => this.openDeleteModal(route) }
      ]
    }
  ];
  
  // Selected route for edit/delete
  selectedRoute: Route | null = null;
  editRouteName: string = '';
  editSpeed: string = '';
  editRemark: string = '';
  deleteRemark: string = '';
  
  showEditModal = false;
  showDeleteModal = false;
  
  // Speed options
  speedOptions = ['20', '30', '40', '50', '60', '70', '80', '90', '100'];
  
  constructor(
    private routeService: RouteService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit() {
    this.loadRoutes();
  }
  
  loadRoutes() {
    this.loading = true;
    this.errorMessage = '';
    
    const request: RouteRequest = {
      param1: this.searchText || '',
      param2: this.currentPage.toString(),
      param3: this.pageSize.toString()
    };
    
    this.routeService.getRouteDetails(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.routes = response.entity.listData || [];
          this.totalCount = response.entity.param1 || 0;
          this.pageCount = this.routes.length;
          this.updatePageSizeOptions();
        } else {
          this.errorMessage = typeof response.entity === 'string' ? response.entity : 'Failed to load routes';
          this.routes = [];
          this.totalCount = 0;
          this.pageCount = 0;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.entity || 'Error loading routes';
        console.error('Error loading routes:', error);
        this.routes = [];
        this.totalCount = 0;
        this.pageCount = 0;
        this.cdr.detectChanges();
      }
    });
  }
  
  getSearchDetails() {
    this.currentPage = 1;
    this.loadRoutes();
  }
  
  reloadData() {
    this.searchText = '';
    this.currentPage = 1;
    this.loadRoutes();
  }
  
  sort(key: string) {
    if (this.sortKey === key) {
      this.reverse = !this.reverse;
    } else {
      this.sortKey = key;
      this.reverse = false;
    }
    
    this.routes.sort((a, b) => {
      const aVal = (a as any)[key] || '';
      const bVal = (b as any)[key] || '';
      return this.reverse 
        ? String(bVal).localeCompare(String(aVal))
        : String(aVal).localeCompare(String(bVal));
    });
  }
  
  onPageChange(page: number): void {
    if (page > 0 && page <= this.getTotalPages()) {
      this.currentPage = page;
      this.loadRoutes();
    }
  }
  
  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newSize = target.value;
    this.pageSize = newSize === 'All' ? this.totalCount : parseInt(newSize);
    this.currentPage = 1;
    this.loadRoutes();
  }
  
  getTotalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }
  
  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  
  updatePageSizeOptions(): void {
    if (this.totalCount > Math.max(...this.pageSizeOptions)) {
      if (!this.pageSizeOptions.includes(this.totalCount)) {
        this.pageSizeOptions = [...this.pageSizeOptions, this.totalCount].sort((a, b) => a - b);
      }
    }
  }
  
  openEditModal(route: Route) {
    this.selectedRoute = { ...route };
    this.editRouteName = route.param3 || '';
    this.editSpeed = route.param11 || '';
    this.editRemark = '';
    this.showEditModal = true;
  }
  
  closeEditModal() {
    this.showEditModal = false;
    this.selectedRoute = null;
    this.editRemark = '';
  }
  
  submitEdit() {
    if (!this.selectedRoute) return;
    
    if (!this.editRouteName || this.editRouteName.trim() === '') {
      alert('Route Name is required.');
      return;
    }
    if (!this.editRemark || this.editRemark.trim().length < 10) {
      alert('Remark must be at least 10 characters long.');
      return;
    }
    
    // Note: Route update requires coordinates which are managed in map tracking
    // This is a simplified version - full update should be done in map tracking interface
    alert('Route editing should be done through the Map Tracking interface where you can modify the route path.');
    this.closeEditModal();
  }
  
  openDeleteModal(route: Route) {
    this.selectedRoute = route;
    this.deleteRemark = '';
    this.showDeleteModal = true;
  }
  
  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedRoute = null;
    this.deleteRemark = '';
  }
  
  submitDelete() {
    if (!this.selectedRoute) return;
    
    if (!this.deleteRemark || this.deleteRemark.trim().length < 10) {
      alert('Remark must be at least 10 characters long.');
      return;
    }
    
    if (confirm('Are you sure you want to delete this route? This action cannot be undone.')) {
      this.loading = true;
      this.routeService.deleteRoute(this.selectedRoute.param2 || '', this.deleteRemark.trim()).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.status) {
            alert(response.entity || 'Route deleted successfully!');
            this.closeDeleteModal();
            this.loadRoutes();
          } else {
            this.errorMessage = typeof response.entity === 'string' ? response.entity : 'Delete failed.';
            alert(this.errorMessage);
          }
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error?.error?.entity || 'Error deleting route';
          alert('Error deleting route: ' + this.errorMessage);
          console.error('Error deleting route:', error);
        }
      });
    }
  }
  
  goHome() {
    this.router.navigate(['/dashboard']);
  }
  
  navigateToMapTracking() {
    this.router.navigate(['/mapViewAll']);
  }
}
