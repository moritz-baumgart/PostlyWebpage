import { Component, HostListener } from '@angular/core';
import { ContentService } from '../content.service';
import { PostDTO } from 'src/DTOs/postdto';
import { DatePipe } from '@angular/common';
import { EMPTY, catchError, pipe } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { showGeneralError } from 'src/utils';
import { AccountService, JwtToken } from '../account.service';

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.scss'],
  providers: [DatePipe, ConfirmationService, MessageService]
})
export class StartComponent {

  // public
  publicPosts: PostDTO[] = []
  loadingNextPublicPage = false

  // private
  privatePosts: PostDTO[] = []
  loadingNextPrivatePage = false

  // The jwt of the current logged in user
  currentUserJwt: JwtToken | null = null

  constructor(private contentService: ContentService, private messageService: MessageService, accountService: AccountService) {

    // Subscribe to jwt updates
    accountService.getCurrentUserJwt()
      .subscribe(newJwt => {
        this.currentUserJwt = newJwt

        // Fetch the latest private feed, only if logged in, else reset the private posts array
        if (this.currentUserJwt != null) {
          contentService.getPrivateFeed(new Date())
            .pipe(
              catchError(err => {
                showGeneralError(messageService, 'An error occured while loading your following feed. Please try again later!')
                console.error(err);
                return EMPTY
              })
            )
            .subscribe((data) => {
              this.privatePosts = data
            })
        } else {
          this.privatePosts = []
        }
      })

    // Subscribe to the new post subject, this fires when the users adds a new post so we can load it to the start of our list.
    contentService.getNewPostObservable()
      .subscribe((postId) => {
        contentService.retrievePost(postId)
          .pipe(
            catchError((err) => {
              console.error(err);
              showGeneralError(messageService, 'An error occured while loading your newly created post, but it has been added! Please try loading your feed again later!')
              return EMPTY
            })
          )
          .subscribe((post) => {
            this.publicPosts.unshift(post)
          })
      })

    // Fetch the latest public feed
    contentService.getPublicFeed(new Date())
      .pipe(
        catchError(err => {
          showGeneralError(messageService, 'An error occured while loading your public feed. Please try again later!')
          console.error(err);
          return EMPTY
        })
      )
      .subscribe((data) => {
        this.publicPosts = data
      })
  }

  loadNextPublicPage() {
    this.loadingNextPublicPage = true
    let oldestPost = this.publicPosts.at(-1)
    if (!oldestPost) {
      showGeneralError(this.messageService, 'An error occured while loading more posts, please try again later!')
      this.loadingNextPublicPage = false
      return
    }

    this.contentService.getPublicFeed(new Date(oldestPost.createdAt))
      .pipe(
        catchError((err) => {
          console.error(err);
          showGeneralError(this.messageService, 'An error occured while loading more posts, please try again later!')
          return EMPTY
        })
      )
      .subscribe((data) => {
        if (data.length == 0) {
          showGeneralError(this.messageService, 'No more posts available to load!', 'info', '')
        }
        this.publicPosts.push(...data)
        this.loadingNextPublicPage = false
      })
  }

  loadNextPrivatePage() {
    if (this.currentUserJwt == null) {
      return
    }
    this.loadingNextPrivatePage = true
    let oldestPost = this.privatePosts.at(-1)
    if (!oldestPost) {
      showGeneralError(this.messageService, 'An error occured while loading more posts, please try again later!')
      this.loadingNextPrivatePage = false
      return
    }

    this.contentService.getPrivateFeed(new Date(oldestPost.createdAt))
      .pipe(
        catchError((err) => {
          console.error(err);
          showGeneralError(this.messageService, 'An error occured while loading more posts, please try again later!')
          return EMPTY
        })
      )
      .subscribe((data) => {
        if (data.length == 0) {
          showGeneralError(this.messageService, 'No more posts available to load!', 'info', '')
        }
        this.privatePosts.push(...data)
        this.loadingNextPrivatePage = false
      })
  }
}


