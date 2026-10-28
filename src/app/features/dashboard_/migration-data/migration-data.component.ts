import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ToastComponent } from '../../assets/inactive-assets/toast.component';
import { ToastService } from '../../../core/services/toast.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { CompanywiseDeviceDetailsReq } from '../../../core/model/request.model';

@Component({
  selector: 'app-migration-data',
  standalone: true,
  imports: [ToastComponent, CommonModule,
      FormsModule,
      RouterModule,
      NgSelectModule,
      NgxDaterangepickerMd],
  templateUrl: './migration-data.component.html',
  styleUrl: './migration-data.component.scss'
})
export class MigrationDataComponent implements OnInit {
  detailData: any[] = [];
  searchBy: any = "";
  listLoaded: boolean = true;
  pageSize: number = 10;
  pageSizeOptions: number[] = [10, 25, 50, 100];
  pageCount: number = 1;
  totalCount: number = 0;
  selectedVendorFilter: any = null;
  vendorlist: any[] = [];
  selectedDownloadType: string = '';
isExporting: boolean = false;
  constructor(public dashboardService: DashboardService, public toastService: ToastService) { 
    this.toastService.pageName = 'Migration Data'; // Set page name for toast service
  }
  ngOnInit(): void {
  
    this.loadVendorList();
      this.getDetails();
    // Initialization logic can be added here
  }
  loadVendorList() {
    this.dashboardService.getVendorList().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.vendorlist = response.entity;
        }
      },
      error: (error) => {
        {}
      }
    });
  }
public companywiseDeviceDetailsReq: CompanywiseDeviceDetailsReq = new CompanywiseDeviceDetailsReq();
getDetails() {
  const vendorFilter = this.selectedVendorFilter || '';

  //console.log('Sending to API param5:', vendorFilter); // 🔥 debug
  this.companywiseDeviceDetailsReq.param5 = vendorFilter; // ✅ set vendor filter in request object
  this.dashboardService.getCompanyWiseDeviceDetails(this.companywiseDeviceDetailsReq)
    .subscribe({
      next: (response: any) => {
        if (response.statuscode == 200) {
          this.detailData = response.entity.countlistData || [];
          this.totalCount = response.entity.param1 || 0;
        }
      },
      error: (err) => {
        console.error('Error fetching details:', err);
      }
    });
}
onVendorFilterChange(value: any) {
  this.selectedVendorFilter = value;
  this.getDetails();
}

  getSearchDetails() {

    this.getDetails();
  }
  reloadData() {
    this.selectedVendorFilter = null;
    this.listLoaded = false;
    this.detailData = [];
    this.totalCount = 0;
    this.getDetails();
    setTimeout(() => {
      this.listLoaded = true;
    }, 1000);
  }
  onPageSizeChange(event: any) {
    const pageSize = event.target.value;
    // Handle page size change logic here
  }
onDownloadChange() {

  if (this.selectedDownloadType === 'Excel') {
    this.exportToExcel();
  }

  // reset dropdown
  setTimeout(() => {
    this.selectedDownloadType = '';
  }, 500);
}
exportToExcel() {

  this.isExporting = true;

  const vendorFilter = this.selectedVendorFilter ? this.selectedVendorFilter : '';

  this.dashboardService.getCompanyWiseDeviceDetailsForExport(vendorFilter)
    .subscribe({
      next: (response: any) => {

        this.isExporting = false;

        if (response?.status && typeof response.entity === 'string') {

          // Direct Download
          const link = document.createElement('a');
          link.href = response.entity;
          link.setAttribute('download', '');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

        } else {
          alert('Failed to generate Excel');
        }
      },
      error: () => {
        this.isExporting = false;
        alert('Error exporting Excel');
      }
    });
}


}
