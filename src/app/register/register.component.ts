import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { AccountService } from '../account.service';
import { EMPTY, catchError } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { RegisterError } from 'src/DTOs/registererror';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  providers: [MessageService]
})
export class RegisterComponent {

  username = new FormControl('', Validators.required)
  password = new FormControl('', Validators.required)
  passwordRepeat = new FormControl('', Validators.required)

  loading = false
  step = 0

  constructor(private messageService: MessageService, private accountService: AccountService, private activatedRoute: ActivatedRoute, private router: Router) { }

  register() {
    if (this.loading) {
      return
    }

    if (!this.username.valid || !this.password.valid || !this.passwordRepeat.valid) {
      return
    }

    let usernameVal = this.username.value
    let passwordVal = this.password.value
    let passwordRepeatVal = this.passwordRepeat.value
    if (usernameVal == null || passwordVal == null || passwordRepeatVal == null) {
      // Should not happen, because the register btn is disabled when the fields are empty
      return
    }

    if (passwordVal != passwordRepeatVal) {
      this.messageService.add({
        severity: 'warn',
        detail: 'Passwords do not match!'
      })
      return
    }

    // Set the loading state of the button
    this.setLoading(true)

    // Initiate register
    this.accountService.register(usernameVal, passwordVal)
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
      ).subscribe((res) => {
        if (res.success) {
          // Continue to the next step of the login process
          this.step++
        } else {
          // Show toast when username in use or unknown error occurs  
          if (res.error == RegisterError.UsernameAlreadyInUse) {
            this.messageService.add({
              severity: 'warn',
              summary: 'Username already in use.',
              detail: 'Please choose another username!'
            })
          } else {
            this.messageService.add({
              severity: 'error',
              detail: 'An unknown error occured, please try again later!'
            })
          }
        }
      })
  }


  private setLoading(isLoading: boolean) {
    this.loading = isLoading
    if (isLoading) {
      this.username.disable()
      this.password.disable()
      this.passwordRepeat.disable()
    } else {
      this.username.enable()
      this.password.enable()
      this.passwordRepeat.enable()
    }
  }
}
