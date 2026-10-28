import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForcefullVehicleInstallationComponent } from './forcefull-vehicle-installation.component';

describe('ForcefullVehicleInstallationComponent', () => {
  let component: ForcefullVehicleInstallationComponent;
  let fixture: ComponentFixture<ForcefullVehicleInstallationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForcefullVehicleInstallationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ForcefullVehicleInstallationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
