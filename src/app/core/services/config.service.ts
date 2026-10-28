import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, ApiResponse } from './base-api.service';

@Injectable({
  providedIn: 'root'
})
export class ConfigService extends BaseApiService {

  /**
   * Insert alert configuration
   */
  insertAlertConfig(request: {
    param1: string;  // "0"
    param2: string;  // contact numbers (comma separated)
    param3: string;  // ""
    param4: string;  // email ids (comma separated)
    param5: string;  // vehicle
    param6: string;  // alert type (encrypted)
    param7: string;  // speed
    param8: string;  // day list (comma separated)
    param9: string;  // search id (encrypted - vendor/rto/customer)
    param10: string; // search filter role id (encrypted - 11/19/14)
  }): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_insert_alert_build', request);
  }

  /**
   * Update alert configuration
   */
  updateAlertConfig(request: {
    param1: string;  // config id (encrypted)
    param2: string;  // contact numbers (comma separated)
    param3: string;  // ""
    param4: string;  // email ids (comma separated)
    param5: string;  // vehicle
    param6: string;  // alert type (encrypted)
    param7: string;  // speed
    param8: string;  // day list (comma separated)
    param9: string;  // search id (encrypted)
    param10: string; // search filter role id (encrypted)
  }): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_edit_alert_build', request);
  }

  /**
   * Delete alert configuration
   */
  deleteAlertConfig(request: {
    param1: string;  // config id (encrypted)
    param2: string;  // remark
  }): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_delete_alert_build', request);
  }

  /**
   * Get alert configuration details
   */
  getAlertConfigDetails(request: {
    param1: string;  // searchText
    param2: string;  // pageNumber
    param3: string;  // pageSize
    param4: string;  // companyId (encrypted)
  }): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_alert_build_details', request);
  }

  /**
   * Verify contact number
   */
  verifyContact(contactNumber: string): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_get_verifycontact', {
      param1: contactNumber
    });
  }
}
