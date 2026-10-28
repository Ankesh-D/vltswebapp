
import { ChangeDetectorRef, Component, NgModule, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { AlertService } from '../../../core/services/alert.service';
import { Subscription } from 'rxjs';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';

@Component({
    selector: 'app-rest-alert',
    imports: [FormsModule, RouterModule, NgSelectModule, CommonTableComponent],
    templateUrl: './rest-alert.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './rest-alert.component.scss'
})
export class RestAlertComponent implements OnInit{
  currentPage: number = 1;
  sortKey: string = '';
  reverse: boolean = false;
  pageSize: any = 10;
  totalCount: any = 0;
  pageSizeOptions = [20];
  pageCount: any = 0;
  searchText: string ="";
  loading: boolean = false;
  getVehicleWiseAlertAPI: Subscription | undefined;
  errorMessage: string = '';

  vehicleWiseData: any[] =[];
  readonly tableColumns: CommonTableColumn<any>[] = [
    { key: 'index', label: '#', width: '25px' },
    { key: 'vehicle', label: 'Vehicle No' },
    { key: 'vehicleType', label: 'Vehicle Type' },
    { key: 'imei', label: 'IMEI No.' },
    { key: 'empty', label: '' }
  ];
  constructor(private cdr: ChangeDetectorRef, private alertService: AlertService) { }
  ngOnInit(): void {
      this.loadVehicleWiseAlertDetails();
  }

  loadVehicleWiseAlertDetails() {
   const request = {
     
      param1: "",//alertid
      param2: this.currentPage,//pageno
      param3: this.pageSize,//itemperpage
      param4: this.searchText,//searchby
      param5: "",//vehicleid
      param6: "",//vendorid
      param7: "",//alertdate

    }
    this.stopApiCalls();
    this.getVehicleWiseAlertAPI = this.alertService.getVehiclewiseAlerts(request, true).subscribe({
      next: (response: any) => {
        if (response.statuscode == 200) {
          this.vehicleWiseData = response.entity.listData;
          this.totalCount = response.entity.param1 || 0;
          
          // Calculate page count
          if (this.vehicleWiseData.length < this.pageSize) {
            this.pageCount = this.vehicleWiseData.length;
          } else {
            this.pageCount = this.pageSize;
          }
          
          // Update page size options
          this.updatePageSizeOptions();
        }
      },
      error: (err: any) => {
        this.loadVehicleWiseAlertDetails();
        console.error('Error:', err);
        this.errorMessage = 'Error loading data. Please try again.';
      }
    }); 
  }
  stopApiCalls() {
    if (this.getVehicleWiseAlertAPI) {
      this.getVehicleWiseAlertAPI.unsubscribe();
    }
  }

  getSearchDetails() {
    this.currentPage = 1;
    this.loadVehicleWiseAlertDetails();
  }
  
  reloadData() {
    this.searchText = '';
    this.currentPage = 1;
    this.loadVehicleWiseAlertDetails();
  }
  onPageChange(page: number) {
    this.currentPage = page;
    this.loadVehicleWiseAlertDetails();
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

  shouldShowPage(page: number): boolean {
    return page !== -1;
  }

  onPageSizeChange(size: number | string) {
    if (size === 'All' || size === this.totalCount) {
      this.pageSize = this.totalCount;
    } else {
      this.pageSize = Number(size);
    }
    this.currentPage = 1;
    this.loadVehicleWiseAlertDetails();
  }

  sort(key: string) {
    if (this.sortKey === key) {
      this.reverse = !this.reverse;
    } else {
      this.sortKey = key;
      this.reverse = false;
    }
    // Trigger change detection to re-render sorted data
    this.cdr.detectChanges();
  }
}
