CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'coop_ledger', 'public'
AS $$
BEGIN
   INSERT INTO coop_ledger.coop_profiles (
    id,
    full_name
)
VALUES (
    NEW.id,
    COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1)
    )
);

    RETURN NEW;
END;
$$;