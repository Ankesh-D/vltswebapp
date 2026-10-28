import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { VahanService } from '../../../core/services/vahan.service';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { ToastService } from '../../../core/services/toast.service';
import moment from 'moment';
import dayjs from 'dayjs';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';
declare var $: any;
@Component({
    selector: 'app-vahan-success',
    imports: [CommonModule, FormsModule, RouterModule, NgxDaterangepickerMd, NgbPaginationModule, CommonTableComponent],
    templateUrl: './vahan-success.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./vahan-success.component.scss']
})
export class VahanSuccessComponent implements OnInit {
  vahanData: any[] = [];
  loading = false;
  errorMessage = '';
  searchText = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [20];
  totalCount = 0;
  pageCount = 0;
selectedDateRange = {
  startDate: moment().subtract(1, 'day').startOf('day'),
  endDate: moment().endOf('day')
};
maxDate:any;



  // Date filters
  fromDate: string = '';
  toDate: string = '';
  
  // Sorting
  sortKey: string = '';
  reverse: boolean = false;
  readonly tableColumns: CommonTableColumn<any>[] = [
    { key: 'param1', header: '#', width: '40px', sortable: false },
    { key: 'param10', header: 'Vehicle No.', sortable: true },
    { key: 'serial', headers: ['Serial No.', 'IMEI No.'], sortable: true, sortKey: 'param2' },
    { key: 'param7', header: 'Vendor', sortable: true },
    { key: 'activation', headers: ['Activation No.', 'Activation Date'], sortable: true, sortKey: 'param3' },
    { key: 'param11', header: 'Valid Upto', sortable: true },
    { key: 'param5', header: 'Sim Validity', sortable: true },
    { key: 'param12', header: 'Vahan Uploaded Date', sortable: true },
    { key: 'param9', header: 'Response', sortable: true },
    { key: 'action', header: 'Action' }
  ];

  constructor(
    
    private vahanService: VahanService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {
    this.toast.pageName = 'Push To Vahan Success'; // Set page name for toast service
  }

ngOnInit() {
 const today = new Date(); // ✅ IMPORTANT

  this.fromDate = this.formatDate(today);
  this.toDate = this.formatDate(today);
 



  this.loadVahanSuccess();
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


  loadVahanSuccess() {
      if (this.selectedDateRange?.startDate && this.selectedDateRange?.endDate) {
  this.fromDate = this.selectedDateRange.startDate.format('YYYY-MM-DD');
this.toDate = this.selectedDateRange.endDate.format('YYYY-MM-DD');
  }
    this.loading = true;
    this.errorMessage = '';
    
    const request = {
      param1: this.searchText.trim(),
      param2: this.currentPage.toString(),
      param3: this.pageSize.toString(),
      param4: 'Success',
      param5: this.fromDate,
      param6: this.toDate,
      param7: '' // source parameter
    };

  this.vahanService.getVahanUploadedDevices(request).subscribe({
  next: (response) => {
    this.loading = false;

    if (response?.status && response?.entity) {

      if (response.entity.listData !== undefined) {
        this.vahanData = response.entity.listData || [];

        if (response.entity.param1 !== undefined && response.entity.param1 !== null) {
          this.totalCount = Number(response.entity.param1) || 0;
        }
      } else {
        this.vahanData = [];
      }

      this.pageCount = this.vahanData.length < this.pageSize
        ? this.vahanData.length
        : this.pageSize;

      this.updatePageSizeOptions();
      this.cdr.detectChanges();

      if (this.isReload) {
  this.isReload = false; // reset
} else {
 // this.toast.show('Data loaded successfully', 'success');
}

    } else {
      this.vahanData = [];
      this.cdr.detectChanges();

      this.toast.show('Failed to load Vahan data ', 'error');
    }
  },

  error: (error) => {
    this.loading = false;
    this.vahanData = [];

    console.error('Error loading Vahan success:', error);

    this.cdr.detectChanges();

    this.toast.show('Error loading data. Please try again ', 'error');
  }
});
  }

  

  onPageSizeChange(size: number | string) {
    if (size === 'All' || size === this.totalCount) {
      this.pageSize = this.totalCount;
    } else {
      this.pageSize = Number(size);
    }
    this.currentPage = 1;
    this.loadVahanSuccess();
  }

  onPageChange(page: number) {
    if (page < 1) return;
    const totalPages = this.getTotalPages();
    if (this.totalCount > 0 && page > totalPages) return;
    this.currentPage = page;
    this.loadVahanSuccess();
  }
isReload = false;
 reloadData() {
  this.searchText = '';
  this.currentPage = 1;
  this.pageSize = 20;
  this.isReload = true; // 🔥 mark reload

  this.loadVahanSuccess();
}

  getSearchDetails() {
    this.currentPage = 1;
    this.loadVahanSuccess();
  }

  sort(key: string) {
    if (this.sortKey === key) {
      this.reverse = !this.reverse;
    } else {
      this.sortKey = key;
      this.reverse = false;
    }
    this.cdr.detectChanges();
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

  onView() {
    this.currentPage = 1;
    this.loadVahanSuccess();
  }

  hasLength(value: any): boolean {
    return value && String(value).length > 0;
  }


formatDate(date: Date): string {
  return date.toISOString().split('T')[0]; 
}
onDateRangeChange(e: any) {
  if (!e?.startDate || !e?.endDate) return;

  this.fromDate = e.startDate.format('YYYY-MM-DD');
  this.toDate = e.endDate.format('YYYY-MM-DD');

  // console.log('Start:', this.fromDate);
  // console.log('End:', this.toDate);

  this.loadVahanSuccess();
}

formatDisplayDate(date: any): string {
  if (!date) return 'NA';

  const m = moment(date, ['YYYY-MM-DD', 'DD-MMM-YYYY', 'DD-MM-YYYY'], true);

  return m.isValid() ? m.format('DD-MMM-YYYY') : date;
}
onRepush(dev: any) {
const payload = {
  deviceSerialNo: dev.param2,
  vehicleReceiptNo: dev.param3,
  vehicleregdate: moment(dev.param4).format('DD-MMM-YYYY'),
  primarysimvalidity: moment(dev.param5).format('DD-MMM-YYYY'),
  validityupto: moment(dev.param11).format('DD-MMM-YYYY')
};

  console.log('Repush Payload:', payload);

  this.vahanService.psvPushToVahan(payload).subscribe({
    next: (res: any) => {
      console.log('Repush Response:', res);

      if (res.status) {
       this.toast.show(res.message, 'success');
       this.reloadData();
      } else {
       this.toast.show(res.message || 'Repush Failed ', 'error');
      }
      },
    error: (err) => {
      console.error('Repush Error:', err);
      this.toast.show('API Error ', 'error');
      // this.reloadData();
    }

  });
}
}
