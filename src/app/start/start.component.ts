import { ChangeDetectorRef, Component, HostListener } from '@angular/core';
import { ContentService } from '../content.service';
import { PostDTO } from 'src/DTOs/postdto';
import { DatePipe } from '@angular/common';
import { EMPTY, catchError, pipe } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { showGeneralError } from 'src/utils';
import { AccountService, JwtToken } from '../account.service';

/**
 * This component is the start page of the website. It show the recommended/following feed.
 */
@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.scss'],
  providers: [DatePipe, ConfirmationService, MessageService]
})
export class StartComponent {

  // public
  publicPosts: PostDTO[] | null = null
  loadingNextPublicPage = false

  // private
  privatePosts: PostDTO[] | null = null
  loadingNextPrivatePage = false

  // The jwt of the current logged in user
  currentUserJwt: JwtToken | null = null

  /**
   * Fetches the public and private (if logged in) feed and subscribes to the new post observable to be able to update the UI when the user posts something new.
   */
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
            if (this.publicPosts != null) {
              this.publicPosts.unshift(post)
              this.publicPosts = [...this.publicPosts]
            } else {
              this.publicPosts = [post]
            }
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

  /**
   * Called by the load more event of the postlist component of the public feed.
   * Loads more posts by making a request using the {@link ContentService} with the paginationStart being the timestamp of the oldest post in the feed.
   * Handles errors/dispalys them.
   */
  loadNextPublicPage() {
    this.loadingNextPublicPage = true
    let oldestPost = this.publicPosts?.at(-1)
    let oldestDate
    if (oldestPost) {
      oldestDate = new Date(oldestPost.createdAt)
    } else {
      oldestDate = new Date()
    }

    this.contentService.getPublicFeed(oldestDate)
      .pipe(
        catchError((err) => {
          console.error(err);
          showGeneralError(this.messageService, 'An error occured while loading more posts, please try again later!')
          this.loadingNextPublicPage = false
          return EMPTY
        })
      )
      .subscribe((data) => {
        if (data.length == 0) {
          showGeneralError(this.messageService, 'No more posts available to load!', 'info', '')
        }
        if (this.publicPosts) {
          this.publicPosts.push(...data)
        } else {
          this.publicPosts = data
        }
        this.loadingNextPublicPage = false
      })
  }

  /**
 * Called by the load more event of the postlist component of the private feed.
 * Loads more posts by making a request using the {@link ContentService} with the paginationStart being the timestamp of the oldest post in the feed.
 * Handles errors/dispalys them.
 */
  loadNextPrivatePage() {
    if (this.currentUserJwt == null) {
      return
    }
    this.loadingNextPrivatePage = true
    let oldestPost = this.privatePosts?.at(-1)
    let oldestDate
    if (oldestPost) {
      oldestDate = new Date(oldestPost.createdAt)
    } else {
      oldestDate = new Date()
    }

    this.contentService.getPrivateFeed(oldestDate)
      .pipe(
        catchError((err) => {
          console.error(err);
          showGeneralError(this.messageService, 'An error occured while loading more posts, please try again later!')
          this.loadingNextPrivatePage = false
          return EMPTY
        })
      )
      .subscribe((data) => {
        if (data.length == 0) {
          showGeneralError(this.messageService, 'No more posts available to load!', 'info', '')
        }
        if (this.privatePosts) {
          this.privatePosts.push(...data)
        } else {
          this.privatePosts = data
        }
        this.loadingNextPrivatePage = false
      })
  }
}


