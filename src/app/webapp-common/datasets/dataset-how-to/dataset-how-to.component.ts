import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {DatePipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatTab, MatTabGroup} from '@angular/material/tabs';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatFormField, MatHint, MatInput, MatLabel} from '@angular/material/input';
import {MatIcon} from '@angular/material/icon';
import {MatOption, MatSelect} from '@angular/material/select';
import {Store} from '@ngrx/store';
import {PrimeTemplate} from 'primeng/api';
import {toSignal} from '@angular/core/rxjs-interop';
import {lastValueFrom, of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {SectionHeaderComponent} from '@common/shared/components/section-header/section-header.component';
import {CodeEditorComponent} from '@common/shared/ui-components/data/code-editor/code-editor.component';
import {TableComponent} from '@common/shared/ui-components/data/table/table.component';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {selectCurrentUserId, selectIsAdmin} from '@common/core/reducers/users-reducer';
import {addMessage} from '@common/core/actions/layout.actions';
import {MESSAGES_SEVERITY} from '@common/constants';
import {ApiUsersService} from '~/business-logic/api-services/users.service';
import {DatasetRegistryService} from '../dataset-git/dataset-registry.service';
import {RegistryRecord} from '../dataset-git/dataset-git.model';
import {DatasetAccessService, DatasetVisibility, StoredCredential} from '../dataset-git/dataset-access.service';
import {DatasetRemovalService} from '../dataset-git/dataset-removal.service';

interface RegistryRow {
  id: string;
  repository: string;
  url: string;
  added: string;
  added_by: string;
  ownerId: string;
  dataId: string | null;
}

// How to create and use a dataset from the SDK on a host, and the dataset registries of the server. The code cells are
// sized to their content. Only an admin adds or removes a registry; everyone else sees the list.
@Component({
  selector: 'sm-dataset-how-to',
  templateUrl: './dataset-how-to.component.html',
  styleUrls: ['./dataset-how-to.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    FormsModule,
    MatTab,
    MatTabGroup,
    MatButton,
    MatIconButton,
    MatFormField,
    MatInput,
    MatLabel,
    MatHint,
    MatIcon,
    MatSelect,
    MatOption,
    DialogTemplateComponent,
    SectionHeaderComponent,
    CodeEditorComponent,
    TableComponent,
    PrimeTemplate,
    TooltipDirective,
  ],
})
export class DatasetHowToComponent {
  private registryApi = inject(DatasetRegistryService);
  private datasetApi = inject(DatasetAccessService);
  private usersApi = inject(ApiUsersService);
  private store = inject(Store);
  private removal = inject(DatasetRemovalService);

  protected readonly topTab = signal(0);
  protected readonly isAdmin = toSignal(this.store.select(selectIsAdmin), {initialValue: false});

  protected readonly registries = signal<RegistryRecord[]>([]);
  protected readonly names = signal<Map<string, string>>(new Map());
  protected readonly loading = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal<string>(null);
  protected readonly currentUserId = toSignal(this.store.select(selectCurrentUserId), {initialValue: null});
  protected readonly addKind = signal<'repo' | 'registry'>('repo');
  protected readonly addUrl = signal('');
  protected readonly addVisibility = signal<DatasetVisibility>('user');
  // the credential a repository is read with ('' for a public repository); the credentials the user may choose
  protected readonly addCredential = signal('');
  protected readonly credentials = signal<StoredCredential[]>([]);
  protected readonly visibilityOptions: {value: DatasetVisibility; label: string}[] = [
    {value: 'user', label: 'User only'},
    {value: 'projects', label: 'Projects'},
    {value: 'Public', label: 'Public'},
  ];

  protected readonly registryColumns: ISmCol[] = [
    {id: 'url', header: 'Repository', sortable: false},
    {id: 'added', header: 'Added', sortable: false},
    {id: 'added_by', header: 'Added by', sortable: false},
    {id: 'actions', header: '', sortable: false},
  ];

  protected readonly registryRows = computed<RegistryRow[]>(() => this.registries().map(registry => ({
    id: registry.repository,
    repository: registry.repository,
    url: registry.url || registry.repository,
    added: registry.added,
    added_by: this.names().get(registry.added_by) ?? registry.added_by,
    ownerId: registry.added_by,
    dataId: registry.id ?? null,
  })));

  constructor() {
    this.loadRegistries();
    this.loadCredentials();
  }

  // The credentials the user may choose for a repository: their own, and the company's. Without them, the form still works
  // (a public repository needs none).
  private loadCredentials() {
    this.datasetApi.credentials()
      .pipe(catchError(() => of([] as StoredCredential[])))
      .subscribe(list => this.credentials.set(list));
  }

  // One line of a code cell is about 21px high; the cell adds a little padding.
  protected height(code: string): number {
    return code.split('\n').length * 21 + 20;
  }

  protected async loadRegistries() {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.registries.set(await lastValueFrom(this.registryApi.registries()));
      const users = await lastValueFrom(this.usersApi.usersGetAllEx({only_fields: ['id', 'name']}));
      this.names.set(new Map((users.users ?? []).map(user => [user.id, user.name])));
    } catch (error) {
      this.error.set(error?.meta?.result_msg ?? 'The registries could not be loaded.');
    } finally {
      this.loading.set(false);
    }
  }

  // Adds a repository or a registry as a dataset. A dataset with no access is still added: the banner says which one.
  protected async addDataset() {
    const url = this.addUrl().trim();
    if (!url) {
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    try {
      const credential = this.addKind() === 'repo' ? this.addCredential() : '';
      const dataset = await lastValueFrom(this.datasetApi.add(this.addKind(), url, this.addVisibility(), undefined, credential));
      if (dataset.state === 'no_access') {
        this.store.dispatch(addMessage(MESSAGES_SEVERITY.ERROR, dataset.state_message));
      } else {
        this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, `Added ${dataset.name}`));
      }
      this.addUrl.set('');
      await this.loadRegistries();
    } catch (error) {
      this.error.set(error?.meta?.result_msg ?? 'The dataset could not be added.');
    } finally {
      this.busy.set(false);
    }
  }

  // An admin, or the user who added the registry, may remove it. A registry without a dataset id (an older one) cannot be
  // removed: the server removes a registry only as its dataset.
  protected canRemove(row: RegistryRow): boolean {
    return row.dataId !== null && (this.isAdmin() || row.ownerId === this.currentUserId());
  }

  protected removeRegistry(row: RegistryRow) {
    if (row.dataId === null) {
      return;
    }
    const dataId = row.dataId;
    this.run(() => lastValueFrom(this.removal.remove({id: dataId, name: row.repository, kind: 'registry'})));
  }

  private async run(action: () => Promise<unknown>) {
    this.busy.set(true);
    this.error.set(null);
    try {
      await action();
      await this.loadRegistries();
    } catch (error) {
      this.error.set(error?.meta?.result_msg ?? error?.message ?? 'The change could not be saved.');
    } finally {
      this.busy.set(false);
    }
  }

  protected readonly dvcCode = `pip install "cairnml[dataset]"
# the files go to DVC storage (the default, --storage s3)
cairnml dataset create cars-data --from /path/to/measurements --storage s3
cairnml dataset doctor
cairnml dataset register`;

  protected readonly lfsCode = `pip install "cairnml[dataset]"
# needs git, the GitHub command line (gh, logged in) and the CairnML server
cairnml dataset create cars-data --from /path/to/measurements --storage lfs
cairnml dataset doctor
cairnml dataset register`;

  protected readonly useLocalCode = `from cairnml import Task
from cairnml.datasets import Dataset

task = Task.init(project_name="cars", task_name="train")
# a commit, tag or branch of a dataset repository; the run records the commit it used
data = Dataset.get("https://github.com/acme/cars-data.git", "3f2a9c1")
print(data.path)   # a folder with the files`;

  protected readonly registryCode = `git clone https://github.com/gianlucapargaetzi/cairnml-dataset-registry
cd cairnml-dataset-registry
git checkout -b feature/add-cars-web

# 1. the adapter reads the files into the CairnML format: adapters/cars_web.py
# 2. a small sample of the source, for the test: tests/data/cars_web/
# 3. the entry that names the source and the adapter: datasets/cars-web.yaml
python -m pytest tests

git add .
git commit -m "Add cars-web"
git push -u origin feature/add-cars-web
gh pr create --fill`;

  protected readonly entryYaml = `# Cars: a web dataset, read at a fixed address with a checksum for each file.
source: web
adapter: cars_web
fetch:
  - url: https://example.org/cars/cars-train.zip
    checksum: md5:0123456789abcdef0123456789abcdef
    unpack: zip`;

  protected readonly useWebCode = `from cairnml import Task
from cairnml.datasets import Dataset

task = Task.init(project_name="cars", task_name="train")
# the entry by its registry name; the run records the registry commit and the revision
data = Dataset.get_external("cars-web")
for sample in data.samples("train"):
    image_file = sample.modality("image")
    label = sample.label("class")`;

  protected readonly trainingCode = `import numpy as np
import pandas as pd
from cairnml import Task
from cairnml.datasets import Dataset

task = Task.init(project_name="cars", task_name="train")
settings = task.connect({"epochs": 50, "lr": 0.05})

# a commit of the dataset repository; the run records the commit it used
data = Dataset.get("https://github.com/acme/cars-data.git", "3f2a9c1")
train = pd.read_csv(data.path / "train.csv")

# replace "price" with the target column of your dataset
X = train.drop(columns="price").to_numpy(dtype=float)
y = train["price"].to_numpy(dtype=float)
w = np.zeros(X.shape[1])

logger = task.get_logger()
for epoch in range(settings["epochs"]):
    error = X @ w - y
    w -= settings["lr"] * X.T @ error / len(y)
    logger.report_scalar("loss", "train", value=float((error ** 2).mean()), iteration=epoch)

task.close()`;
}
