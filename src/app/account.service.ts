import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { ReplaySubject, catchError, of, tap } from 'rxjs';
import { PasswordUpdateRequest } from 'src/DTOs/passwordupdaterequest';
import { RegisterError } from 'src/DTOs/registererror';
import { SuccessResult } from 'src/DTOs/successresult';
import { UserDataUpdateRequest } from 'src/DTOs/userdataupdaterequest';
import { UserDataViewModel } from 'src/DTOs/userdataviewmodel';
import { UserProfileViewModel } from 'src/DTOs/userprofileviewmodel';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AccountService {

  private apiBase = environment.apiBase
  readonly jsonHeaders = new HttpHeaders({
    'Content-Type': 'application/json'
  })


  // This subject represents the login status of the user. It can by refreshed by using the refreshLoginStatus method e.g. when an action is taken that might change its status.
  private loggedIn = new ReplaySubject<boolean>(1)

  constructor(private http: HttpClient, private cookie: CookieService, private router: Router) { }

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
          this.refreshLoginStatus()
        })
      )
  }

  /**
   * Logs the user out. If redirect is given, it redirects to the given url after logout.
   */
  logout(redirect?: string) {
    this.cookie.delete('jwt')
    if (redirect) this.router.navigateByUrl(redirect)
  }

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
  refreshLoginStatus() {
    this.http.get<boolean>(this.apiBase + '/account/status')
      .pipe(
        catchError((_) => {
          return of(false)
        })
      )
      .subscribe((res) => {
        this.loggedIn.next(res)
      })
  }

  /**
   * Returns an observable for the loggIn subject.
   */
  isLoggedIn() {
    return this.loggedIn.asObservable()
  }

  getUserProfile(username?: string) {
    if (username) {
      return this.http.get<UserProfileViewModel>(this.apiBase + '/account/' + username + '/profile')
    } else {
      return this.http.get<UserProfileViewModel>(this.apiBase + '/account/me/profile')
    }
  }

  getUserData() {
    return this.http.get<UserDataViewModel>(this.apiBase + '/account/me/data')
  }

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
}
