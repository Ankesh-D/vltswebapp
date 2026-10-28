import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { VehicleGroupService } from '../../../core/services/vehicle-group.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { RtoService } from '../../../core/services/rto.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';

declare var jAlert: any;

@Component({
    selector: 'app-vehicle-group-mapping',
    imports: [FormsModule, RouterModule, NgSelectModule, LoadingComponent, ErrorMessageComponent],
    templateUrl: './vehicle-group-mapping.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./vehicle-group-mapping.component.scss']
})
export class VehicleGroupMappingComponent implements OnInit {
  selectedFilter: any = null;
  selectedVendorIds: string[] = [];
  selectedRTOIds: string[] = [];
  selectedVehicleIds: string[] = [];
  selectedGroupId: any = null;
  
  vendorList: any[] = [];
  rtoList: any[] = [];
  vehicleList: any[] = [];
  vehicleGroupList: any[] = [];
  
  showVendorList: boolean = false;
  showRTOList: boolean = false;
  
  loading = false;
  errorMessage = '';
  
  constructor(
    private vehicleGroupService: VehicleGroupService,
    private vehicleService: VehicleService,
    private dashboardService: DashboardService,
    private rtoService: RtoService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit() {
    this.loadVehicleGroupList();
  }
  
  onFilterChange() {
    this.selectedVendorIds = [];
    this.selectedRTOIds = [];
    this.selectedVehicleIds = [];
    this.selectedGroupId = '';
    this.vehicleList = [];
    this.showVendorList = false;
    this.showRTOList = false;
    
    if (this.selectedFilter === '11') {
      this.showVendorList = true;
      this.loadVendorList();
    } else if (this.selectedFilter === '19') {
      this.showRTOList = true;
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
    this.rtoService.getRTODetails({ param1: '', param2: '1', param3: '1000', param4: '', param5: '' }).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.rtoList = response.entity.listData || [];
        }
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        this.loading = false;
        console.error('Error loading RTO list:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  onVendorChange() {
    if (this.selectedVendorIds.length > 0) {
      this.loadVehicleList('11', this.selectedVendorIds);
    } else {
      this.vehicleList = [];
      this.selectedVehicleIds = [];
    }
  }

  onVendorSelectionChange() {
    if (this.selectedVendorIds.includes('All')) {
      this.selectedVendorIds = this.vendorList.map(item => item.param1);
    }
    this.onVendorChange();
  }

  onRTOSelectionChange() {
    if (this.selectedRTOIds.includes('All')) {
      this.selectedRTOIds = this.rtoList.map(item => item.param1);
    }
    this.onRTOChange();
  }
  
  onRTOChange() {
    if (this.selectedRTOIds.length > 0) {
      this.loadVehicleList('19', this.selectedRTOIds);
    } else {
      this.vehicleList = [];
      this.selectedVehicleIds = [];
    }
  }
  
  loadVehicleList(roleId: string, filterIds: string[]) {
    this.loading = true;
    const encryptedFilterIds = filterIds.map(id => this.encryptionService.encryptAccountId(id)).join(',');
    const encryptedRoleId = this.encryptionService.encryptAccountId(roleId);
    
    this.vehicleService.getVehicleRoster(encryptedFilterIds, encryptedRoleId).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.vehicleList = Array.isArray(response.entity) ? response.entity : [];
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
  
  loadVehicleGroupList() {
    this.loading = true;
    this.vehicleGroupService.getVehicleGroupDetails({
      param1: '',
      param2: '1',
      param3: '1000'
    }).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          if (response.entity.listData !== undefined) {
            this.vehicleGroupList = response.entity.listData || [];
          } else if (Array.isArray(response.entity)) {
            this.vehicleGroupList = response.entity;
          }
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading vehicle group list:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  vehicleGroupMappingCreate() {
    if (!this.selectedFilter) {
      jAlert('Please select Vendor or RTO');
      return;
    }
    
    if (this.selectedFilter === '11' && this.selectedVendorIds.length === 0) {
      jAlert('Please select at least one Vendor');
      return;
    }
    
    if (this.selectedFilter === '19' && this.selectedRTOIds.length === 0) {
      jAlert('Please select at least one RTO');
      return;
    }
    
    if (this.selectedVehicleIds.length === 0) {
      jAlert('Please select at least one Vehicle');
      return;
    }
    
    if (!this.selectedGroupId) {
      jAlert('Please select a Group');
      return;
    }
    
    this.loading = true;
    const encryptedFilterIds = (this.selectedFilter === '11' ? this.selectedVendorIds : this.selectedRTOIds)
      .map(id => this.encryptionService.encryptAccountId(id)).join(',');
    const encryptedVehicleIds = this.selectedVehicleIds
      .map(id => this.encryptionService.encryptAccountId(id)).join(',');
    const encryptedGroupId = this.encryptionService.encryptAccountId(this.selectedGroupId);
    
    const request = {
      param1: this.selectedFilter,
      param2: encryptedFilterIds,
      param3: encryptedVehicleIds,
      param4: encryptedGroupId
    };
    
    this.vehicleGroupService.createVehicleGroupMapping(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status) {
          jAlert('Vehicle group mapping created successfully.');
          this.resetForm();
        } else {
          jAlert(typeof response?.entity === 'string' ? response.entity : 'Failed to create vehicle group mapping');
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        jAlert('Error creating vehicle group mapping');
        console.error('Error creating vehicle group mapping:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  resetForm() {
    this.selectedFilter = '';
    this.selectedVendorIds = [];
    this.selectedRTOIds = [];
    this.selectedVehicleIds = [];
    this.selectedGroupId = '';
    this.vehicleList = [];
    this.showVendorList = false;
    this.showRTOList = false;
  }
}
