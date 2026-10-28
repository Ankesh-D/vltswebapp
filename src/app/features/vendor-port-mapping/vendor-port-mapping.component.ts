import { ChangeDetectorRef, Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { EncryptionService } from '../../core/services/encryption.service';
import { VendorPortMappingRequest, VendorService } from '../../core/services/vendor.service';
import { ToastComponent } from '../assets/inactive-assets/toast.component';
import { ToastService } from '../../core/services/toast.service';
import { CommonDataToolbarComponent } from '../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { CommonPaginationComponent } from '../../shared/components/common-pagination/common-pagination.component';
import { CommonTableColumn, CommonTableComponent } from '../../shared/components/common-table/common-table.component';

interface Vendor {
  param1: string; // ID
  param2: string; // Name
}

interface Port {
  param1: string; // ID
  param2: string; // Number
}

interface AssignedPort {
  param1: string; // Srno
  param2: string; // portid
  param3: string; // vendorid
  param4: string; // portno
  param5: string; // ip
  param6: string; // vendorname
  param7: string; // createdate
}

@Component({
    selector: 'app-vendor-port-mapping',
    imports: [CommonModule, FormsModule, ToastComponent, CommonDataToolbarComponent,
      CommonPaginationComponent, CommonTableComponent],
    templateUrl: './vendor-port-mapping.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './vendor-port-mapping.component.scss'
})
export class VendorPortMappingComponent implements OnInit {
  // Data Lists
  portList: Port[] = [];
  assignedPorts: AssignedPort[] = [];

  // Form Models
  selectedVendor: string = '';
  selectedPort: string = '';

  // State
  loading: boolean = false;
  searchText: string = '';

  // Pagination & Sorting
  currentPage: number = 1;
  pageSize: number = 20;
  totalCount: number = 0;
  readonly pageSizeOptions = [20, 50, 100, 200];
  sortKey: string = '';
  reverse: boolean = false;
  readonly tableColumns: CommonTableColumn<AssignedPort>[] = [
    { key: 'param1', label: '#' },
    { key: 'param6', label: 'Vendor Name', sortable: true },
    { key: 'param4', label: 'Port Number', sortable: true },
    { key: 'param5', label: 'IP Address', sortable: true }
  ];
  vendorList: any[] = [];
  errorMessage: string | null = null;
  successMessage: string | null = null;
  RoleId: any = sessionStorage.getItem('roleid');

  // Placeholder API URL - Replace with your actual environment configuration
  private apiUrl = 'https://vlts.wb.gov.in/wbsdcpsvnew';

  constructor(private http: HttpClient, private vendorService: VendorService,
    private route: ActivatedRoute,
    private router: Router,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef,
    public toastService: ToastService) {
      this.toastService.pageName = 'Vendor Port Mapping'; // Set page name for toast service
     }

  ngOnInit(): void {
    this.loadDropdowns();
    this.loadAssignedPorts();
  }

  loadDropdowns(): void {
    // Fetch Vendors
    this.http.post<any>(`${this.apiUrl}/psv_get_vendor_roster?type=0&&stateId=0`, { withCredentials: true })
      .subscribe({
        next: (res) => this.vendorList = res.entity || [],
        error: (err) => console.error('Error loading Vendors', err)
      });
  
    // Fetch Ports
    this.http.post<any>(`${this.apiUrl}/psv_get_portdetails_roster?roleId=${this.RoleId}`, {})
      .subscribe({
        next: (res) => this.portList = res.entity || [],
        error: (err) => console.error('Error loading ports', err)
      });
  }

  loadAssignedPorts(): void {
    this.loading = true;

    const request: VendorPortMappingRequest = {
      param1: this.searchText.trim(),
      param2: this.currentPage.toString(),
      param3: this.pageSize.toString(),
    };

    this.vendorService.getloadAssignedPortsDetails(request).subscribe({
      next: (res) => {
        this.assignedPorts = (res.entity?.listData as any) || [];
        this.totalCount = res.entity?.param1 || 0;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err;
        //console.error('Error loading assigned ports', err);
        this.loading = false;
      }
    });
  }

  saveAssignment(): void {
    if (!this.selectedVendor || !this.selectedPort) {
      this.errorMessage = 'Please select Vendor and Port';
      return;
    }
    this.loading = true;

    const encryptedPort = this.encryptionService.encryptAccountId(this.selectedPort);
    const encryptedVendor = this.encryptionService.encryptAccountId(this.selectedVendor);

    const data = {
      param1: encryptedPort,
      param2: encryptedVendor
    };

    this.http.post<any>(`${this.apiUrl}/psv_put_assignporttovendor`, data).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage = response.entity;
        if (response.entity === 'Successfully Saved.') {
          this.selectedVendor = '';
          this.selectedPort = '';
          this.loadAssignedPorts();
          this.loadDropdowns();
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err;
      }
    });
  }

  sort(key: string): void {
    if (this.sortKey === key) {
      this.reverse = !this.reverse;
    } else {
      this.sortKey = key;
      this.reverse = false;
    }
  }

  onPageSizeChange(size: number | string): void {
    this.pageSize = Number(size);
    this.currentPage = 1;
    this.loadAssignedPorts();
  }

  reloadAssignedPorts(): void {
    this.searchText = '';
    this.currentPage = 1;
    this.loadAssignedPorts();
  }

  searchAssignedPorts(): void {
    this.currentPage = 1;
    this.loadAssignedPorts();
  }

  navigateToPortEntry(): void {
   this.router.navigate(['/PortEntry']);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadAssignedPorts();
  }
}
