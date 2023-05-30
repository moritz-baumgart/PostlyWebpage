import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, ReplaySubject, catchError, map, of, tap } from 'rxjs';
import { RegisterError } from 'src/DTOs/registererror';
import { SuccessResult } from 'src/DTOs/successresult';
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

  constructor(private http: HttpClient, private cookie: CookieService) { }

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
   * Logs the user out.
   */
  logout() {
    this.cookie.delete('jwt')
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
}
