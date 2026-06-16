import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RrhhAlturasComponent } from './rrhh-alturas.component';

describe('RrhhAlturasComponent', () => {
  let component: RrhhAlturasComponent;
  let fixture: ComponentFixture<RrhhAlturasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RrhhAlturasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RrhhAlturasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
