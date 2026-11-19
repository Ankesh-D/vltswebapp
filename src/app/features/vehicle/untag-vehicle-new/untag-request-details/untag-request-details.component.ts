import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { UntagRequestDetailsReq } from '../../../../core/model/request.model';
import { UntaggedRequestDetailsResp } from '../../../../core/model/response.model';
import { DeviceService } from '../../../../core/services/device.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CommonDataToolbarComponent } from '../../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { DataTableColumn, DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';

@Component({
    selector: 'app-untag-request-details',
    imports: [CommonDataToolbarComponent, DataTableComponent, PaginationComponent],
    templateUrl: './untag-request-details.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './untag-request-details.component.scss'
})
export class UntagRequestDetailsComponent implements OnInit {
  public detailsRequest: UntagRequestDetailsReq = new UntagRequestDetailsReq();
  public detailsData: UntaggedRequestDetailsResp[] = [];
  showAcknowledgementEntry: boolean = false;
  isDatePickerInitialized: boolean = false;

  pageSizeOptions: number[] = [10, 20, 50, 100, 500];
  totalCount: number = 0;
  pageCount: number = 0;
  pageSize: number = 20;
  loading: boolean= false;
  roleId: any;
  selectedDate: string = "";
  readonly tableColumns: DataTableColumn<UntaggedRequestDetailsResp>[] = [
    { header: 'Sr. No.', key: 'param1', width: '50px' },
    {
      headers: ['IMEI No.', 'Serial No.', 'ICCID No.'],
      cellClassName: 'multiline-cell',
      value: item => this.joinValues(item.param3, item.param4, item.param5)
    },
    {
      headers: ['Vehicle No.', 'Chassis No.', 'Engine No.'],
      cellClassName: 'multiline-cell',
      value: item => this.joinValues(item.param9, item.param10, item.param11)
    },
    { header: 'Vendor Name', key: 'param7' },
    {
      headers: ['Vehicle Type', 'Mfg. Year'],
      cellClassName: 'multiline-cell',
      value: item => this.joinValues(item.param14, item.param13)
    },
    {
      headers: ['Activation Date', 'Validity Upto'],
      width: '100px',
      cellClassName: 'multiline-cell',
      value: item => this.joinValues(item.param12, item.param15)
    },
    {
      headers: ['Customer Name', 'Customer Mobile No.'],
      cellClassName: 'multiline-cell',
      value: item => this.joinValues(item.param17, item.param18)
    },
    {
      headers: ['Last Polling Time', 'Last Alert'],
      cellClassName: 'multiline-cell',
      value: item => this.joinValues(item.param19, item.param20)
    },
    {
      headers: ['Request Time', 'Reason'],
      cellClassName: 'multiline-cell',
      value: item => this.joinValues(item.param22, item.param23)
    },
    { header: 'Action Status', key: 'param24' },
    {
      headers: ['Action Time', 'Action Remark'],
      cellClassName: 'multiline-cell',
      value: item => this.joinValues(item.param25, item.param26)
    }
  ];

  constructor(private deviceService: DeviceService, private toastService: ToastService, private router: Router) {
  }

  private joinValues(...values: Array<string | null | undefined>): string {
    return values.map(value => value || '-').join('\n');
  }

  ngOnInit(): void {
    this.pageSize = Number(this.detailsRequest.param3) || 20;
    this.getDetails('init');
  }
  updatePageSizeOptions() {
    const options = [20];
    if (this.totalCount > 50) options.push(50);
    if (this.totalCount > 100) options.push(100);
    if (this.totalCount > 200) options.push(200);
    if (this.totalCount > 500) options.push(500);
    if (this.totalCount > 0 && this.totalCount < 100 && !options.includes(this.totalCount)) {
      options.push(this.totalCount);
    }
    this.pageSizeOptions = options;
  }

  getDetails(tooluse: 'init' | 'search' | 'pageSize' | 'pagechange' | 'reload' = 'init') {
    if (tooluse === 'init') {
        this.detailsRequest.param4 = "";
    }
    if (tooluse === 'search' || tooluse === 'pageSize') {
      this.detailsRequest.param2 = 1;
    }
    if (tooluse === 'reload') {
      this.detailsRequest.param2 = 1;
      this.detailsRequest.param4 = "";
      this.detailsRequest.param3 = 20;
    }

    this.pageSize = Number(this.detailsRequest.param3) || 20;
    this.loading=true;
    this.deviceService.untaggedRequestsResponse(this.detailsRequest).subscribe({
      
      next: (res: any) => {
        this.loading=false;
        if(res.statuscode==200) {
          this.detailsData = res?.entity?.listData || res?.entity || [];
          const total = Number(res?.entity?.param1 || 0);
          this.totalCount = total;
          this.pageCount = this.detailsData.length;
          this.updatePageSizeOptions()
        } else {
          this.detailsData = [];
          this.totalCount = 0;
          this.pageCount = 0;
          this.toastService.show('No data found', 'error');
        }
    },
    error: (err: any) => {
        this.loading = false;
        console.error(err);
        this.toastService.show('Something went wrong', 'error');
      }
    });
  }

  onPageSizeChange(size: number | string): void {
    this.pageSize = size === 'All' || Number(size) === this.totalCount
      ? this.totalCount
      : Number(size);
    this.detailsRequest.param3 = this.pageSize;
    this.detailsRequest.param2 = 1;
    this.getDetails('pageSize');
  }

  goToForm() {
    this.router.navigate(['acknowledgeactivation'])
  }
  onchangePage() {

    this.showAcknowledgementEntry = true
  }
  onPageChange(page: number) {
    this.detailsRequest.param2 = Number(page);
    this.getDetails('pagechange');
  }
}
