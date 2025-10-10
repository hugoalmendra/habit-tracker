-- Add image_url column to posts table
alter table posts add column image_url text;

-- Create storage bucket for post images if it doesn't exist
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

-- Set up storage policies for post images
create policy "Anyone can view post images"
on storage.objects for select
using (bucket_id = 'post-images');

create policy "Authenticated users can upload post images"
on storage.objects for insert
with check (
  bucket_id = 'post-images'
  and auth.role() = 'authenticated'
);

create policy "Users can update their own post images"
on storage.objects for update
using (
  bucket_id = 'post-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete their own post images"
on storage.objects for delete
using (
  bucket_id = 'post-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);
