import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorwiseinstalleddevicecountoverallComponent } from './vendorwiseinstalleddevicecountoverall.component';

describe('VendorwiseinstalleddevicecountoverallComponent', () => {
  let component: VendorwiseinstalleddevicecountoverallComponent;
  let fixture: ComponentFixture<VendorwiseinstalleddevicecountoverallComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VendorwiseinstalleddevicecountoverallComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VendorwiseinstalleddevicecountoverallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
