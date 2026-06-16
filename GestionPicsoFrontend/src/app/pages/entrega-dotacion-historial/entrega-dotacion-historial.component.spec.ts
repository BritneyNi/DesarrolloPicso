import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntregaDotacionHistorialComponent } from './entrega-dotacion-historial.component';

describe('EntregaDotacionHistorialComponent', () => {
  let component: EntregaDotacionHistorialComponent;
  let fixture: ComponentFixture<EntregaDotacionHistorialComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntregaDotacionHistorialComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EntregaDotacionHistorialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
