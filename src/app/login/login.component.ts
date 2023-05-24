import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { AccountService } from '../account.service';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, catchError, of } from 'rxjs';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  providers: [MessageService]
})
export class LoginComponent {

  username = new FormControl('', Validators.required)
  password = new FormControl('', Validators.required)

  loading = false

  constructor(private accountService: AccountService, private activatedRoute: ActivatedRoute, private router: Router, private messageService: MessageService) { }

  login() {

    if (this.loading) {
      return
    }

    if (!this.username.valid || !this.password.valid) {
      return
    }

    let usernameVal = this.username.value
    let passwordVal = this.password.value
    if (usernameVal == null || passwordVal == null) {
      // Should not happen, because the login btn is disabled when the fields are empty
      return
    }

    // Set the loading state of the button
    this.setLoading(true)

    // Initiate login
    this.accountService.login(usernameVal, passwordVal)
      .pipe(
        catchError((_) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'An error occured while connecting to the server, please try again later!'
          })
          this.setLoading(false)
          return EMPTY
        })
      )
      .subscribe((res) => {

        // If the login was successful, proceed, otherwise handle error
        if (res) {

          // Get query parameters
          this.activatedRoute.queryParams.subscribe((params) => {

            let ref = params['ref']
            if (ref) {

              // If the ref param is given, try to navigate there, if that fails navigate to start
              this.router.navigate([ref]).then((val) => {
                if (!val) {
                  this.router.navigate(['/'])
                }
              }).catch((_) => {
                this.router.navigate(['/'])
              })

            } else {

              // If no ref is given, navigate to start
              this.router.navigate(['/'])
            }
          })
        } else {
          // Login gone wrong, tell user
          this.messageService.add({
            severity: 'warn',
            detail: 'Username or password wrong, please try again!'
          })
          this.setLoading(false)
        }
      })
  }

  private setLoading(isLoading: boolean) {
    this.loading = isLoading
    if(isLoading) {
      this.username.disable()
      this.password.disable()
    } else {
      this.username.enable()
      this.password.enable()
    }
  }
}
