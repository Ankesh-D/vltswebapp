import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { DeviceService, FirmwareDetailsReq, FirmwareDetailsResp } from '../../../core/services/device.service';
import { ToastService } from '../../../core/services/toast.service';
import { RouterModule } from '@angular/router';
import moment from 'moment';
import { CommonDataToolbarComponent, PageSizeOption } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { DataTableColumn, DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { CommonPaginationComponent } from '../../../shared/components/common-pagination/common-pagination.component';

@Component({
    selector: 'app-firmware-details',
    imports: [RouterModule, CommonDataToolbarComponent, DataTableComponent, CommonPaginationComponent],
    templateUrl: './firmware-details.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './firmware-details.component.scss'
})
export class FirmwareDetailsComponent implements OnInit {
  public detailsRequest: FirmwareDetailsReq = new FirmwareDetailsReq();
  public detailsData: FirmwareDetailsResp[] = [];

  pageSizeOptions: PageSizeOption[] = [10, 20, 50, 100, 500];
  totalCount: number = 0;
  pageCount: number = 0;
  totalPages: number = 0;
  pageSize: number = 10;
  loading = false;
  pageNo: number = 1;
  roleId: any;
  readonly tableColumns: DataTableColumn<FirmwareDetailsResp>[] = [
    { key: 'param1', header: '#', width: '50px' },
    { key: 'param9', header: 'Vendor Name', visible: () => this.roleId === '10' || this.roleId === '17' },
    { key: 'param11', header: 'Device Model' },
    { key: 'param3', header: 'Firmware Name' },
    { key: 'param5', header: 'Version', className: 'text-end' },
    { key: 'param6', header: 'Release Date', className: 'text-center' },
    { key: 'download', header: 'Download File', className: 'text-center', width: '250px' }
  ];
  constructor(private deviceService: DeviceService, private toastService: ToastService) {
    this.toastService.pageName = 'Firmware Details';
  }
  ngOnInit(): void {
    this.roleId = sessionStorage.getItem('roleid');
    this.getDetails();
  }

  getDetails(): void {
    this.detailsRequest.param2 = this.pageNo;
    this.detailsRequest.param3 = this.pageSize;
    this.loading = true;
    this.deviceService.getFirmwareDetails(this.detailsRequest).subscribe({
      next: (res: any) => {
        if(res.statuscode==200) {
          const rows = res?.entity?.listData || res?.entity || [];
          this.detailsData = Array.isArray(rows) ? rows : [];
          this.detailsData.forEach(row => {
            row.param6 = row.param6 ? moment(row.param6).format('DD-MMM-YYYY') : '';
          });
          const total = Number(res?.entity?.param1 || 0);
          this.totalCount = total;
          this.pageCount = this.detailsData.length;
          this.totalPages = Math.ceil(total / this.pageSize);
        } else {
          this.toastService.show('No data found', 'error');
          this.detailsData = [];
          this.totalCount = 0;
          this.pageCount = 0;
          this.totalPages = 0;    
        }
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.detailsData = [];
        this.pageCount = 0;
        console.error(err);
        this.toastService.show('Something went wrong', 'error');
      }
    });
  }

  getSearchDetails(): void {
    this.pageNo = 1;
    this.getDetails();
  }

  reloadData(): void {
    this.detailsRequest.param1 = '';
    this.pageNo = 1;
    this.getDetails();
  }

  onPageSizeChange(size: PageSizeOption): void {
    const parsedSize = Number(size);
    if (!Number.isFinite(parsedSize) || parsedSize < 1) return;
    this.pageSize = parsedSize;
    this.pageNo = 1;
    this.getDetails();
  }

  changePage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.pageNo = p;

    this.getDetails();
  }

  getFileName(url: string): string {
    return url.substring(url.lastIndexOf('/') + 1);
  }
}
