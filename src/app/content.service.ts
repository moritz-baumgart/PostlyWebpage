import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject, tap } from 'rxjs';
import { VoteUpdateViewModel } from 'src/DTOs/voteupdateviewmodel';
import { CommentDTO } from 'src/DTOs/commentdto';
import { InteractionError } from 'src/DTOs/interactionerror';
import { PostDTO } from 'src/DTOs/postdto';
import { SuccessResult } from 'src/DTOs/successresult';
import { VoteType } from 'src/DTOs/votetype';
import { environment } from 'src/environments/environment';

/**
 * This service provides methods for fetching content, i.e. feeds, posts, comments, etc.
 */
@Injectable({
  providedIn: 'root'
})
export class ContentService {

  private apiBase = environment.apiBase
  readonly jsonHeaders = new HttpHeaders({
    'Content-Type': 'application/json'
  })


  private newPostCreatedSubject = new Subject<number>()

  constructor(private http: HttpClient) { }


  getPublicFeed(paginationStart: Date, pageNumber: number) {

    return this.http
      .get<PostDTO[]>(this.apiBase + '/feed/public', {
        params: {
          "paginationStart": paginationStart.toISOString(),
          pageNumber
        }
      })
  }

  getCommentsForPost(postId: number) {
    return this.http.get<CommentDTO[]>(this.apiBase + '/post/' + postId + '/comments')
  }

  createComment(postId: number, commentContent: string) {
    return this.http.post<SuccessResult<any, InteractionError>>(
      this.apiBase + '/comment',
      JSON.stringify({
        postId,
        commentContent
      }),
      {
        headers: this.jsonHeaders
      }
    )
  }

  /**
   * Tries to create a new post with given content.
   * @param content The text content of the post
   */
  createPost(content: string) {
    return this.http.post<number>(
      this.apiBase + '/post',
      JSON.stringify(
        content
      ),
      {
        headers: this.jsonHeaders
      }
    )
      .pipe(
        tap((res) => {
          this.newPostCreatedSubject.next(res)
        })
      )
  }

  /**
   * Provides an observable that is triggered when a new post was created by the client which contains the id of that new post.
   */
  getNewPostObservable() {
    return this.newPostCreatedSubject.asObservable()
  }

  /**
   * Tries to retrieve a post with given post id.
   */
  retrievePost(postId: number) {
    return this.http.get<PostDTO>(
      this.apiBase + '/post/' + postId,
    )
  }

  setVote(postId: number, vote: VoteType) {
    return this.http.post<VoteUpdateViewModel>(
      this.apiBase + '/post/' + postId + '/vote',
      JSON.stringify(
        vote
      ),
      {
        headers: this.jsonHeaders
      }
    )
  }

  removeVote(postId: number) {
    return this.http.delete<VoteUpdateViewModel>(
      this.apiBase + '/post/' + postId + '/vote'
    )
  }
}
