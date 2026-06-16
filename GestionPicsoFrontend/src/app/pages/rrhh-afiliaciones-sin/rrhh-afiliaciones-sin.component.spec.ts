import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RrhhAfiliacionesSinComponent } from './rrhh-afiliaciones-sin.component';

describe('RrhhAfiliacionesSinComponent', () => {
  let component: RrhhAfiliacionesSinComponent;
  let fixture: ComponentFixture<RrhhAfiliacionesSinComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RrhhAfiliacionesSinComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RrhhAfiliacionesSinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
