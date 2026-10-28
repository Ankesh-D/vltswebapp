import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, ApiResponse } from './base-api.service';
import { saveAs } from 'file-saver';
import { CommonDetailsReq, CompanywiseDeviceDetailsReq, CompanywiseDeviceTodayActivationDetailsReq, CompanywiseDeviceTodayInstalledDetailsReq, WeeklyActivationChartReq } from '../model/request.model';
import { ActiveSessionDetailsResponse } from '../model/response.model';
export interface DashboardCounts {
  param1: number;  // vendorTotal
  param2: number;  // dealerTotal
  param3: number;  // customerTotal
  param4: number;  // devicesTotal
  param5: number;  // totalInstalled
  param6: number;  // totalActivated
  param7: number;  // totalPending
  param8: number;  // vendorActive
  param9: number;  // dealerActive
  param10: number; // rtoTotal
  param11: number; // rtoActive
  param12: number; // newVehicle
  param13: number; // oldVehicle
  param19: number; // todaysactivated
  
  // Convenience getters (computed properties)
  vendorTotal?: number;
  dealerTotal?: number;
  customerTotal?: number;
  devicesTotal?: number;
  totalInstalled?: number;
  totalActivated?: number;
  totalPending?: number;
  vendorActive?: number;
  dealerActive?: number;
  rtoTotal?: number;
  rtoActive?: number;
  newVehicle?: number;
  oldVehicle?: number;
  todaysactivated?: number;
}

export interface CompanyWiseDevice {
  param2: string;  // vendorId
  param3: string;  // vendorName
  param4: number;  // totaldevices
  param5: number;  // solddevice
  param6: number;  // installed
  param7: number;  // activated
  param8: number;  // pending
  param9: number;  // received
  param10: number; // notReceived
  param11: number; // neverReceived
   param12: number; 
  param13: number; // oldvehicle
  param14: number; // newvehicle
   param18: number; // newvehicle
    param19: number; // newvehicle
   param20: number; // newvehicle
   param21: number; // newvehicle
      param22: number;
  param45?: string; // manufacturerCode (optional)
}

export interface CompanyWiseDeviceResponse {
  countlistData: CompanyWiseDevice[];
}

export class RTOWiseDevice {
  // param1: number;  // index
  // param2: string;  // rtoId
  // param3: string;  // rtoName
  // param4: number;  // total
  // param6: number;  // installed
  // param7: number;  // activated
  // param8: number;  // pending
  // param9: number;  // received
  // param10: number; // notReceived
  // param11: number; // neverReceived
  // param13: number; // newRegister
  // param14: number; // oldRegister
  "param1": any = 0;
  "param2": any = 0;
  "param3": any = 0;
  "param4": any = 0; 
  "param5": any = 0; 
  "param6": any = 0; 
  "param7": any = 0; 
  "param8": any = 0; 
  "param9": any = 0; 
  "param10": any = 0;
  "param11": any = 0;
  "param13": any = 0;
  "param14": any = 0;
  "param15": any = 0;
  "param16": any = 0;
  "param17": any = 0;
  "param18": any = 0;
  "param19": any = 0;
  "param20": any = 0;
  "param21": any = 0;
  "param23": any = 0;
  "param24": any = 0;
  "param25": any = 0;
  "param26": any = 0;
  "param27": any = 0;
  "param28": any = 0;
  "param29": any = 0;
  "param30": any = 0;
  "param31": any = 0;
  "param32": any = 0;
  "param33": any = 0;
  "param34": any = 0;
  "param35": any = 0;
  "param36": any = 0;
  "param37": any = 0;
  "param38": any = 0;
  "param39": any = 0;
  "param40": any = 0;
  "param41": any = 0;
  "param42": any = 0;
  "param43": any = 0;
  "param44": any = 0;
  "param50": any = 0;
}export interface RTOWiseDeviceResponse {
  countlistData: RTOWiseDevice[];
  param1: number; // totalCount
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService extends BaseApiService {

  /**
   * Get state dashboard counts
   */
  getStateDashboardCount(): Observable<ApiResponse<DashboardCounts>> {
    return this.post<DashboardCounts>('/psv_get_state_dashboard_count', {});
  }

  /**
   * Get company wise device details
   */
getCompanyWiseDeviceDetails(request: CompanywiseDeviceDetailsReq): Observable<ApiResponse<CompanyWiseDeviceResponse>> {
  return this.post('/psv_get_companywise_device_details', request);
}

getCompanyWiseDTodayInstalledDetails(request: CompanywiseDeviceTodayInstalledDetailsReq
): Observable<ApiResponse<CompanyWiseDeviceResponse>> { 
  return this.post('/psv_get_company_wise_today_install', request);
}

getCompanyWiseDeviceDetailsForExport(
  vendorId: string = ''
): Observable<any> {

  return this.post('/psv_get_companywise_device_details', {
    param1: '',
    param2: '',
    param3: '',
    param4: '',
    param5: vendorId,
    pdfexcel: 'excel'   // 👈 THIS IS IMPORTANT
  });
}
getCompanyWiseDTodayActivationDetails(request: CompanywiseDeviceTodayActivationDetailsReq): Observable<ApiResponse<CompanyWiseDeviceResponse>> { 
  return this.post('/companywisetodayactivationcount', request);
}

  /**
   * Get today's alerts
   */
  getTodayAlerts(): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_get_homealerts', {});
  }

  /**
   * Get weekly activation (Last 7 Days)
   */
  getWeeklyActivation(request: WeeklyActivationChartReq): Observable<ApiResponse<{ listData: any[] }>> {
    return this.post<{ listData: any[] }>('/psv_get_weekly_rtowise_activation', request);
  }

  /**
   * Get RTO wise device count
   */
getRTOWiseDeviceCount(
  param4: string = 'details',
  param5: string = '',
  param6: string = '',
  param7: string = '',
  filter1: string = '',
  pdfexcel: string = ''      // ✅ ADD
): Observable<ApiResponse<RTOWiseDeviceResponse>> {

  return this.post<RTOWiseDeviceResponse>(
    '/psv_get_rto_wise_device_count',
    {
      param1: '',
      param2: 'NA',
      param3: 'NA',
      param4: param4,
      param5: param5,
      param6: param6,
      param7: param7,
      param8: filter1,
      pdfexcel: pdfexcel       // ✅ DYNAMIC
    }
  );
}

  /**
   * Get vendor list for dropdown filter
   * API expects POST with query parameters (not body) - uses @RequestParam in Spring
   */
  getVendorList(type: string = '', stateId: string = ''): Observable<ApiResponse<any[]>> {
    // API uses @RequestParam, so we need query parameters in URL
    // Use relative URL so interceptor adds base URL and headers
    const queryParams = `type=${encodeURIComponent(type || '')}&stateId=${encodeURIComponent(stateId || '')}`;
    return this.http.post<ApiResponse<any[]>>(`/psv_get_vendor_roster?${queryParams}`, {});
  }

  /**
   * Get RTO list for dropdown filter
   * API expects POST with query parameters (not body) - uses @RequestParam in Spring
   */
  getRTOList(rtoId: string = ''): Observable<ApiResponse<any[]>> {
    // API uses @RequestParam, so we need query parameters in URL
    // Use relative URL so interceptor adds base URL and headers
    const queryParams = `rtoId=${encodeURIComponent(rtoId || '')}`;
    return this.http.post<ApiResponse<any[]>>(`/psv_get_subrto_roster?${queryParams}`, {});
  }

  /**
   * Get state list
   */
  getStateList(): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_get_address_state_roster', {});
  }

  /**
   * Get network list (for SIM network dropdown)
   */
  getNetworkList(): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_get_network_roster', {});
  }

  /**
   * Get M2M provider list
   */
  getM2MProviderList(): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_get_m2mprovider_roster', {});
  }

  /**
   * Get dealer list by vendor
   */
  getDealerListByVendor(vendorId: string, distributorId: string = ''): Observable<ApiResponse<any[]>> {
    const queryParams = `companyid=${encodeURIComponent(vendorId)}&vendorid=${encodeURIComponent(vendorId)}&distributorid=${encodeURIComponent(distributorId)}`;
    return this.http.post<ApiResponse<any[]>>(`/psv_get_vendordealer_roster?${queryParams}`, {});
  }
  //   getDealerListByVendor(request: {
  //   "companyid": string,//companyid,
  //   "vendorid": string,//otp,
  //   "distributorid": string,//mobileno,
  // }): Observable<ApiResponse<any>> {
  //   return this.post<string>('/psv_get_vendordealer_roster', request);
  // }

  /**
   * Get dealer roster (alias for getDealerListByVendor)
   */
  // getDealerRoster(vendorId: string): Observable<ApiResponse<any[]>> {
  //   return this.getDealerListByVendor(vendorId);
  // }

  /**
   * Date Filter Dashboard APIs
   */

  /**
   * Get date filter dashboard counts
   */
  getDateFilterDashboardCount(fromDate: string, toDate: string): Observable<ApiResponse<DashboardCounts>> {
    return this.post<DashboardCounts>('/psv_get_date_filter_state_dashboard_count', {
      param1: fromDate,
      param2: toDate
    });
  }

  /**
   * Get date filter company wise device counts
   */
  getDateFilterCompanyWiseDeviceCount(
    searchText: string = '',
    pageNumber: string = '1',
    pageSize: string = '20',
    type: string = 'details', // 'details' or 'summary'
    fromDate: string = '',
    toDate: string = ''
  ): Observable<ApiResponse<CompanyWiseDeviceResponse>> {
    return this.post<CompanyWiseDeviceResponse>('/psv_get_date_filter_company_wise_device_counts', {
      param1: searchText,
      param2: pageNumber,
      param3: pageSize,
      param4: type,
      param5: fromDate,
      param6: toDate
    });
  }

  /**
   * Get date filter RTO wise device count
   */
  getDateFilterRTOWiseDeviceCount(
    searchText: string = '',
    pageNumber: string = '1',
    pageSize: string = '20',
    type: string = 'details', // 'details' or 'summary'
    fromDate: string = '',
    toDate: string = ''
  ): Observable<ApiResponse<RTOWiseDeviceResponse>> {
    return this.post<RTOWiseDeviceResponse>('/psv_get_date_filter_rto_wise_device_count_api', {
      param1: searchText,
      param2: pageNumber,
      param3: pageSize,
      param4: type,
      param5: fromDate,
      param6: toDate
    });
  }
sendMultipleCommand(
  imeino: string,
  devicecommand: string
): Observable<ApiResponse<any>> {
  return this.post<any>('/psv_sendMultipleCommandSendNew', {
    imeino: imeino,          // ✅ comma separated IMEI
    devicecommand: devicecommand    // ✅ command
  });
}
  /**
   * Get date filter classwise alerts
   */
  getDateFilterClasswiseAlerts(
    searchType: string = '',
    fromDate: string = '',
    toDate: string = ''
  ): Observable<ApiResponse<{ listData: any[] }>> {
    return this.post<{ listData: any[] }>('/psv_get_date_filter_class_wise_alerts', {
      param1: '',
      param2: 'NA',
      param3: 'NA',
      param4: fromDate,
      param5: toDate,
      param6: searchType
    });
  }

  updateSimValidity(request: any): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_edit_sim_validity', request);
  }
  getLiveEmergencyDetails(
  searchBy: string = '',
  pageNo: string = '1',
  itemPerPage: string = '10',
  imei: string = ''
) {
  return this.post('/psv_liveemergencydetails', {
    param1: searchBy,     // search by
    param2: pageNo,       // page no
    param3: itemPerPage,  // items per page
    param4: imei          // imei filter
  });
}

commonFileDownload(printfilePath: string) {
    let lastindex = printfilePath.lastIndexOf("/");
    let fileName = printfilePath.substring(lastindex + 1, printfilePath.length)
    saveAs(printfilePath, fileName);
}

getLoginDashboardCount(): Observable<ApiResponse<DashboardCounts>> {
  return this.post<DashboardCounts>('/logindashcount', { "pagename":"Login Dashboard"});
}

getRolewiseActiveSessionCount(): Observable<ApiResponse<DashboardCounts>> {
  return this.post<DashboardCounts>('/rolewiseactivesessioncount', { "pagename":"Login Dashboard"});
}

getActiveSessionDetails(request: CommonDetailsReq): Observable<ApiResponse<ActiveSessionDetailsResponse>> { 
  return this.post('/activesessiondetails', request);
}
postupdateloginstatus(
  request: CommonDetailsReq
): Observable<ApiResponse<ActiveSessionDetailsResponse>> {

  return this.post('/updateloginstatus', request);

}
}
