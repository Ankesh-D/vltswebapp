import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { VehicleGroupService } from '../../../core/services/vehicle-group.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';

declare var $: any;
declare var jAlert: any;

@Component({
    selector: 'app-vehicle-group-mapping-details',
    imports: [CommonModule, FormsModule, RouterModule, LoadingComponent, ErrorMessageComponent],
    templateUrl: './vehicle-group-mapping-details.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./vehicle-group-mapping-details.component.scss']
})
export class VehicleGroupMappingDetailsComponent implements OnInit {
  mappingList: any[] = [];
  vehicleListByGroup: any[] = [];
  vehicleListError = '';
  
  selectedGroupId: string = '';
  selectedGroupName: string = '';
  selectedVehicles: any[] = [];
  
  deleteMappingId: string = '';
  deleteGroupName: string = '';
  deleteRemark: string = '';
  
  loading = false;
  errorMessage = '';
  
  currentPage = 1;
  pageSize = 20;
  totalCount = 0;
  
  sortKey: string = '';
  reverse: boolean = false;
  
  constructor(
    private vehicleGroupService: VehicleGroupService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef
  ) {}

  private showAlert(message: string) {
    if (typeof jAlert !== 'undefined') {
      jAlert(message);
      return;
    }

    window.alert(message);
  }

  private openVehicleModal() {
    setTimeout(() => {
      if (typeof $ !== 'undefined') {
        $('#VehicleNO').modal('show');
      }
    }, 100);
  }
  
  ngOnInit() {
    this.getVehicleGroupMappingDetails(1);
  }
  
  getVehicleGroupMappingDetails(page: number = 1) {
    this.currentPage = page;
    this.loading = true;
    
    const request = {
      param1: '',
      param2: this.currentPage.toString(),
      param3: this.pageSize.toString()
    };
    
    this.vehicleGroupService.getVehicleGroupMappingDetails(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          if (response.entity.listData !== undefined) {
            this.mappingList = response.entity.listData || [];
            this.totalCount = response.entity.param1 || 0;
          } else if (Array.isArray(response.entity)) {
            this.mappingList = response.entity;
            this.totalCount = response.entity.length;
          }
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading vehicle group mapping details:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  vehListByGrp(mapping: any) {
    this.selectedGroupId = mapping.param2 || '';
    this.selectedGroupName = mapping.param3 || '';
    this.vehicleListByGroup = [];
    this.selectedVehicles = [];
    this.vehicleListError = '';
    this.loading = true;
    this.openVehicleModal();
    
    const encryptedGroupId = this.encryptionService.encryptAccountId(this.selectedGroupId);
    
    this.vehicleGroupService.getVehiclesByGroup(encryptedGroupId).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.vehicleListByGroup = Array.isArray(response.entity) ? response.entity : [];
          this.selectedVehicles = this.vehicleListByGroup.map(v => ({ ...v, Selected: true }));
        } else {
          this.vehicleListError = typeof response?.entity === 'string' ? response.entity : 'No vehicles found for this group.';
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.vehicleListError =
          error?.error?.entity ||
          error?.error?.message ||
          error?.message ||
          'Error loading vehicles for group';
        console.error('Error loading vehicles by group:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  uncheckValue(vehicle: any) {
    vehicle.Selected = !vehicle.Selected;
  }
  
  removeVeh() {
    const selectedVehicleIds = this.selectedVehicles
      .filter(v => v.Selected)
      .map(v => v.param1);
    
    if (selectedVehicleIds.length === 0) {
      this.showAlert('Please select at least one vehicle to remove');
      return;
    }
    
    this.loading = true;
    const encryptedGroupId = this.encryptionService.encryptAccountId(this.selectedGroupId);
    const encryptedVehicleIds = selectedVehicleIds
      .map(id => this.encryptionService.encryptAccountId(id)).join(',');
    
    const request = {
      param1: encryptedGroupId,
      param2: encryptedVehicleIds
    };
    
    this.vehicleGroupService.removeVehiclesFromGroup(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status) {
          this.showAlert('Vehicles removed from group successfully.');
          $('#VehicleNO').modal('hide');
          this.getVehicleGroupMappingDetails(this.currentPage);
        } else {
          this.showAlert(typeof response?.entity === 'string' ? response.entity : 'Failed to remove vehicles');
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.showAlert('Error removing vehicles from group');
        console.error('Error removing vehicles:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  deleteVehicleGrp(mapping: any) {
    this.deleteMappingId = mapping.param2 || '';
    this.deleteGroupName = mapping.param3 || '';
    this.deleteRemark = '';
    setTimeout(() => {
      if (typeof $ !== 'undefined') {
        $('#cancelmodel').modal('show');
      }
    }, 100);
  }
  
  validRemark() {
    // Remark validation
  }
  
  deleteVehicleGrpDetails() {
    if (!this.deleteRemark) {
      this.showAlert('Please enter a remark');
      return;
    }
    
    this.loading = true;
    const encryptedMappingId = this.encryptionService.encryptAccountId(this.deleteMappingId);
    const request = {
      param1: encryptedMappingId,
      param2: this.deleteRemark.trim()
    };
    
    this.vehicleGroupService.deleteVehicleGroupMapping(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status) {
          this.showAlert('Vehicle group mapping deleted successfully.');
          $('#cancelmodel').modal('hide');
          this.getVehicleGroupMappingDetails(this.currentPage);
        } else {
          this.showAlert(typeof response?.entity === 'string' ? response.entity : 'Failed to delete vehicle group mapping');
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.showAlert('Error deleting vehicle group mapping');
        console.error('Error deleting vehicle group mapping:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  sort(column: string) {
    if (this.sortKey === column) {
      this.reverse = !this.reverse;
    } else {
      this.sortKey = column;
      this.reverse = false;
    }
  }
  
  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pages: number[] = [];
    const maxPages = 8;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);
    
    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }
  
  getTotalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }
}
