# Quick Setup Guide

## 1. Install Dependencies

```bash
cd habit-tracker
npm install
```

This will install all required packages including:
- React 18 & React DOM
- TypeScript
- Vite
- tRPC (client & server)
- TanStack Query (React Query)
- Supabase client
- Shadcn UI components (Radix UI primitives)
- Framer Motion
- Tailwind CSS
- date-fns
- Zod

## 2. Set Up Supabase

### Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in project details:
   - Name: habit-tracker
   - Database Password: (choose a strong password)
   - Region: (select closest to you)
5. Wait for the project to be created (~2 minutes)

### Run the Database Schema

1. In your Supabase project, go to the SQL Editor (from left sidebar)
2. Click "New Query"
3. Copy the entire contents of `supabase-schema.sql`
4. Paste into the SQL Editor
5. Click "Run" to execute the schema
6. You should see "Success. No rows returned" message

This creates:
- `profiles` table
- `habits` table
- `habit_completions` table
- All necessary Row Level Security (RLS) policies
- Indexes for performance
- Triggers for timestamp updates

### Get Your API Credentials

1. Go to Settings (gear icon in sidebar)
2. Click "API" in the settings menu
3. Copy these two values:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")

## 3. Configure Environment Variables

1. Copy the `.env.example` file to `.env.local`:

```bash
cp .env.example .env.local
```

2. Edit `.env.local` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace the values with your actual Supabase URL and anon key from step 2.

## 4. Start the Development Server

```bash
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173)

## 5. Create Your First Account

1. Open the app in your browser
2. Click "Sign up"
3. Enter your email, password, and full name
4. You'll be automatically logged in and redirected to the dashboard
5. Click "Add Habit" to create your first habit!

## Troubleshooting

### "Missing Supabase environment variables" error

- Make sure you created the `.env.local` file
- Verify the variable names start with `VITE_`
- Restart the dev server after creating/updating `.env.local`

### Authentication not working

- Check that the database schema was run successfully
- Verify RLS policies are enabled on all tables
- Check browser console for specific error messages

### tRPC errors

- Make sure all dependencies installed correctly
- Clear browser cache and reload
- Check that Supabase URL and key are correct

### Build errors

- Run `npm install` again to ensure all dependencies are installed
- Delete `node_modules` and run `npm install` fresh
- Check that you're using Node.js 18 or higher

## Next Steps

Once you're up and running:

1. Create some habits
2. Mark them as complete throughout the day
3. Check out the Progress page to see your calendar heatmap and stats
4. Customize habit colors to organize them visually

## Optional: AI Integration

The project includes AI SDK setup for future AI-powered features like:
- Habit suggestions based on your goals
- Personalized insights and recommendations
- Natural language habit creation

To enable AI features (future implementation):
1. Get an OpenAI API key
2. Add it to `.env.local`: `VITE_OPENAI_API_KEY=sk-...`
3. Implement AI features in the codebase

## Production Deployment

To deploy to production:

1. Build the app:
```bash
npm run build
```

2. Deploy the `dist` folder to your hosting provider:
   - Vercel (recommended)
   - Netlify
   - Railway
   - Your own server

3. Set environment variables in your hosting provider's dashboard

4. For tRPC to work in production, you'll need to set up a proper backend API endpoint or use a different architecture (serverless functions, etc.)
