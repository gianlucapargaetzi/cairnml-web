import {version} from '../../../../../../version.json';

export interface CommercialContext {
  title?: string;
  subtitle?: string;
  background?: string;
  backgroundPosition?: string;
  list?: { icon: string; title: string; text: string }[];
}

export interface GettingStartedContext {
  install?: string;
  configure?: string;
  packageName?: string;
}

export interface Legal {
  TOULink?: string;
  pricingLink?: string;
}

export interface Environment {
  production: boolean;
  apiBaseUrl: string;
  displayedServerUrls?: {apiServer?: string};
  headerPrefix: string;
  version: string;
  userKey: string;
  userSecret: string;
  companyID: string;
  loginNotice?: string;
  baseUrl?: string;
  autoLogin?: boolean;
  whiteLabelLogo?: boolean;
  whiteLabelLink?: {logo: string; tooltip: string; link: string};
  whiteLabelLoginTitle?: string;
  whiteLabelLoginSubtitle?: string;
  whiteLabelSlogan?: string;
  communityServer?: boolean;
  enterpriseServer?: boolean;
  gettingStartedContext?: GettingStartedContext;
  accountAdministration: boolean;
  communityContext?: CommercialContext;
  GTM_ID?: string;
  gtmResourcePath?: string;
  hideUpdateNotice?: boolean;
  updateCheck?: boolean;
  showSurvey?: boolean;
  plotlyURL?: string;
  slackLink?: string;
  docsLink?: string;
  branding?: { faviconUrl?: string; logo?: string; logoSmall?: string };
  serverDownMessage?: string;
  appsYouTubeIntroVideoId?: string;
  newExperimentYouTubeVideoId?: string;
  appAwareness?: boolean;
  appAwarenessMenu?: boolean;
  baseHref?: string;
  billingServiceUrl?: string;
  legal?: Legal;
  loginPopup?: string;
  showMaskWithoutLabels?: boolean;
  autoLogoutInactiveDurationMinutes?: number;
  appcuesURL?: string;
}

export const BASE_ENV: Environment = {
  communityServer: false,
  enterpriseServer: true,
  accountAdministration: true,
  production: true,
  updateCheck: false,
  autoLogin: false,
  apiBaseUrl: null,
  version,
  baseUrl: '',
  headerPrefix: 'X-Cairnml',
  loginNotice: '',
  userKey: '',
  userSecret: '',
  companyID: '',
  whiteLabelLogo: null,
  whiteLabelLink: null,
  whiteLabelLoginTitle: null,
  whiteLabelLoginSubtitle: null,
  whiteLabelSlogan: null,
  plotlyURL: 'app/webapp-common/assets/plotly-2.35.0.min.js',
  docsLink: '/docs',
  branding: {logo: 'assets/mlops-flow-logo.png', logoSmall: 'assets/mlops-flow-icon.png'},
  serverDownMessage: 'The CairnML server is currently unavailable.<BR>' +
    'Please try to reload this page in a little while.',
  legal: {TOULink: 'https://github.com/gianlucapargaetzi/cairnml-server/blob/main/LICENSE'},
  showMaskWithoutLabels: true,
  newExperimentYouTubeVideoId: 'bjWwZAzDxTY'
};
