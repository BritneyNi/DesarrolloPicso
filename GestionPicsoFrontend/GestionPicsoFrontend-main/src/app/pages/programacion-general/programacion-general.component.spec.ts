import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgramacionGeneralComponent } from './programacion-general.component';

describe('ProgramacionGeneralComponent', () => {
  let component: ProgramacionGeneralComponent;
  let fixture: ComponentFixture<ProgramacionGeneralComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgramacionGeneralComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProgramacionGeneralComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
