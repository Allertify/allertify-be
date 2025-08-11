### **Backend Team: Standard Operating Procedure (SOP) & Workflow**

#### **1. Pendahuluan**

Dokumen ini bertujuan untuk menyelaraskan alur kerja, standar kualitas, dan cara komunikasi tim backend dalam pengembangan aplikasi Allertify. 

-----

#### **2. Alur Kerja Git & Pull Request (PR)**

**A. Strategi Branching**

  * **`main`**: Branch produksi. Hanya berisi kode yang 100% stabil dan sudah lolos semua pengujian. Tidak ada yang boleh melakukan *commit* langsung ke branch ini.
  * **`staging`**: Branch integrasi. Semua *feature branch* akan digabungkan ke sini untuk *Integration Testing*. Branch ini harus selalu dalam keadaan bisa berjalan.
  * **`feature branch`**: Branch untuk mengerjakan satu *issue* spesifik. Branch ini **selalu dibuat dari Linear** dan di-*merge* kembali ke `staging`.

**B. Penamaan Feature Branch (Dibuat dari Linear)**

Kita **TIDAK AKAN** membuat nama branch secara manual. Nama branch akan **dibuat secara otomatis** melalui fitur "Create Branch" di Linear untuk setiap *issue*.

  * **Format Otomatis dari Linear:** `<nama_anda>/<issue_id>-<judul-issue-dalam-kebab-case>`
  * **Contoh:** `rafif/TEA-12-implement-login-endpoint`
  * **Kenapa?** Nama ini mengandung ID Issue (`TEA-12`) yang krusial untuk menghubungkan PR dan *commit* secara otomatis ke tugas di Linear, menjaga semuanya tetap sinkron.

**C. Langkah-langkah Alur Kerja (Mulai dari Linear ke PR)**

1.  **Mulai dari Linear:** Buka *issue* yang akan Anda kerjakan di Linear. Assign ke diri sendiri dan ubah statusnya menjadi "In Progress".
2.  **Buat Branch dari Issue:** Klik tombol **"Create Branch"** di halaman *issue* Linear. Linear akan memberikan perintah `git checkout` dengan nama branch yang sudah diformat. Salin perintah tersebut.
3.  **Update & Jalankan Perintah Branch:** Buka terminal Anda.
      * Pertama, pastikan `staging` Anda adalah versi terbaru:
        ```bash
        git checkout staging
        git pull origin staging
        ```
      * Kemudian, tempel (paste) dan jalankan perintah yang Anda salin dari Linear:
        ```bash
        git checkout -b rafif/TEA-12-implement-login-endpoint
        ```
4.  **Kerjakan & Commit:** Lakukan pekerjaan Anda di *branch* baru ini. Buat *commit* secara berkala dengan pesan yang jelas (lihat Standar Penamaan Commit di bawah). Pastikan untuk menyertakan ID Issue di pesan *commit* (misal: `... [TEA-12]`).
5.  **Push ke Server:** Setelah selesai, *push branch* Anda ke GitHub.
    ```bash
    git push origin rafif/TEA-12-implement-login-endpoint
    ```
6.  **Buat Pull Request:** Buka GitHub. Buat PR dari *feature branch* Anda dengan target ke branch `staging`.
      * **Judul PR (PENTING):** Gunakan **Judul PR** yang jelas dengan format Conventional Commits. Di sinilah kita memberikan deskripsi yang rapi untuk manusia. Contoh: `feat(auth): Implement login endpoint with JWT`.
      * **Deskripsi PR:** Isi deskripsi sesuai template, jelaskan apa yang dikerjakan dan cara mengujinya.
      * **Assign Reviewer:** Tugaskan Backend Lead (Arvan) sebagai *reviewer*.
7.  **Proses Code Review:** Reviewer akan memberikan komentar. Lakukan diskusi dan perbaikan yang diminta langsung di dalam PR.
8.  **Merge PR:** Hanya Backend Lead yang boleh melakukan *merge* setelah PR disetujui dan semua *checks* lolos.
9.  **Hapus Branch:** Setelah di-*merge*, hapus *feature branch* tersebut melalui tombol di GitHub untuk menjaga kebersihan repositori.

-----

#### **3. Standar Penamaan Commit**

Kita akan menggunakan standar **Conventional Commits**. Ini membuat riwayat Git mudah dibaca dan bisa digunakan untuk otomatisasi di masa depan.

**Format:** `<type>(<scope>): <subject> [issue_id]`

  * **`<type>`**: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`.
  * **`<scope>`**: (Opsional) Bagian kode yang diubah (misal: `auth`, `scan`, `db`).
  * **`<subject>`**: Deskripsi singkat dalam bentuk kalimat perintah.
  * **`[issue_id]`**: (Wajib jika ada) ID issue dari Linear, misal: `[TEA-12]`.

**Contoh Commit:**

  * ❌  `git commit -m "update login"`
  * ✅  `git commit -m "feat(auth): implement jwt generation on successful login [TEA-12]"`
  * ✅  `git commit -m "fix(validation): add minimum length check for password [TEA-10]"`

-----

#### **4. Manajemen Tugas dengan Linear & Integrasi GitHub**

Semua pekerjaan harus dilacak melalui Linear untuk transparansi progres.

**A. Setup**

1.  Buka **Settings \> Integrations \> GitHub** di Linear.
2.  Hubungkan repositori `allertify-be` ke project Linear.
3.  Atur automasi: "When a Pull Request is merged" -\> "Change issue status to **Done**".

**B. Alur Kerja Harian**

Alur kerja harian mengikuti **Bagian 2.C** dari dokumen ini. Semuanya dimulai dari *issue* di Linear. Ketika PR di-*merge*, *issue* akan otomatis pindah ke kolom "Done". Alur kerja selesai.

-----

#### **5. Standar Kualitas Kode & Definisi "Selesai" (Definition of Done)**

Sebuah tugas/fitur baru dianggap **"Selesai"** jika memenuhi semua kriteria berikut:

  * [ ] Logika kode berfungsi sesuai dengan *Acceptance Criteria* di *user story*.
  * [ ] Kode lolos dari semua aturan linter (`npm run lint` tidak menghasilkan error).
  * [ ] Telah dibuatkan *unit/integration test* yang relevan dan semua tes lolos (`npm run test` berhasil).
  * [ ] Telah diuji secara manual di lingkungan lokal.
  * [ ] Pull Request telah di-review dan disetujui (`approved`).

Setiap anggota tim bertanggung jawab untuk memastikan semua poin di atas terpenuhi sebelum meminta *merge*.