import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiquidacionComponent } from './rrhh-liquidacion.component';

describe('RrhhLiquidacionComponent', () => {
  let component: LiquidacionComponent;
  let fixture: ComponentFixture<LiquidacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiquidacionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LiquidacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
