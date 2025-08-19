# 🚀 Google Drive Multi-Folder Scraper - Whatbox Deployment Guide

Panduan lengkap untuk deploy scraper ke server Whatbox (shared hosting tanpa akses root).

## 📋 Prerequisites

### 1. Akun Whatbox
- Akses SSH ke server Whatbox
- Space disk yang cukup untuk download
- Bandwidth yang memadai

### 2. Software Requirements
- Node.js v14+ (biasanya sudah tersedia di Whatbox)
- npm (included dengan Node.js)
- Git (untuk clone repository)

## 🔧 Step-by-Step Deployment

### Step 1: Connect ke Server Whatbox

```bash
# Login via SSH
ssh username@server.whatbox.ca

# Masuk ke home directory
cd ~
```

### Step 2: Install/Update Node.js (Jika Diperlukan)

```bash
# Cek versi Node.js yang tersedia
node --version
npm --version

# Jika versi terlalu lama atau tidak ada, install Node.js
wget https://nodejs.org/dist/v18.17.0/node-v18.17.0-linux-x64.tar.xz
tar -xf node-v18.17.0-linux-x64.tar.xz

# Add to PATH (tambahkan ke ~/.bashrc untuk permanent)
export PATH=$PATH:$PWD/node-v18.17.0-linux-x64/bin
```

### Step 3: Clone dan Setup Project

```bash
# Clone repository atau upload files
git clone YOUR_REPO_URL gdrive_scraper
# Atau upload files via SCP/SFTP

cd gdrive_scraper

# Jalankan deployment script
chmod +x deploy.sh
./deploy.sh
```

### Step 4: Konfigurasi URLs

```bash
# Edit file URLs
nano urls.txt

# Tambahkan URL folder Google Drive Anda:
# https://drive.google.com/drive/folders/YOUR_FOLDER_ID_1
# https://drive.google.com/drive/folders/YOUR_FOLDER_ID_2
```

### Step 5: Start Scraper

```bash
# Start scraper dalam background
./start.sh

# Check status
./status.sh

# Monitor logs
tail -f logs/scraper.log
```

## 📁 File Structure Setelah Deployment

```
gdrive_scraper/
├── app.js                    # Main application
├── app.server.js             # Production launcher  
├── config.js                 # Development config
├── config.production.js      # Production config
├── config.server.js          # Server config (created by deploy.sh)
├── package.json              # Dependencies
├── urls.txt                  # URLs to scrape
├── deploy.sh                 # Deployment script
├── start.sh                  # Start script
├── stop.sh                   # Stop script
├── status.sh                 # Status checker
├── logs/
│   └── scraper.log           # Application logs
├── downloads/
│   ├── Folder_Name_1/        # Downloaded files from folder 1
│   ├── Folder_Name_2/        # Downloaded files from folder 2
│   └── ...
└── node_modules/             # Dependencies
```

## 🎛️ Management Commands

### Starting the Scraper
```bash
./start.sh
```

### Checking Status
```bash
./status.sh
```

### Viewing Logs
```bash
# Real-time logs
tail -f logs/scraper.log

# Last 50 lines
tail -50 logs/scraper.log

# Search for errors
grep "ERROR\\|❌" logs/scraper.log
```

### Stopping the Scraper
```bash
./stop.sh
```

## 🔧 Configuration for Whatbox

### Memory Optimization
The production config automatically uses:
- `--single-process` flag for lower memory usage
- Reduced concurrent operations
- Memory monitoring and warnings

### Network Optimization
- Extended timeouts for slower connections
- More retry attempts
- Longer delays between downloads

### Storage Management
```bash
# Check disk usage
df -h

# Check scraper directory size
du -sh ~/gdrive_scraper/downloads

# Clean up old downloads if needed
rm -rf ~/gdrive_scraper/downloads/Old_Folder_Name
```

## 📊 Monitoring & Troubleshooting

### Common Issues

#### 1. "puppeteer: command not found" atau Chrome issues
```bash
# Production config automatically handles this with proper Chrome flags
# No action needed if using config.production.js
```

#### 2. Memory Issues
```bash
# Check memory usage
./status.sh

# If memory is high, reduce concurrent downloads in config
nano config.server.js
# Set MAX_CONCURRENT_DOWNLOADS: 1
```

#### 3. Permission Issues
```bash
# Fix file permissions
chmod +x *.sh
chmod 644 *.js *.json *.txt *.md
```

#### 4. Port Issues
```bash
# Whatbox usually doesn't have port restrictions for outbound connections
# Script uses standard HTTP/HTTPS ports (80/443)
```

### Performance Tuning

#### For Large Files
```bash
# Increase timeouts in config.server.js
nano config.server.js
# Set TIMEOUT: 180000 (3 minutes)
```

#### For Slow Connections
```bash
# Increase delays between downloads
nano config.server.js
# Set DELAY_BETWEEN_DOWNLOADS: 5000 (5 seconds)
```

## 🔄 Maintenance

### Daily Checks
```bash
# Check if scraper is running
./status.sh

# Check disk space
df -h

# Check recent logs for errors
tail -20 logs/scraper.log | grep "❌\\|ERROR"
```

### Weekly Maintenance
```bash
# Rotate logs (if they get too large)
cp logs/scraper.log logs/scraper.log.backup
echo "" > logs/scraper.log

# Clean up old downloads (if needed)
find downloads -type f -mtime +30 -delete  # Delete files older than 30 days
```

### Updates
```bash
# Stop scraper
./stop.sh

# Backup current config
cp config.server.js config.server.js.backup

# Update code (git pull or upload new files)
git pull origin main

# Reinstall dependencies if package.json changed
npm install

# Restart
./start.sh
```

## 🚨 Emergency Procedures

### If Scraper Hangs
```bash
# Force stop
./stop.sh

# Kill any remaining processes
pkill -f "node.*app"

# Check for zombie processes
ps aux | grep node

# Restart
./start.sh
```

### If Disk Space Full
```bash
# Check largest directories
du -sh downloads/* | sort -hr

# Remove largest/oldest folders
rm -rf downloads/Folder_Name

# Restart scraper
./start.sh
```

### If Server Restart
```bash
# After server reboot, scraper needs manual restart
ssh username@server.whatbox.ca
cd ~/gdrive_scraper
./start.sh
```

## 💡 Best Practices

### 1. Resource Management
- Monitor memory usage regularly
- Don't run multiple instances simultaneously
- Clean up old downloads periodically

### 2. Network Courtesy
- Don't scrape too aggressively
- Use reasonable delays between downloads
- Monitor for rate limiting

### 3. Data Management
- Organize downloaded files regularly
- Keep backups of important downloads
- Monitor available disk space

### 4. Security
- Don't share your Google Drive URLs publicly
- Keep server access credentials secure
- Regularly update Node.js and dependencies

## 📞 Support

### Check Logs First
```bash
# Recent errors
grep "❌\\|ERROR" logs/scraper.log | tail -10

# Memory issues
grep "memory\\|Memory" logs/scraper.log | tail -5

# Network issues
grep "timeout\\|TIMEOUT\\|connection" logs/scraper.log | tail -5
```

### Common Log Messages
- `✅ Download selesai` - Successful download
- `❌ Gagal download` - Failed download (will retry)
- `⚠️ High memory usage` - Memory warning
- `🛑 Received SIGTERM` - Clean shutdown initiated

### Getting Help
1. Check this guide first
2. Review logs for specific error messages
3. Check Whatbox documentation for server-specific issues
4. Ensure your Google Drive folders are publicly accessible

---

**Ready for production use on Whatbox! 🚀**
