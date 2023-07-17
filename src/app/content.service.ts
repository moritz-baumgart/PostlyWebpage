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
 * This service provides methods for fetching, creating and updating content, i.e. feeds, posts, comments, etc.
 */
@Injectable({
  providedIn: 'root'
})
export class ContentService {

  private apiBase = environment.apiBase
  readonly jsonHeaders = new HttpHeaders({
    'Content-Type': 'application/json'
  })


  newPostCreatedSubject = new Subject<number>()

  constructor(private http: HttpClient) { }


  /**
   * Fetches the public feed starting from a given timestamp.
   * @param paginationStart The start timestamp, all post will be older than this
   * @returns The observable given by the http client containing the request result.
   */
  getPublicFeed(paginationStart: Date) {

    return this.http
      .get<PostDTO[]>(this.apiBase + '/feed/public', {
        params: {
          "paginationStart": paginationStart.toISOString()
        }
      })
  }

  /**
   * Fetches the feed for the profile page of a certain user.
   * If no user is given it uses the 'me' endpoint.
   * @param paginationStart The start timestamp, all post will be older than this
   * @param username The username of the user to fetch the posts for.
   * @returns The observable given by the http client containing the request result.
   */
  getUserFeed(paginationStart: Date, username?: string) {

    let requestUrl
    if (username) {
      requestUrl = this.apiBase + '/feed/profile/' + username
    } else {
      requestUrl = this.apiBase + '/feed/profile/me'
    }

    return this.http
      .get<PostDTO[]>(requestUrl, {
        params: {
          "paginationStart": paginationStart.toISOString()
        }
      })
  }

  /**
   * Fetches the private feed starting from a given timestamp.
   * @param paginationStart The start timestamp, all post will be older than this
   * @returns The observable given by the http client containing the request result.
   */
  getPrivateFeed(paginationStart: Date) {

    return this.http
      .get<PostDTO[]>(this.apiBase + '/feed/private', {
        params: {
          "paginationStart": paginationStart.toISOString()
        }
      })
  }

  /**
   * Fetches the comments of a post with given id.
   * @param postId The id of the post to fetch the comments for.
   * @returns The observable given by the http client containing the request result.
   */
  getCommentsForPost(postId: number) {
    return this.http.get<CommentDTO[]>(this.apiBase + '/post/' + postId + '/comments')
  }

  /**
   * Makes a request to create a new comment on post with given id.
   * @param postId The id of the post to create the comment on.
   * @param commentContent The string content of the comment.
   * @returns The observable given by the http client containing the request result.
   */
  createComment(postId: number, commentContent: string) {
    return this.http.post<number>(
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
   * @returns The observable given by the http client containing the request result.
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
  }

  /**
   * Makes a request to add an image to a post.
   * This method can be called after {@link createPost} to make an image post out of a normal one.
   * @param postId The id of the post to add the image to.
   * @param image The image file to add to the post.
   * @returns The observable given by the http client containing the request result.
   */
  addImageToPost(postId: number, image: File) {
    const formData = new FormData()
    formData.append('image', image)

    return this.http.put(this.apiBase + '/image/post/' + postId, formData)
  }

  /**
   *  Provides an observable that is triggered when a new post was created by the client which contains the id of that new post.
   * @returns The described observable.
   */
  getNewPostObservable() {
    return this.newPostCreatedSubject.asObservable()
  }

  /**
   * Tries to retrieve a post with given post id.
   * @param postId The id of the post to retrieve,
   * @returns The observable given by the http client containing the request result.
   */
  retrievePost(postId: number) {
    return this.http.get<PostDTO>(
      this.apiBase + '/post/' + postId,
    )
  }

  /**
   * Makes a request to add a vote on a post with given id.
   * @param postId The id of the post to add the vote on.
   * @param vote The type of vote to be added.
   * @returns The observable given by the http client containing the request result.
   */
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

  /**
   * Makes a request to remove a vote on a post with given id.
   * @param postId The id of the post to remove the vote for.
   * @returns The observable given by the http client containing the request result.
   */
  removeVote(postId: number) {
    return this.http.delete<VoteUpdateViewModel>(
      this.apiBase + '/post/' + postId + '/vote'
    )
  }

  /**
   * Makes a request to delete a post with given id.
   * @param postId The id of the post to delete.
   * @returns The observable given by the http client containing the request result.
   */
  deletePost(postId: number) {
    return this.http.delete(
      this.apiBase + '/post/' + postId
    )
  }
}
