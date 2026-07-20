-- ==========================================
-- MIGRATION PART 2A: FAQ & FEEDBACK
-- ==========================================

-- 1. Create faq_categories table
CREATE TABLE IF NOT EXISTS faq_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES faq_categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create faqs table
CREATE TABLE IF NOT EXISTS faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES faq_categories(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    keywords TEXT,
    url VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk mempercepat full-text search / ilike
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_faqs_title ON faqs USING gin (title gin_trgm_ops);


-- 3. Create ticket_feedback table
CREATE TABLE IF NOT EXISTS ticket_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index
CREATE INDEX IF NOT EXISTS idx_ticket_feedback_ticket_id ON ticket_feedback(ticket_id);
