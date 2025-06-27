import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
// Removed ionicons imports - using Font Awesome instead

import { AuthService } from '../../services/auth.service';
import { LeaderboardService } from '../../services/leaderboard.service';
import { LeaderboardEntry } from '../../types/quiz.types';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, IonicModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss'],
})
export class LeaderboardComponent implements OnInit {
  leaderboard = signal<LeaderboardEntry[]>([]);
  todaysLeaderboard = signal<LeaderboardEntry[]>([]);
  userRank = signal<number | null>(null);
  isLoading = signal<boolean>(false);
  selectedTab = signal<'all-time' | 'today'>('all-time');

  currentUser = computed(() => this.authService.user());
  isAuthenticated = computed(() => this.authService.isAuthenticated());

  constructor(
    private authService: AuthService,
    private leaderboardService: LeaderboardService,
    private router: Router
  ) {
    // Font Awesome icons are used instead of Ionic icons
  }

  async ngOnInit() {
    await this.loadLeaderboard();
    await this.loadTodaysLeaderboard();

    if (this.isAuthenticated()) {
      await this.loadUserRank();
    }
  }

  async loadLeaderboard() {
    try {
      this.isLoading.set(true);
      const data = await this.leaderboardService.getTopPlayers(20);
      this.leaderboard.set(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadTodaysLeaderboard() {
    try {
      const data = await this.leaderboardService.getTodaysTopScores();
      this.todaysLeaderboard.set(data);
    } catch (error) {
      console.error("Error loading today's leaderboard:", error);
    }
  }

  async loadUserRank() {
    const user = this.currentUser();
    if (user) {
      try {
        const rank = await this.leaderboardService.getUserRank(user.uid);
        this.userRank.set(rank);
      } catch (error) {
        console.error('Error loading user rank:', error);
      }
    }
  }

  switchTab(tab: 'all-time' | 'today') {
    this.selectedTab.set(tab);
  }

  async refresh() {
    if (this.selectedTab() === 'all-time') {
      await this.loadLeaderboard();
    } else {
      await this.loadTodaysLeaderboard();
    }

    if (this.isAuthenticated()) {
      await this.loadUserRank();
    }
  }

  async signInWithGoogle(): Promise<void> {
    try {
      await this.authService.signInWithGoogle();
      // Reload data after login
      await this.refresh();
    } catch (error) {
      console.error('Login failed:', error);
    }
  }

  goBack() {
    this.router.navigate(['/quiz']);
  }

  getRankIcon(rank: number): string {
    switch (rank) {
      case 1:
        return 'fas fa-trophy';
      case 2:
      case 3:
        return 'fas fa-medal';
      default:
        return 'fas fa-star';
    }
  }

  getRankClass(rank: number): string {
    switch (rank) {
      case 1:
        return 'gold';
      case 2:
        return 'silver';
      case 3:
        return 'bronze';
      default:
        return 'regular';
    }
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('ar-SA', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  isCurrentUser(entry: LeaderboardEntry): boolean {
    const user = this.currentUser();
    return user ? entry.uid === user.uid : false;
  }
}
