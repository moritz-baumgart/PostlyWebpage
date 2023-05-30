import { Component, HostListener } from '@angular/core';
import { ContentService } from '../content.service';
import { PostDTO } from 'src/DTOs/postdto';
import { VoteInteractionType } from 'src/DTOs/voteinteractiontype';
import { DatePipe } from '@angular/common';
import { EMPTY, catchError } from 'rxjs';
import { CommentDTO } from 'src/DTOs/commentdto';
import { AccountService } from '../account.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.scss'],
  providers: [DatePipe, ConfirmationService, MessageService]
})
export class StartComponent {

  public VoteInteractionType = VoteInteractionType;

  posts: PostDTO[] = []

  skeletonHeights = [8, 14, 20, 25]
  loggedIn: boolean | undefined

  postDetailsVisible = false
  postDetails: PostDetails | undefined
  commentText = new FormControl('', Validators.maxLength(282))
  savedCommentTexts: { [key: number]: string } = {}

  Array = Array
  pageNumber: number;
  paginationStart: Date;
  loadingNextPage = false

  constructor(private contentService: ContentService, private datePipe: DatePipe, accountService: AccountService, private confirmationService: ConfirmationService, private messageService: MessageService) {

    // Randomly shuffles the skeletonHeights array to give the skeletons a random "order"
    this.skeletonHeights = this.skeletonHeights.sort(() => Math.random() - 0.5)

    // Subscribe to login status
    accountService.isLoggedIn()
      .subscribe((res) => {
        this.loggedIn = res
      })

    // Fetch the latest public feed
    this.paginationStart = new Date()
    this.pageNumber = 0
    contentService.getPublicFeed(this.paginationStart, this.pageNumber).subscribe((data) => {
      this.posts = data
    })
  }

  showPostDetails(post: PostDTO) {
    this.postDetails = new PostDetails(post, this.datePipe)
    this.commentText.setValue(this.savedCommentTexts[post.id])
    this.postDetailsVisible = true
    this.loadComments(post.id)
  }

  private loadComments(postId: number) {
    this.contentService.getCommentsForPost(postId)
      .pipe(
        catchError((err) => {
          console.error(err);
          this.showGeneralError('An error occured while loading the comments, please try again later!')
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
   * Called by the comment button, submits the comment
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
          this.showGeneralError('An error occured while adding your comment, please try again later!')
          return EMPTY
        })
      )
      .subscribe((res) => {
        if (res.success) {
          this.commentText.setValue('')
          if (this.postDetails) {
            this.loadComments(this.postDetails.post.id)
          }
        } else {
          this.showGeneralError('An error occured while adding your comment, please try again later!')
        }
      })
  }

  loadNextPage() {
    this.loadingNextPage = true
    this.pageNumber++
    this.contentService.getPublicFeed(this.paginationStart, this.pageNumber)
      .pipe(
        catchError((err) => {
          console.error(err);
          this.showGeneralError('An error occured while loading more posts, please try again later!')
          return EMPTY
        })
      )
      .subscribe((data) => {
        if (data.length == 0) {
          this.showGeneralError('No more posts available to load!', 'info', '')
        }
        this.posts.push(...data)
        this.loadingNextPage = false
      })
  }

  private showGeneralError(message: string, severity = 'error', summary = 'Error') {
    this.messageService.add({
      severity,
      summary,
      detail: message
    })
  }
}

class PostDetails {

  header: string;
  content: string;
  comments: CommentDTO[] | null = null
  post: PostDTO;

  constructor(post: PostDTO, datePipe: DatePipe) {
    this.post = post
    if (post.author.displayName) {
      this.header = `${post.author.displayName} (@${post.author.username})`
    } else {
      this.header = `@${post.author.username}`
    }
    this.header += ` | ${datePipe.transform(post.createdAt, 'medium')}`
    this.content = post.content
  }
}
