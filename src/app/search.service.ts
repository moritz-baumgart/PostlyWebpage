import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UserDTO } from 'src/DTOs/userdto';
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
}
