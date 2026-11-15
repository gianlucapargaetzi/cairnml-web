import {TestBed} from '@angular/core/testing';
import {provideMockStore} from '@ngrx/store/testing';
import {selectCompanyPreSignServices} from '~/core/reducers/auth.reducers';
import {selectRevokeSucceed} from '../../core/reducers/common-auth-reducer';
import {ConfigurationService} from '../../shared/services/configuration.service';
import {BaseAdminService} from './base-admin.service';
import {SignResponse} from './base-admin-utils';

describe('BaseAdminService.signUrlIfNeeded', () => {
  let service: BaseAdminService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BaseAdminService,
        provideMockStore({
          selectors: [
            {selector: selectRevokeSucceed, value: false},
            {selector: selectCompanyPreSignServices, value: []},
          ]
        }),
        {provide: ConfigurationService, useValue: {}},
      ]
    });
    service = TestBed.inject(BaseAdminService);
  });

  function signed(url: string): SignResponse {
    let result: SignResponse;
    service.signUrlIfNeeded(url).subscribe(res => result = res);
    return result;
  }

  it('does not sign an S3 bucket link in the browser; it reports that the bucket cannot be signed', () => {
    const res = signed('s3://my-bucket/folder/image.png');
    expect(res.type).toBe('popup');
    expect(res.provider).toBe('s3');
    expect(res.signed).toBeUndefined();
  });

  it('does not sign an Azure link with a stored secret; it reports the bucket', () => {
    const res = signed('azure://account/container/image.png');
    expect(res.type).toBe('popup');
    expect(res.provider).toBe('azure');
  });

  it('signs a Google Cloud link by its address', () => {
    const res = signed('gs://my-bucket/image.png');
    expect(res.type).toBe('sign');
    expect(res.signed).toBe('https://storage.cloud.google.com/my-bucket/image.png');
  });

  it('leaves a plain link as it is', () => {
    const res = signed('https://example.com/image.png');
    expect(res.type).toBe('sign');
    expect(res.signed).toBe('https://example.com/image.png');
  });
});
