import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { ToastService } from '../../../core/services/toast.service';
import { ActiveUsersReq, CommonDetailsReq, LoginStatusReq } from '../../../core/model/request.model';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { DashboardService } from '../../../core/services/dashboard.service';


export interface RoleWidget {
  name: string;
  icon: string;
  color: string;
  activeCount: number;
}
@Component({
  selector: 'app-login-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgbPaginationModule],
  templateUrl: './login-dashboard.component.html',
  styleUrl: './login-dashboard.component.scss'
})
export class LoginDashboardComponent implements OnInit, AfterViewInit {
  loginStatusDetailsReq: LoginStatusReq = new LoginStatusReq();
  activeUsersReq: ActiveUsersReq = new ActiveUsersReq();
  currentPage: any = 1;
  pageSize: any = 20;
  pageSizeOptions: any[] = [20];
  totalCount: any = 0;
  pageCount: any = 0;
  totalActiveCount: any = 0;
  // Summary widget values
  totalActiveSessionsCount: number = 0;
  totalUsersCount: number = 0;
  roleWiseActiveCounts: Array<{ role: string; count: number }> = [];
  @ViewChild('roleScroll', { static: false }) roleScrollRef!: ElementRef<HTMLElement>;
  loading: boolean = false;
  detailsData: any[] = [];
  isExporting: boolean = false;
  selectedDownloadType: any = null;
  userDetails: any[] = [];
  showUserDetails: boolean = false;

  totalActiveSession: any = 0;
  totalUsers: any = 0;
  activeSessionData: any[]=[];
  // loginStatusList: any[] = [];
  // errorMessage = '';
  // searchText = '';
  
  // currentPage = 1;
  // pageSize = 20;
  // totalCount = 0;
  
  // sortKey: string = '';
  // reverse: boolean = false;
  @ViewChild('roleScroller', { static: true }) roleScroller!: ElementRef<HTMLDivElement>;

  isLeftDisabled = true;
  isRightDisabled = false;

  private readonly scrollStep = 380;
getRoleIcon(role: string): string {
  const roleName = (role || '').toLowerCase();

  if (roleName.includes('admin')) return 'fa-user-shield';
  if (roleName.includes('dealer')) return 'fa-headset';
  if (roleName.includes('distributor')) return 'fa-users';
  if (roleName.includes('customer')) return 'fa-user';
  if (roleName.includes('rto')) return 'fa-car';
  if (roleName.includes('police')) return 'fa-shield';
  if (roleName.includes('manufacturer')) return 'fa-industry';
  if (roleName.includes('operator')) return 'fa-cogs';

  return 'fa-user';
}
getRoleColor(index: number): string {
  const colors = [
    '#e8a33d',
    '#6fa8ff',
    '#4cc9c0',
    '#b18cff',
    '#8b96a8',
    '#20c997',
    '#fd7e14',
    '#6610f2',
    '#17a2b8',
    '#28a745',
    '#e83e8c',
    '#dc3545',
    '#007bff'
  ];

  return colors[index % colors.length];
}
  // Replace with data from your API (e.g. this.sessionService.getRoleWiseCounts())
  roles: RoleWidget[] = [
    { name: 'PMC',       icon: 'fa-user-shield',     color: '#e8a33d', activeCount: 24 },
    { name: 'Device Mfg',     icon: 'fa-briefcase',  color: '#6fa8ff', activeCount: 18 },
    { name: 'Dealer',     icon: 'fa-headset',        color: '#4cc9c0', activeCount: 31 },
    { name: 'Operator',     icon: 'fa-chart-line',   color: '#b18cff', activeCount: 12 },
    { name: 'Viewer',      icon: 'fa-eye',             color: '#8b96a8', activeCount: 9  },
    { name: 'Supervisor',  icon: 'fa-user-tie',        color: '#20c997', activeCount: 15 },
    { name: 'Auditor',     icon: 'fa-search',          color: '#fd7e14', activeCount: 6  },
    { name: 'Editor',      icon: 'fa-edit',            color: '#6610f2', activeCount: 21 },
    { name: 'Operator',    icon: 'fa-cogs',            color: '#17a2b8', activeCount: 27 },
    { name: 'Guest',       icon: 'fa-user-clock',      color: '#adb5bd', activeCount: 4  },
    { name: 'Finance',     icon: 'fa-money-bill-wave', color: '#28a745', activeCount: 11 },
    { name: 'HR',          icon: 'fa-users-cog',       color: '#e83e8c', activeCount: 8  },
    { name: 'IT Security', icon: 'fa-shield-alt',      color: '#dc3545', activeCount: 5  },
    { name: 'Sales',       icon: 'fa-chart-pie',       color: '#007bff', activeCount: 33 },
    { name: 'Marketing',   icon: 'fa-bullhorn',        color: '#ffc107', activeCount: 14 },
  ];

  ngAfterViewInit(): void {
    this.updateArrowState();
    this.roleScroller.nativeElement.addEventListener('scroll', () => this.updateArrowState());
  }

  scrollRoles(direction: 1 | -1): void {
    this.roleScroller.nativeElement.scrollBy({
      left: direction * this.scrollStep,
      behavior: 'smooth'
    });
  }

  // Convenience for the inline background/text-color styles used in the template
  tint(color: string, alpha = '1a'): string {
    return color + alpha;
  }

  private updateArrowState(): void {
    const el = this.roleScroller.nativeElement;
    this.isLeftDisabled = el.scrollLeft <= 4;
    this.isRightDisabled = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
  }


  
  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public toastService: ToastService,
    public dashboardService: DashboardService
  ) {
    this.toastService.pageName = 'Login Status'; // Set page name for toast service
  }

  ngOnInit() {
  this.getDashboardCount();
  this.getRolewiseActiveSessionCount();
  this.getDetails('reload');
}
activeSessionCurrentPage: number = 1;

activeSessionTotalCount: number = 0;

getDashboardCount(): void {
  this.dashboardService.getLoginDashboardCount().subscribe({
    next: (response: any) => {
      console.log('Login Dashboard Count API Response:', response);

      if (
        response?.status === true &&
        response?.statuscode === 200
      ) {
        const dashboardData = response?.entity?.details?.[0];

        this.totalUsersCount = Number(dashboardData?.param1 ?? 0);
        this.totalActiveSessionsCount = Number(dashboardData?.param2 ?? 0);

        // Keep old variables synchronized if used elsewhere
        this.totalUsers = this.totalUsersCount;
        this.totalActiveSession = this.totalActiveSessionsCount;
      } else {
        this.totalUsersCount = 0;
        this.totalActiveSessionsCount = 0;
        this.totalUsers = 0;
        this.totalActiveSession = 0;
      }

      this.cdr.detectChanges();
    },
    error: (err: any) => {
      console.error('Dashboard count API error:', err);
    }
  });
}

 getRolewiseActiveSessionCount() {
  this.dashboardService.getRolewiseActiveSessionCount().subscribe({
    next: (response: any) => {
      console.log('Role Wise Active Session Response:', response);

      if (response?.status === true && response?.statuscode === 200) {
        const details = response?.entity?.details || [];

        this.roles = details.map((item: any, index: number) => ({
          name: item.param1 || 'NA',
          activeCount: Number(item.param2 || 0),
          icon: this.getRoleIcon(item.param1),
          color: this.getRoleColor(index)
        }));

        this.roleWiseActiveCounts = details.map((item: any) => ({
          role: item.param1 || 'NA',
          count: Number(item.param2 || 0)
        }));
      } else {
        this.roles = [];
        this.roleWiseActiveCounts = [];
      }

      this.cdr.detectChanges();
    },

    error: (error) => {
      console.error(
        'Error loading role-wise active session count:',
        error
      );

      this.roles = [];
      this.roleWiseActiveCounts = [];
    }
  });
}
public dashboardActiveSessionReq = new CommonDetailsReq();

getActiveSessionCountDetails() {

  this.dashboardActiveSessionReq.param1 = '';
  this.dashboardActiveSessionReq.param2 = '1';
  this.dashboardActiveSessionReq.param3 = this.pageSize.toString();

  this.dashboardService
    .getActiveSessionDetails(this.dashboardActiveSessionReq)
    .subscribe({
      next: (response: any) => {

        console.log(
          'Active Session Details Response:',
          response
        );

        if (
          response?.status === true &&
          response?.statuscode === 200
        ) {

          this.activeSessionData =
            response?.entity?.listdata || [];

          console.log(
            'Active Session Data:',
            this.activeSessionData
          );

        } else {

          this.activeSessionData = [];

        }
      },

      error: (error) => {

        console.error(
          'Error loading active session details:',
          error
        );

        this.activeSessionData = [];
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
    if (this.totalCount > 0 && this.totalCount < 100) options.push(this.totalCount); // 'All'
    this.pageSizeOptions = options;
  }

  loadDummyWidgetData() {
    // dummy values for design preview
    // this.totalActiveSessionsCount = 42;
    // this.totalUsersCount = 128;
    // generate 15 dummy roles
    // this.roleWiseActiveCounts = Array.from({ length: 15 }).map((_, i) => ({ role: `Role ${i + 1}`, count: Math.floor(Math.random() * 30) + 1 }));
  }

  scrollRole(direction: number) {
    const el = this.roleScrollRef?.nativeElement;
    if (!el) return;
    const scrollAmount = Math.round(el.clientWidth * 0.6) * direction;
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }
  onPageSizeChange(event: any) {
    const size = Number(event.target.value);
    console.log('Selected page size:', size);
    this.loginStatusDetailsReq.param2 = '1';
    this.loginStatusDetailsReq.param3 = Number(size);
    this.getDetails('pagesize');
  }
  onPageChange(page: number) {
    this.loginStatusDetailsReq.param2 = page.toString();
    this.getDetails('pageChange');
  }
  getDetails(type: string) {
    if(type === 'reload') {
      this.loginStatusDetailsReq.param1 = '';
      this.loginStatusDetailsReq.param2 = '1';
      this.loginStatusDetailsReq.param3 = this.pageSize.toString();
    } 
    if(type === 'search') {
      this.loginStatusDetailsReq.param2 = '1';
      this.loginStatusDetailsReq.param3 = this.pageSize.toString();
    }
      this.dashboardService.getActiveSessionDetails(this.loginStatusDetailsReq).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response.statuscode ==200) {
          this.detailsData = response.entity.listData;
          this.totalCount = response.entity.param1;
          this.pageCount = this.detailsData.length;
          this.updatePageSizeOptions();
          // compute summary widget values
          this.computeSummaryWidgets(response.entity);
        } else {
          this.detailsData = [];
          this.totalCount = 0;
          
        }
      },
      error: (error) => {

        this.loading = false;}
      })
  }

 
computeSummaryWidgets(entity: any): void {
  try {
    // Update only the table-related total.
    // Do not overwrite dashboard Active Sessions count here.
    this.totalUsersCount = Number(
      entity?.param3 ?? this.totalUsersCount ?? 0
    );

    if (Array.isArray(entity?.roleWise) && entity.roleWise.length > 0) {
      this.roleWiseActiveCounts = entity.roleWise.map((r: any) => ({
        role: r.role || r.param2 || 'NA',
        count: Number(r.count ?? r.param1 ?? 0)
      }));
    } else {
      const roleMap = new Map<string, number>();

      (entity?.listData || []).forEach((item: any) => {
        const role = item.param11 || item.param12 || 'Unknown';
        roleMap.set(role, (roleMap.get(role) || 0) + 1);
      });

      this.roleWiseActiveCounts = Array.from(roleMap.entries()).map(
        ([role, count]) => ({ role, count })
      );
    }
  } catch (err) {
    console.error('Summary widget error:', err);
    this.roleWiseActiveCounts = [];
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

updateLoginStatusReq: CommonDetailsReq = {
  param1: '',
  param2: '',
  param3: ''
};

showUpdateLoginStatusModal = false;
openUpdateLoginStatusModal(login: any): void {

  this.updateLoginStatusReq = {
    param1: login.param2 || '',   // Login ID from table param2
    param2: '',
    param3: ''
  };

  this.showUpdateLoginStatusModal = true;
}
closeUpdateLoginStatusModal(): void {

  this.showUpdateLoginStatusModal = false;

  this.updateLoginStatusReq = {
    param1: '',
    param2: '',
    param3: ''
  };
}  
updateLoginStatus(): void {

  if (
    !this.updateLoginStatusReq.param1 ||
    !this.updateLoginStatusReq.param2
  ) {
    return;
  }

  this.loading = true;

  this.dashboardService
    .postupdateloginstatus(this.updateLoginStatusReq)
    .subscribe({
      next: (response) => {

        this.loading = false;

        this.closeUpdateLoginStatusModal();

        // Refresh login dashboard
        this.getDetails('reload');

      },
      error: (error) => {

        this.loading = false;

        console.error(
          'Update login status failed:',
          error
        );

      }
    });
}
}
