import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { JWT_OPTIONS, JwtModule } from '@auth0/angular-jwt';
import { CookieService } from 'ngx-cookie-service';
import { environment } from 'src/environments/environment';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { StartComponent } from './start/start.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { PoststatsComponent } from './poststats/poststats.component';
import { ProfileComponent } from './profile/profile.component';
import { PostlistComponent } from './postlist/postlist.component';
import { StatisticsComponent } from './statistics/statistics.component';
import { UserlistComponent } from './userlist/userlist.component';
import { SearchComponent } from './search/search.component';
import { AdminComponent } from './admin/admin.component';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { TabViewModule } from 'primeng/tabview';
import { PasswordModule } from 'primeng/password';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { DialogModule } from 'primeng/dialog';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ListboxModule } from 'primeng/listbox';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TooltipModule } from 'primeng/tooltip';
import { AccordionModule } from 'primeng/accordion';
import { TableModule } from 'primeng/table';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AvatarModule } from 'primeng/avatar';
import { FileUploadModule } from 'primeng/fileupload';
import { ImageCropperModule } from 'ngx-image-cropper';


export function jwtOptionsFactory(cookieService: CookieService) {
  return {
    tokenGetter: () => {
      return cookieService.get('jwt');
    },
    allowedDomains: [environment.serverDomain]
  }
}


@NgModule({
  declarations: [
    AppComponent,
    StartComponent,
    LoginComponent,
    RegisterComponent,
    PoststatsComponent,
    ProfileComponent,
    PostlistComponent,
    StatisticsComponent,
    UserlistComponent,
    SearchComponent,
    AdminComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    JwtModule.forRoot({
      jwtOptionsProvider: {
        provide: JWT_OPTIONS,
        useFactory: jwtOptionsFactory,
        deps: [CookieService],
      },
    }),
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    BrowserAnimationsModule,
    ButtonModule,
    InputTextModule,
    SkeletonModule,
    TabViewModule,
    PasswordModule,
    OverlayPanelModule,
    ToastModule,
    DividerModule,
    DialogModule,
    InputTextareaModule,
    ConfirmPopupModule,
    ListboxModule,
    CalendarModule,
    DropdownModule,
    CardModule,
    ChartModule,
    TooltipModule,
    AccordionModule,
    TableModule,
    ConfirmDialogModule,
    AvatarModule,
    FileUploadModule,
    ImageCropperModule
  ],
  providers: [CookieService],
  bootstrap: [AppComponent]
})
export class AppModule { }
