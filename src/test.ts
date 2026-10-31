// Test bootstrap for the karma builder (angular.json "test" target of trains-webapp).
// zone.js/testing is loaded as a test polyfill; the builder loads every *.spec.ts file listed in tsconfig.spec.json.

import {getTestBed} from '@angular/core/testing';
import {BrowserTestingModule, platformBrowserTesting} from '@angular/platform-browser/testing';

getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
