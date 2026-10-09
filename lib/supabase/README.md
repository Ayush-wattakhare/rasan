# Supabase Client Configuration

This directory contains the Supabase client configuration for the Rasan platform.

## Files

- **client.ts**: Browser client for use in Client Components
- **server.ts**: Server client for use in Server Components, Server Actions, and Route Handlers
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

The middleware is configured in the root `middleware.ts` file and handles:
- Session refresh
- Authentication verification
- Role-based route protection
- Automatic redirects for authenticated/unauthenticated users

## Environment Variables

Required environment variables (see `.env.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```
