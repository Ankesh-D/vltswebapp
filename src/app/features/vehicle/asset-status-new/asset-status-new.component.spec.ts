import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetStatusNewComponent } from './asset-status-new.component';

describe('AssetStatusNewComponent', () => {
  let component: AssetStatusNewComponent;
  let fixture: ComponentFixture<AssetStatusNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetStatusNewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AssetStatusNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
