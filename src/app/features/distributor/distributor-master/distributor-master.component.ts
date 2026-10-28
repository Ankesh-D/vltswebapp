import { AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ToastComponent } from '../../assets/inactive-assets/toast.component';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Distributor, DistributorDeleteRequest, DistributorEntryRequest, DistributorRequest, DistributorService } from '../../../core/services/distributor.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../../core/services/toast.service';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';
declare var $: any;
@Component({
    selector: 'app-distributor-master',
    imports: [FormsModule, CommonModule, ToastComponent, NgSelectModule, NgbPaginationModule, CommonTableComponent],
    templateUrl: './distributor-master.component.html',
    styleUrl: './distributor-master.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager
})
export class DistributorMasterComponent implements OnInit, AfterViewInit, OnDestroy {
  msgType: any = '';
  errorMessage: any = '';
  totalCount: number = 0;
  pageSize: number = 10;
  currentPage: number = 1;
  sortKey: any;
  reverse: boolean = false;
  detailsData: any[] = [];
  readonly tableColumns: CommonTableColumn<any>[] = [
    { key: 'rowno', label: '#', width: '40px', value: detail => detail.rowno },
    { key: 'param7', label: 'Vendor', sortable: true, visible: () => this.roleId != '11', value: detail => detail.param4 },
    { key: 'param11', label: 'Distributor Name', sortable: true, value: detail => detail.param2 },
    { key: 'param5', label: 'Contact Person', sortable: true, value: detail => detail.param9 },
    { key: 'param4', label: 'Mobile No.', sortable: true, value: detail => detail.param11 },
    { key: 'param6', label: 'State', sortable: true, value: detail => detail.param8 },
    { key: 'param28', label: 'City', sortable: true, value: detail => detail.param7 },
    { key: 'param19', label: 'Address', sortable: true, value: detail => detail.param6 },
    { key: 'param16', label: 'Pincode', sortable: true, value: detail => detail.param13 },
    { key: 'actions', label: 'Actions' }
  ];
  pageSizeOptions = [20, 50, 100, 200, 500];
  pageCount: number = 0;
  detailsflag: boolean = true;
  searchBy: string = '';
  isDataLoaded: boolean = true;
  roleId: any = '';
  stateList: any[] = [];
  vendorList: any[] = [];
  cityList: any[] = [];
  insertRequest: DistributorEntryRequest = new DistributorEntryRequest();
  selectedState: any = null;
  selectedCity: any = null;
  selectedVendor: any = null;
  loadingEntryFlag: boolean = false;
  deleteRemark: string = '';
  deleteRequest: DistributorDeleteRequest = new DistributorDeleteRequest();
  detailRequest: DistributorRequest = new DistributorRequest();
      @ViewChild('deleteForm') deleteForm!: NgForm;
      @ViewChild('entryForm') entryForm!: NgForm;
  entryType: string = 'insert'; // insert | update
  constructor(public distributorService: DistributorService, private toastService: ToastService) {
    this.toastService.pageName = 'Distributor Master'; // Set page name for toast service
   }


  ngOnInit(): void {
    this.roleId = sessionStorage.getItem('roleid') || '';
    this.getDetails('initial');
    if(this.roleId=='10') {
      this.selectedVendor = null;
      this.loadVendorList();
    }
  }

  ngAfterViewInit(): void {
    
  }

  ngOnDestroy(): void {
    
  }
  getTotalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }
  onPageChange(page: number) {
    this.currentPage = page;
    this.getDetails('');
  }
  onPageSizeChange(event: Event) {
    const newSize = (event.target as HTMLSelectElement).value;
    this.pageSize = newSize === 'All' ? this.totalCount : Number(newSize);
    this.currentPage = 1;
    this.detailsData = [];
    this.totalCount = 0;
    this.getDetails('initial');
  }
  reloadData() {}
  getSearchDetails() {}
  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const currentPage = this.currentPage;
    const maxPagesToShow = 7; // Show 7 page numbers at a time

    if (totalPages <= maxPagesToShow) {
      // If total pages are 7 or less, show all page numbers
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const maxPagesBeforeCurrent = Math.floor(maxPagesToShow / 2);
    const maxPagesAfterCurrent = Math.ceil(maxPagesToShow / 2) - 1;
    let startPage: number;
    let endPage: number;

    if (currentPage <= maxPagesBeforeCurrent + 1) {
      startPage = 1;
      endPage = maxPagesToShow;
    } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
      startPage = totalPages - maxPagesToShow + 1;
      endPage = totalPages;
    } else {
      startPage = currentPage - maxPagesBeforeCurrent;
      endPage = currentPage + maxPagesAfterCurrent;
    }
    return Array.from({ length: (endPage - startPage + 1) }, (_, i) => startPage + i);
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
  getDetails(optype: string = "initial") {
    this.isDataLoaded = false;
    if(optype==='initial') {
      this.detailRequest = new DistributorRequest();
    }
    if(optype==='search') {
      this.detailRequest.param2 = 1;
    }
    if(optype==='itemperpage') {
      this.detailRequest.param2 = 1;
    }
    // {
    //   param1: this.searchBy || '',
    //   param2: page.toString(),
    //   param3: this.pageSize.toString(),
    //   param4: ''
    // }
    
    this.distributorService.getDistributorDetails(this.detailRequest).subscribe({
      next: (response:any) => { 
        if (response.statuscode==200) {
          this.detailsData = response.entity.listData;
          this.totalCount = response.entity.param1;
          if (this.detailsData.length < this.detailRequest.param3) {
            this.pageCount = this.detailsData.length;
          } else {
            this.pageCount = this.detailRequest.param3;
          }
          this.updatePageSizeOptions();
        } else {
          this.detailsData = [];
          this.totalCount = 0;
          this.pageCount = 0;
        }
        this.isDataLoaded = true;
      },
      error: (error) => {
        console.error('Error fetching distributor details:', error);
        this.detailsData = [];
        this.totalCount = 0;
        this.pageCount = 0;
        this.isDataLoaded = true;
      }
    });


  }

  sort(key: string) {
    if (this.sortKey === key) {
      this.reverse = !this.reverse;
    } else {
      this.sortKey = key;
      this.reverse = false;
    }

    this.detailsData.sort((a, b) => {
      const valA = a[key] ?? '';
      const valB = b[key] ?? '';
      if (valA < valB) return this.reverse ? 1 : -1;
      if (valA > valB) return this.reverse ? -1 : 1;
      return 0;
    });
  }
  setData (detail: Distributor) {
  this.selectedVendor = null;
  this.entryType = "update";
  this.detailsflag = false;
  this.insertRequest.param1 = detail.param1; //distributorid
  this.insertRequest.param2 = detail.param3; //vendorid
  this.insertRequest.param3 = detail.param2;//distributorname
  this.insertRequest.param4 = detail.param5;//distributorgstno
  this.insertRequest.param5 = detail.param6;//distributoraddress

  this.insertRequest.param8 = detail.param9;//conatctpersonname
  this.insertRequest.param9 = detail.param11;//conatctpersonmobileno
  this.insertRequest.param10 = detail.param10;//conatctpersonemailid
  this.insertRequest.param11 = detail.param13;//pincode
  this.insertRequest.remarks = "";//remarks
  
  
  this.selectedState = detail.param8;//distributorstate
  this.getStateListForEdit(detail.param8);
  this.getCityListForEdit(this.selectedState, detail.param14);

  if(this.roleId=='10') {
    setTimeout(() => {
      this.vendorList.forEach(element => {
        if(element.param1==detail.param3) {
          this.selectedVendor = element.param1;
        }
      });
    }, 400);
  }
  
  // this.detailRequest.param6 = detail.param8;//distributorstate
  // this.detailRequest.param7 = detail.param7;//distributorcity

  }
  openDeleteModal(detail: Distributor) {
    $('#deleteModal').modal('show');
    this.deleteRequest.param1 = detail.param1; // distributorid
  }
  confirmDelete() {
    if(this.deleteForm.valid) {
      this.distributorService.deleteDistributor(this.deleteRequest).subscribe({
        next: (response) => {
          if (response.statuscode==200) {
            this.msgType = 'success';
            this.errorMessage = 'Distributor deleted successfully.';
            this.getDetails('initial');
            this.detailsflag = true;
            $('#deleteModal').modal('hide');
          } else {
            this.msgType = 'error';
            this.errorMessage = response.message || 'Failed to delete distributor.';
          }
        },
        error: (error) => {
          console.error('Error deleting distributor:', error);
          this.msgType = 'error';
          this.errorMessage = 'An error occurred while deleting the distributor.';
        }
      });
    }
  }
  ///////////////////////////////////////
  getCityListForEdit(stateId: string, cityId: string) {
    this.selectedCity = null;
    this.cityList = [];
    if (stateId) {
      //console.log('Selected State ID:', stateId, cityId);
      this.distributorService.getCityList(stateId).subscribe({
        next: (response) => {
          if (response.statuscode==200) {
            this.cityList = response.entity;
            this.cityList.forEach(element => {
              if(element.param1==cityId) {
                this.selectedCity = element.param1;
              }
            });
          }
        },
        error: (error) => {
          console.error('Error loading city list:', error);
          this.errorMessage = 'Failed to load city list';
        }
      });
    }
  }
  
  loadStateList() {
    this.distributorService.getStateList().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.stateList = response.entity;
        }
      },
      error: (error) => {
        console.error('Error loading state list:', error);
        this.errorMessage = 'Failed to load state list';
      }
    });
  }
  getStateListForEdit(stateId: string) {
    this.stateList = [];
    this.distributorService.getStateList().subscribe({
      next: (response) => {
        if (response.statuscode==200) {
          this.stateList = response.entity;
          this.stateList.forEach(element => {
            if(element.param1==stateId) {
              this.selectedState = element;
            }
          });
        }
      },
      error: (error) => {
        console.error('Error loading state list:', error);
        this.errorMessage = 'Failed to load state list';
      }
    });
  }

  loadVendorList(vendorid?: string) {
    this.distributorService.getVendorList().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.vendorList = response.entity;
          if(this.entryType=='update') {
            this.vendorList.forEach(element => {
              if(element.param1==vendorid) {
                this.selectedVendor = element;
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
  onStateChange(){
    this.selectedCity = null;
    this.cityList = [];
    if (this.selectedState) {
      //console.log('Selected State ID:', this.selectedState);
      this.distributorService.getCityList(this.selectedState).subscribe({
        next: (response) => {
          if (response.status && response.entity) {
            this.cityList = response.entity;
          }
        },
        error: (error) => {
          console.error('Error loading city list:', error);
          this.errorMessage = 'Failed to load city list';
        }
      });
    }
  }
  onCityChange() {}

  
  submitForm(form: any) {
    if (form.valid) {
      this.insertRequest.param6 = this.selectedState || '';
      this.insertRequest.param7 = this.selectedCity || '';
      this.insertRequest.param2 = this.selectedVendor || '';
      // Process form submission
      if (this.insertRequest.param1 == "") {
        console.log('Insert Request:', this.insertRequest);
        this.distributorService.insertDistributor(this.insertRequest).subscribe({
          next: (response) => {
            if (response.statuscode==200) {
              this.msgType = 'success';
              this.errorMessage = 'Distributor added successfully.';
              this.getDetails('initial');
              this.detailsflag = true;
            } else {
              this.msgType = 'error';
              this.errorMessage = response.message || 'Failed to add distributor.';
            }
          },
          error: (error) => {
            console.error('Error submitting form:', error);
            this.msgType = 'error';
            this.errorMessage = 'An error occurred while submitting the form.';
          }
        });
      } else {
        console.log('Insert Request:', this.insertRequest);
        this.distributorService.updateDistributor(this.insertRequest).subscribe({
          next: (response) => {
            if (response.status) {
              this.msgType = 'success';
              this.errorMessage = 'Distributor updated successfully.';
              this.getDetails('initial');
              this.detailsflag = true;
            } else {
              this.msgType = 'error';
              this.errorMessage = response.message || 'Failed to update distributor.';
            }
          },
          error: (error) => {
            console.error('Error submitting form:', error);
            this.msgType = 'error';
            this.errorMessage = 'An error occurred while submitting the form.';
          }
        });
      }
    } else {
      // Handle form validation errors
      //console.log('Form is invalid');
    }
  }
  openAddNew() {
    this.insertRequest = new DistributorEntryRequest();
    this.entryType = 'insert';
    this.detailsflag = false;
    this.selectedVendor = null;
    this.loadStateList();
    // if(this.roleId=='10') {
    //   this.loadVendorList();
    // }
  }
  resetForm() {
    this.entryForm.resetForm();
  }

}
