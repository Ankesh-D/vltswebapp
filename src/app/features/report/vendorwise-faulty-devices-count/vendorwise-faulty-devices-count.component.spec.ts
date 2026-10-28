import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorwiseFaultyDevicesCountComponent } from './vendorwise-faulty-devices-count.component';

describe('VendorwiseFaultyDevicesCountComponent', () => {
  let component: VendorwiseFaultyDevicesCountComponent;
  let fixture: ComponentFixture<VendorwiseFaultyDevicesCountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VendorwiseFaultyDevicesCountComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VendorwiseFaultyDevicesCountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
