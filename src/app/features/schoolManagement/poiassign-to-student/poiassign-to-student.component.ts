import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { RouteService, Route, RoutePOIRequest, RoutePOIListResponse, StudentPOIRequest, StudentPOIMapping } from '../../../core/services/route.service';
import { POIService } from '../../../core/services/poi.service';
import { ToastComponent } from '../../assets/inactive-assets/toast.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
    selector: 'app-poiassign-to-student',
    imports: [CommonModule, FormsModule, RouterModule, NgSelectModule, ToastComponent],
    templateUrl: './poiassign-to-student.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './poiassign-to-student.component.scss'
})
export class POIAssignToStudentComponent   implements OnInit {
  // Form fields
  selectedStudentId: any = null;
  selectedPOIId: any = null;
  
  // Lists
  studentList: Route[] = [];
  poiList: any[] = [];
  studentPOIMappings: StudentPOIMapping[] = [];
  
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
  selectedMapping: StudentPOIMapping | null = null;
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
    this.routeService.getStudentList().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.studentList = response.entity;
        }
        this.checkLoadingComplete();
      },
      error: (error) => {
        this.errorMessage = 'Error loading student roster: ' + error;
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

    const request: StudentPOIRequest = {
      param1: this.searchText || '',
      param2: this.currentPage.toString(),
      param3: this.pageSize.toString(),
      param4: '',  // schoolid
      param5: this.selectedStudentId || '',
      param6: this.selectedPOIId || ''
    };
    
    this.routeService.getStudentPOIUnassignDetails(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          const listData = response.entity.listData || [];
          this.studentPOIMappings = listData.map((item: any) => ({
            ...item,
            // /studentpoidetails returns IDs as param3 (student) and param2 (POI).
            studentid: item.studentid ?? item.studentId ?? item.param3 ?? '',
            poiid: item.poiid ?? item.poiId ?? item.param2 ?? '',
            remarks: item.remarks ?? '',
            pagename: item.pagename ?? ''
          })) as StudentPOIMapping[];
          this.totalCount = response.entity.param1 || 0;
          this.pageCount = this.studentPOIMappings.length;
          this.updatePageSizeOptions();
        } else {
          this.errorMessage = typeof response.entity === 'string' ? response.entity : 'Failed to load route POI mappings';
          this.studentPOIMappings = [];
          this.totalCount = 0;
          this.pageCount = 0;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.entity || 'Error loading route POI mappings';
        this.studentPOIMappings = [];
        this.totalCount = 0;
        this.pageCount = 0;
        this.cdr.detectChanges();
      }
    });
  }
  
  assignRouteToPOI() {
    if (!this.selectedStudentId || this.selectedStudentId === '') {
      this.errorMessage = 'Select Student';
      return;
    }
    if (!this.selectedPOIId || this.selectedPOIId === '') {
      this.errorMessage = 'Select POI';
      return;
    }
    
    this.loading = true;
    this.routeService.assignPOIToStudent(this.selectedStudentId, this.selectedPOIId).subscribe({
      next: (response) => {
        this.loading = false;
        const message = typeof response.entity === 'string' ? response.entity : 'Route assigned to POI successfully';
        this.successMessage = message;
        if (message.includes('Successfully') || message.includes('success')) {
          this.selectedStudentId = null;
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
    
    this.studentPOIMappings.sort((a, b) => {
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

  openUnassignModal(mapping: StudentPOIMapping) {
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
  
  unmapStudentFromPOI() {
    if (!this.selectedMapping) return;
    
    if (!this.validateRemark()) {
      this.errorMessage = 'Remark must be at least 10 characters long.';
      return;
    }

    const studentId = String(this.selectedMapping.studentid);
    const poiId = String(this.selectedMapping.poiid);
    if (!studentId || !poiId) {
      this.errorMessage = 'Student or POI ID is missing from the selected mapping.';
      return;
    }

    this.loading = true;
    this.routeService.unassignStudentFromPOI(
      studentId,
      poiId,
      this.unassignRemark.trim()
    ).subscribe({
      next: (response: any) => {
        this.loading = false;
        const message = typeof response.entity === 'string' ? response.entity : 'POI unassigned from POI successfully';
        this.successMessage = message;
        this.closeUnassignModal();
        this.loadRoutePOIMappings();
      },
      error: (error) => {
        this.loading = false;
        const errorMsg = error?.error?.entity || 'Error unassigning student from POI';
        this.errorMessage = errorMsg;
      }
    });
  }
}
