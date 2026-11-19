import {HTTP, updateHttpUrlBaseConstant} from '~/app.constants';
import {Environment} from '../environments/base';

describe('updateHttpUrlBaseConstant', () => {
  afterEach(() => {
    delete (window as any).__env;
  });

  it('prefixes a relative API address with the sub path the server is served under', () => {
    (window as any).__env = {subPath: 'cairnml'};

    updateHttpUrlBaseConstant({apiBaseUrl: '/api'} as Environment);

    expect(HTTP.API_BASE_URL).toBe('/cairnml/api');
  });

  it('keeps a relative API address as it is when the server is served at the root', () => {
    (window as any).__env = {subPath: '${CAIRNML_SERVER_SUB_PATH}'};

    updateHttpUrlBaseConstant({apiBaseUrl: '/api'} as Environment);

    expect(HTTP.API_BASE_URL).toBe('/api');
  });

  it('leaves an absolute API address unchanged', () => {
    (window as any).__env = {subPath: 'cairnml'};

    updateHttpUrlBaseConstant({apiBaseUrl: 'https://api.example.test/api'} as Environment);

    expect(HTTP.API_BASE_URL).toBe('https://api.example.test/api');
  });
});
