import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ErrorHandler } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef } from '@angular/material/dialog';

import { MarkdownCheatSheetDialogComponent } from './markdown-cheat-sheet-dialog.component';

describe('MarkdownCheatSheetDialogComponent', () => {
  let component: MarkdownCheatSheetDialogComponent;
  let fixture: ComponentFixture<MarkdownCheatSheetDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ MarkdownCheatSheetDialogComponent ],
      providers: [
        provideHttpClient(),
        { provide: MatDialogRef, useValue: {} }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarkdownCheatSheetDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('MarkdownCheatSheetDialogComponent when the cheat sheet cannot be loaded', () => {
  it('shows the note and reports nothing', async () => {
    const reported: unknown[] = [];
    await TestBed.configureTestingModule({
      imports: [ MarkdownCheatSheetDialogComponent ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: {} },
        { provide: ErrorHandler, useValue: { handleError: (e: unknown) => reported.push(e) } }
      ]
    }).compileComponents();
    const fixture = TestBed.createComponent(MarkdownCheatSheetDialogComponent);
    const httpMock = TestBed.inject(HttpTestingController);

    fixture.detectChanges();
    httpMock.expectOne('app/webapp-common/assets/markdown-cheatsheet.html')
      .flush('', { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('[data-id="cheatSheetError"]')?.textContent)
      .toContain('The cheat sheet could not be loaded.');
    expect(reported).toEqual([]);
    httpMock.verify();
  });
});
