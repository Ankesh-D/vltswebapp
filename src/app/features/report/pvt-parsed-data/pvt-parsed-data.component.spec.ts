import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PvtParsedDataComponent } from './pvt-parsed-data.component';

describe('PvtParsedDataComponent', () => {
  let component: PvtParsedDataComponent;
  let fixture: ComponentFixture<PvtParsedDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PvtParsedDataComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PvtParsedDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
