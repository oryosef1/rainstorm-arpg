#!/bin/bash

# GitHub MCP Setup Script for RainStorm ARPG

echo "🚀 Setting up GitHub MCP Server for RainStorm ARPG"

# Install GitHub MCP server globally
echo "📦 Installing GitHub MCP Server..."
npm install -g @modelcontextprotocol/server-github

# Test GitHub MCP server
echo "🧪 Testing GitHub MCP Server..."
npx @modelcontextprotocol/server-github --help

echo "✅ GitHub MCP Server setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Add your GitHub Personal Access Token to the Claude Desktop config"
echo "2. Replace 'YOUR_GITHUB_TOKEN_HERE' with your actual token"
echo "3. Restart Claude Desktop"
echo ""
echo "🔑 Token scopes needed:"
echo "   - repo (Full control of private repositories)"
echo "   - workflow (Update GitHub Action workflows)" 
echo "   - read:org (Read org membership)"