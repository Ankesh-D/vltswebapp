import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { ToastService } from '../../../core/services/toast.service';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ReportService } from '../../../core/services/report.service';
import { OutOfOfficeHrsReportReq } from '../../../core/model/request.model';

import { CommonDataToolbarComponent } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';
declare var $: any;
declare var moment: any;

@Component({
    selector: 'app-out-of-office-hrs-report',
    imports: [FormsModule, RouterModule, NgSelectModule, NgxDaterangepickerMd, NgbPaginationModule, CommonDataToolbarComponent, CommonTableComponent],
    templateUrl: './out-of-office-hrs-report.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './out-of-office-hrs-report.component.scss'
})
export class OutOfOfficeHrsReportComponent  implements OnInit {
  readonly tableColumns: CommonTableColumn[] = [
    { key: 'column1', label: '#', className: 'green py-1 text-center' },
    { key: 'column2', label: 'User Name (Role)', className: 'green py-1 text-center' },
    { key: 'column3', label: 'Login Time', className: 'green py-1 text-end' },
    { key: 'column4', label: 'Log Out Time', className: 'green py-1 text-end' },
    { key: 'column5', label: 'Usage Duration(min)', className: 'green py-1 text-end' },
    { key: 'column6', label: 'Out of Office Hours Usage(min)', className: 'green py-1 text-end' }
  ];

  detailData: any[] = [];
  detailModalData: any[] = [];
  selectedVendorName: string = '';
  selectedVendorId: string = '';
  showDetailsModal: boolean = false;
  detailModalLoading = false;
  detailModalPageCount: number = 1;
  detailModalPageSize: number = 20;
  alertType: string = '';
  dateTimeout: any;
  searchBy: any = "";
  listLoaded: boolean = true;
  pageSize: number = 20;
  pageSizeOptions: number[] = [20, 30, 40, 50, 100];
  pageCount: number = 1;
  selectedVendorFilter: any = null;
  vendorlist: any[] = [];
  downloadType: string = '';
  totalCount: any;
  totalcount=0;
  total_count_activated=0;
  total_count_notactivated=0;
  vehicleType: string= "ALL";
  fromDate: any;
  toDate: any;
  loading: boolean = false;
  reportReq: OutOfOfficeHrsReportReq = new OutOfOfficeHrsReportReq(); 
  constructor(public reportService: ReportService, public toastService: ToastService) {
    this.toastService.pageName = 'Out of office hours report';
  }
    checkAlertCount(item: any): boolean {
    return Number(item?.param4) > 0;
  }

  ngOnInit(): void {
    this.initiallizeDateRangePicker();
    setTimeout(()=> {
      this.getDetails();
      
    }, 200)
  }
  searchText: string = '';
  
  

  // loadDetails(page: number = 1) {
  
  //   // const payload = {
  //   //   param1: '',
  //   //   param2: '',//this.detailModalPageCount.toString(),
  //   //   param3: '', //this.detailModalPageSize.toString(),
  //   //   param4: moment(this.fromDate).format('DD-MMM-YYYY'),
  //   //   param5: moment(this.toDate).format('DD-MMM-YYYY'),
  //   //   param6: this.selectedVendorId || '',
  //   //   param7: this.vehicleType || 'ALL',
  //   //   param8: '',
  //   //   param9: '',
  //   //   pdfexcel: ''
  //   // };
    

  //   this.reportService.getOutOfOfficeHrsReport(this.reportReq).subscribe({
  //     next: (response: any) => {
  //       this.detailModalLoading = false;
  //       this.detailModalData = response.entity?.listData || [];
  //       this.filteredData = [...this.detailModalData];
  //       this.totalCount = response.entity?.param1 || 1;
  //     },
  //     error: () => {
  //       this.detailModalLoading = false;
  //       this.detailModalData = [];
  //     }
  //   });
  // }

  // previousDetailModalPage() {
  //   if (this.detailModalPageCount > 1) {
  //     this.loadDetails(this.detailModalPageCount - 1);
  //   }
  // }

  // nextDetailModalPage() {
  //   if (this.detailModalData.length >= this.detailModalPageSize) {
  //     this.loadDetails(this.detailModalPageCount + 1);
  //   }
  // }

  closeVendorDetails() {
    this.showDetailsModal = false;
    this.detailModalData = [];
    this.selectedVendorName = '';
    this.selectedVendorId = '';
    this.detailModalPageCount = 1;
  }

  onPageSizeChange(event: any) {
    this.pageSize = Number(event.target.value);
    this.pageCount = 1;
    this.getDetails();
  }
  filteredData: any[] = [];
  filterData(): void {

  const search = this.searchText.trim().toLowerCase();

  if (!search) {
    this.filteredData = [...this.detailModalData];
    return;
  }

  this.filteredData = this.detailModalData.filter(item =>
      Object.values(item).some(value =>
          String(value ?? '').toLowerCase().includes(search)
      )
  );
}
  

  downloadExcel() {
    this.listLoaded = false;

    const payload = new OutOfOfficeHrsReportReq();
    payload.param1 = this.searchBy;
    payload.param2 = this.pageCount.toString();
    payload.param3 = this.pageSize.toString();
    payload.param4 = this.fromDate;
    payload.param5 = this.toDate;
    payload.param6 = '';
    payload.param7 = '';
    payload.param8 = '';
    payload.pdfexcel = 'Excel';

    this.reportService
      .getOutOfOfficeHrsReport(payload)
      .subscribe({
        next: (response: any) => {
          this.listLoaded = true;
          if (response.status && response.entity) {
            const link = document.createElement('a');
            link.href = response.entity;
            link.target = '_blank';
            link.download = '';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        },
        error: () => {
          this.listLoaded = true;
        }
      });
  }
  initiallizeDateRangePicker() {
    $(() => {
    $('input[name="date"]').daterangepicker({
      singleDatePicker: true,
      timePicker: false,
      autoApply: true,
      
      // ✅ default range
      startDate: moment().subtract(1, 'days'),
      endDate: moment(),

      opens: "center",
      drops: "down",

      locale: {
        format: 'DD-MMM-YYYY',
        separator: ' To '
      },

      minDate: moment('2022-01-01'),

      // ✅ disable all future dates
      maxDate: moment(),

      minYear: 2022,
      maxYear: parseInt(moment().format('YYYY'), 10),

      autoUpdateInput: true
    }, function(startDate: any, endDate: any) {

      $('#datepicker').val(
        startDate.format('DD-MMM-YYYY') +
        ' To ' +
        endDate.format('DD-MMM-YYYY')
      );
    });

    $('input[name="date"]').on(
      'apply.daterangepicker',
      (ev: any, picker: any) => {

        try {
          this.fromDate = picker.startDate.format('DD-MMM-YYYY');
          this.toDate = picker.endDate.format('DD-MMM-YYYY');
          console.log("gere", this.fromDate, this.toDate);
          this.getDetails();
        } catch (error) {}

        
      }
    );

    // ✅ initial value
    const picker: any = $('input[name="date"]').data('daterangepicker');

    this.fromDate = picker.startDate.format('DD-MMM-YYYY');
    this.toDate = picker.endDate.format('DD-MMM-YYYY');
});
 
}
  onDateApply(event: any) {
    this.pageCount = 1;
    this.getDetails();
  }
  // onDateChange() {
  //   clearTimeout(this.dateTimeout);
  //   this.dateTimeout = setTimeout(() => {
  //     this.pageCount = 1;
  //     this.getDetails();
  //   }, 300);
  // }

  // formatDate(date: any): string {
  //    const day = String(date.getDate()).padStart(2, '0');
  //     const month = date.toLocaleString('default', { month: 'short' });
  //     const year = date.getFullYear();
  //     return `${day}-${month}-${year}`;
  // }
  downloadpdf() {

    this.listLoaded = false;

    
    const reportReq = new OutOfOfficeHrsReportReq();
    reportReq.param1 = this.searchBy;
    reportReq.param2 = this.pageCount.toString();
    reportReq.param3 = this.pageSize.toString();
    reportReq.param4 = this.fromDate;
    reportReq.param5 = this.toDate;
    reportReq.param6 = '';
    reportReq.param7 = '';
    reportReq.param8 = '';
    reportReq.pdfexcel = 'excel';
    this.reportService.getOutOfOfficeHrsReport(reportReq)
      .subscribe({
        next: (response: any) => {

          
          this.listLoaded = true;
        },
        error: () => {
          this.listLoaded = true;
        }
      });
  }
  getDetails() {

    this.listLoaded = false; // 🔥 start loading

    this.reportReq.param1 = this.searchBy;
    this.reportReq.param2 = this.pageCount.toString();
    this.reportReq.param3 = this.pageSize.toString();
    this.reportReq.param4 = this.fromDate;
    this.reportReq.param5 = this.toDate;
    this.reportReq.param6 = '';
    this.reportReq.param7 = '';
    this.reportReq.param8 = '';
    this.reportReq.pdfexcel = '';

    this.reportService
      .getOutOfOfficeHrsReport(this.reportReq)
      .subscribe({
        next: (response: any) => {
          this.detailData = response.entity?.listData || [];
          if (response.statuscode === 200) {

            if (typeof response.entity === 'string') {
              this.detailData = [];
            } else {
             this.detailData = response.entity?.listData || [];
              this.totalCount = response.entity.param1 || 0;
              this.totalcount = response.entity.param2 || 0;
              this.total_count_activated = response.entity.param3 || 0;
              this.total_count_notactivated = response.entity.param4 || 0;
            }
          } else {
            this.detailData = [];
            this.totalCount = 0;
            this.totalcount = 0;
            this.total_count_activated = 0;
            this.total_count_notactivated = 0;
          }

          this.listLoaded = true;
        },
        error: () => {
          this.detailData = [];
          this.totalCount = 0;
          this.totalcount = 0;
          this.total_count_activated = 0;
          this.total_count_notactivated = 0;
          this.listLoaded = true;
        }
      });
  }
  onPageChange(page: number) {
    this.pageCount = page;
    this.getDetails();
  }
  // onModalPageChange(page: number) {
  //   this.loadDetails(page);
  // }
  onVendorFilterChange(event: any) {
    this.pageCount = 1;
    this.getDetails();
  }
  onAlertTypeChange() {
    this.pageCount = 1;
    this.getDetails();
  }
  onChangeVehicleType(type: string) {
    this.pageCount = 1;
    this.vehicleType = type
    this.getDetails();
  }
  getSearchDetails() {

    this.getDetails();
  }
  reloadData() {
    // const today = new Date();

    this.selectedVendorFilter = null;

    // this.selectedDateRange = {
    //   startDate: today,
    //   endDate: today
    // };
    // this.selectedRange = {
    //       startDate: moment(),
    //       endDate: moment()
    //     };

    this.pageCount = 1;
    this.pageSize = 20;
    this.listLoaded = false;
    this.totalCount = 0;
    this.vehicleType = "ALL";
    this.getDetails();
  }
  onDownloadChange() {
    if (this.downloadType === 'Excel') {
      this.downloadExcel();
    }

    // reset dropdown
    this.downloadType = '';
  }

  // checkAlertCount(item: any): boolean {
  //   return Number(item?.param4) > 0;
  // }
}
