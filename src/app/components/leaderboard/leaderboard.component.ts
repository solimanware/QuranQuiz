import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
// Removed ionicons imports - using Font Awesome instead

import { AnalyticsService } from '../../services/analytics.service';
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
export class LeaderboardComponent implements OnInit, OnDestroy {
  leaderboard = signal<LeaderboardEntry[]>([]);
  todaysLeaderboard = signal<LeaderboardEntry[]>([]);
  userRank = signal<number | null>(null);
  isLoading = signal<boolean>(false);
  selectedTab = signal<'all-time' | 'today'>('all-time');
  componentLoadTime = signal<number>(0);

  currentUser = computed(() => this.authService.user());
  isAuthenticated = computed(() => this.authService.isAuthenticated());

  constructor(
    private authService: AuthService,
    private leaderboardService: LeaderboardService,
    private analytics: AnalyticsService,
    private router: Router
  ) {
    // Font Awesome icons are used instead of Ionic icons
  }

  async ngOnInit() {
    const loadStartTime = Date.now();

    try {
      // Track leaderboard view
      this.analytics.trackLeaderboardView(this.selectedTab());

      await this.loadLeaderboard();
      await this.loadTodaysLeaderboard();

      if (this.isAuthenticated()) {
        await this.loadUserRank();
      }

      // Track load time
      const loadTime = Date.now() - loadStartTime;
      this.componentLoadTime.set(loadTime);
      this.analytics.trackLoadTime('leaderboard', loadTime);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      this.analytics.trackError(
        'leaderboard',
        'load_failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  ngOnDestroy(): void {
    // Track engagement time on leaderboard
    if (this.componentLoadTime()) {
      const engagementTime = Date.now() - this.componentLoadTime();
      this.analytics.trackUserEngagement(
        'leaderboard_engagement',
        engagementTime
      );
    }
  }

  async loadLeaderboard() {
    try {
      const data = await this.leaderboardService.getTopPlayers();
      this.leaderboard.set(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      this.analytics.trackError(
        'leaderboard',
        'all_time_load_failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  async loadTodaysLeaderboard() {
    try {
      const data = await this.leaderboardService.getTodaysTopScores();
      this.todaysLeaderboard.set(data);
    } catch (error) {
      console.error("Error loading today's leaderboard:", error);
      this.analytics.trackError(
        'leaderboard',
        'today_load_failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  async loadUserRank() {
    try {
      const user = this.currentUser();
      if (user) {
        const rank = await this.leaderboardService.getUserRank(user.uid);
        this.userRank.set(rank);
      }
    } catch (error) {
      console.error('Error loading user rank:', error);
      this.analytics.trackError(
        'leaderboard',
        'user_rank_load_failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  selectTab(tab: 'all-time' | 'today') {
    this.selectedTab.set(tab);
    this.analytics.trackLeaderboardView(tab);
  }

  async refresh() {
    this.analytics.trackLeaderboardRefresh();

    try {
      this.isLoading.set(true);
      await this.loadLeaderboard();
      await this.loadTodaysLeaderboard();

      if (this.isAuthenticated()) {
        await this.loadUserRank();
      }
    } catch (error) {
      console.error('Error refreshing leaderboard:', error);
      this.analytics.trackError(
        'leaderboard',
        'refresh_failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      this.isLoading.set(false);
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

  isCurrentUser(entry: LeaderboardEntry): boolean {
    const user = this.currentUser();
    return user ? user.uid === entry.uid : false;
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  async signInWithGoogle(): Promise<void> {
    try {
      await this.authService.signInWithGoogle();
      // Analytics tracking is handled in AuthService
    } catch (error) {
      console.error('Login failed:', error);
    }
  }
}
