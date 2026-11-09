// =====================================================
// KasirKita - Aplikasi Kasir Rumah Makan Berbasis Web
// =====================================================

// 1. Variabel dan konstanta
const PAJAK = 0.1;
const MAKS_QTY = 99;

const daftarMenu = [
  { id: 1, nama: "Nasi Goreng", harga: 18000, kategori: "makanan", emoji: "🍛", rating: 4.8, desc: "Nasi goreng kecap dengan telur mata sapi dan kerupuk." },
  { id: 2, nama: "Mie Ayam", harga: 15000, kategori: "makanan", emoji: "🍜", rating: 4.7, desc: "Mie kenyal dengan ayam kecap, sawi, dan kuah kaldu." },
  { id: 3, nama: "Ayam Geprek", harga: 17000, kategori: "makanan", emoji: "🍗", rating: 4.9, desc: "Ayam goreng tepung digeprek dengan sambal bawang." },
  { id: 4, nama: "Soto Ayam", harga: 16000, kategori: "makanan", emoji: "🍲", rating: 4.6, desc: "Soto kuah kuning dengan suwiran ayam dan soun." },
  { id: 5, nama: "Es Teh Manis", harga: 5000, kategori: "minuman", emoji: "🥤", rating: 4.5, desc: "Teh melati dingin dengan gula asli." },
  { id: 6, nama: "Es Jeruk", harga: 7000, kategori: "minuman", emoji: "🍊", rating: 4.6, desc: "Perasan jeruk peras segar dengan es batu." },
  { id: 7, nama: "Kopi Susu", harga: 12000, kategori: "minuman", emoji: "☕", rating: 4.8, desc: "Kopi robusta dengan susu kental manis." },
  { id: 8, nama: "Kentang Goreng", harga: 10000, kategori: "camilan", emoji: "🍟", rating: 4.5, desc: "Kentang goreng renyah dengan saus sambal." },
  { id: 9, nama: "Pisang Goreng", harga: 8000, kategori: "camilan", emoji: "🍌", rating: 4.7, desc: "Pisang kepok goreng tepung, hangat dan manis." }
];

let keranjang = [];
let kategoriAktif = "semua";
let hasil = { subtotal: 0, potongan: 0, pajak: 0, total: 0, diskonValid: true, persen: 0 };

// 2. Ambil elemen HTML
const elMenu = document.getElementById("daftar-menu");
const elPesanan = document.getElementById("daftar-pesanan");
const elDiskon = document.getElementById("diskon");
const elCash = document.getElementById("cash");
const elErrDiskon = document.getElementById("error-diskon");
const elErrCash = document.getElementById("error-cash");
const elPesan = document.getElementById("pesan");
const elKembalian = document.getElementById("kembalian");
const elModal = document.getElementById("modal-struk");

// 3. Fungsi bantu
function formatRupiah(angka) {
  return "Rp " + angka.toLocaleString("id-ID");
}

function bacaAngka(teks) {
  // Terima pemisah ribuan titik maupun koma: "50.000" dan "50,000" -> 50000
  const bersih = teks.trim().replace(/[.,]/g, "");
  if (bersih === "" || !/^\d+$/.test(bersih)) return NaN;
  return Number(bersih);
}

// 4. Menampilkan menu
function tampilkanMenu() {
  elMenu.innerHTML = "";
  for (let i = 0; i < daftarMenu.length; i++) {
    const m = daftarMenu[i];
    if (kategoriAktif !== "semua" && m.kategori !== kategoriAktif) continue;

    elMenu.innerHTML += `
      <div class="card">
        <div class="img">${m.emoji}</div>
        <div class="top">
          <span class="name">${m.nama}</span>
          <span class="price">${formatRupiah(m.harga)}</span>
        </div>
        <p class="desc">${m.desc}</p>
        <div class="bottom">
          <span class="rating"><svg class="ic" aria-hidden="true"><use href="#i-star"/></svg> ${m.rating}</span>
          <button class="add" data-id="${m.id}"><svg class="ic" aria-hidden="true"><use href="#i-plus"/></svg> Tambah</button>
        </div>
      </div>`;
  }
}

// 5. Mengelola keranjang
function tambahKeKeranjang(id) {
  const menu = daftarMenu.find((m) => m.id === id);
  const item = keranjang.find((k) => k.id === id);

  if (item) {
    if (item.qty < MAKS_QTY) item.qty = item.qty + 1;
  } else {
    keranjang.push({ id: menu.id, nama: menu.nama, harga: menu.harga, emoji: menu.emoji, qty: 1 });
  }
  elPesan.textContent = "";
  perbarui();
}

function ubahJumlah(id, perubahan) {
  const item = keranjang.find((k) => k.id === id);
  if (!item) return;

  item.qty = item.qty + perubahan;
  if (item.qty > MAKS_QTY) {
    item.qty = MAKS_QTY;
  } else if (item.qty <= 0) {
    hapusItem(id);
    return;
  }
  perbarui();
}

function hapusItem(id) {
  keranjang = keranjang.filter((k) => k.id !== id);
  perbarui();
}

function tampilkanPesanan() {
  if (keranjang.length === 0) {
    elPesanan.innerHTML = '<p class="empty">Belum ada pesanan. Klik Tambah pada menu untuk mulai.</p>';
    return;
  }

  elPesanan.innerHTML = "";
  for (const item of keranjang) {
    elPesanan.innerHTML += `
      <div class="order-item">
        <div class="thumb">${item.emoji}</div>
        <div class="info">
          <div class="name">${item.nama}</div>
          <div class="price">${formatRupiah(item.harga * item.qty)}</div>
        </div>
        <div class="right">
          <button class="remove" data-hapus="${item.id}" aria-label="Hapus ${item.nama}"><svg class="ic" aria-hidden="true"><use href="#i-trash"/></svg></button>
          <div class="qty">
            <button data-kurang="${item.id}" aria-label="Kurangi">−</button>
            <span>${item.qty}</span>
            <button data-tambah="${item.id}" aria-label="Tambah">+</button>
          </div>
        </div>
      </div>`;
  }
}

// 6. Perhitungan
function hitung() {
  let subtotal = 0;
  for (const item of keranjang) subtotal = subtotal + item.harga * item.qty;

  const teksDiskon = elDiskon.value.trim();
  // Terima koma sebagai desimal ala Indonesia: "10,5" -> 10.5
  const normalDiskon = teksDiskon.replace(",", ".");
  let persen = 0;
  let diskonValid = true;

  if (teksDiskon === "") {
    persen = 0;
  } else if (isNaN(Number(normalDiskon))) {
    diskonValid = false;
    elErrDiskon.textContent = "Diskon harus berupa angka.";
  } else if (Number(normalDiskon) < 0 || Number(normalDiskon) > 100) {
    diskonValid = false;
    elErrDiskon.textContent = "Diskon harus antara 0 sampai 100.";
  } else {
    persen = Number(normalDiskon);
  }

  if (diskonValid) elErrDiskon.textContent = "";
  elDiskon.classList.toggle("invalid", !diskonValid);

  const potongan = Math.round(subtotal * persen / 100);
  const setelahDiskon = subtotal - potongan;
  const pajak = Math.round(setelahDiskon * PAJAK);
  const total = setelahDiskon + pajak;

  return { subtotal, potongan, pajak, total, diskonValid, persen };
}

// 7. Kembalian dan pembaruan tampilan
function tampilkanKembalian() {
  const bayar = bacaAngka(elCash.value);
  elKembalian.classList.remove("red");
  elKembalian.classList.add("green");

  if (elCash.value.trim() === "" || isNaN(bayar)) {
    elKembalian.textContent = "Rp 0";
  } else if (bayar < hasil.total) {
    elKembalian.classList.replace("green", "red");
    elKembalian.textContent = "Kurang " + formatRupiah(hasil.total - bayar);
  } else {
    elKembalian.textContent = formatRupiah(bayar - hasil.total);
  }
}

function perbarui() {
  tampilkanPesanan();
  hasil = hitung();
  document.getElementById("subtotal").textContent = formatRupiah(hasil.subtotal);
  document.getElementById("potongan").textContent = "- " + formatRupiah(hasil.potongan);
  document.getElementById("pajak").textContent = formatRupiah(hasil.pajak);
  document.getElementById("total").textContent = formatRupiah(hasil.total);
  tampilkanKembalian();
}

// 8. Proses pembayaran
function prosesBayar() {
  const teksCash = elCash.value.trim();
  const bayar = bacaAngka(teksCash);
  elPesan.textContent = "";
  elErrCash.textContent = "";
  elCash.classList.remove("invalid");

  if (keranjang.length === 0) {
    elPesan.textContent = "Keranjang masih kosong. Tambahkan menu terlebih dahulu.";
  } else if (!hasil.diskonValid) {
    elPesan.textContent = "Perbaiki isian diskon terlebih dahulu.";
  } else if (teksCash === "") {
    elErrCash.textContent = "Uang tunai belum diisi.";
    elCash.classList.add("invalid");
  } else if (isNaN(bayar) || bayar <= 0) {
    elErrCash.textContent = "Uang tunai harus berupa angka lebih dari 0.";
    elCash.classList.add("invalid");
  } else if (bayar < hasil.total) {
    elErrCash.textContent = "Uang tunai kurang " + formatRupiah(hasil.total - bayar) + ".";
    elCash.classList.add("invalid");
  } else {
    tampilkanStruk(bayar);
  }
}

function tampilkanStruk(bayar) {
  const sekarang = new Date();
  const noTransaksi = "TRX-" + sekarang.getTime().toString().slice(-6);
  let baris = "";

  for (const item of keranjang) {
    baris += `<div class="row"><span>${item.nama} x${item.qty}</span><span>${formatRupiah(item.harga * item.qty)}</span></div>`;
  }

  document.getElementById("isi-struk").innerHTML = `
    <div class="row"><span>KasirKita</span><span>${noTransaksi}</span></div>
    <div class="row"><span>${sekarang.toLocaleDateString("id-ID")}</span><span>${sekarang.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span></div>
    <hr>
    ${baris}
    <hr>
    <div class="row"><span>Subtotal</span><span>${formatRupiah(hasil.subtotal)}</span></div>
    <div class="row"><span>Diskon (${hasil.persen}%)</span><span class="red">- ${formatRupiah(hasil.potongan)}</span></div>
    <div class="row"><span>Pajak (10%)</span><span>${formatRupiah(hasil.pajak)}</span></div>
    <div class="row total"><span>Total</span><span class="green">${formatRupiah(hasil.total)}</span></div>
    <div class="row"><span>Tunai</span><span>${formatRupiah(bayar)}</span></div>
    <div class="row"><span>Kembalian</span><span class="green">${formatRupiah(bayar - hasil.total)}</span></div>
    <hr>
    <p style="text-align:center;margin-bottom:12px">Terima kasih atas kunjungan Anda</p>`;
  elModal.classList.add("show");
}

function transaksiBaru() {
  keranjang = [];
  elDiskon.value = "";
  elCash.value = "";
  elErrCash.textContent = "";
  elCash.classList.remove("invalid");
  elPesan.textContent = "";
  elModal.classList.remove("show");
  perbarui();
}

// 9. Event pengguna
document.getElementById("kategori").addEventListener("click", (e) => {
  const tombol = e.target.closest("button");
  if (!tombol) return;
  document.querySelectorAll("#kategori button").forEach((b) => b.classList.remove("active"));
  tombol.classList.add("active");
  kategoriAktif = tombol.dataset.kategori;
  tampilkanMenu();
});

elMenu.addEventListener("click", (e) => {
  const tombol = e.target.closest(".add");
  if (tombol) tambahKeKeranjang(Number(tombol.dataset.id));
});

elPesanan.addEventListener("click", (e) => {
  const tombol = e.target.closest("button");
  if (!tombol) return;
  if (tombol.dataset.tambah) ubahJumlah(Number(tombol.dataset.tambah), 1);
  else if (tombol.dataset.kurang) ubahJumlah(Number(tombol.dataset.kurang), -1);
  else if (tombol.dataset.hapus) hapusItem(Number(tombol.dataset.hapus));
});

document.getElementById("uang-cepat").addEventListener("click", (e) => {
  const tombol = e.target.closest("button");
  if (!tombol) return;

  if (tombol.dataset.nominal === "pas") {
    elCash.value = hasil.total.toLocaleString("id-ID");
  } else {
    elCash.value = Number(tombol.dataset.nominal).toLocaleString("id-ID");
  }
  elErrCash.textContent = "";
  elCash.classList.remove("invalid");
  tampilkanKembalian();
});

elDiskon.addEventListener("input", perbarui);
elCash.addEventListener("input", () => {
  elErrCash.textContent = "";
  elCash.classList.remove("invalid");
  tampilkanKembalian();
});
document.getElementById("tombol-bayar").addEventListener("click", prosesBayar);
document.getElementById("tombol-baru").addEventListener("click", transaksiBaru);

// 10. Mulai aplikasi
document.getElementById("tanggal").textContent = new Date().toLocaleDateString("id-ID", {
  weekday: "long", day: "numeric", month: "long", year: "numeric"
});
tampilkanMenu();
perbarui();
