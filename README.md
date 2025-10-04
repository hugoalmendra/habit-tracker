# Habit Tracker App

A full-stack habit tracking application built with React, TypeScript, tRPC, Supabase, Shadcn UI, and Framer Motion.

## Features

- 🔐 User authentication (email/password)
- 📝 Create and manage habits
- ✅ Daily habit tracking
- 📊 Monthly progress visualization with calendar heatmap
- 📈 Statistics and analytics (completion rates, streaks)
- 🎨 Custom color coding for habits
- ✨ Beautiful animations with Framer Motion
- 🎯 Type-safe API with tRPC
- 🌐 Real-time data sync with Supabase

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Shadcn UI** for beautiful, accessible components
- **Framer Motion** for smooth animations
- **React Router** for routing
- **date-fns** for date manipulation

### Backend & Database
- **Supabase** for PostgreSQL database, authentication, and real-time features
- **tRPC** for end-to-end type-safe APIs
- **Zod** for runtime validation

### State Management
- **TanStack Query** (React Query) for server state
- **React Context** for auth state

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account ([sign up here](https://supabase.com))

### Installation

1. Clone the repository and navigate to the project:

```bash
cd habit-tracker
```

2. Install dependencies:

```bash
npm install
```

3. Set up your Supabase project:

   - Go to [Supabase](https://supabase.com) and create a new project
   - Go to the SQL Editor and run the schema from `supabase-schema.sql`
   - Get your project URL and anon key from Settings > API

4. Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Start the development server:

```bash
npm run dev
```

6. Open [http://localhost:5173](http://localhost:5173) in your browser

## Database Schema

The application uses three main tables:

- **profiles** - User profile information
- **habits** - User's habits with name, description, and color
- **habit_completions** - Records of when habits were completed

See `supabase-schema.sql` for the complete schema with Row Level Security policies.

## Project Structure

```
habit-tracker/
├── src/
│   ├── components/
│   │   ├── ui/              # Shadcn UI components
│   │   ├── auth/            # Authentication components
│   │   ├── habits/          # Habit-related components
│   │   └── progress/        # Progress visualization components
│   ├── contexts/            # React contexts (Auth)
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities and configs
│   │   ├── supabase.ts      # Supabase client
│   │   ├── trpc.ts          # tRPC client
│   │   ├── types.ts         # Database types
│   │   └── utils.ts         # Utility functions
│   ├── pages/               # Page components
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   ├── Dashboard.tsx
│   │   └── Progress.tsx
│   ├── server/              # tRPC server code
│   │   ├── routers/         # API routers
│   │   └── trpc/            # tRPC configuration
│   ├── App.tsx              # Main app component
│   └── main.tsx             # Entry point
├── .env.local               # Environment variables (create this)
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features in Detail

### Authentication
- Email/password signup and login
- Protected routes
- Session persistence
- User profile management

### Habit Management
- Create habits with custom names, descriptions, and colors
- Delete habits with confirmation
- Color-coded habit cards
- Responsive grid layout

### Daily Tracking
- Mark habits as complete/incomplete for the current day
- Visual feedback with animated checkmarks
- Optimistic UI updates

### Progress Visualization
- Monthly calendar heatmap showing completion density
- Navigate between months
- Statistics: total habits, completions, completion rate, current streak
- Per-habit breakdown with progress bars
- Color-coded visualization matching habit colors

## Code Standards

- **TypeScript** strict mode enabled
- **ESLint** for code quality
- **Prettier** compatible formatting
- **Component organization** - One component per file
- **Type safety** - Full end-to-end type safety with tRPC
- **Error handling** - Proper error boundaries and user feedback
- **Accessibility** - Semantic HTML and ARIA labels
- **Performance** - Code splitting, lazy loading, optimistic updates

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - feel free to use this project for learning or as a starting point for your own app!

## Acknowledgments

- [Shadcn UI](https://ui.shadcn.com/) for the beautiful component library
- [Supabase](https://supabase.com/) for the backend infrastructure
- [tRPC](https://trpc.io/) for type-safe APIs
- [Framer Motion](https://www.framer.com/motion/) for animations
