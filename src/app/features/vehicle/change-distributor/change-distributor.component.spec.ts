import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeDistributorComponent } from './change-distributor.component';

describe('ChangeDistributorComponent', () => {
  let component: ChangeDistributorComponent;
  let fixture: ComponentFixture<ChangeDistributorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChangeDistributorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChangeDistributorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
