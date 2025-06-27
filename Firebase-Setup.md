# Firebase Setup Guide for Quran Quiz App

This guide will help you set up Firebase authentication and Firestore database for the Quran Quiz application.

## Prerequisites

- A Google account
- Firebase project access
- Angular 20+ with @angular/fire

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `quran-quiz-app`
4. Enable Google Analytics (optional)
5. Create project

## Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click **Get started**
3. Go to **Sign-in method** tab
4. Enable **Google** provider:
   - Click on Google
   - Toggle "Enable"
   - Add support email
   - Save

## Step 3: Create Firestore Database

1. Go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (we'll update rules later)
4. Select location (choose closest to your users)

## Step 4: Get Firebase Config

1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps" section
3. Click **Web app** icon (`</>`)
4. Register app name: `quran-quiz`
5. Copy the configuration object

## Step 5: Update Environment Files

Replace the placeholder values in these files with your actual Firebase config:

### `src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: "your-actual-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id",
  },
};
```

### `src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  firebase: {
    apiKey: "your-actual-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id",
  },
};
```

## Step 6: Deploy Firestore Rules

Copy the content from `firestore.rules` and paste it in Firebase Console:

1. Go to **Firestore Database** > **Rules**
2. Replace existing rules with content from `firestore.rules`
3. Click **Publish**

## Step 7: Test the Integration

1. Run the app: `ng serve`
2. Navigate to quiz game
3. Try signing in with Google
4. Play a game while authenticated
5. Check leaderboard functionality

## Database Structure

The app creates these collections automatically:

### `users` Collection

```typescript
{
  uid: string,
  email: string,
  displayName: string,
  photoURL?: string,
  createdAt: number,
  lastLoginAt: number,
  highestScore: number,
  totalGamesPlayed: number,
  totalCorrectAnswers: number,
  totalQuestions: number,
  bestStreak: number,
  level: number,
  xp: number
}
```

### `gameSessions` Collection

```typescript
{
  uid: string,
  score: number,
  totalQuestions: number,
  correctAnswers: number,
  streakCount: number,
  accuracy: number,
  playedAt: number,
  duration: number
}
```

## Features Implemented

✅ **Google Authentication**

- Sign in with Google popup
- User session management
- Automatic user profile creation

✅ **Leaderboard System**

- All-time leaderboard
- Daily leaderboard
- User rank calculation
- Score tracking

✅ **Game Statistics**

- Highest score tracking
- Game session recording
- XP and level system
- Accuracy calculation

✅ **Security**

- Firestore security rules
- User data isolation
- Input validation

## Troubleshooting

### Common Issues

1. **"Firebase not initialized"**

   - Ensure environment files have correct config
   - Check if Firebase is imported in main.ts

2. **"Permission denied" errors**

   - Verify Firestore rules are deployed
   - Check if user is authenticated

3. **Google sign-in popup blocked**

   - Add your domain to authorized domains
   - Test in incognito mode

4. **Network errors**
   - Check Firebase project billing status
   - Verify API keys are correct

### Testing Authentication

```typescript
// Test in browser console
firebase.auth().onAuthStateChanged((user) => {
  console.log("User:", user);
});
```

## Deployment Notes

For production deployment:

1. Add your domain to Firebase **Authorized domains**
2. Update environment.prod.ts with production config
3. Consider enabling Firebase Analytics
4. Set up monitoring and alerts

## Security Best Practices

1. Keep API keys in environment files
2. Never commit real credentials to version control
3. Use Firestore rules for data protection
4. Monitor usage and set budget alerts
5. Regularly review security rules

## Performance Optimization

1. Use Firestore compound indexes for complex queries
2. Implement pagination for large leaderboards
3. Cache user data locally when possible
4. Use Firebase Performance Monitoring

---

**Need Help?**

- [Firebase Documentation](https://firebase.google.com/docs)
- [Angular Fire Documentation](https://github.com/angular/angularfire)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
