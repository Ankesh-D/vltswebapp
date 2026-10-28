import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusinessRuleMasterComponent } from './business-rule-master.component';

describe('BusinessRuleMasterComponent', () => {
  let component: BusinessRuleMasterComponent;
  let fixture: ComponentFixture<BusinessRuleMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessRuleMasterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BusinessRuleMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
