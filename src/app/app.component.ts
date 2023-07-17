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
import { FileSelectEvent } from 'src/DTOs/fileselectevent';

/**
 * This is the main component of the application.
 * It contains the header with the search bar and navigation and a router-outlet to show all other routes.
 */
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

  /**
   * An initial refresh of the jwt subject is done and if the user is logged in their username, role and image is set in the UI.
   */
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

  /**
   * Called by the logout btn. Makes a logout request using the {@link AccountService}.
   */
  logout() {
    this.accountService.logout('/')
    this.userOverlayPanel.hide()
  }

  /**
   * Resets the new post dialog and closes it.
   */
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

  /**
   * Called by the post btn inside the new post dialog.
   * Validates input and makes the needes request to create a new post using the {@link ContentService} and handles error response.
   */
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

  /**
   * Private helper method called by {@link createNewPost} to handle when the new post was successfully created.
   * @param postId The id of the newly created post.
   */
  private handlePostCreated(postId: number) {
    this.contentService.newPostCreatedSubject.next(postId)
    this.newPostDialogVisible = false
    this.newPostText.setValue('')
    this.clearFile()
    showGeneralError(this.messageService, 'Post created!', 'success', '')
  }

  /**
   * Called by the file selector component, updates the file to be used later when posting/uploading.
   */
  onFileSelect(event: FileSelectEvent) {
    const file = event.currentFiles[0]
    if (file) {
      this.fileToUpload = file
    }
  }

  /**
   * Clears the file selector and the temporary saved file.
   */
  clearFile() {
    this.fileToUpload = null
    this.postFileUpload.clear()
  }

  /**
   * Called when the search btn is clicked.
   * If the search query is not empty it redirects to the search component with respective search parameters.
   */
  search() {
    if (this.searchQuery.value.length > 0) {
      this.router.navigateByUrl('/s?q=' + this.searchQuery.value)
    }
  }

  /**
   * Called when the avatar component encounters an error while loading the profile picture.
   * It sets the url to null so the UI shows a fallback icon instead.
   */
  profilePictureError() {
    this.profilePictureUrl = null
  }
}
