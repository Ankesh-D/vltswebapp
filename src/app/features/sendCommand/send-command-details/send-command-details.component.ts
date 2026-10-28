import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { DeviceService, FirmwareDetailsReq, FirmwareDetailsResp } from '../../../core/services/device.service';
import { ToastService } from '../../../core/services/toast.service';

import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import moment from 'moment';
import { Router } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';
@Component({
    selector: 'app-send-command-details',
    imports: [FormsModule, RouterModule, NgbPaginationModule, CommonTableComponent],
    templateUrl: './send-command-details.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./send-command-details.component.scss']
})
export class SendCommandDetailsComponent implements OnInit {
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
    { key: 'param8', label: 'Vendor Name', visible: () => this.roleId === '10' || this.roleId === '17' },
    { key: 'param9', label: 'Device Model' },
    { key: 'param5', label: 'Command Name' },
    { key: 'param6', label: 'Command Sent', cellClass: 'text-end' },
    { key: 'param7', label: 'Command Executed Date', cellClass: 'text-end' },
    {
      key: 'actions',
      label: 'Action',
      className: 'text-end',
      actions: [
        { label: 'Edit', icon: 'fa fa-edit', iconOnly: true, tone: 'primary', className: 'btn-outline-primary me-1', run: item => this.editCommand(item) },
        { label: 'Delete', icon: 'fa fa-trash', iconOnly: true, tone: 'danger', className: 'btn-outline-danger', run: item => this.openDeleteModal(item) }
      ]
    }
  ];
  selectedCommand: any = null;
deleteRemark: string = '';
showDeleteModal: boolean = false;
  constructor(private deviceService: DeviceService, private toastService: ToastService, private router: Router) {
    this.toastService.pageName = 'Send Command Details'; // Set page name for toast service
  }
  ngOnInit(): void {
    this.roleId = sessionStorage.getItem('roleid');
    // console.log(this.roleId)
    this.getDetails('init');  
  }
  editCommand(item: any) {

  this.router.navigate(
    ['/command/entry'],
    {
      state: {
        commandData: item
      }
    }
  );

}
deleteCommand() {

  if (!this.deleteRemark?.trim()) {
    this.toastService.show('Please enter remark', 'error');
    return;
  }

  const payload = {
    commandid: this.selectedCommand.param2,
    remark: this.deleteRemark
  };

  this.deviceService.deleteCommand(payload).subscribe({
    next: (res: any) => {

      if (res.statuscode === 200) {

        this.toastService.show(res.entity, 'success');

        this.showDeleteModal = false;

        this.getDetails('search');
      }
      else {
        this.toastService.show(res.entity, 'error');
      }
    },
    error: (err) => {
      this.toastService.show('Delete failed', 'error');
    }
  });
}
 updatePageSizeOptions() {
    // Generate page size options based on total count
    const options = [20];
    if (this.totalCount > 50) options.push(50);
    if (this.totalCount > 100) options.push(100);
    if (this.totalCount > 200) options.push(200);
    if (this.totalCount > 500) options.push(500);
    if (this.totalCount > 1000) options.push(1000);
    if (this.totalCount > 0 && this.totalCount < 100) options.push(this.totalCount); // 'All'
    this.pageSizeOptions = options;
  }
getDetails(tooluse?: any) {

  if (tooluse == 'init' || tooluse == 'search') {

    if (tooluse == 'init') {
      this.detailsRequest.param1 = '';
    }

    this.detailsRequest.param2 = 1;
    this.detailsRequest.param3 = 20;
  }

  this.loading = true;

  this.deviceService.getCommandDetails(this.detailsRequest).subscribe({

    next: (res: any) => {

      this.loading = false;

      if (res.statuscode == 200) {
        
        this.detailsData = res?.entity?.listData || res?.entity || [];

        this.detailsData.forEach((x: any) => {
          if (x.param7) {
            x.param7 = moment(x.param7).format('DD-MMM-YYYY');
          }
        });

        const total = Number(res?.entity?.param1 || 0);

        this.totalCount = total;
        this.pageCount = this.detailsData.length;
        this.totalPages = Math.ceil(total / Number(this.detailsRequest.param3));
        this.updatePageSizeOptions();
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

      this.toastService.show(
        err?.error?.entity || 'Something went wrong',
        'error'
      );
    }
  });
}
onPageChange(page: number) {
    this.detailsRequest.param3 = Number(page);
    this.getDetails('pageChange');
  }
  changePage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.pageNo = p;

    this.getDetails('pageChange'); // 🔥 reload API
  }
  onDownloadChange() {

  }
  getFileName(url: string): string {
    return url.substring(url.lastIndexOf('/') + 1);
  }
openDeleteModal(item: any) {
  this.selectedCommand = item;
  this.deleteRemark = '';
  this.showDeleteModal = true;
}
}