
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { DeviceService, RenewalDetailsRequest } from '../../../core/services/device.service';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';

@Component({
    selector: 'app-renewad-details',
    imports: [FormsModule, CommonTableComponent],
    templateUrl: './renewad-details.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './renewad-details.component.scss'
})
export class RenewadDetailsComponent implements OnInit {
  loading: boolean = false;
  searchText = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [20];
  totalCount = 0;
  pageCount = 0;

  detailsData: any[] = [];
  readonly tableColumns: CommonTableColumn<any>[] = [
    { key: 'param1', label: '#' },
    { key: 'param5', label: 'Vendor' },
    { key: 'param6', label: 'Dealer' },
    { key: 'vehicle', headers: ['Vehicle No.', 'Chassis No.'] },
    { key: 'param11', label: 'Engine No.' },
    { key: 'makeModel', headers: ['Make', 'Model'] },
    { key: 'param19', label: 'Class' },
    { key: 'param13', label: 'Mfg Year' },
    { key: 'device', headers: ['Serial No.', 'IMEI NO.'] },
    { key: 'param4', label: 'ICCID No.' },
    { key: 'installation', headers: ['Installation Date', 'Activation Date'] },
    { key: 'validity', headers: ['Validity Upto', 'Renewal Date'] }
  ];

  constructor(public toastService: ToastService, public deviceService: DeviceService) {
      this.toastService.pageName = 'Vehicle Renewal Details'; // Set page name for toast service
   }
  ngOnInit(): void {
    this.getDetails();
  }
  getDetails() {
    this.loading = true;
  
    const request: RenewalDetailsRequest = {
      "param1": "",
      "param2": this.currentPage.toString(),
      "param3": this.pageSize.toString(),
      "param4": this.searchText.trim(),
      "param5": "",
      "param6": "",
      "param7": "",
      "param8": "",
      "param9": "",
      "param10": "",
      "param11": "",
      "param12": "",
      "param13": "",
      "pdfexcel": "" 
    };

    this.deviceService.deviceRenewalDetails(request).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.detailsData = response.entity.listData || [];
          this.totalCount = response.entity.param1 || 0;

          // Calculate page count
          if (this.detailsData.length < this.pageSize) {
            this.pageCount = this.detailsData.length;
          } else {
            this.pageCount = this.pageSize;
          }

          // Update page size options
          this.updatePageSizeOptions();
        } else {
          // 🔥 IMPORTANT
          this.detailsData = [];
          this.totalCount = 0;
          this.pageCount = 0;

          // Optional: clean UI
          // this.errorMessage =
          //   typeof response.entity === 'string'
          //     ? response.entity
          //     : null;   // 👈 best UX
        }
      },
      error: (error) => {
        this.loading = false;
        // this.errorMessage = error;
      }
    });
  }
  
  onPageSizeChange(size: number | string) {
    if (size === 'All' || size === this.totalCount) {
      this.pageSize = this.totalCount;
    } else {
      this.pageSize = Number(size);
    }
    this.currentPage = 1;
    this.getDetails();
  }
  updatePageSizeOptions() {
    // Generate page size options based on total count
    const options = [20];
    if (this.totalCount > 50) options.push(50);
    if (this.totalCount > 100) options.push(100);
    if (this.totalCount > 200) options.push(200);
    if (this.totalCount > 500) options.push(500);
    if (this.totalCount > 1000) options.push(1000);
    if (this.totalCount > 0) options.push(this.totalCount); // 'All'
    this.pageSizeOptions = options;
  }
  onPageChange(page: number) {
    this.currentPage = page;
    this.getDetails();
  }

  reloadData() {
    this.searchText = '';
    this.currentPage = 1;
    this.getDetails();
  }

  getSearchDetails() {
    this.currentPage = 1;
    this.getDetails();
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
      if (this.currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis
        pages.push(total);
      } else if (this.currentPage >= total - 3) {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = total - 4; i <= total; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis
        pages.push(total);
      }
    }
    return pages;
  }
    // downloadPDFExcel(event: any) {
    //   console.log(event.target.value);
    //   let downloadType = event.target.value;
    //   const request = {
    //     param1: this.searchText, // search text
    //     param2: "", // page no
    //     param3: "", // items per page
    //     param4: this.formattedDate, // date
    //     param5: this.selectedAlertType ? String(this.selectedAlertType.param1) : "", // Handle null case when dropdown is cleared
    //     param6: "", //stateid
    //     param7: this.selectedVendorFilter ? String(this.selectedVendorFilter.param1) : '',
    //     param8: "",
    //     param9: this.alertType,
    //     param10: "",
    //     param11: this.vehicletype ? String(this.vehicletype) : "", //vehicle type old/new filter
    //     pdfexcel: this.downloadType != '' ? this.downloadType : "" // Pass download type if set, else empty
    //   };

    //   this.getAlertDetailVehiclesAPI = this.alertService.getAlertDetailVehicles(request, true).subscribe({
    //     next: (response: any) => {
    //       if (response.statuscode == 200) {
    //         this.dashboardService.commonFileDownload(response.entity)
    //       }
    //     },
    //     error: (err: any) => {
    //       console.error('Download error:', err);
    //       this.errorMessage = 'Error downloading data. Please try again.';
    //     }
    //   });
    // }
}
