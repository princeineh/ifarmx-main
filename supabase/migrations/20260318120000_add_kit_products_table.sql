-- Migration: Add kit_products table for kit store
CREATE TABLE IF NOT EXISTS kit_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
-- Optionally, add RLS policies for admin access
-- Enable row level security
ALTER TABLE kit_products ENABLE ROW LEVEL SECURITY;
-- Allow only admins to insert/update/delete
CREATE POLICY "Admins can manage products" ON kit_products
  FOR ALL USING (auth.role() = 'admin');
-- Allow anyone to select products
CREATE POLICY "Anyone can view products" ON kit_products
  FOR SELECT USING (true);