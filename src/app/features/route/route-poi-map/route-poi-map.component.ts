import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { RouteService, Route, RoutePOIMapping, RoutePOIRequest, RoutePOIListResponse } from '../../../core/services/route.service';
import { POIService } from '../../../core/services/poi.service';
import { ToastComponent } from '../../assets/inactive-assets/toast.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
    selector: 'app-route-poi-map',
    imports: [CommonModule, FormsModule, RouterModule, NgSelectModule, ToastComponent],
    templateUrl: './route-poi-map.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./route-poi-map.component.scss']
})
export class RoutePOIMapComponent implements OnInit {
  // Form fields
  selectedRouteId: any = null;
  selectedPOIId: any = null;
  
  // Lists
  routeList: Route[] = [];
  poiList: any[] = [];
  routePOIMappings: RoutePOIMapping[] = [];
  
  // Search and pagination
  searchText = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions: number[] = [10, 20, 50, 100];
  totalCount = 0;
  pageCount = 0;
  
  // Sorting
  sortKey: string = '';
  reverse: boolean = false;
  
  // Modal
  selectedMapping: RoutePOIMapping | null = null;
  unassignRemark: string = '';
  showUnassignModal = false;
  
  // Loading
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  
  constructor(
    private routeService: RouteService,
    private poiService: POIService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {
    this.toast.pageName = 'Route POI Mapping'; // Set page name for toast service
  }
  
  ngOnInit() {
    this.loadInitialData();
    this.loadRoutePOIMappings();
  }
  
  loadInitialData() {
    this.loading = true;
    
    // Load route roster
    this.routeService.getRouteRoster().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.routeList = response.entity;
        }
        this.checkLoadingComplete();
      },
      error: (error) => {
        this.errorMessage = 'Error loading route roster: ' + error;
        this.checkLoadingComplete();
      }
    });
    
    // Load POI roster
    this.poiService.getPOIRoster().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.poiList = response.entity;
        }
        this.checkLoadingComplete();
      },
      error: (error) => {
        this.errorMessage = 'Error loading POI roster: ' + error;
        this.checkLoadingComplete();
      }
    });
  }
  
  checkLoadingComplete() {
    // Simple check - in production, use a counter or Promise.all
    this.loading = false;
  }
  
  loadRoutePOIMappings() {
    this.loading = true;
    this.errorMessage = '';
    
    const request: RoutePOIRequest = {
      param5: this.searchText || '',
      param8: this.currentPage.toString(),
      param9: this.pageSize.toString()
    };
    
    this.routeService.getRoutePOIUnassignDetails(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.routePOIMappings = response.entity.listData || [];
          this.totalCount = response.entity.param1 || 0;
          this.pageCount = this.routePOIMappings.length;
          this.updatePageSizeOptions();
        } else {
          this.errorMessage = typeof response.entity === 'string' ? response.entity : 'Failed to load route POI mappings';
          this.routePOIMappings = [];
          this.totalCount = 0;
          this.pageCount = 0;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.entity || 'Error loading route POI mappings';
        this.routePOIMappings = [];
        this.totalCount = 0;
        this.pageCount = 0;
        this.cdr.detectChanges();
      }
    });
  }
  
  assignRouteToPOI() {
    if (!this.selectedRouteId || this.selectedRouteId === '') {
      this.errorMessage = 'Select Route';
      return;
    }
    if (!this.selectedPOIId || this.selectedPOIId === '') {
      this.errorMessage = 'Select POI';
      return;
    }
    
    this.loading = true;
    this.routeService.assignRouteToPOI(this.selectedRouteId, this.selectedPOIId).subscribe({
      next: (response) => {
        this.loading = false;
        const message = typeof response.entity === 'string' ? response.entity : 'Route assigned to POI successfully';
        this.successMessage = message;
        if (message.includes('Successfully') || message.includes('success')) {
          this.selectedRouteId = null;
          this.selectedPOIId = null;
          this.loadRoutePOIMappings();
        }
      },
      error: (error) => {
        this.loading = false;
        const errorMsg = error?.error?.entity || 'Error assigning route to POI';
        this.errorMessage = errorMsg;
      }
    });
  }
  
  getSearchDetails() {
    this.currentPage = 1;
    this.loadRoutePOIMappings();
  }
  
  reloadData() {
    this.searchText = '';
    this.currentPage = 1;
    this.loadRoutePOIMappings();
  }
  
  sort(key: string) {
    if (this.sortKey === key) {
      this.reverse = !this.reverse;
    } else {
      this.sortKey = key;
      this.reverse = false;
    }
    
    this.routePOIMappings.sort((a, b) => {
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
      this.loadRoutePOIMappings();
    }
  }
  
  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newSize = target.value;
    this.pageSize = newSize === 'All' ? this.totalCount : parseInt(newSize);
    this.currentPage = 1;
    this.loadRoutePOIMappings();
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
  
  openUnassignModal(mapping: RoutePOIMapping) {
    this.selectedMapping = mapping;
    this.unassignRemark = '';
    this.showUnassignModal = true;
  }
  
  closeUnassignModal() {
    this.showUnassignModal = false;
    this.selectedMapping = null;
    this.unassignRemark = '';
  }
  
  validateRemark() {
    return this.unassignRemark && this.unassignRemark.trim().length >= 10;
  }
  
  unmapRouteFromPOI() {
    if (!this.selectedMapping) return;
    
    if (!this.validateRemark()) {
      this.errorMessage = 'Remark must be at least 10 characters long.';
      return;
    }
    
    this.loading = true;
    this.routeService.unassignRouteFromPOI(
      this.selectedMapping.param3 || '',
      this.selectedMapping.param2 || '',
      this.unassignRemark.trim()
    ).subscribe({
      next: (response) => {
        this.loading = false;
        const message = typeof response.entity === 'string' ? response.entity : 'Route unassigned from POI successfully';
        this.successMessage = message;
        this.closeUnassignModal();
        this.loadRoutePOIMappings();
      },
      error: (error) => {
        this.loading = false;
        const errorMsg = error?.error?.entity || 'Error unassigning route from POI';
        this.errorMessage = errorMsg;
      }
    });
  }
}
