import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventarioInternoComponent } from './inventario-interno.component';

describe('InventarioInternoComponent', () => {
  let component: InventarioInternoComponent;
  let fixture: ComponentFixture<InventarioInternoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventarioInternoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventarioInternoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
