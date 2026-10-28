import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewRawDataComponent } from './new-raw-data.component';

describe('NewRawDataComponent', () => {
  let component: NewRawDataComponent;
  let fixture: ComponentFixture<NewRawDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewRawDataComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NewRawDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
