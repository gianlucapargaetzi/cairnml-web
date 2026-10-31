import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { ConfigurationService } from '@common/shared/services/configuration.service';

import { UsageStatsComponent } from './usage-stats.component';

describe('UsageStatsComponent', () => {
  let component: UsageStatsComponent;
  let fixture: ComponentFixture<UsageStatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsageStatsComponent],
      providers: [
        provideMockStore({ initialState: { userStats: { supported: true, allowed: false } } }),
        { provide: ConfigurationService, useValue: { configuration: () => ({ demo: false }) } },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsageStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
