import { Component, importProvidersFrom, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; 
 import { DashboardService } from '../../../core/services/dashboard.service';
import { ToastService } from '../../../core/services/toast.service';
import { OperationService } from '../../../core/services/operation.service';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
export class RawDataRequest {
  param1: string = ''; // IMEI
  param2: string = ''; // Page number
  param3: string = ''; // Page size
  param4: string = ''; // Other parameters
  param5: string = ''; // Other parameters
  param6: string = ''; // Other parameters
}
@Component({
    selector: 'app-new-push-cammand',
    imports: [FormsModule, CommonModule, NgbPaginationModule],
    templateUrl: './new-push-cammand.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './new-push-cammand.component.scss'
})
export class NewPushCammandComponent{
  pageSize: any = 50;
  pageSizeOptions: number[] = [10, 20, 50, 100];
   constructor(private dashboardservice: DashboardService,
    private toast: ToastService,
    private operationService: OperationService) {
    this.toast.pageName = 'Push Command'; // Set page name for toast service
    }
  imeiList: string[] = [''];
imeiErrors: string[] = [''];
imeiTouched: boolean[] = [false];

deviceCommand: string = '';
isLoading = false;
addImei() {
  if (this.imeiList.length < 100) {
    this.imeiList.push('');
    this.imeiErrors.push('');
    this.imeiTouched.push(false);
  }
}

removeImei(index: number) {
  this.imeiList.splice(index, 1);
  this.imeiErrors.splice(index, 1);
  this.imeiTouched.splice(index, 1);
  this.validateAllDuplicates();
}




validateAllDuplicates() {
  const map = new Map<string, number[]>();

  this.imeiList.forEach((val, i) => {
    if (!val) return;

    if (!map.has(val)) {
      map.set(val, []);
    }
    map.get(val)?.push(i);
  });

  // Clear previous duplicate errors
  this.imeiErrors = this.imeiErrors.map(err =>
    err === 'Duplicate IMEI not allowed' ? '' : err
  );

  // Apply duplicate error
  map.forEach(indexes => {
    if (indexes.length > 1) {
      indexes.forEach(i => {
        this.imeiErrors[i] = 'Duplicate IMEI not allowed';
      });
    }
  });
}
resendCommand(imei: string) {
  if (!imei || imei.trim() === '') {
    this.toast.show('IMEI is required to resend command', 'error');
    return;
  }

  if (!this.deviceCommand || this.deviceCommand.trim() === '') {
    this.toast.show('Device command is required to resend', 'error');
    return;
  }
  this.dashboardservice.sendMultipleCommand(imei, this.deviceCommand.trim())
    .subscribe({
next: (res: any) => {
  if (res?.statuscode === 200) {

    const validImeis = this.imeiList.filter(i => i && i.trim() !== '');

    this.toast.show(
      `Command resent successfully to IMEI: ${imei}`,
      'success'
    );

    // ✅ FIX HERE
    this.submittedImeis = validImeis;

    this.showGrid = true;

  } else {
    this.toast.show(res?.entity || 'Something went wrong', 'error');
  }
},
error: () => {
  this.toast.show('API Error occurred', 'error');
},

      complete: () => {
        this.isLoading = false;
      }
    });
}


submit() {
  const validImeis = this.imeiList.filter(i => i.trim() !== '');

 if (validImeis.length === 0) {
  this.toast.show('Please enter at least one IMEI', 'error');
  return;
}

if (this.imeiErrors.some(e => e)) {
  this.toast.show('Please fix IMEI errors', 'error');
  return;
}

if (!this.deviceCommand || !this.deviceCommand.trim()) {
  this.toast.show('Device command is required', 'error');
  return;
}

  const imeiString = validImeis.join(',');

  this.isLoading = true;

  this.dashboardservice.sendMultipleCommand(imeiString, this.deviceCommand.trim())
    .subscribe({
next: (res: any) => {
  if (res?.status) {

    const validImeis = this.imeiList.filter(i => i && i.trim() !== '');

    this.toast.show(
      `${res.entity} (${validImeis.length} IMEI)`,
      'success'
    );

    // ✅ FIX HERE
    this.submittedImeis = validImeis;

    this.showGrid = true;

  } else {
    this.toast.show(res?.entity || 'Something went wrong', 'error');
  }
},
error: () => {
  this.toast.show('API Error occurred', 'error');
},

      complete: () => {
        this.isLoading = false;
      }
    });
}


/** ✅ Only numbers + prevent jumping bug */
onImeiInput(index: number, event: any) {
  let value = event.target.value;

  // only numbers
  value = value.replace(/\D/g, '');

  // max 15
  if (value.length > 15) {
    value = value.slice(0, 15);
  }

  // IMPORTANT: update without triggering full change detection
  this.imeiList[index] = value;

  // validate WITHOUT touching full array
  this.validateSingle(index);
  this.validateDuplicates();
}

/** touched */
markTouched(index: number) {
  this.imeiTouched[index] = true;
}

/** single validation */
validateImei(index: number) {
  const value = this.imeiList[index];
  this.imeiErrors[index] = '';

  if (value && value.length !== 15) {
    this.imeiErrors[index] = 'IMEI must be 15 digits';
  }

  this.validateDuplicates();
}



trackByIndex(index: number, item: any): number {
  return index;
}
validateSingle(index: number) {
  const value = this.imeiList[index];

  if (value && value.length !== 15) {
    this.imeiErrors[index] = 'IMEI must be 15 digits';
  } else {
    this.imeiErrors[index] = '';
  }
}

validateDuplicates() {
  const seen: any = {};

  this.imeiList.forEach((val, i) => {
    if (!val) return;

    if (seen[val] !== undefined) {
      this.imeiErrors[i] = 'Duplicate IMEI';
      this.imeiErrors[seen[val]] = 'Duplicate IMEI';
    } else {
      seen[val] = i;
    }
  });
}
resetForm() {
  this.showGrid = false;
// this.loadingIndex = null;
  this.imeiList = [''];
  this.imeiErrors = [''];
  this.imeiTouched = [false];
  this.deviceCommand = '';
  this.isRawLoading = false;

}
imeiNo: string = '';
viewRawData(index: number, imei: string) {
  this.imeiNo = imei;
  this.loadingMap[index] = true;
  const request: RawDataRequest = {
    param1: '',
    param2: this.pageNo ? this.pageNo.toString(): '1',
    param3: this.pageSize ? this.pageSize.toString(): '50',
    param4: '0',
    param5: imei,
    param6: this.getTodayDate()
  };

  this.operationService.getRawData(request).subscribe({
    next: (res: any) => {

      // ❌ NO DATA CASE
      if (res?.entity === 'No Data Found') {
        this.toast.show('No Data Found', 'error');
        return;
      }

      // ✅ DATA FOUND
      if (res?.status && res?.entity?.listData?.length) {

        this.rawData = res.entity.listData;
        this.totalCount = res.entity.param1 || 0;
        this.toast.show('Raw data loaded', 'success');

        // ✅ open modal
        this.isModalOpen = true;

      } else {
        this.toast.show('No Data Found', 'error');
      }
    },
    error: () => {
      this.toast.show('API Error', 'error');
    },
    complete: () => {
      this.loadingMap[index] = false;
    }
  });
}
getTodayDate(): string {
  const today = new Date();

  const day = String(today.getDate()).padStart(2, '0');
  const month = today.toLocaleString('en-GB', { month: 'short' });
  const year = today.getFullYear();

  return `${day}-${month}-${year}`;
}
isModalOpen = false;
loadingMap: { [key: number]: boolean } = {};
rawData: any[] = [];
isRawLoading = false;
showGrid = false;
submittedImeis: string[] = [];

loading: boolean = false;
totalCount: number = 0;
pageNo: number = 1;
reloadData() {
  this.pageNo = 1; // Reset to first page
  this.pageSize = 20;
  this.viewRawData(0, this.submittedImeis[0]);
}
onPageSizeChange(event: any) {
  this.pageSize = event.target.value;
  this.reloadData();
}
onPageChange(page: number) {
  this.pageNo = page;
  this.getRawData();
}
getRawData() {
  const request: RawDataRequest = {
    param1: '',
    param2: this.pageNo ? this.pageNo.toString(): '1',
    param3: this.pageSize ? this.pageSize.toString(): '50',
    param4: '0',
    param5: this.imeiNo,
    param6: this.getTodayDate()
  };
  this.operationService.getRawData(request).subscribe({
    next: (res: any) => {

      // ❌ NO DATA CASE
      if (res?.entity === 'No Data Found') {
        this.toast.show('No Data Found', 'error');
        return;
      }

      // ✅ DATA FOUND
      if (res?.status && res?.entity?.listData?.length) {

        this.rawData = res.entity.listData;
        this.totalCount = res.entity.param1 || 0;
        this.toast.show('Raw data loaded', 'success');

        // ✅ open modal
        this.isModalOpen = true;

      } else {
        this.toast.show('No Data Found', 'error');
      }
    },
    error: () => {
      this.toast.show('API Error', 'error');
    },
    
  });
}
}