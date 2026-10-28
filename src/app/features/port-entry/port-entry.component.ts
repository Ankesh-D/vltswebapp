import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { trigger, style, animate, transition, query, stagger } from '@angular/animations';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { ToastComponent } from '../assets/inactive-assets/toast.component';

@Component({
    selector: 'app-port-entry',
    imports: [CommonModule, FormsModule, RouterModule, ToastComponent, LoadingComponent],
    templateUrl: './port-entry.component.html',
    styleUrl: './port-entry.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
    animations: [
        trigger('listAnimation', [
            transition('* <=> *', [
                query(':enter', [
                    style({ opacity: 0, transform: 'translateY(-10px)' }),
                    stagger('30ms', [
                        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
                    ])
                ], { optional: true })
            ])
        ])
    ]
})
export class PortEntryComponent implements OnInit {
  // Form Data
  portNo: string = '';
  ipAddress: string = '';

  // Data List
  ports: any[] = [];
  
  // Pagination & Search
  currentPage: number = 1;
  pageSize: number = 20;
  totalCount: number = 0;
  searchText: string = '';
  
  // State
  loading: boolean = false;
  sortKey: string = 'param3'; // Default sort by Port No
  reverse: boolean = false;
  
  // Toast
  toast: { message: string, type: 'success' | 'error' } | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  RoleId: any = sessionStorage.getItem('roleid');

  // API URL (Matching VendorPortMappingComponent pattern)
  private apiUrl = 'https://vlts.wb.gov.in/wbsdcpsvnew';

  private http = inject(HttpClient);

  ngOnInit(): void {
    this.loadPorts(1);
  }

  loadPorts(page: number): void {
    this.loading = true;
    this.currentPage = page;
    
    const request = {
      param1: this.searchText,
      param2: this.currentPage,
      param3: this.pageSize
    };

    this.http.post<any>(`${this.apiUrl}/psv_get_portdetails`, request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response && response.entity) {
          this.ports = response.entity.listData || [];
          this.totalCount = response.entity.param1 || 0;
        } else {
          this.ports = [];
          this.totalCount = 0;
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error;
      }
    });
  }

  savePort(): void {
    if (!this.portNo) {
      this.errorMessage = 'Please enter Port No';
      return;
    }
    if (!this.ipAddress) {
      this.errorMessage = 'Please enter IP Address';
      return;
    }

    this.loading = true;
    const request = {
      param1: this.portNo,
      param2: this.ipAddress
    };

    this.http.post<any>(`${this.apiUrl}/psv_put_port`, request).subscribe({
      next: (response) => {
        this.loading = false;
        const msg = response.entity;
        if (msg === 'Successfully Saved.') {
          this.successMessage = msg;
          this.portNo = '';
          this.ipAddress = '';
          this.loadPorts(1);
        } else {
          this.errorMessage = msg;
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error;
      }
    });
  }

  sort(key: string): void {
    this.sortKey = key;
    this.reverse = !this.reverse;
    
    this.ports.sort((a, b) => {
      const valA = a[key] ? a[key].toString().toLowerCase() : '';
      const valB = b[key] ? b[key].toString().toLowerCase() : '';
      if (valA < valB) return this.reverse ? 1 : -1;
      if (valA > valB) return this.reverse ? -1 : 1;
      return 0;
    });
  }

  onPageChange(page: number): void {
    this.loadPorts(page);
  }
  
  getTotalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }
}
