import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InformeGanttComponent } from './informe-gantt.component';

describe('InformeGanttComponent', () => {
  let component: InformeGanttComponent;
  let fixture: ComponentFixture<InformeGanttComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InformeGanttComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InformeGanttComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
