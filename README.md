# Split Keun

Kalkulator patungan untuk makan bareng. Bagi tagihan secara adil per orang, lengkap dengan pajak, service, dan tip. Semua dihitung langsung di browser, tanpa akun dan tanpa upload data.

## Fitur

- **Dua cara bagi:** bagi rata, atau per item (pilih siapa yang ikut makan tiap item).
- **Biaya tambahan:** service (%), pajak (%), dan tip (Rp), dengan preset cepat seperti Restoran 5% + 10%.
- **Pembulatan per orang:** ke atas dengan kelipatan Rp100, Rp500, atau Rp1.000.
- **Hasil jelas:** total, rincian subtotal, dan jumlah yang harus dibayar tiap orang.
- **Bagikan:** salin rincian atau kirim langsung ke WhatsApp.
- **Tersimpan otomatis:** data tersimpan di localStorage browser.
- **Mode terang/gelap** dan tampilan responsif untuk mobile.

## Cara menghitung

1. Setiap orang punya **nilai dasar** (bagian tagihan sebelum biaya tambahan).
2. **Service** dihitung dari nilai dasar.
3. **Pajak** dihitung dari nilai dasar + service.
4. **Tip** (nominal tetap) dibagi sesuai proporsi nilai dasar masing-masing.
5. Jumlah akhir tiap orang **dibulatkan ke atas** sesuai pilihan pembulatan.

Item yang belum dibagi ke siapa pun tidak dihitung ke peserta, dan akan muncul peringatan di kartu hasil.

## Teknologi

HTML, CSS, dan JavaScript murni. Tanpa framework dan tanpa library tambahan (hanya Google Fonts untuk font).

## Struktur proyek

```
split-keun/
├── index.html      # Struktur halaman
├── css/
│   └── style.css   # Tampilan, tema terang/gelap, responsif
└── js/
    ├── calc.js     # Logika perhitungan (tanpa DOM)
    └── app.js      # Interaksi UI, penyimpanan, berbagi
```

## Menjalankan

Buka `index.html` langsung di browser, atau jalankan server statis:

```bash
npx serve .
```

## Deploy

Karena situs statis, bisa langsung di-deploy ke Vercel, Netlify, atau GitHub Pages tanpa langkah build.

## Catatan

Hasil perhitungan adalah estimasi untuk patungan antar teman. Selalu cocokkan dengan struk asli, terutama jika tempat makan memakai aturan pajak atau service yang berbeda.
