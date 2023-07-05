import { Component, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { EMPTY, catchError, filter } from 'rxjs';
import { AccountService, JwtToken } from './account.service';
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
  username = ''
  currentRole = ''

  Role = Role

  newPostDialogVisible = false
  newPostText = new FormControl('', Validators.maxLength(282))

  searchQuery = new FormControl('', { nonNullable: true })

  @ViewChild('userOverlayPanel') userOverlayPanel!: OverlayPanel

  // Jwt of the current user
  currentUserJwt: JwtToken | null | undefined

  constructor(private router: Router, private accountService: AccountService, private confirmationService: ConfirmationService, private contentService: ContentService, private messageService: MessageService) {

    // Listen to router events so we can see the current route inside the component.
    // This little hack is used so we can easily disable the title bar inside e.g. the login or register page, since they are the only pages that dont need them.
    router.events
      .pipe(
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe(_ => {
        this.currentRoute = router.url.split('?')[0] // Split to only get the route, but not the parameters after the '?'
      })


    // Inital refresh of the jwt subject
    accountService.refreshCurrentJwt()

    accountService.getCurrentUserJwt()
      .subscribe(newJwt => {
        this.currentUserJwt = newJwt
        if (newJwt != null) {
          this.username = newJwt[ClaimTypes.nameIdentifier]
          this.currentRole = newJwt[ClaimTypes.role]
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

  search() {
    if (this.searchQuery.value.length > 0) {
      this.router.navigateByUrl('/s?q=' + this.searchQuery.value)
    }
  }
}
