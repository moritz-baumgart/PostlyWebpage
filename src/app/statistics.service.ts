import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

/**
 * This service provides methods for fetching statistics.
 */
@Injectable({
  providedIn: 'root'
})
export class StatisticsService {

  private apiBase = environment.apiBase

  constructor(private http: HttpClient) { }

  /**
   * Makes a request to fetch the number of total users.
   * @returns The observable given by the http client containing the request result.
   */
  getTotalUsers() {
    return this.http.get<number>(this.apiBase + '/statistic/user/total')
  }

  /**
   * Makes a request to fetch the number of total logins.
   * @returns The observable given by the http client containing the request result.
   */
  getTotalLogins() {
    return this.http.get<number>(this.apiBase + '/statistic/login/total')
  }

  /**
   * Makes a request to fetch the number of total posts.
   * @returns The observable given by the http client containing the request result.
   */
  getTotalPosts() {
    return this.http.get<number>(this.apiBase + '/statistic/post/total')
  }

  /**
   * Makes a request to fetch the number of total comments.
   * @returns The observable given by the http client containing the request result.
   */
  getTotalComments() {
    return this.http.get<number>(this.apiBase + '/statistic/comment/total')
  }

  /**
   * Makes a request to fetch the gender distribution of the user base.
   * @returns The observable given by the http client containing the request result.
   */
  getGenderDistribution() {
    return this.http.get<{ [gender: string]: number }>(this.apiBase + '/statistic/user/gender')
  }

  /**
   * Makes a request to fetch the number of new users per day for the last 30 days.
   * @returns The observable given by the http client containing the request result.
   */
  getUserPerDay() {
    return this.http.get<{ [datetime: string]: number }>(this.apiBase + '/statistic/user/perday')
  }
  
  /**
   * Makes a request to fetch the number of logins per day for the last 30 days.
   * @returns The observable given by the http client containing the request result.
   */
  getLoginsPerDay() {
    return this.http.get<{ [datetime: string]: number }>(this.apiBase + '/statistic/login/perday')
  }
  
  /**
   * Makes a request to fetch the number of new posts per day for the last 30 days.
   * @returns The observable given by the http client containing the request result.
   */
  getPostsPerDay() {
    return this.http.get<{ [datetime: string]: number }>(this.apiBase + '/statistic/post/perday')
  }
  
  /**
   * Makes a request to fetch the number of new comments per day for the last 30 days.
   * @returns The observable given by the http client containing the request result.
   */
  getCommentsPerDay() {
    return this.http.get<{ [datetime: string]: number }>(this.apiBase + '/statistic/comment/perday')
  }



}
