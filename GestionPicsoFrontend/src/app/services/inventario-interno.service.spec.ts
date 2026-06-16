import { TestBed } from '@angular/core/testing';

import { InventarioInternoService } from './inventario-interno.service';

describe('InventarioInternoService', () => {
  let service: InventarioInternoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InventarioInternoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
