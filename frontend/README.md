# 🎙️ Podcasts App v2

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-PostgreSQL-C5F74F?style=for-the-badge&logo=drizzle)](https://orm.drizzle.team/)
[![Azure Storage](https://img.shields.io/badge/Azure_Blob_Storage-0089D6?style=for-the-badge&logo=microsoft-azure)](https://azure.microsoft.com/en-us/products/storage/blobs/)

> A fully functional, production-ready full-stack podcast platform built with the Next.js App Router, Tailwind CSS v4, Drizzle ORM, and the Taddy Podcast API.

## 📖 Overview

Podcasts App v2 is a comprehensive podcast streaming and publishing platform. It serves both listeners who want to discover and play podcasts from the global Taddy GraphQL API and creators who want a dedicated studio to upload, manage, and process their own podcast episodes.

The application leverages Next.js App Router for server-side rendering and API routes, Better Auth for secure user management, and Drizzle ORM connected to a PostgreSQL database for robust data persistence. Audio and media files are seamlessly handled via direct-to-cloud Azure Blob Storage integrations.

## ✨ Key Features

- **Taddy API Integration:** Fetches real podcast data via GraphQL, proxied securely through Next.js Route Handlers to protect API keys and aggressively cache responses using `@tanstack/react-query`.
- **Global Audio Player:** A persistent, uninterrupted audio player built on top of HTML5 Audio Context that remains active while users navigate the application.
- **Robust Authentication:** Secure authentication powered by `better-auth`, supporting both OAuth (Google, GitHub) and email/password sign-ins.
- **Personalized User Experience:** Users can manage profiles, customize playback preferences (theme, playback speed), follow channels, like episodes, and automatically track play history.
- **Creator Studio Workspace:**
  - Create and manage custom podcasts and episodes.
  - Upload audio and artwork directly to Azure Blob Storage using secure, short-lived SAS tokens, bypassing server bottlenecks.
  - Record audio natively in the browser leveraging the MediaRecorder API.
- **AI Processing Pipeline Engine:** A background job queue system tracking the asynchronous processing of uploaded episodes (e.g., automated transcripts, AI summaries, chapters).
- **Responsive & Modern UI:** A beautiful, responsive interface utilizing Tailwind CSS v4, smooth micro-interactions with Framer Motion, and scalable iconography via Lucide React.

## 🛠️ Tech Stack

| Category | Technologies |
| --- | --- |
| **Framework** | Next.js (App Router), React 19 |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4, Framer Motion |
| **Database** | PostgreSQL, Drizzle ORM |
| **Authentication**| Better Auth |
| **Data Fetching** | React Query (`@tanstack/react-query`), Taddy GraphQL API |
| **Cloud Storage** | Azure Blob Storage |
| **Icons & Forms** | Lucide React, React Hook Form, Zod |

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your local machine:
- Node.js (v18.17.0 or newer)
- npm or pnpm or yarn
- A running instance of PostgreSQL (e.g., Neon, Supabase, Docker, or local)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd podcasts-app-v2/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file and fill in your credentials.
   ```bash
   cp .env.example .env.local
   ```
   
   #### Required Environment Variables
   | Variable | Description |
   | --- | --- |
   | `DATABASE_URL` | Your PostgreSQL connection string. |
   | `TADDY_USER_ID` | User ID for the Taddy GraphQL API ([Get it here](https://taddy.org/)). |
   | `TADDY_API_KEY` | API Key for the Taddy GraphQL API. |
   | `BETTER_AUTH_SECRET` | A secure random string for signing auth tokens. |
   | `BETTER_AUTH_URL` | Base URL of the app (e.g., `http://localhost:3000`). |
   | `AZURE_STORAGE_ACCOUNT_NAME` | Azure Blob Storage account name. |
   | `AZURE_STORAGE_ACCOUNT_KEY` | Azure Blob Storage account key. |
   | `AZURE_STORAGE_CONTAINER_NAME` | Azure Blob Storage container name (default: `podcasts`). |

   *(Optional) Add Google/GitHub Client IDs and Secrets to enable OAuth.*

4. **Initialize the Database:**
   Push the Drizzle ORM schema to your PostgreSQL database.
   ```bash
   npm run db:push
   ```
   *Tip: You can visually inspect your database by running `npm run db:studio`.*

5. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Architecture & Technical Decisions

- **API Proxy Pattern:** To circumvent exposing third-party API keys and to handle aggressive caching (`staleTime: 5m`), the Next.js server acts as an intermediary for all Taddy API requests. This respects strict rate limits (e.g., 500 requests/month on Free Tiers).
- **Direct-to-Cloud Uploads:** Uploading large audio files to a Next.js server limits scalability. Instead, the server generates a time-limited SAS (Shared Access Signature) URL, allowing the client browser to PUT the file directly into Azure Blob Storage.
- **Persistent Global Layout:** The `GlobalPlayerWrapper` encapsulates the `app/layout.tsx`. This Next.js App Router pattern ensures the audio player component does not unmount during route transitions, guaranteeing uninterrupted playback.
- **Asynchronous Background Processing:** Heavy tasks like transcription or summarization run out-of-band. The database's `Job` table tracks pipeline progression (`pending`, `processing`, `completed`, `error`), providing real-time status updates to the Creator Studio dashboard.

## 📂 Project Structure

```text
frontend/
├── app/                  # Next.js App Router pages and API route handlers
├── components/           # Reusable React components (UI, layout, player, studio)
├── drizzle/              # Drizzle ORM database migrations
├── hooks/                # Custom React hooks (e.g., useAudioRecorder, usePodcasts)
├── lib/                  # Core utilities (auth, db, taddy API, azure storage)
├── public/               # Static assets
└── types/                # TypeScript type definitions
```

## ☁️ Deployment

This project is optimized for deployment on Vercel.

1. Push your code to a GitHub repository.
2. Import the repository into [Vercel](https://vercel.com).
3. Under **Settings > Environment Variables**, add all the variables specified in your `.env.local` file.
4. Click **Deploy**. Next.js App Router and API Routes will automatically optimize for Vercel's edge and serverless infrastructure.

## 📄 License

This project is licensed under the MIT License.
