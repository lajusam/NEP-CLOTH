# NEP-CLOTH ✦ Frontend Client

The frontend client for **NEP-CLOTH**, built with React 19, Vite, Tailwind CSS v4, and GSAP.

For the complete project setup, full-stack architecture, and backend instructions, refer to the [Root README](../README.md).

---

## ⚡ Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with `@tailwindcss/vite`
- **Animations**: [GSAP](https://gsap.com/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Data Visualization**: [Recharts](https://recharts.org/) (Admin dashboard)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Authentication**: [Supabase JS](https://supabase.com/docs/reference/javascript/introduction)

---

## 🚀 Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

   ```env
   VITE_API_URL=/api
   VITE_SUPABASE_URL="https://[YOUR-PROJECT].supabase.co"
   VITE_SUPABASE_PUBLISHABLE_KEY="[YOUR-ANON-KEY]"
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

   The app will run locally on `http://localhost:5173`.
   Vite's built-in dev proxy automatically forwards `/api/*` requests to the backend server running on `http://localhost:4000`.

---

## 📜 Available Scripts

- `npm run dev`: Runs the app in development mode with HMR.
- `npm run build`: Compiles and bundles the production app into `dist/`.
- `npm run preview`: Previews the production build locally.
- `npm run lint`: Runs Oxlint for fast code quality checks.
