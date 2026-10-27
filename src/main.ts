import {enableProdMode} from '@angular/core';
import {bootstrapApplication} from '@angular/platform-browser';
import {ConfigurationService, fetchConfigOutSideAngular} from '@common/shared/services/configuration.service';
import {getBasePath, updateHttpUrlBaseConstant} from '~/app.constants';
import {Environment} from './environments/base';
import {AppRootComponent} from '~/app';
import {getAppConfig} from '~/app.config';

const environment = ConfigurationService.globalEnvironment;

if (environment.production) {
  enableProdMode();
}

(async () => {
  let configData = {} as Environment;
  try {
    configData = await fetchConfigOutSideAngular();
    (window as any).configuration = configData;
  } finally {
    const settings = {...environment, ...configData};
    // An API address from the configuration is relative to the path the server is served under. Without one the app
    // finds its API itself (guessAPIServerURL), which already knows that path.
    if (settings.apiBaseUrl && !/^https?:\/\//.test(settings.apiBaseUrl)) {
      settings.apiBaseUrl = getBasePath() + '/' + settings.apiBaseUrl.replace(/^\/+/, '');
    }
    updateHttpUrlBaseConstant(settings);
    bootstrapApplication(AppRootComponent, getAppConfig(configData)).catch(err => console.error(err));
  }
})();
