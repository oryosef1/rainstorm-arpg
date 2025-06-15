#!/usr/bin/env node

import { Client, ClientConfig } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

interface DatabaseConfig extends ClientConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

const config: DatabaseConfig = {
  host: 'localhost',
  port: 5432,
  database: 'rainstorm_arpg',
  user: 'rainstorm_user',
  password: 'rainstorm_password_2024'
};

async function initializeDatabase(): Promise<void> {
  const client = new Client(config);
  
  try {
    console.log('🐘 Connecting to PostgreSQL database...');
    await client.connect();
    
    console.log('📄 Reading database schema...');
    const schemaPath = path.join(__dirname, 'database-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('🗄️ Creating database schema...');
    await client.query(schema);
    
    console.log('✅ Database initialized successfully!');
    
    console.log('🧪 Testing database connection...');
    const result = await client.query('SELECT COUNT(*) as class_count FROM character_classes');
    console.log(`📊 Character classes available: ${result.rows[0].class_count}`);
    
    console.log('👤 Creating test data...');
    
    const playerResult = await client.query(`
      INSERT INTO players (username, email, password_hash)
      VALUES ('test_player', 'test@rainstorm.com', 'hashed_password')
      ON CONFLICT (username) DO NOTHING
      RETURNING id
    `);
    
    if (playerResult.rows.length > 0) {
      const playerId = playerResult.rows[0].id;
      
      await client.query(`
        INSERT INTO characters (player_id, character_class_id, name, level, experience)
        VALUES ($1, 1, 'Test Marauder', 5, 500)
        ON CONFLICT DO NOTHING
      `, [playerId]);
      
      console.log('✅ Test character created!');
    }
    
    console.log('\n🎮 Database ready for RainStorm ARPG!');
    console.log('Connection string: postgresql://rainstorm_user:rainstorm_password_2024@localhost:5432/rainstorm_arpg');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  initializeDatabase().catch(console.error);
}

export { initializeDatabase };