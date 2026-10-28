import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { CommonDataToolbarComponent } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';

@Component({
    selector: 'app-active-users',
    imports: [CommonModule, FormsModule, LoadingComponent, CommonDataToolbarComponent, CommonTableComponent],
    templateUrl: './active-users.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './active-users.component.scss'
})
export class ActiveUsersComponent implements OnInit {
  loginName: string = '';
  userLoginList: any[] = [];
  readonly tableColumns: CommonTableColumn<any>[] = [
    { key: 'param1', label: '#', value: login => login.param1 || 'NA' },
    { key: 'param13', label: 'Browser Name', sortable: true, value: login => login.param13 || 'NA' },
    { key: 'param10', label: 'Login Time', sortable: true, value: login => login.param10 || 'NA' },
    { key: 'param11', label: 'Logout Time', sortable: true, value: login => login.param11 || 'NA' },
    { key: 'param18', label: 'Login Status', sortable: true, value: login => login.param18 || 'NA' }
  ];
  totalCount: number = 0;
  pageSize: number = 20;
  currentPage: number = 1;
  searchText: string = '';
  loading: boolean = false;
  
  // Sorting
  sortKey: string = '';
  reverse: boolean = false;

  // Configuration placeholders - Replace these with your actual environment/service values
  private apiUrl = ''; 
  private appLocation = 'YOUR_APP_LOCATION';
  private principalKey = 'YOUR_PRINCIPAL_KEY';
  private excelPdfPath = 'YOUR_EXCEL_PDF_PATH';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private location: Location
  ) {}

  ngOnInit() {
    // Get LoginName from route params
    this.route.paramMap.subscribe(params => {
      this.loginName = params.get('LoginName') || '';
      this.getActiveUsers(1);
    });
  }

  getActiveUsers(page: number) {
    this.currentPage = page;
    this.loading = true;
    
    const payload = {
      param1: this.searchText,
      param2: this.currentPage,
      param3: this.pageSize,
      param4: this.loginName
    };

    this.http.post<any>(`${this.apiUrl}/psv_get_logindetails_by_loginapi`, payload, {
      headers: { 'headerkey': this.principalKey }
    }).subscribe({
      next: (response) => {
        if (response && response.entity) {
          this.userLoginList = response.entity.listData || [];
          this.totalCount = response.entity.param1 || 0;
          
          // Apply client-side sorting if a key is active
          if (this.sortKey) {
            this.sortData();
          }
        } else {
          this.userLoginList = [];
          this.totalCount = 0;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching active users:', error);
        this.userLoginList = [];
        this.loading = false;
      }
    });
  }

  sort(key: string) {
    if (this.sortKey === key) {
      this.reverse = !this.reverse;
    } else {
      this.sortKey = key;
      this.reverse = false;
    }
    this.sortData();
  }

  sortData() {
    if (!this.userLoginList || this.userLoginList.length === 0) return;

    this.userLoginList.sort((a, b) => {
      const valA = a[this.sortKey] ? a[this.sortKey].toString().toLowerCase() : '';
      const valB = b[this.sortKey] ? b[this.sortKey].toString().toLowerCase() : '';

      if (valA < valB) return this.reverse ? 1 : -1;
      if (valA > valB) return this.reverse ? -1 : 1;
      return 0;
    });
  }

  getSortIcon(key: string) {
    if (this.sortKey !== key) return 'fa-sort';
    return this.reverse ? 'fa-sort-desc' : 'fa-sort-asc';
  }

  downloadExcel() {
    if (this.totalCount > 0) {
      const filename = "ActiveUsersDetails_";
      const url = `${this.appLocation}/ActiveUsersDetailsExcel?param2=NA&param3=NA&param1=${this.searchText.trim()}&param4=${this.loginName}&headerkey=${this.principalKey}&myurl=${this.excelPdfPath}/psv_get_logindetails_by_loginapi&filename=${filename}`;
      window.open(url, '_blank');
    }
  }

  goBack() {
    this.location.back();
  }

  getTotalPages() {
    return Math.ceil(this.totalCount / this.pageSize);
  }
}
