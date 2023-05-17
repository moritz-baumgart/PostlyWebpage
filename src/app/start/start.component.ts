import { Component } from '@angular/core';

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.scss']
})
export class StartComponent {

  posts: string[] = []

  skeletonHeights = [10, 16, 22, 25]


  constructor() {

    this.skeletonHeights = this.skeletonHeights.sort(() => Math.random() - 0.5)

    // This currently simulates the loading of some posts
    setTimeout(() => {
      this.posts = [
        'Irure incididunt ad excepteur officia voluptate irure eu ut proident veniam voluptate qui pariatur sunt.',
        'Laboris laboris excepteur irure elit incididunt dolor nostrud mollit. Commodo exercitation irure sint id reprehenderit ea ut culpa est irure. Dolore officia enim esse fugiat eu Lorem est mollit magna Lorem aliquip nisi id minim. Magna incididunt non mollit irure cupidatat nostrud minim enim. Ad enim occaecat consectetur tempor sunt ea qui pariatur sunt ullamco. Dolore ad quis minim veniam enim ad esse et enim in veniam duis excepteur cupidatat.',
        'Cupidatat ullamco laboris dolor sit pariatur voluptate consectetur mollit. Adipisicing ea labore sint et. Esse veniam Lorem reprehenderit Lorem non id anim aliquip officia. Cupidatat consectetur ut id excepteur in anim fugiat anim minim occaecat occaecat non et. Proident proident duis nostrud ex labore magna consectetur officia.Est minim adipisicing aliqua officia aliquip. Aliqua do laboris mollit elit labore velit occaecat sunt culpa eu laboris. Ex pariatur aliquip veniam veniam pariatur. Aliquip ut ex laboris culpa velit ullamco reprehenderit ad laborum do aliquip. Cillum nostrud proident ex cupidatat mollit adipisicing dolore eu cillum aute do ad nostrud deserunt. Eiusmod consequat elit labore dolor in anim consectetur cillum mollit anim nulla in. Sunt sit culpa velit proident eiusmod.',
        'Lorem ullamco et sunt occaecat culpa et ipsum esse cupidatat sint.',
        'Dolor eiusmod eu pariatur nostrud consequat qui pariatur qui consectetur.',
        'Laborum voluptate reprehenderit duis amet nulla. Ea cillum dolore cupidatat aute. Nulla aute mollit fugiat dolor anim officia mollit voluptate pariatur velit labore dolore. Officia duis laboris aute ullamco ex. Minim excepteur veniam incididunt excepteur consequat tempor ex culpa laborum ipsum veniam est. Ut et et velit in.',
      ]
    }, 2000)
  }
}
