import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeviceUnassignDistributorComponent } from './device-unassign-distributor.component';

describe('DeviceUnassignDistributorComponent', () => {
  let component: DeviceUnassignDistributorComponent;
  let fixture: ComponentFixture<DeviceUnassignDistributorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeviceUnassignDistributorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DeviceUnassignDistributorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
