import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransfervehicleComponent } from './transfervehicle.component';

describe('TransfervehicleComponent', () => {
  let component: TransfervehicleComponent;
  let fixture: ComponentFixture<TransfervehicleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransfervehicleComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TransfervehicleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
