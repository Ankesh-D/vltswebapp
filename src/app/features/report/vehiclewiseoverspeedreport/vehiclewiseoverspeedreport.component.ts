import { OverspeedReportResponse, ReportService } from './../../../core/services/report.service';
import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { LoaderService } from '../../../core/services/loader.service';
import { OverspeedReportReq } from '../../../core/model/request.model';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { OverspeedReportResp } from '../../../core/model/response.model';
import { PanicSessionMapComponent } from '../../dashboard/panic-session-map/panic-session-map.component';
import { PanicSession, apiField } from '../../dashboard/panic-session-map/panic-session.model';
import { CommonDataToolbarComponent } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';
declare var $: any;

@Component({
  selector: 'app-vehiclewiseoverspeedreport',
  standalone: true,
  imports: [CommonModule, NgxDaterangepickerMd, FormsModule, NgSelectModule, NgbPaginationModule, PanicSessionMapComponent, CommonDataToolbarComponent, CommonTableComponent],
  templateUrl: './vehiclewiseoverspeedreport.component.html',
  styleUrl: './vehiclewiseoverspeedreport.component.scss'
})
export class VehiclewiseoverspeedreportComponent implements OnInit, AfterViewInit {
  readonly tableColumns: CommonTableColumn[] = [
    { key: 'column1', label: '#' },
    { key: 'column2', label: 'Vehicle No.' },
    { key: 'column3', headers: ['IMEI No.', 'Serial No.'] },
    { key: 'column4', label: 'Vehicle Class' },
    { key: 'column5', label: 'Event Counts' },
    { key: 'column6', label: 'Track' }
  ];

  // today: Dayjs = dayjs();
  //   selectedDateRange = {
  //     startDate: dayjs().startOf('month').toDate(),
  //     endDate: dayjs().endOf('month').toDate()
  //   };
  //   locale = {
  //   format: 'DD-MMM-YYYY'
  // };
  loading = false;
  showSummary = false;
  // deviceType: 'NEW' | 'OLD' = 'NEW'; // default NEW
  // filterBy = 'Vendor';

  // selectedVendor: any = null;
  // selectedRTO: any = null;
  // selectedVehicle: any = null;
  selectedSpeed: any = null;
  selectedDateFilter = '';

  fromDate = '';
  toDate = '';
  // fromTime = '00:00';
  // toTime = '23:59';

  // vendorList: any[] = [];
  // rtoList: any[] = [];
  // vehicleList: any[] = [];
  speedList: any[] = [];
  alertData: OverspeedReportResp[] = [];
  roleId: string = '';
  formReq: OverspeedReportReq = new OverspeedReportReq();
  
  constructor(
    private toast: ToastService,
    private ReportService: ReportService,
    private alertService: AlertService,
    private dashboardService: DashboardService,
    private vehicleService: VehicleService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef,
    public loader: LoaderService
  ) { this.roleId = sessionStorage.getItem('roleid') || '';
      this.toast.pageName = 'Vehicle Wise Over Speed Report'; // Set page name for toast service
   }
  searchInput = new Subject<string>();
  filteredOptions: any[] = [];
  loadingVehicle: boolean = false;
  ngOnInit() {
    this.initializeDatePicker();
    // this.filterBy = 'Vendor';
    // this.loadAlertTypes();
    // this.loadVendorList();
    this.getSpeedList();
    // this.fromDate = this.formatDate(this.selectedDateRange.startDate);
    // this.toDate = this.formatDate(this.selectedDateRange.endDate);

  //   this.searchInput.subscribe((vehicleSearch: any) => {
  //   this.loading = true;
  //   const req = {
  //     selectvendorid: this.selectedVendor || '',
  //     selectroleid: '',
  //     routeid: '',
  //     poiid: '',
  //     selectcustomerid: '',
  //     vehicleclassid: '',
  //     searchtype: '',
  //     rtoid: this.selectedRTO || '',
  //     searchby: vehicleSearch //this.vehicleSearch
  //   };
  //   if (vehicleSearch.length >=4 ) {
  //     this.loadingVehicle = true;
  //     this.vehicleService.getVehicleListV2(req).subscribe(res => {
  //       this.visibleVehicleList = res?.entity || [];
  //       this.visibleVehicleList = [
  //           { param1: 'All', param2: 'All' },
  //           ...(res?.entity || [])
  //         ];
  //       this.loadingVehicle = false;
  //     });
  //   }
  // });
  }
  getSpeedList() {
    this.speedList = [];
    for (let i = 40; i <= 200; i += 10) {
      this.speedList.push({ param1: i.toString(), param2: i.toString()+ ' km/hr' });
    }
  }
  initializeDatePicker() {
  
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
 

  // {
  //   startDate: dayjs().startOf('day'),
  //   endDate: dayjs().endOf('day')
  // };

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
  ngAfterViewInit() {

  }

  initializeDatePickers() {
    setTimeout(() => {
      $('#fromdate').datepicker({ autoclose: true, format: 'dd-M-yyyy' })
        .on('changeDate', (e: any) => this.fromDate = this.formatDate(e.date));

      $('#todate').datepicker({ autoclose: true, format: 'dd-M-yyyy' })
        .on('changeDate', (e: any) => this.toDate = this.formatDate(e.date));
    }, 200);
  }

  onFilterByChange(type: 'Vendor' | 'RTO') {
    this.selectedSpeed = '';
    this.alertData = [];
    this.showSummary = false;
    this.pageCount = 0;
    this.totalCount =0;
 
  }
  page = 1
  totalPages = 0
  getReportOverview() {
    let daterange = $('#datepicker').val().split(" - ")
    this.formReq.param5 = daterange[0];
    this.formReq.param6 = daterange[1];
    // 🔥 VALIDATIONS START
    if (!this.selectedSpeed) {
      this.toast.show('Please select speed', 'error');
      return;
    }

    this.formReq.param1 = this.searchText;
    this.formReq.param2 = this.page;
    this.formReq.param3 = this.pageSize;
    this.formReq.param4 = "";
    this.formReq.param7 = this.selectedSpeed ? this.selectedSpeed : '';
    this.formReq.pdfexcel = '';
    this.loading = true;
    this.loader.show();
    this.alertService.getVehicleWiseOverspeedReport(this.formReq).subscribe({
      
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
    this.getReportOverview();

    // agar backend search hai to yaha API call karo
    // abhi ke liye existing data filter example

    if (!this.searchText) {
      return this.getReportOverview();
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
    this.getReportOverview();
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
  onEventCountClick(d: any) {

    this.selectedRow = d; // ✅ store row
    this.eventPage = 1;   // ✅ reset page

    // this.loadEventData();
  }
  


  isVehicleLoaded = false;


  // onEventPageSizeChange(size: any) {

  //   if (size === 'All') {
  //     this.eventPageSize = this.eventTotal;
  //   } else {
  //     this.eventPageSize = Number(size);
  //   }

  //   this.eventPage = 1;   // 🔥 reset page
  //   this.loadEventData(); // 🔄 reload API
  // }
  changePage(p: number) {

    if (p < 1 || p > this.totalPages) return;

    this.page = p;

    this.getReportOverview(); // 🔥 reload API
  }
  onPageSizeChanged(size: any) {

    if (size === 'All') {
      this.pageSize = this.totalCount;
    } else {
      this.pageSize = Number(size);
    }

    this.page = 1; // 🔥 reset page
    this.getReportOverview(); // 🔄 reload
  }
  // downloadexcelmodel(event: any) {
  //   const value = event.target.value;

  //   if (value === 'excel') {
  //     this.exportToExcelmodel();
  //   }
  // }
  onPageChange(page: number) {
    this.page = page;
    this.getReportOverview();
  }

  onFormatChange(event: any) {
    const value = event.target.value;

    if (value === 'excel') {
      this.exportToExcel();
    }
  }
  // exportToExcelmodel() {

  //   // 🔥 1. CHECK TABLE DATA FIRST
  //   if (!this.alertData || this.alertData.length === 0) {
  //     this.toast.show('No data available to export', 'error');
  //     return;
  //   }

  //   // 🔥 2. VALIDATIONS (same as your API)
  //   if (this.filterBy === 'Vendor' && !this.selectedVendor) {
  //     this.toast.show('Please select vendor', 'error');
  //     return;
  //   }

  //   if (this.filterBy === 'RTO' && !this.selectedRTO) {
  //     this.toast.show('Please select RTO', 'error');
  //     return;
  //   }

  //   if (!this.selectedVehicle) {
  //     this.toast.show('Please select vehicle', 'error');
  //     return;
  //   }

  //   if (!this.selectedSpeed) {
  //     this.toast.show('Please select alert type', 'error');
  //     return;
  //   }

  //   // if (!this.fromDate || !this.toDate) {
  //   //   this.toast.show('Please select date range', 'error');
  //   //   return;
  //   // }

  //   const vehicleObj = this.fullVehicleList.find(
  //     (v: any) => v.param1 === this.selectedVehicle
  //   );

  //   // const alertObj = this.alertTypeList.find(
  //   //   (a: any) => a.param1 === this.selectedSpeed
  //   // );

  //   const vendorObj = this.vendorList.find(
  //     (v: any) => v.param1 === (this.selectedVendor)
  //   );
  //   const rtoObj = this.rtoList.find(
  //     (v: any) => v.param1 === (this.selectedRTO)
  //   );


  //   // 🔥 4. REQUEST
  //   const request = {
  //     param1: this.searchText,

  //     param2: (this.showEventModal ? this.eventPage : this.page).toString(),
  //     param3: (this.showEventModal ? this.eventPageSize : this.pageSize).toString(),

  //     param4: this.selectedVehicle,
  //     param5: this.selectedSpeed,

  //     param6: this.fromDate,
  //     param7: this.fromTime,
  //     param8: this.toTime,

  //     param9: '',
  //     param10: this.selectedVendor || this.selectedRTO,
  //     param11: this.toDate,
  //     vehicleno: vehicleObj?.param2 || '',
  //     // alertname: alertObj?.param2 || '',
  //     vendorname: vendorObj?.param2 || rtoObj?.param2,
  //     pdfexcel: 'EXCEL'
  //   };

  //   // console.log('Excel Request:', request);

  //   this.loading = true;

  //   // 🔥 5. API CALL
  //   this.ReportService.psv_get_historysignlevehiclealertdetailsexcel(request)
  //     .subscribe({
  //       next: (res: any) => {
  //         this.loading = false;

  //         // ✅ STRICT VALIDATION
  //         if (
  //           res &&
  //           res.status === true &&
  //           typeof res.entity === 'string' &&
  //           res.entity.startsWith('http')
  //         ) {
  //           const fileUrl = res.entity;

  //           // 🔥 DIRECT DOWNLOAD (NO CUSTOM DATA)
  //           const a = document.createElement('a');
  //           a.href = fileUrl;
  //           a.target = '_blank';
  //           a.download = ''; // 🔥 IMPORTANT: server filename use hone de
  //           document.body.appendChild(a);
  //           a.click();
  //           document.body.removeChild(a);

  //           this.toast.show('Excel downloaded successfully', 'success');

  //         } else {
  //           // ❌ ANY OTHER RESPONSE = ERROR ONLY
  //           console.error('Invalid response:', res);
  //           this.toast.show('File download failed (Invalid server response)', 'error');
  //         }
  //       },
  //       error: (err) => {
  //         this.loading = false;
  //         console.error(err);
  //         this.toast.show('Excel download failed', 'error');
  //       }
  //     });
  // }
  exportToExcel() {

    // 🔥 1. CHECK TABLE DATA FIRST
    // if (!this.alertData || this.alertData.length === 0) {
    //   this.toast.show('No data available to export', 'error');
    //   return;
    // }

    // 🔥 2. VALIDATIONS (same as your API)
    // if (this.filterBy === 'Vendor' && !this.selectedVendor) {
    //   this.toast.show('Please select vendor', 'error');
    //   return;
    // }

    // if (this.filterBy === 'RTO' && !this.selectedRTO) {
    //   this.toast.show('Please select RTO', 'error');
    //   return;
    // }

    // if (!this.selectedVehicle) {
    //   this.toast.show('Please select vehicle', 'error');
    //   return;
    // }

    // if (!this.selectedSpeed) {
    //   this.toast.show('Please select alert type', 'error');
    //   return;
    // }

    // if (!this.fromDate || !this.toDate) {
    //   this.toast.show('Please select date range', 'error');
    //   return;
    // }


    this.loading = true;

    // 🔥 5. API CALL
    this.formReq.param2 = "";
    this.formReq.param3 = "";
    this.formReq.pdfexcel = "EXCEL";
    this.alertService.getVehicleWiseOverspeedReport(this.formReq).subscribe({
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
  selectedVehicleNo: string = "";
  mapSession: PanicSession | null = null;
  viewMapModal(d: any) {
    const text = (index: number) => String(apiField(d, index) ?? '').trim();
    if (!text(3)) { this.toast.show('Vehicle number is unavailable for tracking', 'error'); return; }
    this.selectedVehicleNo = text(3);
    this.mapSession = {
      sessionId: text(2), vehicleId: text(2), vehicleNumber: text(3),
      imeiNumber: text(4), deviceSerialNo: text(5), iccid: text(6),
      vendorName: text(7), ownerName: text(8), ownerPhone: text(9), vehicleClass: text(10),
      chassisNumber: '', rto: '', lastEventTime: '', lastEventLocation: '',
      latitude: null, longitude: null, status: ''
    };
  }
  closeModal() {
    this.mapSession = null;
  }
}
