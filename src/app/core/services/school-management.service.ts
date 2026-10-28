import { Injectable } from '@angular/core';
import { ApiResponse, BaseApiService } from './base-api.service';
import { SchoolMasterDeleteReq, SchoolMasterDetailsReq, SchoolMasterFormReq, DriverMasterDeleteReq, DriverMasterDetailsReq, DriverMasterFormReq, StudentMasterDetailsReq, StudentMasterFormReq, StudentMasterDeleteReq, ShiftMasterDetailsReq, ShiftMasterFormReq, ShiftMasterDeleteReq } from '../model/request.model';
import { Observable } from 'rxjs';
import { insert } from '@amcharts/amcharts5/.internal/core/util/Array';

@Injectable({
  providedIn: 'root'
})
export class SchoolManagementService extends BaseApiService {
  getSchoolDetails(request: SchoolMasterDetailsReq): Observable<ApiResponse> {
      return this.post<ApiResponse>('/psv_schooldetails', request);
  }
  insertSchoolDetails(request: SchoolMasterFormReq): Observable<ApiResponse> {
      return this.post<ApiResponse>('/psv_schoolentry', request);
  }
  updateSchoolDetails(request: SchoolMasterFormReq): Observable<ApiResponse> {
      return this.post<ApiResponse>('/psv_updateschooldetails', request);
  }
  deleteSchoolDetails(request: SchoolMasterDeleteReq): Observable<ApiResponse> {
      return this.post<ApiResponse>('/psv_deleteschooldetails', request);
  }

//  Student Master
getStudentDetails(request: StudentMasterDetailsReq): Observable<ApiResponse> {
    return this.post<ApiResponse>('/psv_studentdetails', request);
}
insertStudentDetails(request: StudentMasterFormReq): Observable<ApiResponse> {
    return this.post<ApiResponse>('/psv_insertstudent', request);
}
updateStudentDetails(request: StudentMasterFormReq): Observable<ApiResponse> {
    return this.post<ApiResponse>('/psv_updatestudent', request);
}
deleteStudentDetails(request: StudentMasterDeleteReq): Observable<ApiResponse> {
    return this.post<ApiResponse>('/psv_deletestudent', request);
}

  getDriverDetails(request: DriverMasterDetailsReq): Observable<ApiResponse> {
      return this.post<ApiResponse>('/psv_get_driverdetails', request);
  }
  insertDriverDetails(request: DriverMasterFormReq): Observable<ApiResponse> {
      return this.post<ApiResponse>('/psv_put_driver', request);
  }
  updateDriverDetails(request: DriverMasterFormReq): Observable<ApiResponse> {
      return this.post<ApiResponse>('/psv_edit_driver', request);
  }
  deleteDriverDetails(request: DriverMasterDeleteReq): Observable<ApiResponse> {
      return this.post<ApiResponse>('/psv_remove_driver', request);
  }
  // Shift Master
  getShiftDetails(request: ShiftMasterDetailsReq): Observable<ApiResponse> {
    return this.post<ApiResponse>('/psv_shiftdetails', request);
  }
  insertShiftDetails(request: ShiftMasterFormReq): Observable<ApiResponse> {
      return this.post<ApiResponse>('/psv_insertshift', request);
  }
  updateShiftDetails(request: ShiftMasterFormReq): Observable<ApiResponse> {
      return this.post<ApiResponse>('/psv_updateshift', request);
  }
  deleteShiftDetails(request: ShiftMasterDeleteReq): Observable<ApiResponse> {
      return this.post<ApiResponse>('/psv_deleteshift', request);
  }

  /**
   * Get state list
   */
  getStateList(): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_get_address_state_roster', {});
  }

  getSchoolList(searchby?: any): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_schoollist', {})
  }

  getSchoolClassList(searchby?: any): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_schoolclasslist', {})
  }
  
  getGuardianTypeList(searchby?: any): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_guardiantypelist', {})
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
}

