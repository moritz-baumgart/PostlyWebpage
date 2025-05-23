import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { EMPTY, catchError } from 'rxjs';
import { CommentDTO } from 'src/DTOs/commentdto';
import { PostDTO } from 'src/DTOs/postdto';
import { showGeneralError } from 'src/utils';
import { ContentService } from '../content.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AccountService, JwtToken } from '../account.service';
import { Role } from 'src/DTOs/role';
import { ClaimTypes } from 'src/DTOs/claimtypes';
import { environment } from 'src/environments/environment';

/**
 * This component displays a list of posts. It emits an event when it's load more btn is pressed. It also expects a string to show when the post list is empty and a boolean which indicates if new post are being fetched.
 * 
 * @example
 * ```
 * <app-postlist [posts]="posts" [nextPageLoadingState]="loadingNextPage" (loadNextPage)="loadMore()" emptyMessage="No posts to show here!"></app-postlist>
 * ```
 */
@Component({
  selector: 'app-postlist',
  templateUrl: './postlist.component.html',
  styleUrls: ['./postlist.component.scss']
})
export class PostlistComponent {

  // Make things available in HTML template
  Array = Array
  Role = Role
  env = environment

  // Post details
  postDetailsVisible = false
  postDetails: PostDetails | undefined
  commentText = new FormControl('', Validators.maxLength(282))
  savedCommentTexts: { [key: number]: string } = {}

  // Pagination
  @Input({ required: true }) posts!: PostDTO[] | null
  @Input({ required: true }) nextPageLoadingState!: boolean
  @Output() loadNextPage = new EventEmitter()

  // This is shown, when posts empty
  @Input({ required: true }) emptyMessage!: string

  skeletonHeights = [8, 14, 20, 25]

  // The jwt and derived info of the current logged in user
  currentUserJwt: JwtToken | null = null
  currentUserName = ''
  currentUserRoleName = ''

  // Indicates if a post deletion is already in progress
  postDeleteLoading = false


  constructor(private contentService: ContentService, private messageService: MessageService, private datePipe: DatePipe, private confirmationService: ConfirmationService, accountService: AccountService) {

    // Randomly shuffles the skeletonHeights array to give the skeletons a random "order"
    this.skeletonHeights = this.skeletonHeights.sort(() => Math.random() - 0.5)

    // Subscribe to the current jwt observable to get login updates
    accountService.getCurrentUserJwt()
      .subscribe(newJwt => {
        this.currentUserJwt = newJwt
        if (newJwt != null) {
          this.currentUserName = newJwt[ClaimTypes.nameIdentifier]
          this.currentUserRoleName = newJwt[ClaimTypes.role]
        } else {
          this.currentUserName = ''
          this.currentUserRoleName = ''
        }
      })
  }


  /**
   * Converts given PostDTO to a PostDetails object which is then displayed in a dialog.
   * @param post The post to show.
   */
  showPostDetails(post: PostDTO) {
    this.postDetails = new PostDetails(post, this.datePipe)
    this.commentText.setValue(this.savedCommentTexts[post.id])
    this.postDetailsVisible = true
    this.loadComments(post.id)
  }

  /**
   * Loads comments for a posts and adds them to the current PostDetails object to display them.
   * @param postId The id of the post to load the comments for.
   */
  private loadComments(postId: number) {
    this.contentService.getCommentsForPost(postId)
      .pipe(
        catchError((err) => {
          console.error(err);
          showGeneralError(this.messageService, 'An error occured while loading the comments, please try again later!')
          return EMPTY
        })
      ).subscribe((res) => {
        if (this.postDetails) {
          this.postDetails.comments = res
        }
      })
  }


  /**
   * This method is called when the dialog closes, it temporarily saves started comments for the post so the user can continue writing it later.
   */
  postDetailsHide() {
    if (this.postDetails) {
      this.savedCommentTexts[this.postDetails.post.id] = this.commentText.value ?? ''
    }
  }


  /**
   * Called by the discard button, opens a confirm and if the user clicks yes it clears the comment input
   */
  discard(event: Event) {
    this.confirmationService.confirm({
      target: event.target!,
      message: 'Do you really want to discard your comment?',
      icon: 'pi pi-question',
      accept: () => {
        this.commentText.setValue('')
      }
    })
  }


  /**
   * Called by the comment button, submits the comment using the {@link ContentService}.
   */
  comment() {
    if (!this.postDetails) {
      return
    }

    if (!this.commentText.valid) {
      return
    }

    let commentTextVal = this.commentText.value
    if (!commentTextVal) {
      return
    }

    this.contentService.createComment(this.postDetails.post.id, commentTextVal)
      .pipe(
        catchError((err) => {
          console.error(err);
          showGeneralError(this.messageService, 'An error occured while adding your comment, please try again later!')
          return EMPTY
        })
      )
      .subscribe((res) => {
        this.commentText.setValue('')
        if (this.postDetails) {
          this.postDetails.post.commentCount = res
          this.loadComments(this.postDetails.post.id)
        }
      })
  }

  /**
   * Called when the load more btn is clicked, emits an event to the parent to request more posts from it.
   */
  requestNextPage() {
    this.loadNextPage.emit()
  }

  /**
   * Submits a delete request using the {@link ContentService} for the given post id. Displays a confirmation message, which is different depending on the authorUsername.
   * @param postId To id of the post to delete.
   * @param authorUsername The author's username of the post to delete.
   */
  deletePost(event: MouseEvent, postId: number, authorUsername: string) {
    event.stopPropagation() // Prevent propagation so we dont open the post detail view

    if (this.postDeleteLoading) {
      return
    }
    this.postDeleteLoading = true

    let isSelf = this.currentUserName == authorUsername

    this.confirmationService.confirm({
      target: event.target!,
      message: isSelf ? 'Do you really want to DELETE your post?' : 'Do you really want to DELETE THE POST OF @' + authorUsername + '?',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-outlined',
      accept: () => {
        this.contentService.deletePost(postId)
          .pipe(
            catchError((err) => {
              showGeneralError(this.messageService, 'There was an error deleting the post. Please try again later!')
              console.error(err);
              this.postDeleteLoading = false
              return EMPTY
            })
          )
          .subscribe(_ => {
            showGeneralError(this.messageService, 'Post deleted!', 'info', '')
            if (this.posts) this.posts = this.posts.filter(p => p.id != postId)
            this.postDeleteLoading = false
          })
      },
      reject: () => {
        this.postDeleteLoading = false
      }
    })

  }
}

/**
 * This class contains the details of a post relevant for display. A PostDTO can be used to construct it.
 */
class PostDetails {

  headerUsername: string;
  headerDate: string;
  linkUsername: string
  content: string;
  comments: CommentDTO[] | null = null
  post: PostDTO;
  profileImageUrl: string | null = null
  attachedImageUrl: string | null = null

  constructor(post: PostDTO, datePipe: DatePipe) {
    this.post = post
    if (post.author.displayName) {
      this.headerUsername = `${post.author.displayName} (@${post.author.username})`
    } else {
      this.headerUsername = `@${post.author.username}`
    }
    this.headerDate = ` | ${datePipe.transform(post.createdAt, 'medium')}`
    this.linkUsername = post.author.username
    this.content = post.content
    this.profileImageUrl = post.author.profileImageUrl
    this.attachedImageUrl = post.attachedImageUrl
  }
}