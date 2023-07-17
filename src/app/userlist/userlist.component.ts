import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UserDTO } from 'src/DTOs/userdto';

/**
 * This component simply displays a list of {@link UserDTO}s.
 * The individual entries can be styled.
 * It expects a string to be shown if the list is empty.
 * It emmits an event indicating that a user was clicked. This can be used when the component is used inside a dialog to close the dialog.
 * 
 * @example
 * <app-userlist emptyMessage="No search results for this query!" [users]="users" [entryStyle]="{'font-size': '1.5rem'}" (hideDialog)="hideTheDialog()">
 * 
 */
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
