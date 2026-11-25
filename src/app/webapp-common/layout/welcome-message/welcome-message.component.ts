import {LocationStrategy} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  inject
} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {selectActiveWorkspace, selectGettingStarted} from '@common/core/reducers/users-reducer';
import {Store} from '@ngrx/store';
import {ConfigurationService} from '@common/shared/services/configuration.service';
import {Queue} from '~/business-logic/model/queues/queue';
import {GettingStartedContext} from '../../../../environments/base';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {CopyClipboardComponent} from '@common/shared/ui-components/indicators/copy-clipboard/copy-clipboard.component';
import {YouTubePlayerModule} from '@angular/youtube-player';
import {MatCheckbox} from '@angular/material/checkbox';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {FormsModule} from '@angular/forms';
import {MatTab, MatTabGroup} from '@angular/material/tabs';
import {MatIconModule} from '@angular/material/icon';


interface StepObject {
  id: number;
  header?: string;
  title?: string;
  code?: string;
  subNote?: string;
}

export interface WelcomeMessageData {
  queue: Queue;
  entityName: string;
  step: number;
  showTabs?: boolean;
  newExperimentYouTubeVideoId?: string;
}


@Component({
    selector: 'sm-welcome-message',
    templateUrl: './welcome-message.component.html',
    styleUrls: ['./welcome-message.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
    MatIconModule,
        DialogTemplateComponent,
        CopyClipboardComponent,
        YouTubePlayerModule,
        MatCheckbox,
        MatButton,
        MatIcon,
        FormsModule,
        MatTabGroup,
        MatTab
    ]
})
export class WelcomeMessageComponent {
  private store = inject(Store);
  private dialogRef = inject<MatDialogRef<WelcomeMessageComponent>>(MatDialogRef<WelcomeMessageComponent>);
  public data = inject<WelcomeMessageData>(MAT_DIALOG_DATA);
  protected configService = inject(ConfigurationService);
  private locationStrategy = inject(LocationStrategy);
  protected step = signal(this.data?.step ?? 1);


  WEB_SERVER_URL = window.location.origin + this.locationStrategy.getBaseHref();
  GETTING_STARTED_STEPS: StepObject[] = [{
    id: 1,
    header: 'Get started in a jiffy:',
    title: '1. Install',
    code: 'pip install cairnml',
  }, {
    id: 2,
    title: '2. Configure',
    code: 'cairnml init <server>'
  }];
  ORPHANED_QUEUE_STEPS: StepObject[] =
    [{
      id: 1,
      header: null, code: null,
      subNote: 'See the CairnML documentation for different ways of deploying agents'
    }, {
      id: 2,
      header: 'To set up an agent',
      title: '1. Install',
      code: 'pip install "cairnml[agent]"',
    }, {
      id: 3,
      title: '2. Configure',
      code: 'cairnml-agent init'
    }
    ];
  public links = ['Set up CairnML', 'Run your ML code', 'Relaunch a previous task'];
  public doNotShowAgain: boolean;
  public src: string;
  public queue: Queue = this.data?.queue;
  public entityName: string = this.data?.entityName ?? 'Tasks';
  protected showTabs = this.data?.showTabs;
  protected currentLink = this.showTabs ? this.links[0] : undefined;
  protected host = `${window.location.protocol}//${window.location.hostname}`;

  public workspace = this.store.selectSignal(selectActiveWorkspace);
  private companyGettingStarted = this.store.selectSignal(selectGettingStarted);
  protected target = signal(0);
  protected isJupyter = computed(() => this.target() === 1);
  protected configGettingStarted = computed<GettingStartedContext>(() => this.configService.configuration().gettingStartedContext);
  protected docsLink = computed(() => this.configService.configuration().docsLink);
  protected community = computed(() => this.configService.configuration().communityServer);

  protected steps = computed<StepObject[]>(() => {
    const steps = this.queue ? this.ORPHANED_QUEUE_STEPS : this.GETTING_STARTED_STEPS;

    if (this.queue) {
      // an agent serves only the queue made when it was enrolled (the server refuses any other, also a public one),
      // so the command never names a queue
      steps[0].code = 'cairnml-agent daemon';
      steps[0].header = 'If you have already enrolled an agent on this machine, start it with:';
      steps[1].code = 'pip install "cairnml[agent]"';
      steps[2].code = `cairnml-agent init <server>`;
    } else {
      steps[0].code = this.companyGettingStarted().install ?? this.configGettingStarted().install ?? steps[0].code;
      steps[1].code = this.companyGettingStarted().configure ?? this.configGettingStarted()?.configure ?? steps[1].code;
    }
    // The command names the server by the address this page was opened at.
    steps[this.queue ? 2 : 1].code = steps[this.queue ? 2 : 1].code.replace('<server>', window.location.origin);

    if (this.showTabs) {
      steps[0].header = null;
    }

    if (this.isJupyter()) {
      steps[this.queue ? 2 : 1].code =
        `%env CAIRNML_WEB_HOST=${this.WEB_SERVER_URL}
%env CAIRNML_API_HOST=${this.configService.apiServerUrl()}`;
    }
    return steps;
  });

  constructor() {
    this.dialogRef.beforeClosed().subscribe(res =>
      this.doNotShowAgain && !res? this.dialogRef.close(this.doNotShowAgain) : false);

    if (this.data?.newExperimentYouTubeVideoId) {
      this.loadYoutubeApi(this.data?.newExperimentYouTubeVideoId);
    }
  }

  closeDialog() {
    this.dialogRef.close(this.doNotShowAgain);
  }

  nextSteps(event: MouseEvent) {
    event.preventDefault();
    this.step.update(step => step + 1);
  }

  doNotShowThisAgain(val) {
    this.doNotShowAgain = val;
  }

  showSection(selection: string) {
    this.currentLink = selection;
  }

  loadYoutubeApi(videoId: string) {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    }
    this.src = videoId;
  }

  getCopyPython() {
    if(this.showTabs) {
      return `import numpy as np
import matplotlib.pyplot as plt
# Add the following two lines to your code, to have CairnML automatically log your task
from ${this.configGettingStarted()?.packageName || 'cairnml'} import Task

task = Task.init(project_name='My Project', task_name='My Task')
# Create a plot using matplotlib, or you can also use plotly
plt.scatter(np.random.rand(50), np.random.rand(50), c=np.random.rand(50), alpha=0.5)
# Plot will be reported automatically to cairnml
plt.show()

# Report some scalars
for i in range(100):
  task.get_logger().report_scalar(title="graph title", series="linear", value=i*2, iteration=i)`;
    }
    return `from ${this.configGettingStarted()?.packageName || 'cairnml'} import Task
task = Task.init(project_name="my project", task_name="my task")`;
  }
}
