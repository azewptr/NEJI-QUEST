const fs = require('node:fs');
const path = require('node:path');
const { ethers, artifacts } = require('hardhat');

async function main() {
  const contract = await ethers.deployContract('NejiInventory');
  await contract.waitForDeployment();
  const transaction = contract.deploymentTransaction();
  const receipt = await transaction.wait();
  const { chainId } = await ethers.provider.getNetwork();
  const config = {
    address: await contract.getAddress(), chainId: Number(chainId),
    abi: (await artifacts.readArtifact('NejiInventory')).abi,
    deploymentHash: receipt.hash, gasUsed: receipt.gasUsed.toString(),
  };
  const folder = path.join(__dirname, '..', 'frontend');
  // Riwayat konfigurasi per jaringan dipertahankan.
  fs.writeFileSync(path.join(folder, `contract-${chainId}.json`), JSON.stringify(config, null, 2));
  console.log('Kontrak:', config.address, '| Chain ID:', config.chainId);
  console.log('Receipt:', receipt.hash, '| Gas:', config.gasUsed);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
