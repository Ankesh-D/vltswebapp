import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OperationService } from '../../../core/services/operation.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { DeviceService } from '../../../core/services/device.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import localeData from 'dayjs/plugin/localeData';
import isoWeek from 'dayjs/plugin/isoWeek';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { NgSelectModule } from '@ng-select/ng-select';
import { ToastService } from '../../../core/services/toast.service';
dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.extend(localizedFormat);
dayjs.extend(localeData);
dayjs.extend(isoWeek);
dayjs.extend(weekOfYear);

declare var $: any;

@Component({
    selector: 'app-raw-data',
    imports: [CommonModule, FormsModule, NgxDaterangepickerMd, NgSelectModule],
    templateUrl: './raw-data.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./raw-data.component.scss']
})
export class RawDataComponent implements OnInit, AfterViewInit {
  selectedRange: any = {
    startDate: dayjs(),
    endDate: dayjs()
  };
  selectedVendor: string = '';
  selectedDevice: any = null;

  companyList: any[] = [];
  deviceList: any[] = [];

  rawData: any[] = [];
  loading = false;

  searchText: string = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [20, 50, 100, 200, 500];
  totalCount = 0;
  pageCount = 0;

  sortKey: string = '';
  reverse: boolean = false;

  vendorId: string = '';
  showVendorList: boolean = true;
  roleid: any = "";
  errorMessage: string | null = null;
  searchFlag: boolean = false;
  constructor(
    private router: Router,
    private operationService: OperationService,
    private dashboardService: DashboardService,
    private deviceService: DeviceService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef,
    public toast: ToastService
  ) {
    this.roleid = sessionStorage.getItem('roleid');
  }

  ngOnInit() {
    // this.initializeDatePickers();
    this.loadCompanyList();
    this.checkTask();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      // this.initializeDatePickers();
      if (typeof $ !== 'undefined' && $.fn.select2) {
        $('.searchable').select2();
      }
    }, 200);
  }

  checkTask() {
    // 'task' value session storage se ya jahan se bhi aap store kar rahe hain wahan se lein

    // //console.log('Current Role ID:', this.roleid); // Debugging: Check console for actual value

    // Safe check: null check karein aur whitespace trim karein
    if (this.roleid && this.roleid.toString().trim() === "11") {

      this.showVendorList = false;
      this.selectedVendor = "";
      this.loadDeviceRosterForTask11();
    } else {
      this.showVendorList = true;
    }
  }

  loadDeviceRosterForTask11() {
    this.loading = true;
    // API call with empty vendorId and roleId as per your requirement
    this.deviceService.getRawDataDeviceRoster('', '').subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.deviceList = response.entity;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading device list for task 11:', error);
        this.cdr.detectChanges();
      }
    });
  }

  loadCompanyList() {
    this.loading = true;
    this.dashboardService.getVendorList().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.companyList = response.entity;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        let msg = error;
        this.errorMessage = msg;
        this.toast.show(msg, 'error');
        console.error('Error loading company list:', error);
        this.cdr.detectChanges();
      }
    });
  }

  onVendorChange() {
    this.deviceList = [];
    this.selectedDevice = null;
     this.showDetailsFlag = false;
    this.loading = true;
    this.vendorId = this.selectedVendor;
    const encryptedVendorId = this.encryptionService.encryptAccountId(this.selectedVendor);
    const encryptedRoleId = this.encryptionService.encryptAccountId('11');

    this.deviceService.getRawDataDeviceRoster(encryptedVendorId, encryptedRoleId).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity && response.entity.length > 0) {
          this.deviceList = response.entity;
        } else {
          this.deviceList = [];
          this.selectedDevice = null;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        let msg = error;
        this.errorMessage = msg;
        this.toast.show(msg, 'error');
        this.cdr.detectChanges();
      }
    });
  }
  showDetailsFlag:boolean = false;
  searchRawData(pageNo: number = 1) {
    if (!this.selectedRange.startDate) {
      // alert('Select Date');
      this.toast.show('Select Date.', 'error');
      return;
    }
    if (this.roleid && this.roleid.toString().trim() !== "11") {
      if (!this.selectedVendor) {
        let msg = 'Select Vendor.';
        this.toast.show(msg, 'error');
        return;
      }
    }
    if (!this.selectedDevice) {
      //alert('Select Device No.');
      let msg = 'Select Device No.';
      this.toast.show(msg, 'error');
      return;

    }

    this.loading = true;
    this.currentPage = pageNo;

    const request = {
      param1: this.searchText.trim(),
      param2: pageNo.toString(),
      param3: this.pageSize === this.totalCount ? 'All' : this.pageSize.toString(),
      param4: this.vendorId,
      param5: this.selectedDevice,
      param6: this.selectedRange.startDate.format('DD-MMM-YYYY') 
    };
    this.toast.showLoader();
    this.operationService.getRawData(request).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.toast.hideLoader();

        this.searchFlag = false;
        if (response.statuscode == 200) {
          const entity: any = response.entity as any;
          this.showDetailsFlag = true;
          this.rawData = entity.listData;
          this.totalCount = entity.param1 || 0;
          this.pageCount = this.rawData.length < this.pageSize ? this.rawData.length : this.pageSize;
        } else {
          this.toast.show(response.entity, 'error');
          this.rawData = [];
          this.totalCount = 0;
          this.pageCount = 0;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.searchFlag = false;
        this.loading = false;
        let msg = error;
        this.errorMessage = msg;
        this.toast.show("Something went wrong.", 'error');
        this.toast.hideLoader();
      }
    });
  }

  goToEmergencyRawData() {
    this.router.navigate(['/EmergencyRawData']);
  }

  getSearchDetails() {
    this.currentPage = 1;
    this.searchRawData(1);
  }
  resetFilters() { 
    this.searchFlag = false; 
    this.selectedRange = {
      startDate: null,
      endDate: null
    };
    this.selectedVendor = '';
    this.selectedDevice = '';
    this.errorMessage = '';
    this.showDetailsFlag = false;
    setTimeout(() => {
      this.selectedRange = {
        startDate: dayjs(),
        endDate: dayjs()
      };
    })
    this.cdr.detectChanges();
  }

  reloadData() {
    this.searchText = '';
    this.currentPage = 1;
    this.searchRawData(1);
  }

  sort(key: string) {
    if (this.sortKey === key) {
      this.reverse = !this.reverse;
    } else {
      this.sortKey = key;
      this.reverse = false;
    }

    this.rawData.sort((a, b) => {
      const aVal = (a as any)[key] || '';
      const bVal = (b as any)[key] || '';

      if (this.reverse) {
        return bVal.localeCompare(aVal);
      } else {
        return aVal.localeCompare(bVal);
      }
    });
  }

  onPageChange(page: number) {
    this.searchRawData(page);
  }

  onPageSizeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newSize = target.value;
    this.pageSize = newSize === 'All' ? this.totalCount : parseInt(newSize);
    this.currentPage = 1;
    this.searchRawData(1);
  }

  getTotalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pages: number[] = [];
    const maxPages = Math.min(totalPages, 8);
    for (let i = 1; i <= maxPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  getPaginatedData(): any[] {
    return this.rawData;
  }
  

//  rawData: any[] =[
//             {
//                 "param1": "1",
//                 "param2": "4e8bce34-8d18-468c-800e-db2ac138e170",
//                 "param3": "11-Feb-2026 11:55:40 PM",
//                 "param4": "NRM86056006865493001L1110226182337022.654923N088.322398E40403110A0000051702013.03286.2013013011M0005.00AIRTEL",
//                 "param5": "106.222.243.176",
//                 "param6": "80"
//             },
//             {
//                 "param1": "2",
//                 "param2": "a55759aa-0926-45c0-9347-291b0ced4d1c",
//                 "param3": "11-Feb-2026 11:55:38 PM",
//                 "param4": "NRM86056006865493001L1110226182318022.654757N088.322604E40403110A0000051702000.00178.3013013011S0006.00AIRTEL",
//                 "param5": "106.222.243.176",
//                 "param6": "80"
//             },
//             {
//                 "param1": "3",
//                 "param2": "358f5523-1d81-410f-b91f-13afda7366e1",
//                 "param3": "11-Feb-2026 11:55:36 PM",
//                 "param4": "NRM86056006865493001L1110226182217022.654765N088.322601E40403110A0000051702000.00182.7212013011S0007.00AIRTEL",
//                 "param5": "106.222.243.176",
//                 "param6": "80"
//             },
//             {
//                 "param1": "4",
//                 "param2": "cd9ffebf-a984-4d7d-9c3a-bfa5601a9d23",
//                 "param3": "11-Feb-2026 11:51:39 PM",
//                 "param4": "NRM86056006865493001L1110226182631022.654782N088.322598E40403110A0000051702000.00000.0009013011S0007.00AIRTEL",
//                 "param5": "106.222.242.136",
//                 "param6": "80"
//             },
//             {
//                 "param1": "5",
//                 "param2": "c8808d65-f869-41b6-a3ae-faeb79ada7c4",
//                 "param3": "11-Feb-2026 11:51:29 PM",
//                 "param4": "NRM86056006865493001L1110226182455022.654823N088.322599E40403110A0000051702000.00000.0006012811S0008.00AIRTEL",
//                 "param5": "106.222.242.136",
//                 "param6": "80"
//             },
//             {
//                 "param1": "6",
//                 "param2": "239a01ac-dfb3-4003-b15c-130f481801bf",
//                 "param3": "11-Feb-2026 11:51:20 PM",
//                 "param4": "ALT86056006865493009L0110226182427022.655223N088.377126E40403110A0000051702000.00000.0000002811S0000.00AIRTEL",
//                 "param5": "106.222.242.136",
//                 "param6": "80"
//             },
//             {
//                 "param1": "7",
//                 "param2": "f50ea724-ffe5-4229-85c8-c3bc3aeed40e",
//                 "param3": "11-Feb-2026 11:24:12 PM",
//                 "param4": "NRM86056006865493001L0110226175812022.655223N088.377126E404031109B000006312000.00000.0000001811S0000.00AIRTEL",
//                 "param5": "106.222.241.166",
//                 "param6": "80"
//             },
//             {
//                 "param1": "8",
//                 "param2": "91e6d2ab-9212-4ade-9f35-c4ec25ec3dbe",
//                 "param3": "11-Feb-2026 11:24:07 PM",
//                 "param4": "NRM86056006865493001L0110226175712022.655223N088.377126E404031109B000006311000.00000.0000002411S0000.00AIRTEL",
//                 "param5": "106.222.241.166",
//                 "param6": "80"
//             },
//             {
//                 "param1": "9",
//                 "param2": "ad18c674-2bc0-4489-9d79-86d423cd5087",
//                 "param3": "11-Feb-2026 11:24:00 PM",
//                 "param4": "NRM86056006865493001L0110226175612022.655223N088.377126E404031107F000031522000.00000.0000002111S0000.00AIRTEL",
//                 "param5": "106.222.241.166",
//                 "param6": "80"
//             },
//             {
//                 "param1": "10",
//                 "param2": "cf033803-63e5-4183-bbf1-73ef4e327413",
//                 "param3": "11-Feb-2026 11:23:53 PM",
//                 "param4": "NRM86056006865493001L0110226175512022.655223N088.377126E404031107F000031522000.00000.0000003111S0000.00AIRTEL",
//                 "param5": "106.222.241.166",
//                 "param6": "80"
//             },
//             {
//                 "param1": "11",
//                 "param2": "8b044e24-c23b-4ae7-ae5b-c35969fdc3f9",
//                 "param3": "11-Feb-2026 11:23:48 PM",
//                 "param4": "NRM86056006865493001L0110226175411022.655223N088.377126E404031107F000055771000.00000.0000002711S0000.00AIRTEL",
//                 "param5": "106.222.241.166",
//                 "param6": "80"
//             },
//             {
//                 "param1": "12",
//                 "param2": "63fdc786-5540-4aaf-95db-c9c19296e12d",
//                 "param3": "11-Feb-2026 11:23:44 PM",
//                 "param4": "NRM86056006865493001L0110226175311022.655223N088.377126E404031107F000055771000.00000.0000002711S0000.00AIRTEL",
//                 "param5": "106.222.241.166",
//                 "param6": "80"
//             },
//             {
//                 "param1": "13",
//                 "param2": "3b22cd1f-5613-4ad5-8e8d-850887f2fccc",
//                 "param3": "11-Feb-2026 11:17:00 PM",
//                 "param4": "NRM86056006865493001L0110226175211022.655223N088.377126E404031107F000031643000.00000.0000002911S0000.00AIRTEL",
//                 "param5": "106.222.247.88",
//                 "param6": "80"
//             },
//             {
//                 "param1": "14",
//                 "param2": "412495dc-3aa7-4c5d-b12d-62a65fb2e4c6",
//                 "param3": "11-Feb-2026 11:16:00 PM",
//                 "param4": "NRM86056006865493001L0110226175111022.655223N088.377126E4040311098000040092000.00000.0000002211S0000.00AIRTEL",
//                 "param5": "106.222.247.88",
//                 "param6": "80"
//             },
//             {
//                 "param1": "15",
//                 "param2": "6de356c5-4571-42fb-b10a-b9abb8cf80e2",
//                 "param3": "11-Feb-2026 11:15:16 PM",
//                 "param4": "NRM86056006865493001L0110226175010022.655223N088.377126E4040311098000040092000.00000.0000002611S0000.00AIRTEL",
//                 "param5": "106.222.241.54",
//                 "param6": "80"
//             },
//             {
//                 "param1": "16",
//                 "param2": "877b2da2-0bc2-4f17-90b3-ab61f98d1fdb",
//                 "param3": "11-Feb-2026 11:15:02 PM",
//                 "param4": "NRM86056006865493001L0110226174910022.655223N088.377126E4040311098000046663000.00000.0000002411S0000.00AIRTEL",
//                 "param5": "106.222.247.80",
//                 "param6": "80"
//             },
//             {
//                 "param1": "17",
//                 "param2": "2a1e4bcf-453c-4c5e-9a73-3017ae30b5f3",
//                 "param3": "11-Feb-2026 11:14:58 PM",
//                 "param4": "NRM86056006865493001L0110226174810022.655223N088.377126E4040311098000056791000.00000.0000003111S0000.00AIRTEL",
//                 "param5": "106.222.247.80",
//                 "param6": "80"
//             },
//             {
//                 "param1": "18",
//                 "param2": "cc3e1a3b-922d-4c4d-8f32-f276a7fea8a4",
//                 "param3": "11-Feb-2026 11:14:53 PM",
//                 "param4": "NRM86056006865493001L0110226174709022.655223N088.377126E4040311098000050373000.00000.0000002611S0000.00AIRTEL",
//                 "param5": "106.222.247.80",
//                 "param6": "80"
//             },
//             {
//                 "param1": "19",
//                 "param2": "8b0dcc0e-5abf-40fa-852a-226edecb6f47",
//                 "param3": "11-Feb-2026 11:12:08 PM",
//                 "param4": "NRM86056006865493001L0110226174709022.655223N088.377126E4040311098000050373000.00000.0000002611S0000.00AIRTEL",
//                 "param5": "106.222.243.109",
//                 "param6": "80"
//             },
//             {
//                 "param1": "20",
//                 "param2": "b5afacb2-8ae0-4b49-913a-55baaa726cb8",
//                 "param3": "11-Feb-2026 11:11:56 PM",
//                 "param4": "NRM86056006865493001L0110226174609022.655223N088.377126E4040311098000025141000.00000.0000002611S0000.00AIRTEL",
//                 "param5": "106.222.243.109",
//                 "param6": "80"
//             },
//             {
//                 "param1": "21",
//                 "param2": "4b6e4d2d-0302-4304-b212-dc74970ee30d",
//                 "param3": "11-Feb-2026 11:11:52 PM",
//                 "param4": "NRM86056006865493001L0110226174509022.655223N088.377126E4040311098000062043000.00000.0000002811S0000.00AIRTEL",
//                 "param5": "106.222.243.109",
//                 "param6": "80"
//             },
//             {
//                 "param1": "22",
//                 "param2": "c2aff432-1db1-40a8-862c-da795feb1bbb",
//                 "param3": "11-Feb-2026 11:11:49 PM",
//                 "param4": "NRM86056006865493001L0110226174409022.655223N088.377126E40403110B5000020753000.00000.0000002311S0000.00AIRTEL",
//                 "param5": "106.222.243.109",
//                 "param6": "80"
//             },
//             {
//                 "param1": "23",
//                 "param2": "48a6bd7b-cb40-46b4-b487-b86d4c48c01c",
//                 "param3": "11-Feb-2026 11:08:00 PM",
//                 "param4": "NRM86056006865493001L0110226174308022.655223N088.377126E40403110B5000020753000.00000.0000003011S0000.00AIRTEL",
//                 "param5": "106.222.244.32",
//                 "param6": "80"
//             },
//             {
//                 "param1": "24",
//                 "param2": "8d11cc6c-ccad-4233-86c4-03dd8c2f5001",
//                 "param3": "11-Feb-2026 11:07:41 PM",
//                 "param4": "NRM86056006865493001L0110226174208022.655223N088.377126E40403110B5000020753000.00000.0000003011S0000.00AIRTEL",
//                 "param5": "106.222.244.32",
//                 "param6": "80"
//             },
//             {
//                 "param1": "25",
//                 "param2": "80f2b5b7-62a9-434f-8dbd-35bba68a509d",
//                 "param3": "11-Feb-2026 11:07:36 PM",
//                 "param4": "NRM86056006865493001L0110226174108022.655223N088.377126E4040310FFF000065535000.00000.0000002411S0000.00000000",
//                 "param5": "106.222.244.32",
//                 "param6": "80"
//             },
//             {
//                 "param1": "26",
//                 "param2": "3a4a1651-e9ec-412e-8228-388cc1730dd0",
//                 "param3": "11-Feb-2026 11:07:30 PM",
//                 "param4": "NRM86056006865493001L0110226174007022.655223N088.377126E4040311091000029992000.00000.0000002311S0000.00AIRTEL",
//                 "param5": "106.222.244.32",
//                 "param6": "80"
//             },
//             {
//                 "param1": "27",
//                 "param2": "e63f030a-f4b6-4fc9-ba98-9ac28e287cad",
//                 "param3": "11-Feb-2026 11:07:25 PM",
//                 "param4": "NRM86056006865493001L0110226173907022.655223N088.377126E4040311091000029992000.00000.0000002511S0000.00AIRTEL",
//                 "param5": "106.222.244.32",
//                 "param6": "80"
//             },
//             {
//                 "param1": "28",
//                 "param2": "1c2616ec-ebfa-4b5d-9238-5d9dc8f54498",
//                 "param3": "11-Feb-2026 11:03:07 PM",
//                 "param4": "NRM86056006865493001L0110226173807022.655223N088.377126E4040311091000010461000.00000.0000002811S0000.00AIRTEL",
//                 "param5": "106.222.242.4",
//                 "param6": "80"
//             },
//             {
//                 "param1": "29",
//                 "param2": "de6fbad5-97bf-41ce-ad0c-273c3ebcc479",
//                 "param3": "11-Feb-2026 11:01:58 PM",
//                 "param4": "NRM86056006865493001L0110226173706022.655223N088.377126E4040311091000010461000.00000.0000002511S0000.00AIRTEL",
//                 "param5": "106.222.242.4",
//                 "param6": "80"
//             },
//             {
//                 "param1": "30",
//                 "param2": "43c79bc2-cab1-4dd4-9537-4583b120fa70",
//                 "param3": "11-Feb-2026 11:01:08 PM",
//                 "param4": "NRM86056006865493001L0110226173606022.655223N088.377126E4040311091000033183000.00000.0000001811S0000.00AIRTEL",
//                 "param5": "106.222.242.4",
//                 "param6": "80"
//             },
//             {
//                 "param1": "31",
//                 "param2": "22945103-d742-4814-8ee7-e6182c646446",
//                 "param3": "11-Feb-2026 11:00:04 PM",
//                 "param4": "NRM86056006865493001L0110226173506022.655223N088.377126E4040311091000033183000.00000.0000003111S0000.00AIRTEL",
//                 "param5": "106.222.242.4",
//                 "param6": "80"
//             },
//             {
//                 "param1": "32",
//                 "param2": "bc72fa32-d2a3-4138-a735-1c937c0bc21a",
//                 "param3": "11-Feb-2026 10:59:06 PM",
//                 "param4": "NRM86056006865493001L0110226173405022.655223N088.377126E4040311091000026602000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.242.4",
//                 "param6": "80"
//             },
//             {
//                 "param1": "33",
//                 "param2": "27b422d0-528c-4eca-9c88-ead3099ca30f",
//                 "param3": "11-Feb-2026 10:57:57 PM",
//                 "param4": "NRM86056006865493001L0110226173305022.655223N088.377126E4040311091000026602000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.242.4",
//                 "param6": "80"
//             },
//             {
//                 "param1": "34",
//                 "param2": "07ebfd87-5fbd-41b1-973c-9b611e97e5ce",
//                 "param3": "11-Feb-2026 10:56:57 PM",
//                 "param4": "NRM86056006865493001L0110226173204022.655223N088.377126E4040311091000026602000.00000.0000002311S0000.00AIRTEL",
//                 "param5": "106.222.242.4",
//                 "param6": "80"
//             },
//             {
//                 "param1": "35",
//                 "param2": "6aa9c81a-9461-4936-9082-3aefa6b8fa25",
//                 "param3": "11-Feb-2026 10:55:57 PM",
//                 "param4": "NRM86056006865493001L0110226173104022.655223N088.377126E4040311091000060043000.00000.0000002811S0000.00AIRTEL",
//                 "param5": "106.222.242.4",
//                 "param6": "80"
//             },
//             {
//                 "param1": "36",
//                 "param2": "4da5a6f8-0e89-4a98-b811-31dafd607e6d",
//                 "param3": "11-Feb-2026 10:55:07 PM",
//                 "param4": "NRM86056006865493001L0110226173004022.655223N088.377126E4040311091000060043000.00000.0000002711S0000.00AIRTEL",
//                 "param5": "106.222.242.4",
//                 "param6": "80"
//             },
//             {
//                 "param1": "37",
//                 "param2": "10c17dcb-69a1-44cb-87c7-c4fd93a3677e",
//                 "param3": "11-Feb-2026 10:54:51 PM",
//                 "param4": "NRM86056006865493001L0110226172903022.655223N088.377126E4040311091000060043000.00000.0000003011S0000.00AIRTEL",
//                 "param5": "106.222.242.4",
//                 "param6": "80"
//             },
//             {
//                 "param1": "38",
//                 "param2": "c7431958-5ab3-4c54-a7a0-25d24b818597",
//                 "param3": "11-Feb-2026 10:54:47 PM",
//                 "param4": "NRM86056006865493001L0110226172803022.655223N088.377126E4040311091000060043000.00000.0000002811S0000.00AIRTEL",
//                 "param5": "106.222.242.4",
//                 "param6": "80"
//             },
//             {
//                 "param1": "39",
//                 "param2": "8e10a2a6-0d3f-4d44-8c2f-484382889ede",
//                 "param3": "11-Feb-2026 10:54:43 PM",
//                 "param4": "NRM86056006865493001L0110226172703022.655223N088.377126E4040311091000029971000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.242.4",
//                 "param6": "80"
//             },
//             {
//                 "param1": "40",
//                 "param2": "f06498fa-da18-4271-aad3-e9e14169e5de",
//                 "param3": "11-Feb-2026 10:50:57 PM",
//                 "param4": "NRM86056006865493001L0110226172602022.655223N088.377126E4040311091000029971000.00000.0000002111S0000.00AIRTEL",
//                 "param5": "106.222.242.4",
//                 "param6": "80"
//             },
//             {
//                 "param1": "41",
//                 "param2": "31cab362-f904-463a-94d9-6e49cfcaf48f",
//                 "param3": "11-Feb-2026 10:50:04 PM",
//                 "param4": "NRM86056006865493001L0110226172502022.655223N088.377126E4040311091000055803000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.242.4",
//                 "param6": "80"
//             },
//             {
//                 "param1": "42",
//                 "param2": "86107fb2-0780-4e59-87ca-b2b4b1a0bba8",
//                 "param3": "11-Feb-2026 10:48:57 PM",
//                 "param4": "NRM86056006865493001L0110226172401022.655223N088.377126E4040311091000031143000.00000.0000001811S0000.00AIRTEL",
//                 "param5": "106.222.242.4",
//                 "param6": "80"
//             },
//             {
//                 "param1": "43",
//                 "param2": "a50eb768-5079-4910-a703-e6f41369cccc",
//                 "param3": "11-Feb-2026 10:47:57 PM",
//                 "param4": "NRM86056006865493001L0110226172301022.655223N088.377126E4040311091000001193000.00000.0000002211S0000.00AIRTEL",
//                 "param5": "106.222.242.4",
//                 "param6": "80"
//             },
//             {
//                 "param1": "44",
//                 "param2": "92874efa-aea9-41d9-94e7-37307aec0b7c",
//                 "param3": "11-Feb-2026 10:46:59 PM",
//                 "param4": "NRM86056006865493001L0110226172200022.655223N088.377126E4040311091000038311000.00000.0000002211S0000.00AIRTEL",
//                 "param5": "106.222.242.4",
//                 "param6": "80"
//             },
//             {
//                 "param1": "45",
//                 "param2": "c9a17dfe-c9a9-437b-b2eb-300ee95ad452",
//                 "param3": "11-Feb-2026 10:46:01 PM",
//                 "param4": "NRM86056006865493001L0110226172100022.655223N088.377126E4040311091000038311000.00000.0000002411S0000.00AIRTEL",
//                 "param5": "106.222.242.4",
//                 "param6": "80"
//             },
//             {
//                 "param1": "46",
//                 "param2": "dc5cf85f-1b26-409f-b9f7-f515fd08ae56",
//                 "param3": "11-Feb-2026 10:44:58 PM",
//                 "param4": "NRM86056006865493001L0110226172000022.655223N088.377126E4040311091000038311000.00000.0000002311S0000.00AIRTEL",
//                 "param5": "106.222.242.4",
//                 "param6": "80"
//             },
//             {
//                 "param1": "47",
//                 "param2": "df024f36-95c8-444b-b26e-3640735073e3",
//                 "param3": "11-Feb-2026 10:43:57 PM",
//                 "param4": "NRM86056006865493001L0110226171859022.655223N088.377126E4040311091000059163000.00000.0000002311S0000.00AIRTEL",
//                 "param5": "106.222.244.110",
//                 "param6": "80"
//             },
//             {
//                 "param1": "48",
//                 "param2": "d1da5056-edfe-4f49-96e3-2cdc2cd9f703",
//                 "param3": "11-Feb-2026 10:42:58 PM",
//                 "param4": "NRM86056006865493001L0110226171759022.655223N088.377126E4040311091000059163000.00000.0000002311S0000.00AIRTEL",
//                 "param5": "106.222.244.110",
//                 "param6": "80"
//             },
//             {
//                 "param1": "49",
//                 "param2": "44532f19-8e11-42f0-8999-ced0da43ca61",
//                 "param3": "11-Feb-2026 10:41:58 PM",
//                 "param4": "NRM86056006865493001L0110226171658022.655223N088.377126E4040311091000059163000.00000.0000002111S0000.00AIRTEL",
//                 "param5": "106.222.244.110",
//                 "param6": "80"
//             },
//             {
//                 "param1": "50",
//                 "param2": "84e3c18a-f520-4b30-a5c0-6d37217e3473",
//                 "param3": "11-Feb-2026 10:40:59 PM",
//                 "param4": "NRM86056006865493001L0110226171558022.655223N088.377126E4040311091000059163000.00000.0000002311S0000.00AIRTEL",
//                 "param5": "106.222.244.110",
//                 "param6": "80"
//             },
//             {
//                 "param1": "51",
//                 "param2": "408aa6db-b38c-4b2b-9a1e-ccd8a98531c5",
//                 "param3": "11-Feb-2026 10:39:58 PM",
//                 "param4": "NRM86056006865493001L0110226171457022.655223N088.377126E4040311091000059163000.00000.0000002411S0000.00AIRTEL",
//                 "param5": "106.222.243.50",
//                 "param6": "80"
//             },
//             {
//                 "param1": "52",
//                 "param2": "d136f631-6b11-4a5a-a898-8b6015b6ae58",
//                 "param3": "11-Feb-2026 10:38:58 PM",
//                 "param4": "NRM86056006865493001L0110226171357022.655223N088.377126E4040311091000059163000.00000.0000002411S0000.00AIRTEL",
//                 "param5": "106.222.243.50",
//                 "param6": "80"
//             },
//             {
//                 "param1": "53",
//                 "param2": "e67a54e8-b441-4f63-b731-d26d3bfec6da",
//                 "param3": "11-Feb-2026 10:37:57 PM",
//                 "param4": "NRM86056006865493001L0110226171256022.655223N088.377126E4040311091000059163000.00000.0000002511S0000.00AIRTEL",
//                 "param5": "106.222.243.50",
//                 "param6": "80"
//             },
//             {
//                 "param1": "54",
//                 "param2": "2308b5f1-34a2-498b-b80f-f651788c9756",
//                 "param3": "11-Feb-2026 10:36:58 PM",
//                 "param4": "NRM86056006865493001L0110226171156022.655223N088.377126E4040311091000059163000.00000.0000002311S0000.00AIRTEL",
//                 "param5": "106.222.246.165",
//                 "param6": "80"
//             },
//             {
//                 "param1": "55",
//                 "param2": "7c98cbac-4b9c-4880-8fc7-e4a48e3d8b9f",
//                 "param3": "11-Feb-2026 10:35:58 PM",
//                 "param4": "NRM86056006865493001L0110226171055022.655223N088.377126E4040311091000059163000.00000.0000002511S0000.00AIRTEL",
//                 "param5": "106.222.246.165",
//                 "param6": "80"
//             },
//             {
//                 "param1": "56",
//                 "param2": "b499062e-5d69-42d2-b801-d698bced6a29",
//                 "param3": "11-Feb-2026 10:34:57 PM",
//                 "param4": "NRM86056006865493001L0110226170955022.655223N088.377126E4040311091000059163000.00000.0000002211S0000.00AIRTEL",
//                 "param5": "106.222.246.165",
//                 "param6": "80"
//             },
//             {
//                 "param1": "57",
//                 "param2": "22da86f4-c553-44d5-9aa8-bb90ffbe128f",
//                 "param3": "11-Feb-2026 10:33:57 PM",
//                 "param4": "NRM86056006865493001L0110226170854022.655223N088.377126E4040311091000059163000.00000.0000002511S0000.00AIRTEL",
//                 "param5": "106.222.246.165",
//                 "param6": "80"
//             },
//             {
//                 "param1": "58",
//                 "param2": "5ef45d8f-b60d-4653-81bd-208797009aae",
//                 "param3": "11-Feb-2026 10:32:57 PM",
//                 "param4": "NRM86056006865493001L0110226170754022.655223N088.377126E4040311091000059163000.00000.0000002411S0000.00AIRTEL",
//                 "param5": "106.222.246.116",
//                 "param6": "80"
//             },
//             {
//                 "param1": "59",
//                 "param2": "9b57e468-9273-4b6e-b494-fae821f6b565",
//                 "param3": "11-Feb-2026 10:31:57 PM",
//                 "param4": "NRM86056006865493001L0110226170654022.655223N088.377126E4040311091000059163000.00000.0000002411S0000.00AIRTEL",
//                 "param5": "106.222.246.116",
//                 "param6": "80"
//             },
//             {
//                 "param1": "60",
//                 "param2": "b7796051-4206-4912-863d-c226097acb15",
//                 "param3": "11-Feb-2026 10:30:57 PM",
//                 "param4": "NRM86056006865493001L0110226170553022.655223N088.377126E4040311091000059163000.00000.0000002611S0000.00AIRTEL",
//                 "param5": "106.222.246.116",
//                 "param6": "80"
//             },
//             {
//                 "param1": "61",
//                 "param2": "37200d31-b84e-438c-9d1b-2576826940cc",
//                 "param3": "11-Feb-2026 10:29:58 PM",
//                 "param4": "NRM86056006865493001L0110226170453022.655223N088.377126E4040311091000059163000.00000.0000002711S0000.00AIRTEL",
//                 "param5": "106.222.244.230",
//                 "param6": "80"
//             },
//             {
//                 "param1": "62",
//                 "param2": "eab18dc3-2125-4c0c-ba9f-46c6c6972aa9",
//                 "param3": "11-Feb-2026 10:28:57 PM",
//                 "param4": "NRM86056006865493001L0110226170352022.655223N088.377126E4040311091000059163000.00000.0000002711S0000.00AIRTEL",
//                 "param5": "106.222.244.230",
//                 "param6": "80"
//             },
//             {
//                 "param1": "63",
//                 "param2": "2779f657-12be-4af1-aeee-fa396a4fa1dc",
//                 "param3": "11-Feb-2026 10:27:58 PM",
//                 "param4": "NRM86056006865493001L0110226170252022.655223N088.377126E4040311091000059163000.00000.0000002611S0000.00AIRTEL",
//                 "param5": "106.222.244.230",
//                 "param6": "80"
//             },
//             {
//                 "param1": "64",
//                 "param2": "e66ad0e4-50ba-47b7-b2a9-e56f65a4feb8",
//                 "param3": "11-Feb-2026 10:26:56 PM",
//                 "param4": "NRM86056006865493001L0110226170151022.655223N088.377126E4040311091000059163000.00000.0000002511S0000.00AIRTEL",
//                 "param5": "106.222.244.230",
//                 "param6": "80"
//             },
//             {
//                 "param1": "65",
//                 "param2": "818aa2f1-abd3-4bdf-b697-732e9fc25c87",
//                 "param3": "11-Feb-2026 10:25:57 PM",
//                 "param4": "NRM86056006865493001L0110226170051022.655223N088.377126E4040311091000059163000.00000.0000002311S0000.00AIRTEL",
//                 "param5": "106.222.240.234",
//                 "param6": "80"
//             },
//             {
//                 "param1": "66",
//                 "param2": "7f9c44ad-7f45-480b-a714-15de0efe3a6e",
//                 "param3": "11-Feb-2026 10:24:58 PM",
//                 "param4": "NRM86056006865493001L0110226165950022.655223N088.377126E4040311091000059163000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.240.234",
//                 "param6": "80"
//             },
//             {
//                 "param1": "67",
//                 "param2": "00dccca1-6a15-4966-acd6-ae66f6a69e02",
//                 "param3": "11-Feb-2026 10:23:57 PM",
//                 "param4": "NRM86056006865493001L0110226165849022.655223N088.377126E404031107E000059163000.00000.0000002311S0000.00AIRTEL",
//                 "param5": "106.222.240.234",
//                 "param6": "80"
//             },
//             {
//                 "param1": "68",
//                 "param2": "312e6cb3-dafc-4502-9cf2-05be20d97be4",
//                 "param3": "11-Feb-2026 10:22:57 PM",
//                 "param4": "NRM86056006865493001L0110226165749022.655223N088.377126E404031107E000059163000.00000.0000002711S0000.00AIRTEL",
//                 "param5": "106.222.240.234",
//                 "param6": "80"
//             },
//             {
//                 "param1": "69",
//                 "param2": "47d66d21-bca6-4bad-b49a-6ab5a75a14ac",
//                 "param3": "11-Feb-2026 10:21:58 PM",
//                 "param4": "NRM86056006865493001L0110226165648022.655223N088.377126E404031107E000059163000.00000.0000002911S0000.00AIRTEL",
//                 "param5": "106.222.240.234",
//                 "param6": "80"
//             },
//             {
//                 "param1": "70",
//                 "param2": "50ad4bbf-ffda-4fdf-9cd0-0c44a79ce18c",
//                 "param3": "11-Feb-2026 10:20:57 PM",
//                 "param4": "NRM86056006865493001L0110226165548022.655223N088.377126E404031107E000059163000.00000.0000002911S0000.00AIRTEL",
//                 "param5": "106.222.240.234",
//                 "param6": "80"
//             },
//             {
//                 "param1": "71",
//                 "param2": "32d51870-d490-4931-85b5-9c76d7889711",
//                 "param3": "11-Feb-2026 10:19:57 PM",
//                 "param4": "NRM86056006865493001L0110226165447022.655223N088.377126E404031107E000059163000.00000.0000002411S0000.00AIRTEL",
//                 "param5": "106.222.240.234",
//                 "param6": "80"
//             },
//             {
//                 "param1": "72",
//                 "param2": "0535a8e8-cb2a-4c0a-91ba-d713528c9477",
//                 "param3": "11-Feb-2026 10:18:57 PM",
//                 "param4": "NRM86056006865493001L0110226165347022.655223N088.377126E404031107E000059163000.00000.0000002711S0000.00AIRTEL",
//                 "param5": "106.222.244.14",
//                 "param6": "80"
//             },
//             {
//                 "param1": "73",
//                 "param2": "58d11fb8-fbde-4f91-8519-f8d9b934707f",
//                 "param3": "11-Feb-2026 10:17:57 PM",
//                 "param4": "NRM86056006865493001L0110226165246022.655223N088.377126E404031107E000059163000.00000.0000002611S0000.00AIRTEL",
//                 "param5": "106.222.244.14",
//                 "param6": "80"
//             },
//             {
//                 "param1": "74",
//                 "param2": "04ebfd3b-36e0-4052-a7de-076211f65ad6",
//                 "param3": "11-Feb-2026 10:16:57 PM",
//                 "param4": "NRM86056006865493001L0110226165146022.655223N088.377126E404031107E000059163000.00000.0000002611S0000.00AIRTEL",
//                 "param5": "106.222.244.14",
//                 "param6": "80"
//             },
//             {
//                 "param1": "75",
//                 "param2": "b0881406-e991-4a66-b5e4-92eef8fba8ec",
//                 "param3": "11-Feb-2026 10:15:56 PM",
//                 "param4": "NRM86056006865493001L0110226165045022.655223N088.377126E404031107E000059163000.00000.0000002911S0000.00AIRTEL",
//                 "param5": "106.222.244.14",
//                 "param6": "80"
//             },
//             {
//                 "param1": "76",
//                 "param2": "1a2392e6-b7ac-46e6-b714-321e74aa43d0",
//                 "param3": "11-Feb-2026 10:14:56 PM",
//                 "param4": "NRM86056006865493001L0110226164945022.655223N088.377126E404031107E000059163000.00000.0000002911S0000.00AIRTEL",
//                 "param5": "106.222.244.14",
//                 "param6": "80"
//             },
//             {
//                 "param1": "77",
//                 "param2": "4316aa34-162d-4089-942b-b38d71b09b81",
//                 "param3": "11-Feb-2026 10:13:57 PM",
//                 "param4": "NRM86056006865493001L0110226164844022.655223N088.377126E404031107E000059163000.00000.0000002911S0000.00AIRTEL",
//                 "param5": "106.222.244.14",
//                 "param6": "80"
//             },
//             {
//                 "param1": "78",
//                 "param2": "51193efa-9331-4675-a338-0858e51d5404",
//                 "param3": "11-Feb-2026 10:12:57 PM",
//                 "param4": "NRM86056006865493001L0110226164743022.655223N088.377126E404031107E000059163000.00000.0000002711S0000.00AIRTEL",
//                 "param5": "106.222.244.14",
//                 "param6": "80"
//             },
//             {
//                 "param1": "79",
//                 "param2": "0cfc669e-227d-49ac-b0a9-cae78b676f9a",
//                 "param3": "11-Feb-2026 10:11:57 PM",
//                 "param4": "NRM86056006865493001L0110226164643022.655223N088.377126E404031107E000059163000.00000.0000002611S0000.00AIRTEL",
//                 "param5": "106.222.241.97",
//                 "param6": "80"
//             },
//             {
//                 "param1": "80",
//                 "param2": "1001f57a-404d-4d33-850c-014d238fb122",
//                 "param3": "11-Feb-2026 10:10:57 PM",
//                 "param4": "NRM86056006865493001L0110226164542022.655223N088.377126E404031107E000059163000.00000.0000002711S0000.00AIRTEL",
//                 "param5": "106.222.247.51",
//                 "param6": "80"
//             },
//             {
//                 "param1": "81",
//                 "param2": "51536717-53d3-4604-bcc2-4489a3c30240",
//                 "param3": "11-Feb-2026 10:09:58 PM",
//                 "param4": "NRM86056006865493001L0110226164442022.655223N088.377126E404031107E000059163000.00000.0000002611S0000.00AIRTEL",
//                 "param5": "106.222.247.51",
//                 "param6": "80"
//             },
//             {
//                 "param1": "82",
//                 "param2": "3496e6b7-a151-4544-af48-19e010f112d4",
//                 "param3": "11-Feb-2026 10:08:57 PM",
//                 "param4": "NRM86056006865493001L0110226164341022.655223N088.377126E404031107E000020763000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.245.74",
//                 "param6": "80"
//             },
//             {
//                 "param1": "83",
//                 "param2": "9a9a0c1f-770c-4eec-84c9-a19086a5c785",
//                 "param3": "11-Feb-2026 10:07:57 PM",
//                 "param4": "NRM86056006865493001L0110226164240022.655223N088.377126E404031107E000020763000.00000.0000002211S0000.00AIRTEL",
//                 "param5": "106.222.245.74",
//                 "param6": "80"
//             },
//             {
//                 "param1": "84",
//                 "param2": "44c272d9-60b3-419b-93e8-ddc01413e9c4",
//                 "param3": "11-Feb-2026 10:06:59 PM",
//                 "param4": "NRM86056006865493001L0110226164140022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.245.74",
//                 "param6": "80"
//             },
//             {
//                 "param1": "85",
//                 "param2": "9bd58883-2640-43de-b380-d89377f7d94a",
//                 "param3": "11-Feb-2026 10:05:57 PM",
//                 "param4": "NRM86056006865493001L0110226164039022.655223N088.377126E404031107E000020763000.00000.0000001711S0000.00AIRTEL",
//                 "param5": "106.222.242.191",
//                 "param6": "80"
//             },
//             {
//                 "param1": "86",
//                 "param2": "3a43efb6-121c-4d1e-9003-5b704e0a3b4e",
//                 "param3": "11-Feb-2026 10:04:59 PM",
//                 "param4": "NRM86056006865493001L0110226163939022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.242.107",
//                 "param6": "80"
//             },
//             {
//                 "param1": "87",
//                 "param2": "99c9fc13-dda3-454f-9cf0-442d1562f416",
//                 "param3": "11-Feb-2026 10:03:58 PM",
//                 "param4": "NRM86056006865493001L0110226163838022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.242.107",
//                 "param6": "80"
//             },
//             {
//                 "param1": "88",
//                 "param2": "7d443aa1-8404-4f25-abb4-387f30beb936",
//                 "param3": "11-Feb-2026 10:02:58 PM",
//                 "param4": "NRM86056006865493001L0110226163737022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.242.107",
//                 "param6": "80"
//             },
//             {
//                 "param1": "89",
//                 "param2": "b94a6501-6521-40b0-9300-30eb7f6afa4f",
//                 "param3": "11-Feb-2026 10:01:58 PM",
//                 "param4": "NRM86056006865493001L0110226163637022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.241.190",
//                 "param6": "80"
//             },
//             {
//                 "param1": "90",
//                 "param2": "3b8761c4-3f99-4da5-b43c-e957bbf8959c",
//                 "param3": "11-Feb-2026 10:01:03 PM",
//                 "param4": "NRM86056006865493001L0110226163536022.655223N088.377126E404031107E000020763000.00000.0000001811S0000.00AIRTEL",
//                 "param5": "106.222.241.190",
//                 "param6": "80"
//             },
//             {
//                 "param1": "91",
//                 "param2": "1dc392a5-2d65-441c-9a06-96337468267f",
//                 "param3": "11-Feb-2026 09:59:59 PM",
//                 "param4": "NRM86056006865493001L0110226163435022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.241.190",
//                 "param6": "80"
//             },
//             {
//                 "param1": "92",
//                 "param2": "a00df7f7-b659-4303-9551-0db504531cb4",
//                 "param3": "11-Feb-2026 09:58:58 PM",
//                 "param4": "NRM86056006865493001L0110226163335022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.241.190",
//                 "param6": "80"
//             },
//             {
//                 "param1": "93",
//                 "param2": "46d0571f-05f5-4a82-81dc-66cc68b256d6",
//                 "param3": "11-Feb-2026 09:57:58 PM",
//                 "param4": "NRM86056006865493001L0110226163234022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.241.190",
//                 "param6": "80"
//             },
//             {
//                 "param1": "94",
//                 "param2": "4eb2dbf6-d422-458f-8f5d-db772e8a5426",
//                 "param3": "11-Feb-2026 09:57:03 PM",
//                 "param4": "NRM86056006865493001L0110226163133022.655223N088.377126E404031107E000020763000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.241.190",
//                 "param6": "80"
//             },
//             {
//                 "param1": "95",
//                 "param2": "3783371d-4e65-4d53-9f4a-45b4d3c72c56",
//                 "param3": "11-Feb-2026 09:55:58 PM",
//                 "param4": "NRM86056006865493001L0110226163033022.655223N088.377126E4040311091000006323000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.241.190",
//                 "param6": "80"
//             },
//             {
//                 "param1": "96",
//                 "param2": "74bff8ad-6bab-4b51-a9fe-22cfd689367c",
//                 "param3": "11-Feb-2026 09:54:58 PM",
//                 "param4": "NRM86056006865493001L0110226162932022.655223N088.377126E4040311091000006323000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.241.190",
//                 "param6": "80"
//             },
//             {
//                 "param1": "97",
//                 "param2": "2c048663-d18d-4c8d-ab44-7207114a317d",
//                 "param3": "11-Feb-2026 09:53:57 PM",
//                 "param4": "NRM86056006865493001L0110226162831022.655223N088.377126E4040311091000006323000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.241.190",
//                 "param6": "80"
//             },
//             {
//                 "param1": "98",
//                 "param2": "5b85bda2-46fd-4b80-965a-5f280f95d661",
//                 "param3": "11-Feb-2026 09:52:57 PM",
//                 "param4": "NRM86056006865493001L0110226162731022.655223N088.377126E404031107E000006323000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.241.190",
//                 "param6": "80"
//             },
//             {
//                 "param1": "99",
//                 "param2": "b8741a4c-e54d-4599-ad5e-6f153e22c10c",
//                 "param3": "11-Feb-2026 09:52:06 PM",
//                 "param4": "NRM86056006865493001L0110226162630022.655223N088.377126E404031107E000020763000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.241.190",
//                 "param6": "80"
//             },
//             {
//                 "param1": "100",
//                 "param2": "8fc6dcc0-fbf8-4d1c-b003-833bf3f37a7e",
//                 "param3": "11-Feb-2026 09:50:58 PM",
//                 "param4": "NRM86056006865493001L0110226162530022.655223N088.377126E404031107E000001312000.00000.0000001311S0000.00AIRTEL",
//                 "param5": "106.222.241.190",
//                 "param6": "80"
//             },
//             {
//                 "param1": "101",
//                 "param2": "94162a7a-7d74-4dec-8d34-49681d206163",
//                 "param3": "11-Feb-2026 09:49:57 PM",
//                 "param4": "NRM86056006865493001L0110226162429022.655223N088.377126E404031107E000020763000.00000.0000001711S0000.00AIRTEL",
//                 "param5": "106.222.241.190",
//                 "param6": "80"
//             },
//             {
//                 "param1": "102",
//                 "param2": "332f8350-a739-48db-911c-fbdbf5a4aac0",
//                 "param3": "11-Feb-2026 09:49:05 PM",
//                 "param4": "NRM86056006865493001L0110226162328022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.241.190",
//                 "param6": "80"
//             },
//             {
//                 "param1": "103",
//                 "param2": "7484ee66-db04-434b-bbfd-9deebd821f3f",
//                 "param3": "11-Feb-2026 09:47:57 PM",
//                 "param4": "NRM86056006865493001L0110226162228022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.243.254",
//                 "param6": "80"
//             },
//             {
//                 "param1": "104",
//                 "param2": "1c11f429-13b0-493c-88ef-69c38f7f959a",
//                 "param3": "11-Feb-2026 09:46:58 PM",
//                 "param4": "NRM86056006865493001L0110226162127022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.243.254",
//                 "param6": "80"
//             },
//             {
//                 "param1": "105",
//                 "param2": "44adf1dd-1881-42d0-ad5c-34fe016a54eb",
//                 "param3": "11-Feb-2026 09:46:40 PM",
//                 "param4": "NRM86056006865493001L0110226162026022.655223N088.377126E404031107E000020763000.00000.0000001811S0000.00AIRTEL",
//                 "param5": "106.222.243.254",
//                 "param6": "80"
//             },
//             {
//                 "param1": "106",
//                 "param2": "e90d1797-df69-40ab-a71c-539a08440da4",
//                 "param3": "11-Feb-2026 09:46:32 PM",
//                 "param4": "NRM86056006865493001L0110226161926022.655223N088.377126E4040310FFF000065535000.00000.0000001511S0000.00000000",
//                 "param5": "106.222.243.254",
//                 "param6": "80"
//             },
//             {
//                 "param1": "107",
//                 "param2": "7a1c300d-1cf8-4d09-ba4b-be5005ee9f47",
//                 "param3": "11-Feb-2026 09:46:29 PM",
//                 "param4": "NRM86056006865493001L0110226161825022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.243.254",
//                 "param6": "80"
//             },
//             {
//                 "param1": "108",
//                 "param2": "b9c6a8f7-3776-4b75-90ea-d6b64cf23690",
//                 "param3": "11-Feb-2026 09:46:24 PM",
//                 "param4": "NRM86056006865493001L0110226161724022.655223N088.377126E404031107E000020763000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.243.254",
//                 "param6": "80"
//             },
//             {
//                 "param1": "109",
//                 "param2": "c79581dd-9dda-4f01-bc2b-4030bc9a478c",
//                 "param3": "11-Feb-2026 09:46:19 PM",
//                 "param4": "NRM86056006865493001L0110226161623022.655223N088.377126E404031107E000020763000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.243.254",
//                 "param6": "80"
//             },
//             {
//                 "param1": "110",
//                 "param2": "986aab7a-c08c-4d04-95ac-e62db5c47a66",
//                 "param3": "11-Feb-2026 09:42:52 PM",
//                 "param4": "NRM86056006865493001L0110226161523022.655223N088.377126E404031107E000020763000.00000.0000001711S0000.00AIRTEL",
//                 "param5": "106.222.240.102",
//                 "param6": "80"
//             },
//             {
//                 "param1": "111",
//                 "param2": "376eedd9-f57e-4394-8a29-9cb72444fbe5",
//                 "param3": "11-Feb-2026 09:42:42 PM",
//                 "param4": "NRM86056006865493001L0110226161422022.655223N088.377126E404031107E000020763000.00000.0000001711S0000.00AIRTEL",
//                 "param5": "106.222.240.102",
//                 "param6": "80"
//             },
//             {
//                 "param1": "112",
//                 "param2": "9436ebe6-a8fd-4541-9917-08ca891b53ca",
//                 "param3": "11-Feb-2026 09:42:29 PM",
//                 "param4": "NRM86056006865493001L0110226161321022.655223N088.377126E404031107E000020763000.00000.0000001711S0000.00AIRTEL",
//                 "param5": "106.222.240.102",
//                 "param6": "80"
//             },
//             {
//                 "param1": "113",
//                 "param2": "09cc8e04-4707-4028-aa58-7947052ee895",
//                 "param3": "11-Feb-2026 09:42:16 PM",
//                 "param4": "FUL86056006865493025L0110226161221022.655223N088.377126E404031107E000020763000.00000.0000002111S000TDI3.1.0700000000000000000000.0000AIRTEL12107E00004176800000000004176800000000004",
//                 "param5": "106.222.240.102",
//                 "param6": "80"
//             },
//             {
//                 "param1": "114",
//                 "param2": "fd1bdc45-3206-4caa-871e-a6b585e3eace",
//                 "param3": "11-Feb-2026 09:41:57 PM",
//                 "param4": "NRM86056006865493001L0110226161221022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.00AIRTEL",
//                 "param5": "106.222.240.102",
//                 "param6": "80"
//             },
//             {
//                 "param1": "115",
//                 "param2": "88d1b330-613b-463a-847e-44afb71207f1",
//                 "param3": "11-Feb-2026 09:41:50 PM",
//                 "param4": "NRM86056006865493001L0110226161120022.655223N088.377126E4040310FFF000065535000.00000.0000001811S0000.00000000",
//                 "param5": "106.222.240.102",
//                 "param6": "80"
//             },
//             {
//                 "param1": "116",
//                 "param2": "28d38f40-64cd-4e58-b618-1a6c97688c62",
//                 "param3": "11-Feb-2026 09:41:44 PM",
//                 "param4": "NRM86056006865493001L0110226161019022.655223N088.377126E404031107E000020763000.00000.0000001811S0000.00AIRTEL",
//                 "param5": "106.222.240.102",
//                 "param6": "80"
//             },
//             {
//                 "param1": "117",
//                 "param2": "60d7e7e5-6e57-4109-b74a-d927ae58d90c",
//                 "param3": "11-Feb-2026 09:38:33 PM",
//                 "param4": "NRM86056006865493001L0110226160919022.655223N088.377126E404031107E000020763000.00000.0000001811S0000.00AIRTEL",
//                 "param5": "106.222.247.151",
//                 "param6": "80"
//             },
//             {
//                 "param1": "118",
//                 "param2": "dc9a26d7-ed96-4e04-8793-c6032eb4712d",
//                 "param3": "11-Feb-2026 09:34:02 PM",
//                 "param4": "NRM86056006865493001L0110226160818022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.243.230",
//                 "param6": "80"
//             },
//             {
//                 "param1": "119",
//                 "param2": "0d19b4f4-9d26-481f-a977-fa81b09a681a",
//                 "param3": "11-Feb-2026 09:33:01 PM",
//                 "param4": "NRM86056006865493001L0110226160717022.655223N088.377126E404031107E000020763000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.243.230",
//                 "param6": "80"
//             },
//             {
//                 "param1": "120",
//                 "param2": "07265200-1166-421e-903a-abcdeff2d605",
//                 "param3": "11-Feb-2026 09:32:06 PM",
//                 "param4": "NRM86056006865493001L0110226160616022.655223N088.377126E404031107E000020763000.00000.0000001711S0000.00AIRTEL",
//                 "param5": "106.222.243.230",
//                 "param6": "80"
//             },
//             {
//                 "param1": "121",
//                 "param2": "617f44b8-300a-45cf-8422-46d45543ca87",
//                 "param3": "11-Feb-2026 09:30:57 PM",
//                 "param4": "NRM86056006865493001L0110226160516022.655223N088.377126E404031107E000001312000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.243.162",
//                 "param6": "80"
//             },
//             {
//                 "param1": "122",
//                 "param2": "f9d2bfc7-f50a-4f19-a057-e1c16e20d300",
//                 "param3": "11-Feb-2026 09:29:57 PM",
//                 "param4": "NRM86056006865493001L0110226160415022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.243.162",
//                 "param6": "80"
//             },
//             {
//                 "param1": "123",
//                 "param2": "c6a57ec7-a691-4c29-99aa-36ccacb91983",
//                 "param3": "11-Feb-2026 09:28:56 PM",
//                 "param4": "NRM86056006865493001L0110226160314022.655223N088.377126E404031107E000001312000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.240.55",
//                 "param6": "80"
//             },
//             {
//                 "param1": "124",
//                 "param2": "dee0f026-3b15-47c8-beee-fc12a69a65e6",
//                 "param3": "11-Feb-2026 09:28:00 PM",
//                 "param4": "NRM86056006865493001L0110226160213022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.240.55",
//                 "param6": "80"
//             },
//             {
//                 "param1": "125",
//                 "param2": "d91c8a8a-31e8-4214-8336-f9c0c3d63557",
//                 "param3": "11-Feb-2026 09:26:59 PM",
//                 "param4": "NRM86056006865493001L0110226160113022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.240.55",
//                 "param6": "80"
//             },
//             {
//                 "param1": "126",
//                 "param2": "74b0f35f-8ad0-44ed-9f2a-0c5e5fab8e81",
//                 "param3": "11-Feb-2026 09:25:59 PM",
//                 "param4": "NRM86056006865493001L0110226160012022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.240.55",
//                 "param6": "80"
//             },
//             {
//                 "param1": "127",
//                 "param2": "64df45f8-452a-4219-a6a5-8beffa766224",
//                 "param3": "11-Feb-2026 09:24:59 PM",
//                 "param4": "NRM86056006865493001L0110226155911022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.240.55",
//                 "param6": "80"
//             },
//             {
//                 "param1": "128",
//                 "param2": "5a0b4e7f-9718-4755-af36-8e93dc2edc03",
//                 "param3": "11-Feb-2026 09:23:57 PM",
//                 "param4": "NRM86056006865493001L0110226155810022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.240.55",
//                 "param6": "80"
//             },
//             {
//                 "param1": "129",
//                 "param2": "906fbc73-1db5-4a84-b187-0922213cc558",
//                 "param3": "11-Feb-2026 09:22:57 PM",
//                 "param4": "NRM86056006865493001L0110226155710022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.240.55",
//                 "param6": "80"
//             },
//             {
//                 "param1": "130",
//                 "param2": "d341ce16-e812-4b1b-98b7-95403e318368",
//                 "param3": "11-Feb-2026 09:21:58 PM",
//                 "param4": "NRM86056006865493001L0110226155609022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.240.196",
//                 "param6": "80"
//             },
//             {
//                 "param1": "131",
//                 "param2": "fe7383fc-c7a9-49ef-b76c-59f5fdda47f4",
//                 "param3": "11-Feb-2026 09:20:57 PM",
//                 "param4": "NRM86056006865493001L0110226155508022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.240.196",
//                 "param6": "80"
//             },
//             {
//                 "param1": "132",
//                 "param2": "48ce5dd2-be2a-44e9-82be-b1b89725e5ba",
//                 "param3": "11-Feb-2026 09:19:58 PM",
//                 "param4": "NRM86056006865493001L0110226155407022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.240.196",
//                 "param6": "80"
//             },
//             {
//                 "param1": "133",
//                 "param2": "777f0d30-df71-4f89-b11e-d591cb851a5a",
//                 "param3": "11-Feb-2026 09:18:57 PM",
//                 "param4": "NRM86056006865493001L0110226155306022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.245.216",
//                 "param6": "80"
//             },
//             {
//                 "param1": "134",
//                 "param2": "eed4459f-6daf-41ed-b15f-90e8f3eac2d2",
//                 "param3": "11-Feb-2026 09:17:57 PM",
//                 "param4": "NRM86056006865493001L0110226155206022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.245.216",
//                 "param6": "80"
//             },
//             {
//                 "param1": "135",
//                 "param2": "26741586-d23c-485e-a2f6-bbee9ee6d303",
//                 "param3": "11-Feb-2026 09:17:03 PM",
//                 "param4": "NRM86056006865493001L0110226155105022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.245.216",
//                 "param6": "80"
//             },
//             {
//                 "param1": "136",
//                 "param2": "9012719c-dafc-4e35-8879-ded78667f951",
//                 "param3": "11-Feb-2026 09:16:00 PM",
//                 "param4": "NRM86056006865493001L0110226155004022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.245.216",
//                 "param6": "80"
//             },
//             {
//                 "param1": "137",
//                 "param2": "a7d9daf8-9973-482d-bf13-159e017eb85f",
//                 "param3": "11-Feb-2026 09:14:59 PM",
//                 "param4": "NRM86056006865493001L0110226154903022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.246.144",
//                 "param6": "80"
//             },
//             {
//                 "param1": "138",
//                 "param2": "0f28c552-8e6a-4b1f-994d-2947db09069b",
//                 "param3": "11-Feb-2026 09:13:58 PM",
//                 "param4": "NRM86056006865493001L0110226154803022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.246.144",
//                 "param6": "80"
//             },
//             {
//                 "param1": "139",
//                 "param2": "1ed0c1d7-83a5-4ad4-963d-4d31fdbbc02f",
//                 "param3": "11-Feb-2026 09:12:59 PM",
//                 "param4": "NRM86056006865493001L0110226154702022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.246.144",
//                 "param6": "80"
//             },
//             {
//                 "param1": "140",
//                 "param2": "ed12652a-d177-4f5e-bbdf-1ce5dff9fe1a",
//                 "param3": "11-Feb-2026 09:11:57 PM",
//                 "param4": "NRM86056006865493001L0110226154601022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.246.144",
//                 "param6": "80"
//             },
//             {
//                 "param1": "141",
//                 "param2": "081e1f38-f3cb-4008-be9d-f05c8dca99cd",
//                 "param3": "11-Feb-2026 09:10:57 PM",
//                 "param4": "NRM86056006865493001L0110226154500022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.246.144",
//                 "param6": "80"
//             },
//             {
//                 "param1": "142",
//                 "param2": "e6b34dd5-1e00-46c8-ae51-6d26e0d980e7",
//                 "param3": "11-Feb-2026 09:10:01 PM",
//                 "param4": "NRM86056006865493001L0110226154359022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.246.144",
//                 "param6": "80"
//             },
//             {
//                 "param1": "143",
//                 "param2": "9a1d4ba7-2517-4d1c-95f6-190eaa55de0b",
//                 "param3": "11-Feb-2026 09:08:58 PM",
//                 "param4": "NRM86056006865493001L0110226154259022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.245.161",
//                 "param6": "80"
//             },
//             {
//                 "param1": "144",
//                 "param2": "72e5b376-37ce-45f3-b286-926d2b97c699",
//                 "param3": "11-Feb-2026 09:08:01 PM",
//                 "param4": "NRM86056006865493001L0110226154158022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.245.161",
//                 "param6": "80"
//             },
//             {
//                 "param1": "145",
//                 "param2": "fdcf684f-d684-4d4b-9803-40e78cfd894e",
//                 "param3": "11-Feb-2026 09:07:06 PM",
//                 "param4": "NRM86056006865493001L0110226154057022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.245.161",
//                 "param6": "80"
//             },
//             {
//                 "param1": "146",
//                 "param2": "400e1f83-d14e-4512-9a6a-a2e4f3d6f82c",
//                 "param3": "11-Feb-2026 09:05:57 PM",
//                 "param4": "NRM86056006865493001L0110226153956022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.245.161",
//                 "param6": "80"
//             },
//             {
//                 "param1": "147",
//                 "param2": "1624a234-8886-45ba-8048-78825b2a0649",
//                 "param3": "11-Feb-2026 09:04:59 PM",
//                 "param4": "NRM86056006865493001L0110226153856022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.244.173",
//                 "param6": "80"
//             },
//             {
//                 "param1": "148",
//                 "param2": "9adf80d3-6b4a-4023-82b3-7d0b312f6f4e",
//                 "param3": "11-Feb-2026 09:03:57 PM",
//                 "param4": "NRM86056006865493001L0110226153755022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.244.173",
//                 "param6": "80"
//             },
//             {
//                 "param1": "149",
//                 "param2": "75617986-4ad2-45d9-ad1e-fbc71b7786d3",
//                 "param3": "11-Feb-2026 09:03:04 PM",
//                 "param4": "NRM86056006865493001L0110226153654022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.244.173",
//                 "param6": "80"
//             },
//             {
//                 "param1": "150",
//                 "param2": "cd8bd95d-41ba-4ebb-9e3f-b3a5f652a6b1",
//                 "param3": "11-Feb-2026 09:01:56 PM",
//                 "param4": "NRM86056006865493001L0110226153554022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.244.173",
//                 "param6": "80"
//             },
//             {
//                 "param1": "151",
//                 "param2": "71ee3597-2848-4199-8d7a-b3ca33b837ab",
//                 "param3": "11-Feb-2026 09:00:59 PM",
//                 "param4": "NRM86056006865493001L0110226153453022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.244.173",
//                 "param6": "80"
//             },
//             {
//                 "param1": "152",
//                 "param2": "058b9140-98f0-436c-8056-add657604812",
//                 "param3": "11-Feb-2026 08:59:57 PM",
//                 "param4": "NRM86056006865493001L0110226153352022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.244.173",
//                 "param6": "80"
//             },
//             {
//                 "param1": "153",
//                 "param2": "03dba980-3c96-4a0c-9778-b73444af12de",
//                 "param3": "11-Feb-2026 08:58:57 PM",
//                 "param4": "NRM86056006865493001L0110226153251022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.244.173",
//                 "param6": "80"
//             },
//             {
//                 "param1": "154",
//                 "param2": "a55aec68-3027-4c5b-82a3-a074a8472470",
//                 "param3": "11-Feb-2026 08:57:57 PM",
//                 "param4": "NRM86056006865493001L0110226153151022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.244.173",
//                 "param6": "80"
//             },
//             {
//                 "param1": "155",
//                 "param2": "6bda3937-ca50-46eb-84d2-1bb4e235562a",
//                 "param3": "11-Feb-2026 08:57:04 PM",
//                 "param4": "NRM86056006865493001L0110226153050022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.244.173",
//                 "param6": "80"
//             },
//             {
//                 "param1": "156",
//                 "param2": "78df335d-36c4-442f-91bc-c6cfb432fc15",
//                 "param3": "11-Feb-2026 08:55:58 PM",
//                 "param4": "NRM86056006865493001L0110226152949022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.244.173",
//                 "param6": "80"
//             },
//             {
//                 "param1": "157",
//                 "param2": "5bb312c3-248a-49d9-8b21-1499a6c0757b",
//                 "param3": "11-Feb-2026 08:54:57 PM",
//                 "param4": "NRM86056006865493001L0110226152848022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.244.173",
//                 "param6": "80"
//             },
//             {
//                 "param1": "158",
//                 "param2": "d534d718-68da-421d-84f9-99317669e5aa",
//                 "param3": "11-Feb-2026 08:54:05 PM",
//                 "param4": "NRM86056006865493001L0110226152748022.655223N088.377126E404031107E000001312000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.244.173",
//                 "param6": "80"
//             },
//             {
//                 "param1": "159",
//                 "param2": "a32c928d-e82d-4c6f-91e0-70c5c42cb0fd",
//                 "param3": "11-Feb-2026 08:52:59 PM",
//                 "param4": "NRM86056006865493001L0110226152647022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.244.173",
//                 "param6": "80"
//             },
//             {
//                 "param1": "160",
//                 "param2": "efa42e6d-a935-4d9e-9865-f5c00cdcc1ee",
//                 "param3": "11-Feb-2026 08:51:57 PM",
//                 "param4": "NRM86056006865493001L0110226152546022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.244.173",
//                 "param6": "80"
//             },
//             {
//                 "param1": "161",
//                 "param2": "9bb8c712-4bfa-4fd6-a7e9-cd6b08e60bca",
//                 "param3": "11-Feb-2026 08:50:57 PM",
//                 "param4": "NRM86056006865493001L0110226152446022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.244.173",
//                 "param6": "80"
//             },
//             {
//                 "param1": "162",
//                 "param2": "051113e9-8ae5-47ad-a408-64b0f39b22eb",
//                 "param3": "11-Feb-2026 08:49:56 PM",
//                 "param4": "NRM86056006865493001L0110226152345022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.244.173",
//                 "param6": "80"
//             },
//             {
//                 "param1": "163",
//                 "param2": "476a2111-f1e8-46ff-b708-784c29490cce",
//                 "param3": "11-Feb-2026 08:48:57 PM",
//                 "param4": "NRM86056006865493001L0110226152244022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.244.173",
//                 "param6": "80"
//             },
//             {
//                 "param1": "164",
//                 "param2": "66283d84-3fd6-4b42-b811-499f2f4d45d2",
//                 "param3": "11-Feb-2026 08:47:58 PM",
//                 "param4": "NRM86056006865493001L0110226152144022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.244.173",
//                 "param6": "80"
//             },
//             {
//                 "param1": "165",
//                 "param2": "ad7eaf8e-ed70-4999-8e29-7a6e8739ced9",
//                 "param3": "11-Feb-2026 08:46:58 PM",
//                 "param4": "NRM86056006865493001L0110226152043022.655223N088.377126E404031107E000001312000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.244.173",
//                 "param6": "80"
//             },
//             {
//                 "param1": "166",
//                 "param2": "ce91aba2-2724-4260-a8bb-c68c8c576e01",
//                 "param3": "11-Feb-2026 08:46:04 PM",
//                 "param4": "NRM86056006865493001L0110226151942022.655223N088.377126E404031107E000001312000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.244.173",
//                 "param6": "80"
//             },
//             {
//                 "param1": "167",
//                 "param2": "df589709-b8be-4e6c-93ea-f7101083f283",
//                 "param3": "11-Feb-2026 08:45:05 PM",
//                 "param4": "NRM86056006865493001L0110226151842022.655223N088.377126E404031107E000001312000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.244.173",
//                 "param6": "80"
//             },
//             {
//                 "param1": "168",
//                 "param2": "e2995f8e-8800-4481-891c-0ec0962fdf71",
//                 "param3": "11-Feb-2026 08:44:18 PM",
//                 "param4": "BTH86056006865493001101L0110226151741022.655223N088.377126E404031107E000001312000.00000.0000001911S0000.00AIRTEL02H0110226151137022.655223N088.377126E404031107E000020763000.00000.0000001811S0000.002H0110226151037022.655223N088.377126E404031107E000020763000.00000.0000001811S0000.002H0110226150936022.655223N088.377126E4040310FFF000020763000.00000.0000001811S0000.002H0110226150836022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.002H0110226150735022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.002H0110226150634022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.002H0110226150534022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.002H0110226150433022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.002H0110226150333022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.002H0110226150232022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.0",
//                 "param5": "106.222.244.173",
//                 "param6": "80"
//             },
//             {
//                 "param1": "169",
//                 "param2": "bcefc071-f55e-4809-a2fa-52838c67c567",
//                 "param3": "11-Feb-2026 08:43:52 PM",
//                 "param4": "NRM86056006865493001L0110226151640022.655223N088.377126E404031107E000001312000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.244.173",
//                 "param6": "80"
//             },
//             {
//                 "param1": "170",
//                 "param2": "5fdbc008-1e34-4446-a4f5-54cf51cd08f1",
//                 "param3": "11-Feb-2026 08:43:12 PM",
//                 "param4": "NRM86056006865493001L0110226151540022.655223N088.377126E404031107E000001312000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.244.173",
//                 "param6": "80"
//             },
//             {
//                 "param1": "171",
//                 "param2": "654a4743-e793-40b0-bce0-b07d86e65a2b",
//                 "param3": "11-Feb-2026 08:43:06 PM",
//                 "param4": "NRM86056006865493001L0110226151439022.655223N088.377126E404031107E000020763000.00000.0000001811S0000.00AIRTEL",
//                 "param5": "106.222.244.173",
//                 "param6": "80"
//             },
//             {
//                 "param1": "172",
//                 "param2": "2d328f6c-883a-49a0-8053-deb8b4f29d90",
//                 "param3": "11-Feb-2026 08:43:02 PM",
//                 "param4": "NRM86056006865493001L0110226151338022.655223N088.377126E404031107E000020763000.00000.0000001811S0000.00AIRTEL",
//                 "param5": "106.222.244.173",
//                 "param6": "80"
//             },
//             {
//                 "param1": "173",
//                 "param2": "886b3c95-5f22-46a7-b2d1-3dd00de0246e",
//                 "param3": "11-Feb-2026 08:42:57 PM",
//                 "param4": "NRM86056006865493001L0110226151238022.655223N088.377126E404031107E000020763000.00000.0000001811S0000.00AIRTEL",
//                 "param5": "106.222.244.173",
//                 "param6": "80"
//             },
//             {
//                 "param1": "174",
//                 "param2": "a4de5aa8-f58b-4a00-86f0-05d267a0eeb1",
//                 "param3": "11-Feb-2026 08:33:15 PM",
//                 "param4": "NRM86056006865493001L0110226150132022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.00AIRTEL",
//                 "param5": "106.222.242.193",
//                 "param6": "80"
//             },
//             {
//                 "param1": "175",
//                 "param2": "1daef17d-a7ac-4e86-b311-5f5172c9c0ad",
//                 "param3": "11-Feb-2026 08:33:03 PM",
//                 "param4": "NRM86056006865493001L0110226150031022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.00AIRTEL",
//                 "param5": "106.222.242.193",
//                 "param6": "80"
//             },
//             {
//                 "param1": "176",
//                 "param2": "2f9ac12c-43fc-4ac6-932c-f1f30ce0aa23",
//                 "param3": "11-Feb-2026 08:32:48 PM",
//                 "param4": "NRM86056006865493001L0110226145931022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.00AIRTEL",
//                 "param5": "106.222.242.193",
//                 "param6": "80"
//             },
//             {
//                 "param1": "177",
//                 "param2": "be31eef3-7e0d-44b8-81d1-58594425e253",
//                 "param3": "11-Feb-2026 08:32:39 PM",
//                 "param4": "NRM86056006865493001L0110226145830022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.00AIRTEL",
//                 "param5": "106.222.242.193",
//                 "param6": "80"
//             },
//             {
//                 "param1": "178",
//                 "param2": "f2a97c0d-5075-4208-a49e-b3ca3e73bff8",
//                 "param3": "11-Feb-2026 08:32:08 PM",
//                 "param4": "BTH86056006865493001101L0110226145730022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.00AIRTEL02H0110226145629022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.002H0110226145529022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.002H0110226145428022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.002H0110226145328022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.002H0110226145227022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.002H0110226145127022.655223N088.377126E404031107E000020763000.00000.0000002211S0000.002H0110226145026022.655223N088.377126E404031107E000020763000.00000.0000002211S0000.002H0110226144926022.655223N088.377126E404031107E000020763000.00000.0000001811S0000.002H0110226144826022.655223N088.377126E404031107E000020763000.00000.0000001811S0000.002H0110226144725022.655223N088.377126E404031107E000020763000.00000.0000001811S0000.0",
//                 "param5": "106.222.242.193",
//                 "param6": "80"
//             },
//             {
//                 "param1": "179",
//                 "param2": "5da2587c-8aa6-46b0-936d-77e12a9faafe",
//                 "param3": "11-Feb-2026 08:14:15 PM",
//                 "param4": "NRM86056006865493001L0110226144725022.655223N088.377126E404031107E000020763000.00000.0000001811S0000.00AIRTEL",
//                 "param5": "106.222.242.146",
//                 "param6": "80"
//             },
//             {
//                 "param1": "180",
//                 "param2": "3723b81a-894b-453f-818f-8c0fe75e2132",
//                 "param3": "11-Feb-2026 08:13:02 PM",
//                 "param4": "NRM86056006865493001L0110226144625022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.242.146",
//                 "param6": "80"
//             },
//             {
//                 "param1": "181",
//                 "param2": "6cfd8753-cd3e-4bf7-a946-75ce2a1e7c0b",
//                 "param3": "11-Feb-2026 08:11:59 PM",
//                 "param4": "NRM86056006865493001L0110226144524022.655223N088.377126E404031107E000020763000.00000.0000001811S0000.00AIRTEL",
//                 "param5": "106.222.242.146",
//                 "param6": "80"
//             },
//             {
//                 "param1": "182",
//                 "param2": "0b25aa47-40d0-4ec3-97ab-eb0a5fe6e73d",
//                 "param3": "11-Feb-2026 08:11:01 PM",
//                 "param4": "NRM86056006865493001L0110226144424022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.242.146",
//                 "param6": "80"
//             },
//             {
//                 "param1": "183",
//                 "param2": "cc7c3499-2cbc-47f7-bfa9-95f446aa2545",
//                 "param3": "11-Feb-2026 08:10:01 PM",
//                 "param4": "NRM86056006865493001L0110226144323022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.242.146",
//                 "param6": "80"
//             },
//             {
//                 "param1": "184",
//                 "param2": "2fa50cc8-c58b-4f05-b053-3934a8944b92",
//                 "param3": "11-Feb-2026 08:09:01 PM",
//                 "param4": "NRM86056006865493001L0110226144223022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.242.146",
//                 "param6": "80"
//             },
//             {
//                 "param1": "185",
//                 "param2": "e14a3843-aa7b-4b7e-b2cc-6b3db7675886",
//                 "param3": "11-Feb-2026 08:08:03 PM",
//                 "param4": "NRM86056006865493001L0110226144122022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.242.146",
//                 "param6": "80"
//             },
//             {
//                 "param1": "186",
//                 "param2": "ade37416-169a-4045-933a-c9682d2fd23a",
//                 "param3": "11-Feb-2026 08:07:06 PM",
//                 "param4": "NRM86056006865493001L0110226144022022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.242.146",
//                 "param6": "80"
//             },
//             {
//                 "param1": "187",
//                 "param2": "0e45112d-d72b-4810-8d16-d1770a0616d2",
//                 "param3": "11-Feb-2026 08:06:06 PM",
//                 "param4": "NRM86056006865493001L0110226143921022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.242.146",
//                 "param6": "80"
//             },
//             {
//                 "param1": "188",
//                 "param2": "bebf8915-b344-4d37-b18a-8ddcc5b808d5",
//                 "param3": "11-Feb-2026 08:05:04 PM",
//                 "param4": "NRM86056006865493001L0110226143821022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.242.146",
//                 "param6": "80"
//             },
//             {
//                 "param1": "189",
//                 "param2": "15840064-b84e-4158-869f-07891e395640",
//                 "param3": "11-Feb-2026 08:04:03 PM",
//                 "param4": "NRM86056006865493001L0110226143720022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.242.146",
//                 "param6": "80"
//             },
//             {
//                 "param1": "190",
//                 "param2": "63ab1511-db35-4257-84bb-bea51a75b7f0",
//                 "param3": "11-Feb-2026 08:03:02 PM",
//                 "param4": "NRM86056006865493001L0110226143620022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.242.146",
//                 "param6": "80"
//             },
//             {
//                 "param1": "191",
//                 "param2": "f34639c8-eed0-4fdd-9d9a-c0989334ab0f",
//                 "param3": "11-Feb-2026 08:02:03 PM",
//                 "param4": "NRM86056006865493001L0110226143520022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.242.146",
//                 "param6": "80"
//             },
//             {
//                 "param1": "192",
//                 "param2": "32b4a438-981c-4b81-a2ce-aee1fcd7a153",
//                 "param3": "11-Feb-2026 08:01:00 PM",
//                 "param4": "NRM86056006865493001L0110226143419022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.242.146",
//                 "param6": "80"
//             },
//             {
//                 "param1": "193",
//                 "param2": "508d4c6d-3c87-4290-8155-f5f1331a093b",
//                 "param3": "11-Feb-2026 08:00:02 PM",
//                 "param4": "NRM86056006865493001L0110226143319022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.242.146",
//                 "param6": "80"
//             },
//             {
//                 "param1": "194",
//                 "param2": "dcdfa5be-4a5e-44ef-9a2f-301edf40554b",
//                 "param3": "11-Feb-2026 07:59:01 PM",
//                 "param4": "NRM86056006865493001L0110226143218022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.242.146",
//                 "param6": "80"
//             },
//             {
//                 "param1": "195",
//                 "param2": "727f1811-b823-4a53-9d35-6557581c091b",
//                 "param3": "11-Feb-2026 07:58:00 PM",
//                 "param4": "NRM86056006865493001L0110226143118022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.242.146",
//                 "param6": "80"
//             },
//             {
//                 "param1": "196",
//                 "param2": "348deee0-55cf-4971-a896-2e9c6e477388",
//                 "param3": "11-Feb-2026 07:57:16 PM",
//                 "param4": "BTH86056006865493003001L0110226143015022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL02H0110226142310022.655223N088.377126E404031107E000020763000.00000.0000002211S0000.002H0110226142210022.655223N088.377126E404031107E000020763000.00000.0000002211S0000.002H0110226142108022.655223N088.377126E404031107E000020763000.00000.0000002211S0000.002H0110226142008022.655223N088.377126E404031107E000020763000.00000.0000002211S0000.002H0110226141907022.655223N088.377126E4040310FFF000065535000.00000.0000002111S0000.002H0110226141807022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.002H0110226141706022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.002H0110226141606022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.002H0110226141506022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.002H0110226141405022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.002H0110226141305022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.002H0110226141204022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.025H0110226141104022.655223N088.377126E404031107E000020763000.00000.0000002111S000TDI3.1.0700000000000000000000.0000AIRTEL18107E00004176416107E000062526000000000062526000000000062526020.90002H0110226141104022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.002H0110226141003022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.002H0110226140903022.655223N088.377126E4040310FFF000065535000.00000.0000002011S0000.002H0110226140802022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.002H0110226140702022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.002H0110226140601022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.002H0110226140401022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.002H0110226140300022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.002H0110226140200022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.002H0110226140059022.655223N088.377126E404031107E000020763000.00000.0000001811S0000.002H0110226135959022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.002H0110226135858022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.002H0110226135758022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.002H0110226135657022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.002H0110226135557022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.002H0110226135456022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.0",
//                 "param5": "106.222.242.146",
//                 "param6": "80"
//             },
//             {
//                 "param1": "197",
//                 "param2": "a78e110e-8d2b-44d7-b8cd-a9b30ffed9f4",
//                 "param3": "11-Feb-2026 07:56:59 PM",
//                 "param4": "NRM86056006865493001L0110226142913022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.244.49",
//                 "param6": "80"
//             },
//             {
//                 "param1": "198",
//                 "param2": "3b26b0b5-2f77-479a-acd2-63c281223dc7",
//                 "param3": "11-Feb-2026 07:56:53 PM",
//                 "param4": "NRM86056006865493001L0110226142812022.655223N088.377126E4040310FFF000065535000.00000.0000002011S0000.00000000",
//                 "param5": "106.222.244.49",
//                 "param6": "80"
//             },
//             {
//                 "param1": "199",
//                 "param2": "3e463031-74f7-44f1-967b-b41417d25d83",
//                 "param3": "11-Feb-2026 07:56:49 PM",
//                 "param4": "NRM86056006865493001L0110226142712022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.00AIRTEL",
//                 "param5": "106.222.244.49",
//                 "param6": "80"
//             },
//             {
//                 "param1": "200",
//                 "param2": "649a8cb5-767f-4f5c-b515-a448f3135f2f",
//                 "param3": "11-Feb-2026 07:56:39 PM",
//                 "param4": "NRM86056006865493001L0110226142611022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.00AIRTEL",
//                 "param5": "106.222.244.49",
//                 "param6": "80"
//             },
//             {
//                 "param1": "201",
//                 "param2": "f08e2552-8144-4e43-a035-a0a483e3fecc",
//                 "param3": "11-Feb-2026 07:56:34 PM",
//                 "param4": "NRM86056006865493001L0110226142511022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.00AIRTEL",
//                 "param5": "106.222.244.49",
//                 "param6": "80"
//             },
//             {
//                 "param1": "202",
//                 "param2": "d9a2df64-7dfd-46f7-a3b4-809ddd852660",
//                 "param3": "11-Feb-2026 07:56:23 PM",
//                 "param4": "NRM86056006865493001L0110226142411022.655223N088.377126E4040310FFF000065535000.00000.0000002111S0000.00AIRTEL",
//                 "param5": "106.222.244.49",
//                 "param6": "80"
//             },
//             {
//                 "param1": "203",
//                 "param2": "d525f00f-206c-446b-bc6c-bcb4a722a7ff",
//                 "param3": "11-Feb-2026 07:56:21 PM",
//                 "param4": "BTH86056006865493003001L0110226142411022.655223N088.377126E4040310FFF000065535000.00000.0000002111S0000.00AIRTEL02H0110226142310022.655223N088.377126E404031107E000020763000.00000.0000002211S0000.002H0110226142210022.655223N088.377126E404031107E000020763000.00000.0000002211S0000.002H0110226142108022.655223N088.377126E404031107E000020763000.00000.0000002211S0000.002H0110226142008022.655223N088.377126E404031107E000020763000.00000.0000002211S0000.002H0110226141907022.655223N088.377126E4040310FFF000065535000.00000.0000002111S0000.002H0110226141807022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.002H0110226141706022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.002H0110226141606022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.002H0110226141506022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.002H0110226141405022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.002H0110226141305022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.002H0110226141204022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.025H0110226141104022.655223N088.377126E404031107E000020763000.00000.0000002111S000TDI3.1.0700000000000000000000.0000AIRTEL18107E00004176416107E000062526000000000062526000000000062526020.90002H0110226141104022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.002H0110226141003022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.002H0110226140903022.655223N088.377126E4040310FFF000065535000.00000.0000002011S0000.002H0110226140802022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.002H0110226140702022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.002H0110226140601022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.002H0110226140401022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.002H0110226140300022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.002H0110226140200022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.002H0110226140059022.655223N088.377126E404031107E000020763000.00000.0000001811S0000.002H0110226135959022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.002H0110226135858022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.002H0110226135758022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.002H0110226135657022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.002H0110226135557022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.002H0110226135456022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.0",
//                 "param5": "106.222.244.49",
//                 "param6": "80"
//             },
//             {
//                 "param1": "204",
//                 "param2": "ae20b302-e06a-4fee-bcf0-9821c6b7abd8",
//                 "param3": "11-Feb-2026 07:42:22 PM",
//                 "param4": "NRM86056006865493001L0110226141405022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.00AIRTEL",
//                 "param5": "106.222.241.196",
//                 "param6": "80"
//             },
//             {
//                 "param1": "205",
//                 "param2": "8e17a008-b61a-4b2a-9ec1-974db88c7f38",
//                 "param3": "11-Feb-2026 07:33:39 PM",
//                 "param4": "NRM86056006865493001L0110226140501022.655223N088.377126E4040310FFF000065535000.00000.0000002011S0000.00000000",
//                 "param5": "106.222.240.193",
//                 "param6": "80"
//             },
//             {
//                 "param1": "206",
//                 "param2": "f9855fcf-3c03-4bc0-9dea-61c122f53fbc",
//                 "param3": "11-Feb-2026 07:26:48 PM",
//                 "param4": "NRM86056006865493001L0110226135456022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.240.25",
//                 "param6": "80"
//             },
//             {
//                 "param1": "207",
//                 "param2": "0fc408ed-ebba-47b2-a12e-1abeb6425c36",
//                 "param3": "11-Feb-2026 07:26:36 PM",
//                 "param4": "NRM86056006865493001L0110226135356022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.240.25",
//                 "param6": "80"
//             },
//             {
//                 "param1": "208",
//                 "param2": "423a1287-f325-4662-a9e8-551b48791bc2",
//                 "param3": "11-Feb-2026 07:23:48 PM",
//                 "param4": "NRM86056006865493001L0110226135356022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.240.25",
//                 "param6": "80"
//             },
//             {
//                 "param1": "209",
//                 "param2": "4e26d8a5-396e-4708-9371-22f4837faac2",
//                 "param3": "11-Feb-2026 07:21:09 PM",
//                 "param4": "NRM86056006865493001L0110226135356022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.240.25",
//                 "param6": "80"
//             },
//             {
//                 "param1": "210",
//                 "param2": "ecab65d2-f9fc-46fa-9bfe-346bbc730bf1",
//                 "param3": "11-Feb-2026 07:19:56 PM",
//                 "param4": "NRM86056006865493001L0110226135255022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.242.244",
//                 "param6": "80"
//             },
//             {
//                 "param1": "211",
//                 "param2": "64286e87-e422-496f-9092-a5eec65cb184",
//                 "param3": "11-Feb-2026 07:19:07 PM",
//                 "param4": "NRM86056006865493001L0110226135155022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.242.244",
//                 "param6": "80"
//             },
//             {
//                 "param1": "212",
//                 "param2": "95fcb977-28b9-4308-95a6-93ef95c2f119",
//                 "param3": "11-Feb-2026 07:17:55 PM",
//                 "param4": "NRM86056006865493001L0110226135054022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.242.244",
//                 "param6": "80"
//             },
//             {
//                 "param1": "213",
//                 "param2": "750769d2-fdb4-476b-a3c0-70e24c8a8d2b",
//                 "param3": "11-Feb-2026 07:16:55 PM",
//                 "param4": "NRM86056006865493001L0110226134954022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.242.150",
//                 "param6": "80"
//             },
//             {
//                 "param1": "214",
//                 "param2": "e70c73ad-29ac-4d6f-bf81-221e554a0048",
//                 "param3": "11-Feb-2026 07:15:56 PM",
//                 "param4": "NRM86056006865493001L0110226134853022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.242.150",
//                 "param6": "80"
//             },
//             {
//                 "param1": "215",
//                 "param2": "24ee5c4c-5863-4b71-b888-20c18369840b",
//                 "param3": "11-Feb-2026 07:14:59 PM",
//                 "param4": "NRM86056006865493001L0110226134753022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.242.150",
//                 "param6": "80"
//             },
//             {
//                 "param1": "216",
//                 "param2": "aa5a357b-6286-427b-a594-0e37b7a19e3b",
//                 "param3": "11-Feb-2026 07:13:58 PM",
//                 "param4": "NRM86056006865493001L0110226134653022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.242.150",
//                 "param6": "80"
//             },
//             {
//                 "param1": "217",
//                 "param2": "f835e6e1-1676-4402-a736-3d49a0e55f5d",
//                 "param3": "11-Feb-2026 07:12:59 PM",
//                 "param4": "NRM86056006865493001L0110226134552022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.246.100",
//                 "param6": "80"
//             },
//             {
//                 "param1": "218",
//                 "param2": "f377de7c-4383-4b7b-8186-860a1b0f4858",
//                 "param3": "11-Feb-2026 07:11:58 PM",
//                 "param4": "NRM86056006865493001L0110226134452022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.246.100",
//                 "param6": "80"
//             },
//             {
//                 "param1": "219",
//                 "param2": "7e7bbef2-ee10-4df1-a841-5bd0a6380249",
//                 "param3": "11-Feb-2026 07:10:56 PM",
//                 "param4": "NRM86056006865493001L0110226134351022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.246.100",
//                 "param6": "80"
//             },
//             {
//                 "param1": "220",
//                 "param2": "36a40df9-c917-4b83-8c54-7631c7b4de8d",
//                 "param3": "11-Feb-2026 07:09:56 PM",
//                 "param4": "NRM86056006865493001L0110226134251022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.246.100",
//                 "param6": "80"
//             },
//             {
//                 "param1": "221",
//                 "param2": "e29ceb76-579a-4ddf-8352-c42491fa8101",
//                 "param3": "11-Feb-2026 07:08:55 PM",
//                 "param4": "NRM86056006865493001L0110226134150022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.243.105",
//                 "param6": "80"
//             },
//             {
//                 "param1": "222",
//                 "param2": "5132bf4c-7524-49e4-9ea4-d45269950921",
//                 "param3": "11-Feb-2026 07:07:54 PM",
//                 "param4": "NRM86056006865493001L0110226134050022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.243.105",
//                 "param6": "80"
//             },
//             {
//                 "param1": "223",
//                 "param2": "eb0c932d-88a7-4c7b-8392-f71de03af55f",
//                 "param3": "11-Feb-2026 07:06:54 PM",
//                 "param4": "NRM86056006865493001L0110226133949022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.243.105",
//                 "param6": "80"
//             },
//             {
//                 "param1": "224",
//                 "param2": "88b1daff-8514-488c-b6de-65733eb00657",
//                 "param3": "11-Feb-2026 07:06:00 PM",
//                 "param4": "NRM86056006865493001L0110226133849022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.243.105",
//                 "param6": "80"
//             },
//             {
//                 "param1": "225",
//                 "param2": "9e7c252b-c77a-445b-bdd9-25493b0a62bf",
//                 "param3": "11-Feb-2026 07:04:54 PM",
//                 "param4": "NRM86056006865493001L0110226133748022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.243.105",
//                 "param6": "80"
//             },
//             {
//                 "param1": "226",
//                 "param2": "2bac8245-dded-4f7c-9451-7207d89dbaf8",
//                 "param3": "11-Feb-2026 07:03:55 PM",
//                 "param4": "NRM86056006865493001L0110226133648022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.243.105",
//                 "param6": "80"
//             },
//             {
//                 "param1": "227",
//                 "param2": "2a19c704-89a4-479d-893a-6b61872444bf",
//                 "param3": "11-Feb-2026 07:02:55 PM",
//                 "param4": "NRM86056006865493001L0110226133547022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.243.105",
//                 "param6": "80"
//             },
//             {
//                 "param1": "228",
//                 "param2": "04615e7e-c926-4cea-a7ab-8d63681bcef8",
//                 "param3": "11-Feb-2026 07:02:21 PM",
//                 "param4": "NRM86056006865493001L0110226133447022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.243.105",
//                 "param6": "80"
//             },
//             {
//                 "param1": "229",
//                 "param2": "c78a938a-f9eb-4949-a597-0fc45a6fa349",
//                 "param3": "11-Feb-2026 07:02:08 PM",
//                 "param4": "NRM86056006865493001L0110226133346022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.243.105",
//                 "param6": "80"
//             },
//             {
//                 "param1": "230",
//                 "param2": "aa6de928-a7be-4baf-b024-82de9b2e963a",
//                 "param3": "11-Feb-2026 07:02:03 PM",
//                 "param4": "NRM86056006865493001L0110226133246022.655223N088.377126E4040310FFF000065535000.00000.0000002011S0000.00000000",
//                 "param5": "106.222.243.105",
//                 "param6": "80"
//             },
//             {
//                 "param1": "231",
//                 "param2": "76c57168-81d9-40e2-a974-21ab034c4588",
//                 "param3": "11-Feb-2026 07:01:59 PM",
//                 "param4": "NRM86056006865493001L0110226133145022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.243.105",
//                 "param6": "80"
//             },
//             {
//                 "param1": "232",
//                 "param2": "26639ceb-ce8e-4bd5-8bc1-4f88d3ec1b57",
//                 "param3": "11-Feb-2026 06:59:04 PM",
//                 "param4": "NRM86056006865493001L0110226133145022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.246.8",
//                 "param6": "80"
//             },
//             {
//                 "param1": "233",
//                 "param2": "218c4d71-70c1-4fa2-b40c-dba47a918b1f",
//                 "param3": "11-Feb-2026 06:57:56 PM",
//                 "param4": "NRM86056006865493001L0110226133045022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.246.8",
//                 "param6": "80"
//             },
//             {
//                 "param1": "234",
//                 "param2": "39d5d8a8-ca35-4a29-bbbf-4a9d9d661ca0",
//                 "param3": "11-Feb-2026 06:56:56 PM",
//                 "param4": "NRM86056006865493001L0110226132944022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.246.8",
//                 "param6": "80"
//             },
//             {
//                 "param1": "235",
//                 "param2": "d017a434-e341-43cb-8d13-5099f6f13876",
//                 "param3": "11-Feb-2026 06:55:54 PM",
//                 "param4": "NRM86056006865493001L0110226132844022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.246.8",
//                 "param6": "80"
//             },
//             {
//                 "param1": "236",
//                 "param2": "08ecd75f-e5f5-41f5-ab09-b9135ff018be",
//                 "param3": "11-Feb-2026 06:54:54 PM",
//                 "param4": "NRM86056006865493001L0110226132743022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.240.166",
//                 "param6": "80"
//             },
//             {
//                 "param1": "237",
//                 "param2": "dcb8f372-400f-437b-87a0-ac5dbef62562",
//                 "param3": "11-Feb-2026 06:53:55 PM",
//                 "param4": "NRM86056006865493001L0110226132643022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.00AIRTEL",
//                 "param5": "106.222.240.166",
//                 "param6": "80"
//             },
//             {
//                 "param1": "238",
//                 "param2": "c7bde8eb-b15e-47b2-a846-23b133207ff8",
//                 "param3": "11-Feb-2026 06:52:55 PM",
//                 "param4": "NRM86056006865493001L0110226132542022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.00AIRTEL",
//                 "param5": "106.222.240.166",
//                 "param6": "80"
//             },
//             {
//                 "param1": "239",
//                 "param2": "b34c03ed-67f7-416f-8c0a-ed6713ed834b",
//                 "param3": "11-Feb-2026 06:51:58 PM",
//                 "param4": "NRM86056006865493001L0110226132442022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.00AIRTEL",
//                 "param5": "106.222.240.166",
//                 "param6": "80"
//             },
//             {
//                 "param1": "240",
//                 "param2": "d16b5e66-fc77-4d61-90f2-c24f3549d001",
//                 "param3": "11-Feb-2026 06:50:54 PM",
//                 "param4": "NRM86056006865493001L0110226132341022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.00AIRTEL",
//                 "param5": "106.222.240.166",
//                 "param6": "80"
//             },
//             {
//                 "param1": "241",
//                 "param2": "90eb227d-dadd-494c-8d8e-80b047b369e5",
//                 "param3": "11-Feb-2026 06:49:54 PM",
//                 "param4": "NRM86056006865493001L0110226132241022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.240.166",
//                 "param6": "80"
//             },
//             {
//                 "param1": "242",
//                 "param2": "27130d66-1a6e-4c60-9d1e-b6ac00f1b557",
//                 "param3": "11-Feb-2026 06:48:55 PM",
//                 "param4": "NRM86056006865493001L0110226132140022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.240.166",
//                 "param6": "80"
//             },
//             {
//                 "param1": "243",
//                 "param2": "e14360dd-7276-4132-99d4-3032a4cc3735",
//                 "param3": "11-Feb-2026 06:47:56 PM",
//                 "param4": "NRM86056006865493001L0110226132040022.655223N088.377126E404031107E000020763000.00000.0000001811S0000.00AIRTEL",
//                 "param5": "106.222.240.229",
//                 "param6": "80"
//             },
//             {
//                 "param1": "244",
//                 "param2": "cba30da1-373b-4a7c-83ac-f75bc633836f",
//                 "param3": "11-Feb-2026 06:46:54 PM",
//                 "param4": "NRM86056006865493001L0110226131939022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.240.229",
//                 "param6": "80"
//             },
//             {
//                 "param1": "245",
//                 "param2": "f2aa46e8-716d-4864-85b7-d27bbb269e45",
//                 "param3": "11-Feb-2026 06:45:57 PM",
//                 "param4": "NRM86056006865493001L0110226131839022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.240.229",
//                 "param6": "80"
//             },
//             {
//                 "param1": "246",
//                 "param2": "288bdf3b-c521-4b23-a9d2-92c9657c2c8f",
//                 "param3": "11-Feb-2026 06:44:54 PM",
//                 "param4": "NRM86056006865493001L0110226131738022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.240.229",
//                 "param6": "80"
//             },
//             {
//                 "param1": "247",
//                 "param2": "a4d95290-235b-437f-915f-82f214df4d15",
//                 "param3": "11-Feb-2026 06:43:54 PM",
//                 "param4": "NRM86056006865493001L0110226131638022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.243.48",
//                 "param6": "80"
//             },
//             {
//                 "param1": "248",
//                 "param2": "bda6e686-0524-45f0-bbfe-4c2872892ed6",
//                 "param3": "11-Feb-2026 06:42:54 PM",
//                 "param4": "NRM86056006865493001L0110226131537022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.243.48",
//                 "param6": "80"
//             },
//             {
//                 "param1": "249",
//                 "param2": "ed011674-ef12-4dd1-a325-d4bc27e431e4",
//                 "param3": "11-Feb-2026 06:41:56 PM",
//                 "param4": "NRM86056006865493001L0110226131437022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.243.48",
//                 "param6": "80"
//             },
//             {
//                 "param1": "250",
//                 "param2": "10f08554-da71-4cd3-ae14-ccce6daa9de3",
//                 "param3": "11-Feb-2026 06:41:17 PM",
//                 "param4": "NRM86056006865493001L0110226131336022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.243.48",
//                 "param6": "80"
//             },
//             {
//                 "param1": "251",
//                 "param2": "d2b8a3a2-378f-41e7-bb7c-a12de7b3217b",
//                 "param3": "11-Feb-2026 06:41:11 PM",
//                 "param4": "NRM86056006865493001L0110226131235022.655223N088.377126E4040310FFF000065535000.00000.0000002011S0000.00000000",
//                 "param5": "106.222.243.48",
//                 "param6": "80"
//             },
//             {
//                 "param1": "252",
//                 "param2": "e3639c8c-434f-4af4-b6c2-c0ccc42a56c8",
//                 "param3": "11-Feb-2026 06:41:08 PM",
//                 "param4": "NRM86056006865493001L0110226131135022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.243.48",
//                 "param6": "80"
//             },
//             {
//                 "param1": "253",
//                 "param2": "ef27d9a1-d7cc-424a-bdaa-7fec962f0a89",
//                 "param3": "11-Feb-2026 06:40:58 PM",
//                 "param4": "NRM86056006865493001L0110226131034022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.243.48",
//                 "param6": "80"
//             },
//             {
//                 "param1": "254",
//                 "param2": "0f226815-8b61-4961-967a-86040cc9cca9",
//                 "param3": "11-Feb-2026 06:36:56 PM",
//                 "param4": "NRM86056006865493001L0110226130934022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.247.195",
//                 "param6": "80"
//             },
//             {
//                 "param1": "255",
//                 "param2": "ccf50c0e-c658-4303-98a7-7b4d94bc7f57",
//                 "param3": "11-Feb-2026 06:36:02 PM",
//                 "param4": "NRM86056006865493001L0110226130833022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.247.195",
//                 "param6": "80"
//             },
//             {
//                 "param1": "256",
//                 "param2": "1f83cdf9-d553-4796-8f07-40e26c331c3d",
//                 "param3": "11-Feb-2026 06:35:49 PM",
//                 "param4": "NRM86056006865493001L0110226130733022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.247.195",
//                 "param6": "80"
//             },
//             {
//                 "param1": "257",
//                 "param2": "43cd2434-3db2-4a46-96c5-a914f7aa1d61",
//                 "param3": "11-Feb-2026 06:35:43 PM",
//                 "param4": "NRM86056006865493001L0110226130632022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.247.195",
//                 "param6": "80"
//             },
//             {
//                 "param1": "258",
//                 "param2": "a59071db-55da-4746-af9d-5498a6771206",
//                 "param3": "11-Feb-2026 06:35:39 PM",
//                 "param4": "NRM86056006865493001L0110226130532022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.247.195",
//                 "param6": "80"
//             },
//             {
//                 "param1": "259",
//                 "param2": "61447e1b-0018-4d00-b855-adc0558faad1",
//                 "param3": "11-Feb-2026 06:32:57 PM",
//                 "param4": "NRM86056006865493001L0110226130532022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.247.195",
//                 "param6": "80"
//             },
//             {
//                 "param1": "260",
//                 "param2": "ad30fd2d-2527-4cbf-bcc9-992c02ff5bd4",
//                 "param3": "11-Feb-2026 06:31:54 PM",
//                 "param4": "NRM86056006865493001L0110226130431022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.247.195",
//                 "param6": "80"
//             },
//             {
//                 "param1": "261",
//                 "param2": "3540a835-915b-4e47-bbbf-4e3590e01a69",
//                 "param3": "11-Feb-2026 06:30:56 PM",
//                 "param4": "NRM86056006865493001L0110226130331022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.247.195",
//                 "param6": "80"
//             },
//             {
//                 "param1": "262",
//                 "param2": "b6ef3b78-76b4-44f7-9687-f9197bc75d1a",
//                 "param3": "11-Feb-2026 06:29:56 PM",
//                 "param4": "NRM86056006865493001L0110226130230022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.247.195",
//                 "param6": "80"
//             },
//             {
//                 "param1": "263",
//                 "param2": "83e51bb0-559d-4f01-a947-5e2c348d52ea",
//                 "param3": "11-Feb-2026 06:28:54 PM",
//                 "param4": "NRM86056006865493001L0110226130129022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.244.194",
//                 "param6": "80"
//             },
//             {
//                 "param1": "264",
//                 "param2": "7ae2d9c0-f88f-4350-ae20-ee96b4f8539a",
//                 "param3": "11-Feb-2026 06:27:56 PM",
//                 "param4": "NRM86056006865493001L0110226130029022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.244.194",
//                 "param6": "80"
//             },
//             {
//                 "param1": "265",
//                 "param2": "ea2bdf61-f0c7-45ec-ac68-52527f1d756a",
//                 "param3": "11-Feb-2026 06:26:57 PM",
//                 "param4": "NRM86056006865493001L0110226125928022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.244.194",
//                 "param6": "80"
//             },
//             {
//                 "param1": "266",
//                 "param2": "62b58af5-13cb-4999-b9e5-f2ab7d4f6778",
//                 "param3": "11-Feb-2026 06:25:57 PM",
//                 "param4": "NRM86056006865493001L0110226125828022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.244.194",
//                 "param6": "80"
//             },
//             {
//                 "param1": "267",
//                 "param2": "c2d250c2-fbf3-4c20-a85c-b9b593f5bbdc",
//                 "param3": "11-Feb-2026 06:24:54 PM",
//                 "param4": "NRM86056006865493001L0110226125727022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.246.96",
//                 "param6": "80"
//             },
//             {
//                 "param1": "268",
//                 "param2": "d0379856-a511-4518-aefc-dc4df41ef7f3",
//                 "param3": "11-Feb-2026 06:23:55 PM",
//                 "param4": "NRM86056006865493001L0110226125627022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.246.96",
//                 "param6": "80"
//             },
//             {
//                 "param1": "269",
//                 "param2": "81098847-e002-459e-ba91-2e2944cb8bed",
//                 "param3": "11-Feb-2026 06:22:55 PM",
//                 "param4": "NRM86056006865493001L0110226125526022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.246.96",
//                 "param6": "80"
//             },
//             {
//                 "param1": "270",
//                 "param2": "cb05b82d-529d-4886-9926-72a576141d5c",
//                 "param3": "11-Feb-2026 06:21:53 PM",
//                 "param4": "NRM86056006865493001L0110226125425022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.246.96",
//                 "param6": "80"
//             },
//             {
//                 "param1": "271",
//                 "param2": "18849b8d-9c8c-4151-a189-eb72823b3f0a",
//                 "param3": "11-Feb-2026 06:20:53 PM",
//                 "param4": "NRM86056006865493001L0110226125325022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.246.96",
//                 "param6": "80"
//             },
//             {
//                 "param1": "272",
//                 "param2": "f58d37c9-4d32-44b1-ba0f-d06b70f863f6",
//                 "param3": "11-Feb-2026 06:19:56 PM",
//                 "param4": "NRM86056006865493001L0110226125224022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.246.96",
//                 "param6": "80"
//             },
//             {
//                 "param1": "273",
//                 "param2": "2efe0d93-a05c-4a5d-bbac-6827d115240a",
//                 "param3": "11-Feb-2026 06:18:55 PM",
//                 "param4": "NRM86056006865493001L0110226125124022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.246.96",
//                 "param6": "80"
//             },
//             {
//                 "param1": "274",
//                 "param2": "7bb67b96-7781-4947-acc8-cff3005da985",
//                 "param3": "11-Feb-2026 06:18:06 PM",
//                 "param4": "NRM86056006865493001L0110226125023022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.241.169",
//                 "param6": "80"
//             },
//             {
//                 "param1": "275",
//                 "param2": "3c39af71-0031-43b7-b2a5-48460aafa54f",
//                 "param3": "11-Feb-2026 06:16:55 PM",
//                 "param4": "NRM86056006865493001L0110226124922022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.244.232",
//                 "param6": "80"
//             },
//             {
//                 "param1": "276",
//                 "param2": "565f9b85-1f71-4aad-9a01-25a921beece5",
//                 "param3": "11-Feb-2026 06:15:53 PM",
//                 "param4": "NRM86056006865493001L0110226124822022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.244.232",
//                 "param6": "80"
//             },
//             {
//                 "param1": "277",
//                 "param2": "8cd9e3a9-36c5-4d59-b422-674f3320ef17",
//                 "param3": "11-Feb-2026 06:14:54 PM",
//                 "param4": "NRM86056006865493001L0110226124721022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.244.232",
//                 "param6": "80"
//             },
//             {
//                 "param1": "278",
//                 "param2": "a7d7d7cd-7d5e-4270-a507-eee9fc55d2c6",
//                 "param3": "11-Feb-2026 06:13:56 PM",
//                 "param4": "NRM86056006865493001L0110226124620022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.244.232",
//                 "param6": "80"
//             },
//             {
//                 "param1": "279",
//                 "param2": "ebfdae74-af11-4b8b-82c9-5e4d217fbd66",
//                 "param3": "11-Feb-2026 06:12:54 PM",
//                 "param4": "NRM86056006865493001L0110226124520022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.244.232",
//                 "param6": "80"
//             },
//             {
//                 "param1": "280",
//                 "param2": "3d184945-339a-4c89-a9b7-4c281d253389",
//                 "param3": "11-Feb-2026 06:11:55 PM",
//                 "param4": "NRM86056006865493001L0110226124419022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.244.232",
//                 "param6": "80"
//             },
//             {
//                 "param1": "281",
//                 "param2": "36c4e595-253a-49fd-bb3e-d81fe1027a8a",
//                 "param3": "11-Feb-2026 06:10:53 PM",
//                 "param4": "NRM86056006865493001L0110226124318022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.241.205",
//                 "param6": "80"
//             },
//             {
//                 "param1": "282",
//                 "param2": "7764f50a-6b37-44a4-b0fc-07120b16a12c",
//                 "param3": "11-Feb-2026 06:10:26 PM",
//                 "param4": "NRM86056006865493001L0110226124218022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.241.205",
//                 "param6": "80"
//             },
//             {
//                 "param1": "283",
//                 "param2": "bd0ebfa9-2151-4e85-beba-8d453c82e9a5",
//                 "param3": "11-Feb-2026 06:10:05 PM",
//                 "param4": "NRM86056006865493001L0110226124117022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.00AIRTEL",
//                 "param5": "106.222.241.205",
//                 "param6": "80"
//             },
//             {
//                 "param1": "284",
//                 "param2": "8a036a26-172c-4bd4-9849-39b20198fd1b",
//                 "param3": "11-Feb-2026 06:09:58 PM",
//                 "param4": "NRM86056006865493001L0110226124016022.655223N088.377126E4040310FFF000065535000.00000.0000002111S0000.00000000",
//                 "param5": "106.222.241.205",
//                 "param6": "80"
//             },
//             {
//                 "param1": "285",
//                 "param2": "36ecde63-1b47-4304-aa6b-dcbbf7ec0b44",
//                 "param3": "11-Feb-2026 06:09:54 PM",
//                 "param4": "NRM86056006865493001L0110226123915022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.241.205",
//                 "param6": "80"
//             },
//             {
//                 "param1": "286",
//                 "param2": "b4efe78f-0e5c-4e1c-ac57-0675fbb527bd",
//                 "param3": "11-Feb-2026 06:09:47 PM",
//                 "param4": "NRM86056006865493001L0110226123815022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.00AIRTEL",
//                 "param5": "106.222.241.205",
//                 "param6": "80"
//             },
//             {
//                 "param1": "287",
//                 "param2": "145c38ff-887b-47c7-a711-be28d8b38b52",
//                 "param3": "11-Feb-2026 06:07:09 PM",
//                 "param4": "NRM86056006865493001L0110226123815022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.00AIRTEL",
//                 "param5": "106.222.241.239",
//                 "param6": "80"
//             },
//             {
//                 "param1": "288",
//                 "param2": "ca2d35b9-a006-4c49-9fe6-f1bd716f7f82",
//                 "param3": "11-Feb-2026 06:06:54 PM",
//                 "param4": "NRM86056006865493001L0110226123714022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.241.239",
//                 "param6": "80"
//             },
//             {
//                 "param1": "289",
//                 "param2": "2358da4e-3124-4ffc-8b45-c096ac0642a2",
//                 "param3": "11-Feb-2026 06:06:44 PM",
//                 "param4": "NRM86056006865493001L0110226123613022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.00AIRTEL",
//                 "param5": "106.222.241.239",
//                 "param6": "80"
//             },
//             {
//                 "param1": "290",
//                 "param2": "e6a75e42-fba8-4d5d-89c9-14f1bcf0972e",
//                 "param3": "11-Feb-2026 06:03:58 PM",
//                 "param4": "NRM86056006865493001L0110226123613022.655223N088.377126E404031107E000020763000.00000.0000002111S0000.00AIRTEL",
//                 "param5": "106.222.241.239",
//                 "param6": "80"
//             },
//             {
//                 "param1": "291",
//                 "param2": "a6c3e1bb-91f3-44f8-9825-7c2ee3e50413",
//                 "param3": "11-Feb-2026 06:02:55 PM",
//                 "param4": "NRM86056006865493001L0110226123513022.655223N088.377126E404031107E000020763000.00000.0000002011S0000.00AIRTEL",
//                 "param5": "106.222.241.239",
//                 "param6": "80"
//             },
//             {
//                 "param1": "292",
//                 "param2": "809d4a30-1663-4e05-a894-6a687617e501",
//                 "param3": "11-Feb-2026 06:02:04 PM",
//                 "param4": "NRM86056006865493001L0110226123412022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.241.239",
//                 "param6": "80"
//             },
//             {
//                 "param1": "293",
//                 "param2": "c3d3b674-29ce-4146-b6ce-012db974dff8",
//                 "param3": "11-Feb-2026 06:01:51 PM",
//                 "param4": "NRM86056006865493001L0110226123311022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.241.239",
//                 "param6": "80"
//             },
//             {
//                 "param1": "294",
//                 "param2": "10402f70-2e22-46e6-976d-efc0f52aff7d",
//                 "param3": "11-Feb-2026 06:01:42 PM",
//                 "param4": "NRM86056006865493001L0110226123210022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.241.239",
//                 "param6": "80"
//             },
//             {
//                 "param1": "295",
//                 "param2": "ca821b2b-e155-442b-aaf9-7445bd109876",
//                 "param3": "11-Feb-2026 06:01:35 PM",
//                 "param4": "NRM86056006865493001L0110226123109022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.241.239",
//                 "param6": "80"
//             },
//             {
//                 "param1": "296",
//                 "param2": "21dd71af-2f0e-49d7-8c51-14d6cdd36d14",
//                 "param3": "11-Feb-2026 06:01:22 PM",
//                 "param4": "NRM86056006865493001L0110226123009022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.241.239",
//                 "param6": "80"
//             },
//             {
//                 "param1": "297",
//                 "param2": "fa738d24-518e-489a-91b2-017d4a68e405",
//                 "param3": "11-Feb-2026 06:01:17 PM",
//                 "param4": "NRM86056006865493001L0110226122908022.655223N088.377126E4040310FFF000065535000.00000.0000001811S0000.00000000",
//                 "param5": "106.222.241.239",
//                 "param6": "80"
//             },
//             {
//                 "param1": "298",
//                 "param2": "23cec02a-5123-484d-a353-7da78e70a002",
//                 "param3": "11-Feb-2026 05:58:05 PM",
//                 "param4": "NRM86056006865493001L0110226122807022.655223N088.377126E404031107E000020763000.00000.0000001811S0000.00AIRTEL",
//                 "param5": "106.222.245.102",
//                 "param6": "80"
//             },
//             {
//                 "param1": "299",
//                 "param2": "dc4b3564-4da0-4590-a85f-6deff235cdc6",
//                 "param3": "11-Feb-2026 05:57:58 PM",
//                 "param4": "NRM86056006865493001L0110226122706022.655223N088.377126E404031107E000020763000.00000.0000001811S0000.00AIRTEL",
//                 "param5": "106.222.245.102",
//                 "param6": "80"
//             },
//             {
//                 "param1": "300",
//                 "param2": "484bf550-a936-4af3-bdf1-c10b0632eeaa",
//                 "param3": "11-Feb-2026 05:53:56 PM",
//                 "param4": "NRM86056006865493001L0110226122605022.655223N088.377126E404031107E000020763000.00000.0000001811S0000.00AIRTEL",
//                 "param5": "106.222.246.176",
//                 "param6": "80"
//             },
//             {
//                 "param1": "301",
//                 "param2": "adb9a99e-ebee-46ab-8bb1-12ca09974160",
//                 "param3": "11-Feb-2026 05:52:54 PM",
//                 "param4": "NRM86056006865493001L0110226122505022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.246.176",
//                 "param6": "80"
//             },
//             {
//                 "param1": "302",
//                 "param2": "777161b4-48ca-4b06-a850-48607e10c434",
//                 "param3": "11-Feb-2026 05:51:56 PM",
//                 "param4": "NRM86056006865493001L0110226122404022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.246.176",
//                 "param6": "80"
//             },
//             {
//                 "param1": "303",
//                 "param2": "b3b302db-1135-43ac-89bf-a43b941c5884",
//                 "param3": "11-Feb-2026 05:50:56 PM",
//                 "param4": "NRM86056006865493001L0110226122303022.655223N088.377126E404031107E000020763000.00000.0000001811S0000.00AIRTEL",
//                 "param5": "106.222.246.176",
//                 "param6": "80"
//             },
//             {
//                 "param1": "304",
//                 "param2": "f63a1d43-835a-4b5e-8a32-172a77914e8c",
//                 "param3": "11-Feb-2026 05:49:55 PM",
//                 "param4": "NRM86056006865493001L0110226122202022.655223N088.377126E404031107E000020763000.00000.0000001811S0000.00AIRTEL",
//                 "param5": "106.222.246.176",
//                 "param6": "80"
//             },
//             {
//                 "param1": "305",
//                 "param2": "8518b116-3048-42f7-bee6-4c1bb7c90bd0",
//                 "param3": "11-Feb-2026 05:48:55 PM",
//                 "param4": "NRM86056006865493001L0110226122101022.655223N088.377126E404031107E000020763000.00000.0000001811S0000.00AIRTEL",
//                 "param5": "106.222.246.176",
//                 "param6": "80"
//             },
//             {
//                 "param1": "306",
//                 "param2": "59fd41de-adca-4d18-90a4-18e2151aca1f",
//                 "param3": "11-Feb-2026 05:48:02 PM",
//                 "param4": "NRM86056006865493001L0110226122000022.655223N088.377126E404031107E000020763000.00000.0000001811S0000.00AIRTEL",
//                 "param5": "106.222.246.176",
//                 "param6": "80"
//             },
//             {
//                 "param1": "307",
//                 "param2": "9bb4fbe7-82ea-458f-860e-d807cefbc1a1",
//                 "param3": "11-Feb-2026 05:46:59 PM",
//                 "param4": "NRM86056006865493001L0110226121859022.655223N088.377126E404031107E000020763000.00000.0000001811S0000.00AIRTEL",
//                 "param5": "106.222.246.176",
//                 "param6": "80"
//             },
//             {
//                 "param1": "308",
//                 "param2": "3acc1aca-4a0e-4635-9ab4-dc2a58a1d7ca",
//                 "param3": "11-Feb-2026 05:46:05 PM",
//                 "param4": "NRM86056006865493001L0110226121758022.655223N088.377126E404031107E000020763000.00000.0000001811S0000.00AIRTEL",
//                 "param5": "106.222.246.176",
//                 "param6": "80"
//             },
//             {
//                 "param1": "309",
//                 "param2": "b8b5bc3e-dcca-44fe-a948-0899461c689b",
//                 "param3": "11-Feb-2026 05:44:55 PM",
//                 "param4": "NRM86056006865493001L0110226121657022.655223N088.377126E404031107E000020763000.00000.0000001811S0000.00AIRTEL",
//                 "param5": "106.222.246.176",
//                 "param6": "80"
//             },
//             {
//                 "param1": "310",
//                 "param2": "a1294e9b-84b6-42cd-bf98-b931bb6b8185",
//                 "param3": "11-Feb-2026 05:43:59 PM",
//                 "param4": "NRM86056006865493001L0110226121556022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.246.176",
//                 "param6": "80"
//             },
//             {
//                 "param1": "311",
//                 "param2": "c67f0a54-865c-447e-8340-5aea87109cde",
//                 "param3": "11-Feb-2026 05:42:53 PM",
//                 "param4": "NRM86056006865493001L0110226121455022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.246.176",
//                 "param6": "80"
//             },
//             {
//                 "param1": "312",
//                 "param2": "0aa82459-a8b2-48a4-a36e-50389742b960",
//                 "param3": "11-Feb-2026 05:41:55 PM",
//                 "param4": "NRM86056006865493001L0110226121354022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.246.176",
//                 "param6": "80"
//             },
//             {
//                 "param1": "313",
//                 "param2": "22ba2c9d-3fdd-440e-99ca-99619c85d719",
//                 "param3": "11-Feb-2026 05:40:59 PM",
//                 "param4": "NRM86056006865493001L0110226121253022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.246.176",
//                 "param6": "80"
//             },
//             {
//                 "param1": "314",
//                 "param2": "51ca75da-f1a1-46b4-a379-00bee8d036e0",
//                 "param3": "11-Feb-2026 05:39:59 PM",
//                 "param4": "NRM86056006865493001L0110226121152022.655223N088.377126E404031107E000020763000.00000.0000001811S0000.00AIRTEL",
//                 "param5": "106.222.246.176",
//                 "param6": "80"
//             },
//             {
//                 "param1": "315",
//                 "param2": "79e768ea-4945-43f1-bdc7-52750e01d01f",
//                 "param3": "11-Feb-2026 05:38:57 PM",
//                 "param4": "NRM86056006865493001L0110226121051022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.246.176",
//                 "param6": "80"
//             },
//             {
//                 "param1": "316",
//                 "param2": "125363ec-1956-4f89-bb9d-2becbf7dcd6f",
//                 "param3": "11-Feb-2026 05:38:14 PM",
//                 "param4": "FUL86056006865493025L0110226120950022.655223N088.377126E404031107E000020763000.00000.0000001711S000TDI3.1.0700000000000000000000.0000AIRTEL14107E00004176500000000004176500000000004",
//                 "param5": "106.222.246.176",
//                 "param6": "80"
//             },
//             {
//                 "param1": "317",
//                 "param2": "fcca259f-81a9-4bb4-93df-bd4ee8ecf8da",
//                 "param3": "11-Feb-2026 05:38:02 PM",
//                 "param4": "NRM86056006865493001L0110226120950022.655223N088.377126E404031107E000020763000.00000.0000001711S0000.00AIRTEL",
//                 "param5": "106.222.246.176",
//                 "param6": "80"
//             },
//             {
//                 "param1": "318",
//                 "param2": "9f171c60-05c2-4c44-8c3d-3302a0400f9c",
//                 "param3": "11-Feb-2026 05:36:57 PM",
//                 "param4": "NRM86056006865493001L0110226120849022.655223N088.377126E404031107E000020763000.00000.0000001711S0000.00AIRTEL",
//                 "param5": "106.222.246.176",
//                 "param6": "80"
//             },
//             {
//                 "param1": "319",
//                 "param2": "7b756974-d10a-48b7-99d0-b6e8939064de",
//                 "param3": "11-Feb-2026 05:35:57 PM",
//                 "param4": "NRM86056006865493001L0110226120748022.655223N088.377126E404031107E000020763000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.246.176",
//                 "param6": "80"
//             },
//             {
//                 "param1": "320",
//                 "param2": "cea654b6-1e2f-4b65-bb67-fe79bc6f52bf",
//                 "param3": "11-Feb-2026 05:35:13 PM",
//                 "param4": "NRM86056006865493001L0110226120647022.655223N088.377126E4040311091000038311000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.241.127",
//                 "param6": "80"
//             },
//             {
//                 "param1": "321",
//                 "param2": "03f39380-5abf-4374-9839-2350c036f083",
//                 "param3": "11-Feb-2026 05:35:07 PM",
//                 "param4": "NRM86056006865493001L0110226120546022.655223N088.377126E4040311091000038311000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.241.127",
//                 "param6": "80"
//             },
//             {
//                 "param1": "322",
//                 "param2": "2ced5f2d-1124-422b-be72-2f9a5ab5acbb",
//                 "param3": "11-Feb-2026 05:34:48 PM",
//                 "param4": "NRM86056006865493001L0110226120445022.655223N088.377126E4040311091000006323000.00000.0000001711S0000.00AIRTEL",
//                 "param5": "106.222.244.47",
//                 "param6": "80"
//             },
//             {
//                 "param1": "323",
//                 "param2": "04f0a1d6-8ab6-40e8-8c6c-0d3c5b9a0390",
//                 "param3": "11-Feb-2026 05:34:29 PM",
//                 "param4": "NRM86056006865493001L0110226120344022.655223N088.377126E4040311091000006323000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.244.47",
//                 "param6": "80"
//             },
//             {
//                 "param1": "324",
//                 "param2": "becdf937-029e-45ba-97a6-26936c763436",
//                 "param3": "11-Feb-2026 05:34:20 PM",
//                 "param4": "NRM86056006865493001L0110226120243022.655223N088.377126E4040311091000006323000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.244.47",
//                 "param6": "80"
//             },
//             {
//                 "param1": "325",
//                 "param2": "232ec427-99a6-453d-9741-ff4dcab6a678",
//                 "param3": "11-Feb-2026 05:34:17 PM",
//                 "param4": "NRM86056006865493001L0110226120142022.655223N088.377126E4040311091000006323000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.244.47",
//                 "param6": "80"
//             },
//             {
//                 "param1": "326",
//                 "param2": "daeb7da8-168e-4d69-aa28-48136e610979",
//                 "param3": "11-Feb-2026 05:34:14 PM",
//                 "param4": "NRM86056006865493001L0110226120041022.655223N088.377126E4040311091000006323000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.244.47",
//                 "param6": "80"
//             },
//             {
//                 "param1": "327",
//                 "param2": "37e43489-2b16-497a-aac8-46124a34dc26",
//                 "param3": "11-Feb-2026 05:34:08 PM",
//                 "param4": "NRM86056006865493001L0110226115940022.655223N088.377126E4040311091000006323000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.244.47",
//                 "param6": "80"
//             },
//             {
//                 "param1": "328",
//                 "param2": "da94fda4-8538-4cff-8e9f-a0dce13d024f",
//                 "param3": "11-Feb-2026 05:34:05 PM",
//                 "param4": "NRM86056006865493001L0110226115839022.655223N088.377126E4040310FFF000065535000.00000.0000001911S0000.00000000",
//                 "param5": "106.222.244.47",
//                 "param6": "80"
//             },
//             {
//                 "param1": "329",
//                 "param2": "4fbcff97-9ade-496b-80ee-8658b6baa29a",
//                 "param3": "11-Feb-2026 05:34:01 PM",
//                 "param4": "NRM86056006865493001L0110226115738022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.244.47",
//                 "param6": "80"
//             },
//             {
//                 "param1": "330",
//                 "param2": "0a69e5f8-41e8-4d45-aac9-8c814d558c43",
//                 "param3": "11-Feb-2026 05:33:57 PM",
//                 "param4": "NRM86056006865493001L0110226115637022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.244.47",
//                 "param6": "80"
//             },
//             {
//                 "param1": "331",
//                 "param2": "dd68d670-6fa8-4d89-a5ac-a46a1118503d",
//                 "param3": "11-Feb-2026 05:23:54 PM",
//                 "param4": "NRM86056006865493001L0110226115536022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.246.161",
//                 "param6": "80"
//             },
//             {
//                 "param1": "332",
//                 "param2": "5986cde6-4488-4729-b30b-7ce6376d2ede",
//                 "param3": "11-Feb-2026 05:22:53 PM",
//                 "param4": "NRM86056006865493001L0110226115435022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.246.161",
//                 "param6": "80"
//             },
//             {
//                 "param1": "333",
//                 "param2": "fdeab7e1-6d51-4542-abbe-c2816a4f1ed0",
//                 "param3": "11-Feb-2026 05:21:54 PM",
//                 "param4": "NRM86056006865493001L0110226115334022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.246.161",
//                 "param6": "80"
//             },
//             {
//                 "param1": "334",
//                 "param2": "3d663756-5981-4a0c-bda1-bb59f216f6ed",
//                 "param3": "11-Feb-2026 05:20:52 PM",
//                 "param4": "NRM86056006865493001L0110226115233022.655223N088.377126E404031107E000020763000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.244.11",
//                 "param6": "80"
//             },
//             {
//                 "param1": "335",
//                 "param2": "135aba31-a779-405a-8350-ffb013c01871",
//                 "param3": "11-Feb-2026 05:19:54 PM",
//                 "param4": "NRM86056006865493001L0110226115133022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.244.11",
//                 "param6": "80"
//             },
//             {
//                 "param1": "336",
//                 "param2": "5ee3371e-695e-439f-93f7-3bc6b5ca7950",
//                 "param3": "11-Feb-2026 05:19:00 PM",
//                 "param4": "NRM86056006865493001L0110226115032022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.244.11",
//                 "param6": "80"
//             },
//             {
//                 "param1": "337",
//                 "param2": "739a3389-0af0-44b0-890a-47b2c299a59f",
//                 "param3": "11-Feb-2026 05:17:54 PM",
//                 "param4": "NRM86056006865493001L0110226114931022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.244.11",
//                 "param6": "80"
//             },
//             {
//                 "param1": "338",
//                 "param2": "201ce6d4-ab45-4d2d-82b8-7434348f0854",
//                 "param3": "11-Feb-2026 05:16:56 PM",
//                 "param4": "NRM86056006865493001L0110226114830022.655223N088.377126E404031107E000020763000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.244.11",
//                 "param6": "80"
//             },
//             {
//                 "param1": "339",
//                 "param2": "71fb9047-bd96-418e-aad7-bb9fc557757f",
//                 "param3": "11-Feb-2026 05:15:54 PM",
//                 "param4": "NRM86056006865493001L0110226114729022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.244.11",
//                 "param6": "80"
//             },
//             {
//                 "param1": "340",
//                 "param2": "66ee0a34-6686-4b23-99b7-78cd4e9c7a41",
//                 "param3": "11-Feb-2026 05:14:57 PM",
//                 "param4": "NRM86056006865493001L0110226114628022.655223N088.377126E404031107E000020763000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.244.11",
//                 "param6": "80"
//             },
//             {
//                 "param1": "341",
//                 "param2": "429dd885-d42a-41fe-a669-8a39633b844d",
//                 "param3": "11-Feb-2026 05:13:53 PM",
//                 "param4": "NRM86056006865493001L0110226114527022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.240.127",
//                 "param6": "80"
//             },
//             {
//                 "param1": "342",
//                 "param2": "3fe023ab-4d87-459c-9ecf-7912bfd225d7",
//                 "param3": "11-Feb-2026 05:12:58 PM",
//                 "param4": "NRM86056006865493001L0110226114426022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.240.127",
//                 "param6": "80"
//             },
//             {
//                 "param1": "343",
//                 "param2": "51b458b9-be2a-407b-8900-fc2bd916e461",
//                 "param3": "11-Feb-2026 05:11:56 PM",
//                 "param4": "NRM86056006865493001L0110226114325022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.240.127",
//                 "param6": "80"
//             },
//             {
//                 "param1": "344",
//                 "param2": "c615b1b4-123b-477d-a7df-3ca95142228c",
//                 "param3": "11-Feb-2026 05:10:55 PM",
//                 "param4": "NRM86056006865493001L0110226114224022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.240.127",
//                 "param6": "80"
//             },
//             {
//                 "param1": "345",
//                 "param2": "c6ea937a-0710-408e-be2c-3c2e736c68ae",
//                 "param3": "11-Feb-2026 05:09:56 PM",
//                 "param4": "NRM86056006865493001L0110226114123022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.244.123",
//                 "param6": "80"
//             },
//             {
//                 "param1": "346",
//                 "param2": "7c4621d8-f48b-4542-9c0b-d5eaf7349ba3",
//                 "param3": "11-Feb-2026 05:08:53 PM",
//                 "param4": "NRM86056006865493001L0110226114022022.655223N088.377126E404031107E000020763000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.244.123",
//                 "param6": "80"
//             },
//             {
//                 "param1": "347",
//                 "param2": "97e85c55-1aeb-4e95-9a6d-64246ec55da2",
//                 "param3": "11-Feb-2026 05:07:53 PM",
//                 "param4": "NRM86056006865493001L0110226113921022.655223N088.377126E404031107E000020763000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.244.123",
//                 "param6": "80"
//             },
//             {
//                 "param1": "348",
//                 "param2": "2eb046ef-b9fc-494a-9666-df1170e2d13e",
//                 "param3": "11-Feb-2026 05:07:08 PM",
//                 "param4": "NRM86056006865493001L0110226113820022.655223N088.377126E404031107E000020763000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.244.123",
//                 "param6": "80"
//             },
//             {
//                 "param1": "349",
//                 "param2": "f85fbdcf-c844-4d23-8659-a982d78fa639",
//                 "param3": "11-Feb-2026 05:05:53 PM",
//                 "param4": "NRM86056006865493001L0110226113719022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.244.123",
//                 "param6": "80"
//             },
//             {
//                 "param1": "350",
//                 "param2": "260c880a-c3f0-44b7-9585-91708820b9af",
//                 "param3": "11-Feb-2026 05:04:54 PM",
//                 "param4": "NRM86056006865493001L0110226113618022.655223N088.377126E404031107E000020763000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.244.123",
//                 "param6": "80"
//             },
//             {
//                 "param1": "351",
//                 "param2": "3c2e206a-4fc9-4950-a364-db3b4f645cb3",
//                 "param3": "11-Feb-2026 05:03:58 PM",
//                 "param4": "NRM86056006865493001L0110226113517022.655223N088.377126E404031107E000020763000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.244.123",
//                 "param6": "80"
//             },
//             {
//                 "param1": "352",
//                 "param2": "64670f8b-7351-4e67-af67-daee9e0753e9",
//                 "param3": "11-Feb-2026 05:02:55 PM",
//                 "param4": "NRM86056006865493001L0110226113417022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.245.34",
//                 "param6": "80"
//             },
//             {
//                 "param1": "353",
//                 "param2": "c8cc29e1-7ea8-4bc4-863b-817f43c512dc",
//                 "param3": "11-Feb-2026 05:02:05 PM",
//                 "param4": "NRM86056006865493001L0110226113316022.655223N088.377126E404031107E000020763000.00000.0000001311S0000.00AIRTEL",
//                 "param5": "106.222.245.34",
//                 "param6": "80"
//             },
//             {
//                 "param1": "354",
//                 "param2": "76a6bd1c-d65e-4fc3-af48-4073975916e2",
//                 "param3": "11-Feb-2026 05:01:52 PM",
//                 "param4": "NRM86056006865493001L0110226113215022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.245.34",
//                 "param6": "80"
//             },
//             {
//                 "param1": "355",
//                 "param2": "b5540df0-05fc-44d3-80bc-aaf6924d3097",
//                 "param3": "11-Feb-2026 05:01:47 PM",
//                 "param4": "NRM86056006865493001L0110226113114022.655223N088.377126E404031107E000020763000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.245.34",
//                 "param6": "80"
//             },
//             {
//                 "param1": "356",
//                 "param2": "858e0998-4eaa-4e7f-968e-6924c7c597fc",
//                 "param3": "11-Feb-2026 05:01:43 PM",
//                 "param4": "NRM86056006865493001L0110226113013022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.245.34",
//                 "param6": "80"
//             },
//             {
//                 "param1": "357",
//                 "param2": "fb35b4e6-8331-4844-9ab1-6deea8e488a0",
//                 "param3": "11-Feb-2026 04:57:54 PM",
//                 "param4": "NRM86056006865493001L0110226112912022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.246.63",
//                 "param6": "80"
//             },
//             {
//                 "param1": "358",
//                 "param2": "e7f451ef-0716-46c8-b027-1a68a5895009",
//                 "param3": "11-Feb-2026 04:56:55 PM",
//                 "param4": "NRM86056006865493001L0110226112811022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.246.63",
//                 "param6": "80"
//             },
//             {
//                 "param1": "359",
//                 "param2": "5c5e8c1d-00af-4757-be06-bb6cb960f876",
//                 "param3": "11-Feb-2026 04:55:54 PM",
//                 "param4": "NRM86056006865493001L0110226112710022.655223N088.377126E404031107E000020763000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.246.63",
//                 "param6": "80"
//             },
//             {
//                 "param1": "360",
//                 "param2": "e61cfbf7-4443-4223-a79e-8e17f87568af",
//                 "param3": "11-Feb-2026 04:54:54 PM",
//                 "param4": "NRM86056006865493001L0110226112610022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.246.63",
//                 "param6": "80"
//             },
//             {
//                 "param1": "361",
//                 "param2": "06fe712d-e207-481e-9fa2-d22971983314",
//                 "param3": "11-Feb-2026 04:54:00 PM",
//                 "param4": "NRM86056006865493001L0110226112509022.655223N088.377126E404031107E000020763000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.246.63",
//                 "param6": "80"
//             },
//             {
//                 "param1": "362",
//                 "param2": "fc92f6f9-bc0a-4677-850b-232ef6ff6222",
//                 "param3": "11-Feb-2026 04:52:53 PM",
//                 "param4": "NRM86056006865493001L0110226112408022.655223N088.377126E404031107E000020763000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.246.63",
//                 "param6": "80"
//             },
//             {
//                 "param1": "363",
//                 "param2": "e3157a15-4293-409b-833d-4409436dcb19",
//                 "param3": "11-Feb-2026 04:51:55 PM",
//                 "param4": "NRM86056006865493001L0110226112307022.655223N088.377126E404031107E000020763000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.246.63",
//                 "param6": "80"
//             },
//             {
//                 "param1": "364",
//                 "param2": "ee1a5a2c-2233-4e72-a5ce-ee02ed8575cd",
//                 "param3": "11-Feb-2026 04:50:55 PM",
//                 "param4": "NRM86056006865493001L0110226112206022.655223N088.377126E404031107E000020763000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.246.63",
//                 "param6": "80"
//             },
//             {
//                 "param1": "365",
//                 "param2": "5cc4574e-77c7-4fa8-a37a-785ea20a5b41",
//                 "param3": "11-Feb-2026 04:49:53 PM",
//                 "param4": "NRM86056006865493001L0110226112106022.655223N088.377126E404031107E000020763000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.246.63",
//                 "param6": "80"
//             },
//             {
//                 "param1": "366",
//                 "param2": "615a0859-2849-4ef9-8fdf-07af936f00f1",
//                 "param3": "11-Feb-2026 04:48:55 PM",
//                 "param4": "NRM86056006865493001L0110226112005022.655223N088.377126E404031107E000020763000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.246.71",
//                 "param6": "80"
//             },
//             {
//                 "param1": "367",
//                 "param2": "8ba10afd-3953-4d62-97f1-90415b0364e1",
//                 "param3": "11-Feb-2026 04:47:55 PM",
//                 "param4": "NRM86056006865493001L0110226111904022.655223N088.377126E404031107E000020763000.00000.0000001311S0000.00AIRTEL",
//                 "param5": "106.222.246.71",
//                 "param6": "80"
//             },
//             {
//                 "param1": "368",
//                 "param2": "bc6ef816-e3f4-43cf-a34f-fe7d10f3f202",
//                 "param3": "11-Feb-2026 04:47:04 PM",
//                 "param4": "NRM86056006865493001L0110226111803022.655223N088.377126E404031107E000020763000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.246.71",
//                 "param6": "80"
//             },
//             {
//                 "param1": "369",
//                 "param2": "64d78aba-e869-4d7d-ba26-bbf237ee988f",
//                 "param3": "11-Feb-2026 04:45:58 PM",
//                 "param4": "NRM86056006865493001L0110226111702022.655223N088.377126E404031107E000020763000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.246.71",
//                 "param6": "80"
//             },
//             {
//                 "param1": "370",
//                 "param2": "aaa39968-ebf4-4f80-bfda-9da857a0ff7c",
//                 "param3": "11-Feb-2026 04:44:54 PM",
//                 "param4": "NRM86056006865493001L0110226111602022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.240.3",
//                 "param6": "80"
//             },
//             {
//                 "param1": "371",
//                 "param2": "64f8a5fb-e10d-426e-a066-ba406f0d9e1e",
//                 "param3": "11-Feb-2026 04:43:53 PM",
//                 "param4": "NRM86056006865493001L0110226111501022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.240.3",
//                 "param6": "80"
//             },
//             {
//                 "param1": "372",
//                 "param2": "b4726981-01b4-4eab-81f7-f2e91fd0a0bf",
//                 "param3": "11-Feb-2026 04:42:53 PM",
//                 "param4": "NRM86056006865493001L0110226111400022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.240.3",
//                 "param6": "80"
//             },
//             {
//                 "param1": "373",
//                 "param2": "b0ed0f0c-6462-4fc7-991d-0263fcd7c906",
//                 "param3": "11-Feb-2026 04:41:55 PM",
//                 "param4": "NRM86056006865493001L0110226111259022.655223N088.377126E404031107E000020763000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.240.3",
//                 "param6": "80"
//             },
//             {
//                 "param1": "374",
//                 "param2": "3c31202b-e02a-41be-9eea-b67b8c8305e3",
//                 "param3": "11-Feb-2026 04:40:53 PM",
//                 "param4": "NRM86056006865493001L0110226111159022.655223N088.377126E404031107E000020763000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.244.249",
//                 "param6": "80"
//             },
//             {
//                 "param1": "375",
//                 "param2": "aa76ce56-0385-41f5-87cc-b6eb617f70ad",
//                 "param3": "11-Feb-2026 04:39:53 PM",
//                 "param4": "NRM86056006865493001L0110226111058022.655223N088.377126E404031107E000020763000.00000.0000001311S0000.00AIRTEL",
//                 "param5": "106.222.244.249",
//                 "param6": "80"
//             },
//             {
//                 "param1": "376",
//                 "param2": "6fd560c7-2e08-4c48-8d31-f0b2dc303e18",
//                 "param3": "11-Feb-2026 04:38:53 PM",
//                 "param4": "NRM86056006865493001L0110226110957022.655223N088.377126E404031107E000020763000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.244.249",
//                 "param6": "80"
//             },
//             {
//                 "param1": "377",
//                 "param2": "903b1741-dbe0-4d01-9758-98a04714104f",
//                 "param3": "11-Feb-2026 04:37:51 PM",
//                 "param4": "NRM86056006865493001L0110226110856022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.246.199",
//                 "param6": "80"
//             },
//             {
//                 "param1": "378",
//                 "param2": "1ac75d40-d4ae-4d72-8a3b-85f8740de0b1",
//                 "param3": "11-Feb-2026 04:36:57 PM",
//                 "param4": "NRM86056006865493001L0110226110756022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.246.199",
//                 "param6": "80"
//             },
//             {
//                 "param1": "379",
//                 "param2": "1245ccf5-904b-4fda-af77-c8b4afe18952",
//                 "param3": "11-Feb-2026 04:35:56 PM",
//                 "param4": "NRM86056006865493001L0110226110655022.655223N088.377126E404031107E000020763000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.246.199",
//                 "param6": "80"
//             },
//             {
//                 "param1": "380",
//                 "param2": "08034a77-88ce-497b-ba26-d926dddf870e",
//                 "param3": "11-Feb-2026 04:34:53 PM",
//                 "param4": "NRM86056006865493001L0110226110554022.655223N088.377126E404031107E000020763000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.246.199",
//                 "param6": "80"
//             },
//             {
//                 "param1": "381",
//                 "param2": "87cefd78-e501-46b4-aa7c-1bfbfd005fca",
//                 "param3": "11-Feb-2026 04:33:52 PM",
//                 "param4": "NRM86056006865493001L0110226110454022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.246.199",
//                 "param6": "80"
//             },
//             {
//                 "param1": "382",
//                 "param2": "2d305557-1aa9-42a6-9283-5ddac47b5475",
//                 "param3": "11-Feb-2026 04:32:53 PM",
//                 "param4": "NRM86056006865493001L0110226110353022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.246.199",
//                 "param6": "80"
//             },
//             {
//                 "param1": "383",
//                 "param2": "eaf9510a-dccd-4ed9-bfc7-65c2886b5316",
//                 "param3": "11-Feb-2026 04:31:54 PM",
//                 "param4": "NRM86056006865493001L0110226110252022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.246.199",
//                 "param6": "80"
//             },
//             {
//                 "param1": "384",
//                 "param2": "ffd28fd7-6dcd-4b94-af6d-824d622de394",
//                 "param3": "11-Feb-2026 04:30:57 PM",
//                 "param4": "NRM86056006865493001L0110226110152022.655223N088.377126E404031107E000020763000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.246.199",
//                 "param6": "80"
//             },
//             {
//                 "param1": "385",
//                 "param2": "d231cc38-15da-4c44-bdeb-49301f4e6f00",
//                 "param3": "11-Feb-2026 04:29:53 PM",
//                 "param4": "NRM86056006865493001L0110226110051022.655223N088.377126E404031107E000020763000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.246.199",
//                 "param6": "80"
//             },
//             {
//                 "param1": "386",
//                 "param2": "9546986c-f94a-4915-bd92-9f90c626f670",
//                 "param3": "11-Feb-2026 04:28:55 PM",
//                 "param4": "NRM86056006865493001L0110226105950022.655223N088.377126E404031107E000020763000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.246.199",
//                 "param6": "80"
//             },
//             {
//                 "param1": "387",
//                 "param2": "9ff8004e-4fbd-483e-af9e-41de7e851769",
//                 "param3": "11-Feb-2026 04:27:54 PM",
//                 "param4": "NRM86056006865493001L0110226105850022.655223N088.377126E404031107E000020763000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.246.199",
//                 "param6": "80"
//             },
//             {
//                 "param1": "388",
//                 "param2": "5cbd4d14-115f-4bf1-84fd-eb530e22bec9",
//                 "param3": "11-Feb-2026 04:26:53 PM",
//                 "param4": "NRM86056006865493001L0110226105749022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.241.154",
//                 "param6": "80"
//             },
//             {
//                 "param1": "389",
//                 "param2": "e06c799c-05dd-49f0-b206-27bc84ca942a",
//                 "param3": "11-Feb-2026 04:25:58 PM",
//                 "param4": "NRM86056006865493001L0110226105648022.655223N088.377126E404031107E000020763000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.241.154",
//                 "param6": "80"
//             },
//             {
//                 "param1": "390",
//                 "param2": "34addfe3-b319-422a-b0e2-1f8648468c4b",
//                 "param3": "11-Feb-2026 04:24:54 PM",
//                 "param4": "NRM86056006865493001L0110226105548022.655223N088.377126E404031107E000020763000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.241.154",
//                 "param6": "80"
//             },
//             {
//                 "param1": "391",
//                 "param2": "d776aa2f-8f2d-4f7b-9ba4-443d2c88e9a5",
//                 "param3": "11-Feb-2026 04:23:54 PM",
//                 "param4": "NRM86056006865493001L0110226105447022.655223N088.377126E404031107E000020763000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.241.154",
//                 "param6": "80"
//             },
//             {
//                 "param1": "392",
//                 "param2": "e77d71bc-badf-4292-8a20-77e75594092c",
//                 "param3": "11-Feb-2026 04:22:56 PM",
//                 "param4": "NRM86056006865493001L0110226105347022.655223N088.377126E404031107E000020763000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.243.121",
//                 "param6": "80"
//             },
//             {
//                 "param1": "393",
//                 "param2": "e16caf2b-2535-4729-9346-19a365b602a7",
//                 "param3": "11-Feb-2026 04:21:52 PM",
//                 "param4": "NRM86056006865493001L0110226105246022.655223N088.377126E404031107E000020763000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.243.121",
//                 "param6": "80"
//             },
//             {
//                 "param1": "394",
//                 "param2": "f12032e9-a5e8-4331-bef1-d93b1afdd5f7",
//                 "param3": "11-Feb-2026 04:20:54 PM",
//                 "param4": "NRM86056006865493001L0110226105145022.655223N088.377126E404031107E000020763000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.243.121",
//                 "param6": "80"
//             },
//             {
//                 "param1": "395",
//                 "param2": "43dbae73-7eb1-4d3a-944e-b2287f3a2230",
//                 "param3": "11-Feb-2026 04:19:54 PM",
//                 "param4": "NRM86056006865493001L0110226105045022.655223N088.377126E404031107E000020763000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.243.121",
//                 "param6": "80"
//             },
//             {
//                 "param1": "396",
//                 "param2": "2799554a-bf02-49b8-a43e-9815f0eb0f38",
//                 "param3": "11-Feb-2026 04:18:56 PM",
//                 "param4": "NRM86056006865493001L0110226104944022.655223N088.377126E404031107E000020763000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.244.215",
//                 "param6": "80"
//             },
//             {
//                 "param1": "397",
//                 "param2": "78355208-15bc-4c9c-bc5e-7aab3863dfc9",
//                 "param3": "11-Feb-2026 04:17:53 PM",
//                 "param4": "NRM86056006865493001L0110226104844022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.244.215",
//                 "param6": "80"
//             },
//             {
//                 "param1": "398",
//                 "param2": "55cbc984-a271-4c47-9290-7e94bc7177a2",
//                 "param3": "11-Feb-2026 04:16:54 PM",
//                 "param4": "NRM86056006865493001L0110226104743022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.244.215",
//                 "param6": "80"
//             },
//             {
//                 "param1": "399",
//                 "param2": "956a8e58-34c8-4de6-8783-a92d8906efb9",
//                 "param3": "11-Feb-2026 04:15:56 PM",
//                 "param4": "NRM86056006865493001L0110226104643022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.245.41",
//                 "param6": "80"
//             },
//             {
//                 "param1": "400",
//                 "param2": "12ed5c5a-6e32-4b73-aa32-fe7137ecc7ba",
//                 "param3": "11-Feb-2026 04:14:54 PM",
//                 "param4": "NRM86056006865493001L0110226104542022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.245.41",
//                 "param6": "80"
//             },
//             {
//                 "param1": "401",
//                 "param2": "e4b6b462-6f1c-43c9-86ef-5aa34a182506",
//                 "param3": "11-Feb-2026 04:14:00 PM",
//                 "param4": "NRM86056006865493001L0110226104442022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.245.41",
//                 "param6": "80"
//             },
//             {
//                 "param1": "402",
//                 "param2": "a6968a01-718f-447e-8a84-608ebbe7df4a",
//                 "param3": "11-Feb-2026 04:12:55 PM",
//                 "param4": "NRM86056006865493001L0110226104341022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.245.41",
//                 "param6": "80"
//             },
//             {
//                 "param1": "403",
//                 "param2": "8d84d74d-fcef-408f-a2e0-348b942b43cd",
//                 "param3": "11-Feb-2026 04:11:53 PM",
//                 "param4": "NRM86056006865493001L0110226104240022.655223N088.377126E404031107E000020763000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.245.41",
//                 "param6": "80"
//             },
//             {
//                 "param1": "404",
//                 "param2": "45daff65-f3e4-40f3-93dd-59009dc0c88d",
//                 "param3": "11-Feb-2026 04:10:53 PM",
//                 "param4": "NRM86056006865493001L0110226104140022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.245.41",
//                 "param6": "80"
//             },
//             {
//                 "param1": "405",
//                 "param2": "38c638ed-b640-48b9-b0f4-c24d4e6bb167",
//                 "param3": "11-Feb-2026 04:09:54 PM",
//                 "param4": "NRM86056006865493001L0110226104039022.655223N088.377126E404031107E000020763000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.245.41",
//                 "param6": "80"
//             },
//             {
//                 "param1": "406",
//                 "param2": "b772c653-ca66-402f-ac18-1eec7b300db3",
//                 "param3": "11-Feb-2026 04:09:06 PM",
//                 "param4": "NRM86056006865493001L0110226103939022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.245.41",
//                 "param6": "80"
//             },
//             {
//                 "param1": "407",
//                 "param2": "c4555a9f-bc3c-43d8-b371-3b1fc1cd6149",
//                 "param3": "11-Feb-2026 04:07:56 PM",
//                 "param4": "NRM86056006865493001L0110226103838022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.245.41",
//                 "param6": "80"
//             },
//             {
//                 "param1": "408",
//                 "param2": "95215b82-32f9-4e9d-a914-193e78ae7191",
//                 "param3": "11-Feb-2026 04:06:54 PM",
//                 "param4": "NRM86056006865493001L0110226103738022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.245.41",
//                 "param6": "80"
//             },
//             {
//                 "param1": "409",
//                 "param2": "cf44a849-48a2-4037-a5e2-165e92227dda",
//                 "param3": "11-Feb-2026 04:05:54 PM",
//                 "param4": "NRM86056006865493001L0110226103637022.655223N088.377126E404031107E000020763000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.245.41",
//                 "param6": "80"
//             },
//             {
//                 "param1": "410",
//                 "param2": "d51d1e19-8596-46cf-89fa-893205399925",
//                 "param3": "11-Feb-2026 04:04:54 PM",
//                 "param4": "NRM86056006865493001L0110226103537022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.245.41",
//                 "param6": "80"
//             },
//             {
//                 "param1": "411",
//                 "param2": "71a567ff-859c-4c4d-acfb-1460867f3ade",
//                 "param3": "11-Feb-2026 04:04:41 PM",
//                 "param4": "NRM86056006865493001L0110226103436022.655223N088.377126E404031107E000020763000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.245.41",
//                 "param6": "80"
//             },
//             {
//                 "param1": "412",
//                 "param2": "71e3b4f3-f54c-437b-9ee1-1140bebbf915",
//                 "param3": "11-Feb-2026 04:04:38 PM",
//                 "param4": "NRM86056006865493001L0110226103236022.655223N088.377126E404031107E000020763000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.245.41",
//                 "param6": "80"
//             },
//             {
//                 "param1": "413",
//                 "param2": "997045e8-7cfa-471a-8531-7067dc61c75d",
//                 "param3": "11-Feb-2026 04:02:06 PM",
//                 "param4": "NRM86056006865493001L0110226103236022.655223N088.377126E404031107E000020763000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.245.41",
//                 "param6": "80"
//             },
//             {
//                 "param1": "414",
//                 "param2": "184bf070-44ee-414e-856e-91c3fbef315d",
//                 "param3": "11-Feb-2026 04:00:55 PM",
//                 "param4": "NRM86056006865493001L0110226103135022.655223N088.377126E404031107E000020763000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.245.41",
//                 "param6": "80"
//             },
//             {
//                 "param1": "415",
//                 "param2": "89cf56cf-ce20-476f-94a2-5c5d38d9367b",
//                 "param3": "11-Feb-2026 03:59:54 PM",
//                 "param4": "NRM86056006865493001L0110226103035022.655223N088.377126E404031107E000020763000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.245.41",
//                 "param6": "80"
//             },
//             {
//                 "param1": "416",
//                 "param2": "1cfa960f-d734-4c61-93e2-79d98f5a83f8",
//                 "param3": "11-Feb-2026 03:58:53 PM",
//                 "param4": "NRM86056006865493001L0110226102934022.655223N088.377126E404031107E000020763000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.245.41",
//                 "param6": "80"
//             },
//             {
//                 "param1": "417",
//                 "param2": "d3ae6d62-8ea3-4ed9-8c09-01152cb27579",
//                 "param3": "11-Feb-2026 03:57:56 PM",
//                 "param4": "NRM86056006865493001L0110226102834022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.245.41",
//                 "param6": "80"
//             },
//             {
//                 "param1": "418",
//                 "param2": "0c1c24e5-6c87-4dcd-927c-f3affe212370",
//                 "param3": "11-Feb-2026 03:56:54 PM",
//                 "param4": "NRM86056006865493001L0110226102733022.655223N088.377126E404031107E000020763000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.245.41",
//                 "param6": "80"
//             },
//             {
//                 "param1": "419",
//                 "param2": "db0015e4-96fb-42c6-a2d9-ae453b703178",
//                 "param3": "11-Feb-2026 03:55:53 PM",
//                 "param4": "NRM86056006865493001L0110226102633022.655223N088.377126E404031107E000020763000.00000.0000001711S0000.00AIRTEL",
//                 "param5": "106.222.245.41",
//                 "param6": "80"
//             },
//             {
//                 "param1": "420",
//                 "param2": "06a588bc-65c4-4cd5-9f45-c8d51e8b7a57",
//                 "param3": "11-Feb-2026 03:54:53 PM",
//                 "param4": "NRM86056006865493001L0110226102532022.655223N088.377126E404031107E000020763000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.245.41",
//                 "param6": "80"
//             },
//             {
//                 "param1": "421",
//                 "param2": "86528b7f-2318-4fbc-9dc3-e2152dd0894c",
//                 "param3": "11-Feb-2026 03:53:54 PM",
//                 "param4": "NRM86056006865493001L0110226102432022.655223N088.377126E404031107E000020763000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.245.41",
//                 "param6": "80"
//             },
//             {
//                 "param1": "422",
//                 "param2": "f9dd1fb9-35a8-4ce1-a761-9867c4746fcf",
//                 "param3": "11-Feb-2026 03:52:53 PM",
//                 "param4": "NRM86056006865493001L0110226102331022.655223N088.377126E404031107E000020763000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.245.41",
//                 "param6": "80"
//             },
//             {
//                 "param1": "423",
//                 "param2": "5a3ed4ff-58c1-4aee-b7a5-8e9eb9ea09b2",
//                 "param3": "11-Feb-2026 03:51:55 PM",
//                 "param4": "NRM86056006865493001L0110226102231022.655223N088.377126E404031107E000020763000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.245.41",
//                 "param6": "80"
//             },
//             {
//                 "param1": "424",
//                 "param2": "dc4e3072-ac1e-43e2-89d5-ac50e564124b",
//                 "param3": "11-Feb-2026 03:50:55 PM",
//                 "param4": "NRM86056006865493001L0110226102131022.655223N088.377126E404031107E000020763000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.245.41",
//                 "param6": "80"
//             },
//             {
//                 "param1": "425",
//                 "param2": "30b424f4-7996-4d74-a6c5-4fd4e75026cd",
//                 "param3": "11-Feb-2026 03:50:01 PM",
//                 "param4": "NRM86056006865493001L0110226102030022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.242.126",
//                 "param6": "80"
//             },
//             {
//                 "param1": "426",
//                 "param2": "4bb4e8b2-0d69-487d-b11c-a0efe234d907",
//                 "param3": "11-Feb-2026 03:48:58 PM",
//                 "param4": "NRM86056006865493001L0110226101930022.655223N088.377126E404031107E000020763000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.242.126",
//                 "param6": "80"
//             },
//             {
//                 "param1": "427",
//                 "param2": "76f4f385-160b-4063-a558-a5da21b2121e",
//                 "param3": "11-Feb-2026 03:48:06 PM",
//                 "param4": "NRM86056006865493001L0110226101829022.655223N088.377126E404031107E000020763000.00000.0000001911S0000.00AIRTEL",
//                 "param5": "106.222.242.126",
//                 "param6": "80"
//             },
//             {
//                 "param1": "428",
//                 "param2": "02320519-3437-4c01-a7d3-cc617b8dcaea",
//                 "param3": "11-Feb-2026 03:47:53 PM",
//                 "param4": "NRM86056006865493001L0110226101729022.655223N088.377126E4040310FFF000065535000.00000.0000001911S0000.00000000",
//                 "param5": "106.222.242.126",
//                 "param6": "80"
//             },
//             {
//                 "param1": "429",
//                 "param2": "0ce99a12-fd6d-4fcc-9036-791c843d8f04",
//                 "param3": "11-Feb-2026 03:47:48 PM",
//                 "param4": "NRM86056006865493001L0110226101628022.655223N088.377126E4040310FFF000065535000.00000.0000001411S0000.00000000",
//                 "param5": "106.222.242.126",
//                 "param6": "80"
//             },
//             {
//                 "param1": "430",
//                 "param2": "c385ccc5-704d-4243-9b9d-2b1c51721054",
//                 "param3": "11-Feb-2026 03:47:44 PM",
//                 "param4": "NRM86056006865493001L0110226101528022.655223N088.377126E404031107E000020763000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.242.126",
//                 "param6": "80"
//             },
//             {
//                 "param1": "431",
//                 "param2": "ae8a5252-efd1-4c58-ba4d-65563b252934",
//                 "param3": "11-Feb-2026 03:47:37 PM",
//                 "param4": "NRM86056006865493001L0110226101428022.655223N088.377126E404031107E000020763000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.242.126",
//                 "param6": "80"
//             },
//             {
//                 "param1": "432",
//                 "param2": "af97cb79-9c5b-456a-97e3-141082749ca1",
//                 "param3": "11-Feb-2026 03:42:58 PM",
//                 "param4": "NRM86056006865493001L0110226101327022.655223N088.377126E404031107E000020763000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.245.234",
//                 "param6": "80"
//             },
//             {
//                 "param1": "433",
//                 "param2": "90c948cb-f14c-4836-a69f-ff6120957b29",
//                 "param3": "11-Feb-2026 03:42:00 PM",
//                 "param4": "NRM86056006865493001L0110226101227022.655223N088.377126E404031107E000020763000.00000.0000001811S0000.00AIRTEL",
//                 "param5": "106.222.245.234",
//                 "param6": "80"
//             },
//             {
//                 "param1": "434",
//                 "param2": "5ca13590-eb43-4e3b-943f-d9b7d5c34db5",
//                 "param3": "11-Feb-2026 03:41:18 PM",
//                 "param4": "NRM86056006865493001L0110226101126022.655223N088.377126E404031107E000020763000.00000.0000001811S0000.00AIRTEL",
//                 "param5": "106.222.245.234",
//                 "param6": "80"
//             },
//             {
//                 "param1": "435",
//                 "param2": "83b2c38d-145b-4a1c-b6d1-ef10f0d77d0c",
//                 "param3": "11-Feb-2026 03:41:04 PM",
//                 "param4": "NRM86056006865493001L0110226101026022.655223N088.377126E404031107E000020763000.00000.0000001711S0000.00AIRTEL",
//                 "param5": "106.222.245.234",
//                 "param6": "80"
//             },
//             {
//                 "param1": "436",
//                 "param2": "65c22dcd-ab44-45de-a2d9-c9c6cbd6bd84",
//                 "param3": "11-Feb-2026 03:41:00 PM",
//                 "param4": "NRM86056006865493001L0110226100925022.655223N088.377126E4040311091000006323000.00000.0000001311S0000.00AIRTEL",
//                 "param5": "106.222.245.234",
//                 "param6": "80"
//             },
//             {
//                 "param1": "437",
//                 "param2": "cc4afc2e-86ca-4911-bc14-3d62e547187c",
//                 "param3": "11-Feb-2026 03:40:55 PM",
//                 "param4": "FUL86056006865493025L0110226100825022.655223N088.377126E4040311091000006323000.00000.0000001511S000TDI3.1.0700000000000000000000.0000AIRTEL14107E00006584612109100011565710107E00017",
//                 "param5": "106.222.245.234",
//                 "param6": "80"
//             },
//             {
//                 "param1": "438",
//                 "param2": "c6fc03b5-fdd1-4bdb-82dc-06e700455759",
//                 "param3": "11-Feb-2026 03:37:54 PM",
//                 "param4": "NRM86056006865493001L0110226100825022.655223N088.377126E4040311091000006323000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.246.127",
//                 "param6": "80"
//             },
//             {
//                 "param1": "439",
//                 "param2": "516ce6bb-4ae1-4435-a47a-8a662164776c",
//                 "param3": "11-Feb-2026 03:36:57 PM",
//                 "param4": "NRM86056006865493001L0110226100725022.655223N088.377126E4040311091000006323000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.246.127",
//                 "param6": "80"
//             },
//             {
//                 "param1": "440",
//                 "param2": "b2a64857-959f-4fc2-ad37-e3c6d3772a27",
//                 "param3": "11-Feb-2026 03:35:57 PM",
//                 "param4": "NRM86056006865493001L0110226100624022.655223N088.377126E4040311091000006323000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.246.127",
//                 "param6": "80"
//             },
//             {
//                 "param1": "441",
//                 "param2": "a973eef5-0fe3-471c-9e43-1f0457072f5f",
//                 "param3": "11-Feb-2026 03:34:54 PM",
//                 "param4": "NRM86056006865493001L0110226100524022.655223N088.377126E4040311091000006323000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.244.237",
//                 "param6": "80"
//             },
//             {
//                 "param1": "442",
//                 "param2": "23c6d983-f081-498e-baa9-dc5eb4b43c99",
//                 "param3": "11-Feb-2026 03:33:57 PM",
//                 "param4": "NRM86056006865493001L0110226100423022.655223N088.377126E4040311091000006323000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.244.237",
//                 "param6": "80"
//             },
//             {
//                 "param1": "443",
//                 "param2": "41ffed84-8380-4e3a-869f-a4b18453216d",
//                 "param3": "11-Feb-2026 03:32:54 PM",
//                 "param4": "NRM86056006865493001L0110226100323022.655223N088.377126E4040311091000006323000.00000.0000001711S0000.00AIRTEL",
//                 "param5": "106.222.244.237",
//                 "param6": "80"
//             },
//             {
//                 "param1": "444",
//                 "param2": "fec525c5-a94a-458a-b202-832ad44041e4",
//                 "param3": "11-Feb-2026 03:31:54 PM",
//                 "param4": "NRM86056006865493001L0110226100222022.655223N088.377126E4040311091000006323000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.244.237",
//                 "param6": "80"
//             },
//             {
//                 "param1": "445",
//                 "param2": "6b43eacd-9ea9-4510-8f0e-ad020af2fac1",
//                 "param3": "11-Feb-2026 03:30:54 PM",
//                 "param4": "NRM86056006865493001L0110226100122022.655223N088.377126E4040311091000006323000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.244.237",
//                 "param6": "80"
//             },
//             {
//                 "param1": "446",
//                 "param2": "266e06d5-bf98-4999-a7e9-987f6cb4ec7a",
//                 "param3": "11-Feb-2026 03:29:55 PM",
//                 "param4": "NRM86056006865493001L0110226100021022.655223N088.377126E4040311091000006323000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.244.237",
//                 "param6": "80"
//             },
//             {
//                 "param1": "447",
//                 "param2": "1ec3a390-870a-45c9-91bb-add2dd275634",
//                 "param3": "11-Feb-2026 03:28:54 PM",
//                 "param4": "NRM86056006865493001L0110226095921022.655223N088.377126E4040311091000006323000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.244.237",
//                 "param6": "80"
//             },
//             {
//                 "param1": "448",
//                 "param2": "c966ffda-40fd-4587-b927-ecca5d490df3",
//                 "param3": "11-Feb-2026 03:27:57 PM",
//                 "param4": "NRM86056006865493001L0110226095821022.655223N088.377126E4040311091000006323000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.244.237",
//                 "param6": "80"
//             },
//             {
//                 "param1": "449",
//                 "param2": "a85518ff-3c45-4469-af70-6dae1eb42c7e",
//                 "param3": "11-Feb-2026 03:26:54 PM",
//                 "param4": "NRM86056006865493001L0110226095720022.655223N088.377126E4040311091000006323000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.244.237",
//                 "param6": "80"
//             },
//             {
//                 "param1": "450",
//                 "param2": "79c9c4c1-d496-4db4-ae81-0b8ad0488d0a",
//                 "param3": "11-Feb-2026 03:26:00 PM",
//                 "param4": "NRM86056006865493001L0110226095620022.655223N088.377126E4040311091000006323000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.244.237",
//                 "param6": "80"
//             },
//             {
//                 "param1": "451",
//                 "param2": "3f814435-7050-474a-b2c1-6bde5a86a5b6",
//                 "param3": "11-Feb-2026 03:25:12 PM",
//                 "param4": "NRM86056006865493001L0110226095519022.655223N088.377126E4040311091000006323000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.244.237",
//                 "param6": "80"
//             },
//             {
//                 "param1": "452",
//                 "param2": "905a7348-4b10-4777-a1f4-f21af704b214",
//                 "param3": "11-Feb-2026 03:25:03 PM",
//                 "param4": "NRM86056006865493001L0110226095419022.655223N088.377126E4040311091000006323000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.244.237",
//                 "param6": "80"
//             },
//             {
//                 "param1": "453",
//                 "param2": "4081d12c-1a3c-45a5-95b7-562f5ce0f56b",
//                 "param3": "11-Feb-2026 03:22:54 PM",
//                 "param4": "NRM86056006865493001L0110226095319022.655223N088.377126E4040311091000006323000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.244.237",
//                 "param6": "80"
//             },
//             {
//                 "param1": "454",
//                 "param2": "e8c32f93-26e2-4d03-85a1-77dff9b28fac",
//                 "param3": "11-Feb-2026 03:22:45 PM",
//                 "param4": "NRM86056006865493001L0110226095218022.655223N088.377126E4040311091000006323000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.244.237",
//                 "param6": "80"
//             },
//             {
//                 "param1": "455",
//                 "param2": "e99b4e06-07ba-4327-b6f1-d444f8175f08",
//                 "param3": "11-Feb-2026 03:22:42 PM",
//                 "param4": "NRM86056006865493001L0110226095118022.655223N088.377126E4040311091000006323000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.244.237",
//                 "param6": "80"
//             },
//             {
//                 "param1": "456",
//                 "param2": "33a4fc54-6127-4302-99de-c9d93a7e627e",
//                 "param3": "11-Feb-2026 03:22:39 PM",
//                 "param4": "NRM86056006865493001L0110226095017022.655223N088.377126E404031107E000020763000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.244.237",
//                 "param6": "80"
//             },
//             {
//                 "param1": "457",
//                 "param2": "b39241ac-0ae7-4b49-83da-2c47b839f023",
//                 "param3": "11-Feb-2026 03:22:36 PM",
//                 "param4": "NRM86056006865493001L0110226094917022.655223N088.377126E404031107E000020763000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.244.237",
//                 "param6": "80"
//             },
//             {
//                 "param1": "458",
//                 "param2": "c6f1ae8b-0024-40c1-961a-d19addd0f356",
//                 "param3": "11-Feb-2026 03:22:33 PM",
//                 "param4": "NRM86056006865493001L0110226094817022.655223N088.377126E4040310FFF000065535000.00000.0000001511S0000.00000000",
//                 "param5": "106.222.244.237",
//                 "param6": "80"
//             },
//             {
//                 "param1": "459",
//                 "param2": "8ca9fa18-7521-4f4f-91dc-7696fcb8435f",
//                 "param3": "11-Feb-2026 03:22:30 PM",
//                 "param4": "NRM86056006865493001L0110226094716022.655223N088.377126E404031107E000045352000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.244.237",
//                 "param6": "80"
//             },
//             {
//                 "param1": "460",
//                 "param2": "f0c4f4ad-2059-4a62-9f3f-c18125c5d2fe",
//                 "param3": "11-Feb-2026 03:22:26 PM",
//                 "param4": "NRM86056006865493001L0110226094616022.655223N088.377126E404031107E000020763000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.244.237",
//                 "param6": "80"
//             },
//             {
//                 "param1": "461",
//                 "param2": "28882163-541c-4e23-b71d-72d658edfe7c",
//                 "param3": "11-Feb-2026 03:22:22 PM",
//                 "param4": "NRM86056006865493001L0110226094515022.655223N088.377126E4040310FFF000065535000.00000.0000001411S0000.00000000",
//                 "param5": "106.222.244.237",
//                 "param6": "80"
//             },
//             {
//                 "param1": "462",
//                 "param2": "fd8242d0-f925-4119-9cdb-855658795905",
//                 "param3": "11-Feb-2026 03:22:18 PM",
//                 "param4": "NRM86056006865493001L0110226094415022.655223N088.377126E404031107E000045352000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.244.237",
//                 "param6": "80"
//             },
//             {
//                 "param1": "463",
//                 "param2": "866c6489-8283-4e3a-a67b-8d4c2d42c27d",
//                 "param3": "11-Feb-2026 03:19:37 PM",
//                 "param4": "NRM86056006865493001L0110226094415022.655223N088.377126E404031107E000045352000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.244.237",
//                 "param6": "80"
//             },
//             {
//                 "param1": "464",
//                 "param2": "9b197b44-1d11-4fa1-99a5-b084f4a3de81",
//                 "param3": "11-Feb-2026 03:16:24 PM",
//                 "param4": "NRM86056006865493001L0110226094315022.655223N088.377126E404031107E000045352000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.247.123",
//                 "param6": "80"
//             },
//             {
//                 "param1": "465",
//                 "param2": "201305dc-ad07-4700-8886-b4a02deb0f03",
//                 "param3": "11-Feb-2026 03:16:22 PM",
//                 "param4": "NRM86056006865493001L0110226094214022.655223N088.377126E404031107E000045352000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.247.123",
//                 "param6": "80"
//             },
//             {
//                 "param1": "466",
//                 "param2": "59050eff-5548-4799-a09e-b3df5b7a87ac",
//                 "param3": "11-Feb-2026 03:16:19 PM",
//                 "param4": "NRM86056006865493001L0110226094114022.655223N088.377126E404031107E000045352000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.247.123",
//                 "param6": "80"
//             },
//             {
//                 "param1": "467",
//                 "param2": "82dd8164-042d-4498-9c43-d0c801139245",
//                 "param3": "11-Feb-2026 03:12:51 PM",
//                 "param4": "NRM86056006865493001L0110226094014022.655223N088.377126E404031107E000045352000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.242.179",
//                 "param6": "80"
//             },
//             {
//                 "param1": "468",
//                 "param2": "0c210e88-7ab0-4d9d-b370-607a8fe841fa",
//                 "param3": "11-Feb-2026 03:09:27 PM",
//                 "param4": "BTH86056006865493001101L0110226093913022.655223N088.377126E404031107E000020763000.00000.0000001311S0000.00AIRTEL02H0110226092708022.655223N088.377126E404031107E000045352000.00000.0000001411S0000.002H0110226092608022.655223N088.377126E404031107E000045352000.00000.0000001411S0000.002H0110226092508022.655223N088.377126E404031107E000045352000.00000.0000001311S0000.002H0110226092407022.655223N088.377126E404031107E000045352000.00000.0000001311S0000.002H0110226092307022.655223N088.377126E4040311091000006323000.00000.0000001211S0000.002H0110226092206022.655223N088.377126E4040311091000006323000.00000.0000001211S0000.002H0110226092106022.655223N088.377126E4040311091000006323000.00000.0000001311S0000.002H0110226092006022.655223N088.377126E4040310FFF000065535000.00000.0000001311S0000.002H0110226091905022.655223N088.377126E4040311091000006323000.00000.0000001311S0000.002H0110226091805022.655223N088.377126E4040311091000006323000.00000.0000001211S0000.0",
//                 "param5": "106.222.240.53",
//                 "param6": "80"
//             },
//             {
//                 "param1": "469",
//                 "param2": "8c7ba4cf-b8a6-46fe-8fcc-b7fd4a602c12",
//                 "param3": "11-Feb-2026 03:09:00 PM",
//                 "param4": "NRM86056006865493001L0110226093813022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.240.53",
//                 "param6": "80"
//             },
//             {
//                 "param1": "470",
//                 "param2": "a811538f-5319-4396-850e-f5497be1c448",
//                 "param3": "11-Feb-2026 03:08:51 PM",
//                 "param4": "NRM86056006865493001L0110226093712022.655223N088.377126E404031107E000020763000.00000.0000001211S0000.00AIRTEL",
//                 "param5": "106.222.240.53",
//                 "param6": "80"
//             },
//             {
//                 "param1": "471",
//                 "param2": "dc58c4a8-0c64-4ff3-905f-7f29ff72f53c",
//                 "param3": "11-Feb-2026 03:08:40 PM",
//                 "param4": "NRM86056006865493001L0110226093612022.655223N088.377126E4040311091000006323000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.240.53",
//                 "param6": "80"
//             },
//             {
//                 "param1": "472",
//                 "param2": "4fb132df-3d52-476a-8845-c1254c753e5d",
//                 "param3": "11-Feb-2026 03:08:31 PM",
//                 "param4": "NRM86056006865493001L0110226093512022.655223N088.377126E4040311091000006323000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.240.53",
//                 "param6": "80"
//             },
//             {
//                 "param1": "473",
//                 "param2": "66412c69-838f-4186-bff0-b475e1017c94",
//                 "param3": "11-Feb-2026 03:08:23 PM",
//                 "param4": "BTH86056006865493001101L0110226093512022.655223N088.377126E4040311091000006323000.00000.0000001511S0000.00AIRTEL02H0110226092708022.655223N088.377126E404031107E000045352000.00000.0000001411S0000.002H0110226092608022.655223N088.377126E404031107E000045352000.00000.0000001411S0000.002H0110226092508022.655223N088.377126E404031107E000045352000.00000.0000001311S0000.002H0110226092407022.655223N088.377126E404031107E000045352000.00000.0000001311S0000.002H0110226092307022.655223N088.377126E4040311091000006323000.00000.0000001211S0000.002H0110226092206022.655223N088.377126E4040311091000006323000.00000.0000001211S0000.002H0110226092106022.655223N088.377126E4040311091000006323000.00000.0000001311S0000.002H0110226092006022.655223N088.377126E4040310FFF000065535000.00000.0000001311S0000.002H0110226091905022.655223N088.377126E4040311091000006323000.00000.0000001311S0000.002H0110226091805022.655223N088.377126E4040311091000006323000.00000.0000001211S0000.0",
//                 "param5": "106.222.240.53",
//                 "param6": "80"
//             },
//             {
//                 "param1": "474",
//                 "param2": "5ffac67e-8161-4ef0-a1c1-660b5fbad166",
//                 "param3": "11-Feb-2026 03:04:15 PM",
//                 "param4": "NRM86056006865493001L0110226093411022.655223N088.377126E4040311091000006323000.00000.0000001311S0000.00AIRTEL",
//                 "param5": "106.222.246.152",
//                 "param6": "80"
//             },
//             {
//                 "param1": "475",
//                 "param2": "e1de30a9-12f5-41c1-8f80-f603ff6ca78e",
//                 "param3": "11-Feb-2026 03:03:35 PM",
//                 "param4": "NRM86056006865493001L0110226093311022.655223N088.377126E4040311091000006323000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.240.245",
//                 "param6": "80"
//             },
//             {
//                 "param1": "476",
//                 "param2": "f1598e31-ff3f-48c3-8a69-ec45a415ba7b",
//                 "param3": "11-Feb-2026 03:03:33 PM",
//                 "param4": "BTH86056006865493001101L0110226093311022.655223N088.377126E4040311091000006323000.00000.0000001411S0000.00AIRTEL02H0110226092708022.655223N088.377126E404031107E000045352000.00000.0000001411S0000.002H0110226092608022.655223N088.377126E404031107E000045352000.00000.0000001411S0000.002H0110226092508022.655223N088.377126E404031107E000045352000.00000.0000001311S0000.002H0110226092407022.655223N088.377126E404031107E000045352000.00000.0000001311S0000.002H0110226092307022.655223N088.377126E4040311091000006323000.00000.0000001211S0000.002H0110226092206022.655223N088.377126E4040311091000006323000.00000.0000001211S0000.002H0110226092106022.655223N088.377126E4040311091000006323000.00000.0000001311S0000.002H0110226092006022.655223N088.377126E4040310FFF000065535000.00000.0000001311S0000.002H0110226091905022.655223N088.377126E4040311091000006323000.00000.0000001311S0000.002H0110226091805022.655223N088.377126E4040311091000006323000.00000.0000001211S0000.0",
//                 "param5": "106.222.240.245",
//                 "param6": "80"
//             },
//             {
//                 "param1": "477",
//                 "param2": "eb245547-642f-449f-ac56-c996180ad865",
//                 "param3": "11-Feb-2026 03:03:02 PM",
//                 "param4": "NRM86056006865493001L0110226093210022.655223N088.377126E4040310FFF000065535000.00000.0000001411S0000.00000000",
//                 "param5": "106.222.240.101",
//                 "param6": "80"
//             },
//             {
//                 "param1": "478",
//                 "param2": "baa1d87a-82cf-4211-b533-f1b520f75625",
//                 "param3": "11-Feb-2026 03:02:57 PM",
//                 "param4": "NRM86056006865493001L0110226093110022.655223N088.377126E4040310FFF000065535000.00000.0000001411S0000.00000000",
//                 "param5": "106.222.240.101",
//                 "param6": "80"
//             },
//             {
//                 "param1": "479",
//                 "param2": "73868907-a06a-4ea9-b1c1-12fd7f7b87b9",
//                 "param3": "11-Feb-2026 03:02:53 PM",
//                 "param4": "NRM86056006865493001L0110226093010022.655223N088.377126E404031107E000045352000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.240.101",
//                 "param6": "80"
//             },
//             {
//                 "param1": "480",
//                 "param2": "a57d8d82-6edf-46f7-8ee7-5c9a016d3d17",
//                 "param3": "11-Feb-2026 03:02:49 PM",
//                 "param4": "NRM86056006865493001L0110226092909022.655223N088.377126E404031107E000045352000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.240.101",
//                 "param6": "80"
//             },
//             {
//                 "param1": "481",
//                 "param2": "591e9cb1-48b9-4a83-b527-eebb7748d4d2",
//                 "param3": "11-Feb-2026 03:02:44 PM",
//                 "param4": "NRM86056006865493001L0110226092809022.655223N088.377126E404031107E000045352000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.240.101",
//                 "param6": "80"
//             },
//             {
//                 "param1": "482",
//                 "param2": "c9f16502-bc94-4ff0-898f-dc1d31e24732",
//                 "param3": "11-Feb-2026 02:47:49 PM",
//                 "param4": "NRM86056006865493001L0110226091704022.655223N088.377126E4040311091000006323000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.245.89",
//                 "param6": "80"
//             },
//             {
//                 "param1": "483",
//                 "param2": "1ada938a-3a19-416c-9cd2-057bd5a7efb9",
//                 "param3": "11-Feb-2026 02:47:45 PM",
//                 "param4": "NRM86056006865493001L0110226091604022.655223N088.377126E4040311091000006323000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.245.89",
//                 "param6": "80"
//             },
//             {
//                 "param1": "484",
//                 "param2": "ac016fdc-f1c4-4a5e-a840-b46c76e836ad",
//                 "param3": "11-Feb-2026 02:47:41 PM",
//                 "param4": "NRM86056006865493001L0110226091503022.655223N088.377126E4040311091000006323000.00000.0000001311S0000.00AIRTEL",
//                 "param5": "106.222.245.89",
//                 "param6": "80"
//             },
//             {
//                 "param1": "485",
//                 "param2": "6a1fc210-047f-42e0-883d-dcfdc1bc4243",
//                 "param3": "11-Feb-2026 02:44:18 PM",
//                 "param4": "BTH86056006865493001001L0110226091403022.655223N088.377126E4040310FFF000065535000.00000.0000001411S0000.00AIRTEL02H0110226091303022.655223N088.377126E4040310FFF000065535000.00000.0000001411S0000.002H0110226091202022.655223N088.377126E4040310FFF000065535000.00000.0000001411S0000.002H0110226091102022.655223N088.377126E4040310FFF000065535000.00000.0000001411S0000.002H0110226091001022.655223N088.377126E4040310FFF000065535000.00000.0000001411S0000.002H0110226090901022.655223N088.377126E4040311091000006323000.00000.0000001411S0000.002H0110226090801022.655223N088.377126E4040311091000006323000.00000.0000001411S0000.002H0110226090700022.655223N088.377126E4040311091000006323000.00000.0000001111S0000.002H0110226090600022.655223N088.377126E4040311091000006323000.00000.0000001111S0000.002H0110226090459022.655223N088.377126E4040311091000006323000.00000.0000001411S0000.0",
//                 "param5": "106.222.242.182",
//                 "param6": "80"
//             },
//             {
//                 "param1": "486",
//                 "param2": "9a122ebb-a32a-4073-9b9d-69c7cc6b43f9",
//                 "param3": "11-Feb-2026 02:34:46 PM",
//                 "param4": "NRM86056006865493001L0110226090359022.655223N088.377126E404031107E000001312000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.243.67",
//                 "param6": "80"
//             },
//             {
//                 "param1": "487",
//                 "param2": "9cb1f60d-b2fd-4413-a580-9f535b5a81e2",
//                 "param3": "11-Feb-2026 02:34:42 PM",
//                 "param4": "NRM86056006865493001L0110226090258022.655223N088.377126E4040311091000006323000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.243.67",
//                 "param6": "80"
//             },
//             {
//                 "param1": "488",
//                 "param2": "3eece173-fc07-4a5e-9da1-4eec75bb2ef7",
//                 "param3": "11-Feb-2026 02:34:38 PM",
//                 "param4": "NRM86056006865493001L0110226090158022.655223N088.377126E404031107E000045352000.00000.0000001411S0000.00AIRTEL",
//                 "param5": "106.222.243.67",
//                 "param6": "80"
//             },
//             {
//                 "param1": "489",
//                 "param2": "a25bca86-5320-41ee-9dca-b9af16d66d5d",
//                 "param3": "11-Feb-2026 02:30:56 PM",
//                 "param4": "NRM86056006865493001L0110226090057022.655223N088.377126E404031107E000045352000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.243.67",
//                 "param6": "80"
//             },
//             {
//                 "param1": "490",
//                 "param2": "e3586a70-3db6-468b-a471-d9a456d794d7",
//                 "param3": "11-Feb-2026 02:30:33 PM",
//                 "param4": "NRM86056006865493001L0110226085957022.655223N088.377126E404031107E000020763000.00000.0000001711S0000.00AIRTEL",
//                 "param5": "106.222.243.67",
//                 "param6": "80"
//             },
//             {
//                 "param1": "491",
//                 "param2": "0cf2318f-4db0-4f18-a103-5731c5ac63a0",
//                 "param3": "11-Feb-2026 02:30:21 PM",
//                 "param4": "NRM86056006865493001L0110226085856022.655223N088.377126E404031107E000020763000.00000.0000001711S0000.00AIRTEL",
//                 "param5": "106.222.243.67",
//                 "param6": "80"
//             },
//             {
//                 "param1": "492",
//                 "param2": "8bebddc0-7441-4d42-bc20-02b518cc3fb7",
//                 "param3": "11-Feb-2026 02:28:40 PM",
//                 "param4": "NRM86056006865493001L0110226085756022.655223N088.377126E4040311091000006323000.00000.0000001611S0000.00AIRTEL",
//                 "param5": "106.222.243.67",
//                 "param6": "80"
//             },
//             {
//                 "param1": "493",
//                 "param2": "510a547a-94eb-4839-b924-12b272bd2454",
//                 "param3": "11-Feb-2026 02:28:20 PM",
//                 "param4": "NRM86056006865493001L0110226085655022.655223N088.377126E4040311091000006323000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.243.67",
//                 "param6": "80"
//             },
//             {
//                 "param1": "494",
//                 "param2": "86658db3-89d2-41c5-be35-9f8db146dc6b",
//                 "param3": "11-Feb-2026 02:28:10 PM",
//                 "param4": "NRM86056006865493001L0110226085555022.655223N088.377126E404031107E000020763000.00000.0000001811S0000.00AIRTEL",
//                 "param5": "106.222.243.67",
//                 "param6": "80"
//             },
//             {
//                 "param1": "495",
//                 "param2": "c7d108af-ff17-4ef3-9b24-0abc82cfec2b",
//                 "param3": "11-Feb-2026 02:28:03 PM",
//                 "param4": "NRM86056006865493001L0110226085454022.655223N088.377126E404031107E000020763000.00000.0000001811S0000.00AIRTEL",
//                 "param5": "106.222.243.67",
//                 "param6": "80"
//             },
//             {
//                 "param1": "496",
//                 "param2": "4a691af4-3764-4314-ad6d-3d83f8435db5",
//                 "param3": "11-Feb-2026 02:24:39 PM",
//                 "param4": "NRM86056006865493001L0110226085354022.655223N088.377126E404031107E000020763000.00000.0000001811S0000.00AIRTEL",
//                 "param5": "106.222.242.188",
//                 "param6": "80"
//             },
//             {
//                 "param1": "497",
//                 "param2": "34fbfff6-0a41-4755-9683-ad98755ca190",
//                 "param3": "11-Feb-2026 02:24:31 PM",
//                 "param4": "NRM86056006865493001L0110226085253022.655223N088.377126E404031107E000020763000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.242.188",
//                 "param6": "80"
//             },
//             {
//                 "param1": "498",
//                 "param2": "f35bec72-801b-4610-963b-ccc11fb509b7",
//                 "param3": "11-Feb-2026 02:24:21 PM",
//                 "param4": "NRM86056006865493001L0110226085153022.655223N088.377126E404031107E000045352000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.242.45",
//                 "param6": "80"
//             },
//             {
//                 "param1": "499",
//                 "param2": "b938a98c-8844-4495-b1a2-119b1c1e6a17",
//                 "param3": "11-Feb-2026 02:24:12 PM",
//                 "param4": "NRM86056006865493001L0110226085052022.655223N088.377126E404031107E000045352000.00000.0000001511S0000.00AIRTEL",
//                 "param5": "106.222.242.45",
//                 "param6": "80"
//             },
//             {
//                 "param1": "500",
//                 "param2": "533213de-db30-49ba-bc75-29e850417464",
//                 "param3": "11-Feb-2026 02:19:53 PM",
//                 "param4": "NRM86056006865493001L0110226084952022.655223N088.377126E404031107E000045352000.00000.0000001711S0000.00AIRTEL",
//                 "param5": "106.222.246.234",
//                 "param6": "80"
//             }
//         ]
}
