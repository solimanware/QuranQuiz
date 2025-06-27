import { Routes } from '@angular/router';
import { LeaderboardComponent } from './components/leaderboard/leaderboard.component';
import { QuizGameComponent } from './components/quiz-game/quiz-game.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/quiz',
    pathMatch: 'full',
  },
  {
    path: 'quiz',
    component: QuizGameComponent,
  },
  {
    path: 'leaderboard',
    component: LeaderboardComponent,
  },
];
