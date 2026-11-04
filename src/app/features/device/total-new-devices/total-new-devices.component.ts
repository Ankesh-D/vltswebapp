import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Device, DeviceRequest, DeviceService } from '../../../core/services/device.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { ToastService } from '../../../core/services/toast.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { CommonDataToolbarComponent, OldNewOption } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { DataTableColumn, DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

interface ChangeRequestDetails {
  param12?: string;
}

@Component({
  selector: 'app-total-new-devices',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CommonDataToolbarComponent, DataTableComponent, PaginationComponent],
  templateUrl: './total-new-devices.component.html',
  styleUrl: './total-new-devices.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager
})
export class TotalNewDevicesComponent implements OnInit {
  devices: Device[] = [];
  readonly tableColumns: DataTableColumn<Device>[] = [
    { header: '#', key: 'param1', className: 'id-column' },
    {
      header: '',
      headers: ['Chassis No.', 'Vehicle No.'],
      sortKey: 'param5',
      value: device => this.joinValues(device.param12, device.param11),
      width: '120px'
    },
    { header: 'Engine No.', key: 'param13', sortKey: 'param7', width: '120px' },
    {
      header: '',
      headers: ['Serial No.', 'IMEI No.', 'ICCID No.'],
      width: '140px',
      sortKey: 'param8',
      value: device => this.joinValues(device.param5, device.param4, device.param6)
    },
    {
      header: '',
      headers: ['Vehicle Type', 'Vehicle Class'],
      sortKey: 'param9',
      value: device => this.joinValues(device.param19, device.param42)
    },
    {
      header: '',
      headers: ['Make', 'Model'],
      sortKey: 'param50',
      width: '130px',
      value: device => this.joinValues(device.param40, device.param41)
    },
    { header: 'Installation Date', key: 'param43', sortKey: 'param16', width: '160px' },
    {
      header: '',
      headers: ['Customer Name', 'Mobile No.'],
      sortKey: 'param47',
      value: device => this.joinValues(device.param28, device.param29)
    },
    {
      header: '',
      headers: ['Dealer', '(Vendor)'],
      sortKey: 'param34',
      value: device => this.joinValues(device.param8, device.param7)
    },
    { header: 'RTO Name', key: 'param18', sortKey: 'param48' },
    {
      header: '',
      headers: ['Activation Status', 'Activation Details'],
      key: 'param25',
      sortKey: 'param25',
      value: device => this.joinValues(device.param25, device.param14),
      className: 'activation-column'
    },
    { header: 'Polling Status', key: 'param45', sortKey: 'param45', className: 'polling-column' },
    {
      header: 'Action',
      className: 'action-column',
      width: '70px',
      actions: [
        {
          label: 'Generate receipt',
          icon: 'fa-file-pdf-o',
          iconOnly: true,
          className: 'table-action-btn table-action-edit',
          run: device => this.printReceipt(device)
        },
        {
          label: 'Untag / request',
          icon: 'fa-unlink',
          iconOnly: true,
          className: 'table-action-btn table-action-toggle',
          visible: () => this.canManageDeviceActions(),
          run: device => this.openUntagModal(device)
        },
        {
          label: 'Delete',
          icon: 'fa-trash',
          iconOnly: true,
          className: 'table-action-btn table-action-delete',
          tone: 'danger',
          visible: () => this.roleId === '10',
          run: device => this.openDeleteModal(device),
          disabled: device => device.param25 === 'Activated'
        }
      ]
    }
  ];

  loading = false;
  isExporting = false;
  isDeleting = false;
  errorMessage = '';
  searchText = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions: number[] = [20];
  totalCount = 0;
  pageCount = 0;
  roleId = '';
  filter = '';
  selectedFilter = 'NewDevice';
  filterType = 'New Device';
  vendor = '';
  rto = '';
  deviceType: OldNewOption = 'new';
  sortKey = '';
  reverse = false;
  selectedDevice: Device | null = null;
  deleteRemark = '';
  deleteRefundAmount = false;
  showUntagModal = false;
  isSubmitting = false;
  untagRemarks = '';
  selectedDeviceId = '';
  selectedDeviceImei = '';
  activationStatus = '';
  requestStatus = '';
  requestedFor = '';
  requestId = '';
  requestType = '';
  status = '';
  requestData: ChangeRequestDetails = {};

  constructor(
    private readonly toast: ToastService,
    private readonly deviceService: DeviceService,
    private readonly vehicleService: VehicleService,
    private readonly encryptionService: EncryptionService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.roleId = sessionStorage.getItem('roleId') || '';
    this.route.params.subscribe(params => {
      this.filter = params['filter'] || 'NewDevice';
      this.selectedFilter = this.filter;
      this.vendor = params['vendor'] === '0' ? '' : (params['vendor'] || '');
      this.rto = params['rto'] === '0' ? '' : (params['rto'] || '');
      this.mapFilterToDisplayName();
      this.loadDevices();
    });
  }

  redirectInsert(): void {
    this.router.navigate(['device/entry']);
  }

  mapFilterToDisplayName(): void {
    const labels: Record<string, string> = {
      NewDevice: 'New Device',
      'New Device': 'New Device',
      'New Devices': 'New Device',
      TotalDevice: 'Total Device',
      ACTIVATED: 'Activated',
      PENDING: 'Pending',
      TODAYINSTALLED: "Today's Installation",
      Installed: "Today's Installation",
      NeverReceived: 'Never Received',
      NotReceived: 'Not Received'
    };
    this.filterType = labels[this.filter] || this.filter;
  }

  onFilterChange(filter: string): void {
    this.filter = filter;
    this.selectedFilter = filter;
    this.currentPage = 1;
    this.mapFilterToDisplayName();
    this.loadDevices();
  }

  onOldNewChange(value: OldNewOption): void {
    this.deviceType = value;
    this.currentPage = 1;
    this.loadDevices();
  }

  canManageDeviceActions(): boolean {
    return ['10', '11', '61', '13'].includes(this.roleId);
  }

  private joinValues(...values: (string | null | undefined)[]): string {
    return values.map(value => value == null || value === '' ? 'NA' : value).join('\n');
  }

  loadDevices(): void {
    this.loading = true;
    this.errorMessage = '';
    const filterValue = this.filter === 'NewDevice' || this.filter === 'New Devices'
      ? 'New Device'
      : this.filter === 'Installed' ? 'New Device' : this.filter;
    const request: DeviceRequest = {
      param1: this.searchText.trim(),
      param2: String(this.currentPage),
      param3: String(this.pageSize),
      param8: this.vendor,
      param9: this.rto,
      param10: filterValue,
      pdfexcel: ''
    };

    this.deviceService.getDeviceDetailsByType(request).subscribe({
      next: response => {
        this.loading = false;
        if (response?.status && (!response.statuscode || Number(response.statuscode) === 200)) {
          this.devices = response.entity?.listData || [];
          this.totalCount = Number(response.entity?.param1) || 0;
          this.pageCount = this.devices.length;
          this.updatePageSizeOptions();
        } else {
          this.devices = [];
          this.totalCount = 0;
          this.pageCount = 0;
          this.errorMessage = typeof response?.entity === 'string' ? response.entity : 'Failed to load devices.';
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.devices = [];
        this.totalCount = 0;
        this.pageCount = 0;
        this.errorMessage = 'Error loading devices. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  private updatePageSizeOptions(): void {
    this.pageSizeOptions = [20, 50, 100, 200, 500].filter(size => size < this.totalCount);
    if (this.totalCount > 0) this.pageSizeOptions.push(this.totalCount);
    if (this.pageSizeOptions.length === 0) this.pageSizeOptions = [20];
  }

  onPageSizeChange(size: number | string): void {
    this.pageSize = Number(size) || 20;
    this.currentPage = 1;
    this.loadDevices();
  }

  onPageChange(page: number): void {
    if (page < 1 || (this.totalCount > 0 && page > Math.ceil(this.totalCount / this.pageSize))) return;
    this.currentPage = page;
    this.loadDevices();
  }

  reloadData(): void {
    this.searchText = '';
    this.currentPage = 1;
    this.loadDevices();
  }

  getSearchDetails(): void {
    this.currentPage = 1;
    this.loadDevices();
  }

  sort(key: string): void {
    if (this.sortKey === key) this.reverse = !this.reverse;
    else {
      this.sortKey = key;
      this.reverse = false;
    }
  }

  getPaginatedData(): Device[] {
    if (!this.sortKey) return this.devices;
    const direction = this.reverse ? -1 : 1;
    return [...this.devices].sort((a, b) =>
      String(a[this.sortKey as keyof Device] ?? '').localeCompare(
        String(b[this.sortKey as keyof Device] ?? ''),
        undefined,
        { numeric: true, sensitivity: 'base' }
      ) * direction
    );
  }

  exportPDFExcel(): void {
    this.isExporting = true;
    const request: DeviceRequest = {
      param1: this.searchText.trim(),
      param2: '1',
      param3: String(this.totalCount || this.pageSize),
      param8: this.vendor,
      param9: this.rto,
      param10: this.filter === 'NewDevice' || this.filter === 'New Devices' ? 'New Device' : this.filter,
      pdfexcel: 'excel'
    };

    this.deviceService.getDeviceDetailsByType(request).subscribe({
      next: response => {
        this.isExporting = false;
        if (response?.status && response.entity) this.toast.commonFileDownload(String(response.entity));
        else this.toast.show(typeof response?.entity === 'string' ? response.entity : 'Export failed.', 'error');
        this.cdr.detectChanges();
      },
      error: () => {
        this.isExporting = false;
        this.toast.show('Error exporting devices. Please try again.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  openDeleteModal(device: Device): void {
    this.selectedDevice = device;
    this.deleteRemark = '';
    this.deleteRefundAmount = false;
  }

  closeDeleteModal(): void {
    if (!this.isDeleting) this.selectedDevice = null;
  }

  submitDelete(): void {
    if (!this.selectedDevice || this.deleteRemark.trim().length < 10) {
      this.toast.show('Remark must have a minimum of 10 characters.', 'error');
      return;
    }
    this.isDeleting = true;
    this.deviceService.deleteDevice({
      param1: this.encryptionService.encryptAccountId(this.selectedDevice.param2),
      param2: this.deleteRemark.trim(),
      param3: this.deleteRefundAmount
    }).subscribe({
      next: response => {
        this.isDeleting = false;
        const succeeded = response?.status || Number(response?.statuscode) === 200;
        this.toast.show(String(response?.entity || (succeeded ? 'Device deleted successfully.' : 'Delete failed.')), succeeded ? 'success' : 'error');
        if (succeeded) {
          if (this.devices.length === 1 && this.currentPage > 1) this.currentPage--;
          this.selectedDevice = null;
          this.loadDevices();
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isDeleting = false;
        this.toast.show('Error deleting device. Please try again.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  openUntagModal(device: Device): void {
    this.untagRemarks = '';
    this.status = '';
    this.requestType = '';
    this.requestData = {};
    this.selectedDeviceId = device.param2 || device.param3 || '';
    this.activationStatus = device.param25 || device.param34 || '';
    this.selectedDeviceImei = device.param4 || device.param5 || '';
    this.requestStatus = device.param71 || '';
    this.requestedFor = device.param70 || '';
    this.requestId = device.param69 || '';
    this.showUntagModal = true;
    if (this.requestId) this.requestDetails();
  }

  closeUntagModal(): void {
    if (this.isSubmitting) return;
    this.showUntagModal = false;
    this.untagRemarks = '';
    this.selectedDeviceId = '';
    this.selectedDeviceImei = '';
    this.activationStatus = '';
    this.requestStatus = '';
    this.requestedFor = '';
    this.requestId = '';
    this.requestType = '';
    this.requestData = {};
    this.loadDevices();
  }

  performOperation(type: 'untag' | 'delete'): void {
    if (this.untagRemarks.trim().length < 5) {
      this.toast.show('Remarks must be at least 5 characters.', 'error');
      return;
    }

    if (this.activationStatus === 'Pending OTP') {
      type === 'delete' ? this.deleteOperation() : this.untagOperation();
    } else if (this.activationStatus === 'Activated' && ['11', '61', '13'].includes(this.roleId)) {
      this.requestType = type;
      this.requestInitialize();
    } else if (this.activationStatus === 'Activated' && this.roleId === '10') {
      if (this.requestStatus) this.updateChangeRequestStatus(type);
      else type === 'delete' ? this.deleteOperation() : this.untagOperation();
    } else this.toast.show('This device action is not available for its current status or your role.', 'error');
  }

  private requestInitialize(): void {
    this.isSubmitting = true;
    this.deviceService.requestInitialize({
      requestpage: 'device',
      assetid: this.selectedDeviceId,
      requestvalues_new: '',
      reasonid: '',
      requesttype: this.requestType,
      requestvalues_old: '',
      remarks: this.untagRemarks
    }).subscribe({
      next: response => {
        this.isSubmitting = false;
        if (response?.status || Number(response?.statuscode) === 200) {
          this.toast.show(response.entity || 'Request submitted successfully.', 'success');
          this.closeUntagModal();
        } else this.toast.show(response?.entity || 'Request failed.', 'error');
      },
      error: () => {
        this.isSubmitting = false;
        this.toast.show('Error submitting request.', 'error');
      }
    });
  }

  private requestDetails(): void {
    this.deviceService.requestDetails({ param2: '1', param3: '10', param4: '', param5: this.requestId }).subscribe({
      next: response => {
        if (response?.status || Number(response?.statuscode) === 200) {
          this.requestData = response.entity?.listData?.[0] || {};
        } else this.toast.show('Error fetching request details.', 'error');
      },
      error: () => this.toast.show('Error fetching request details.', 'error')
    });
  }

  private updateChangeRequestStatus(type: 'untag' | 'delete'): void {
    if (!this.status) {
      this.toast.show('Please select Approve or Reject.', 'error');
      return;
    }
    this.isSubmitting = true;
    this.deviceService.updateChangeRequestStatus({
      requestid: this.requestId,
      status: this.status,
      remarks: this.untagRemarks
    }).subscribe({
      next: response => {
        this.isSubmitting = false;
        if (response?.status || Number(response?.statuscode) === 200) {
          this.toast.show(response.entity || 'Request updated successfully.', 'success');
          if (this.status === 'Approved') {
            type === 'delete' ? this.deleteOperation() : this.untagOperation();
          } else this.closeUntagModal();
        } else this.toast.show(response?.entity || 'Request update failed.', 'error');
      },
      error: () => {
        this.isSubmitting = false;
        this.toast.show('Error updating request status.', 'error');
      }
    });
  }

  private untagOperation(): void {
    this.isSubmitting = true;
    this.vehicleService.untagDevice({ param2: this.selectedDeviceId, param3: this.untagRemarks }).subscribe({
      next: response => {
        this.isSubmitting = false;
        if (response?.status || Number(response?.statuscode) === 200) {
          this.toast.show(response.entity || 'Device untagged successfully.', 'success');
          this.closeUntagModal();
        } else this.toast.show(response?.entity || 'Error untagging device.', 'error');
      },
      error: () => {
        this.isSubmitting = false;
        this.toast.show('Error untagging device.', 'error');
      }
    });
  }

  private deleteOperation(): void {
    this.isSubmitting = true;
    this.deviceService.deleteDevice({
      param1: this.selectedDeviceId,
      param2: this.untagRemarks,
      param3: false
    }).subscribe({
      next: response => {
        this.isSubmitting = false;
        if (response?.status || Number(response?.statuscode) === 200) {
          this.toast.show(response.entity || 'Device deleted successfully.', 'success');
          this.closeUntagModal();
        } else this.toast.show(response?.entity || 'Delete failed.', 'error');
      },
      error: () => {
        this.isSubmitting = false;
        this.toast.show('Error deleting device.', 'error');
      }
    });
  }

  printReceipt(device: Device): void {
    this.deviceService.getReceiptGeneratedDevices1({ param1: device.param19, param10: 'pdf' }).subscribe({
      next: response => {
        if (Number(response?.statuscode) === 200 && response.entity) window.open(String(response.entity), '_blank', 'noopener');
        else this.toast.show(typeof response?.entity === 'string' ? response.entity : 'Receipt could not be generated.', 'error');
      },
      error: () => this.toast.show('Error generating receipt. Please try again.', 'error')
    });
  }
}
