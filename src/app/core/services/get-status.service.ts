import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService, ApiResponse } from './base-api.service';
export class ReceiptStatusResponse {
    "param1": string = "";      // rowNumber
    "param2": string = "";      // IMEI No
    "param3": string = "";      // Serial No
    "param4": string = "";      // ICCID No
    "param5": string = "";      // Vendor Name
    "param6": string = "";      // Dealer Name
    "param7": string = "";      // Vehicle No
    "param8": string = "";      // Chassis No
    "param9": string = "";      // Engine No
    "param10": string = "";     // Activation Date
    "param11": string = "";     // RTO Name
    "param12": string = "";     // Vehicle Type
    "param13": string = "";     // Activation Status
    "param14": string = "";     // Customer Name
    "param15": string = "";     // Customer Mobile
    "param16": string = "";     // Make Name
    "param17": string = "";     // Model Name
    "param18": string = "";     // Fuel Type
    "param19": string = "";     // Installation Date
    "param20": string = "";     // Polling Status
    "param21": string = "";
    "param22": string = "";
    "param23": string = "";
    "param24": string = "";
    "param25": string = "";
    "param26": string = "";
    "param27": string = "";
    "param28": string = "";
    "param29": string = "";
    "param30": string = "";
    "param31": string = "";
    "param32": string = "";
    "param33": string = "";
    "param34": string = "";
    "param35": string = "";
    "param36": string = "";
    "param37": string = "";
    "param38": string = "";
    "param39": string = "";
    "param40": string = "";
    "param41": string = "";
    "param42": string = "";
    "param43": string = "";
    "param44": string = "";
    "param45": string = "";
    "param46": string = "";
    "param47": string = "";
    "param48": string = "";
    "param49": string = "";
    "param50": string = "";  //alert id 
    "param51": string = ""; //device mode
    "param52": string = "";
    "param53": string = "";
    "param54": string = "";
    "param55": string = "";
    "param56": string = "";
    "param57": string = "";
    "param58": string = "";
    "param59": string = "";
    "param60": string = "";
    "param61": string = "";
    "param62": string = "";
    "param63": string = "";
    "param64": string = "";
    "param65": string = "";
    "param66": string = "";
    "param67": string = "";
    "param68": string = ""; // eligible to send otp
    "statuscolorparam1": string = "";
    "statusmsg": string = "";

}
export interface ReceiptStatusRequest {
    "param1": string;
}
export interface VehicleOtpDetailsRequest {
  param1: string; // Search By
  param2: string; // Page No
  param3: string; // Item Per Page
  param4: string; // Company Id
  param5: any; // From Date
  param6: any; // To Date
}
export class VehicleOtpDetailsResponse {

  param1: string = ""; // Vendor Name
  param2: string = ""; // IMEI No
  param3: string = ""; // Unique Device No
  param4: string = ""; // Vehicle / Chassis No
  param5: string = ""; // Name
  param6: string = ""; // Mobile No
  param7: string = ""; // OTP
  param8: string = ""; // Time

  statuscolorparam1: string = "";
  statusmsg: string = "";
}
@Injectable({
  providedIn: 'root'
})
export class GetStatusService  extends BaseApiService {
  protected override http = inject(HttpClient);
   getVendorRoster(): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_get_vendor_roster?type=&stateId=', {
      type: '',
      stateId: ''
    });
  }

  /**
 * Get Vehicle OTP Details
 */
getVehicleOtpDetails(request: VehicleOtpDetailsRequest)
: Observable<ApiResponse<VehicleOtpDetailsResponse>> {

  return this.post<VehicleOtpDetailsResponse>('/psv_get_vehicleotpdetalis', {
    param1: request.param1 || '',
    param2: request.param2 || '',
    param3: request.param3 || '',
    param4: request.param4 || '',
    param5: request.param5 || '',
    param6: request.param6 || ''
  });

}
  /**
     * Get asset status details (for Asset Status page)
     */
    getStatusDetails(request: {
      param1: string;  // Search text
      param10?: string;
      pdfexcel?: string;
      }): Observable<ApiResponse<ReceiptStatusResponse>> {
      return this.post<ReceiptStatusResponse>('/psv_get_status', {
        param1: request.param1 || '',
        param10: request.param10 || '',
        pdfexcel: request.pdfexcel || ''
      });
    }

    /**
     * Get receipt PDF download path
     */
    getReceiptPdfPath(vehicleId: string): Observable<ApiResponse<string>> {
      return this.post<string>('/psv_get_receipt_details', {
        param1: vehicleId,
        param10: 'pdf'
      });
    }
    clearMviSosAlert(alertId: string, imeiNo: string, remarks: string = 'Alert cleared'): Observable<ApiResponse<any>> {
  return this.post<any>('/psv_mvisosalertclear', {
    alertid: alertId,
    imeino: imeiNo,
    remarks: remarks
  });
}

openModal(id: string) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('show');
    modal.style.display = 'block';
  }
  document.body.classList.add('modal-open');

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop fade show';
  document.body.appendChild(backdrop);
}
closeModal(id: string) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('show');
    modal.style.display = 'none';
  }
  document.body.classList.remove('modal-open');

  const backdrop = document.querySelector('.modal-backdrop');
  if (backdrop) {
    backdrop.remove();
  }
}

}
