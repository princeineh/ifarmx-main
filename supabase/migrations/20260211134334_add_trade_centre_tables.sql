/*
  # Add Trade Centre Tables

  1. New Tables
    - `product_listings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users) - the seller
      - `title` (text) - product name
      - `description` (text) - product description
      - `category` (text) - palm_oil, palm_kernel, seedlings, etc.
      - `price` (numeric) - price in Naira
      - `unit` (text) - litres, kg, pieces, etc.
      - `quantity_available` (integer) - stock
      - `location` (text) - seller location in Nigeria
      - `status` (text) - active, sold, paused
      - `image_url` (text) - product image
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `kit_orders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users) - the buyer
      - `order_number` (text, unique) - human-readable order number
      - `kit_type` (text) - starter, premium, etc.
      - `quantity` (integer) - number of kits
      - `unit_price` (numeric) - price per kit in Naira
      - `total_price` (numeric) - total cost in Naira
      - `payment_status` (text) - pending, paid, failed, refunded
      - `payment_reference` (text) - payment gateway reference
      - `delivery_status` (text) - processing, shipped, in_transit, delivered
      - `delivery_address` (text) - delivery address
      - `delivery_state` (text) - Nigerian state
      - `delivery_phone` (text) - contact phone
      - `kit_codes_assigned` (text[]) - assigned kit codes after delivery
      - `notes` (text) - order notes
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `order_status_updates`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key to kit_orders)
      - `status` (text) - the status at this point
      - `message` (text) - description of the update
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Sellers can manage their own listings
    - Buyers can view active listings
    - Users can view and create their own orders
    - Users can view status updates for their orders
*/

CREATE TABLE IF NOT EXISTS product_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '' NOT NULL,
  category text NOT NULL DEFAULT 'palm_oil',
  price numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'litres',
  quantity_available integer NOT NULL DEFAULT 0,
  location text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  image_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE product_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active listings"
  ON product_listings
  FOR SELECT
  TO authenticated
  USING (status = 'active' OR auth.uid() = user_id);

CREATE POLICY "Users can create own listings"
  ON product_listings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own listings"
  ON product_listings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own listings"
  ON product_listings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_product_listings_user_id ON product_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_product_listings_category ON product_listings(category);
CREATE INDEX IF NOT EXISTS idx_product_listings_status ON product_listings(status);

CREATE TABLE IF NOT EXISTS kit_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_number text UNIQUE NOT NULL,
  kit_type text NOT NULL DEFAULT 'starter',
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  total_price numeric NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'pending',
  payment_reference text,
  delivery_status text NOT NULL DEFAULT 'processing',
  delivery_address text NOT NULL DEFAULT '',
  delivery_state text NOT NULL DEFAULT '',
  delivery_phone text NOT NULL DEFAULT '',
  kit_codes_assigned text[] DEFAULT '{}',
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE kit_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON kit_orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders"
  ON kit_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders"
  ON kit_orders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_kit_orders_user_id ON kit_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_kit_orders_order_number ON kit_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_kit_orders_payment_status ON kit_orders(payment_status);

CREATE TABLE IF NOT EXISTS order_status_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES kit_orders(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL,
  message text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE order_status_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order status updates"
  ON order_status_updates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM kit_orders
      WHERE kit_orders.id = order_status_updates.order_id
      AND kit_orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert status updates for own orders"
  ON order_status_updates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM kit_orders
      WHERE kit_orders.id = order_status_updates.order_id
      AND kit_orders.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_order_status_updates_order_id ON order_status_updates(order_id);
