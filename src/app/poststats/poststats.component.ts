import { Component, Input } from '@angular/core';
import { PostDTO } from 'src/DTOs/postdto';
import { VoteInteractionType } from 'src/DTOs/voteinteractiontype';

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
}
