import { Injectable, computed, signal } from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  User,
  signInWithPopup,
  signOut,
  user,
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { AppUser } from '../types/quiz.types';
import { AnalyticsService } from './analytics.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUser = signal<AppUser | null>(null);
  private isLoading = signal<boolean>(false);

  // Computed values
  isAuthenticated = computed(() => !!this.currentUser());
  user = computed(() => this.currentUser());
  loading = computed(() => this.isLoading());

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private analytics: AnalyticsService
  ) {
    // Listen to auth state changes
    user(this.auth).subscribe(async (firebaseUser) => {
      if (firebaseUser) {
        await this.loadUserData(firebaseUser);
      } else {
        this.currentUser.set(null);
        this.analytics.clearUser();
      }
    });
  }

  async signInWithGoogle(): Promise<void> {
    try {
      this.isLoading.set(true);
      this.analytics.trackLoginAttempt('google');

      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');

      const result = await signInWithPopup(this.auth, provider);
      const user = result.user;

      if (user) {
        const isNewUser = await this.createOrUpdateUser(user);
        this.analytics.trackLoginSuccess('google', isNewUser);
      }
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      this.analytics.trackLoginFailure('google', error.code || 'unknown_error');
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async signOut(): Promise<void> {
    try {
      this.analytics.trackLogout();
      await signOut(this.auth);
      this.currentUser.set(null);
      this.analytics.clearUser();
    } catch (error) {
      console.error('Error signing out:', error);
      this.analytics.trackError(
        'auth',
        'signout_failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  private async createOrUpdateUser(firebaseUser: User): Promise<boolean> {
    const userRef = doc(this.firestore, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userRef);

    const now = Date.now();
    const userData: Partial<AppUser> = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || '',
      photoURL: firebaseUser.photoURL || undefined,
      lastLoginAt: now,
    };

    let isNewUser = false;

    if (!userDoc.exists()) {
      // Create new user
      isNewUser = true;
      const newUser: AppUser = {
        ...(userData as AppUser),
        createdAt: now,
        highestScore: 0,
        totalGamesPlayed: 0,
        totalCorrectAnswers: 0,
        totalQuestions: 0,
        bestStreak: 0,
        level: 1,
        xp: 0,
      };
      await setDoc(userRef, newUser);
      this.currentUser.set(newUser);

      // Set analytics user properties for new user
      this.analytics.setUser(newUser.uid, {
        userLevel: newUser.level,
        totalGamesPlayed: newUser.totalGamesPlayed,
        highestScore: newUser.highestScore,
      });
    } else {
      // Update existing user
      await updateDoc(userRef, userData);
      await this.loadUserData(firebaseUser);
    }

    return isNewUser;
  }

  private async loadUserData(firebaseUser: User): Promise<void> {
    try {
      const userRef = doc(this.firestore, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data() as AppUser;
        this.currentUser.set(userData);

        // Update analytics user properties
        this.analytics.setUser(userData.uid, {
          userLevel: userData.level,
          totalGamesPlayed: userData.totalGamesPlayed,
          highestScore: userData.highestScore,
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      this.analytics.trackError(
        'auth',
        'load_user_data_failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  async updateUserStats(stats: {
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    streakCount: number;
  }): Promise<void> {
    const currentUser = this.currentUser();
    if (!currentUser) return;

    try {
      const userRef = doc(this.firestore, 'users', currentUser.uid);
      const previousHighScore = currentUser.highestScore;
      const previousLevel = currentUser.level;

      const updates: Partial<AppUser> = {
        totalGamesPlayed: currentUser.totalGamesPlayed + 1,
        totalCorrectAnswers:
          currentUser.totalCorrectAnswers + stats.correctAnswers,
        totalQuestions: currentUser.totalQuestions + stats.totalQuestions,
        lastLoginAt: Date.now(),
      };

      // Update highest score if current score is higher
      if (stats.score > currentUser.highestScore) {
        updates.highestScore = stats.score;
        this.analytics.trackHighScoreAchieved(stats.score, previousHighScore);
      }

      // Update best streak if current streak is higher
      if (stats.streakCount > currentUser.bestStreak) {
        updates.bestStreak = stats.streakCount;
      }

      // Calculate XP and level
      const xpGained = stats.score + stats.streakCount * 5;
      updates.xp = currentUser.xp + xpGained;
      updates.level = Math.floor(updates.xp / 100) + 1;

      // Track level up
      if (updates.level > previousLevel) {
        this.analytics.trackLevelUp(updates.level, xpGained);
      }

      await updateDoc(userRef, updates);

      // Update local state
      const updatedUser = {
        ...currentUser,
        ...updates,
      };
      this.currentUser.set(updatedUser);

      // Update analytics user properties
      this.analytics.setUser(updatedUser.uid, {
        userLevel: updatedUser.level,
        totalGamesPlayed: updatedUser.totalGamesPlayed,
        highestScore: updatedUser.highestScore,
      });
    } catch (error) {
      console.error('Error updating user stats:', error);
      this.analytics.trackError(
        'auth',
        'update_user_stats_failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  // Update highest score immediately if current score is better (used when wrong answer ends game early)
  async updateHighestScoreIfBetter(currentScore: number): Promise<void> {
    const currentUser = this.currentUser();
    if (!currentUser) return;

    // Only update if current score is actually higher
    if (currentScore <= currentUser.highestScore) return;

    try {
      const userRef = doc(this.firestore, 'users', currentUser.uid);
      const previousHighScore = currentUser.highestScore;

      const updates: Partial<AppUser> = {
        highestScore: currentScore,
        lastLoginAt: Date.now(),
      };

      await updateDoc(userRef, updates);

      // Update local state
      const updatedUser = {
        ...currentUser,
        ...updates,
      };
      this.currentUser.set(updatedUser);

      // Track high score achievement
      this.analytics.trackHighScoreAchieved(currentScore, previousHighScore);

      // Update analytics user properties
      this.analytics.setUser(updatedUser.uid, {
        userLevel: updatedUser.level,
        totalGamesPlayed: updatedUser.totalGamesPlayed,
        highestScore: updatedUser.highestScore,
      });

      console.log(
        `Highest score updated to ${currentScore} after wrong answer`
      );
    } catch (error) {
      console.error('Error updating highest score:', error);
      this.analytics.trackError(
        'auth',
        'update_highest_score_failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  getCurrentUser(): AppUser | null {
    return this.currentUser();
  }
}
