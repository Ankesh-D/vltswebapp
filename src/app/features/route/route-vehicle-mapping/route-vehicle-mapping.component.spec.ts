import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RouteVehicleMappingComponent } from './route-vehicle-mapping.component';

describe('RouteVehicleMappingComponent', () => {
  let component: RouteVehicleMappingComponent;
  let fixture: ComponentFixture<RouteVehicleMappingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouteVehicleMappingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RouteVehicleMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
