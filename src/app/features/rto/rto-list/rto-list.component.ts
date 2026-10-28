import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RtoService, RTO, RTORequest } from '../../../core/services/rto.service';
import { forkJoin } from 'rxjs';
import { ToastService } from '../../../core/services/toast.service';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';
@Component({
    selector: 'app-rto-list',
    imports: [CommonModule, FormsModule, RouterModule, NgbPaginationModule, CommonTableComponent],
    templateUrl: './rto-list.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./rto-list.component.scss']
})
export class RtoListComponent implements OnInit {
  rtos: RTO[] = [];
  loading = false;
  errorMessage = '';
  searchText = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [20];
  totalCount = 0;
  pageCount = 0;
  
  // Route parameters
  type: string = '';
  counttype: string = '';
  
  // Sorting
  sortKey: string = '';
  reverse: boolean = false;
  readonly tableColumns: CommonTableColumn<RTO>[] = [
    { key: 'param1', label: '#', width: '20px', value: rto => rto.param1 || 'NA' },
    { key: 'param3', label: 'RTO Name', sortable: true, value: rto => rto.param3 || 'NA' },
    { key: 'param4', label: 'RTO Code', sortable: true, value: rto => rto.param4 || 'NA' },
    { key: 'param9', label: 'State Name', sortable: true, value: rto => rto.param9 || 'NA' },
    { key: 'param5', label: 'State Code', sortable: true, value: rto => rto.param5 || 'NA' },
    { key: 'param8', label: 'Pin Code', sortable: true, value: rto => rto.param8 || 'NA' },
    {
      key: 'actions',
      label: 'Action',
      actions: [
        { label: 'Edit', tone: 'primary', run: rto => this.openEditModal(rto) },
        { label: 'Delete', tone: 'danger', className: 'btnleft5', run: rto => this.openDeleteModal(rto) }
      ]
    }
  ];
  
  // RTO roster for state selection
  rtolist: any[] = [];
  selectedStateCode: string = '';
  stateCode: string = ''; // Default state code (from original: 'DL')
  
  // Modal data
  selectedRTO: RTO | null = null;
  rtoId: string = '';
  rtoName: string = '';
  rtoCode: string = '';
  pinCode: string = '';
  stateId: string = '34';
  stateName: string = '';
  updateRemark: string = '';
  deleteRemark: string = '';
  
  // Modal visibility
  showEditModal = false;
  showDeleteModal = false;
  
  constructor(
    private toast: ToastService,
    private rtoService: RtoService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService
  ) {
    this.toastService.pageName = 'RTO Master Details'; // Set page name for toast service
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.type = params['type'] || '';
      this.counttype = params['counttype'] || '';
      this.loadInitialData();
    });
  }

  loadInitialData() {
    this.loading = true;
    forkJoin([
      this.rtoService.getRTOList()
    ]).subscribe({
      next: ([rtoResponse]) => {
        if (rtoResponse.status && rtoResponse.entity) {
          this.rtolist = rtoResponse.entity;
          // Set default state (DL - Delhi, stateId: 7)
          const defaultState = this.rtolist.find((r: any) => r.param3 === 'DL');
          if (defaultState) {
            this.stateCode = defaultState.param3;
            this.stateId = defaultState.param1;
          }
        }
        this.loadRTODetails();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = 'Error loading initial data. Please try again.';
        console.error('Error loading initial data:', error);
      }
    });
  }

  loadRTODetails() {
    this.loading = true;
    this.errorMessage = '';
    this.rtos = [];

    const request: RTORequest = {
      param1: this.searchText.trim(),
      param2: this.currentPage.toString(),
      param3: this.pageSize.toString(),
      param4: this.stateCode || '',
      param5: this.counttype || ''
    };

    this.rtoService.getRTODetails(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response?.status && response?.entity) {
          if (Object.keys(response.entity).length === 0) {
            this.rtos = [];
            if (this.currentPage === 1) {
              this.totalCount = 0;
              this.pageCount = 0;
            } else {
              this.errorMessage = `Backend returned no data for page ${this.currentPage}. Redirecting to page 1.`;
              setTimeout(() => {
                this.currentPage = 1;
                this.loadRTODetails();
              }, 2000);
              return;
            }
          } else if ((response.entity as any).listData !== undefined) {
            const rtoListResponse = response.entity as any;
            this.rtos = rtoListResponse.listData || [];
            if (rtoListResponse.param1 !== undefined && rtoListResponse.param1 !== null) {
              this.totalCount = rtoListResponse.param1 || 0;
            }
          } else if (Array.isArray(response.entity)) {
            this.rtos = response.entity;
            this.totalCount = response.entity.length;
          } else {
            this.rtos = [];
          }
          
          this.pageCount = this.rtos.length;
          this.updatePageSizeOptions();
          this.cdr.detectChanges();
        } else {
          const errorMsg = typeof response?.entity === 'string' 
            ? response.entity 
            : (response?.entity?.toString() || 'Failed to load RTO details');
          this.errorMessage = errorMsg;
          this.rtos = [];
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = 'Error loading RTO details. Please try again.';
        this.rtos = [];
        console.error('Error loading RTO details:', error);
        this.cdr.detectChanges();
      }
    });
  }

  updatePageSizeOptions() {
    const options = [20];
    if (this.totalCount > 50) options.push(50);
    if (this.totalCount > 100) options.push(100);
    if (this.totalCount > 200) options.push(200);
    if (this.totalCount > 500) options.push(500);
    if (this.totalCount > 0) options.push(this.totalCount);
    this.pageSizeOptions = options;
  }

  onPageSizeChange(size: number | string) {
    if (size === 'All' || size === this.totalCount) {
      this.pageSize = this.totalCount;
    } else {
      this.pageSize = Number(size);
    }
    this.currentPage = 1;
    this.loadRTODetails();
  }

  onPageChange(page: number) {
    const totalPages = this.getTotalPages();
    if (page < 1 || (this.totalCount > 0 && page > totalPages)) {
      return;
    }
    this.currentPage = page;
    this.loadRTODetails();
  }

  reloadData() {
    this.searchText = '';
    this.currentPage = 1;
    this.pageSize = 20;
    this.loadRTODetails();
  }

  getSearchDetails() {
    this.currentPage = 1;
    this.loadRTODetails();
  }

  sort(key: string) {
    if (this.sortKey === key) {
      this.reverse = !this.reverse;
    } else {
      this.sortKey = key;
      this.reverse = false;
    }
    this.cdr.detectChanges();
  }

  onStateChange() {
    const state = this.rtolist.find((r: any) => r.param1 === this.selectedStateCode);
    if (state) {
      this.stateCode = state.param3;
      this.stateId = state.param1;
    }
    this.currentPage = 1;
    this.loadRTODetails();
  }

  getManagedata(rto: RTO) {
    this.selectedRTO = rto;
    this.rtoId = rto.param2 || '';
    this.rtoName = rto.param3 || '';
    this.rtoCode = rto.param4 || '';
    this.pinCode = rto.param8 || '';
    this.stateId = rto.param6 || '';
    this.stateName = rto.param9 || '';
    this.stateCode = rto.param5 || '';
  }

  openEditModal(rto: RTO) {
    this.getManagedata(rto);
    this.showEditModal = true;
    this.updateRemark = '';
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedRTO = null;
  }

  validateRTOCode(): boolean {
    const regExp = /^([A-Za-z]{2}[0-9]{2})$/;
    const regExp1 = /^([A-Za-z]{2}[0-9]{2}[A-Za-z]{1})$/;
    const code = this.rtoCode.substring(0, 2);
    return !!(this.rtoCode.match(regExp) || this.rtoCode.match(regExp1)) && 
           this.stateCode === code && 
           this.rtoCode.length >= 4;
  }

editRTODetails() {

  // ===== CLEAN INPUTS =====
  const rtoCode = (this.rtoCode || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]/g, '');

  const pinCode = (this.pinCode || '').trim();
  const remark = (this.updateRemark || '').trim();

  const rtoRegex = /^[A-Z]{2}[0-9]{2}[A-Z]?$/;

  // ===== VALIDATIONS =====
  if (!rtoCode) {
    this.toast.show('RTO code is required', 'error');
    return;
  }

  if (!rtoRegex.test(rtoCode)) {
    this.toast.show('Invalid RTO code (Format: DL01 / DL01A)', 'error');
    return;
  }

  if (this.stateCode && !rtoCode.startsWith(this.stateCode.toUpperCase())) {
    this.toast.show(`RTO must start with ${this.stateCode}`, 'error');
    return;
  }

  if (!pinCode) {
    this.toast.show('PIN code is required', 'error');
    return;
  }

  if (!/^\d{6}$/.test(pinCode)) {
    this.toast.show('Enter valid 6-digit PIN code', 'error');
    return;
  }

  if (!remark) {
    this.toast.show('Remark is required', 'error');
    return;
  }

  if (remark.length < 10) {
    this.toast.show('Remark must be at least 10 characters', 'error');
    return;
  }

  // ===== CONFIRM =====
  if (!confirm('Are you sure you want to update this RTO?')) return;

  // ===== PAYLOAD =====
  const rtoData = {
    param1: this.rtoId,
    param2: rtoCode,
    param3: this.rtoName,
    param4: pinCode,
    param5: this.stateId,
    param7: remark
  };

  this.loading = true;

  this.rtoService.editRTO(rtoData).subscribe({
    next: (response) => {
      this.loading = false;

      if (response?.status) {
        this.toast.show(response.entity || 'RTO updated successfully', 'success');

        this.loadRTODetails();
        this.closeEditModal();

      } else {
        this.toast.show(response?.entity || 'Failed to update RTO', 'error');
      }
    },

    error: (error) => {
      this.loading = false;
      console.error(error);
      this.toast.show('Server error. Please try again', 'error');
    }
  });
}

  openDeleteModal(rto: RTO) {
    this.getManagedata(rto);
    this.showDeleteModal = true;
    this.deleteRemark = '';
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedRTO = null;
  }

deleteRTODetails() {

  const remark = (this.deleteRemark || '').trim();

  // ===== VALIDATION =====
  if (!remark) {
    this.toast.show('Remark is required', 'error');
    return;
  }

  if (remark.length < 10) {
    this.toast.show('Remark must be at least 10 characters', 'error');
    return;
  }

  // ===== CONFIRM =====
  if (!confirm('Are you sure you want to delete this RTO?')) return;

  // ===== API CALL =====
  this.loading = true;

  this.rtoService.deleteRTO(this.rtoId, remark).subscribe({
    next: (response) => {
      this.loading = false;

      if (response?.status) {
        this.toast.show(response.entity || 'RTO deleted successfully', 'success');

        // Reload + close modal
        this.loadRTODetails();
        this.closeDeleteModal();

      } else {
        this.toast.show(response?.entity || 'Failed to delete RTO', 'error');
      }
    },

    error: (error) => {
      this.loading = false;
      console.error('Error deleting RTO:', error);
      this.toast.show('Error deleting RTO. Please try again', 'error');
    }
  });
}
  goHome() {
    this.router.navigate(['/dashboard']);
  }

  getTotalPages(): number {
    if (this.totalCount === 0 || this.pageSize === 0) {
      return 1;
    }
    return Math.ceil(this.totalCount / this.pageSize);
  }

  getPageNumbers(): number[] {
    const total = this.getTotalPages();
    const pages: number[] = [];
    const maxPages = 8;
    
    if (total <= maxPages) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push(-1);
        pages.push(total);
      } else if (this.currentPage >= total - 3) {
        pages.push(1);
        pages.push(-1);
        for (let i = total - 4; i <= total; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push(-1);
        for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(-1);
        pages.push(total);
      }
    }
    return pages;
  }
}
