import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { OperationService } from '../../../core/services/operation.service';
import { EncryptionService } from '../../../core/services/encryption.service';

declare var $: any;

@Component({
    selector: 'app-command-details',
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './command-details.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./command-details.component.scss']
})
export class CommandDetailsComponent implements OnInit, AfterViewInit {
  commandDetails: any[] = [];
  loading = false;
  
  searchText: string = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [20, 50, 100, 200, 500];
  totalCount = 0;
  pageCount = 0;
  
  sortKey: string = '';
  reverse: boolean = false;
  
  roleId: string = '';
  
  // Edit modal
  editCommandId: string = '';
  editCommandName: string = '';
  editCommand: string = '';
  editVendorId: string = '';
  editModelId: string = '';
  editRemark: string = '';
  isIncorrect: boolean = false;
  
  // Delete modal
  deleteCommandId: string = '';
  deleteCommandName: string = '';
  deleteRemark: string = '';
  isDeleteIncorrect: boolean = false;
  
  constructor(
    private operationService: OperationService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit() {
    this.roleId = sessionStorage.getItem('roleId') || '';
    this.loadCommandDetails(1);
  }
  
  ngAfterViewInit() {
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.select2) {
        $('.searchable').select2();
      }
    }, 200);
  }
  
  loadCommandDetails(pageNo: number = 1) {
    this.loading = true;
    this.currentPage = pageNo;
    
    const encryptedCompanyId = this.encryptionService.encryptAccountId('0');
    
    const request = {
      param1: this.searchText.trim(),
      param2: pageNo.toString(),
      param3: this.pageSize.toString(),
      param4: encryptedCompanyId
    };
    
    this.operationService.getCommandDetails(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.commandDetails = response.entity.listData || [];
          this.totalCount = response.entity.param1 || 0;
          this.pageCount = Math.min(this.commandDetails.length, this.pageSize);
        } else {
          this.commandDetails = [];
          this.totalCount = 0;
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading command details:', error);
        this.commandDetails = [];
      }
    });
  }
  
  getCommandData(data: any) {
    this.editCommandId = data.param2;
    this.editCommandName = data.param5 || '';
    this.editCommand = data.param6 || '';
    this.editVendorId = data.param3 || '';
    this.editModelId = data.param4 || '';
    this.editRemark = '';
    this.isIncorrect = false;
    
    this.deleteCommandId = data.param2;
    this.deleteCommandName = data.param5 || '';
    this.deleteRemark = '';
    this.isDeleteIncorrect = false;
  }
  
  checkRemark() {
    if (this.editRemark.length < 10) {
      this.isIncorrect = true;
    } else {
      this.isIncorrect = false;
    }
  }
  
  checkDeleteRemark() {
    if (this.deleteRemark.length < 10) {
      this.isDeleteIncorrect = true;
    } else {
      this.isDeleteIncorrect = false;
    }
  }
  
  updateCommand() {
    if (!this.editCommand || this.editCommand.trim() === '') {
      alert('Enter Command');
      return;
    }
    
    if (!this.editRemark || this.editRemark.length < 10) {
      alert('Enter remark with minimum 10 characters');
      return;
    }
    
    const request = {
      param1: this.encryptionService.encryptAccountId(this.editVendorId),
      param2: this.encryptionService.encryptAccountId(this.editModelId),
      param3: this.encryptionService.encryptAccountId(this.editCommandId),
      param4: this.editCommandName,
      param5: this.editCommand,
      param6: this.editRemark
    };
    
    this.operationService.updateCommand(request).subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          alert(response.entity);
          if (response.entity === 'Successfully updated.') {
            this.back();
            this.loadCommandDetails(1);
          }
        }
      },
      error: (error) => {
        console.error('Error updating command:', error);
        alert('Error updating command');
      }
    });
  }
  
  deleteCommand() {
    if (!this.deleteRemark || this.deleteRemark.trim() === '') {
      alert('Enter Remarks');
      return;
    }
    
    const request = {
      param1: this.encryptionService.encryptAccountId(this.deleteCommandId),
      param3: this.deleteRemark
    };
    
    this.operationService.deleteCommand(request).subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          alert(response.entity);
          if (response.entity === 'Successfully deleted.') {
            this.back();
            this.loadCommandDetails(1);
          }
        }
      },
      error: (error) => {
        console.error('Error deleting command:', error);
        alert('Error deleting command');
      }
    });
  }
  
  back() {
    this.editRemark = '';
    this.deleteRemark = '';
    this.isIncorrect = false;
    this.isDeleteIncorrect = false;
  }
  
  sort(key: string) {
    if (this.sortKey === key) {
      this.reverse = !this.reverse;
    } else {
      this.sortKey = key;
      this.reverse = false;
    }
  }
  
  getPaginatedData(): any[] {
    let data = [...this.commandDetails];
    
    if (this.sortKey) {
      data.sort((a, b) => {
        const aVal = (a as any)[this.sortKey] || '';
        const bVal = (b as any)[this.sortKey] || '';
        return this.reverse ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
      });
    }
    
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return data.slice(start, end);
  }
  
  getTotalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }
  
  getPageNumbers(): number[] {
    const total = this.getTotalPages();
    const pages: number[] = [];
    const maxPages = 8;
    
    if (total <= maxPages) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, this.currentPage - 3);
      const end = Math.min(total, start + maxPages - 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }
  
  onPageChange(page: number) {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.loadCommandDetails(page);
    }
  }
  
  onPageSizeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    if (value === 'All') {
      this.pageSize = this.totalCount;
    } else {
      this.pageSize = parseInt(value, 10);
    }
    this.currentPage = 1;
    this.loadCommandDetails(1);
  }
  
  getSearchDetails() {
    this.loadCommandDetails(1);
  }
  
  reloadData() {
    this.searchText = '';
    this.loadCommandDetails(1);
  }
}
