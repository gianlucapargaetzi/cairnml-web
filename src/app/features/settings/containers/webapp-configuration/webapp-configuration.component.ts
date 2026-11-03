import { Component } from '@angular/core';
import {ProfilePreferencesComponent} from '@common/settings/admin/profile-preferences/profile-preferences.component';
import {PageHeaderComponent} from '@common/shared/ui-components/layout/page-header/page-header.component';

@Component({
    selector: 'sm-webapp-configuration',
    imports: [
        ProfilePreferencesComponent,
    PageHeaderComponent,
    ],
    templateUrl: './webapp-configuration.component.html',
    styleUrl: './webapp-configuration.component.scss'
})
export class WebappConfigurationComponent {

}
