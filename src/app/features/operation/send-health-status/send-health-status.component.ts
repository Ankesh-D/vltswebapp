import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { OperationService } from '../../../core/services/operation.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { DeviceService } from '../../../core/services/device.service';
import { EncryptionService } from '../../../core/services/encryption.service';

declare var $: any;

@Component({
    selector: 'app-send-health-status',
    imports: [FormsModule],
    templateUrl: './send-health-status.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./send-health-status.component.scss']
})
export class SendHealthStatusComponent implements OnInit, AfterViewInit {
  selectedCompany: string = '';
  selectedDevice: string = '';
  
  companyList: any[] = [];
  deviceList: any[] = [];
  
  loading = false;
  message = '';
  status = 0;
  
  constructor(
    private operationService: OperationService,
    private dashboardService: DashboardService,
    private deviceService: DeviceService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit() {
    this.loadCompanyList();
  }
  
  ngAfterViewInit() {
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.select2) {
        $('.searchable').select2();
      }
    }, 200);
  }
  
  loadCompanyList() {
    this.loading = true;
    this.dashboardService.getVendorList().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.companyList = response.entity;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading company list:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  onCompanyChange() {
    if (!this.selectedCompany) {
      this.deviceList = [];
      this.selectedDevice = '';
      return;
    }
    
    this.loading = true;
    const encryptedVendorId = this.encryptionService.encryptAccountId(this.selectedCompany);
    const encryptedRoleId = this.encryptionService.encryptAccountId('11');
    
    this.deviceService.getRawDataDeviceRoster(encryptedVendorId, encryptedRoleId).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.deviceList = response.entity;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading device list:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  requestHealthAck() {
    if (!this.selectedCompany) {
      alert('Select Vendor');
      return;
    }
    if (!this.selectedDevice) {
      alert('Select IMEI No.');
      return;
    }
    
    this.loading = true;
    const request = {
      param1: this.encryptionService.encryptAccountId(this.selectedCompany),
      param2: this.selectedDevice,
      param3: 'HEALTHACK'
    };
    
    this.operationService.sendHealthStatus(request).subscribe({
      next: (response) => {
        this.loading = false;
        this.message = response.entity || '';
        if (response.entity === 'Request Sent Successfully') {
          this.status = 1;
        } else {
          this.status = 2;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.message = error?.error?.entity || 'Error sending health status request';
        this.status = 2;
        this.cdr.detectChanges();
      }
    });
  }
}
