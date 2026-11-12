import { Component, OnInit, ChangeDetectorRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';

import { Router, RouterModule } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { CheckHealthAckDetailsReq } from '../../../core/model/request.model';
import { ToastService } from '../../../core/services/toast.service';
import { CheckHealthAckResponse } from '../../../core/model/response.model';
import moment from 'moment';
import { DeviceService } from '../../../core/services/device.service';
import { CheckAcknowledgementComponent } from '../check-acknowledgement/check-acknowledgement.component';
import { CommonDataToolbarComponent, PageSizeOption } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { DataTableColumn, DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
@Component({
    selector: 'app-health-check',
    imports: [FormsModule, RouterModule, CheckAcknowledgementComponent, DataTableComponent, CommonDataToolbarComponent, PaginationComponent],
    templateUrl: './health-check.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './health-check.component.scss'
})
export class HealthCheckComponent implements OnInit {
  @ViewChild('searchVendorForm') searchVendorForm!: NgForm;
  public detailsRequest: CheckHealthAckDetailsReq = new CheckHealthAckDetailsReq();
  public detailsData: CheckHealthAckResponse[]=[];
  readonly tableColumns: DataTableColumn<CheckHealthAckResponse>[] = [
    { key: 'param1', header: '#' , value: item => item.param1 || '-', sortKey: 'param1' },
    { key: 'param2', header: 'IMEI No', value: item => item.param2 || '-', sortKey: 'param2' },
    { key: 'param21', header: 'Health Packet', value: item => item.param21 || '-', sortKey: 'param21' },
    { key: 'param12', header: 'Received Time', value: item => item.param12 || '-', sortKey: 'param12' }
  ];
  showAcknowledgementEntry: boolean = false;
  dateRangeStart = moment().format('DD-MMM-YYYY');
  dateRangeEnd = moment().format('DD-MMM-YYYY');

  pageSizeOptions: any[]=[10, 20, 50, 100, 500];
  isExporting: boolean = false;
  selectedDownloadType: any = '';
  totalCount: number = 0;
  pageCount: number = 0;
  totalPages: number = 0;
  pageSize: number = 10;
  loading: boolean= false;
  pageNo: number = 1;
  roleId: any;
  sortKey: string = '';
  reverse: boolean = false;
  constructor(private deviceService: DeviceService, private toastService: ToastService, private router: Router,  private cdr: ChangeDetectorRef) {
  }
  ngOnInit(): void {
    this.roleId = sessionStorage.getItem('roleid');
    this.detailsRequest.param6 = this.dateRangeStart;
    this.detailsRequest.param7 = this.dateRangeEnd;
    setTimeout(() => {
      this.getDetails('init');  
    }, 500);
    
  }

  getPaginatedData(): CheckHealthAckResponse[] {
       // API already returns paginated data, so just sort if needed
       // Note: In a production app, sorting should be done server-side
       // For now, we do client-side sorting on the current page
       let sorted = [...this.detailsData];
       if (this.sortKey) {
         sorted.sort((a: any, b: any) => {
           const aVal = String(a[this.sortKey] || '').toLowerCase();
           const bVal = String(b[this.sortKey] || '').toLowerCase();
           if (this.reverse) {
             return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
           } else {
             return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
           }
         });
       }
       return sorted;
    }

    onCellClick(event: { row: CheckHealthAckResponse; column: DataTableColumn<CheckHealthAckResponse> }) {
        // if (event.column.header === 'Approval' && event.row.param44 === 'Not Approve') {
        //   this.openApproveModal(event.row);
        // }
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

  onDateRangeChange(range: { startDate: string; endDate: string }): void {
    this.dateRangeStart = range.startDate;
    this.dateRangeEnd = range.endDate;

    if (!range.startDate && !range.endDate) {
      this.detailsRequest.param6 = '';
      this.detailsRequest.param7 = '';
    } else {
      const startDate = moment(range.startDate, 'DD-MMM-YYYY', true);
      const endDate = moment(range.endDate, 'DD-MMM-YYYY', true);
      if (!startDate.isValid() || !endDate.isValid()) return;

      this.detailsRequest.param6 = range.startDate;
      this.detailsRequest.param7 = range.endDate;
    }

    this.pageNo = 1;
    this.detailsRequest.param2 = this.pageNo;
    this.getDetails('filter');
  }
  
  getDetails(tooluse?: any) {
    if(tooluse=='init' || tooluse=='search') {
      if(tooluse=='init') {
        this.detailsRequest.param4 = "";
      }
      this.pageNo = 1;
      this.detailsRequest.param2 = this.pageNo;
      this.detailsRequest.param3 = this.pageSize;
    }
   
    this.loading=true;
    this.deviceService.checkHealthAckResponse(this.detailsRequest).subscribe({
      
      next: (res: any) => {
        this.loading=false;
        if(res.statuscode==200) {
          this.detailsData = res?.entity?.listData || res?.entity || [];
          const total = Number(res?.entity?.param1 || 0);
          this.totalCount = total;
          this.pageCount = this.detailsData.length;
          // ✅ pages
          this.totalPages = Math.ceil(total / this.pageSize);
        } else {
          this.toastService.show('No data found', 'error');
          this.detailsData = [];
          this.totalCount = 0;
          this.pageCount = 0;
          this.totalPages = 0;    
        }
    },
    error: (err: any) => {
        this.loading = false;
        console.error(err);
        this.toastService.show('Something went wrong', 'error');
      }
    });
  }
  changePage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.pageNo = p;
    this.detailsRequest.param2 = this.pageNo;
    this.getDetails('pagechage'); // 🔥 reload API
  }
  onDownloadChange() {}

  goToForm() {
    this.router.navigate(['acknowledgeactivation'])
  }
  onchangePage() {

    this.showAcknowledgementEntry = true
  }
  onStatusChange(event: boolean) {
    this.showAcknowledgementEntry = event;
    if (!event) {
      setTimeout(() => {
        this.getDetails('init');
      }, 1000);
    }
  }
onPageChange(page: number): void {
  this.pageNo = page;
  this.detailsRequest.param2 = page;
  this.getDetails('pagechage');
}

onPageSizeChange(pageSize: PageSizeOption): void {
  this.pageSize = Number(pageSize);
  this.detailsRequest.param3 = this.pageSize;
  this.pageNo = 1;
  this.detailsRequest.param2 = this.pageNo;
  this.getDetails('pageSize');
}
  exportToExcel() {}
}
