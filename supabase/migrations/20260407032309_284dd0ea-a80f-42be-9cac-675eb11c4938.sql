-- Remove sensitive tables from Realtime publication to prevent unauthorized data access
ALTER PUBLICATION supabase_realtime DROP TABLE public.financial_transactions;
ALTER PUBLICATION supabase_realtime DROP TABLE public.tracking_events;
ALTER PUBLICATION supabase_realtime DROP TABLE public.orders;