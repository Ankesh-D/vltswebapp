import { Component, OnInit, ChangeDetectorRef, Input, ChangeDetectionStrategy } from '@angular/core';
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
import { CommonDataToolbarComponent } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { CommonPaginationComponent } from '../../../shared/components/common-pagination/common-pagination.component';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';
@Component({
    selector: 'app-dealer-list',
    imports: [CommonModule, FormsModule, RouterModule, NgSelectModule, ToastComponent,
      CommonDataToolbarComponent, CommonPaginationComponent, CommonTableComponent],
    templateUrl: './dealer-list.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./dealer-list.component.scss']
})
export class DealerListComponent implements OnInit {
  dealers: Dealer[] = [];
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
  readonly tableColumns: CommonTableColumn[] = [
    { key: 'param1', label: '#', width: '3%' },
    { key: 'param18', label: 'Vendor Name', sortable: true, width: '7%' },
    { key: 'param3', label: 'Dealer Name', sortable: true, width: '9%' },
    { key: 'param9', label: 'Contact Person', sortable: true, width: '7%' },
    { key: 'param11', label: 'Mobile No.', sortable: true, width: '6%' },
    { key: 'param12', label: 'Alternate No.', sortable: true, width: '6%' },
    { key: 'param10', label: 'Email ID', sortable: true, width: '9%' },
    { key: 'param5', label: 'Address', sortable: true, width: '12%' },
    { key: 'param7', label: 'City', sortable: true, width: '6%' },
    { key: 'param8', label: 'State', sortable: true, width: '6%' },
    { key: 'param29', label: 'Total Devices', sortable: true, width: '5%' },
    { key: 'param30', label: 'Installed', sortable: true, width: '5%' },
    { key: 'param31', label: 'Activated', sortable: true, width: '5%' },
    { key: 'param32', label: 'Pending', sortable: true, width: '5%' },
    { key: 'param28', label: 'Status / Activity', width: '9%' }
  ];
  
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
  vendorId: string = '';
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
  
  constructor(
    private dashboardService: DashboardService,
    private dealerService: DealerService,
    private route: ActivatedRoute,
    private router: Router,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef,
    private deviceService: DeviceService,
    private toastService: ToastService
  ) {
    this.toastService.pageName = 'Dealer Master Details'; // Set page name for toast service
    this.roleId = sessionStorage.getItem('roleid') || '';
  }

 ngOnInit() {
  this.route.params.subscribe(params => {
    this.type = params['type'] || '';
    this.counttype = params['counttype'] || '';

    // 🔒 DO NOT reset page here
    if (this.currentPage === 1) {
      this.loadDealers();
    }
  });

  this.loadStateList();
  if(this.roleId == '10') {
  this.loadVendorList();
  }
  if(this.roleId != '12' && this.roleId != '10') {
    this.loadDistributorList();
  }
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

  loadDealers() {
    this.loading = true;
    this.errorMessage = '';
    // Clear dealers array to show loading state
    
    const request: DealerRequest = {
      param1: this.searchText.trim(),
      param2: this.currentPage.toString(),
      param3: this.pageSize.toString(),
      param4: this.counttype || ''
    };
        
    this.dealerService.getDealerDetails(request).subscribe({
      next: (response) => {
        this.loading = false;
        
        if (response?.status && response?.entity) {
          // Check if entity is an empty object (no data case)
          if (Object.keys(response.entity).length === 0) {
            // Empty entity means no data for this page
            // This can happen if:
            // 1. The page number is beyond available data
            // 2. Backend returned empty response
            this.dealers = [];
            
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
                this.loadDealers();
                return;
              } else {
                // Page should have data but API returned empty - likely a backend pagination issue
                // This is a known backend bug where page 2+ returns {} instead of {listData: [], param1: totalCount}
                this.errorMessage = `⚠️ Backend pagination issue: Page ${this.currentPage} returned no data (expected ${expectedTotalPages} pages with ${this.totalCount} total records). This is a known backend bug. Workaround: Use "Show Rows: All" to view all records on one page.`;
                // Keep dealers empty to show "NO DATA FOUND"
                this.dealers = [];
                // Auto-navigate back to page 1 after 3 seconds to help user recover
                setTimeout(() => {
                  if (this.currentPage > 1 && this.dealers.length === 0) {
                    this.currentPage = 1;
                    this.errorMessage = '';
                    this.loadDealers();
                  }
                }, 3000);
              }
            }
          } else if (response.entity.listData !== undefined) {
            // Check if entity has listData property (ListDataResponse structure)
            this.dealers = response.entity.listData || [];
            // Always update totalCount if it's provided in the response (even if 0)
            // This ensures we have the correct total count for pagination
            if (response.entity.param1 !== undefined && response.entity.param1 !== null) {
              const newTotalCount = Number(response.entity.param1) || 0;
              
              this.totalCount = newTotalCount;
            }
          } else if (Array.isArray(response.entity)) {
            // Fallback: if entity is directly an array
            this.dealers = response.entity;
            this.totalCount = response.entity.length;
            
          } else {
            // Entity exists but doesn't match expected structure
            const entityKeys = Object.keys(response.entity);
            this.dealers = [];
            // Don't reset totalCount if we already have one
            if (this.totalCount === 0) {
              this.totalCount = 0;
            }
          }
          
          // Calculate page count
          if (this.dealers.length < this.pageSize) {
            this.pageCount = this.dealers.length;
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
          this.dealers = [];
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = 'Error loading dealers. Please try again.';
        this.dealers = [];
        this.cdr.detectChanges();
      }
    });
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
    this.loadDealers();
  }
onPageChange(page: number) {
  // if (page === this.currentPage) return;

  this.currentPage = page;
  this.loadDealers();
}

  reloadData() {
    this.searchText = '';
    this.currentPage = 1;
    this.pageSize = 20;
    this.loadDealers();
  }

  getSearchDetails() {
    this.currentPage = 1;
    this.loadDealers();
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

  loadStateList() {
    this.dealerService.getStateList().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.statelist = response.entity;
          if(this.showEditModal) {
            // after state list loaded, stateName will auto match
            this.statelist.forEach(state => {
              if(state.param1.toLowerCase() === this.selectedStateId.toLowerCase()) {
                this.stateObj = state;
              }
            }); 
          }
        }
      },
      error: (error) => {
        this.errorMessage = error;
      }
    });
  }

  loadVendorList() {
    this.dealerService.getVendorList().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.vendorlist = response.entity;
          if(this.showEditModal) {
            // after vendor list loaded, vendorName will auto match
            this.vendorlist.forEach(vendor => {
              if(vendor.param1.toLowerCase() === this.vendorId.toLowerCase()) {
                this.vendorObj = vendor;
              }
            }); 
          }
        }
      },
      error: (error) => {
        console.error('Error loading vendor list:', error);
      }
    });
  }
  onVendorChange() {
    this.distributorObj = null;
    this.distributorId = null;
    this.distributorList = [];
    this.vendorId = this.vendorObj ? this.vendorObj.param1 : '';
    this.loadDistributorList();  
  }
  loadDistributorList() {
    let request = { vendorid: this.vendorId || '' };
    this.deviceService.getDistributorList(request).subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.distributorList = response.entity;

          if(this.showEditModal) {
            // after distributor list loaded, distributorName will auto match
            this.distributorList.forEach(distributor => {
              if(distributor.param1.toLowerCase() === this.distributorId.toLowerCase()) {
                this.distributorObj = distributor;
              }
            }); 
          }
        }
      },
      error: (error) => {
        this.errorMessage = 'Failed to load distributor list';
      }
    });
  }

//  onStateChange() {
//   const stateObj = this.statelist.find(s => s.param2 === this.stateName);

//   if (stateObj) {
//     this.selectedStateId = stateObj.param1;   // stateId
//     this.cityName = '';                      // reset city
//     this.loadCityList(this.selectedStateId); // load city list
//   } else {
//     this.selectedStateId = '';
//     this.citylist = [];
//     this.cityName = '';
//   }
// }


  loadCityList(stateId: string) {
    this.citylist = [];
    this.dealerService.getCityList(stateId).subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.citylist = response.entity;
            if(this.showEditModal) {
              // after city list loaded, cityName will auto match
            this.citylist.forEach(city => {
              if(city.param1.toLowerCase() === this.selectedCityId.toLowerCase()) {
                this.cityObj = city;
              }
            }); 
          }
        }
      },
      error: (error) => {
        console.error('Error loading city list:', error);
      }
    });
  }

  getManagedata(dealer: Dealer) {
    this.selectedDealer = dealer;
    this.dealerName = dealer.param3 || '';
    this.contactPerson = dealer.param9 || '';
    this.mobileNo = dealer.param11 || '';
    this.alternateMobileNo = dealer.param12 == '0' ? '' : dealer.param12 || '';
    this.emailId = dealer.param10 || '';
    this.address = dealer.param5 || '';
    this.stateName = dealer.param8 || '';
    this.cityName = dealer.param7 || '';
    const vendorName = dealer.param18 || ''; // param18 is vendor name, not ID
    this.dealerId = dealer.param33 || dealer.param2?.toString() || '';
    this.status = dealer.param28 || '';
    this.vendorId = ''; // reset vendorId before matching
    this.distributorId = dealer.param35; // reset distributorId before matching
    
    // Set active/suspend button text
    if (this.status === 'Active') {
      this.activeSuspend = 'Block';
      this.blockUnblock = 'block';
    } else {
      this.activeSuspend = 'Active';
      this.blockUnblock = 'unblock';
    }
    
    // Load city list if state is selected
if (this.stateName) {
  const state = this.statelist.find(s => s.param2 === this.stateName);

  if (state) {
    this.selectedStateId = state.param1 || '';

    this.loadCityList(this.selectedStateId);

    // after city list loaded, cityName will auto match
    setTimeout(() => {
      this.cityName = dealer.param7 || '';
    }, 300);
  }
}

    
    // Set vendor ID by finding vendor by name
    // Vendor roster returns: param1 = vendorId, param2 = vendorName
    if (vendorName && this.vendorlist.length > 0) {
      const vendor = this.vendorlist.find(v => v.param2 === vendorName);
      if (vendor) {
        this.vendorId = vendor.param1 || '';
      } else {
        this.vendorId = '';
      }
    } else {
      this.vendorId = '';
    }
  }

  openEditModal(dealer: Dealer) {
    this.updateRemark = '';
  this.getManagedata(dealer);
  this.showEditModal = true;
  // 15vendorid, 34distributorid, 25stateid and 24cityid
    this.vendorId = dealer.param16 || '';
    this.distributorId = dealer.param35 || '';
    const stateId = dealer.param25 || '';
    const cityId = dealer.param24 || '';
    // Ensure vendor list is loaded before opening modal
    if (this.roleId == '10') {
        this.loadVendorList();
    }
    if(this.roleId != '12') {
        this.loadDistributorList();
    }
    this.selectedStateId = stateId;
    this.loadStateList();
    this.selectedCityId = cityId;
    this.loadCityList(stateId);

    // if (this.vendorlist.length === 0) {
    //   this.dealerService.getVendorList().subscribe({
    //     next: (response) => {
    //       if (response.status && response.entity) {
    //         this.vendorlist = response.entity;
    //         this.getManagedata(dealer);
    //         this.showEditModal = true;
    //         this.updateRemark = '';
    //       }
    //     },
    //     error: (error) => {
    //       console.error('Error loading vendor list:', error);
    //       // Still open modal even if vendor list fails to load
    //       this.getManagedata(dealer);
    //       this.showEditModal = true;
    //       this.updateRemark = '';
    //     }
    //   });
    // } else {
    //   this.getManagedata(dealer);
    //   this.showEditModal = true;
    //   this.updateRemark = '';
    // }
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedDealer = null;
  }

 openDeleteModal(dealer: Dealer) {
  //console.log('DELETE CLICKED ✅', dealer);

  this.selectedDealer = dealer;
  this.dealerName = dealer.param3 || '';

  // ✅ DealerId ALWAYS from param2
  this.dealerId = dealer.param2?.toString() || '';

  this.remarkForDelete = '';
  this.showDeleteModal = true;
}


  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedDealer = null;
    this.remarkForDelete = '';
  }

  openBlockModal(dealer: Dealer) {
    this.getManagedata(dealer);
    this.remarkForBlock = '';
    this.showBlockModal = true;
  }

  closeBlockModal() {
    this.showBlockModal = false;
    this.remarkForBlock = '';
  }
  onStateChange() {
    this.cityName = '';
    this.selectedCityId = null;
    this.citylist = [];
    //console.log('Selected State ID:', this.selectedStateId);
    if (this.selectedStateId) {
      const state = this.statelist.find(s => s.param1 == this.selectedStateId);
      if (state) {
        this.stateName = state.param2;
      }
      this.loadCityList(this.selectedStateId);
    }
  }
  onCityChange() {
    if (this.selectedCityId) {
      const city = this.citylist.find(c => c.param1 === this.selectedCityId);
      if (city) {
        this.cityName = city.param2;
      }
    }
  }

editDealerData() {
  // reset messages (AngularJS: $("#mobilenomsg").hide() etc.)
  this.errmsg = '';

  const dealerName = this.dealerName?.trim();
  const contactPerson = this.contactPerson?.trim();
  const mobileNo = this.mobileNo?.trim();
  const alternateMobileNo = this.alternateMobileNo?.trim();
  const emailId = this.emailId?.trim();
  const address = this.address?.trim();
  const remark = this.updateRemark?.trim();
  const stateName = this.stateObj ? this.stateObj.param2 : '';
  const cityName = this.cityObj ? this.cityObj.param2 : '';
  
  

  if(this.roleId == '10') {
    if (!this.vendorId) {
      this.toastService.show('Vendor is required', 'error');
      return;
    }
  }
  
  if(this.roleId != '12') {
    if (!this.distributorId) {
       this.toastService.show('Distributor is required', 'error');
      // alert('Distributor ID required');
      return;
    }
  }
  // ---- VALIDATIONS (SAME ORDER AS ANGULARJS) ----

  if (!dealerName) {
     this.toastService.show('Dealer name required', 'error');
    // alert('Dealer name required');
    return;
  }

  if (!contactPerson) {
    this.toastService.show('Contact person required', 'error');
    return;
  }

  if (!mobileNo) {
    this.toastService.show('Mobile number required', 'error');
    return;
  }

  if (mobileNo.length < 10) {
    this.toastService.show('Please enter valid 10-digit Mobile No', 'error');
    return;
  }
  if(!stateName) {
    this.toastService.show('State name required', 'error');
    return;
  }

  if(!cityName) {
    this.toastService.show('City name required', 'error');
    return;
  }

  // Address regex SAME AS ANGULARJS
  const addressRegex = /^(?=.*[A-Za-z]){1}(?!.*[^A-Za-z0-9\-#,./\/ ])/;
  if (!address || !addressRegex.test(address)) {
    this.toastService.show('Address should not start with special character : For Ex - Adarsh Colony Plot no.4', 'error');
    return;
  }

  if (!this.selectedStateId) {
    this.toastService.show('Please select State', 'error');
    return;
  }

  if (!this.selectedCityId) {
    this.toastService.show('Please select City', 'error');
    return;
  }

  if (!emailId) {
    this.toastService.show('Email ID required', 'error');
    return;
  }

  const emailRegex = /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/;
  if (!emailRegex.test(emailId)) {
    this.toastService.show('Email Id format should be : example@gmail.com', 'error');
    return;
  }

  if (!remark || remark.length < 10) {
    this.toastService.show('Remark should be 10 characters', 'error');
    return;
  }

  // ---- PAYLOAD (EXACT SAME AS ANGULARJS) ----
  const payload = {
    "param1": this.dealerId,   //dealerid
    "param2": dealerName,//dealername
    "param3": "0",//dealergst
    "param4": address,//dealerregaddr1
    "param5": "0",//dealerregaddr2
    "param6": cityName,//dealercityname
    "param7": stateName,//dealerstatename
    "param8": contactPerson,//dealercontactpers
    "param9": emailId,//dealercontactemailid
    "param10": mobileNo,//dealercontactmobile1
    "param11": alternateMobileNo,//dealercontactmobile2
    "param12": this.vendorId || '',//dealervendorid
    "param13": "",//loginname
    "param14": "",//loginpasswd
    "param15": "",//creatorloginid
    "param16": "",//dealerpincode
    "param17": this.distributorId || '',//distributorid
    "param18": remark, // remarks

    // param1: this.dealerId,            // $scope.param2 (dealerid)
    // param2: dealerName,               // dealername
    // param3: '0',                      // dealergst
    // param4: address,                  // address
    // param5: '0',                      // address2
    // param6: this.selectedCityId,      // cityname (ID)
    // param7: this.selectedStateId,     // statename (ID)
    // param8: contactPerson,            // contact person
    // param9: emailId,                  // email
    // param10: mobileNo,                // mobile
    // param11: alternateMobileNo,       // alternate mobile
    // param12: this.vendorId || '',     // vendorId
    // param13: '',
    // param14: '',
    // param15: '',
    // param16: '',
    // param17: remark,// remark
    // param20: this.distributorId || '', // distributorId                   
  };

  // ---- API CALL ----
  this.dealerService.updateDealer(payload).subscribe({
    next: (res) => {
      alert(res.entity || 'Updated successfully');
      if ((res as any).statuscode === 200) {
        this.loadDealers();
        this.closeEditModal();
      }
    },
    error: () => {
      this.toastService.show('Failed to Save Data', 'error');
      this.closeEditModal();
    }
  });
}



 deleteDealerData() {
  if (!this.remarkForDelete || this.remarkForDelete.trim().length < 10) {
    this.toastService.show('Remarks should be at least 10 characters', 'error');
    return;
  }

  if (!confirm('Are you sure you want to delete this dealer?')) {
    return;
  }

  this.dealerService
    .deleteDealer(
      this.dealerId,                  // dealerId
      this.remarkForDelete.trim()      // ✅ remark
    )
    .subscribe({
      next: (response) => {
        this.toastService.show(response?.entity || 'Dealer deleted successfully', 'success');

        if (response?.status) {
          this.loadDealers();
          this.closeDeleteModal();
          this.remarkForDelete = '';
        }
      },
      error: (error) => {
        console.error('Error deleting dealer:', error);
        this.toastService.show('Error deleting dealer. Please try again.', 'error');
      }
    });
}


 blockUnblockDetails() {
  if (!this.remarkForBlock || this.remarkForBlock.trim().length < 10) {
    this.toastService.show('Remark should be at least 10 characters', 'error');
    return;
  }

  this.dealerService
    .blockUnblockDealer(
      this.dealerId,
      this.remarkForBlock.trim(),
      this.blockUnblock as 'block' | 'unblock'
    )
    .subscribe({
      next: (response) => {
        if (response?.status) {

          this.toastService.show(response.entity || 'Operation completed successfully', 'success');
          this.loadDealers();
          this.closeBlockModal();
        } else {
          this.toastService.show(response?.entity || 'Operation failed', 'error');
        }
      },
      error: (error) => {
        console.error('Block/Unblock error:', error);
        this.toastService.show('Error performing operation. Please try again.', 'error');
      }
    });
}


  goHome() {
    this.router.navigate(['/dashboard']);
  }

  getPaginatedDealers(): Dealer[] {
    // API already returns paginated data, so just sort if needed
    // Note: In a production app, sorting should be done server-side
    // For now, we do client-side sorting on the current page
    let sorted = [...this.dealers];
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


isExporting: boolean = false;
 selectedVendorFilter ='';
exportToExcel() {

  this.isExporting = true;

  const payload = {
    param1: this.searchText || '',
    param2: 1,
    param3: this.totalCount || 1000,
    param4: this.counttype || '',
    dealerid: '',
    pdfexcel: 'excel'
  };

  this.dealerService.getVendorDealerExcel(payload)
    .subscribe({
      next: (response: any) => {

        this.isExporting = false;

        if (response?.status && response?.entity) {

          const fileUrl = response.entity;

          // ✅ Download file from URL
          const link = document.createElement('a');
          link.href = fileUrl;
          link.setAttribute('download', 'Dealer_Details.xls'); // optional name
          link.target = '_blank'; // optional (open in new tab)

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

        } else {
          this.toastService.show('Failed to generate Excel', 'error');
        }
      },
      error: () => {
        this.isExporting = false;
        this.toastService.show('Error exporting Excel', 'error');
      }
    });
}
}
