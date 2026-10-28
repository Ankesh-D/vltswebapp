import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DeviceService } from '../../../core/services/device.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ModelService } from '../../../core/services/model.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { ToastService } from '../../../core/services/toast.service';

declare var $: any;

@Component({
    selector: 'app-bulk-activation',
    imports: [CommonModule, FormsModule],
    templateUrl: './bulk-activation.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./bulk-activation.component.scss']
})
export class BulkActivationComponent implements OnInit, AfterViewInit {
  // Form fields
  selectedVendor: string = '';
  selectedModel: string = '';
  selectedFile: File | null = null;
  
  // Dropdowns
  vendorList: any[] = [];
  deviceModelList: any[] = [];
  
  // Company label
  companyLabel: string = '';
  roleId: string = '';
  
  loading: boolean = false;
  
  
  // Upload result
  uploadResult: any = null;
  showResult: boolean = false;

  // Logs & Pagination
  logs: any[] = [];
  page: number = 1;
  pageSize: number = 20;
  totalCount: number = 0;
  applicationId: string = '';
  searchText: string = '';
  pageCount: number = 0;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  

  constructor(
    private deviceService: DeviceService,
    private dashboardService: DashboardService,
    private modelService: ModelService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    public toastService: ToastService
  ) {}

  ngOnInit() {
    this.roleId = sessionStorage.getItem('roleId') || '';
    this.loadVendorList();
    
    if (this.roleId === '11') {
      // For vendor role, load models directly
      this.loadDeviceModelList('');
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.select2) {
        $('.searchable').select2();
        $('#vendor_obj_id').on('change', (e: any) => {
          this.selectedVendor = e.target.value;
          this.onVendorChange();
        });
        $('#modelid').on('change', (e: any) => {
          this.selectedModel = e.target.value;
        });
      }
    }, 200);
  }

  loadVendorList() {
    this.loading = true;
    this.dashboardService.getVendorList().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.vendorList = response.entity;
          if (this.roleId === '11') {
            const vendorId = sessionStorage.getItem('vendorId') || '';
            this.selectedVendor = vendorId;
            this.companyLabel = this.vendorList.find(v => v.param1 === vendorId)?.param2 || '';
            this.onVendorChange();
          }
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

  onVendorChange() {
    if (!this.selectedVendor) {
      this.deviceModelList = [];
      return;
    }
    
    this.loadDeviceModelList(this.selectedVendor);
  }

  loadDeviceModelList(companyId: string) {
    this.loading = true;
    this.deviceService.getDeviceModelRoster(companyId).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.deviceModelList = response.entity;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading device model list:', error);
        this.cdr.detectChanges();
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const fileName = file.name;
      const extension = fileName.split('.').pop()?.toLowerCase();
      if (extension === 'xlsx' || extension === 'xls') {
        this.selectedFile = file;
      } else {
        alert("Please select only excel file.");
        input.value = "";
        this.selectedFile = null;
      }
    }
  }

  bulkactivation() {
    if (this.roleId !== '11') {
      if (!this.selectedVendor) {
       let msg = 'Please select vendor.';
      this.errorMessage = msg;
      this.cdr.detectChanges();
        document.getElementById("vendor_obj_id")?.focus();
        return;
      }
    }
    if (!this.selectedModel) {
       let msg = 'Please select model code.';
      this.errorMessage = msg;
      this.cdr.detectChanges();
      document.getElementById("modelid")?.focus();
      return;
    }
    if (!this.selectedFile) {
      let msg = 'Please select excel file.';
      this.errorMessage = msg;
      this.cdr.detectChanges();
      document.getElementById("excelFile")?.focus();
      return;
    }

    try {
      this.loading = true;
      const d = new Date();
      this.applicationId = d.getTime().toString();

      const formData = new FormData();
      formData.append('file', this.selectedFile);
      
      const encryptedVendorId = this.encryptionService.encryptAccountId(this.selectedVendor);
      const headerkey = sessionStorage.getItem('principalKey') || '';
      formData.append('vendorid', encryptedVendorId);
      formData.append('modelid', this.selectedModel);
      formData.append('applicationId', this.applicationId);
      formData.append('headerkey', headerkey);

      this.deviceService.bulkActivation(formData).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.status) {
            this.getVehicleInstallationLogDetails(1);
            this.resetForm();
            this.toastService.show("File Uploaded Successfully", 'success');
          } else {
            this.toastService.show(response.entity || "Upload Failed", 'error');
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.loading = false;
          console.error(err);
          this.resetForm();
          this.cdr.detectChanges();
        }
      });
    } catch (e) {
      console.error('Error during bulk activation:', e);
    }
  }

  getVehicleInstallationLogDetails(pageno: number) {
    this.page = pageno;
    const data = {
      "param1": this.searchText ? this.searchText.trim() : "",
      "param2": pageno,
      "param3": this.pageSize,
      "param4": this.applicationId
    };

    this.http.post<any>('psv_get_vehicle_installation_log', data).subscribe({
      next: (response) => {
        if (response.entity && response.entity.listData) {
          this.logs = response.entity.listData;
          this.totalCount = response.entity.param1;
          
          if (this.logs.length < this.pageSize) {
            this.pageCount = this.logs.length;
          } else {
            this.pageCount = this.pageSize;
          }
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error(error);
        this.cdr.detectChanges();
      }
    });
  }

  resetForm() {
    this.selectedVendor = '';
    this.selectedModel = '';
    this.selectedFile = null;
    const fileInput = document.getElementById('excelFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    if (this.roleId === '11') {
      const vendorId = sessionStorage.getItem('vendorId') || '';
      this.selectedVendor = vendorId;
    }
  }

  // Kept for backward compatibility if needed, but bulkactivation() is the main one now
  uploadBulkActivation() {
    this.bulkactivation();
  }

  downloadSample() {
    // Create sample Excel file or redirect to download endpoint
    window.open('/assets/excelformat/bulkactivationformat.xlsx', '_blank');
  }
}
