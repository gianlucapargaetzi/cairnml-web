import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material/dialog';
import {RunImportApiService, RunImportResult} from './run-import-api.service';
import {RunImportDialogComponent} from './run-import-dialog.component';

const PROJECT_ID = '293e38cdd2b54b4189ded3953c48f131';

const importedRun: RunImportResult = {
  id: 'task-1',
  project: PROJECT_ID,
  name: 'greenhouse_mlp_20261123_225000',
  scalars: 90,
  artifacts: ['model.pt', 'config.json'],
  warnings: [],
};

describe('RunImportDialogComponent', () => {
  let projectName: jasmine.Spy<(id: string) => Promise<string | null>>;
  let root: HTMLElement;
  let fixture: ComponentFixture<RunImportDialogComponent>;

  const setup = async (run: RunImportResult, lookup: () => Promise<string | null>) => {
    projectName = jasmine.createSpy('projectName').and.callFake(lookup);
    const api = {
      prepareUpload: async () => ({id: 'staged-1', url: 'https://store.invalid/put'}),
      commit: async () => undefined,
      run: async () => run,
      projectName,
    };
    await TestBed.configureTestingModule({
      imports: [RunImportDialogComponent],
      providers: [
        {provide: MatDialogRef, useValue: {close: () => undefined}},
        {provide: RunImportApiService, useValue: api},
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(RunImportDialogComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    root = fixture.nativeElement as HTMLElement;
  };

  /** Chooses a ZIP, presses Import and waits until the dialog shows a result or an error. */
  const importZip = async () => {
    const input = root.querySelector('[data-id=runImportFile]') as HTMLInputElement;
    const transfer = new DataTransfer();
    transfer.items.add(new File(['zip'], 'run.zip', {type: 'application/zip'}));
    input.files = transfer.files;
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    (root.querySelector('[data-id=RunImportButton]') as HTMLButtonElement).click();
    for (let tries = 0; tries < 200; tries++) {
      await new Promise(resolve => setTimeout(resolve, 10));
      fixture.detectChanges();
      if (root.querySelector('[data-id=runImportResult], [data-id=runImportError]')) {
        return;
      }
    }
  };

  beforeEach(() => {
    // the upload PUT goes to the store; answer it as a successful store would, without a network
    spyOn(XMLHttpRequest.prototype, 'send').and.callFake(function (this: XMLHttpRequest) {
      Object.defineProperty(this, 'status', {value: 200});
      this.onload?.(new ProgressEvent('load'));
    });
  });

  it('shows the project name, not its id, in the result line', async () => {
    await setup(importedRun, async () => 'examples');
    await importZip();

    const result = root.querySelector('[data-id=runImportResult]') as HTMLElement;
    expect(result.textContent).toContain('in project examples');
    expect(result.textContent).not.toContain(PROJECT_ID);
    expect(projectName).toHaveBeenCalledWith(PROJECT_ID);
  });

  it('keeps the import result and shows the id when the project cannot be read', async () => {
    await setup(importedRun, () => Promise.reject(new Error('no access')));
    await importZip();

    const result = root.querySelector('[data-id=runImportResult]') as HTMLElement;
    expect(result.textContent).toContain(`in project ${PROJECT_ID}`);
    expect(root.querySelector('[data-id=runImportError]')).toBeNull();
  });
});
