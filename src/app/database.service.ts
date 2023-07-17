import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DatabaseOperationDTO } from 'src/DTOs/databaseoperationdto';
import { environment } from 'src/environments/environment';

/**
 * This service provides methods for interacting with the sql database.
 */
@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  private apiBase = environment.apiBase
  readonly jsonHeaders = new HttpHeaders({
    'Content-Type': 'application/json'
  })


  constructor(private http: HttpClient) { }


  /**
   * Makes a request to execute a given query on the sql server.
   * @param query The query.
   * @returns The observable given by the http client containing the request result.
   */
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
