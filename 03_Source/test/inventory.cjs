const assert = require('node:assert/strict');
const { ethers } = require('hardhat');

describe('Inventori Neji Quest', function () {
  let c, issuer, player, receiver;
  const uri = 'ipfs://bafkreifmmmdl3ndeehd5j5nbb7xouzni2ltvna3ja5f6vcxbghox5fnsqy';
  beforeEach(async function () {
    [issuer, player, receiver] = await ethers.getSigners();
    c = await ethers.deployContract('NejiInventory');
    await c.waitForDeployment();
    await (await c.configure(3, 2, uri)).wait();
  });
  it('menerbitkan dan memperbarui saldo', async () => {
    await c.mint(player.address, 3, 1);
    assert.equal(await c.balanceOf(player.address, 3), 1n);
    assert.equal((await c.items(3)).minted, 1n);
  });
  it('menolak mint tanpa peran', async () => {
    await assert.rejects(c.connect(player).mint(player.address, 3, 1));
  });
  it('menolak penerima nol', async () => {
    await assert.rejects(c.mint(ethers.ZeroAddress, 3, 1));
  });
  it('menolak jumlah nol', async () => {
    await assert.rejects(c.mint(player.address, 3, 0));
  });
  it('menolak melebihi kuota tanpa mengubah state', async () => {
    await c.mint(player.address, 3, 2);
    await assert.rejects(c.mint(player.address, 3, 1));
    assert.equal((await c.items(3)).minted, 2n);
    assert.equal(await c.balanceOf(player.address, 3), 2n);
  });
  it('membaca metadata IPFS', async () => assert.equal(await c.uri(3), uri));
  it('memindahkan saldo pemain', async () => {
    await c.mint(player.address, 3, 1);
    await c.connect(player).safeTransferFrom(player.address, receiver.address, 3, 1, '0x');
    assert.equal(await c.balanceOf(player.address, 3), 0n);
    assert.equal(await c.balanceOf(receiver.address, 3), 1n);
  });
  it('menolak transfer tanpa izin', async () => {
    await c.mint(player.address, 3, 1);
    await assert.rejects(c.connect(receiver).safeTransferFrom(player.address, receiver.address, 3, 1, '0x'));
  });
  it('menolak transfer ke alamat nol', async () => {
    await c.mint(player.address, 3, 1);
    await assert.rejects(c.connect(player).safeTransferFrom(player.address, ethers.ZeroAddress, 3, 1, '0x'));
  });
  it('menolak transfer melebihi saldo', async () => {
    await assert.rejects(c.connect(player).safeTransferFrom(player.address, receiver.address, 3, 1, '0x'));
    assert.equal(await c.balanceOf(receiver.address, 3), 0n);
  });
  it('memancarkan TransferSingle sesuai mint', async () => {
    const receipt = await (await c.mint(player.address, 3, 2)).wait();
    const event = receipt.logs.map(log => { try { return c.interface.parseLog(log); } catch { return null; } }).find(event => event?.name === 'TransferSingle');
    assert.equal(event.args.to, player.address);
    assert.equal(event.args.id, 3n);
    assert.equal(event.args.value, 2n);
  });
  it('membekukan konfigurasi yang sudah terbit', async () => {
    await assert.rejects(c.configure(3, 99, uri));
    assert.equal((await c.items(3)).quota, 2n);
  });
  it('menolak konfigurasi tanpa izin', async () => await assert.rejects(c.connect(player).configure(1, 2, uri)));
  it('menolak ID kuota dan URI yang tidak sah', async () => {
    await assert.rejects(c.configure(4, 2, uri));
    await assert.rejects(c.configure(1, 0, uri));
    await assert.rejects(c.configure(1, 2, ''));
    await assert.rejects(c.configure(1, 2, 'https://example.com'));
  });
  it('menolak pembacaan dan mint item belum terdaftar', async () => {
    await assert.rejects(c.uri(1));
    await assert.rejects(c.mint(player.address, 1, 1));
  });
  it('memancarkan konfigurasi dan mendukung ERC1155', async () => {
    const receipt = await (await c.configure(1, 10, uri)).wait();
    const event = receipt.logs.map(log => { try { return c.interface.parseLog(log); } catch { return null; } }).find(event => event?.name === 'ItemConfigured');
    assert.equal(event.args.id, 1n);
    assert.equal(event.args.quota, 10n);
    assert.equal(await c.supportsInterface('0xd9b67a26'), true);
    assert.equal(await c.supportsInterface('0x7965db0b'), true);
  });
});
