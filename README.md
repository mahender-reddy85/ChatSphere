# ChatSphere - Real-time Chat Application with AI Integration

ChatSphere is a modern real-time chat application built with React, Vite, TypeScript, and Tailwind CSS. It supports user authentication, chat rooms, polls, video calls, and AI-powered responses via Google Gemini.

## Run Locally

**Prerequisites:** Node.js (v18+)

1. Clone the repository and navigate to the project directory.
2. Install dependencies:
   ```
   npm install
   ```
3. Copy `.env.example` to `.env.local` and add your Gemini API key:
   ```
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```
   Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
4. Run the development server:
   ```
   npm run dev
   ```
   The app will be available at http://localhost:3000.

## Deployment

### Vercel

1. Push your code to a GitHub repository.
2. Connect the repository to Vercel via the dashboard.
3. In Vercel project settings > Environment Variables, add:
   - `VITE_GEMINI_API_KEY`: Your Gemini API key.
4. Deploy – Vercel will build and deploy automatically on pushes to main.
5. The app will be served from the root (base '/'), so no additional config needed.

If AI features are disabled or CSS issues occur, ensure the API key is set correctly and redeploy.

### GitHub Pages

1. Install the `gh-pages` package (if not already):
   ```
   npm install --save-dev gh-pages
   ```
2. Add the following to `package.json` scripts:
   ```
   "predeploy": "npm run build",
   "deploy": "gh-pages -d dist"
   ```
3. Set the base path for GitHub Pages by creating `.env` with:
   ```
   VITE_BASE_URL=/ChatSphere/
   ```
   (Replace 'ChatSphere' with your repo name if different.)
4. Build and deploy:
   ```
   npm run deploy
   ```
   This will create a `gh-pages` branch and push the `dist/` folder.
5. Enable GitHub Pages in repo settings > Pages > Source: Deploy from a branch > gh-pages.

The app will be available at https://yourusername.github.io/ChatSphere/.

For AI features, set `VITE_GEMINI_API_KEY` in a GitHub Actions secret or note that it's disabled on GH Pages (env vars not directly supported; use Vercel for full features).

## Environment Variables

See `.env.example` for configuration. Key variables:

- `VITE_GEMINI_API_KEY`: Required for AI bot responses.
- `VITE_BASE_URL`: Optional for custom base paths in builds (e.g., subdomains).

Do not commit `.env.local` with real keys.

## Features

- Real-time messaging with Socket.io
- User authentication and rooms
- AI chat bot (Gemini)
- Polls, image sharing, video calls
- Responsive design with Tailwind CSS

## Troubleshooting

- **Blank page on GitHub Pages**: Ensure `VITE_BASE_URL` is set to '/repo-name/' during build.
- **No AI on Vercel**: Add `VITE_GEMINI_API_KEY` in Vercel env vars.
- **CSS not loading**: Verify Tailwind config and run `npm run build` to check `dist/` assets.
- **Local dev issues**: Check console for env warnings; ensure Node version compatibility.
