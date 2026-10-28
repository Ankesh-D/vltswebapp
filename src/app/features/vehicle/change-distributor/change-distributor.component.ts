import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DeviceService } from '../../../core/services/device.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { NgSelectModule } from '@ng-select/ng-select';

declare var $: any;

@Component({
    selector: 'app-change-distributor',
    imports: [CommonModule, FormsModule, RouterModule, NgSelectModule],
    templateUrl: './change-distributor.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './change-distributor.component.scss'
})
export class ChangeDistributorComponent implements OnInit, AfterViewInit {
  deviceDetails: any[] = [];
  loading = false;

  searchText: string = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [20, 50, 100, 200, 500];
  totalCount = 0;
  pageCount = 0;

  sortKey: string = '';
  reverse: boolean = false;

  // Change Dealer Modal
  editSerialNo: string = '';
  editDeviceId: string = '';
  editVendorId: string = '';
  editOldDistributorId: string = '';
  editNewDistributorId: string = '';
  editRemark: string = '';
  isRemarkInvalid: boolean = false;
  dealerList: any[] = [];
  roleId: string = '';
  showChangeModal: boolean = false;
  selectedDealerPlain: any = null;

  vendorList: any[] = [];
  selectedVendor: any = null;
  distributorList: any[] = [];
  selectedDistributor: any;;
  submittedFlag: boolean = false;
  vendorId: string = '';
  dealerId: string = '';
  distributorId: string = '';
  constructor(
    private deviceService: DeviceService,
    private dashboardService: DashboardService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef
  ) {this.roleId = sessionStorage.getItem('roleid') || '';}

  ngOnInit() {
    
    this.getChangeDealerData(1);
    if(this.roleId == '10') {
      this.getVendorList();
    }
    if(this.roleId == '11') {
      this.getDistributorList();
    }
  }

  ngAfterViewInit() {
    // No jQuery/select2 needed; using plain select / Angular bindings
  }
  getVendorList() {
    this.loading = true;
    this.dashboardService.getVendorList().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.vendorList = response.entity;
          if(this.vendorId) {
            this.vendorList.forEach(element => {
              if(element.param1.toUpperCase() == this.vendorId.toUpperCase()) {
                this.selectedVendor = element;
                // this.onChangeVendor();
              }
            });
          }
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading vendor list:', error);
      }
    });
  }

  getDistributorList() {
    this.loading = true;
    console.log('Selected Vendor ID:', this.selectedVendor);
    const encryptedVendorId = this.encryptionService.encryptAccountId(this.selectedVendor);
    this.deviceService.getDistributorList({vendorid: this.vendorId}).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.distributorList = response.entity;
          if(this.selectedDistributor) {
            this.distributorList.forEach(element => {
              if(element.param2.toLowerCase() == this.distributorId.toLowerCase()) {
                this.selectedDistributor = element;
                this.onChangeDistributor();
              }
            });
          }
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading distributor list:', error);
        // jAlert('Error loading distributor list.');
      }
    });
  }
  onChangeVendor() {
    this.selectedDistributor = null;
    this.distributorList = [];
    if (this.selectedVendor) {
      this.getDistributorList();
    }
  }
  onChangeDistributor() {
    this.selectedDealerPlain = null;
    this.dealerList = [];
    if (this.selectedDistributor) {
      this.getDealerList();
    }
  }
  getDealerList() {
    this.loading = true;
    const encryptedVendorId = this.encryptionService.encryptAccountId(this.vendorId);
    this.dashboardService.getDealerListByVendor(this.vendorId, this.distributorId).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.dealerList = response.entity;
          if(this.selectedDealerPlain) {
            this.dealerList.forEach(element => {
              if(element.param2.toLowerCase() === this.dealerId.toLowerCase()) {
                this.selectedDealerPlain = element;
                // this.onNewDealerChange(this.selectedDealerPlain);
              }
            });
          }
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading dealer list:', error);
        // jAlert('Error loading dealer list.');
      }
    });
  }
  

  getChangeDealerData(pageNumber: number) {
    this.loading = true;
    this.currentPage = pageNumber;

    const request = {
      param1: this.searchText,
      param2: String(this.currentPage),
      param3: String(this.pageSize),
      param8: 'changedevicetodealer',
      param9: '',  // vendorid filter can be added here if needed
      param10: '', // distributorid filter can be added here if needed
      param11: '', // dealerid filter can be added here if needed
      pdfexcel: ''
    };

    this.deviceService.getDeviceDetailsForChange(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.deviceDetails = response.entity.listData || [];
          this.totalCount = response.entity.param1 || 0;
          this.pageCount = this.deviceDetails.length;
        } else {
          this.deviceDetails = [];
          this.totalCount = 0;
          this.pageCount = 0;
          // jAlert('No Data Found: ' + response.entity);
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.deviceDetails = [];
        this.totalCount = 0;
        this.pageCount = 0;
        console.error('Error fetching device details:', error);
        // jAlert('Error fetching device details.');
        this.cdr.detectChanges();
      }
    });
  }

  getSearchDetails() {
    this.getChangeDealerData(1);
  }

  reloadData() {
    this.searchText = '';
    this.getChangeDealerData(1);
  }

  sort(key: string) {
    this.sortKey = key;
    this.reverse = !this.reverse;
    this.deviceDetails.sort((a, b) => {
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
    if (page < 1) return;
    const totalPages = this.getTotalPages();
    if (this.totalCount > 0 && page > totalPages) return;
    this.currentPage = page;
    this.getChangeDealerData(this.currentPage);
  }

  onPageSizeChange(event: Event) {
    const newSize = (event.target as HTMLSelectElement).value;
    this.pageSize = newSize === 'All' ? this.totalCount : Number(newSize);
    this.currentPage = 1;
    this.getChangeDealerData(this.currentPage);
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

  getPaginatedData(): any[] {
    return this.deviceDetails;
  }

  // Change Dealer
  getDeviceDataForChange(device: any) {   
    this.editDeviceId = device.param2
    $('#editModal').modal('show');
    this.editOldDistributorId = device.param39; // oldDistributorId
    this.vendorId = device.param3; // vendorId
    this.getVendorList(); // Load distributors for the selected vendor
    this.distributorId = device.param39; // dustributorId for pre-selection
    this.getDistributorList(); // Load dealers for the selected distributor
    this.dealerId = device.param35; // deviceId (dealerId for pre-selection)
    this.getDealerList(); // Ensure dealer list is loaded for pre-selection


    // this.editSerialNo = device.param6 || '';
    // this.editDeviceId = device.param2; // deviceId
    // this.editVendorId = device.param3; // vendorId
    // this.editOldDealerId =device.param35; // oldDealerId
    // this.editNewDealerId = '';
    // this.editRemark = '';
    // this.isRemarkInvalid = false;
    // this.dealerList = [];
    // this.selectedDealerPlain = '';

    // this.loading = true;
    // const encryptedVendorId = this.encryptionService.encryptAccountId(device.param3);
    // const queryParams = `companyid=${encodeURIComponent(encryptedVendorId)}`;
    // this.dashboardService.getDealerRoster(encryptedVendorId).subscribe({
    //   next: (response) => {
    //     this.loading = false;
    //     if (response.status && response.entity) {
    //       this.dealerList = response.entity;
    //     }
    //     this.cdr.detectChanges();
    //     // Open Angular modal
    //     this.showChangeModal = true;
    //   },
    //   error: (error) => {
    //     this.loading = false;
    //     console.error('Error loading dealer list:', error);
    //     // jAlert('Error loading dealer list.');
    //   }
    // });
  }

  checkRemark() {
    this.isRemarkInvalid = this.editRemark.length < 10;
  }

  changeDistributor() {
    if(this.editForm.valid) {

      this.loading = true;
      const request = {
        param1: this.editDeviceId,
        param2: this.selectedDistributor ? this.selectedDistributor.param1 : '',
        param3: this.selectedDistributor ? this.selectedDistributor.param1 : '', // newDistributorId
        param4: this.selectedDealerPlain ? this.selectedDealerPlain.apram1 : '',
        param5: this.editRemark
      };
  
      this.deviceService.changeDeviceToDistributor(request).subscribe({
        next: (response) => {
          this.loading = false;
          // jAlert(response.entity);
          if (response.status && response.entity === 'Successfully Saved.') {
            this.showChangeModal = false;
            this.getChangeDealerData(this.currentPage);
          }
        },
        error: (error) => {
          this.loading = false;
          console.error('Error changing dealer:', error);
          // jAlert('Error changing dealer.');
        }
      });
    }
  }

  back() {
    this.editRemark = '';
    this.isRemarkInvalid = false;
    this.showChangeModal = false;
  }

  onNewDistributorChange(distributorId: string) {
    // this.selectedDistributorPlain = distributorId;
    this.editNewDistributorId = distributorId ? this.encryptionService.encryptAccountId(distributorId) : '';
  }


  @ViewChild('editForm') editForm!: NgForm;
  closeEditModal() {
    this.editForm?.resetForm();
    $('#editModal').modal('hide');
  }
}