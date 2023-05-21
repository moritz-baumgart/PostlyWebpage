import { Component } from '@angular/core';
import { ContentService } from '../content.service';
import { PostDTO } from 'src/DTOs/postdto';

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.scss']
})
export class StartComponent {

  posts: PostDTO[] = []

  skeletonHeights = [8, 14, 20, 25]

  constructor(private contentService: ContentService) {

    this.skeletonHeights = this.skeletonHeights.sort(() => Math.random() - 0.5)

    contentService.getPublicFeed().subscribe((data) => {
      this.posts = data
    })
  }
}
