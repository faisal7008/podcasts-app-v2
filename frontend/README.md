# Podcasts App v2

A fully functional, production-ready podcast site using the Next.js App Router, Tailwind CSS, and the Taddy Podcast API.

## Features

- **Taddy API Integration:** Real podcast data fetched via GraphQL and proxied through Next.js Route Handlers.
- **Global Audio Player:** A persistent audio player using HTML5 Audio Context that remains active while navigating the site.
- **Data Fetching & Caching:** Utilizes `@tanstack/react-query` to cache responses, minimize rate limiting, and provide snappy navigation.
- **State Management:** Zustand is set up for future scalable global state management, combined with React Context for the player.
- **Beautiful UI:** Implementation matches a premium Figma design aesthetic.

## Setup Instructions

1. **Clone the repository:**
   \`\`\`bash
   git clone <repo-url>
   cd podcasts-app-v2/frontend
   \`\`\`

2. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Environment Variables:**
   Copy the example environment file and fill in your Taddy API credentials. You can get an API key at [taddy.org](https://taddy.org/).
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`
   Fill in `TADDY_USER_ID` and `TADDY_API_KEY`.

4. **Run the development server:**
   \`\`\`bash
   npm run dev
   \`\`\`
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## API Endpoint Documentation

To hide the Taddy API key and User ID from the client, all requests are routed through Next.js API Routes (Route Handlers) which act as a RESTful proxy to the Taddy GraphQL API.

- `GET /api/podcasts/search?q={query}` - Search for podcasts and episodes by term.
- `GET /api/podcasts/[id]` - Retrieve full podcast series metadata and its latest 20 episodes.
- `GET /api/episodes/[id]` - Retrieve full episode metadata including the audio streaming URL.

## Architecture Decisions

- **Proxy Pattern:** The client never talks directly to Taddy. Next.js server acts as a middleman to protect credentials.
- **React Query:** Aggressive caching is enabled (`staleTime: 5m`) to ensure that users navigating the app do not consume the strict Taddy Free Tier rate limits (500 requests/month).
- **Global Layout:** The audio player provider sits at the top level in `app/layout.tsx` using `GlobalPlayerWrapper`. This ensures playback isn't interrupted during page transitions.

## Deployment (Vercel)

1. Push this code to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Under **Environment Variables**, add `TADDY_USER_ID` and `TADDY_API_KEY`.
4. Deploy! Next.js App Router and API Routes are perfectly optimized for Vercel's edge network.
