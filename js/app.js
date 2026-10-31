/** SIP-Surat Status — Frontend (GitHub Pages). SPA murni; seluruh data lewat fetch() ke REST API Google Apps Script. */
const ALL = ['Admin', 'Petugas', 'Pejabat'], AP = ['Admin', 'Petugas'], AJ = ['Admin', 'Pejabat'], AD = ['Admin'];
const NAV = [
  ['dashboard', 'bi-house', 'Beranda / Dashboard', ALL],
  ['buat', 'bi-file-earmark-plus', 'Buat Surat', AP],
  ['daftar', 'bi-folder2-open', 'Daftar & Riwayat Surat', ALL],
  ['laporan', 'bi-bar-chart', 'Laporan & Statistik', AJ],
  ['pengguna', 'bi-people', 'Pengguna', AD],
  ['pejabat', 'bi-person-badge', 'Pejabat Penandatangan', AD],
  ['pengaturan', 'bi-gear', 'Template, Kop & Nomor', AD]
];
const BLN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const S = { token: null, user: null, cfg: {}, nomor: [], logo: '', pejabat: [], surat: null, view: [], pg: 1, chart: null, lapData: null, cur: null, page: '', mk: '', mid: '' };
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tglIndo = d => { const t = String(d).slice(0, 10).split('-'); return +t[2] + ' ' + BLN[t[1] - 1] + ' ' + t[0]; };
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const pjName = id => (S.pejabat.find(p => p.ID === id) || {}).Nama || '-';

// ════════ UI UTIL ════════
let _b = 0;
function busy(on) { _b += on ? 1 : -1; $('busy').style.opacity = _b > 0 ? 1 : 0; }
function toast(title, msg, type) {
  const el = $('appToast'); $('toastTitle').textContent = title; $('toastBody').textContent = msg;
  el.style.borderLeft = '4px solid ' + ({ success: '#1F6B53', danger: '#DC2626', warning: '#C9A24B' }[type] || '#0369A1');
  bootstrap.Toast.getOrCreateInstance(el, { delay: 4000 }).show();
}
function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t); document.documentElement.setAttribute('data-bs-theme', t);
  try { localStorage.setItem('theme', t); } catch (e) {}
  if (S.page === 'laporan' && S.lapData) drawChart(S.lapData);
}
function toggleTheme() { setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); }
function openSide() { $('sidebar').classList.add('show'); $('scrim').classList.add('show'); }
function closeSide() { $('sidebar').classList.remove('show'); $('scrim').classList.remove('show'); }

// Semua panggilan server lewat satu fungsi (fetch ke Apps Script). Token hanya dikirim di body POST, tidak pernah di URL.
async function api(fn, p) {
  busy(1);
  try {
    let r;
    try { r = await callGas({ action: fn, token: S.token, data: p || {} }); }
    catch (e) { toast('Gagal terhubung', e.message, 'danger'); throw e; }
    if (r.code === 'LOGIN') { toast('Sesi berakhir', 'Silakan masuk kembali.', 'warning'); showLogin(); throw new Error(r.message); }
    if (!r.success) { toast('Gagal', r.message, 'danger'); throw new Error(r.message); }
    return r.data;
  } finally { busy(0); }
}
window.addEventListener('unhandledrejection', e => e.preventDefault()); // pesan galat sudah ditampilkan lewat toast

// ════════ LOGIN / LOGOUT / NAVIGASI ════════
function showLogin() {
  clearSession(); S.token = null; S.user = null; S.surat = null; closeSide();
  $('appView').hidden = true; $('loginView').hidden = false; $('lgP').value = '';
}
async function doLoginUi(e) {
  e.preventDefault(); const b = e.submitter; if (b) b.disabled = true; busy(1);
  try {
    const r = await callGas({ action: 'login', data: { username: $('lgU').value, password: $('lgP').value } });
    if (!r.success) return toast('Gagal masuk', r.message, 'danger');
    S.token = r.data.token; S.user = r.data; saveSession({ token: S.token });
    startApp();
  } catch (x) { toast('Gagal terhubung', x.message, 'danger'); }
  finally { busy(0); if (b) b.disabled = false; }
}
function logout() { callGas({ action: 'logout', token: S.token }).catch(() => {}); showLogin(); }
async function startApp() {
  $('loginView').hidden = true; $('appView').hidden = false;
  $('uName').textContent = S.user.nama; $('uRole').textContent = S.user.peran;
  renderNavigation();
  try {
    const d = await api('bootstrap'); // satu panggilan: kop, nomor, logo, daftar pejabat
    S.cfg = d.cfg; S.nomor = d.nomor; S.logo = d.logoData; S.pejabat = d.pejabat;
    $('brandLogo').src = S.logo; $('brandLogo').hidden = !S.logo;
  } catch (e) {}
  if (!S.token) return; // sesi berakhir saat memuat
  navigateTo('dashboard');
}
function renderNavigation() {
  $('nav').innerHTML = NAV.filter(n => n[3].includes(S.user.peran)).map(n =>
    `<li><a href="javascript:void(0)" class="nav-l" data-p="${n[0]}" onclick="navigateTo('${n[0]}')"><i class="bi ${n[1]}"></i><span>${n[2]}</span></a></li>`).join('');
}
function navigateTo(p, opt) {
  const n = NAV.find(x => x[0] === p);
  if (!n || !n[3].includes(S.user.peran)) { p = 'dashboard'; }
  S.page = p;
  document.querySelectorAll('.page').forEach(e => e.classList.toggle('on', e.id === 'page-' + p));
  document.querySelectorAll('.nav-l').forEach(a => a.classList.toggle('on', a.dataset.p === p));
  $('pageTitle').textContent = NAV.find(x => x[0] === p)[2]; closeSide(); window.scrollTo(0, 0);
  const go = { dashboard: loadDash, buat: initBuat, daftar: loadDaftar, laporan: loadLaporan, pengguna: () => loadMaster('pengguna'), pejabat: () => loadMaster('pejabat'), pengaturan: loadPengaturan };
  go[p](opt);
}

// ════════ DASHBOARD ════════
const pill = s => s.Jenis === 'Belum Menikah' ? '<span class="pill">Belum Menikah</span>' : `<span class="pill jd">Janda/Duda (${esc(s.JenisCerai)})</span>`;
function suratTable(list, act) {
  if (!list.length) return '<div class="empty">Belum ada surat. Surat yang sudah dibuat akan muncul di sini.</div>';
  return '<table class="table tbl-cards"><thead><tr><th>Nomor surat</th><th>Tanggal</th><th>Pemohon &amp; NIK</th><th>Jenis</th><th>Keperluan</th><th>Penandatangan</th>' + (act ? '<th></th>' : '') + '</tr></thead><tbody>' +
    list.map(s => `<tr><td data-l="Nomor" class="mono">${esc(s.Nomor)}</td><td data-l="Tanggal">${tglIndo(s.Tanggal)}</td><td data-l="Pemohon"><b>${esc(s.Nama)}</b><br><span class="mono sm">${esc(s.NIK)}</span></td><td data-l="Jenis">${pill(s)}</td><td data-l="Keperluan">${esc(s.Keperluan)}</td><td data-l="Penandatangan">${esc(pjName(s.IDPejabat))}</td>${act ? `<td class="acts">${actBtns(s)}</td>` : ''}</tr>`).join('') + '</tbody></table>';
}
function actBtns(s) {
  const r = S.user.peran; let h = '';
  if (AP.includes(r)) h += `<button class="btn btn-outline-secondary" onclick="openSurat('${s.ID}')"><i class="bi bi-printer"></i> Cetak</button> <button class="btn btn-outline-secondary" onclick="editSurat('${s.ID}')"><i class="bi bi-pencil"></i> Ubah</button> `;
  if (r === 'Admin') h += `<button class="btn btn-outline-secondary" onclick="askDelete('${s.ID}')" aria-label="Hapus"><i class="bi bi-trash"></i></button>`;
  return h;
}
async function loadDash() {
  $('hiName').textContent = S.user.nama;
  document.querySelectorAll('[data-roles]').forEach(e => e.hidden = !e.dataset.roles.split(',').includes(S.user.peran));
  const d = await api('dashboard'), k = d.kpi;
  const card = (l, v, s, i) => `<div class="col-6 col-xl-3"><div class="card-x kpi"><i class="bi ${i}"></i><small>${l}</small><b>${v}</b><span>${s}</span></div></div>`;
  $('kpi').innerHTML = card('Terbit hari ini', k.hari, 'dokumen', 'bi-file-check') + card('Belum Menikah', k.bm, 'hari ini', 'bi-person') + card('Janda / Duda', k.jd, 'hari ini', 'bi-people') + card('Bulan ini', k.bulan, 'dari ' + k.total + ' surat tercatat', 'bi-calendar3');
  $('insights').innerHTML = d.insights.map(i => `<li class="mb-2">${esc(i)}</li>`).join('');
  $('recent').innerHTML = suratTable(d.recent, false);
}

// ════════ BUAT / UBAH SURAT ════════
function fillPj(id, active) {
  const e = $(id), v = e.value;
  e.innerHTML = `<option value="">${active ? 'Pilih penandatangan' : 'Semua penandatangan'}</option>` +
    S.pejabat.filter(p => !active || p.Aktif === 'Ya').map(p => `<option value="${p.ID}">${esc(p.Nama)} (${esc(p.Jabatan)})</option>`).join('');
  e.value = v;
}
function setJenis(j, lock) {
  $('suratForm').elements.Jenis.value = j;
  document.querySelectorAll('#jenisSeg button').forEach(b => { b.classList.toggle('on', b.dataset.j === j); b.disabled = !!lock && b.dataset.j !== j; });
  $('ceraiBox').hidden = j !== 'Janda/Duda'; $('statusBox').hidden = j === 'Janda/Duda';
}
function initBuat(opt) {
  const f = $('suratForm'), e = opt && opt.edit; f.reset(); fillPj('fPejabat', true);
  setJenis(e ? e.Jenis : 'Belum Menikah', !!e);
  f.elements.ID.value = e ? e.ID : ''; f.elements.WN.value = 'Indonesia'; f.elements.Tanggal.value = today();
  if (e) {
    ['NIK', 'Nama', 'JK', 'TTL', 'WN', 'Agama', 'Pekerjaan', 'Alamat', 'Keperluan', 'IDPejabat', 'Tanggal'].forEach(k => f.elements[k].value = e[k]);
    if (e.JenisCerai) f.querySelector(`[name=JenisCerai][value="${e.JenisCerai}"]`).checked = true;
  }
  $('buatTitle').textContent = e ? 'Ubah surat ' + e.Nomor : 'Buat surat keterangan';
  $('nikCnt').textContent = f.elements.NIK.value.length;
}
async function submitSurat(ev) {
  ev.preventDefault(); const f = ev.target;
  if (!f.checkValidity()) { f.reportValidity(); return; }
  const o = {}; new FormData(f).forEach((v, k) => o[k] = v);
  if (!/^\d{16}$/.test(o.NIK)) return toast('Periksa isian', 'NIK harus 16 digit angka.', 'warning');
  if (o.Jenis === 'Janda/Duda' && !o.JenisCerai) return toast('Periksa isian', 'Pilih cerai mati atau cerai hidup.', 'warning');
  const b = ev.submitter; b.disabled = true;
  try {
    const s = await api('suratSave', o); S.surat = null;
    toast('Tersimpan', 'Nomor surat ' + s.Nomor, 'success');
    navigateTo('daftar'); showPreview(s);
  } finally { b.disabled = false; }
}

// ════════ DAFTAR SURAT ════════
async function loadDaftar() {
  if (!S.surat) S.surat = await api('suratList');
  fillPj('fPj', false); filterDaftar();
}
function filterDaftar(reset) {
  if (!S.surat) return; if (reset !== false) S.pg = 1;
  const q = $('fQ').value.trim().toLowerCase(), j = $('fJ').value, a = $('fA').value, b = $('fB').value, p = $('fPj').value;
  S.view = S.surat.filter(s => (!q || (s.Nomor + ' ' + s.Nama + ' ' + s.NIK).toLowerCase().includes(q)) && (!j || s.Jenis === j) && (!a || s.Tanggal >= a) && (!b || s.Tanggal <= b) && (!p || s.IDPejabat === p));
  const per = 10, pages = Math.max(1, Math.ceil(S.view.length / per)); S.pg = Math.min(S.pg, pages);
  $('listBox').innerHTML = suratTable(S.view.slice((S.pg - 1) * per, S.pg * per), true);
  $('pager').innerHTML = `<span>Menampilkan ${S.view.length} dari ${S.surat.length} surat</span><div><button class="btn btn-sm btn-outline-secondary" ${S.pg <= 1 ? 'disabled' : ''} onclick="S.pg--;filterDaftar(false)">Sebelumnya</button><span class="mx-2">${S.pg} / ${pages}</span><button class="btn btn-sm btn-outline-secondary" ${S.pg >= pages ? 'disabled' : ''} onclick="S.pg++;filterDaftar(false)">Berikutnya</button></div>`;
}
function resetFilter() { ['fQ', 'fJ', 'fA', 'fB', 'fPj'].forEach(i => $(i).value = ''); filterDaftar(); }
const findSurat = id => S.surat.find(x => x.ID === id);
function editSurat(id) { navigateTo('buat', { edit: findSurat(id) }); }
function openSurat(id) { showPreview(findSurat(id)); }
function askDelete(id) {
  const s = findSurat(id); $('delBody').innerHTML = `Surat <b class="mono">${esc(s.Nomor)}</b> atas nama <b>${esc(s.Nama)}</b> akan dihapus. Nomor ini tidak akan dipakai ulang.`;
  const m = bootstrap.Modal.getOrCreateInstance($('delModal'));
  $('delOk').onclick = async () => { try { await api('suratDelete', { id: id }); m.hide(); S.surat = null; toast('Terhapus', 'Surat dihapus.', 'success'); loadDaftar(); } catch (e) {} };
  m.show();
}

// ════════ PRATINJAU A4 & CETAK ════════
function letterHtml(s) {
  const c = S.cfg, p = S.pejabat.find(x => x.ID === s.IDPejabat) || {}, jd = s.Jenis === 'Janda/Duda', g = s.JK === 'Perempuan' ? 'JANDA' : 'DUDA';
  const cerai = (s.JenisCerai || '').toUpperCase();
  const map = { GELAR: g, CERAI: cerai, NAMA: s.Nama, STATUS: jd ? g + ' (' + cerai + ')' : 'BELUM KAWIN' };
  const isi = esc((jd ? c.tplJanda : c.tplBelum) || '').replace(/\{(\w+)\}/g, (m, k) => map[k] !== undefined ? esc(map[k]) : m);
  const row = (a, b, bold) => `<tr><td style="width:36%;padding:2px 0;vertical-align:top">${a}</td><td style="width:3%;vertical-align:top">:</td><td style="padding:2px 0;font-weight:${bold ? 700 : 400}">${esc(b)}</td></tr>`;
  const sign = /sekretaris/i.test(p.Jabatan || '') ? 'a.n. LURAH KARANG AMBUN<br>' + esc(p.Jabatan) + ',' : esc((p.Jabatan || 'Lurah Karang Ambun').toUpperCase()) + ',';
  const logo = S.logo ? `<img src="${S.logo}" style="height:80px;max-width:90px;object-fit:contain" alt="">` : '';
  return `<div style="font-family:'Times New Roman',Times,serif;font-size:12pt;line-height:1.5;color:#000;background:#fff">
<table style="width:100%;border-collapse:collapse"><tr><td style="width:90px;vertical-align:middle">${logo}</td>
<td style="text-align:center;line-height:1.3"><div style="font-weight:700;font-size:13pt">${esc(c.pemda)}</div><div style="font-weight:700;font-size:13pt">${esc(c.kecamatan)}</div><div style="font-weight:700;font-size:16pt">${esc(c.kelurahan)}</div><div style="font-size:9.5pt">${esc(c.alamat)}</div></td><td style="width:90px"></td></tr></table>
<div style="border-top:2px solid #000;border-bottom:1px solid #000;height:2px;margin:6px 0 16px"></div>
<div style="text-align:center"><div style="font-weight:700;text-decoration:underline;font-size:13pt">${jd ? 'SURAT KETERANGAN STATUS ' + g : 'SURAT KETERANGAN BELUM MENIKAH'}</div><div>Nomor: ${esc(s.Nomor)}</div></div>
<p style="text-align:justify;margin:16px 0 8px">Yang bertanda tangan di bawah ini Lurah Karang Ambun, ${esc(c.kecamatan.replace('KECAMATAN', 'Kecamatan').replace('TANJUNG REDEB', 'Tanjung Redeb'))}, Kabupaten Berau, Provinsi Kalimantan Timur, menerangkan dengan sebenarnya bahwa:</p>
<table style="width:92%;margin:0 auto 10px;border-collapse:collapse">${row('Nama Lengkap', s.Nama, 1)}${row('NIK', s.NIK)}${row('Jenis Kelamin', s.JK)}${row('Tempat / Tanggal Lahir', s.TTL)}${row('Kewarganegaraan', s.WN)}${row('Agama', s.Agama)}${row('Pekerjaan', s.Pekerjaan)}${row('Status Perkawinan', s.Status)}${row('Alamat Domisili', s.Alamat)}</table>
<p style="text-align:justify;margin:8px 0">${isi}</p>
<p style="text-align:justify;margin:8px 0">Surat keterangan ini diberikan untuk keperluan: <b>${esc(s.Keperluan)}</b>.</p>
<p style="text-align:justify;margin:8px 0">Demikian surat keterangan ini kami buat dengan sebenarnya dan diberikan kepada yang bersangkutan untuk dapat dipergunakan sebagaimana mestinya.</p>
<div style="margin:24px 0 0 55%;text-align:center"><div>${esc(c.kota)}, ${tglIndo(s.Tanggal)}</div><div style="font-weight:700;margin-top:2px">${sign}</div><div style="height:80px"></div><div style="font-weight:700;text-decoration:underline">${esc(p.Nama || '')}</div><div>NIP. ${esc(p.NIP || '')}</div></div></div>`;
}
function showPreview(s) {
  S.cur = s; $('sheetBox').innerHTML = letterHtml(s);
  $('pdfLink').hidden = !s.LinkPDF; $('pdfLink').href = s.LinkPDF || '#'; $('pvTitle').textContent = s.Nomor;
  bootstrap.Modal.getOrCreateInstance($('pvModal')).show();
}
function printSheet() { $('printRoot').innerHTML = $('sheetBox').innerHTML; window.print(); }
async function savePdf(b) {
  b.disabled = true;
  try {
    const r = await api('suratPdf', { id: S.cur.ID, html: letterHtml(S.cur) });
    S.cur.LinkPDF = r.url; $('pdfLink').href = r.url; $('pdfLink').hidden = false;
    toast('Tersimpan', 'PDF tersimpan di Google Drive.', 'success');
  } finally { b.disabled = false; }
}

// ════════ LAPORAN ════════
function drawChart(d) {
  if (S.chart) S.chart.destroy();
  const dk = document.documentElement.dataset.theme === 'dark', tc = dk ? '#9BB2A8' : '#52665E';
  S.chart = new Chart($('lapChart'), {
    type: 'bar',
    data: { labels: ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'], datasets: [
      { label: 'Belum Menikah', data: d.bm, backgroundColor: dk ? '#4FB08A' : '#14513F', borderRadius: 4 },
      { label: 'Janda/Duda', data: d.jd, backgroundColor: dk ? '#E0BE6A' : '#C9A24B', borderRadius: 4 }] },
    options: { responsive: true, scales: { x: { ticks: { color: tc }, grid: { display: false } }, y: { beginAtZero: true, ticks: { color: tc, precision: 0 }, grid: { color: dk ? '#22352D' : '#DCE7E2' } } }, plugins: { legend: { labels: { color: tc } } } }
  });
}
async function loadLaporan() {
  const sel = $('lapYear');
  if (!sel.options.length) { const y = new Date().getFullYear(); for (let i = y; i >= y - 3; i--) sel.add(new Option(i, i)); }
  const d = await api('laporan', { tahun: sel.value }); S.lapData = d; drawChart(d);
  $('lapTotal').textContent = d.total;
  const list = a => a.length ? a.map(x => `<div class="d-flex justify-content-between py-1 border-bottom"><span>${esc(x[0])}</span><b>${x[1]}</b></div>`).join('') : '<div class="sm">Belum ada data.</div>';
  $('lapPj').innerHTML = list(Object.keys(d.pejabat).map(k => [k, d.pejabat[k]])); $('lapKp').innerHTML = list(d.keperluan);
}

// ════════ PENGGUNA & PEJABAT (CRUD generik) ════════
const MASTER = {
  pengguna: { list: 'userList', save: 'userSave', title: 'pengguna', cols: [['Nama', 'Nama lengkap'], ['Username', 'Username'], ['Peran', 'Peran', 'select', ['Admin', 'Petugas', 'Pejabat']], ['Password', 'Kata sandi', 'password'], ['Aktif', 'Status akun', 'select', ['Ya', 'Tidak']]] },
  pejabat: { list: 'pejabatList', save: 'pejabatSave', title: 'pejabat', cols: [['Nama', 'Nama dan gelar'], ['NIP', 'NIP'], ['Jabatan', 'Jabatan'], ['Aktif', 'Status', 'select', ['Ya', 'Tidak']]] }
};
async function loadMaster(k) {
  const m = MASTER[k], d = await api(m.list); m.data = d; if (k === 'pejabat') S.pejabat = d;
  const cs = m.cols.filter(c => c[2] !== 'password');
  $('tbl-' + k).innerHTML = '<table class="table tbl-cards"><thead><tr>' + cs.map(c => `<th>${c[1]}</th>`).join('') + '<th></th></tr></thead><tbody>' +
    d.map(r => '<tr>' + cs.map(c => `<td data-l="${c[1]}">${c[0] === 'Aktif' ? `<span class="pill ${r.Aktif === 'Ya' ? '' : 'off'}">${r.Aktif === 'Ya' ? 'Aktif' : 'Nonaktif'}</span>` : esc(r[c[0]])}</td>`).join('') + `<td class="acts"><button class="btn btn-outline-secondary" onclick="openMaster('${k}','${r.ID}')"><i class="bi bi-pencil"></i> Ubah</button></td></tr>`).join('') + '</tbody></table>';
}
function openMaster(k, id) {
  const m = MASTER[k], r = id ? m.data.find(x => x.ID === id) : {}; S.mk = k; S.mid = id || '';
  $('mdTitle').textContent = (id ? 'Ubah ' : 'Tambah ') + m.title;
  $('mdBody').innerHTML = m.cols.map(c => {
    const n = c[0], v = r[n] === undefined ? (n === 'Aktif' ? 'Ya' : (n === 'Peran' ? 'Petugas' : '')) : r[n];
    const inp = c[2] === 'select' ? `<select class="form-select" name="${n}">${c[3].map(x => `<option ${x === v ? 'selected' : ''}>${x}</option>`).join('')}</select>`
      : c[2] === 'password' ? `<input class="form-control" type="password" name="${n}" autocomplete="new-password" minlength="6" ${id ? '' : 'required'}>`
      : `<input class="form-control" name="${n}" value="${esc(v)}" required>`;
    return `<div class="mb-3"><label class="form-label">${c[1]}${n === 'Password' && id ? ' (kosongkan jika tidak diubah)' : ''}</label>${inp}</div>`;
  }).join('');
  bootstrap.Modal.getOrCreateInstance($('mdModal')).show();
}
async function saveMaster(ev) {
  ev.preventDefault(); const f = ev.target; if (!f.checkValidity()) return f.reportValidity();
  const o = { ID: S.mid }; new FormData(f).forEach((v, k) => o[k] = v); const m = MASTER[S.mk];
  try { await api(m.save, o); bootstrap.Modal.getInstance($('mdModal')).hide(); toast('Tersimpan', 'Data ' + m.title + ' disimpan.', 'success'); loadMaster(S.mk); } catch (e) {}
}

// ════════ PENGATURAN ════════
const CFG_KEYS = ['pemda', 'kecamatan', 'kelurahan', 'alamat', 'kota', 'tplBelum', 'tplJanda', 'gradA', 'gradB', 'gradAngle', 'gradOpacity'];
async function loadPengaturan() {
  const d = await api('cfgGet'); S.cfg = d.cfg; S.nomor = d.nomor; S.logo = d.logoData; S.bg = d.bgData; S.bgRemove = false;
  CFG_KEYS.forEach(k => $('c_' + k).value = d.cfg[k] || '');
  prevLogo();
  $('logoPrev').src = d.logoData; $('logoPrev').hidden = !d.logoData; $('brandLogo').src = d.logoData; $('brandLogo').hidden = !d.logoData;
  $('nomorBox').innerHTML = d.nomor.map((n, i) => `<div class="row g-2 mb-2 align-items-end"><div class="col-12"><b>${esc(n.Jenis)}</b> <span class="sm">(tahun aktif ${esc(n.Tahun)})</span></div><div class="col-8"><label class="form-label">Format</label><input id="nf_${i}" class="form-control mono" value="${esc(n.Format)}"></div><div class="col-4"><label class="form-label">Nomor terakhir</label><input id="nt_${i}" type="number" min="0" class="form-control mono" value="${n.Terakhir}"></div></div>`).join('');
}
async function saveCfg(b) {
  const cfg = {}; CFG_KEYS.forEach(k => cfg[k] = $('c_' + k).value.trim());
  if (S.bgRemove) cfg.loginBgId = '';
  const nomor = S.nomor.map((n, i) => ({ Jenis: n.Jenis, Format: $('nf_' + i).value.trim(), Terakhir: $('nt_' + i).value }));
  b.disabled = true;
  try { await api('cfgSave', { cfg: cfg, nomor: nomor }); toast('Tersimpan', 'Pengaturan diperbarui.', 'success'); paintTheme($('loginView'), themeFromForm()); loadPengaturan(); } finally { b.disabled = false; }
}
function uploadLogo(inp) {
  const f = inp.files[0]; if (!f) return;
  if (!/^image\/(png|jpeg)$/.test(f.type) || f.size > 1.5e6) return toast('Logo ditolak', 'Gunakan PNG atau JPG, maksimal 1,5 MB.', 'warning');
  const r = new FileReader();
  r.onload = async () => { try { await api('logoUpload', { b64: r.result.split(',')[1], mime: f.type, target: 'logo' }); toast('Tersimpan', 'Logo diganti.', 'success'); loadPengaturan(); } catch (e) {} };
  r.readAsDataURL(f);
}

// ════════ LATAR HALAMAN MASUK (gambar + gradasi) ════════
// Gambar di lapisan bawah, gradasi di lapisan atas; intensitas = opacity gradasi.
function paintTheme(root, t) {
  root.querySelector('.login-bg').style.backgroundImage = t.bg ? `url("${t.bg}")` : 'none';
  const tint = root.querySelector('.login-tint');
  tint.style.background = `linear-gradient(${Number(t.gradAngle)}deg, ${t.gradA}, ${t.gradB})`;
  tint.style.opacity = (t.bg ? Number(t.gradOpacity) : 100) / 100;
}
const themeFromForm = () => ({ bg: S.bg, gradA: $('c_gradA').value, gradB: $('c_gradB').value, gradAngle: $('c_gradAngle').value, gradOpacity: $('c_gradOpacity').value });
function prevLogo() {
  $('angVal').textContent = $('c_gradAngle').value; $('opVal').textContent = $('c_gradOpacity').value;
  paintTheme($('loginPrev'), themeFromForm());
}
function uploadBg(inp) {
  const f = inp.files[0]; if (!f) return;
  if (!/^image\/(png|jpeg)$/.test(f.type) || f.size > 2e6) return toast('Gambar ditolak', 'Gunakan PNG atau JPG, maksimal 2 MB.', 'warning');
  const r = new FileReader();
  r.onload = async () => {
    try { await api('logoUpload', { b64: r.result.split(',')[1], mime: f.type, target: 'bg' }); toast('Tersimpan', 'Gambar latar diganti.', 'success'); await loadPengaturan(); paintTheme($('loginView'), themeFromForm()); } catch (e) {}
  };
  r.readAsDataURL(f);
}
function removeBg() { S.bg = ''; S.bgRemove = true; prevLogo(); toast('Gambar dihapus', 'Klik Simpan perubahan untuk menerapkan.', 'warning'); }

// Pulihkan sesi setelah halaman dimuat ulang (token disimpan di sessionStorage tab ini)
async function restoreSession() {
  const ss = loadSession(); if (!ss || !ss.token) return;
  S.token = ss.token;
  try { S.user = await api('me'); await startApp(); } catch (e) { S.token = null; }
}
document.addEventListener('DOMContentLoaded', () => {
  let t = 'light'; try { t = localStorage.getItem('theme') || 'light'; } catch (e) {}
  setTheme(t);
  // Tema halaman masuk diambil tanpa sesi (data non-sensitif)
  gasGet('loginTheme').then(r => { if (r.success) paintTheme($('loginView'), r.data); }).catch(() => {});
  restoreSession().finally(() => { $('loadingOverlay').style.display = 'none'; });
});
