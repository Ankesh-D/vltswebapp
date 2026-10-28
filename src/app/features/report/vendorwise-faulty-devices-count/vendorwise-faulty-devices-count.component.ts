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
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

import { CommonDataToolbarComponent } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';
declare var $: any;
declare var moment: any;
@Component({
    selector: 'app-vendorwise-faulty-devices-count',
    imports: [CommonModule,
        FormsModule,
        RouterModule,
        NgSelectModule,
        NgxDaterangepickerMd,
        NgbPaginationModule,
        CommonDataToolbarComponent,
        CommonTableComponent
    ],
    templateUrl: './vendorwise-faulty-devices-count.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./vendorwise-faulty-devices-count.component.scss']
})
export class VendorwiseFaultyDevicesCountComponent implements OnInit {
  readonly rowClass = (row: any): string => this.checkAlertCount(row) ? 'high-alert-row' : '';
  readonly tableColumns: CommonTableColumn<any>[] = [
    { key: 'param1', label: '#', className: 'green py-1 text-center', cellClass: 'text-end px-2', clickable: () => true },
    { key: 'param3', label: 'Vendor Name', className: 'green py-1 text-center', cellClass: 'text-left px-2 fw-bold text-primary', clickable: () => true },
    { key: 'param4', label: 'Faulty device count', className: 'green py-1 text-end', cellClass: 'text-end px-2', clickable: () => true },
    { key: 'param5', label: 'Activated', className: 'green py-1 text-end', cellClass: 'text-end px-2', clickable: () => true },
    { key: 'param6', label: 'Not Activated', className: 'green py-1 text-end', cellClass: 'text-end px-2', clickable: () => true }
  ];

  detailData: any[] = [];
  detailModalData: any[] = [];
  selectedVendorName: string = '';
  selectedVendorId: string = '';
  showDetailsModal: boolean = false;
  detailModalLoading = false;
  detailModalPageCount: number = 1;
  detailModalPageSize: number = 20;
  alertType: string = '';
  dateTimeout: any;
  searchBy: any = "";
  listLoaded: boolean = true;
  pageSize: number = 20;
  pageSizeOptions: number[] = [20, 30, 40, 50, 100];
  pageCount: number = 1;
  selectedVendorFilter: any = null;
  vendorlist: any[] = [];
  downloadType: string = '';
  totalCount: any;
  totalfaultydevicecount=0;
  total_faultydevicecount_activated=0;
  total_faultydevicecount_notactivated=0;
  vehicleType: string= "ALL";
  fromDate: any;
  toDate: any;

  constructor( private cd: ChangeDetectorRef, public alertService: AlertService, public dashboardService: DashboardService, public toastService: ToastService) {
    this.toastService.pageName = 'Vendorwise Installed Device Count Overall Report';
  }
    checkAlertCount(item: any): boolean {
    return Number(item?.param4) > 0;
  }

  ngOnInit(): void {
    this.initiallizeDateRangePicker();
    setTimeout(()=> {
      this.getDetails();
      this.loadVendorList();
    }, 200)
  }
  detailModalTotalCount: number = 0;
  openVendorDetails(vendor: any) {
    this.selectedVendorId = vendor.param2;
    this.selectedVendorName = vendor.param3 || 'Vendor Details';
    this.showDetailsModal = true;
    this.detailModalPageCount = 1;
    this.loadVendorDetails(this.detailModalPageCount);
  }

  loadVendorDetails(page: number = 1) {
    this.detailModalLoading = true;
    this.detailModalPageCount = page;
    this.detailModalData = [];

    const payload = {
      param1: '',
      param2: '',//this.detailModalPageCount.toString(),
      param3: '', //this.detailModalPageSize.toString(),
      param4: moment(this.fromDate).format('DD-MMM-YYYY'),
      param5: moment(this.toDate).format('DD-MMM-YYYY'),
      param6: this.selectedVendorId || '',
      param7: this.vehicleType || 'ALL',
      param8: '',
      param9: '',
      pdfexcel: ''
    };

    this.alertService.vendorwisefaultydevicesdetails(payload).subscribe({
      next: (response: any) => {
        this.detailModalLoading = false;
        this.detailModalData = response.entity?.listData || [];
        this.filteredData = [...this.detailModalData];
        this.detailModalTotalCount = response.entity?.param1 || 1;
        this.cd.detectChanges();
      },
      error: () => {
        this.detailModalLoading = false;
        this.detailModalData = [];
        this.cd.detectChanges();
      }
    });
  }

  previousDetailModalPage() {
    if (this.detailModalPageCount > 1) {
      this.loadVendorDetails(this.detailModalPageCount - 1);
    }
  }

  nextDetailModalPage() {
    if (this.detailModalData.length >= this.detailModalPageSize) {
      this.loadVendorDetails(this.detailModalPageCount + 1);
    }
  }

  closeVendorDetails() {
    this.showDetailsModal = false;
    this.detailModalData = [];
    this.selectedVendorName = '';
    this.selectedVendorId = '';
    this.detailModalPageCount = 1;
  }

  onPageSizeChange(event: any) {
    this.pageSize = Number(event.target.value);
    this.pageCount = 1;
    this.getDetails();
  }
  searchText: string = '';
  filteredData: any[] = [];
  filterData(): void {

  const search = this.searchText.trim().toLowerCase();

  if (!search) {
    this.filteredData = [...this.detailModalData];
    return;
  }

  this.filteredData = this.detailModalData.filter(item =>
      Object.values(item).some(value =>
          String(value ?? '').toLowerCase().includes(search)
      )
  );
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
      .VendorwiseFaultyDevicesCountComponent(payload)
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
      .VendorwiseFaultyDevicesCountComponent(payload)
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
      param8: '',
      param9: '',
      pdfexcel:""
    };

    this.alertService
      .VendorwiseFaultyDevicesCountComponent(payload)
      .subscribe({
        next: (response: any) => {
          this.detailData = response.entity?.listData || [];
          if (response.statuscode === 200) {

            if (typeof response.entity === 'string') {
              this.detailData = [];
            } else {
             this.detailData = response.entity?.listData || [];
              this.totalCount = response.entity.param1 || 0;
              this.totalfaultydevicecount = response.entity.param2 || 0;
              this.total_faultydevicecount_activated = response.entity.param3 || 0;
              this.total_faultydevicecount_notactivated = response.entity.param4 || 0;
            }
          } else {
            this.detailData = [];
            this.totalCount = 0;
            this.totalfaultydevicecount = 0;
            this.total_faultydevicecount_activated = 0;
            this.total_faultydevicecount_notactivated = 0;
          }

          this.listLoaded = true;
          this.cd.detectChanges();
        },
        error: () => {
          this.detailData = [];
          this.totalCount = 0;
          this.totalfaultydevicecount = 0;
          this.total_faultydevicecount_activated = 0;
          this.total_faultydevicecount_notactivated = 0;
          this.listLoaded = true;
          this.cd.detectChanges();
        }
      });
  }
  onPageChange(page: number) {
    this.pageCount = page;
    this.getDetails();
  }
  onModalPageChange(page: number) {
    this.loadVendorDetails(page);
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
    this.pageSize = 20;
    this.listLoaded = false;
    this.totalCount = 0;
    this.vehicleType = "ALL";
    this.getDetails();
  }
  onDownloadChange() {
    if (this.downloadType === 'Excel') {
      this.downloadExcel();
    }

    // reset dropdown
    this.downloadType = '';
  }

  // checkAlertCount(item: any): boolean {
  //   return Number(item?.param4) > 0;
  // }
}
