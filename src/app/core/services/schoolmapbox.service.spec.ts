import { TestBed } from '@angular/core/testing';

import { SchoolmapboxService } from './schoolmapbox.service';

describe('SchoolmapboxService', () => {
  let service: SchoolmapboxService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SchoolmapboxService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
