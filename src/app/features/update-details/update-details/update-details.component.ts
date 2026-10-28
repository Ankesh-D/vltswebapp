import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { UpdateSimValidityComponent } from '../../vehicle/update-sim-validity/update-sim-validity.component';
import { UpdateCustomerDetailsComponent } from '../../vehicle/update-customer-details/update-customer-details.component';
import { UpdateDeviceDetailsComponent } from '../../device/update-device-details/update-device-details.component';
import { DealerListComponent } from '../../dealer/dealer-list/dealer-list.component';
import { UpdateVehicleDetailsComponent } from '../../vehicle/update-vehicle-details/update-vehicle-details.component';

@Component({
    selector: 'app-update-details',
    imports: [CommonModule, UpdateSimValidityComponent, UpdateCustomerDetailsComponent, DealerListComponent, UpdateDeviceDetailsComponent, UpdateVehicleDetailsComponent],
    templateUrl: './update-details.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './update-details.component.scss'
})
export class UpdateDetailsComponent implements OnInit {
  pageTitle: string = 'Update Sim Validity';
  tabTitle: string = 'sim-validity';
  showDealer:boolean = false;

  constructor() { }

  ngOnInit(): void {}



}
