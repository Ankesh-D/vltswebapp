import { ReportService } from './../../../core/services/report.service';
import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { AlertService } from '../../../core/services/alert.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { ToastService } from '../../../core/services/toast.service';
import dayjs from 'dayjs';
import { Dayjs } from 'dayjs';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';
declare var $: any;

@Component({
    selector: 'app-distance-travelled-report',
    imports: [FormsModule, NgxDaterangepickerMd, CommonTableComponent],
    templateUrl: './distance-travelled-report.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./distance-travelled-report.component.scss']
})
export class DistanceTravelledReportComponent implements OnInit, AfterViewInit {
  readonly tableColumns: CommonTableColumn[] = [
    { key: 'column1', label: '#' },
    { key: 'column2', label: 'Vehicle No.' },
    { key: 'column3', label: 'IMEI No.' },
    { key: 'column4', label: 'Vehicle Class' },
    { key: 'column5', label: 'Customer Details' },
    { key: 'column6', label: 'From Date' },
    { key: 'column7', label: 'To Date' },
    { key: 'column8', label: 'Distance(km/hrs)' }
  ];


  loading = false;
  showSummary = false;
  deviceType: 'NEW' | 'OLD' = 'NEW'; // default NEW
  filterBy = '';

  selectedVendor = '';
  selectedRTO = '';
  selectedVehicle = '';
  selectedAlertType = '';
  selectedDateFilter = '';

  fromDate = '';
  toDate = '';
  fromTime = '00:00';
  toTime = '23:59';

  vendorList: any[] = [];
  rtoList: any[] = [];
  vehicleList: any[] = [];
  alertTypeList: any[] = [];
  alertData: any[] = [];
  roleId: string = '';
  constructor(
    private toast: ToastService,
    private ReportService: ReportService,
    private alertService: AlertService,
    private dashboardService: DashboardService,
    private vehicleService: VehicleService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef
  ) { 
    this.roleId = sessionStorage.getItem('roleid') || ''; 
    this.toast.pageName = 'Distance Travelled Report'; // Set page name for toast service
  }

  ngOnInit() {
    // this.loadAlertTypes();
    this.loadVendorList();
    this.filterBy = 'Vendor';
    const today = new Date();
    this.fromDate = this.formatDate(today);
    this.toDate = this.formatDate(today);
  }
  today: Dayjs = dayjs();

  selectedDateRange = {
    startDate: dayjs().startOf('day'),
    endDate: dayjs().endOf('day')
  };


  onDateRangeChange(e: any) {
    if (!e?.startDate || !e?.endDate) return;

    const start = e.startDate.toDate();
    const end = e.endDate.toDate();

    this.fromDate = this.formatDate(start);
    this.toDate = this.formatDate(end);
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

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    }).replace(/ /g, '-');
  }

  onFilterByChange(type: 'Vendor' | 'RTO') {
    this.filterBy = type;

    // 🔥 RESET ALL FIELDS
    this.selectedVendor = '';
    this.selectedRTO = '';
    this.selectedVehicle = '';
    this.selectedAlertType = '';

    this.vehicleSearch = '';

    this.fullVehicleList = [];
    this.visibleVehicleList = [];

    this.alertData = [];
    this.showSummary = false;

    // OPTIONAL: reset date/time if needed
    // this.fromDate = '';
    // this.toDate = '';

    // 🔄 LOAD NEW DATA
    if (type === 'Vendor') {
      this.loadVendorList();
    } else {
      this.loadRTOList();
    }
  }

  loadVendorList() {
    this.dashboardService.getVendorList().subscribe(res => {
      if (res.status) this.vendorList = res.entity;
    });
  }

  loadRTOList() {
    this.dashboardService.getRTOList().subscribe(res => {
      if (res.status) this.rtoList = res.entity;
    });
  }

  loadAlertTypes() {
    this.alertService.getAlertTypeDetails().subscribe(res => {
      if (res.status) this.alertTypeList = res.entity;
    });
  }
  onVehicleSearchChange() {

    if (!this.vehicleSearch) {
      // 🔥 input empty → reset everything
      this.fullVehicleList = [];
      this.visibleVehicleList = [];
      this.selectedVehicle = '';
      this.isVehicleLoaded = false;
    }

  }
  onVendorChange() {
    this.selectedVehicle = '';
    this.vehicleSearch = '';
    this.fullVehicleList = [];
    this.visibleVehicleList = [];
    this.isVehicleLoaded = false;
  }
  searchVehicle() {

    if (!this.vehicleSearch) {
      this.toast.show('Please enter vehicle number', 'error');
      return;
    }

    if (!this.selectedVendor && !this.selectedRTO) {
      this.toast.show('Please select vendor or RTO', 'error');
      return;
    }

    const req = {
      selectvendorid: this.selectedVendor || '',
      selectroleid: '',
      routeid: '',
      poiid: '',
      selectcustomerid: '',
      vehicleclassid: '',
      //  searchtype: this.deviceType === 'NEW' ? 'TCP' : 'HTTP',
      searchtype: '',
      rtoid: this.selectedRTO || '',
      searchby: this.vehicleSearch
    };

    this.vehicleService.getVehicleListV2(req).subscribe(res => {

      const data = res?.entity || [];

      // ❌ NO DATA
      if (!data || data.length === 0) {

        this.fullVehicleList = [];
        this.visibleVehicleList = [];
        this.isVehicleLoaded = false;

        this.toast.show('No vehicle found', 'error');   // 🔥 DIRECT

        return;
      }

      // ✅ DATA FOUND
      this.fullVehicleList = data;
      this.visibleVehicleList = data.slice(0, this.vehicleLimit);
      this.isVehicleLoaded = true;

      this.toast.show('Vehicle loaded successfully', 'success'); // optional

      this.cdr.detectChanges();

    }, err => {

      this.toast.show('Something went wrong', 'error'); // 🔥 DIRECT
      this.isVehicleLoaded = false;

    });
  }

  onRTOChange() {
    this.selectedVehicle = '';
    this.vehicleSearch = '';
    this.fullVehicleList = [];
    this.visibleVehicleList = [];
    this.isVehicleLoaded = false;
  }

  page = 1
  totalPages = 0
  getAlertOverview() {

    if (this.filterBy === 'Vendor' && !this.selectedVendor) {
      this.toast.show('Please select vendor', 'error');
      return;
    }

    if (this.filterBy === 'RTO' && !this.selectedRTO) {
      this.toast.show('Please select RTO', 'error');
      return;
    }

    if (!this.selectedVehicle) {
      this.toast.show('Please select vehicle', 'error');
      return;
    }

    if (!this.fromDate || !this.toDate) {
      this.toast.show('Please select date range', 'error');
      return;
    }
    let companyId = '';

    if (this.filterBy === 'Vendor') {
      companyId = this.selectedVendor !== 'All' ? this.selectedVendor : '';
    }

    if (this.filterBy === 'RTO') {
      companyId = this.selectedRTO !== 'All' ? this.selectedRTO : '';
    }

    // 📅 Date format sync
    if (this.selectedDateRange?.startDate && this.selectedDateRange?.endDate) {
      this.fromDate = this.formatDate(this.selectedDateRange.startDate.toDate());
      this.toDate = this.formatDate(this.selectedDateRange.endDate.toDate());
    }

    const req = {
      param1: '',
      param2: this.page.toString(),
      param3: this.pageSize.toString(),
      param4: this.fromDate,
      param5: this.toDate,
      param6: this.fromTime || '00:00',
      param7: this.toTime || '23:59',
      param8: this.selectedVehicle,
      param9: this.selectedVendor || this.selectedRTO,
    };

    this.loading = true;
    this.ReportService.getDistanceTravelledReport(req).subscribe(res => {
      this.loading = false;

      // Handle specific "No Data Found" string response
      if (res?.status && typeof res.entity === 'string' && res.entity === 'No Data Found') {
        this.toast.show('No data found', 'success');
        this.showSummary = false;
        this.alertData = []; // Clear previous data
        this.cdr.detectChanges();
        return;
      }
      const data = res?.entity?.listData || res?.entity || [];
      const total = Number(res?.entity?.param1 || 0);
      this.totalCount = total;
      // 🔥 current page records count
      this.pageCount = this.alertData.length;
      // 🔥 total pages
      this.totalPages = Math.ceil(total / this.pageSize);
      // ❌ NO DATA
      if (!data || data.length === 0) {
        this.toast.show('No data found', 'success');
        this.showSummary = false;
        return;
      }

      // ✅ DATA FOUND
      this.alertData = data;
      this.showSummary = true;
      this.cdr.detectChanges();
    }, err => {
      this.loading = false;
      this.toast.show('Something went wrong', 'error');
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


  fullVehicleList: any[] = [];
  visibleVehicleList: any[] = [];

  vehicleLimit = 100;   // 🔥 only 100 items render
  vehicleSearch = '';


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

    this.loadEventData();
  }
  loadEventData() {

    const request = {
      param1: '',
      param2: this.eventPage.toString(),
      param3: this.eventPageSize.toString(),

      param4: this.selectedVehicle,
      param5: this.selectedAlertType,

      param6: this.fromDate,
      param7: this.fromTime,
      param8: this.toTime,

      param9: '',
      param10: this.selectedVendor || this.selectedRTO,
      param11: this.toDate
    };

    this.loading = true;

    this.ReportService.getAlertActivityReport(request).subscribe({
      next: (res: any) => {
        this.loading = false;

        const data = res?.entity?.listData || [];

        this.eventList = data;
        this.filteredEventList = [...data];

        this.eventTotal = Number(res?.entity?.param1 || 0);

        // 🔥 TOTAL PAGES CALCULATION
        this.eventTotalPages = Math.ceil(this.eventTotal / this.eventPageSize);

        this.showEventModal = true;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
  changeEventPage(page: number) {

    if (page < 1 || page > this.eventTotalPages) return;

    this.eventPage = page;

    this.loadEventData(); // 🔥 reload API
  }


  isVehicleLoaded = false;


  onEventPageSizeChange(size: any) {

    if (size === 'All') {
      this.eventPageSize = this.eventTotal;
    } else {
      this.eventPageSize = Number(size);
    }

    this.eventPage = 1;   // 🔥 reset page
    this.loadEventData(); // 🔄 reload API
  }
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


}
