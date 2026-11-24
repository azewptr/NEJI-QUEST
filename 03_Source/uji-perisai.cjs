// Uji Perisai (ID 3) pada kontrak NejiInventory - kontrak yang dipakai web.
// Tanpa opsi : jaringan Hardhat sementara (uji otomatis, semua data hilang setelah selesai).
// --localhost: deploy ke node yang sedang hidup (npm run node) untuk demo MetaMask.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const localServer = process.argv.includes("--localhost");
process.env.HARDHAT_NETWORK = localServer ? "localhost" : "hardhat";
const { ethers, artifacts } = require(path.join(process.cwd(), "node_modules", "hardhat"));

const uri = "ipfs://bafkreifmmmdl3ndeehd5j5nbb7xouzni2ltvna3ja5f6vcxbghox5fnsqy";

async function main() {
  const [kurator, , pemain, penerima] = await ethers.getSigners();
  const inventory = await ethers.deployContract("NejiInventory");
  await inventory.waitForDeployment();
  const address = await inventory.getAddress();

  await (await inventory.configure(3, 25, uri)).wait();
  const mint = await (await inventory.mint(pemain.address, 3, 1)).wait();

  assert.equal(await inventory.uri(3), uri);
  assert.equal(await inventory.balanceOf(pemain.address, 3), 1n);

  if (!localServer) {
    await assert.rejects(inventory.connect(pemain).mint(pemain.address, 3, 1));
    await (await inventory.connect(pemain).safeTransferFrom(
      pemain.address, penerima.address, 3, 1, "0x"
    )).wait();
    assert.equal(await inventory.balanceOf(pemain.address, 3), 0n);
    assert.equal(await inventory.balanceOf(penerima.address, 3), 1n);
    console.log("Lulus: URI, mint, penolakan akses mint dan transfer.");
  } else {
    // Web membaca alamat kontrak otomatis dari /static/contract-31337.json
    const { chainId } = await ethers.provider.getNetwork();
    const config = {
      address, chainId: Number(chainId),
      abi: (await artifacts.readArtifact("NejiInventory")).abi,
      deploymentHash: inventory.deploymentTransaction().hash,
    };
    fs.writeFileSync(path.join(process.cwd(), "frontend", `contract-${chainId}.json`),
      JSON.stringify(config, null, 2));
    console.log("Alamat kontrak ditulis ke frontend/contract-" + chainId + ".json");
  }

  console.log("Kontrak:", address);
  console.log("Kurator:", kurator.address);
  console.log("Pemain:", pemain.address);
  console.log("Receipt mint:", mint.hash, "| Gas used:", mint.gasUsed.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
