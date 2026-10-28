import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DeviceService } from '../../../core/services/device.service';
import { DealerService } from '../../../core/services/dealer.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';

declare var $: any;
declare var jAlert: any;

@Component({
  selector: 'app-device-assign-dealer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './device-assign-dealer.component.html',
  styleUrls: ['./device-assign-dealer.component.scss']
})
export class DeviceAssignDealerComponent implements OnInit, AfterViewInit {
  selectedDevice: string = '';
  selectedDealer: string = '';
  remark: string = '';
  
  deviceList: any[] = [];
  dealerList: any[] = [];
  
  loading = false;
  errorMessage = '';
  successMessage = '';
  
  searchDeviceText = '';
  searchDealerText = '';

  constructor(
    private deviceService: DeviceService,
    private dealerService: DealerService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadDeviceList();
    this.loadDealerList();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.select2) {
        $('.searchable').select2();
        $('#deviceid').on('change', (e: any) => {
          this.selectedDevice = e.target.value;
        });
        $('#dealerid').on('change', (e: any) => {
          this.selectedDealer = e.target.value;
        });
      }
    }, 200);
  }

  loadDeviceList() {
    this.loading = true;
    const request = {
      param1: this.searchDeviceText,
      param2: '1',
      param3: '1000',
      param4: 'TotalDevice',
      param9: '',
      param10: '',
      pdfexcel: ''
    };
    
    this.deviceService.getDeviceDetailsByType(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity && response.entity.listData) {
          this.deviceList = response.entity.listData;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = 'Failed to load device list.';
        console.error('Error loading device list:', error);
        this.cdr.detectChanges();
      }
    });
  }

  loadDealerList() {
    this.loading = true;
    const request = {
      param1: this.searchDealerText,
      param2: '1',
      param3: '1000',
      param4: 'Total'
    };
    
    this.dealerService.getDealerDetails(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity && response.entity.listData) {
          this.dealerList = response.entity.listData;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = 'Failed to load dealer list.';
        console.error('Error loading dealer list:', error);
        this.cdr.detectChanges();
      }
    });
  }

  assignDevice() {
    if (!this.selectedDevice) {
      jAlert('Please select a device.');
      return;
    }
    if (!this.selectedDealer) {
      jAlert('Please select a dealer.');
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request = {
      param1: this.encryptionService.encryptAccountId(this.selectedDevice),
      param2: this.encryptionService.encryptAccountId(this.selectedDealer),
      param3: this.remark || ''
    };

    this.deviceService.assignDeviceToDealer(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status) {
          this.successMessage = response.entity || 'Device assigned to dealer successfully.';
          jAlert(this.successMessage);
          this.resetForm();
        } else {
          this.errorMessage = response.entity || 'Failed to assign device to dealer.';
          jAlert(this.errorMessage);
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.entity || 'Error assigning device to dealer.';
        console.error('Assign device API error:', error);
        jAlert(this.errorMessage);
        this.cdr.detectChanges();
      }
    });
  }

  resetForm() {
    this.selectedDevice = '';
    this.selectedDealer = '';
    this.remark = '';
    if (typeof $ !== 'undefined' && $.fn.select2) {
      $('#deviceid').val('').trigger('change');
      $('#dealerid').val('').trigger('change');
    }
    this.errorMessage = '';
    this.successMessage = '';
  }
}
