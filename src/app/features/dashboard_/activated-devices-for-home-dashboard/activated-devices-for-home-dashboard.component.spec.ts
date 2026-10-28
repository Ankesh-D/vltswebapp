import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivatedDevicesForHomeDashboardComponent } from './activated-devices-for-home-dashboard.component';

describe('ActivatedDevicesForHomeDashboardComponent', () => {
  let component: ActivatedDevicesForHomeDashboardComponent;
  let fixture: ComponentFixture<ActivatedDevicesForHomeDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivatedDevicesForHomeDashboardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ActivatedDevicesForHomeDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
