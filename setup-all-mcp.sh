#!/bin/bash

# Complete MCP Setup Script for RainStorm ARPG

echo "🚀 Setting up ALL MCP Servers for RainStorm ARPG Development"
echo "============================================================="

# Install all MCP servers globally
echo "📦 Installing MCP Servers..."

echo "  Installing Filesystem MCP..."
npm install -g @modelcontextprotocol/server-filesystem

echo "  Installing GitHub MCP..."
npm install -g @modelcontextprotocol/server-github

echo "  Installing PostgreSQL MCP..."
npm install -g @modelcontextprotocol/server-postgres

echo "  Installing Puppeteer MCP..."
npm install -g @modelcontextprotocol/server-puppeteer

echo "  Installing Brave Search MCP..."
npm install -g @modelcontextprotocol/server-brave-search

echo "✅ All MCP servers installed!"

# Test installations
echo ""
echo "🧪 Testing MCP Server Installations..."

echo "Testing Filesystem MCP..."
npx @modelcontextprotocol/server-filesystem --help > /dev/null 2>&1 && echo "  ✅ Filesystem MCP working" || echo "  ❌ Filesystem MCP failed"

echo "Testing GitHub MCP..."
npx @modelcontextprotocol/server-github --help > /dev/null 2>&1 && echo "  ✅ GitHub MCP working" || echo "  ❌ GitHub MCP failed"

echo "Testing PostgreSQL MCP..."
npx @modelcontextprotocol/server-postgres --help > /dev/null 2>&1 && echo "  ✅ PostgreSQL MCP working" || echo "  ❌ PostgreSQL MCP failed"

echo "Testing Puppeteer MCP..."
npx @modelcontextprotocol/server-puppeteer --help > /dev/null 2>&1 && echo "  ✅ Puppeteer MCP working" || echo "  ❌ Puppeteer MCP failed"

echo "Testing Brave Search MCP..."
npx @modelcontextprotocol/server-brave-search --help > /dev/null 2>&1 && echo "  ✅ Brave Search MCP working" || echo "  ❌ Brave Search MCP failed"

echo ""
echo "🔧 Configuration Steps Required:"
echo "================================"
echo ""
echo "1. 🔑 GitHub Personal Access Token:"
echo "   - Go to: https://github.com/settings/tokens"
echo "   - Generate new token with 'repo' and 'workflow' scopes"
echo "   - Replace 'YOUR_GITHUB_TOKEN_HERE' in claude_desktop_config.json"
echo ""
echo "2. 🔍 Brave Search API Key (Optional):"
echo "   - Go to: https://api.search.brave.com/"
echo "   - Get API key for search capabilities"
echo "   - Replace 'YOUR_BRAVE_API_KEY_HERE' in claude_desktop_config.json"
echo ""
echo "3. 🐘 PostgreSQL Database:"
echo "   - Run: ./setup-postgresql.sh"
echo "   - Run: node initialize-database.js"
echo ""
echo "4. 🖥️ Claude Desktop Config:"
echo "   - Copy claude_desktop_config.json to Claude config directory"
echo "   - Restart Claude Desktop"
echo ""
echo "🎯 Next Steps:"
echo "=============="
echo "1. Configure your API keys in claude_desktop_config.json"
echo "2. Copy config to Claude Desktop directory"
echo "3. Set up PostgreSQL database"
echo "4. Restart Claude Desktop"
echo "5. Start developing with MCP-enhanced workflow!"
echo ""
echo "🎮 Ready to supercharge RainStorm ARPG development!"