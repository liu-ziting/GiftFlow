-- Add group support via invite codes
CREATE TABLE IF NOT EXISTS invite_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  group_name TEXT NOT NULL,
  status TEXT DEFAULT 'joining', -- 'joining', 'drawn'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Update users table to include invite_code_id
ALTER TABLE users ADD COLUMN invite_code_id INTEGER REFERENCES invite_codes(id);

-- Update draw_results to include invite_code_id for better scoping
ALTER TABLE draw_results ADD COLUMN invite_code_id INTEGER REFERENCES invite_codes(id);

-- Migration for existing users (optional, if any)
-- For existing users, we could create a default group 'default'
INSERT INTO invite_codes (code, group_name, status) VALUES ('GIFT2026', '默认群组', 'joining');
UPDATE users SET invite_code_id = (SELECT id FROM invite_codes WHERE code = 'GIFT2026') WHERE invite_code_id IS NULL;
UPDATE draw_results SET invite_code_id = (SELECT id FROM invite_codes WHERE code = 'GIFT2026') WHERE invite_code_id IS NULL;
