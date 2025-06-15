/**
 * Mock Database Server for MCP Testing
 * Simulates PostgreSQL functionality without requiring actual installation
 */

import * as http from 'http';
import * as url from 'url';

interface Player {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

interface Character {
  id: string;
  player_id: string;
  character_class_id: number;
  name: string;
  level: number;
  experience: number;
  attributes: {
    strength: number;
    dexterity: number;
    intelligence: number;
  };
}

interface CharacterClass {
  id: number;
  name: string;
  primary_attribute: string;
}

interface MockDatabaseData {
  players: Player[];
  characters: Character[];
  items: any[];
  crafting_history: any[];
  leaderboards: any[];
  character_classes: CharacterClass[];
}

export class MockDatabase {
  public data: MockDatabaseData;

  constructor() {
    this.data = {
      players: [],
      characters: [],
      items: [],
      crafting_history: [],
      leaderboards: [],
      character_classes: []
    };
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData(): void {
    // Sample character classes
    this.data.character_classes = [
      { id: 1, name: 'Marauder', primary_attribute: 'strength' },
      { id: 2, name: 'Ranger', primary_attribute: 'dexterity' },
      { id: 3, name: 'Witch', primary_attribute: 'intelligence' },
      { id: 4, name: 'Duelist', primary_attribute: 'strength' },
      { id: 5, name: 'Templar', primary_attribute: 'strength' },
      { id: 6, name: 'Shadow', primary_attribute: 'dexterity' },
      { id: 7, name: 'Scion', primary_attribute: 'strength' }
    ];

    // Sample player
    this.data.players.push({
      id: 'player-1',
      username: 'test_player',
      email: 'test@rainstorm.com',
      created_at: new Date().toISOString()
    });

    // Sample character
    this.data.characters.push({
      id: 'char-1',
      player_id: 'player-1',
      character_class_id: 1,
      name: 'Test Marauder',
      level: 5,
      experience: 500,
      attributes: { strength: 23, dexterity: 14, intelligence: 14 }
    });

    console.log('📊 Mock database initialized with sample data');
  }

  query(sql: string, params: any[] = []): { rows: any[] } {
    console.log(`🔍 Mock SQL Query: ${sql}`);
    
    // Simulate different query responses
    if (sql.includes('SELECT NOW()')) {
      return { rows: [{ now: new Date().toISOString() }] };
    }
    
    if (sql.includes('COUNT(*) as class_count FROM character_classes')) {
      return { rows: [{ class_count: this.data.character_classes.length }] };
    }
    
    if (sql.includes('SELECT') && sql.includes('characters')) {
      return { rows: this.data.characters };
    }
    
    if (sql.includes('SELECT') && sql.includes('players')) {
      return { rows: this.data.players };
    }
    
    if (sql.includes('INSERT') || sql.includes('UPDATE')) {
      return { rows: [{ id: 'mock-id-' + Date.now() }] };
    }
    
    return { rows: [] };
  }

  async connect(): Promise<MockDatabase> {
    console.log('🐘 Mock PostgreSQL connected');
    return this;
  }

  async end(): Promise<void> {
    console.log('🐘 Mock PostgreSQL disconnected');
  }
}

// Create HTTP server to simulate database operations
const mockDb = new MockDatabase();

const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
  const parsedUrl = url.parse(req.url || '', true);
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'GET' && parsedUrl.pathname === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'Mock database is running'
    }));
    return;
  }
  
  if (req.method === 'GET' && parsedUrl.pathname === '/characters') {
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      data: mockDb.data.characters
    }));
    return;
  }
  
  if (req.method === 'GET' && parsedUrl.pathname === '/players') {
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      data: mockDb.data.players
    }));
    return;
  }
  
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = 5432; // Use PostgreSQL default port
server.listen(PORT, () => {
  console.log('🚀 Mock Database Server started');
  console.log(`📍 Listening on port ${PORT}`);
  console.log('🔗 Connection string: postgresql://rainstorm_user:rainstorm_password_2024@localhost:5432/rainstorm_arpg');
  console.log('✅ MCP PostgreSQL server can now connect to this mock database');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down mock database server...');
  server.close(() => {
    console.log('✅ Mock database server stopped');
    process.exit(0);
  });
});

export { MockDatabase };