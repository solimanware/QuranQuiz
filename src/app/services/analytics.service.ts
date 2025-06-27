import { Injectable } from '@angular/core';
import {
  Analytics,
  logEvent,
  setUserId,
  setUserProperties,
} from '@angular/fire/analytics';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface QuizEventData {
  score?: number;
  correctAnswers?: number;
  totalQuestions?: number;
  accuracy?: number;
  streakCount?: number;
  duration?: number;
  gameMode?: string;
}

export interface UserEventData {
  userId?: string;
  userLevel?: number;
  totalGamesPlayed?: number;
  highestScore?: number;
}

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  constructor(private analytics: Analytics, private router: Router) {
    this.setupPageViewTracking();
  }

  // Setup automatic page view tracking
  private setupPageViewTracking(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.trackPageView(event.urlAfterRedirects);
      });
  }

  // Track page views
  trackPageView(page: string): void {
    logEvent(this.analytics, 'page_view', {
      page_title: this.getPageTitle(page),
      page_location: page,
      page_path: page,
    });
  }

  // Get page title from route
  private getPageTitle(page: string): string {
    switch (page) {
      case '/':
      case '/quiz':
        return 'Quran Quiz Game';
      case '/leaderboard':
        return 'Leaderboard';
      default:
        return 'Quran Quiz App';
    }
  }

  // Set user ID and properties
  setUser(userId: string, properties: UserEventData): void {
    setUserId(this.analytics, userId);
    setUserProperties(this.analytics, {
      user_level: properties.userLevel,
      total_games_played: properties.totalGamesPlayed,
      highest_score: properties.highestScore,
    });
  }

  // Clear user data (on logout)
  clearUser(): void {
    setUserId(this.analytics, null);
  }

  // Quiz Events
  trackQuizStarted(gameMode: string = 'standard'): void {
    logEvent(this.analytics, 'quiz_started', {
      game_mode: gameMode,
      timestamp: Date.now(),
    });
  }

  trackQuizCompleted(data: QuizEventData): void {
    logEvent(this.analytics, 'quiz_completed', {
      score: data.score,
      correct_answers: data.correctAnswers,
      total_questions: data.totalQuestions,
      accuracy: data.accuracy,
      streak_count: data.streakCount,
      duration_ms: data.duration,
      game_mode: data.gameMode || 'standard',
    });
  }

  trackAnswerSelected(
    isCorrect: boolean,
    questionNumber: number,
    timeToAnswer?: number
  ): void {
    logEvent(this.analytics, 'answer_selected', {
      is_correct: isCorrect,
      question_number: questionNumber,
      time_to_answer_ms: timeToAnswer,
    });
  }

  trackCorrectAnswer(streakCount: number, questionNumber: number): void {
    logEvent(this.analytics, 'correct_answer', {
      streak_count: streakCount,
      question_number: questionNumber,
    });
  }

  trackIncorrectAnswer(
    correctSurah: string,
    selectedSurah: string,
    questionNumber: number
  ): void {
    logEvent(this.analytics, 'incorrect_answer', {
      correct_surah: correctSurah,
      selected_surah: selectedSurah,
      question_number: questionNumber,
    });
  }

  trackHighScoreAchieved(
    newHighScore: number,
    previousHighScore: number
  ): void {
    logEvent(this.analytics, 'high_score_achieved', {
      new_high_score: newHighScore,
      previous_high_score: previousHighScore,
      improvement: newHighScore - previousHighScore,
    });
  }

  // Authentication Events
  trackLoginAttempt(method: string): void {
    logEvent(this.analytics, 'login_attempt', {
      method: method,
    });
  }

  trackLoginSuccess(method: string, isNewUser: boolean): void {
    logEvent(this.analytics, 'login', {
      method: method,
      is_new_user: isNewUser,
    });
  }

  trackLoginFailure(method: string, error: string): void {
    logEvent(this.analytics, 'login_failure', {
      method: method,
      error_type: error,
    });
  }

  trackLogout(): void {
    logEvent(this.analytics, 'logout', {});
  }

  // Game Interaction Events
  trackSoundToggle(soundEnabled: boolean): void {
    logEvent(this.analytics, 'sound_toggle', {
      sound_enabled: soundEnabled,
    });
  }

  trackNewGameStarted(): void {
    logEvent(this.analytics, 'new_game_started', {
      timestamp: Date.now(),
    });
  }

  trackLeaderboardView(tab: string): void {
    logEvent(this.analytics, 'leaderboard_view', {
      tab: tab, // 'all-time' or 'today'
    });
  }

  trackLeaderboardRefresh(): void {
    logEvent(this.analytics, 'leaderboard_refresh', {
      timestamp: Date.now(),
    });
  }

  // Audio Events
  trackAyahAudioPlay(ayahNumber: number): void {
    logEvent(this.analytics, 'ayah_audio_play', {
      ayah_number: ayahNumber,
    });
  }

  trackAyahAudioStop(ayahNumber: number, playDuration?: number): void {
    logEvent(this.analytics, 'ayah_audio_stop', {
      ayah_number: ayahNumber,
      play_duration_ms: playDuration,
    });
  }

  // Achievement Events
  trackAchievementUnlocked(
    achievementId: string,
    achievementName: string
  ): void {
    logEvent(this.analytics, 'achievement_unlocked', {
      achievement_id: achievementId,
      achievement_name: achievementName,
    });
  }

  trackLevelUp(newLevel: number, xpEarned: number): void {
    logEvent(this.analytics, 'level_up', {
      new_level: newLevel,
      xp_earned: xpEarned,
    });
  }

  // Error Tracking
  trackError(errorType: string, errorMessage: string, context?: string): void {
    logEvent(this.analytics, 'app_error', {
      error_type: errorType,
      error_message: errorMessage,
      context: context,
    });
  }

  // Performance Events
  trackLoadTime(resourceType: string, loadTime: number): void {
    logEvent(this.analytics, 'load_time', {
      resource_type: resourceType,
      load_time_ms: loadTime,
    });
  }

  // Engagement Events
  trackSessionDuration(duration: number): void {
    logEvent(this.analytics, 'session_duration', {
      duration_ms: duration,
    });
  }

  trackUserEngagement(event: string, value?: number): void {
    logEvent(this.analytics, 'user_engagement', {
      engagement_type: event,
      engagement_value: value,
    });
  }

  // Custom Events
  trackCustomEvent(eventName: string, parameters: Record<string, any>): void {
    logEvent(this.analytics, eventName, parameters);
  }
}
