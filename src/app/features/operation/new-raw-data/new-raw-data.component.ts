
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import dayjs, { Dayjs } from 'dayjs/esm';
import { OperationService } from '../../../core/services/operation.service';
import { ToastService } from '../../../core/services/toast.service';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
@Component({
    selector: 'app-new-raw-data',
    imports: [
    FormsModule,
    NgxDaterangepickerMd
],
    templateUrl: './new-raw-data.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./new-raw-data.component.scss']
})
export class NewRawDataComponent implements OnInit {

  imei: string = '';

selectedDate: any = {
  startDate: dayjs(),
  endDate: dayjs()
};

  packetType = 'LOGIN';

  dataType = '';
// history
  pageSize = 25;
  currentPage = 1;
  totalCount = 0;
pagecount=0
  loading = false;

  rawData: any[] = [];

  packetTabs = [
    { label: 'LOGIN', value: 'LOGIN' },
    { label: 'HEALTH', value: 'HEALTH' },
    { label: 'PVT', value: 'PVT' },
    { label: 'PANIC', value: 'PANIC' },
    { label: 'ALERT', value: 'ALERT' },
    { label: 'UNKNOWN', value: 'UNKNOWN' }
  ];

  constructor(
    private operationService: OperationService,
    private toast: ToastService
  ) {
    this.toast.pageName = 'Raw Data'; // Set page name for toast service
   }

  ngOnInit(): void {

  }

  searchRawData(pageNo: number = 1) {
      this.page = pageNo;
  this.currentPage = pageNo;

  if (!this.imei || !this.imei.trim()) {
    this.toast.show('Please enter IMEI.', 'error');
    return;
  }

  if (!this.selectedDate) {
    this.toast.show('Please select Date.', 'error');
    return;
  }

  this.loading = true;
  this.currentPage = pageNo;

  const request = {
    param1: '',
    param2: pageNo.toString(),
    param3: this.pageSize.toString(),
    param4: '',
    param5: this.imei.trim(),
  param6: this.selectedDate.startDate.format('DD-MMM-YYYY'),
    param7: this.dataType,
    param8: this.packetType
  };

  this.toast.showLoader();

  this.operationService.getNewRawData(request).subscribe({
    next: (response: any) => {

      this.loading = false;
      this.toast.hideLoader();

      if (response.statuscode == 200) {
        this.rawData = response.entity.listData || [];
        this.totalCount = response.entity.param1 || 0;
      this.pagecount= response.entity.listData?.length || 0;
      } else {
        this.rawData = [];
        this.totalCount = 0;
        this.toast.show(response.entity, 'error');
      }
    },

    error: () => {
      this.loading = false;
      this.toast.hideLoader();
      this.rawData = [];
      this.toast.show('Something went wrong.', 'error');
    }
  });
}

  changeTab(type: string) {

    this.packetType = type;

    if (this.imei) {
      this.searchRawData(1);
    }

  }
  isInvalidDate = (date: Dayjs) => {
  return date.isAfter(dayjs(), 'day');
};
page = 1;
// pageSize = 25;
// totalCount = 0;

get totalPages(): number {
  return Math.ceil(this.totalCount / this.pageSize);
}

changePage(pageNo: number) {

  if (pageNo < 1 || pageNo > this.totalPages) {
    return;
  }

  this.page = pageNo;
  this.currentPage = pageNo;

  this.searchRawData(pageNo);
}
}