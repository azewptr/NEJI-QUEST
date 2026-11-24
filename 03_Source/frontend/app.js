import { ethers } from '/static/vendor/ethers.min.js';

const $ = id => document.getElementById(id);
const names = ['Ramuan', 'Senjata', 'Perisai'];
const abi = [
  'function configure(uint256,uint256,string)', 'function mint(address,uint256,uint256)',
  'function balanceOf(address,uint256) view returns(uint256)', 'function uri(uint256) view returns(string)',
  'function safeTransferFrom(address,address,uint256,uint256,bytes)',
  'function items(uint256) view returns(uint256 quota,uint256 minted,string metadataURI)',
  'error AccessControlUnauthorizedAccount(address account, bytes32 neededRole)',
  'error ERC1155InsufficientBalance(address sender, uint256 balance, uint256 needed, uint256 tokenId)',
  'error ERC1155MissingApprovalForAll(address operator, address owner)',
  'error ERC1155InvalidReceiver(address receiver)',
];
let account = '', prediction = null, previewUrl = '', generation = 0, turn = 0;
let conversation = [], busy = false;
const situations = ['HP-mu rendah: 20 dari 100.', 'Penjaga bersiap menyerang.', 'Pertahanan penjaga terbuka.'];
const correct = [1, 3, 2], hps = [20, 50, 50];
const ink = 'stroke="#1f2933" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';
const icons = [
  `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M19 5h10v9l9 17a8 8 0 0 1-7 11H17a8 8 0 0 1-7-11l9-17z" fill="#fff" ${ink}/><path d="M13 30h22l3 2a7 7 0 0 1-7 10H17a7 7 0 0 1-7-10z" fill="#7fb069" ${ink}/></svg>`,
  `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M40 6v8L22 32l-6-6L34 8z" fill="#f2f2f2" ${ink}/><path d="M14 24l10 10M13 35l-6 6" ${ink} fill="none"/><path d="M11 29l8 8-4 4-8-8z" fill="#7fb069" ${ink}/></svg>`,
  `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 5l15 6v12c0 10-6 17-15 21C15 40 9 33 9 23V11z" fill="#7fb069" ${ink}/></svg>`,
];
let picked = 0;
let toastTimer;
function status(message, kind) {
  kind = kind || (message.includes('…') ? 'loading' : 'info');
  const toast = $('toast');
  $('status').textContent = message; toast.dataset.kind = kind; toast.hidden = false;
  toast.setAttribute('role', kind === 'error' ? 'alert' : 'status');
  clearTimeout(toastTimer);
  if (kind !== 'loading') toastTimer = setTimeout(() => { toast.hidden = true; }, kind === 'error' ? 10000 : 6000);
}
$('toast-close').onclick = () => { $('toast').hidden = true; };

const iface = new ethers.Interface(abi);
function friendly(error) {
  const text = error.shortMessage || error.message || String(error);
  let name = error.revert && error.revert.name;
  if (!name && typeof error.data === 'string') { try { name = iface.parseError(error.data).name; } catch { /* bukan custom error dikenal */ } }
  if (error.code === 'ACTION_REJECTED' || error.code === 4001) return 'Permintaan dibatalkan di wallet. Tidak ada perubahan pada kartu.';
  if (name === 'AccessControlUnauthorizedAccount') return 'Akun ini bukan penerbit. Gunakan akun kurator/penerbit untuk menetapkan edisi dan menerbitkan kartu.';
  if (name === 'ERC1155InsufficientBalance') return 'Saldo kartu tidak cukup untuk jumlah yang dikirim.';
  if (error.reason) return 'Kontrak menolak: ' + error.reason + '.';
  if (/failed to fetch|networkerror|load failed/i.test(text)) return 'Tidak dapat menghubungi server. Pastikan server berjalan (JALANKAN_WEB.bat), lalu muat ulang halaman.';
  if (error.name === 'TimeoutError' || error.name === 'AbortError') return 'Waktu habis. Layanan belum merespons, coba lagi.';
  return text;
}
async function action(fn, button) {
  if (busy) return;
  busy = true; if (button) button.disabled = true;
  try { await fn(); } catch (error) { status(friendly(error), 'error'); }
  finally { busy = false; if (button) button.disabled = false; }
}
function bind(id, fn) { $(id).onclick = () => action(fn, $(id)); }
async function json(response) {
  let data = null;
  try { data = await response.json(); } catch { /* balasan bukan JSON */ }
  if (!data) {
    if (!response.ok) throw new Error('Server gagal memproses permintaan (HTTP ' + response.status + '). Periksa pesan di terminal JALANKAN_WEB, lalu coba lagi.');
    throw new Error('Format balasan server tidak sesuai. Muat ulang halaman dan coba lagi.');
  }
  if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Permintaan gagal.');
  return data;
}
function ipfs(uri) {
  if (!/^ipfs:\/\/(b[a-z2-7]{40,}|Qm[1-9A-HJ-NP-Za-km-z]{44})$/.test(uri)) {
    throw new Error('Masukkan URI file ipfs:// diikuti CID asli.');
  }
  return 'https://blue-gigantic-puma-300.mypinata.cloud/ipfs/' + uri.slice(7);
}
async function metadata(uri) {
  try { return await json(await fetch(ipfs(uri), { signal: AbortSignal.timeout(15000) })); }
  catch (error) {
    if (/^Masukkan URI/.test(error.message)) throw error;
    throw new Error('Metadata IPFS tidak dapat dibuka lewat gateway Pinata. Periksa CID dan koneksi internet.');
  }
}
function amount(id) {
  const raw = $(id).value;
  if (!/^[1-9][0-9]*$/.test(raw)) throw new Error('Jumlah dan kuota harus bilangan bulat positif.');
  return BigInt(raw);
}
async function contract() {
  if (!window.ethereum) throw new Error('Pasang ekstensi MetaMask terlebih dahulu.');
  const provider = new ethers.BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();
  if (network.chainId !== BigInt($('network').value)) throw new Error('Jaringan wallet berbeda. Pilih jaringan yang sesuai di MetaMask.');
  if (!ethers.isAddress($('contract').value)) throw new Error('Deploy kontrak dan isi alamat kontraknya.');
  if (await provider.getCode($('contract').value) === '0x') throw new Error('Kontrak tidak ditemukan pada jaringan ini.');
  return new ethers.Contract($('contract').value, abi, await provider.getSigner());
}
async function transaction(send) {
  const chain = $('network').value;
  const revision = generation;
  status('Menunggu persetujuan wallet…');
  const tx = await send();
  status('Transaksi dikirim. Menunggu konfirmasi… ' + tx.hash);
  const receipt = await tx.wait();
  if (generation !== revision) {
    status('Transaksi terkonfirmasi. Akun atau jaringan berubah; perbarui inventori pada jaringan asal.');
    return;
  }
  $('receipt').textContent = 'Receipt ' + receipt.hash + ' · Gas ' + receipt.gasUsed;
  if (chain === '11155111') {
    const link = document.createElement('a');
    link.href = 'https://sepolia.etherscan.io/tx/' + receipt.hash;
    link.target = '_blank'; link.rel = 'noopener'; link.textContent = ' Buka explorer';
    $('receipt').append(link);
  }
  status('Transaksi berhasil dikonfirmasi.', 'ok');
}
async function config() {
  const chain = $('network').value;
  $('contract').value = '';
  try {
    const response = await fetch('/static/contract-' + chain + '.json');
    if (response.ok) {
      const value = await response.json();
      if (chain === $('network').value) $('contract').value = value.address;
    }
  } catch { status('Alamat kontrak bisa diisi setelah deployment.'); }
}
document.querySelectorAll('[data-page]').forEach(button => {
  button.onclick = () => {
    ['scan', 'inventory', 'mission'].forEach(id => { $(id).hidden = id !== button.dataset.page; });
    document.querySelectorAll('[data-page]').forEach(item => item === button ? item.setAttribute('aria-current', 'page') : item.removeAttribute('aria-current'));
  };
});
function showFinal() {
  const final = Number($('category').value);
  $('final-note').textContent = !prediction ? '' : final === prediction.item_id
    ? 'Kategori final sesuai saran AI: ' + names[final - 1] + '.'
    : 'Kurator mengoreksi: saran AI ' + prediction.label + ', kategori final ' + names[final - 1] + '.';
}
$('file').onchange = () => {
  generation++; prediction = null; $('prediction').textContent = ''; showFinal();
  $('image-uri').value = ''; $('metadata-uri').value = '';
  URL.revokeObjectURL(previewUrl);
  const file = $('file').files[0];
  $('preview').hidden = !file;
  if (file) {
    previewUrl = URL.createObjectURL(file);
    $('preview').src = previewUrl;
    status('Gambar dipilih. Klik Analisis gambar untuk mengenali jenis kartu.');
  } else {
    status('Pilih gambar kartu untuk memulai.');
  }
};
$('category').onchange = () => { $('metadata-uri').value = ''; showFinal(); };
bind('predict', async () => {
  const file = $('file').files[0];
  if (!file) throw new Error('Pilih gambar kartu terlebih dahulu.');
  if (!file.size) throw new Error('Berkas kosong. Pilih gambar kartu yang valid.');
  if (file.size > 8 * 1024 * 1024) throw new Error('Pilih gambar berukuran maksimal 8 MB.');
  const revision = generation;
  prediction = null; $('prediction').textContent = ''; showFinal();
  const form = new FormData(); form.append('file', file);
  status('CNN v2 sedang menganalisis gambar…');
  const result = await json(await fetch('/api/predict', { method: 'POST', body: form }));
  if (revision !== generation) throw new Error('Gambar berubah. Analisis ulang gambar baru.');
  prediction = result;
  $('prediction').textContent = `Saran AI: ${result.label} (ID ${result.item_id}) · Keyakinan ${(result.score * 100).toFixed(1)}% · ${result.inference_ms} ms`
    + (result.score < 0.7 ? '\nKeyakinan rendah. Periksa gambar dan kategori sebelum menyetujui.' : '');
  $('category').value = result.item_id; showFinal(); $('curator').open = true;
  status('Hasil siap ditinjau kurator. Ubah kategori final jika saran AI keliru.');
});
bind('metadata', async () => {
  if (!prediction) throw new Error('Klik Analisis gambar dan tinjau hasilnya sebelum menyetujui metadata.');
  ipfs($('image-uri').value.trim());
  const category = names[Number($('category').value) - 1];
  if (!account) throw new Error('Hubungkan wallet kreator atau kurator.');
  const value = {
    name: category, description: 'Kartu ' + category + ' untuk misi Penjaga Gerbang.',
    category, image: $('image-uri').value.trim(), creator: account,
    source_license: $('license').value, metadata_version: '1.0',
    ai_assistance_status: 'Prediksi CNN ditinjau manusia; ilustrasi hasil generasi AI',
    ai_provenance: { ...prediction, curator_final_category: category, curator_corrected: Number($('category').value) !== prediction.item_id },
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = category.toLowerCase() + '.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  status('Metadata diunduh. Unggah ke IPFS lalu tempel URI metadata final.');
});
bind('sample', async () => {
  $('category').value = '3';
  $('image-uri').value = 'ipfs://bafybeiat37rugj4qkfzpbajdcdlgkcm3jnbzfylt36hqg2yvkuqflobwka';
  $('metadata-uri').value = 'ipfs://bafkreifmmmdl3ndeehd5j5nbb7xouzni2ltvna3ja5f6vcxbghox5fnsqy';
  status('CID Perisai hasil kerja Revianna siap dipakai.');
});
bind('connect', async () => {
  if (!window.ethereum) throw new Error('Pasang MetaMask untuk menghubungkan wallet.');
  [account] = await window.ethereum.request({ method: 'eth_requestAccounts' });
  $('account').textContent = account;
  $('connect').textContent = account.slice(0, 6) + '…' + account.slice(-4);
  status('Wallet terhubung. Periksa jaringan dan alamat kontrak.', 'ok');
});
bind('configure', async () => {
  const id = Number($('category').value), quota = amount('quota');
  const uri = $('metadata-uri').value.trim(), data = await metadata(uri);
  if (data.category !== names[id - 1]) throw new Error('Kategori metadata berbeda dari pilihan final.');
  ipfs(data.image);
  const c = await contract();
  await transaction(() => c.configure(id, quota, uri));
});
bind('mint', async () => {
  if (!ethers.isAddress($('recipient').value)) throw new Error('Alamat penerima tidak valid.');
  const c = await contract(), count = amount('amount');
  await transaction(() => c.mint($('recipient').value, Number($('category').value), count));
});
bind('refresh', async () => {
  const revision = generation;
  const c = await contract(), owner = await c.runner.getAddress();
  const fragments = [];
  for (let id = 1; id <= 3; id++) {
    const balance = await c.balanceOf(owner, id), item = await c.items(id);
    const card = document.createElement('article'); card.className = 'card'; card.dataset.kind = id;
    const title = document.createElement('h2'); title.textContent = names[id - 1]; card.append(title);
    const count = document.createElement('p'); count.textContent = 'Saldo ' + balance + ' · Terbit ' + item.minted + '/' + item.quota; card.append(count);
    if (item.quota > 0n) {
      try {
        const data = await metadata(item.metadataURI);
        const image = new Image(); image.src = ipfs(data.image); image.alt = names[id - 1];
        image.onerror = () => { image.replaceWith(document.createTextNode('Gambar IPFS belum tersedia.')); };
        card.append(image);
        const link = document.createElement('a'); link.href = ipfs(item.metadataURI); link.textContent = 'Metadata IPFS'; link.target = '_blank'; link.rel = 'noopener'; card.append(link);
      } catch { card.append(document.createTextNode('Metadata IPFS belum tersedia.')); }
    }
    fragments.push(card);
  }
  if (generation !== revision) throw new Error('Akun berubah. Perbarui saldo lagi.');
  $('cards').replaceChildren(...fragments); status('Saldo dibaca dari kontrak.', 'ok');
});
bind('transfer', async () => {
  const to = $('transfer-to').value, count = amount('transfer-amount');
  if (!ethers.isAddress(to)) throw new Error('Alamat tujuan tidak valid.');
  const c = await contract();
  await transaction(async () => c.safeTransferFrom(await c.runner.getAddress(), to, Number($('transfer-id').value), count, '0x'));
});
function mission() {
  const hp = hps[Math.min(turn, 2)];
  $('turn').textContent = turn < 3 ? 'Giliran ' + (turn + 1) + ' dari 3' : 'Misi selesai';
  $('situation').textContent = situations[turn] || 'Kamu berhasil memilih fungsi ketiga kartu.';
  $('hp-text').textContent = 'HP ' + hp + ' / 100'; $('hp-fill').style.width = hp + '%'; $('hp-bar').setAttribute('aria-valuenow', hp);
  picked = 0; $('choices').replaceChildren();
  $('use').hidden = turn >= 3; $('use').disabled = true; $('use').textContent = 'Pilih kartu';
  if (turn < 3) names.forEach((name, index) => {
    const button = document.createElement('button'); button.type = 'button'; button.dataset.kind = index + 1;
    button.setAttribute('aria-pressed', 'false'); button.insertAdjacentHTML('beforeend', icons[index]);
    const label = document.createElement('span'); label.textContent = name; button.append(label);
    button.onclick = () => {
      picked = index + 1;
      [...$('choices').children].forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      $('use').disabled = false; $('use').textContent = 'Gunakan ' + name;
    };
    $('choices').append(button);
  });
}
$('use').onclick = () => {
  if (!picked) return;
  if (picked !== correct[turn]) { status('Coba pilih fungsi item yang sesuai situasi.', 'error'); return; }
  turn++; mission();
  status(turn < 3 ? 'Pilihan tepat.' : 'Misi selesai. Kamu memakai ketiga kartu dengan tepat.', 'ok');
};
$('restart').onclick = () => { turn = 0; conversation = []; $('chat').replaceChildren(); $('toast').hidden = true; mission(); };
bind('hint', async () => {
  const question = $('question').value.trim() || 'Beri aku petunjuk.';
  const message = { role: 'user', content: (situations[turn] || 'Misi sudah selesai.') + '\n' + question };
  status('Menunggu petunjuk LLM… (bisa memakan waktu hingga 90 detik pada pemakaian pertama)');
  const result = await json(await fetch('/api/hint', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [...conversation.slice(-6), message] }),
  }));
  conversation.push(message, { role: 'assistant', content: result.answer });
  const ask = document.createElement('p'); ask.className = 'you'; ask.textContent = 'Kamu: ' + question;
  const text = document.createElement('p'); text.className = 'bot'; text.textContent = 'Petunjuk: ' + result.answer; $('chat').append(ask, text);
    $('question').value = ''; status('Petunjuk diterima.', 'ok');
  if (text.scrollIntoView) text.scrollIntoView({ block: 'nearest' });
});
$('question').onkeydown = event => {
  if (event.key !== 'Enter' || event.isComposing) return;
  event.preventDefault(); $('hint').click();
};
$('network').onchange = () => { generation++; $('cards').replaceChildren(); config(); };
if (window.ethereum) {
  window.ethereum.on('accountsChanged', () => { generation++; account = ''; $('account').textContent = 'Akun berubah. Hubungkan ulang wallet.'; $('connect').textContent = 'Hubungkan Wallet'; $('cards').replaceChildren(); });
  window.ethereum.on('chainChanged', () => { generation++; $('cards').replaceChildren(); status('Jaringan berubah. Cocokkan pengaturan jaringan sebelum transaksi.'); });
}
mission(); config();
