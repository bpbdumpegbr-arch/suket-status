/**
 * Lapisan komunikasi ke backend Google Apps Script (REST).
 * - GET  : data publik (tema halaman masuk, cek status)
 * - POST : semua aksi lain. Header WAJIB text/plain agar browser tidak mengirim
 *          preflight CORS (Apps Script tidak bisa menjawab preflight).
 * Token sesi hanya dikirim di body POST, tidak pernah di URL.
 */
const SESSION_KEY = 'sip_surat_session';

function saveSession(s) { try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch (e) {} }
function loadSession() { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch (e) { return null; } }
function clearSession() { try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {} }

function checkGasUrl() {
  if (!GAS_URL || GAS_URL.indexOf('PASTE_') === 0 || !/\/exec$/.test(GAS_URL))
    throw new Error('GAS_URL belum diisi dengan benar di js/config.js (harus berakhiran /exec).');
}
async function parseGas(r) {
  if (!r.ok) throw new Error('Server mengembalikan status ' + r.status + '.');
  try { return await r.json(); }
  catch (e) { throw new Error('Respons server tidak valid. Pastikan URL /exec benar dan akses Web App diatur ke "Anyone".'); }
}
async function gasGet(action) {
  checkGasUrl();
  return parseGas(await fetch(GAS_URL + '?action=' + encodeURIComponent(action)));
}
async function callGas(body) {
  checkGasUrl();
  return parseGas(await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body)
  }));
}
