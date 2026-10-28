import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DealerDashboardComponent } from './delear-dashboard.component';

describe('DealerDashboardComponent', () => {
  let component: DealerDashboardComponent;
  let fixture: ComponentFixture<DealerDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DealerDashboardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DealerDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
