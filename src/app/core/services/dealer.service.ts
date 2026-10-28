import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService, ApiResponse } from './base-api.service';

export interface Dealer {
  param1: number;      // rowNumber
  param2: string; 
  param3: string;      // dealerName
  param5: string;      // address
  param7: string;      // city
  param8: string;      // state
  param9: string;      // contactPerson
  param10: string;     // emailId
  param11: string;     // mobileNo
  param12: string;     // alternateMobileNo
  param16: string;     // vendorId
  param24: string;     // cityId
  param25: string;     // stateId
  param34: string;     // distributorId
  param37: string;     // status (Active/Suspend)
  param18: string;     // vendorName (if applicable)
  param28: string;     // status (Active/Suspend)
  param29: number;     // totalDevices
  param30: number;     // installedDevices
  param31: number;     // activatedDevices
  param32: number;     // pendingDevices
  param33?: string;    // dealerId (for password reset)
  param35: string;     // distributorId
  param36: string;     // distributorName
  param38: string;     // some parameter
  param51: string;     // some parameter
}

export interface DealerListResponse {
  listData: Dealer[];
  param1: number; // totalCount
}

export interface DealerRequest {
  param1: string;  // Search text
  param2: string;  // Page number (1-based)
  param3: string;  // Page size
  param4: string;  // Count type (Total, Active, etc.)
  pdfexcel?: string; // "pdf" or "excel" for export (optional)
}

export interface DealerEntryRequest {
  param1?: string;  // dealerId (for update)
  param2: string;   // vendorId
  param3: string;   // dealerName
  param4: string;   // contactPerson
  param5: string;   // address
  param6: string;   // cityId
  param7: string;   // cityName
  param8: string;   // stateId
  param9: string;   // stateName
  param10: string;  // emailId
  param11: string;  // mobileNo
  param12: string;  // alternateMobileNo
}

@Injectable({
  providedIn: 'root'
})
export class DealerService extends BaseApiService {
  protected override http = inject(HttpClient);

  /**
   * Get dealer details
   */
  getDealerDetails(request: DealerRequest): Observable<ApiResponse<DealerListResponse>> {
    return this.post<DealerListResponse>('/psv_get_vendordealerdetails', {
      param1: request.param1 || '',
      param2: request.param2 || '1',
      param3: request.param3 || '20',
      param4: request.param4 || ''
    });
  }

  /**
   * Create or update dealer
   */
  putDealer(dealerData: DealerEntryRequest): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_put_vendordealer', dealerData);
  }

  /**
   * Update dealer details
   */
  updateDealer(request: {
    param1: string;  // dealerId
    param2: string;  // dealerName
    param3: string;  // dealerGST
    param4: string;  // address
    param5: string;  // address2
    param6: string;  // city
    param7: string;  // state
    param8: string;  // contactPerson
    param9: string;  // emailId
    param10: string; // mobileNo
    param11: string; // alternateMobileNo
    param12: string; // vendorId
    param17: string; // remark
  }): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_edit_vendordealer', request);
  }

  /**
   * Block/Unblock dealer
   */
 blockUnblockDealer(
  dealerId: string,
  remark: string,
  action: 'block' | 'unblock'
): Observable<ApiResponse<any>> {
  return this.post<any>('/psv_get_block_unblock_dealer', {
    param1: dealerId,     // encrypted dealer id
    param2: '',           // backend expects empty
    param3: remark,       // remark (min 10 chars)
    param4: action        // "block" or "unblock"
  });
}

  /**
   * Delete dealer
   */
 deleteDealer(
  dealerId: string,
  remark?: string
): Observable<ApiResponse<any>> {
  return this.post<any>('/psv_remove_vendordealer', {
    param1: dealerId,   // dealerId
    param2: '',         // reserved
    param3: remark      // ✅ NOW DEFINED
  });
}


  /**
   * Get state list (same as vendor service)
   */
  getStateList(): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_get_address_state_roster', {});
  }

  /**
   * Get city list by state (same as vendor service)
   */
  getCityList(stateId: string): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_get_city_roster', {
      param1: stateId,  // stateid
      param2: ''        // districtid
    });
  }

  /**
   * Get vendor list (for dealer entry)
   * API expects POST with query parameters (not body) - uses @RequestParam in Spring
   */
  getVendorList(): Observable<ApiResponse<any[]>> {
    // API uses @RequestParam, so we need query parameters in URL
    // Use relative URL so interceptor adds base URL and headers
    const queryParams = `type=${encodeURIComponent('')}&stateId=${encodeURIComponent('')}`;
    return this.http.post<ApiResponse<any[]>>(`/psv_get_vendor_roster?${queryParams}`, {});
  }
getVendorDealerExcel(payload: any) {
  return this.http.post(
    '/psv_get_vendordealerdetails',
    payload
  );
}
}
