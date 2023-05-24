import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AccountService } from './account.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'PostlyWebpage';

  currentRoute = ''
  loggedIn: boolean | undefined

  constructor(router: Router, accountService: AccountService) {

    // Listen to router events so we can see the current route inside the component.
    // This little hack is used so we can easily disable the title bar inside e.g. the login or register page, since they are the only pages that dont need them.
    router.events
      .pipe(
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe(_ => {
        this.currentRoute = router.url.split('?')[0] // Split to only get the route, but not the parameters after the '?'
      })


    // Inital refresh of the login status
    accountService.refreshLoginStatus()

    accountService.isLoggedIn()
      .subscribe((res) => {
        this.loggedIn = res
      })
  }
}
