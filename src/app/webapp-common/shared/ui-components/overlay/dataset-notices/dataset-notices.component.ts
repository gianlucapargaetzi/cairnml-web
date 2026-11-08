import {ChangeDetectionStrategy, Component, effect, inject, signal, untracked} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {Store} from '@ngrx/store';
import {lastValueFrom} from 'rxjs';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {selectCurrentUserId} from '@common/core/reducers/users-reducer';
import {addMessage} from '@common/core/actions/layout.actions';
import {MESSAGES_SEVERITY} from '@common/constants';
import {InlineAlertComponent} from '@common/shared/ui-components/feedback/inline-alert/inline-alert.component';
import {SmApiRequestsService} from '~/business-logic/api-services/api-requests.service';
import {HTTP} from '~/app.constants';

// A dataset that a task of the signed-in user published to one of their projects (access.notices).
export interface DatasetNotice {
  id: string;
  run_id: string;
  dataset: string;
  project: string;
  created: string | null;
}

/**
 * Notices that a task of the signed-in user published a dataset to a project (docs/design-system/components/feedback.md).
 * Shown in the top right of the app, one per notice, until the user dismisses it (access.dismiss_notice). Nothing is
 * shown when there are no notices.
 */
@Component({
  selector: 'sm-dataset-notices',
  templateUrl: './dataset-notices.component.html',
  styleUrls: ['./dataset-notices.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InlineAlertComponent, MatIconButton, MatIcon],
})
export class DatasetNoticesComponent {
  private api = inject(SmApiRequestsService);
  private store = inject(Store);

  protected readonly currentUserId = toSignal(this.store.select(selectCurrentUserId), {initialValue: null});
  protected readonly notices = signal<DatasetNotice[]>([]);
  protected readonly dismissing = signal<string>(null);

  constructor() {
    effect(() => {
      const userId = this.currentUserId();
      untracked(() => {
        if (userId) {
          this.load();
        } else {
          this.notices.set([]);
        }
      });
    });
  }

  protected async load() {
    try {
      const res = await lastValueFrom(this.api.post<{notices?: DatasetNotice[]}>(`${HTTP.API_BASE_URL}/access.notices`, {}, {}));
      this.notices.set(res?.notices ?? []);
    } catch (error) {
      this.store.dispatch(addMessage(MESSAGES_SEVERITY.ERROR,
        `Could not load the dataset notices: ${error?.meta?.result_msg ?? 'the server did not respond'}. Reload the page to try again.`));
    }
  }

  protected async dismiss(notice: DatasetNotice) {
    this.dismissing.set(notice.id);
    try {
      await lastValueFrom(this.api.post(`${HTTP.API_BASE_URL}/access.dismiss_notice`, {id: notice.id}, {}));
      this.notices.update(list => list.filter(n => n.id !== notice.id));
    } catch (error) {
      this.store.dispatch(addMessage(MESSAGES_SEVERITY.ERROR,
        error?.meta?.result_msg ?? 'The notice could not be dismissed. Try again.'));
    } finally {
      this.dismissing.set(null);
    }
  }
}
