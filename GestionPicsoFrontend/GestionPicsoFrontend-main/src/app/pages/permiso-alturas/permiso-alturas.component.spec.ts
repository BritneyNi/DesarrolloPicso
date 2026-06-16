import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PermisoAlturasComponent } from './permiso-alturas.component';

describe('PermisoAlturasComponent', () => {
  let component: PermisoAlturasComponent;
  let fixture: ComponentFixture<PermisoAlturasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermisoAlturasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PermisoAlturasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
