import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeofenceMasterComponent } from './geofence-master.component';

describe('GeofenceMasterComponent', () => {
  let component: GeofenceMasterComponent;
  let fixture: ComponentFixture<GeofenceMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeofenceMasterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GeofenceMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
