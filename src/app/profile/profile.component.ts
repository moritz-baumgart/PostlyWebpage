import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { PostDTO } from 'src/DTOs/postdto';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  providers: [DatePipe]
})
export class ProfileComponent {

  posts: PostDTO[] = []
  loadingNextPage = false

  constructor() {
    for(let _ = 0; _ < 10; _++) {
      this.posts.push(
        {
          id: -1,
          author: {
            id: -1,
            username: 'Some author'
          },
          content: 'Some content',
          createdAt: new Date(),
          upvoteCount: 12,
          downvoteCount: 10,
          commentCount: 5
        }
      )
    }
  }
}
