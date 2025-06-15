#!/usr/bin/env node

// Test GitHub MCP Server Connection
import { spawn, ChildProcess } from 'child_process';

interface TestRequest {
  jsonrpc: string;
  id: number;
  method: string;
  params: Record<string, any>;
}

async function testGitHubMCP(): Promise<void> {
  console.log('🧪 Testing GitHub MCP Server...');
  
  const env = {
    ...process.env,
    GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_PERSONAL_ACCESS_TOKEN || 'your_token_here'
  };
  
  const server: ChildProcess = spawn('npx', ['@modelcontextprotocol/server-github'], {
    env,
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let output = '';
  
  server.stdout?.on('data', (data: Buffer) => {
    output += data.toString();
    console.log('📄 Server output:', data.toString());
  });
  
  server.stderr?.on('data', (data: Buffer) => {
    console.error('❌ Server error:', data.toString());
  });
  
  server.on('close', (code: number | null) => {
    console.log(`🏁 Server exited with code ${code}`);
    if (code === 0) {
      console.log('✅ GitHub MCP Server is working correctly!');
    } else {
      console.log('❌ GitHub MCP Server failed to start');
    }
  });
  
  // Send a test request
  setTimeout(() => {
    const testRequest: TestRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    };
    
    const requestString = JSON.stringify(testRequest) + '\n';
    
    if (server.stdin) {
      server.stdin.write(requestString);
    }
    
    setTimeout(() => {
      server.kill();
    }, 3000);
  }, 1000);
}

if (typeof require !== 'undefined' && require.main === module) {
  testGitHubMCP().catch(console.error);
}

export { testGitHubMCP };