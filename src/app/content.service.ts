import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CommentDTO } from 'src/DTOs/commentdto';
import { InteractionError } from 'src/DTOs/interactionerror';
import { PostDTO } from 'src/DTOs/postdto';
import { SuccessResult } from 'src/DTOs/successresult';
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
}
