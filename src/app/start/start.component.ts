import { Component } from '@angular/core';
import { ContentService } from '../content.service';
import { PostDTO } from 'src/DTOs/postdto';
import { VoteInteractionType } from 'src/DTOs/voteinteractiontype';
import { DatePipe } from '@angular/common';
import { EMPTY, catchError } from 'rxjs';
import { CommentDTO } from 'src/DTOs/commentdto';

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.scss'],
  providers: [DatePipe]
})
export class StartComponent {

  public VoteInteractionType = VoteInteractionType;

  posts: PostDTO[] = []

  skeletonHeights = [8, 14, 20, 25]
  loggedIn: boolean | undefined

  postDetailsVisible = false
  postDetails: PostDetails | undefined
  commentText = ''

  Array = Array

  constructor(private contentService: ContentService, private datePipe: DatePipe) {

    // Randomly shuffles the skeletonHeights array to give the skeletons a random "order"
    this.skeletonHeights = this.skeletonHeights.sort(() => Math.random() - 0.5)

    // Fetch the latest public feed
    contentService.getPublicFeed().subscribe((data) => {
      this.posts = data
    })
  }

  showPostDetails(post: PostDTO) {
    this.postDetails = new PostDetails(post, this.datePipe)
    this.postDetailsVisible = true

    this.contentService.getCommentsForPost(post.id)
      .pipe(
        catchError((err) => {
          // TODO: Handle err
          return EMPTY
        })
      ).subscribe((res) => {
        if (this.postDetails) {
          this.postDetails.comments = res
          console.log(res);
        }
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
