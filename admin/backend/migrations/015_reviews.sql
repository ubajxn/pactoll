CREATE TABLE IF NOT EXISTS site_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page TEXT NOT NULL,
  reviewer TEXT NOT NULL,
  comment TEXT NOT NULL,
  pin_x REAL,
  pin_y REAL,
  element_selector TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES "user"(id)
);

CREATE INDEX IF NOT EXISTS idx_site_reviews_page ON site_reviews(page);
CREATE INDEX IF NOT EXISTS idx_site_reviews_status ON site_reviews(status);
