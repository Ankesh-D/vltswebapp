import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RenewadDetailsComponent } from './renewad-details.component';

describe('RenewadDetailsComponent', () => {
  let component: RenewadDetailsComponent;
  let fixture: ComponentFixture<RenewadDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RenewadDetailsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RenewadDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
