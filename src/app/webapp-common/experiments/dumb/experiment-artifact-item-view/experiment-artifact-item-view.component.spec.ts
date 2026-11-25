import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideMockStore} from '@ngrx/store/testing';
import {AdminService} from '~/shared/services/admin.service';
import {Artifact} from '~/business-logic/model/tasks/artifact';
import {ExperimentArtifactItemViewComponent} from './experiment-artifact-item-view.component';

describe('ExperimentArtifactItemViewComponent preview of a file without text', () => {
  let fixture: ComponentFixture<ExperimentArtifactItemViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExperimentArtifactItemViewComponent],
      providers: [provideMockStore({}), {provide: AdminService, useValue: {isLocalFile: () => false}}],
    }).compileComponents();
    fixture = TestBed.createComponent(ExperimentArtifactItemViewComponent);
  });

  it('says that there is no preview, not the text of the uncommitted-changes panel', () => {
    fixture.componentInstance.artifact = {
      key: 'weights/model_best.pth', type: 'other', mode: 'output', uri: 'datachunk://artifact/t/weights/model_best.pth', content_size: 2870,
    } as Artifact;
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent;
    expect(text).toContain('No preview available for this file');
    expect(text).not.toContain('No changes logged');
  });
});
