import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';

import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserCreationDetailsReq } from '../../../core/model/request.model';
import { ToastService } from '../../../core/services/toast.service';
import { UserService } from '../../../core/services/user.service';
import { UserCreationDetailsResp } from '../../../core/model/response.model';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';

@Component({
    selector: 'app-user-list',
    imports: [FormsModule, RouterModule, NgbPaginationModule, CommonTableComponent],
    templateUrl: './user-list.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  
  public detailsRequest: UserCreationDetailsReq = new UserCreationDetailsReq();
  public detailsData: UserCreationDetailsResp[]=[];

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
  readonly tableColumns: CommonTableColumn<UserCreationDetailsResp>[] = [
    { key: 'param1', label: '#' , value: item => item.param1 || '-' },
    { key: 'param16', label: 'Role', value: item => item.param16 || '-' },
    { key: 'param23', label: 'Owner Name', value: item => item.param23 || '-' },
    { key: 'param20', label: 'Login Name', value: item => item.param20 || '-' },
    { key: 'param5', label: 'Contact Person', value: item => item.param5 || '-' },
    { key: 'param12', label: 'State', value: item => item.param12 || '-' },
    { key: 'param11', label: 'City', value: item => item.param11 || '-' },
    { key: 'param9', label: 'Address', value: item => item.param9 || '-' },
    { key: 'param19', label: 'Status', value: item => item.param19 === '0' ? item.param19 : '-' },
    { key: 'param14', label: 'Creation Date', value: item => item.param14 || '-' }
  ];
  
  constructor(private userService: UserService, private toastService: ToastService, private router: Router) {
    this.toastService.pageName = 'User Details'; // Set page name for toast service
  }
  ngOnInit(): void {
    this.roleId = sessionStorage.getItem('roleid');
    this.getDetails('init');  
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
    if(tooluse=='init' || tooluse=='search') {
      if(tooluse=='init') {
        this.detailsRequest.param1 = "";
      }
      this.detailsRequest.param2 = 1;
      this.detailsRequest.param3 = 10;
    }
    this.pageSize = this.detailsRequest.param3 || 10;
    if(tooluse=='pagesize') {

    }
    this.loading=true;
    this.userService.getUsersDetails(this.detailsRequest).subscribe({
      
      next: (res: any) => {
        this.loading=false;
        if(res.statuscode==200) {
          this.detailsData = res?.entity?.listData || res?.entity || [];
          const total = Number(res?.entity?.param1 || 0);
          this.totalCount = total;
          this.pageCount = this.detailsData.length;
          // ✅ pages
          this.totalPages = Math.ceil(total / this.pageSize);
          this.updatePageSizeOptions();
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
  onPageChange(page: number) {
    this.detailsRequest.param2 = Number(page);
    this.getDetails('pagechange');
  }
  changePage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.pageNo = p;
    this.detailsRequest.param2 = this.pageNo;
    this.getDetails('pagechage'); // 🔥 reload API
  }
  onDownloadChange() {}

  goToForm() {
    this.router.navigate(['/usercreation'])
  }
}
