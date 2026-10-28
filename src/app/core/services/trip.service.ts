import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiResponse, BaseApiService } from './base-api.service';
import { Observable } from 'rxjs';
import { DeleteTripReq, TripDetailsReq, TripMasterFormReq, VehicleAssignToTripFormReq, VehicleAssignToTripReq, VehicleUnassignToTripResp } from '../model/request.model';
import { POI } from './poi.service';

@Injectable({
  providedIn: 'root'
})
export class TripService  extends BaseApiService {
  protected override http = inject(HttpClient);
  insertTrip(request: TripMasterFormReq): Observable<ApiResponse<any>> {
      return this.post<any>('/psv_put_trip', request);
  }
  updateTrip(request: TripMasterFormReq): Observable<ApiResponse<any>> {
      return this.post<any>('/psv_edit_trip', request);
  }
  tripDetails(request: TripDetailsReq): Observable<ApiResponse<any>> {
      return this.post<any>('/psv_get_tripdetails', request);
  }
    deleteTrip(request: DeleteTripReq): Observable<ApiResponse<any>> {
        return this.post<any>('/psv_remove_trip', request);
    }
    getPOIRoster(): Observable<ApiResponse<POI[]>> {
        return this.post<POI[]>('/psv_get_poi_roster', {});
    }
    getTripList(request: TripMasterFormReq): Observable<ApiResponse<any>> {
        return this.post<any>('/psv_get_triplist', request);
    }
    vehicleAssignToTrip(request: VehicleAssignToTripFormReq): Observable<ApiResponse<any>> {
        return this.post<any>('/psv_get_vehicle_assign_to_trip', request);
    }
    vehicleAssignToTripDetails(request: VehicleAssignToTripReq): Observable<ApiResponse<any>> {
        return this.post<any>('/psv_get_vehicle_trip_assign_details', request);
    }
    unassignVehicleFromTrip(request: VehicleUnassignToTripResp): Observable<ApiResponse<any>> {
        return this.post<any>('/psv_get_vehicle_unassign_to_trip', request);
    }

}
