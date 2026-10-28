
import { Component, OnDestroy, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { OnInit } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';
import { SchoolManagementService } from '../../../core/services/school-management.service';
import { SchoolMasterDeleteReq, SchoolMasterDetailsReq, SchoolMasterFormReq } from '../../../core/model/request.model';
import { SchoolMasterDetailsResp } from '../../../core/model/response.model';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { MapboxService } from '../../../core/services/mapbox.service';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';

@Component({
    selector: 'app-school-master',
    imports: [FormsModule, NgSelectModule, NgbPaginationModule, CommonTableComponent],
    templateUrl: './school-master.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './school-master.component.scss'
})
export class SchoolMasterComponent implements OnInit, OnDestroy {

  roleId: any = '';
  pageSize: any = 10;
  searchText: any = '';
  loading: any = false;
  pageSizeOptions: any = [10, 25, 50, 100];
  totalCount: any = 0;
  pageCount: any = 0;
  detailData: SchoolMasterDetailsResp[] = [];
  readonly tableColumns: CommonTableColumn<SchoolMasterDetailsResp>[] = [
    { key: 'param1', label: '#', width: '25px' },
    { key: 'param3', label: 'School Name', width: '150px' },
    { key: 'param4', label: 'Code', width: '150px' },
    { key: 'contact', label: 'Contact Person (Contact Number)', width: '150px',
      value: data => `${data.param5 || ''} ${data.param6 === '0' ? '-' : data.param6 ? `(${data.param6})` : ''}`.trim() },
    { key: 'param7', label: 'Email', width: '150px' },
    { key: 'param18', label: 'State', width: '150px' },
    { key: 'param17', label: 'City', width: '150px' },
    { key: 'param8', label: 'Address', width: '150px' },
    { key: 'param13', label: 'Pincode', width: '150px' },
    {
      key: 'actions',
      label: 'Action',
      actions: [
        { label: 'Edit', icon: 'fa fa-edit', tone: 'primary', className: 'mx-2', run: data => this.editSchool(data) },
        { label: 'Delete', icon: 'fa fa-trash', tone: 'danger', run: data => this.openDeleteModal(data) }
      ]
    }
  ];
  detailsToggle: boolean = true;
  updateFlag: boolean = false;
  stateObj: any = null;
  stateList: any[] = [];
  cityObj: any = null;
  cityList: any[] = [];
  schoolDetailsRequest: SchoolMasterDetailsReq = new SchoolMasterDetailsReq();
  schoolMasterFormReq: SchoolMasterFormReq = new SchoolMasterFormReq();
  deleteSchoolMasterReq: SchoolMasterDeleteReq = new SchoolMasterDeleteReq(); // Assuming delete request has only one parameter for school ID
  @ViewChild('masterForm') masterForm!: NgForm;
  @ViewChild('deleteForm') deleteForm!: NgForm;

  constructor(public toastService: ToastService, public schoolService: SchoolManagementService, public mapService: MapboxService) {
    this.toastService.pageName = 'School Master';
    this.roleId = sessionStorage.getItem('roleId');
  }
  
  ngOnInit(): void {
    this.loadStateList();
    this.getDetails('reload');
  }
  ngOnDestroy(): void {}
  
  loadStateList() {
    this.schoolService.getStateList().subscribe({
      next: (response: any) => {
        if (response.statuscode == 200) {
          this.stateList = response.entity || [];
        } else {
          // this.toastService.show(response.message, 'error');
        }
      },
      error: (error) => {
        console.log(error);
        // this.toastService.show('An error occurred while fetching state list.', 'error');
      }
    });
  }
  loadCityList(stateId: string) {
    this.schoolService.getCityList(stateId).subscribe({
      next: (response: any) => {
        if (response.statuscode == 200) {
          this.cityList = response.entity || [];
          if(this.updateFlag && this.schoolMasterFormReq.cityid) {
            this.cityObj = this.cityList.find(city => city.param1 === this.schoolMasterFormReq.cityid) || null;
          }
        } else {
          // this.toastService.show(response.message, 'error');
        }
      },
      error: (error) => {
        console.log(error);
        // this.toastService.show('An error occurred while fetching city list.', 'error');
      }
    });
  }
  toggleCodeUppercase() {
    if (this.schoolMasterFormReq.schoolcode) {
      this.schoolMasterFormReq.schoolcode = this.schoolMasterFormReq.schoolcode.toUpperCase();
    }
  }
  onStateChange() {
    if (this.stateObj && this.stateObj.param1) {
      this.loadCityList(this.stateObj.param1);
    } else {
      this.cityList = [];
      this.cityObj = null;
    }
  }


  toggleDetails() {
    this.detailsToggle = !this.detailsToggle;
    if (!this.detailsToggle) {
      setTimeout(() => {
        this.resetForm();
      }, 300);
    }
  }
  
  getDetails(type: string) {
    if(type === 'search') {
      this.schoolDetailsRequest.param2 = 1;
      this.schoolDetailsRequest.param3 = 10;
    }
    if(type === 'pageSize') {
       this.schoolDetailsRequest.param2 = 1;
      this.schoolDetailsRequest.param1 = '';
    }
    if(type === 'reload') {
      this.searchText = '';
      this.schoolDetailsRequest.param1 = '';
      this.schoolDetailsRequest.param2 = 1;
      this.schoolDetailsRequest.param3 = 10;
    }
    if(type === 'pageChange') {
      this.loading = true;
    }

    this.schoolService.getSchoolDetails(this.schoolDetailsRequest).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response.statuscode == 200) {
          this.detailData = response.entity?.listData || [];
          this.totalCount = response.entity?.param1 || 0;
          this.pageCount = Math.ceil(this.totalCount / this.pageSize);
        } else {
          this.toastService.show(response.message, 'error');
          this.detailData = [];
          this.totalCount = 0;
          this.pageCount = 0;
        }
         this.updatePageSizeOptions();
      },
      error: (error) => {
        this.loading = false;
        console.log(error);
        this.toastService.show('An error occurred while fetching school details.', 'error');
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
  onPageChange(page: number) {
    this.schoolDetailsRequest.param2 = page;
    this.getDetails('pageChange');
  }
  editSchool(data: SchoolMasterDetailsResp) {
    this.detailsToggle = false;
    this.schoolMasterFormReq.schoolid = data.param1;
    this.schoolMasterFormReq.schoolname = data.param3;
    this.schoolMasterFormReq.schoolcode = data.param4;
    this.schoolMasterFormReq.contactperson = data.param5;
    this.schoolMasterFormReq.mobileno = data.param6;
    this.schoolMasterFormReq.emailid = data.param7;
    this.schoolMasterFormReq.address = data.param8;
    this.schoolMasterFormReq.cityid = data.param9;
    this.schoolMasterFormReq.stateid = data.param10;
    this.schoolMasterFormReq.pincode = data.param13;
    this.schoolMasterFormReq.latitude = data.param11 == '0.00000' ? '' : data.param11;
    this.schoolMasterFormReq.longitude = data.param12 == '0.00000' ? '' : data.param12;
    this.schoolMasterFormReq.remarks = data.param11;

    // Set state and city objects for ng-select
    this.stateList.forEach(element => {
      if(element.param1 === data.param10) {
        this.stateObj = element;
      }
    });
    this.loadCityList(data.param10); // Load cities for the selected state
    this.cityObj = { param1: data.param13, param2: '' }; // Assuming param2 is the city name, you can adjust accordingly
    this.updateFlag = true;
    this.schoolDetailsRequest.param1 = data.param1;
    this.schoolDetailsRequest.param2 = data.param2;
    this.schoolDetailsRequest.param3 = data.param3;
    this.schoolDetailsRequest.param4 = data.param4;
  }

  onSubmit(masterForm: NgForm) {
    if (masterForm.valid) {
      this.schoolMasterFormReq.stateid = this.stateObj ? this.stateObj.param1 : '';
      this.schoolMasterFormReq.cityid = this.cityObj ? this.cityObj.param1 : '';
      this.schoolMasterFormReq.latitude == null ? this.schoolMasterFormReq.latitude = '' : this.schoolMasterFormReq.latitude;
      this.schoolMasterFormReq.longitude == null ? this.schoolMasterFormReq.longitude = '' : this.schoolMasterFormReq.longitude;
      if(!this.updateFlag) {
        // Call insert API
        this.toastService.show('Insert functionality is not implemented yet.', 'info');
        this.insertDetails();
      } else {
        // Call update API
        this.toastService.show('Update functionality is not implemented yet.', 'info');
        this.updateDetails();
      }
    }
  }
  insertDetails() {
    this.schoolService.insertSchoolDetails(this.schoolMasterFormReq).subscribe({
      next: (response: any) => {
        if (response.statuscode == 200) {
          this.toastService.show('School details inserted successfully.', 'success');
          this.resetForm();
          this.getDetails('reload');
        } else {
          this.toastService.show(response.message, 'error');
        }
      },
      error: (error) => {
        console.log(error);
        this.toastService.show('An error occurred while inserting school details.', 'error');
      }
    });
  }
  updateDetails() {
    this.schoolService.updateSchoolDetails(this.schoolMasterFormReq).subscribe({
      next: (response: any) => {
        if (response.statuscode == 200) {
          this.toastService.show('School details updated successfully.', 'success');
          this.resetForm();
          this.getDetails('reload');
        } else {
          this.toastService.show(response.message, 'error');
        }
      },
      error: (error) => {
        console.log(error);
        this.toastService.show('An error occurred while updating school details.', 'error');
      }
    });
  }
  deleteDetails() {
    if(this.deleteForm.valid) {
      this.schoolService.deleteSchoolDetails(this.deleteSchoolMasterReq).subscribe({
        next: (response: any) => {
          if (response.statuscode == 200) {
            this.resetForm();
            setTimeout(() => {
              this.closeDeleteModal();
              this.getDetails('reload');

            }, 500);
            this.toastService.show('School details deleted successfully.', 'success');
          } else {
            this.toastService.show(response.message, 'error');
          }
        },
        error: (error) => {
          console.log(error);
          this.toastService.show('An error occurred while deleting school details.', 'error');
        }
      });
    }
  }
  resetForm() {
    try {
      this.masterForm.resetForm();
    } catch (error) {}
    try {
      this.deleteForm.resetForm();
    } catch (error) {
      
    } 
    this.updateFlag = false;
    this.schoolDetailsRequest = new SchoolMasterDetailsReq();
    this.deleteSchoolMasterReq = new SchoolMasterDeleteReq();
  }
  openDeleteModal(data: SchoolMasterDetailsResp) {
    this.deleteSchoolMasterReq.schoolid = data.param2;
    this.deleteSchoolMasterReq.remarks = '';
    this.toastService.openModal('deleteModal');
  }
  closeDeleteModal() {
    this.toastService.closeModal('deleteModal');
  }
  confirmDelete() {
    this.deleteDetails();    
  }



  onPageSizeChange(event: any) {
    this.schoolDetailsRequest.param3 = Number(event);
    this.getDetails('pageSize');
  }

  openLatLongModal() {
    this.toastService.openModal('latLongModal');
    this.mapService.initializeMap('mapContainer');
  }
}
