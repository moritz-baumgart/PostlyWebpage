import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, ReplaySubject, catchError, map, of, tap } from 'rxjs';
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
  login(username: string, password: string): Observable<boolean> {

    return this.http.post<SuccessResult<string, object>>(this.apiBase + '/account/login', JSON.stringify({
      username,
      password
    }), {
      headers: this.jsonHeaders
    }).pipe(
      map((res) => {
        if (res.success && res.result != null) {
          this.cookie.set('jwt', res.result)
          this.refreshLoginStatus()
          return true
        }
        return false
      })
    )
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
