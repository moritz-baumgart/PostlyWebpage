import { Component, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { EMPTY, catchError, filter } from 'rxjs';
import { AccountService } from './account.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { ClaimTypes } from 'src/DTOs/claimtypes';
import { ConfirmationService, MessageService } from 'primeng/api';
import { FormControl, Validators } from '@angular/forms';
import { ContentService } from './content.service';
import { showGeneralError } from 'src/utils';
import { Role } from 'src/DTOs/role';
import { OverlayPanel } from 'primeng/overlaypanel';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class AppComponent {
  title = 'PostlyWebpage';

  currentRoute = ''
  loggedIn: boolean | undefined
  username = ''
  currentRole = ''

  Role = Role

  newPostDialogVisible = false
  newPostText = new FormControl('', Validators.maxLength(282))

  @ViewChild('userOverlayPanel') userOverlayPanel!: OverlayPanel

  constructor(private router: Router, private accountService: AccountService, jwtHelper: JwtHelperService, private confirmationService: ConfirmationService, private contentService: ContentService, private messageService: MessageService) {

    // Listen to router events so we can see the current route inside the component.
    // This little hack is used so we can easily disable the title bar inside e.g. the login or register page, since they are the only pages that dont need them.
    router.events
      .pipe(
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe(_ => {
        this.currentRoute = router.url.split('?')[0] // Split to only get the route, but not the parameters after the '?'
      })


    // Inital refresh of the login status
    accountService.refreshLoginStatus()

    accountService.isLoggedIn()
      .subscribe((res) => {
        this.loggedIn = res
        if (this.loggedIn) {
          this.username = jwtHelper.decodeToken()[ClaimTypes.nameIdentifier]
          this.currentRole = jwtHelper.decodeToken()[ClaimTypes.role]
        }
      })
  }

  logout() {
    this.accountService.logout('/')
    this.userOverlayPanel.hide()
  }

  discardPost(event: Event) {
    this.confirmationService.confirm({
      target: event.target!,
      message: 'Do you really want to discard your post?',
      icon: 'pi pi-question',
      accept: () => {
        this.newPostText.setValue('')
      }
    })
  }

  createNewPost() {

    if (!this.newPostText.valid) {
      return
    }

    let newPostTextVal = this.newPostText.value
    if (!newPostTextVal) {
      return
    }

    this.contentService.createPost(newPostTextVal)
      .pipe(
        catchError((err) => {
          console.error(err);
          showGeneralError(this.messageService, 'An error occured while adding your post, please try again later!')
          return EMPTY
        })
      )
      .subscribe((res) => {
        this.newPostDialogVisible = false
        this.newPostText.setValue('')
        showGeneralError(this.messageService, 'Post created!', 'success', '')
      })
  }
}
