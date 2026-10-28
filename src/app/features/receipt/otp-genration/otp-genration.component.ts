import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GetStatusService } from '../../../core/services/get-status.service';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import moment from 'moment';
import { ToastService } from '../../../core/services/toast.service';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';

@Component({
    selector: 'app-otp-genration',
    imports: [CommonModule, FormsModule, NgxDaterangepickerMd, CommonTableComponent],
    templateUrl: './otp-genration.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './otp-genration.component.scss'
})
export class OtpGenrationComponent implements OnInit {

  constructor(private GetStatusService: GetStatusService, private toast: ToastService) {
    this.toast.pageName = 'Generated OTP Details'; // Set page name for toast service
  }

  searchText = '';
  sortKey = '';
  reverse = false;

  otpList: any[] = [];
  filteredList: any[] = [];
  readonly tableColumns: CommonTableColumn<any>[] = [
    { key: 'index', label: '#' },
    { key: 'param7', label: 'Vendor Name' },
    { key: 'param4', label: 'IMEI No' },
    { key: 'param5', label: 'Unique Device No' },
    { key: 'param9', label: 'Vehicle / Chassis No' },
    { key: 'param21', label: 'Name' },
    { key: 'param22', label: 'Mobile No' },
    { key: 'param31', label: 'OTP' },
    { key: 'param32', label: 'Time' }
  ];

  vendorList: any[] = [];

  companyId = '';
  fromDate = '';
  toDate = '';

  page = 1;
  pageSize = 1000;

  today = moment();

  selectedDateRange: any = {
    startDate: moment().subtract(30, 'days'),
    endDate: moment()
  };

 ngOnInit() {

  this.loadVendors();

  const today = moment().format('DD-MMM-YYYY');

  this.fromDate = today;
  this.toDate = today;

  this.selectedDateRange = {
    startDate: moment(),
    endDate: moment()
  };

  this.loadData();
}

  loadVendors() {

    this.GetStatusService.getVendorRoster()
      .subscribe((res: any) => {

        this.vendorList = res.entity || res.data || [];

      });

  }

onDateRangeChange(range: any) {

  if (!range || !range.startDate || !range.endDate) return;

  this.fromDate = range.startDate.format('DD-MMM-YYYY');
  this.toDate = range.endDate.format('DD-MMM-YYYY');

  //console.log("FROM:", this.fromDate);
  //console.log("TO:", this.toDate);

  this.loadData();
}

loadData() {

  this.GetStatusService.getVehicleOtpDetails({

    param1: this.searchText || '',
    param2: '1',
    param3: '1000',
    param4: this.companyId || '',
    param5: this.fromDate,
    param6: this.toDate

  })
  .subscribe((res: any) => {

    this.otpList = res?.entity?.listData || [];
    this.filteredList = [...this.otpList];

  });

}
get totalPages() {
  return Math.ceil(this.filteredList.length / this.pageSize);
}
 searchOtp() {

  const value = this.searchText.toLowerCase();

  this.filteredList = this.otpList.filter(item =>
    item.param21?.toLowerCase().includes(value) ||
    item.param22?.includes(value)
  );

}

  reloadData() {

    this.searchText = '';
    this.loadData();

  }

  sort(key: string) {

    this.reverse = this.sortKey === key ? !this.reverse : false;
    this.sortKey = key;

    this.filteredList.sort((a: any, b: any) => {

      if (a[key] < b[key]) return this.reverse ? 1 : -1;
      if (a[key] > b[key]) return this.reverse ? -1 : 1;

      return 0;

    });

  }

  nextPage() {
    this.page++;
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
    }
  }

}