import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService, OverspeedReportResponse } from '../../../core/services/report.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { EncryptionService } from '../../../core/services/encryption.service';

declare var $: any;

@Component({
  selector: 'app-over-speed-alert',
  standalone: true,
 imports: [CommonModule, FormsModule],
  templateUrl: './over-speed-alert.component.html',
  styleUrl: './over-speed-alert.component.scss'
})
export class OverSpeedAlertComponent implements OnInit, AfterViewInit {
  // Filter selection
  filterBy: string = 'Vendor'; // 'Vendor' or 'RTO'
  selectedVendorId: string = '';
  selectedRTOId: string = '';
  selectedVehicleId: string = '';
  selectedSpeed: string = '60';
  
  // Date and time
  fromDate: string = '';
  toDate: string = '';
  fromTime: string = '00:00';
  toTime: string = '23:59';
  
  // Dropdown lists
  vendorList: any[] = [];
  rtoList: any[] = [];
  vehicleList: any[] = [];
  
  // Report data
  reportData: any[] = [];
  loading = false;
  errorMessage = '';
  showSummary = false;
  showReport = false;
  
  // Summary data
  selectName: string = '';
  searchValue: string = '';
  searchVelRto: string = '';
  speedLimit: string = '';
  dateRange: string = '';
  timeRange: string = '';
  summaryTableData: string = '';
  
  // Search and pagination
  searchText: string = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [20, 50, 100, 200, 500];
  totalCount = 0;
  pageCount = 0;
  
  // Sorting
  sortKey: string = '';
  reverse: boolean = false;
  
  // Speed options
  speedOptions = ['30', '40', '50', '60', '70', '80', '90', '100'];
  
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
  }
  
  ngAfterViewInit() {
    setTimeout(() => {
      this.initializeDatePickers();
      this.initializeTimePickers();
    }, 200);
  }
  
  loadInitialData() {
    // Load vendor list when Vendor is selected
    if (this.filterBy === 'Vendor') {
      this.loadVendorList();
    } else if (this.filterBy === 'RTO') {
      this.loadRTOList();
    }
  }
  
  onFilterChange(filterType: string) {
    this.filterBy = filterType;
    this.selectedVendorId = '';
    this.selectedRTOId = '';
    this.vehicleList = [];
    this.selectedVehicleId = '';
    
    if (filterType === 'Vendor') {
      this.loadVendorList();
    } else if (filterType === 'RTO') {
      this.loadRTOList();
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
    // For RTO list, we need state code - using empty for now (will load all states)
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
    const encryptedRoleId = this.encryptionService.encryptAccountId('11'); // Role ID for Vendor
    
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
    const encryptedRoleId = this.encryptionService.encryptAccountId('19'); // Role ID for RTO
    
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
    if (typeof $ !== 'undefined' && $.fn.datepicker) {
      $('.datepick').datepicker({
        format: 'dd-M-yyyy',
        endDate: '+0d',
        autoclose: true,
        todayHighlight: true
      });

      const today = new Date();
      $('#fromdate').datepicker('setDate', today);
      $('#todate').datepicker('setDate', today);

      // fromdate
      $('#fromdate').off('changeDate').on('changeDate', (e: any) => {
        if (e && e.date) {
          this.fromDate = this.formatDate(e.date);
        } else {
          const val = ($('#fromdate').val() as string) || '';
          this.fromDate = val;
        }
        this.cdr.detectChanges();
      });

      // todate
      $('#todate').off('changeDate').on('changeDate', (e: any) => {
        if (e && e.date) {
          this.toDate = this.formatDate(e.date);
        } else {
          const val = ($('#todate').val() as string) || '';
          this.toDate = val;
        }
        this.cdr.detectChanges();
      });

      // initial set if empty
      if (!($('#fromdate').val() as string)) this.fromDate = this.formatDate(today);
      if (!($('#todate').val() as string)) this.toDate = this.formatDate(today);
    }
  }, 100);
}

  
  initializeTimePickers() {
    // Note: Time picker initialization would require wickedpicker library
    // For now, using basic input fields
    // In production, you'd initialize wickedpicker here
  }
  
 formatDate(date: any): string {
  if (!date || typeof date.getDate !== 'function') {
    return '';
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

  
  getOverspeedingData() {
    // Validation
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
    if (!this.selectedSpeed) {
      alert('Select Speed');
      return;
    }
    
    const fromDateEl = document.getElementById('fromdate') as HTMLInputElement;
    const toDateEl = document.getElementById('todate') as HTMLInputElement;
    const fromTimeEl = document.getElementById('fromtime') as HTMLInputElement;
    const toTimeEl = document.getElementById('totime') as HTMLInputElement;
    
    if (!fromDateEl?.value) {
      alert('Select From Date');
      return;
    }
    if (!toDateEl?.value) {
      alert('Select To Date');
      return;
    }
    if (!fromTimeEl?.value) {
      alert('Select From Time');
      return;
    }
    if (!toTimeEl?.value) {
      alert('Select To Time');
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
    
    // Set summary data
    this.selectName = this.filterBy;
    if (this.filterBy === 'Vendor') {
      const vendor = this.vendorList.find(v => v.param1 === this.selectedVendorId);
      this.searchValue = vendor ? vendor.param2 : 'All';
    } else {
      const rto = this.rtoList.find(r => r.param1 === this.selectedRTOId);
      this.searchValue = rto ? rto.param2 : 'All';
    }
    
    const vehicle = this.vehicleList.find(v => v.param1 === this.selectedVehicleId);
    this.searchVelRto = vehicle ? vehicle.param2 : 'All';
    this.speedLimit = this.selectedSpeed;
    this.dateRange = `${fromDateEl.value} - ${toDateEl.value}`;
    this.timeRange = `${fromTimeEl.value} - ${toTimeEl.value}`;
    this.summaryTableData = `${this.selectName},${this.searchValue},${this.searchVelRto},${this.speedLimit},${this.dateRange},${this.timeRange}`;
    
    this.getOverspeedingAlertDetails(1);
  }
  
  getOverspeedingAlertDetails(pageNo: number) {
    this.loading = true;
    this.currentPage = pageNo;
    
    const fromDateEl = document.getElementById('fromdate') as HTMLInputElement;
    const toDateEl = document.getElementById('todate') as HTMLInputElement;
    const fromTimeEl = document.getElementById('fromtime') as HTMLInputElement;
    const toTimeEl = document.getElementById('totime') as HTMLInputElement;
    
    const vendorId = this.filterBy === 'Vendor' ? this.selectedVendorId : '';
    const rtoId = this.filterBy === 'RTO' ? this.selectedRTOId : '';
    
    const request = {
      param1: this.searchText.trim(),
      param2: pageNo.toString(),
      param3: this.pageSize === this.totalCount ? 'All' : this.pageSize.toString(),
      param4: this.selectedVehicleId,
      param5: fromDateEl?.value || this.fromDate,
      param6: fromTimeEl?.value || this.fromTime,
      param7: toTimeEl?.value || this.toTime,
      param8: this.selectedSpeed,
      param9: vendorId,
      param10: rtoId,
      param11: toDateEl?.value || this.toDate
    };
    
    this.reportService.getOverspeedReport(request).subscribe({
      next: (response) => {
        this.loading = false;
        this.showSummary = true;

        const entity: any = response.entity as any;
        if (entity === 'No Data Found' || !entity) {
          alert(entity || 'No Data Found');
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
        this.errorMessage = error?.error?.entity || 'Error loading report';
        console.error('Error loading overspeed report:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  getSearchDetails() {
    this.currentPage = 1;
    this.getOverspeedingAlertDetails(1);
  }
  
  reloadData() {
    this.searchText = '';
    this.currentPage = 1;
    this.getOverspeedingAlertDetails(1);
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
    this.getOverspeedingAlertDetails(page);
  }
  
  onPageSizeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newSize = target.value;
    this.pageSize = newSize === 'All' ? this.totalCount : parseInt(newSize);
    this.currentPage = 1;
    this.getOverspeedingAlertDetails(1);
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

