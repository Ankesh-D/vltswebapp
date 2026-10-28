import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocationWiseVehicleDetailsComponent } from './location-wise-vehicle-details.component';

describe('LocationWiseVehicleDetailsComponent', () => {
  let component: LocationWiseVehicleDetailsComponent;
  let fixture: ComponentFixture<LocationWiseVehicleDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationWiseVehicleDetailsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LocationWiseVehicleDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
