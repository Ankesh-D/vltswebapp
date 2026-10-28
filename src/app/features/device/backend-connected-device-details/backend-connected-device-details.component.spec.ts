import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackendConnectedDeviceDetailsComponent } from './backend-connected-device-details.component';

describe('BackendConnectedDeviceDetailsComponent', () => {
  let component: BackendConnectedDeviceDetailsComponent;
  let fixture: ComponentFixture<BackendConnectedDeviceDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackendConnectedDeviceDetailsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BackendConnectedDeviceDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
