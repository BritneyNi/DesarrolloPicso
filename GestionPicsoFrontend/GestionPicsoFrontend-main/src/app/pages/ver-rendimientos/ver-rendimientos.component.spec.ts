import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerRendimientosComponent } from './ver-rendimientos.component';

describe('VerRendimientosComponent', () => {
  let component: VerRendimientosComponent;
  let fixture: ComponentFixture<VerRendimientosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerRendimientosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerRendimientosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
