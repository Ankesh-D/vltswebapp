import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ConfigService } from '../../../core/services/config.service';
import { AlertService } from '../../../core/services/alert.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { ToastComponent } from '../../assets/inactive-assets/toast.component';
import { ToastService } from '../../../core/services/toast.service';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';

declare var $: any;
declare var jAlert: any;

@Component({
    selector: 'app-configure-details',
    imports: [CommonModule, FormsModule, RouterModule, ToastComponent, CommonTableComponent],
    templateUrl: './configure-details.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./configure-details.component.scss']
})
export class ConfigureDetailsComponent implements OnInit, AfterViewInit {
  alertConfigData: any[] = [];
  loading = false;

  searchText: string = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [20, 50, 100, 200, 500];
  totalCount = 0;
  pageCount = 0;

  sortKey: string = '';
  reverse: boolean = false;
  readonly tableColumns: CommonTableColumn<any>[] = [
    { key: 'param1', label: '#', width: '40px', value: alert => alert.param1 || 'NA' },
    { key: 'param19', label: 'Alert Type', sortable: true, value: alert => alert.param19 || 'All' },
    { key: 'param14', label: 'Role Name', sortable: true, value: alert => alert.param14 || 'NA' },
    { key: 'param15', label: 'Owner Name', sortable: true, value: alert => alert.param15 || 'NA' },
    { key: 'param6', label: 'Email Id', sortable: true, value: alert => alert.param6 || 'NA' },
    { key: 'param4', label: 'Contact No', sortable: true, value: alert => alert.param4 || 'NA' },
    { key: 'param13', label: 'Date & Time', sortable: true, value: alert => alert.param13 || 'NA' },
    { key: 'param12', label: 'Days', sortable: true, value: alert => alert.param12 || 'NA' },
    { key: 'actions', label: 'Action', width: '80px', className: 'text-center' }
  ];

  // Edit Modal
  editConfigId: string = '';
  editAlertType: string = '';
  editSpeed: string = '';
  editRemark: string = '';
  isRemarkInvalid: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private configService: ConfigService,
    private alertService: AlertService,
    private dashboardService: DashboardService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef,
    public toastService: ToastService
  ) {
    this.toastService.pageName = 'Alert Configuration Details'; // Set page name for toast service
  }

  ngOnInit() {
    this.getAlertConfigDetails();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.select2) {
        $('.searchable').select2();
      }
    }, 200);
  }

  getAlertConfigDetails() {
    this.loading = true;
    const encryptedCompanyId = this.encryptionService.encryptAccountId('11');
    const request = {
      param1: this.searchText,
      param2: String(this.currentPage),
      param3: String(this.pageSize),
      param4: encryptedCompanyId
    };

    this.configService.getAlertConfigDetails(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.alertConfigData = response.entity.listData || [];
          this.totalCount = response.entity.param1 || 0;
          this.pageCount = this.alertConfigData.length;
        } else {
          this.alertConfigData = [];
          this.totalCount = 0;
          this.pageCount = 0;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.alertConfigData = [];
        this.totalCount = 0;
        this.pageCount = 0;
        this.errorMessage = ('Error fetching config details.');
        this.cdr.detectChanges();
      }
    });
  }

  getSearchDetails() {
    this.getAlertConfigDetails();
  }

  reloadData() {
    this.searchText = '';
    this.getAlertConfigDetails();
  }

  sort(key: string) {
    this.sortKey = key;
    this.reverse = !this.reverse;
    this.alertConfigData.sort((a, b) => {
      const valA = (a as any)[key];
      const valB = (b as any)[key];
      let comparison = 0;
      if (valA > valB) {
        comparison = 1;
      } else if (valA < valB) {
        comparison = -1;
      }
      return this.reverse ? comparison * -1 : comparison;
    });
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.getAlertConfigDetails();
  }

  onPageSizeChange(event: Event) {
    const newSize = (event.target as HTMLSelectElement).value;
    this.pageSize = newSize === 'All' ? this.totalCount : Number(newSize);
    this.currentPage = 1;
    this.getAlertConfigDetails();
  }

  getTotalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  }

  updateDetail(alert: any) {
    this.editConfigId = this.encryptionService.encryptAccountId(alert.param2);
    this.editAlertType = alert.param10 === '0' ? 'All' : alert.param10;
    this.editSpeed = alert.param11 || '';
    this.editRemark = '';
    this.isRemarkInvalid = false;
  }

  checkRemark() {
    this.isRemarkInvalid = this.editRemark.length < 10;
  }

  deleteConfig() {
    if (!this.editConfigId) {
      this.errorMessage = 'Invalid configuration ID';
      return;
    }
    this.checkRemark();
    if (this.isRemarkInvalid) {
      this.errorMessage = 'Enter remark with minimum 10 characters length';
      return;
    }

    this.loading = true;
    const request = {
      param1: this.editConfigId,
      param2: this.editRemark
    };

    this.configService.deleteAlertConfig(request).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage =(response.entity);
        if (response.status && response.entity === 'Successfully Saved.') {
          $('#deletealert').modal('hide');
          this.getAlertConfigDetails();
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = ('Error deleting configuration.');
      }
    });
  }

  back() {
    this.editRemark = '';
    this.isRemarkInvalid = false;
  }
}
