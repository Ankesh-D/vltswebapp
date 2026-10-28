import { Component, OnInit, ChangeDetectorRef, ViewChild, AfterViewInit, DoCheck, OnChanges, AfterViewChecked, AfterContentChecked, ChangeDetectionStrategy } from '@angular/core';

import { Router, RouterModule } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import moment from 'moment';
import { UntagRequestDetailsReq } from '../../../../core/model/request.model';
import { UntaggedRequestDetailsResp } from '../../../../core/model/response.model';
import { DeviceService } from '../../../../core/services/device.service';
import { ToastService } from '../../../../core/services/toast.service';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
declare var $: any;

@Component({
    selector: 'app-untag-request-details',
    imports: [FormsModule, NgbPaginationModule],
    templateUrl: './untag-request-details.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './untag-request-details.component.scss'
})
export class UntagRequestDetailsComponent implements OnInit {
  @ViewChild('searchVendorForm') searchVendorForm!: NgForm;
  public detailsRequest: UntagRequestDetailsReq = new UntagRequestDetailsReq();
  public detailsData: UntaggedRequestDetailsResp[] = [];
  showAcknowledgementEntry: boolean = false;
  isDatePickerInitialized: boolean = false;

  pageSizeOptions: any[]=[10, 20, 50, 100, 500];
  isExporting: boolean = false;
  selectedDownloadType: any = '';
  totalCount: number = 0;
  pageCount: number = 0;
  totalPages: number = 0;
  pageSize: number = 10;
  loading: boolean= false;
  pageNo: number = 1;
  roleId: any;
  selectedDate: string = "";
  constructor(private deviceService: DeviceService, private toastService: ToastService, private router: Router) {
  }
  ngOnInit(): void {
      this.getDetails('init');  
    
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
 
 
  getDetails(tooluse?: any) {
    
    if(tooluse=='init' || tooluse=='search') {
      if(tooluse=='init') {
        this.detailsRequest.param4 = "";
      }
      // this.detailsRequest.param2 = 1;
      // this.detailsRequest.param3 = 10;
    }
    if(tooluse=='pageSize') {
      this.detailsRequest.param2 = 1;
    }
   
    this.loading=true;
    this.deviceService.untaggedRequestsResponse(this.detailsRequest).subscribe({
      
      next: (res: any) => {
        this.loading=false;
        if(res.statuscode==200) {
          this.detailsData = res?.entity?.listData || res?.entity || [];
          const total = Number(res?.entity?.param1 || 0);
          this.totalCount = total;
          this.pageCount = this.detailsData.length;
          // ✅ pages
          this.totalPages = Math.ceil(total / this.pageSize);
          this.updatePageSizeOptions()
        } else {
          this.detailsData = [];
          this.totalCount = 0;
          this.pageCount = 0;
          this.totalPages = 0;    
          this.toastService.show('No data found', 'error');
        }
    },
    error: (err: any) => {
        this.loading = false;
        console.error(err);
        this.toastService.show('Something went wrong', 'error');
      }
    });
  }
  changePage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.pageNo = p;
    this.detailsRequest.param2 = this.pageNo;
    this.getDetails('pagechage'); // 🔥 reload API
  }
  
  goToForm() {
    this.router.navigate(['acknowledgeactivation'])
  }
  onchangePage() {

    this.showAcknowledgementEntry = true
  }
  onPageChange(page: number) {
    this.detailsRequest.param2 = Number(page);
    this.getDetails('pagechange');
  }
  
}
