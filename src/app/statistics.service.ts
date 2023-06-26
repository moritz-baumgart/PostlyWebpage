import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Gender } from 'src/DTOs/gender';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {

  private apiBase = environment.apiBase

  constructor(private http: HttpClient) { }

  getTotalUsers() {
    return this.http.get<number>(this.apiBase + '/statistic/user/total')
  }

  getTotalLogins() {
    return this.http.get<number>(this.apiBase + '/statistic/login/total')
  }

  getTotalPosts() {
    return this.http.get<number>(this.apiBase + '/statistic/post/total')
  }

  getTotalComments() {
    return this.http.get<number>(this.apiBase + '/statistic/comment/total')
  }

  getGenderDistribution() {
    return this.http.get<{ [gender: string]: number }>(this.apiBase + '/statistic/user/gender')
  }

  getUserPerDay() {
    return this.http.get<{ [datetime: string]: number }>(this.apiBase + '/statistic/user/perday')
  }

  getLoginsPerDay() {
    return this.http.get<{ [datetime: string]: number }>(this.apiBase + '/statistic/login/perday')
  }

  getPostsPerDay() {
    return this.http.get<{ [datetime: string]: number }>(this.apiBase + '/statistic/post/perday')
  }

  getCommentsPerDay() {
    return this.http.get<{ [datetime: string]: number }>(this.apiBase + '/statistic/comment/perday')
  }



}
