import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { selectAceReady, selectThemeMode } from '@common/core/reducers/view.reducer';
import { MatDialog } from '@angular/material/dialog';
import { ReportCodeEmbedBaseService } from '@common/shared/services/report-code-embed-base.service';

import { MarkdownEditorComponent } from './markdown-editor.component';

describe('MarkdownEditorComponent', () => {
  let component: MarkdownEditorComponent;
  let fixture: ComponentFixture<MarkdownEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ MarkdownEditorComponent ],
      providers: [
        provideMockStore({}),
        { provide: MatDialog, useValue: {} },
        { provide: ReportCodeEmbedBaseService, useValue: { getUrl: () => 'http://localhost' } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarkdownEditorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('data', '');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

// The markdown editor (ngx-markdown-editor) calls the global `ace.edit` as soon as it is created. The main app loads
// ace.js asynchronously, so a page that shows the editor on a direct open must wait for the aceReady state.
describe('MarkdownEditorComponent and the asynchronously loaded ace', () => {
  let fixture: ComponentFixture<MarkdownEditorComponent>;
  let store: MockStore;
  let savedAce: unknown;

  const editorElement = () => (fixture.nativeElement as HTMLElement).querySelector('md-editor');

  beforeEach(() => {
    savedAce = window['ace'];
    delete window['ace'];

    TestBed.configureTestingModule({
      imports: [MarkdownEditorComponent],
      providers: [
        provideMockStore({
          selectors: [
            {selector: selectAceReady, value: false},
            {selector: selectThemeMode, value: 'light'},
          ]
        }),
        {provide: ReportCodeEmbedBaseService, useValue: {getUrl: () => new URL('http://localhost/')}},
        {provide: MatDialog, useValue: {open: () => undefined}},
      ]
    });
    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(MarkdownEditorComponent);
    fixture.componentRef.setInput('data', '# A report');
  });

  afterEach(() => {
    fixture.destroy();
    if (savedAce === undefined) {
      delete window['ace'];
    } else {
      window['ace'] = savedAce;
    }
  });

  it('does not create the editor, and throws no ReferenceError, while ace is not loaded', () => {
    expect(window['ace']).toBeUndefined();

    expect(() => fixture.detectChanges()).not.toThrow();

    expect(editorElement()).toBeNull();
  });

  it('creates the editor once ace is ready', async () => {
    fixture.detectChanges();
    expect(editorElement()).toBeNull();

    const aceModule = await import('ace-builds');
    window['ace'] = aceModule.default ?? aceModule;
    store.overrideSelector(selectAceReady, true);
    store.refreshState();

    expect(() => fixture.detectChanges()).not.toThrow();

    expect(editorElement()).not.toBeNull();
  });
});
