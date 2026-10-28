import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, ApiResponse } from './base-api.service';

export interface PermitHolder {
  param1: number | string;  // rowNumber
  param2: string;  // customerId
  param3: string;  // holderName
  param4: string;  // holderType
  param5: string;  // mobileNo
  param6: string;  // emailId
  param7: string;  // alternateMobileNo
  param8: string;  // address
  param9: string;  // city
  param10: string; // pinCode
}

export interface PermitHolderListResponse {
  listData: PermitHolder[];
  param1: number; // totalCount
}

export interface PermitHolderRequest {
  param1: string;  // searchText
  param2: string;  // pageNumber
  param3: string;  // pageSize
}

export interface PermitHolderUpdateRequest {
  param1: string;  // customerId
  param2: string;  // holderName
  param3: string;  // holderType
  param4: string;  // mobileNo
  param5: string;  // emailId
  param6: string;  // alternateMobileNo
  param7: string;  // address
  param8: string;  // city
  param9: string;  // pinCode
  param10: string; // state (optional)
  param11: string; // remark
}

@Injectable({
  providedIn: 'root'
})
export class PermitHolderService extends BaseApiService {

  /**
   * Get permit holder (customer) details
   */
  getPermitHolderDetails(request: PermitHolderRequest): Observable<ApiResponse<PermitHolderListResponse>> {
    return this.post<PermitHolderListResponse>('/psv_get_permitholder', request);
  }

  /**
   * Update permit holder (customer) details
   */
  updatePermitHolder(request: PermitHolderUpdateRequest): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_edit_permitholder', request);
  }

  /**
   * Delete permit holder (customer)
   */
  deletePermitHolder(customerId: string, remark: string): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_remove_permitholder', {
      param1: customerId,
      param2: remark
    });
  }

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
}
