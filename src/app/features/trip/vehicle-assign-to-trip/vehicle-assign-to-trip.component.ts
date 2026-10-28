import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { DashboardService } from '../../../core/services/dashboard.service';
import { FormsModule, NgForm } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { TripDetailsReq, VehicleAssignToTripFormReq, VehicleAssignToTripReq, VehicleUnassignToTripResp } from '../../../core/model/request.model';
import { TripService } from '../../../core/services/trip.service';
import { ToastService } from '../../../core/services/toast.service';
import { VehicleAssignToTripResp } from '../../../core/model/response.model';
import { VehicleService } from '../../../core/services/vehicle.service';
declare var $: any;
declare var moment: any;

@Component({
    selector: 'app-vehicle-assign-to-trip',
    imports: [CommonModule, FormsModule, NgSelectModule],
    templateUrl: './vehicle-assign-to-trip.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './vehicle-assign-to-trip.component.scss'
})
export class VehicleAssignToTripComponent implements OnInit {
  
  detailsFlag: boolean = false;
  tripList: any[] = [];
  vehicleList: any[] = [];
  validUptoList: any[] = [];
  selectedTrip: any = null;
  selectedVehicle: any = null;
  selectedValidUpto: any = null;
  public vehicleAssignToTripDetailsReq: VehicleAssignToTripReq = new VehicleAssignToTripReq();
  public vehicleAssignToTripReq: VehicleAssignToTripFormReq = new VehicleAssignToTripFormReq();
  public detailsData: VehicleAssignToTripResp[] = [];
  pageSize: any = 20;
  totalCount: any = 0;
  pageCount: any = 0;
  pageSizeOptions: any = [10, 20, 50, 100];
  isExporting: boolean = false;
  selectedDownloadType: string = 'Excel';
  loading: boolean = false;
  vendorList: any[] = [];
  selectedVendor: any = null;
  roleId: string = sessionStorage.getItem('roleid') || '';
  validUpto: any = null;
  ngOnInit(): void {
    // this.getDetails('init');
    this.loadTripList();
    // this.loadVehicleList();
    this.getDate();
    if(this.roleId == '10') {
      this.loadVendorList();
    } else {
      this.loadVehicleList();
    }
  }

  constructor(public tripService: TripService, public toastService: ToastService, public vehicleService: VehicleService, public dashboardService: DashboardService) { 
    this.toastService.pageName = 'Vehicle Assign To Trip'; // Set page name for toast service
  }
  
  getDate() {
  $(() => {
  $('input[name="date"]').daterangepicker({
    singleDatePicker: true,
    timePicker: false,
    autoApply: true,
    
    // ✅ default range
    startDate: moment().subtract(1, 'days'),
    endDate: moment(),

    opens: "center",
    drops: "down",

    locale: {
      format: 'DD-MMM-YYYY',
      separator: ' To '
    },

    minDate: moment(),

    // ✅ disable all future dates
    // maxDate: moment(),

    minYear: 2022,
    maxYear: parseInt(moment().format('YYYY'), 10),

    autoUpdateInput: true
  }, function(startDate: any, endDate: any) {

    $('#datepicker').val(
      startDate.format('DD-MMM-YYYY') +
      ' To ' +
      endDate.format('DD-MMM-YYYY')
    );
  });

  $('input[name="date"]').on(
    'apply.daterangepicker',
    (ev: any, picker: any) => {

      try {
        this.validUpto = picker.startDate.format('DD-MMM-YYYY');
        
      } catch (error) {}

      
    }
  );

  // ✅ initial value
  const picker: any = $('input[name="date"]').data('daterangepicker');

  this.validUpto = picker.startDate.format('DD-MMM-YYYY');
});
 
}
  loadVendorList() {
    this.dashboardService.getVendorList().subscribe(res => {
      if (res.status) this.vendorList = res.entity;
    });
  }
  loadTripList() {
    this.tripService.tripDetails(new TripDetailsReq()).subscribe({
      next: (response) => {
        if (response.statuscode == 200) {
          this.tripList = response.entity.listData || [];
        } else {
          this.toastService.show(response.message || 'Failed to fetch trip list', 'error');
        }
      },
      error: (error) => {
        console.error('Error fetching trip list:', error);
        this.toastService.show('An error occurred while fetching trip list', 'error');
      }
    });
  }

  loadVehicleList() {
    const request = {
      "selectvendorid": this.selectedVendor.param1 || '',
      "selectroleid":"",
      "routeid":"",
      "poiid":"",
      "selectcustomerid":"",
      "vehicleclassid":"",
      "searchtype":"",
      "rtoid":"",
      "searchby":""}
    this.vehicleService.getVehicleListV2(request).subscribe({
      next: (response) => {
        if (response.statuscode == 200) {
          this.vehicleList = response.entity || [];
        } else {
          this.toastService.show(response.message || 'Failed to fetch vehicle list', 'error');
        }
      },
      error: (error) => {
        console.error('Error fetching vehicle list:', error);
        this.toastService.show('An error occurred while fetching vehicle list', 'error');
      }
    });
  }
  onVendorChange() {
    if (this.selectedVendor) {
       // Assuming param4 is for vendorId
      this.loadVehicleList(); // Reload vehicle list based on selected vendor
    }
  }
  

  updatePageSizeOptions() {
    // Generate page size options based on total count
    const options = [20];
    if (this.totalCount > 50) options.push(50);
    if (this.totalCount > 100) options.push(100);
    if (this.totalCount > 200) options.push(200);
    if (this.totalCount > 500) options.push(500);
    if (this.totalCount > 0 && this.totalCount < 100) options.push(this.totalCount); // 'All'
    this.pageSizeOptions = options;
  }
  toggleDetails() {
    this.detailsFlag = !this.detailsFlag;
    if (this.detailsFlag) {
      this.getDetails('init'); // Fetch details when the section is opened
    } else {
      setTimeout(() => {
        this.getDate(); // Clear details when the section is closed
      }, 300); // Delay to allow for any closing animations
      this.detailsData = []; // Clear details when the section is closed
    }
  }

  getDetails(type: string = '') {
    if(type === 'init') {
      this.vehicleAssignToTripDetailsReq.param2 = 1; // Reset to first page on init or search
      this.vehicleAssignToTripDetailsReq.param3 = 20; // Set page size
      this.vehicleAssignToTripDetailsReq.param1 = ''; // Clear search text on init
      this.pageSize = 20; // Reset page size to default
      this.expandedRow = null; // Collapse any expanded rows when fetching new details
    }
    if(type === 'search') {
      this.vehicleAssignToTripDetailsReq.param2 = 1; // Reset to first page on search
      this.vehicleAssignToTripDetailsReq.param3 = 20; // Set page size on search
      this.expandedRow = null; // Collapse any expanded rows when fetching new details
    }
    if(type === 'pagesizechange') {
      this.vehicleAssignToTripDetailsReq.param2 = 1; // Reset to first page on page size change
      this.vehicleAssignToTripDetailsReq.param3 = this.pageSize; // Set new page size
    }
    this.tripService.vehicleAssignToTripDetails(this.vehicleAssignToTripDetailsReq).subscribe({
      next: (response) => {
        if (response.statuscode == 200) {
          this.detailsData = response.entity.listData || [];
          this.totalCount = response.entity.listData?.length || 0;
          this.pageCount = Math.ceil(this.totalCount / this.pageSize);
          this.updatePageSizeOptions();
        } else {
          this.detailsData = []; // Clear details on error
          this.totalCount = 0; // Reset total count on error
          this.pageCount = 0; // Reset page count on error
          this.toastService.show(response.message || 'Failed to fetch trip details', 'error');
        }
      },
      error: (error) => {
        console.error('Error fetching trip details:', error);
        this.toastService.show('An error occurred while fetching trip details', 'error');
      }
    });
  }
  formatDate(dateString: string): string {
    if (!dateString) return '-';
    return moment(dateString).format('DD-MMM-YYYY');
  }
  isMoreThanCurrentDate(dateString: string): boolean {
  if (!dateString) return false;

  const inputDate = moment(dateString, 'YYYY-MM-DD');
  const today = moment().startOf('day');
  return inputDate.isSame(today, 'day') || inputDate.isAfter(today, 'day');
}
expandedRow: number | null = null;

  toggleTimeline(index: number) {
    this.expandedRow = this.expandedRow === index ? null : index;
  }

  getStops(trip: any): any[] {
    try {
      return trip.param15 ? JSON.parse(trip.param15) : [];
    } catch {
      return [];
    }
  }



  
  onDownloadChange() {}
  @ViewChild('assignmentForm') assignmentForm!: NgForm;
  onSubmit() {
    if (this.assignmentForm.valid) {
      const tripIds = this.selectedTrip ? this.selectedTrip.map((trip: any) => trip.param2) : [];
      
      this.vehicleAssignToTripReq.vehicleid = this.selectedVehicle ? this.selectedVehicle.param1 : '';
      this.vehicleAssignToTripReq.tripidlist = tripIds;
      this.vehicleAssignToTripReq.validupto = this.validUpto;
      this.tripService.vehicleAssignToTrip(this.vehicleAssignToTripReq).subscribe({
        next: (response) => {
          if (response.statuscode == 200) {
            this.toastService.show(response.message || 'Vehicle assigned to trip successfully', 'success');
            this.selectedVehicle = null;
            this.selectedTrip = null;
            this.validUpto = null;
            setTimeout(() => {
              this.getDate(); // Reinitialize the date picker after resetting the form
            }, 200);
            // this.getDetails('init'); // Refresh the details after successful assignment
          } else {
            this.toastService.show(response.message || 'Failed to assign vehicle to trip', 'error');
          }
        },
        error: (error) => {
          console.error('Error assigning vehicle to trip:', error);
          this.toastService.show('An error occurred while assigning vehicle to trip', 'error');
        }
      });
    } else {
      this.toastService.show('Please fill in all required fields', 'error');
    }
  }
  resetForm(assignmentForm: NgForm) {
    assignmentForm.resetForm();
    this.selectedVehicle = null;
    this.selectedTrip = null;
    this.validUpto = null;
    setTimeout(() => {
      this.getDate(); // Reinitialize the date picker after resetting the form
    }, 100);
  }

  unassignReq: VehicleUnassignToTripResp = new VehicleUnassignToTripResp();
  setData(trip: any) {
    this.unassignReq = new VehicleUnassignToTripResp(); // Reset the unassign request object
    this.unassignReq.vehicleid = trip.param11;
    this.unassignReq.tripid = trip.param3;
    this.unassignReq.mappingid = trip.param2;
    $('#unassignModal').modal('show')
  }
  unassignRemarks: string = '';
  unassignVehicle() {
      this.tripService.unassignVehicleFromTrip(this.unassignReq).subscribe({
      next: (response) => {
        if (response.statuscode == 200) {
          this.toastService.show(response.message || 'Vehicle unassigned from trip successfully', 'success');
          this.getDetails('init'); // Refresh the details after successful unassignment
        } else {
          this.toastService.show(response.message || 'Failed to unassign vehicle from trip', 'error');
        }
      },
      error: (error) => {
        console.error('Error unassigning vehicle from trip:', error);
        this.toastService.show('An error occurred while unassigning vehicle from trip', 'error');
      }
    });
  }
}
