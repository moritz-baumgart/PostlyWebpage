import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Role } from 'src/DTOs/role';
import { UserDTO } from 'src/DTOs/userdto';
import { UserFilterModel } from 'src/DTOs/userfiltermodel';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  private apiBase = environment.apiBase
  readonly jsonHeaders = new HttpHeaders({
    'Content-Type': 'application/json'
  })

  constructor(private http: HttpClient) { }


  searchUser(query: string) {
    return this.http.get<UserDTO[]>(this.apiBase + '/search', {
      params: {
        username: query
      }
    })
  }

  getModerators() {
    const filter: Partial<UserFilterModel> = {
      roles: [Role.Moderator]
    }

    return this.http.get<UserDTO[]>(this.apiBase + '/search/filter', {
      params: this.toHttpParams(filter)
    })
  }

  toHttpParams(request: any): HttpParams {
    let httpParams = new HttpParams();
    Object.keys(request).forEach(function (key) {
      httpParams = httpParams.append(key, request[key]);
    });
    return httpParams;
  }
}
