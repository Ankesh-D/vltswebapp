import { ReportService } from './../../../core/services/report.service';
import { Component, OnInit, AfterViewInit, ChangeDetectorRef, OnDestroy, ChangeDetectionStrategy } from '@angular/core';

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
import { filter, Subject } from 'rxjs';
import moment from 'moment';
import { VendorStatusReportResp } from '../../../core/model/response.model';
import { VendorStatusReportReq } from '../../../core/model/request.model';
import { VendorService } from '../../../core/services/vendor.service';
import { CommonDataToolbarComponent } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';
declare var $: any;

@Component({
    selector: 'app-vendor-status',
    imports: [NgxDaterangepickerMd, FormsModule, NgSelectModule, CommonDataToolbarComponent, CommonTableComponent],
    templateUrl: './vendor-status.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './vendor-status.component.scss'
})
export class VendorStatusComponent implements OnInit, AfterViewInit, OnDestroy {
    readonly tableColumns: CommonTableColumn[] = [
      { key: 'index', label: '#', cellClass: 'text-end' },
      { key: 'vendor', label: 'Vendor Name', width: '160px' },
      { key: 'onboarded', label: 'Onboarded On', cellClass: 'text-end' },
      { key: 'installed', label: 'Total Installed Vehicles', cellClass: 'text-end' },
      { key: 'uniquePanic', label: 'Unique Panic Vehicles', cellClass: 'text-end' },
      { key: 'panicSessions', label: 'Panic Sessions', cellClass: 'text-end' },
      { key: 'percentage', label: 'Percentage', cellClass: 'text-end' },
      { key: 'currentPanicVehicles', label: 'Panic Vehicles (Current Date)', cellClass: 'text-end' },
      { key: 'currentPanicSessions', label: 'Panic Sessions (Current Date)', cellClass: 'text-end' },
      { key: 'tamperedVehicles', label: 'Unique Tampered Panic Vehicles', cellClass: 'text-end' },
      { key: 'tamperedSessions', label: 'Tampered Panic Sessions', cellClass: 'text-end' },
      { key: 'vehicle', label: 'Vehicle Reg. Number (Maximum Number of Panic Alerts)' }
    ];
  
    loading = false;
    showSummary = false;
    deviceType: 'NEW' | 'OLD' = 'NEW'; // default NEW
    
    reportData: VendorStatusReportResp[] = [];
    roleId: string = '';
    formReq: VendorStatusReportReq = new VendorStatusReportReq();
    isVehicleLoaded = false;
    filterList: any[] = [
      { label: 'Last 30 Days', value: 'last30days' },
      { label: 'Whole Period', value: 'All' }
    ];
    selectedFilterBy: any = this.filterList[0]; // default to first option
 constructor(
     private toast: ToastService,
     private ReportService: ReportService,
     private vendorService: VendorService,
     private dashboardService: DashboardService,
     private vehicleService: VehicleService,
     private encryptionService: EncryptionService,
   ) { 
    this.roleId = sessionStorage.getItem('roleid') || ''; 
    this.toast.pageName = 'Vendor Status Report'; // Set page name for toast service
  }
   searchInput = new Subject<string>();
   filteredOptions: any[] = [];
   loadingVehicle: boolean = false;
   ngOnInit() {
     this.getReportData();
   }

  ngOnDestroy(): void {}

  ngAfterViewInit(): void {}  
  onFilterChange() {
      this.formReq.param4 = this.selectedFilterBy ? this.selectedFilterBy.value : 'All';
      this.getReportData();
  }
    // page = 1
    // totalPages = 0
    getReportData() {
  
      this.formReq.param2 = ""; //this.page;
      this.formReq.param3 = ""; //this.pageSize;
      this.formReq.param4 = this.selectedFilterBy ? this.selectedFilterBy.value : 'All';
      this.formReq.pdfexcel = '';
      this.vendorService.getVendorStatusReport(this.formReq).subscribe({
        
        next: (res: any) => {
          if(res.statuscode==200) {
            this.loading = false;
            this.reportData = res?.entity?.listData || res?.entity || [];
            const total = Number(res?.entity?.param1 || 0);
            this.totalCount = total;
            this.pageCount = this.reportData.length;
            // ✅ pages
            // this.totalPages = Math.ceil(total / this.pageSize);
          } else {
            this.toast.show('No data found', 'error');
            this.reportData = [];
            this.totalCount = 0;
            this.pageCount = 0;
            // this.totalPages = 0;    
          }
  
      },
      error: (err) => {
          this.loading = false;
          console.error(err);
          this.toast.show('Something went wrong', 'error');
        }
      });
    }
    // 🔍 search text
    // searchText = '';
  
    // pagination
    pageSize: number = 20;
    pageCount = 0;
    totalCount = 0;
    pageSizeOptions = [10, 20, 50, 100];
  
  
    // 🔎 SEARCH
    getSearchDetails() {
      this.getReportData();
  
      // agar backend search hai to yaha API call karo
      // abhi ke liye existing data filter example
  
      if (!this.formReq.param1) {
        return this.getReportData();
      }

      const text = this.formReq.param1.toLowerCase();
  
      // this.alertData = this.alertData.filter((item: any) =>
      //   Object.values(item).some(val =>
      //     String(val).toLowerCase().includes(text)
      //   )
      // );
  
    }
  
  
    // 🔄 RELOAD
    reloadData() {
      this.formReq.param1 = '';
      // this.page = 1;
      // this.pageSize = 20;
      this.selectedFilterBy = this.filterList[0]; // reset to default filter
      this.getReportData();
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
    
    
   
  
    
    // changePage(p: number) {
  
    //   if (p < 1 || p > this.totalPages) return;
  
    //   this.page = p;
  
    //   this.getReportData(); // 🔥 reload API
    // }
    // onPageSizeChanged(size: any) {
  
    //   if (size === 'All') {
    //     this.pageSize = this.totalCount;
    //   } else {
    //     this.pageSize = Number(size);
    //   }
  
    //   this.page = 1; // 🔥 reset page
    //   this.getReportData(); // 🔄 reload
    // }
    
    onFormatChange(event: any) {
      const value = event.target.value;
  
      if (value === 'excel') {
        this.exportToExcel();
      }
    }
    exportToExcel() {
      // 🔥 2. VALIDATIONS (same as your API)
      this.loading = true;
  
      // 🔥 5. API CALL
      this.formReq.param2 = "";
      this.formReq.param3 = "";
      this.formReq.pdfexcel = "EXCEL";
      this.vendorService.getVendorStatusReport(this.formReq).subscribe({
        next: (response: any) => {
          this.loading = false;
          if(response.statuscode==200) {
            this.toast.commonFileDownload(response.entity);
            setTimeout(() => {
              const exportselection = document.getElementById('exportselection') as HTMLSelectElement;
              if (exportselection) {
                exportselection.value = ''; // Reset the select dropdown
              }
            }, 1000);
            // Reset the select dropdown after download
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
