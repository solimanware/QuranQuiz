import { Injectable, signal } from '@angular/core';
import { Achievement, UserProgress } from '../types/quiz.types';
import { AnalyticsService } from './analytics.service';

@Injectable({
  providedIn: 'root',
})
export class ProgressService {
  private readonly STORAGE_KEY = 'quran-quiz-progress';

  private progress = signal<UserProgress>({
    totalGamesPlayed: 0,
    totalCorrect: 0,
    totalQuestions: 0,
    bestStreak: 0,
    totalXP: 0,
    level: 1,
    achievements: [
      {
        id: 'first_game',
        name: 'First Steps',
        description: 'Complete your first quiz game',
        icon: '🌟',
        unlocked: false,
        type: 'total_questions',
        target: 1,
      },
      {
        id: 'accuracy_master',
        name: 'Accuracy Master',
        description: 'Achieve 90% accuracy',
        icon: '🎯',
        unlocked: false,
        type: 'accuracy',
        target: 90,
      },
      {
        id: 'streak_warrior',
        name: 'Streak Warrior',
        description: 'Get a streak of 10 correct answers',
        icon: '🔥',
        unlocked: false,
        type: 'streak',
        target: 10,
      },
      {
        id: 'dedicated_learner',
        name: 'Dedicated Learner',
        description: 'Play for 7 consecutive days',
        icon: '📚',
        unlocked: false,
        type: 'daily_streak',
        target: 7,
      },
      {
        id: 'knowledge_seeker',
        name: 'Knowledge Seeker',
        description: 'Answer 100 questions correctly',
        icon: '🧠',
        unlocked: false,
        type: 'total_questions',
        target: 100,
      },
    ],
    dailyStreak: 0,
    lastPlayDate: Date.now(),
    firstPlayDate: Date.now(),
    averageAccuracy: 0,
  });

  constructor(private analytics: AnalyticsService) {
    this.loadProgress();
  }

  // Update progress after a game
  updateProgress(gameData: {
    correctAnswers: number;
    totalQuestions: number;
    streak: number;
  }): void {
    const current = this.progress();
    const today = Date.now();

    const updated: UserProgress = {
      ...current,
      totalGamesPlayed: current.totalGamesPlayed + 1,
      totalCorrect: current.totalCorrect + gameData.correctAnswers,
      totalQuestions: current.totalQuestions + gameData.totalQuestions,
      bestStreak: Math.max(current.bestStreak, gameData.streak),
      totalXP: current.totalXP + this.calculateXP(gameData),
      dailyStreak: current.dailyStreak,
      lastPlayDate: today,
      averageAccuracy: this.calculateAverageAccuracy(
        current.totalCorrect + gameData.correctAnswers,
        current.totalQuestions + gameData.totalQuestions
      ),
    };

    // Calculate new level
    const previousLevel = current.level;
    updated.level = this.calculateLevel(updated.totalXP);

    // Track level up if level increased
    if (updated.level > previousLevel) {
      const xpGained = this.calculateXP(gameData);
      this.analytics.trackLevelUp(updated.level, xpGained);
    }

    this.progress.set(updated);
    this.saveProgress();
    this.checkAchievements(updated);
  }

  private calculateXP(gameData: {
    correctAnswers: number;
    totalQuestions: number;
    streak: number;
  }): number {
    const baseXP = gameData.correctAnswers * 10;
    const streakBonus = gameData.streak * 5;
    const accuracyBonus =
      gameData.correctAnswers === gameData.totalQuestions ? 50 : 0;
    return baseXP + streakBonus + accuracyBonus;
  }

  private calculateLevel(totalXP: number): number {
    return Math.floor(totalXP / 100) + 1;
  }

  private calculateAverageAccuracy(
    totalCorrect: number,
    totalQuestions: number
  ): number {
    return totalQuestions > 0
      ? Math.round((totalCorrect / totalQuestions) * 100)
      : 0;
  }

  private checkAchievements(progress: UserProgress): void {
    progress.achievements.forEach((achievement) => {
      if (!achievement.unlocked) {
        let shouldUnlock = false;

        switch (achievement.type) {
          case 'total_questions':
            shouldUnlock = progress.totalQuestions >= achievement.target;
            break;
          case 'accuracy':
            shouldUnlock = progress.averageAccuracy >= achievement.target;
            break;
          case 'streak':
            shouldUnlock = progress.bestStreak >= achievement.target;
            break;
          case 'daily_streak':
            shouldUnlock = progress.dailyStreak >= achievement.target;
            break;
        }

        if (shouldUnlock) {
          achievement.unlocked = true;
          this.analytics.trackAchievementUnlocked(
            achievement.id,
            achievement.name
          );
          console.log(`🏆 Achievement unlocked: ${achievement.name}!`);
        }
      }
    });
  }

  private loadProgress(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved) as UserProgress;
        this.progress.set(data);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
      this.analytics.trackError(
        'progress',
        'load_failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  // Get current progress
  getProgress(): UserProgress {
    return this.progress();
  }

  // Get specific achievement
  getAchievement(id: string): Achievement | undefined {
    return this.progress().achievements.find(
      (achievement) => achievement.id === id
    );
  }

  // Get unlocked achievements
  getUnlockedAchievements(): Achievement[] {
    return this.progress().achievements.filter(
      (achievement) => achievement.unlocked
    );
  }

  // Reset all progress
  resetProgress(): void {
    const defaultProgress: UserProgress = {
      totalGamesPlayed: 0,
      totalCorrect: 0,
      totalQuestions: 0,
      bestStreak: 0,
      totalXP: 0,
      level: 1,
      achievements: [
        {
          id: 'first_game',
          name: 'First Steps',
          description: 'Complete your first quiz game',
          icon: '🌟',
          unlocked: false,
          type: 'total_questions',
          target: 1,
        },
        {
          id: 'accuracy_master',
          name: 'Accuracy Master',
          description: 'Achieve 90% accuracy',
          icon: '🎯',
          unlocked: false,
          type: 'accuracy',
          target: 90,
        },
        {
          id: 'streak_warrior',
          name: 'Streak Warrior',
          description: 'Get a streak of 10 correct answers',
          icon: '🔥',
          unlocked: false,
          type: 'streak',
          target: 10,
        },
        {
          id: 'dedicated_learner',
          name: 'Dedicated Learner',
          description: 'Play for 7 consecutive days',
          icon: '📚',
          unlocked: false,
          type: 'daily_streak',
          target: 7,
        },
        {
          id: 'knowledge_seeker',
          name: 'Knowledge Seeker',
          description: 'Answer 100 questions correctly',
          icon: '🧠',
          unlocked: false,
          type: 'total_questions',
          target: 100,
        },
      ],
      dailyStreak: 0,
      lastPlayDate: Date.now(),
      firstPlayDate: Date.now(),
      averageAccuracy: 0,
    };

    this.progress.set(defaultProgress);
    localStorage.removeItem(this.STORAGE_KEY);
    this.analytics.trackCustomEvent('progress_reset', {
      timestamp: Date.now(),
    });
  }

  // Export progress data
  exportProgress(): UserProgress {
    return this.progress();
  }

  private saveProgress(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.progress()));
    } catch (error) {
      console.error('Error saving progress:', error);
      this.analytics.trackError(
        'progress',
        'save_failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
}
