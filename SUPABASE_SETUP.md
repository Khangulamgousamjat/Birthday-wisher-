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
-- 1. Create the surprises table with all required columns
create table public.surprises (
  id uuid default gen_random_uuid() primary key,
  short_id text not null unique,
  name text not null,
  message text,
  image_path text,
  music_path text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Read Access for everyone
create policy "Allow public read access" on public.surprises for select using (true);

-- 3. Enable Insert Access for everyone
create policy "Allow public insert access" on public.surprises for insert with check (true);

-- 4. Enable Realtime (optional but good to have)
alter table "public"."surprises" replica identity full;
```

*Note: If you already created the table and it's missing columns, run this instead:*
```sql
alter table public.surprises add column if not exists image_path text;
alter table public.surprises add column if not exists music_path text;
```

## 3. Create the Storage Bucket (CRITICAL for Images)

The "Bucket not found" error happens because the storage container for images hasn't been created yet.

1. In the left sidebar, click on **Storage** (the bucket icon).
2. Click **New Bucket**.
3. Name the bucket: `surprises` (it must be exactly this name).
4. **Important**: Toggle the **Public** switch to **ON**. This allows people to see the images you upload.
5. Click **Create bucket**.

### Set Storage Permissions (Policies)
1. Click on the `surprises` bucket you just created.
2. Go to the **Policies** tab (or "Permissions").
3. Click **New Policy** -> **For full customization**.
4. Create a policy for **INSERT** (Uploads):
   - Name: `Allow public uploads`
   - Allowed operations: `INSERT`
   - Target roles: `anon` (public)
   - Policy definition: `true` (or leave empty if allowed)
5. Create another policy for **SELECT** (Viewing):
   - Name: `Allow public viewing`
   - Allowed operations: `SELECT`
   - Target roles: `anon` (public)
   - Policy definition: `true`

*Alternatively, you can run this in the SQL Editor to fix Storage permissions:*
```sql
-- Allow public uploads to 'surprises' bucket
insert into storage.buckets (id, name, public) values ('surprises', 'surprises', true) on conflict (id) do nothing;

create policy "Public Access" on storage.objects for select using ( bucket_id = 'surprises' );
create policy "Public Upload" on storage.objects for insert with check ( bucket_id = 'surprises' );
```

## 4. Get Your API Keys

1. In the left sidebar, click on **Project Settings** (the cog icon at the bottom).
2. Click on **API** in the settings menu.
3. You will need two pieces of information:
   - **Project URL**
   - **Project API Key (anon/public)**

## 5. Provide the Keys

Please provide the keys in your `.env` file:
`VITE_SUPABASE_URL=your_project_url`
`VITE_SUPABASE_ANON_KEY=your_anon_key`

## 6. Troubleshooting

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
   alter table public.surprises disable row level security; -- Simplest fix
   ```

