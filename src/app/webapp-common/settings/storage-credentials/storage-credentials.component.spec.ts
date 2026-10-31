import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { EMPTY } from 'rxjs';
import { selectCredentials } from '~/features/settings/settings.selectors';

import { StorageCredentialsComponent } from './storage-credentials.component';

describe('DeleteCredsComponent', () => {
  let component: StorageCredentialsComponent;
  let fixture: ComponentFixture<StorageCredentialsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StorageCredentialsComponent],
      providers: [provideMockActions(() => EMPTY), provideMockStore({
        selectors: [
          { selector: selectCredentials, value: { aws: { buckets: [] }, google: { buckets: [] }, azure: { containers: [] } } }
        ]
      })]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StorageCredentialsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
