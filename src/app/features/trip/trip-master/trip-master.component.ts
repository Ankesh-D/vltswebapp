import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { DeleteTripReq, Stoppages, TripDetailsReq, TripMasterFormReq } from '../../../core/model/request.model';
import { TripService } from '../../../core/services/trip.service';
import { ToastService } from '../../../core/services/toast.service';
import { TripMasterDetailsResp } from '../../../core/model/response.model';
declare var $: any;

@Component({
    selector: 'app-trip-master',
    imports: [CommonModule, FormsModule, NgSelectModule],
    templateUrl: './trip-master.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './trip-master.component.scss'
})
export class TripMasterComponent implements OnInit{
  searchText: string = '';
  pageSize: any = 20;
  currentPage: any = 1;
  totalCount: any = 0;
  pageCount: any = 0;
  tripDetails: TripMasterDetailsResp[] = [];
  loading: boolean = false;
  pageSizeOptions: any = [10, 20, 50, 100];
  isExporting: boolean = false;
  selectedDownloadType: string = 'Excel';
  detailsFlag: boolean = true;
  poiList: any = [];
  tripTypeList: any = [{param1: '1', param2: 'One Way'}, {param1: '2', param2: 'Round Trip'}];
  selectedSource: any = null;
  selectedDestination: any = null;
  selectedTripType: any = null;
  tripRequest: TripMasterFormReq = new TripMasterFormReq();
  tripDetailsRequest: TripDetailsReq = new TripDetailsReq();
  deleteTripRequest: DeleteTripReq = new DeleteTripReq();
  // any = {
  //   tripId: '',
  //   tripName: '',
  //   tripType: '',
  //   tripStatus: '',
  //   startDate: '',
  //   endDate: '',
  //   stoppages: []
  // };
  constructor(private tripService: TripService, private toastService: ToastService) { 
    this.toastService.pageName = 'Trip Master'; // Set page name for toast service
  }

  ngOnInit(): void {
    this.getDetails('init');
    this.getPoiList();
  }
  getPoiList() {
    this.tripService.getPOIRoster().subscribe({
      next: (response) => {
        if (response.statuscode == 200) {
          this.poiList = response.entity || [];
        } else {
          this.toastService.show(response.message || 'Failed to fetch POI list', 'error');
        }
      },
      error: (error) => {
        console.error('Error fetching POI list:', error);
        this.toastService.show('An error occurred while fetching POI list', 'error');
      }
    });
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

  getDetails(type: string = '') {
    this.expandedRow = null; // Collapse any expanded rows when fetching new details
    if(type === 'init') {
      this.tripDetailsRequest.param2 = 1; // Reset to first page on init or search
      this.tripDetailsRequest.param3 = 20; // Set page size
      this.tripDetailsRequest.param1 = ''; // Clear search text on init
      this.pageSize = 20; // Reset page size to default
    }
    if(type === 'search') {
      this.tripDetailsRequest.param2 = 1; // Reset to first page on search
      this.tripDetailsRequest.param3 = 20; // Set page size on search

    }
    if(type === 'pagesizechange') {
      this.tripDetailsRequest.param2 = 1; // Reset to first page on page size change
      this.tripDetailsRequest.param3 = this.pageSize; // Set new page size
    }
    this.loading = true;
    this.tripService.tripDetails(this.tripDetailsRequest).subscribe({
      next: (response) => {
        if (response.statuscode == 200) {
          this.tripDetails = response.entity.listData || [];
          this.totalCount = response.entity.listData?.length || 0;
          this.pageCount = Math.ceil(this.totalCount / this.pageSize);
          this.updatePageSizeOptions();
        } else {
          this.toastService.show(response.message || 'Failed to fetch trip details', 'error');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching trip details:', error);
        this.toastService.show('An error occurred while fetching trip details', 'error');
        this.loading = false;
      }
    });
  }
  expandedRow: number | null = null;

  toggleTimeline(index: number) {
    this.expandedRow = this.expandedRow === index ? null : index;
  }

  getStops(trip: any): any[] {
    try {
      return trip.param8 ? JSON.parse(trip.param8) : [];
    } catch {
      return [];
    }
  }



  getSearchDetails() {}
  reloadData() {}
  onDownloadChange() {}
  onPageSizeChange(size: string) {}
  updateFlag:boolean = false;
  setData(data: TripMasterDetailsResp, action: string) {
    this.updateFlag = true;
    if (action === 'edit') {
        this.detailsFlag = false;
        this.tripRequest.tripid = data.param2;
        this.tripRequest.tripname = data.param3;
        this.tripRequest.triptype = data.param10;
        this.selectedTripType = this.tripTypeList.find((type: any) => type.param2 === data.param10) || null;
        // this.selectedSource = data.param7;
        // this.selectedDestination = data.param9;
        this.poiList.forEach((poi: any) => {
          if (poi.param1 === data.param4) {
            this.selectedSource = poi;
          }
          if (poi.param1 === data.param6) {
            this.selectedDestination = poi;
          }
        });
        this.tripRequest.tripData = 
        data.param8 ? JSON.parse(data.param8) : [];
        this.tripRequest.tripData.forEach((stoppage: any, index: number) => {
          const selectedStop = this.poiList.find((poi: any) => poi.param1 === stoppage.stopid);
          if (selectedStop) {
            this.selectedStoppage[index] = selectedStop;
          }
        });

    } else if (action === 'delete') {
      this.deleteTripRequest.tripid = data.param2;
      $('#deleteTripModal').modal('show');
    }
  }
  deleteTrip() {
    this.tripService.deleteTrip(this.deleteTripRequest).subscribe({
      next: (response) => {
        if (response.statuscode == 200) {
          this.toastService.show(response.message || 'Trip deleted successfully', 'success');
          this.getDetails();
          $('#deleteTripModal').modal('hide');
        } else {
          this.toastService.show(response.message || 'Failed to delete trip', 'error');
        }
      },
      error: (error) => {
        console.error('Error deleting trip:', error);
        this.toastService.show('An error occurred while deleting trip', 'error');
      }
    });
  }
  editTrip() {}



  addTripForm() {
    this.detailsFlag = !this.detailsFlag;
  }
  onSourceChange() {}
  onDestinationChange() {}
  addStoppage() {
    this.detailsFlag = false;
    if (!this.tripRequest.tripData) {
      this.tripRequest.tripData = [];
    }
    this.tripRequest.tripData.push(new Stoppages());
  }
  removeStoppage(index: number) {
    if (this.tripRequest.tripData && this.tripRequest.tripData.length > index) {
      this.tripRequest.tripData.splice(index, 1);
    }
  }
  @ViewChild('tripForm') tripForm!: NgForm;
  selectedStoppage: any[] = [];
  saveTrip() {
    // this.detailsFlag = true;
    console.log('Trip Request:', this.selectedStoppage);
    if(this.tripForm.invalid) {
      this.toastService.show('Please fill in all required fields before saving the trip', 'error');
      return;
    }

    if(this.tripRequest.tripData.length === 0) {
      this.toastService.show('Please add at least one stoppage before saving the trip', 'error');
      return;
    }
    this.tripRequest.triptype = this.selectedTripType ? this.selectedTripType.param2 : '';
    this.tripRequest.sourceid = this.selectedSource ? this.selectedSource.param1 : '';
    this.tripRequest.destid = this.selectedDestination ? this.selectedDestination.param1 : '';
    this.tripRequest.tripData = this.tripRequest.tripData.map((stoppage, index) => {
        const selectedStop = this.selectedStoppage[index];

        return {
          ...stoppage,
          stopid: selectedStop ? selectedStop.param1 : '',
          stopname: selectedStop ? selectedStop.param2 : '',
          sequence: (index + 1).toString()
        };
      });
    
    if(this.tripRequest.tripid && this.tripRequest.tripid !== '') {
      this.tripService.updateTrip(this.tripRequest).subscribe({
        next: (response) => {
          if (response.statuscode == 200) {
            this.toastService.show(response.message || 'Trip updated successfully', 'success');
            this.getDetails();
            this.detailsFlag = true;
          } else {
            this.toastService.show(response.entity, 'error');
          }
        },
        error: (error) => {
          console.error('Error updating trip:', error);
          this.toastService.show('An error occurred while updating trip', 'error');
        }
      });
    } else {

      this.tripService.insertTrip(this.tripRequest).subscribe({
        next: (response) => {
          if (response.statuscode == 200) {
            this.toastService.show(response.message || 'Trip added successfully', 'success');
            this.getDetails();
            this.detailsFlag = true;
          } else {
            this.toastService.show(response.message || 'Failed to add trip', 'error');
          }
        },
        error: (error) => {
          console.error('Error adding trip:', error);
          this.toastService.show('An error occurred while adding trip', 'error');
        }
      });
    }
  }


  cancel() {
    this.detailsFlag = true;
  }
  resetForm() {
    this.tripForm.resetForm();
    this.tripRequest = new TripMasterFormReq();
    this.selectedSource = null;
    this.selectedDestination = null;
    this.selectedTripType = null;
  }
}
