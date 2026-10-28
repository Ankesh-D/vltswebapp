import { Component, OnInit, ChangeDetectorRef, Input, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { DealerService, Dealer, DealerRequest } from '../../../core/services/dealer.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { ToastComponent } from '../../assets/inactive-assets/toast.component';
import { DeviceService } from '../../../core/services/device.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ToastService } from '../../../core/services/toast.service';
import { VendorService } from '../../../core/services/vendor.service';
import { BusinessRuleMasterDetailsReq } from '../../../core/model/request.model';
import { BusinessRuleMasterDetailsResp } from '../../../core/model/response.model';
import { CommonDataToolbarComponent } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';
declare var $: any;
@Component({
    selector: 'app-business-rule-master',
    imports: [CommonModule, FormsModule, RouterModule, NgSelectModule, CommonDataToolbarComponent, CommonTableComponent],
    templateUrl: './business-rule-master.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './business-rule-master.component.scss'
})
export class BusinessRuleMasterComponent implements OnInit {
  detailsData: BusinessRuleMasterDetailsResp[] = [];
  readonly tableColumns: CommonTableColumn<BusinessRuleMasterDetailsResp>[] = [
    { key: 'param1', label: '#', value: data => data.param1 || 'NA' },
    { key: 'param18', label: 'Business Rule Name', sortable: true, value: data => data.param3 || 'NA' },
    { key: 'param8', label: 'Rule Description', value: data => data.param8 || 'NA' },
    { key: 'param4', label: 'Created Date', value: data => data.param4 || 'NA' },
    { key: 'actions', label: 'Action', width: '100px' }
  ];
  loading = false;
 searchText = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [20];
  totalCount = 0;
  pageCount = 0;
  errmsg = '';
  // Route parameters
  type: string = '';  // 'dashboard' or other
  counttype: string = '';  // 'Total', 'Active', etc.
  
  // Sorting
  sortKey: string = '';
  reverse: boolean = false;
  
  // State and City lists
  statelist: any[] = [];
  citylist: any[] = [];
  selectedStateId: string = '';
  vendorlist: any[] = [];
   // = $scope.state
selectedCityId: any = null;    // = $scope.city

  // Modal data
  selectedDealer: Dealer | null = null;
  dealerName: string = '';
  contactPerson: string = '';
  mobileNo: string = '';
  alternateMobileNo: string = '';
  emailId: string = '';
  address: string = '';
  stateName: string = '';
  cityName: string = '';
  businessRuleId: string = '';
  dealerId: string = '';
  status: string = '';
  activeSuspend: string = 'Block';
  blockUnblock: string = 'block';
  remarkForBlock: string = '';
  remarkForDelete: string = '';
  updateRemark: string = '';
  
  // Modal visibility
  showEditModal = false;
  showDeleteModal = false;
  showBlockModal = false;

  errorMessage: string | null = null;
  successMessage: string | null = null;

  distributorList: any[] = [];
  distributorId: any = null;
  distributorObj: any = null;
  roleId: any = '';
  vendorObj: any = null;
  stateObj: any = null;
  cityObj: any = null;
  @Input() isVisible: boolean = true;

  modalTitle: string = 'Add New Business Rule'; // Default title for the modal
  businessRuleName: string = '';
  ruleDescription: string = '';
  ruleRemarks: string = '';
  
  constructor(
    private dashboardService: DashboardService,
    private vendorService: VendorService,
    private route: ActivatedRoute,
    private router: Router,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef,
    private deviceService: DeviceService,
    private toastService: ToastService
  ) {
    this.toastService.pageName = 'Business Rule Master'; // Set page name for toast service
    this.roleId = sessionStorage.getItem('roleid') || '';
  }

 ngOnInit() {
  this.route.params.subscribe(params => {
    this.type = params['type'] || '';
    this.counttype = params['counttype'] || '';

    // 🔒 DO NOT reset page here
    if (this.currentPage === 1) {
      this.loadDetails();
    }
  });

 }
 @ViewChild('masterForm') masterForm: any;
 openAddNewModal() {
  $('#masterModal').modal('show');
  this.masterForm.resetForm(); // Reset the form to clear previous values and validation states
  this.modalTitle = 'Add New Business Rule';
  this.opType = 'add';
 }

  loadDetails() {
    this.loading = true;
    this.errorMessage = '';
    // Clear dealers array to show loading state
    this.detailsData = [];
    const request: BusinessRuleMasterDetailsReq = {
      param1: this.searchText.trim(),
      param2: this.currentPage.toString(),
      param3: this.pageSize.toString(),
      pdfexcel: ''
    };
        
    this.vendorService.getBusinessRuleMasterDetails(request).subscribe({
      next: (response) => {
        this.loading = false;
        
        if (response?.status && response?.entity) {
          // Check if entity is an empty object (no data case)
          if (Object.keys(response.entity).length === 0) {
            // Empty entity means no data for this page
            // This can happen if:
            // 1. The page number is beyond available data
            // 2. Backend returned empty response
            this.detailsData = [];
            
            // If we're on page 1 and get empty response, there's truly no data
            if (this.currentPage === 1) {
              this.totalCount = 0;
              this.pageCount = 0;
            } else {
              // If we're on page > 1 and get empty response
              // Check if this page should have data based on totalCount
              const expectedTotalPages = Math.ceil(this.totalCount / this.pageSize);
              if (this.currentPage > expectedTotalPages && this.totalCount > 0) {
                // Page number is beyond available data, navigate back to last valid page
                this.currentPage = expectedTotalPages > 0 ? expectedTotalPages : 1;
                this.loadDetails();
                return;
              } else {
                // Page should have data but API returned empty - likely a backend pagination issue
                // This is a known backend bug where page 2+ returns {} instead of {listData: [], param1: totalCount}
                this.errorMessage = `⚠️ Backend pagination issue: Page ${this.currentPage} returned no data (expected ${expectedTotalPages} pages with ${this.totalCount} total records). This is a known backend bug. Workaround: Use "Show Rows: All" to view all records on one page.`;
                // Keep dealers empty to show "NO DATA FOUND"
                this.detailsData = [];
                // Auto-navigate back to page 1 after 3 seconds to help user recover
                setTimeout(() => {
                  if (this.currentPage > 1 && this.detailsData.length === 0) {
                    this.currentPage = 1;
                    this.errorMessage = '';
                    this.loadDetails();
                  }
                }, 3000);
              }
            }
          } else if (response.entity.listData !== undefined) {
            // Check if entity has listData property (ListDataResponse structure)
            this.detailsData = response.entity.listData || [];
            // Always update totalCount if it's provided in the response (even if 0)
            // This ensures we have the correct total count for pagination
            if (response.entity.param1 !== undefined && response.entity.param1 !== null) {
              const newTotalCount = Number(response.entity.param1) || 0;
              
              this.totalCount = newTotalCount;
            }
          } else if (Array.isArray(response.entity)) {
            // Fallback: if entity is directly an array
            this.detailsData = response.entity;
            this.totalCount = response.entity.length;
            
          } else {
            // Entity exists but doesn't match expected structure
            const entityKeys = Object.keys(response.entity);
            this.detailsData = [];
            // Don't reset totalCount if we already have one
            if (this.totalCount === 0) {
              this.totalCount = 0;
            }
          }
          
          // Calculate page count
          if (this.detailsData.length < this.pageSize) {
            this.pageCount = this.detailsData.length;
          } else {
            this.pageCount = this.pageSize;
          }
          
          // Update page size options
          this.updatePageSizeOptions();
          
          // Force change detection
          this.cdr.detectChanges();
        } else {
          const errorMsg = typeof response?.entity === 'string' 
            ? response.entity 
            : (response?.entity?.toString() || 'Failed to load dealers');
          this.errorMessage = errorMsg;
          this.detailsData = [];
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = 'Error loading dealers. Please try again.';
        this.detailsData = [];
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
    if (this.totalCount > 1000) options.push(1000);
    if (this.totalCount > 0) options.push(this.totalCount);
    this.pageSizeOptions = options;
  }

  onPageSizeChange(size: number | string) {
    const oldPageSize = this.pageSize;
    if (size === 'All' || size === this.totalCount) {
      this.pageSize = this.totalCount;
    } else {
      this.pageSize = Number(size);
    }
    // Reset to page 1 when page size changes
    this.currentPage = 1;
    this.loadDetails();
  }
onPageChange(page: number) {
  if (page === this.currentPage) return;

  this.currentPage = page;
  this.loadDetails();
}

  reloadData() {
    this.searchText = '';
    this.currentPage = 1;
    this.loadDetails();
  }

  getSearchDetails() {
    this.currentPage = 1;
    this.loadDetails();
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


  opType: string = 'edit'; // default to edit
  openEditModal(data: BusinessRuleMasterDetailsResp, type: 'edit' | 'delete') {
    this.opType = type;
    this.ruleRemarks = '';
    if (type === 'edit') {
      this.businessRuleId = data.param2?.toString() || '';  
      this.modalTitle = 'Edit Business Rule';
      this.businessRuleName = data.param3 || '';
      this.ruleDescription = data.param8 || '';
      $('#masterModal').modal('show');
    } else if (type === 'delete') {
      this.businessRuleId = data.param2?.toString() || '';
      this.modalTitle = 'Delete Business Rule';
      $("#deleteModal").modal('show');
    }
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedDealer = null;
  }

 openDeleteModal(data: BusinessRuleMasterDetailsResp) {
  //console.log('DELETE CLICKED ✅', dealer);


  this.businessRuleId = data.param2?.toString() || '';

  this.remarkForDelete = '';
  this.showDeleteModal = true;
}


  closeDeleteModal() {
    this.showDeleteModal = false;
    this.remarkForDelete = '';
  }


onSubmit() {
  console.log('Form submitted with opType:', this.opType, this.businessRuleName, this.ruleDescription, this.ruleRemarks, this.remarkForDelete);
  if(this.opType === 'add') {
    if(this.masterForm.invalid) {
      this.toastService.show('Please fill all required fields correctly.', 'error');
      return;
    }
    let payload: any = {
      param1: '',
      param2: this.businessRuleName,
      param3: this.ruleDescription,
      param4: ''
    };
    this.vendorService.addBusinessRuleMaster(payload).subscribe({
      next: (response) => {
        if (response?.status) {
          this.toastService.show('Business Rule saved successfully', 'success');
          $('#masterModal').modal('hide');
          this.loadDetails();
        } else {
          const errorMsg = typeof response?.entity === 'string' 
            ? response.entity
            : 'Failed to save business rule';
          this.toastService.show(errorMsg, 'error');
        }
      },
      error: (error) => {
        this.toastService.show('An error occurred', 'error');
      }
    });
  } else if(this.opType === 'edit') {
    this.updateBusinessRule();
  } 
  else if(this.opType === 'delete') {
    this.deleteBusinessRule();
  }
}

updateBusinessRule() {
  let payload: any = {
    param1: this.businessRuleId || '',
    param2: this.businessRuleName,
    param3: this.ruleDescription,
    param4: this.ruleRemarks
  };
  this.vendorService.updateBusinessRuleMaster(payload).subscribe({
    next: (response) => {
      if (response?.status) {
        this.toastService.show('Business Rule updated successfully', 'success');
        $('#masterModal').modal('hide');
        this.loadDetails();
      } else {
        const errorMsg = typeof response?.entity === 'string' 
          ? response.entity
          : 'Failed to update business rule';
        this.toastService.show(errorMsg, 'error');
      }
    },
    error: (error) => {
      this.toastService.show('An error occurred', 'error');
    }
  });
}
deleteBusinessRule() {
  let payload: any = {
    param1: this.businessRuleId || '',
    param3: this.remarkForDelete
  };
  this.vendorService.deleteBusinessRuleMaster(this.businessRuleId, this.remarkForDelete).subscribe({
    next: (response) => {
      if (response?.status) {
        this.toastService.show('Business Rule deleted successfully', 'success');
        $('#deleteModal').modal('hide');
        this.loadDetails();
      } else {
        const errorMsg = typeof response?.entity === 'string' 
          ? response.entity
          : 'Failed to delete business rule';
        this.toastService.show(errorMsg, 'error');
      }
    },
    error: (error) => {
      this.toastService.show('An error occurred', 'error');
    }
  });
}






  goHome() {
    this.router.navigate(['/dashboard']);
  }

  getPaginatedDealers(): BusinessRuleMasterDetailsResp[] {
    // API already returns paginated data, so just sort if needed
    // Note: In a production app, sorting should be done server-side
    // For now, we do client-side sorting on the current page
    let sorted = [...this.detailsData];
    if (this.sortKey) {
      sorted.sort((a: any, b: any) => {
        const aVal = String(a[this.sortKey] || '').toLowerCase();
        const bVal = String(b[this.sortKey] || '').toLowerCase();
        if (this.reverse) {
          return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
        } else {
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        }
      });
    }
    return sorted;
  }

  getTotalPages(): number {
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

  shouldShowPage(page: number): boolean {
    return page !== -1;

  }


selectedDownloadType: string = '';
isExporting: boolean = false;
 selectedVendorFilter ='';
onDownloadChange() {

  if (this.selectedDownloadType === 'Excel') {
    this.exportToExcel();
  }

  // reset dropdown
  setTimeout(() => {
    this.selectedDownloadType = '';
  }, 500);
}
exportToExcel() {

  this.isExporting = true;

  let  payload: BusinessRuleMasterDetailsReq = {
      param1: this.searchText.trim(),
      param2: '',
      param3: '',
      pdfexcel: 'excel'
    };

   this.vendorService.getBusinessRuleMasterDetails(payload).subscribe({
      next: (response: any) => {

        this.isExporting = false;

        if (response.statuscode == 200) {
          this.toastService.commonFileDownload(response.entity);

        } else {
          this.toastService.show(response.entity, 'error')
        }
      },
      error: () => {
        this.isExporting = false;
        this.toastService.show('Error exporting Excel', 'error');
      }
    });
}
}
