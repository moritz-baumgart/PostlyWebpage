import { Component, ViewChild } from '@angular/core';
import { StatisticsService } from '../statistics.service';
import { ChartData } from 'chart.js';
import { UIChart } from 'primeng/chart';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent {


  totalUsers: number | null = null;
  totalLogins: number | null = null;
  totalPosts: number | null = null;
  totalComments: number | null = null;
  readonly documentStyle = getComputedStyle(document.documentElement);

  @ViewChild('genderPieChart') genderPieChart!: UIChart
  genderPieData: ChartData = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [this.documentStyle.getPropertyValue('--blue-500'), this.documentStyle.getPropertyValue('--yellow-500'), this.documentStyle.getPropertyValue('--green-500'), this.documentStyle.getPropertyValue('--red-500')],
        hoverBackgroundColor: [this.documentStyle.getPropertyValue('--blue-400'), this.documentStyle.getPropertyValue('--yellow-400'), this.documentStyle.getPropertyValue('--green-400'), this.documentStyle.getPropertyValue('--red-400')]
      }
    ]
  }

  genderPieOptions = {
    cutout: '60%',
    animation: false,
    responsive: false,
    plugins: {
      legend: {
        labels: {
          color: this.documentStyle.getPropertyValue('--text-color')
        }
      }
    }
  }

  @ViewChild('userPerDayChart') userPerDayChart!: UIChart
  userPerDayData = this.initChartDate('New users/day')
  newUsersToday: number | null = null

  @ViewChild('loginsPerDayChart') loginsPerDayChart!: UIChart
  loginsPerDayData = this.initChartDate('Logins/day')
  loginsToday: number | null = null

  @ViewChild('postsPerDayChart') postsPerDayChart!: UIChart
  postsPerDayData = this.initChartDate('Posts/day')
  postsToday: number | null = null

  @ViewChild('commentsPerDayChart') commentsPerDayChart!: UIChart
  commentsPerDayData = this.initChartDate('Comments/day')
  commentsToday: number | null = null





  linechartOptions = {
    plugins: {
      legend: {
        labels: {
          color: this.documentStyle.getPropertyValue('--text-color')
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: this.documentStyle.getPropertyValue('--text-color-secondary')
        },
        grid: {
          color: this.documentStyle.getPropertyValue('--surface-border'),
          drawBorder: false
        }
      },
      y: {
        ticks: {
          color: this.documentStyle.getPropertyValue('--text-color-secondary')
        },
        grid: {
          color: this.documentStyle.getPropertyValue('--surface-border'),
          drawBorder: false
        }
      }
    }
  };


  constructor(private stats: StatisticsService) {
    stats.getTotalUsers()
      .subscribe(val => {
        this.totalUsers = val
      })

    stats.getTotalLogins()
      .subscribe(val => {
        this.totalLogins = val
      })

    stats.getTotalPosts()
      .subscribe(val => {
        this.totalPosts = val
      })

    stats.getTotalComments()
      .subscribe(val => {
        this.totalComments = val
      })


  }

  ngAfterViewInit() {
    this.stats.getGenderDistribution()
      .subscribe(res => {
        this.genderPieData.labels = Object.keys(res)
        this.genderPieData.datasets[0].data = Object.values(res)
        this.genderPieChart.refresh()
      })

    this.stats.getUserPerDay()
      .subscribe(res => {
        this.userPerDayData.labels = Object.keys(res)
        this.userPerDayData.datasets[0].data = Object.values(res)
        this.newUsersToday = this.getTodayStat(res)
        this.userPerDayChart.refresh()
      })

    this.stats.getLoginsPerDay()
      .subscribe(res => {
        this.loginsPerDayData.labels = Object.keys(res)
        this.loginsPerDayData.datasets[0].data = Object.values(res)
        this.loginsToday = this.getTodayStat(res)
        this.loginsPerDayChart.refresh()
      })

    this.stats.getPostsPerDay()
      .subscribe(res => {
        this.postsPerDayData.labels = Object.keys(res)
        this.postsPerDayData.datasets[0].data = Object.values(res)
        this.postsToday = this.getTodayStat(res)
        this.postsPerDayChart.refresh()
      })

    this.stats.getCommentsPerDay()
      .subscribe(res => {
        this.commentsPerDayData.labels = Object.keys(res)
        this.commentsPerDayData.datasets[0].data = Object.values(res)
        this.commentsToday = this.getTodayStat(res)
        this.commentsPerDayChart.refresh()
      })
  }

  getTodayStat(val: { [datetimeString: string]: number }) {
    let mostRecent = Object.keys(val).at(-1)
    if (!mostRecent) {
      return 0
    }

    if (this.compareWithToday(mostRecent)) {
      return val[mostRecent]
    } else {
      return 0
    }
  }

  compareWithToday(dateString: string) {
    let date = new Date(dateString)
    let utcDate = this.getUTCMidnightDate(date)
    let utcToday = this.getUTCMidnightDate(new Date())
    return utcDate.valueOf() === utcToday.valueOf()
  }

  getUTCMidnightDate(date: Date) {
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  }

  initChartDate(label: string) {
    let chartDate: ChartData = {
      labels: [],
      datasets: [
        {
          label: label,
          data: []
        }
      ]
    }
    return chartDate
  }
}
