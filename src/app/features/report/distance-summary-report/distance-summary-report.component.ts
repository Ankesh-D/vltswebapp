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
  selector: 'app-distance-summary-report',
  standalone: true,
    imports: [CommonModule, FormsModule, CommonTableComponent],
  templateUrl: './distance-summary-report.component.html',
  styleUrl: './distance-summary-report.component.scss'
})
export class DistanceSummaryReportComponent {
  readonly tableColumns: CommonTableColumn<any>[] = [
    { key: 'param1', label: '#', width: '40px' },
    { key: 'param3', label: 'Vehicle No.', sortable: true },
    { key: 'param4', label: 'Date', sortable: true },
    { key: 'param5', label: 'Distance (Km)', sortable: true },
    { key: 'param6', label: 'From Location', sortable: true },
    { key: 'param7', label: 'To Location', sortable: true },
    { key: 'param8', label: 'From Time', sortable: true },
    { key: 'param9', label: 'To Time', sortable: true }
  ];

  filterBy: string = 'Vendor';
  selectedVendorId: string = '';
  selectedRTOId: string = '';
  selectedVehicleId: string = '';
  
  fromDate: string = '';
  toDate: string = '';
  fromTime: string = '00:00';
  toTime: string = '23:59';
  
  vendorList: any[] = [];
  rtoList: any[] = [];
  vehicleList: any[] = [];
  
  reportData: any[] = [];
  loading = false;
  showSummary = false;
  showReport = false;
  
  selectName: string = '';
  searchValue: string = '';
  searchVelRto: string = '';
  dateRange: string = '';
  timeRange: string = '';
  searchValueId: string = '';
  
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
      if (typeof $ !== 'undefined' && $.fn.datepicker) {
        $('.datepick').datepicker({
          format: 'dd-M-yyyy',
          endDate: '+0d',
          autoclose: true
        });
        
        const today = new Date();
        $('.datepick').datepicker('setDate', today);
        
        $('#fromdate').on('changeDate', (e: any) => {
          this.fromDate = this.formatDate(e.date);
          this.cdr.detectChanges();
        });
        
        $('#todate').on('changeDate', (e: any) => {
          this.toDate = this.formatDate(e.date);
          this.cdr.detectChanges();
        });
        
        if (!$('#fromdate').val()) {
          this.fromDate = this.formatDate(today);
        }
        if (!$('#todate').val()) {
          this.toDate = this.formatDate(today);
        }
      }
    }, 100);
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
  
  getDistanceData() {
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
    this.dateRange = `${fromDateEl.value} - ${toDateEl.value}`;
    this.timeRange = `${fromTimeEl.value} - ${toTimeEl.value}`;
    
    this.getDistanceTravelledDetails(1);
  }
  
  getDistanceTravelledDetails(pageNo: number) {
    this.loading = true;
    this.currentPage = pageNo;
    
    const fromDateEl = document.getElementById('fromdate') as HTMLInputElement;
    const toDateEl = document.getElementById('todate') as HTMLInputElement;
    const fromTimeEl = document.getElementById('fromtime') as HTMLInputElement;
    const toTimeEl = document.getElementById('totime') as HTMLInputElement;
    
    const encryptedVehicleId = this.encryptionService.encryptAccountId(this.selectedVehicleId);
    const encryptedValueId = this.encryptionService.encryptAccountId(this.searchValueId);
    
    const request = {
      param1: this.searchText.trim(),
      param2: pageNo.toString(),
      param3: this.pageSize === this.totalCount ? 'All' : this.pageSize.toString(),
      param4: fromDateEl?.value || this.fromDate,
      param5: toDateEl?.value || this.toDate,
      param6: fromTimeEl?.value || this.fromTime,
      param7: toTimeEl?.value || this.toTime,
      param8: encryptedVehicleId,
      param9: encryptedValueId
    };
    
    this.reportService.getDistanceTravelledReport(request).subscribe({
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
        console.error('Error loading distance travelled report:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  getSearchDetails() {
    this.currentPage = 1;
    this.getDistanceTravelledDetails(1);
  }
  
  reloadData() {
    this.searchText = '';
    this.currentPage = 1;
    this.getDistanceTravelledDetails(1);
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
    this.getDistanceTravelledDetails(page);
  }
  
  onPageSizeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newSize = target.value;
    this.pageSize = newSize === 'All' ? this.totalCount : parseInt(newSize);
    this.currentPage = 1;
    this.getDistanceTravelledDetails(1);
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
