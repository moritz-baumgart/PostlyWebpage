import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SearchService } from '../search.service';
import { UserDTO } from 'src/DTOs/userdto';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent {

  history = history

  query = ''
  users: UserDTO[] | null = null

  constructor(activatedRoute: ActivatedRoute, searchService: SearchService) {

    activatedRoute.queryParams
      .subscribe(params => {
        this.query = params['q']

        searchService.searchUser(this.query)
          .subscribe(res => {
            this.users = res
          })

      })
  }
}
