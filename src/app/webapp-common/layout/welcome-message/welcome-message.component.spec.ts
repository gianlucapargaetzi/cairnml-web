import {LocationStrategy} from '@angular/common';
import {signal} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {provideMockStore} from '@ngrx/store/testing';
import {of} from 'rxjs';
import {selectActiveWorkspace, selectGettingStarted} from '@common/core/reducers/users-reducer';
import {ConfigurationService} from '@common/shared/services/configuration.service';
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
});
