import { AfterViewInit, Component, ElementRef, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { StatisticsService } from '../statistics.service';
import { ChartData } from 'chart.js';
import { UIChart } from 'primeng/chart';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent implements AfterViewInit {


  totalUsers: number | null = null;
  totalLogins: number | null = null;
  totalPosts: number | null = null;
  totalComments: number | null = null;
  readonly documentStyle = getComputedStyle(document.documentElement);

  @ViewChild('genderPieChart', { static: false }) genderPieChart!: UIChart
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

  @ViewChildren('perDayChart') perDayChartElements!: QueryList<UIChart>
  perDayCharts: PerDayChart[] = [
    {
      ref: 'userPerDayChart',
      chartData: this.initChartDate('New users/day'),
      todayStat: null,
      todayTitleText: 'New users today'
    },
    {
      ref: 'loginsPerDayChart',
      chartData: this.initChartDate('Logins/day'),
      todayStat: null,
      todayTitleText: 'Logins today'
    },
    {
      ref: 'postsPerDayChart',
      chartData: this.initChartDate('Posts/day'),
      todayStat: null,
      todayTitleText: 'Posts today'
    },
    {
      ref: 'commentsPerDayChart',
      chartData: this.initChartDate('Comments/day'),
      todayStat: null,
      todayTitleText: 'Comments today'
    }
  ]


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

    const statObservables = [
      this.stats.getUserPerDay(),
      this.stats.getLoginsPerDay(),
      this.stats.getPostsPerDay(),
      this.stats.getCommentsPerDay()
    ]
    for (let i = 0; i <= 3; i++) {
      statObservables[i] //TODO: Handle err
        .subscribe(res => {
          this.perDayCharts[i].chartData.labels = Object.keys(res)
          this.perDayCharts[i].chartData.datasets[0].data = Object.values(res)
          this.perDayCharts[i].todayStat = this.getTodayStat(res)
          this.perDayChartElements.toArray()[i].refresh()
        })
    }
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

  download(chartData: ChartData) {
    let csvContent = 'data:text/csv;charset=utf-8,Date,Amount\n'
    let counter = 0
    chartData.labels?.forEach(label => {
      csvContent += `${label},${chartData.datasets[0].data[counter]}\n`
      counter++
    })
    let encodedUri = encodeURI(csvContent);
    let link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${chartData.datasets[0].label}.csv`);
    document.body.appendChild(link);
    link.addEventListener('click', function () {
      document.body.removeChild(link);
    });
    link.click();
  }
}

interface PerDayChart {
  ref: string
  chartData: ChartData,
  todayStat: number | null
  todayTitleText: string
}
