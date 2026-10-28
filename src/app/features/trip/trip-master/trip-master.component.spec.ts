import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TripMasterComponent } from './trip-master.component';

describe('TripMasterComponent', () => {
  let component: TripMasterComponent;
  let fixture: ComponentFixture<TripMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TripMasterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TripMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
