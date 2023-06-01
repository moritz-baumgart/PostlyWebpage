import { Component, Input } from '@angular/core';
import { PostDTO } from 'src/DTOs/postdto';
import { VoteInteractionType } from 'src/DTOs/voteinteractiontype';
import { ContentService } from '../content.service';
import { EMPTY, catchError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { showGeneralError } from 'src/utils';
import { MessageService } from 'primeng/api';

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
  VoteInteractionType = VoteInteractionType
  voteRequestLoading = false

  constructor(private contentService: ContentService, private messageService: MessageService) { }

  //TODO: Basically refactor this whole class

  upvote(event: MouseEvent) {
    event.stopPropagation() // Prevent propagation so we dont open the post detail view

    if (this.post?.vote == VoteInteractionType.Upvote) {
      // Remove vote
      this.post.vote = VoteInteractionType.Remove
      this.requestVote(VoteInteractionType.Remove, VoteInteractionType.Upvote)
    } else {
      // Upvote
      if (this.post) this.post.vote = VoteInteractionType.Upvote
      this.requestVote(VoteInteractionType.Upvote, VoteInteractionType.Remove)
    }
  }

  downvote(event: MouseEvent) {
    event.stopPropagation() // Prevent propagation so we dont open the post detail view

    if (this.post?.vote == VoteInteractionType.Downvote) {
      // Remove vote      
      this.post.vote = VoteInteractionType.Remove
      this.requestVote(VoteInteractionType.Remove, VoteInteractionType.Downvote)
    } else {
      // Downvote
      if (this.post) this.post.vote = VoteInteractionType.Downvote
      this.requestVote(VoteInteractionType.Downvote, VoteInteractionType.Remove)
    }
  }

  private requestVote(vote: VoteInteractionType, previousVote: VoteInteractionType) {

    if (this.voteRequestLoading) {
      if (this.post) this.post.vote = previousVote
      return
    }

    this.voteRequestLoading = true

    if (this.post) this.contentService.changeVote(this.post.id, vote)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          if (err.status == 401) {
            showGeneralError(this.messageService, 'You have to be logged in to vote on a post!', 'warn')
          } else {
            showGeneralError(this.messageService, 'An error occured while submitting your vote, please try again later!')
            console.error(err);
          }
          if (this.post) this.post.vote = previousVote
          this.voteRequestLoading = false
          return EMPTY
        })
      )
      .subscribe((newPost) => {
        if (this.post) {
          this.post.vote = newPost.vote
          this.post.upvoteCount = newPost.upvoteCount
          this.post.downvoteCount = newPost.downvoteCount
        }
        this.voteRequestLoading = false
      })
  }
}
