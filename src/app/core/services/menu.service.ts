import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, ApiResponse } from './base-api.service';

export interface MenuItem {
  param1: string; // menuId
  param2: string; // menuName
  param3: string; // order
  param4: string; // route (empty if has submenu)
  param5: string; // roleFilter
  param6: string; // hasSubmenu ('0' = no submenu, other = has submenu)
}

export interface SubMenuItem {
  param1: string; // subMenuId
  param2: string; // subMenuName
  param3: string; // parentId (menuId)
  param4: string; // route
  param6: string; // parentId (menuId) - same as param3
}

@Injectable({
  providedIn: 'root'
})
export class MenuService extends BaseApiService {

  /**
   * Get home menu list
   */
  getHomeMenuList(): Observable<ApiResponse<MenuItem[]>> {
    return this.post<MenuItem[]>('/psv_get_homemenu_list', {});
  }

  /**
   * Get home submenu list
   */
  getHomeSubMenuList(): Observable<ApiResponse<SubMenuItem[]>> {
    return this.post<SubMenuItem[]>('/psv_get_homesubmenu_list', {});
  }
}
