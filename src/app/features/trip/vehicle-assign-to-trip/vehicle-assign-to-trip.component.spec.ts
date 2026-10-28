import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleAssignToTripComponent } from './vehicle-assign-to-trip.component';

describe('VehicleAssignToTripComponent', () => {
  let component: VehicleAssignToTripComponent;
  let fixture: ComponentFixture<VehicleAssignToTripComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleAssignToTripComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VehicleAssignToTripComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
