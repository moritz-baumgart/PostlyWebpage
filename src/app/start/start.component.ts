import { Component } from '@angular/core';
import { ContentService } from '../content.service';
import { PostDTO } from 'src/DTOs/postdto';
import { VoteInteractionType } from 'src/DTOs/voteinteractiontype';
import { AccountService } from '../account.service';

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.scss']
})
export class StartComponent {

  public VoteInteractionType = VoteInteractionType;

  posts: PostDTO[] = []

  skeletonHeights = [8, 14, 20, 25]
  loggedIn: boolean | undefined

  constructor(contentService: ContentService) {

    // Randomly shuffles the skeletonHeights array to give the skeletons a random "order"
    this.skeletonHeights = this.skeletonHeights.sort(() => Math.random() - 0.5)

    // Fetch the latest public feed
    contentService.getPublicFeed().subscribe((data) => {
      this.posts = data
    })
  }
}
