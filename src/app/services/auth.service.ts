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

  constructor(private auth: Auth, private firestore: Firestore) {
    // Listen to auth state changes
    user(this.auth).subscribe(async (firebaseUser) => {
      if (firebaseUser) {
        await this.loadUserData(firebaseUser);
      } else {
        this.currentUser.set(null);
      }
    });
  }

  async signInWithGoogle(): Promise<void> {
    try {
      this.isLoading.set(true);
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');

      const result = await signInWithPopup(this.auth, provider);
      const user = result.user;

      if (user) {
        await this.createOrUpdateUser(user);
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut(this.auth);
      this.currentUser.set(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  private async createOrUpdateUser(firebaseUser: User): Promise<void> {
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

    if (!userDoc.exists()) {
      // Create new user
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
    } else {
      // Update existing user
      await updateDoc(userRef, userData);
      await this.loadUserData(firebaseUser);
    }
  }

  private async loadUserData(firebaseUser: User): Promise<void> {
    try {
      const userRef = doc(this.firestore, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        this.currentUser.set(userDoc.data() as AppUser);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
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
      }

      // Update best streak if current streak is higher
      if (stats.streakCount > currentUser.bestStreak) {
        updates.bestStreak = stats.streakCount;
      }

      // Calculate XP and level
      const xpGained = stats.score + stats.streakCount * 5;
      updates.xp = currentUser.xp + xpGained;
      updates.level = Math.floor(updates.xp / 100) + 1;

      await updateDoc(userRef, updates);

      // Update local state
      this.currentUser.set({
        ...currentUser,
        ...updates,
      });
    } catch (error) {
      console.error('Error updating user stats:', error);
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

      const updates: Partial<AppUser> = {
        highestScore: currentScore,
        lastLoginAt: Date.now(),
      };

      await updateDoc(userRef, updates);

      // Update local state
      this.currentUser.set({
        ...currentUser,
        ...updates,
      });

      console.log(
        `Highest score updated to ${currentScore} after wrong answer`
      );
    } catch (error) {
      console.error('Error updating highest score:', error);
      throw error;
    }
  }

  getCurrentUser(): AppUser | null {
    return this.currentUser();
  }
}
