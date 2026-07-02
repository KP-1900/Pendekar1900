// === KONFIGURASI SUPABASE ===
(function() {
const SUPABASE_URL = 'https://gnytuyapiiickrieoboh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdueXR1eWFwaWlpY2tyaWVvYm9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NDAzMzksImV4cCI6MjA5NzMxNjMzOX0.-oa4YA-U8TDzWfrSHd9EkbnLNB8IyObFw0SziIkIpQo';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let grafikGarisPSW, grafikGarisHT, grafikBatangKategori;

const semuaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// Expose ke global agar bisa dipanggil dari onclick di HTML
window.toggleDdBeranda = function(id) {
    const list = document.getElementById('list-' + id);
    if (!list) return;
    ['list-tahun-beranda','list-bulan-beranda'].forEach(lid => {
        if (lid !== 'list-' + id) {
            const el = document.getElementById(lid);
            if (el) el.style.display = 'none';
        }
    });
    list.style.display = list.style.display === 'none' ? 'block' : 'none';
};

// Tutup dropdown beranda saat klik di luar
document.addEventListener('click', function(e) {
    const wT = document.getElementById('wr-tahun-beranda');
    const wB = document.getElementById('wr-bulan-beranda');
    if (wT && !wT.contains(e.target)) {
        const l = document.getElementById('list-tahun-beranda');
        if (l) l.style.display = 'none';
    }
    if (wB && !wB.contains(e.target)) {
        const l = document.getElementById('list-bulan-beranda');
        if (l) l.style.display = 'none';
    }
});

// === INISIALISASI AWAL ===
isiDropdownTahun().then(async () => {
    const tahun = parseInt(document.getElementById('filter-tahun').value);
    await isiDropdownBulan(tahun);
    tarikData();
});

// === KONDISI UPDATE: ambil baris dengan updated_at terbaru dari tabel absensi ===
(async function tampilkanKondisiUpdate() {
    try {
        const { data, error } = await db
            .from('absensi')
            .select('updated_at')
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

        const el = document.getElementById('teks-kondisi-update');
        if (!el) return;

        if (error || !data || !data.updated_at) {
            el.textContent = 'Belum ada data';
            return;
        }

        const tgl = new Date(data.updated_at);
        const pad = n => String(n).padStart(2, '0');
        const format = `${pad(tgl.getDate())}/${pad(tgl.getMonth()+1)}/${tgl.getFullYear()} ${pad(tgl.getHours())}.${pad(tgl.getMinutes())} WIB`;
        el.textContent = format;
    } catch(e) {
        const el = document.getElementById('teks-kondisi-update');
        if (el) el.textContent = 'Tidak tersedia';
    }
})();

// === HELPER: buat item custom dropdown beranda ===
function buatItemBeranda(teks, onClick) {
    const item = document.createElement('div');
    item.textContent = teks;
    item.style.cssText = 'padding:9px 16px; cursor:pointer; font-size:13px; color:#1a233a; border-bottom:1px solid #f0f0f0; white-space:nowrap;';
    item.onmouseover = () => item.style.background = '#e6f0fa';
    item.onmouseout = () => item.style.background = '';
    item.onclick = (e) => { e.stopPropagation(); onClick(); };
    return item;
}

// === FUNGSI DROPDOWN TAHUN BERANDA ===
async function isiDropdownTahun() {
    const { data, error } = await db.from('absensi').select('tahun');
    if (error || !data) return;

    const tahunUnik = [...new Set(data.map(d => d.tahun))].sort();
    const list = document.getElementById('list-tahun-beranda');
    const disp = document.getElementById('disp-tahun-beranda');
    const inp = document.getElementById('filter-tahun');
    if (!list || !disp || !inp) return;

    list.innerHTML = '';
    tahunUnik.forEach(t => {
        list.appendChild(buatItemBeranda(String(t), () => {
            inp.value = t;
            disp.textContent = t;
            list.style.display = 'none';
            document.getElementById('filter-bulan').value = 'Semua';
            document.getElementById('disp-bulan-beranda').textContent = 'Semua';
            sessionStorage.setItem('beranda_filter_tahun', t);
            sessionStorage.setItem('beranda_filter_bulan', 'Semua');
            isiDropdownBulan(t).then(() => tarikData());
        }));
    });

    const savedTahun = sessionStorage.getItem('beranda_filter_tahun');
    const val = savedTahun && tahunUnik.includes(parseInt(savedTahun)) ? parseInt(savedTahun) : tahunUnik[tahunUnik.length - 1];
    inp.value = val;
    disp.textContent = val;
    sessionStorage.setItem('beranda_filter_tahun', val);

    const areaFilter = document.getElementById('area-filter');
    if (areaFilter) areaFilter.style.visibility = 'visible';
}

// === FUNGSI DROPDOWN BULAN BERANDA ===
async function isiDropdownBulan(tahun) {
    const { data, error } = await db.from('absensi').select('bulan').eq('tahun', tahun);
    if (error || !data) return;

    const bulanTersedia = semuaBulan.filter(b => data.some(d => d.bulan === b));
    const list = document.getElementById('list-bulan-beranda');
    const disp = document.getElementById('disp-bulan-beranda');
    const inp = document.getElementById('filter-bulan');
    if (!list || !disp || !inp) return;

    list.innerHTML = '';
    const opsi = ['Semua', ...bulanTersedia];
    opsi.forEach(b => {
        list.appendChild(buatItemBeranda(b, () => {
            inp.value = b;
            disp.textContent = b;
            list.style.display = 'none';
            sessionStorage.setItem('beranda_filter_bulan', b);
            tarikData();
        }));
    });

    const savedBulan = sessionStorage.getItem('beranda_filter_bulan');
    const val = savedBulan && opsi.includes(savedBulan) ? savedBulan : 'Semua';
    inp.value = val;
    disp.textContent = val;
}

// === FUNGSI UTAMA: MENARIK DATA DARI SUPABASE ===
async function tarikData() {
    const tahun = parseInt(document.getElementById('filter-tahun').value);
    const bulan = document.getElementById('filter-bulan').value;

    try {
        const { data: dataMentah, error } = await db
            .from('absensi') 
            .select('*')
            .eq('tahun', tahun);

        if (error) throw error;

        const dataValid = dataMentah || [];
        const dataKartu = bulan === 'Semua' ? dataValid : dataValid.filter(d => d.bulan === bulan);
        
        perbaruiKartu(dataKartu, bulan, tahun); 
        perbaruiTabel(dataKartu, bulan);
        perbaruiGrafikBatang(dataKartu);

        let labelBulan = [];
        let dataPSW = [];
        let dataHT = [];

        if (bulan === 'Semua') {
            semuaBulan.forEach(namaBulan => {
                let baris = dataValid.find(d => d.bulan === namaBulan);
                labelBulan.push(namaBulan);
                // === FIX: gunakan null untuk bulan yang belum ada data ===
                // agar garis grafik tidak turun ke 0 dan berhenti di bulan terakhir
                let valPsw = baris ? parseFloat(baris.psw) : null;
                let valHt  = baris ? parseFloat(baris.ht)  : null;
                dataPSW.push(valPsw !== null && !isNaN(valPsw) ? (valPsw * 100).toFixed(2) : null);
                dataHT.push(valHt  !== null && !isNaN(valHt)  ? (valHt  * 100).toFixed(2) : null);
            });
        } else {
            let idx = semuaBulan.indexOf(bulan);
            let namaSebelum = idx > 0 ? semuaBulan[idx - 1] : 'Desember';
            let namaSesudah = idx < 11 ? semuaBulan[idx + 1] : 'Januari';
            
            let valSebelumPsw = null, valSebelumHt = null;
            let valTengahPsw  = null, valTengahHt  = null;
            let valSesudahPsw = null, valSesudahHt = null;
            
            let barisTengah = dataValid.find(d => d.bulan === bulan);
            if(barisTengah) {
                valTengahPsw = parseFloat(barisTengah.psw) || 0;
                valTengahHt = parseFloat(barisTengah.ht) || 0;
            }
            
            if (idx < 11) {
                let barisSesudah = dataValid.find(d => d.bulan === namaSesudah);
                if(barisSesudah) {
                    valSesudahPsw = parseFloat(barisSesudah.psw) || 0;
                    valSesudahHt = parseFloat(barisSesudah.ht) || 0;
                }
            }
            
            if (idx > 0) {
                let barisSebelum = dataValid.find(d => d.bulan === namaSebelum);
                if(barisSebelum) {
                    valSebelumPsw = parseFloat(barisSebelum.psw) || 0;
                    valSebelumHt = parseFloat(barisSebelum.ht) || 0;
                }
            } else {
                try {
                    const { data: dataLalu, errorLalu } = await db
                        .from('absensi')
                        .select('psw, ht')
                        .eq('tahun', tahun - 1)
                        .eq('bulan', 'Desember');

                    if (!errorLalu && dataLalu && dataLalu.length > 0) {
                        valSebelumPsw = parseFloat(dataLalu[0].psw) || 0;
                        valSebelumHt = parseFloat(dataLalu[0].ht) || 0;
                    }
                } catch(e) {}
            }
            
            labelBulan = [namaSebelum, bulan, namaSesudah];
            dataPSW = [
                valSebelumPsw !== null ? (valSebelumPsw * 100).toFixed(2) : null,
                valTengahPsw  !== null ? (valTengahPsw  * 100).toFixed(2) : null,
                valSesudahPsw !== null ? (valSesudahPsw * 100).toFixed(2) : null
            ];
            dataHT = [
                valSebelumHt !== null ? (valSebelumHt * 100).toFixed(2) : null,
                valTengahHt  !== null ? (valTengahHt  * 100).toFixed(2) : null,
                valSesudahHt !== null ? (valSesudahHt * 100).toFixed(2) : null
            ];
        }

        perbaruiGrafik(labelBulan, dataPSW, dataHT);

    } catch (error) {
        console.error("Gagal menarik data dari Supabase:", error);
    }
}

function perbaruiKartu(data, bulanDipilih, tahunDipilih) {
    let totalHariKerja = 0, totalPsw = 0, totalHt = 0;
    let jumlahData = data.length;

    data.forEach(baris => {
        totalHariKerja += Number(baris.hari_kerja) || 0;
        totalPsw += Number(baris.psw) || 0;
        totalHt += Number(baris.ht) || 0;
    });

    let htmlPegawai = "0";
    let teksBawahPegawai = "Tidak ada data";

    if (jumlahData > 0) {
        if (bulanDipilih === 'Semua') {
            let pegawaiAwal = 0, pegawaiAkhir = 0;
            for (let i = 0; i < semuaBulan.length; i++) {
                let d = data.find(x => x.bulan === semuaBulan[i]);
                if (d && d.jumlah_pegawai) { pegawaiAwal = Number(d.jumlah_pegawai); break; }
            }
            for (let i = semuaBulan.length - 1; i >= 0; i--) {
                let d = data.find(x => x.bulan === semuaBulan[i]);
                if (d && d.jumlah_pegawai) { pegawaiAkhir = Number(d.jumlah_pegawai); break; }
            }
            
            let sudahAdaDesember = data.some(x => x.bulan === 'Desember');
            let labelPerubahan = sudahAdaDesember ? "Awal vs Akhir Tahun" : "Awal Tahun vs Kondisi Terakhir";

            if (pegawaiAwal === pegawaiAkhir) {
                htmlPegawai = pegawaiAwal;
                teksBawahPegawai = "Stabil sepanjang tahun";
            } else {
                let warnaPanah = '#2b6cb0'; 
                if (pegawaiAkhir > pegawaiAwal) warnaPanah = '#28a745'; 
                else if (pegawaiAkhir < pegawaiAwal) warnaPanah = '#dc3545'; 
                
                htmlPegawai = `${pegawaiAwal} <span style="color:${warnaPanah}; font-size:18px; margin:0 4px;">➔</span> ${pegawaiAkhir}`;
                teksBawahPegawai = labelPerubahan;
            }
        } else {
            htmlPegawai = data[0].jumlah_pegawai || 0;
            teksBawahPegawai = `Total bulan ${bulanDipilih}`;
        }
    }

    let rataPsw = jumlahData > 0 ? ((totalPsw / jumlahData) * 100).toFixed(2) : "0.00";
    let rataHt = jumlahData > 0 ? ((totalHt / jumlahData) * 100).toFixed(2) : "0.00";

    let teksBawahUmum = bulanDipilih === 'Semua' ? "Total tahun terpilih" : `Total bulan ${bulanDipilih}`;
    let teksBawahRata = bulanDipilih === 'Semua' ? "Rata-rata tahun terpilih" : `Rata-rata bulan ${bulanDipilih}`;

    document.getElementById('angka-pegawai').innerHTML = htmlPegawai;
    document.getElementById('angka-pegawai').nextElementSibling.innerText = teksBawahPegawai;
    document.getElementById('angka-harikerja').innerText = totalHariKerja;
    document.getElementById('angka-harikerja').nextElementSibling.innerText = teksBawahUmum;
    document.getElementById('angka-psw').innerText = rataPsw + "%";
    document.getElementById('angka-psw').nextElementSibling.innerText = teksBawahRata;
    document.getElementById('angka-ht').innerText = rataHt + "%";
    document.getElementById('angka-ht').nextElementSibling.innerText = teksBawahRata;
}

function perbaruiGrafik(labelBulan, dataPSW, dataHT) {
    if (grafikGarisPSW) grafikGarisPSW.destroy();
    if (grafikGarisHT) grafikGarisHT.destroy();

    const opsiGrafik = { 
        responsive: true, 
        maintainAspectRatio: false, 
        plugins: { legend: { display: false } },
        scales: { 
            y: { beginAtZero: true },
            x: { 
                ticks: { 
                    autoSkip: false
                } 
            } 
        } 
    };

    const kanvasPSW = document.getElementById('grafikPSW').getContext('2d');
    grafikGarisPSW = new Chart(kanvasPSW, {
        type: 'line',
        data: {
            labels: labelBulan,
            datasets: [{
                label: 'PSW (%)', data: dataPSW,
                borderColor: '#6f42c1', backgroundColor: 'rgba(111, 66, 193, 0.1)',
                borderWidth: 3, tension: 0.3, fill: true,
                spanGaps: false  // === FIX: jangan hubungkan titik null ===
            }]
        }, options: opsiGrafik
    });

    const kanvasHT = document.getElementById('grafikHT').getContext('2d');
    grafikGarisHT = new Chart(kanvasHT, {
        type: 'line',
        data: {
            labels: labelBulan,
            datasets: [{
                label: 'HT (%)', data: dataHT,
                borderColor: '#f5a623', backgroundColor: 'rgba(245, 166, 35, 0.1)',
                borderWidth: 3, tension: 0.3, fill: true,
                spanGaps: false  // === FIX: jangan hubungkan titik null ===
            }]
        }, options: opsiGrafik
    });
}

function perbaruiTabel(data, bulanDipilih) {
    const tbody = document.getElementById('badan-tabel');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="13" style="padding: 10px; text-align: center; color: #666;">Tidak ada data pada periode ini</td></tr>';
        return;
    }

    let dataTabel = data;
    if (bulanDipilih === 'Semua') {
        dataTabel = semuaBulan.map(b => data.find(d => d.bulan === b)).filter(d => d !== undefined);
    }

    let tHk = 0;
    let tPsw = 0, tHt = 0, tPsw1 = 0, tPsw2 = 0, tPsw3 = 0, tPsw4 = 0;
    let tTl1 = 0, tTl2 = 0, tTl3 = 0, tTl4 = 0;
    let jmlData = dataTabel.length;

    const tentukanWarnaSub = (teksAngka) => {
        let nilai = parseFloat(teksAngka) || 0;
        if (nilai === 0) return 'color: #28a745; font-weight: bold;'; 
        return 'color: #dc3545; font-weight: bold;'; 
    };

    dataTabel.forEach(item => {
        tHk += Number(item.hari_kerja) || 0;
        tPsw += Number(item.psw) || 0;
        tHt += Number(item.ht) || 0;
        tPsw1 += Number(item.psw1) || 0;
        tPsw2 += Number(item.psw2) || 0;
        tPsw3 += Number(item.psw3) || 0;
        tPsw4 += Number(item.psw4) || 0;
        tTl1 += Number(item.tl1) || 0;
        tTl2 += Number(item.tl2) || 0;
        tTl3 += Number(item.tl3) || 0;
        tTl4 += Number(item.tl4) || 0;

        let pegawai = item.jumlah_pegawai || 0;
        let hk = item.hari_kerja || 0;
        let psw = (Number(item.psw) * 100).toFixed(2);
        let ht = (Number(item.ht) * 100).toFixed(2);
        let psw1 = (Number(item.psw1) * 100).toFixed(2);
        let psw2 = (Number(item.psw2) * 100).toFixed(2);
        let psw3 = (Number(item.psw3) * 100).toFixed(2);
        let psw4 = (Number(item.psw4) * 100).toFixed(2);
        let tl1 = (Number(item.tl1) * 100).toFixed(2);
        let tl2 = (Number(item.tl2) * 100).toFixed(2);
        let tl3 = (Number(item.tl3) * 100).toFixed(2);
        let tl4 = (Number(item.tl4) * 100).toFixed(2);
        
        tbody.innerHTML += `
            <tr style="border-bottom: 1px solid #edf2f9;">
                <td style="padding: 8px; font-weight: bold;">${item.bulan}</td>
                <td style="padding: 8px;">${pegawai}</td>
                <td style="padding: 8px;">${hk}</td>
                <td style="padding: 8px; color: #f5a623; font-weight: bold;">${isNaN(ht) ? '0.00' : ht}%</td>
                <td style="padding: 8px; ${tentukanWarnaSub(tl1)}">${isNaN(tl1) ? '0.00' : tl1}%</td>
                <td style="padding: 8px; ${tentukanWarnaSub(tl2)}">${isNaN(tl2) ? '0.00' : tl2}%</td>
                <td style="padding: 8px; ${tentukanWarnaSub(tl3)}">${isNaN(tl3) ? '0.00' : tl3}%</td>
                <td style="padding: 8px; ${tentukanWarnaSub(tl4)}">${isNaN(tl4) ? '0.00' : tl4}%</td>
                <td style="padding: 8px; color: #6f42c1; font-weight: bold;">${isNaN(psw) ? '0.00' : psw}%</td>
                <td style="padding: 8px; ${tentukanWarnaSub(psw1)}">${isNaN(psw1) ? '0.00' : psw1}%</td>
                <td style="padding: 8px; ${tentukanWarnaSub(psw2)}">${isNaN(psw2) ? '0.00' : psw2}%</td>
                <td style="padding: 8px; ${tentukanWarnaSub(psw3)}">${isNaN(psw3) ? '0.00' : psw3}%</td>
                <td style="padding: 8px; ${tentukanWarnaSub(psw4)}">${isNaN(psw4) ? '0.00' : psw4}%</td>
            </tr>
        `;
    });

    if (jmlData > 0) {
        let rataPsw = ((tPsw / jmlData) * 100).toFixed(2);
        let rataHt = ((tHt / jmlData) * 100).toFixed(2);
        let rataPsw1 = ((tPsw1 / jmlData) * 100).toFixed(2);
        let rataPsw2 = ((tPsw2 / jmlData) * 100).toFixed(2);
        let rataPsw3 = ((tPsw3 / jmlData) * 100).toFixed(2);
        let rataPsw4 = ((tPsw4 / jmlData) * 100).toFixed(2);
        let rataTl1 = ((tTl1 / jmlData) * 100).toFixed(2);
        let rataTl2 = ((tTl2 / jmlData) * 100).toFixed(2);
        let rataTl3 = ((tTl3 / jmlData) * 100).toFixed(2);
        let rataTl4 = ((tTl4 / jmlData) * 100).toFixed(2);

        tbody.innerHTML += `
            <tr style="background-color: #eaedf2; color: #1a233a; font-weight: bold; border-top: 2px solid #707a8a;">
                <td style="padding: 10px 8px;">JUMLAH</td>
                <td style="padding: 10px 8px;">${dataTabel.length > 0 ? (dataTabel[dataTabel.length - 1].jumlah_pegawai || 0) : 0}</td>
                <td style="padding: 10px 8px;">${tHk}</td>
                <td style="padding: 10px 8px; color: #f5a623;">${rataHt}%</td>
                <td style="padding: 10px 8px; ${tentukanWarnaSub(rataTl1)}">${rataTl1}%</td>
                <td style="padding: 10px 8px; ${tentukanWarnaSub(rataTl2)}">${rataTl2}%</td>
                <td style="padding: 10px 8px; ${tentukanWarnaSub(rataTl3)}">${rataTl3}%</td>
                <td style="padding: 10px 8px; ${tentukanWarnaSub(rataTl4)}">${rataTl4}%</td>
                <td style="padding: 10px 8px; color: #6f42c1;">${rataPsw}%</td>
                <td style="padding: 10px 8px; ${tentukanWarnaSub(rataPsw1)}">${rataPsw1}%</td>
                <td style="padding: 10px 8px; ${tentukanWarnaSub(rataPsw2)}">${rataPsw2}%</td>
                <td style="padding: 10px 8px; ${tentukanWarnaSub(rataPsw3)}">${rataPsw3}%</td>
                <td style="padding: 10px 8px; ${tentukanWarnaSub(rataPsw4)}">${rataPsw4}%</td>
            </tr>
        `;
    }
}

function perbaruiGrafikBatang(data) {
    if (grafikBatangKategori) grafikBatangKategori.destroy();

    let tPsw1 = 0, tPsw2 = 0, tPsw3 = 0, tPsw4 = 0;
    let tTl1 = 0, tTl2 = 0, tTl3 = 0, tTl4 = 0;
    let len = data.length;

    data.forEach(d => {
        tPsw1 += Number(d.psw1) || 0;
        tPsw2 += Number(d.psw2) || 0;
        tPsw3 += Number(d.psw3) || 0;
        tPsw4 += Number(d.psw4) || 0;
        tTl1 += Number(d.tl1) || 0;
        tTl2 += Number(d.tl2) || 0;
        tTl3 += Number(d.tl3) || 0;
        tTl4 += Number(d.tl4) || 0;
    });

    let rataKategori = [
        len ? ((tTl1/len)*100).toFixed(2) : 0,
        len ? ((tTl2/len)*100).toFixed(2) : 0,
        len ? ((tTl3/len)*100).toFixed(2) : 0,
        len ? ((tTl4/len)*100).toFixed(2) : 0,
        len ? ((tPsw1/len)*100).toFixed(2) : 0,
        len ? ((tPsw2/len)*100).toFixed(2) : 0,
        len ? ((tPsw3/len)*100).toFixed(2) : 0,
        len ? ((tPsw4/len)*100).toFixed(2) : 0
    ];

    const ctx = document.getElementById('grafikBatang').getContext('2d');
    grafikBatangKategori = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['TL 1', 'TL 2', 'TL 3', 'TL 4', 'PSW 1', 'PSW 2', 'PSW 3', 'PSW 4'],
            datasets: [{
                label: 'Rata-rata (%)',
                data: rataKategori,
                backgroundColor: [
                    'rgba(245, 166, 35, 0.8)', 'rgba(245, 166, 35, 0.8)', 'rgba(245, 166, 35, 0.8)', 'rgba(245, 166, 35, 0.8)',
                    'rgba(111, 66, 193, 0.8)', 'rgba(111, 66, 193, 0.8)', 'rgba(111, 66, 193, 0.8)', 'rgba(111, 66, 193, 0.8)'
                ],
                borderRadius: 4 
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

})();
