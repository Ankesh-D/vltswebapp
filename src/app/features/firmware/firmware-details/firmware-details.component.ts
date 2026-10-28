import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { DeviceService, FirmwareDetailsReq, FirmwareDetailsResp } from '../../../core/services/device.service';
import { ToastService } from '../../../core/services/toast.service';

import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import moment from 'moment';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';

@Component({
    selector: 'app-firmware-details',
    imports: [FormsModule, RouterModule, CommonTableComponent],
    templateUrl: './firmware-details.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './firmware-details.component.scss'
})
export class FirmwareDetailsComponent implements OnInit {
  public detailsRequest: FirmwareDetailsReq = new FirmwareDetailsReq();
  public detailsData: FirmwareDetailsResp[]=[];

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
  readonly tableColumns: CommonTableColumn<FirmwareDetailsResp>[] = [
    { key: 'param1', label: '#' },
    { key: 'param9', label: 'Vendor Name', visible: () => this.roleId === '10' || this.roleId === '17' },
    { key: 'param11', label: 'Device Model' },
    { key: 'param3', label: 'Firmware Name' },
    { key: 'param5', label: 'Version', cellClass: 'text-end' },
    { key: 'param6', label: 'Release Date', cellClass: 'text-center' },
    { key: 'download', label: 'Download File', className: 'text-center', width: '250px' }
  ];
  constructor(private deviceService: DeviceService, private toastService: ToastService) {
    this.toastService.pageName = 'Firmware Details';
  }
  ngOnInit(): void {
    this.roleId = sessionStorage.getItem('roleid');
    console.log(this.roleId)
    this.getDetails('init');  
  }
  getDetails(tooluse?: any) {
    if(tooluse=='init' || tooluse=='search') {
      if(tooluse=='init') {
        this.detailsRequest.param1 = "";
      }
      this.detailsRequest.param2 = 1;
      this.detailsRequest.param3 = 10;
    }
    if(tooluse=='pagesize') {

    }
    this.deviceService.getFirmwareDetails(this.detailsRequest).subscribe({
      
      next: (res: any) => {
        if(res.statuscode==200) {
          this.detailsData = res?.entity?.listData || res?.entity || [];
          this.detailsData.map((x)=> {x.param6 = moment(x.param6).format('DD-MMM-YYYY')});
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

    this.getDetails('pagechage'); // 🔥 reload API
  }
  onDownloadChange() {

  }
  getFileName(url: string): string {
  return url.substring(url.lastIndexOf('/') + 1);
}
}
