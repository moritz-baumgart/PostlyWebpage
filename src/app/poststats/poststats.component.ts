import { Component, Input } from '@angular/core';
import { PostDTO } from 'src/DTOs/postdto';
import { ContentService } from '../content.service';
import { EMPTY, catchError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { showGeneralError } from 'src/utils';
import { MessageService } from 'primeng/api';
import { VoteType } from 'src/DTOs/votetype';
import { VoteUpdateViewModel } from 'src/DTOs/voteupdateviewmodel';

/**
 * This component displays the 'stats' that is the upvotes/downvotes and comments of a given post. A custom padding for all 4 sides can be set, default is 1rem.
 * 
 * @example
 * ```
 * <app-poststats [post]="post" paddingTop="0" paddingBottom="3rem"></app-poststats>
 * ```
 */
@Component({
  selector: 'app-poststats',
  templateUrl: './poststats.component.html',
  styleUrls: ['./poststats.component.scss']
})
export class PoststatsComponent {
  @Input() post: PostDTO | undefined
  @Input() paddingLeft = '1rem'
  @Input() paddingRight = '1rem'
  @Input() paddingTop = '1rem'
  @Input() paddingBottom = '1rem'
  VoteType = VoteType
  voteRequestLoading = false

  constructor(private contentService: ContentService, private messageService: MessageService) { }

  /**
   * Called when the upvote/downvote icon is clicked. Initiates a vote request if none is already ongoing.
   * @param vote The type of vote which should be set.
   */
  vote(event: MouseEvent, vote: VoteType) {
    event.stopPropagation() // Prevent propagation so we dont open the post detail view
    if (this.voteRequestLoading) { // Cancel if there's a request ongoing
      return
    }
    this.voteRequestLoading = true

    if (this.post?.vote == vote) {
      this.requestVoteRemove(vote)
    } else {
      if (vote == VoteType.Upvote) {
        this.requestVote(vote, this.post?.vote ?? null)
      } else if (vote == VoteType.Downvote) {
        this.requestVote(vote, this.post?.vote ?? null)
      }
    }
  }

  /**
   * Tries to submit a vote using the {@link ContentService}. If that fails it resets the UI to the value of previousVote.
   * @param vote The vote the submit.
   * @param previousVote The vote to fall back to on error.
   */
  requestVote(vote: VoteType, previousVote: VoteType | null) {
    if (this.post) this.contentService.setVote(this.post.id, vote)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          return this.handleVoteError(err, previousVote)
        })
      )
      .subscribe((val) => {
        this.handleSuccess(val) // Explicitly call handleSuccess to capture context
      })
  }

  /**
   * Tries to remove a vote using the {@link ContentService}. If that fails it resets the UI to the value of previousVote.
   * @param previousVote The vote to fall back to on error.
   */
  requestVoteRemove(previousVote: VoteType) {
    if (this.post) this.contentService.removeVote(this.post.id)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          return this.handleVoteError(err, previousVote)
        })
      )
      .subscribe((val) => {
        this.handleSuccess(val) // Explicitly call handleSuccess to capture context
      })
  }

  /**
   * Called by {@link PoststatsComponent.requestVote} and {@link PoststatsComponent.requestVoteRemove} in case an error occures. It resets the UI to the given previousVote and displays an error.
   * @param err A HttpErrorResponse to handle.
   * @param previousVote The vote to fall back to on error.
   */
  private handleVoteError(err: HttpErrorResponse, previousVote: VoteType | null) {
    if (err.status == 401) {
      showGeneralError(this.messageService, 'You have to be logged in to vote on a post!', 'warn')
    } else {
      showGeneralError(this.messageService, 'An error occured while updating your vote, please try again later!')
      console.error(err);
    }
    if (this.post) this.post.vote = previousVote
    this.voteRequestLoading = false
    return EMPTY
  }

  private handleSuccess(update: VoteUpdateViewModel) {
    if (this.post) {
      this.post.downvoteCount = update.downvoteCount
      this.post.upvoteCount = update.upvoteCount
      this.post.vote = update.voteType
    }
    this.voteRequestLoading = false
  }
}
