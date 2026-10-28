import { ChangeDetectorRef, Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ToastComponent } from '../../assets/inactive-assets/toast.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { AlertService } from '../../../core/services/alert.service';
import { ToastService } from '../../../core/services/toast.service';
import { CommonDataToolbarComponent } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';

declare var $: any;
declare var moment: any;

@Component({
    selector: 'app-vendorwiseinstalleddevicecountoverall',
    imports: [CommonModule,
        FormsModule,
        RouterModule,
        NgSelectModule,
        NgxDaterangepickerMd,
        CommonDataToolbarComponent,
        CommonTableComponent],
    templateUrl: './vendorwiseinstalleddevicecountoverall.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './vendorwiseinstalleddevicecountoverall.component.scss'
})
export class VendorwiseinstalleddevicecountoverallComponent implements OnInit {
  readonly tableColumns: CommonTableColumn[] = [
    { key: 'index', label: '#', cellClass: 'text-center' },
    { key: 'vendor', label: 'Vendor Name', cellClass: 'text-center' },
    { key: 'year1Install', label: '1Yr Installation', cellClass: 'text-end' },
    { key: 'year2Install', label: '2Yr Installation', cellClass: 'text-end' },
    { key: 'year1Renewal', label: '1Yr Renewal', cellClass: 'text-end' },
    { key: 'year2Renewal', label: '2Yr Renewal', cellClass: 'text-end' },
    { key: 'total', label: 'Total', cellClass: 'text-end' }
  ];
  detailData: any[] = [];
    alertType: string = '';
  dateTimeout: any;
  searchBy: any = "";
  listLoaded: boolean = true;
  pageSize: number = 50;
  pageSizeOptions: number[] = [10, 25, 50, 100];
  pageCount: number = 1;
  // totalCount: number = 0;  
  selectedVendorFilter: any = null;
  vendorlist: any[] = [];
  downloadType: string = '';
totalCount: any;
vehicleType: string= "ALL";
  // selectedRange: any= {
  //   startDate: moment().subtract(7, 'days'),
  //   endDate: moment()
  // };
  // maxDate: any = moment(); // Set max date to today
fromDate: any;
toDate: any;
  constructor( private cd: ChangeDetectorRef, public alertService: AlertService, public dashboardService: DashboardService, public toastService: ToastService) {
    this.toastService.pageName = 'Vendorwise Installed Device Count Overall Report'; // Set page name for toast service
  }
 ngOnInit(): void {
  // const today = new Date();

  // const threeMonthsAgo = new Date();
  // threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  // this.selectedDateRange = {
  //   startDate: threeMonthsAgo,
  //   endDate: today
  // };

  this.initiallizeDateRangePicker();
  setTimeout(()=> {
    // this.selectedRange = {
    //   startDate: moment().subtract(7, 'days'),
    //   endDate: moment()
    // };
    //  // Initial API params
    // this.fromDate = this.selectedRange.startDate.format('YYYY-MM-DD');
    // this.toDate = this.selectedRange.endDate.format('YYYY-MM-DD');
    
    this.getDetails();
    this.loadVendorList();
  }, 200)
}
initiallizeDateRangePicker() {
  $(() => {
  $('input[name="date"]').daterangepicker({
    singleDatePicker: false,
    timePicker: false,
    autoApply: true,
    
    // ✅ default range
    startDate: moment().subtract(1, 'days'),
    endDate: moment(),

    opens: "center",
    drops: "down",

    locale: {
      format: 'DD-MMM-YYYY',
      separator: ' To '
    },

    minDate: moment('2022-01-01'),

    // ✅ disable all future dates
    maxDate: moment(),

    minYear: 2022,
    maxYear: parseInt(moment().format('YYYY'), 10),

    autoUpdateInput: true
  }, function(startDate: any, endDate: any) {

    $('#datepicker').val(
      startDate.format('DD-MMM-YYYY') +
      ' To ' +
      endDate.format('DD-MMM-YYYY')
    );
  });

  $('input[name="date"]').on(
    'apply.daterangepicker',
    (ev: any, picker: any) => {

      try {
        this.fromDate = picker.startDate.format('DD-MMM-YYYY');
        this.toDate = picker.endDate.format('DD-MMM-YYYY');
        console.log("gere", this.fromDate, this.toDate);
        this.getDetails();
      } catch (error) {}

      
    }
  );

  // ✅ initial value
  const picker: any = $('input[name="date"]').data('daterangepicker');

  this.fromDate = picker.startDate.format('DD-MMM-YYYY');
  this.toDate = picker.endDate.format('DD-MMM-YYYY');
});
 
}
  loadVendorList() {
    this.dashboardService.getVendorList().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.vendorlist = response.entity;
        }
      },
      error: (error) => {
        {}
      }
    });
  }
//   selectedDateRange: any = {
//   startDate: null,
//   endDate: null
// };
// getFromDate(): string {
//     return this.selectedRange?.startDate
//       ? moment(this.selectedRange.startDate).format('DD-MMM-YYYY')
//       : '';
//   }

//   getToDate(): string {
//     return this.selectedRange?.endDate
//       ? moment(this.selectedRange.endDate).format('DD-MMM-YYYY')
//       : '';
//   }

onDateApply(event: any) {
  // Guard against null event (picker cleared) and normalize to Moment
  // if (event && event.startDate && event.endDate) {
  //   this.selectedRange = {
  //     startDate: moment(event.startDate),
  //     endDate: moment(event.endDate)
  //   };
  //   this.fromDate = this.selectedRange.startDate.format('YYYY-MM-DD');
  //   this.toDate = this.selectedRange.endDate.format('YYYY-MM-DD');
  // } else if (this.selectedRange && this.selectedRange.startDate && this.selectedRange.endDate) {
  //   this.fromDate = moment(this.selectedRange.startDate).format('YYYY-MM-DD');
  //   this.toDate = moment(this.selectedRange.endDate).format('YYYY-MM-DD');
  // } else {
  //   return; // nothing to apply
  // }

  this.cd.detectChanges();
  this.pageCount = 1;
  this.getDetails();
}
// onDateChange() {
//   clearTimeout(this.dateTimeout);
//   this.dateTimeout = setTimeout(() => {
//     this.pageCount = 1;
//     this.getDetails();
//   }, 300);
// }

// formatDate(date: any): string {
//    const day = String(date.getDate()).padStart(2, '0');
//     const month = date.toLocaleString('default', { month: 'short' });
//     const year = date.getFullYear();
//     return `${day}-${month}-${year}`;
// }
downloadpdf() {

  this.listLoaded = false;

  const payload = {
    param1: '',
    param2: this.pageCount.toString(),
    param3: this.pageSize.toString(),
    param4: moment(this.fromDate).format('DD-MMM-YYYY'),
    param5: moment(this.toDate).format('DD-MMM-YYYY'),
    param6: this.selectedVendorFilter || '',
    param7: this.vehicleType || 'NEW',
    pdfexcel: "Excel"
  };

  this.alertService
    .VendorwiseinstalleddevicecountoverallComponent(payload)
    .subscribe({
      next: (response: any) => {

      
       

        this.listLoaded = true;
      },
      error: () => {
        this.listLoaded = true;
      }
    });
}
getDetails() {

  this.listLoaded = false; // 🔥 start loading

 
 const payload = {
  param1: '',
  param2: this.pageCount.toString(),
  param3: this.pageSize.toString(),
  param4:  moment(this.fromDate).format('DD-MMM-YYYY'),
  param5: moment(this.toDate).format('DD-MMM-YYYY'),
  param6:  this.selectedVendorFilter || '',
  param7: this.vehicleType || 'ALL', // ✅ vehicle type/ old new  
  pdfexcel:""
};

    this.alertService
    .VendorwiseinstalleddevicecountoverallComponent(payload)
    .subscribe({
      next: (response: any) => {
this.detailData = response.entity?.listData || [];
        if (response.statuscode === 200) {

          if (typeof response.entity === 'string') {
            this.detailData = [];
          } else {
       this.detailData = response.entity?.listData || [];
            this.totalCount = response.entity.param1 || 0;
          }
        }

        this.listLoaded = true;
        this.cd.detectChanges();
      },
      error: () => {
        this.detailData = [];
        this.totalCount = 0;
        this.listLoaded = true;
        this.cd.detectChanges();
      }
    });
}
onVendorFilterChange(event: any) {
  this.pageCount = 1;
  this.getDetails();
}
onAlertTypeChange() {
  this.pageCount = 1;
  this.getDetails();
}
onChangeVehicleType(type: string) {
  this.pageCount = 1;
  this.vehicleType = type
  this.getDetails();
}
  getSearchDetails() {

    this.getDetails();
  }
 reloadData() {
  // const today = new Date();

  this.selectedVendorFilter = null;

  // this.selectedDateRange = {
  //   startDate: today,
  //   endDate: today
  // };
  // this.selectedRange = {
  //       startDate: moment(),
  //       endDate: moment()
  //     };

  this.pageCount = 1;
  this.listLoaded = false;
  this.detailData = [];
  this.totalCount = 0;
  this.vehicleType = "ALL";
  this.getDetails();
}
  onPageSizeChange(event: any) {
  this.pageSize = event.target.value;
  this.pageCount = 1; // reset page
  this.getDetails();
}

  checkAlertCount(v: any): boolean {
    const total = (Number(v.over_speed_count) || 0) +
      (Number(v.harsh_brake_count) || 0) +
      (Number(v.tempared_count) || 0) +
      (Number(v.sos_count) || 0) ;
    return total > 50;
  }
  onDownloadChange() {
  if (this.downloadType === 'Excel') {
    this.downloadExcel();
  }

  // reset dropdown
  this.downloadType = '';
}
downloadExcel() {

  this.listLoaded = false;

  const payload = {
    param1: '',
    param2: this.pageCount.toString(),
    param3: this.pageSize.toString(),
    param4: this.fromDate,
    param5: this.toDate,
    param6: this.selectedVendorFilter || '',
    param7: this.vehicleType || 'ALL',
    pdfexcel: 'Excel'
  };

  this.alertService
    .VendorwiseinstalleddevicecountoverallComponent(payload)
    .subscribe({
      next: (response: any) => {

        this.listLoaded = true;

        if (response.status && response.entity) {

          const link = document.createElement('a');
          link.href = response.entity;
          link.target = '_blank';
          link.download = '';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

        }
      },
      error: () => {
        this.listLoaded = true;
      }
    });
}
}
