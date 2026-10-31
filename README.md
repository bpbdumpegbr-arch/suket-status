# SIP-Surat Status

Aplikasi pembuatan **Surat Keterangan Belum Menikah** dan **Surat Keterangan Status Janda/Duda** untuk Kelurahan Karang Ambun, Kecamatan Tanjung Redeb, Kabupaten Berau.

Repositori ini berisi **frontend statis** (HTML, CSS, JavaScript). Data dan logika berjalan di backend Google Apps Script yang dipanggil lewat `fetch()`.

## Struktur

```
index.html
css/style.css
js/config.js   ← isi GAS_URL di sini
js/api.js      ← komunikasi ke Apps Script
js/app.js      ← logika aplikasi
```

## Konfigurasi

Buka `js/config.js` dan isi `GAS_URL` dengan URL Web App Apps Script (berakhiran `/exec`).

Panduan pemasangan lengkap ada di [PANDUAN-INSTALASI.md](PANDUAN-INSTALASI.md).
