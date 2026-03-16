/*
  # Update Kit Items to Match Actual Kit Contents

  1. Changes
    - Updates existing kit_items to reflect the actual contents of the Oil Palm Launch Kit
    - Removes old placeholder items (Germination Bag, Organic Fertilizer, Planting Instructions, Watering Guide, Growth Chart, Measurement Tape, Care Calendar)
    - Adds correct items: 3 Tenera Sprouted Seeds (NIFOR EWS), Organic Manure, Refined Sand, 3 Grower Bags, Disposable Gloves, NIFOR Reference Book, Quick Start Pamphlet, iFarmX Manual, Water Sprayer

  2. Security
    - No security changes
*/

-- Remove all old kit items
DELETE FROM kit_item_checks WHERE kit_item_id IN (SELECT id FROM kit_items);
DELETE FROM kit_items;

-- Insert the correct kit items matching actual kit contents
INSERT INTO kit_items (name, description, is_required, display_order) VALUES
  ('3 Tenera Sprouted Seeds (NIFOR EWS)', 'Premium high-yield certified hybrid palm seeds', true, 1),
  ('Organic Manure', 'Nutrient boost for strong root development', true, 2),
  ('Refined Sand', 'Optimal drainage for healthy germination', true, 3),
  ('3 Grower Bags', 'Individual bags for each seedling', true, 4),
  ('Disposable Gloves', 'Safe and hygienic handling during planting', false, 5),
  ('NIFOR Reference Book', 'Official oil palm cultivation guide from NIFOR', true, 6),
  ('Quick Start Pamphlet', 'First-day planting instructions', true, 7),
  ('iFarmX Manual', 'Step-by-step guide and app setup instructions', true, 8),
  ('Water Sprayer', 'For precise and consistent watering', false, 9);
