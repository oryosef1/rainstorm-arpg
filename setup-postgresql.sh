#!/bin/bash

# PostgreSQL Setup Script for RainStorm ARPG

echo "🐘 Setting up PostgreSQL for RainStorm ARPG"

# Check if PostgreSQL is installed
if command -v psql >/dev/null 2>&1; then
    echo "✅ PostgreSQL is already installed"
else
    echo "📦 Installing PostgreSQL..."
    
    # Installation instructions for different platforms
    echo "Please install PostgreSQL for your platform:"
    echo ""
    echo "🪟 Windows:"
    echo "   Download from: https://www.postgresql.org/download/windows/"
    echo ""
    echo "🍎 macOS:"
    echo "   brew install postgresql"
    echo "   brew services start postgresql"
    echo ""
    echo "🐧 Ubuntu/Debian:"
    echo "   sudo apt update"
    echo "   sudo apt install postgresql postgresql-contrib"
    echo ""
    echo "🎩 CentOS/RHEL:"
    echo "   sudo yum install postgresql-server postgresql-contrib"
    echo ""
    
    exit 1
fi

# Create database and user
echo "🗄️ Creating RainStorm ARPG database..."

# Create user and database
sudo -u postgres psql << EOF
-- Create user for RainStorm ARPG
CREATE USER rainstorm_user WITH PASSWORD 'rainstorm_password_2024';

-- Create database
CREATE DATABASE rainstorm_arpg OWNER rainstorm_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE rainstorm_arpg TO rainstorm_user;

-- Connect to the database and create schema
\c rainstorm_arpg

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO rainstorm_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rainstorm_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rainstorm_user;

\q
EOF

echo "✅ PostgreSQL database setup complete!"
echo ""
echo "📋 Database Details:"
echo "   Database: rainstorm_arpg"
echo "   User: rainstorm_user"
echo "   Password: rainstorm_password_2024"
echo "   Connection: postgresql://rainstorm_user:rainstorm_password_2024@localhost:5432/rainstorm_arpg"

# Install PostgreSQL MCP server
echo "📦 Installing PostgreSQL MCP Server..."
npm install -g @modelcontextprotocol/server-postgres

echo "🧪 Testing PostgreSQL MCP Server..."
npx @modelcontextprotocol/server-postgres --help

echo "✅ PostgreSQL MCP Server setup complete!"