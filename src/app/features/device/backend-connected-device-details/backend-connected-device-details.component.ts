import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BackendConnectedDeviceReq } from '../../../core/model/request.model';
import { BackendConnDeviceResponse } from '../../../core/model/response.model';
import { DeviceService } from '../../../core/services/device.service';
import { ToastService } from '../../../core/services/toast.service';
import { CommonDataToolbarComponent, PageSizeOption } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
    selector: 'app-backend-connected-device-details',
    imports: [CommonModule, CommonDataToolbarComponent, PaginationComponent],
    templateUrl: './backend-connected-device-details.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './backend-connected-device-details.component.scss'
})
export class BackendConnectedDeviceDetailsComponent implements OnInit {
  
  public detailsRequest: BackendConnectedDeviceReq = new BackendConnectedDeviceReq();
  public detailsData: BackendConnDeviceResponse[]=[];

  pageSizeOptions: any[]=[10, 20, 50, 100, 500];
  totalCount: number = 0;
  pageCount: number = 0;
  totalPages: number = 0;
  pageSize: number = 10;
  loading: boolean= false;
  pageNo: number = 1;
  roleId: any;
  constructor(private deviceService: DeviceService, private toastService: ToastService) {
    this.toastService.pageName = 'Backend Connected Device Details';
  }
  ngOnInit(): void {
    this.roleId = sessionStorage.getItem('roleid');
    this.getDetails('init');  
  }
  getDetails(tooluse?: any) {
    if(tooluse=='init' || tooluse=='search') {
      if(tooluse=='init') {
        this.detailsRequest.param4 = "";
      }
      // this.totalCount = 0;
      this.pageNo = 1;
      this.pageSize = 10;

      this.detailsRequest.param2 = 1;
      this.detailsRequest.param3 = 10;
    }
    if(tooluse=='pageSize') {
      this.pageNo = 1;
      this.pageSize = Number(this.detailsRequest.param3) || this.totalCount || 10;
      this.detailsRequest.param2 = 1;
      this.detailsRequest.param3 = this.pageSize;
    }
    this.loading=true;
    this.deviceService.getBackendconnDeviceDetails(this.detailsRequest).subscribe({
      
      next: (res: any) => {
        this.loading=false;
        if(res.statuscode==200) {
          this.detailsData = res?.entity?.listData || res?.entity || [];
          const total = Number(res?.entity?.param1 || 0);
          this.totalCount = total;
          this.pageCount = this.detailsData.length;
          // ✅ pages
          this.totalPages = total > 0 ? Math.ceil(total / this.pageSize) : 0;
          if (this.pageNo > this.totalPages && this.totalPages > 0) {
            this.pageNo = this.totalPages;
            this.detailsRequest.param2 = this.pageNo;
          }
          // Server reported records but this specific page came back empty
          // (stale/inconsistent total count) - fall back to the previous page.
          if (this.pageCount === 0 && total > 0 && this.pageNo > 1) {
            this.totalPages = this.pageNo - 1;
            this.pageNo = this.totalPages;
            this.detailsRequest.param2 = this.pageNo;
            this.toastService.show('Reached end of available data, showing last available page', 'error');
         
            return;
          }
          console.log('totalPages', this.totalPages);
        } else {
          this.toastService.show('No data found', 'error');
          this.detailsData = [];
          this.totalCount = 0;
          this.pageCount = 0;
          this.totalPages = 0;    
        }
    },
    error: (err) => {
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

  onPageSizeChange(pageSize: PageSizeOption): void {
    this.pageSize = pageSize === 'All' ? this.totalCount : Number(pageSize);
    this.detailsRequest.param3 = this.pageSize;
    this.getDetails('pageSize');
  }
}
