# Panduan Instalasi — SIP-Surat Status (Kelurahan Karang Ambun)

Aplikasi ini terdiri dari dua bagian yang dipasang terpisah:

| Bagian | Dipasang di | Berkas |
|---|---|---|
| **Backend** (database dan logika) | Google Apps Script | `Kode.gs` dan `appsscript.json` (dikirim terpisah, **tidak ada di ZIP ini**) |
| **Frontend** (tampilan) | GitHub Pages | seluruh isi folder ini |

Kerjakan **backend dulu**, karena frontend membutuhkan URL dari backend.

---

## BAGIAN 1 — Backend (Google Apps Script)

### A. Pemasangan baru (belum pernah punya proyek ini)

1. Buka https://script.google.com, lalu klik **Proyek baru**.
2. Ganti nama berkas `Code.gs` menjadi `Kode`, lalu hapus isinya dan tempel seluruh isi `Kode.gs`.
3. Klik ikon roda gigi (**Project Settings**), centang **Show "appsscript.json" manifest file in editor**. Kembali ke editor, buka `appsscript.json`, hapus isinya, lalu tempel isi `appsscript.json` yang dikirim terpisah.
4. Jalankan **`setupAppEnvironment`** — **hanya sekali**:
   - Pilih fungsi `setupAppEnvironment` di dropdown, lalu klik **Run**.
   - Klik **Review permissions** dan izinkan akses Drive dan Sheets.
   - Buka **Execution log**. Pastikan muncul alamat Spreadsheet dan Folder, serta daftar akun awal.
   - Di Google Drive akan terbentuk folder `SIP_Surat_Status_Karang_Ambun` berisi database dan folder PDF.
5. **Deploy** → **New deployment** → ikon roda gigi → **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Klik **Deploy**, lalu **salin URL yang berakhiran `/exec`**. Simpan, karena dibutuhkan di Bagian 2.

### B. Migrasi dari versi sebelumnya (proyek sudah berjalan)

Data Anda **tidak perlu dipindah** dan **jangan menjalankan `setupAppEnvironment` lagi**.

1. Buka proyek Apps Script yang lama.
2. Ganti seluruh isi `Kode.gs` dengan versi baru. Ganti juga isi `appsscript.json` (lihat langkah A.3).
3. Hapus berkas `Index`, `Stylesheet`, dan `JavaScript` (tampilan lama sudah pindah ke GitHub). Menghapusnya aman.
4. **Deploy** → **Manage deployments** → ikon pensil pada deployment yang ada → **Version: New version** → **Deploy**. URL `/exec` tetap sama.

### Akun awal (pemasangan baru)

| Username | Kata sandi awal | Peran |
|---|---|---|
| `admin` | `admin123` | Admin |
| `petugas` | `petugas123` | Petugas |
| `pejabat` | `pejabat123` | Pejabat |

> **Segera ganti** kata sandi ketiganya lewat menu **Pengguna** setelah login pertama. Ganti juga nama pejabat contoh lewat menu **Pejabat Penandatangan**.

---

## BAGIAN 2 — Frontend (GitHub Pages)

### Folder kerja

Ekstrak `suket-status-frontend.zip`. Anda akan mendapat satu folder bernama **`suket-status`**, dan **folder inilah** tempat `git init` dijalankan. Isinya harus langsung terlihat:

```
suket-status/
├── index.html      ← harus terlihat di sini, bukan di subfolder
├── README.md
├── PANDUAN-INSTALASI.md
├── css/
│   └── style.css
└── js/
    ├── config.js   ← satu-satunya file yang Anda edit
    ├── api.js
    └── app.js
```

> Jangan masuk lebih dalam (`css/` atau `js/`) dan jangan naik satu level. Kalau `dir` / `ls` tidak menampilkan `index.html`, Anda berada di folder yang salah.

### Langkah singkat

1. **Isi URL backend.** Buka `js/config.js`, ganti `PASTE_URL_EXEC_DISINI` dengan URL `/exec` dari Bagian 1, lalu simpan.
2. **Pasang Git** (https://git-scm.com/download/win untuk Windows) dan buat akun di https://github.com.
3. **Buat repository baru** di GitHub: tombol **+** → **New repository**. Pilih **Public** dan **jangan** centang README / .gitignore / license.
4. **Buka terminal di folder `suket-status`.** Di Windows: buka folder di File Explorer, klik address bar, ketik `powershell`, lalu Enter. Cek dengan `dir`. Wajib terlihat `index.html`, `css`, dan `js`.
5. **Kirim ke GitHub**, satu per satu:
   ```bash
   git init
   git add .
   git commit -m "Upload pertama"
   git branch -M main
   git remote add origin https://github.com/USERNAME/NAMA-REPO.git
   git push -u origin main
   ```
   Saat diminta password, tempel **Personal Access Token** (bukan password akun). Layar tidak menampilkan apa pun saat Anda mengetik atau menempel. Itu normal.
6. **Aktifkan Pages:** di repo, **Settings** → **Pages** → Source **Deploy from a branch** → Branch **main** / **(root)** → **Save**. Centang **Enforce HTTPS**.
7. Tunggu 1–2 menit. Situs tayang di `https://USERNAME.github.io/NAMA-REPO/`.

### Update di kemudian hari

Dari folder `suket-status`:
```bash
git add .
git commit -m "Deskripsi perubahan"
git push
```
Kalau tampilan masih lama, tekan **Ctrl+Shift+R**.

---

## Uji setelah terpasang

1. Buka URL GitHub Pages dan pastikan halaman login tampil.
2. Login sebagai `admin`. Dashboard harus terbuka.
3. Buat satu surat, lalu cek bahwa barisnya muncul di Spreadsheet database.
4. Di Chrome tekan **F12** → tab **Console**. Tidak boleh ada error merah.

## Masalah umum

| Gejala | Penyebab | Solusi |
|---|---|---|
| Toast "GAS_URL belum diisi" | `js/config.js` masih berisi tulisan contoh | Isi URL `/exec`, lalu push ulang |
| "Respons server tidak valid" | Akses Web App belum **Anyone**, atau URL bukan `/exec` | Deploy ulang dengan akses Anyone, lalu salin URL yang benar |
| Perubahan backend tidak berefek | Belum membuat versi deployment baru | Manage deployments → New version |
| Halaman 404 di GitHub Pages | Folder yang di-push salah | Buka repo di browser: `index.html` harus terlihat di root |
| Halaman tanpa warna / gaya | Folder `css/` atau `js/` tidak ikut ter-push | Push ulang dari folder `suket-status` |
| Terlalu banyak percobaan gagal | 5 kali salah kata sandi | Tunggu 10 menit |
