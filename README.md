# Google Drive Multi-Folder Scraper

Aplikasi Node.js untuk melakukan scraping dan download file dari multiple folder Google Drive yang dapat diakses secara publik. Mendukung batch processing untuk banyak folder sekaligus dengan organisasi file otomatis.

## 🚀 Fitur

- ✅ **Multi-folder support**: Scraping multiple folder sekaligus dari file URLs
- ✅ **Auto folder organization**: Membuat subfolder sesuai nama folder Google Drive
- ✅ **Batch processing**: Download file secara batch dari banyak folder
- ✅ **Smart file detection**: Parsing nama file dan ID dengan akurat
- ✅ **Retry mechanism**: 3x percobaan untuk download yang gagal
- ✅ **Progress tracking**: Real-time progress untuk setiap folder dan file
- ✅ **File sanitization**: Nama file otomatis dibersihkan untuk kompatibilitas sistem
- ✅ **Rate limiting**: Delay otomatis untuk menghindari blocking
- ✅ **Comprehensive reporting**: Statistik lengkap hasil scraping dan download

## 📋 Prerequisites

- Node.js (v14 atau lebih baru)
- NPM atau Yarn
- Google Chrome atau Chromium (untuk Puppeteer)

## 🛠️ Instalasi

1. Clone atau download project ini
2. Install dependencies:
```bash
npm install
```

## ⚙️ Konfigurasi

### 1. **Setup URLs File**

Edit file `urls.txt` untuk menambahkan folder Google Drive yang ingin di-scrape:

```
# Daftar URL folder Google Drive yang akan di-scrape
# Satu URL per baris, kosongkan atau tambahkan # di depan untuk menonaktifkan

https://drive.google.com/drive/folders/1lKy011I5bNDNpWNA2B9dtQw5tdRmqySm
https://drive.google.com/drive/folders/FOLDER_ID_2
https://drive.google.com/drive/folders/FOLDER_ID_3

# Contoh URL yang dinonaktifkan:
# https://drive.google.com/drive/folders/FOLDER_ID_4
```

### 2. **Setup Konfigurasi**

Edit file `config.js` untuk mengubah pengaturan:

```javascript
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
      '--disable-web-security'
    ]
  },
  
  // Timeout dan retry settings
  TIMEOUT: 60000, // 60 detik
  MAX_RETRIES: 3,
  DELAY_BETWEEN_DOWNLOADS: 2000, // 2 detik
};
```

### 🔧 Pengaturan Penting

1. **URLS_FILE**: File yang berisi daftar URL folder Google Drive
   - Satu URL per baris
   - Gunakan `#` untuk menonaktifkan URL tertentu
   - Format: `https://drive.google.com/drive/folders/FOLDER_ID`

2. **DOWNLOAD_DIR**: Struktur folder hasil download
   ```
   downloads/
   ├── Nama_Folder_1/
   │   ├── file1.mp4
   │   └── file2.jpg
   ├── Nama_Folder_2/
   │   ├── file3.pdf
   │   └── file4.doc
   └── ...
   ```

3. **headless**: 
   - `false`: Browser akan terlihat (berguna untuk debugging)
   - `true`: Browser berjalan di background (untuk production)

## 🚀 Penggunaan

Jalankan aplikasi:

```bash
node app.js
```

Atau dengan nodemon untuk development:

```bash
npm run dev
```

## 📝 Output

Program akan menampilkan:
- Jumlah file dan folder yang ditemukan
- Progress download untuk setiap file
- Ringkasan hasil (berhasil/gagal)
- File akan disimpan di folder `downloads/`

Contoh output:
```
🎯 Google Drive Scraper v2.0
==================================================
🚀 Memulai scraping Google Drive...
📁 URL Folder: https://drive.google.com/drive/folders/...
📁 Download Directory: ./downloads
--------------------------------------------------
🔍 Membuka halaman Google Drive...
📜 Melakukan scroll untuk memuat semua file...
📂 Debug info: [ 'Found grid with selector: div[role="grid"]' ]
📂 Jumlah file ditemukan: 5
📄 Daftar file:
  1. [FILE] document.pdf
  2. [FILE] image.jpg
  3. [FILE] video.mp4
  4. [FOLDER] subfolder
  5. [FILE] spreadsheet.xlsx

✅ Berhasil menemukan 5 item!
--------------------------------------------------
📄 File yang akan didownload: 4
   1. 📄 document.pdf
   2. 📄 image.jpg
   3. 📄 video.mp4
   4. 📄 spreadsheet.xlsx

🔄 Memulai proses download...
--------------------------------------------------

[1/4] Downloading: document.pdf
📥 Mencoba download: document.pdf (percobaan 1/3)
✅ Download selesai: document.pdf
⏳ Menunggu 2 detik sebelum download berikutnya...

==================================================
📊 RINGKASAN DOWNLOAD:
✅ Berhasil: 4 file
❌ Gagal: 0 file
📁 Total item ditemukan: 5
📄 File tersedia: 4
📁 Folder ditemukan: 1
==================================================
```

## 🔧 Troubleshooting

### Tidak ada file yang ditemukan
- Pastikan folder Google Drive bersifat publik
- Periksa URL folder sudah benar
- Set `headless: false` untuk melihat apa yang terjadi di browser

### Download gagal
- File mungkin terlalu besar dan memerlukan konfirmasi
- Coba tingkatkan `MAX_RETRIES` di config
- Periksa koneksi internet

### Browser tidak bisa dibuka
- Install Google Chrome atau Chromium
- Pada Linux, mungkin perlu install dependencies tambahan:
```bash
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
```

## 📚 Dependencies

- **puppeteer**: Untuk automasi browser
- **axios**: Untuk HTTP requests
- **cheerio**: Untuk parsing HTML (optional)
- **nodemon**: Untuk development (devDependency)

## ⚠️ Disclaimer

- Tool ini hanya untuk file/folder Google Drive yang dapat diakses secara publik
- Pastikan Anda memiliki izin untuk mengakses dan download file
- Gunakan dengan bijak dan patuhi terms of service Google Drive
- Rate limiting diterapkan untuk menghindari blocking

## 🤝 Contributing

Feel free to submit issues dan pull requests untuk improvement!

## 📄 License

ISC License
