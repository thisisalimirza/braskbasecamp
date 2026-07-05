INSERT OR IGNORE INTO categories (id, entry_type, label, is_default) VALUES
  ('cat-rev-product-sale', 'revenue', 'product_sale', 1),
  ('cat-rev-subscription', 'revenue', 'subscription_revenue', 1),
  ('cat-rev-client', 'revenue', 'client_revenue', 1),
  ('cat-rev-service', 'revenue', 'service_fee', 1),
  ('cat-rev-other', 'revenue', 'other_revenue', 1),
  ('cat-cost-hosting', 'cost', 'hosting', 1),
  ('cat-cost-software', 'cost', 'software', 1),
  ('cat-cost-contractor', 'cost', 'contractor_payment', 1),
  ('cat-cost-marketing', 'cost', 'marketing', 1),
  ('cat-cost-legal', 'cost', 'legal_accounting', 1),
  ('cat-cost-other', 'cost', 'other_cost', 1);
