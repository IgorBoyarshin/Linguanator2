import { NgModule } from '@angular/core';
import { Routes, RouterModule, CanActivate } from '@angular/router';

import { TestingComponent } from './testing/testing.component';
import { DatabaseComponent } from './database/database.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { SettingsComponent } from './settings/settings.component';
import { StatisticsComponent } from './statistics/statistics.component';
import { LoginComponent } from './login/login.component';
import { AuthGuardService as AuthGuard } from './auth/auth-guard.service';
import { ForAdminGuardService as ForAdminGuard } from './auth/for-admin-guard.service';

const routes: Routes = [
    // TODO: where to nagivate Admin???
    { path: '', redirectTo: '/testing', pathMatch: 'full' },
    { path: 'testing', component: TestingComponent, canActivate: [AuthGuard] },
    { path: 'database', component: DatabaseComponent, canActivate: [AuthGuard] },
    { path: 'settings', component: SettingsComponent, canActivate: [AuthGuard] },
    { path: 'login', component: LoginComponent },
    { path: 'statistics', component: StatisticsComponent, canActivate: [AuthGuard, ForAdminGuard] },
    { path: 'not-found', component: NotFoundComponent },
    { path: '**', redirectTo: '/not-found' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
