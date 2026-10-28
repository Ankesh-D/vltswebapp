import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse, BaseApiService } from './base-api.service';
import {
  SchoolTripMasterDeleteReq,
  SchoolTripMasterDetailsReq,
  SchoolTripMasterFormReq
} from '../model/request.model';

/**
 * Handles all CRUD/API communication for the School Trip Master module.
 * Map/route logic is intentionally kept out of this service - see SchoolmapboxService.
 */
@Injectable({
  providedIn: 'root'
})
export class SchoolTripService extends BaseApiService {

  getTripDetails(request: SchoolTripMasterDetailsReq): Observable<ApiResponse> {
    return this.post<ApiResponse>('/psv_get_schooltripdetails', request);
  }
  insertTripDetails(request: SchoolTripMasterFormReq): Observable<ApiResponse> {
    return this.post<ApiResponse>('/psv_insert_schooltripmaster', request);
  }
  updateTripDetails(request: SchoolTripMasterFormReq): Observable<ApiResponse> {
    return this.post<ApiResponse>('/psv_update_schooltripmaster', request);
  }
  deleteTripDetails(request: SchoolTripMasterDeleteReq): Observable<ApiResponse> {
    return this.post<ApiResponse>('/psv_delete_schooltripmaster', request);
  }
  /** Duplicate/Copy an existing trip as a new draft trip (server assigns a new tripid). */
  copyTripDetails(request: SchoolTripMasterFormReq): Observable<ApiResponse> {
    return this.post<ApiResponse>('/psv_copy_schooltripmaster', request);
  }
  /** Activate / Deactivate a trip - request.status carries the target status. */
  changeTripStatus(request: SchoolTripMasterFormReq): Observable<ApiResponse> {
    return this.post<ApiResponse>('/psv_update_schooltripmaster', request);
  }
}
