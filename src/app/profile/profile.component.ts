import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PostDTO } from 'src/DTOs/postdto';
import { AccountService, JwtToken } from '../account.service';
import { ContentService } from '../content.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UserProfileViewModel } from 'src/DTOs/userprofileviewmodel';
import { UserDataViewModel } from 'src/DTOs/userdataviewmodel';
import { Gender } from 'src/DTOs/gender';
import { ConfirmationService, MessageService } from 'primeng/api';
import { BehaviorSubject, EMPTY, catchError } from 'rxjs';
import { showGeneralError } from 'src/utils';
import { Role } from 'src/DTOs/role';
import { HttpErrorResponse } from '@angular/common/http';
import { Error } from 'src/DTOs/error';
import { UserDTO } from 'src/DTOs/userdto';
import { ClaimTypes } from 'src/DTOs/claimtypes';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  providers: [DatePipe]
})
export class ProfileComponent {

  currentUserRoleName = ''
  Role = Role

  changemodBtnLoading = false
  changemodBtnText: string | null = null

  posts: PostDTO[] | null = null
  userProfile: UserProfileViewModel | null = null
  loadingNextPage = false
  isMe = false
  usernameFromRoute = ''

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
    profileImageUrl: null,
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

  followBtnText: string | null = null
  followBtnLoading = false

  showFollowingDialog = false
  followingUser: UserDTO[] | null = null
  showFollowerDialog = false
  followerUser: UserDTO[] | null = null

  // The jwt of the current user
  currentUserJwt: JwtToken | null = null

  deleteAccBtnLoading = false
  accDelConfirmUsername = new FormControl('')
  deleteBtnDisabled = true

  constructor(activatedRoute: ActivatedRoute, private accountService: AccountService, private contentService: ContentService, private messageService: MessageService, private router: Router, private confirmationService: ConfirmationService) {

    // Subscribe to jwt changes
    accountService.getCurrentUserJwt()
      .subscribe(newJwt => {
        this.currentUserJwt = newJwt
        if (newJwt != null) this.currentUserRoleName = newJwt[ClaimTypes.role]

        activatedRoute.params.subscribe((params) => {
          this.usernameFromRoute = params['username']

          if (this.usernameFromRoute != undefined) {
            if (this.currentUserJwt != null && this.usernameFromRoute == this.currentUserJwt[ClaimTypes.nameIdentifier]) {
              router.navigateByUrl('/u')
            }
          } else {
            this.isMe = true
          }

          accountService.getUserProfile(this.usernameFromRoute)
            .subscribe(res => {
              this.userProfile = res
              this.setFollowBtnText(res)
              this.setChangeModBtnText(res)
            })

          if (this.isMe) {
            accountService.getUserData()
              .subscribe(res => {
                this.setUserDate(res)
              })
          }

          contentService.getUserFeed(new Date(), this.usernameFromRoute)
            .subscribe(res => {
              this.posts = res
            })

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

    // Subscribe to the new post subject, this fires when the users adds a new post so we can load it to the start of our list.
    contentService.getNewPostObservable()
      .subscribe((postId) => {
        contentService.retrievePost(postId)
          .pipe(
            catchError((err) => {
              console.error(err);
              showGeneralError(messageService, 'An error occured while loading your newly created post, but it has been added! Please try loading your feed again later!')
              return EMPTY
            })
          )
          .subscribe((post) => {
            this.posts?.unshift(post)
          })
      })

    this.accDelConfirmUsername.valueChanges
      .subscribe(newVal => {
        this.deleteBtnDisabled = newVal?.toUpperCase() != this.userProfile?.username.toUpperCase()
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

    let usernameToUpdate = this.isMe ? null : this.usernameFromRoute


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
          this.accountService.getUserProfile(this.usernameFromRoute)
            .subscribe(res => {
              this.userProfile = res
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

  follow() {
    if (this.followBtnLoading) {
      return
    }
    this.followBtnLoading = true
    if (this.isMe) {
      return
    }
    if (this.userProfile == null || this.userProfile.follow == null) {
      return
    }

    this.accountService.changeFollow(this.usernameFromRoute, !this.userProfile.follow)
      .pipe(
        catchError(err => {
          showGeneralError(this.messageService, 'There was an error while changing the following status. Please try again later!')
          this.followBtnLoading = false
          return EMPTY
        })
      )
      .subscribe(res => {
        this.userProfile = res
        this.setFollowBtnText(res)
        this.followBtnLoading = false
      })
  }

  setFollowBtnText(userViewModel: UserProfileViewModel) {
    if (userViewModel.follow == null) {
      this.followBtnText = null
    } else if (userViewModel.follow) {
      this.followBtnText = 'Unfollow'
    } else {
      this.followBtnText = 'Follow'
    }
  }

  setChangeModBtnText(userViewModel: UserProfileViewModel) {
    if (userViewModel.role == Role.Moderator) {
      this.changemodBtnText = 'Demote'
    } else if (userViewModel.role == Role.User) {
      this.changemodBtnText = 'Promote'
    }
  }

  showFollowDialog(type: 'follower' | 'following') {
    if (type == 'following') {
      this.showFollowingDialog = true
      this.accountService.getFollowing(this.usernameFromRoute)
        .subscribe(res => {
          this.followingUser = res
        })
    } else if (type == 'follower') {
      this.showFollowerDialog = true
      this.accountService.getFollower(this.usernameFromRoute)
        .subscribe(res => {
          this.followerUser = res
        })
    }
  }

  hideDialog() {
    this.showFollowerDialog = false
    this.showFollowingDialog = false
  }

  changeMod() {
    if (this.changemodBtnLoading) {
      return
    }
    if (this.userProfile?.role == Role.User) {
      this.doRoleUpdate(this.userProfile.username, Role.Moderator)
    } else if (this.userProfile?.role == Role.Moderator) {
      this.doRoleUpdate(this.userProfile.username, Role.User)
    }
  }

  private doRoleUpdate(username: string, role: Role) {
    this.changemodBtnLoading = true
    this.accountService.updateUserRole(username, role)
      .pipe(
        catchError(err => {
          console.error(err);
          showGeneralError(this.messageService, 'There was an error promoting/demoting this user. Please try again later!')
          this.changemodBtnLoading = false
          return EMPTY
        })
      )
      .subscribe(newUserProfile => {
        this.userProfile = newUserProfile
        this.setChangeModBtnText(newUserProfile)
        this.changemodBtnLoading = false
      })
  }

  loadMore() {
    this.loadingNextPage = true
    let oldestPost = this.posts?.at(-1)
    if (!oldestPost) {
      showGeneralError(this.messageService, 'An error occured while loading more posts, please try again later!')
      this.loadingNextPage = false
      return
    }

    this.contentService.getUserFeed(new Date(oldestPost.createdAt), this.usernameFromRoute)
      .pipe(
        catchError((err) => {
          console.error(err);
          showGeneralError(this.messageService, 'An error occured while loading more posts, please try again later!')
          this.loadingNextPage = false
          return EMPTY
        })
      )
      .subscribe((data) => {
        if (data.length == 0) {
          showGeneralError(this.messageService, 'No more posts available to load!', 'info', '')
        }
        if (this.posts) {
          this.posts.push(...data)
        } else {
          this.posts = data
        }
        this.loadingNextPage = false
      })
  }

  deleteAcc() {
    this.confirmationService.confirm({
      key: 'deleteAccConfirm',
      accept: () => {
        if (!this.userProfile?.username) {
          return
        }
        this.accountService.deleteUser(this.userProfile.username, this.isMe)
          .pipe(
            catchError(err => {
              showGeneralError(this.messageService, "An error occured while deleting this accoung. Please try again later!")
              console.error(err);
              return EMPTY
            })
          )
          .subscribe(() => {
            showGeneralError(this.messageService, "Account deleted!", "info", "")
            this.router.navigateByUrl('/')
          })
      }
    })
  }
}

interface GenderOption {
  value: Gender | null,
  name: string
}

