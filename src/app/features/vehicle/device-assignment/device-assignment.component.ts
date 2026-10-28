
import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { AuthService } from '../../../core/services/auth.service';
import { DeviceService } from '../../../core/services/device.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
    selector: 'app-device-assignment',
    imports: [FormsModule, NgSelectModule],
    templateUrl: './device-assignment.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './device-assignment.component.scss'
})
export class DeviceAssignmentComponent implements OnInit, AfterViewInit, OnDestroy {
  loading:boolean = false;
  selectedUser: any = null;
  userList: any[] = [];
  selectedDevice: any = null;
  deviceData: any[] = [];
  dropDownName: string = 'Select Dealer';
  roleId: any = "";
  msgType: any = 'error';
  errorMessage: string = '';
  assignmentList: any[] = [{ param1: 'Dealer', param2: 'Dealer' }, { param1: 'Distributor', param2: 'Distributor' }];
  selectedAssignmentType: any = null;

  constructor(private apiService: AuthService, public deviceService: DeviceService, private toast: ToastService) {
    this.toast.pageName = 'Device Assign To Dealer/Distributor'; // Set page name for toast service
    
    this.roleId = sessionStorage.getItem('roleid') || "";
    if(this.roleId == '11') {
      this.dropDownName = 'Select Distributor';   
    }
    if(this.roleId == '12') {
      this.dropDownName = 'Select Dealer';
    }
    this.getUserList()
  }

  ngOnInit() {
    // Initialization logic here
  }

  ngAfterViewInit() {
    // Logic to run after the view has been initialized
  }

  ngOnDestroy() {
    // Cleanup logic here
  }
  onAssignmentTypeChange(event: any) {
    //console.log('Selected Assignment Type:', event);
    this.selectedUser = null;
    this.userList = [];
    if (event.param1.toLowerCase() === 'dealer') {
      this.dropDownName = 'Select Dealer';
    } else if (event.param1.toLowerCase() === 'distributor') {
      this.dropDownName = 'Select Distributor';
    }
    this.getUserList();
  }
  getUserList() {
    if(this.dropDownName == 'Select Distributor') {
      // Fetch distributor list
      this.deviceService.getDistributorList({vendorid: ""}).subscribe((response: any) => {
        if (response.statuscode== 200) {
          this.userList = response.entity;
        }
      });
    } else if(this.dropDownName == 'Select Dealer') {
      this.deviceService.getDealerList('').subscribe((response: any) => {
        if (response.statuscode== 200) {
          this.userList = response.entity;
        }
      });
      // Fetch dealer list

    }
  }
  apiSubscription: any;
  fetchDeviceDetails() {
    this.apiSubscription?.unsubscribe();
    // Logic to fetch device details based on selected user
    const roleId = this.roleId;
    const ownersId = sessionStorage.getItem('userid') || "";
    let requestPayload = {
      param1: roleId, //roleid
      param2: ownersId //this.selectedUser // ownersid
    };
    if(this.dropDownName == 'Select Dealer') {
   this.apiSubscription =  this.deviceService.getFreeDeviceDetailsForDealer(requestPayload).subscribe((response: any) => {
      if (response.statuscode== 200) {
        this.deviceData = response.entity;
      }
        }, error => {
          this.msgType = 'error';
          this.errorMessage = 'Error fetching device details';
        // console.error('Error fetching device details:', error);
      });
    }
    else if(this.dropDownName == 'Select Distributor') {
      this.apiSubscription = this.deviceService.getFreeDeviceDetailsForDistributor({}).subscribe((response: any) => {
        if (response.statuscode== 200) {
          this.deviceData = response.entity;
        }
          }, error => {
            this.msgType = 'error';
            this.errorMessage = 'Error fetching device details';
          //
          // console.error('Error fetching device details:', error);
        });
    }
  }
  selectAll: boolean = false;

toggleSelectAll() {
  this.deviceData.forEach(device => {
    device.selected = this.selectAll;
  });
}

onDeviceSelectionChange() {
  this.selectAll = this.deviceData.every(device => device.selected);
}
  assignDevice() {
    // Logic to assign device to dealer
    const assignedDevices: string[] = [];
    this.deviceData.forEach(device => {
      if (device.selected) {
    assignedDevices.push(device.param1);
  }// Assuming param2 is Device ID
    });
      const requestPayload = {
        deviceidList: assignedDevices,
        param2: this.selectedUser // Assuming param2 is Device ID
      };
        if(this.dropDownName == 'Select Dealer') {
          this.deviceService.assignDevicesToDealer(requestPayload).subscribe((response: any) => {
            if (response.statuscode== 200) {
              this.msgType = 'success';
              this.errorMessage = 'Device assigned successfully';
              this.resetForm();
            } else {
              this.msgType = 'error';
              this.errorMessage = 'Failed to assign device';
            }
          }, error => {
            
            this.msgType = 'error';
            this.errorMessage = 'Error assigning device';
            // console.error('Error assigning device:', error);
          });
          return;
        }
        else if(this.dropDownName == 'Select Distributor') {
        this.deviceService.assignDevicesToDistributor(requestPayload).subscribe((response: any) => {
          if (response.statuscode== 200) {
            this.msgType = 'success';
            this.errorMessage = 'Device assigned successfully';
            this.resetForm();
          } else {
            this.msgType = 'error';
            this.errorMessage = 'Failed to assign device';
          }
        }, error => {
          
          this.msgType = 'error';
          this.errorMessage = 'Error assigning device';
          // console.error('Error assigning device:', error);
          });
        }
      

   
  }
  @ViewChild('assignmentForm') assignmentForm: any;
  resetForm() {
    // Logic to reset the form fields
    this.selectedUser = null;
    this.deviceData = [];
    this.assignmentForm.resetForm();
  }

}
