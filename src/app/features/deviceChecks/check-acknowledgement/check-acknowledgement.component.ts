import { ToastService } from './../../../core/services/toast.service';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { GetStatusService, ReceiptStatusResponse } from '../../../core/services/get-status.service';
import { DeviceService } from '../../../core/services/device.service';
import { CheckHealthAckDetailsReq, DeviceHealthAckSendReq, smsAcknowledgedetailsReq } from '../../../core/model/request.model';
import { CheckHealthAckResponse, SMSAcknowledgeDetailsResp } from '../../../core/model/response.model';

@Component({
    selector: 'app-check-acknowledgement',
    imports: [CommonModule, FormsModule, NgSelectModule],
    templateUrl: './check-acknowledgement.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './check-acknowledgement.component.scss'
})
export class CheckAcknowledgementComponent implements OnInit {
   @ViewChild("searchForm") searchForm!: NgForm;
  searchBy: string = "";
  statusDetailsFlag: boolean = false;
  responseData: ReceiptStatusResponse = new ReceiptStatusResponse();
  showAcknowledgementEntry: boolean = false;
  constructor(public getStatusService: GetStatusService, public toastService: ToastService, public deviceService: DeviceService) {

  }
  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    
  }
   @Output() statusChange = new EventEmitter<boolean>();
  backBtn() {
    this.statusChange.emit(false);
  }
  onFetchClick() {
    if (this.searchForm.valid) {
      let paramValue = this.searchBy.trim();
      this.getStatusService
        .getStatusDetails({
          param1: paramValue,
          param10: "forrenewal",
          pdfexcel: "",
        })
        .pipe()
        .subscribe({
          next: (response: any) => {
            if (response.statuscode == 200) {
              this.responseData = response.entity;
              this.statusDetailsFlag = true;
              // this.getHealthAcknowledgeResponse();
              
            } else {
              this.statusDetailsFlag = false;
             
              this.toastService.show(response.entity,"error");
            }
          },
          error: (error) => {
          },
        });
    }
  }
  onClearClick() {
    this.responseData = new ReceiptStatusResponse();
    this.checkHealthAckResponse =  new CheckHealthAckResponse();
  }
  onRefreshClick() {
    this.onFetchClick();
  }
  public smsAckReq: CheckHealthAckDetailsReq = new CheckHealthAckDetailsReq();
  public checkHealthAckResponse: CheckHealthAckResponse = new CheckHealthAckResponse();
  public sendHealthAckReq: DeviceHealthAckSendReq = new DeviceHealthAckSendReq();
  getHealthAcknowledgeResponse() {
    this.smsAckReq.param4 = this.responseData.param4;
    this.deviceService.checkHealthAckResponse(this.smsAckReq).subscribe({
      next : (resp: any)=> {
        if(resp.statuscode==200) {
          this.checkHealthAckResponse = resp.entity.listData[0];
        } else {
          this.checkHealthAckResponse =  new CheckHealthAckResponse();
          this.toastService.show(resp.entity, 'error');
        }
      },
      error: (err: any) => {

      }
    });
  }

sendDeviceHealthCheck() {

  this.sendHealthAckReq.param1 = this.responseData.param1;
  this.sendHealthAckReq.param2 = this.responseData.param7;
  this.sendHealthAckReq.param3 = this.responseData.param4;

  this.deviceService.checkHealthAckSend(this.sendHealthAckReq).subscribe({
    next: (response: any) => {

      if (response?.statuscode === 200) {

        this.toastService.show(
          response?.entity?.param1 || response?.entity || 'Success',
          'success'
        );

        this.getHealthAcknowledgeResponse();

      } else {

        this.toastService.show(
          response?.entity?.param1 || response?.entity || 'Something went wrong',
          'error'
        );

      }
    },
    error: (error: any) => {

      this.toastService.show(
        error?.error?.entity ||
        error?.error?.message ||
        error?.message ||
        'Internal Server Error',
        'error'
      );

      console.error(error);
    }
  });
}

}
