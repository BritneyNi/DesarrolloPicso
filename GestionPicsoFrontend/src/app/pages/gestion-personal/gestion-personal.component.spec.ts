import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionPersonalComponent } from './gestion-personal.component';

describe('GestionPersonalComponent', () => {
  let component: GestionPersonalComponent;
  let fixture: ComponentFixture<GestionPersonalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionPersonalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionPersonalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
