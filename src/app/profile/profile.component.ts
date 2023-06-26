import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PostDTO } from 'src/DTOs/postdto';
import { AccountService } from '../account.service';
import { ContentService } from '../content.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UserProfileViewModel } from 'src/DTOs/userprofileviewmodel';
import { UserDataViewModel } from 'src/DTOs/userdataviewmodel';
import { Gender } from 'src/DTOs/gender';
import { MessageService } from 'primeng/api';
import { BehaviorSubject, EMPTY, catchError } from 'rxjs';
import { showGeneralError } from 'src/utils';
import { Role } from 'src/DTOs/role';
import { HttpErrorResponse } from '@angular/common/http';
import { Error } from 'src/DTOs/error';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  providers: [DatePipe]
})
export class ProfileComponent {

  posts: PostDTO[] = []
  user: UserProfileViewModel | null = null
  loadingNextPage = false
  isMe = false
  username = ''

  settingsVisible = false
  settingsTabs = ['Profile', 'Account details', 'Username', 'Password']
  currentSettingsTab = new FormControl(this.settingsTabs[0], { nonNullable: true })
  saveBtnText = 'Save'
  saveBtnLoading = new BehaviorSubject(false)

  genderOptions: GenderOption[] = [
    { value: Gender.Male, name: 'Male' },
    { value: Gender.Female, name: 'Female' },
    { value: Gender.Other, name: 'Other' },
    { value: Gender.NoAnswer, name: 'Prefer not to say' }
  ]

  userData: UserDataViewModel | null = null
  settingsModel: UserDataViewModel = {
    birthday: null,
    createdAt: new Date(0),
    displayName: null,
    email: null,
    gender: null,
    id: -1,
    phoneNumber: null,
    role: Role.User,
    username: ''
  }

  usernameForm = new FormControl('', { nonNullable: true, validators: Validators.required })

  passwordForm = new FormGroup({
    oldPassword: new FormControl('', { nonNullable: true, validators: Validators.required }),
    newPassword: new FormControl('', { nonNullable: true, validators: Validators.required }),
    retypeNewPassword: new FormControl('', { nonNullable: true, validators: Validators.required })
  })

  constructor(activatedRoute: ActivatedRoute, private accountService: AccountService, contentService: ContentService, private messageService: MessageService) {

    activatedRoute.params.subscribe((params) => {
      this.username = params['username']
      this.isMe = !this.username

      accountService.getUserProfile(this.username)
        .subscribe(res => {
          this.user = res
        })

      if (this.isMe) {
        accountService.getUserData()
          .subscribe(res => {
            this.setUserDate(res)
          })
      }

      contentService.getUserFeed(new Date(), this.username)
        .subscribe(res => {
          this.posts = res
        })

    })

    this.currentSettingsTab.valueChanges.subscribe(val => {
      switch (val) {
        case this.settingsTabs[0]:
        case this.settingsTabs[1]:
          this.saveBtnText = 'Save'
          break
        case this.settingsTabs[2]:
          this.saveBtnText = 'Change username'
          break
        case this.settingsTabs[3]:
          this.saveBtnText = 'Change password'
          break
      }
    })

    this.saveBtnLoading.subscribe(val => {
      if (val) {
        this.currentSettingsTab.disable()
      } else {
        this.currentSettingsTab.enable()
      }
    })
  }

  setUserDate(data: UserDataViewModel) {
    this.settingsModel = { ...data }
    // primeng calendar somehow does not like our dates so we have to do this hack here:
    if (data.birthday) this.settingsModel.birthday = new Date(data.birthday)
    this.usernameForm.setValue(data.username)
    this.userData = data
  }

  discard(e: Event) {
    if (this.saveBtnLoading.value) {
      return
    }

    if (!e.target) {
      return
    }

    this.settingsVisible = false
    if (this.userData) this.setUserDate(this.userData)
  }

  save() {
    if (this.saveBtnLoading.value) {
      return
    }

    this.saveBtnLoading.next(true)

    let usernameToUpdate = this.isMe ? null : this.username


    switch (this.currentSettingsTab.value) {
      case this.settingsTabs[0]:
      case this.settingsTabs[1]:

        this.accountService.updateUserData(usernameToUpdate, {
          birthday: this.settingsModel.birthday,
          displayName: this.settingsModel.displayName,
          email: this.settingsModel.email,
          gender: this.settingsModel.gender,
          phoneNumber: this.settingsModel.phoneNumber,
        }).pipe(
          catchError((errorResponse: HttpErrorResponse) => {
            let errorMsgs: string[] = []
            let errors = errorResponse.error as Error[]

            if (errors.includes(Error.InvalidBirthday)) {
              errorMsgs.push(' Your birthday cannot be in the future!')
            }

            if (errors.includes(Error.InvalidEmail)) {
              errorMsgs.push(' Your email has an invalid format!')
            }

            if (errorMsgs.length > 0) {
              showGeneralError(this.messageService, 'Could not update your information because of the following reasons(s):' + errorMsgs.toString())
            } else {
              showGeneralError(this.messageService, 'Something went wrong while updating your profile information. Please try again later!')
              console.error(errorResponse);
            }

            this.saveBtnLoading.next(false)
            return EMPTY
          })
        ).subscribe(res => {
          this.accountService.getUserProfile(this.username)
            .subscribe(res => {
              this.user = res
            })
          this.settingsVisible = false
          this.setUserDate(res)
          showGeneralError(this.messageService, 'Profile information updated!', 'info', '')
          this.saveBtnLoading.next(false)
        })
        break
      case this.settingsTabs[2]:

        if (!this.usernameForm.valid) {
          showGeneralError(this.messageService, 'Username cannot be empty!', 'warn', '')
          this.saveBtnLoading.next(false)
        }

        this.accountService.changeUserName(this.usernameForm.value)
          .pipe(
            catchError((errorResponse: HttpErrorResponse) => {
              if (errorResponse.error == Error.UsernameAlreadyInUse) {
                showGeneralError(this.messageService, 'Username already in use. Try a different one!', 'warn', '')
              } else {
                showGeneralError(this.messageService, 'Something went wrong while changing your username. Please try again later!')
                console.error(errorResponse);
              }

              this.saveBtnLoading.next(false)
              return EMPTY
            })
          )
          .subscribe(_ => {
            this.saveBtnLoading.next(false)
          })

        break
      case this.settingsTabs[3]:

        if (!this.passwordForm.valid) {
          showGeneralError(this.messageService, 'Password cannot be empty!', 'warn', '')
          this.saveBtnLoading.next(false)
          return
        }

        if (this.passwordForm.value.newPassword != this.passwordForm.value.retypeNewPassword) {
          showGeneralError(this.messageService, 'New password and retype password do not match!', 'warn', '')
          this.saveBtnLoading.next(false)
          return
        }

        this.accountService.changePassword(this.passwordForm.controls.oldPassword.value, this.passwordForm.controls.newPassword.value)
          .pipe(
            catchError((errorResponse: HttpErrorResponse) => {
              debugger
              if (errorResponse.error == Error.PasswordIncorrect) {
                showGeneralError(this.messageService, 'The given old password is not correct!', 'warn', '')
              } else {
                showGeneralError(this.messageService, 'Something went wrong while changing your password. Please try again later!')
                console.error(errorResponse);
              }

              this.saveBtnLoading.next(false)
              return EMPTY
            })
          )
          .subscribe(_ => {
            this.saveBtnLoading.next(false)
          })

        break
    }

  }
}

interface GenderOption {
  value: Gender | null,
  name: string
}
