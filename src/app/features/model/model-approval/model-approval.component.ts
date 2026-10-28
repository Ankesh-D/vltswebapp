import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ModelService, Model, ModelRequest, ModelListResponse, ModelApprovalRequest, ModelTacValidityApprovalRequest } from '../../../core/services/model.service';
import { CommonDataToolbarComponent } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { ToastComponent } from '../../assets/inactive-assets/toast.component';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../../core/services/toast.service';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';

@Component({
    selector: 'app-model-approval',
    imports: [CommonModule, FormsModule, RouterModule, CommonDataToolbarComponent, ToastComponent, NgbPaginationModule, CommonTableComponent],
    templateUrl: './model-approval.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./model-approval.component.scss']
})
export class ModelApprovalComponent implements OnInit {
  models: Model[] = [];
  loading = false;
  errorMessage = '';
  searchText = '';
  currentPage = 1;
  pageSize = 20;
  totalCount = 0;
  isExporting: boolean = false;
selectedDownloadType: string = '';
  // Sorting
  sortKey: string = '';
  reverse: boolean = false;
  readonly tableColumns: CommonTableColumn<Model>[] = [
    { key: 'param1', label: '#', width: '30px' },
    { key: 'param15', label: 'Vendor Name', sortable: true, value: model => model.param15 || 'NA' },
    { key: 'param5', label: 'Certification Authority', sortable: true, value: model => model.param5 || 'NA' },
    { key: 'param4', label: 'Model Name', sortable: true, value: model => model.param4 || 'NA' },
    { key: 'param3', label: 'Model Code', sortable: true, value: model => model.param3 || 'NA' },
    { key: 'param8', label: 'TAC Validity', sortable: true, value: model => model.param8 || 'NA' },
    { key: 'param20', label: 'Status', sortable: true, className: 'text-center' },
    { key: 'param35', label: 'Pending Reason', sortable: true, value: model => model.param35 || 'NA' },
    { key: 'param27', label: 'Device IRNSS', sortable: true, value: model => model.param27 || 'NA' },
    { key: 'activity', label: 'Activity', className: 'text-center' },
    { key: 'tacValidity', label: 'TAC Validity Approval', className: 'text-center' }
  ];
  
  // Selected model for approval
  selectedModel: Model | null = null;
  approvalRemark = '';
  tacValidityRemark = '';
  showApprovalModal = false;
  showTacValidityModal = false;
  approvalAction = ''; // 'Approve' or 'Disapprove'

  // errorMessage: string | null = null;
  successMessage: string | null = null;
  roleId: any = '';
  constructor(
    private modelService: ModelService,
    private cdr: ChangeDetectorRef,
    public toastService: ToastService
  ) {
    this.toastService.pageName = 'Device Model Approval'; // Set page name for toast service

  }
  
  ngOnInit() {
    this.loadModels();
    this.roleId = sessionStorage.getItem('roleid');
  }
  updatePageSizeOptions() {
    // Generate page size options based on total count
    const options = [20];
    if (this.totalCount > 50) options.push(50);
    if (this.totalCount > 100) options.push(100);
    if (this.totalCount > 200) options.push(200);
    if (this.totalCount > 500) options.push(500);
    if (this.totalCount > 1000) options.push(1000);
    if (this.totalCount > 0 && this.totalCount < 100) options.push(this.totalCount); // 'All'
    this.pageSizeOptions = options;
  }
  
  loadModels() {
    this.loading = true;
    this.errorMessage = '';
    
    const request: ModelRequest = {
      param1: this.searchText || '',
      param2: this.currentPage.toString(),
      param3: this.pageSize.toString()
    };
    
    this.modelService.getModelDetails(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.models = response.entity.listData || [];
          this.totalCount = response.entity.param1 ;
         this.pageCount = this.models.length;
         this.updatePageSizeOptions();
          
        } else {
          this.errorMessage = typeof response.entity === 'string' ? response.entity : 'Failed to load models';
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.entity || 'Error loading models';
        console.error('Error loading models:', error);
        this.cdr.detectChanges();
      }
    });
    
  }
  
  getSearchDetails() {
    this.currentPage = 1;
    this.loadModels();
  }
  
  reloadData() {
    this.searchText = '';
    this.currentPage = 1;
    this.loadModels();
  }
  
  sort(key: string) {
    if (this.sortKey === key) {
      this.reverse = !this.reverse;
    } else {
      this.sortKey = key;
      this.reverse = false;
    }
    
    this.models.sort((a, b) => {
      const aVal = (a as any)[key] || '';
      const bVal = (b as any)[key] || '';
      
      if (this.reverse) {
        return bVal.localeCompare(aVal);
      } else {
        return aVal.localeCompare(bVal);
      }
    });
  }

  onPageSizeChange(size: any) {
      if (size === 'All') {
        this.pageSize = this.totalCount;
      } else {
        this.pageSize = parseInt(size, 10);
      }
      this.currentPage = 1;
      this.loadModels();
    }
    
  
    getPaginatedUsers(){
      if (this.pageSize === this.totalCount || this.pageSize >= this.models.length) {
        return this.models;
      }
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.models.slice(start, end);
    }
  
    onPageChange(page: number) {
      this.currentPage = page;
      this.loadModels();
    }
  
    getTotalPages(): number {
      if (this.pageSize === 0 || this.totalCount === 0) return 0;
      return Math.ceil(this.totalCount / this.pageSize);
    }
  
    getPageNumbers(): number[] {
      const totalPages = this.getTotalPages();
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
  
  openApprovalModal(model: Model) {
    this.selectedModel = model;
    this.approvalAction = model.param20 === 'Approved' ? 'Disapprove' : 'Approve';
    this.approvalRemark = '';
    this.showApprovalModal = true;
  }
  
  closeApprovalModal() {
    this.showApprovalModal = false;
    this.selectedModel = null;
    this.approvalRemark = '';
  }
  
  approvestatus: string = '';  
  approveModel() {
    if (!this.selectedModel || !this.approvalRemark.trim()) {
      alert('Please enter a remark for the approval action.');
      return;
    }

    if (this.approvalAction === 'Approve') {
      this.approvestatus = 'APPROVE';
    } else if (this.approvalAction === 'Disapprove') {
      this.approvestatus = 'NOT APPROVE';
    }
    
    const approvalData: ModelApprovalRequest = {
      param1: this.selectedModel.param2 || '',    //devmodelid
      param2: this.approvestatus,
      param3: this.approvalRemark.trim(),
      param4: this.selectedModel.param14 || '',    //   vendorid
      param5: this.approvestatus
    };
    
    this.loading = true;
    this.modelService.approveModel(approvalData).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status) {
          const message = typeof response.entity === 'string' ? response.entity : 'Model approval action completed';
          alert(message);
          this.closeApprovalModal();
          this.loadModels();
        } else {
          this.errorMessage = typeof response.entity === 'string' ? response.entity : 'Failed to process approval';
          alert(this.errorMessage);
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.entity || 'Error processing approval';
        alert('Error: ' + this.errorMessage);
        console.error('Error processing approval:', error);
      }
    });
  }
  
  openTacValidityModal(model: Model) {
    this.selectedModel = model;
    this.tacValidityRemark = '';
    this.showTacValidityModal = true;
  }
  
  closeTacValidityModal() {
    this.showTacValidityModal = false;
    this.selectedModel = null;
    this.tacValidityRemark = '';
  }
  
  approveTacValidity() {
    if (!this.selectedModel || !this.tacValidityRemark.trim()) {
      alert('Please enter a remark for TAC validity approval.');
      return;
    }
    
    const approvalData: ModelTacValidityApprovalRequest = {
      param1: this.selectedModel.param2 || '',    //devmodelid
      param2: 'Approve',
      param3: this.tacValidityRemark.trim(),
      param4: this.selectedModel.param14 || '',    //   vendorid
      param5: 'APPROVE'
    };
    
    this.loading = true;
    this.modelService.approveTacValidity(approvalData).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status) {
          const message = typeof response.entity === 'string' ? response.entity : 'TAC validity approved successfully';
          alert(message);
          this.closeTacValidityModal();
          this.loadModels();
        } else {
          this.errorMessage = typeof response.entity === 'string' ? response.entity : 'Failed to approve TAC validity';
          alert(this.errorMessage);
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.entity || 'Error approving TAC validity';
        alert('Error: ' + this.errorMessage);
        console.error('Error approving TAC validity:', error);
      }
    });
  }
exportToExcel() {

  this.isExporting = true;

  const payload = {
    param1: this.searchText || '',
    param2: 1, // always full data
    param3: this.totalCount || 1000, // all records
    pdfexcel: 'excel'
  };

  this.modelService.getModelExcel(payload)
    .subscribe({
      next: (response: any) => {

        this.isExporting = false;

        if (response?.status && response?.entity) {

          const fileUrl = response.entity;

          // ✅ Direct download
          const link = document.createElement('a');
          link.href = fileUrl;
          link.setAttribute('download', 'Model_List.xls');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

        } else {
          alert('Failed to generate Excel');
        }
      },
      error: () => {
        this.isExporting = false;
        alert('Error exporting Excel');
      }
    });
}

onDownloadChange() {

  if (this.selectedDownloadType === 'Excel') {
    this.exportToExcel();
  }

  // reset dropdown after action
  setTimeout(() => {
    this.selectedDownloadType = '';
  }, 500);
}
  pageSizeOptions = [20, 50, 100];
   pageCount = 0;
}
