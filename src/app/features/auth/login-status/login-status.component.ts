import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ActiveUsersReq, LoginStatusReq } from '../../../core/model/request.model';
import { CommonDataToolbarComponent } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { DataTableColumn, DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
    selector: 'app-login-status',
    imports: [CommonDataToolbarComponent, DataTableComponent, PaginationComponent],
    templateUrl: './login-status.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./login-status.component.scss']
})
export class LoginStatusComponent implements OnInit {
  readonly loginStatusColumns: DataTableColumn<any>[] = [
    { key: 'param1', header: '#', width: '30px', cellClassName: 'ps-3' },
    { key: 'param3', header: 'Login Name' },
    { key: 'param7', header: 'Contact Person' },
    { key: 'param8', header: 'Mobile No.' },
    { key: 'param9', header: 'Email ID' },
    {
      header: 'Users',
      className: 'text-center',
      cellClassName: 'text-center fw-bold',
      value: login => login.param10 || 'NA',
      clickable: () => true
    }
  ];
  readonly userDetailsColumns: DataTableColumn<any>[] = [
    { key: 'param1', header: '#', width: '30px', cellClassName: 'ps-3' },
    { key: 'param13', header: 'Browser Name' },
    { key: 'param10', header: 'Login Time' },
    { key: 'param11', header: 'Logout Time' },
    {
      key: 'param18',
      header: 'Login Status',
      width: '88px',
      cellClassName: login => login.param18 === 'Active' ? 'text-success fw-bold' : 'text-secondary'
    }
  ];

  loginStatusDetailsReq: LoginStatusReq = new LoginStatusReq();
  activeUsersReq: ActiveUsersReq = new ActiveUsersReq();
  currentPage: any = 1;
  pageSize: any = 20;
  pageSizeOptions: any[] = [20];
  totalCount: any = 0;
  pageCount: any = 0;
  totalActiveCount: any = 0;
  loading: boolean = false;
  detailsData: any[] = [];
  isExporting: boolean = false;
  selectedDownloadType: any = null;
  userDetails: any[] = [];
  showUserDetails: boolean = false;
  // loginStatusList: any[] = [];
  // errorMessage = '';
  // searchText = '';
  
  // currentPage = 1;
  // pageSize = 20;
  // totalCount = 0;
  
  // sortKey: string = '';
  // reverse: boolean = false;
  
  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public toastService: ToastService
  ) {
    this.toastService.pageName = 'Login Status'; // Set page name for toast service
  }
  
  ngOnInit() {
    // this.getLoginStatus(1);
    this.getDetails('reload');
  }
  updatePageSizeOptions() {
    // Generate page size options based on total count
    const options = [20];
    if (this.totalCount > 50) options.push(50);
    if (this.totalCount > 100) options.push(100);
    if (this.totalCount > 200) options.push(200);
    if (this.totalCount > 500) options.push(500);
    if (this.totalCount > 0 && this.totalCount < 100) options.push(this.totalCount); // 'All'
    this.pageSizeOptions = options;
  }
  onPageSizeChange(size: number | string) {
    this.pageSize = size === 'All' || Number(size) === this.totalCount ? this.totalCount : Number(size);
    this.currentPage = 1;
    this.loginStatusDetailsReq.param2 = '1';
    this.loginStatusDetailsReq.param3 = this.pageSize;
    this.getDetails('pagesize');
  }
  onPageChange(page: number) {
    this.currentPage = page;
    this.loginStatusDetailsReq.param2 = page.toString();
    this.getDetails('pageChange');
  }
  getDetails(type: string) {
    if(type === 'reload') {
      this.loginStatusDetailsReq.param1 = '';
      this.loginStatusDetailsReq.param2 = '1';
      this.pageSize = 20;
      this.loginStatusDetailsReq.param3 = this.pageSize.toString();
    } 
    if(type === 'search') {
      this.loginStatusDetailsReq.param2 = '1';
      this.loginStatusDetailsReq.param3 = this.pageSize.toString();
    }
    this.currentPage = Number(this.loginStatusDetailsReq.param2) || 1;
    this.loading = true;
      this.authService.getLoginStatus(this.loginStatusDetailsReq).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response.statuscode ==200) {
          this.detailsData = response.entity.listData;
          this.totalCount = response.entity.param1;
          this.pageCount = this.detailsData.length;
          this.updatePageSizeOptions();
        } else {
          this.detailsData = [];
          this.totalCount = 0;
          
        }
      },
      error: (error) => {

        this.loading = false;}
      })
  }
  onLoginStatusCellClick(event: { row: any; column: DataTableColumn<any> }): void {
    if (event.column.header === 'Users') {
      this.getLoginname(event.row);
    }
  }
  onChangeDownload(event: any) {
    const fileType = event.target.value;
  }
  loginName: string = '';
  contactPerson: string = '';
  mobileNo: string = ''  
  getLoginname(login: any) {
    this.loginName = login.param3 || '';
    this.contactPerson = login.param7 || '';
    this.mobileNo = login.param8 || '';
    this.activeUsersReq.param4 = login.param2 || '';
    if (this.activeUsersReq.param4) {
      // Navigate to active users page
      this.activeUsersReq.param1 = '';
      this.activeUsersReq.param2 = '';
      this.activeUsersReq.param3 = '';
      this.authService.getLoggedInUserDetails(this.activeUsersReq).subscribe({
        next: (response: any) => {
          if (response.statuscode === 200) {
            this.userDetails = response.entity.listData;
            this.totalActiveCount = response.entity.param1;
            this.showUserDetails = true;
          } else {
            this.toastService.show('User details not found.', 'error');
          }
        },
        error: (error) => {
          console.error('Error fetching user details:', error);
          this.toastService.show('Error fetching user details. Please try again.', 'error');
        }
      });
    }
  }

  
  // getLoginStatus(page: number = 1) {
  //   this.currentPage = page;
  //   this.loading = true;
  //   this.errorMessage = '';
  //   this.loginStatusList = [];
    
  //   const request = {
  //     param1: this.searchText.trim(),
  //     param2: this.currentPage.toString(),
  //     param3: this.pageSize.toString()
  //   };
    
  //   this.authService.getLoginStatus(request).subscribe({
  //     next: (response) => {
  //       this.loading = false;
  //       if (response.status && response.entity) {
  //         if (response.entity.listData !== undefined) {
  //           this.loginStatusList = response.entity.listData || [];
  //           this.totalCount = response.entity.param1 || 0;
  //         } else if (Array.isArray(response.entity)) {
  //           this.loginStatusList = response.entity;
  //           this.totalCount = response.entity.length;
  //         } else {
  //           this.loginStatusList = [];
  //         }
  //       } else {
  //         this.errorMessage = typeof response?.entity === 'string' ? response.entity : 'Failed to load login status';
  //         this.loginStatusList = [];
  //       }
  //       this.cdr.detectChanges();
  //     },
  //     error: (error) => {
  //       this.loading = false;
  //       this.errorMessage = 'Error loading login status. Please try again.';
  //       this.loginStatusList = [];
  //       console.error('Error loading login status:', error);
  //       this.cdr.detectChanges();
  //     }
  //   });
  // }
  
  
  
  // sort(column: string) {
  //   if (this.sortKey === column) {
  //     this.reverse = !this.reverse;
  //   } else {
  //     this.sortKey = column;
  //     this.reverse = false;
  //   }
  // }
  
  // getPageNumbers(): number[] {
  //   const totalPages = this.getTotalPages();
  //   const pages: number[] = [];
  //   const maxPages = 8;
  //   let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
  //   let endPage = Math.min(totalPages, startPage + maxPages - 1);
    
  //   if (endPage - startPage < maxPages - 1) {
  //     startPage = Math.max(1, endPage - maxPages + 1);
  //   }
    
  //   for (let i = startPage; i <= endPage; i++) {
  //     pages.push(i);
  //   }
  //   return pages;
  // }
  
  // getTotalPages(): number {
  //   return Math.ceil(this.totalCount / this.pageSize);
  // }

  // downloadFile(event: any) {
  //   const fileType = event.target.value;
  //   // Reset the select to allow re-selection of the same option
  //   event.target.value = '';

  //   if (fileType === 'Excel') {
  //     // TODO: Implement Excel download logic
  //   } else if (fileType === 'Pdf') {
  //     // TODO: Implement PDF download logic
  //   }
  // }
}
