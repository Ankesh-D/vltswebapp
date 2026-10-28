export class CommonDetailsReq{
    "param1": any = "";//searchby
    "param2": any = "";//pageno
    "param3": any = "";//itemperpage
}

export class BackendConnectedDeviceReq {
    "param2": any = "";//pageno
    "param3": any = "";//ItemPerPage
    "param4": string = "";//// Search By
    "param5": string = "";// searchtype
    "param6": string = ""; // vendorid
    "param7": string = "";// status
}
export class UserCreationRequest {
    "userid": string = "";
    "username": string = "";
    "orgnisationcode": string = "";
    "usercontactperson": string = "";
    "usercontpersemailid": string = "";
    "usercontactmobile1": string = "";
    "usercontactmobile2": string = "";
    "userregaddress1": string = "";
    "userregaddress2": string = "";
    "usercityid": string = "";
    "userstateid": string = "";
    "usercitypincode": string = "";
    "creatorloginid": string = "";
    "roleid": string = "";
    "loginname": string = "";
    "loginpasswd": string = "";
    "ownersid": string = "";
}
export class updateRenewalInfoReq {
    "vehicleid": string = ""; 
    "customername": string = ""; 
    "customermobileno": string = "";
    "iccidno": string = ""; 
    "m2mproviderid": string = ""; 
    "mfgyear": string = ""; 
    "vehicleno": string = ""; 
    "chassisno": string = ""; 
    "engineno": string = ""; 
    "vehiclemakeid": string = ""; 
    "vehiclemodelid": string = "";
    "vehicleclassid": string = "";
    "vehicletype": string = ""; 
    "mobileno1": string = ""; 
    "networkid1": string = ""; 
    "mobileno2": string = ""; 
    "networkid2": string = ""; 
    "rtoid": string = ""; 
}
export class UserCreationDetailsReq {
    "param1":  string = ""; // Search By
    "param2":  any = 1; //pageno
    "param3":  any = 10; //ItemPerPage
    "param4":  string = ""; // roleid
}

export class smsAcknowledgedetailsReq {
    param1: string = "";//searchby
    param2: any = "";//pageno
    param3: any = "";//itemperpage
    param4: string = "";//deviceimeino
    param5: string = "";//vendorid
    param6: string = "";//fromdate
    param7: string = "";//todate

}

export class CheckHealthAckDetailsReq extends smsAcknowledgedetailsReq{

}
export class DeviceHealthAckSendReq {
    param1: string = ""; // deviceId
    param2: string = ""; // vendorId
    param3: string = ""; // deviceImeiNo
}
export class VahanPullReq {
    deviceSerialNo: string = "";
}
export class CompanywiseDeviceDetailsReq {
    param1: string = '';
    param2: string = '';
    param3: string = '';
    param4: string = '';
    param5: string = '';   // ✅ vendor id
    param6: string = '';       // ✅ IMPORTANT (New / Old)
    param7: string = '';       // fromdate
    param8: string = '';       // todate
    pdfexcel: string = '';
}
export class CompanywiseDeviceTodayInstalledDetailsReq {
    "param1":  string = ''; //vendorid
    "param2":  string = ''; //datestring
    "param3":  string = '';
    "pdfexcel": string = '';
}
export class CompanywiseDeviceTodayActivationDetailsReq {
    "param1":  string = ''; //vendorid
    "param2":  string = ''; //datestring
    "param3":  string = '';
    "pdfexcel": string = '';
}
export class WeeklyActivationChartReq {
    "param1": string = '';
    "param2": string = '';
    "param3": string = '';
    "pdfexcel": string = ''; //"excel"
}
export class UntagRequestDetailsReq {
    param1: string = ''; // Search By
    param2: any = 1; // pageno
    param3: any = 20; //itemperpage
    param4: string = ''; // searchtype
    param5: string = '';// filter(1-Pending/ 2-Approve/ 3-Untag by vendor
}
export class DistributorListReq {
    vendorid: string = "";
}
export class AlertGraphViewReq {
    "param8": string = ""; //searchby
    "param2": string = ""; //pageno
    "param3": string = ""; //itemperpage
    "param6": string = ""; //stateID
    "param5": string = ""; //alertID
    "param1": string = ""; // totime
    "param11": string = ""; // fromtime
    "param10": string = "";//fromdate
    "param4": string = ""; //todate
    "param7": string = ""; //companyid
}

// Reports Requests Start
export class VendorStatusForNewVehiclesReportReq {
    "param1": string = "";//// Search By
    "param2": any = "";//pageno
    "param3": any = "";//ItemPerPage
    "param4": string = "";// fromdate
    "param5": string = ""; // todate
    "param6": string = ""; // vendorid
    "param7": string = "";// vehicletype
    "param8": string = ""; // rtoId
    "pdfexcel": string = ""; // "pdf" or "excel" for export (optional)
}
export class VendorStatusReportReq {
    "param1": string = "";//searchby
    "param2": any = "";//pageno
    "param3": any = "";//itemperpage
    "param4": string = "";// filtertype (30days / wholeperiod)
    "pdfexcel": string = "";
}
export class RouteDeviationReportReq {
    "param1": string = ""; //searchby
    "param2": any = "1"; //pageno
    "param3": any = "2"; //itemperpage
    "param4": string = "";//fromdate
    "param5": string = "";//todate
    "param6": string = "";//fromtime
    "param7": string = "";//totime
    "param8": string = "";//vehicleno
    "pdfexcel": string = ""; // "pdf" or "excel" for export (optional)
}
export class GeofenceInOutReportReq {
    "param1": string = ""; // Search By
    "param2": any = 1; // pageno
    "param3": any = 20; // ItemPerPage
    "param4": string = ""; // fromdate
    "param5": string = ""; // todate
    "param6": string = ""; // fromtime
    "param7": string = ""; // totime
    "param8": string = ""; // vehicleno
    "pdfexcel": string = ""; // "pdf" or "excel" for export (optional)
}
export class OutOfOfficeHoursReportReq {
    "param1": string = ""; // Search By
    "param2": any = ""; // pageno
    "param3": any = ""; // ItemPerPage
    "param4": string = ""; // fromdate
    "param5": string = ""; // todate
    "param6": string = ""; // fromtime
    "param7": string = ""; // totime
    "param8": string = ""; // vehicleno
    "pdfexcel": string = "";
}
// Reports Requests End

// Device Model Master Start
export class DeviceModelDeleteReq {
    param1: string = ""; // devmodelid
    param3: string = ""; // remarks
    param4: string = ""; // vendorid
}
// Device Model Master End
// REASON LIST Start
export class ReasonListReq {
    param1: string = ""; // searchby
}
// REASON LIST End
// Action on Alert Start
export class ActionOnAlertReq {
    "vehicleid": string = "";
    "imeino": string = "";
    "alerteventid": string = "";
    "reasonid": string = "";
    "remarks": string = "";
}


// business rule master
export class BusinessRuleMasterDetailsReq {
    param1: string = ""; // searchby
    param2: any = 1; // pageno
    param3: any = 20; // itemperpage
    pdfexcel: string = ""; // "pdf" or "excel" for export (optional)
}
// trip master start
export class TripDetailsReq {
    "param1": string = ""; // searchby
    "param2": any = 1; // pageno
    "param3": any = 20; // itemperpage
    "param4": string = ""; // searchtype
}
export class TripMasterFormReq {
    "tripid": string = "";
    "tripname": string = "";
    "triptype": string = "";
    "sourceid": string = "";
    "destid": string = "";
    "starttime": string = "";
    "endtime": string = "";
    "tripData": Stoppages[] = [];
}
export class Stoppages {
    "stopid": string = "";
    "stopname": string = "";
    "arrival": string = "";
    "departure": string = "";
    "distance": string = "";
    "sequence": string = "";
    "status": string = "";
}
export class DeleteTripReq {
    "remarks": string = "";
    "tripid": string = "";
}
export class VehicleAssignToTripReq {
    "param1": string = ""; // Search By
    "param2": any = 1; // pageno
    "param3": any = 20; // itemperpage
    "param4": string = ""; // searchtype
}
export class VehicleAssignToTripFormReq {
    vehicleid: string = "";
    tripidlist: string[] = [];
    validupto: string = "";
}
export class VehicleUnassignToTripResp {
    "vehicleid": string = "";
    "tripid": string = "";
    "mappingid": string = "";
    "remarks": string = "";
}

export class SchoolMasterDetailsReq {
    param1: any = ""; // Search By
    param2: any = 1; // pageno
    param3: any = 20; // itemperpage
    param4: string = ""; // searchtype
}
export class SchoolMasterFormReq {
  "schoolid": string = "";
  "schoolname": string = "";
  "schoolcode": string = "";
  "contactperson": string = "";
  "mobileno": string = "";
  "emailid": string = "";
  "address": string = "";
  "cityid": string = "";
  "stateid": string = "";
  "pincode": string = "";
  "latitude": string = "";
  "longitude": string = "";
  "remarks": string = "";
}
export class SchoolMasterDeleteReq {
    schoolid: string = "";
    remarks: string = "";
}

export class DriverMasterDetailsReq {
    param1: string = ""; // Search By
    param2: any = 1; // pageno
    param3: any = 20; // itemperpage
    param4: string = ""; // searchtype
}
export class DriverMasterFormReq {
    "driverid":string = ""; // "101",
    "drivername":string = ""; // "John",
    "drivermobileno":string = ""; // "9876543210",
    "address":string = ""; // "Nagpur",
    "stateid":string = ""; // "1",
    "cityid":string = ""; // "10",
    "pincode":string = ""; // "440001",
    "licenceno":string = ""; // "DL123456",
    "aadharno":string = ""; // "123456789012",
    "licencefileid":string = ""; // "1001",
    "aadharfileid":string = ""; // "1002"
}
export class DriverMasterDeleteReq {
    driverid: string = "";
    remarks: string = "";
}

// ==================== School Trip Master ====================
export class SchoolTripStop {
    stopid: string = "";
    sequence: number = 0;
    stopname: string = "";
    latitude: string = "";
    longitude: string = "";
    arrivaltime: string = "";
    departuretime: string = "";
    distance: number = 0; // distance (km) from previous point
    estimatedtraveltime: number = 0; // minutes from previous point
    studentcount: number = 0;
    remarks: string = "";
}
export class SchoolTripMasterFormReq {
    tripid: string = "";
    tripcode: string = "";
    tripname: string = "";
    triptype: string = ""; // Pickup | Drop
    academicsession: string = "";
    driverid: string = "";
    attendantid: string = "";
    sourceid: string = "";
    vehicleid: string ="";
    destinationid: string = "";
    starttime: string = "";
    endtime: string = "";
    status: string = "Active";
    totaldistance: number = 0;
    estimatedduration: number = 0;
    remarks: string = "";
    tripstops: SchoolTripStop[] = [];
    
    sourcename: string = "";
    sourcelatitude: string = "";
    sourcelongitude: string = "";
    destinationname: string = "";
    destinationlatitude: string = "";
    destinationlongitude: string = "";
}
export class SchoolTripMasterDetailsReq {
    param1: string = ""; // Search By
    param2: any = 1; // pageno
    param3: any = 20; // itemperpage
    param4: string = ""; // searchtype
}
export class SchoolTripMasterDeleteReq {
    tripid: string = "";
    remarks: string = "";
}

export class VendorwiseInactiveAssetsCountReq {
    param1: string = ''; // searchBy
    param2: string = ''; // pageno
    param3: string = ''; // itemsPerPage
    param4: string = ''; // days
    param5: string = ''; // vendorId
    param6: string = ''; // vehicleType (NEW/OLD)
}
export class OutOfOfficeHrsReportReq {
 "param1": any = ""; // Search By 
 "param2": any = ""; //pageno 
 "param3": any = ""; //ItemPerPage 
 "param4": any = ""; // fromdate 
 "param5": any = ""; // todate 
 "param6": any = ""; // fromtime 
 "param7": any = ""; //totime 
 "param8": any = ""; //vehicleno 
 "pdfexcel": any = "";
}
export class UnauthorizedStoppageReportReq {
     "param1": any = "";// Search By
    "param2": any = "";// pageno
    "param3": any = "";// ItemPerPage
    "param4": any = "";// fromdate
    "param5": any = "";// todate
    "param6": any = "";// fromtime
    "param7": any = ""; // totime
    "param8": any = "";// vehicleid
    "param9": any = ""; // filterby->RTO/Vendor
    "param10": any = ""; //rotid/vendorid;
    "pdfexcel": any = "";
    "pagename": ""
}
export class LoginStatusReq {
    "param1": any = "";// Search By
    "param2": any = "";// pageno
    "param3": any = "20";// ItemPerPage
}
export class ActiveUsersReq {
    param1:  any = "";//searchText,
    param2:  any = "";//currentPageno,
    param3:  any = "";//ItemPerPage,
    param4:  any = "";//loginName
}

// Student Master
export class StudentMasterDetailsReq {
    param1: any = ""; // Search By
    param2: any = 1; // pageno
    param3: any = 20; // itemperpage
    param4: string = ""; // searchtype
}
export class StudentMasterFormReq {
  "studentid": any = "";
  "schoolid": any = "";
  "studentname": any = "";
  "standardid": any = "";
  "guardiantypeid": any = "";
  "guardianname": any = "";
  "emailid": any = "";
  "mobileno": any = "";
  "altmobileno": any = "";
  "address": any = "";
  "stateid": any = "";
  "cityid": any = "";
  "pincode": any = "";
  "latitude": any = "";
  "longitude": any = "";
}
export class StudentMasterDeleteReq {
    studentid: string = "";
    remarks: string = "";
}


// Shift Master

export class ShiftMasterDetailsReq {
    param1: any = ""; // Search By
    param2: any = 1; // pageno
    param3: any = 10; // itemperpage
    param4: string = ""; // searchtype
}
export class ShiftMasterFormReq {
  "shiftid": any = "";
  "schoolid": any = "";
  "shiftname":  any = "";
  "fromtime":  any = "";
  "totime": any = "";
  remarks: any = "";
}
export class ShiftMasterDeleteReq {
    shiftid: string = "";
    remarks: string = "";
}

export class OverspeedReportReq {
    "param1": string = ""; // "",searchby
    "param2": any = ""; // "1",pageno
    "param3": any = ""; // "20",itemperpage
    "param4": string = ""; // "",searchtype
    "param5": string = ""; // "",fromdate 
    "param6": string = ""; // "",todate
    "param7": string = ""; // "",speed
    "pdfexcel": string = ""; // "",pdfexcel
}
export class VehicleClassWiseAlertCountReq {
    param1: string = ""; // fromdate
    param2: string = ""; // todate
}
export class RtoWiseAlertCountReq extends VehicleClassWiseAlertCountReq {
    
}