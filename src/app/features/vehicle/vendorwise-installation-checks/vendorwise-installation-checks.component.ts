import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { VehicleService } from '../../../core/services/vehicle.service';

import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { VendorService } from '../../../core/services/vendor.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
    selector: 'app-vendorwise-installation-checks',
    imports: [FormsModule, NgSelectModule],
    templateUrl: './vendorwise-installation-checks.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './vendorwise-installation-checks.component.scss'
})
export class VendorwiseInstallationChecksComponent implements OnInit {
  vendorList: any[] = [];
  errorMessage: string = '';
  selectedVendor: any = null;
  detailsData: any;
  constructor(public vehicleService: VehicleService, public vendorService: VendorService, public toast: ToastService) {
    this.toast.pageName = 'Vendorwise Installation Checks'; // Set page name for toast service
   }

  ngOnInit(): void {
    this.getvendorList();
    this.getVendorWiseChecksDetails();
    // For testing: merge vehicleList into vendorList for display
  }
  getvendorList() {
    this.vehicleService.getVendorList().subscribe((res: any) => {
      if (res.status) {
        this.vendorList = res.entity;
      }
    });
  }
  getVendorWiseChecksDetails() {
    const request = {
      param5: this.selectedVendor?.param2 || '', // Search text (if any)
      param8: this.selectedVendor?.param1 || '', // Page number
    };
    
    this.vendorService.getVendorWiseInstallationCheckDetails(request).subscribe((res: any) => {
      if (res.status) {
        const rawList = res.entity?.fetchvendorwisechecksDetails || [];
        
        // Transform the data to match the HTML template structure
        const parsedVendors = rawList.map((item: any) => {
          try {
            const parsedData = JSON.parse(item.checksdetails);
            
            // Flatten all check categories into a single checks array
            const allChecks: any[] = [];
            
            // Add checks from each category
            if (parsedData.protocolDataFormat) {
              allChecks.push(...parsedData.protocolDataFormat);
            }
            if (parsedData.locationNetwork) {
              allChecks.push(...parsedData.locationNetwork);
            }
            if (parsedData.securityCommunication) {
              allChecks.push(...parsedData.securityCommunication);
            }
            if (parsedData.movementActivation) {
              allChecks.push(...parsedData.movementActivation);
            }
            if (parsedData.deviceHealth) {
              allChecks.push(...parsedData.deviceHealth);
            }
            if (parsedData.latencyQuality) {
              allChecks.push(...parsedData.latencyQuality);
            }
            
            return {
              vendorname: parsedData.vendorname,
              vendorid: parsedData.vendorid,
              checks: allChecks
            };
          } catch (error) {
            console.error('Error parsing checksdetails:', error);
            return {
              vendorname: 'Unknown Vendor',
              vendorid: null,
              checks: []
            };
          }
        });
        
        this.detailsData = parsedVendors;
        //console.log('Parsed Vendor Checks Details:', this.detailsData);
      } else {
        this.errorMessage = res.message || 'Failed to fetch installation check details.';
        this.toast.show(this.errorMessage, 'error');
      }
    }, (error) => {
      this.errorMessage = 'An error occurred while fetching installation check details.';
      this.toast.show(this.errorMessage, 'error');
    });
  }
}
