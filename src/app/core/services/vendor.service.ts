import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, ApiResponse } from './base-api.service';
import { BusinessRuleMasterDetailsReq, VendorStatusReportReq } from '../model/request.model';
import { VendorStatusReportResp } from '../model/response.model';

export interface Vendor {
  param1: number;      // rowNumber
  param2: string;      // vendorId
  param3: string;      // mfgCode
  param4: string;      // vendorName
  param6: string;      // address
  param8: string;      // city
  param9: string;      // state
  param10: string;     // cinNo
  param11: string;      // gstNo
  param14: string;     // emailId
  param15: string;      // contactNo
  param16: string;      // contactPerson
  param18: string;     // mobileNo
  param37: string;      // activityStatus
  param44: string;      // approvalStatus
}

export interface VendorListResponse {
  listData: Vendor[];
  param1: number; // totalCount
}

export interface VendorPortMappingListResponse {
  listData: Vendor[];
  param1: number; // totalCount
}

export interface VendorRequest {
  param1: string;  // Search text
  param2: string;  // Page number (1-based)
  param3: string;  // Page size
  param4: string;  // Count type (Total, Active, etc.)
}

export interface VendorPortMappingRequest {
  param1:string;    ///this.searchText,
  param2:string;    ///page,
  param3:string; 
}

export class VendorwiseCheckUpdateRequest {
  "vendorid": string = ""; // "1947",
  "protocol_match": string = "";// "true",
  "checksum_ok": string = "";// "",
  "gps_validation": string = "";// "",
  "auth_ok": string = "";// "",
  "sms_ack": string = "";// "",
  "raw_data": string = "";// "",
  "movement_detected": string = "";// "",
  "frequency_10s": string = "";// "",
  "power_connected": string = "";// "",
  "no_tamper": string = "";// "",
  "disconnected_alert": string = "";// "",
  "time_synced": string = "";// "",
  "latency_ok": string = "";// "",
  "signal_ok": string = "";// "",
  "no_packet_loss": string = "";// "",
  "network_stable": string = "";// "",
  "remarks": string = "";// "",
  "secure_APN":string = "";
  "network_switch":string = ""; 
}

@Injectable({
  providedIn: 'root'
})
export class VendorService extends BaseApiService {

  /**
   * Get vendor details
   */
  getVendorDetails(request: VendorRequest): Observable<ApiResponse<VendorListResponse>> {
    return this.post<VendorListResponse>('/psv_get_vendordetails', {
      param1: request.param1 || '',
      param2: request.param2 || '1',
      param3: request.param3 || '20',
      param4: request.param4 || ''
    });
  }

  /**
   * Create or update vendor
   */
  putVendor(vendorData: any): Observable<ApiResponse> {
    return this.post('/psv_put_vendor', vendorData);
  }

  /**
   * Edit/Update vendor (update existing vendor)
   */
  editVendor(vendorData: any): Observable<ApiResponse> {
    return this.post('/psv_edit_vendor', vendorData);
  }

  /**
   * Get vendor data for editing (get single vendor details)
   */
  getVendorForEdit(vendorId: string): Observable<ApiResponse<Vendor>> {
    return this.post<Vendor>('/psv_edit_vendor', {
      param1: vendorId
    });
  }

  /**
   * Remove vendor
   */
  removeVendor(vendorId: string, remark: string): Observable<ApiResponse> {
    return this.post('/psv_remove_vendor', {
      param1: vendorId,
      param3: remark
    });
  }

  /**
   * Block/Unblock vendor
   */
  blockUnblockVendor(
    vendorId: string,
    remark: string,
    withDealer: 'Yes' | 'No',
    action: 'block' | 'unblock'
  ): Observable<ApiResponse> {
    return this.post('/psv_get_block_unblock_vendor', {
      param1: vendorId,
      param2: '',
      param3: remark,
      param4: withDealer,
      param5: action
    });
  }

  /**
   * Approve vendor
   */
  approveVendor(vendorId: string): Observable<ApiResponse> {
    return this.post('/psv_get_approve_vendor', {
      param1: vendorId,
      param3: 'true'
    });
  }


  getloadAssignedPortsDetails(request: VendorPortMappingRequest): Observable<ApiResponse<VendorPortMappingListResponse>> {
    return this.post<VendorPortMappingListResponse>('/psv_get_portassigndetails', {
      param1: request.param1 || '',
      param2: request.param2 || '1',
      param3: request.param3 || '20',
    });
  }

  /**
   * Get state list
   */
  getStateList(): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_get_address_state_roster', {});
  }

  /**
   * Get city list by state
   */
  getCityList(stateId: string): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_get_city_roster', {
      param1: stateId,  // stateid
      param2: ''        // districtid
    });
  }

  /**
   * Get vendor list
   */
  getVendorList(): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_get_vendor_roster', {
       type: "",
       stateId: ""
    });
  }

  /**
   * Get port list
   */
  getPortList(): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_get_portdetails_roster', {
      roleId: ''
    });
  }


  getVendorWiseInstallationCheckDetails(request: {param5: string, param8: string}): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_fetchvendorwisechecks', request);
  }

  /**
   * Update vendor wise installation check details
   */
  updateVendorWiseInstallationCheck(updateData: VendorwiseCheckUpdateRequest): Observable<ApiResponse> {
    return this.post('/psv_updatechecks', updateData);
  }
 getVendorStatusReport(request: VendorStatusReportReq): Observable<ApiResponse> {
   return this.post<VendorStatusReportResp>('/vendorstatusreport',request);
 }


//  business rule master
  getBusinessRuleMasterDetails(request: BusinessRuleMasterDetailsReq): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_get_business_rule_details', request);
  }

  updateBusinessRuleMaster(updateData: any): Observable<ApiResponse> {
    return this.post('/psv_edit_business_rule', updateData);
  }
  addBusinessRuleMaster(addData: any): Observable<ApiResponse> {
    return this.post('/psv_put_business_rule', addData);
  }
  deleteBusinessRuleMaster(ruleId: string, remark: string): Observable<ApiResponse> {
    return this.post('/psv_remove_business_rule', {
      param1: ruleId,
      param3: remark
    });
  }
 
}