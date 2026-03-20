# How to Set Up Supabase for Magic Link Experience

We are going to migrate the application from local JSON storage to a production-ready Supabase database.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New Project** and choose a default organization.
3. Name your project (e.g., "Magic Link Experience").
4. Choose a database password and click **Create new project**.
5. Wait a few minutes for the database to finish setting up.

## 2. Create the Database Table

1. In your Supabase project dashboard, click on the **SQL Editor** icon in the left sidebar (looks like a terminal).
2. Click **+ New query**.
3. Paste the following SQL code and run it:

```sql
create table public.surprises (
  id uuid default gen_random_uuid() primary key,
  short_id text not null unique,
  name text not null,
  message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Read Access for everyone
create policy "Allow public read access" on public.surprises for select using (true);

-- Enable Insert Access for everyone
create policy "Allow public insert access" on public.surprises for insert with check (true);

-- Enable Realtime (optional but good to have)
alter table "public"."surprises" replica identity full;
```

## 3. Get Your API Keys

1. In the left sidebar, click on **Project Settings** (the cog icon at the bottom).
2. Click on **API** in the settings menu.
3. You will need two pieces of information:
   - **Project URL**
   - **Project API Key (anon/public)**

## 4. Provide the Keys

Please provide the keys in your `.env` file:
`VITE_SUPABASE_URL=`
`VITE_SUPABASE_ANON_KEY=`
## 5. Troubleshooting

If you see an error: `new row violates row-level security policy for table "surprises"`, it means your database permissions are not set correctly.

**To fix this:**
1. Go to the **SQL Editor** in Supabase.
2. Run this command to reset the permissions:
   ```sql
   -- Drop existing policies if they exist
   drop policy if exists "Allow public read access" on public.surprises;
   drop policy if exists "Allow public insert access" on public.surprises;

   -- Re-create policies correctly
   create policy "Allow public read access" on public.surprises for select using (true);
   create policy "Allow public insert access" on public.surprises for insert with check (true);
   ```
