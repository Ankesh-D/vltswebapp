import { Component, OnInit, ChangeDetectorRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';

import { Router, RouterModule } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { CheckHealthAckDetailsReq, UserCreationDetailsReq } from '../../../core/model/request.model';
import { ToastService } from '../../../core/services/toast.service';
import { CheckHealthAckResponse, UserCreationDetailsResp } from '../../../core/model/response.model';
import moment from 'moment';
import { DeviceService } from '../../../core/services/device.service';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';
declare var $: any;
@Component({
    selector: 'app-activation-acknowledgment',
    imports: [FormsModule, RouterModule, CommonTableComponent],
    templateUrl: './activation-acknowledgment.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './activation-acknowledgment.component.scss'
})
export class ActivationAcknowledgmentComponent implements OnInit {
  @ViewChild('searchVendorForm') searchVendorForm!: NgForm;
  public detailsRequest: CheckHealthAckDetailsReq = new CheckHealthAckDetailsReq();
  public detailsData: CheckHealthAckResponse[]=[];
  readonly tableColumns: CommonTableColumn<CheckHealthAckResponse>[] = [
    { key: 'param1', label: '#', value: row => row.param1 || '-' },
    { key: 'param3', label: 'IMEI No', value: row => row.param3 || '-' },
    { key: 'param29', label: 'Health Packet', value: row => row.param29 || '-' },
    { key: 'param17', label: 'Received Time', value: row => row.param17 || '-' }
  ];

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
  selectedDate: any;
  constructor(private deviceService: DeviceService, private toastService: ToastService, private router: Router) {
    this.toastService.pageName = 'Activation Acknowledgment';
  }
  ngOnInit(): void {
    this.roleId = sessionStorage.getItem('roleid');
    this.initializeDatePicker() 
    setTimeout(() => {
      this.getDetails('init');  
    }, 500);
  }
  initializeDatePicker() {
    // this.selectedDate = moment().format('DD-MMM-YYYY');
  
    $(() => {
      const $dateInput = $('input[name="date"]');
  
      $dateInput.daterangepicker({
        singleDatePicker: false,
        showDropdowns: true,
        autoApply: false,
        timePicker: false,
        startDate: moment(),
        endDate: moment(), 
        maxDate: moment(),
        minYear: moment().subtract(2, 'year').year(),
        maxYear: moment(),
        opens: 'center',
        drops: 'down',
        locale: {
          format: 'DD-MMM-YYYY'
        }
      });
  
      // On date selection
     $dateInput.on('apply.daterangepicker', (ev: any, picker: any) => {
        this.selectedDate = `${picker.startDate.format('DD-MMM-YYYY')} - ${picker.endDate.format('DD-MMM-YYYY')}`;
        this.detailsRequest.param6 = `${picker.startDate.format('DD-MMM-YYYY')}`;
        this.detailsRequest.param7 = `${picker.endDate.format('DD-MMM-YYYY')}`;
         this.getDetails('filter')
      });
  
      // On picker close
      // $dateInput.on('hide.daterangepicker', (ev: any, picker: any) => {
      //   this.selectedDate = `${picker.startDate.format('DD-MMM-YYYY')} - ${picker.endDate.format('DD-MMM-YYYY')}`;
      //   this.detailsRequest.param6 = `${picker.startDate.format('DD-MMM-YYYY')}`;
      //   this.detailsRequest.param7 = `${picker.endDate.format('DD-MMM-YYYY')}`;
       
      // });
    });
  }
  
  getDetails(tooluse?: any) {
    let daterange = $('#datepicker').val().split(" - ")
    this.detailsRequest.param6 = daterange[0];
    this.detailsRequest.param7 = daterange[1];
    if(tooluse=='init' || tooluse=='search') {
        if(tooluse=='init') {
          
          this.detailsRequest.param4 = "";
        }
        this.detailsRequest.param2 = 1;
        this.detailsRequest.param3 = 10;
      }
    if(tooluse=='pagesize') {

    }
    this.loading=true;
    this.deviceService.smsacknowledgeResponse(this.detailsRequest).subscribe({
      
      next: (res: any) => {
        this.loading=false;
        if(res.statuscode==200) {
          this.detailsData = res?.entity?.listData || res?.entity || [];
          const total = Number(res?.entity?.param1 || 0);
          this.totalCount = total;
          this.pageCount = this.detailsData.length;
          // ✅ pages
          this.totalPages = Math.ceil(total / this.pageSize);
        } else {
          this.toastService.show('No data found', 'error');
          this.detailsData = [];
          this.totalCount = 0;
          this.pageCount = 0;
          this.totalPages = 0;    
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
  onDownloadChange() {}

  goToForm() {
    this.router.navigate(['/usercreation'])
  }
}
