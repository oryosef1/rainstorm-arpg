-- RainStorm ARPG Database Schema
-- Complete database structure for ARPG persistence

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Players table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Character classes lookup
CREATE TABLE character_classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    primary_attribute VARCHAR(20),
    secondary_attribute VARCHAR(20),
    starting_stats JSONB,
    skill_tree_start_position JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Characters table
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    character_class_id INTEGER NOT NULL REFERENCES character_classes(id),
    name VARCHAR(50) NOT NULL,
    level INTEGER DEFAULT 1,
    experience BIGINT DEFAULT 0,
    attributes JSONB DEFAULT '{}',
    position JSONB DEFAULT '{"x": 0, "y": 0, "map": "town"}',
    health JSONB DEFAULT '{"current": 100, "max": 100}',
    mana JSONB DEFAULT '{"current": 50, "max": 50}',
    skill_points INTEGER DEFAULT 0,
    allocated_passives JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Items table
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    base_type VARCHAR(100) NOT NULL,
    rarity VARCHAR(20) DEFAULT 'normal',
    item_level INTEGER DEFAULT 1,
    affixes JSONB DEFAULT '[]',
    sockets JSONB DEFAULT '[]',
    corrupted BOOLEAN DEFAULT false,
    quality INTEGER DEFAULT 0,
    position JSONB, -- inventory position or equipped slot
    stack_size INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Skill gems table
CREATE TABLE skill_gems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    gem_name VARCHAR(100) NOT NULL,
    gem_type VARCHAR(20), -- 'active' or 'support'
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    quality INTEGER DEFAULT 0,
    socket_group INTEGER,
    socket_position INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Currency items table
CREATE TABLE currency_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    currency_type VARCHAR(50) NOT NULL,
    stack_size INTEGER DEFAULT 1,
    position JSONB, -- inventory position
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stash tabs table
CREATE TABLE stash_tabs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    tab_name VARCHAR(50) DEFAULT 'Stash',
    tab_type VARCHAR(20) DEFAULT 'normal', -- normal, premium, currency, etc.
    tab_index INTEGER NOT NULL,
    items JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Player statistics
CREATE TABLE player_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    stat_type VARCHAR(50) NOT NULL,
    stat_value BIGINT DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Game sessions for analytics
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP,
    actions_performed JSONB DEFAULT '[]',
    performance_metrics JSONB DEFAULT '{}'
);

-- Crafting history
CREATE TABLE crafting_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id) ON DELETE SET NULL,
    craft_type VARCHAR(50) NOT NULL,
    currency_used JSONB,
    outcome VARCHAR(20), -- success, failure, brick, etc.
    before_item JSONB,
    after_item JSONB,
    crafted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leaderboards
CREATE TABLE leaderboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL, -- level, dps, wealth, etc.
    value BIGINT NOT NULL,
    rank INTEGER,
    season VARCHAR(20),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default character classes
INSERT INTO character_classes (name, description, primary_attribute, secondary_attribute, starting_stats, skill_tree_start_position) VALUES
('Marauder', 'A mighty warrior focused on melee combat', 'strength', null, '{"strength": 23, "dexterity": 14, "intelligence": 14}', '{"x": 0, "y": -300}'),
('Ranger', 'A skilled archer with high dexterity', 'dexterity', null, '{"strength": 14, "dexterity": 23, "intelligence": 14}', '{"x": 300, "y": 150}'),
('Witch', 'A powerful spellcaster focused on intelligence', 'intelligence', null, '{"strength": 14, "dexterity": 14, "intelligence": 23}', '{"x": -300, "y": 150}'),
('Duelist', 'A versatile fighter combining strength and dexterity', 'strength', 'dexterity', '{"strength": 20, "dexterity": 20, "intelligence": 11}', '{"x": 150, "y": -150}'),
('Templar', 'A holy warrior balancing strength and intelligence', 'strength', 'intelligence', '{"strength": 20, "dexterity": 11, "intelligence": 20}', '{"x": -150, "y": -150}'),
('Shadow', 'An assassin combining dexterity and intelligence', 'dexterity', 'intelligence', '{"strength": 11, "dexterity": 20, "intelligence": 20}', '{"x": 150, "y": 150}'),
('Scion', 'A noble exile with balanced attributes', 'strength', 'dexterity', '{"strength": 17, "dexterity": 17, "intelligence": 17}', '{"x": 0, "y": 0}');

-- Create indexes for performance
CREATE INDEX idx_characters_player_id ON characters(player_id);
CREATE INDEX idx_items_character_id ON items(character_id);
CREATE INDEX idx_skill_gems_character_id ON skill_gems(character_id);
CREATE INDEX idx_currency_items_character_id ON currency_items(character_id);
CREATE INDEX idx_player_stats_player_id ON player_stats(player_id);
CREATE INDEX idx_game_sessions_player_id ON game_sessions(player_id);
CREATE INDEX idx_crafting_history_character_id ON crafting_history(character_id);
CREATE INDEX idx_leaderboards_category_rank ON leaderboards(category, rank);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to characters table
CREATE TRIGGER update_characters_updated_at 
    BEFORE UPDATE ON characters 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Sample views for common queries
CREATE VIEW character_overview AS
SELECT 
    c.id,
    c.name,
    cc.name as class_name,
    c.level,
    c.experience,
    c.attributes,
    p.username as player_name,
    c.created_at
FROM characters c
JOIN character_classes cc ON c.character_class_id = cc.id
JOIN players p ON c.player_id = p.id
WHERE c.level > 0;

CREATE VIEW top_players_by_level AS
SELECT 
    p.username,
    c.name as character_name,
    cc.name as class_name,
    c.level,
    c.experience,
    ROW_NUMBER() OVER (ORDER BY c.level DESC, c.experience DESC) as rank
FROM characters c
JOIN character_classes cc ON c.character_class_id = cc.id
JOIN players p ON c.player_id = p.id
ORDER BY c.level DESC, c.experience DESC
LIMIT 100;