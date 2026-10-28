import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { Device, DeviceService } from '../../../core/services/device.service';
import { ToastService } from '../../../core/services/toast.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
declare var $: any;
interface PermitHolder {
  param1?: string | number;
  param2: string;
  param3: string;
  param4?: string;
  param5?: string;
  param6?: string;
  param8?: string;
}

@Component({
    selector: 'app-transfervehicle',
    templateUrl: './transfervehicle.component.html',
    styleUrl: './transfervehicle.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [FormsModule, CommonModule]
})
export class TransfervehicleComponent implements OnInit {
  devices: Device[] = [];
  searchText = '';
  roleId = '';
  loadingVehicles = false;
  pageSize = 20;

  showTransferModal = false;
  showConfirmModal = false;
  selectedVehicle: Device | null = null;

  searchCustomerText = '';
  permitholderList: PermitHolder[] = [];
  selectedCustomer: PermitHolder | null = null;
  searchingCustomer = false;

  transferRemark = '';
  transferLoading = false;

  constructor(
    private deviceService: DeviceService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.roleId = sessionStorage.getItem('roleid') || '';
    this.loadDevices();
  }
  pageCount = 0;
  totalCount = 0;
  pageSizeOptions = [10, 20, 50, 100];
  getAssetsDetailsAPI!: Subscription;
  loadDevices() {
    try { this.getAssetsDetailsAPI?.unsubscribe();} catch (error) {}
    this.loadingVehicles = true;
    const payload = {
      param1: this.searchText.trim(),
      param2: this.currentPage,
      param3: this.pageSize
    };


   this.getAssetsDetailsAPI =  this.deviceService.getAssetsDetails(payload).pipe(
      finalize(() => this.loadingVehicles = false)
    ).subscribe({
      next: (res: any) => {
        if (this.isSuccess(res)) {
          this.devices = res.entity.listData || [];
          // this.pageCount = res.entity.pageCount || 0;
          this.totalCount = res.entity.param1 || 0;
           this.pageCount = this.devices.length < this.pageSize ? this.devices.length : this.pageSize;
        } else {
          this.devices = [];
          this.toast.show(this.getBackendMessage(res, 'Failed to load vehicles'), 'error');
        }
      },
      error: (error) => {
        this.devices = [];
        this.toast.show(this.getHttpErrorMessage(error), 'error');
      }
    });
  }
  onPageSizeChange(newSize: number | string) {
    if (newSize === 'All') {
      this.pageSize = this.totalCount || 1; // Set to total count or 1 to avoid zero
    } else {
      this.pageSize = Number(newSize);
    }
    this.loadDevices();
  }
  currentPage: any = 1;
  onPageChange(page: number) {
    if (page < 1) return;
    const totalPages = this.getTotalPages();
    if (this.totalCount > 0 && page > totalPages) return;
    this.currentPage = page;
    this.loadDevices();
  }
  getTotalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }
  getPageNumbers(): number[] {
    const total = this.getTotalPages();
    const pages: number[] = [];
    const maxPages = 8;
    
    if (total <= maxPages) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push(-1);
        pages.push(total);
      } else if (this.currentPage >= total - 3) {
        pages.push(1);
        pages.push(-1);
        for (let i = total - 4; i <= total; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push(-1);
        for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(-1);
        pages.push(total);
      }
    }
    return pages;
  }

  shouldShowPage(page: number): boolean {
    return page !== -1;
  }
  getSearchDetails() {
    this.loadDevices();
  }

  reloadData() {
    this.searchText = '';
    this.loadDevices();
  }

  openTransferModal(vehicle: Device) {
    if (this.transferLoading) {
      return;
    }
    $('#transferVehicleModal').modal('show');
    this.selectedVehicle = vehicle;
    this.selectedCustomer = null;
    this.searchCustomerText = '';
    this.permitholderList = [];
    this.transferRemark = '';
    this.showConfirmModal = false;
    this.showTransferModal = true;
  }

  closeTransferModal() {
    $('#transferVehicleModal').modal('hide');

    if (this.transferLoading) {
      return;
    }

    this.showTransferModal = false;
    this.showConfirmModal = false;
    this.selectedVehicle = null;
    this.selectedCustomer = null;
    this.searchCustomerText = '';
    this.permitholderList = [];
    this.transferRemark = '';
  }

  searchPermitholder() {
    const search = this.searchCustomerText.trim();
    this.selectedCustomer = null;

    if (search.length < 2) {
      this.permitholderList = [];
      return;
    }

    this.searchingCustomer = true;
    const payload = {
      param1: search,
      param2: '1',
      param3: '20'
    };

    
    this.deviceService.getPermitholder(payload).pipe(
      finalize(() => this.searchingCustomer = false)
    ).subscribe({
      next: (res: any) => {
        if (this.isSuccess(res)) {
          this.permitholderList = res.entity.listData || [];
        } else {
          this.permitholderList = [];
          this.toast.show(this.getBackendMessage(res, 'Failed to search target owner'), 'error');
        }
      },
      error: (error) => {
        this.permitholderList = [];
        this.toast.show(this.getHttpErrorMessage(error), 'error');
      }
    });
  }

  selectCustomer(customer: PermitHolder) {
    this.selectedCustomer = customer;
    this.searchCustomerText = customer.param3 || '';
    this.permitholderList = [];
  }

  requestTransfer() {
    if (this.transferLoading) {
      return;
    }

    if (!this.selectedVehicle) {
      this.toast.show('Select vehicle first', 'error');
      return;
    }

    if (!this.selectedCustomer) {
      this.toast.show('Select target owner', 'error');
      return;
    }

    if (!this.transferRemark.trim() || this.transferRemark.trim().length < 5) {
      this.toast.show('Enter a remark with at least 5 characters', 'error');
      return;
    }
    $('#confirmTransferModal').modal('show');
    this.showConfirmModal = true;
  }

  cancelConfirmation() {
    $('#confirmTransferModal').modal('hide');
    if (!this.transferLoading) {
      this.showConfirmModal = false;
    }
  }

  confirmTransfer() {
    if (this.transferLoading || !this.selectedVehicle || !this.selectedCustomer) {
      return;
    }

    const payload = {
      param1: this.selectedVehicle.param10 || '',
      param2: this.selectedVehicle.param27 || this.selectedVehicle.param28 || '',
      param3: this.selectedCustomer.param2,
      param4: this.transferRemark.trim()
    };

    if (!payload.param1 || !payload.param3) {
      this.toast.show('Vehicle or target owner details are incomplete', 'error');
      return;
    }

    this.transferLoading = true;
    
    this.deviceService.transferVehicle(payload).pipe(
      finalize(() => this.transferLoading = false)
    ).subscribe({
      next: (res: any) => {
        if (this.isSuccess(res)) {
          this.toast.show(this.getBackendMessage(res, 'Vehicle transferred successfully'), 'success');
          $('#transferVehicleModal').modal('hide');
          $('#confirmTransferModal').modal('hide');
          this.transferLoading = false;
          this.closeTransferModal();
          this.loadDevices();
        } else {
          this.showConfirmModal = false;
          this.toast.show(this.getBackendMessage(res, 'Transfer failed'), 'error');
        }
      },
      error: (error) => {
        this.showConfirmModal = false;
        this.toast.show(this.getHttpErrorMessage(error), 'error');
      }
    });
  }

  trackByVehicle(index: number, vehicle: Device) {
    return vehicle.param10 || vehicle.param2 || vehicle.param4 || index;
  }

  trackByPermitHolder(index: number, customer: PermitHolder) {
    return customer.param2 || index;
  }

  private isSuccess(response: any): boolean {
    return !!response && ((response.status && response.statuscode === 200) || (response.status && !response.statuscode) || response.statuscode === 200);
  }

  private getBackendMessage(response: any, fallback: string): string {
    const entity = response?.entity;

    if (typeof entity === 'string' && entity.trim()) {
      return entity.replace('#true', '').replace('#false', '').trim();
    }

    if (response?.message) {
      return response.message;
    }

    return fallback;
  }

  private getHttpErrorMessage(error: any): string {
    return error?.error?.entity || error?.error?.message || error?.message || 'Server error. Please try again.';
  }
}
