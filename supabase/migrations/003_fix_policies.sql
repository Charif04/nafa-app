-- ============================================================
-- Fix missing RLS policies
-- ============================================================

-- Allow admin to approve / reject withdrawal requests
create policy "withdrawals_update_admin" on withdrawals
  for update using (get_my_role() = 'admin');

-- Allow admin to update wallet balances (payout flow)
create policy "wallets_update_admin" on wallets
  for update using (get_my_role() = 'admin');
