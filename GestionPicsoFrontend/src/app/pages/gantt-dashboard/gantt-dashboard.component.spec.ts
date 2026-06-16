import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GanttDashboardComponent } from './gantt-dashboard.component';

describe('GanttDashboardComponent', () => {
  let component: GanttDashboardComponent;
  let fixture: ComponentFixture<GanttDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GanttDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GanttDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
