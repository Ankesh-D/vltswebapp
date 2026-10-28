import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { VehicleService } from '../../../core/services/vehicle.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { ToastService } from '../../../core/services/toast.service';
import { PermitHolderService } from '../../../core/services/permit-holder.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

dayjs.extend(utc);
dayjs.extend(localizedFormat);

declare var $: any;
declare var jAlert: any;

@Component({
    selector: 'app-update-vehicle-details',
    imports: [CommonModule, FormsModule, RouterModule, NgSelectModule, NgxDaterangepickerMd, NgbPaginationModule],
    templateUrl: './update-vehicle-details.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./update-vehicle-details.component.scss']
})
export class UpdateVehicleDetailsComponent implements OnInit, AfterViewInit {
  editActivationDate: any = {
      startDate: dayjs(),
      endDate: dayjs()
    };
  vehicleDetails: any[] = [];
  loading = false;

  searchText: string = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [20, 50, 100, 200, 500];
  totalCount = 0;
  pageCount = 0;

  sortKey: string = '';
  reverse: boolean = false;

  // Tab Slider
  sliderWidth: number = 0;
  sliderLeft: number = 4;
  @ViewChild('simTab') simTab!: ElementRef;
  @ViewChild('custTab') custTab!: ElementRef;
  @ViewChild('dealerTab') dealerTab!: ElementRef;
  @ViewChild('deviceTab') deviceTab!: ElementRef;
  @ViewChild('vehicleTab') vehicleTab!: ElementRef;

  // Edit Modal
  showEditModal: boolean = false;
  editVehicleId: string = '';
  editVendorId: string = '';
  editDeviceId: string = '';
  editVehicleNo: string = '';
  editChassisNo: string = '';
  editEngineNo: string = '';
  editVehicleType: string = 'NEW';
  editMfgYear: string = '';
  editStateCode: string = '';
  editRTOId: string = '';
  editRTOName: string = '';
  editMakeId: string = '';
  editModelId: string = '';
  editClassId: string = '';
  // editActivationDate: string = '';
  editRemark: string = '';
  editRefundAmount: boolean = false;
  isEditRemarkInvalid: boolean = false;
  msgValid: string = '';

  // Delete Modal
  showDeleteModal: boolean = false;
  deleteVehicleId: string = '';
  deleteVehicleNo: string = '';
  deleteRemark: string = '';
  deleteRefundAmount: boolean = false;
  isDeleteRemarkInvalid: boolean = false;

  // Dropdowns
  vehicleMakeList: any[] = [];
  vehicleModelList: any[] = [];
  vehicleClassList: any[] = [];
  rtoList: any[] = [];
  yearList: number[] = [];

  roleId: string = '';

  rtoObj: any = null;
  makeObj: any = null;
  modelObj: any = null;
  classObj: any = null;
  stateList: any[]= [];
  stateObj: any;
  selectedStateId: any;
  errorMessage: any;
  mfgyearObj: any = null;

  constructor(
    private vehicleService: VehicleService,
    private dashboardService: DashboardService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService,
    private permitHolderService: PermitHolderService
  ) {
    this.toastService.pageName = 'Update Vehicle Details'; // Set page name for toast service
  }

  ngOnInit() {
    this.roleId = sessionStorage.getItem('roleId') || '';
    this.generateYearList();
    this.loadVehicleMakeList();
    this.loadVehicleClassList();
    this.loadRTORoster();
    this.getVehicleDetails(1);
  }

  ngAfterViewInit() {
    // Initialize tab slider after view loads
    setTimeout(() => this.initializeSlider(), 100);
  }

  initializeSlider() {
    // Set initial slider position based on current route
    const activeTab = document.querySelector('.modern-tab-item.active') as HTMLElement;
    if (activeTab) {
      this.updateSliderPosition(activeTab);
    }
  }

  updateSlider(event: MouseEvent, tabElement: HTMLElement) {
    const target = event.currentTarget as HTMLElement;
    this.updateSliderPosition(target);
  }

  updateSliderPosition(element: HTMLElement) {
    if (element) {
      const width = element.offsetWidth;
      const left = element.offsetLeft;
      this.sliderWidth = width;
      this.sliderLeft = left;
    }
  }

  generateYearList() {
    const currentYear = new Date().getFullYear();
    for (let i = 2000; i <= currentYear; i++) {
      this.yearList.push(i);
    }
  }

  loadStateList(stateCode?: string) {
    this.permitHolderService.getStateList().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.stateList = response.entity;
          if(stateCode) {

            // after state list loaded, stateCode will auto match
            this.stateList.forEach((state: any) => {
              if(state.param3.toUpperCase() === stateCode.toUpperCase()) {
                this.stateObj = state;
                this.selectedStateId = state.param1;
                // this.loadCityList(this.selectedStateId);
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
  onStateChange() {

  }

  loadVehicleMakeList() {
    this.vehicleService.getVehicleMakeList().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.vehicleMakeList = response.entity;
          if(this.showEditModal) {
            this.vehicleMakeList.forEach((make: any) => {
              if (make.param1 == this.editMakeId) {
                this.makeObj = make;
              }
            }); 
          }
        }
      },
      error: (error) => {
        console.error('Error loading vehicle make list:', error);
      }
    });
  }

  onVehicleMakeChange() {
    // this.editMakeId = this.makeObj ? this.makeObj.param1 : '';
    if (this.editMakeId) {
      this.vehicleService.getVehicleModelList(this.editMakeId).subscribe({
        next: (response) => {
          if (response.status && response.entity) {
            this.vehicleModelList = response.entity;
            if(this.showEditModal) {
              this.vehicleModelList.forEach((model: any) => {
                if (model.param1 == this.editModelId) {
                  this.modelObj = model;
                }
              });
            }

          }
        },
        error: (error) => {
          console.error('Error loading vehicle model list:', error);
        }
      });
    } else {
      this.vehicleModelList = [];
    }
  }

  loadVehicleClassList() {
    this.vehicleService.getVehicleClassRoster().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.vehicleClassList = response.entity;
          if(this.showEditModal) {
            this.vehicleClassList.forEach((classItem: any) => {
              if (classItem.param1 == this.editClassId) {
                this.classObj = classItem;
              }
            });
          }
        }
      },
      error: (error) => {
        console.error('Error loading vehicle class list:', error);
      }
    });
  }

  loadRTORoster() {
    this.dashboardService.getRTOList().subscribe({
      next: (response: any) => {
        if (response.status && response.entity) {
          this.rtoList = response.entity;
          if(this.showEditModal) {
            this.rtoList.forEach((rto: any) => {
              if (rto.param1 == this.editRTOId) {
                this.rtoObj = rto;
              }
            });
          }
        }
      },
      error: (error: any) => {
        console.error('Error loading RTO list:', error);
      }
    });
  }
  updatePageSizeOptions() {
    // Generate page size options based on total count
    const options = [20];
    if (this.totalCount > 50) options.push(50);
    if (this.totalCount > 100) options.push(100);
    if (this.totalCount > 200) options.push(200);
    if (this.totalCount > 500) options.push(500);
    if (this.totalCount > 0 && this.totalCount < 100) options.push(this.totalCount); // 'All'
    this.pageSizeOptions = options;
  }

  getVehicleDetails(pageNumber: number) {
    this.loading = true;
    this.currentPage = pageNumber;

    const request = {
      param1: this.searchText,
      param2: String(this.currentPage),
      param3: String(this.pageSize)
    };

    this.vehicleService.getVehicleDetailsForUpdate(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.vehicleDetails = response.entity.listData || [];
          this.totalCount = response.entity.param1 || 0;
          this.pageCount = this.vehicleDetails.length;
          this.updatePageSizeOptions();
        } else {
          this.vehicleDetails = [];
          this.totalCount = 0;
          this.pageCount = 0;
          jAlert('No Data Found: ' + response.entity);
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.vehicleDetails = [];
        this.totalCount = 0;
        this.pageCount = 0;
        this.cdr.detectChanges();
      }
    });
  }

  getSearchDetails() {
    this.getVehicleDetails(1);
  }

  reloadData() {
    this.searchText = '';
    this.currentPage = 1;
    this.pageSize = 20;
    this.getVehicleDetails(1);
  }

  sort(key: string) {
    this.sortKey = key;
    this.reverse = !this.reverse;
    this.vehicleDetails.sort((a, b) => {
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
    this.currentPage = page;
    this.getVehicleDetails(this.currentPage);
  }

  onPageSizeChange(event: Event) {
    const newSize = (event.target as HTMLSelectElement).value;
    this.pageSize = newSize === 'All' ? this.totalCount : Number(newSize);
    this.currentPage = 1;
    this.getVehicleDetails(this.currentPage);
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
    return this.vehicleDetails;
  }
  setDate(activationDate: any) {
  this.editActivationDate = {
    startDate: dayjs(activationDate),
    endDate: dayjs(activationDate)
  };
}

  // Edit Vehicle (overlay modal)
  openEditModal(vehicle: any) {
    this.showEditModal = true;
    this.editVehicleId = vehicle.param6 || '';
    this.editVendorId = vehicle.param2 || '';
    this.editDeviceId = vehicle.param31 || '';
    this.editVehicleNo = vehicle.param7 || '';
    this.editChassisNo = vehicle.param8 || '';
    this.editEngineNo = vehicle.param9 || '';
    this.editVehicleType = vehicle.param15 === 'OLD' ? 'OLD' : 'NEW';
    this.editMfgYear = (vehicle.param12=='0' || vehicle.param12=='') ? null : vehicle.param12;
    this.editStateCode = vehicle.param13 || '';
    this.editRTOId = vehicle.param40 || '';
    this.editRTOName = vehicle.param14 || '';
    this.editMakeId = vehicle.param23 || '';
    this.editModelId = vehicle.param24 || '';
    this.editClassId = vehicle.param25 || '';
    this.editActivationDate = vehicle.param10 || '';
    this.editRemark = '';
    this.editRefundAmount = vehicle.param21 !== 'Activated';
    this.isEditRemarkInvalid = false;
    this.msgValid = '';

    if (this.roleId === '11' || this.roleId === '24') {
      this.editRefundAmount = true;
    }

    this.loadStateList(this.editStateCode);
    this.loadRTORoster();
    this.loadVehicleMakeList();
    this.onVehicleMakeChange() 
    this.loadVehicleClassList();
    if(this.editActivationDate !='') {
      this.setDate(this.editActivationDate);
    }
    // this.onVehicleMakeChange();
  }

  checkVehicle() {
    const vehNo = (document.getElementById('vehno') as HTMLInputElement)?.value || '';
    if (vehNo.length !== 0) {
      if (vehNo.length === 10 || vehNo.length === 11) {
        // Valid
      } else {
        // Invalid
      }
    }
    if (vehNo === '' || vehNo === null) {
      this.editVehicleType = 'NEW';
    } else {
      this.editVehicleType = 'OLD';
    }
  }

  forChassis() {
    const chassisNo = (document.getElementById('cheno') as HTMLInputElement)?.value || '';
    if (chassisNo.length < 15 || chassisNo.length > 20) {
      this.msgValid = 'Chessis Number between 15 to 20 characters';
      return;
    } else {
      this.msgValid = '';
    }
  }

  forEngine() {
    const engineNo = (document.getElementById('engno') as HTMLInputElement)?.value || '';
    if (engineNo.length < 7 || engineNo.length > 25) {
      this.msgValid = 'Engine Number Between 7 to 25 characters';
      return;
    } else {
      this.msgValid = '';
    }
  }

  checkEditRemark() {
    this.isEditRemarkInvalid = this.editRemark.length < 10;
  }

  updateVehicle() {
    const vehNo = (document.getElementById('vehno') as HTMLInputElement)?.value || '';
    const chassisNo = (document.getElementById('cheno') as HTMLInputElement)?.value || '';
    const engineNo = (document.getElementById('engno') as HTMLInputElement)?.value || '';
    const mfgYear = this.editMfgYear;
     const stateCode =  'wb';
    const rtoId = (document.getElementById('rtoname') as HTMLSelectElement)?.value || '';
    const vehicleType = (document.getElementById('vehtype') as HTMLSelectElement)?.value || '';
    const activationDate = this.editActivationDate?.startDate
      ? dayjs(this.editActivationDate.startDate).format('DD-MMM-YYYY')
      : '';

    // if (!chassisNo || chassisNo.length < 15 || chassisNo.length > 20) {
    //   jAlert('Chessis Number between 15 to 20 characters');
    //   return;
    // }

    // if (!engineNo || engineNo.length < 7 || engineNo.length > 25) {
    //   jAlert('Engine Number Between 7 to 25 characters');
    //   return;
    // }

    // if (!mfgYear) {
    //   jAlert('Please Select Manufacture Year');
    //   return;
    // }

    // if (!stateCode) {
    //   jAlert('Please Select State Code');
    //   return;
    // }

    // if (!rtoId) {
    //   jAlert('Please Select RTO');
    //   return;
    // }

    // if (!vehicleType) {
    //   jAlert('Please Select Vehicle Type');
    //   return;
    // }

    // if (!activationDate) {
    //   jAlert('Please Select Activation Date');
    //   return;
    // }

    // this.checkEditRemark();
    // if (this.isEditRemarkInvalid) {
    //   jAlert('Remark Must have Minimum 10 Words');
    //   return;
    // }

    // if (!confirm('Are you sure to Update Vehicle')) {
    //   return;
    // }

    this.loading = true;
    const request = {
      param1: this.editVehicleId,
      param2:  this.editMakeId ,   // table ka param23
      param3: this.editModelId,  // table ka param24
      param4: this.classObj ? this.classObj.param1 : '',
      param5: this.editVehicleNo,
      param6: this.editChassisNo,
      param7: this.editEngineNo,
      param8: mfgYear,
      param9: this.stateObj ? this.stateObj.param3 : '',
      param10: this.rtoObj ? this.rtoObj.param1 : '',
      param11: this.editVehicleType === 'OLD' ? 'OLD' : 'NEW',
      param13: 'Web',
      param14: this.editRemark,
      param15: activationDate
    };
    
    this.vehicleService.updateVehicle(request).subscribe({
      next: (response) => {
        if(response.statuscode==200) {
          this.loading = false;
          this.toastService.show(response.entity, 'success');
          if (response.status && response.entity === 'Successfully saved.') {
            this.showEditModal = false;
            this.getVehicleDetails(this.currentPage);
          }
        } else {
          this.toastService.show(response.entity, 'error');
        }
      },
      error: (error) => {
        this.loading = false;
        this.toastService.show('Error updating vehicle.', 'error');
      }
    });
  }

  // Delete Vehicle
  openDeleteModal(vehicle: any) {
    this.deleteVehicleId = vehicle.param6 || '';
    this.deleteVehicleNo = vehicle.param7 || '';
    this.deleteRemark = '';
    this.deleteRefundAmount = vehicle.param21 !== 'Activated';
    this.isDeleteRemarkInvalid = false;

    if (this.roleId === '11' || this.roleId === '24') {
      this.deleteRefundAmount = true;
    }

    this.showDeleteModal = true;
  }

  checkDeleteRemark() {
    this.isDeleteRemarkInvalid = this.deleteRemark.length < 10;
  }

  deleteVehicle() {
    this.checkDeleteRemark();
    if (this.isDeleteRemarkInvalid) {
      this.toastService.show('Remark Must have Minimum 10 Words', 'error');
      return;
    }

    if (!confirm('Are you sure to Delete Vehicle ' + this.deleteVehicleNo)) {
      return;
    }

    // Delete API is not defined in original service; keep behavior aligned with existing comment
    this.vehicleService.deleteVehicle({
      param1: this.deleteVehicleId,
      param2: this.deleteRemark
    }).subscribe({
      next: (response) => {
        this.toastService.show(response.entity, response.status ? 'success' : 'error');
        if (response.status && response.entity === 'Successfully deleted.') {
          this.showDeleteModal = false;
          this.getVehicleDetails(this.currentPage);

        } 
      },
      error: (error) => {
        this.toastService.show('Error deleting vehicle.', 'error');
      }
    });

  }

  back() {
    this.editRemark = '';
    this.deleteRemark = '';
    this.isEditRemarkInvalid = false;
    this.isDeleteRemarkInvalid = false;
    this.msgValid = '';
    this.showEditModal = false;
    this.showDeleteModal = false;
  }
}
