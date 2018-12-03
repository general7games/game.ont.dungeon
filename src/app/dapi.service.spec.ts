import { TestBed } from '@angular/core/testing';

import { DapiService } from './dapi.service';

describe('DapiService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DapiService = TestBed.get(DapiService);
    expect(service).toBeTruthy();
  });
});
