# Discord Clone

A real-time chat application built with Next.js, Convex, and Clerk authentication.

## Technologies Used

- **Frontend**: Next.js 15.0.1
- **Backend/Database**: Convex
- **Authentication**: Clerk
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI

## Features

- Real-time messaging
- User authentication
- User profile management
- Webhook integration for user events
- Direct Messages and Photo upload

## Prerequisites

- Node.js (Latest LTS version recommended)
- npm or yarn
- A Clerk account for authentication
- A Convex account for backend services

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
CONVEX_DEPLOYMENT=your_convex_deployment
NEXT_PUBLIC_CONVEX_URL=your_convex_url
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

## Installation

1. Clone the repository:

```bash
git clone [repository-url]
```

2. Install dependencies:

```bash
pnpm install
```

3. Start the development server:

```bash
pnpm dev
```

This will start both the Next.js frontend and Convex backend concurrently.

## Project Structure

- `/src/app` - Next.js application routes and pages
- `/src/components` - Reusable React components
- `/convex` - Backend functions and schema
  - `/functions` - API endpoints
  - `schema.ts` - Database schema
  - `auth.config.ts` - Authentication configuration

## Development

The project uses npm-run-all to concurrently run multiple development servers:

- `pnpm dev`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
