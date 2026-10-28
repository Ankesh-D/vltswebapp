import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

/**
 * ============================================================================
 *  DEALER DASHBOARD — PRODUCTION-READY, API-FREE VERSION
 * ============================================================================
 *  This component contains ZERO backend dependencies:
 *   - no HttpClient / API services
 *   - no subscriptions / observables to remote endpoints
 *   - no auth/API tokens
 *
 *  All data lives in `MOCK_VEHICLES` below. When you're ready to connect a
 *  real API, replace `loadVehicles()` with your service call and keep
 *  everything else (filtering, pagination, badges, modal) as-is — it all
 *  operates on the `vehicles` array regardless of where it came from.
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// MODELS
// ---------------------------------------------------------------------------

export type DeviceStatus = 'Active' | 'Inactive' | 'Pending' | 'Expired' | 'Renewal Due';
export type SimStatus = 'SIM Active' | 'SIM Expired';

export interface Vehicle {
  vehicleNumber: string;
  imei: string;
  ownerName: string;
  mobileNumber: string;
  rto: string;
  deviceStatus: DeviceStatus;
  simStatus: SimStatus;
  activationDate: string;      // DD-MMM-YYYY
  validity: string;            // DD-MMM-YYYY
  lastCommunication: string;   // DD-MMM-YYYY hh:mm A
}

export interface KpiCard {
  key: string;
  label: string;
  description: string;
  count: number;
  icon: string;
  colorClass: string;
}

interface DropdownOption {
  label: string;
  value: string;
}

// ---------------------------------------------------------------------------
// MOCK DATA — replace with real API response later
// ---------------------------------------------------------------------------

const MOCK_VEHICLES: Vehicle[] = [
  { vehicleNumber: 'MP09AB1234', imei: '860187061298430', ownerName: 'Rajesh Sharma',      mobileNumber: '9826012345', rto: 'Indore RTO',     deviceStatus: 'Active',       simStatus: 'SIM Active',  activationDate: '22-Apr-2025', validity: '21-Apr-2027', lastCommunication: '19-Aug-2026 04:12 PM' },
  { vehicleNumber: 'MP09CD5678', imei: '868613060249118', ownerName: 'Sunita Verma',        mobileNumber: '9893045678', rto: 'Indore RTO',     deviceStatus: 'Active',       simStatus: 'SIM Active',  activationDate: '05-Jun-2024', validity: '04-Jun-2027', lastCommunication: '19-Aug-2026 03:58 PM' },
  { vehicleNumber: 'MP13EF9012', imei: '352353085463427', ownerName: 'Amit Patel',          mobileNumber: '9977012399', rto: 'Ujjain RTO',     deviceStatus: 'Pending',      simStatus: 'SIM Active',  activationDate: '18-Oct-2019', validity: '17-Oct-2022', lastCommunication: '—' },
  { vehicleNumber: 'MP20GH3456', imei: '860187098234561', ownerName: 'Deepak Chouhan',      mobileNumber: '9755098123', rto: 'Dewas RTO',      deviceStatus: 'Inactive',     simStatus: 'SIM Expired', activationDate: '15-Jan-2023', validity: '14-Jan-2025', lastCommunication: '02-Mar-2025 11:20 AM' },
  { vehicleNumber: 'MP09JK7890', imei: '868613097234562', ownerName: 'Priya Joshi',         mobileNumber: '9926045612', rto: 'Indore RTO',     deviceStatus: 'Active',       simStatus: 'SIM Active',  activationDate: '14-Jul-2024', validity: '13-Jul-2027', lastCommunication: '19-Aug-2026 01:44 PM' },
  { vehicleNumber: 'MP41LM2468', imei: '352353012349876', ownerName: 'Manoj Rathore',       mobileNumber: '9109876543', rto: 'Ratlam RTO',     deviceStatus: 'Renewal Due',  simStatus: 'SIM Active',  activationDate: '13-Sep-2023', validity: '12-Sep-2026', lastCommunication: '18-Aug-2026 09:10 AM' },
  { vehicleNumber: 'MP43NP1357', imei: '860187055671234', ownerName: 'Kavita Solanki',      mobileNumber: '9302234567', rto: 'Mandsaur RTO',   deviceStatus: 'Active',       simStatus: 'SIM Active',  activationDate: '12-Feb-2025', validity: '11-Feb-2028', lastCommunication: '19-Aug-2026 02:05 PM' },
  { vehicleNumber: 'MP09QR8642', imei: '868613044567891', ownerName: 'Vikram Yadav',        mobileNumber: '9977123456', rto: 'Indore RTO',     deviceStatus: 'Active',       simStatus: 'SIM Active',  activationDate: '11-Nov-2024', validity: '10-Nov-2027', lastCommunication: '19-Aug-2026 12:30 PM' },
  { vehicleNumber: 'MP07ST9988', imei: '352353067891234', ownerName: 'Neha Agrawal',        mobileNumber: '9826145678', rto: 'Bhopal RTO',     deviceStatus: 'Expired',      simStatus: 'SIM Expired', activationDate: '20-May-2022', validity: '19-May-2025', lastCommunication: '01-Jun-2025 06:15 PM' },
  { vehicleNumber: 'MP04UV5544', imei: '860187033456789', ownerName: 'Ramesh Tiwari',       mobileNumber: '9098765432', rto: 'Bhopal RTO',     deviceStatus: 'Active',       simStatus: 'SIM Active',  activationDate: '02-Mar-2025', validity: '01-Mar-2028', lastCommunication: '19-Aug-2026 10:52 AM' },
  { vehicleNumber: 'MP14WX3322', imei: '868613078901234', ownerName: 'Anjali Mishra',       mobileNumber: '9302098765', rto: 'Ujjain RTO',     deviceStatus: 'Pending',      simStatus: 'SIM Active',  activationDate: '29-Jul-2025', validity: '28-Jul-2028', lastCommunication: '—' },
  { vehicleNumber: 'MP09YZ7711', imei: '352353098761234', ownerName: 'Suresh Kumawat',      mobileNumber: '9755234567', rto: 'Indore RTO',     deviceStatus: 'Active',       simStatus: 'SIM Active',  activationDate: '17-Dec-2024', validity: '16-Dec-2027', lastCommunication: '19-Aug-2026 08:40 AM' },
  { vehicleNumber: 'MP20AA1199', imei: '860187012349988', ownerName: 'Pooja Malviya',       mobileNumber: '9109098123', rto: 'Dewas RTO',      deviceStatus: 'Renewal Due',  simStatus: 'SIM Active',  activationDate: '08-Sep-2023', validity: '07-Sep-2026', lastCommunication: '17-Aug-2026 05:22 PM' },
  { vehicleNumber: 'MP41BB4433', imei: '868613055678234', ownerName: 'Ashok Bhati',         mobileNumber: '9926234567', rto: 'Ratlam RTO',     deviceStatus: 'Inactive',     simStatus: 'SIM Expired', activationDate: '25-Apr-2022', validity: '24-Apr-2025', lastCommunication: '10-May-2025 02:11 PM' },
  { vehicleNumber: 'MP43CC8877', imei: '352353045612398', ownerName: 'Sneha Rajput',        mobileNumber: '9977345678', rto: 'Mandsaur RTO',   deviceStatus: 'Active',       simStatus: 'SIM Active',  activationDate: '03-Jun-2025', validity: '02-Jun-2028', lastCommunication: '19-Aug-2026 07:15 AM' },
  { vehicleNumber: 'MP09DD2266', imei: '860187099887766', ownerName: 'Rahul Gupta',         mobileNumber: '9302345678', rto: 'Indore RTO',     deviceStatus: 'Active',       simStatus: 'SIM Active',  activationDate: '19-Jan-2025', validity: '18-Jan-2028', lastCommunication: '19-Aug-2026 06:48 AM' },
  { vehicleNumber: 'MP07EE5599', imei: '868613066554433', ownerName: 'Meena Chourasia',     mobileNumber: '9826456789', rto: 'Bhopal RTO',     deviceStatus: 'Expired',      simStatus: 'SIM Expired', activationDate: '11-Aug-2021', validity: '10-Aug-2024', lastCommunication: '15-Sep-2024 03:33 PM' },
  { vehicleNumber: 'MP14FF3388', imei: '352353011223344', ownerName: 'Naresh Panwar',       mobileNumber: '9109345678', rto: 'Ujjain RTO',     deviceStatus: 'Pending',      simStatus: 'SIM Active',  activationDate: '30-Jul-2025', validity: '29-Jul-2028', lastCommunication: '—' },
  { vehicleNumber: 'MP04GG7722', imei: '860187044556677', ownerName: 'Kiran Bansal',        mobileNumber: '9977456789', rto: 'Bhopal RTO',     deviceStatus: 'Active',       simStatus: 'SIM Active',  activationDate: '14-Feb-2025', validity: '13-Feb-2028', lastCommunication: '19-Aug-2026 05:03 AM' },
  { vehicleNumber: 'MP20HH9911', imei: '868613033445566', ownerName: 'Sanjay Bairagi',      mobileNumber: '9755567890', rto: 'Dewas RTO',      deviceStatus: 'Renewal Due',  simStatus: 'SIM Active',  activationDate: '21-Sep-2023', validity: '20-Sep-2026', lastCommunication: '16-Aug-2026 11:59 PM' }
];

const STATUS_OPTIONS: DropdownOption[] = [
  { label: 'All Statuses', value: 'All' },
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Expired', value: 'Expired' },
  { label: 'Renewal Due', value: 'Renewal Due' }
];

const VALIDITY_OPTIONS: DropdownOption[] = [
  { label: 'All Validity', value: 'All' },
  { label: 'Valid (> 30 days)', value: 'Valid' },
  { label: 'Expiring Soon (≤ 30 days)', value: 'ExpiringSoon' },
  { label: 'Expired', value: 'Expired' }
];

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

@Component({
  selector: 'app-dealer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './delear-dashboard.component.html',
  styleUrl: './delear-dashboard.component.scss'
})
export class DealerDashboardComponent implements OnInit {
openQuickLink(type: string): void {
  switch (type) {
    case 'activation':
      this.showActionNotice('Vehicle Activation selected.');
      break;

    case 'renewal':
      this.showActionNotice('Vehicle Renewal selected.');
      break;

    case 'replacement':
      this.showActionNotice('Device Replacement selected.');
      break;

    case 'support':
      this.showActionNotice('Download Recipt.');
      break;

    default:
      break;
  }
}
  // -------------------------------------------------------------------------
  // STATIC / MOCK DATA (no API)
  // -------------------------------------------------------------------------
  dealerName = 'Patronus Auto Pvt Ltd';
  dealerCode = 'PATR';
  todayDate = new Date();

  vehicles: Vehicle[] = MOCK_VEHICLES;
  filteredVehicles: Vehicle[] = [];
  pagedVehicles: Vehicle[] = [];

  statusOptions = STATUS_OPTIONS;
  validityOptions = VALIDITY_OPTIONS;
  pageSizeOptions = PAGE_SIZE_OPTIONS;
  rtoOptions: DropdownOption[] = [];

  // -------------------------------------------------------------------------
  // FILTER / SEARCH STATE
  // -------------------------------------------------------------------------
  searchTerm = '';
  selectedStatus = 'All';
  selectedRto = 'All';
  selectedValidity = 'All';

  // -------------------------------------------------------------------------
  // PAGINATION STATE
  // -------------------------------------------------------------------------
  currentPage = 1;
  pageSize = 10;
  totalRecords = 0;

  // -------------------------------------------------------------------------
  // MODAL STATE (local only — no API)
  // -------------------------------------------------------------------------
  showDetailsModal = false;
  selectedVehicle: Vehicle | null = null;
  actionNotice: string | null = null;

  // -------------------------------------------------------------------------
  // KPI CARDS
  // -------------------------------------------------------------------------
  kpiCards: KpiCard[] = [];

  ngOnInit(): void {
    this.rtoOptions = this.buildRtoOptions();
    this.applyFilters();
    this.buildKpiCards();
  }

  // ===========================================================================
  // KPI CALCULATION
  // ===========================================================================
  private buildKpiCards(): void {
    const total = this.vehicles.length;
    const active = this.vehicles.filter(v => v.deviceStatus === 'Active').length;
    const inactive = this.vehicles.filter(v => v.deviceStatus === 'Inactive').length;
    const pending = this.vehicles.filter(v => v.deviceStatus === 'Pending').length;
    const expiredOrRenewal = this.vehicles.filter(
      v => v.deviceStatus === 'Expired' || v.deviceStatus === 'Renewal Due'
    ).length;

    this.kpiCards = [
      { key: 'total',    label: 'Total Vehicles',        description: 'All registered vehicles',   count: total,           icon: 'bx bx-car',            colorClass: 'kpi-blue' },
      { key: 'active',   label: 'Active Vehicles',       description: 'Currently active & tracking', count: active,        icon: 'bx bx-check-circle',   colorClass: 'kpi-green' },
      { key: 'inactive', label: 'Inactive Vehicles',     description: 'Device / SIM inactive',       count: inactive,      icon: 'bx bx-x-circle',       colorClass: 'kpi-gray' },
      { key: 'pending',  label: 'Pending / Under Process', description: 'Awaiting activation',       count: pending,       icon: 'bx bx-time-five',      colorClass: 'kpi-orange' },
      { key: 'expiry',   label: 'Expired / Renewal Due', description: 'Needs renewal attention',     count: expiredOrRenewal, icon: 'bx bx-error',        colorClass: 'kpi-red' }
    ];
  }

  private buildRtoOptions(): DropdownOption[] {
    const uniqueRtos = Array.from(new Set(this.vehicles.map(v => v.rto))).sort();
    return [
      { label: 'All RTOs', value: 'All' },
      ...uniqueRtos.map(r => ({ label: r, value: r }))
    ];
  }

  // ===========================================================================
  // FILTERING
  // ===========================================================================
  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'All';
    this.selectedRto = 'All';
    this.selectedValidity = 'All';
    this.currentPage = 1;
    this.applyFilters();
  }

  private applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();

    this.filteredVehicles = this.vehicles.filter(v => {
      const matchesSearch =
        !term ||
        v.vehicleNumber.toLowerCase().includes(term) ||
        v.imei.toLowerCase().includes(term) ||
        v.ownerName.toLowerCase().includes(term);

      const matchesStatus = this.selectedStatus === 'All' || v.deviceStatus === this.selectedStatus;
      const matchesRto = this.selectedRto === 'All' || v.rto === this.selectedRto;
      const matchesValidity = this.matchesValidityFilter(v.validity);

      return matchesSearch && matchesStatus && matchesRto && matchesValidity;
    });

    this.totalRecords = this.filteredVehicles.length;
    this.updatePagedVehicles();
  }

  private matchesValidityFilter(validityDate: string): boolean {
    if (this.selectedValidity === 'All') return true;

    const daysLeft = this.daysUntil(validityDate);

    switch (this.selectedValidity) {
      case 'Expired':
        return daysLeft < 0;
      case 'ExpiringSoon':
        return daysLeft >= 0 && daysLeft <= 30;
      case 'Valid':
        return daysLeft > 30;
      default:
        return true;
    }
  }

  private daysUntil(ddMmmYyyy: string): number {
    const parsed = new Date(ddMmmYyyy);
    if (isNaN(parsed.getTime())) return 9999; // unknown/unparseable => treat as far future
    const diffMs = parsed.getTime() - this.todayDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  // ===========================================================================
  // PAGINATION
  // ===========================================================================
  private updatePagedVehicles(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.pagedVehicles = this.filteredVehicles.slice(start, end);
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.updatePagedVehicles();
  }

  goToPage(page: number): void {
    const totalPages = this.getTotalPages();
    if (page < 1 || page > totalPages) return;
    this.currentPage = page;
    this.updatePagedVehicles();
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  getTotalPages(): number {
    return Math.max(1, Math.ceil(this.totalRecords / this.pageSize));
  }

  getPageNumbers(): number[] {
    const total = this.getTotalPages();
    const maxButtons = 5;
    const pages: number[] = [];

    if (total <= maxButtons) {
      for (let i = 1; i <= total; i++) pages.push(i);
      return pages;
    }

    let start = Math.max(1, this.currentPage - 2);
    let end = Math.min(total, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);

    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  get rangeStart(): number {
    return this.totalRecords === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get rangeEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalRecords);
  }

  // ===========================================================================
  // ACTIONS (local only — no API)
  // ===========================================================================
  viewVehicle(vehicle: Vehicle): void {
    this.selectedVehicle = vehicle;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedVehicle = null;
  }

  handleRenewal(vehicle: Vehicle): void {
    // TODO: WIRE UP API — trigger renewal workflow for vehicle.vehicleNumber
    this.showActionNotice(`Renewal request placeholder for ${vehicle.vehicleNumber}. Connect your renewal API here.`);
  }

  handleMoreAction(vehicle: Vehicle): void {
    // TODO: WIRE UP API — open extended actions (reassign dealer, replace device, etc.)
    this.showActionNotice(`More actions placeholder for ${vehicle.vehicleNumber}. Connect additional workflows here.`);
  }

  private showActionNotice(message: string): void {
    this.actionNotice = message;
    setTimeout(() => (this.actionNotice = null), 3000);
  }

  // ===========================================================================
  // BADGE HELPERS (used from the template)
  // ===========================================================================
  getDeviceStatusBadgeClass(status: DeviceStatus): string {
    switch (status) {
      case 'Active': return 'badge badge-success';
      case 'Inactive': return 'badge badge-gray';
      case 'Pending': return 'badge badge-warning';
      case 'Expired': return 'badge badge-danger';
      case 'Renewal Due': return 'badge badge-info';
      default: return 'badge badge-gray';
    }
  }

  getSimStatusBadgeClass(status: SimStatus): string {
    return status === 'SIM Active' ? 'badge badge-success' : 'badge badge-danger';
  }

  trackByVehicle(index: number, vehicle: Vehicle): string {
    return vehicle.vehicleNumber;
  }
}