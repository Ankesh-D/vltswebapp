import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RTODashboardComponent } from './rtodashboard.component';

describe('RTODashboardComponent', () => {
  let component: RTODashboardComponent;
  let fixture: ComponentFixture<RTODashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RTODashboardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RTODashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
