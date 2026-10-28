import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../../core/services/report.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';

declare var $: any;

@Component({
  selector: 'app-alert-event-report',
  standalone: true,
  imports: [CommonModule, FormsModule, CommonTableComponent],
  templateUrl: './alert-event-report.component.html',
  styleUrl: './alert-event-report.component.scss'
})
export class AlertEventReportComponent {
  readonly tableColumns: CommonTableColumn<any>[] = [
    { key: 'param1', label: '#', width: '40px' },
    { key: 'param4', label: 'Vehicle No.', sortable: true },
    { key: 'param16', label: 'IMEI No.', sortable: true },
    { key: 'param32', label: 'Vehicle Class', sortable: true },
    { key: 'customerDetails', label: 'Customer Details', sortable: true, sortKey: 'param27' },
    { key: 'param5', label: 'From Date', sortable: true },
    { key: 'param6', label: 'To Date', sortable: true },
    { key: 'param7', label: 'Distance(km/hrs)', sortable: true }
  ];

  filterBy: string = 'Vendor';
  selectedVendorId: string = '';
  selectedRTOId: string = '';
  selectedVehicleId: string = '';
  selectedAlertType: string = '';
  
  fromDate: string = '';
  toDate: string = '';
  fromTime: string = '00:00';
  toTime: string = '23:59';
  
  vendorList: any[] = [];
  rtoList: any[] = [];
  vehicleList: any[] = [];
  alertList: any[] = [];
  
  reportData: any[] = [];
  loading = false;
  showSummary = false;
  showReport = false;
  
  selectName: string = '';
  searchValue: string = '';
  searchVelRto: string = '';
  searchAlert: string = '';
  dateRange: string = '';
  timeRange: string = '';
  searchValueId: string = '';
  searchAlertId: string = '';
  selectRoleId: string = '';
  
  searchText: string = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [20, 50, 100, 200, 500];
  totalCount = 0;
  pageCount = 0;
  
  sortKey: string = '';
  reverse: boolean = false;
  
  constructor(
    private reportService: ReportService,
    private dashboardService: DashboardService,
    private vehicleService: VehicleService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit() {
    this.initializeDatePickers();
    this.initializeTimePickers();
    this.loadInitialData();
    this.loadAlertTypes();
  }
  
  ngAfterViewInit() {
    setTimeout(() => {
      this.initializeDatePickers();
      this.initializeTimePickers();
    }, 200);
  }
  
  loadInitialData() {
    if (this.filterBy === 'Vendor') {
      this.loadVendorList();
    } else if (this.filterBy === 'RTO') {
      this.loadRTOList();
    }
  }
  
  loadAlertTypes() {
    this.reportService.getAlertTypeDetails().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.alertList = response.entity;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading alert types:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  onFilterChange(filterType: string) {
    this.filterBy = filterType;
    this.selectedVendorId = '';
    this.selectedRTOId = '';
    this.vehicleList = [];
    this.selectedVehicleId = '';
    
    if (filterType === 'Vendor') {
      this.loadVendorList();
      this.selectRoleId = this.encryptionService.encryptAccountId('11');
    } else if (filterType === 'RTO') {
      this.loadRTOList();
      this.selectRoleId = this.encryptionService.encryptAccountId('19');
    }
  }
  
  loadVendorList() {
    this.loading = true;
    this.dashboardService.getVendorList().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.vendorList = response.entity;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading vendor list:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  loadRTOList() {
    this.loading = true;
    this.dashboardService.getRTOList('').subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.rtoList = response.entity;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading RTO list:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  onVendorChange() {
    if (!this.selectedVendorId) {
      this.vehicleList = [];
      return;
    }
    
    this.loading = true;
    const encryptedVendorId = this.encryptionService.encryptAccountId(this.selectedVendorId);
    const encryptedRoleId = this.encryptionService.encryptAccountId('11');
    
    this.vehicleService.getVehicleRoster(encryptedVendorId, encryptedRoleId).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.vehicleList = response.entity;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading vehicle list:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  onRTOChange() {
    if (!this.selectedRTOId) {
      this.vehicleList = [];
      return;
    }
    
    this.loading = true;
    const encryptedRTOId = this.encryptionService.encryptAccountId(this.selectedRTOId);
    const encryptedRoleId = this.encryptionService.encryptAccountId('19');
    
    this.vehicleService.getVehicleRoster(encryptedRTOId, encryptedRoleId).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.vehicleList = response.entity;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading vehicle list:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
initializeDatePickers() {
  setTimeout(() => {
    if (typeof $ === 'undefined' || !$.fn.datepicker) {
      console.error('bootstrap-datepicker not loaded');
      return;
    }

    // destroy old instances to avoid multiple binding
    $('.datepick').datepicker('destroy');

    // init
    $('.datepick').datepicker({
      format: 'dd-M-yyyy',
      autoclose: true,
      todayHighlight: true,
      orientation: 'bottom auto',
      container: 'body'
    });

    const today = new Date();

    // set default values
    $('#fromdate').datepicker('setDate', today);
    $('#todate').datepicker('setDate', today);

    // update model also
    this.fromDate = this.formatDate(today);
    this.toDate = this.formatDate(today);

    // remove old handlers first
    $('#fromdate').off('changeDate');
    $('#todate').off('changeDate');

    // bind handlers safely
    $('#fromdate').on('changeDate', (e: any) => {
      const dt = e?.date;
      if (!dt) return;
      this.fromDate = this.formatDate(dt);
      this.cdr.detectChanges();
    });

    $('#todate').on('changeDate', (e: any) => {
      const dt = e?.date;
      if (!dt) return;
      this.toDate = this.formatDate(dt);
      this.cdr.detectChanges();
    });

  }, 200);
}

  
  initializeTimePickers() {
    // Time picker initialization
  }
  
  formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
  
  getSearchActivity() {
    if (this.filterBy === 'Vendor' && !this.selectedVendorId) {
      alert('Select Vendor');
      return;
    }
    if (this.filterBy === 'RTO' && !this.selectedRTOId) {
      alert('Select RTO');
      return;
    }
    if (!this.selectedVehicleId) {
      alert('Select Vehicle/Chassis No.');
      return;
    }
    if (!this.selectedAlertType) {
      alert('Select Alert Type');
      return;
    }
    
    const fromDateEl = document.getElementById('fromdate') as HTMLInputElement;
    const toDateEl = document.getElementById('todate') as HTMLInputElement;
    const fromTimeEl = document.getElementById('fromtime') as HTMLInputElement;
    const toTimeEl = document.getElementById('totime') as HTMLInputElement;
    
    if (!fromDateEl?.value || !toDateEl?.value || !fromTimeEl?.value || !toTimeEl?.value) {
      alert('Please fill all date and time fields');
      return;
    }
    
    const date1 = new Date(fromDateEl.value);
    const date2 = new Date(toDateEl.value);
    const diffTime = date2.getTime() - date1.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);
    
    if (date1 > date2) {
      alert('Invalid date range, fromdate should not greater than todate');
      return;
    }
    if (diffDays > 9) {
      alert('Select date range between 10 days');
      return;
    }
    
    this.selectName = this.filterBy;
    if (this.filterBy === 'Vendor') {
      const vendor = this.vendorList.find(v => v.param1 === this.selectedVendorId);
      this.searchValue = vendor ? vendor.param2 : 'All';
      this.searchValueId = this.selectedVendorId;
    } else {
      const rto = this.rtoList.find(r => r.param1 === this.selectedRTOId);
      this.searchValue = rto ? rto.param2 : 'All';
      this.searchValueId = this.selectedRTOId;
    }
    
    const vehicle = this.vehicleList.find(v => v.param1 === this.selectedVehicleId);
    this.searchVelRto = vehicle ? vehicle.param2 : 'All';
    
    const alertItem = this.alertList.find(a => a.param1 === this.selectedAlertType);
    this.searchAlert = alertItem ? alertItem.param2 : 'All';
    this.searchAlertId = this.selectedAlertType;
    
    this.dateRange = `${fromDateEl.value} - ${toDateEl.value}`;
    this.timeRange = `${fromTimeEl.value} - ${toTimeEl.value}`;
    
    this.getAlertActivityDetails(1);
  }
  
  getAlertActivityDetails(pageNo: number) {
    this.loading = true;
    this.currentPage = pageNo;
    
    const fromDateEl = document.getElementById('fromdate') as HTMLInputElement;
    const toDateEl = document.getElementById('todate') as HTMLInputElement;
    const fromTimeEl = document.getElementById('fromtime') as HTMLInputElement;
    const toTimeEl = document.getElementById('totime') as HTMLInputElement;
    
    const encryptedVehicleId = this.encryptionService.encryptAccountId(this.selectedVehicleId);
    const encryptedAlertId = this.encryptionService.encryptAccountId(this.searchAlertId);
    const encryptedValueId = this.encryptionService.encryptAccountId(this.searchValueId);
    
    const request = {
      param1: this.searchText.trim(),
      param2: pageNo.toString(),
      param3: this.pageSize === this.totalCount ? 'All' : this.pageSize.toString(),
      param4: encryptedVehicleId,
      param5: encryptedAlertId,
      param6: fromDateEl?.value || this.fromDate,
      param7: fromTimeEl?.value || this.fromTime,
      param8: toTimeEl?.value || this.toTime,
      param9: this.selectRoleId,
      param10: encryptedValueId,
      param11: toDateEl?.value || this.toDate
    };
    
    this.reportService.getAlertActivityReport(request).subscribe({
      next: (response) => {
        this.loading = false;
        this.showSummary = true;

        const entity: any = response.entity as any;
        if (entity === 'No Data Found' || !entity || entity.param1 === 0) {
          this.reportData = [];
          this.totalCount = 0;
          this.pageCount = 0;
          this.showReport = false;
        } else if (entity && entity.listData) {
          this.showReport = true;
          this.reportData = entity.listData;
          this.totalCount = entity.param1 || 0;
          this.pageCount = this.reportData.length < this.pageSize ? this.reportData.length : this.pageSize;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading alert activity report:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  getSearchDetails() {
    this.currentPage = 1;
    this.getAlertActivityDetails(1);
  }
  
  reloadData() {
    this.searchText = '';
    this.currentPage = 1;
    this.getAlertActivityDetails(1);
  }
  
  sort(key: string) {
    if (this.sortKey === key) {
      this.reverse = !this.reverse;
    } else {
      this.sortKey = key;
      this.reverse = false;
    }
    
    this.reportData.sort((a, b) => {
      const aVal = (a as any)[key] || '';
      const bVal = (b as any)[key] || '';
      
      if (this.reverse) {
        return bVal.localeCompare(aVal);
      } else {
        return aVal.localeCompare(bVal);
      }
    });
  }
  
  onPageChange(page: number) {
    this.getAlertActivityDetails(page);
  }
//   formatDate(date: any): string {
//   if (!date) return '';

//   const d = new Date(date);
//   if (isNaN(d.getTime())) return '';

//   const day = String(d.getDate()).padStart(2, '0');
//   const month = d.toLocaleString('default', { month: 'short' });
//   const year = d.getFullYear();
//   return `${day}-${month}-${year}`;
// }

  onPageSizeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newSize = target.value;
    this.pageSize = newSize === 'All' ? this.totalCount : parseInt(newSize);
    this.currentPage = 1;
    this.getAlertActivityDetails(1);
  }
  
  getTotalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }
  
  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pages: number[] = [];
    const maxPages = Math.min(totalPages, 8);
    for (let i = 1; i <= maxPages; i++) {
      pages.push(i);
    }
    return pages;
  }
  
  getPaginatedData(): any[] {
    return this.reportData;
  }
}
