import { CommonModule } from '@angular/common';
import { Component, OnDestroy, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { OnInit } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';
import { SchoolManagementService } from '../../../core/services/school-management.service';
import { MapboxService } from '../../../core/services/mapbox.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { StudentMasterDeleteReq, StudentMasterDetailsReq, StudentMasterFormReq } from '../../../core/model/request.model';
import { StudentMasterDetailsResp } from '../../../core/model/response.model';
import { ValidationsService } from '../../../core/services/validations.service';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';

@Component({
    selector: 'app-student-master',
    imports: [
        CommonModule,
        FormsModule,
        NgSelectModule,
        NgbPaginationModule,
        CommonTableComponent
    ],
    templateUrl: './student-master.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './student-master.component.scss'
})
export class StudentMasterComponent implements OnInit, OnDestroy {

  roleId: any = '';
  pageSize: any = 10;
  searchText: any = '';
  loading: any = false;
  pageSizeOptions: any = [10, 25, 50, 100];
  totalCount: any = 0;
  pageCount: any = 0;
  detailData: StudentMasterDetailsResp[] = [];
  readonly tableColumns: CommonTableColumn<StudentMasterDetailsResp>[] = [
    { key: 'student-index', label: '#', width: '25px' },
    { key: 'school', label: 'School Name', width: '150px' },
    { key: 'student', label: 'Student Name', width: '150px' },
    { key: 'standard', label: 'Standard', width: '150px' },
    { key: 'guardian-type', label: 'Guardian Type', width: '150px' },
    { key: 'guardian-name', label: 'Guardian Name', width: '150px' },
    { key: 'alternate-number', label: 'Alternate Number', width: '150px' },
    { key: 'address', label: 'Address', width: '150px' },
    { key: 'state', label: 'State', width: '150px' },
    { key: 'city', label: 'City', width: '150px' },
    { key: 'pincode', label: 'Pincode', width: '150px' },
    { key: 'contact-person', label: 'Contact Person', width: '150px' },
    { key: 'email', label: 'Email', width: '150px' },
    { key: 'location', label: 'Location', width: '150px' },
    { key: 'actions', label: 'Action', width: '150px' }
  ];
  detailsToggle: boolean = true;
  updateFlag: boolean = false;
  stateObj: any = null;
  stateList: any[] = [];
  cityObj: any = null;
  cityList: any[] = [];
  studentDetailsRequest: StudentMasterDetailsReq = new StudentMasterDetailsReq();
  masterFormReq: StudentMasterFormReq = new StudentMasterFormReq();
  deleteStudentMasterReq: StudentMasterDeleteReq = new StudentMasterDeleteReq(); // Assuming delete request has only one parameter for school ID
  @ViewChild('masterForm') masterForm!: NgForm;
  @ViewChild('deleteForm') deleteForm!: NgForm;
  guardianList: any[] = [
    { id: '1', name: 'Father' },
    { id: '2', name: 'Mother' },
    { id: '3', name: 'Guardian' }
  ];
  guardianObj: any = null;
  standardList: any[] = [
    { id: '1', name: '1st Standard' },
    { id: '2', name: '2nd Standard' },
    { id: '3', name: '3rd Standard' },
    { id: '4', name: '4th Standard' },
    { id: '5', name: '5th Standard' },
    { id: '6', name: '6th Standard' },
    { id: '7', name: '7th Standard' },
    { id: '8', name: '8th Standard' },
    { id: '9', name: '9th Standard' },
    { id: '10', name: '10th Standard' }
  ];
  standardObj: any = null;
  schoolList: any[] = [];
  schoolObj: any = null;
  constructor(public toastService: ToastService, 
    public schoolService: SchoolManagementService, 
    public mapService: MapboxService, public vs: ValidationsService) {
    this.toastService.pageName = 'Student Master';
    this.roleId = sessionStorage.getItem('roleId');
  }
  
  ngOnInit(): void {
    this.loadStateList();
    this.getDetails('reload');
  }
  ngOnDestroy(): void {
  }

  loadSchoolList() {
    this.schoolService.getSchoolList().subscribe({
      next: (response: any) => {
        if(response.statuscode==200) {
          this.schoolList = response.entity || [];
        } else {
          this.schoolList = []
        }
      },
      error: (error: any) => {

      }
    });
  }
  loadGuardianTypeList() {
    this.schoolService.getGuardianTypeList().subscribe({
      next: (response: any) => {
        if(response.statuscode==200) {
          this.guardianList = response.entity || [];
        } else {
          this.guardianList = []
        }
      },
      error: (error: any) => {

      }
    });
  }
  loadStandardList() {
    this.schoolService.getSchoolClassList().subscribe({
      next: (response: any) => {
        if(response.statuscode==200) {
          this.standardList = response.entity || [];
        } else {
          this.standardList = []
        }
      },
      error: (error: any) => {
        
      }
    });
  }
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
  loadCityList(stateId?: any) {
    this.schoolService.getCityList(stateId).subscribe({
      next: (response: any) => {
        if (response.statuscode == 200) {
          this.cityList = response.entity || [];
          if(this.updateFlag && this.masterFormReq.cityid) {
            this.cityObj = this.cityList.find(city => city.param1 === this.masterFormReq.cityid) || null;
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
    // if (this.masterFormReq.schoolcode) {
    //   this.masterFormReq.schoolcode = this.masterFormReq.schoolcode.toUpperCase();
    // }
    // console.log('School code after toggle:', this.masterFormReq.schoolcode);
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
      this.loadSchoolList();
      this.loadGuardianTypeList();
      this.loadStandardList();
      setTimeout(() => {
        this.resetForm();
      }, 300);
    }
  }
  
  getDetails(type: string) {
    if(type === 'search') {
      this.studentDetailsRequest.param2 = 1;
      this.studentDetailsRequest.param3 = 10;
    }
    if(type === 'pageSize') {
       this.studentDetailsRequest.param2 = 1;
      this.studentDetailsRequest.param1 = '';
    }
    if(type === 'reload') {
      this.searchText = '';
      this.studentDetailsRequest.param1 = '';
      this.studentDetailsRequest.param2 = 1;
      this.studentDetailsRequest.param3 = 10;
    }
    if(type === 'pageChange') {
      this.loading = true;
    }

    this.schoolService.getStudentDetails(this.studentDetailsRequest).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response.statuscode == 200) {
          this.detailData = response.entity?.listData || [];
          this.totalCount = response.entity?.param1 || 0;
          this.pageCount = Math.ceil(this.totalCount / this.pageSize);
        } else {
          // this.toastService.show(response.message, 'error');
          this.detailData = [];
          this.totalCount = 0;
          this.pageCount = 0;
        }
         this.updatePageSizeOptions();
      },
      error: (error) => {
        this.loading = false;
        this.toastService.show('An error occurred while fetching student details.', 'error');
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
    this.studentDetailsRequest.param2 = page;
    this.getDetails('pageChange');
  }
  setData(data: StudentMasterDetailsResp, type: string) {
    if(type=='delete') {
      this.updateFlag = true;
      this.toastService.openModal('deleteModal');
      this.deleteStudentMasterReq.studentid = data.param2;
      this.deleteStudentMasterReq.remarks = '';
    } else 
    if(type=='edit') {
      this.masterFormReq.studentid = data.param2;
      this.schoolList.forEach((item)=> {
        if(item.param1  ==  data.param3) {
          this.schoolObj = item;
        }
      });
      this.guardianList.forEach((item)=> {
        if(item.param1  ==  data.param7) {
          this.guardianObj = item;
        }
      });
      this.masterFormReq.cityid = data.param16;
      this.stateList.forEach((item)=> {
        if(item.param1  ==  data.param14) {
          this.stateObj = item;
          this.loadCityList(data.param16);
        }
      });
      this.masterFormReq.studentname=data.param2;
      this.masterFormReq.guardianname = data.param9;
      this.masterFormReq.emailid = data.param10;
      this.masterFormReq.mobileno = data.param11;
      this.masterFormReq.altmobileno = data.param12;
      this.masterFormReq.address = data.param13;
    }

    this.detailsToggle = false;
  }

  onSubmit(masterForm: NgForm) {
    if (masterForm.valid) {
      this.masterFormReq.stateid = this.stateObj ? this.stateObj.param1 : '';
      this.masterFormReq.cityid = this.cityObj ? this.cityObj.param1 : '';
      this.masterFormReq.standardid = this.standardObj ? this.standardObj.param1 : '';
      this.masterFormReq.guardiantypeid = this.guardianObj ? this.guardianObj.param1 : '';
      this.masterFormReq.schoolid = this.schoolObj ? this.schoolObj.param1 : '';
      this.masterFormReq.latitude == null ? this.masterFormReq.latitude = '' : this.masterFormReq.latitude;
      this.masterFormReq.longitude == null ? this.masterFormReq.longitude = '' : this.masterFormReq.longitude;
      if(!this.updateFlag) {
        // Call insert API
        // this.toastService.show('Insert functionality is not implemented yet.', 'info');
        this.insertDetails();
      } else {
        // Call update API
        // this.toastService.show('Update functionality is not implemented yet.', 'info');
        this.updateDetails();
      }
    }
  }

  insertDetails() {
    this.schoolService.insertStudentDetails(this.masterFormReq).subscribe({
      next: (response: any) => {
        if (response.statuscode == 200) {
          this.toastService.show('Student details inserted successfully.', 'success');
          this.resetForm();
          this.getDetails('reload');
        } else {
          this.toastService.show(response.message, 'error');
        }
      },
      error: (error) => {
        console.log(error);
        this.toastService.show('An error occurred while inserting student details.', 'error');
      }
    });
  }
  updateDetails() {
    this.schoolService.updateStudentDetails(this.masterFormReq).subscribe({
      next: (response: any) => {
        if (response.statuscode == 200) {
          this.toastService.show('Student details updated successfully.', 'success');
          this.resetForm();
          this.getDetails('reload');
        } else {
          this.toastService.show(response.message, 'error');
        }
      },
      error: (error) => {
        console.log(error);
        this.toastService.show('An error occurred while updating student details.', 'error');
      }
    });
  }

  deleteDetails() {
    if(this.deleteForm.valid) {
      this.schoolService.deleteStudentDetails(this.deleteStudentMasterReq).subscribe({
        next: (response: any) => {
          if (response.statuscode == 200) {
            this.resetForm();
            setTimeout(() => {
              this.closeDeleteModal();
              this.getDetails('reload');

            }, 500);
            this.toastService.show('Student details deleted successfully.', 'success');
          } else {
            this.toastService.show(response.message, 'error');
          }
        },
        error: (error) => {
          console.log(error);
          this.toastService.show('An error occurred while deleting student details.', 'error');
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
    this.studentDetailsRequest = new StudentMasterDetailsReq();
    this.deleteStudentMasterReq = new StudentMasterDeleteReq();
  }
  openDeleteModal(data: StudentMasterDetailsResp) {
    this.deleteStudentMasterReq.studentid = data.param2;
    this.deleteStudentMasterReq.remarks = '';
    this.toastService.openModal('deleteModal');
  }
  closeDeleteModal() {
    this.toastService.closeModal('deleteModal');
  }
  confirmDelete() {
    this.deleteDetails();    
  }
  onPageSizeChange(event: any) {
    this.studentDetailsRequest.param3 = Number(event);
    this.getDetails('pageSize');
  }

  openLatLongModal() {
    this.toastService.openModal('latLongModal');
    this.mapService.initializeMap('mapContainer');
  }
}