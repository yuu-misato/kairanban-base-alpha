-- Ensure kairanbans has points column
ALTER TABLE kairanbans ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 5;

-- Ensure action_point_settings has read_kairanban entry
INSERT INTO action_point_settings (action_key, action_name, description, points_amount, is_active, display_order)
VALUES ('read_kairanban', '回覧板確認', 'デジタル回覧板を確認した際に付与されるポイント', 5, true, 20)
ON CONFLICT (action_key) DO NOTHING;
