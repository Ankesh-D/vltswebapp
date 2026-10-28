import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VehicleService } from '../../../core/services/vehicle.service';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
@Component({
  selector: 'app-untag-vehicle',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './untag-vehicle.component.html',
  styleUrl: './untag-vehicle.component.scss'
})
export class UntagVehicleComponent {

  activeTab: string = 'untag';
  searchText: string = '';
  pageNo: number = 1;
  pageSize: number = 20;
  totalRecords: number = 0;
  deviceList: any[] = [];
  
  // Modal properties
  showUntagModal: boolean = false;
  untagRemarks: string = '';
  selectedDeviceId: string = '';
  selectedDeviceImei: string = '';
  isSubmitting: boolean = false;

  constructor(private vehicleService: VehicleService, private toastService: ToastService) {}
  ngOnInit(): void {
    this.setTab('untag'); // 🔥 IMPORTANT
  }
setTab(tab: string) {
  this.activeTab = tab;

  if (tab === 'untag') {
    this.getDeviceMaster();   // 🔥 NEW API FIRST
  } else {
    this.getUntagData(tab);   // existing API
  }
}
getDeviceMaster() {

  const request = {
//     {
//     "param1": "",
//     "param2": "Old System Data",
//     "param3": "1",
//     "param4": "20",
//     "param5": "",
//     "param6": "",
//     "param7": "",
//     "param8": "",
//     "param9": "",
//     "pdfexcel": ""
// }
    param1: this.searchText || '',   // 🔍 search
    param2: this.pageNo.toString(),  // 📄 page no
    param3: this.pageSize.toString(),// 📄 page size
    param8: '',
    param9: '',
    param10: 'TotalDevice'
  };

  this.vehicleService.getDeviceMasterDetails(request)
    .subscribe({
      next: (res: any) => {

        if (res?.status && res?.entity?.listData) {
          this.deviceList = res.entity.listData;
          this.totalRecords = res.entity?.totalRecords || 0;
        } else {
          this.deviceList = [];
        }

      },
      error: () => {
        this.deviceList = [];
      }
    });
}
onSearch() {
  this.pageNo = 1; // reset page
  this.setTab(this.activeTab);
}
nextPage() {
  this.pageNo++;
  this.setTab(this.activeTab);
}

prevPage() {
  if (this.pageNo > 1) {
    this.pageNo--;
    this.setTab(this.activeTab);
  }
}
// getDeviceMaster() {

//   const request = {
//     param1: this.searchText || '',   // 🔍 search
//     param2: this.pageNo.toString(),  // 📄 page no
//     param3: this.pageSize.toString(),// 📄 page size
//     param8: '',
//     param9: '',
//     param10: 'TotalDevice'
//   };

//   this.vehicleService.getDeviceMasterDetails(request)
//     .subscribe({
//       next: (res: any) => {

//         if (res?.status && res?.entity?.listData) {
//           this.deviceList = res.entity.listData;
//           this.totalRecords = res.entity?.totalRecords || 0;
//         } else {
//           this.deviceList = [];
//         }

//       },
//       error: () => {
//         this.deviceList = [];
//       }
//     });
// }
tabMap: any = {
  untag: '',
  approved: '2',
  pending: '1',
  vendor: '3'
};
getUntagData(tab: string = 'untag') {

  const request = {
    param1: this.searchText || '',  // 🔍 search
    param4: '',
    param5: this.tabMap[tab] || ''
  };

  this.vehicleService.getUntagRequestDetails(request)
    .subscribe({
      next: (res: any) => {
        this.deviceList = res?.entity?.listData || [];
      },
      error: () => {
        this.deviceList = [];
      }
    });
}
  // 🔹 Get Data
// getUntagData(tab: string = 'untag') {

//   const request = {
//     param1: '',
//     param4: '',
//     param5: this.tabMap[tab] || ''
//   };

//   this.vehicleService.getUntagRequestDetails(request)
//     .subscribe({
//       next: (res: any) => {

//         if (res?.status && res?.entity?.listData) {
//           this.deviceList = res.entity.listData;
//         } else {
//           this.deviceList = [];
//         }
//       },
//       error: () => {
//         this.deviceList = [];
//       }
//     });
// }
  // 🔹 Open Untag Modal
  untagDevice(deviceId: string, imei: string = '') {
    this.selectedDeviceId = deviceId;
    this.selectedDeviceImei = imei;
    this.untagRemarks = '';
    this.showUntagModal = true;
  }

  // 🔹 Close Modal
  closeUntagModal() {
    this.showUntagModal = false;
    this.untagRemarks = '';
    this.selectedDeviceId = '';    
    this.selectedDeviceImei = '';  
  }

  // 🔹 Submit Untag with Remarks
  submitUntagRequest() {
    if (!this.untagRemarks.trim()) {
     this.toastService.show('Please enter a remark', 'error');
      // alert('Please enter a remark');
      return;
    }

    this.isSubmitting = true;
    const request = {
      param2: this.selectedDeviceId,
      param3: this.untagRemarks
    };

    this.vehicleService.untagDevice(request)
      .subscribe({
        next: (res: any) => {
          this.isSubmitting = false;
          if (res?.status) {
            this.toastService.show('Device Untagged Successfully', 'success');
            this.closeUntagModal();
            this.searchText = '';
            this.setTab(this.activeTab); // refresh list
          }
        },
        error: () => {
          this.isSubmitting = false;
          this.toastService.show('Error untagging device', 'error');
        }
      });
  }
  approveRequest(requestId: string) {

  const request = {
    param2: requestId,
    param3: '1', // ✅ Approve
    param4: 'Approved by admin'
  };

  this.vehicleService.changeUntagRequestStatus(request)
    .subscribe({
      next: (res: any) => {
        if (res?.status) {
          this.toastService.show('Request Approved Successfully', 'success');
          this.setTab(this.activeTab); // 🔄 refresh
        }
      }
    });
}
rejectRequest(requestId: string) {

  const remarks = prompt('Enter rejection reason');

  if (!remarks) return;

  const request = {
    param2: requestId,
    param3: '2', // ❌ Reject
    param4: remarks
  };

  this.vehicleService.changeUntagRequestStatus(request)
    .subscribe({
      next: (res: any) => {
        if (res?.status) {
          this.toastService.show('Request Rejected Successfully', 'success');
          this.setTab(this.activeTab); // 🔄 refresh
        }
      }
    });
}
}