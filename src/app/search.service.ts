import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Role } from 'src/DTOs/role';
import { UserDTO } from 'src/DTOs/userdto';
import { UserFilterModel } from 'src/DTOs/userfiltermodel';
import { environment } from 'src/environments/environment';

/**
 * This service provides methods for searching and retrieving user information.
 */
@Injectable({
  providedIn: 'root'
})
export class SearchService {

  private apiBase = environment.apiBase
  readonly jsonHeaders = new HttpHeaders({
    'Content-Type': 'application/json'
  })

  constructor(private http: HttpClient) { }


  /**
   * Makes a request to search the users for a specified query.
   * @param query The search query.
   * @returns The observable given by the http client containing the request result.
   */
  searchUser(query: string) {
    return this.http.get<UserDTO[]>(this.apiBase + '/search', {
      params: {
        username: query
      }
    })
  }

  /**
   * Makes a request to fetch a list of all moderators.
   * @returns The observable given by the http client containing the request result.
   */
  getModerators() {
    const filter: Partial<UserFilterModel> = {
      roles: [Role.Moderator]
    }

    return this.http.get<UserDTO[]>(this.apiBase + '/search/filter', {
      params: this.toHttpParams(filter)
    })
  }

  /**
   * Private helpder method that converts an object to a {@link HttpParams} object.
   * @param request The request to convert.
   * @returns The request converted to {@link HttpParams}
   */
  private toHttpParams(request: any): HttpParams {
    let httpParams = new HttpParams();
    Object.keys(request).forEach(function (key) {
      httpParams = httpParams.append(key, request[key]);
    });
    return httpParams;
  }
}
