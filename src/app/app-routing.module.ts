import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StartComponent } from './start/start.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ProfileComponent } from './profile/profile.component';
import { StatisticsComponent } from './statistics/statistics.component';
import { SearchComponent } from './search/search.component';
import { AdminComponent } from './admin/admin.component';

const routes: Routes = [
  { path: '', component: StartComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'u/:username', component: ProfileComponent },
  { path: 'u', component: ProfileComponent },
  { path: 'stats', component: StatisticsComponent },
  { path: 's', component: SearchComponent },
  { path: 'admin', component: AdminComponent }
];

/**
 * This class defines the routes of the SPA. They are defined in the {@link routes} object.
 */
@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
