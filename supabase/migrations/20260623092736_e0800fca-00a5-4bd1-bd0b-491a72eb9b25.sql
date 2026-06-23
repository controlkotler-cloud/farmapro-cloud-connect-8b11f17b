
-- Tabla de uso mensual de imágenes IAFarma
CREATE TABLE public.ai_image_usage (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period text NOT NULL,
  used integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, period)
);

GRANT SELECT ON public.ai_image_usage TO authenticated;
GRANT ALL ON public.ai_image_usage TO service_role;

ALTER TABLE public.ai_image_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own image usage"
  ON public.ai_image_usage FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Tabla opcional para galería
CREATE TABLE public.generated_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  revised_prompt text,
  storage_path text NOT NULL,
  image_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, DELETE ON public.generated_images TO authenticated;
GRANT ALL ON public.generated_images TO service_role;

ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own generated images"
  ON public.generated_images FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete their own generated images"
  ON public.generated_images FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Función atómica: consume 1 crédito si used < p_limit, devuelve restantes
CREATE OR REPLACE FUNCTION public.consume_image_credit(p_limit integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_period text := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM');
  v_used integer;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  INSERT INTO public.ai_image_usage (user_id, period, used)
  VALUES (v_user, v_period, 0)
  ON CONFLICT (user_id, period) DO NOTHING;

  UPDATE public.ai_image_usage
     SET used = used + 1, updated_at = now()
   WHERE user_id = v_user
     AND period = v_period
     AND used < p_limit
  RETURNING used INTO v_used;

  IF v_used IS NULL THEN
    RAISE EXCEPTION 'Monthly image quota exceeded' USING ERRCODE = 'P0001';
  END IF;

  RETURN GREATEST(p_limit - v_used, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_image_credit(integer) TO authenticated;

-- Políticas de Storage para bucket iafarma-images (privado, ruta {user_id}/...)
CREATE POLICY "Users read own iafarma images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'iafarma-images' AND auth.uid()::text = (storage.foldername(name))[1]);
