const fs = require("fs");
const axios = require("axios");
const puppeteer = require("puppeteer");
const path = require("path");
const config = require("./config");

const URLS_FILE = config.URLS_FILE;
const DOWNLOAD_DIR = config.DOWNLOAD_DIR;

if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// Fungsi untuk membaca URLs dari file
function readUrlsFromFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File ${filePath} tidak ditemukan!`);
      return [];
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const urls = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .filter(line => line.includes('drive.google.com/drive/folders/'));
    
    return urls;
  } catch (error) {
    console.error(`❌ Error membaca file ${filePath}:`, error.message);
    return [];
  }
}

// Fungsi untuk mendapatkan nama folder dari Google Drive
async function getFolderName(page, folderUrl) {
  try {
    // Ambil nama folder dari title halaman
    const pageTitle = await page.title();
    
    // Format title biasanya: "Nama Folder - Google Drive"
    let folderName = pageTitle.replace(' - Google Drive', '').trim();
    
    // Jika masih kosong, coba dari URL atau fallback
    if (!folderName || folderName === 'Google Drive') {
      const urlMatch = folderUrl.match(/\/folders\/([a-zA-Z0-9_-]+)/);
      folderName = urlMatch ? `Folder_${urlMatch[1]}` : 'Unknown_Folder';
    }
    
    // Sanitasi nama folder untuk sistem file
    folderName = folderName.replace(/[<>:"/\\|?*]/g, '_');
    
    return folderName;
  } catch (error) {
    console.error("❌ Error getting folder name:", error.message);
    const urlMatch = folderUrl.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    return urlMatch ? `Folder_${urlMatch[1]}` : 'Unknown_Folder';
  }
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 500;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 1000);
    });
  });
}

async function waitForSelector(page, selector, timeout = 30000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    console.log(`❌ Selector tidak ditemukan: ${selector}`);
    return false;
  }
}
async function getFileList(folderUrl) {
  const browser = await puppeteer.launch(config.PUPPETEER_CONFIG);
  
  const page = await browser.newPage();
  
  try {
    console.log("🔍 Membuka halaman Google Drive...");
    await page.goto(folderUrl, { waitUntil: "networkidle2", timeout: config.TIMEOUT });
    
    // Tunggu halaman fully loaded untuk mendapatkan title yang benar
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log("📜 Melakukan scroll untuk memuat semua file...");
    await autoScroll(page);
    
    // Tunggu setelah scroll
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Dapatkan nama folder dari page title
    const folderName = await getFolderName(page, folderUrl);
    console.log("📁 Nama folder:", folderName);
    
    const pageUrl = page.url();
    console.log("🔗 Current URL:", pageUrl);

    const files = await page.evaluate(() => {
      const results = { files: [], debug: [] };
      
      // Debug: cek apakah halaman sudah dimuat dengan benar
      results.debug.push(`Document title: ${document.title}`);
      results.debug.push(`Document URL: ${window.location.href}`);
      
      // Berdasarkan HTML yang diberikan, cari grid container yang benar
      const gridContainer = document.querySelector('c-wiz[role="grid"]');
      if (!gridContainer) {
        results.debug.push('Grid container c-wiz[role="grid"] tidak ditemukan');
        return results;
      }
      
      results.debug.push('Found grid container: c-wiz[role="grid"]');
      
      // Cari semua file/folder items berdasarkan struktur HTML yang benar
      const fileItems = gridContainer.querySelectorAll('div[data-id][data-target]');
      results.debug.push(`Found ${fileItems.length} items dengan data-id dan data-target`);
      
      Array.from(fileItems).forEach((item, index) => {
        try {
          const fileId = item.getAttribute('data-id');
          const target = item.getAttribute('data-target');
          
          if (!fileId) {
            results.debug.push(`Item ${index + 1}: Tidak ada data-id`);
            return;
          }
          
          // Cari nama file dari element dengan class KL4NAf
          const nameElement = item.querySelector('.KL4NAf');
          let fileName = '';
          
          if (nameElement) {
            // Coba ambil dari data-tooltip atau textContent
            fileName = nameElement.getAttribute('data-tooltip') || nameElement.textContent?.trim();
            
            // Jika data-tooltip ada format seperti "Video: filename.mp4", ambil bagian setelah ": "
            if (fileName && fileName.includes(': ')) {
              fileName = fileName.split(': ')[1];
            }
          }
          
          // Fallback: cari dari aria-label
          if (!fileName) {
            const ariaLabelElement = item.querySelector('[aria-label*="."]');
            if (ariaLabelElement) {
              const ariaLabel = ariaLabelElement.getAttribute('aria-label');
              // Extract filename dari aria-label
              const match = ariaLabel.match(/([^\/]+\.[a-zA-Z0-9]+)/);
              if (match) {
                fileName = match[1];
              }
            }
          }
          
          // Jika masih tidak ada nama, gunakan ID
          if (!fileName) {
            fileName = `file_${fileId}`;
          }
          
          // Tentukan tipe berdasarkan data-target atau deteksi ekstensi
          let type = 'file';
          if (target === 'folder') {
            type = 'folder';
          } else if (fileName.includes('.')) {
            type = 'file';
          }
          
          // Bersihkan nama file
          fileName = fileName.replace(/\n/g, ' ').trim();
          
          if (fileName && fileName !== '') {
            results.files.push({
              id: fileId,
              name: fileName,
              type: type,
              target: target,
              url: type === 'file' ? 
                `https://drive.google.com/file/d/${fileId}/view` : 
                `https://drive.google.com/drive/folders/${fileId}`
            });
            
            results.debug.push(`Item ${index + 1}: ${fileName} (${fileId}) - ${type}`);
          }
          
        } catch (error) {
          results.debug.push(`Error processing item ${index + 1}: ${error.message}`);
        }
      });
      
      // Fallback: jika tidak menemukan dengan selector di atas, coba cara lama
      if (results.files.length === 0) {
        results.debug.push('Fallback: mencoba selector alternatif...');
        
        const allDataIds = document.querySelectorAll('[data-id]');
        results.debug.push(`Found ${allDataIds.length} elements dengan data-id`);
        
        Array.from(allDataIds).forEach((item, index) => {
          const dataId = item.getAttribute('data-id');
          if (dataId && dataId.length > 20) { // Google Drive ID biasanya panjang
            const textContent = item.textContent?.trim();
            if (textContent && textContent.includes('.')) {
              // Coba extract filename dari text content
              const lines = textContent.split('\n').map(line => line.trim()).filter(line => line);
              const fileName = lines.find(line => line.includes('.') && line.length < 100);
              
              if (fileName) {
                results.files.push({
                  id: dataId,
                  name: fileName,
                  type: 'file',
                  url: `https://drive.google.com/file/d/${dataId}/view`
                });
                results.debug.push(`Fallback item ${index + 1}: ${fileName} (${dataId})`);
              }
            }
          }
        });
      }
      
      return results;
    });

    console.log("📂 Debug info:", files.debug);
    console.log("📂 Jumlah file ditemukan:", files.files.length);
    
    if (files.files.length > 0) {
      console.log("📄 Daftar file:");
      files.files.forEach((file, index) => {
        console.log(`  ${index + 1}. [${file.type.toUpperCase()}] ${file.name}`);
      });
    }

    await browser.close();
    return {
      folderName: folderName,
      files: files.files
    };
    
  } catch (error) {
    console.error("❌ Error dalam getFileList:", error.message);
    await browser.close();
    return {
      folderName: "Unknown_Folder",
      files: []
    };
  }
}

async function downloadFile(fileId, name, targetDir, retries = config.MAX_RETRIES) {
  const sanitizedName = name.replace(/[<>:"/\\|?*]/g, '_');
  const filePath = path.join(targetDir, sanitizedName);
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`📥 Mencoba download: ${sanitizedName} (percobaan ${attempt}/${retries})`);
      
      // Coba direct download URL terlebih dahulu
      let url = `https://drive.google.com/uc?export=download&id=${fileId}`;
      
      const response = await axios({
        url,
        method: "GET",
        responseType: "stream",
        timeout: config.TIMEOUT,
        maxRedirects: 5,
        headers: {
          'User-Agent': config.USER_AGENT
        }
      });

      // Cek apakah response adalah halaman konfirmasi download
      const contentType = response.headers['content-type'];
      if (contentType && contentType.includes('text/html')) {
        console.log(`⚠️  File ${sanitizedName} memerlukan konfirmasi download, mencoba method alternatif...`);
        
        // Gunakan URL alternatif untuk file besar
        url = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
        
        const retryResponse = await axios({
          url,
          method: "GET",
          responseType: "stream",
          timeout: config.TIMEOUT,
          maxRedirects: 5,
          headers: {
            'User-Agent': config.USER_AGENT
          }
        });
        
        return new Promise((resolve, reject) => {
          const writer = fs.createWriteStream(filePath);
          retryResponse.data.pipe(writer);
          
          writer.on("finish", () => {
            console.log(`✅ Download selesai: ${sanitizedName}`);
            resolve(filePath);
          });
          
          writer.on("error", (err) => {
            console.error(`❌ Error menulis file: ${err.message}`);
            reject(err);
          });
        });
      }

      return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);
        
        writer.on("finish", () => {
          console.log(`✅ Download selesai: ${sanitizedName}`);
          resolve(filePath);
        });
        
        writer.on("error", (err) => {
          console.error(`❌ Error menulis file: ${err.message}`);
          reject(err);
        });
      });
      
    } catch (error) {
      console.error(`❌ Error download percobaan ${attempt}: ${error.message}`);
      
      if (attempt === retries) {
        throw new Error(`Gagal download ${sanitizedName} setelah ${retries} percobaan: ${error.message}`);
      }
      
      // Tunggu sebelum retry
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
}

async function main() {
  try {
    console.log("🚀 Memulai scraping Google Drive Multi-Folder...");
    console.log("📁 Download Directory:", DOWNLOAD_DIR);
    console.log("📄 URLs File:", URLS_FILE);
    console.log("=".repeat(60));
    
    // Baca daftar URLs dari file
    const folderUrls = readUrlsFromFile(URLS_FILE);
    
    if (folderUrls.length === 0) {
      console.log("❌ Tidak ada URL folder yang valid ditemukan!");
      console.log("💡 Tips:");
      console.log(`   - Periksa file ${URLS_FILE}`);
      console.log("   - Pastikan URL memiliki format: https://drive.google.com/drive/folders/FOLDER_ID");
      console.log("   - Hapus tanda # di depan URL untuk mengaktifkannya");
      return;
    }
    
    console.log(`📂 Ditemukan ${folderUrls.length} folder untuk di-scrape:`);
    folderUrls.forEach((url, index) => {
      const folderId = url.match(/\/folders\/([a-zA-Z0-9_-]+)/)?.[1] || 'Unknown';
      console.log(`   ${index + 1}. ${folderId}`);
    });
    console.log("-".repeat(60));
    
    let totalSuccessFiles = 0;
    let totalFailFiles = 0;
    let totalFoldersProcessed = 0;
    let totalFilesFound = 0;
    
    // Process setiap folder
    for (let folderIndex = 0; folderIndex < folderUrls.length; folderIndex++) {
      const folderUrl = folderUrls[folderIndex];
      const folderNumber = folderIndex + 1;
      
      console.log(`\n🗂️  [FOLDER ${folderNumber}/${folderUrls.length}] Memproses folder...`);
      console.log(`🔗 URL: ${folderUrl}`);
      
      try {
        // Dapatkan daftar file dan nama folder
        const result = await getFileList(folderUrl);
        const { folderName, files } = result;
        
        if (files.length === 0) {
          console.log(`⚠️  Folder "${folderName}" kosong atau tidak dapat diakses.`);
          continue;
        }
        
        // Buat direktori untuk folder ini
        const folderDir = path.join(DOWNLOAD_DIR, folderName);
        if (!fs.existsSync(folderDir)) {
          fs.mkdirSync(folderDir, { recursive: true });
          console.log(`📁 Dibuat direktori: ${folderDir}`);
        }
        
        console.log(`✅ Folder "${folderName}" - Ditemukan ${files.length} file`);
        
        // Filter hanya file (bukan subfolder)
        const filesToDownload = files.filter(f => f.type === 'file');
        const subfoldersFound = files.filter(f => f.type === 'folder');
        
        totalFilesFound += files.length;
        
        if (subfoldersFound.length > 0) {
          console.log(`📁 Subfolder ditemukan: ${subfoldersFound.length} (akan dilewati)`);
        }
        
        if (filesToDownload.length > 0) {
          console.log(`📥 Akan mendownload ${filesToDownload.length} file ke: ${folderDir}`);
          console.log("-".repeat(40));
          
          let folderSuccessCount = 0;
          let folderFailCount = 0;
          
          // Download setiap file dalam folder ini
          for (let fileIndex = 0; fileIndex < filesToDownload.length; fileIndex++) {
            const file = filesToDownload[fileIndex];
            
            try {
              console.log(`📥 [${fileIndex + 1}/${filesToDownload.length}] ${file.name}`);
              await downloadFile(file.id, file.name, folderDir);
              folderSuccessCount++;
              totalSuccessFiles++;
            } catch (error) {
              console.error(`❌ Gagal download ${file.name}: ${error.message}`);
              folderFailCount++;
              totalFailFiles++;
            }
            
            // Jeda antar download
            if (fileIndex < filesToDownload.length - 1) {
              await new Promise(resolve => setTimeout(resolve, config.DELAY_BETWEEN_DOWNLOADS));
            }
          }
          
          console.log(`✅ Folder "${folderName}" selesai: ${folderSuccessCount} berhasil, ${folderFailCount} gagal`);
        } else {
          console.log(`📝 Folder "${folderName}" tidak memiliki file untuk didownload`);
        }
        
        totalFoldersProcessed++;
        
        // Jeda antar folder
        if (folderIndex < folderUrls.length - 1) {
          console.log("⏳ Menunggu sebelum memproses folder berikutnya...");
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
      } catch (error) {
        console.error(`❌ Error memproses folder ${folderNumber}: ${error.message}`);
      }
    }
    
    // Ringkasan akhir
    console.log("\n" + "=".repeat(60));
    console.log("🎯 RINGKASAN AKHIR:");
    console.log(`📂 Total folder diproses: ${totalFoldersProcessed}/${folderUrls.length}`);
    console.log(`📄 Total file ditemukan: ${totalFilesFound}`);
    console.log(`✅ Total file berhasil didownload: ${totalSuccessFiles}`);
    console.log(`❌ Total file gagal didownload: ${totalFailFiles}`);
    console.log(`📁 File disimpan di: ${DOWNLOAD_DIR}`);
    console.log("=".repeat(60));
    
  } catch (error) {
    console.error("💥 Error dalam main function:", error.message);
    console.error("Stack trace:", error.stack);
  }
}

// Jalankan program
console.log("🎯 Google Drive Multi-Folder Scraper v3.0");
console.log("📂 Support untuk multiple folder URLs dari file txt");
console.log("=".repeat(60));
main().catch(error => {
  console.error("💥 Unhandled error:", error);
  process.exit(1);
});
