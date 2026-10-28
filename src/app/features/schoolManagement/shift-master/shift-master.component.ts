import { Component, ViewChild, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule, NgForm } from '@angular/forms';
import { OnInit, OnDestroy } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { ToastService } from '../../../core/services/toast.service';
import { ShiftMasterDeleteReq, ShiftMasterDetailsReq, ShiftMasterFormReq } from '../../../core/model/request.model';
import { SchoolManagementService } from '../../../core/services/school-management.service';
import { ShiftMasterDetailsResp } from '../../../core/model/response.model';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';

@Component({
    selector: 'app-shift-master',
    imports: [FormsModule, NgSelectModule, CommonTableComponent],
    templateUrl: './shift-master.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './shift-master.component.scss'
})
export class ShiftMasterComponent implements OnInit, OnDestroy {
  detailsToggle: boolean = true;
  pageCount: any = 0;
  pageSize: any = 10;
  pageSizeOptions: any = [10, 20, 50, 100];
  searchText: any = '';
  totalCount: any = 0;
  detailData: any[] = [];
  readonly tableColumns: CommonTableColumn<any>[] = [
    { key: 'param1', label: '#', width: '25px', value: data => data.param1 },
    { key: 'param3', label: 'School Name', width: '150px', value: data => data.param3 },
    { key: 'param5', label: 'Shift Name', width: '150px', value: data => data.param5 },
    { key: 'param6', label: 'Start Time', width: '150px', value: data => data.param6 },
    { key: 'param7', label: 'End Time', width: '150px', value: data => data.param7 },
    { key: 'actions', label: 'Action', width: '80px', className: 'text-center' }
  ];
  loading: boolean = false;
  updateFlag: boolean = false;
  shiftDetailsRequest:ShiftMasterDetailsReq =  new ShiftMasterDetailsReq(); // Assuming this is defined elsewhere in the code
  shift: ShiftMasterFormReq = new ShiftMasterFormReq();
  deleteShiftMasterReq: ShiftMasterDeleteReq = new ShiftMasterDeleteReq();
  isEditMode: boolean = false;
  schoolObj: any = null;
  schoolList: any[] = []; // Assuming this is populated elsewhere in the code
  @ViewChild('masterForm') masterForm!: NgForm;
  @ViewChild('deleteForm') deleteForm!: NgForm;
  constructor(public toastService: ToastService, public schoolService: SchoolManagementService) {}
  ngOnInit(): void {
    this.toastService.pageName = 'Shift Master';
    this.loadSchoolList();
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
      error: (error: any) => { }
    });
  }
  openShiftModal(isEdit: boolean, shiftData?: any) {
    
    this.isEditMode = isEdit;
    if (isEdit && shiftData) {
      this.shift = { ...shiftData }; // Populate the form with existing data for editing
      this.schoolObj = { id: shiftData.schoolId, name: shiftData.schoolName };
    } else {
      this.shift = new ShiftMasterFormReq(); // Reset the form for adding a new shift
      this.schoolObj = null;
    }
    this.toastService.openModal('shiftModal'); // Assuming you have a method to open the modal
    // Logic to open the modal (e.g., using Bootstrap's modal methods)
  }
  closeShiftModal() {
    this.updateFlag = false;
    this.isEditMode = false;
    this.masterForm.resetForm();
    
  }
  
  resetForm() {
    this.shift = new ShiftMasterFormReq();
    this.isEditMode =false;
    this.masterForm.resetForm();
    this.updateFlag = false;
    this.schoolObj = null;
  }


  toggleDetails() {
    this.detailsToggle = !this.detailsToggle;
  }
  getDetails(type: string) {
    if(type === 'search') {
      this.shiftDetailsRequest.param2 = 1;
      this.shiftDetailsRequest.param3 = 10;
    }
    if(type === 'pageSize') {
       this.shiftDetailsRequest.param2 = 1;
      this.shiftDetailsRequest.param1 = '';
    }
    if(type === 'reload') {
      this.searchText = '';
      this.shiftDetailsRequest.param1 = '';
      this.shiftDetailsRequest.param2 = 1;
      this.shiftDetailsRequest.param3 = 10;
    }
    if(type === 'pageChange') {
      this.loading = true;
    }

    this.schoolService.getShiftDetails(this.shiftDetailsRequest).subscribe({
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
      error: (error: any) => {
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
    this.shiftDetailsRequest.param2 = page;
    this.getDetails('pageChange');
  }
  onSubmit(masterForm: NgForm) {
      if (masterForm.valid) {
        this.shift.schoolid = this.schoolObj ? this.schoolObj.param1 : '';
        if(!this.updateFlag) {
          // Call insert API
          this.insertDetails();
        } else {
          // Call update API
          this.updateDetails();
        }
      } else {
        this.toastService.show('All fields are required');
      }
    }
  
    insertDetails() {
      this.schoolService.insertShiftDetails(this.shift).subscribe({
        next: (response: any) => {
          if (response.statuscode == 200) {
            this.toastService.show('Shift details inserted successfully.', 'success');
            this.resetForm();
            this.getDetails('reload');
             this.toastService.closeModal('shiftModal'); 
          } else {
            this.toastService.show(response.message, 'error');
          }
        },
        error: (error: any) => {
          console.log(error);
          this.toastService.show('An error occurred while inserting student details.', 'error');
        }
      });
    }
    updateDetails() {
      this.schoolService.updateShiftDetails(this.shift).subscribe({
        next: (response: any) => {
          if (response.statuscode == 200) {
            this.toastService.show('Shift details updated successfully.', 'success');
            this.resetForm();
            this.getDetails('reload');
             this.toastService.closeModal('shiftModal'); 
          } else {
            this.toastService.show(response.message, 'error');
          }
        },
        error: (error:any) => {
          console.log(error);
          this.toastService.show('An error occurred while updating student details.', 'error');
        }
      });
    }
  
    deleteDetails() {
      if(this.deleteForm.valid) {
        this.schoolService.deleteShiftDetails(this.deleteShiftMasterReq).subscribe({
          next: (response: any) => {
            if (response.statuscode == 200) {
              this.resetForm();
              setTimeout(() => {
                this.closeDeleteModal();
                this.getDetails('reload');
  
              }, 500);
              this.toastService.show('Shift details deleted successfully.', 'success');
            } else {
              this.toastService.show(response.message, 'error');
            }
          },
          error: (error:any) => {
            console.log(error);
            this.toastService.show('An error occurred while deleting student details.', 'error');
          }
        });
      }
    }

    openDeleteModal(data: ShiftMasterDetailsResp) {
        this.deleteShiftMasterReq.shiftid = data.param2;
        this.deleteShiftMasterReq.remarks = '';
        this.toastService.openModal('deleteModal');
      }
      closeDeleteModal() {
        this.toastService.closeModal('deleteModal');
      }
      confirmDelete() {
        this.deleteDetails();    
      }
      onPageSizeChange(event: any) {
        this.shiftDetailsRequest.param3 = Number(event);
        this.getDetails('pageSize');
      }

      setData(data: ShiftMasterDetailsResp, type: any) {
        if(type=='delete') {
          this.deleteShiftMasterReq.shiftid = data.param4;
          this.toastService.openModal('deleteModal');
        }
        if(type=='edit') {
          this.updateFlag = true;
          this.isEditMode = true;
          this.schoolList.forEach(element => {
            if(element.param1==data.param2) {
              this.schoolObj = element;
            }
          });
          this.shift.shiftid = data.param4;
          this.shift.shiftname = data.param5;
          this.shift.fromtime = data.param6;
          this.shift.totime = data.param7;
        }

      }


}
