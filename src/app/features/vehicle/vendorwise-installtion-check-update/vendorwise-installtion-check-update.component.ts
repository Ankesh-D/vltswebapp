import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { VehicleService } from '../../../core/services/vehicle.service';
import { ToastService } from '../../../core/services/toast.service';
import { VendorService, VendorwiseCheckUpdateRequest } from '../../../core/services/vendor.service';

interface CheckItem {
  key: string;
  label: string;
  status: string;
}

interface CategoryData {
  categoryKey: string;
  categoryName: string;
  icon: string;
  colorClass: string;
  checks: CheckItem[];
}

export class CheckedDataResponse {
  protocolMatch: any = "";
  checksumOk: any = "";
  gpsValid: any = "";
  authOk  : any = "";
  smsAck: any = true;
  rawData: any = "";
  movementDetected: any = "";
  freq10s: any = "";
  powerConnected: any = "";
  noTamper: any = "";
  disconnectAlert: any = "";
  timeSynced: any = "";
  latencyOk: any = "";
  signalOk: any = "";
  noPacketLoss: any = "";
  networkStable: any = "";
  secureAPN: any = "";
  networkSwitch: any = "";
}
@Component({
    selector: 'app-vendorwise-installtion-check-update',
    imports: [CommonModule, FormsModule, NgSelectModule],
    templateUrl: './vendorwise-installtion-check-update.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './vendorwise-installtion-check-update.component.scss'
})
export class VendorwiseInstalltionCheckUpdateComponent implements OnInit {
   @ViewChild('form') form!: NgForm;
  errorMessage: string = '';
  vendorList: any[] = [];
  selectedVendor: any = null;
  detailsData: any;
  showForm: boolean = false;
  vendorwiseData: CheckedDataResponse = new CheckedDataResponse();
  categories: CategoryData[] = [];
  selectedVendorData: any = null;
  
  // Category metadata
  categoryMetadata: { [key: string]: { name: string; icon: string; colorClass: string } } = {
    protocolDataFormat: { name: 'Protocol & Data Format', icon: 'bi-diagram-3', colorClass: 'text-primary' },
    locationNetwork: { name: 'Location & Network', icon: 'bi-geo-alt', colorClass: 'text-success' },
    securityCommunication: { name: 'Security & Communication', icon: 'bi-shield-lock', colorClass: 'text-danger' },
    movementActivation: { name: 'Movement & Activation', icon: 'bi-arrows-move', colorClass: 'text-warning' },
    deviceHealth: { name: 'Device Health', icon: 'bi-heart-pulse', colorClass: 'text-info' },
    latencyQuality: { name: 'Latency & Quality', icon: 'bi-speedometer2', colorClass: 'text-secondary' }
  };
  
  constructor(public vehicleService: VehicleService, public toastService: ToastService, public vendorService: VendorService, public toast: ToastService) { 
    this.toast.pageName = 'Vendorwise Installation Check Update'; // Set page name for toast service
  }
  ngOnInit(): void {
    this.getvendorList();
  }
  getvendorList() {
    this.vehicleService.getVendorList().subscribe((res: any) => {
      if (res.status) {
        this.selectedVendor = null;
        this.vendorList = res.entity;
      }
    });
  }
  getVendorWiseChecksDetails() {
    if (!this.selectedVendor) {
      return;
    }

    const request = {
      param5: this.selectedVendor?.param2 || '', // Search text (if any)
      param8: this.selectedVendor?.param1 || '', // vendorid
    };
    
    this.vendorService.getVendorWiseInstallationCheckDetails(request).subscribe((res: any) => {
      if (res.statuscode === 200) {
        this.showForm = true;
        const rawList = res.entity?.fetchvendorwisechecksDetails || [];
        
        // Find the selected vendor's data
        const vendorData = rawList.find((item: any) => {
          try {
            const parsed = JSON.parse(item.checksdetails);
            return parsed.vendorname === this.selectedVendor?.param2;
          } catch {
            return false;
          }
        });

        if (vendorData) {
          try {
            const parsedData = JSON.parse(vendorData.checksdetails);
            // //console.log('Parsed vendor data:', parsedData);
            
            this.selectedVendorData = parsedData;
            this.categories = [];
            
            // Build categories dynamically
            const categoryKeys = ['protocolDataFormat', 'locationNetwork', 'securityCommunication', 
                                  'movementActivation', 'deviceHealth', 'latencyQuality'];
            
            categoryKeys.forEach(categoryKey => {
              if (parsedData[categoryKey] && Array.isArray(parsedData[categoryKey]) && parsedData[categoryKey].length > 0) {
                const metadata = this.categoryMetadata[categoryKey];
                if (metadata) {
                  this.categories.push({
                    categoryKey: categoryKey,
                    categoryName: metadata.name,
                    icon: metadata.icon,
                    colorClass: metadata.colorClass,
                    checks: parsedData[categoryKey].map((check: CheckItem) => ({
                      ...check,
                      status: check.status || 'false'
                    }))
                  });
                }
              }
            });
            
            // //console.log('Built categories:', this.categories);
            
          } catch (error) {
            this.showForm = false;
            console.error('Error parsing checksdetails:', error);
            this.errorMessage = 'Error parsing vendor data.';
            this.toast.show(this.errorMessage, 'error');
          }
        } else {
          this.showForm = false;
          this.errorMessage = 'No data found for selected vendor.';
          this.toast.show(this.errorMessage, 'error');
        }
      } else {
        this.showForm = false;
        this.errorMessage = res.message || 'Failed to fetch installation check details.';
        this.toast.show(this.errorMessage, 'error');
      }
    }, (error) => {
      this.showForm = false;
      this.errorMessage = 'An error occurred while fetching installation check details.';
      this.toast.show(this.errorMessage, 'error');
    });
  }
  
  onSubmit() {
    if (this.form.valid && this.selectedVendor && this.selectedVendorData) {
      
      // Create the update request object
      const updateData: VendorwiseCheckUpdateRequest = new VendorwiseCheckUpdateRequest();
      updateData.vendorid = this.selectedVendorData.vendorid?.toString() || '';
      
      // Map check keys to API field names
      const checkKeyToApiField: { [key: string]: keyof VendorwiseCheckUpdateRequest } = {
        'protocolMatch': 'protocol_match',
        'checksumOk': 'checksum_ok',
        'gpsValid': 'gps_validation',
        'authOk': 'auth_ok',
        'smsAck': 'sms_ack',
        'rawData': 'raw_data',
        'movementDetected': 'movement_detected',
        'frequency10Sec': 'frequency_10s',
        'powerConnected': 'power_connected',
        'noTamper': 'no_tamper',
        'disconnectAlert': 'disconnected_alert',
        'timeSynced': 'time_synced',
        'latencyOk': 'latency_ok',
        'signalOk': 'signal_ok',
        'noPacketLoss': 'no_packet_loss',
        'networkStable': 'network_stable',
        'secure_APN': 'secure_APN',
        'network_switch': 'network_switch'

      };
      
      // Extract all checks and map to API format
      this.categories.forEach(category => {
        category.checks.forEach(check => {
          const apiField = checkKeyToApiField[check.key];
          // cons ole.log(`Mapping check ${apiField}`);
          if (apiField) {
            updateData[apiField] = check.status || 'false';
          }
        });
      });
      // console.log('Mapped update data before adding remarks:', updateData);
      updateData.remarks = ''; // Add remarks if needed
      
      // //console.log('Submitting update request:', updateData);

      // Call the update API
      this.vendorService.updateVendorWiseInstallationCheck(updateData).subscribe((res: any) => {
        if (res.statuscode === 200) {
          this.toastService.show('Vendorwise installation check updated successfully.', 'success');
          this.form.reset();
          this.selectedVendor = null;
          this.vendorwiseData = new CheckedDataResponse();
          this.showForm = false;
          this.categories = [];
          this.selectedVendorData = null;
        } else {
          this.toastService.show(res.entity || 'Failed to update vendorwise installation check.', 'error');
        }
      }, (error) => {
        this.toastService.show('An error occurred while updating.', 'error');
        this.errorMessage = 'An error occurred while updating installation check.';
        // console.error('Update error:', error);
      });

    } else {
      this.errorMessage = 'Please select a vendor and fill out the form correctly.';
      this.toastService.show(this.errorMessage, 'error');
    }
  }
  resetForm() {
    this.form.reset();
    this.selectedVendor = null;
    this.vendorwiseData = new CheckedDataResponse();
    this.categories = [];
    this.selectedVendorData = null;
    this.showForm = false;
  }
  
  // Track by function for ngFor performance
  trackByCategory(index: number, category: CategoryData): string {
    return category.categoryKey;
  }
  
  trackByCheck(index: number, check: CheckItem): string {
    return check.key;
  }

}
