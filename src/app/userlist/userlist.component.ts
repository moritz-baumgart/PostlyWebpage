import { NgStyle } from '@angular/common';
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
  @Input() entryStyle: { [klass: string]: any; } = {}
  @Output() hideDialog = new EventEmitter()

}
