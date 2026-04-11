-- ============================================================
-- NAFA — Storage buckets & policies
-- Run AFTER creating the buckets manually in the dashboard
-- ============================================================

-- ── products bucket (public) ─────────────────────────────────
-- Anyone can view product images
create policy "products_images_public_read"
  on storage.objects for select
  using (bucket_id = 'products');

-- Only vendors can upload to their own folder: products/{vendor_id}/...
create policy "products_images_vendor_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'products'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Vendors can update/delete their own images
create policy "products_images_vendor_update"
  on storage.objects for update
  using (
    bucket_id = 'products'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "products_images_vendor_delete"
  on storage.objects for delete
  using (
    bucket_id = 'products'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ── avatars bucket (public) ──────────────────────────────────
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Users upload to their own folder: avatars/{user_id}/...
create policy "avatars_user_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars_user_update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ── cnib bucket (private) ────────────────────────────────────
-- Only the owner and admins can read CNIB documents
create policy "cnib_owner_read"
  on storage.objects for select
  using (
    bucket_id = 'cnib'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or get_my_role() = 'admin'
    )
  );

create policy "cnib_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'cnib'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
