import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FirmwareDetailsComponent } from './firmware-details.component';

describe('FirmwareDetailsComponent', () => {
  let component: FirmwareDetailsComponent;
  let fixture: ComponentFixture<FirmwareDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FirmwareDetailsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FirmwareDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
