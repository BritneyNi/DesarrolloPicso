import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RrhhDotacionComponent } from './rrhh-dotacion.component';

describe('RrhhDotacionComponent', () => {
  let component: RrhhDotacionComponent;
  let fixture: ComponentFixture<RrhhDotacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RrhhDotacionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RrhhDotacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
