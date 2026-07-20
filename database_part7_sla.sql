-- ==========================================
-- MIGRATION PART 7: SLA CONFIGURATION
-- ==========================================

CREATE TABLE IF NOT EXISTS sla_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    priority_level VARCHAR(20) UNIQUE NOT NULL,
    response_time_minutes INT DEFAULT 60,
    resolution_time_minutes INT DEFAULT 1440,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default configurations if empty
INSERT INTO sla_configs (priority_level, response_time_minutes, resolution_time_minutes)
VALUES
    ('Kritis', 30, 240),      -- 30 min response, 4 hours resolution
    ('Tinggi', 60, 480),      -- 1 hour response, 8 hours resolution
    ('Sedang', 120, 1440),    -- 2 hours response, 24 hours resolution
    ('Rendah', 240, 2880)     -- 4 hours response, 48 hours resolution
ON CONFLICT (priority_level) DO NOTHING;
