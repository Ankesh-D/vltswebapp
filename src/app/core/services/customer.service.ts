import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, ApiResponse } from './base-api.service';

export interface Customer {
  param1: number | string;  // rowNumber
  param3: string;  // customerName
  param4: string;  // customerType
  param5: string;  // mobileNo
  param6: string;  // emailId
  param8: string;  // address
  param11: string; // dealerName
  param12: string; // vendorName
  param15: string; // assets (total vehicles)
}

export interface CustomerListResponse {
  listData: Customer[];
  param1: number; // totalCount
}

@Injectable({
  providedIn: 'root'
})
export class CustomerService extends BaseApiService {

  /**
   * Get customer details/list (permit holders)
   */
  getCustomerDetails(request: {
    param1: string;  // searchText
    param2: string;  // pageNumber
    param3: string;  // pageSize
  }): Observable<ApiResponse<CustomerListResponse>> {
    return this.post<CustomerListResponse>('/psv_display_permitholder', request);
  }

  /**
   * Get customer roster (for dropdowns)
   */
  getCustomerRoster(): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_get_permitholder_roster', {});
  }
}
