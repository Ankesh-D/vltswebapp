/**
 * Centralized list of unique API endpoint names used across all core services.
 * Each property value matches the exact endpoint string passed to the HTTP helper
 * methods (post/get/postFile/http.post/http.get) in the respective service.
 */
export class APIName {
  // ===== auth.service.ts =====
  static readonly psv_get_authtoken = '/psv_get_authtoken';
  static readonly approvedvendordetails = '/approvedvendordetails';
  static readonly psv_sign_in = '/psv_sign_in';
  static readonly psv_get_logout = '/psv_get_logout';
  static readonly psv_get_homemenu_list = '/psv_get_homemenu_list';
  static readonly chkloginnameinfrgtpwd = '/chkloginnameinfrgtpwd';
  static readonly psv_get_otpcodes = '/psv_get_otpcodes';
  static readonly psv_get_otp_verification_getpassword = '/psv_get_otp_verification_getpassword';
  static readonly setforgetpassword = '/setforgetpassword';
  static readonly psv_put_changepasswordapi = '/psv_put_changepasswordapi';
  static readonly psv_insertotp = '/psv_insertotp';
  static readonly psv_get_logindetails_oneapi = '/psv_get_logindetails_oneapi';
  static readonly psv_get_logindetails_by_loginapi = '/psv_get_logindetails_by_loginapi';
  static readonly psv_get_createlogin = '/psv_get_createlogin';
  static readonly announcementdetails = '/announcementdetails';

  // ===== menu.service.ts =====
  static readonly psv_get_homesubmenu_list = '/psv_get_homesubmenu_list';

  // ===== alert.service.ts =====
  static readonly psv_get_todays_alerts = '/psv_get_todays_alerts';
  static readonly psv_get_today_alert = '/psv_get_today_alert';
  static readonly psv_get_sos_alert = '/psv_get_sos_alert';
  static readonly psv_get_panic_details = '/psv_get_panic_details';
  static readonly psv_get_alerttypedetails = '/psv_get_alerttypedetails';
  static readonly psv_get_alert_overview = '/psv_get_alert_overview';
  static readonly psv_get_all_alert_datadetails = '/psv_get_all_alert_datadetails';
  static readonly sossessionreport = '/sossessionreport';
  static readonly vendorwisesossession = '/vendorwisesossession';
  static readonly psv_get_alertsummarycount = '/psv_get_alertsummarycount';
  static readonly psv_get_last_emergency_details = '/psv_get_last_emergency_details';
  static readonly psv_get_compliancedetail = '/psv_get_compliancedetail';
  static readonly psv_get_alert_details = '/psv_get_alert_details';
  static readonly psv_get_dashboard_alert_count = '/psv_get_dashboard_alert_count';
  static readonly psv_get_alert_Unresolving_historycount = '/psv_get_alert_Unresolving_historycount';
  static readonly psv_get_alertdetailvehicles = '/psv_get_alertdetailvehicles';
  static readonly psv_get_alert_Unresolving_historytimecount = '/psv_get_alert_Unresolving_historytimecount';
  static readonly vendorwisealertsv2 = '/vendorwisealertsv2';
  static readonly vendorwiseinstalledcountoverall = '/vendorwiseinstalledcountoverall';
  static readonly psv_alert_configuration_sk = '/psv_alert_configuration_sk';
  static readonly psv_insert_alert_configuration_sk = '/psv_insert_alert_configuration_sk';
  static readonly psv_alerttypelist = '/psv_alerttypelist';
  static readonly vehiclewisealertcount = '/vehiclewisealertcount';
  static readonly psv_alert_evaluation_count = '/psv_alert_evaluation_count';
  static readonly routedeviationreport = '/routedeviationreport';
  static readonly geofenceinoutreport = '/geofenceinoutreport';
  static readonly policestationdetails = '/policestationdetails';
  static readonly psv_vendorwisefaultydevicesCount = '/psv_vendorwisefaultydevicesCount';
  static readonly psv_vendorwisefaultydevicesdetails = '/psv_vendorwisefaultydevicesdetails';
  static readonly psv_vendorwiseinactivedevicescount = '/psv_vendorwiseinactivedevicescount';
  static readonly unauthorizedstoppagereport = '/unauthorizedstoppagereport';

  // ===== mapbox.service.ts =====
  static readonly psv_get_livetrack = '/psv_get_livetrack';

  // ===== distributor.service.ts =====
  static readonly psv_get_address_state_roster = '/psv_get_address_state_roster';
  static readonly psv_get_city_roster = '/psv_get_city_roster';
  static readonly psv_get_vendor_roster = '/psv_get_vendor_roster';
  static readonly psv_distributor_details = '/psv_distributor_details';
  static readonly psv_insert_distributor = '/psv_insert_distributor';
  static readonly psv_update_distributor = '/psv_update_distributor';
  static readonly psv_delete_distributor = '/psv_delete_distributor';

  // ===== customer.service.ts =====
  static readonly psv_display_permitholder = '/psv_display_permitholder';
  static readonly psv_get_permitholder_roster = '/psv_get_permitholder_roster';

  // ===== trip.service.ts =====
  static readonly psv_put_trip = '/psv_put_trip';
  static readonly psv_edit_trip = '/psv_edit_trip';
  static readonly psv_get_tripdetails = '/psv_get_tripdetails';
  static readonly psv_remove_trip = '/psv_remove_trip';
  static readonly psv_get_poi_roster = '/psv_get_poi_roster';
  static readonly psv_get_triplist = '/psv_get_triplist';
  static readonly psv_get_vehicle_assign_to_trip = '/psv_get_vehicle_assign_to_trip';
  static readonly psv_get_vehicle_trip_assign_details = '/psv_get_vehicle_trip_assign_details';
  static readonly psv_get_vehicle_unassign_to_trip = '/psv_get_vehicle_unassign_to_trip';

  // ===== role.service.ts =====
  static readonly psv_get_roledetails = '/psv_get_roledetails';
  static readonly psv_put_role = '/psv_put_role';
  static readonly psv_edit_role = '/psv_edit_role';
  static readonly psv_remove_role = '/psv_remove_role';

  // ===== device.service.ts =====
  static readonly psv_sendotpforvehicledelete = '/psv_sendotpforvehicledelete';
  static readonly psv_notactivateddevicelist = '/psv_notactivateddevicelist';
  static readonly psv_force_activate_devices = '/psv_force_activate_devices';
  static readonly psv_forcefullyactivedevice = '/psv_forcefullyactivedevice';
  static readonly psv_edit_sim_validity = '/psv_edit_sim_validity';
  static readonly psv_compliancecheck = '/psv_compliancecheck';
  static readonly psv_pendingvehicledetails = '/psv_pendingvehicledetails';
  static readonly psv_push_alert_devices = '/psv_push_alert_devices';
  static readonly psv_push_validity_devices = '/psv_push_validity_devices';
  static readonly psv_verifyotp = '/psv_verifyotp';
  static readonly psv_remove_vehicleapi = '/psv_remove_vehicleapi';
  static readonly psv_get_device_master_details = '/psv_get_device_master_details';
  static readonly psv_get_vehicledetails = '/psv_get_vehicledetails';
  static readonly emrpush = '/emrpush';
  static readonly psv_transfervehicle = '/psv_transfervehicle';
  static readonly psv_get_permitholder = '/psv_get_permitholder';
  static readonly psv_get_rawdatadevice_roster = '/psv_get_rawdatadevice_roster';
  static readonly psv_get_selectdeviceapi = '/psv_get_selectdeviceapi';
  static readonly psv_edit_devicemster = '/psv_edit_devicemster';
  static readonly psv_put_device = '/psv_put_device';
  static readonly psv_get_device_connection = '/psv_get_device_connection';
  static readonly psv_get_health_check_parsedata = '/psv_get_health_check_parsedata';
  static readonly psv_put_device_health = '/psv_put_device_health';
  static readonly psv_remove_device = '/psv_remove_device';
  static readonly psv_get_changedevicetodealer = '/psv_get_changedevicetodealer';
  static readonly changedevicetodistributor = '/changedevicetodistributor';
  static readonly psv_get_checkhealth_acknowledgement = '/psv_get_checkhealth_acknowledgement';
  static readonly psv_get_login_check_parsedata = '/psv_get_login_check_parsedata';
  static readonly psv_get_portassigntovendor_roster = '/psv_get_portassigntovendor_roster';
  static readonly psv_get_bulk_activation = '/psv_get_bulk_activation';
  static readonly psv_put_bulk_device_entry = '/psv_put_bulk_device_entry';
  static readonly psv_get_bulk_activation_logs = '/psv_get_bulk_activation_logs';
  static readonly psv_get_device_bulk_upload_log = '/psv_get_device_bulk_upload_log';
  static readonly psv_assign_device_to_dealer = '/psv_assign_device_to_dealer';
  static readonly psv_unassign_device_from_dealer = '/psv_unassign_device_from_dealer';
  static readonly psv_put_firmwareapi = '/psv_put_firmwareapi';
  static readonly psv_get_firmwaredetalsaapi = '/psv_get_firmwaredetalsaapi';
  static readonly backendconndevicesdetails = '/backendconndevicesdetails';
  static readonly psv_get_receipt_details = '/psv_get_receipt_details';
  static readonly psv_get_currentday_installation = '/psv_get_currentday_installation';
  static readonly psv_distributorlist = '/psv_distributorlist';
  static readonly psv_get_vendordealer_roster = '/psv_get_vendordealer_roster';
  static readonly psv_assigndevicetodistributor = '/psv_assigndevicetodistributor';
  static readonly psv_get_device_rosterassignfordealer = '/psv_get_device_rosterassignfordealer';
  static readonly psv_devicelist_assign_fordistributor = '/psv_devicelist_assign_fordistributor';
  static readonly psv_insertcommand = '/psv_insertcommand';
  static readonly psv_deletecommand = '/psv_deletecommand';
  static readonly psv_commanddetails = '/psv_commanddetails';
  static readonly psv_get_m2mprovider_roster = '/psv_get_m2mprovider_roster';
  static readonly changerequestentry = '/changerequestentry';
  static readonly changerequestdetails = '/changerequestdetails';
  static readonly renewvehicledetails = '/renewvehicledetails';
  static readonly psv_updatecommand = '/psv_updatecommand';
  static readonly updatechangerequeststatus = '/updatechangerequeststatus';
  static readonly smsacknowledgeresponse = '/smsacknowledgeresponse';
  static readonly checkhealthacknowledgement = '/checkhealthacknowledgement';
  static readonly psv_savesmshealthrequest = '/psv_savesmshealthrequest';
  static readonly psv_untagrequestdetails = '/psv_untagrequestdetails';
  static readonly notsendingdevicedatacount = '/notsendingdevicedatacount';
  static readonly devicelist = '/devicelist';

  // ===== dashboard.service.ts =====
  static readonly psv_get_state_dashboard_count = '/psv_get_state_dashboard_count';
  static readonly psv_get_companywise_device_details = '/psv_get_companywise_device_details';
  static readonly psv_get_company_wise_today_install = '/psv_get_company_wise_today_install';
  static readonly companywisetodayactivationcount = '/companywisetodayactivationcount';
  static readonly psv_get_homealerts = '/psv_get_homealerts';
  static readonly psv_get_weekly_rtowise_activation = '/psv_get_weekly_rtowise_activation';
  static readonly psv_get_rto_wise_device_count = '/psv_get_rto_wise_device_count';
  static readonly psv_get_network_roster = '/psv_get_network_roster';
  static readonly psv_get_date_filter_state_dashboard_count = '/psv_get_date_filter_state_dashboard_count';
  static readonly psv_get_date_filter_company_wise_device_counts = '/psv_get_date_filter_company_wise_device_counts';
  static readonly psv_get_date_filter_rto_wise_device_count_api = '/psv_get_date_filter_rto_wise_device_count_api';
  static readonly psv_sendMultipleCommandSendNew = '/psv_sendMultipleCommandSendNew';
  static readonly psv_get_date_filter_class_wise_alerts = '/psv_get_date_filter_class_wise_alerts';
  static readonly psv_liveemergencydetails = '/psv_liveemergencydetails';

  // ===== vahan.service.ts =====
  static readonly psv_get_vahan_pull_request = '/psv_get_vahan_pull_request';
  static readonly psv_get_check_vehicle_details = '/psv_get_check_vehicle_details';
  static readonly psv_put_vahan_device_entry = '/psv_put_vahan_device_entry';
  static readonly vahanuploaddata = '/vahanuploaddata';
  static readonly psv_put_vahan_uploaded_devices = '/psv_put_vahan_uploaded_devices';
  static readonly psv_get_vehicleclass_roster = '/psv_get_vehicleclass_roster';
  static readonly psv_get_vehiclemake_roster = '/psv_get_vehiclemake_roster';
  static readonly psv_get_rto_roster = '/psv_get_rto_roster';
  static readonly psv_get_subrto_roster = '/psv_get_subrto_roster';
  static readonly psv_put_simdetails_v1 = '/psv_put_simdetails_v1';
  static readonly psv_get_simvaliditydetails = '/psv_get_simvaliditydetails';
  static readonly psv_push_to_vahan = '/psv_push_to_vahan';
  static readonly psv_get_devicemodel_roster = '/psv_get_devicemodel_roster';

  // ===== list.service.ts =====
  static readonly mvilist = '/mvilist';
  static readonly oemlist = '/oemlist';

  // ===== config.service.ts =====
  static readonly psv_insert_alert_build = '/psv_insert_alert_build';
  static readonly psv_edit_alert_build = '/psv_edit_alert_build';
  static readonly psv_delete_alert_build = '/psv_delete_alert_build';
  static readonly psv_alert_build_details = '/psv_alert_build_details';
  static readonly psv_get_verifycontact = '/psv_get_verifycontact';

  // ===== vendor.service.ts =====
  static readonly psv_get_vendordetails = '/psv_get_vendordetails';
  static readonly psv_put_vendor = '/psv_put_vendor';
  static readonly psv_edit_vendor = '/psv_edit_vendor';
  static readonly psv_remove_vendor = '/psv_remove_vendor';
  static readonly psv_get_block_unblock_vendor = '/psv_get_block_unblock_vendor';
  static readonly psv_get_approve_vendor = '/psv_get_approve_vendor';
  static readonly psv_get_portassigndetails = '/psv_get_portassigndetails';
  static readonly psv_get_portdetails_roster = '/psv_get_portdetails_roster';
  static readonly psv_fetchvendorwisechecks = '/psv_fetchvendorwisechecks';
  static readonly psv_updatechecks = '/psv_updatechecks';
  static readonly vendorstatusreport = '/vendorstatusreport';
  static readonly psv_get_business_rule_details = '/psv_get_business_rule_details';
  static readonly psv_edit_business_rule = '/psv_edit_business_rule';
  static readonly psv_put_business_rule = '/psv_put_business_rule';
  static readonly psv_remove_business_rule = '/psv_remove_business_rule';

  // ===== vehicle-group.service.ts =====
  static readonly psv_put_vehicle_group_details = '/psv_put_vehicle_group_details';
  static readonly psv_put_vehicle_group = '/psv_put_vehicle_group';
  static readonly groupvehiclemapping = '/groupvehiclemapping';
  static readonly psv_edit_vehicle_group = '/psv_edit_vehicle_group';
  static readonly psv_remove_vehicle_group = '/psv_remove_vehicle_group';
  static readonly psv_get_vehicle_group_mapping_details = '/psv_get_vehicle_group_mapping_details';
  static readonly psv_put_vehicle_group_mapping = '/psv_put_vehicle_group_mapping';
  static readonly psv_get_vehicles_by_group = '/psv_get_vehicles_by_group';
  static readonly psv_remove_group_mapping = '/psv_remove_group_mapping';
  static readonly psv_remove_vehicle_group_mapping = '/psv_remove_vehicle_group_mapping';

  // ===== school-management.service.ts =====
  static readonly psv_schooldetails = '/psv_schooldetails';
  static readonly psv_schoolentry = '/psv_schoolentry';
  static readonly psv_updateschooldetails = '/psv_updateschooldetails';
  static readonly psv_deleteschooldetails = '/psv_deleteschooldetails';
  static readonly psv_studentdetails = '/psv_studentdetails';
  static readonly psv_insertstudent = '/psv_insertstudent';
  static readonly psv_updatestudent = '/psv_updatestudent';
  static readonly psv_deletestudent = '/psv_deletestudent';
  static readonly psv_get_driverdetails = '/psv_get_driverdetails';
  static readonly psv_put_driver = '/psv_put_driver';
  static readonly psv_edit_driver = '/psv_edit_driver';
  static readonly psv_remove_driver = '/psv_remove_driver';
  static readonly psv_shiftdetails = '/psv_shiftdetails';
  static readonly psv_insertshift = '/psv_insertshift';
  static readonly psv_updateshift = '/psv_updateshift';
  static readonly psv_deleteshift = '/psv_deleteshift';
  static readonly psv_schoollist = '/psv_schoollist';
  static readonly psv_schoolclasslist = '/psv_schoolclasslist';
  static readonly psv_guardiantypelist = '/psv_guardiantypelist';

  // ===== school-trip.service.ts =====
  static readonly psv_get_schooltripdetails = '/psv_get_schooltripdetails';
  static readonly psv_insert_schooltripmaster = '/psv_insert_schooltripmaster';
  static readonly psv_update_schooltripmaster = '/psv_update_schooltripmaster';
  static readonly psv_delete_schooltripmaster = '/psv_delete_schooltripmaster';
  static readonly psv_copy_schooltripmaster = '/psv_copy_schooltripmaster';

  // ===== report.service.ts =====
  static readonly psv_get_overspeedreportsdetails = '/psv_get_overspeedreportsdetails';
  static readonly psv_get_distance_summary_report = '/psv_get_distance_summary_report';
  static readonly psv_get_historysignlevehiclealertdetails = '/psv_get_historysignlevehiclealertdetails';
  static readonly psv_get_event_logs = '/psv_get_event_logs';
  static readonly vendorwisevehiclestatus = '/vendorwisevehiclestatus';
  static readonly psv_get_geofenceinoutreport = '/psv_get_geofenceinoutreport';
  static readonly vehicleclasswiseintsallation = '/vehicleclasswiseintsallation';
  static readonly psv_historydatalogreport = '/psv_historydatalogreport';

  // ===== rto.service.ts =====
  static readonly psv_get_cityrto = '/psv_get_cityrto';
  static readonly psv_put_cityrto = '/psv_put_cityrto';
  static readonly psv_edit_cityrto = '/psv_edit_cityrto';
  static readonly psv_remove_cityrto = '/psv_remove_cityrto';

  // ===== geofence.service.ts =====
  static readonly poicategorylist = '/poicategorylist';
  static readonly psv_get_details = '/psv_get_details';
  static readonly psv_geofencedetails = '/psv_geofencedetails';
  static readonly psv_insertgeofence = '/psv_insertgeofence';
  static readonly psv_updategeofence = '/psv_updategeofence';
  static readonly psv_deletegeofence = '/psv_deletegeofence';

  // ===== poi.service.ts =====
  static readonly psv_get_poidetails = '/psv_get_poidetails';
  static readonly psv_put_newpoi = '/psv_put_newpoi';
  static readonly psv_edit_poinew = '/psv_edit_poinew';
  static readonly psv_remove_poinew = '/psv_remove_poinew';
  static readonly geofencelist = '/geofencelist';

  // ===== get-status.service.ts =====
  static readonly psv_get_vehicleotpdetalis = '/psv_get_vehicleotpdetalis';
  static readonly psv_get_status = '/psv_get_status';
  static readonly psv_mvisosalertclear = '/psv_mvisosalertclear';

  // ===== operation.service.ts =====
  static readonly psv_get_commanddetails = '/psv_get_commanddetails';
  static readonly psv_put_command = '/psv_put_command';
  static readonly psv_edit_command = '/psv_edit_command';
  static readonly psv_remove_command = '/psv_remove_command';
  static readonly psv_get_send_single_devicecommand = '/psv_get_send_single_devicecommand';
  static readonly psv_get_send_multiple_device_command = '/psv_get_send_multiple_device_command';
  static readonly psv_raw_data_details = '/psv_raw_data_details';
  static readonly psv_emergency_raw_data_details = '/psv_emergency_raw_data_details';
  static readonly psv_get_device_health_ack_request = '/psv_get_device_health_ack_request';
  static readonly psv_get_devicemodel_list_with_protocol = '/psv_get_devicemodel_list_with_protocol';
  static readonly fileupload = '/fileupload';

  // ===== route.service.ts =====
  static readonly psv_get_route_roster = '/psv_get_route_roster';
  static readonly psv_get_district_roster = '/psv_get_district_roster';
  static readonly psv_put_route = '/psv_put_route';
  static readonly psv_edit_route = '/psv_edit_route';
  static readonly psv_remove_route = '/psv_remove_route';
  static readonly psv_get_assignroutetopoidetails = '/psv_get_assignroutetopoidetails';
  static readonly psv_get_assignroutetopoi = '/psv_get_assignroutetopoi';
  static readonly psv_get_unassignroutetopoi = '/psv_get_unassignroutetopoi';
  static readonly psv_get_vehiclerouteassigndetails = '/psv_get_vehiclerouteassigndetails';
  static readonly psv_put_assign_route_to_vehicle = '/psv_put_assign_route_to_vehicle';
  static readonly psv_put_unassign_route_to_vehicle = '/psv_put_unassign_route_to_vehicle';
  static readonly psv_get_getvehicle_roster = '/psv_get_getvehicle_roster';
  static readonly psv_studentlist = '/psv_studentlist';
  static readonly studentpoidetails = '/studentpoidetails';
  static readonly unassignpoitostudent = '/unassignpoitostudent';
  static readonly assignpoitostudent = '/assignpoitostudent';

  // ===== Menu Management/menu-entry.component.ts =====
  static readonly psv_get_menu_list = '/psv_get_menu_list';
  static readonly psv_get_submenu_list = '/psv_get_submenu_list';
  static readonly psv_put_menumaster = '/psv_put_menumaster';
  static readonly psv_edit_remove_menu = '/psv_edit_remove_menu';
  static readonly psv_get_role_roster = '/psv_get_role_roster';
  static readonly psv_get_citypolice_roster = '/psv_get_citypolice_roster';
  static readonly psv_get_legalmeterology_roster = '/psv_get_legalmeterology_roster';
  static readonly psv_get_pmc_roster = '/psv_get_pmc_roster';
  static readonly psv_get_police_roster = '/psv_get_police_roster';
  static readonly psv_get_rolemenudetails = '/psv_get_rolemenudetails';
  static readonly psv_put_roleUserMenu = '/psv_put_roleUserMenu';
  static readonly psv_get_homemenu_listassign = '/psv_get_homemenu_listassign';
  static readonly psv_put_roleMenu = '/psv_put_roleMenu';

  // ===== user.service.ts =====
  static readonly psv_get_getloginuser_roster = '/psv_get_getloginuser_roster';
  static readonly psv_userdetails = '/psv_userdetails';
  static readonly psv_get_user_roster = '/psv_get_user_roster';
  static readonly psv_resetpassword = '/psv_resetpassword';
  static readonly psv_put_user = '/psv_put_user';
  static readonly psv_insertrtouser = '/psv_insertrtouser';
  static readonly psv_get_role_list_for_userentry = '/psv_get_role_list_for_userentry';
  static readonly psv_get_users_by_role_for_login = '/psv_get_users_by_role_for_login';
  static readonly psv_get_vendor_user_details = '/psv_get_vendor_user_details';
  static readonly psv_put_vendor_user = '/psv_put_vendor_user';
  static readonly psv_edit_vendor_user = '/psv_edit_vendor_user';
  static readonly psv_remove_vendor_user = '/psv_remove_vendor_user';
  static readonly psv_get_user_wise_login_roster = '/psv_get_user_wise_login_roster';
  static readonly updatertouserstatus = '/updatertouserstatus';
  static readonly createuser = '/createuser';
  static readonly psv_get_userdetails = '/psv_get_userdetails';
  static readonly psv_edit_user = '/psv_edit_user';
  static readonly psv_remove_user = '/psv_remove_user';
  static readonly psv_get_block_unblock_user = '/psv_get_block_unblock_user';

  // ===== permit-holder.service.ts =====
  static readonly psv_edit_permitholder = '/psv_edit_permitholder';
  static readonly psv_remove_permitholder = '/psv_remove_permitholder';

  // ===== model.service.ts =====
  static readonly psv_put_devicemodel_approval = '/psv_put_devicemodel_approval';
  static readonly psv_put_devicemodel = '/psv_put_devicemodel';
  static readonly psv_edit_devicemodel = '/psv_edit_devicemodel';
  static readonly psv_get_certauthority_roster = '/psv_get_certauthority_roster';
  static readonly psv_get_model_update_reason_roster = '/psv_get_model_update_reason_roster';
  static readonly psv_approve_model = '/psv_approve_model';
  static readonly psv_approve_Tac_validity = '/psv_approve_Tac_validity';
  static readonly psv_remove_model = '/psv_remove_model';
  static readonly psv_upload_certificate = '/psv_upload_certificate';
  static readonly psv_get_devicemodeldetails = '/psv_get_devicemodeldetails';

  // ===== dealer.service.ts =====
  static readonly psv_get_vendordealerdetails = '/psv_get_vendordealerdetails';
  static readonly psv_put_vendordealer = '/psv_put_vendordealer';
  static readonly psv_edit_vendordealer = '/psv_edit_vendordealer';
  static readonly psv_get_block_unblock_dealer = '/psv_get_block_unblock_dealer';
  static readonly psv_remove_vendordealer = '/psv_remove_vendordealer';

  // ===== vehicle.service.ts =====
  static readonly querycheck = '/querycheck';
  static readonly psv_changeuntagrequeststatus = '/psv_changeuntagrequeststatus';
  static readonly psv_get_vehicledetailsbytype = '/psv_get_vehicledetailsbytype';
  static readonly psv_get_vehicle_roster_details_by_grp_id = '/psv_get_vehicle_roster_details_by_grp_id';
  static readonly psv_get_vehicleinstallation = '/psv_get_vehicleinstallation';
  static readonly psv_get_statevehicleinstallation = '/psv_get_statevehicleinstallation';
  static readonly psv_get_vehicledetailsforupdate = '/psv_get_vehicledetailsforupdate';
  static readonly psv_edit_vehicleapi = '/psv_edit_vehicleapi';
  static readonly psv_untagdevice = '/psv_untagdevice';
  static readonly psv_get_vehicleotpverify = '/psv_get_vehicleotpverify';
  static readonly psv_get_vehiclemode_roster = '/psv_get_vehiclemode_roster';
  static readonly psv_edit_changedevicetovehicle = '/psv_edit_changedevicetovehicle';
  static readonly psv_get_device_roster_assign_for_vehicle = '/psv_get_device_roster_assign_for_vehicle';
  static readonly psv_updatevehicleactivationstatus = '/psv_updatevehicleactivationstatus';
  static readonly psv_send_activation_otp = '/psv_send_activation_otp';
  static readonly psv_get_checkdevicevalidity = '/psv_get_checkdevicevalidity';
  static readonly psv_get_pollingvehicledetails = '/psv_get_pollingvehicledetails';
  static readonly psv_put_vehiclemake = '/psv_put_vehiclemake';
  static readonly psv_put_vehicelmodel = '/psv_put_vehicelmodel';
  static readonly psv_edit_vehicelmodel = '/psv_edit_vehicelmodel';
  static readonly psv_remove_vehicelmodel = '/psv_remove_vehicelmodel';
  static readonly psv_remove_vehiclemake = '/psv_remove_vehiclemake';
  static readonly psv_put_vehicleclass = '/psv_put_vehicleclass';
  static readonly psv_edit_vehicleclass = '/psv_edit_vehicleclass';
  static readonly psv_delete_vehicleclass = '/psv_delete_vehicleclass';
  static readonly psv_get_vehicleclassdetails = '/psv_get_vehicleclassdetails';
  static readonly psv_get_vehiclehistory = '/psv_get_vehiclehistory';
  static readonly vehiclelistv2 = '/vehiclelistv2';
  static readonly psv_get_vehicle_roster = '/psv_get_vehicle_roster';
  static readonly updaterenewalvehicle = '/updaterenewalvehicle';
  static readonly psv_clusteronclassmap = '/psv_clusteronclassmap';
  static readonly psv_get_subrto_rosterv1 = '/psv_get_subrto_rosterv1';

  // ===== holiday-calendar.service.ts =====
  static readonly psv_get_holiday_list = '/psv_get_holiday_list';
  static readonly psv_get_holiday_details = '/psv_get_holiday_details';
  static readonly psv_insert_holiday = '/psv_insert_holiday';
  static readonly psv_update_holiday = '/psv_update_holiday';
  static readonly psv_delete_holiday = '/psv_delete_holiday';
  static readonly psv_update_holiday_status = '/psv_update_holiday_status';
  static readonly psv_get_holiday_summary = '/psv_get_holiday_summary';
  static readonly psv_get_academicsession_roster = '/psv_get_academicsession_roster';
  static readonly psv_get_school_roster_holiday = '/psv_get_school_roster_holiday';
  static readonly psv_get_weekend_config = '/psv_get_weekend_config';
  static readonly psv_put_weekend_config = '/psv_put_weekend_config';
  static readonly psv_bulk_import_holiday = '/psv_bulk_import_holiday';
  static readonly psv_export_holiday = '/psv_export_holiday';
}
