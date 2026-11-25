import {LocationStrategy} from '@angular/common';
import {signal} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {provideMockStore} from '@ngrx/store/testing';
import {of} from 'rxjs';
import {selectActiveWorkspace, selectGettingStarted} from '@common/core/reducers/users-reducer';
import {ConfigurationService} from '@common/shared/services/configuration.service';
import {Queue} from '~/business-logic/model/queues/queue';
import {WelcomeMessageComponent} from './welcome-message.component';

describe('WelcomeMessageComponent', () => {
  let fixture: ComponentFixture<WelcomeMessageComponent>;
  let component: WelcomeMessageComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WelcomeMessageComponent],
      providers: [
        provideMockStore({
          selectors: [
            {selector: selectActiveWorkspace, value: null},
            {selector: selectGettingStarted, value: {}},
          ]
        }),
        {provide: MAT_DIALOG_DATA, useValue: {queue: null, entityName: 'Tasks', step: 2, showTabs: false}},
        {provide: MatDialogRef, useValue: {beforeClosed: () => of(undefined), close: () => undefined}},
        {provide: LocationStrategy, useValue: {getBaseHref: () => '/'}},
        {
          provide: ConfigurationService,
          useValue: {
            configuration: signal({gettingStartedContext: {}, docsLink: '', communityServer: false}),
            apiServerUrl: () => 'http://api.example.test',
          }
        },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WelcomeMessageComponent);
    component = fixture.componentInstance;
  });

  function renderedCode(): string {
    const codeBlocks: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.step-container .code .content'));
    return codeBlocks.map(block => block.textContent).join('\n');
  }

  it('the Jupyter tab sets the web and API hosts and no access keys', () => {
    component['target'].set(1);
    fixture.detectChanges();

    const code = renderedCode();
    expect(code).toContain('CAIRNML_WEB_HOST');
    expect(code).toContain('CAIRNML_API_HOST=http://api.example.test');
    expect(code).not.toContain('ACCESS_KEY');
    expect(code).not.toContain('SECRET_KEY');
    expect(code).not.toContain('API access key');
  });

  it('a queue without an agent shows the agent extra as the install line', () => {
    component.queue = {name: 'q1', id: 'x'} as Queue;
    fixture.detectChanges();

    const code = renderedCode();
    expect(code).toContain('pip install "cairnml[agent]"');
    expect(code).not.toContain('pip install cairnml-agent');
  });

  it('never tells the user to start an agent on a named queue: an agent serves only its own queue', () => {
    for (const name of ['default', 'parg-nb-1a2b3c']) {
      component.queue = {name, id: 'x'} as Queue;
      fixture.detectChanges();

      const code = renderedCode();
      expect(code).not.toContain('--queue');
      expect(code).toContain('cairnml-agent daemon');
      expect(code).toContain('cairnml-agent init');
    }
  });

  it('a queue without an agent says that an agent serves only the queue made when it was enrolled', () => {
    component.queue = {name: 'default', id: 'x'} as Queue;
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent.replace(/\s+/g, ' ');
    expect(text).toContain('serves only the queue made when it was enrolled');
    expect(text).toContain('enrol an agent');
    expect(text).not.toContain('To assign an agent to the default queue');
  });
});
