# Supabase Client Configuration

This directory contains the Supabase client configuration for the Rasan platform.

## Files

- **client.ts**: Browser client for use in Client Components
- **server.ts**: `createClient()` (user-scoped, RLS applies) for Server Components, Server Actions and Route Handlers; `createServiceClient()` (service role, **bypasses RLS**) for server-only writes after the route has checked who the caller is and what they own
- **middleware.ts**: Middleware client for authentication and session management
- **types.ts**: Helper types and utility functions

## Type Generation

The database types in `types/database.types.ts` are manually maintained based on the database schema. 

To auto-generate types from your Supabase project (optional):

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. Generate types:
   ```bash
   supabase gen types typescript --linked > types/database.types.generated.ts
   ```

## Usage

### Client Components

```typescript
import { createClient } from '@/lib/supabase/client';

export default function MyComponent() {
  const supabase = createClient();
  
  // Use the client
  const { data, error } = await supabase
    .from('meals')
    .select('*');
}
```

### Server Components

```typescript
import { createClient } from '@/lib/supabase/server';

export default async function MyServerComponent() {
  const supabase = await createClient();
  
  // Use the client
  const { data, error } = await supabase
    .from('meals')
    .select('*');
}
```

### Middleware

Next.js 16 runs request middleware from the root `proxy.ts`, which calls `updateSession()` here. It handles:
- Session refresh
- Authentication verification
- Role-based page routing (role map in `lib/auth/roles.ts`; role from `app_metadata`, else `profiles`)
- Redirects for signed-in / signed-out users

It does **not** run on `/api` routes. Each route handler authenticates itself with
`lib/auth/guards.ts` (`requireUser`, `requireRole`, `requireAdmin`).

## Environment Variables

Required environment variables (in `.env.local`):

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```
