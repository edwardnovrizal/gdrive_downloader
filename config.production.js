module.exports = {
  // File yang berisi daftar URL folder Google Drive
  URLS_FILE: "./urls.txt",
  
  // Direktori untuk menyimpan file yang didownload
  DOWNLOAD_DIR: "./downloads",
  
  // Konfigurasi Puppeteer untuk server production (tanpa GUI)
  PUPPETEER_CONFIG: {
    headless: true, // WAJIB true untuk server tanpa GUI
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad',
      '--disable-client-side-phishing-detection',
      '--disable-component-extensions-with-background-pages',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-features=TranslateUI',
      '--disable-hang-monitor',
      '--disable-ipc-flooding-protection',
      '--disable-popup-blocking',
      '--disable-prompt-on-repost',
      '--disable-renderer-backgrounding',
      '--disable-sync',
      '--force-color-profile=srgb',
      '--metrics-recording-only',
      '--no-first-run',
      '--safebrowsing-disable-auto-update',
      '--enable-automation',
      '--password-store=basic',
      '--use-mock-keychain',
      '--hide-scrollbars',
      '--mute-audio',
      '--no-default-browser-check',
      '--no-pings',
      '--disable-gpu',
      '--single-process', // Untuk shared hosting dengan memory terbatas
      '--memory-pressure-off'
    ]
  },
  
  // Timeout dan retry settings yang lebih konservatif untuk server
  TIMEOUT: 90000, // 90 detik - lebih lama untuk koneksi server yang lambat
  MAX_RETRIES: 5, // Lebih banyak retry untuk server yang tidak stabil
  DELAY_BETWEEN_DOWNLOADS: 3000, // 3 detik - lebih lama untuk menghindari rate limiting
  DELAY_BETWEEN_FOLDERS: 5000, // 5 detik delay antar folder
  
  // User Agent yang lebih generic untuk server
  USER_AGENT: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  
  // Konfigurasi khusus untuk environment server
  SERVER_CONFIG: {
    MAX_CONCURRENT_DOWNLOADS: 1, // Satu download pada satu waktu untuk shared hosting
    ENABLE_LOGGING: true,
    LOG_FILE: './scraper.log',
    ENABLE_PROGRESS_SAVE: true, // Simpan progress untuk resume jika interrupted
    PROGRESS_FILE: './progress.json'
  }
};
