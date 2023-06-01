import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { EMPTY, catchError } from 'rxjs';
import { CommentDTO } from 'src/DTOs/commentdto';
import { PostDTO } from 'src/DTOs/postdto';
import { showGeneralError } from 'src/utils';
import { ContentService } from '../content.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AccountService } from '../account.service';

@Component({
  selector: 'app-postlist',
  templateUrl: './postlist.component.html',
  styleUrls: ['./postlist.component.scss']
})
export class PostlistComponent {

  Array = Array

  // Login state
  loggedIn: boolean | undefined

  // Post details
  postDetailsVisible = false
  postDetails: PostDetails | undefined
  commentText = new FormControl('', Validators.maxLength(282))
  savedCommentTexts: { [key: number]: string } = {}

  // Pagination
  @Input({ required: true }) posts!: PostDTO[]
  @Input({ required: true }) nextPageLoadingState!: boolean
  @Output() loadNextPage = new EventEmitter()

  skeletonHeights = [8, 14, 20, 25]


  constructor(private contentService: ContentService, private messageService: MessageService, private datePipe: DatePipe, private confirmationService: ConfirmationService, accountService: AccountService) {

    // Randomly shuffles the skeletonHeights array to give the skeletons a random "order"
    this.skeletonHeights = this.skeletonHeights.sort(() => Math.random() - 0.5)

    // Subscribe to login status
    accountService.isLoggedIn()
      .subscribe((res) => {
        this.loggedIn = res
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
          showGeneralError(this.messageService, 'An error occured while adding your comment, please try again later!')
          return EMPTY
        })
      )
      .subscribe((res) => {
        this.commentText.setValue('')
        if (this.postDetails) {
          this.loadComments(this.postDetails.post.id)
        }
      })
  }

  requestNextPage() {
    this.loadNextPage.emit()
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