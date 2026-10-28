import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, ApiResponse } from './base-api.service';

export interface Route {
  param1: number | string;  // rowNumber
  param2: string;  // routeId
  param3: string;  // routeName
  param4?: string; // additional data
  param5: string;  // coordinates/geometry (JSON string)
  param6?: string; // additional data
  param7?: string; // additional data
  param8?: string; // additional data
  param9?: string; // additional data
  param10?: string; // additional filter
  param11: string; // speed (km/hr)
  param12?: string;
  param13?: string; // source POI id/name depending on API response
  param14?: string; // destination POI id/name depending on API response
}

export interface RouteListResponse {
  listData: Route[];
  param1: number; // totalCount
}

export interface DistrictListResponse {
  "param1"?: string;// rtoid
  "param2"?: string;// rtoname
  "param3"?: string;// rtocode
  "param4"?: string;
  "param5"?: string;
}

export interface RouteRequest {
  param1?: string;  // Search text
  param2?: string;  // Page number
  param3?: string;  // Page size
  param5?: string;  // Route ID

}

export interface RouteEntryRequest {
  routeid: string;
  routename: string;
  routetype: string;
  coord: string;
  description: string;
  stylecolor: string;
  sourcepoiid: string;
  destinationpoiid: string;
  vehiclespeed: string;
}

export interface RouteUpdateRequest {
  routeid: string;
  routename: string;
  routetype: string;
  coord: string;
  description: string;
  stylecolor: string;
  sourcepoiid: string;
  destinationpoiid: string;
  vehiclespeed: string;
  remarks?: string;
}

export interface RoutePOIMapping {
  param1: number | string;  // rowNumber
  param2: string;  // poiId
  param3: string;  // routeId
  param4?: string; // additional data
  param5?: string; // additional data
  param6: string;  // poiName
  param7: string;  // routeName
}

export interface StudentPOIMapping {
  studentid: string;
  poiid: string;
  remarks: string;
  pagename: string;
  rowNumber?: number | string;
  param1?: number | string;
  param2?: string;
  param3?: string;
  param4?: string;
  param5?: string;
  param6?: string;
  studentname?: string;
  poiname?: string;
}

export interface RoutePOIListResponse {
  listData: RoutePOIMapping[];
  param1: number; // totalCount
}

export interface RoutePOIRequest {
  param5?: string;  // Search text
  param8?: string;  // Page number
  param9?: string;  // Page size
}

export interface StudentPOIRequest {
  param1?: string;  // searchby
  param2: string;  // pageno
  param3: string;  // itemperpage
  param4: string;  // schoolid
  param5: string;  // studentid
  param6: string;  // poiid

}

@Injectable({
  providedIn: 'root'
})
export class RouteService extends BaseApiService {

  /**
   * Get route roster (dropdown list)
   */
  getRouteRoster(): Observable<ApiResponse<Route[]>> {
    return this.post<Route[]>('/psv_get_route_roster', {});
  }

  getStudentList(): Observable<ApiResponse<Route[]>> {
    return this.post<Route[]>('/psv_studentlist', {});
  }
  /**
   * Get route details (list)
   */
  getRouteDetails(request: RouteRequest): Observable<ApiResponse<RouteListResponse>> {
    return this.post<RouteListResponse>('/psv_get_details', {
      param1: request.param1 || '',  // search text
      param5: request.param5 || '',  // routeid
      param8: request.param2 || '1', // page number
      param9: request.param3 || '20', // page size
      param10: '',  // additional filter
      param11: ''   // additional filter
    });
  }

  /**
  * Get district list (list)
  */
  getDistrictList(request: any): Observable<ApiResponse<DistrictListResponse>> {
    return this.post<DistrictListResponse>('/psv_get_district_roster', {
      param1: request.param1 || '',  // rtoid
      param2: request.param2 || '', // rtoname
      param3: request.param3 || '', // rtocode
      param4: '',  // additional filter
      param5: ''   // additional filter
    });
  }

  /**
   * Create new route
   */
  putRoute(routeData: RouteEntryRequest): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_put_route', routeData);
  }

  /**
   * Update route
   */
  editRoute(routeData: RouteUpdateRequest): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_edit_route', routeData);
  }

  /**
   * Delete route
   */
  deleteRoute(routeId: string, remark: string): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_remove_route', {
      routeid: routeId,
      remarks: remark
    });
  }

  /**
   * Get route POI mapping details (assigned routes to POIs)
   */
  getRoutePOIUnassignDetails(request: RoutePOIRequest): Observable<ApiResponse<RoutePOIListResponse>> {
    return this.post<RoutePOIListResponse>('/psv_get_assignroutetopoidetails', {
      param1: request.param5 || '',
      param2: request.param8 || '1',
      param3: request.param9 || '20'
    });
  }

  /**
   * Get route POI mapping details (assigned routes to POIs)
   */
  getStudentPOIUnassignDetails(request: StudentPOIRequest): Observable<ApiResponse<RoutePOIListResponse>> {
    return this.post<RoutePOIListResponse>('/studentpoidetails', {
      param1: request.param1 || '',
      param2: request.param2 || '1',
      param3: request.param3 || '20',
      param4: request.param4 || '',
      param5: request.param5 || '',
      param6: request.param6 || ''
    });
  }

  /**
   * Assign route to POI
   */
  assignRouteToPOI(routeId: string, poiId: string): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_get_assignroutetopoi', {
      param1: routeId,
      param2: poiId
    });
  }

  /**
   * Unassign route from POI
   */
  unassignRouteFromPOI(routeId: string, poiId: string, remark: string): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_get_unassignroutetopoi', {
      param1: routeId,
      param2: poiId,
      param4: remark
    });
  }

  unassignStudentFromPOI(studentId: string, poiId: string, remark: string): Observable<ApiResponse<string>> {
    return this.post<string>('/unassignpoitostudent', {
      studentid: studentId || '',
      poiid: poiId || '',
      remarks: remark,
      pagename: ''
    });
  }

  /**
  * Assign route to POI
  */
  assignPOIToStudent(studentId: string, poiId: string): Observable<ApiResponse<string>> {
    return this.post<string>('/assignpoitostudent', {
      studentid: studentId,
      poiid: poiId,
      remarks: '',
      pagename: ''
    });
  }

  /**
   * Get route vehicle mapping details
   */
  getRouteVehicleMappingDetails(request: any): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_get_vehiclerouteassigndetails', request);
  }

  /**
   * Assign route to vehicle
   */
  assignRouteToVehicle(payload: any): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_put_assign_route_to_vehicle', payload);
  }

  /**
   * Unassign route from vehicle
   */
  unassignRouteFromVehicle(payload: any): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_put_unassign_route_to_vehicle', payload);
  }

  getRTORLIST(request: {}): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_get_rto_roster', request);
  }

  getVehicleLIST(id: any, roleId: any): Observable<ApiResponse<any>> {
    const queryParams = `id=${encodeURIComponent(id || '')}&roleId=${encodeURIComponent(roleId || '')}`;
    return this.post<any>(`/psv_get_getvehicle_roster?${queryParams}`, {});
  }
}
