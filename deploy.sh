#!/bin/bash

# Google Drive Multi-Folder Scraper - Whatbox Deployment Script
# Script untuk deploy dan setup di server Whatbox (shared hosting)

echo "🚀 Google Drive Scraper - Whatbox Deployment"
echo "=============================================="

# Warna untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fungsi untuk print dengan warna
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Deteksi environment
print_status "Mendeteksi environment..."

# Cek apakah di Whatbox (biasanya ada directory structure khusus)
if [[ "$PWD" == *"/home/"* ]] && [[ -d "$HOME/bin" ]]; then
    print_success "Environment Whatbox detected"
    IS_WHATBOX=true
else
    print_warning "Environment tidak terdeteksi sebagai Whatbox, melanjutkan dengan konfigurasi generic"
    IS_WHATBOX=false
fi

# Cek Node.js
print_status "Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
    
    # Cek versi minimum (v14+)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 14 ]; then
        print_error "Node.js version $NODE_VERSION is too old. Need v14 or higher."
        print_status "Please install/update Node.js:"
        echo "  1. Download from: https://nodejs.org/en/download/"
        echo "  2. Or use node version manager (nvm)"
        exit 1
    fi
else
    print_error "Node.js not found!"
    print_status "Install Node.js first:"
    echo "  1. wget https://nodejs.org/dist/v18.17.0/node-v18.17.0-linux-x64.tar.xz"
    echo "  2. tar -xf node-v18.17.0-linux-x64.tar.xz"
    echo "  3. Add to PATH: export PATH=\$PATH:\$PWD/node-v18.17.0-linux-x64/bin"
    exit 1
fi

# Cek NPM
print_status "Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm found: $NPM_VERSION"
else
    print_error "npm not found!"
    exit 1
fi

# Install dependencies
print_status "Installing dependencies..."
if npm install; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Copy production config
print_status "Setting up production configuration..."
if [ -f "config.production.js" ]; then
    cp config.production.js config.server.js
    print_success "Production config copied to config.server.js"
else
    print_warning "config.production.js not found, using default config"
fi

# Create directories
print_status "Creating necessary directories..."
mkdir -p downloads
mkdir -p logs
print_success "Directories created"

# Create production-ready app.js
print_status "Creating production app launcher..."
cat > app.server.js << 'EOF'
const fs = require("fs");

// Determine which config to use
let config;
try {
    if (fs.existsSync('./config.server.js')) {
        config = require('./config.server.js');
        console.log('📋 Using server configuration');
    } else if (fs.existsSync('./config.production.js')) {
        config = require('./config.production.js');
        console.log('📋 Using production configuration');
    } else {
        config = require('./config.js');
        console.log('📋 Using default configuration');
    }
} catch (error) {
    console.error('❌ Error loading configuration:', error.message);
    process.exit(1);
}

// Override config for server environment
const originalConfig = { ...config };
originalConfig.PUPPETEER_CONFIG.headless = true; // Force headless mode

// Load main app with server config
process.env.NODE_ENV = 'production';
const originalRequire = require('./app.js');
EOF

print_success "Production launcher created: app.server.js"

# Create startup script
print_status "Creating startup script..."
cat > start.sh << 'EOF'
#!/bin/bash

# Google Drive Scraper Startup Script for Whatbox
echo "🎯 Starting Google Drive Multi-Folder Scraper..."
echo "Environment: Production Server"
echo "Time: $(date)"
echo "======================================"

# Set NODE_ENV
export NODE_ENV=production

# Run with nohup to keep running after disconnect
nohup node app.server.js > logs/scraper.log 2>&1 &

# Get PID
PID=$!
echo $PID > scraper.pid

echo "✅ Scraper started in background"
echo "📋 PID: $PID"
echo "📁 Log file: logs/scraper.log"
echo "🔍 Check status: tail -f logs/scraper.log"
echo "🛑 Stop script: ./stop.sh"
EOF

chmod +x start.sh
print_success "Startup script created: start.sh"

# Create stop script
print_status "Creating stop script..."
cat > stop.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping Google Drive Scraper..."

if [ -f scraper.pid ]; then
    PID=$(cat scraper.pid)
    if kill -0 $PID 2>/dev/null; then
        echo "🔄 Stopping process $PID..."
        kill $PID
        sleep 2
        
        # Force kill if still running
        if kill -0 $PID 2>/dev/null; then
            echo "⚠️  Force killing process..."
            kill -9 $PID
        fi
        
        rm scraper.pid
        echo "✅ Scraper stopped"
    else
        echo "⚠️  Process $PID not running"
        rm scraper.pid
    fi
else
    echo "⚠️  PID file not found. Scraper may not be running."
fi

# Kill any remaining node processes running our script
pkill -f "node.*app"
echo "🧹 Cleanup completed"
EOF

chmod +x stop.sh
print_success "Stop script created: stop.sh"

# Create status check script
print_status "Creating status script..."
cat > status.sh << 'EOF'
#!/bin/bash

echo "📊 Google Drive Scraper Status"
echo "============================="

if [ -f scraper.pid ]; then
    PID=$(cat scraper.pid)
    if kill -0 $PID 2>/dev/null; then
        echo "✅ Status: RUNNING"
        echo "📋 PID: $PID"
        echo "⏰ Started: $(ps -o lstart= -p $PID)"
        echo "💾 Memory: $(ps -o rss= -p $PID | awk '{print $1/1024 " MB"}')"
        echo "⚡ CPU: $(ps -o %cpu= -p $PID)%"
    else
        echo "❌ Status: NOT RUNNING (stale PID file)"
        rm scraper.pid
    fi
else
    echo "❌ Status: NOT RUNNING"
fi

echo ""
echo "📁 Recent log entries:"
if [ -f logs/scraper.log ]; then
    tail -5 logs/scraper.log
else
    echo "No log file found"
fi
EOF

chmod +x status.sh
print_success "Status script created: status.sh"

# Create example urls.txt for server
print_status "Creating example urls.txt..."
if [ ! -f urls.txt ]; then
    cat > urls.txt << 'EOF'
# Google Drive Folder URLs for Scraping
# Add your folder URLs here, one per line
# Remove # to activate a URL

# Example (replace with your actual folder IDs):
# https://drive.google.com/drive/folders/1lKy011I5bNDNpWNA2B9dtQw5tdRmqySm

# Add more URLs as needed:
# https://drive.google.com/drive/folders/YOUR_FOLDER_ID_2
# https://drive.google.com/drive/folders/YOUR_FOLDER_ID_3
EOF
    print_success "Example urls.txt created"
else
    print_warning "urls.txt already exists, skipping"
fi

print_success "🎉 Deployment completed successfully!"
echo ""
echo "📋 NEXT STEPS:"
echo "=============="
echo "1. 📝 Edit urls.txt and add your Google Drive folder URLs"
echo "2. 🚀 Start scraper: ./start.sh"
echo "3. 📊 Check status: ./status.sh"
echo "4. 📋 View logs: tail -f logs/scraper.log"
echo "5. 🛑 Stop scraper: ./stop.sh"
echo ""
echo "📁 Files created:"
echo "  - config.server.js (production config)"
echo "  - app.server.js (production launcher)"
echo "  - start.sh (startup script)"
echo "  - stop.sh (stop script)" 
echo "  - status.sh (status checker)"
echo "  - logs/ (log directory)"
echo ""
echo "⚠️  IMPORTANT for Whatbox:"
echo "  - Make sure you have enough disk space"
echo "  - Monitor memory usage with: ./status.sh"
echo "  - Large downloads may take time on shared hosting"
echo ""
print_success "Ready for production use! 🚀"
