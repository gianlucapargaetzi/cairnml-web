import {ChangeDetectionStrategy, Component, computed, effect, inject, input, viewChild} from '@angular/core';
import {Store} from '@ngrx/store';
import 'ngx-markdown-editor';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {selectBlockUserScript, selectSelectedProject} from '@common/core/reducers/projects.reducer';
import {updateProject} from '@common/core/actions/projects.actions';
import {selectThemeMode} from '@common/core/reducers/view.reducer';
import {isExample} from '@common/shared/utils/shared-utils';
import {MarkdownEditorComponent} from '@common/shared/components/markdown-editor/markdown-editor.component';

/** The old overview's "Project overview" panel as a card: the project description, written in markdown. */
@Component({
  selector: 'sm-description-card',
  templateUrl: './description-card.component.html',
  styles: [`
    :host { display: block; height: 100%; overflow: auto; }
    .placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-3);
                   min-height: 100%; color: var(--color-on-surface-variant); }
    .title { font-size: var(--font-size-lg); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MarkdownEditorComponent, MatButton, MatIcon],
})
export class DescriptionCardComponent {
  private readonly store = inject(Store);
  readonly projectId = input.required<string>();
  readonly settings = input<Record<string, unknown>>({});
  protected readonly project = this.store.selectSignal(selectSelectedProject);
  protected readonly info = computed(() => this.project()?.description);
  protected readonly example = computed(() => isExample(this.project()));
  protected readonly blockUserScripts = this.store.selectSignal(selectBlockUserScript);
  private readonly theme = this.store.selectSignal(selectThemeMode);
  protected readonly editor = viewChild<MarkdownEditorComponent>('descriptionEditor');

  constructor() {
    // the previews of the markdown live in frames: they follow the theme
    effect(() => {
      if (this.theme()) {
        Array.from(window.frames).forEach(frame => frame.postMessage('themeChanged', '*'));
      }
    });
  }

  protected save(info: string): void {
    this.store.dispatch(updateProject({id: this.projectId(), changes: {description: info}}));
  }
}
