import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../../core/services/customer.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { CommonDataToolbarComponent } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { CommonPaginationComponent } from '../../../shared/components/common-pagination/common-pagination.component';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';

@Component({
    selector: 'app-customer-details-list',
    imports: [CommonModule, FormsModule, LoadingComponent, ErrorMessageComponent, CommonDataToolbarComponent, CommonPaginationComponent, CommonTableComponent],
    templateUrl: './customer-details-list.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./customer-details-list.component.scss']
})
export class CustomerDetailsListComponent implements OnInit {
  customerList: any[] = [];
  loading = false;
  errorMessage = '';
  searchText = '';
  
  currentPage = 1;
  pageSize = 20;
  totalCount = 0;
  
  sortKey: string = '';
  reverse: boolean = false;
  readonly tableColumns: CommonTableColumn<any>[] = [
    { key: 'param1', label: '#', width: '35px', value: customer => customer.param1?.length > 0 ? customer.param1 : 'NA' },
    { key: 'param4', label: 'Customer Type', sortable: true, value: customer => customer.param4?.length > 0 ? customer.param4 : 'NA' },
    { key: 'param3', label: 'Customer Name', sortable: true, value: customer => customer.param3?.length > 0 ? customer.param3 : 'NA' },
    { key: 'param5', label: 'Mobile No.', sortable: true, value: customer => customer.param5?.length > 0 ? customer.param5 : 'NA' },
    { key: 'param6', label: 'Email ID', sortable: true, value: customer => customer.param6?.length > 0 ? customer.param6 : 'NA' },
    { key: 'param8', label: 'Address', sortable: true, value: customer => customer.param8?.length > 0 ? customer.param8 : 'NA' },
    { key: 'param11', label: 'Dealer Name', sortable: true, value: customer => customer.param11?.length > 0 ? customer.param11 : 'NA' },
    { key: 'param12', label: 'Vendor Name', sortable: true, value: customer => customer.param12?.length > 0 ? customer.param12 : 'NA' },
    { key: 'param15', label: 'Assets', sortable: true, className: 'text-center', value: customer => customer.param15?.length > 0 ? customer.param15 : 'NA' }
  ];
  
  constructor(
    private customerService: CustomerService,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit() {
    this.getCustomerDetails(1);
  }
  
  getCustomerDetails(page: number = 1) {
    this.currentPage = page;
    this.loading = true;
    this.errorMessage = '';
    
    const request = {
      param1: this.searchText.trim(),
      param2: this.currentPage.toString(),
      param3: this.pageSize.toString()
    };
    
    this.customerService.getCustomerDetails(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          if (response.entity.listData !== undefined) {
            this.customerList = response.entity.listData || [];
            this.totalCount = response.entity.param1 || 0;
          } else if (Array.isArray(response.entity)) {
            this.customerList = response.entity;
            this.totalCount = response.entity.length;
          } else {
            this.customerList = [];
          }
        } else {
          this.errorMessage = typeof response?.entity === 'string' ? response.entity : 'Failed to load customer details';
          this.customerList = [];
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = 'Error loading customer details. Please try again.';
        this.customerList = [];
        console.error('Error loading customer details:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  getSearchDetails() {
    this.getCustomerDetails(1);
  }
  
  reloadData() {
    this.searchText = '';
    this.getCustomerDetails(1);
  }
  
  sort(column: string) {
    if (this.sortKey === column) {
      this.reverse = !this.reverse;
    } else {
      this.sortKey = column;
      this.reverse = false;
    }
  }
  
  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pages: number[] = [];
    const maxPages = 8;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);
    
    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }
  
  getTotalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }
  
  onPageChange(page: number) {
    this.getCustomerDetails(page);
  }

  onPageSizeChange(pageSize: number | string): void {
    const parsedPageSize = Number(pageSize);
    if (Number.isFinite(parsedPageSize) && parsedPageSize > 0 && parsedPageSize !== this.pageSize) {
      this.pageSize = parsedPageSize;
      this.getCustomerDetails(1);
    }
  }
}
