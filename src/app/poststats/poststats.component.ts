import { Component, Input } from '@angular/core';
import { PostDTO } from 'src/DTOs/postdto';
import { ContentService } from '../content.service';
import { EMPTY, catchError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { showGeneralError } from 'src/utils';
import { MessageService } from 'primeng/api';
import { VoteType } from 'src/DTOs/votetype';
import { VoteUpdateViewModel } from 'src/DTOs/voteupdateviewmodel';

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
        this.requestVote(vote, this.post?.vote?? null)
      } else if (vote == VoteType.Downvote) {
        this.requestVote(vote, this.post?.vote?? null)
      }
    }
  }

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
