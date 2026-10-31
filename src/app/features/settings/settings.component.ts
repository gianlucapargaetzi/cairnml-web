import {Component} from '@angular/core';
import {MatDrawer, MatDrawerContainer, MatDrawerContent} from '@angular/material/sidenav';
import {MatListModule} from '@angular/material/list';
import {NgTemplateOutlet} from '@angular/common';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {AdminFooterComponent} from '@common/settings/admin/admin-footer/admin-footer.component';
import {injectNarrowScreen} from '@common/shared/utils/narrow-screen';

@Component({
  selector: 'sm-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['../../webapp-common/settings/settings.component.scss'],
  imports: [
    MatDrawerContainer,
    MatDrawer,
    MatListModule,
    RouterLinkActive,
    RouterLink,
    MatDrawerContent,
    RouterOutlet,
    AdminFooterComponent,
    NgTemplateOutlet
  ]
})
export class SettingsComponent {
  protected narrowScreen = injectNarrowScreen();
}
