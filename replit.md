# Event Management Platform

## Overview

This is a full-stack event management and email marketing platform built with React, Express, and PostgreSQL. The application enables users to create and manage events, track attendees, send personalized email campaigns, and analyze engagement metrics. It features AI-powered email personalization using OpenAI's GPT-5 model and automated scheduling for campaigns and reminders.

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
- Resend as primary email provider with fallback support
- SendGrid as alternative provider (configurable via environment)
- Template-based email rendering with variable interpolation
- Bulk sending capabilities for campaigns

**AI Integration**
- OpenAI GPT-5 for email content personalization
- Context-aware generation based on attendee engagement history
- JSON-structured responses for consistent parsing
- Personalization considers attendee interests, company, and event details

**Database Service**
- Neon Serverless Postgres for cloud-hosted database
- Connection pooling via @neondatabase/serverless
- Environment-based configuration with DATABASE_URL

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