
-- Create verifications table
CREATE TABLE public.verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  logo_url text,
  instructions text[] NOT NULL DEFAULT '{}',
  appstore_url text,
  playstore_url text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage verifications"
  ON public.verifications
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-logos', 'verification-logos', true);

-- Allow admins to upload logos
CREATE POLICY "Admins can upload verification logos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'verification-logos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update verification logos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'verification-logos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete verification logos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'verification-logos' AND has_role(auth.uid(), 'admin'::app_role));

-- Public read access for logos
CREATE POLICY "Anyone can view verification logos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'verification-logos');
