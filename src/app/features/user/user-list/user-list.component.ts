import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { Router, RouterModule } from '@angular/router';
import { UserCreationDetailsReq } from '../../../core/model/request.model';
import { ToastService } from '../../../core/services/toast.service';
import { UserService } from '../../../core/services/user.service';
import { UserCreationDetailsResp } from '../../../core/model/response.model';
import { CommonDataToolbarComponent } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { DataTableColumn, DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
    selector: 'app-user-list',
    imports: [RouterModule, CommonDataToolbarComponent, DataTableComponent, PaginationComponent],
    templateUrl: './user-list.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  
  public detailsRequest: UserCreationDetailsReq = new UserCreationDetailsReq();
  public detailsData: UserCreationDetailsResp[]=[];

  pageSizeOptions: number[] = [10, 20, 50, 100, 500];
  totalCount: number = 0;
  pageCount: number = 0;
  pageSize: number = 10;
  loading: boolean= false;
  readonly tableColumns: DataTableColumn<UserCreationDetailsResp>[] = [
    { key: 'param1', header: '#' , value: item => item.param1 || '-' },
    { key: 'param16', header: 'Role', value: item => item.param16 || '-' },
    { key: 'param23', header: 'Owner Name', value: item => item.param23 || '-' },
    { key: 'param20', header: 'Login Name', value: item => item.param20 || '-' },
    { key: 'param5', header: 'Contact Person', value: item => item.param5 || '-' },
    { key: 'param12', header: 'State', value: item => item.param12 || '-' },
    { key: 'param11', header: 'City', value: item => item.param11 || '-' },
    { key: 'param9', header: 'Address', value: item => item.param9 || '-' },
    { key: 'param19', header: 'Status', value: item => item.param19 === '0' ? item.param19 : '-' },
    { key: 'param14', header: 'Creation Date', value: item => item.param14 || '-' }
  ];
  
  constructor(private userService: UserService, private toastService: ToastService, private router: Router) {
    this.toastService.pageName = 'User Details'; // Set page name for toast service
  }
  ngOnInit(): void {
    this.getDetails('init');  
  }
  updatePageSizeOptions() {
    const options = [10, 20];
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
  getDetails(tooluse: 'init' | 'search' | 'pagechange' = 'init') {
    if (tooluse === 'init' || tooluse === 'search') {
      if (tooluse === 'init') {
        this.detailsRequest.param1 = "";
      }
      this.detailsRequest.param2 = 1;
      this.detailsRequest.param3 = 10;
    }
    this.pageSize = Number(this.detailsRequest.param3) || 10;
    this.loading=true;
    this.userService.getUsersDetails(this.detailsRequest).subscribe({
      
      next: (res: any) => {
        this.loading=false;
        if(res.statuscode==200) {
          this.detailsData = res?.entity?.listData || res?.entity || [];
          const total = Number(res?.entity?.param1 || 0);
          this.totalCount = total;
          this.pageCount = this.detailsData.length;
          this.updatePageSizeOptions();
        } else {
          this.toastService.show('No data found', 'error');
          this.detailsData = [];
          this.totalCount = 0;
          this.pageCount = 0;
          this.pageSizeOptions = [10, 20, 50, 100, 500];
          
        }
    },
    error: (err: any) => {
        this.loading = false;
        console.error(err);
        this.toastService.show('Something went wrong', 'error');
      }
    });
  }
  onPageChange(page: number) {
    this.detailsRequest.param2 = Number(page);
    this.getDetails('pagechange');
  }
  onPageSizeChange(size: number | string) {
    this.detailsRequest.param3 = Number(size);
    this.detailsRequest.param2 = 1;
    this.getDetails('pagechange');
  }

  goToForm() {
    this.router.navigate(['/usercreation'])
  }
}
