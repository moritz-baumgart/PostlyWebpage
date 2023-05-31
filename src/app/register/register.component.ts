import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { AccountService } from '../account.service';
import { EMPTY, catchError } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { RegisterError } from 'src/DTOs/registererror';
import { HttpErrorResponse } from '@angular/common/http';
import { Error } from 'src/DTOs/error';
import { showGeneralError } from 'src/utils';

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
        catchError((err: HttpErrorResponse) => {
          if (err.error == Error.UsernameAlreadyInUse) {
            showGeneralError(this.messageService, 'Please choose another username!', 'warn', 'Username already in use.')
          } else {
            console.error(err);
            showGeneralError(this.messageService, 'An error occured while creating your account, please try again later!')
          }

          this.setLoading(false)
          return EMPTY
        })
      ).subscribe((res) => {
        // Continue to the next step of the login process
        this.step++
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
