import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiResponse } from '../../../core/services/base-api.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { DeviceService } from '../../../core/services/device.service';
import { ToastComponent } from '../../assets/inactive-assets/toast.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { ToastService } from '../../../core/services/toast.service';
import moment from 'moment';
import { VahanService } from '../../../core/services/vahan.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import dayjs, { Dayjs } from 'dayjs';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { ValidationsService } from '../../../core/services/validations.service';
import { SimValidityService } from '../../../core/services/sim-validity.service';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
declare var $: any;
type ForceActionType = 'polling' | 'emr' | 'smsack' | 'simvalidity' | 'otp' | 'activate';
type RowAction = ForceActionType | 'validityUpdate' | 'compliance';

interface ComplianceItem {
  key: string;
  label: string;
  value: boolean;
  highlighted: boolean;
}
export class SimValidityUpdateRequest {
  param1: string = "";
  param2: string = "";
  param3: string = "";
  param4: string = "";
  param5: string = "";
  param6: string = "";
  param7: string = "";
  param8: string = "";
  param11: string = "";
  param12: string = "";
  param13: string = "";
}

@Component({
    selector: 'app-forcefull-vehicle-installation',
    imports: [CommonModule, FormsModule, RouterModule, NgSelectModule, NgxDaterangepickerMd, NgbPaginationModule],
    templateUrl: './forcefull-vehicle-installation.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './forcefull-vehicle-installation.component.scss'
})
export class ForcefullVehicleInstallationComponent implements OnInit {
  // date intitialization
  today: Dayjs = dayjs();

  selectedDateRange = {
    startDate: dayjs().toDate(),
    endDate: dayjs().add(2, 'year').toDate()
  };

  locale = {
    format: 'DD-MMM-YYYY'
  };

  // date end

  devices: any[] = [];
  filteredDevices: any[] = [];
  vendorList: any[] = [];
  network1Obj: any = null;
  network2Obj: any = null;
  forceActions: Array<{ type: ForceActionType; label: string; icon: string }> = [
    { type: 'polling', label: 'Polling', icon: 'fa-signal' },
    { type: 'emr', label: 'EMR', icon: 'fa-ambulance' },
    { type: 'smsack', label: 'SMS Ack', icon: 'fa-commenting' },
    { type: 'simvalidity', label: 'SIM Validity', icon: 'fa-calendar-check-o' },
    { type: 'otp', label: 'OTP', icon: 'fa-key' },
    { type: 'activate', label: 'Activate', icon: 'fa-bolt' }
  ];

  searchText = '';
  selectedVendor = null;
  loading = false;
  vendorLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  complianceModalOpen = false;
  selectedComplianceDevice: any | null = null;
  selectedComplianceItems: ComplianceItem[] = [];

  pageSize: any = 20;
  currentPage: any = 1;
  totalCount: number = 0;
  pageCount: number = 0;
  pageSizeOptions = [10, 20, 50, 100]; m2mProviderObj: any;
  ;
  m2mProviderList: any[] = [];
  fromDate: any = "";
  toDate: any = "";
  private rowLoading = new Map<string, RowAction>();
  private complianceByRow = new Map<string, ComplianceItem[]>();
  private readonly highlightedComplianceKeys = new Set(['secure_APN', 'network_switch', 'network_stable']);

  @ViewChild('searchVendorForm') searchVendorForm!: NgForm;

  constructor(
    private dashboardService: DashboardService,
    private deviceService: DeviceService,
    public toastService: ToastService,
    public vahanService: VahanService,
    public vehicleService: VehicleService,
    public vs: ValidationsService,
    public simValidityService: SimValidityService
  ) {
    this.toastService.pageName = 'Forcefull Vehicle Installation'; // Set page name for toast service
   }

  ngOnInit(): void {
    this.initializeDateRangePicker();
    this.loadVendorList();
    this.loadNetworkList();
    this.loadM2MProviderList();
    // this.loadDevices();
  }
  formatDate(date: Date): string {
    return moment(date).format('DD-MMM-YYYY');
  }
  updatePageSizeOptions() {
    // Generate page size options based on total count
    const options = [20];
    if (this.totalCount > 50) options.push(50);
    if (this.totalCount > 100) options.push(100);
    if (this.totalCount > 200) options.push(200);
    if (this.totalCount > 500) options.push(500);
    if (this.totalCount > 0 && this.totalCount < 100) options.push(this.totalCount); // 'All'
    this.pageSizeOptions = options;
  }
  initializeDateRangePicker() {
    $(() => {

      $('input[name="date"]').daterangepicker({
        singleDatePicker: true,
        showDropdowns: true, // Year & Month dropdowns
        autoApply: true,
        timePicker: false,

        startDate: moment(), // today

        minDate: moment(), // cannot select past dates
        maxDate: moment().add(2, 'years').add(6, 'months'), // next 2 years

        minYear: moment().year(),
        maxYear: moment().add(2, 'years').add(6, 'months').year(),

        opens: 'center',
        drops: 'down',

        locale: {
          format: 'DD-MMM-YYYY'
        }

      }, (start: any, end: any, label: any) => {
        this.fromDate = start.format('DD-MMM-YYYY');
           this.updateSimValidityRequest.param6 = start.format('DD/MMM/YYYY');
  this.updateSimValidityRequest.param7 = start.format('DD/MMM/YYYY'); // fallback_simvalidity
      });

      // const picker: any = $('input[name="date"]').data('daterangepicker');

    });
  }
  // onDateRangeChange(e: any) {
  //   if (!e?.startDate || !e?.endDate) return;
  //   const start = e.startDate.toDate();
  //   const end = e.endDate.toDate();
  //   this.fromDate = this.formatDate(start);
  //   this.toDate = this.formatDate(end);
  // }
  networkList: any[] = [];
  loadNetworkList() {
    this.vahanService.getNetworkRoster().subscribe({
      next: (response) => {
        if (response?.status && response?.entity) {
          this.networkList = Array.isArray(response.entity)
            ? response.entity
            : [];
        }
      },
      error: (error) => {
        console.error("Error loading network list:", error);
      },
    });
  }
  loadM2MProviderList() {
    this.vahanService.getM2MProviderRoster().subscribe({
      next: (response: any) => {
        if (response?.status && response?.entity) {
          this.m2mProviderList = response.entity;
        }
      },
    });
  }
  getSearchDetails() {
    this.loadDevices();
  }
  clearSearch() {
    this.searchText = '';
    this.selectedVendor = null;
    this.devices = [];
    this.pageCount = 0;
    this.totalCount = 0;
    this.pageSize = 20;
    this.currentPage = 1;
  }

  get paginatedDevices(): any[] {
    return this.filteredDevices;
  }

  get hasRowLoading(): boolean {
    return this.rowLoading.size > 0;
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadDevices();
  }
  onPageSizeChange(size: number | string) {
    if (size === 'All' || size === this.totalCount) {
      this.pageSize = this.totalCount;
    } else {
      this.pageSize = Number(size);
    }
    this.currentPage = 1;
    this.loadDevices();
  }

  // getPaginatedVendors(): Vendor[] {
  //     // API already returns paginated data, so just sort if needed
  //     // Note: In a production app, sorting should be done server-side
  //     // For now, we do client-side sorting on the current page
  //     let sorted = [...this.vendors];
  //     if (this.sortKey) {
  //       sorted.sort((a: any, b: any) => {
  //         const aVal = String(a[this.sortKey] || '').toLowerCase();
  //         const bVal = String(b[this.sortKey] || '').toLowerCase();
  //         if (this.reverse) {
  //           return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
  //         } else {
  //           return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
  //         }
  //       });
  //     }
  //     return sorted;
  //   }

  getTotalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }
  onPageChange(page: number) {
    this.currentPage = page;
    this.loadDevices();
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
        pages.push(-1); // Ellipsis
        pages.push(total);
      } else if (this.currentPage >= total - 3) {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = total - 4; i <= total; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis
        pages.push(total);
      }
    }
    return pages;
  }

  shouldShowPage(page: number): boolean {
    return page !== -1;
  }
  changePage(p: number) {

    if (p < 1 || p > this.totalPages) return;

    this.currentPage = p;

    this.loadDevices(); // 🔥 reload API
  }
  onPageSizeChanged(size: any) {

    if (size === 'All') {
      this.pageSize = this.totalCount;
    } else {
      this.pageSize = Number(size);
    }

    // this.pageSize = 1; // 🔥 reset page
    this.loadDevices(); // 🔄 reload
  }
  totalPages: number = 0;
  loadDevices(): void {
    // if (this.searchVendorForm.invalid) {
    //   this.toastService.show('Please select a vendor.');
    //   return;
    // }
    this.loading = true;
    const request = {
      param1: this.searchText, //search text
      param2: this.currentPage, //page number
      param3: this.pageSize, //page size
      // param8: 'Company'||"",//filterby : Role Name (Company/RTO,Dealer,Sub RTO)
      // param9: this.selectedVendor,//value  dena hai 
      param8: this.selectedVendor ? 'Company' : '',
param9: this.selectedVendor ? this.selectedVendor : '',
      param10: '', //'Not Activated',
      param11: '', //vehicle class id
      pdfexcel: ""
    };
    this.deviceService.getDeviceMasterDetails(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.statuscode == 200) {
          const total = Number(response?.entity?.param1 || 0);
          this.totalCount = total;
          this.devices = response.entity.listData;
          this.pageCount = this.devices.length;
          // ✅ pages
          this.totalPages = Math.ceil(total / this.pageSize);
          this.updatePageSizeOptions(); // Update page size options based on total count
          // this.totalCount = response.entity.param1 || 0;

          // // Calculate page count
          // if (this.devices.length < this.pageSize) {
          //   this.pageCount = this.devices.length;
          // } else {
          //   this.pageCount = this.pageSize;
          // }
        } else {
          this.devices = [];
          this.totalCount = 0;
          this.toastService.show(response.message || 'Failed to load pending vehicle details.');
        }
        // this.devices = this.extractRows(response);
        // this.filteredDevices = [...this.devices];
        // this.currentPage = Math.min(this.currentPage, this.totalPages);
        // this.pruneComplianceCache();
      },
      error: (error) => {
        this.devices = [];
        this.filteredDevices = [];
        this.totalCount = 0;
        this.currentPage = 1;
        this.errorMessage = this.getErrorMessage(error, 'Failed to load pending vehicle details.');
      }
    });
  }

  isGpsValid(lattidudep: string, longitudep: string): boolean {

    const lat = lattidudep;
    const lng = longitudep;

    // ❌ NA check
    if (
      !lat || !lng ||
      lat === 'NA' || lng === 'NA'
    ) {
      return false;
    }

    const latitude = Number(lat);
    const longitude = Number(lng);

    // ❌ invalid number
    if (
      isNaN(latitude) ||
      isNaN(longitude)
    ) {
      return false;
    }

    // ❌ 0,0 check
    if (latitude === 0 && longitude === 0) {
      return false;
    }

    return true;
  }
  getLiveEmergencyData(imeiNo: string, index: any): void {

    this.toastService.loaderFlag = true;
    this.dashboardService.getLiveEmergencyDetails('', '1', '10', imeiNo)
      .subscribe({
        next: (res: any) => {

          this.toastService.loaderFlag = false;

          if (res.statuscode==200) {
            this.loadDevices();
          }

        },
        error: () => {
          this.toastService.loaderFlag = false;
          this.devices[index].lastAlertTime = '';
        }
      });
  }
  panicPush(item: any, index: number): void {
    const request = {
      "vehicleid": item.param2, // Assuming param2 is vehicle ID
      "imeino": item.param5
    }
    this.deviceService.pushEmergencyAlert(request).subscribe({
      next: (response) => {
        if (response.statuscode == 200) {
          this.searchText = item.param5;
          this.loadDevices();
          
        }
        else {
          this.toastService.show(response.message || 'Failed to send panic push alert.');
        }
      },
      error: (error) => {
        this.toastService.show(this.getErrorMessage(error, 'Failed to send panic push alert.'));
      }
    });
  }

  getGpsStatusText(lat: string, long: string) {
    if (this.isGpsValid(lat, long)) {
      return `GPS Valid (${lat}, ${long})`;
    }
    return 'GPS Invalid';
  }
  formatDateTime(date: any) {
  if (!date) return '';

  return moment(
    date,
    'DD-MMM-YYYY hh:mm:ss A'
  ).format('DD-MMM-YYYY hh:mm A');
}

  loadVendorList(): void {
    this.vendorLoading = true;

    this.dashboardService.getVendorList('', '').pipe(
      finalize(() => this.vendorLoading = false)
    ).subscribe({
      next: (response) => {
        this.vendorList = response.status && response.entity ? response.entity : [];
      },
      error: (error) => {
        this.vendorList = [];
        this.errorMessage = this.getErrorMessage(error, 'Failed to load vendor list.');
      }
    });
  }

  onVendorChange(): void {
    this.currentPage = 1;
    this.loadDevices();
  }

  reloadData(): void {
    this.searchText = '';
    this.currentPage = 1;
    this.pageSize = 20;
    this.loadDevices();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage -= 1;
      this.loadDevices();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage += 1;
      this.loadDevices();
    }
  }

  forceDeviceAction(device: any, actionType: ForceActionType): void {
    const rowKey = this.getRowKey(device);
    const vehicleId = this.getVehicleId(device);
    const deviceId = this.getDeviceId(device);
    const actionLabel = this.getForceActionLabel(actionType);

    if (!deviceId) {
      this.errorMessage = 'Device ID is missing.';
      return;
    }

    this.setRowLoading(rowKey, actionType);
    this.deviceService.forcefullyActiveDevice({
      param1: vehicleId,
      param2: deviceId,
      param3: actionType,
      param4: 'check',
      param5: ''
    }).pipe(
      finalize(() => this.clearRowLoading(rowKey))
    ).subscribe({
      next: (response) => {
        if (response.status) {
          this.successMessage = this.getResponseMessage(response, `${actionLabel} request submitted successfully.`);
          this.loadDevices();
          return;
        }

        this.errorMessage = this.getResponseMessage(response, `${actionLabel} request failed.`);
      },
      error: (error) => {
        this.errorMessage = this.getErrorMessage(error, `${actionLabel} request failed.`);
      }
    });
  }

  forceActivate(device: any): void {
    this.forceDeviceAction(device, 'activate');
  }

  updateSimValidity(device: any): void {
    const rowKey = this.getRowKey(device);
    const iccid = this.getIccid(device);

    if (!iccid || iccid === 'NA') {
      this.errorMessage = 'ICCID is missing.';
      return;
    }

    this.setRowLoading(rowKey, 'validityUpdate');
    this.deviceService.updateForceInstallSimValidity({
      param1: iccid,
      param2: this.getVendorName(device),
      param3: this.getVendorCode(device),
      param4: this.getSimProvider(device)
    }).pipe(
      finalize(() => this.clearRowLoading(rowKey))
    ).subscribe({
      next: (response) => {
        if (response.status) {
          this.successMessage = this.getResponseMessage(response, 'SIM validity updated successfully.');
          return;
        }

        this.errorMessage = this.getResponseMessage(response, 'SIM validity update failed.');
      },
      error: (error) => {
        this.errorMessage = this.getErrorMessage(error, 'SIM validity update failed.');
      }
    });
  }

  checkCompliance(device: any): void {
    const rowKey = this.getRowKey(device);
    const deviceId = this.getDeviceId(device);

    if (!deviceId) {
      this.errorMessage = 'Device ID is missing.';
      return;
    }

    this.setRowLoading(rowKey, 'compliance');
    this.deviceService.checkForceInstallCompliance({
      deviceid: deviceId,
      time_synced: this.currentDateTime()
    }).pipe(
      finalize(() => this.clearRowLoading(rowKey))
    ).subscribe({
      next: (response) => {
        if (!response.status) {
          this.errorMessage = this.getResponseMessage(response, 'Compliance check failed.');
          return;
        }

        const compliance = this.parseComplianceResponse(response);
        this.complianceByRow.set(rowKey, compliance);
        this.openComplianceModal(device, compliance);

        if (this.isCompliancePassed(device)) {
          this.successMessage = 'Compliance check passed.';
          return;
        }

        this.errorMessage = 'Compliance check completed with failed checks.';
      },
      error: (error) => {
        this.errorMessage = this.getErrorMessage(error, 'Compliance check failed.');
      }
    });
  }

  closeComplianceModal(): void {
    this.complianceModalOpen = false;
    this.selectedComplianceDevice = null;
    this.selectedComplianceItems = [];
  }

  isRowActionLoading(device: any, action: RowAction): boolean {
    return this.rowLoading.get(this.getRowKey(device)) === action;
  }

  isRowBusy(device: any): boolean {
    return this.rowLoading.has(this.getRowKey(device));
  }

  getComplianceItems(device: any): ComplianceItem[] {
    return this.complianceByRow.get(this.getRowKey(device)) || [];
  }

  isCompliancePassed(device: any): boolean {
    const items = this.getComplianceItems(device);
    return items.length > 0 && items.every(item => item.value);
  }

  getImei(device: any): string {
    return this.value(device, ['param5']);
  }

  getSimNumbers(device: any): string[] {
    const primary = this.value(device, ['param8']);
    const secondary = this.value(device, ['param9']);
    const primaryProvider = this.value(device, ['param10'], '');
    const secondaryProvider = this.value(device, ['param11'], '');
    const sims = [
      this.formatSim(primary, primaryProvider),
      this.formatSim(secondary, secondaryProvider)
    ];

    return sims.filter(sim => sim !== 'NA');
  }

  getIccid(device: any): string {
    return this.value(device, ['param7']);
  }

  getVendorName(device: any): string {
    return this.value(device, ['param15']);
  }

  getDeviceId(device: any): string {
    return this.value(device, ['param2']);
  }

  trackByRowKey = (_: number, device: any): string => {
    return this.getRowKey(device);
  };

  private getVehicleId(device: any): string {
    return this.value(device, ['param2', 'vehicleId', 'vehicleid'], '');
  }

  private formatSim(simNumber: string, provider: string): string {
    if (simNumber === 'NA') {
      return 'NA';
    }

    return provider ? `${simNumber} - ${provider}` : simNumber;
  }

  private getVendorCode(device: any): string {
    return this.value(device, ['vendorCode', 'manufacturerCode', 'param45'], '');
  }

  private getSimProvider(device: any): string {
    return this.value(device, ['simProvider', 'm2mCode', 'param14'], '');
  }

  private getForceActionLabel(actionType: ForceActionType): string {
    return this.forceActions.find(action => action.type === actionType)?.label || actionType;
  }

  private openComplianceModal(device: any, compliance: ComplianceItem[]): void {
    this.selectedComplianceDevice = device;
    this.selectedComplianceItems = compliance;
    this.complianceModalOpen = true;
  }

  private setRowLoading(rowKey: string, action: RowAction): void {
    this.errorMessage = null;
    this.successMessage = null;
    this.rowLoading.set(rowKey, action);
  }

  private clearRowLoading(rowKey: string): void {
    this.rowLoading.delete(rowKey);
  }

  private parseComplianceResponse(response: ApiResponse<any>): ComplianceItem[] {
    const rawValue = response?.entity?.param2 ?? response?.entity;
    const parsed = this.safeJsonParse(rawValue);
    const details = Array.isArray(parsed) ? parsed[0] : parsed;

    if (!details || typeof details !== 'object') {
      return [];
    }

    return Object.entries(details).map(([key, value]) => ({
      key,
      label: this.formatComplianceLabel(key),
      value: this.toBoolean(value),
      highlighted: this.highlightedComplianceKeys.has(key)
    }));
  }

  private safeJsonParse(value: unknown): any {
    if (typeof value !== 'string') {
      return value;
    }

    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  private toBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    return String(value).trim().toLowerCase() === 'true';
  }

  private formatComplianceLabel(key: string): string {
    const labelMap: Record<string, string> = {
      protocol_match: 'Protocol Match',
      gps_validation: 'GPS Validation',
      auth: 'Auth',
      sms_ack: 'SMS Ack',
      raw_data: 'Raw Data',
      movement_detected: 'Movement Detected',
      frequency_10s: 'Frequency 10s',
      power_connected: 'Power Connected',
      no_tamper: 'No Tamper',
      disconnected_alert: 'Disconnected Alert',
      time_synced: 'Time Synced',
      latency: 'Latency',
      signal: 'Signal',
      no_packet_loss: 'No Packet Loss',
      secure_APN: 'Secure APN',
      network_switch: 'Network Switch',
      network_stable: 'Network Stable'
    };

    if (labelMap[key]) {
      return labelMap[key];
    }

    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, letter => letter.toUpperCase());
  }

  private currentDateTime(): string {
    const date = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');

    return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate())
    ].join('-') + ' ' + [
      pad(date.getHours()),
      pad(date.getMinutes()),
      pad(date.getSeconds())
    ].join(':');
  }

  private pruneComplianceCache(): void {
    const availableKeys = new Set(this.devices.map(device => this.getRowKey(device)));

    Array.from(this.complianceByRow.keys()).forEach(key => {
      if (!availableKeys.has(key)) {
        this.complianceByRow.delete(key);
      }
    });
  }

  private getRowKey(device: any): string {
    return this.getDeviceId(device) || this.getImei(device) || this.value(device, ['param1'], '');
  }

  private extractRows(response: ApiResponse<any>): any[] {
    const entity = response?.entity;

    if (Array.isArray(entity)) {
      return entity;
    }

    if (Array.isArray(entity?.listData)) {
      return entity.listData;
    }

    if (Array.isArray(entity?.data)) {
      return entity.data;
    }

    if (Array.isArray(entity?.devices)) {
      return entity.devices;
    }

    return [];
  }

  private extractTotalCount(response: ApiResponse<any>, fallback: number): number {
    const rawTotal = response?.entity?.param1 ?? response?.entity?.totalCount ?? response?.entity?.totalRecords;
    const total = Number(rawTotal);

    return Number.isFinite(total) && total > 0 ? total : fallback;
  }

  private getResponseMessage(response: ApiResponse<any>, fallback: string): string {
    if (typeof response?.entity === 'string') {
      return response.entity;
    }

    return response?.message || response?.entity?.message || fallback;
  }

  private getErrorMessage(error: any, fallback: string): string {
    return error?.error?.entity || error?.error?.message || error?.message || fallback;
  }

  private value(device: any, keys: string[], fallback = 'NA'): string {
    for (const key of keys) {
      const value = device?.[key];

      if (value !== undefined && value !== null && String(value).trim() !== '') {
        return String(value).trim();
      }
    }

    return fallback;
  }
  isRecentTime(time: string): boolean {
    if (!time) return false;

    const givenTime = new Date(time);
    const now = new Date();

    return (
      givenTime.getDate() === now.getDate() &&
      givenTime.getMonth() === now.getMonth() &&
      givenTime.getFullYear() === now.getFullYear()
    );
  }
  isPanicLocationValid(latp: string, lngp: string): boolean {

    const lat = latp;
    const lng = lngp;

    if (
      !lat || !lng ||
      lat === 'NA' || lng === 'NA'
    ) {
      return false;
    }

    const latitude = Number(lat);
    const longitude = Number(lng);

    // ❌ invalid number
    if (
      isNaN(latitude) ||
      isNaN(longitude)
    ) {
      return false;
    }

    // ❌ 0,0 invalid
    if (latitude === 0 && longitude === 0) {
      return false;
    }

    return true;
  }
  isSimValidityEligible(vehicleTyped: string, simVal1: any, simVal2: any): boolean {

    // ✅ Vehicle Type
    const vehicleType =
      (vehicleTyped || '')
        .trim()
        .toUpperCase();

    // ✅ OLD = 1 year | NEW = 2 years
    const requiredYears =
      vehicleType === 'OLD' ? 1 : 2;

    // ✅ Parse dates
    const sim1 = moment(simVal1, 'DD-MMM-YYYY', true);
    const sim2 = moment(simVal2, 'DD-MMM-YYYY', true);

    if (!sim1.isValid() || !sim2.isValid()) {
      return false;
    }

    // ✅ Today start
    const today = moment().startOf('day');

    // ✅ Required validity date
    const minDate = today.clone().add(requiredYears, 'years');

    // ✅ Allow same date also
    return (
      sim1.startOf('day').isSameOrAfter(minDate) &&
      sim2.startOf('day').isSameOrAfter(minDate)
    );
  }
  public updateSimValidityRequest: SimValidityUpdateRequest = new SimValidityUpdateRequest();
  setData(item: any, index: number) {
    $('#updateValidityModal').modal('show');
    if (item.param10 && item.param11) {
      this.networkList.forEach(network => {
        if (network.param2.toLowerCase() === item.param10.toLowerCase()) {

          this.network1Obj = network.param2;
        }
        if (network.param2.toLowerCase() === item.param11.toLowerCase()) {
          this.network2Obj = network.param2;
        }
      });
    } else {
      this.network1Obj = null;
      this.network2Obj = null;
    }
    if (item.param12) {
      this.m2mProviderList.forEach(element => {
        if (item.param12 == element.param1) {
          this.m2mProviderObj = element.param1
        }
      });
    }
    this.updateSimValidityRequest.param1 = item.param7; // iccino
    this.updateSimValidityRequest.param2 = item.param10; // Primary_TSP_Name
    this.updateSimValidityRequest.param3 = item.param11; // Fallback_TSP_Name
    this.updateSimValidityRequest.param4 = item.param8; // Primary_TSP_MSISDN
    this.updateSimValidityRequest.param5 = item.param9; // Fallback_TSP_MSISDN
    this.updateSimValidityRequest.param6 = item.param50; // primary_simvalidity
    this.updateSimValidityRequest.param7 = item.param51; // fallback_simvalidity
    this.updateSimValidityRequest.param8 = item.param38; // Customer Mobile
    this.updateSimValidityRequest.param11 = ""; // filename
    this.updateSimValidityRequest.param13 = ""; // token
    this.updateSimValidityRequest.param12 = item.param12; // m2m provider id

    this.setDate(item.param50)



  }
  setDate(date: string) {
    let dated = date ? date : moment()
    const selectedDate = moment(dated, 'DD-MMM-YYYY');

    $('input[name="date"]').daterangepicker({
      singleDatePicker: true,
      showDropdowns: true,
      autoApply: true,

      startDate: selectedDate, // selected/opened date

      minDate: moment(),   // or remove if older dates should also be selectable
      maxDate: moment().add(30, 'months'),

      minYear: selectedDate.year(),
      maxYear: moment().add(30, 'months').year(),

      locale: {
        format: 'DD-MMM-YYYY'
      }
    }, (start: any, end: any, label: any) => {
        this.fromDate = start.format('DD-MMM-YYYY');
          this.updateSimValidityRequest.param6 = this.fromDate; // primary_simvalidity
          this.updateSimValidityRequest.param7 = this.fromDate; // fallback_simvalidity
      });
    
  }
  submitValidityUpdate(updateValidityForm: NgForm) {

    //console.log("Update Payload:", payload);
    this.updateSimValidityRequest.param2 = this.network1Obj ? this.network1Obj : '';
    this.updateSimValidityRequest.param3 = this.network2Obj ? this.network2Obj : '';
    this.updateSimValidityRequest.param12 = this.m2mProviderObj ? this.m2mProviderObj : '';

    this.vahanService.putSimDetails(this.updateSimValidityRequest).subscribe({

      next: (res:any)=>{
        if(res.statuscode==200) {
          this.searchText = this.updateSimValidityRequest.param1; // Set search text to ICCID
          this.loadDevices();
          this.toastService.show("Validity updated successfully", 'success');
           (document.activeElement as HTMLElement)?.blur();
            $("#updateValidityModal").modal("hide");
        } else {
          this.toastService.show(res.entity, 'error');
        }
      },
      error: (err: Error) => {
          console.error("Error updating validity:", err);
      }
    });
  }
  resetValidityForm(form: NgForm) {
    form.resetForm();
  }

  canEnableActivationButton(item: any): boolean {
    
    if ((item.param48 === 'Received' || item.param48 === 'Not Received')
      && item.param32.toLowerCase() === 'tcp' && this.isRecentTime(item.param73)
      && this.isGpsValid(item.param61, item.param62) && this.isPanicLocationValid(item.param61, item.param62) && this.isSimValidityEligible(item.param28, item.param50, item.param51)) {
        // console.log("true");
        return true;
    } else {
      // console.log("false");
      return true;
    }
    // this.pollingStatus === 'Received' &&
    // this.isModeAllowed() &&
    // this.isRecentTime(this.lastAlertTime) &&
    // this.isGpsValid() &&
    // this.activationCheckFlag &&
    // this.resStatus === 'true' && this.isPanicLocationValid() &&
    // this.isSimValidityEligible(); // ✅ NEW CHECK
  }

  activateVehicle(item: any) {
    if(this.canEnableActivationButton(item)) {
      
      const request = {
        param1: item.param2, //deviceid
        param2: '',//this.otp, //otp
        param3: item.param38, //mobileno
        param4: item.param19,
        param6: item.param35=='Not Activated' ? 'installation': 'renewal',
        param7: 'forceinstallation'//searchtype
      };
  
      this.vehicleService.activateVehicle(request).subscribe({
        next: (res) => {
          let msgType: any = "success";
          if (res.statuscode == 200) {
            // this.reloadData();  dubble api call avoided
            msgType = "success";

          } else {
            msgType = "error";
          }
          this.loadDevices();
          // this.selectedVendor = null;
          // this.totalCount = 0;
          // this.devices = [];
          // this.searchText = "";
          this.toastService.show(res.entity, msgType);
        },
        error: () => {
          this.toastService.show('Error in vehicle activation', 'error');
        }
      });
    } else {
      this.toastService.show("", "error")
    }
  }

  updatingDevices: Set<string> = new Set();
  updateSimValidityAuto(device: any) {
    const deviceId = device.param2 || '';
    if (this.updatingDevices.has(deviceId)) {
      return; // Already updating
    }

    this.updatingDevices.add(deviceId);

    const request = {
      param1: device.param7 || '', // ICCID No
      param2: device.param15 || '', // Vendor Name
      param3: device.param45 || '', // Manufacturer Code
      param4: device.param14 || ''  // M2M Code
    };

    this.simValidityService.updateSimValidity(request).subscribe({
      next: (response) => {
        this.updatingDevices.delete(deviceId);
        if (response.status && (response.entity === 'Successfully saved' || response.entity === 'Successfully updated')) {
          this.toastService.show('Sim Validity Updated', 'success')
          this.loadDevices();
        } else {
          this.toastService.show(response.entity, 'error');
        }
      },
      error: (error) => {
        this.updatingDevices.delete(deviceId);
        this.toastService.show(error, 'error');

      }
    });
  }
}
