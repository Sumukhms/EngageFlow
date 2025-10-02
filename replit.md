# Event & Webinar Engagement Booster

## Overview

This is a full-stack event management and email marketing platform built with React, Express, and TypeScript. The application helps event organizers boost engagement before and after webinars by tracking registrations, user interests, and engagement patterns. It sends personalized reminders, content previews, and post-event follow-ups via email. The platform features AI-powered email personalization using OpenAI's GPT-5 model and automated scheduling for campaigns and reminders.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Tooling**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and dev server with HMR support
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and caching

**UI System**
- Shadcn/ui component library with Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- New York style variant with CSS variables for theming
- Responsive design with mobile-first breakpoints

**State Management Strategy**
- Server state managed via React Query with intelligent caching
- Form state handled by React Hook Form with Zod validation
- Local UI state using React hooks (useState, useEffect)
- No global state management library needed due to React Query

**Design Patterns**
- Component composition with reusable UI primitives
- Form validation using Zod schemas shared between client and server
- Optimistic updates for better UX during mutations
- Skeleton loading states for async operations

### Backend Architecture

**Server Framework**
- Express.js with TypeScript for RESTful API endpoints
- Custom middleware for request logging and JSON parsing
- Vite integration for SSR and development hot reloading

**Database Layer**
- PostgreSQL as the primary database
- Drizzle ORM for type-safe database queries and migrations
- Neon serverless Postgres for cloud deployment
- Schema-first design with TypeScript type inference

**Data Models**
The schema includes six main entities:
- Events: Core event information with status, dates, and capacity management
- Attendees: User profiles with engagement scoring and preferences
- Event Registrations: Many-to-many relationship tracking with attendance data
- Email Campaigns: Campaign management with scheduling and targeting
- Email Templates: Reusable templates with variable substitution
- Analytics Events: Event tracking for user behavior analysis

**API Design**
- RESTful endpoints following resource-based URL patterns
- Consistent error handling with appropriate HTTP status codes
- Request validation using Zod schemas from shared types
- Response formatting with JSON payloads

### External Dependencies

**Email Service Providers**
- Resend as primary email provider with fallback support (requires RESEND_API_KEY env var)
- SendGrid as alternative provider (configurable via environment, requires SENDGRID_API_KEY)
- Template-based email rendering with variable interpolation
- Bulk sending capabilities for campaigns
- Note: User has not set up Replit's Resend integration connector. Email features require manual API key configuration via secrets.

**AI Integration**
- OpenAI GPT-5 for email content personalization (requires OPENAI_API_KEY env var)
- Context-aware generation based on attendee engagement history
- JSON-structured responses for consistent parsing
- Personalization considers attendee interests, company, and event details
- Note: GPT-5 was released August 7, 2025. It does not support temperature parameter and uses max_completion_tokens instead of max_tokens.

**Database Service**
- Currently using MemStorage (in-memory) for data persistence in development
- DbStorage implementation available for Neon cloud database (requires DATABASE_URL with 'neon.tech' domain)
- Connection pooling via @neondatabase/serverless for Neon databases
- Automatic fallback: Uses DbStorage when DATABASE_URL contains 'neon.tech', otherwise uses MemStorage
- Note: Local PostgreSQL databases are not supported due to Neon HTTP driver incompatibility

**Scheduled Tasks**
- Node-cron for time-based job scheduling
- Automated campaign sending at scheduled times
- Daily engagement score updates
- Hourly event reminder checks
- Weekly analytics data cleanup

**Session Management**
- Connect-pg-simple for PostgreSQL-backed sessions
- Express session middleware integration
- Secure cookie-based authentication

**Development Tools**
- Replit-specific plugins for development banner and error overlays
- Source map support for debugging via @jridgewell/trace-mapping
- TypeScript compilation with strict mode enabled
- ESBuild for production bundling

### Key Architectural Decisions

**Monorepo Structure**
The codebase uses a shared types approach with three main directories:
- `client/`: React frontend application
- `server/`: Express backend API
- `shared/`: Common TypeScript types and Zod schemas

This enables type safety across the full stack and reduces duplication.

**Type Safety**
- Drizzle-zod generates Zod schemas from database schema
- Shared schemas validate data on both client and server
- TypeScript strict mode catches type errors at compile time

**Email Personalization Strategy**
AI personalization is optional per campaign and generates:
- Customized subject lines based on attendee profile
- Personalized email content considering engagement history
- Optimal send time recommendations
- Content recommendations for follow-up

**Error Handling**
- Centralized error responses in API routes
- Toast notifications for user-facing errors
- Detailed logging for server-side debugging
- Graceful degradation when external services fail

**Performance Optimizations**
- React Query caching reduces redundant API calls
- Lazy loading for route-based code splitting
- Optimistic updates for instant UI feedback
- Database indexes on frequently queried fields (implied by schema design)

## Environment Variables

The following environment variables are required for full functionality:

### Required
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment mode (development/production)

### Optional (for enhanced features)
- `DATABASE_URL`: Neon PostgreSQL connection string (must contain 'neon.tech' domain). Falls back to MemStorage if not provided or incompatible.
- `OPENAI_API_KEY`: OpenAI API key for AI-powered email personalization using GPT-5
- `RESEND_API_KEY` or `RESEND_API_KEY_ENV_VAR`: Resend email service API key for sending campaigns
- `SENDGRID_API_KEY` or `SENDGRID_API_KEY_ENV_VAR`: SendGrid email service API key (fallback option)

## Running the Application

### Development
```bash
npm run dev
```
Starts the development server on port 5000 with hot reloading.

### Production Build
```bash
npm run build
npm run start
```

### Database Schema
```bash
npm run db:push
```
Pushes the Drizzle schema to the database (requires Neon PostgreSQL DATABASE_URL).

## Deployment

The application is configured for **autoscale deployment** on Replit (see `.replit` file):
- Deployment target: `autoscale`
- Build command: `npm run build`
- Run command: `npm run start`
- Port configuration: Local port 5000 mapped to external port 80
- Serves on port 5000 (required for Replit environment)

## Current Status

- ✅ Frontend running with React + Vite + TypeScript
- ✅ Backend API with Express and in-memory storage (MemStorage)
- ✅ AI personalization ready (requires OPENAI_API_KEY)
- ⚠️ Email sending requires API keys (RESEND_API_KEY or SENDGRID_API_KEY)
- ⚠️ Database persistence requires Neon cloud database (DATABASE_URL with 'neon.tech')