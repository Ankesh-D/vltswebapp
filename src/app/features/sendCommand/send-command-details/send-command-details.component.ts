import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { DeviceService, FirmwareDetailsReq, FirmwareDetailsResp } from '../../../core/services/device.service';
import { ToastService } from '../../../core/services/toast.service';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import moment from 'moment';
import { Router } from '@angular/router';
import { CommonDataToolbarComponent, PageSizeOption } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { CommonPaginationComponent } from '../../../shared/components/common-pagination/common-pagination.component';
import { DataTableColumn, DataTableComponent } from '../../../shared/components/data-table/data-table.component';
@Component({
    selector: 'app-send-command-details',
    imports: [FormsModule, RouterModule, CommonDataToolbarComponent, CommonPaginationComponent, DataTableComponent],
    templateUrl: './send-command-details.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./send-command-details.component.scss']
})
export class SendCommandDetailsComponent implements OnInit {
  public detailsRequest: FirmwareDetailsReq = new FirmwareDetailsReq();
  public detailsData: FirmwareDetailsResp[] = [];

  pageSizeOptions: PageSizeOption[] = [20];
  totalCount: number = 0;
  pageCount: number = 0;
  totalPages: number = 0;
  pageSize = 20;
  loading = false;
  pageNo: number = 1;
  roleId: any;
  readonly tableColumns: DataTableColumn<FirmwareDetailsResp>[] = [
    { key: 'param1', header: '#', width: '50px' },
    { key: 'param8', header: 'Vendor Name', visible: () => this.roleId === '10' || this.roleId === '17' },
    { key: 'param9', header: 'Device Model' },
    { key: 'param5', header: 'Command Name' },
    { key: 'param6', header: 'Command Sent', className: 'text-end', cellStyle: { maxWidth: '400px', wordWrap: 'break-word' } },
    { key: 'param7', header: 'Command Executed Date', className: 'text-end' },
    {
      key: 'actions',
      header: 'Action',
      className: 'text-end',
      actions: [
        { label: 'Edit', icon: 'fa-edit', iconOnly: true, tone: 'primary', className: 'btn-outline-primary me-1', run: item => this.editCommand(item) },
        { label: 'Delete', icon: 'fa-trash', iconOnly: true, tone: 'danger', className: 'btn-outline-danger', run: item => this.openDeleteModal(item) }
      ]
    }
  ];
  selectedCommand: any = null;
  deleteRemark = '';
  showDeleteModal = false;
  constructor(private deviceService: DeviceService, private toastService: ToastService, private router: Router) {
    this.toastService.pageName = 'Send Command Details'; // Set page name for toast service
  }
  ngOnInit(): void {
    this.roleId = sessionStorage.getItem('roleid');
    // console.log(this.roleId)
    this.getDetails();
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

        this.getDetails();
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
  updatePageSizeOptions(): void {
    const options = [20];
    if (this.totalCount > 50) options.push(50);
    if (this.totalCount > 100) options.push(100);
    if (this.totalCount > 200) options.push(200);
    if (this.totalCount > 500) options.push(500);
    if (this.totalCount > 1000) options.push(1000);
    if (this.totalCount > 0 && this.totalCount < 100 && !options.includes(this.totalCount)) {
      options.push(this.totalCount);
    }
    this.pageSizeOptions = options;
  }
  getDetails(): void {
    this.detailsRequest.param2 = this.pageNo;
    this.detailsRequest.param3 = this.pageSize;
    this.loading = true;

    this.deviceService.getCommandDetails(this.detailsRequest).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.statuscode === 200) {
          const rows = res?.entity?.listData || res?.entity || [];
          this.detailsData = Array.isArray(rows) ? rows : [];
          this.detailsData.forEach(row => {
            if (row.param7) row.param7 = moment(row.param7).format('DD-MMM-YYYY');
          });

          this.totalCount = Number(res?.entity?.param1 || 0);
          this.pageCount = this.detailsData.length;
          this.totalPages = Math.ceil(this.totalCount / this.pageSize);
          this.updatePageSizeOptions();
        } else {
          this.toastService.show('No data found', 'error');
          this.detailsData = [];
          this.totalCount = 0;
          this.pageCount = 0;
          this.totalPages = 0;
          this.updatePageSizeOptions();
        }
      },
      error: (err) => {
        this.loading = false;
        this.detailsData = [];
        this.totalCount = 0;
        this.pageCount = 0;
        this.totalPages = 0;
        console.error(err);
        this.toastService.show(err?.error?.entity || 'Something went wrong', 'error');
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

  openDeleteModal(item: any) {
    this.selectedCommand = item;
    this.deleteRemark = '';
    this.showDeleteModal = true;
  }
}