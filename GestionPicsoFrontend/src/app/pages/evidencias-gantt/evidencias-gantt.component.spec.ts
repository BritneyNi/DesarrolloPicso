import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvidenciasGanttComponent } from './evidencias-gantt.component';

describe('EvidenciasGanttComponent', () => {
  let component: EvidenciasGanttComponent;
  let fixture: ComponentFixture<EvidenciasGanttComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvidenciasGanttComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EvidenciasGanttComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
