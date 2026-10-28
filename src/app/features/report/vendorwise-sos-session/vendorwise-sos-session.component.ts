import { ReportService } from './../../../core/services/report.service';
import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { AlertService, SOSSessionReportReq, SOSSessionResponse } from '../../../core/services/alert.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { ToastService } from '../../../core/services/toast.service';
import dayjs from 'dayjs';
import { Dayjs } from 'dayjs';
import { NgSelectModule } from '@ng-select/ng-select';
import { Subject } from 'rxjs';
import moment from 'moment';
import { CommonDataToolbarComponent } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { CommonPaginationComponent } from '../../../shared/components/common-pagination/common-pagination.component';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';
declare var $: any;

@Component({
    selector: 'app-vendorwise-sos-session',
    imports: [NgxDaterangepickerMd, FormsModule, NgSelectModule, CommonDataToolbarComponent,
      CommonPaginationComponent, CommonTableComponent],
    templateUrl: './vendorwise-sos-session.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './vendorwise-sos-session.component.scss'
})
export class VendorwiseSosSessionComponent implements OnInit {
  readonly tableColumns: CommonTableColumn[] = [
    { key: 'index', label: '#' },
    { key: 'vendor', label: 'Vendor Name' },
    { key: 'vehicles', label: 'Unique Vehicle Count', cellClass: 'text-end' },
    { key: 'panic', label: 'Panic Session', cellClass: 'text-end' },
    { key: 'tampered', label: 'Tampered Panic', cellClass: 'text-end' },
    { key: 'closed', label: 'Closed Panic', cellClass: 'text-end' }
  ];
  today: Dayjs = dayjs();
  selectedDateRange = {
    startDate: dayjs().startOf('month').toDate(),
    endDate: dayjs().endOf('month').toDate()
  };
  locale = {
  format: 'DD-MMM-YYYY'
};
  loading = false;
  showSummary = false;
  deviceType: 'NEW' | 'OLD' = 'NEW'; // default NEW
  filterBy = 'Vendor';
  selectedVendor: any = null;
  selectedDateFilter = '';
  fromDate = '';
  toDate = '';
  fromTime = '00:00';
  toTime = '23:59';
  vendorList: any[] = [];
  alertData: SOSSessionResponse[] = [];
  roleId: string = '';
  formReq: SOSSessionReportReq = new SOSSessionReportReq();
  isVehicleLoaded = false;
  constructor(
    private toast: ToastService,
    private ReportService: ReportService,
    private alertService: AlertService,
    private dashboardService: DashboardService,
    private vehicleService: VehicleService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef
  ) { this.roleId = sessionStorage.getItem('roleid') || '';
      this.toast.pageName = 'Vendorwise SOS Session Report'; // Set page name for toast service
   }
  searchInput = new Subject<string>();
  filteredOptions: any[] = [];
  loadingVehicle: boolean = false;
  ngOnInit() {
    this.initializeDatePicker();
    this.filterBy = 'Vendor';
    this.loadVendorList();
    this.fromDate = moment().subtract(6, 'days').format("DD-MMM-YYYY"); //this.formatDate(this.selectedDateRange.startDate);
    this.toDate = moment().format("DD-MMM-YYYY");
  }

  initializeDatePicker() {
        // this.selectedDate = moment().format('DD-MMM-YYYY');
      
        $(() => {
          const $dateInput = $('input[name="date"]');
      
          $dateInput.daterangepicker({
            singleDatePicker: false,
            showDropdowns: true,
            autoApply: true,
            timePicker: false,
            startDate: moment().subtract(6, 'days'),
            endDate: moment(), 
            maxDate: moment(),
            minYear: moment().subtract(2, 'year').year(),
            maxYear: moment(),
            opens: 'center',
            drops: 'down',
            locale: {
              format: 'DD-MMM-YYYY'
            }
          });
      
          // On date selection
         $dateInput.on('apply.daterangepicker', (ev: any, picker: any) => {
          
          });
      
          // On picker close
          $dateInput.on('hide.daterangepicker', (ev: any, picker: any) => {
          });
        });
      }
 

  onDateRangeChange(e: any) {
   if (!e?.startDate || !e?.endDate) return;

  const start = e.startDate.toDate();
  const end = e.endDate.toDate();

  this.fromDate = this.formatDate(start);
  this.toDate = this.formatDate(end);
}

  formatDate(date: Date): string {
    return moment(date).format('DD-MMM-YYYY');
  }

  onFilterByChange(type: 'Vendor' | 'RTO') {
    this.filterBy = type;

    // 🔥 RESET ALL FIELDS
    this.selectedVendor = null;
    this.alertData = [];
    this.showSummary = false;

    // 🔄 LOAD NEW DATA
      this.loadVendorList();

  }

  loadVendorList() {
    this.dashboardService.getVendorList().subscribe(res => {
      if (res.status){ 
        this.vendorList = res.entity;
        this.vendorList.unshift({ param1: 'All', param2: 'All' })
      };
    });
  }

  

  

  page = 1
  totalPages = 0
  getAlertOverview() {

    // 🔥 VALIDATIONS START

    if (this.filterBy === 'Vendor' && !this.selectedVendor) {
      this.toast.show('Please select vendor', 'error');
      return;
    }

    
    // if (!this.fromDate || !this.toDate) {
    //   this.toast.show('Please select date range', 'error');
    //   return;
    // }

    let daterange = $('#datepicker').val().split(" - ")
    this.formReq.param4 = daterange[0];
    this.formReq.param5 = daterange[1];



    // 🔥 VALIDATIONS END



    this.formReq.param1 = this.searchText;
    this.formReq.param2 = this.page;
    this.formReq.param3 = this.pageSize;
    // this.formReq.param4 = this.fromDate;
    // this.formReq.param5 = this.toDate;
    this.formReq.param6 = this.fromTime || '00:00';
    this.formReq.param7 = this.toTime || '23:59';
    this.formReq.param10 = ""; //rtoid
    this.formReq.param11 = ''; //classid
    this.formReq.vehicleidlist = [];
    this.formReq.vendoridlist = this.selectedVendor ? [this.selectedVendor] : [];
    this.loading = true;
    this.formReq.pdfexcel = '';
    this.alertService.getVendorwiseSosSessionReport(this.formReq).subscribe({
      
      next: (res: any) => {
        if(res.statuscode==200) {
          this.loading = false;
          this.alertData = res?.entity?.listData || res?.entity || [];
          const total = Number(res?.entity?.param1 || 0);
          this.totalCount = total;
          this.pageCount = this.alertData.length;
          // ✅ pages
          this.totalPages = Math.ceil(total / this.pageSize);
        } else {
          this.toast.show('No data found', 'error');
          this.alertData = [];
          this.totalCount = 0;
          this.pageCount = 0;
          this.totalPages = 0;    
        }
      this.cdr.detectChanges();

    },
    error: (err) => {
        this.loading = false;
        console.error(err);
        this.toast.show('Something went wrong', 'error');
      }
    });
  }
  // 🔍 search text
  searchText = '';

  // pagination
  pageSize: number = 20;
  pageCount = 0;
  totalCount = 0;
  pageSizeOptions = [10, 20, 50, 100];


  // 🔎 SEARCH
  getSearchDetails() {
    this.getAlertOverview();

    // agar backend search hai to yaha API call karo
    // abhi ke liye existing data filter example

    if (!this.searchText) {
      return this.getAlertOverview();
    }

    const text = this.searchText.toLowerCase();

    this.alertData = this.alertData.filter((item: any) =>
      Object.values(item).some(val =>
        String(val).toLowerCase().includes(text)
      )
    );

  }


  // 🔄 RELOAD
  reloadData() {
    this.searchText = '';
    this.getAlertOverview();
  }


  // 📄 PAGE SIZE CHANGE
  onPageSizeChange(size: any) {

    if (size === 'All') {
      this.pageSize = this.totalCount;
    } else {
      this.pageSize = Number(size);
    }

    this.pageCount = Math.min(this.pageSize, this.totalCount);
  }


  eventPage = 1;
  eventPageSize = 10;
  eventTotal = 0;
  eventTotalPages = 0;


  showEventModal = false;
  eventList: any[] = [];
  filteredEventList: any[] = [];
  eventSearch = '';
  totalEventCount = 0;

  filterEventData() {
    const text = this.eventSearch.toLowerCase();

    this.filteredEventList = this.eventList.filter(e =>
      Object.values(e).some(val =>
        String(val).toLowerCase().includes(text)
      )
    );
  }
  closeEventModal() {
    this.showEventModal = false;
  }
  selectedRow: any; // 🔥 store clicked row
  
  
 

  
  changePage(p: number) {

    if (p < 1 || p > this.totalPages) return;

    this.page = p;

    this.getAlertOverview(); // 🔥 reload API
  }
  onPageSizeChanged(size: any) {

    if (size === 'All') {
      this.pageSize = this.totalCount;
    } else {
      this.pageSize = Number(size);
    }

    this.page = 1; // 🔥 reset page
    this.getAlertOverview(); // 🔄 reload
  }
  
  onFormatChange(event: any) {
    const value = event.target.value;

    if (value === 'excel') {
      this.exportToExcel();
    }
  }
  exportToExcel() {

   
    // 🔥 2. VALIDATIONS (same as your API)
    if (this.filterBy === 'Vendor' && !this.selectedVendor) {
      this.toast.show('Please select vendor', 'error');
      return;
    }

    if (!this.fromDate || !this.toDate) {
      this.toast.show('Please select date range', 'error');
      return;
    }


    this.loading = true;

    // 🔥 5. API CALL
    this.formReq.param2 = "";
    this.formReq.param3 = "";
    this.formReq.pdfexcel = "EXCEL";
    this.alertService.getVendorwiseSosSessionReport(this.formReq).subscribe({
      next: (response: any) => {
        this.loading = false;
        if(response.statuscode==200) {
          this.toast.commonFileDownload(response.entity);
        } else {
          this.toast.show('File download failed (Invalid server response)', 'error');
        }
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        this.toast.show('Excel download failed', 'error');
      }
    });
  }
}
