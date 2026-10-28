import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse, BaseApiService } from './base-api.service';
import { APIName } from '../model/apiname.model';
import { AcademicSession, Holiday, HolidayFilter, HolidaySummary, ImportSummary, LookupOption, WeekendConfig } from '../../features/schoolManagement/hodilday/models/holiday.model';

/**
 * All REST/API interaction for the Holiday Calendar Master module lives here.
 * Keeping API calls isolated from the component keeps UI/business logic testable
 * and satisfies the Single Responsibility Principle.
 */
@Injectable({
  providedIn: 'root'
})
export class HolidayCalendarService extends BaseApiService {

  /** Paginated / filtered holiday list. */
  getHolidayList(filter: HolidayFilter, pageNo: number, pageSize: number): Observable<ApiResponse<{ listData: Holiday[]; param1: number }>> {
    const request = { ...filter, pageNo, pageSize };
    return this.apiCall(APIName.psv_get_holiday_list, 'POST', request);
  }

  getHolidayById(holidayId: string): Observable<ApiResponse<Holiday>> {
    return this.apiCall(APIName.psv_get_holiday_details, 'POST', { holidayId });
  }

  createHoliday(payload: Holiday): Observable<ApiResponse<Holiday>> {
    return this.apiCall(APIName.psv_insert_holiday, 'POST', payload);
  }

  updateHoliday(payload: Holiday): Observable<ApiResponse<Holiday>> {
    return this.apiCall(APIName.psv_update_holiday, 'POST', payload);
  }

  deleteHoliday(holidayId: string): Observable<ApiResponse<null>> {
    return this.apiCall(APIName.psv_delete_holiday, 'POST', { holidayId });
  }

  updateHolidayStatus(holidayId: string, status: string): Observable<ApiResponse<null>> {
    return this.apiCall(APIName.psv_update_holiday_status, 'POST', { holidayId, status });
  }

  getHolidaySummary(academicSessionId: string): Observable<ApiResponse<HolidaySummary>> {
    return this.apiCall(APIName.psv_get_holiday_summary, 'POST', { academicSessionId });
  }

  getAcademicSessions(): Observable<ApiResponse<AcademicSession[]>> {
    return this.apiCall(APIName.psv_get_academicsession_roster, 'POST', {});
  }

  getSchoolRoster(): Observable<ApiResponse<LookupOption[]>> {
    return this.apiCall(APIName.psv_get_school_roster_holiday, 'POST', {});
  }

  getWeekendConfig(academicSessionId: string): Observable<ApiResponse<WeekendConfig>> {
    return this.apiCall(APIName.psv_get_weekend_config, 'POST', { academicSessionId });
  }

  saveWeekendConfig(academicSessionId: string, config: WeekendConfig): Observable<ApiResponse<null>> {
    return this.apiCall(APIName.psv_put_weekend_config, 'POST', { academicSessionId, ...config });
  }

  bulkImportHolidays(formData: FormData): Observable<ApiResponse<ImportSummary>> {
    return this.postFile<ImportSummary>(APIName.psv_bulk_import_holiday, formData);
  }

  /** Backend generates the file and returns a downloadable file path in `entity`. */
  exportHolidays(filter: HolidayFilter, format: 'excel' | 'pdf'): Observable<ApiResponse<string>> {
    return this.apiCall(APIName.psv_export_holiday, 'POST', { ...filter, format });
  }
}
