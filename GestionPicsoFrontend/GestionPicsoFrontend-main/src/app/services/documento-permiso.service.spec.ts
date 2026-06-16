import { TestBed } from '@angular/core/testing';

import { AusentismoService } from './documento-permiso.service';

describe('DocumentoPermisoService', () => {
  let service: AusentismoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AusentismoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
