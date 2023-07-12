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
import { environment } from 'src/environments/environment';
import { FileUpload } from 'primeng/fileupload';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class AppComponent {

  // Make things available in the template
  env = environment

  title = 'PostlyWebpage';

  currentRoute = ''
  username = ''
  currentRole = ''
  profilePictureUrl: string | null = null

  Role = Role

  newPostDialogVisible = false
  newPostText = new FormControl('', Validators.maxLength(282))

  searchQuery = new FormControl('', { nonNullable: true })

  @ViewChild('postFileUpload') postFileUpload!: FileUpload
  fileToUpload: File | null = null

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
          this.profilePictureUrl = environment.apiBase + '/image/user/' + this.username
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
      .subscribe((postId) => {

        if (this.fileToUpload != null) {
          this.contentService.addImageToPost(postId, this.fileToUpload)
            .pipe(
              catchError(err => {
                this.newPostDialogVisible = false
                this.newPostText.setValue('')
                showGeneralError(this.messageService, 'Error adding the image to the post! Your post was still created but without an image.')
                console.error(err);
                return EMPTY
              })
            )
            .subscribe(_ => {
              this.handlePostCreated(postId)
            })
        } else {
          this.handlePostCreated(postId)
        }
      })
  }

  private handlePostCreated(postId: number) {
    this.contentService.newPostCreatedSubject.next(postId)
    this.newPostDialogVisible = false
    this.newPostText.setValue('')
    this.clearFile()
    showGeneralError(this.messageService, 'Post created!', 'success', '')
  }

  onFileSelect(event: FileSelectEvent) {
    const file = event.currentFiles[0]
    if (file) {
      this.fileToUpload = file
    }
  }

  clearFile() {
    this.fileToUpload = null
    this.postFileUpload.clear()
  }

  search() {
    if (this.searchQuery.value.length > 0) {
      this.router.navigateByUrl('/s?q=' + this.searchQuery.value)
    }
  }

  profilePictureError() {
    this.profilePictureUrl = null
  }
}

interface FileSelectEvent {
  originalEvent: Event
  files: File[]
  currentFiles: File[]
}