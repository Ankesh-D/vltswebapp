import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { VehicleGroupService } from '../../../core/services/vehicle-group.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { ToastService } from '../../../core/services/toast.service';

declare var $: any;
declare var jAlert: any;

@Component({
    selector: 'app-vehicle-group-entry',
    imports: [CommonModule, FormsModule, RouterModule, LoadingComponent, ErrorMessageComponent],
    templateUrl: './vehicle-group-entry.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./vehicle-group-entry.component.scss']
})
export class VehicleGroupEntryComponent implements OnInit {
  groupName: string = '';
  description: string = '';
  vehicleGroupList: any[] = [];
  searchTerm: string = '';
  
  // Edit modal
  editGroupId: string = '';
  editGroupName: string = '';
  editDescription: string = '';
  editRemark: string = '';
  
  // Delete modal
  deleteGroupId: string = '';
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
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {
    this.toast.pageName = 'Vehicle Group Entry'; // Set page name for toast service
  }
  
  ngOnInit() {
    this.getVehicleGroupDetails(1);
  }
  
  getVehicleGroupDetails(page: number = 1) {
    this.currentPage = page;
    this.loading = true;
    
    const request = {
      param1: '',
      param2: this.currentPage.toString(),
      param3: this.pageSize.toString()
    };
    
    this.vehicleGroupService.getVehicleGroupDetails(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          if (response.entity.listData !== undefined) {
            this.vehicleGroupList = response.entity.listData || [];
            this.totalCount = response.entity.param1 || 0;
          } else if (Array.isArray(response.entity)) {
            this.vehicleGroupList = response.entity;
            this.totalCount = response.entity.length;
          }
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading vehicle groups:', error);
        this.cdr.detectChanges();
      }
    });
  }

  get filteredVehicleGroupList(): any[] {
    const normalizedSearch = this.searchTerm.trim().toLowerCase();
    let list = [...this.vehicleGroupList];

    if (normalizedSearch) {
      list = list.filter((item) =>
        [item.param1, item.param3, item.param4, item.param6]
          .some((value) => (value || '').toString().toLowerCase().includes(normalizedSearch))
      );
    }

    if (this.sortKey) {
      list.sort((a, b) => {
        const valueA = (a[this.sortKey] || '').toString().toLowerCase();
        const valueB = (b[this.sortKey] || '').toString().toLowerCase();
        const comparison = valueA.localeCompare(valueB, undefined, { numeric: true, sensitivity: 'base' });
        return this.reverse ? -comparison : comparison;
      });
    }

    return list;
  }
  
  validate() {
    // Validate group name (ignore special characters)
    this.groupName = this.groupName.replace(/[^a-zA-Z0-9\s]/g, '');
  }
  
  checkDescription() {
    // Description validation if needed
  }
  
  createVehicleGroup() {
    if (!this.groupName || !this.description) {
      jAlert('Please fill all required fields');
      return;
    }
    
    this.loading = true;
    const request = {
      param1: this.groupName.trim(),
      param2: this.description.trim()
    };
    
    this.vehicleGroupService.createVehicleGroup(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status) {
          jAlert('Vehicle group created successfully.');
          this.resetForm();
          this.getVehicleGroupDetails(1);
        } else {
          jAlert(typeof response?.entity === 'string' ? response.entity : 'Failed to create vehicle group');
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        jAlert('Error creating vehicle group');
        console.error('Error creating vehicle group:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  displayvehiclegrpDetail(group: any) {
    this.editGroupId = group.param2 || '';
    this.editGroupName = group.param3 || '';
    this.editDescription = group.param6 || '';
    this.editRemark = '';
    $('#editvehiclegroupmodal').modal('show');
  }
  
  updateGroupDetails() {
    if (!this.editGroupName || !this.editDescription || !this.editRemark) {
      jAlert('Please fill all required fields');
      return;
    }
    
    this.loading = true;
    const encryptedGroupId = this.encryptionService.encryptAccountId(this.editGroupId);
    const request = {
      param1: encryptedGroupId,
      param2: this.editGroupName.trim(),
      param3: this.editDescription.trim(),
      param4: this.editRemark.trim()
    };
    
    this.vehicleGroupService.updateVehicleGroup(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status) {
          jAlert('Vehicle group updated successfully.');
          $('#editvehiclegroupmodal').modal('hide');
          this.getVehicleGroupDetails(this.currentPage);
        } else {
          jAlert(typeof response?.entity === 'string' ? response.entity : 'Failed to update vehicle group');
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        jAlert('Error updating vehicle group');
        console.error('Error updating vehicle group:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  deleteData(group: any) {
    this.deleteGroupId = group.param2 || '';
    this.deleteGroupName = group.param3 || '';
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
  
  deleteModelDetails() {
    if (!this.deleteRemark) {
      jAlert('Please enter a remark');
      return;
    }
    
    this.loading = true;
    const encryptedGroupId = this.encryptionService.encryptAccountId(this.deleteGroupId);
    const request = {
      param1: encryptedGroupId,
      param2: this.deleteRemark.trim()
    };
    
    this.vehicleGroupService.deleteVehicleGroup(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status) {
          jAlert('Vehicle group deleted successfully.');
          $('#cancelmodel').modal('hide');
          this.getVehicleGroupDetails(this.currentPage);
        } else {
          jAlert(typeof response?.entity === 'string' ? response.entity : 'Failed to delete vehicle group');
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        jAlert('Error deleting vehicle group');
        console.error('Error deleting vehicle group:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  resetForm() {
    this.groupName = '';
    this.description = '';
  }

  clearSearch() {
    this.searchTerm = '';
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

  onPageSizeChange() {
    this.getVehicleGroupDetails(1);
  }
}
