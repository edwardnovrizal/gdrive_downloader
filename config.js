module.exports = {
  // File yang berisi daftar URL folder Google Drive
  URLS_FILE: "./urls.txt",
  
  // Direktori untuk menyimpan file yang didownload
  DOWNLOAD_DIR: "./downloads",
  
  // Konfigurasi Puppeteer
  PUPPETEER_CONFIG: {
    headless: false, // Set ke true untuk production, false untuk debugging
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor'
    ]
  },
  
  // Timeout dan retry settings
  TIMEOUT: 60000, // 60 detik
  MAX_RETRIES: 3,
  DELAY_BETWEEN_DOWNLOADS: 2000, // 2 detik
  
  // User Agent untuk request
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};
