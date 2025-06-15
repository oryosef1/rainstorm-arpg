# 🚀 **COMPLETE MCP SETUP GUIDE FOR RAINSTORM ARPG**

This guide will transform your RainStorm ARPG development workflow with Model Context Protocol (MCP) servers, providing AI-enhanced development capabilities.

## 📋 **PREREQUISITES**

### **Required Software**
- ✅ **Node.js 18+** (Latest LTS recommended)
- ✅ **npm or yarn** (Package manager)
- ✅ **PostgreSQL 14+** (Database)
- ✅ **Claude Desktop** (AI Assistant)
- ✅ **Git** (Version control)

### **Optional but Recommended**
- 🔧 **Docker** (For isolated PostgreSQL)
- 🌐 **GitHub Account** (For repository integration)
- 🔍 **Brave Search API** (For research capabilities)

---

## 🎯 **QUICK SETUP (5 Minutes)**

### **Step 1: Clone and Install Dependencies**
```bash
# Navigate to your project
cd /path/to/rainstorm-arpg

# Install required packages
npm install pg puppeteer

# Make setup scripts executable
chmod +x setup-all-mcp.sh
chmod +x setup-postgresql.sh
```

### **Step 2: Install All MCP Servers**
```bash
# Run the automated setup
./setup-all-mcp.sh
```

### **Step 3: Configure API Keys**
1. **GitHub Token**: Get from https://github.com/settings/tokens
2. **Brave API Key**: Get from https://api.search.brave.com/ (optional)

### **Step 4: Update Configuration**
```bash
# Edit the config file
nano claude_desktop_config.json

# Replace these placeholders:
# - YOUR_GITHUB_TOKEN_HERE
# - YOUR_BRAVE_API_KEY_HERE
```

### **Step 5: Install Claude Desktop Config**

**Windows:**
```cmd
mkdir "%APPDATA%\Claude"
copy claude_desktop_config.json "%APPDATA%\Claude\claude_desktop_config.json"
```

**macOS:**
```bash
mkdir -p ~/Library/Application\ Support/Claude
cp claude_desktop_config.json ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Linux:**
```bash
mkdir -p ~/.config/Claude
cp claude_desktop_config.json ~/.config/Claude/claude_desktop_config.json
```

---

## 🗄️ **DATABASE SETUP**

### **Option A: Quick Setup (Recommended)**
```bash
# Install PostgreSQL (platform specific)
./setup-postgresql.sh

# Initialize database schema
npm install pg
node initialize-database.js
```

### **Option B: Docker Setup (Isolated)**
```bash
# Start PostgreSQL in Docker
docker run --name rainstorm-postgres \
  -e POSTGRES_USER=rainstorm_user \
  -e POSTGRES_PASSWORD=rainstorm_password_2024 \
  -e POSTGRES_DB=rainstorm_arpg \
  -p 5432:5432 \
  -d postgres:14

# Initialize schema
node initialize-database.js
```

### **Option C: Manual Setup**
```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create user and database
CREATE USER rainstorm_user WITH PASSWORD 'rainstorm_password_2024';
CREATE DATABASE rainstorm_arpg OWNER rainstorm_user;
GRANT ALL PRIVILEGES ON DATABASE rainstorm_arpg TO rainstorm_user;

-- Apply schema
\c rainstorm_arpg
\i database-schema.sql
```

---

## 🧪 **TESTING YOUR SETUP**

### **Test MCP Servers**
```bash
# Test all servers
node test-github-mcp.js

# Test database connection
node -e "
const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://rainstorm_user:rainstorm_password_2024@localhost:5432/rainstorm_arpg'
});
client.connect().then(() => {
  console.log('✅ Database connected');
  client.end();
}).catch(err => console.error('❌ Database failed:', err));
"
```

### **Test E2E System**
```bash
# Install dependencies
npm install puppeteer

# Run end-to-end tests
node tests/e2e/puppeteer-tests.js
```

---

## 🎮 **USING MCP ENHANCED DEVELOPMENT**

### **With GitHub MCP**
Now you can ask Claude to:
- "Review the latest commit in the crafting system"
- "Create a pull request for the master crafting feature"
- "Show me issues related to performance optimization"
- "Compare the current ECS implementation with the previous version"

### **With Filesystem MCP**
Ask Claude to:
- "Show me all TypeScript definition files"
- "Find unused asset files in the game directory"
- "Analyze the structure of the components directory"
- "Create a backup of the test files"

### **With PostgreSQL MCP**
Ask Claude to:
- "Show me the top 10 players by level"
- "Create a query for character equipment analysis"
- "Generate player statistics for the last month"
- "Optimize the database schema for better performance"

### **With Puppeteer MCP**
Ask Claude to:
- "Run automated tests on the character creation screen"
- "Take screenshots of the inventory system at different resolutions"
- "Test the game performance under load"
- "Verify cross-browser compatibility"

---

## 🔧 **CONFIGURATION REFERENCE**

### **Complete claude_desktop_config.json**
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/rainstorm-arpg"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_actual_token_here"
      }
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://rainstorm_user:rainstorm_password_2024@localhost:5432/rainstorm_arpg"
      }
    },
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "BSA_your_api_key_here"
      }
    }
  }
}
```

### **Database Connection String Format**
```
postgresql://username:password@hostname:port/database
```

### **GitHub Token Scopes Required**
- ✅ `repo` - Full control of private repositories
- ✅ `workflow` - Update GitHub Action workflows  
- ✅ `read:org` - Read org membership (optional)

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues**

#### **MCP Server Not Found**
```bash
# Solution: Install globally
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-github
npm install -g @modelcontextprotocol/server-postgres
npm install -g @modelcontextprotocol/server-puppeteer
npm install -g @modelcontextprotocol/server-brave-search
```

#### **Database Connection Failed**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list | grep postgres  # macOS
net start postgresql-x64-14  # Windows

# Test connection manually
psql -h localhost -U rainstorm_user -d rainstorm_arpg
```

#### **Claude Desktop Config Not Found**
```bash
# Find Claude config directory
# Windows: %APPDATA%\Claude
# macOS: ~/Library/Application Support/Claude  
# Linux: ~/.config/Claude

# Verify config exists
ls -la ~/.config/Claude/claude_desktop_config.json  # Linux/macOS
dir "%APPDATA%\Claude\claude_desktop_config.json"  # Windows
```

#### **GitHub Token Invalid**
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select required scopes: `repo`, `workflow`
4. Copy token to config file
5. Restart Claude Desktop

---

## 📊 **PERFORMANCE IMPACT**

### **Expected Benefits**
- 🚀 **Development Speed**: 3-5x faster with AI assistance
- 🔍 **Code Quality**: Automated reviews and suggestions
- 🧪 **Testing**: Automated test generation and execution
- 📈 **Analytics**: Real-time database insights
- 🔧 **Debugging**: Enhanced error analysis and solutions

### **Resource Usage**
- **Memory**: ~200MB additional for MCP servers
- **CPU**: Minimal impact during idle
- **Network**: API calls only when using search features
- **Disk**: ~50MB for MCP server cache

---

## 🎯 **NEXT STEPS**

### **Immediate Actions**
1. ✅ Complete the setup following this guide
2. ✅ Test each MCP server individually
3. ✅ Run the E2E test suite
4. ✅ Try example queries with Claude Desktop

### **Advanced Setup**
1. 🔧 Configure custom database schemas
2. 🔧 Set up automated deployment with GitHub Actions
3. 🔧 Create custom MCP servers for game-specific needs
4. 🔧 Integrate with CI/CD pipeline

### **Development Workflow**
1. 🎮 Use GitHub MCP for code reviews
2. 🎮 Use PostgreSQL MCP for data analysis
3. 🎮 Use Puppeteer MCP for automated testing
4. 🎮 Use Filesystem MCP for asset management

---

## 🎉 **SUCCESS VERIFICATION**

Your setup is complete when:
- ✅ Claude Desktop shows MCP servers as connected
- ✅ Database queries work through Claude
- ✅ GitHub repository access is available
- ✅ Automated tests run successfully
- ✅ File system operations work through Claude

**You're now ready to supercharge your RainStorm ARPG development with AI-enhanced workflows!**

---

*For additional help, check the troubleshooting section or create an issue in the repository.*