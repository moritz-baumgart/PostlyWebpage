import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { CookieService } from 'ngx-cookie-service';
import { EMPTY, ReplaySubject, catchError, of, tap } from 'rxjs';
import { PasswordUpdateRequest } from 'src/DTOs/passwordupdaterequest';
import { RegisterError } from 'src/DTOs/registererror';
import { Role } from 'src/DTOs/role';
import { SuccessResult } from 'src/DTOs/successresult';
import { UserDataUpdateRequest } from 'src/DTOs/userdataupdaterequest';
import { UserDataViewModel } from 'src/DTOs/userdataviewmodel';
import { UserDTO } from 'src/DTOs/userdto';
import { UserProfileViewModel } from 'src/DTOs/userprofileviewmodel';
import { environment } from 'src/environments/environment';

/**
 * This service is used for everything account related, that is login, logout, changing credentials and user data, following, etc.
 */
@Injectable({
  providedIn: 'root'
})
export class AccountService {

  private apiBase = environment.apiBase
  readonly jsonHeaders = new HttpHeaders({
    'Content-Type': 'application/json'
  })


  /** 
   * This subject represents the current users jwt. It is null if not logged in. It gets refreshed when logging in/out.
   */
  private currentUserJwt = new ReplaySubject<JwtToken | null>(1)

  constructor(private http: HttpClient, private cookie: CookieService, private router: Router, private jwtHelper: JwtHelperService) { }

  /**
   * This method tries to login a user with given credentials. If the login was successful it also automatically sets the jwt cookie.
   * @param username 
   * @param password 
   * @returns An Observable that resolves to a boolean value of true if the login was successful, false otherwise.
   */
  login(username: string, password: string) {

    return this.http.post(this.apiBase + '/account/login',
      JSON.stringify({
        username,
        password
      }),
      {
        headers: this.jsonHeaders,
        responseType: 'text'
      }).pipe(
        tap((res) => {
          this.cookie.set('jwt', res)
          this.refreshCurrentJwt()
        })
      )
  }

  /**
   * Logs the user out. If redirect is given, it redirects to the given url after logout.
   */
  logout(redirect?: string) {
    this.cookie.delete('jwt')
    this.refreshCurrentJwt()
    setTimeout(() => {
      if (redirect) this.router.navigateByUrl(redirect)
    }, 500)
  }

  /**
   * Tries to register a new user with given credentials.
   * @param username The username to register the user with.
   * @param password The password the user chose.
   * @returns The observable given by the http client containing the request result.
   */
  register(username: string, password: string) {
    return this.http.post<SuccessResult<object, RegisterError>>(this.apiBase + '/account/register',
      JSON.stringify({
        username,
        password
      }),
      {
        headers: this.jsonHeaders
      })
  }

  /**
   * This method queries the status endpoint and updates the loggedIn subject based on the response
   */
  refreshCurrentJwt() {
    this.http.get<boolean>(this.apiBase + '/account/status')
      .pipe(
        catchError((err: HttpErrorResponse) => {
          if (err.status == 401) {
            return of(false)
          }
          console.error(err);
          return EMPTY
        })
      )
      .subscribe((isLoggedIn) => {
        if (isLoggedIn) {
          this.currentUserJwt.next(this.jwtHelper.decodeToken<JwtToken | null>())
        } else {
          this.currentUserJwt.next(null)
        }

      })
  }

  /**
   * Returns an observable for the currentUserJwt subject.
   */
  getCurrentUserJwt() {
    return this.currentUserJwt.asObservable()
  }

  /**
   * Tries to fetch the profile information of a given user.
   * @param username The username of the user to retrieve the data for.
   * @returns The observable given by the http client containing the request result.
   */
  getUserProfile(username?: string) {
    if (username) {
      return this.http.get<UserProfileViewModel>(this.apiBase + '/account/' + username + '/profile')
    } else {
      return this.http.get<UserProfileViewModel>(this.apiBase + '/account/me/profile')
    }
  }

  /**
   * Tries to fetch the private user info for the currently logged in user.
   * @returns The observable given by the http client containing the request result.
   */
  getUserData() {
    return this.http.get<UserDataViewModel>(this.apiBase + '/account/me/data')
  }

  /**
   * Makes a request to update the profile data of a user.
   * @param username The username of the user to perform the update on.
   * @param updateRequest A {@link UserDataUpdateRequest} describing what should be updated/deleted.
   * @returns The observable given by the http client containing the request result.
   */
  updateUserData(username: string | null, updateRequest: UserDataUpdateRequest) {
    let url
    if (username) {
      url = `${this.apiBase}/account/${username}/data`
    } else {
      url = this.apiBase + '/account/me/data'
    }

    return this.http.patch<UserDataViewModel>(
      url,
      JSON.stringify(updateRequest),
      {
        headers: this.jsonHeaders
      }
    )
  }

  /**
   * Makes a request to change a user's username.
   * @param newUsername The new username.
   * @param oldUsername The old username of the user to change the name of.
   * @returns The observable given by the http client containing the request result.
   */
  changeUserName(newUsername: string, oldUsername?: string) {

    let url
    if (oldUsername) {
      url = `${this.apiBase}/account/${oldUsername}/username`
    } else {
      url = this.apiBase + '/account/me/username'
    }

    return this.http.put(
      url,
      JSON.stringify(newUsername),
      {
        headers: this.jsonHeaders
      }
    ).pipe(
      tap(_ => {
        this.logout('/login?ref=u')
      })
    )
  }

  /**
   * Makes a request to change a user's password.
   * @param oldPassword The old password.
   * @param newPassword The new password.
   * @param username The username of the user to change the password of.
   * @returns The observable given by the http client containing the request result.
   */
  changePassword(oldPassword: string, newPassword: string, username?: string) {

    let url
    if (username) {
      url = `${this.apiBase}/account/${username}/password`
    } else {
      url = this.apiBase + '/account/me/password'
    }

    let request: PasswordUpdateRequest = {
      oldPassword,
      newPassword
    }

    return this.http.put(
      url,
      JSON.stringify(request),
      {
        headers: this.jsonHeaders
      }
    ).pipe(
      tap(_ => {
        this.logout('/login?ref=u')
      })
    )
  }

  /**
 * Follows or unfollows a user.
 * @param targetUsername The username to follow/unfollow.
 * @param follow If set to true, adds a follow, otherwise removes it
 * @returns Observable with the updated UserProfileViewModel
  */
  changeFollow(targetUsername: string, follow: boolean) {
    if (follow) {
      return this.http.post<UserProfileViewModel>(this.apiBase + '/account/me/following/' + targetUsername, null)
    } else {
      return this.http.delete<UserProfileViewModel>(this.apiBase + '/account/me/following/' + targetUsername)
    }
  }

  /**
   * Fetches a list of {@link UserDTO}s from users that follow the given user. 
   * @param username The username of the user to fetch the followers of
   * @returns The observable given by the http client containing the request result.
   */
  getFollower(username?: string) {
    if (username) {
      return this.http.get<UserDTO[]>(this.apiBase + '/account/' + username + '/followers')
    } else {
      return this.http.get<UserDTO[]>(this.apiBase + '/account/me/followers')
    }
  }

  /**
   * Fetches a list of {@link UserDTO}s from users that are being followed by the given suer.
   * @param username The username of the user that follows the users to fetch.
   * @returns The observable given by the http client containing the request result.
   */
  getFollowing(username?: string) {
    if (username) {
      return this.http.get<UserDTO[]>(this.apiBase + '/account/' + username + '/following')
    } else {
      return this.http.get<UserDTO[]>(this.apiBase + '/account/me/following')
    }
  }

  /**
   * Makes a request to update the role of a given user.
   * @param username The username of the user to update.
   * @param role The role to set.
   * @returns The observable given by the http client containing the request result.
   */
  updateUserRole(username: string, role: Role) {
    return this.http.put<UserProfileViewModel>(
      this.apiBase + '/account/' + username + '/role',
      JSON.stringify(role),
      {
        headers: this.jsonHeaders
      }
    )
  }

  /**
   * Makes a request to delete a user.
   * @param username The username of the user to delete.
   * @param isMe If set to true uses the 'me' endpoint, otherwise the normal one.
   * @returns The observable given by the http client containing the request result.
   */
  deleteUser(username: string, isMe: boolean) {
    return this.http.delete(this.apiBase + '/account/' + username)
      .pipe(
        tap(() => {
          if (isMe) {
            this.logout()
          }
        })
      )
  }

  /**
   * Makes a request to change the profile picture of a given user.
   * @param username The username of the user to change to profile picture for.
   * @param image The image to set as the new profile picture.
   * @returns The observable given by the http client containing the request result.
   */
  changeUserProfileImage(username: string, image: File) {
    const formData = new FormData()
    formData.append('image', image)

    return this.http.put<string>(this.apiBase + '/image/user/' + username, formData)
  }

  /**
   * Makes a request to delete the profile picture for a given user.
   * @param username The username of the user to delete the profile picture for.
   * @returns The observable given by the http client containing the request result.
   */
  deleteUserProfileImage(username: string) {
    return this.http.delete(this.apiBase + '/image/user/' + username)
  }
}

/**
 * Describes the structure of the jwt token object.
 */
export type JwtToken = { [key: string]: any }
