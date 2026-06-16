import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PermisoAlturasDetalleComponent } from './permiso-alturas-detalle.component';

describe('PermisoAlturasDetalleComponent', () => {
  let component: PermisoAlturasDetalleComponent;
  let fixture: ComponentFixture<PermisoAlturasDetalleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermisoAlturasDetalleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PermisoAlturasDetalleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
