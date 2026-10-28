import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { BaseApiService } from '../../../core/services/base-api.service';
import { ToastComponent } from '../../assets/inactive-assets/toast.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
    selector: 'app-menu-entry',
    imports: [CommonModule, FormsModule, RouterModule, NgSelectModule, ToastComponent],
    templateUrl: './menu-entry.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: []
})
export class MenuEntryComponent implements OnInit {
  activeTab: string = 'role';
  encryptUrl: string = '';

  // Dropdown selections
  selectedMenuType: string | null = null;
  selectedParentMenuId: string | null = null; // For Sub Menu parent selection
  selectedVendorId: string | null = null;
  selectedDistributorId: string | null = null;
  oemlist: any[] = [];

  dealerdetailslist: any[] = [];
  // Lists
  menuList: any[] = [];
  subMenuList: any[] = [];
  distributorlist: any[] = [];
  // Form Fields - Main Menu
  menuName: string = '';
  menuUrl: string = '';
  menuDescription: string = '';

  // Form Fields - Sub Menu
  subMenuName: string = '';
  subMenuUrl: string = '';
  subMenuDescription: string = '';

  // Edit IDs
  mainMenuId: string = '0';
  mainMenuId1: string = ''; // param6
  subMenuId: string = '0';
  subMenuId1: string = ''; // param6

  // Visibility Flags
  showMainMenuSection: boolean = false;
  showSubMenuSection: boolean = false;
  showParentMenuList: boolean = false; // The dropdown for selecting parent menu

  // Button Flags
  isEditModeMain: boolean = false;
  isEditModeSub: boolean = false;

  // --- Properties for User-wise Menu ---
  // Data lists for dropdowns
  rolewisedata: any[] = [];
  companylist: any[] = [];
  // dealerdetailslist: any[] = [];
  getrtolist: any[] = [];
  districtdata: any[] = [];
  tm2mprovider: any[] = [];
  modelnamelist: any[] = [];
  policelist: any[] = [];
  citypolicelist: any[] = [];
  legalmetrolist: any[] = [];
  customerlist: any[] = [];
  pmclist: any[] = [];
  userlist: any[] = [];
  userMenuList: any[] = [];

  // --- Properties for Role-wise Menu ---
  role_selectedRole: string | null = null;
  role_selectedMenuType: string | null = null;
  role_selectedMenuId: string | null = null;
  role_visibility: any = { menuList: false };
  role_menuList: any[] = [];
  showRoleMenuTable: boolean = false;
  role_rolemenulist: any[] = [];
  role_landingPageMenuId: string | null = null;
  isRoleWiseSubmitEnabled: boolean = false;
  selectedCompanyId = null
  // Data for the main table
  rolemenulist: any[] = [];

  // Selected values from form
  selectedRole: string | null = null;
  selectedOwnerId: string | null = null;
  selectedRto: any | null = null;
  user_selectedMenuType: string | null = null; // Renamed to avoid conflict
  user_selectedMenuId: string | null = null;   // Renamed to avoid conflict
  landingPageMenuId: string | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;


  // UI state
  showUserMenuTable = false;
  isSubmitEnabled = false;
  visibility = {
    distributor: false,
    company: false,
    dealer: false,
    rto: false,
    subrto: false,
    oem: false,
    m2m: false,
    certifiedauth: false,
    police: false,
    citypolice: false,
    legalmetro: false,
    customer: false,
    pmc: false,
    pmcuser: false,
    companyuser: false,
    menuList: false,
    certLabel: 'Certified Authority:',
    adminuser: false,
    mvi: false
  };

  roleOwnerList: any[] = [];

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private baseApiService: BaseApiService,
    private toast: ToastService
  ) {
    this.toast.pageName = 'Menu Management'; // Set page name for toast service
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.encryptUrl = params['encryptUrl'] || '';
    });

    // Initial Hide
    this.resetVisibility();
    this.getRolesForUserMenu();
  }

  resetVisibility() {
    this.showMainMenuSection = false;
    this.showSubMenuSection = false;
    this.showParentMenuList = false;
    this.isEditModeMain = false;
    this.isEditModeSub = false;
  }

  onMenuTypeChange() {
    if (this.selectedMenuType === 'Main Menu') {
      this.showMainMenuSection = true;
      this.showSubMenuSection = false;
      this.showParentMenuList = false;
      this.isEditModeMain = false;
      this.resetMainForm();
    } else if (this.selectedMenuType === 'Sub Menu') {
      this.showMainMenuSection = false;
      this.showSubMenuSection = false;
      this.showParentMenuList = true;
      this.isEditModeSub = false;
      this.resetSubForm();
    } else {
      this.resetVisibility();
    }

    this.fetchMenuList();
  }

  fetchMenuList() {
    this.baseApiService.apiCall('psv_get_menu_list', 'POST', {}).subscribe({
      next: (response: any) => {
        this.menuList = response.entity || [];
      },
      error: (error) => {
        console.error('Error fetching menu list', error);
      }
    });
  }

  onParentMenuChange() {
    if (this.selectedParentMenuId) {
      this.showMainMenuSection = false;
      this.showSubMenuSection = true;
      this.isEditModeSub = false;
      this.resetSubForm();
      this.fetchSubMenuList();
    } else {
      this.showSubMenuSection = false;
    }
  }

  fetchSubMenuList() {
    const data = { "param1": this.selectedParentMenuId };
    this.baseApiService.apiCall('psv_get_submenu_list', 'POST', data).subscribe({
      next: (response: any) => {
        this.subMenuList = response.entity || [];
      },
      error: (error) => console.error(error)
    });
  }

  // validateUrl(url: string): boolean {
  //   // Logic: URL cannot be empty. It must start with "#!/" OR be exactly "0".
  //   if (!url) return false;
  //   return url.startsWith('#!/') || url === '0';
  // }
  validateUrl(url: string): boolean {
    // Logic: URL cannot be empty. It must start with "#!/" OR be exactly "0".
    if (!url) return false;
    return url.startsWith('') || url === '';
  }
  // Main Menu Operations
  saveMainMenu() {
    if (!this.validateMainForm()) return;

    const data = {
      "param1": "MainMenu",
      "param2": "0",
      "param3": this.menuName,
      "param4": this.menuDescription,
      "param5": this.menuUrl
    };

    this.baseApiService.apiCall('psv_put_menumaster', 'POST', data).subscribe({
      next: (res: any) => {
        this.successMessage = res.entity;
        this.fetchMenuList();
        this.resetMainForm();
      },
      error: (err) => console.error(err)
    });
  }

  updateMainMenu() {
    if (!this.validateMainForm()) return;
    this.confirmAction('updatemenu', () => {
      const data = {
        "param1": "updatemenu",
        "param2": this.mainMenuId,
        "param3": this.menuName,
        "param4": this.menuDescription,
        "param5": this.menuUrl,
        "param6": this.mainMenuId1
      };
      this.baseApiService.apiCall('psv_edit_remove_menu', 'POST', data).subscribe({
        next: (res: any) => {
          this.successMessage = res.entity;
          this.fetchMenuList();
          this.backMain();
        },
        error: (err) => console.error(err)
      });
    });
  }

  deleteMainMenu() {
    if (!this.validateMainForm()) return;
    this.confirmAction('deletemenu', () => {
      const data = {
        "param1": "deletemenu",
        "param2": this.mainMenuId,
        "param3": this.menuName,
        "param4": this.menuDescription,
        "param5": this.menuUrl,
        "param6": this.mainMenuId1
      };
      this.baseApiService.apiCall('psv_edit_remove_menu', 'POST', data).subscribe({
        next: (res: any) => {
          this.successMessage = res.entity;
          this.fetchMenuList();
          this.backMain();
        },
        error: (err) => console.error(err)
      });
    });
  }

  // Sub Menu Operations
  saveSubMenu() {
    if (!this.validateSubForm()) return;

    const data = {
      "param1": "SubMenu",
      "param2": this.selectedParentMenuId,
      "param3": this.subMenuName,
      "param4": this.subMenuDescription,
      "param5": this.subMenuUrl
    };

    this.baseApiService.apiCall('psv_put_menumaster', 'POST', data).subscribe({
      next: (res: any) => {
        this.successMessage = res.entity;
        this.fetchSubMenuList();
        this.resetSubForm();
      },
      error: (err) => console.error(err)
    });
  }

  updateSubMenu() {
    if (!this.validateSubForm()) return;
    this.confirmAction('updatemenu', () => {
      const data = {
        "param1": "updatemenu",
        "param2": this.subMenuId,
        "param3": this.subMenuName,
        "param4": this.subMenuDescription,
        "param5": this.subMenuUrl,
        "param6": this.subMenuId1
      };
      this.baseApiService.apiCall('psv_edit_remove_menu', 'POST', data).subscribe({
        next: (res: any) => {
          this.successMessage = res.entity;
          this.fetchSubMenuList();
          this.backSub();
        },
        error: (err) => console.error(err)
      });
    });
  }

  deleteSubMenu() {
    if (!this.validateSubForm()) return;
    this.confirmAction('deletemenu', () => {
      const data = {
        "param1": "deletemenu",
        "param2": this.subMenuId,
        "param3": this.subMenuName,
        "param4": this.subMenuDescription,
        "param5": this.subMenuUrl,
        "param6": this.subMenuId1
      };
      this.baseApiService.apiCall('psv_edit_remove_menu', 'POST', data).subscribe({
        next: (res: any) => {
          this.successMessage = res.entity;
          this.fetchSubMenuList();
          this.backSub();
        },
        error: (err) => console.error(err)
      });
    });
  }

  editMain(item: any) {
    this.mainMenuId = item.param2;
    this.mainMenuId1 = item.param6;
    this.menuName = item.param3;
    this.menuUrl = item.param5;
    this.menuDescription = item.param4;
    this.isEditModeMain = true;
  }

  editSub(item: any) {
    this.subMenuId = item.param2;
    this.subMenuId1 = item.param6;
    this.subMenuName = item.param3;
    this.subMenuUrl = item.param5;
    this.subMenuDescription = item.param4;
    this.isEditModeSub = true;
  }

  backMain() {
    this.isEditModeMain = false;
    this.resetMainForm();
  }

  backSub() {
    this.isEditModeSub = false;
    this.resetSubForm();
  }

  resetMainForm() {
    this.menuName = '';
    this.menuUrl = '';
    this.menuDescription = '';
  }

  resetSubForm() {
    this.subMenuName = '';
    this.subMenuUrl = '';
    this.subMenuDescription = '';
  }

  validateMainForm(): boolean {
    if (!this.menuName) { this.errorMessage = ('Menu Name is required'); return false; }
    if (!this.menuUrl || !this.validateUrl(this.menuUrl)) { this.errorMessage = ('Invalid URL. Must start with #!/ or be 0'); return false; }
    if (!this.menuDescription) { this.errorMessage = ('Description is required'); return false; }
    return true;
  }

  validateSubForm(): boolean {
    if (!this.subMenuName) { this.errorMessage = ('Sub Menu Name is required'); return false; }
    if (!this.subMenuUrl || !this.validateUrl(this.subMenuUrl)) { this.errorMessage = ('Invalid URL. Must start with #!/ or be 0'); return false; }
    if (!this.subMenuDescription) { this.errorMessage = ('Description is required'); return false; }
    return true;
  }

  confirmAction(action: string, callback: () => void) {
    if (confirm(`Are you sure you want to ${action}?`)) {
      callback();
    }
  }

  // --- Methods for User-wise Menu ---

  getRolesForUserMenu(): void {
    this.baseApiService.apiCall('psv_get_role_roster', 'POST', {}).subscribe({
      next: (response: any) => {
        this.rolewisedata = response.entity || [];
      },
      error: (error) => console.error('Error fetching roles', error)
    });
  }
  roleOwnerLabel: string = ''; // Default label for ng-select
  selectedRoleOwner: any = null; // To hold the selected role owner
  roleOwnerFlag: boolean = false; // Flag to indicate if role owner is selected
  getCityRtoList: any[] = []; // To hold the list of city RTOs
  selectedCityRTOId: string | null = null; // To hold the selected city RTO ID
  onRoleOwnerChange(event: any) {
    this.userlist = [];
    this.selectedOwnerId = null;
    if (event) {
      
      const currentUserId:any = this.selectedRoleOwner.param1;
      const currentRole:any = this.selectedRole;
      let userType: any = '';
      if(currentRole=='11') {
        userType = 'companyuser';
      }
      if(currentRole=='12') {
        userType = 'distributoruser';
      }
      if(currentRole=='13') {
        userType = 'dealeruser';
      }

      this.fetchUsersForRole(currentRole, currentUserId, userType);
    }
  }
  onRoleChange(roleId: string): void {
    this.roleOwnerFlag = false;
    this.selectedOwnerId = null;
    this.selectedRoleOwner = null;
    this.userlist = [];
    this.roleOwnerList = [];
    this.resetUserWiseFormVisibility();
    const currentRole = this.selectedRole;

    if (!currentRole) {   
      return
    };
    if (currentRole === '10' || currentRole=='17' || currentRole=='25' || currentRole === '20' || currentRole === '31' || currentRole === '32' || currentRole === '33' || currentRole === '49' || currentRole === '51' || currentRole === '53' || currentRole === '54' || currentRole === '64' ||currentRole === '192') {
      this.visibility.adminuser = true;
      this.fetchUsersForRole(currentRole);
    } else {
      this.roleOwnerFlag = true;
    }
    if (currentRole=='11' || currentRole=='24') {
      this.visibility.company = true;
      this.roleOwnerLabel = currentRole== '11' ? 'Company' : 'Company User'; 
      this.fetchDataForUserMenu('psv_get_vendor_roster?type=&stateId=', 'roleOwnerList');
    }
    if (currentRole=='12') {
      // this.visibility.company = true;
      // this.roleOwnerFlag = true;
      this.roleOwnerLabel = 'Distributor';
      this.visibility.distributor=true; 
      this.fetchDataForUserMenu('psv_get_vendor_roster?type=&stateId=', 'companylist');
    }
    if(currentRole=='13') {
      // this.roleOwnerFlag = true;
      this.roleOwnerLabel = 'Dealer';
      this.visibility.distributor=true; 
      this.visibility.dealer=true;
      this.fetchDataForUserMenu('psv_get_vendor_roster?type=&stateId=', 'companylist');
    }
    if(currentRole=='14') {
      this.fetchDataForUserMenu('psv_get_permitholder_roster', 'roleOwnerList'); 
    }
    if(currentRole=='15') {
      // this.roleOwnerFlag = true;
      this.roleOwnerLabel = 'Test Agency';
      this.fetchDataForUserMenu('psv_get_certauthority_roster', 'roleOwnerList');
    }
    if(currentRole=='16') {
        this.roleOwnerLabel = 'M2M Provider';
        this.fetchDataForUserMenu('psv_get_m2mprovider_roster', 'roleOwnerList');
    }
    // if(currentRole=='17' || currentRole=='25' ) {
    //     this.roleOwnerLabel = currentRole=='17' ? 'PMC' : 'PMC User';
    //     this.fetchDataForUserMenu('psv_get_pmc_roster', 'roleOwnerList');
    // }
    if(currentRole=='18') {
        this.roleOwnerLabel = 'RTO';
        this.fetchDataForUserMenu('psv_get_rto_roster', 'roleOwnerList');
    }
    if(currentRole=='19') {
        this.roleOwnerLabel = 'City RTO';
        this.visibility.subrto = true;
        this.fetchDataForUserMenu('psv_get_rto_roster', 'getrtolist');
    }
    if(currentRole=='21') {
        this.roleOwnerLabel = 'City Police';
        this.fetchDataForUserMenu('psv_get_citypolice_roster', 'roleOwnerList')
    }
     if(currentRole=='22') {
        this.roleOwnerLabel = 'Certificate Authority';
        this.fetchDataForUserMenu('psv_get_certauthority_roster', 'roleOwnerList');
    }
    if(currentRole=='23') {
        this.roleOwnerLabel = 'Legal Metrology';
        this.fetchDataForUserMenu('psv_get_legalmeterology_roster', 'roleOwnerList');
    }
    if(currentRole=='61') {
        this.roleOwnerLabel = 'OEM';
        this.fetchDataForUserMenu('oemlist', 'roleOwnerList');
    }
    if(currentRole=='191') {
        this.roleOwnerLabel = 'MVI';
        this.visibility.mvi = true;
        this.roleOwnerFlag = false;
        this.fetchDataForUserMenu(`psv_get_subrto_roster?rtoId=34`, 'getCityRtoList');
    }
    
   




    
    
    
    // this.visibility.certLabel = currentRole === '22' ? 'Certified Authority:' : 'Testing Agency:';
      
    // const roleActions: { [key: string]: () => void } = {
    //   '61': () => {
    //     this.visibility.oem = true;

    //     const payload = {
    //       rtoid: {},
    //       pagename: 'User Creation'
    //     };

    //     this.baseApiService.apiCall(
    //       'oemlist',
    //       'POST',
    //       payload
    //     ).subscribe({
    //       next: (response: any) => {
    //         this.oemlist = response.entity || [];
    //       },
    //       error: (error) => {
    //         console.error('Error fetching OEM list', error);
    //         this.oemlist = [];
    //       }
    //     });
    //   },
    //   '12': () => {
    //     this.visibility.company = true;

    //     this.fetchDataForUserMenu(
    //       'psv_get_vendor_roster?type=&stateId=',
    //       'companylist'
    //     );
    //   },
    //   '11': () => { this.visibility.company = true; this.fetchDataForUserMenu('psv_get_vendor_roster?type=&stateId=', 'companylist'); },
    //   '13': () => {
    //     this.visibility.company = true;
    //     this.visibility.distributor = true;
    //     this.visibility.dealer = false;

    //     this.fetchDataForUserMenu(
    //       'psv_get_vendor_roster?type=&stateId=',
    //       'companylist'
    //     );
    //   },
    //   '18': () => { this.visibility.rto = true; this.fetchDataForUserMenu('psv_get_rto_roster', 'getrtolist'); },
    //   '19': () => { this.visibility.rto = true; this.visibility.subrto = true; this.fetchDataForUserMenu('psv_get_rto_roster', 'getrtolist'); },
    //   '16': () => { this.visibility.m2m = true; this.fetchDataForUserMenu('psv_get_m2mprovider_roster', 'tm2mprovider'); },
    //   '15': () => { this.visibility.certifiedauth = true; this.fetchDataForUserMenu('psv_get_certauthority_roster', 'modelnamelist'); },
    //   '22': () => { this.visibility.certifiedauth = true; this.fetchDataForUserMenu('psv_get_certauthority_roster', 'modelnamelist'); },
    //   '20': () => { this.visibility.police = true; this.fetchDataForUserMenu('psv_get_police_roster', 'policelist'); },
    //   '21': () => { this.visibility.citypolice = true; this.fetchDataForUserMenu('psv_get_citypolice_roster', 'citypolicelist'); },
    //   '23': () => { this.visibility.legalmetro = true; this.fetchDataForUserMenu('psv_get_legalmeterology_roster', 'legalmetrolist'); },
    //   '14': () => { this.visibility.customer = true; this.fetchDataForUserMenu('psv_get_permitholder_roster', 'customerlist'); },
    //   '17': () => { this.visibility.pmc = true; this.fetchDataForUserMenu('psv_get_pmc_roster', 'pmclist'); },
    //   '24': () => { this.visibility.companyuser = true; this.fetchUsersForRole(currentRole); },
    //   '25': () => { this.visibility.pmcuser = true; this.fetchUsersForRole(currentRole); },
    //   '10': () => { this.visibility.adminuser = true; this.fetchUsersForRole(currentRole); },
    // };

    // if (roleActions[currentRole]) {
    //     roleActions[currentRole]();
    //     console.log(roleActions[currentRole]);
    // } else if (currentRole && currentRole !== '10') { // Assuming '10' is a role to ignore
    //   alert('Please select other role');
    // }
  }
  onChangeCityRTO(event: any) {
    this.userlist = [];
    this.selectedOwnerId = null;
    if(event) {
      this.userlist = [];
      this.selectedOwnerId = null;
      const rtoId = event;
      // this.getMVIList(rtoId);
      const currentRoleId:any = this.selectedRole;
      let userType: any = '';
      this.fetchUsersForRole(currentRoleId, rtoId, userType);
    }
  }
  onChangeCompany(event: any) {
    this.userlist = [];
    this.selectedOwnerId = null;

    if(event) {
      if(this.selectedRole == '12'|| this.selectedRole == '13') {
        this.getDistributorList(event)
      }
    }
  }
  onChangeDistributor(event: any) {
    this.userlist = [];
    this.selectedOwnerId = null;
    if(event) {
    const vendorId = this.selectedCompanyId;
    const distributorId = event;
    this.fetchDataForUserMenu(
        `psv_get_vendordealer_roster?companyid=${vendorId}&vendorid=${vendorId}&distributorid=${distributorId}`,
        'roleOwnerList'
      );
    } else {
      this.roleOwnerList = [];
    }
  }

  getMVIList(rtoId: string = ''){
    this.userlist = [];
    this.selectedOwnerId = null;
   const payload = {"rtoid": rtoId};
       this.baseApiService.apiCall('mvilist',
        'POST',
        payload
      ).subscribe({
        next: (response: any) => {
          this.roleOwnerList = response.entity || [];
        },
        error: (error) => {
          console.error('Error fetching MVI list', error);
          this.roleOwnerList = [];
        }
      })
    }

  getDistributorList(event: any): void {
    this.userlist = [];
    this.selectedOwnerId = null;
    const companyId = event;
    
      const payload = {
        vendorid: companyId
      };
    this.baseApiService.apiCall('psv_distributorlist',
        'POST',
        payload
      ).subscribe({
        next: (response: any) => {
          if(this.selectedRole == '12') {
            this.roleOwnerList = response.entity || [];
          } else {
            this.distributorlist = response.entity || [];
          }
        },
        error: (error) => {
          console.error('Error fetching distributor list', error);
          this.roleOwnerList = [];
          this.distributorlist = [];
        }
      });
  }
  selectedRTOId: string | null = null; // To hold the selected RTO ID
  onChangeRTO(event: any) {
    this.userlist = [];
    this.selectedOwnerId = null;
    if(event) {
      const statecode = event; // Assumes 'statecode' property exists on the RTO object
      this.fetchDataForUserMenu(`psv_get_subrto_roster?rtoId=${statecode}`, 'roleOwnerList');
    }
  }
  // onCompanyChange(event: any): void {
  //   if (!event) {
  //     this.selectedCompanyId = null;
  //     this.selectedOwnerId = null;
  //     this.distributorlist = [];
  //     this.visibility.distributor = false;
  //     return;
  //   }

  //   const companyId = event.param1;

  //   // Keep Company selected
  //   this.selectedCompanyId = companyId;

  //   // For normal company role
  //   if (this.selectedRole !== '12') {
  //     this.selectedOwnerId = companyId;
  //   }

  //   // Distributor role
  //   if (this.selectedRole === '12') {
  //     this.selectedOwnerId = null;
  //     this.visibility.distributor = true;

  //    const payload = {
  //   vendorid: companyId
  // };

  // this.baseApiService.apiCall(
  //   'psv_distributorlist',
  //   'POST',
  //   payload
  // ).subscribe({
  //   next: (response: any) => {
  //     this.distributorlist = response.entity || [];
  //   },
  //   error: (error) => {
  //     console.error('Error fetching distributor list', error);
  //     this.distributorlist = [];
  //   }
  // });
  //   }
  // }
  onCompanyChange(event: any): void {
    if (!event) {
      this.selectedCompanyId = null;
      this.selectedVendorId = null;
      this.selectedDistributorId = null;
      this.selectedOwnerId = null;

      this.distributorlist = [];
      this.dealerdetailslist = [];

      this.visibility.distributor = false;
      this.visibility.dealer = false;

      return;
    }

    const companyId = event.param1;

    this.selectedCompanyId = companyId;
    this.selectedVendorId = companyId;

    // =========================
    // ROLE 12 - DISTRIBUTOR
    // =========================
    if (this.selectedRole === '12') {

      this.selectedOwnerId = null;
      this.selectedDistributorId = null;

      this.visibility.distributor = true;
      this.visibility.dealer = false;

      const payload = {
        vendorid: companyId
      };

      this.baseApiService.apiCall(
        'psv_distributorlist',
        'POST',
        payload
      ).subscribe({
        next: (response: any) => {
          this.distributorlist = response.entity || [];
        },
        error: (error) => {
          console.error('Error fetching distributor list', error);
          this.distributorlist = [];
        }
      });
    }

    // =========================
    // ROLE 13 - DEALER
    // =========================
    else if (this.selectedRole === '13') {

      this.selectedOwnerId = null;
      this.selectedDistributorId = null;

      this.visibility.distributor = true;
      this.visibility.dealer = false;

      const payload = {
        vendorid: companyId
      };

      this.baseApiService.apiCall(
        'psv_distributorlist',
        'POST',
        payload
      ).subscribe({
        next: (response: any) => {
          this.distributorlist = response.entity || [];
        },
        error: (error) => {
          console.error('Error fetching distributor list', error);
          this.distributorlist = [];
        }
      });
    }

    // =========================
    // OTHER COMPANY ROLES
    // =========================
    else {
      this.selectedOwnerId = companyId;
    }
  }
  onRtoChange(event: any): void {
    if (!event) {
      this.districtdata = [];
      this.selectedOwnerId = null;
      return;
    }
    this.selectedOwnerId = event.param1;
    const statecode = event.param3; // Assumes 'statecode' property exists on the RTO object
    console.log('Selected RTO State Code:', event);
    this.fetchDataForUserMenu(`psv_get_subrto_roster?rtoId=${statecode}`, 'districtdata');
  }

  onUserMenuTypeChange(): void {
    this.showUserMenuTable = false;
    if (this.user_selectedMenuType === 'Sub Menu') {
      this.visibility.menuList = true;
      this.fetchMenusForUser();
    } else {
      this.visibility.menuList = false;
      this.user_selectedMenuId = null;
    }
  }

  onViewClick(): void {
    if (!this.isViewButtonEnabled()) {
      this.errorMessage = ('Please fill all required fields.');
      return;
    }
    this.showUserMenuTable = true;
    this.getUsermenudetails();
  }

  getUsermenudetails(): void {
    const menuId = this.user_selectedMenuType === 'Main Menu' ? '0' : this.user_selectedMenuId;
    const payload = {
      param1: this.selectedRole,
      param2: this.selectedOwnerId,
      param3: menuId
    };

    this.baseApiService.apiCall('psv_get_rolemenudetails', 'POST', payload).subscribe({
      next: (response: any) => {
        this.rolemenulist = (response.entity || []).map((item: any) => ({
          ...item,
          param7: item.param7 === 'true',
          param9: item.param9 === 'true'
        }));
        const landingPage = this.rolemenulist.find(item => item.param9);
        if (landingPage) {
          this.landingPageMenuId = landingPage.param2;
        }
        this.isSubmitEnabled = false;
      },
      error: (error) => console.error('Error fetching user menu details', error)
    });
  }

  assignUserRoleData(): void {
    if (this.rolemenulist.some(item => item.param7 && !item.param6)) {
      this.errorMessage = ('Order number should not be blank for selected menus.');
      return;
    }
    const payload = this.rolemenulist.map(item => ({
      param1: item.param2,
      param2: this.selectedRole,
      param3: item.param7,
      param4: item.param6,
      param5: this.selectedOwnerId,
      param6: this.landingPageMenuId === item.param2
    }));

    this.baseApiService.apiCall('psv_put_roleUserMenu', 'POST', payload).subscribe({
      next: (res: any) => {
        this.successMessage = (res.entity);
        this.getUsermenudetails();
      },
      error: (err) => console.error('Error assigning user role', err)
    });
  }

  onCheckboxChange(item: any): void {
    this.isSubmitEnabled = true;
    if (!item.param7 && this.landingPageMenuId === item.param2) {
      this.landingPageMenuId = null;
    }
  }

  onOrderBlur(item: any): void {
    this.isSubmitEnabled = true;
    if (!item.param7) {
      this.errorMessage = ('Please select checkbox first.');
      return;
    }
    if (!item.param6) {
      this.errorMessage = ('Order number should not be blank.');
      return;
    }
    if (this.rolemenulist.some(i => i !== item && i.param7 && i.param6 === item.param6)) {
      this.errorMessage = ('Order number should not be the same.');
    }
  }

  private resetUserWiseFormVisibility(): void {
    Object.keys(this.visibility).forEach(k => { (this.visibility as any)[k] = false; });
    this.selectedOwnerId = null;
    this.selectedRto = null;
    this.user_selectedMenuType = null;
    this.user_selectedMenuId = null;
    this.showUserMenuTable = false;
    this.rolemenulist = [];


    this.roleOwnerFlag = false;
  }

  private fetchDataForUserMenu(endpoint: string, targetProperty: keyof this): void {
    this.baseApiService.apiCall(endpoint, 'POST', {}).subscribe({
      next: (response: any) => { (this as any)[targetProperty] = response.entity || []; },
      error: (error) => console.error(`Error fetching ${String(targetProperty)}`, error)
    });
  }

  private fetchUsersForRole(roleId: string, roleOwnerid?: string, usertype?: string): void {
    const payload = { param1: roleId, param2:'0', param3: roleOwnerid || '0',param4: usertype || '' };
    this.baseApiService.apiCall('psv_get_user_roster', 'POST', payload).subscribe({
      next: (response: any) => { this.userlist = response.entity || []; },
      error: (error) => console.error('Error fetching users for role', error)
    });
  }

  private fetchMenusForUser(): void {
    if (!this.selectedRole) {
      this.userMenuList = [];
      return;
    }
    const payload = { param1: this.selectedOwnerId, param2: this.selectedRole };
    this.baseApiService.apiCall('psv_get_homemenu_listassign', 'POST', payload).subscribe({
      next: (response: any) => { this.userMenuList = response.entity || []; },
      error: (error) => console.error('Error fetching menus for user', error)
    });
  }

  isViewButtonEnabled(): boolean {
    if (!this.selectedRole || !this.selectedOwnerId || !this.user_selectedMenuType) return false;
    if (this.user_selectedMenuType === 'Sub Menu' && !this.user_selectedMenuId) return false;
    return true;
  }

  // --- Methods for Role-wise Menu ---

  onRoleWiseMenuTypeChange() {
    this.showRoleMenuTable = false;
    this.role_rolemenulist = [];
    if (this.role_selectedMenuType === 'Sub Menu') {
      this.role_visibility.menuList = true;
      this.fetchRoleWiseMenus();
    } else {
      this.role_visibility.menuList = false;
      this.role_selectedMenuId = null;
    }
  }

  fetchRoleWiseMenus() {
    if (!this.role_selectedRole) {
      return;
    }
    const payload = { param1: "0", param2: this.role_selectedRole };
    this.baseApiService.apiCall('psv_get_homemenu_listassign', 'POST', payload).subscribe({
      next: (response: any) => {
        this.role_menuList = response.entity || [];
      },
      error: (error) => console.error('Error fetching role menus', error)
    });
  }

  onRoleWiseViewClick() {
    if (!this.role_selectedRole) {
      this.errorMessage = ('Please select a role.');
      return;
    }
    if (this.role_selectedMenuType === 'Sub Menu' && !this.role_selectedMenuId) {
      this.errorMessage = ('Please select a menu.');
      return;
    }
    this.getRoleWiseMenuDetails();
  }

  getRoleWiseMenuDetails() {
    const menuId = this.role_selectedMenuType === 'Main Menu' ? '0' : this.role_selectedMenuId;
    const payload = {
      param1: this.role_selectedRole,
      param2: "0",
      param3: menuId
    };

    this.baseApiService.apiCall('psv_get_rolemenudetails', 'POST', payload).subscribe({
      next: (response: any) => {
        this.role_rolemenulist = (response.entity || []).map((item: any) => ({
          ...item,
          param7: item.param7 === 'true'
        }));

        this.role_landingPageMenuId = null;
        this.showRoleMenuTable = true;
        this.checkIfRoleWiseSubmitEnabled();
      },
      error: (error) => console.error('Error fetching role menu details', error)
    });
  }

  onRoleWiseCheckboxChange(item: any) {
    if (!item.param7) {
      item.param6 = '';
      if (this.role_landingPageMenuId === item.param2) {
        this.role_landingPageMenuId = null;
      }
    } else {
      // Auto-increment order logic
      const existingOrders = this.role_rolemenulist
        .filter(x => x.param6 && !isNaN(x.param6))
        .map(x => parseInt(x.param6, 10));
      const maxOrder = existingOrders.length > 0 ? Math.max(...existingOrders) : 0;
      item.param6 = (maxOrder + 1).toString();
    }
    this.checkIfRoleWiseSubmitEnabled();
  }

  onRoleWiseOrderBlur(item: any) {
    if (item.param7 && !item.param6) {
      this.errorMessage = ('Order number should not be blank');
    }
    const isDuplicate = this.role_rolemenulist.some(other =>
      other !== item && other.param7 && other.param6 === item.param6
    );
    if (isDuplicate) {
      this.errorMessage = ('Order number should not be same');
      item.param6 = '';
    }
    this.checkIfRoleWiseSubmitEnabled();
  }

  checkIfRoleWiseSubmitEnabled() {
    const selectedItems = this.role_rolemenulist.filter(item => item.param7);
    const hasLandingPage = !!this.role_landingPageMenuId;
    const allHaveOrders = selectedItems.every(item => item.param6 && item.param6.trim() !== '');
    this.isRoleWiseSubmitEnabled = selectedItems.length > 0 && hasLandingPage && allHaveOrders;
  }

  assignRoleMenuData() {
    // if (!this.isRoleWiseSubmitEnabled) return;

    const payload = this.role_rolemenulist.map(item => ({
      param1: item.param2, // mainid
      param2: this.role_selectedRole, // roleid
      param3: item.param7, // status
      param4: item.param6 || '0', // orderno
      param5: this.role_landingPageMenuId === item.param2 // landingpagemenuid
    }));

    this.baseApiService.apiCall('psv_put_roleMenu', 'POST', payload).subscribe({
      next: (response: any) => {
        this.successMessage = (response.etity);
        this.showRoleMenuTable = false;
        this.role_rolemenulist = [];
        this.role_landingPageMenuId = null;
        this.role_selectedRole = null;
        this.role_selectedMenuType = null;
        this.role_selectedMenuId = null;
      },
      error: (error) => console.error('Error saving role menu', error)
    });
  }
  onDistributorChange(event: any): void {

    if (!event) {
      this.selectedDistributorId = null;
      this.selectedOwnerId = null;
      this.dealerdetailslist = [];
      this.visibility.dealer = false;
      return;
    }

    const distributorId = event.param1;

    this.selectedDistributorId = distributorId;

    // Only Dealer role needs dealer list
    if (this.selectedRole === '13') {

      const vendorId = this.selectedVendorId;

      if (!vendorId) {
        return;
      }

      this.selectedOwnerId = null;

      this.fetchDataForUserMenu(
        `psv_get_vendordealer_roster?companyid=${vendorId}&vendorid=${vendorId}&distributorid=${distributorId}`,
        'dealerdetailslist'
      );

      this.visibility.dealer = true;
    }

    // Role 12 = Distributor
    else if (this.selectedRole === '12') {
      this.selectedOwnerId = distributorId;
    }
  }
}