import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DeviceService } from '../../../core/services/device.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { ToastService } from '../../../core/services/toast.service';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';

declare var $: any;
declare var jAlert: any;

@Component({
    selector: 'app-device-health-acknowledge',
    imports: [CommonModule, FormsModule, RouterModule, CommonTableComponent],
    templateUrl: './device-health-acknowledge.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./device-health-acknowledge.component.scss']
})
export class DeviceHealthAcknowledgeComponent implements OnInit, AfterViewInit {
  checkDetails: any[] = [];
  readonly tableColumns: CommonTableColumn<any>[] = [
    { key: 'param1', label: '#' },
    { key: 'param2', label: 'IMEI No.', sortable: true },
    { key: 'packetHeader', headers: ['Header', 'Vendor Id', 'Firmware'], sortKey: 'param3', sortable: true },
    { key: 'alert', label: 'Alert', sortKey: 'param7', sortable: true },
    { key: 'coordinates', headers: ['Latitude', 'Longitude'] },
    { key: 'smsDate', label: 'SMS Date', sortKey: 'param11', sortable: true, width: '110px' },
    { key: 'heading', label: 'Heading', sortKey: 'param14', sortable: true },
    { key: 'speed', label: 'Speed(Km/hrs)', sortKey: 'param15', sortable: true },
    { key: 'signal', label: 'Signal', sortKey: 'param16', sortable: true },
    { key: 'network', headers: ['LAC', 'MCC', 'MNC'], sortKey: 'param22', sortable: true },
    { key: 'ignition', headers: ['Ignition', 'GPS'], sortKey: 'param19', sortable: true },
    { key: 'vehicleMode', label: 'Vehicle Mode', sortKey: 'param21', sortable: true },
    { key: 'rawString', label: 'Raw String', sortKey: 'param8', sortable: true, cellStyle: { 'max-width': '400px', 'overflow-wrap': 'anywhere' } }
  ];
  loading = false;

  selectedVendor: string = '';
  selectedIMEI: string = '';
  selectedDate: string = '';

  vendorList: any[] = [];
  deviceList: any[] = [];

  currentPage = 1;
  pageSize = 20;
  totalCount = 0;
  pageCount = 0;

  sortKey: string = '';
  reverse: boolean = false;

  roleId: string = '';

  constructor(
    private deviceService: DeviceService,
    private dashboardService: DashboardService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {
    this.toast.pageName = 'Device Health Acknowledge'; // Set page name for toast service
  }

  ngOnInit() {
    this.roleId = sessionStorage.getItem('roleId') || '';
    this.loadVendors();
    this.initializeDatePicker();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.select2) {
        $('.searchable').select2();
        $('#companyCode').on('change', (e: any) => {
          this.selectedVendor = e.target.value;
          this.onVendorChange();
        });
        $('#deviceCode').on('change', (e: any) => {
          this.selectedIMEI = e.target.value;
        });
      }
    }, 200);
  }

  initializeDatePicker() {
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.datepicker) {
        $('#daterawdata').datepicker({
          format: 'dd-M-yyyy',
          endDate: '+0d',
          autoclose: true
        }).on('changeDate', (e: any) => {
          this.selectedDate = this.formatDate(e.date);
        });
        $('#daterawdata').datepicker('setDate', '+0d');
        const today = new Date();
        this.selectedDate = this.formatDate(today);
      }
    }, 100);
  }

  formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  loadVendors() {
    this.dashboardService.getVendorList().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.vendorList = response.entity;
        }
      }
    });
  }

  onVendorChange() {
    this.deviceList = [];
    this.selectedIMEI = '';
    if (this.selectedVendor) {
      const encryptedVendorId = this.encryptionService.encryptAccountId(this.selectedVendor);
      const roleId = this.encryptionService.encryptAccountId('11');
      this.deviceService.getRawDataDeviceRoster(encryptedVendorId, roleId).subscribe({
        next: (response) => {
          if (response.status && response.entity) {
            this.deviceList = response.entity;
          }
          this.cdr.detectChanges();
          setTimeout(() => {
            if (typeof $ !== 'undefined' && $.fn.select2) {
              $('#deviceCode').select2();
            }
          }, 100);
        }
      });
    }
  }

  checkHealthDetails() {
    if (!this.selectedVendor) {
      jAlert('Please select Vendor.');
      return;
    }
    if (!this.selectedIMEI) {
      jAlert('Please select IMEI No.');
      return;
    }
    if (!this.selectedDate) {
      jAlert('Please select Date.');
      return;
    }

    this.loading = true;
    const encryptedVendorId = this.encryptionService.encryptAccountId(this.selectedVendor);
    const request = {
      param1: encryptedVendorId,
      param2: this.selectedIMEI,
      param4: this.selectedDate
    };

    this.deviceService.getHealthAcknowledge(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.checkDetails = response.entity.listData || [];
          this.totalCount = response.entity.param1 || 0;
          this.pageCount = this.checkDetails.length;
        } else {
          this.checkDetails = [];
          this.totalCount = 0;
          this.pageCount = 0;
          jAlert('No Data Found: ' + response.entity);
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.checkDetails = [];
        this.totalCount = 0;
        this.pageCount = 0;
        console.error('Error fetching health acknowledge:', error);
        jAlert('Error fetching health acknowledge.');
        this.cdr.detectChanges();
      }
    });
  }

  sort(key: string) {
    this.sortKey = key;
    this.reverse = !this.reverse;
    this.checkDetails.sort((a, b) => {
      const valA = (a as any)[key];
      const valB = (b as any)[key];
      let comparison = 0;
      if (valA > valB) {
        comparison = 1;
      } else if (valA < valB) {
        comparison = -1;
      }
      return this.reverse ? comparison * -1 : comparison;
    });
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.checkHealthDetails();
  }

  getTotalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  }
}
