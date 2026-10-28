import { Injectable } from '@angular/core';

/**
 * Service to map backend menu routes to Angular routes
 * This handles the conversion from JSP-style routes (#!/RouteName/) to Angular routes
 */
@Injectable({
  providedIn: 'root'
})
export class RouteMappingService {
  
  /**
   * Comprehensive route mapping from backend format to Angular routes
   * Backend sends routes like: #!/VendorEntry/, #!/DeviceDetails/123/, etc.
   */
  private routeMap: { [key: string]: string } = {
    // Dashboard
    'dashboard': '/dashboard',
    'admin': '/dashboard',
    'newdatefilterdashboard': '/NewDateFilterDashboard',
    'datefilterdashboard': '/NewDateFilterDashboard',
    
    // Vendor
    'vendorentry': '/vendor/entry',
    'vendordetails': '/vendor',
    'vendor': '/vendor',
    
    // Dealer
    'dealerentry': '/dealer/entry',
    'dealerdetails': '/dealer',
    'dealer': '/dealer',
    
    // RTO
    'rtoentry': '/rto/entry',
    'rtodetails': '/rto',
    'rto': '/rto',
    
    // Device
    'deviceentry': '/device/entry',
    'devicedetails': '/device',
    'device': '/device',
    'dashboarddevicedetails': '/device',
    'activateddevices': '/device',
    'newdevicecount': '/device/newdevicecount',
    'deviceactivationdetails': '/device',
    'dimtsolddeviceactivation': '/device',
    
    // Vehicle
    'vehicledetails': '/vehicle',
    'vehicle': '/vehicle',
    'vehicleinstallationactivation': '/vehicle/installation-activation',
    'updatevehicledetails': '/vehicle/update',
    
    // Asset Status
    'assetsatus': '/assetstatus',
    'assetstatus': '/assetstatus',
    'assetsdetails': '/assetstatus',
    
    // Alert
    'alert': '/alert',
    'todayalert': '/alert',
    'dashemergencyalertdetails': '/alert',
    'sosalert': '/alert/sos',
    'panicalertnotify': '/alert/panic',
    'alertnotify': '/alert/notify',
    'alertmanagment': '/alert/management',
    'alertframe': '/alert/frame',
    
    // Vahan
    'vahaninstallation': '/vahaninstallation',
    'vahan-installation': '/vahaninstallation',
    'vahanuploadsuccess': '/VahanUploadSuccess',
    'vahansuccess': '/VahanUploadSuccess',
    'vahan-success': '/VahanUploadSuccess',
    'vahanuploadpending': '/VahanUploadPending',
    'vahanpending': '/VahanUploadPending',
    'vahan-pending': '/VahanUploadPending',
    
    // Map Tracking
    'mapviewall': '/mapViewAll',
    'maptracking': '/mapViewAll',
    'map-tracking': '/mapViewAll',
    'maptrackingnew': '/maptrackingnew',
    'map-tracking-new': '/maptrackingnew',
    
    // User Management
    'userentry': '/user/entry',
    'userdetails': '/user',
    'user': '/user',
    'vendorusercreation': '/vendor/user-creation',
    'vendoruserdetails': '/vendor/user-details',
    'activeusers': '/user/active',
    
    // Role Management
    'roleentry': '/role/entry',
    'roledetails': '/role',
    'role': '/role',
    
    // Model Management
    'modelentry': '/model/entry',
    'modeldetails': '/model',
    'model': '/model',
    'modelapproval': '/model/approval',
    
    // POI Management
    'poientry': '/poi/entry',
    'poidetails': '/poi',
    'poi': '/poi',
    'poivehiclemap': '/poi/vehicle-map',
    
    // Route Management
    'routepoimap': '/route/poi-map',
    'routevehiclemap': '/route/vehicle-map',
    'route': '/route',
    
    // Vehicle Group
    'vehiclegroupentry': '/vehicle-group/entry',
    'vehiclegroupmapping': '/vehicle-group/mapping',
    'vehiclegroupmappingdetails': '/vehicle-group/mapping-details',
    'vehiclegroup': '/vehicle-group',
    
    // Device Operations
    'devicebulkuploadlog': '/device/bulk-upload-log',
    'deviceassigntodealer': '/device/assign-dealer',
    'unassigndevicefromdealer': '/device/unassign-dealer',
    'deviceconnection': '/device/connection',
    'devicehealth': '/device/health',
    'devicehealthcheckacknowledge': '/device/health-acknowledge',
    'devicelogin': '/device/login',
    
    // Vehicle Operations
    'updatedevicedetails': '/device/update',
    'updatedealerdetails': '/dealer/update',
    'updatecustomerdetails': '/customer/update',
    'updatesimvalidity': '/sim/update-validity',
    'changedevice': '/device/change',
    'changedealer': '/dealer/change',
    
    // Bulk Operations
    'bulkactivation': '/bulk-activation',
    'bulkactivationlogs': '/bulk-activation/logs',
    'bulkdeviceentry': '/device/bulk-entry',
    
    // Reports
    'reports': '/reports',
    'overspeedreport': '/reports/overspeed',
    'distancetravelledreport': '/reports/distance-travelled',
    'alertactivityreport': '/reports/alert-activity',
    'alertoverview': '/reports/alert-overview',
    'alertanalysis': '/reports/alert-analysis',
    'activitylogreport': '/reports/activity-log',
    'pvtparseddata': '/reports/parsed-data',
    'rawdata': '/reports/raw-data',
    'emergencyrawdata': '/reports/emergency-raw-data',
    
    // Configuration
    'configure': '/configure',
    'configuredetails': '/configure/details',
    'sendhealthstatus': '/configure/send-health-status',
    'pushcommand': '/configure/push-command',
    'commandentry': '/command/entry',
    'commanddetails': '/command',
    
    // Geofence
    'geofenceentryexit': '/geofence/entry-exit',
    'geofence_entry_exit': '/geofence/entry-exit',
    
    // Firmware
    'firmwareupload': '/firmware/upload',
    'firmware_upload': '/firmware/upload',
    
    // Receipt & Status
    'receiptgenerateddevices': '/receipt/generated-devices',
    'receipt_generated_devices': '/receipt/generated-devices',
    'inactiveassets': '/assets/inactive',
    'inactive_assets': '/assets/inactive',
    'currentdayinstallation': '/installation/current-day',
    'currentday_installation': '/installation/current-day',
    
    // Login & Authentication
    'forgotpasswordscreen': '/forgot-password',
    'forgotpassword': '/forgot-password',
    'resetpassword': '/reset-password',
    'reset_password': '/reset-password',
    'loginstatus': '/auth/login-status',
    'logingeneration': '/auth/login-generation',
    'logincreation': '/auth/login-generation',
    'customerdetails': '/customer/details',
    
    // Admin Pages
    'admindashboard': '/admin/dashboard',
    'admindevicedetails': '/admin/device',
    'adminalertsdetails': '/admin/alerts'
  };

  /**
   * Convert backend route format to Angular route
   * Handles formats like:
   * - #!/VendorEntry/
   * - #!/DeviceDetails/123/
   * - VendorEntry
   * - vendor-entry
   */
  mapBackendRouteToAngular(backendRoute: string): string {
    if (!backendRoute || backendRoute === '0' || backendRoute === 'routeCreate()') {
      return '';
    }

    // Remove #! prefix if present (handle both #! and #)
    let cleanRoute = String(backendRoute).trim();
    
    // Handle #!/RouteName format - check for #!/ first (3 chars)
    if (cleanRoute.startsWith('#!/')) {
      cleanRoute = cleanRoute.substring(3); // Remove #!/
    } else if (cleanRoute.startsWith('#!')) {
      cleanRoute = cleanRoute.substring(2); // Remove #!
    } else if (cleanRoute.startsWith('#')) {
      cleanRoute = cleanRoute.substring(1); // Remove #
    }
    
    // Trim again after removing prefix
    cleanRoute = cleanRoute.trim();

    // Extract route name (before first slash, but handle case where there's no slash)
    if (cleanRoute.includes('/')) {
      const parts = cleanRoute.split('/').filter(p => p && p.trim() !== '');
      cleanRoute = parts[0] || cleanRoute;
    }

    // Remove trailing slash
    cleanRoute = cleanRoute.replace(/\/+$/, '').trim();

    // If route is empty after cleaning, return empty
    if (!cleanRoute) {
      console.warn('Route is empty after cleaning. Original route:', backendRoute);
      return '';
    }

    // Convert to lowercase for mapping
    const lowerRoute = cleanRoute.toLowerCase();

    // Check if route exists in mapping
    if (this.routeMap[lowerRoute]) {
      return this.routeMap[lowerRoute];
    }

    // Try kebab-case conversion (e.g., VendorEntry -> vendor-entry)
    const kebabCase = this.toKebabCase(cleanRoute);
    if (this.routeMap[kebabCase]) {
      return this.routeMap[kebabCase];
    }

    // Default: convert to lowercase route
    // Only log warning if it's not a valid route (not just a default fallback)
    if (lowerRoute && lowerRoute.length > 0) {
      // console.warn('Route not found in mapping. Original:', backendRoute, '| Clean:', cleanRoute, '| Lower:', lowerRoute, '| Will use:', '/' + lowerRoute);
    }

    return '/' + lowerRoute;
  }

  /**
   * Convert PascalCase or camelCase to kebab-case
   * Example: VendorEntry -> vendor-entry
   */
  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase();
  }

  /**
   * Extract route parameters from backend route
   * Example: #!/DeviceDetails/123/ -> { id: '123' }
   */
  extractRouteParams(backendRoute: string): { [key: string]: string } {
    const params: { [key: string]: string } = {};
    
    if (!backendRoute || !backendRoute.includes('/')) {
      return params;
    }

    // Remove #! prefix
    let cleanRoute = backendRoute.replace(/^#!/, '').replace(/^#/, '');
    
    // Split by /
    const parts = cleanRoute.split('/').filter(p => p);
    
    if (parts.length > 1) {
      // First part is route name, rest are parameters
      // For now, use generic 'id' parameter
      // Can be enhanced based on specific route patterns
      params['id'] = parts[1];
    }

    return params;
  }

  /**
   * Build Angular route with parameters
   */
  buildAngularRoute(backendRoute: string): string {
    const baseRoute = this.mapBackendRouteToAngular(backendRoute);
    const params = this.extractRouteParams(backendRoute);
    
    if (Object.keys(params).length === 0) {
      return baseRoute;
    }

    // For routes with parameters, append them
    // Note: This is a simple implementation. For complex routing,
    // you may need to use Angular Router's navigate() with queryParams
    const paramString = Object.values(params).join('/');
    return `${baseRoute}/${paramString}`;
  }

  /**
   * Check if a route exists in the mapping
   */
  hasRoute(backendRoute: string): boolean {
    const route = this.mapBackendRouteToAngular(backendRoute);
    return route !== '' && route !== '/' + backendRoute.toLowerCase();
  }

  /**
   * Get all available routes (for debugging)
   */
  getAllRoutes(): { [key: string]: string } {
    return { ...this.routeMap };
  }
}