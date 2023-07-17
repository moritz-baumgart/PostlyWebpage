import { DatePipe } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
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
import { environment } from 'src/environments/environment';
import { ImageCroppedEvent } from 'ngx-image-cropper';
import { FileSelectEvent } from 'src/DTOs/fileselectevent';
import { FileUpload } from 'primeng/fileupload';

/**
 * This component shows the profile of a user. A username can be given as query parameter when routing to this component. If none is given it shows the currently logged in user.
 */
@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  providers: [DatePipe]
})
export class ProfileComponent {

  // Make things available in template
  Role = Role
  env = environment
  Gender = Gender

  currentUserRoleName = ''

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

  // Image cropper
  originalProfileImageFile: File | null = null
  croppedProfileImage: Blob | null = null
  profileImageChangeDialogVisible = false
  @ViewChild('profileImageFileUpload') profileImageFileUpload!: FileUpload
  submitProfileImageLoading = false;

  /**
   * Fetches the username from the query parameter and loads the users profile. If there is none or if it equal to the current logged in user it marks that in the {@link isMe} attribute, which reflects in slight UI changes.
   */
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
            if (this.posts != null) {
              this.posts.unshift(post)
              this.posts = [...this.posts]
            } else {
              this.posts = [post]
            }
          })
      })

    this.accDelConfirmUsername.valueChanges
      .subscribe(newVal => {
        this.deleteBtnDisabled = newVal?.toUpperCase() != this.userProfile?.username.toUpperCase()
      })

  }

  /**
   * Takes a {@link UserDataViewModel} an processes it to be shown by the UI.
   * @param data The {@link UserDataViewModel} to show.
   */
  setUserDate(data: UserDataViewModel) {
    this.settingsModel = { ...data }
    // primeng calendar somehow does not like our dates so we have to do this hack here:
    if (data.birthday) this.settingsModel.birthday = new Date(data.birthday)
    this.usernameForm.setValue(data.username)
    this.userData = data
  }

  /**
   * Is called when the discard btn inside the profile edit dialog is clicked. Reverts the inputs to their original values and closes the dialog.
   */
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

  /**
   * Submits the changed user data using the {@link AccountService}, if no request is already ongoing. Handles erros and displays error messages accordingly.
   */
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

  /**
   * Called by the follow button a profile. If no request is already ongoin it submits a new one to follow or unfollow the user, depending on the following state. Uses the {@link AccountService} to do so.
   */
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

  /**
   * Sets the text of the follow btn dependign on the following state for a given {@link UserProfileViewModel}.
   * @param userViewModel The {@link UserProfileViewModel} to get the following state from.
   */
  setFollowBtnText(userViewModel: UserProfileViewModel) {
    if (userViewModel.follow == null) {
      this.followBtnText = null
    } else if (userViewModel.follow) {
      this.followBtnText = 'Unfollow'
    } else {
      this.followBtnText = 'Follow'
    }
  }

  /**
   * Sets the text of the change mod btn dependign on the role a given {@link UserProfileViewModel}.
   * @param userViewModel The {@link UserProfileViewModel} to get the role from.
   */
  setChangeModBtnText(userViewModel: UserProfileViewModel) {
    if (userViewModel.role == Role.Moderator) {
      this.changemodBtnText = 'Demote'
    } else if (userViewModel.role == Role.User) {
      this.changemodBtnText = 'Promote'
    }
  }

  /**
   * Opens up the dialog which shows the followers of a user or the users that the user follows.
   * @param type Whether it should show the follower or the following dialog.
   */
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

  /**
   * Closes the follower/following dialog opened by {@link showFollowDialog}
   */
  hideDialog() {
    this.showFollowerDialog = false
    this.showFollowingDialog = false
  }

  /**
   * Makes a request to promote/demote the user depending on their current role using the {@link doRoleUpdate} method.
   */
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

  /**
   * Performs a role update request using the {@link AccountService} to update the role of a given user.
   * @param username The username of the user to perform the update on.
   * @param role The role to set for the given user.
   */
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

  /**
   * Is called by the event of the postlist component when it request more posts. Tries to load more posts using the {@link ContentService} and handles errors/dispalys error messages.
   */
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

  /**
   * Called when the account delete btn is clicked. Opens the account delete confirm dialog and sends a delete request using the {@link AccountService} when the user accepts it.
   */
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
              showGeneralError(this.messageService, 'An error occured while deleting this accoung. Please try again later!')
              console.error(err);
              return EMPTY
            })
          )
          .subscribe(() => {
            showGeneralError(this.messageService, 'Account deleted!', 'info', '')
            this.router.navigateByUrl('/')
          })
      }
    })
  }

  /**
   * Called when the user selects a new image for their profile. Updates the file to be used by the image cropper.
   */
  profileImageChangeEvent(event: FileSelectEvent) {
    const file = event.currentFiles[0]
    if (file) {
      this.originalProfileImageFile = file;
    }
  }

  /**
   * Called everytime the user releases the leftclick when cropping the image. Saves the current crop result to be later send to the server.
   */
  profileImageCropped(event: ImageCroppedEvent) {
    if (event.blob != undefined) {
      this.croppedProfileImage = event.blob
    }
  }

  /**
   * Called by the clear button to remove the currently select image from the image picker.
   */
  clearProfileImageUpload() {
    this.originalProfileImageFile = null
    this.profileImageFileUpload.clear()
  }

  /**
   * Submits the file saved by the {@link profileImageCropped} method to the server, if no request is already ongoing using the {@link AccountService}. Handles errors and displays them.
   */
  submitNewProfileImage() {
    if (this.submitProfileImageLoading || this.userProfile == null || this.croppedProfileImage == null) {
      return
    }
    this.submitProfileImageLoading = true

    let file = new File([this.croppedProfileImage], 'profileImage')
    this.accountService.changeUserProfileImage(this.userProfile.username, file)
      .pipe(
        catchError(err => {
          showGeneralError(this.messageService, 'An error occured while updating your profile picture! Please try again later.')
          this.submitProfileImageLoading = false
          console.error(err);
          return EMPTY
        })
      )
      .subscribe(newImgUrl => {
        this.submitProfileImageLoading = false
        this.profileImageChangeDialogVisible = false
        this.clearProfileImageUpload()
        if (this.userProfile) this.userProfile.profileImageUrl = '/' + newImgUrl
        for (let post of this.posts ?? []) {
          post.author.profileImageUrl = '/' + newImgUrl
        }

        showGeneralError(this.messageService, 'Profile picture updated!', 'info', '')
      })
  }

  /**
   * Called when the profile image delete btn is clicked. If no request is ongoing it makes one to delete the profile picture using the {@link AccountService}. Handles errors and displays them.
   */
  deleteCurrentProfileImage() {
    if (!this.userProfile || this.submitProfileImageLoading) {
      return
    }

    this.submitProfileImageLoading = true

    this.accountService.deleteUserProfileImage(this.userProfile.username)
      .pipe(
        catchError(err => {
          showGeneralError(this.messageService, 'An error occured while deleting your profile picture! Please try again later.')
          console.error(err);
          this.submitProfileImageLoading = false
          return EMPTY
        })
      )
      .subscribe(_ => {
        this.submitProfileImageLoading = false
        this.profileImageChangeDialogVisible = false
        this.clearProfileImageUpload()
        showGeneralError(this.messageService, 'Profile picture removed!', 'info', '')
        if (this.userProfile) this.userProfile.profileImageUrl = null
        for (let post of this.posts ?? []) {
          post.author.profileImageUrl = null
        }
      })
  }
}

/**
 * Maps the {@link Gender} enum to a string representation. Used as options for the dropdown.
 */
interface GenderOption {
  value: Gender | null,
  name: string
}

