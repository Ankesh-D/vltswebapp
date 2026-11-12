import { Component, OnInit, ChangeDetectorRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';

import { Router, RouterModule } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { CheckHealthAckDetailsReq, UserCreationDetailsReq } from '../../../core/model/request.model';
import { ToastService } from '../../../core/services/toast.service';
import { CheckHealthAckResponse, UserCreationDetailsResp } from '../../../core/model/response.model';
import moment from 'moment';
import { DeviceService } from '../../../core/services/device.service';
import { DataTableColumn, DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { CommonDataToolbarComponent, PageSizeOption } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
@Component({
    selector: 'app-activation-acknowledgment',
    imports: [FormsModule, RouterModule, DataTableComponent, CommonDataToolbarComponent, PaginationComponent],
    templateUrl: './activation-acknowledgment.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './activation-acknowledgment.component.scss'
})
export class ActivationAcknowledgmentComponent implements OnInit {
  @ViewChild('searchVendorForm') searchVendorForm!: NgForm;
  public detailsRequest: CheckHealthAckDetailsReq = new CheckHealthAckDetailsReq();
  public detailsData: CheckHealthAckResponse[]=[];
  readonly tableColumns: DataTableColumn<CheckHealthAckResponse>[] = [
    { key: 'param1', header: '#', value: row => row.param1 || '-' },
    { key: 'param3', header: 'IMEI No', value: row => row.param3 || '-' },
    { key: 'param29', header: 'Health Packet', value: row => row.param29 || '-' },
    { key: 'param17', header: 'Received Time', value: row => row.param17 || '-' }
  ];

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
  dateRangeStart = moment().format('DD-MMM-YYYY');
  dateRangeEnd = moment().format('DD-MMM-YYYY');
  constructor(private deviceService: DeviceService, private toastService: ToastService, private router: Router) {
    this.toastService.pageName = 'Activation Acknowledgment';
  }
  ngOnInit(): void {
    this.roleId = sessionStorage.getItem('roleid');
    this.detailsRequest.param6 = this.dateRangeStart;
    this.detailsRequest.param7 = this.dateRangeEnd;
    setTimeout(() => {
      this.getDetails('init');  
    }, 500);
  }

  onDateRangeChange(range: { startDate: string; endDate: string }): void {
    this.dateRangeStart = range.startDate;
    this.dateRangeEnd = range.endDate;

    const startDate = moment(range.startDate, 'DD-MMM-YYYY', true);
    const endDate = moment(range.endDate, 'DD-MMM-YYYY', true);
    if (!startDate.isValid() || !endDate.isValid()) return;

    this.detailsRequest.param6 = range.startDate;
    this.detailsRequest.param7 = range.endDate;
    this.pageNo = 1;
    this.detailsRequest.param2 = this.pageNo;
    this.getDetails('filter');
  }

  onPageSizeChange(pageSize: PageSizeOption): void {
    this.pageSize = Number(pageSize);
    this.detailsRequest.param3 = this.pageSize;
    this.pageNo = 1;
    this.detailsRequest.param2 = this.pageNo;
    this.getDetails('pageSize');
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
    this.deviceService.smsacknowledgeResponse(this.detailsRequest).subscribe({
      
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

  onPageChange(page: number): void {
    this.changePage(page);
  }
  onDownloadChange() {}

  goToForm() {
    this.router.navigate(['/usercreation'])
  }
}
