export class BackendConnDeviceResponse {
    "param1": string = ""; // "1",  //Row No
    "param2": string = ""; // "868960063677062", //Imeino
    "param3": string = ""; // "LWBA12",  // firmaware version
    "param4": string = ""; // "NR",    //packet_type
    "param5": string = ""; // "01",   //alertID
    "param6": string = ""; // "L",    //packet Status
    "param7": string = ""; // "Valid",  // GPS Status
    "param8": string = ""; // "2026-06-15 10:10:42+05:30",   // event_Time
    "param9": string = ""; // "25.350175894",  //Latitude
    "param10": string = ""; // "N",   // Latitude Direction
    "param11": string = ""; // "91.740656016",  // lOngitude
    "param12": string = ""; // "E",   // Longitude Direction
    "param13": string = ""; // "West",   // Heading/ Direction
    "param14": string = ""; // "42.20",  //Speed
    "param15": string = ""; // "42.20",   // Speed
    "param16": string = ""; // "272.10",  // Direction
    "param17": string = ""; // "1694.08",   // Altitude
    "param18": string = ""; // "Vi",  // Network Operator
    "param19": string = ""; // "46",  // Satellite count
    "param20": string = ""; // "true",  //Ignition
    "param21": string = ""; // "true", //main Power
    "param22": string = ""; // "M",  // Device Status/ vehicle Status
    "param23": string = ""; // "42.106.6.15/32:2769"  , ClientIP :Port
    "param24": string = ""; //mnc
    "param25": string = ""; //mcc
    "param26": string = ""; //lac
    "param27": string = ""; //cell_id
    "param28": string = ""; //gsm_signal
    "param29": string = ""; //
    "param30": string = ""; //

}

export class UserCreationDetailsResp {
  "param1": string = ""; // rowno
  "param2": string = ""; // userid
  "param3": string = ""; // orgnisationname
  "param4": string = ""; // orgnisationcode
  "param5": string = ""; // usercontactperson
  "param6": string = ""; // usercontpersemailid
  "param7": string = ""; // usercontactmobile1
  "param8": string = ""; // usercontactmobile2
  "param9": string = ""; // userregaddress1
  "param10": string = ""; // userregaddress2
  "param11": string = ""; // cityname
  "param12": string = ""; // statename
  "param13": string = ""; // usercitypincode
  "param14": string = ""; // usercreatedat
  "param15": string = ""; //roleid
  "param16": string = ""; //rolename
  "param17": string = ""; //cityid
  "param18": string = ""; //stateid
  "param19": string = ""; //status
  "param20": string = ""; //loginname
  "param21": string = ""; //userloginid
  "param22": string = ""; //ownersid
  "param23": string = ""; //ownersname
  "param24": string = ""; //
  "param25": string = ""; //
  "param26": string = ""; //
  "param27": string = ""; //
  "param28": string = ""; //
  "param29": string = ""; //
}

export class SMSAcknowledgeDetailsResp {
  "param1": string = ""; // "1",
  "param2": string = ""; // "smsserialid",
  "param3": string = ""; // "imeino",
  "param4": string = ""; // "mobileno",
  "param5": string = ""; // "header",
  "param6": string = ""; // "randomcode",
  "param7": string = ""; // "vendorid",
  "param8": string = ""; // "firmversion",
  "param9": string = ""; // "alertid",
  "param10": string = ""; // "lattitude",
  "param11": string = ""; // "latdirection",
  "param12": string = ""; // "longitude",
  "param13": string = ""; // "longdirection",
  "param14": string = ""; // "gpsstaus",
  "param15": string = ""; // "smsdate",
  "param16": string = ""; // "datetime",
  "param17": string = ""; // "recivedtimedate",
  "param18": string = ""; // "heading",
  "param19": string = ""; // "speed",
  "param20": string = ""; // "gsmstrength",
  "param21": string = ""; // "contrycode",
  "param22": string = ""; // "networkcode",
  "param23": string = ""; // "lac",
  "param24": string = ""; // "mainpower",
  "param25": string = ""; // "ignstutus",
  "param26": string = ""; // "battyvolt",
  "param27": string = ""; // "framenumber",
  "param28": string = ""; // "vehiclemode",
  "param29": string = ""; // "datamessgae
  "param30": string = ""; //  "alertname
}
export class CheckHealthAckResponse {
  "param1": string = ""; // "1",
  "param2": string = ""; // "imeino",
  "param3": string = ""; // "header",
  "param4": string = ""; // "vendorid",
  "param5": string = ""; // "firmversion",
  "param6": string = ""; // "alertname",
  "param7": string = ""; // "lattitude",
  "param8": string = ""; // "longitude",
  "param9": string = ""; // "gpsfix",
  "param10": string = ""; // "smsdate",
  "param11": string = ""; // "datetime",
  "param12": string = ""; // "recivedtimedate",
  "param13": string = ""; // "heading",
  "param14": string = ""; // "speed",
  "param15": string = ""; // "ignalstrnegth",
  "param16": string = ""; // "contrycode",
  "param17": string = ""; // "networkcode",
  "param18": string = ""; // "ignstutus",
  "param19": string = ""; // "battyvolt",
  "param20": string = ""; // "vehiclemode",
  "param21": string = ""; // "datamessgae",
  "param22": string = ""; // "LAC",
  "param23": string = ""; // "datamessgae",
  "param24": string = ""; // "",
  "param25": string = ""; // "",
  "param26": string = ""; // "",
  "param27": string = ""; // "",
  "param28": string = ""; // "",
  "param29": string = ""; // ""
}
export class VahanPullResponse {
  param1: string = ""; // chassisNo
  param2: string = ""; // deviceSerialno
  param3: string = ""; // fitmentCentreName
  param4: string = ""; // iccId
  param5: string = ""; // imeiNo
  param6: string = ""; // makerName
  param7: string = ""; // modelName
  param8: string = ""; // tacNo
  param9: string = ""; // tacValidUpto
  param10: string = ""; //regnNo
  param11: string = ""; //vehclass
  param12: string = ""; // dateOfRegistration
  param13: string = ""; // deviceActivationStatus
  param14: string = ""; //gnssConstellationCode
  param15: string = ""; // ownername
  param16: string = ""; //engineNo
}
export class UntaggedRequestDetailsResp {
  param1: string = "";
  param2: string = ""; // deviceid
  param3: string = ""; // deviceimeino
  param4: string = ""; // deviceuniqueno
  param5: string = ""; // deviceiccidno
  param6: string = ""; // devicemakeid
  param7: string = ""; // vendorname
  param8: string = ""; // vehicleid
  param9: string = ""; // vehicleno
  param10: string = ""; // vehiclechasisno
  param11: string = ""; // vehicleengineno
  param12: string = ""; // activationdate
  param13: string = ""; // vehiclemfgyear
  param14: string = ""; // vehicletype
  param15: string = ""; // validityupto
  param16: string = ""; // customerid
  param17: string = ""; // customername
  param18: string = ""; // customermobileno
  param19: string = ""; // lastpollingtime
  param20: string = ""; // lastalert
  param21: string = ""; // requestid
  param22: string = ""; // requesttime
  param23: string = ""; // reason
  param24: string = ""; // approvestatus
  param25: string = ""; // approvetime
  param26: string = ""; // actionremark
}

export class AlertGraphViewResp {
  "param1": string = ""; // "2",
  "param2": string = ""; // "13",//id
  "param3": string = ""; // "Harsh Braking",//name
  "param4": string = ""; // "1236278",//alertcount
  "param5": string = ""; // "30046",
  "param6": string = ""; // "ROADPOINT LIMITED"
}

// report response start
export class VendorStatusForNewVehiclesReportResp {
  "param1": string = "";
  "param2": string = ""; // vendorname
  "param3": string = ""; // installed
  "param4": string = ""; // Activated
  "param5": string = ""; // Received
  "param6": string = ""; // Not_Received
   "param7": string = "";
}
export class VendorStatusReportResp {
  "param1": string = ""; //"1",
  "param2": string = ""; //"vendor_name",
  "param3": string = ""; //"onboarded_on",
  "param4": string = ""; //"total_installed_vehicle",
  "param5": string = ""; //"unique_panic_vehicle",
  "param6": string = ""; //"panic_session",
  "param7": string = ""; //"percentage",
  "param8": string = ""; //"panic_alert",
  "param9": string = ""; //"panic_alert_received",
  "param10": string = ""; //"vehicle_reg_number"
  "param11": string = ""; //"tampered_panic_sessions",
  "param12": string = ""; //"unique_tampered_panic_vehicles",
}
export class RouteDeviationReportResp {
  "param1": string = "";
  "param2": string = ""; // vendorname
  "param3": string = ""; // deviceimeino
  "param4": string = ""; // deviceserialno
  "param5": string = ""; // vehicleno
  "param6": string = ""; // vehiclechassisno
  "param7": string = ""; // customername
  "param8": string = ""; // customermobileno
  "param9": string = ""; // starttime
  "param10": string = ""; // endtime
  "param11": string = ""; // distance
  "param12": string = ""; // duration
  "param13": string = ""; // routename
  "param14": string = ""; // status
}
export class GeofenceInOutReportResp {
  "param1": string = ""; // "1",
  "param2": string = ""; // vehicleid
  "param3": string = ""; // vehicleregno
  "param4": string = ""; // geofencename
  "param5": string = ""; // inoutstatus
  "param6": string = ""; // intime
  "param7": string = ""; // outtime
  "param8": string = ""; // duration
}
export class OutOfOfficeHoursReportResp {
  "param1": string = ""; // rowno
  "param2": string = ""; // vehicleid
  "param3": string = ""; // vehicleregno
  "param4": string = ""; // inoutstatus
  "param5": string = ""; // intime
  "param6": string = ""; // outtime
  "param7": string = ""; // duration
}
export class BusinessRuleMasterDetailsResp {
  "param1": string = ""; // "1",
  "param2": string = ""; // "ruleid",
  "param3": string = ""; // "rulename",
  "param4": string = ""; // "rulestatus",
  "param5": string = ""; // "createdby",
  "param6": string = ""; // "createdon",
  "param7": string = ""; // "modifiedby",
  "param8": string = ""; // "modifiedon"
}

export class TripMasterDetailsResp {
  "param2": string = ""; // tripid
  "param3": string = ""; // tripname
  "param4": string = ""; // sourceid
  "param5": string = ""; // sourcename
  "param6": string = ""; // destid
  "param7": string = ""; // destinationname
  "param8": string = ""; // stopages
  "param9": string = ""; // triptypeid
  "param10": string = ""; // triptype
}
export class VehicleAssignToTripResp {
  "param1": string = ""; // mappingid
  "param2": string = ""; // mappingid
  "param3": string = ""; // tripid
  "param4": string = ""; // tripname
  "param5": string = ""; // sourceid
  "param6": string = ""; // sourcename
  "param7": string = ""; // destid
  "param8": string = ""; // destname
  "param9": string = ""; // starttime
  "param10": string = ""; // endtime
  "param11": string = ""; // vehicleid
  "param12": string = ""; // vehicleregno
  "param13": string = ""; // validupto
  "param14": string = ""; // triptype
  "param15": string = ""; // stoppages
}
export class EventLogReportResp {
  "param1": string = ""; // rowno
  "param2": string = ""; // pagename
  "param3": string = ""; // eventname
  "param4": string = ""; // querystmt
  "param5": string = ""; // created_at
  "param6": string = ""; // responsemsg
  "param7": string = ""; // exceptionmsg
  "param8": string = ""; // ipaddress
  "param9": string = ""; // loginid
  "param10": string = ""; // browserdetails
  "param11": string = ""; // osdetails
  "param12": string = ""; // apptype
  "param13": string = ""; // requestbody
  "param14": string = ""; // username
  "param15": string = ""; // loginname
  "param16": string = ""; // userdesignation
  "param17": string = ""; // statement
}

export class SchoolMasterDetailsResp {
  "param1":  string = ""; //"1",
  "param2":  string = ""; //"schoolid",
  "param3":  string = ""; //"schoolname",
  "param4":  string = ""; //"schoolcode",
  "param5":  string = ""; //"contactperson",
  "param6":  string = ""; //"mobileno",
  "param7":  string = ""; //"emailid",
  "param8":  string = ""; //"address",
  "param9":  string = ""; //"cityid",
  "param10": string = ""; // "stateid",
  "param11": string = ""; // "latitude",
  "param12": string = ""; // "longitude",
  "param13": string = ""; // "pincode",
  "param14": string = ""; // "entrytime",
  "param15": string = ""; // "changetime",
  "param16": string = ""; // "remarks",
  "param17": string = ""; // "cityname",
  "param18": string = ""; // "statename"
}

export class DriverMasterDetailsResp {
  "param1": string = ""; // rowno
  "param2": string = ""; // driverid
  "param3": string = ""; // drivername
  "param4": string = ""; // mobileno
  "param5": string = ""; // address
  "param6": string = ""; // cityid
  "param7": string = ""; // pincode
  "param8": string = ""; // licencenumber
  "param9": string = ""; // aadharnumber
  "param10": string = ""; // licencefile
  "param11": string = ""; // aadharfile
  "param12": string = ""; // createdby
  "param13": string = ""; // createdon
  "param14": string = ""; // modifiedby
  "param15": string = ""; // modifiedon
}

export class SchoolTripMasterDetailsResp {
  "param1": string = ""; // rowno
  "param2": string = ""; // tripid
  "param3": string = ""; // tripcode
  "param4": string = ""; // tripname
  "param5": string = ""; // triptype
  "param6": string = ""; // vehicleid / vehicle no
  "param7": string = ""; // driverid / driver name
  "param8": string = ""; // attendant name
  "param9": string = ""; // sourcename
  "param10": string = ""; // destinationname
  "param11": string = ""; // starttime
  "param12": string = ""; // endtime
  "param13": string = ""; // status
  "param14": string = ""; // totaldistance
  "param15": string = ""; // estimatedduration
  "param16": string = ""; // tripstops (JSON string)
  "param17": string = ""; // academicsession
  "param18": string = ""; // createdby
  "param19": string = "";
  "param20": string = "";
  "param21": string = "";
  "param22": string = "";
  "param23": string = "";
  "param24": string = "";
}

export class OutOfOfficeHrsReportResp {
    "param2": string = ""; // loginid
    "param3": string = ""; // username
    "param4": string = ""; // status
    "param5": string = ""; // logintime
    "param6": string = ""; // outtime
    "param7": string = ""; // logouttime
    "param8": string = ""; // duration
    "param9": string = ""; // loginroleid
    "param10": string = "";// rolename
    "param11": string = "";// outofofficehrsduration
}
export class PvtParseDataResponse {
"param1": string = ""; //rowno
"param2": string = "";//imeino,
"param3": string = "";//pollingtime,
"param4": string = "";//latitude,
"param5": string = "";//longitude,
"param6": string = "";//vehiclespeed,
"param7": string = "";//gpsstatus,
"param8": string = "";//vehicledirectionvalue,
"param9": string = "";//vehicledirectionname,
"param10": string = "";//ignitionstatus,
"param11": string = "";//alertid,
"param12": string = "";//alertname,
"param13": string = "";//receivedtime,
"param14": string = "";//datamessage
}

export class UnauthorizedStoppageReportResp {
  "param1": string = ""; // Srno
  "param2": string = ""; // vendorname
  "param3": string = ""; // deviceimeino ;
  "param4": string = ""; // deviceuniqueno
  "param5": string = ""; // vehicleno
  "param6": string = "" //vehiclechasisno
  "param7": string = "";// customername
  "param8": string = "";// customermobileno
  "param9": string = "";// starttime
  "param10": string = ""; // endtime
  "param11": string = "";// duration
  "param12": string = "";// stoplocation
  "param13": string = "";//stopid
}

export class StudentMasterDetailsResp {
  param1: string = "";//studentid
  param2: string = "";//studentname
  param3: string = "";//schoolid
  param4: string = "";//schoolname
  param5: string = "";//standardid
  param6: string = "";//standard
  param7: string = "";//gaurdiantypeid
  param8: string = "";//gaurdiantype
  param9: string = "";//gaurdianname
  param10: string = "";//emailid
  param11: string = "";//mobileno
  param12: string = "";//altmobileno
  param13: string = "";//address
  param14: string = "";//stateid
  param15: string = "";//statename
  param16: string = ""; //cityid
  param17: string = ""; //cityname
}
export class ShiftMasterDetailsResp {
  "param1":  string = ""; // "1",
  "param2":  string = ""; // "schoolid",
  "param3":  string = ""; // "schoolname",
  "param4":  string = ""; // "shiftid",
  "param5":  string = ""; // "shiftname",
  "param6":  string = ""; // "fromtime",
  "param7":  string = ""; // "createdat",
  "param8":  string = ""; // "remarks"
}

export class ActiveSessionDetailsResponse {
  "param2":   string = "";//"loginid",
  "param3":   string = "";//"sessionid"
  "param4":   string = "";//"loginname"
  "param5":   string = "";//"rolename"
  "param6":   string = "";//"contactpersonname"
  "param7":   string = "";//"emailid"
  "param8":   string = "";//"logintime"
  "param9":   string = "";//"status"
}

export class OverspeedReportResp {
  "param2": string = ""; // vehicleid
  "param3": string = ""; //vehicleno  ,
  "param4": string = "";// deviceimeino
  "param5": string = ""; // deviceuniqueno
  "param6": string = "";//deviceiccidno
  "param7": string = "";// vendorname
  "param8": string = ""; // customername
  "param9": string = ""; // customermobileno
  "param10": string = "";// vehicleclassname
  "param11": string = ""; // alertcount
}