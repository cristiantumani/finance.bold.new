# Personal Finance Tracker

A comprehensive personal finance management application built with React, TypeScript, and Supabase.

## Features

- 📊 Transaction tracking and categorization
- 💰 Budget management and monitoring
- 📈 Financial reports and visualizations
- 🏦 Plaid integration for bank account linking
- 📱 Responsive design for mobile and desktop
- 🔐 Secure authentication with Supabase
- 📊 Interactive charts and analytics

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS
- **Charts**: Chart.js, React-ChartJS-2
- **Backend**: Supabase (Database, Auth, Edge Functions)
- **Banking**: Plaid API integration
- **Routing**: React Router v6

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- A Supabase account ([Sign up here](https://supabase.com))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/cristiantumani/finance.bold.new.git
cd finance.bold.new
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` and add your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development

Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Deployment

This project is configured for easy deployment to multiple platforms:

### Deploy to Netlify (Recommended)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/cristiantumani/finance.bold.new)

1. Click the "Deploy to Netlify" button above, or:
2. Go to [Netlify](https://app.netlify.com)
3. Import your GitHub repository
4. Add environment variables in Netlify dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy!

The build settings are already configured in `netlify.toml`.

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/cristiantumani/finance.bold.new)

1. Click the "Deploy with Vercel" button above, or:
2. Go to [Vercel](https://vercel.com)
3. Import your GitHub repository
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy!

### Deploy to Cloudflare Pages

1. Go to [Cloudflare Pages](https://pages.cloudflare.com)
2. Connect your GitHub repository
3. Build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Add environment variables
5. Deploy!

## Supabase Setup

1. Create a new project at [Supabase](https://supabase.com)
2. Run the migrations in the `supabase/migrations` folder
3. Set up Edge Functions in `supabase/functions`
4. Configure authentication providers in Supabase dashboard

## Project Structure

```
finance.bold.new/
├── src/
│   ├── components/     # React components
│   ├── contexts/       # React contexts (Auth, etc.)
│   ├── lib/           # Utilities and integrations
│   ├── pages/         # Page components
│   ├── types/         # TypeScript types
│   └── main.tsx       # App entry point
├── supabase/
│   ├── functions/     # Edge functions
│   └── migrations/    # Database migrations
├── public/            # Static assets
└── netlify.toml       # Netlify configuration
```

## Environment Variables

All environment variables must be prefixed with `VITE_` to be accessible in the frontend:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues and questions, please open an issue on GitHub.

---

**Note**: This project was originally created using Bolt.new but can now be developed and deployed independently without requiring Bolt.new credits.
