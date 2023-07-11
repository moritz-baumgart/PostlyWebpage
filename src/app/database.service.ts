import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DatabaseOperationDTO } from 'src/DTOs/databaseoperationdto';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  private apiBase = environment.apiBase
  readonly jsonHeaders = new HttpHeaders({
    'Content-Type': 'application/json'
  })


  constructor(private http: HttpClient) { }


  executeQuery(query: string) {
    return this.http.post<DatabaseOperationDTO>(
      this.apiBase + '/database/execute',
      JSON.stringify(query),
      {
        headers: this.jsonHeaders
      }
    )
  }
}
