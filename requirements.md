**Business Requirements Document (BRD)**

**Project Name:** QuranQuiz
**Platform:** Web/Mobile (Angular/Ionic)
**Target Audience:** Muslims interested in Quran memorization, trivia, and gamified learning.
**Primary Language:** Arabic/English
**Backend:** Firebase (Auth, Realtime DB, Storage)
**Quran Data Source:** AlQuran Cloud API + custom Surah JSON

---

## 1. **Project Overview**

QuranQuiz is a gamified application that helps users strengthen their Quran knowledge. Through daily quizzes, challenges, and multiplayer features, the app aims to create a fun and educational experience around the Holy Quran.

---

## 2. **Core Game Modes**

### 2.1. **Main Game Mode: "From Which Surah?"**

- Display a random Ayah.
- Provide 4 Surah name options (one correct, three incorrect).
- User selects one.
- After answer:

  - Show correct Surah name.
  - Optionally show Tafsir or explanation.

### 2.2. **Time Challenge Mode**

- User has 60 seconds to answer as many as possible.
- Hints:

  - Unlock after few seconds with score penalty.
  - Examples: remove 1 wrong, reveal Juz, etc.

### 2.3. **Surah Puzzle Mode**

- Scrambled Ayah (Arabic words only).
- User drags and reorders to correct form.
- Timer + XP bonus for perfect reorder.

### 2.4. **Daily Quiz / Streak Mode**

- 5 Ayat daily.
- Streak tracked.
- Bonuses on maintaining streak (XP, badges).

---

## 3. **Game Enhancements**

### 3.1. **XP, Levels, and Ranks**

- Earn XP per correct answer.
- Levels unlock:

  - New game modes.
  - Achievements (e.g., "Surah Sleuth").

### 3.2. **Power-Ups**

- Limited per game:

  - Remove 1 Wrong Answer
  - Reveal Surah's Juz
  - Extra Time
  - Ask the Ummah (community stats)

### 3.3. **Hints Economy**

- Hints limited per day.
- Refill options:

  - Daily recharge.
  - Watch an Islamic Ad (e.g., Hadith snippet).
  - Earn through challenges.

---

## 4. **Firebase + Social Features**

### 4.1. **Authentication**

- Google, Facebook, Anonymous.
- Sync user data across devices.

### 4.2. **Leaderboard**

- Types:

  - Global
  - Country-wise
  - Friends

- Duration:

  - Weekly
  - All-time

### 4.3. **Multiplayer Mode**

- 1v1 or group battle.
- Same Ayah shown to all.
- Winner = most correct answers in time.
- Firebase Realtime DB for sync.

### 4.4. **Commentary Mode**

- After answering, show short Tafsir.
- Source: Firebase Storage or external API (e.g., Ibn Kathir).

---

## 5. **UI/UX Design**

### 5.1. **Visual Design**

- Backgrounds: Subtle Islamic geometric patterns.
- Cards: Glassmorphism.
- Typography:

  - Arabic: Amiri
  - English: Lato

### 5.2. **Animations**

- Smooth transitions for quiz steps.
- Popups for right/wrong answers.
- Leaderboard climb effects.

### 5.3. **Dark Mode**

- Qur'an aesthetic.
- Eye-friendly for night-time use.

### 5.4. **Audio Integration (Optional)**

- Play Ayah audio.
- Correct Tajweed.
- Reward interaction.

---

## 6. **Bonus Features**

### 6.1. **Juz-by-Juz Mode**

- Filtered quizzes per Juz.

### 6.2. **Flashcard Mode**

- Practice and memorize:

  - Ayah ↔ Surah pairs

### 6.3. **Achievements System**

- Examples:

  - Answered 100 Ayat
  - Perfect Streak in a Week
  - Top 10 in Egypt

### 6.4. **Custom Avatars**

- Islamic-themed profile icons (e.g., mosques, crescents).

---

## 7. **API Integration**

- Endpoint:
  `https://api.alquran.cloud/v1/ayah/${getNumberBetween(1, 6236)}`

### 7.1. **Surah JSON Format**

```json
surahs: {
  count: 114,
  references: [
    {
      number: 1,
      name: "سُورَةُ ٱلْفَاتِحَةِ",
      englishName: "Al-Faatiha",
      englishNameTranslation: "The Opening",
      numberOfAyahs: 7,
      revelationType: "Meccan"
    },
    ...
  ]
}
```

---

## 8. **Technical Considerations**

- Angular for UI and state management.
- Ionic for mobile responsiveness.
- Firebase:

  - Authentication
  - Firestore for user/game data
  - Realtime DB for multiplayer
  - Firebase Functions for leaderboard logic

---

## 9. **Monetization (Optional)**

- Only Islamic-compliant options:

  - Watch Hadith snippet to earn hint
  - Optional donation support

---

## 10. **Next Steps**

- Finalize UI/UX wireframes
- Integrate Ayah API and Surah JSON
- Design XP & badge system
- Setup Firebase services
- Begin alpha testing with real users

---

**Prepared By:** Osama Soliman
**Date:** 2025-06-25
