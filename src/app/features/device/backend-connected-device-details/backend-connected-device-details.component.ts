import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BackendConnectedDeviceReq } from '../../../core/model/request.model';
import { BackendConnDeviceResponse } from '../../../core/model/response.model';
import { DeviceService } from '../../../core/services/device.service';
import { ToastService } from '../../../core/services/toast.service';
import moment from 'moment';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';

@Component({
    selector: 'app-backend-connected-device-details',
    imports: [CommonModule, FormsModule, RouterModule, CommonTableComponent],
    templateUrl: './backend-connected-device-details.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './backend-connected-device-details.component.scss'
})
export class BackendConnectedDeviceDetailsComponent implements OnInit {
  
  public detailsRequest: BackendConnectedDeviceReq = new BackendConnectedDeviceReq();
  public detailsData: BackendConnDeviceResponse[]=[];
  readonly tableColumns: CommonTableColumn<BackendConnDeviceResponse>[] = [
    { key: 'param1', label: '#' },
    { key: 'param2', label: 'IMEI No' },
    { key: 'param30', label: 'Packet Vendor' },
    { key: 'param3', label: 'Firmware Version' },
    { key: 'param4', label: 'Packet Type' },
    { key: 'param5', label: 'Alert ID' },
    { key: 'param6', label: 'Packet Status' },
    { key: 'param7', label: 'GPS Status' },
    { key: 'param8', label: 'Event Time' },
    { key: 'coordinates', headers: ['Latitude', 'Longitude'] },
    { key: 'direction', label: 'Direction' },
    { key: 'param14', label: 'Speed (kmph)' },
    { key: 'param16', label: 'Altitude (m)' },
    { key: 'mncMcc', headers: ['MNC', 'MCC'] },
    { key: 'operatorSatellites', headers: ['Operator', 'Satellite Count'] },
    { key: 'ignitionPower', headers: ['Ignition', 'Main Power'] },
    { key: 'param22', label: 'Client IP/Subnet' },
    { key: 'param29', label: 'M2M verification' },
    { key: 'param26', label: 'LAC' },
    { key: 'param27', label: 'Cell ID' },
    { key: 'param28', label: 'Signal' }
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
  onDownloadChange() {

  }
}
