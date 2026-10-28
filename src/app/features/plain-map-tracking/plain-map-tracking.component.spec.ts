import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlainMapTrackingComponent } from './plain-map-tracking.component';

describe('PlainMapTrackingComponent', () => {
  let component: PlainMapTrackingComponent;
  let fixture: ComponentFixture<PlainMapTrackingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlainMapTrackingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PlainMapTrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
