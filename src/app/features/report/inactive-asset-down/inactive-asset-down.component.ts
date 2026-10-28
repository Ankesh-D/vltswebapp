import { ChangeDetectorRef, Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { DashboardService } from '../../../core/services/dashboard.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { AlertService } from '../../../core/services/alert.service';
import { ToastService } from '../../../core/services/toast.service';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';

declare var $: any;
declare var moment: any;

@Component({
    selector: 'app-inactive-asset-down',
    imports: [CommonModule, FormsModule, NgSelectModule, CommonTableComponent],
    templateUrl: './inactive-asset-down.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './inactive-asset-down.component.scss'
})
export class InactiveAssetDownComponent implements OnInit {
  readonly tableColumns: CommonTableColumn[] = [
    { key: 'column1', label: '#', className: 'green py-1 text-center' },
    { key: 'column2', label: 'Vendor Name', className: 'green py-1 text-center' },
    { key: 'column3', label: 'Total Number Of VLTDs Activated', className: 'green py-1 text-center' },
    { key: 'column4', label: 'Inactive Assets', className: 'green py-1 text-center' }
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
totalCount: any;
vehicleType: string= "NEW";
  // selectedRange: any= {
  //   startDate: moment().subtract(7, 'days'),
  //   endDate: moment()
  // };
  // maxDate: any = moment(); // Set max date to today
fromDate: any;
toDate: any;
selectedDays: any = { label: '3 days', value: 3 };
daysOptions: any[] = [];
  constructor( private cd: ChangeDetectorRef, public alertService: AlertService, public dashboardService: DashboardService, public toastService: ToastService) { }
 ngOnInit(): void {
  this.toastService.pageName = 'Vendorwise inactive devices counts'; // Set page name for toast service
  // const today = new Date();
  for (let i = 1; i <= 100; i++) {
    this.daysOptions.push({ label: `${i} days`, value: i });
  }
  this.selectedDays = { label: '3 days', value: 3 }; // Default selection
  // const threeMonthsAgo = new Date();
  // threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  // this.selectedDateRange = {
  //   startDate: threeMonthsAgo,
  //   endDate: today
  // };
  // this.initiallizeDateRangePicker();
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

onDaysInputChange() {
  this.getDetails();
}
getDetails() {
  this.listLoaded = false; // 🔥 start loading

 const payload = {
    param1: '',
    param2: this.pageCount.toString(),
    param3: this.pageSize.toString(),
    param4: this.selectedDays.value || '',
    param5: this.selectedVendorFilter || '', 
    param6: this.vehicleType || 'NEW' // ✅ vehicle type/ old new
};

  this.alertService.VendorwiseInactiveAssetsCount(payload).subscribe({
    next: (response: any) => {
      if (response.statuscode == 200) {
        this.detailData = response.entity.listData || [];
        this.totalCount = response.entity.param1 || 0;
      } else {
        this.detailData = [];
        this.totalCount = 0;

      }
      this.listLoaded = true; // ✅ stop loading
    },
    error: () => {
      this.listLoaded = true; // ✅ stop loading even on error
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
  this.vehicleType = "NEW";
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
}
