import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { DashboardService } from '../../../core/services/dashboard.service';
import { DeviceService } from '../../../core/services/device.service';

declare var jAlert: any;

@Component({
    selector: 'app-device-multiple-entry',
    imports: [FormsModule, RouterModule, NgSelectModule],
    changeDetection: ChangeDetectionStrategy.Eager,
    templateUrl: './device-multiple-entry.component.html'
    // Stylesheet can be added later if needed
    // styleUrls: ['./device-multiple-entry.component.scss']
})
export class DeviceMultipleEntryComponent implements OnInit {
  // Dropdowns
  vendorList: any[] = [];
  deviceModelList: any[] = [];
  m2mProviderList: any[] = [];

  // Selected values
  selectedVendor: string = '';
  selectedModel: string = '';
  selectedM2mProvider: string = '';

  // File
  selectedFile: File | null = null;

  // UI
  roleId: string = '';
  companyLabel: string = '';
  loading: boolean = false;

  constructor(
    private dashboardService: DashboardService,
    private deviceService: DeviceService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.roleId = sessionStorage.getItem('roleId') || '';
    this.loadVendorList();
    this.loadM2MProviderList();
  }

  loadVendorList() {
    this.dashboardService.getVendorList().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.vendorList = response.entity;
        }
      },
      error: (error) => {
        console.error('Error loading vendor list:', error);
      }
    });
  }

  onVendorChange() {
    this.selectedModel = '';
    this.deviceModelList = [];
    if (this.selectedVendor) {
      this.deviceService.getDeviceModelRoster(this.selectedVendor).subscribe({
        next: (response) => {
          if (response.status && response.entity) {
            this.deviceModelList = response.entity;
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading device model list:', error);
        }
      });
    }
  }

  loadM2MProviderList() {
    this.dashboardService.getM2MProviderList().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.m2mProviderList = response.entity;
        }
      },
      error: (error) => {
        console.error('Error loading M2M provider list:', error);
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    } else {
      this.selectedFile = null;
    }
  }

  viewFormat() {
    // Open format image in a new tab – developer can adjust path if needed
    window.open('assets/images/excelformat/bulkdeviceview.png', '_blank');
  }

  downloadFormat() {
    // Trigger download of Excel format – developer can adjust path if needed
    window.open('assets/images/excel-format/deviceuploadformat.xlsx', '_blank');
  }

  submit() {
    if (!this.selectedVendor) {
      jAlert('Please select Vendor');
      return;
    }
    if (!this.selectedModel) {
      jAlert('Please select Model Code');
      return;
    }
    if (!this.selectedM2mProvider) {
      jAlert('Please select M2M Provider');
      return;
    }
    if (!this.selectedFile) {
      jAlert('Please select Excel file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('vendorId', this.selectedVendor);
    formData.append('modelId', this.selectedModel);
    formData.append('m2mProviderId', this.selectedM2mProvider);

    this.loading = true;
    this.deviceService.uploadDeviceExcel(formData).subscribe({
      next: (response) => {
        this.loading = false;
        jAlert(response?.entity || 'Upload completed');
      },
      error: (error) => {
        this.loading = false;
        console.error('Error uploading device excel:', error);
        jAlert('Error uploading device excel');
      }
    });
  }

  goToDetails() {
    this.router.navigate(['/DeviceActivationDetails']);
  }

  goBack() {
    this.router.navigate(['/AdminDashboard']);
  }
}

