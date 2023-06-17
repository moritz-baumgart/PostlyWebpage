import { Component, HostListener } from '@angular/core';
import { ContentService } from '../content.service';
import { PostDTO } from 'src/DTOs/postdto';
import { DatePipe } from '@angular/common';
import { EMPTY, catchError } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { showGeneralError } from 'src/utils';

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.scss'],
  providers: [DatePipe, ConfirmationService, MessageService]
})
export class StartComponent {

  posts: PostDTO[] = []

  // Pagination
  loadingNextPage = false

  constructor(private contentService: ContentService, private messageService: MessageService) {

    // Subscribe to the new post subject, this fires when the users adds a new post so we can load it to the start of our list.
    contentService.getNewPostObservable()
      .subscribe((postId) => {
        contentService.retrievePost(postId)
          .pipe(
            catchError((err) => {
              console.error(err);
              showGeneralError(messageService, 'An error occured while loading your newly created post, but it has been added! Please try loading your feed again later!')
              return EMPTY
            })
          )
          .subscribe((post) => {
            this.posts.unshift(post)
          })
      })

    // Fetch the latest public feed
    //TODO: Error handling
    contentService.getPublicFeed(new Date()).subscribe((data) => {
      this.posts = data
    })
  }

  loadNextPage() {
    this.loadingNextPage = true
    let oldestPost = this.posts.at(-1)
    if (!oldestPost) {
      showGeneralError(this.messageService, 'An error occured while loading more posts, please try again later!')
      this.loadingNextPage = false
      return
    }

    this.contentService.getPublicFeed(new Date(oldestPost.createdAt))
      .pipe(
        catchError((err) => {
          console.error(err);
          showGeneralError(this.messageService, 'An error occured while loading more posts, please try again later!')
          return EMPTY
        })
      )
      .subscribe((data) => {
        if (data.length == 0) {
          showGeneralError(this.messageService, 'No more posts available to load!', 'info', '')
        }
        this.posts.push(...data)
        this.loadingNextPage = false
      })
  }
}


