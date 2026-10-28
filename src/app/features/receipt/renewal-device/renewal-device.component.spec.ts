import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RenewalDeviceComponent } from './renewal-device.component';

describe('RenewalDeviceComponent', () => {
  let component: RenewalDeviceComponent;
  let fixture: ComponentFixture<RenewalDeviceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RenewalDeviceComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RenewalDeviceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
