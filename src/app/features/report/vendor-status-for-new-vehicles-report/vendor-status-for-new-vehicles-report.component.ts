import { ReportService } from './../../../core/services/report.service';
import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../../core/services/alert.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { ToastService } from '../../../core/services/toast.service';
import dayjs from 'dayjs';
import { Dayjs } from 'dayjs';
import moment from 'moment';
import { VendorStatusForNewVehiclesReportReq } from '../../../core/model/request.model';
import { VendorStatusForNewVehiclesReportResp } from '../../../core/model/response.model';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonDataToolbarComponent } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';
declare var $: any;

@Component({
    selector: 'app-vendor-status-for-new-vehicles-report',
    imports: [CommonModule, NgxDaterangepickerMd, FormsModule, NgSelectModule, CommonDataToolbarComponent, CommonTableComponent],
    templateUrl: './vendor-status-for-new-vehicles-report.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './vendor-status-for-new-vehicles-report.component.scss'
})
export class VendorStatusForNewVehiclesReportComponent implements OnInit, AfterViewInit {
  readonly tableColumns: CommonTableColumn<VendorStatusForNewVehiclesReportResp>[] = [
    { key: 'param1', label: '#' },
    { key: 'param2', label: 'Vendor Name', cellClass: 'text-left' },
    { key: 'param3', label: 'Installed', cellClass: 'text-end' },
    { key: 'param4', label: 'Activated', cellClass: 'text-end' },
    { key: 'param7', label: 'Total Activation', cellClass: 'text-end' },
    { key: 'param5', label: 'Received/ Active (Sending Data)', cellClass: 'text-end' },
    { key: 'param6', label: 'Not Received (Time period)', cellClass: 'text-end' }
  ];


  loading = false;
  
  filterBy= '';

  selectedVendor = '';
  selectedRTO: any = null;
  
  

  vendorList: any[] = [];
  rtoList: any[] = [];
  vehicleList: any[] = [];
  alertTypeList: any[] = [];
  reportData: VendorStatusForNewVehiclesReportResp[] = [];
  roleId: string = '';
  dateObj: any;
  pageTitle: string = 'Vendor Status Details For New Vehicles';
  tabTitle: string = "newVehicle";
  constructor(
    private toast: ToastService,
    private ReportService: ReportService,
    private alertService: AlertService,
    private dashboardService: DashboardService,
    private vehicleService: VehicleService,
    private cdr: ChangeDetectorRef,
    public toastService: ToastService 
  ) { 
    this.toastService.pageName = 'Vendor Status Details For New Vehicles Report'; // Set page name for toast service
    this.roleId = sessionStorage.getItem('roleid') || '';}

  

 ngOnInit() {
   
}

ngAfterViewInit() {
  this.getDate();
  this.loadRTOList();
  
}
getDate() {
      $(() => {
        $('input[name="date"]').daterangepicker({
          timePicker: false,
          // "alwaysShowCalendars": true,
          startDate: moment().startOf("hour"),
          endDate: moment().startOf("hour").add(32, "hour"),
          opens: "center",
          drops: "down",
          locale: {
            format: "DD-MMM-YYYY",
          },
          ranges: {
            Today: [moment(), moment()],
            Yesterday: [
              moment().subtract(1, "days"),
              moment().subtract(1, "days"),
            ],
            "This Week": [moment().startOf("week"), moment().endOf("week")],
            "Last 7 Days": [
              moment().subtract(7, "days"),
              moment().subtract(1, "days"),
            ],
            "This Month": [moment().startOf("month"), moment().endOf("month")],
          },
          maxDate: new Date(),
          minYear: 2022,
          maxYear: parseInt(moment().format("YYYY"), 10),
          // minDate : moment().subtract(3,'months'),
          function(startDate: any, endDate: any) {
            console.log("getDate called");
            $("#datepicker").html(
              startDate.format("DD-MMM-YYYY") +
                " : " +
                endDate.format("DD-MMM-YYYY"),
            );
          },
        });
        $('input[name="date"]').on(
          "hide.daterangepicker",
          (ev: any, picker: any) => {
            try {
              this.dateObj = ev.target.value;
               this.getReportDetails();
            } catch (error) {}
          },
        );
        this.dateObj = (
          document.getElementById("datepicker") as HTMLInputElement
        ).value;
        this.tabTitle === 'newVehicle' ? this.pageTitle = 'Vendor Status for New Vehicles Report' : this.pageTitle = 'Renewal Devices Report';
        this.reportRequest.param7 = this.tabTitle === 'newVehicle' ? 'Install' : 'Renewal';
        this.getReportDetails();
        
      });
    }

 

//  onFilterByChange(type: 'Vendor' | 'RTO') {
//   this.filterBy = type;

//   // 🔥 RESET ALL FIELDS
//   this.selectedVendor = '';
//   this.selectedRTO = '';
//   this.reportData = [];
//   // 🔄 LOAD NEW DATA
//   if (type === 'Vendor') {
//     this.loadVendorList();
//   } else {
//     this.loadRTOList();
//   }
// }

  // loadVendorList() {
  //   this.dashboardService.getVendorList().subscribe(res => {
  //     if (res.status) this.vendorList = res.entity;
  //   });
  // }

  loadRTOList() {
    this.dashboardService.getRTOList().subscribe(res => {
      if (res.statuscode==200) this.rtoList = res.entity;
      this.rtoList = [{param1:"", param2:"All RTOs"}, ...this.rtoList];
      this.selectedRTO = this.rtoList[0];
    });
  }

//   onVehicleSearchChange() {

//   if (!this.vehicleSearch) {
//     // 🔥 input empty → reset everything
//     this.fullVehicleList = [];
//     this.visibleVehicleList = [];
//     this.selectedVehicle = '';
    
//   }

// }
// onVendorChange() {
//   this.selectedVehicle = '';
//   this.vehicleSearch = '';
//   this.fullVehicleList = [];
//   this.visibleVehicleList = [];
  
// }

onRTOChange() {
  this.searchText = '';
  this.reportData = [];
  setTimeout(() => {
    if(this.selectedRTO==null || this.selectedRTO.param1=="") {
      this.selectedRTO = this.rtoList[0];
    }
  }, 200);
  this.getReportDetails();
}

getDetails(page: number) {
  this.selectedRTO = this.rtoList[0];
  this.reportRequest.param8 = this.selectedRTO ? this.selectedRTO.param1 : '';
  this.page = page;
  this.tabTitle === 'newVehicle' ? this.pageTitle = 'Vendor Status Details For New Vehicles' : this.pageTitle = 'Vendor Status Details For Renewal Vehicles'; 
  this.reportRequest.param7 = this.tabTitle === 'newVehicle' ? 'Install' : 'Renewal';
  this.getReportDetails();
}

page=1
totalPages = 0;
public reportRequest: VendorStatusForNewVehiclesReportReq = new VendorStatusForNewVehiclesReportReq();
getReportDetails() {
  
  let daterange = this.dateObj.split(" - ");
  const fromDate = daterange[0] ? dayjs(daterange[0]).format('DD-MMM-YYYY') : '';
  const toDate = daterange[1] ? dayjs(daterange[1]).format('DD-MMM-YYYY') : '';
  this.reportRequest.param1 = this.searchText;
  this.reportRequest.param2 = "";
  this.reportRequest.param3 = "";
  this.reportRequest.param4 = fromDate;
  this.reportRequest.param5 = toDate;
  this.reportRequest.param6 = '';
  this.reportRequest.param8 = this.selectedRTO ? this.selectedRTO.param1 : '';

  this.ReportService.vendorStatusForNewVehiclesReport(this.reportRequest).subscribe({
    next: (response: any) => {
      if(response.statuscode==200) {
        this.reportData = response.entity.listData || [];
        this.totalCount = Number(response.entity.param1 || 0);
        this.totalinstalled = Number(response.entity.param2 || 0);
        this.totalActivated = Number(response.entity.param3 || 0);
        this.tatalallactivated  = Number(response.entity.param6 || 0);
        this.totalReceived = Number(response.entity.param4 || 0);
        this.totalNot_Received = Number(response.entity.param5 || 0);
        this.totalPages = Math.ceil(this.totalCount / this.pageSize);
      } else {
        this.totalCount = 0;
        this.reportData = [];
        this.totalPages = 0;
      }
    },
    error: (error: any) => {
      this.toast.show('Something went wrong', 'error');
    }
  })
}
// 🔍 search text
searchText = '';

// pagination
pageSize :number = 20;
pageCount = 0;
totalCount = 0;
totalinstalled = 0;
totalActivated = 0;
tatalallactivated = 0;
totalReceived = 0;
totalNot_Received = 0;
pageSizeOptions = [10, 20, 50, 100];


// 🔎 SEARCH
getSearchDetails() {
  this.getReportDetails();

  // agar backend search hai to yaha API call karo
  // abhi ke liye existing data filter example

  if (!this.searchText) {
    return this.getReportDetails();
  }

  const text = this.searchText.toLowerCase();

  this.reportData = this.reportData.filter((item: any) =>
    Object.values(item).some(val =>
      String(val).toLowerCase().includes(text)
    )
  );
 
}


// 🔄 RELOAD
reloadData() {
  this.searchText = '';
  this.selectedRTO = this.rtoList[0];
  this.getReportDetails();
}


// 📄 PAGE SIZE CHANGE
onPageSizeChange(size: any) {

  if (size === 'All') {
    this.pageSize = this.totalCount;
  } else {
    this.pageSize = Number(size);
  }

  this.pageCount = Math.min(this.pageSize, this.totalCount);
}
exportDoc(event?: any) {
  if (!event || event.target.value === 'excel') {
    let daterange = this.dateObj.split(" - ");
    const fromDate = daterange[0] ? dayjs(daterange[0]).format('DD-MMM-YYYY') : '';
    const toDate = daterange[1] ? dayjs(daterange[1]).format('DD-MMM-YYYY') : '';
    
    const exportRequest: VendorStatusForNewVehiclesReportReq = {
      param1: this.searchText,
      param2: '', // page number
      param3: '', // page size for export
      param4: fromDate,
      param5: toDate,
      param6: '', // fromTime
      param7: this.tabTitle === 'newVehicle' ? 'Install' : 'Renewal', // toTime
      param8: this.selectedRTO ? this.selectedRTO.param1 : '',
      pdfexcel: 'excel' // specify export type
    };

    this.ReportService.vendorStatusForNewVehiclesReport(exportRequest).subscribe({
      next: (response: any) => {
        if(response.statuscode==200) {
          const dataToExport = response.entity; // Assuming the data to export is in param1
          // Convert dataToExport to Excel format and trigger download
          // You can use libraries like XLSX or SheetJS for this purpose
          this.toast.commonFileDownload(dataToExport); // Assuming this method handles the download
          if (event) {
            const selectElement = event.target as HTMLSelectElement;
            selectElement.value = '';
          }
          this.toast.show('Export successful', 'success');
        } else {
          this.toast.show('Export failed', 'error');
        }
      },
      error: (error: any) => {
        this.toast.show('Something went wrong', 'error');
      }
    });
  }
}


// fullVehicleList: any[] = [];
// visibleVehicleList: any[] = [];

// vehicleLimit = 100;   // 🔥 only 100 items render
// vehicleSearch = '';


// eventPage = 1;
// eventPageSize = 10;
// eventTotal = 0;
// eventTotalPages = 0;


// showEventModal = false;
// eventList: any[] = [];
// filteredEventList: any[] = [];
// eventSearch = '';
// totalEventCount = 0;

// filterEventData() {
//   const text = this.eventSearch.toLowerCase();

//   this.filteredEventList = this.eventList.filter(e =>
//     Object.values(e).some(val =>
//       String(val).toLowerCase().includes(text)
//     )
//   );
// }



// onEventPageSizeChange(size: any) {

//   if (size === 'All') {
//     this.eventPageSize = this.eventTotal;
//   } else {
//     this.eventPageSize = Number(size);
//   }

//   this.eventPage = 1;   // 🔥 reset page
//   this.loadEventData(); // 🔄 reload API
// }
changePage(p: number) {

  if (p < 1 || p > this.totalPages) return;

  this.page = p;

  this.getReportDetails(); // 🔥 reload API
}
onPageSizeChanged(size: any) {

  if (size === 'All') {
    this.pageSize = this.totalCount;
  } else {
    this.pageSize = Number(size);
  }

  this.page = 1; // 🔥 reset page
  this.getReportDetails(); // 🔄 reload
}


}
