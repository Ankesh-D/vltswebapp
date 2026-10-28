import { Component, OnDestroy } from "@angular/core";
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from "@angular/common";

import { FormsModule } from "@angular/forms";

import { NzTabsModule } from "ng-zorro-antd/tabs";
import { OperationService } from '../../../core/services/operation.service';
import { finalize } from 'rxjs/operators';
import { Subscription } from "rxjs";
import { VahanService } from "../../../core/services/vahan.service";
import {
  Device,
  DeviceListResponse,
  DeviceService,
} from "../../../core/services/device.service";
import { ToastService } from "../../../core/services/toast.service";

type SearchType = "imei" | "serial" | "iccid";

type TabScreen = "search" | "details";

interface DeviceSearchTab {

 id: number;

 title: string;

 searchType: SearchType;

 searchInput: string;

 loading: boolean;

 hasSearched: boolean;

 screen: TabScreen;

 error: string;

 details: Device | null;

 requestId: number;

 request: Subscription | null;

}
export interface RawDataRequestModel {
  param1: string;
  param2: string;
  param3: string;
  param4: string;
  param5: string;
  param6: string;
  param7: string;
  param8: string;
}

export interface RawDataRowModel {
  param1: string; // Sr No
  param2: string; // UUID
  param3: string; // Server polling time
  param4: string; // Raw packet data
  param5: string; // Device IP
  param6: string; // Port
}

export interface RawDataResponseModel {
  statuscode: number;
  entity?: {
    listData?: RawDataRowModel[];
    param1?: string | number; // Total records
  };
  message?: string;
}
interface VahanRecord {
  param1: string;   // chassisNo
  param2: string;   // deviceSerialno
  param3: string;   // fitmentCentreName
  param4: string;   // iccId
  param5: string;   // imeiNo
  param6: string;   // makerName
  param7: string;   // modelName
  param8: string;   // tacNo
  param9: string;   // tacValidUpto
  param10: string;  // regnNo
  param11: string;  // vehclass
  param12: string;  // dateOfRegistration
  param13: string;  // deviceActivationStatus
  param14: string;  // gnssConstellationCode
  param15: string;  // ownername
  param16: string;  // engineNo
}

interface VahanComparisonRow {
  label: string;
  existingValue: string;
  vahanValue: string;
  status: 'MATCH' | 'MISMATCH' | 'NOT AVAILABLE';
}

interface VahanComparison {
  tabId: number;
  rows: VahanComparisonRow[];
}

interface DetailField {

 label: string;

 value: string;

 status?: boolean;

}

interface DetailCard {

 title: string;

 fields: DetailField[];

 message?: string;

}

@Component({

 selector: "app-univarsal-page",

 standalone: true,

 imports: [CommonModule, FormsModule,   NgbPaginationModule,NzTabsModule],

 templateUrl: "./univarsal-page.component.html",

 styleUrl: "./univarsal-page.component.scss",

})

export class UnivarsalPageComponent implements OnDestroy {

 tabs: DeviceSearchTab[] = [this.createTab(1)];

 selectedIndex = 0;

 private nextTabId = 2;

 private readonly mappedParams = new Set([

   "param2",

   "param5",

   "param6",

   "param7",

   "param8",

   "param9",

   "param10",

   "param11",

   "param14",

   "param15",

   "param16",

   "param18",

   "param20",

   "param21",

   "param22",

   "param25",

   "param26",

   "param27",

   "param28",

   "param32",

   "param34",

   "param37",

   "param38",

   "param47",

   "param48",

   "param50",

   "param51",

   "param52",

   "param53",

   "param54",

   "param60",

   "param65",

   "param67",

   "param68",

   "param77",

 ]);

 constructor(
    private readonly operationService: OperationService,
    private readonly deviceService: DeviceService,
    private readonly vahanService: VahanService,
    public toast: ToastService
    
  ) {}

 private createTab(id: number): DeviceSearchTab {

   return {

     id,

     title: "New Search",

     searchType: "imei",

     searchInput: "",

     loading: false,

     hasSearched: false,

     screen: "search",

     error: "",

     details: null,

     requestId: 0,

     request: null,

   };

 }

 newTab(): void {

this.tabs.push(this.createTab(this.nextTabId++));

this.selectedIndex = this.tabs.length - 1;

 }

 onVtsAction(action: string, tabId: number): void {

   console.log("[VTS Action Click]", {

     action,

     tabId,

     timestamp: new Date().toISOString(),

   });

 }

 closeTab(event: { index: number }): void {

   const index = event.index;

   if (index < 0 || index >= this.tabs.length) {

     return;

   }

this.tabs[index].request?.unsubscribe();

this.tabs.splice(index, 1);

   if (this.tabs.length === 0) {

this.selectedIndex = 0;

   } else if (this.selectedIndex > index) {

this.selectedIndex--;

   } else if (this.selectedIndex >= this.tabs.length) {

this.selectedIndex = this.tabs.length - 1;

   }

 }

 simUpdateMode: "manual" | "auto" = "manual";

 newSimValidity = "";

 onDetailsCardClick(action: string): void {

   console.log("[VTS Dummy Action]", {

     action,

     simUpdateMode: this.simUpdateMode,

     newSimValidity: this.newSimValidity,

     timestamp: new Date().toISOString(),

   });

 }

 search(tabId: number): void {

   const tab = this.findTab(tabId);

   if (!tab || tab.loading) {

     return;

   }

   const input = tab.searchInput.trim();

   tab.error = "";

   if (tab.searchType !== "imei") {

     tab.error = `${this.getSearchTypeLabel(tab.searchType)} search is not supported by the current device API. Search by IMEI instead.`;
     this.toast.show(tab.error, "error");
     return;

   }

   if (!/^\d{15}$/.test(input)) {

     tab.error = "Enter a valid 15-digit IMEI number.";
     this.toast.show(tab.error, "error");
     return;

   }

   tab.searchInput = input;

   tab.details = null;

   tab.screen = "search";

   tab.hasSearched = true;

this.loadDevice(tab, false);

 }

 refresh(tabId: number): void {

   const tab = this.findTab(tabId);

   if (!tab || !tab.details || tab.loading) {

     return;

   }

   tab.error = "";

this.loadDevice(tab, true);

 }

 backToSearch(tabId: number): void {

   const tab = this.findTab(tabId);

   if (tab) {

     tab.screen = "search";

     tab.error = "";

   }

 }

 clear(tabId: number): void {

   const tab = this.findTab(tabId);

   if (!tab) {

     return;

   }

   tab.request?.unsubscribe();

   tab.request = null;

   tab.requestId++;

   tab.searchInput = "";

   tab.searchType = "imei";

   tab.title = "New Search";

   tab.loading = false;

   tab.hasSearched = false;

   tab.screen = "search";

   tab.error = "";

   tab.details = null;

 }

 getDetailCards(tab: DeviceSearchTab): DetailCard[] {

   const device = tab.details;

   if (!device) {

     return [];

   }

   const field = (

     label: string,

     key: string,

     status = false,

   ): DetailField => ({

     label,

     value: this.displayValue(device[key]),

     status,

   });

   const isUnassigned = this.isNotAssigned(device);

   const deviceFields = [

     field("Device ID", "param2"),

     field("IMEI Number", "param5"),

     field("Serial Number", "param6"),

     field("ICCID Number", "param7"),

     field("Device Manufacturer", "param15"),

     field("Model Code", "param18"),

     field("Device Mode", "param32"),

     field("Activation Status", "param34", true),

     field("Device Status", "param26", true),

     field("Polling Status", "param48", true),

     field("Polling Time", "param60"),

     field("Certificate Validity", "param77"),

   ];

this.getAdditionalFields(device).forEach((extra) =>

     deviceFields.push(extra),

   );

   return [

     {

       title: "Device",

       fields: deviceFields,

     },

     {

       title: "SIM",

       fields: [

         field("SIM 1 Number", "param8"),

         field("SIM 1 Network", "param10"),

         field("SIM 1 Validity", "param50"),

         field("SIM 1 IMSI", "param67"),

         field("SIM 2 Number", "param9"),

         field("SIM 2 Network", "param11"),

         field("SIM 2 Validity", "param51"),

         field("SIM 2 IMSI", "param68"),

         field("eSIM / M2M Provider", "param14"),

       ],

     },

     {

       title: "Owner",

       fields: [

         field("Customer / Owner Name", "param37"),

         field("Mobile Number", "param38"),

         field("Dealer Name", "param16"),

         field("Manufacturer / Vendor", "param15"),

         field("Assignment Date", "param54"),

         field("RTO", "param27"),

       ],

     },

     {

       title: "Vehicle",

       fields: isUnassigned

         ? [field("Vehicle Assignment Status", "param47", true)]

         : [

             field("Vehicle Assignment Status", "param47", true),

             field("Vehicle Type", "param28"),

             field("Vehicle Registration Number", "param20"),

             field("Chassis Number", "param21"),

             field("Engine Number", "param22"),

             field("Vehicle Make", "param52"),

             field("Vehicle Model", "param53"),

             field("Vehicle Class", "param65"),

             field("Manufacturing Year", "param25"),

           ],

       message: isUnassigned

         ? "This device has not been assigned to a vehicle."

         : undefined,

     },

   ];

 }

 getAdditionalFields(device: Device): DetailField[] {

   if (!device) {

     return [];

   }

   return Object.entries(device)

     .filter(([key]) => !this.mappedParams.has(key))

     .map(([key, value]) => ({ label: key, value: this.displayValue(value) }));

 }

 isPositiveStatus(value: string): boolean {

   return (

     !this.isNegativeStatus(value) &&

     /active|assigned|connected|received|valid|enabled|success|online/i.test(

       value,

     )

   );

 }

 isNegativeStatus(value: string): boolean {

   return /inactive|disconnected|not received|invalid|disabled|failed|offline|pending|not assigned|unassigned/i.test(

     value,

   );

 }

 getSearchTypeLabel(searchType: SearchType): string {

   switch (searchType) {

     case "serial":

       return "Serial number";

     case "iccid":

       return "ICCID";

     default:

       return "IMEI";

   }

 }

 getSearchPlaceholder(searchType: SearchType): string {

   switch (searchType) {

     case "serial":

       return "Enter serial number";

     case "iccid":

       return "Enter ICCID number";

     default:

       return "Enter 15-digit IMEI";

   }

 }

 getTitleTooltip(tab: DeviceSearchTab): string {

   return tab.loading ? `${tab.title} (loading)` : tab.title;

 }

 ngOnDestroy(): void {

this.tabs.forEach((tab) => tab.request?.unsubscribe());

 }

 private loadDevice(tab: DeviceSearchTab, keepDetails: boolean): void {

   tab.request?.unsubscribe();

   const requestId = ++tab.requestId;

   const requestedInput = tab.searchInput;

   tab.loading = true;

   const request = {

     param1: requestedInput,

     param2: "1",

     param3: "20",

     param8: "",

     param9: "",

     param10: "",

     param11: "",

   };

   tab.request = this.deviceService

     .getDeviceMasterDetails(request, false)

     .subscribe({

       next: (response) => {

         if (!this.isCurrentRequest(tab, requestId)) {

           return;

         }

         tab.loading = false;

         tab.request = null;

         const records = response?.entity?.listData ?? [];

         const matchingDevice = records.find(

           (device) => device.param5?.trim() === requestedInput,

         );

         if (!response?.status || !matchingDevice) {

           if (!keepDetails) {

             tab.details = null;

             tab.screen = "search";

           }

           const fallback = !response?.status

             ? "The device lookup request was not successful."

             : records.length > 0

               ? "No exact IMEI match was returned."

               : "No device was found for this IMEI.";

           tab.error = this.getResponseError(response, fallback);
           this.toast.show(tab.error, "error");
           return;

         }

         tab.details = matchingDevice;

         tab.title = this.getTabTitle(tab.searchType, requestedInput);

         tab.screen = "details";
         tab.error = "";
         this.toast.show("Device details loaded successfully.", "success");

       },

       error: (error) => {

         if (!this.isCurrentRequest(tab, requestId)) {

           return;

         }

         tab.loading = false;

         tab.request = null;

         if (!keepDetails) {

           tab.details = null;

           tab.screen = "search";

         }

         tab.error =

           error?.error?.message ||

           error?.message ||

           "Unable to load device details. Please try again.";
         this.toast.show(tab.error, "error");
       },

     });

 }

 private findTab(tabId: number): DeviceSearchTab | undefined {

   return this.tabs.find((tab) => tab.id === tabId);

 }

 private isCurrentRequest(tab: DeviceSearchTab, requestId: number): boolean {

   return this.tabs.includes(tab) && tab.requestId === requestId;

 }

 private getResponseError(

   response:

     | { message?: string; entity?: DeviceListResponse }

     | null

     | undefined,

   fallback: string,

 ): string {

   const entity = response?.entity as unknown;

   return (

     response?.message ||

     (typeof entity === "string" ? entity : "") ||

     fallback

   );

 }

 private displayValue(value: unknown): string {

   if (value === null || value === undefined || String(value).trim() === "") {

     return "NA";

   }

   return typeof value === "object" ? JSON.stringify(value) : String(value);

 }

 private isNotAssigned(device: Device): boolean {

   const assignment = String(device["param47"] || "")

     .trim()

     .toLowerCase();

   return (

     assignment === "not assigned" ||

     assignment === "notassigned" ||

     assignment === "unassigned"

   );

 }

 private getTabTitle(searchType: SearchType, input: string): string {

   const prefix =

     searchType === "serial"

       ? "SN"

       : searchType === "iccid"

         ? "ICCID"

         : "IMEI";

   return ` ${input}`;

 }

vahanComparison: VahanComparison | null = null;

get vahanMatchCount(): number {
  return this.vahanComparison?.rows.filter(
    row => row.status === 'MATCH'
  ).length ?? 0;
}

get vahanMismatchCount(): number {
  return this.vahanComparison?.rows.filter(
    row => row.status === 'MISMATCH'
  ).length ?? 0;
}

get vahanUnavailableCount(): number {
  return this.vahanComparison?.rows.filter(
    row => row.status === 'NOT AVAILABLE'
  ).length ?? 0;
}

openVahanComparison(tabId: number): void {
  const tab = this.tabs.find(item => item.id === tabId);

  if (!tab?.details) {
    this.toast.show('Please load device details first.', 'error');
    return;
  }

  const deviceSerialNo = String(tab.details['param6'] ?? '').trim();

  if (!deviceSerialNo || deviceSerialNo === 'NA') {
    this.toast.show('Device serial number is not available.', 'error');
    return;
  }

  this.vahanService.getVahanPullRequest(deviceSerialNo).subscribe({
    next: (response) => {
      const vahanData = response?.entity?.listData?.[0];

      if (!response?.status || !vahanData) {
        this.toast.show(
          response?.message || 'No Vahan data found.',
          'error'
        );
        return;
      }

      this.compareVahanData(tabId, vahanData as VahanRecord);
    },

    error: (error) => {
      this.toast.show(
        error?.error?.message ||
        error?.message ||
        'Unable to fetch Vahan data.',
        'error'
      );
    }
  });
}

compareVahanData(tabId: number, vahan: VahanRecord): void {
  const tab = this.tabs.find(item => item.id === tabId);

  if (!tab?.details || !vahan) {
    this.toast.show('Existing or Vahan data is missing.', 'error');
    return;
  }

  const existing = tab.details;

  const getExisting = (key: string): string =>
    this.displayValue(existing[key]);

  const getVahan = (key: keyof VahanRecord): string =>
    this.displayValue(vahan[key]);

  const fields: {
    label: string;
    existing: string;
    vahan: string;
  }[] = [
    {
      label: 'Chassis Number',
      existing: getExisting('param21'),
      vahan: getVahan('param1')
    },
        {
      label: 'Registration Number',
      existing: getExisting('param20'),
      vahan: getVahan('param10')
    },
     {
      label: 'Engine Number',
      existing: getExisting('param22'),
      vahan: getVahan('param16')
    },
    {
      label: 'Device Serial Number',
      existing: getExisting('param6'),
      vahan: getVahan('param2')
    },
    {
      label: 'Manufacturer',
      existing: getExisting('param15'),
      vahan: getVahan('param3')
    },
    {
      label: 'ICCID Number',
      existing: getExisting('param7'),
      vahan: getVahan('param4')
    },
    {
      label: 'IMEI Number',
      existing: getExisting('param5'),
      vahan: getVahan('param5')
    },
    {
      label: 'Vehicle Make',
      existing: getExisting('param15'),
      vahan: getVahan('param6')
    },
    {
      label: 'Vehicle Model',
      existing: getExisting('param18'),
      vahan: getVahan('param7')
    },
   
   

    {
      label: 'Vehicle Class',
      existing: getExisting('param65'),
      vahan: getVahan('param11')
    },
    {
      label: 'Mfg Year',
      existing: getExisting('param25'),
     vahan: getVahan('param12').split('-')[0]
    },
    {
      label: 'Device Activation Status',
      existing: getExisting('param34'),
      vahan: getVahan('param13')
    },
   
    {
      label: 'Owner Name',
      existing: getExisting('param37'),
      vahan: getVahan('param15')
    },
   
  ];

  const rows: VahanComparisonRow[] = fields.map(field => {
    const left = this.normalizeComparisonValue(field.existing);
    const right = this.normalizeComparisonValue(field.vahan);

    let status: VahanComparisonRow['status'];

    if (!left || !right) {
      status = 'NOT AVAILABLE';
    } else {
      status = left === right ? 'MATCH' : 'MISMATCH';
    }

    return {
      label: field.label,
      existingValue: field.existing,
      vahanValue: field.vahan,
      status
    };
  });

  this.vahanComparison = { tabId, rows };

  this.toast.show('Vahan comparison completed successfully.', 'success');
}

private normalizeComparisonValue(value: string): string {
  if (!value || value.trim().toUpperCase() === 'NA') {
    return '';
  }

  return value.trim().replace(/\s+/g, ' ').toUpperCase();
}

closeVahanComparison(): void {
  this.vahanComparison = null;
}
// Raw Details screen
showRawDetails = false;
rawDetailsImei = '';

// Raw Data filters
rawSearchText = '';
rawVendor = '';
rawSelectedDate = this.getTodayDate();
rawDataType = 'total';
rawPacketType = 'LOGIN';

// Raw Data pagination and API state
rawPageSize = 25;
rawCurrentPage = 1;
rawTotalCount = 0;
rawLoading = false;
rawError = '';

rawRows: RawDataRowModel[] = [];


rawPacketTabs = [
  { label: 'LOGIN', value: 'LOGIN' },
  { label: 'HEALTH', value: 'HEALTH' },
  { label: 'PVT', value: 'PVT' },
  { label: 'PANIC', value: 'PANIC' },
  { label: 'ALERT', value: 'ALERT' },
  { label: 'UNKNOWN', value: 'UNKNOWN' }
];

private rawDataRequest: Subscription | null = null;

get rawTotalPages(): number {
  return Math.ceil(this.rawTotalCount / this.rawPageSize);
}

private getTodayDate(): string {
  const date = new Date();

  return [
    String(date.getDate()).padStart(2, '0'),
    date.toLocaleString('en-US', { month: 'short' }),
    date.getFullYear()
  ].join('-');
}

private formatRawDate(dateValue: string): string {
  if (!dateValue) {
    return '';
  }

  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return [
    String(date.getDate()).padStart(2, '0'),
    date.toLocaleString('en-US', { month: 'short' }),
    date.getFullYear()
  ].join('-');
}
openRawDetails(tabId: number): void {
  const tab = this.tabs.find(item => item.id === tabId);

  if (!tab?.details) {
    this.toast.show('Please search a device first.', 'error');
    return;
  }

  this.rawDetailsImei = String(tab.details['param5'] ?? '').trim();

  if (!this.rawDetailsImei) {
    this.toast.show('IMEI number is not available.', 'error');
    return;
  }

  this.showRawDetails = true;
  this.rawPageSize = 25;
  this.rawCurrentPage = 1;
  this.rawPacketType = 'LOGIN';
  this.rawSelectedDate = this.getTodayDate();

  this.loadRawData();
}

backToUniversalPage(): void {
  this.showRawDetails = false;
  this.rawDataRequest?.unsubscribe();
  this.rawLoading = false;
}

loadRawData(): void {
  if (!this.rawDetailsImei.trim()) {
    this.toast.show('IMEI number is required.', 'error');
    return;
  }

  this.rawDataRequest?.unsubscribe();

  this.rawLoading = true;
  this.rawError = '';

  const request: RawDataRequestModel = {
    param1: this.rawSearchText.trim(),
    param2: String(this.rawCurrentPage),
    param3: String(this.rawPageSize),
    param4: this.rawVendor,
    param5: this.rawDetailsImei.trim(),
    param6: this.formatRawDate(this.rawSelectedDate),
    param7: this.rawDataType,
    param8: this.rawPacketType
  };

  this.rawDataRequest = this.operationService
    .getNewRawData(request)
    .pipe(finalize(() => {
      this.rawLoading = false;
    }))
    .subscribe({
      next: (response: any) => {
        if (Number(response?.statuscode) !== 200) {
          this.rawRows = [];
          this.rawTotalCount = 0;
          this.rawError = response?.message || 'Unable to fetch raw data.';
          return;
        }

        const entity = response?.entity;

        this.rawRows = (entity?.listData ?? []) as RawDataRowModel[];
        this.rawTotalCount = Number(entity?.param1 ?? 0);

        if (!this.rawRows.length) {
          this.rawError = 'No raw data found for the selected filters.';
        }
      },
      error: (error: any) => {
        this.rawRows = [];
        this.rawTotalCount = 0;
        this.rawError =
          error?.error?.message ||
          error?.message ||
          'Failed to fetch raw data.';
      }
    });
}

selectRawPacket(packetType: string): void {
  this.rawPacketType = packetType;
  this.rawCurrentPage = 1;
  this.loadRawData();
}

searchRawData(): void {
  this.rawCurrentPage = 1;
  this.loadRawData();
}

changeRawPage(page: number): void {
  if (page < 1 || page > this.rawTotalPages) {
    return;
  }

  this.rawCurrentPage = page;
  this.loadRawData();
}

clearRawFilters(): void {
  this.rawSearchText = '';
  this.rawSelectedDate = this.getTodayDate();
  this.rawDataType = 'total';
  this.rawPacketType = 'LOGIN';
  this.rawCurrentPage = 1;

  this.loadRawData();
}

}