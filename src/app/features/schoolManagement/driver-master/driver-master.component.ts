
import { Component, OnDestroy, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../../core/services/toast.service';
import { SchoolManagementService } from '../../../core/services/school-management.service';
import { DriverMasterDeleteReq, DriverMasterDetailsReq, DriverMasterFormReq } from '../../../core/model/request.model';
import { DriverMasterDetailsResp } from '../../../core/model/response.model';
import { ValidationsService } from '../../../core/services/validations.service';
import { CommonFileUploadRequest, OperationService } from '../../../core/services/operation.service';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';

@Component({
    selector: 'app-driver-master',
    imports: [FormsModule, NgSelectModule, NgbPaginationModule, CommonTableComponent],
    templateUrl: './driver-master.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './driver-master.component.scss'
})
export class DriverMasterComponent implements OnInit, OnDestroy {

  roleId: any = '';
  pageSize: any = 10;
  searchText: any = '';
  loading: any = false;
  pageSizeOptions: any = [10, 25, 50, 100];
  totalCount: any = 0;
  pageCount: any = 0;
  detailData: DriverMasterDetailsResp[] = [];
  readonly tableColumns: CommonTableColumn<DriverMasterDetailsResp>[] = [
    { key: 'rowNumber', label: '#', width: '25px' },
    { key: 'param3', label: 'Staff Name', value: data => data.param3 },
    { key: 'param4', label: 'Mobile No.', value: data => data.param4 },
    { key: 'param5', label: 'Address', value: data => data.param5 },
    { key: 'param9', label: 'City', value: data => data.param9 },
    { key: 'param10', label: 'Pincode', value: data => data.param10 },
    { key: 'param11', label: 'Licence Number', value: data => data.param11 },
    { key: 'param12', label: 'Aadhar Number', value: data => data.param12 },
    { key: 'actions', label: 'Action', width: '90px', className: 'text-center' }
  ];
  detailsToggle: boolean = true;
  updateFlag: boolean = false;
  cityObj: any = null;
  cityList: any[] = [];
  stateObj: any= null;
  stateList: any[]=[]
  driverDetailsRequest: DriverMasterDetailsReq = new DriverMasterDetailsReq();
  masterFormReq: DriverMasterFormReq = new DriverMasterFormReq();
  deleteDriverMasterReq: DriverMasterDeleteReq = new DriverMasterDeleteReq();
  @ViewChild('masterForm') masterForm!: NgForm;
  @ViewChild('deleteForm') deleteForm!: NgForm;
  licenceFileName: string = '';
  aadharFileName: string = '';
  selectedDriverName: string = '';
  licenceUploadStatus: string = '';
  aadharUploadStatus: string = '';

  constructor(public toastService: ToastService, public schoolService: SchoolManagementService, public vs: ValidationsService, public operationService: OperationService) {
    this.toastService.pageName = 'Driver Master';
    this.roleId = sessionStorage.getItem('roleId');
  }

  ngOnInit(): void {
    this.loadStateList();
    this.getDetails('reload')
  }
  ngOnDestroy(): void {}

  private matchesParam(value: any, target: any): boolean {
    return String(value ?? '').trim() === String(target ?? '').trim();
  }

  toggleDetails() {
    this.detailsToggle = !this.detailsToggle;
    if (!this.detailsToggle) {
      setTimeout(() => {
        this.resetForm();
      }, 300);
    }
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
  onStateChange() {
    if (this.stateObj && this.stateObj.param1) {
      this.loadCityList(this.stateObj.param1);
    } else {
      this.cityList = [];
      this.cityObj = null;
    }
  }
  loadCityList(stateId?: any) {
    this.schoolService.getCityList(stateId).subscribe({
      next: (response: any) => {
        if (response.statuscode == 200) {
          this.cityList = response.entity || [];
          if(this.updateFlag && this.masterFormReq.cityid) {
            this.cityObj = this.cityList.find(city => this.matchesParam(city.param1, this.masterFormReq.cityid)) || null;
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

  getDetails(type: string) {
    if(type === 'search') {
      this.pageSize = 10;
    }
    if(type === 'pageSize') {
      this.searchText = '';
    }
    if(type === 'reload') {
      this.searchText = '';
      this.pageSize = 10;
    }
    if(type === 'pageChange') {
      this.loading = true;
    }

    this.schoolService.getDriverDetails(this.driverDetailsRequest).subscribe({
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
      },
      error: (error) => {
        this.loading = false;
        console.log(error);
        this.toastService.show('An error occurred while fetching driver details.', 'error');
      }
    });
  }

  setData(data: DriverMasterDetailsResp, type: 'edit' | 'delete') {
    if (type === 'delete') {
      this.deleteDriverMasterReq.driverid = data.param2 || data.param1;
      this.deleteDriverMasterReq.remarks = '';
      this.selectedDriverName = data.param3 || '';
      this.toastService.openModal('deleteModal');
      return;
    }

    this.updateFlag = true;
    this.detailsToggle = false;
    this.selectedDriverName = data.param3 || '';

    this.masterFormReq.driverid = data.param2 || '';
    this.masterFormReq.drivername = data.param3 || '';
    this.masterFormReq.drivermobileno = data.param4 || '';
    this.masterFormReq.address = data.param5 || '';
    this.masterFormReq.stateid = data.param6 || '';
    this.masterFormReq.cityid = data.param8 || '';
    this.masterFormReq.pincode = data.param10 || '';
    this.masterFormReq.licenceno = data.param11 || '';
    this.masterFormReq.aadharno = data.param12 || '';
    this.masterFormReq.licencefileid = data.param13 || '';
    this.masterFormReq.aadharfileid = data.param14 || '';

    const stateId = data.param6 || '';
    this.stateObj = this.stateList.find(state => this.matchesParam(state.param1, stateId)) || null;
    if (this.stateObj?.param1) {
      this.loadCityList(this.stateObj.param1);
    } else {
      this.cityList = [];
      this.cityObj = null;
    }

    
  }
  uppercaseText() {
    if (this.masterFormReq.licenceno) {
      this.masterFormReq.licenceno = this.masterFormReq.licenceno.toUpperCase();
    }
  }
  

  onSubmit(masterForm: NgForm) {
    if (masterForm.valid) {
      this.masterFormReq.stateid = this.stateObj ? this.stateObj.param1 : "";
      this.masterFormReq.cityid = this.cityObj ? this.cityObj.param1 : "";
      this.masterFormReq.licencefileid = this.masterFormReq.licencefileid || '';
      this.masterFormReq.aadharfileid = this.masterFormReq.aadharfileid || '';  
      if(!this.updateFlag) {
        // Call insert API
        this.insertDetails();
      } else {
        // Call update API
        this.updateDetails();
      }
    }
  }
  insertDetails() {
    this.schoolService.insertDriverDetails(this.masterFormReq).subscribe({
      next: (response: any) => {
        if (response.statuscode == 200) {
          this.toastService.show('Driver details inserted successfully.', 'success');
          this.resetForm();
          this.getDetails('reload');
        } else {
          this.toastService.show(response.message, 'error');
        }
      },
      error: (error) => {
        console.log(error);
        this.toastService.show('An error occurred while inserting driver details.', 'error');
      }
    });
  }

  updateDetails() {
    this.schoolService.updateDriverDetails(this.masterFormReq).subscribe({
      next: (response: any) => {
        if (response.statuscode == 200) {
          this.toastService.show('Driver details updated successfully.', 'success');
          this.resetForm();
          this.getDetails('reload');
        } else {
          this.toastService.show(response.message, 'error');
        }
      },
      error: (error) => {
        console.log(error);
        this.toastService.show('An error occurred while updating driver details.', 'error');
      }
    });
  }
  
  deleteDetails(data: DriverMasterDetailsResp) {
    if(this.deleteForm.valid) {
      this.deleteDriverMasterReq.driverid = data.param1;
      this.schoolService.deleteDriverDetails(this.deleteDriverMasterReq).subscribe({
        next: (response: any) => {
          if (response.statuscode == 200) {
            this.toastService.show('Driver details deleted successfully.', 'success');
            this.resetForm();
            this.getDetails('reload');
          } else {
            this.toastService.show(response.message, 'error');
          }
        },
        error: (error) => {
          console.log(error);
          this.toastService.show('An error occurred while deleting driver details.', 'error');
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
    } catch (error) {}
    this.updateFlag = false;
    this.driverDetailsRequest = new DriverMasterDetailsReq();
    this.masterFormReq = new DriverMasterFormReq();
    this.deleteDriverMasterReq = new DriverMasterDeleteReq();
    this.stateObj = null;
    this.cityObj = null;
    this.cityList = [];
    this.selectedDriverName = '';
    this.licenceFileName = '';
    this.aadharFileName = '';
    this.licenceUploadStatus = '';
    this.aadharUploadStatus = '';
    this.isAdhaarUploaded = false;
    this.isLicenceUpload = false;  
  }
  openDeleteModal(data: DriverMasterDetailsResp) {
    this.deleteDriverMasterReq.driverid = data.param2 || data.param1;
    this.deleteDriverMasterReq.remarks = '';
    this.selectedDriverName = data.param3 || '';
    this.toastService.openModal('deleteModal');
  }
  closeDeleteModal() {
    this.toastService.closeModal('deleteModal');
  }
  confirmDelete() {
    if (this.deleteForm?.valid) {
      this.schoolService.deleteDriverDetails(this.deleteDriverMasterReq).subscribe({
        next: (response: any) => {
          if (response.statuscode == 200) {
            this.toastService.show('Driver details deleted successfully.', 'success');
            this.closeDeleteModal();
            this.resetForm();
            this.getDetails('reload');
          } else {
            this.toastService.show(response.message, 'error');
          }
        },
        error: (error) => {
          console.log(error);
          this.toastService.show('An error occurred while deleting driver details.', 'error');
        }
      });
    }
  }
  licenceFile: any;
  onLicenceFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      // this.licenceFileName = file.name;
      // this.masterFormReq.licencefile = file.name;
       const input = event.target as HTMLInputElement;

      if (input.files && input.files.length > 0) {
          const file = input.files[0];
          // Check file size (5 MB)
          const maxSize = 5 * 1024 * 1024; // 5 MB

          // Check PDF
          if (file.type !== 'application/pdf') {
            this.toastService.show('Please select a PDF file only.','error');
            input.value = ''; // Clear selected file
            this.licenceFile = null;
            return;
          } else
            if (file.size > maxSize) {
            this.toastService.show('File size should not exceed 5 MB.','error');
            input.value = '';
            this.licenceFile = null;
            return;
          } else {
            // Valid file
            this.licenceFile = file;
            // this.validateForm();
          }
      }
    }
  }
  adhaarFile: any;
  onAadharFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      // this.aadharFileName = file.name;
      // this.masterFormReq.aadharfile = file.name;
      const input = event.target as HTMLInputElement;

      if (input.files && input.files.length > 0) {
          const file = input.files[0];
          // Check file size (5 MB)
          const maxSize = 5 * 1024 * 1024; // 5 MB

          // Check PDF
          if (file.type !== 'application/pdf' && file.type == '') {
            this.toastService.show('Please select a PDF file only.','error');
            input.value = ''; // Clear selected file
            this.adhaarFile = null;
            return;
          } else
            if (file.size > maxSize) {
            this.toastService.show('File size should not exceed 5 MB.','error');
            input.value = '';
            this.adhaarFile = null;
            return;
          } else {
            // Valid file
            this.adhaarFile = file;
            // this.validateForm();
          }
      }
    }
  }
  onFileSelected(event: any, type: any) {
    const file = event.target.files?.[0];
    if (file) {
      const input = event.target as HTMLInputElement;
      const maxSize = 5 * 1024 * 1024; // 5 MB

      if (type === 'licence') {
        this.licenceFileName = file.name;
        this.licenceUploadStatus = 'Uploading...';
      }
      if (type === 'adhaar') {
        this.aadharFileName = file.name;
        this.aadharUploadStatus = 'Uploading...';
      }

      if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
        this.toastService.show('Only PDF or image files are allowed', 'error');
        if (type === 'licence') {
          this.licenceFileName = '';
          this.licenceUploadStatus = '';
        }
        if (type === 'adhaar') {
          this.aadharFileName = '';
          this.aadharUploadStatus = '';
        }
        return;
      }
      if (file.size > maxSize) {
        this.toastService.show('File size should not exceed 5 MB.','error');
        input.value = '';
        if (type === 'licence') {
          this.licenceFileName = '';
          this.licenceUploadStatus = '';
        }
        if (type === 'adhaar') {
          this.aadharFileName = '';
          this.aadharUploadStatus = '';
        }
        return;
      }
      this.commonFileUpload(file, type);
    }
  }
  isAdhaarUploaded:boolean = false;
  isLicenceUpload: boolean = false;
  commonFileUpload(file: any, type: string) {
    const headerkey: any = sessionStorage.getItem('principalKey');
    // Optional FormData
    const formData = new FormData();

    formData.append('filetype', 'firmware');
    formData.append('fileextension', file.type);
    formData.append('file', file);
    formData.append('filepath', '');
    formData.append('headerkey', headerkey);
    this.operationService.commonFileUpload(formData).subscribe({
      next: (response: any) => {
        if(response.statuscode==200) {
          if(type=='adhaar') {
            this.masterFormReq.aadharfileid = response.fileid;
            this.isAdhaarUploaded = true;
            this.aadharUploadStatus = 'Uploaded successfully';
          }
          if(type=='licence') {
            this.isLicenceUpload = true;
            this.masterFormReq.licencefileid = response.fileid;
            this.licenceUploadStatus = 'Uploaded successfully';
          }
        } else {
          if(type=='adhaar') {
            this.masterFormReq.aadharfileid = '';
            this.isAdhaarUploaded = false;
            this.aadharUploadStatus = 'Upload failed';
          }
          if(type=='licence') {
            this.masterFormReq.licencefileid = '';
            this.isLicenceUpload = false;
            this.licenceUploadStatus = 'Upload failed';
          }
        }
      },
      error: (error: any) => {
        console.log(error);
        if(type=='adhaar') {
          this.masterFormReq.aadharfileid = '';
          this.isAdhaarUploaded = false;
          this.aadharUploadStatus = 'Upload failed';
        }
        if(type=='licence') {
          this.masterFormReq.licencefileid = '';
          this.isLicenceUpload = false;
          this.licenceUploadStatus = 'Upload failed';
        }
      }
    });
  }
  

  getSearchDetails() {
    this.getDetails('search');
  }
  reloadData() {
    this.getDetails('reload');
  }
  onPageSizeChange(arg0: any) {
    this.getDetails('pageSize');
  }
}
