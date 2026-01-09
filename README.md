
# FinTrack Pro

A world-class Personal Finance Tracker built with React, Tailwind CSS, and Google Gemini AI.

## Features
- **Income & Expense Tracking**: Manage your daily finances with custom categories.
- **AI Saving Tips**: Get personalized, actionable advice powered by Gemini AI.
- **Visual Analytics**: Interactive Pie and Line charts to visualize spending habits.
- **Cloud Sync**: Securely backup and restore your data using Google Drive.
- **Privacy First**: All data is stored locally in your browser (LocalStorage) until you choose to sync with the cloud.

## How to use locally
1. Clone or download this folder.
2. Open `index.html` in your browser using a local server (like VS Code's "Live Server").
3. Set your name and preferred currency in the **Settings**.

## How to Deploy to Netlify
1. Go to [Netlify Drop](https://app.netlify.com/drop).
2. Drag and drop this folder.
3. Your app will be live in seconds!

## Configuration
- To use the **Cloud Backup** feature, you must provide your own `CLIENT_ID` in `services/googleDriveService.ts`.
- The **AI Tips** require a Google Gemini API key (provided via environment variables in the host environment).
