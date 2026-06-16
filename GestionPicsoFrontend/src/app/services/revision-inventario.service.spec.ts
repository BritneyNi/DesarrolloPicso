import { TestBed } from '@angular/core/testing';

import { RevisionInventarioService } from './revision-inventario.service';

describe('RevisionInventarioService', () => {
  let service: RevisionInventarioService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RevisionInventarioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
