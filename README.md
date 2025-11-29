# NichePerQ - CRM Lead Management Platform

## Overview

NichePerQ is a CRM and lead management platform built with React, TypeScript, and Supabase. It includes AI-powered features for lead analysis, email drafting, workflow automation, and more.

## Technologies

This project is built with:

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn-ui
- **Backend**: Supabase (PostgreSQL, Edge Functions, Auth)
- **AI**: OpenAI API (GPT-4o-mini)

## Getting Started

### Prerequisites

- Node.js & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- Supabase CLI (for local development)

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Environment Variables

#### Frontend (.env)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

#### Supabase Edge Functions

The following secrets need to be set in your Supabase project:

```
OPENAI_API_KEY        - Your OpenAI API key for AI features
RESEND_API_KEY        - Resend API key for email sending
APP_URL               - Your application URL (e.g., https://app.nicheperq.com)
```

Set these in the Supabase dashboard under Project Settings > Edge Functions > Secrets, or using the CLI:

```sh
supabase secrets set OPENAI_API_KEY=your-openai-api-key
supabase secrets set RESEND_API_KEY=your-resend-api-key
supabase secrets set APP_URL=https://your-app-url.com
```

## AI Features

This project uses OpenAI's GPT-4o-mini model for:

- **Lead Analysis**: Scoring leads based on quality, intent, and closing probability
- **Email Drafting**: Generating personalized outreach emails
- **CRM Assistant**: Natural language queries about your CRM data
- **Workflow Generation**: Creating automated follow-up workflows
- **Pipeline Analytics**: AI-powered recommendations for improving sales

## Deployment

### Frontend

Build the frontend for production:

```sh
npm run build
```

Deploy the `dist` folder to your preferred hosting provider (Vercel, Netlify, etc.).

### Supabase Functions

Deploy edge functions using the Supabase CLI:

```sh
supabase functions deploy
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Project Structure

```
├── src/
│   ├── components/     # React components
│   ├── contexts/       # React contexts
│   ├── hooks/          # Custom hooks
│   ├── integrations/   # Supabase client
│   ├── lib/            # Utility functions
│   └── pages/          # Page components
├── supabase/
│   ├── functions/      # Edge functions
│   └── migrations/     # Database migrations
└── public/             # Static assets
```

## License

Private - All rights reserved
