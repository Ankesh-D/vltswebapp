import { Component, OnInit } from "@angular/core";

import { CommonModule } from "@angular/common";

import { FormsModule } from "@angular/forms";

import { RouterModule } from "@angular/router";

import { NgSelectModule } from "@ng-select/ng-select";

import { NgxDaterangepickerMd } from "ngx-daterangepicker-material";

import { DashboardService } from "../../../core/services/dashboard.service";

@Component({
  selector: "app-forceactivationreport",

  standalone: true,

  imports: [
    CommonModule,

    FormsModule,

    RouterModule,

    NgSelectModule,

    NgxDaterangepickerMd,
  ],

  templateUrl: "./forceactivationreport.component.html",

  styleUrl: "./forceactivationreport.component.scss",
})
export class ForceactivationreportComponent implements OnInit {
  // =========================================
  // ROLE / USER DATA
  // =========================================
  fromDate: string = "";

  toDate: string = "";

  currentPage: number = 1;

  itemsPerPage: number = 10;

  searchBy: string = "";
  roleList: any[] = [];

  userList: any[] = [];

  // =========================================
  // DROPDOWN LISTS
  // =========================================

  companyList: any[] = [];

  dealerList: any[] = [];

  rtoList: any[] = [];

  subRtoList: any[] = [];

  m2mProviderList: any[] = [];

  certifiedAuthorityList: any[] = [];

  policeList: any[] = [];

  cityPoliceList: any[] = [];

  legalMetroList: any[] = [];

  customerList: any[] = [];

  pmcList: any[] = [];

  // =========================================
  // CURRENT SELECTION
  // =========================================

  selectedRole: any = null;

  selectedOwnerId: any = null;

  selectedRto: any = null;

  selectedUsers: any[] = [];

  // =========================================
  // ADDED DATA
  // =========================================

  addedSelections: any[] = [];

  // =========================================
  // REPORT DATA
  // =========================================

  reportData: any[] = [];

  showReport: boolean = false;

  // =========================================
  // LOADING
  // =========================================

  loadingRoles: boolean = false;

  loadingUsers: boolean = false;

  loadingReport: boolean = false;

  // =========================================
  // VISIBILITY
  // =========================================

  visibility: any = {
    company: false,

    dealer: false,

    rto: false,

    subrto: false,

    m2m: false,

    certifiedauth: false,

    police: false,

    citypolice: false,

    legalmetro: false,

    customer: false,

    pmc: false,

    certLabel: "Certified Authority",
  };

  constructor(private dashboardService: DashboardService) {}

  // =========================================
  // ON INIT
  // =========================================

  ngOnInit(): void {
    this.getRoleList();
  }

  // =========================================
  // GET ROLE LIST
  // =========================================

  getRoleList(): void {
    this.loadingRoles = true;

    this.dashboardService
      .post("https://vlts.wb.gov.in/wbsdcpsvnew/psv_get_role_roster", {})
      .subscribe({
        next: (response: any) => {
          this.loadingRoles = false;

          this.roleList = response?.entity || [];
        },

        error: (error: any) => {
          this.loadingRoles = false;

          this.roleList = [];

          console.error("ROLE API ERROR:", error);
        },
      });
  }

  // =========================================
  // ROLE CHANGE
  // =========================================

  onRoleChange(event: any): void {
    // bindValue hone par direct ID aata hai

    this.selectedRole = typeof event === "object" ? event?.param1 : event;

    console.log("SELECTED ROLE:", this.selectedRole);

    // Clear old data

    this.resetRoleWiseData();

    // Role selected nahi

    if (!this.selectedRole) {
      return;
    }

    // =====================================
    // DIRECT USER ROLES
    // ADMIN
    // =====================================

    if (["10", "24", "25"].includes(String(this.selectedRole))) {
      this.getUserList();

      return;
    }

    // =====================================
    // DEVICE MANUFACTURER
    // =====================================

    if (String(this.selectedRole) === "11") {
      this.visibility.company = true;

      this.getCompanyList();

      return;
    }

    // =====================================
    // DEALER
    // =====================================

    if (String(this.selectedRole) === "13") {
      this.visibility.company = true;

      this.visibility.dealer = true;

      this.getCompanyList();

      return;
    }

    // =====================================
    // RTO
    // =====================================

    if (String(this.selectedRole) === "18") {
      this.visibility.rto = true;

      this.getRtoList();

      return;
    }

    // =====================================
    // SUB RTO
    // =====================================

    if (String(this.selectedRole) === "19") {
      this.visibility.rto = true;

      this.visibility.subrto = true;

      this.getRtoList();

      return;
    }

    // =====================================
    // M2M
    // =====================================

    if (String(this.selectedRole) === "16") {
      this.visibility.m2m = true;

      this.getM2MList();

      return;
    }

    // =====================================
    // TESTING AGENCY
    // =====================================

    if (String(this.selectedRole) === "15") {
      this.visibility.certifiedauth = true;

      this.visibility.certLabel = "Testing Agency";

      this.getCertifiedAuthorityList();

      return;
    }

    // =====================================
    // CERTIFIED AUTHORITY
    // =====================================

    if (String(this.selectedRole) === "22") {
      this.visibility.certifiedauth = true;

      this.visibility.certLabel = "Certified Authority";

      this.getCertifiedAuthorityList();

      return;
    }

    // =====================================
    // POLICE
    // =====================================

    if (String(this.selectedRole) === "20") {
      this.visibility.police = true;

      this.getPoliceList();

      return;
    }

    // =====================================
    // CITY POLICE
    // =====================================

    if (String(this.selectedRole) === "21") {
      this.visibility.citypolice = true;

      this.getCityPoliceList();

      return;
    }

    // =====================================
    // LEGAL METROLOGY
    // =====================================

    if (String(this.selectedRole) === "23") {
      this.visibility.legalmetro = true;

      this.getLegalMetroList();

      return;
    }

    // =====================================
    // CUSTOMER
    // =====================================

    if (String(this.selectedRole) === "14") {
      this.visibility.customer = true;

      this.getCustomerList();

      return;
    }

    // =====================================
    // PMC
    // =====================================

    if (String(this.selectedRole) === "17") {
      this.visibility.pmc = true;

      this.getPmcList();

      return;
    }

    // =====================================
    // DEFAULT
    // =====================================

    this.getUserList();
  }

  // =========================================
  // COMPANY LIST
  // =========================================

  getCompanyList(): void {
    this.dashboardService
      .post(
        "https://vlts.wb.gov.in/wbsdcpsvnew/psv_get_vendor_roster?type=&stateId=",
        {},
      )
      .subscribe({
        next: (response: any) => {
          this.companyList = response?.entity || [];
        },

        error: (error: any) => {
          console.error("COMPANY API ERROR:", error);
        },
      });
  }

  // =========================================
  // COMPANY / OWNER CHANGE
  // =========================================

  onOwnerChange(): void {
    this.selectedUsers = [];

    this.userList = [];

    // =====================================
    // DEALER
    // =====================================

    if (String(this.selectedRole) === "13") {
      this.getDealerList();

      return;
    }

    // =====================================
    // GET USERS
    // =====================================

    this.getUserList();
  }

  // =========================================
  // DEALER LIST
  // =========================================

  getDealerList(): void {
    if (!this.selectedOwnerId) {
      return;
    }

    this.dashboardService
      .post(
        "https://vlts.wb.gov.in/wbsdcpsvnew/psv_get_vendordealer_roster?companyid=" +
          this.selectedOwnerId,
        {},
      )
      .subscribe({
        next: (response: any) => {
          this.dealerList = response?.entity || [];
        },

        error: (error: any) => {
          console.error("DEALER API ERROR:", error);
        },
      });
  }

  // =========================================
  // RTO LIST
  // =========================================

  getRtoList(): void {
    this.dashboardService
      .post("https://vlts.wb.gov.in/wbsdcpsvnew/psv_get_rto_roster", {})
      .subscribe({
        next: (response: any) => {
          this.rtoList = response?.entity || [];
        },

        error: (error: any) => {
          console.error("RTO API ERROR:", error);
        },
      });
  }

  // =========================================
  // RTO CHANGE
  // =========================================

  onRtoChange(event: any): void {
    this.selectedUsers = [];

    this.userList = [];

    if (!event) {
      return;
    }

    // =====================================
    // SUB RTO
    // =====================================

    if (String(this.selectedRole) === "19") {
      this.getSubRtoList(event.statecode || event.param1);

      return;
    }

    // Normal RTO User

    this.selectedOwnerId = event.param1;

    this.getUserList();
  }

  // =========================================
  // SUB RTO LIST
  // =========================================

  getSubRtoList(rtoId: any): void {
    this.dashboardService
      .post(
        "https://vlts.wb.gov.in/wbsdcpsvnew/psv_get_subrto_roster?rtoId=" +
          rtoId,
        {},
      )
      .subscribe({
        next: (response: any) => {
          this.subRtoList = response?.entity || [];
        },

        error: (error: any) => {
          console.error("SUB RTO API ERROR:", error);
        },
      });
  }

  // =========================================
  // M2M LIST
  // =========================================

  getM2MList(): void {
    this.dashboardService
      .post("https://vlts.wb.gov.in/wbsdcpsvnew/psv_get_m2mprovider_roster", {})
      .subscribe({
        next: (response: any) => {
          this.m2mProviderList = response?.entity || [];
        },
      });
  }

  // =========================================
  // CERTIFIED AUTHORITY
  // =========================================

  getCertifiedAuthorityList(): void {
    this.dashboardService
      .post(
        "https://vlts.wb.gov.in/wbsdcpsvnew/psv_get_certauthority_roster",
        {},
      )
      .subscribe({
        next: (response: any) => {
          this.certifiedAuthorityList = response?.entity || [];
        },
      });
  }

  // =========================================
  // POLICE LIST
  // =========================================

  getPoliceList(): void {
    this.dashboardService
      .post("https://vlts.wb.gov.in/wbsdcpsvnew/psv_get_police_roster", {})
      .subscribe({
        next: (response: any) => {
          this.policeList = response?.entity || [];
        },
      });
  }

  // =========================================
  // CITY POLICE LIST
  // =========================================

  getCityPoliceList(): void {
    this.dashboardService
      .post("https://vlts.wb.gov.in/wbsdcpsvnew/psv_get_citypolice_roster", {})
      .subscribe({
        next: (response: any) => {
          this.cityPoliceList = response?.entity || [];
        },
      });
  }

  // =========================================
  // LEGAL METROLOGY
  // =========================================

  getLegalMetroList(): void {
    this.dashboardService
      .post(
        "https://vlts.wb.gov.in/wbsdcpsvnew/psv_get_legalmeterology_roster",
        {},
      )
      .subscribe({
        next: (response: any) => {
          this.legalMetroList = response?.entity || [];
        },
      });
  }

  // =========================================
  // CUSTOMER
  // =========================================

  getCustomerList(): void {
    this.dashboardService
      .post(
        "https://vlts.wb.gov.in/wbsdcpsvnew/psv_get_permitholder_roster",
        {},
      )
      .subscribe({
        next: (response: any) => {
          this.customerList = response?.entity || [];
        },
      });
  }

  // =========================================
  // PMC
  // =========================================

  getPmcList(): void {
    this.dashboardService
      .post("https://vlts.wb.gov.in/wbsdcpsvnew/psv_get_pmc_roster", {})
      .subscribe({
        next: (response: any) => {
          this.pmcList = response?.entity || [];
        },
      });
  }

  // =========================================
  // GET USER LIST
  // =========================================

  getUserList(): void {
    if (!this.selectedRole) {
      return;
    }

    this.loadingUsers = true;

    const payload = {
      param1: this.selectedRole,

      param2: this.selectedOwnerId || "0",
    };

    console.log("USER API PAYLOAD:", payload);

    this.dashboardService
      .post("https://vlts.wb.gov.in/wbsdcpsvnew/psv_get_user_roster", payload)
      .subscribe({
        next: (response: any) => {
          this.loadingUsers = false;

          this.userList = response?.entity || [];

          console.log("USER API RESPONSE:", this.userList);
        },

        error: (error: any) => {
          this.loadingUsers = false;

          this.userList = [];

          console.error("USER API ERROR:", error);
        },
      });
  }

  // =========================================
  // ADD SELECTION
  // =========================================

  addSelection(): void {
    if (!this.isAddEnabled()) {
      return;
    }

    const role = this.roleList.find(
      (x) => String(x.param1) === String(this.selectedRole),
    );

    const users = this.userList.filter((x) =>
      this.selectedUsers.map(String).includes(String(x.param1)),
    );

    const owner = this.getOwnerDetails();

    const existingIndex = this.addedSelections.findIndex(
      (x) =>
        String(x.roleId) === String(this.selectedRole) &&
        String(x.ownerId) === String(this.selectedOwnerId || "0"),
    );

    const data = {
      roleId: this.selectedRole,

      roleName: role?.param2 || "NA",

      ownerId: this.selectedOwnerId || "0",

      ownerName: owner?.param2 || "NA",

      userIds: [...this.selectedUsers],

      users: users,
    };

    // =====================================
    // SAME ROLE + OWNER UPDATE
    // =====================================

    if (existingIndex !== -1) {
      this.addedSelections[existingIndex] = data;
    } else {
      this.addedSelections.push(data);
    }

    console.log("ADDED SELECTIONS:", this.addedSelections);

    // Clear current selection

    this.resetAfterAdd();
  }

  // =========================================
  // REMOVE SELECTION
  // =========================================

  removeSelection(index: number): void {
    this.addedSelections.splice(index, 1);
  }

  // =========================================
  // ADD BUTTON VALIDATION
  // =========================================

  isAddEnabled(): boolean {
    return !!this.selectedRole && this.selectedUsers.length > 0;
  }

  // =========================================
  // GET OWNER DETAILS
  // =========================================

  getOwnerDetails(): any {
    const ownerId = this.selectedOwnerId;

    const allLists = [
      this.companyList,

      this.dealerList,

      this.rtoList,

      this.subRtoList,

      this.m2mProviderList,

      this.certifiedAuthorityList,

      this.policeList,

      this.cityPoliceList,

      this.legalMetroList,

      this.customerList,

      this.pmcList,
    ];

    for (const list of allLists) {
      const item = list.find((x) => String(x.param1) === String(ownerId));

      if (item) {
        return item;
      }
    }

    return null;
  }

  // =========================================
  // SUBMIT REPORT
  // =========================================
submitReport(): void {

  // ==========================================
  // VALIDATION
  // ==========================================

  if (this.addedSelections.length === 0) {

    console.error('Please add at least one Role/User selection');

    return;

  }


  if (!this.fromDate || !this.toDate) {

    console.error('Please select From Date and To Date');

    return;

  }


  // ==========================================
  // GET ALL UNIQUE USER IDS
  // ==========================================

  const userIds = [

    ...new Set(

      this.addedSelections
        .flatMap(item => item.userIds || [])
        .map((id: any) => String(id))

    )

  ];


  // ==========================================
  // FINAL API PAYLOAD
  // ==========================================

  const payload = {

    param1: this.searchBy || '',

    param2: String(this.currentPage),

    param3: String(this.itemsPerPage),

    param4: this.fromDate,

    param5: this.toDate,

    useridlist: userIds

  };


  console.log(
    '=========================================='
  );

  console.log(
    'USER WISE ACTIVATION REPORT API PAYLOAD'
  );

  console.log(
    JSON.stringify(payload, null, 2)
  );

  console.log(
    '=========================================='
  );


  // ==========================================
  // CALL REPORT API
  // ==========================================

  this.loadingReport = true;

  this.showReport = false;

  this.reportData = [];


  this.dashboardService
    .post(
      'https://vlts.wb.gov.in/wbsdcpsvnew/userwiseactivationreport',

      payload
    )
    .subscribe({

      next: (response: any) => {

        console.log(
          'USER WISE ACTIVATION REPORT RESPONSE:',
          response
        );


        this.loadingReport = false;


        if (response?.status === true) {

          this.reportData =
            response?.entity?.listData || [];

          this.showReport = true;

        }
        else {

          this.reportData = [];

          this.showReport = true;

        }

      },


      error: (error: any) => {

        this.loadingReport = false;

        this.reportData = [];

        this.showReport = true;

        console.error(
          'USER WISE ACTIVATION REPORT API ERROR:',
          error
        );

      }

    });

}
  // =========================================
  // RESET ROLE WISE DATA
  // IMPORTANT:
  // SELECTED ROLE KO CLEAR NAHI KARNA
  // =========================================

  resetRoleWiseData(): void {
    this.selectedOwnerId = null;

    this.selectedRto = null;

    this.selectedUsers = [];

    this.userList = [];

    this.companyList = [];

    this.dealerList = [];

    this.rtoList = [];

    this.subRtoList = [];

    this.m2mProviderList = [];

    this.certifiedAuthorityList = [];

    this.policeList = [];

    this.cityPoliceList = [];

    this.legalMetroList = [];

    this.customerList = [];

    this.pmcList = [];

    this.visibility = {
      company: false,

      dealer: false,

      rto: false,

      subrto: false,

      m2m: false,

      certifiedauth: false,

      police: false,

      citypolice: false,

      legalmetro: false,

      customer: false,

      pmc: false,

      certLabel: "Certified Authority",
    };
  }

  // =========================================
  // RESET AFTER ADD
  // =========================================

  resetAfterAdd(): void {
    this.selectedRole = null;

    this.resetRoleWiseData();
  }
}
