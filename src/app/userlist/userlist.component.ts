import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UserDTO } from 'src/DTOs/userdto';

@Component({
  selector: 'app-userlist',
  templateUrl: './userlist.component.html',
  styleUrls: ['./userlist.component.scss']
})
export class UserlistComponent {

  @Input() users: UserDTO[] | null = null
  @Input({ required: true }) emptyMessage!: string
  @Output() hideDialog = new EventEmitter()

}
