import { importProvidersFrom } from "@angular/core";
import { Routes } from "@angular/router";
import { NgxDaterangepickerMd } from "ngx-daterangepicker-material";
import { authGuard, authChildGuard } from "./core/guards/auth.guard";
import { retryChunkImport } from "./core/utils/chunk-retry";
export const routes: Routes = [
  // login and public routes
 {
  path: "login",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/auth/login/login.component").then(
          (m) => m.LoginComponent
        ),
      "login.component"
    ),
},
// {
//   path: "univarsalpage",
//   loadComponent: () =>
//     retryChunkImport(
//       () =>
//         import("./features/univarsal-page/univarsal-page/univarsal-page.component").then(
//           (m) => m.UnivarsalPageComponent
//         ),
//       "univarsal-page.component"
//     ),
//     ),
// },
  // {
  //   path: "forceactivationreport",
  //   loadComponent: () =>
  //     retryChunkImport(
  //       () =>
  //         import("./features/report/forceactivationreport/forceactivationreport.component").then(
  //           (m) => m.ForceactivationreportComponent
  //         ),
  //       "forceactivationreport.component"
  //     ),
  // },
  // {
  //   path: "dealerdashboard",
  //   loadComponent: () =>
  //     retryChunkImport(
  //       () =>
  //         import("./features/dashboard/delear-dashboard/delear-dashboard.component").then(
  //           (m) => m.DealerDashboardComponent
  //         ),
  //       "dealerdashboard.component"
  //     ),
  // },
  // {
  //   path: "logindashboard",
  //   loadComponent: () =>
  //     retryChunkImport(
  //       () =>
  //         import("./features/dashboard/login-dashboard/login-dashboard.component").then(
  //           (m) => m.LoginDashboardComponent
  //         ),
  //       "logindashboard.component"
  //     ),
  // },
  // {
  //   path: "overspeedreport",
  //   loadComponent: () =>
  //     retryChunkImport(
  //       () =>
  //         import("./features/report/vehiclewiseoverspeedreport/vehiclewiseoverspeedreport.component").then(
  //           (m) => m.VehiclewiseoverspeedreportComponent
  //         ),
  //       "overspeedreport.component"
  //     ),
  // },
  
  // {
  //     path: 'RawData',
  //     loadComponent: () => import('./features/operation/raw-data/raw-data.component').then(m => m.RawDataComponent),
  //     providers: [importProvidersFrom(NgxDaterangepickerMd.forRoot())]
  //   },
  // {
  //   path: "newrawdata",
  //   loadComponent: () =>
  //     import("./features/operation/new-raw-data/new-raw-data.component").then(
  //       (m) => m.NewRawDataComponent,
  //     ),
  // },

  {
    path: "faq",
    loadComponent: () =>
      retryChunkImport(
        () =>
          import("./features/auth/faq/faq.component").then(
            (m) => m.FaqComponent
          ),
        "faq.component"
      ),
  },
  {
    path: "vendorwisefaultydevicescountcomponent",
    loadComponent: () =>
      retryChunkImport(
        () =>
          import("./features/report/vendorwise-faulty-devices-count/vendorwise-faulty-devices-count.component").then(
            (m) => m.VendorwiseFaultyDevicesCountComponent
          ),
        "vendorwisefaultydevicescountcomponent"
      ),
  },

  {
  path: "",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/auth/homepage/homepage.component").then(
          (m) => m.HomepageComponent,
        ),
      "homepage",
    ),
},
{
  path: "forgotpassword",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/auth/forgot-password/forgot-password.component").then(
          (m) => m.ForgotPasswordComponent,
        ),
      "forgotpassword",
    ),
},
{
  path: "restalert",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/alert/rest-alert/rest-alert.component").then(
          (m) => m.RestAlertComponent,
        ),
      "restalert",
    ),
},
{
  path: "schoolmaster",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/schoolManagement/school-master/school-master.component").then(
          (m) => m.SchoolMasterComponent,
        ),
      "schoolmaster",
    ),
},
{
  path: "studentmaster",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/schoolManagement/student-master/student-master.component").then(
          (m) => m.StudentMasterComponent,
        ),
      "studentmaster",
    ),
},
{
  path: "shiftmaster",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/schoolManagement/shift-master/shift-master.component").then(
          (m) => m.ShiftMasterComponent,
        ),
      "shiftmaster",
    ),
},
  {
  path: "drivermaster",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/schoolManagement/driver-master/driver-master.component").then(
          (m) => m.DriverMasterComponent,
        ),
      "drivermaster",
    ),
},
{
  path: "drivermasterentry",
  redirectTo: "drivermaster",
  pathMatch: "full",
},
{
  path: "schooltripmaster",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/schoolManagement/school-trip-master/school-trip-master.component").then(
          (m) => m.SchoolTripMasterComponent,
        ),
      "schooltripmaster",
    ),
},
{
  path: "holidaycalendarmaster",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/schoolManagement/hodilday/hodilday.component").then(
          (m) => m.HolidayCalendarMasterComponent,
        ),
      "holidaycalendarmaster",
    ),
},








  // {
  //   path: 'healthcheck',
  //   loadComponent: () => import('./features/deviceChecks/health-check/health-check.component').then(m => m.HealthCheckComponent)
  // },

  // {
  //   path: 'renewaldata',
  //   loadComponent: () => import('./features/device/renewad-details/renewad-details.component').then(m => m.RenewadDetailsComponent)
  // },




  // {
  //     path: 'reset-password',
  //     loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
  //     // canActivate: [authGuard]
  //   },

  //  {path: 'otp-generater',
  //    loadComponent: () => import('./features/receipt/otp-genration/otp-genration.component').then(m => m.OtpGenrationComponent)},

  // protected routes
{
  path: "",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./shared/layout/main-layout/main-layout.component").then(
          (m) => m.MainLayoutComponent,
        ),
      "main-layout",
    ),
  canActivate: [authGuard],
  canActivateChild: [authChildGuard],
  children: [
    // dashboard routes
    {
      path: "",
      redirectTo: "AdminDashboard",
      pathMatch: "full",
    },
    {
      path: "VehicleClassWiseInstallationReport",
      loadComponent: () =>
        retryChunkImport(
          () =>
            import("./features/report/vehicle-class-wise-installation-report/vehicle-class-wise-installation-report.component").then(
              (m) => m.VehicleClassWiseInstallationReportComponent,
            ),
          "VehicleClassWiseInstallationReport",
        ),
    },
    {
      path: "vehicle-make-model",
      loadComponent: () =>
        retryChunkImport(
          () =>
            import("./features/vehicle/vehicle-make-model-add/vehicle-make-model-add.component").then(
              (m) => m.VehicleMakeModelAddComponent,
            ),
          "vehicle-make-model",
        ),
    },
    {
      path: "sim-validity-update",
      loadComponent: () =>
        retryChunkImport(
          () =>
            import("./features/receipt/sim-validity-update/sim-validity-update.component").then(
              (m) => m.SimValidityUpdateComponent,
            ),
          "sim-validity-update",
        ),
    },
    {
      path: "otp-generater",
      loadComponent: () =>
        retryChunkImport(
          () =>
            import("./features/receipt/otp-genration/otp-genration.component").then(
              (m) => m.OtpGenrationComponent,
            ),
          "otp-generater",
        ),
    },
    {
      path: "transfervehicle",
      loadComponent: () =>
        retryChunkImport(
          () =>
            import("./features/vehicle/transfervehicle/transfervehicle.component").then(
              (m) => m.TransfervehicleComponent,
            ),
          "transfervehicle",
        ),
    },
    {
      path: "AdminDashboard",
      loadComponent: () =>
        retryChunkImport(
          () =>
            import("./features/dashboard/dashboard.component").then(
              (m) => m.DashboardComponent,
            ),
          "AdminDashboard",
        ),
    },
 {
  path: "untagvehicle",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/vehicle/untag-vehicle-new/untag-vehicle-new.component").then(
          (m) => m.UntagVehicleNewComponent,
        ),
      "untagvehicle",
    ),
},

// Commented-out duplicate routes unchanged

{
  path: "ActivatedDevices",
  redirectTo: "ActivatedDevices/TotalDevice/0/0",
  pathMatch: "full",
},
{
  path: "queryoperation",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/report/quryopration/quryopration.component").then(
          (m) => m.QuryoprationComponent,
        ),
      "queryoperation",
    ),
},
{
  path: "ActivatedDevices/:filter/:vendor/:rto",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/dashboard/activated-devices-for-home-dashboard/activated-devices-for-home-dashboard.component").then(
          (m) => m.ActivatedDevicesForHomeDashboardComponent,
        ),
      "ActivatedDevices",
    ),
},
{
  path: "NewDateFilterDashboard",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/dashboard/new-date-filter-dashboard/new-date-filter-dashboard.component").then(
          (m) => m.NewDateFilterDashboardComponent,
        ),
      "NewDateFilterDashboard",
    ),
},
{
  path: "NewDateFilterDashboard/:url",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/dashboard/new-date-filter-dashboard/new-date-filter-dashboard.component").then(
          (m) => m.NewDateFilterDashboardComponent,
        ),
      "NewDateFilterDashboard-url",
    ),
},
{
  path: "newdatefilterdashboard",
  redirectTo: "NewDateFilterDashboard",
  pathMatch: "full",
},
{
  path: "new-date-filter-dashboard",
  redirectTo: "NewDateFilterDashboard",
  pathMatch: "full",
},
{
  path: "datefilterdashboard",
  redirectTo: "NewDateFilterDashboard",
  pathMatch: "full",
},
{
  path: "datefilter-dashboard",
  redirectTo: "NewDateFilterDashboard",
  pathMatch: "full",
},
{
  path: "rtodashboard",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/RTOPages/rtodashboard/rtodashboard.component").then(
          (m) => m.RTODashboardComponent,
        ),
      "rtodashboard",
    ),
},
{
  path: "VendorDashboard",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/dashboard/vendor-dashboard/vendor-dashboard.component").then(
          (m) => m.VendorDashboardComponent,
        ),
      "VendorDashboard",
    ),
},
      // masters routes
   {
  path: "rtouser",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/RTOPages/rtouser-creation/rtouser-creation.component").then(
          (m) => m.RTOUserCreationComponent,
        ),
      "rtouser",
    ),
},
{
  path: "activeuser",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/auth/active-users/active-users.component").then(
          (m) => m.ActiveUsersComponent,
        ),
      "activeuser",
    ),
},
{
  path: "activeuser/:LoginName",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/auth/active-users/active-users.component").then(
          (m) => m.ActiveUsersComponent,
        ),
      "activeuser-LoginName",
    ),
},
{
  path: "VendorDetails/:type/:counttype",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/vendor/vendor-list/vendor-list.component").then(
          (m) => m.VendorListComponent,
        ),
      "VendorDetails",
    ),
},
{
  path: "vendor",
  redirectTo: "VendorDetails/dashboard/Total",
  pathMatch: "full",
},
{
  path: "VendorDetails/entry",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/vendor/vendor-entry/vendor-entry.component").then(
          (m) => m.VendorEntryComponent,
        ),
      "VendorDetails-entry",
    ),
},
{
  path: "dealer/:type/:counttype",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/dealer/dealer-list/dealer-list.component").then(
          (m) => m.DealerListComponent,
        ),
      "dealer-list",
    ),
},
{
  path: "dealer",
  redirectTo: "dealer/dashboard/Total",
  pathMatch: "full",
},
{
  path: "dealer/entry",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/dealer/dealer-entry/dealer-entry.component").then(
          (m) => m.DealerEntryComponent,
        ),
      "dealer-entry",
    ),
},
{
  path: "rto/:type/:counttype",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/rto/rto-list/rto-list.component").then(
          (m) => m.RtoListComponent,
        ),
      "rto-list",
    ),
},
{
  path: "RTODetails/0/0",
  redirectTo: "rto/dashboard/Total",
  pathMatch: "full",
},
{
  path: "rto/entry",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/rto/rto-entry/rto-entry.component").then(
          (m) => m.RtoEntryComponent,
        ),
      "rto-entry",
    ),
},
   {
  path: "user/entry",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/user/user-entry/user-entry.component").then(
          (m) => m.UserEntryComponent,
        ),
      "user-entry",
    ),
},
{
  path: "userentry",
  redirectTo: "user/entry",
  pathMatch: "full",
},
{
  path: "userdetails",
  redirectTo: "user/dashboard/Total",
  pathMatch: "full",
},
{
  path: "user/:type/:counttype",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/user/user-list/user-list.component").then(
          (m) => m.UserListComponent,
        ),
      "user-list",
    ),
},
{
  path: "user",
  redirectTo: "user/dashboard/Total",
  pathMatch: "full",
},
{
  path: "role/entry",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/role/role-entry/role-entry.component").then(
          (m) => m.RoleEntryComponent,
        ),
      "role-entry",
    ),
},
{
  path: "roleentry",
  redirectTo: "role/entry",
  pathMatch: "full",
},
{
  path: "roledetails",
  redirectTo: "role",
  pathMatch: "full",
},
{
  path: "RoleDetails",
  redirectTo: "role",
  pathMatch: "full",
},
{
  path: "role",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/role/role-list/role-list.component").then(
          (m) => m.RoleListComponent,
        ),
      "role-list",
    ),
},
{
  path: "reset-password",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/auth/reset-password/reset-password.component").then(
          (m) => m.ResetPasswordComponent,
        ),
      "reset-password",
    ),
  // canActivate: [authGuard]
},
{
  path: "model/entry",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/model/model-entry/model-entry.component").then(
          (m) => m.ModelEntryComponent,
        ),
      "model-entry",
    ),
},
   {
  path: "model",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/model/model-list/model-list.component").then(
          (m) => m.ModelListComponent,
        ),
      "model-list",
    ),
},
{
  path: "devicemodeldetails",
  redirectTo: "model",
  pathMatch: "full",
},
{
  path: "newmodelentry",
  redirectTo: "model/entry",
  pathMatch: "full",
},
{
  path: "DeviceModelDetails",
  redirectTo: "model",
  pathMatch: "full",
},
{
  path: "DeviceModelApproval",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/model/model-approval/model-approval.component").then(
          (m) => m.ModelApprovalComponent,
        ),
      "DeviceModelApproval",
    ),
},
{
  path: "poi/entry",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/poi/poi-entry/poi-entry.component").then(
          (m) => m.POIEntryComponent,
        ),
      "poi-entry",
    ),
},
{
  path: "poi",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/poi/poi-list/poi-list.component").then(
          (m) => m.POIListComponent,
        ),
      "poi-list",
    ),
},
{
  path: "poientry",
  redirectTo: "poi/entry",
  pathMatch: "full",
},
     {
  path: "POIDetails",
  redirectTo: "poi",
  pathMatch: "full",
},
{
  path: "route/routevehicle-map",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/route/route-vehicle-mapping/route-vehicle-mapping.component").then(
          (m) => m.RouteVehicleMappingComponent,
        ),
      "routevehicle-map",
    ),
},
{
  path: "route/poi-map",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/route/route-poi-map/route-poi-map.component").then(
          (m) => m.RoutePOIMapComponent,
        ),
      "route-poi-map",
    ),
},
{
  path: "routevehiclemapping",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/route/route-poi-map/route-poi-map.component").then(
          (m) => m.RoutePOIMapComponent,
        ),
      "routevehiclemapping",
    ),
},
{
  path: "route/entry",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/route/route-entry/route-entry.component").then(
          (m) => m.RouteEntryComponent,
        ),
      "route-entry",
    ),
},
{
  path: "route",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/route/route-list/route-list.component").then(
          (m) => m.RouteListComponent,
        ),
      "route-list",
    ),
},
{
  path: "routedetails",
  redirectTo: "route",
  pathMatch: "full",
},
{
  path: "routeentry",
  redirectTo: "route/entry",
  pathMatch: "full",
},
{
  path: "device/:filter/:vendor/:rto",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/device/device-list/device-list.component").then(
          (m) => m.DeviceListComponent,
        ),
      "device-list",
    ),
},
{
  path: "device/New",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/device/total-new-devices/total-new-devices.component").then(
          (m) => m.TotalNewDevicesComponent,
        ),
      "device-new",
    ),
},
{
  path: "device/newdevicecount",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/device/new-device-count/new-device-count.component").then(
          (m) => m.NewDeviceCountComponent,
        ),
      "new-device-count",
    ),
},
{
  path: "newdevicecount",
  redirectTo: "device/newdevicecount",
  pathMatch: "full",
},
{
  path: "DeviceActivationDetails",
  redirectTo: "device/TotalDevice/0/0",
  pathMatch: "full",
},
{
  path: "vehicle/:dash/:type/:date",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/vehicle/vehicle-list/vehicle-list.component").then(
          (m) => m.VehicleListComponent,
        ),
      "vehicle-list",
    ),
},
{
  path: "vehicle",
  redirectTo: "vehicle/dashboard/Total/0",
  pathMatch: "full",
},
{
  path: "AssetSatus",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/vehicle/vehicle-list/vehicle-list.component").then(
          (m) => m.VehicleListComponent,
        ),
      "AssetSatus",
    ),
},
{
  path: "VehicleDetails/0/0/0",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/vehicle/assets-details/assets-details.component").then(
          (m) => m.AssetsDetailsComponent,
        ),
      "VehicleDetails",
    ),
},
{
  path: "AssetStatus/:url",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/vehicle/vehicle-list/vehicle-list.component").then(
          (m) => m.VehicleListComponent,
        ),
      "AssetStatus-url",
    ),
},
{
  path: "AssetSatus/:url",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/vehicle/vehicle-list/vehicle-list.component").then(
          (m) => m.VehicleListComponent,
        ),
      "AssetSatus-url",
    ),
},
{
  path: "alert/:type/:date",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/alert/alert-list/alert-list.component").then(
          (m) => m.AlertListComponent,
        ),
      "alert-list",
    ),
},
{
  path: "alert",
  redirectTo: "alert/0/0",
  pathMatch: "full",
},
// Vahan Installation routes - handle multiple variations
// Routes without parameters must come BEFORE routes with parameters
{
  path: "vahaninstallation",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/vahan/vahan-installation/vahan-installation.component").then(
          (m) => m.VahanInstallationComponent,
        ),
      "vahaninstallation",
    ),
},
  {
  path: "vahan-installation",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/vahan/vahan-installation/vahan-installation.component").then(
          (m) => m.VahanInstallationComponent,
        ),
      "vahan-installation",
    ),
},
{
  path: "vahaninstallation/:url",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/vahan/vahan-installation/vahan-installation.component").then(
          (m) => m.VahanInstallationComponent,
        ),
      "vahaninstallation-url",
    ),
},

// Vahan Upload Success routes
{
  path: "VahanUploadSuccess",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/vahan/vahan-success/vahan-success.component").then(
          (m) => m.VahanSuccessComponent,
        ),
      "VahanUploadSuccess",
    ),
},
{
  path: "vahan-success",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/vahan/vahan-success/vahan-success.component").then(
          (m) => m.VahanSuccessComponent,
        ),
      "vahan-success",
    ),
},
{
  path: "vahansuccess",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/vahan/vahan-success/vahan-success.component").then(
          (m) => m.VahanSuccessComponent,
        ),
      "vahansuccess",
    ),
},
{
  path: "VahanUploadSuccess/:url",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/vahan/vahan-success/vahan-success.component").then(
          (m) => m.VahanSuccessComponent,
        ),
      "VahanUploadSuccess-url",
    ),
},

// Vahan Upload Pending routes
{
  path: "VahanUploadPending",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/vahan/vahan-pending/vahan-pending.component").then(
          (m) => m.VahanPendingComponent,
        ),
      "VahanUploadPending",
    ),
},
{
  path: "vahan-pending",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/vahan/vahan-pending/vahan-pending.component").then(
          (m) => m.VahanPendingComponent,
        ),
      "vahan-pending",
    ),
},
{
  path: "vahanpending",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/vahan/vahan-pending/vahan-pending.component").then(
          (m) => m.VahanPendingComponent,
        ),
      "vahanpending",
    ),
},
{
  path: "VahanUploadPending/:url",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/vahan/vahan-pending/vahan-pending.component").then(
          (m) => m.VahanPendingComponent,
        ),
      "VahanUploadPending-url",
    ),
},

// Map Tracking routes
{
  path: "maptrackingnew",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/map-tracking-new/map-tracking-new.component").then(
          (m) => m.MapTrackingNewComponent,
        ),
      "maptrackingnew",
    ),
},
{
  path: "mapViewAll",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/map-tracking/map-tracking.component").then(
          (m) => m.MapTrackingComponent,
        ),
      "mapViewAll",
    ),
},
{
  path: "mapViewAll/:url",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/map-tracking/map-tracking.component").then(
          (m) => m.MapTrackingComponent,
        ),
      "mapViewAll-url",
    ),
},

{
  path: "historylogreport",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/report/pvt-parsed-data/pvt-parsed-data.component").then(
          (m) => m.PvtParsedDataComponent,
        ),
      "historylogreport",
    ),
},
{
  path: "overspeedalert",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/report/overspeed-report/overspeed-report.component").then(
          (m) => m.OverspeedReportComponent,
        ),
      "overspeedalert",
    ),
},
{
  path: "OverspeedAlert",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/report/overspeed-report/overspeed-report.component").then(
          (m) => m.OverspeedReportComponent,
        ),
      "OverspeedAlert",
    ),
},
{
  path: "distancetravelledreport",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/report/distance-travelled-report/distance-travelled-report.component").then(
          (m) => m.DistanceTravelledReportComponent,
        ),
      "distancetravelledreport",
    ),
},
{
  path: "distancesummaryreport",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/report/distance-travelled-report/distance-travelled-report.component").then(
          (m) => m.DistanceTravelledReportComponent,
        ),
      "distancesummaryreport",
    ),
},
     {
  path: "alertevents",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/report/alert-activity-report/alert-activity-report.component").then(
          (m) => m.AlertActivityReportComponent,
        ),
      "alertevents",
    ),
},
{
  path: "AlertEvents",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/report/alert-activity-report/alert-activity-report.component").then(
          (m) => m.AlertActivityReportComponent,
        ),
      "AlertEvents",
    ),
},
{
  path: "EventLogs",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/report/activity-log-report/activity-log-report.component").then(
          (m) => m.ActivityLogReportComponent,
        ),
      "EventLogs",
    ),
},
{
  path: "sossessionreport",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/report/sos-session/sos-session.component").then(
          (m) => m.SosSessionComponent,
        ),
      "sossessionreport",
    ),
},
{
  path: "vendorwisesossessionreport",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/report/vendorwise-sos-session/vendorwise-sos-session.component").then(
          (m) => m.VendorwiseSosSessionComponent,
        ),
      "vendorwisesossessionreport",
    ),
},
{
  path: "routedeviationreport",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/report/route-deviation-report/route-deviation-report.component").then(
          (m) => m.RouteDeviationReportComponent,
        ),
      "routedeviationreport",
    ),
},

// Bulk Operations routes
{
  path: "bulkactivation",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/bulk/bulk-activation/bulk-activation.component").then(
          (m) => m.BulkActivationComponent,
        ),
      "bulkactivation",
    ),
},
{
  path: "Bulk-Activation",
  redirectTo: "bulkactivation",
  pathMatch: "full",
},
{
  path: "bulk-activation/logs",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/bulk/bulk-activation-logs/bulk-activation-logs.component").then(
          (m) => m.BulkActivationLogsComponent,
        ),
      "bulk-activation-logs",
    ),
},
{
  path: "BulkActivationLogs",
  redirectTo: "bulk-activation/logs",
  pathMatch: "full",
},
{
  path: "bulk-device-entry",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/bulk/bulk-device-entry/bulk-device-entry.component").then(
          (m) => m.BulkDeviceEntryComponent,
        ),
      "bulk-device-entry",
    ),
},
{
  path: "BulkDeviceEntry",
  redirectTo: "bulk-device-entry",
  pathMatch: "full",
},
      // {
      //   path: 'device/assign-dealer',
      //   loadComponent: () => import('./features/bulk/device-assign-dealer/device-assign-dealer.component').then(m => m.DeviceAssignDealerComponent)
      // },
{
  path: "device/assignment",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/vehicle/device-assignment/device-assignment.component").then(
          (m) => m.DeviceAssignmentComponent,
        ),
      "device-assignment",
    ),
},
{
  path: "DealerAssignment",
  redirectTo: "device/assignment",
  pathMatch: "full",
},
{
  path: "device/unassign-dealer",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/bulk/device-unassign-dealer/device-unassign-dealer.component").then(
          (m) => m.DeviceUnassignDealerComponent,
        ),
      "device-unassign-dealer",
    ),
},
{
  path: "device/unassign-distributor",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/bulk/device-unassign-distributor/device-unassign-distributor.component").then(
          (m) => m.DeviceUnassignDistributorComponent,
        ),
      "device-unassign-distributor",
    ),
},
{
  path: "UnassignDeviceFromDealer",
  redirectTo: "device/unassign-dealer",
  pathMatch: "full",
},

// Operation routes
{
  path: "commandentry",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/operation/command-entry/command-entry.component").then(
          (m) => m.CommandEntryComponent,
        ),
      "commandentry",
    ),
},
{
  path: "commonddetails",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/operation/command-details/command-details.component").then(
          (m) => m.CommandDetailsComponent,
        ),
      "commonddetails",
    ),
},
{
  path: "insertcommond",
  redirectTo: "commonddetails",
  pathMatch: "full",
},
{
  path: "configure/push-command",
  // Previous push-command component commented out; active component retained
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/operation/new-push-cammand/new-push-cammand.component").then(
          (m) => m.NewPushCammandComponent,
        ),
      "configure-push-command",
    ),
},
{
  path: "PushCommand",
  // Previous push-command component commented out; active component retained
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/operation/new-push-cammand/new-push-cammand.component").then(
          (m) => m.NewPushCammandComponent,
        ),
      "PushCommand",
    ),
},
{
  path: "reports/raw-data",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/operation/raw-data/raw-data.component").then(
          (m) => m.RawDataComponent,
        ),
      "reports-raw-data",
    ),
},
{
  path: "RawData",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/operation/new-raw-data/new-raw-data.component").then(
          (m) => m.NewRawDataComponent,
        ),
      "RawData",
    ),
  // Previous raw-data component and providers remain commented out.
},
    {
  path: "EmergencyRawData",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/operation/emergency-raw-data/emergency-raw-data.component").then(
          (m) => m.EmergencyRawDataComponent,
        ),
      "EmergencyRawData",
    ),
  providers: [importProvidersFrom(NgxDaterangepickerMd.forRoot())],
},
{
  path: "sendhealthstatus",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/operation/send-health-status/send-health-status.component").then(
          (m) => m.SendHealthStatusComponent,
        ),
      "sendhealthstatus",
    ),
},
{
  path: "SendHealthStatus",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/operation/send-health-status/send-health-status.component").then(
          (m) => m.SendHealthStatusComponent,
        ),
      "SendHealthStatus",
    ),
},

// Vehicle Installation & Activation routes
{
  path: "VehicleInstallationAndActivation",
  // Previous VehicleInstallationActivationComponent remains commented out.
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/vehicle/new-vehicle-installation-activation/new-vehicle-installation-activation.component").then(
          (m) => m.NewVehicleInstallationActivationComponent,
        ),
      "VehicleInstallationAndActivation",
    ),
},

// Device Entry routes
{
  path: "device/entry",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/device/device-entry/device-entry.component").then(
          (m) => m.DeviceEntryComponent,
        ),
      "device-entry",
    ),
},
{
  path: "NewDeviceEntry",
  redirectTo: "device/entry",
  pathMatch: "full",
},
  {
  path: "deviceentry",
  redirectTo: "device/entry",
  pathMatch: "full",
},

// Multiple Device Entry (Bulk upload)
{
  path: "device/multiple-entry",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/device/device-multiple-entry/device-multiple-entry.component").then(
          (m) => m.DeviceMultipleEntryComponent,
        ),
      "device-multiple-entry",
    ),
},
{
  path: "customer/update",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/vehicle/update-customer-details/update-customer-details.component").then(
          (m) => m.UpdateCustomerDetailsComponent,
        ),
      "customer-update",
    ),
},
{
  path: "displaypermitholder",
  redirectTo: "customer/update",
  pathMatch: "full",
},
{
  path: "device/update",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/update-details/update-details/update-details.component").then(
          (m) => m.UpdateDetailsComponent,
        ),
      "device-update",
    ),
},

// Device Details routes — commented-out routes unchanged

// Update Vehicle Details routes
{
  path: "vehicle/update",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/vehicle/update-vehicle-details/update-vehicle-details.component").then(
          (m) => m.UpdateVehicleDetailsComponent,
        ),
      "vehicle-update",
    ),
},
{
  path: "UpdateVehicleDetails",
  redirectTo: "vehicle/update",
  pathMatch: "full",
},

// Update Device Details routes — previous component remains commented out
{
  path: "UpdateDeviceDetails",
  redirectTo: "device/update",
  pathMatch: "full",
},
      // Device Connection routes
  {
  path: "device/connection",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/device/device-connection/device-connection.component").then(
          (m) => m.DeviceConnectionComponent,
        ),
      "device-connection",
    ),
},
{
  path: "DeviceConnection",
  redirectTo: "device/connection",
  pathMatch: "full",
},

// Device Health routes
{
  path: "device/health",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/device/device-health/device-health.component").then(
          (m) => m.DeviceHealthComponent,
        ),
      "device-health",
    ),
},
{
  path: "DeviceHealthCheck",
  redirectTo: "device/health",
  pathMatch: "full",
},

// Update Dealer Details routes
{
  path: "dealer/update",
  // Previous UpdateDealerDetailsComponent remains commented out
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/dealer/dealer-list/dealer-list.component").then(
          (m) => m.DealerListComponent,
        ),
      "dealer-update",
    ),
},
{
  path: "DealerDetails/0/0",
  redirectTo: "dealer/update",
  pathMatch: "full",
},

// Update SIM Validity routes
{
  path: "sim/update-validity",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/vehicle/update-sim-validity/update-sim-validity.component").then(
          (m) => m.UpdateSimValidityComponent,
        ),
      "sim-update-validity",
    ),
},
{
  path: "UpdateSimValidity",
  redirectTo: "sim/update-validity",
  pathMatch: "full",
},

{
  path: "Tracking",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/plain-map-tracking/plain-map-tracking.component").then(
          (m) => m.PlainMapTrackingComponent,
        ),
      "Tracking",
    ),
},

// Change Device routes
{
  path: "device/change",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/vehicle/change-device/change-device.component").then(
          (m) => m.ChangeDeviceComponent,
        ),
      "device-change",
    ),
},
{
  path: "ChangeDevice",
  redirectTo: "device/change",
  pathMatch: "full",
},

// Change Dealer routes
{
  path: "dealer/change",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/vehicle/change-dealer/change-dealer.component").then(
          (m) => m.ChangeDealerComponent,
        ),
      "dealer-change",
    ),
},
{
  path: "ChangeDealer",
  redirectTo: "dealer/change",
  pathMatch: "full",
},
      // Change Distributor routes
  {
  path: "distributor/change",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/vehicle/change-distributor/change-distributor.component").then(
          (m) => m.ChangeDistributorComponent,
        ),
      "distributor-change",
    ),
},
{
  path: "ChangeDistributor",
  redirectTo: "distributor/change",
  pathMatch: "full",
},

// Alert Management routes
{
  path: "TodayAlert",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/alert/today-alert/today-alert.component").then(
          (m) => m.TodayAlertComponent,
        ),
      "TodayAlert",
    ),
},
{
  path: "VendorWiseDetails/:vendor/:param1/:param2",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/alert/vendor-wise-details-click-on-chart/vendor-wise-details-click-on-chart.component").then(
          (m) => m.VendorWiseDetailsClickOnChartComponent,
        ),
      "VendorWiseDetails",
    ),
},
{
  path: "TodayAlert/:type/:date",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/alert/today-alert/today-alert.component").then(
          (m) => m.TodayAlertComponent,
        ),
      "TodayAlert-type-date",
    ),
},
{
  path: "currentdayschange",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/alert/currentdayschange/currentdayschange.component").then(
          (m) => m.CurrentdayschangeComponent,
        ),
      "currentdayschange",
    ),
},
{
  path: "TodayAlert",
  redirectTo: "alert/today",
  pathMatch: "full",
},
{
  path: "SOSAlert",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/alert/sos-alert/sos-alert.component").then(
          (m) => m.SosAlertComponent,
        ),
      "SOSAlert",
    ),
},
{
  path: "SOSAlert",
  redirectTo: "alert/sos",
  pathMatch: "full",
},
     // Panic Alert Notify — original component route commented out
{
  path: "PanicAlertNotify",
  redirectTo: "alert/panic-notify",
  pathMatch: "full",
},
{
  path: "alert/notify",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/alert/alert-notify/alert-notify.component").then(
          (m) => m.AlertNotifyComponent,
        ),
      "AlertNotify",
    ),
},
{
  path: "AlertNotify",
  redirectTo: "alert/notify",
  pathMatch: "full",
},
{
  path: "alert/management",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/alert/alert-management/alert-management.component").then(
          (m) => m.AlertManagementComponent,
        ),
      "alert-management",
    ),
},
{
  path: "AlertManagment",
  redirectTo: "alert/management",
  pathMatch: "full",
},
{
  path: "AlertSummary",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/alert/alert-overview/alert-overview.component").then(
          (m) => m.AlertOverviewComponent,
        ),
      "AlertSummary",
    ),
},
{
  path: "alert/graph-view",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/alert/alert-graph-view/alert-graph-view.component").then(
          (m) => m.AlertGraphViewComponent,
        ),
      "alert-graph-view",
    ),
},
{
  path: "alert/frame",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/alert/alert-frame/alert-frame.component").then(
          (m) => m.AlertFrameComponent,
        ),
      "alert-frame",
    ),
},
{
  path: "AlertFrame",
  redirectTo: "alert/frame",
  pathMatch: "full",
},

// Device Health Acknowledge routes
{
  path: "device/health-acknowledge",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/device/device-health-acknowledge/device-health-acknowledge.component").then(
          (m) => m.DeviceHealthAcknowledgeComponent,
        ),
      "device-health-acknowledge",
    ),
},
{
  path: "checkhealthackt",
  redirectTo: "device/health-acknowledge",
  pathMatch: "full",
},

// Device Login routes
{
  path: "DeviceLoginCheck",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/device/device-login/device-login.component").then(
          (m) => m.DeviceLoginComponent,
        ),
      "DeviceLoginCheck",
    ),
},

// Configure routes
{
  path: "config/configure",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/config/configure/configure.component").then(
          (m) => m.ConfigureComponent,
        ),
      "config-configure",
    ),
},
{
  path: "configure",
  redirectTo: "config/configure",
  pathMatch: "full",
},
{
  path: "config/details",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/config/configure-details/configure-details.component").then(
          (m) => m.ConfigureDetailsComponent,
        ),
      "config-details",
    ),
},
{
  path: "ConfigureDetails",
  redirectTo: "config/details",
  pathMatch: "full",
},

// Admin Device Details routes
{
  path: "admin/device-details/:filter/:vendor/:rto",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/admin/admin-device-details/admin-device-details.component").then(
          (m) => m.AdminDeviceDetailsComponent,
        ),
      "admin-device-details",
    ),
},
{
  path: "dashboarddevicedetails/:filter/:vendor/:rto",
  redirectTo: "admin/device-details/:filter/:vendor/:rto",
  pathMatch: "full",
},

// Admin Alerts Details routes
{
  path: "admin/alerts-details/:type/:date",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/admin/admin-alerts-details/admin-alerts-details.component").then(
          (m) => m.AdminAlertsDetailsComponent,
        ),
      "admin-alerts-details",
    ),
},
{
  path: "dashboardalertdetails/:type/:date",
  redirectTo: "admin/alerts-details/:type/:date",
  pathMatch: "full",
},
    // Geofence Entry/Exit routes
// Original entry-exit component route commented out
{
  path: "geofence/geofencemaster",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/geofence/geofence-master/geofence-master.component").then(
          (m) => m.GeofenceMasterComponent,
        ),
      "geofence-master",
    ),
},
{
  path: "geofenceentry",
  redirectTo: "geofence/geofencemaster",
  pathMatch: "full",
},
{
  path: "geofenceinoutreport",
  redirectTo: "geofence/entry-exit",
  pathMatch: "full",
},

// Firmware Upload routes
{
  path: "firmware/details",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/firmware/firmware-details/firmware-details.component").then(
          (m) => m.FirmwareDetailsComponent,
        ),
      "firmware-details",
    ),
},
{
  path: "firmware/upload",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/firmware/firmware-upload/firmware-upload.component").then(
          (m) => m.FirmwareUploadComponent,
        ),
      "firmware-upload",
    ),
},
{
  path: "FirmwareUpload",
  redirectTo: "firmware/details",
  pathMatch: "full",
},

// Receipt Generated Devices routes
{
  path: "receipt/generated-devices",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/receipt/receipt-generated-devices/receipt-generated-devices.component").then(
          (m) => m.ReceiptGeneratedDevicesComponent,
        ),
      "receipt-generated-devices",
    ),
},
{
  path: "ReceiptGeneratedDevices",
  redirectTo: "receipt/generated-devices",
  pathMatch: "full",
},
{
  path: "getstatus",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/receipt/report-generation-status/report-generation-status.component").then(
          (m) => m.ReportGenerationStatusComponent,
        ),
      "getstatus",
    ),
},
{
  path: "olddevicedata",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/receipt/old-report-generation-status/old-report-generation-status.component").then(
          (m) => m.OldReportGenerationStatusComponent,
        ),
      "olddevicedata",
    ),
},
{
  path: "renewaldevice",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/receipt/renewal-device/renewal-device.component").then(
          (m) => m.RenewalDeviceComponent,
        ),
      "renewaldevice",
    ),
},
{
  path: "renewaldata",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/device/renewad-details/renewad-details.component").then(
          (m) => m.RenewadDetailsComponent,
        ),
      "renewaldata",
    ),
},

// Inactive Assets routes
{
  path: "assets/inactive",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/assets/inactive-assets/inactive-assets.component").then(
          (m) => m.InactiveAssetsComponent,
        ),
      "inactive-assets",
    ),
},
{
  path: "InactiveAssets",
  redirectTo: "assets/inactive",
  pathMatch: "full",
},

// Current Day Installation routes
{
  path: "installation/current-day",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/installation/current-day-installation/current-day-installation.component").then(
          (m) => m.CurrentDayInstallationComponent,
        ),
      "current-day-installation",
    ),
},
   {
  path: "CurrentDayInstallation",
  redirectTo: "installation/current-day",
  pathMatch: "full",
},
{
  path: "deleteVehicleDetailst",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/vehicle/delete-vehicle/delete-vehicle.component").then(
          (m) => m.DeleteVehicleComponent,
        ),
      "deleteVehicleDetailst",
    ),
},

// Login Status routes
{
  path: "LoginStatus",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/auth/login-status/login-status.component").then(
          (m) => m.LoginStatusComponent,
        ),
      "LoginStatus",
    ),
},
{
  path: "auth/login-status",
  redirectTo: "LoginStatus",
  pathMatch: "full",
},

// Login Generation routes
{
  path: "createlogin",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/auth/login-generation/login-generation.component").then(
          (m) => m.LoginGenerationComponent,
        ),
      "createlogin",
    ),
},
{
  path: "auth/login-generation",
  redirectTo: "createlogin",
  pathMatch: "full",
},

// Vehicle Group Entry routes
{
  path: "newvehiclegroup",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/vehicle-group/vehicle-group-entry/vehicle-group-entry.component").then(
          (m) => m.VehicleGroupEntryComponent,
        ),
      "newvehiclegroup",
    ),
},
{
  path: "vehicle-group/entry",
  redirectTo: "newvehiclegroup",
  pathMatch: "full",
},

// Vehicle Group Mapping routes
{
  path: "vehicle-group/mapping",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/vehicle-group/vehicle-group-mapping/vehicle-group-mapping.component").then(
          (m) => m.VehicleGroupMappingComponent,
        ),
      "vehicle-group-mapping",
    ),
},
{
  path: "VehicleToGroupMapping",
  redirectTo: "vehicle-group/mapping",
  pathMatch: "full",
},

// Vehicle Group Mapping Details routes
{
  path: "vehicle-group/mapping-details",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/vehicle-group/vehicle-group-mapping-details/vehicle-group-mapping-details.component").then(
          (m) => m.VehicleGroupMappingDetailsComponent,
        ),
      "vehicle-group-mapping-details",
    ),
},
{
  path: "VehicleToGroupMappingDetails",
  redirectTo: "vehicle-group/mapping-details",
  pathMatch: "full",
},

// Customer Details routes
{
  path: "customer/details",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/customer/customer-details-list/customer-details-list.component").then(
          (m) => m.CustomerDetailsListComponent,
        ),
      "customer-details",
    ),
},
{
  path: "CustomerDetails",
  redirectTo: "customer/details",
  pathMatch: "full",
},

// Vendor User Details routes
{
  path: "vendor/user-details",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/vendor/vendor-user-details/vendor-user-details.component").then(
          (m) => m.VendorUserDetailsComponent,
        ),
      "vendor-user-details",
    ),
},
{
  path: "VendorUserDetails",
  redirectTo: "vendor/user-details",
  pathMatch: "full",
},
    // Vendor User Creation route commented out in original code

{
  path: "usercreation",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/user/user-creation/user-creation.component").then(
          (m) => m.UserCreationComponent,
        ),
      "usercreation",
    ),
},
{
  path: "VendorUserCreation",
  redirectTo: "usercreation",
  pathMatch: "full",
},
{
  path: "vendorwisealertdetails",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/alert/vendor-wise-alert-details/vendor-wise-alert-details.component").then(
          (m) => m.VendorWiseAlertDetailsComponent,
        ),
      "vendorwisealertdetails",
    ),
},
{
  path: "VendorPortMapping",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/vendor-port-mapping/vendor-port-mapping.component").then(
          (m) => m.VendorPortMappingComponent,
        ),
      "VendorPortMapping",
    ),
},
{
  path: "PortEntry",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/port-entry/port-entry.component").then(
          (m) => m.PortEntryComponent,
        ),
      "PortEntry",
    ),
},
{
  path: "migrationdata",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/dashboard/migration-data/migration-data.component").then(
          (m) => m.MigrationDataComponent,
        ),
      "migrationdata",
    ),
},
{
  path: "distributordetails",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/distributor/distributor-master/distributor-master.component").then(
          (m) => m.DistributorMasterComponent,
        ),
      "distributordetails",
    ),
},
{
  path: "device/assignment",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/vehicle/device-assignment/device-assignment.component").then(
          (m) => m.DeviceAssignmentComponent,
        ),
      "device-assignment",
    ),
},

// Menu management routes
{
  path: "menu/entry",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/Menu Management/menu-entry/menu-entry.component").then(
          (m) => m.MenuEntryComponent,
        ),
      "menu-entry",
    ),
},
{
  path: "menu/details",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/Menu Management/menu-assignment/menu-assignment.component").then(
          (m) => m.MenuAssignmentComponent,
        ),
      "menu-details",
    ),
},
{
  path: "MenuAssignToRole",
  redirectTo: "menu/entry",
  pathMatch: "full",
},
{
  path: "vendorwiseinstallationchecks",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/vehicle/vendorwise-installation-checks/vendorwise-installation-checks.component").then(
          (m) => m.VendorwiseInstallationChecksComponent,
        ),
      "vendorwiseinstallationchecks",
    ),
},
{
  path: "vendorwiseinstallationchecksentry",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/vehicle/vendorwise-installtion-check-update/vendorwise-installtion-check-update.component").then(
          (m) => m.VendorwiseInstalltionCheckUpdateComponent,
        ),
      "vendorwiseinstallationchecksentry",
    ),
},
{
  path: "current-day-alerts",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/alert/current-day-alerts/current-day-alerts.component").then(
          (m) => m.CurrentDayAlertsComponent,
        ),
      "current-day-alerts",
    ),
},
{
  path: "backenddata",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/device/backend-connected-device-details/backend-connected-device-details.component").then(
          (m) => m.BackendConnectedDeviceDetailsComponent,
        ),
      "backenddata",
    ),
},
{
  path: "forceactivation",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/vehicle/forcefull-vehicle-installation/forcefull-vehicle-installation.component").then(
          (m) => m.ForcefullVehicleInstallationComponent,
        ),
      "forceactivation",
    ),
},

// Device checks and command routes
{
  path: "sendack",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/deviceChecks/check-acknowledgement/check-acknowledgement.component").then(
          (m) => m.CheckAcknowledgementComponent,
        ),
      "sendack",
    ),
},
{
  path: "healthcheck",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/deviceChecks/health-check/health-check.component").then(
          (m) => m.HealthCheckComponent,
        ),
      "healthcheck",
    ),
},
{
  path: "command",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/sendCommand/send-command-details/send-command-details.component").then(
          (m) => m.SendCommandDetailsComponent,
        ),
      "command",
    ),
},
     {
  path: "command/entry",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/sendCommand/send-command/send-command.component").then(
          (m) => m.SendCommandComponent,
        ),
      "command/entry",
    ),
},
{
  path: "acknowledgeactivation",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/deviceChecks/activation-acknowledgment/activation-acknowledgment.component").then(
          (m) => m.ActivationAcknowledgmentComponent,
        ),
      "acknowledgeactivation",
    ),
},
{
  path: "vendorwiseinstalleddevicecountoverall",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/report/vendorwiseinstalleddevicecountoverall/vendorwiseinstalleddevicecountoverall.component").then(
          (m) => m.VendorwiseinstalleddevicecountoverallComponent,
        ),
      "vendorwiseinstalleddevicecountoverall",
    ),
},
{
  path: "reset-password",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/auth/reset-password/reset-password.component").then(
          (m) => m.ResetPasswordComponent,
        ),
      "reset-password",
    ),
},
{
  path: "vendorwisenewvehiclestatus",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/report/vendor-status-for-new-vehicles-report/vendor-status-for-new-vehicles-report.component").then(
          (m) => m.VendorStatusForNewVehiclesReportComponent,
        ),
      "vendorwisenewvehiclestatus",
    ),
},
{
  path: "vendorstatusreport",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/report/vendor-status/vendor-status.component").then(
          (m) => m.VendorStatusComponent,
        ),
      "vendorstatusreport",
    ),
},
{
  path: "AssetSatusNew",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/vehicle/asset-status-new/asset-status-new.component").then(
          (m) => m.AssetStatusNewComponent,
        ),
      "AssetSatusNew",
    ),
},
{
  path: "routedeviationreport",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/report/route-deviation-report/route-deviation-report.component").then(
          (m) => m.RouteDeviationReportComponent,
        ),
      "routedeviationreport",
    ),
},
{
  path: "geofenceinoutreport",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/report/geofence-in-out-report/geofence-in-out-report.component").then(
          (m) => m.GeofenceInOutReportComponent,
        ),
      "geofenceinoutreport",
    ),
},
{
  path: "downassets",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/report/inactive-asset-down/inactive-asset-down.component").then(
          (m) => m.InactiveAssetDownComponent,
        ),
      "downassets",
    ),
},
{
  path: "vendorwisefaultydevicescountcomponent",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/report/vendorwise-faulty-devices-count/vendorwise-faulty-devices-count.component").then(
          (m) => m.VendorwiseFaultyDevicesCountComponent,
        ),
      "vendorwisefaultydevicescountcomponent",
    ),
},
{
  path: "businessrulemaster",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/businessRules/business-rule-master/business-rule-master.component").then(
          (m) => m.BusinessRuleMasterComponent,
        ),
      "businessrulemaster",
    ),
},
{
  path: "tripmaster",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/trip/trip-master/trip-master.component").then(
          (m) => m.TripMasterComponent,
        ),
      "tripmaster",
    ),
},
{
  path: "TripDetails",
  redirectTo: "tripmaster",
  pathMatch: "full",
},
{
  path: "tripassignment",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/trip/vehicle-assign-to-trip/vehicle-assign-to-trip.component").then(
          (m) => m.VehicleAssignToTripComponent,
        ),
      "tripassignment",
    ),
},
{
  path: "routedeviationreport",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/report/route-deviation-report/route-deviation-report.component").then(
          (m) => m.RouteDeviationReportComponent,
        ),
      "routedeviationreport",
    ),
},
{
  path: "outofofficehrsreport",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/report/out-of-office-hrs-report/out-of-office-hrs-report.component").then(
          (m) => m.OutOfOfficeHrsReportComponent,
        ),
      "outofofficehrsreport",
    ),
},
{
  path: "unauthorizestoppagesreport",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/report/unauthorize-stoppages-report/unauthorize-stoppages-report.component").then(
          (m) => m.UnauthorizeStoppagesReportComponent,
        ),
      "unauthorizestoppagesreport",
    ),
},
   {
  path: "poiassignstudent",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/schoolManagement/poiassign-to-student/poiassign-to-student.component").then(
          (m) => m.POIAssignToStudentComponent,
        ),
      "poiassignstudent",
    ),
},
{
  path: "locationwiseTracking",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/location-wise-vehicle-details/location-wise-vehicle-details.component").then(
          (m) => m.LocationWiseVehicleDetailsComponent,
        ),
      "locationwiseTracking",
    ),
},
{
  path: "ControlCenterDashboard/sessions",
  data: { sessionsPage: true },
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/dashboard/control-center-dashboard/control-center-dashboard.component").then(
          (m) => m.ControlCenterDashboardComponent,
        ),
      "ControlCenterDashboard-sessions",
    ),
},
{
  path: "ControlCenterDashboard",
  loadComponent: () =>
    retryChunkImport(
      () =>
        import("./features/dashboard/control-center-dashboard/control-center-dashboard.component").then(
          (m) => m.ControlCenterDashboardComponent,
        ),
      "ControlCenterDashboard",
    ),
},
{
  path: "**",
  redirectTo: "login",
},
  ],
},
];