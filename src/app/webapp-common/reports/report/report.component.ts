import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  viewChild, inject, effect, computed, signal
} from '@angular/core';
import {Store} from '@ngrx/store';
import {
  addReportsTags,
  archiveReport,
  deleteReport,
  deleteResource,
  getReport,
  getReportsTags,
  moveReport,
  publishReport,
  restoreReport,
  setDirty,
  setEditMode,
  setReport,
  setReportChanges,
  updateReport
} from '@common/reports/reports.actions';
import {distinctUntilChanged, filter, map} from 'rxjs/operators';
import {Observable, take} from 'rxjs';
import {selectEditingReport, selectReport, selectReportId, selectReportsTags} from '@common/reports/reports.reducer';
import {ReportStatusEnum} from '~/business-logic/model/reports/reportStatusEnum';
import {getBaseName, isExample} from '@common/shared/utils/shared-utils';
import {MatDialog} from '@angular/material/dialog';
import {ConfirmDialogComponent} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {addMessage} from '@common/core/actions/layout.actions';
import {ICONS, MESSAGES_SEVERITY} from '@common/constants';
import {MarkdownEditorComponent} from '@common/shared/components/markdown-editor/markdown-editor.component';
import {BreakpointObserver} from '@angular/cdk/layout';
import {ActivatedRoute, Router} from '@angular/router';
import {ClipboardService} from 'ngx-clipboard';
import {UploadResult} from 'ngx-markdown-editor';
import {escapeRegex} from '@common/shared/utils/escape-regex';
import {Actions, ofType} from '@ngrx/effects';
import {MatMenuTrigger} from '@angular/material/menu';
import {TagsMenuComponent} from '@common/shared/ui-components/tags/tags-menu/tags-menu.component';
import {selectBlockUserScript, selectDefaultNestedModeForFeature, selectSelectedProject} from '@common/core/reducers/projects.reducer';
import {setBreadcrumbsOptions} from '@common/core/actions/projects.actions';
import {selectThemeMode} from '@common/core/reducers/view.reducer';
import {NgxPrintDirective} from 'ngx-print';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {TagListComponent} from '@common/shared/ui-components/tags/tag-list/tag-list.component';
import {MatDrawer, MatDrawerContainer, MatDrawerContent} from '@angular/material/sidenav';
import {PushPipe} from '@ngrx/component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {PageHeaderComponent} from '@common/shared/ui-components/layout/page-header/page-header.component';

@Component({
  selector: 'sm-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    MarkdownEditorComponent,
    TagsMenuComponent,
    TagListComponent,
    MatIconModule,
    MatDrawer,
    MatDrawerContainer,
    PushPipe,
    NgxPrintDirective,
    MatMenuTrigger,
    ShowTooltipIfEllipsisDirective,
    TooltipDirective,
    MatButton,
    MatIconButton,
    MatDrawerContent
  ]
})
export class ReportComponent implements OnDestroy {
  private store = inject(Store);
  public cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private breakpointObserver = inject(BreakpointObserver);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private _clipboardService = inject(ClipboardService);
  private actions$ = inject(Actions);
  public icons = ICONS;
  public editDesc: boolean;
  public orgDesc: string;
  public reportTags$: Observable<string[]> = this.store.select(selectReportsTags);
  public smallScreen$: Observable<boolean> = this.breakpointObserver.observe('(max-width: 1200px)')
    .pipe(map(state => state.matches));
  public editMode$: Observable<boolean> = this.store.select(selectEditingReport);
  public printStyle = {
    table: {border: '1px solid gray'},
    th: {border: '1px solid gray'},
    td: {border: '1px solid gray'},
    details: {border: '1px solid var(--color-outline-variant)', margin: '6px 0', padding: '6px'},

    code: {'white-space': 'pre'},
    iframe: {border: 'none', width: '840px'}
  };
  public widthExpanded = false;
  public handleUpload: (files: FileList) => Promise<UploadResult[]>;
  public showDescription = false;
  public resources = signal<{ unused: boolean; url: string }[]>(null);
  public menuPosition = {x: 0, y: 0};
  public blockUserScripts$: Observable<boolean> = this.store.select(selectBlockUserScript);
  public theme = this.store.selectSignal(selectThemeMode);

  private mdEditor = viewChild<MarkdownEditorComponent>(MarkdownEditorComponent);
  private printHiddenButton = viewChild(NgxPrintDirective);

  protected report = this.store.selectSignal(selectReport);
  private project = this.store.selectSignal(selectSelectedProject);
  private nested = this.store.selectSignal(selectDefaultNestedModeForFeature);
  protected example = computed(() => isExample(this.report()));
  protected archived = computed(() => this.report()?.system_tags?.includes('archived'));
  protected draft = computed(() => this.report()?.status !== ReportStatusEnum.Published);

  constructor() {
    this.store.dispatch(getReportsTags());
    effect(() => {
      this.setupBreadcrumbsOptions();
    });

    effect(() => {
      if (this.theme()) {
        Array.from(window.frames).forEach(frame => frame.postMessage('themeChanged', '*'));
      }
    });

    effect(() => {
      const report = this.report();
      const archived = this.archived();
      window.setTimeout(() => {
        if (report?.id !== this.route.snapshot.params['reportId']) {
          return;
        }
        this.router.navigate(['.'], {
          relativeTo: this.route,
          skipLocationChange: true,
          queryParams: {archive: archived}
        });
        this.setupBreadcrumbsOptions();
      }, 50);
    });


    this.store.select(selectReportId)
      .pipe(
        takeUntilDestroyed(),
        filter(id => !!id),
        distinctUntilChanged()
      )
      .subscribe(id => this.store.dispatch(getReport({id})));

    this.handleUpload = (): Promise<UploadResult[]> => {
      // Images cannot be stored for reports yet.
      this.store.dispatch(addMessage(MESSAGES_SEVERITY.ERROR, 'Image upload to reports is not available'));
      return Promise.reject('Image upload is not available');
    };

  }

  setupBreadcrumbsOptions() {
    if(this.report() && this.project()) {
      this.store.dispatch(setBreadcrumbsOptions({
        breadcrumbOptions: {
          showProjects: !!this.report(),
          featureBreadcrumb: {
            name: 'Reports',
            url: this.nested()['reports'] ? 'reports/*/projects' : 'reports',
            linkLast: true
          },
          projectsOptions: {
            basePath: 'reports',
            filterBaseNameWith: ['.reports'],
            compareModule: null,
            showSelectedProject: false,
            selectedProjectBreadcrumb: null
          },
          subFeatureBreadcrumb: {
            name: this.report().name,
            onlyWithProject: true
          }
        }
      }));
    }
  }

  save(report: string) {
    this.store.dispatch(updateReport({id: this.report().id, changes: {report}}));
    this.store.dispatch(setDirty({dirty: false}));
    Array.from(window.frames).forEach(frame => frame.postMessage('renderPlot', '*'));
  }

  openTagMenu(event: MouseEvent, tagMenuTrigger: MatMenuTrigger, tagsMenu: TagsMenuComponent) {
    if (!tagMenuTrigger) {
      return;
    }
    this.menuPosition = {x: event.clientX, y: event.clientY};
    window.setTimeout(() => {
      tagMenuTrigger.openMenu();
      tagsMenu.focus();
    });
  }

  addTag(tag: string) {
    const tags = [...this.report().tags, tag];
    tags.sort();
    this.store.dispatch(updateReport({id: this.report().id, changes: {tags}, refresh: true}));
    this.store.dispatch(addReportsTags({tags: [tag]}));
  }

  removeTag(tag: string) {
    this.store.dispatch(updateReport({
      id: this.report().id,
      changes: {tags: this.report().tags.filter(t => t !== tag)},
      refresh: true
    }));
  }

  ngOnDestroy(): void {
    this.store.dispatch(setReport({report: null}));
  }

  saveDesc(comment: string) {
    this.store.dispatch(updateReport({id: this.report().id, changes: {comment}}));
    this.editDesc = false;
    this.orgDesc = null;
  }

  publish() {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Publish report',
        body: '<p class="text-center">After publishing the report it can no longer be edited</p>',
        yes: 'Publish',
        no: 'Cancel',
        iconClass: 'al-ico-publish'
      },
      panelClass: 'dialog-md'
    }).afterClosed().subscribe(accept =>
      accept && this.store.dispatch(publishReport({id: this.report().id}))
    );
  }

  archive() {
    if (this.archived()) {
      this.store.dispatch(restoreReport({report: this.report()}));
    } else {
      this.store.dispatch(archiveReport({report: this.report()}));
    }
  }

  share() {
    this._clipboardService.copyResponse$
      .pipe(take(1))
      .subscribe(() => this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, 'Report link copied to clipboard'))
      );
    this._clipboardService.copy(window.location.href);
  }

  moveToProject() {
    this.store.dispatch(moveReport({report: this.report()}));
  }

  editReportDesc(descElement) {
    const end = descElement.value.length;
    this.orgDesc = this.report().comment;
    this.editDesc = true;
    setTimeout(() => {
      descElement.setSelectionRange(end, end);
      descElement.focus();
    }, 100);
  }

  editModeChanged() {
    this.widthExpanded = this.mdEditor().isExpand();
    this.store.dispatch(setEditMode({editing: this.mdEditor().editMode}));
    if (!this.mdEditor().editMode) {
      this.dirtyChanged(false);
    }
    setTimeout(() => Array.from(window.frames).forEach(frame => frame.postMessage('resizePlot', '*')), 500);
  }

  dirtyChanged(isDirty: boolean) {
    this.store.dispatch(setDirty({dirty: isDirty}));
  }

  copyMarkdown() {
    this._clipboardService.copyResponse$
      .pipe(take(1))
      .subscribe(() => this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, 'Report markdown copied to clipboard'))
      );
    this._clipboardService.copy(this.mdEditor().getData());
  }

  deleteReport() {
    this.store.dispatch(deleteReport({report: this.report()}));
  }

  deleteResource(resource: string) {
    this.store.dispatch(deleteResource({resource}));
    this.actions$.pipe(
      ofType(setReportChanges),
      take(1)
    )
      .subscribe(() => {
        const test = new RegExp(`!\\[(.*)\\]\\(${escapeRegex(resource)}\\)`, 'gm');
        const ace = this.mdEditor().aceEditor;
        let range = ace.find(test, {
          wrap: true,
          caseSensitive: true,
          wholeWord: true,
          regExp: false,
          preventScroll: true // do not change selection
        });

        while (range) {
          ace.session.replace(range, `![${getBaseName(resource)}]()`);
          range = ace.find(test, {
            wrap: true,
            caseSensitive: true,
            wholeWord: true,
            regExp: false,
            preventScroll: true // do not change selection
          });
        }
      });
  }

  calculateUnusedResources(unsavedReport?: string) {
    if (unsavedReport !== undefined || this.report()?.report !== undefined) {
      const test = /!\[.*]\((.*)\)/g;
      const usedResources = Array.from(new Set(Array.from((unsavedReport ?? this.report().report).matchAll(test)).map(match => match[1])));
      this.resources.set(this.report().report_assets.map(resource => ({
        url: resource,
        unused: !usedResources.includes(resource)
      })));
    }
  }

  printReport() {
    const sourceNode = document.getElementById('print-element');
    const clonedNode = sourceNode.cloneNode(true) as Element;
    clonedNode.id = 'print-element-temp';
    clonedNode.querySelectorAll('#print-element-temp iframe').forEach((iframeElement: HTMLIFrameElement) => {
      iframeElement.src = `${iframeElement.src}&light=true`;
    });
    document.body.appendChild(clonedNode);
    window.setTimeout(() => document.body.removeChild(clonedNode), 3000);
    this.printHiddenButton().print();
  }
}
