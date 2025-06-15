#!/usr/bin/env node

/**
 * Database Integration Test
 * Tests the mock database server and database manager integration
 */

import * as http from 'http';

interface TestResults {
  mockServerHealth: boolean;
  mockServerData: boolean;
  databaseManagerSetup: boolean;
  totalTests: number;
  passedTests: number;
}

interface HealthResponse {
  status: string;
  message: string;
}

interface DataResponse {
  success: boolean;
  data: Array<{
    name: string;
    level: number;
  }>;
}

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
}

interface DatabaseManager {
  config: DatabaseConfig;
  close(): Promise<void>;
}

export class DatabaseIntegrationTest {
  private results: TestResults;

  constructor() {
    this.results = {
      mockServerHealth: false,
      mockServerData: false,
      databaseManagerSetup: false,
      totalTests: 3,
      passedTests: 0
    };
  }

  async testMockServerHealth(): Promise<void> {
    console.log('🧪 Testing mock database server health...');
    
    return new Promise((resolve) => {
      const req = http.get('http://localhost:5432/health', (res: http.IncomingMessage) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const health: HealthResponse = JSON.parse(data);
            if (health.status === 'healthy') {
              console.log('✅ Mock database server is healthy');
              console.log(`   Status: ${health.status}`);
              console.log(`   Message: ${health.message}`);
              this.results.mockServerHealth = true;
              this.results.passedTests++;
            } else {
              console.log('❌ Mock database server health check failed');
            }
          } catch (err: any) {
            console.log('❌ Failed to parse health response:', err.message);
          }
          resolve();
        });
      });
      
      req.on('error', (err: Error) => {
        console.log('❌ Mock database server connection failed:', err.message);
        resolve();
      });
      
      req.setTimeout(5000, () => {
        console.log('❌ Mock database server timeout');
        req.destroy();
        resolve();
      });
    });
  }

  async testMockServerData(): Promise<void> {
    console.log('🧪 Testing mock database data endpoints...');
    
    return new Promise((resolve) => {
      const req = http.get('http://localhost:5432/characters', (res: http.IncomingMessage) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const response: DataResponse = JSON.parse(data);
            if (response.success && response.data && response.data.length > 0) {
              console.log('✅ Mock database data endpoints working');
              console.log(`   Characters found: ${response.data.length}`);
              console.log(`   Sample character: ${response.data[0].name} (Level ${response.data[0].level})`);
              this.results.mockServerData = true;
              this.results.passedTests++;
            } else {
              console.log('❌ Mock database data endpoints failed');
            }
          } catch (err: any) {
            console.log('❌ Failed to parse data response:', err.message);
          }
          resolve();
        });
      });
      
      req.on('error', (err: Error) => {
        console.log('❌ Mock database data request failed:', err.message);
        resolve();
      });
      
      req.setTimeout(5000, () => {
        console.log('❌ Mock database data request timeout');
        req.destroy();
        resolve();
      });
    });
  }

  async testDatabaseManagerSetup(): Promise<void> {
    console.log('🧪 Testing database manager setup...');
    
    try {
      // Dynamic import since we're converting from CommonJS to ES modules
      const { DatabaseManager } = await import('./game-core/database/database-manager.js');
      const db: DatabaseManager = new DatabaseManager();
      
      // Test that the database manager is properly configured
      if (db.config && db.config.host === 'localhost' && db.config.port === 5432) {
        console.log('✅ Database manager properly configured');
        console.log(`   Host: ${db.config.host}`);
        console.log(`   Port: ${db.config.port}`);
        console.log(`   Database: ${db.config.database}`);
        console.log(`   User: ${db.config.user}`);
        this.results.databaseManagerSetup = true;
        this.results.passedTests++;
      } else {
        console.log('❌ Database manager configuration invalid');
      }
      
      await db.close();
    } catch (err: any) {
      console.log('❌ Database manager setup failed:', err.message);
    }
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Database Integration Tests...\n');
    
    await this.testMockServerHealth();
    console.log('');
    
    await this.testMockServerData();
    console.log('');
    
    await this.testDatabaseManagerSetup();
    console.log('');
    
    this.printResults();
  }

  private printResults(): void {
    console.log('📊 DATABASE INTEGRATION TEST RESULTS');
    console.log('=====================================');
    console.log(`Tests Passed: ${this.results.passedTests}/${this.results.totalTests}`);
    console.log(`Success Rate: ${Math.round((this.results.passedTests / this.results.totalTests) * 100)}%`);
    console.log('');
    
    console.log('Individual Test Results:');
    console.log(`  Mock Server Health: ${this.results.mockServerHealth ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Mock Server Data: ${this.results.mockServerData ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Database Manager: ${this.results.databaseManagerSetup ? '✅ PASS' : '❌ FAIL'}`);
    console.log('');
    
    if (this.results.passedTests === this.results.totalTests) {
      console.log('🎉 ALL TESTS PASSED - Database integration is working correctly!');
      console.log('');
      console.log('📋 CURRENT DATABASE STATUS:');
      console.log('  • Mock database server running on port 5432');
      console.log('  • Health check endpoint active');
      console.log('  • Sample data loaded (players, characters)');
      console.log('  • Database manager properly configured');
      console.log('  • Ready for MCP PostgreSQL server integration');
    } else {
      console.log('⚠️  Some tests failed - check the database setup');
    }
  }
}

// Run the tests
if (require.main === module) {
  const tester = new DatabaseIntegrationTest();
  tester.runAllTests().catch(console.error);
}

export { DatabaseIntegrationTest };