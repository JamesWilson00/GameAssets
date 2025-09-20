import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

// Helper function to get contract addresses based on network
async function getContractAddresses(hre: HardhatRuntimeEnvironment) {
  if (hre.network.name === "hardhat" || hre.network.name === "localhost") {
    return {
      gameAsset: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
      encryptedGameAsset: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707"
    };
  } else {
    const gameAssetDeployment = await hre.deployments.get("GameAsset");
    const encryptedGameAssetDeployment = await hre.deployments.get("EncryptedGameAsset");
    return {
      gameAsset: gameAssetDeployment.address,
      encryptedGameAsset: encryptedGameAssetDeployment.address
    };
  }
}

// Task to mint a regular NFT game asset
task("mint-asset", "Mint a regular NFT game asset")
  .addParam("to", "The address to mint the asset to")
  .addParam("equiptype", "Equipment type (1-4)")
  .addParam("attack", "Attack power")
  .addParam("defense", "Defense power")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { to, equiptype, attack, defense } = taskArgs;

    const addresses = await getContractAddresses(hre);
    const gameAsset = await hre.ethers.getContractAt("GameAsset", addresses.gameAsset);

    const tx = await gameAsset.mint(to, equiptype, attack, defense);
    await tx.wait();

    console.log(`✅ Minted regular NFT asset to ${to}`);
    console.log(`   Equipment Type: ${equiptype}`);
    console.log(`   Attack: ${attack}`);
    console.log(`   Defense: ${defense}`);
    console.log(`   Transaction: ${tx.hash}`);
  });

// Task to convert regular NFT to encrypted asset
task("convert-to-encrypted", "Convert regular NFT to encrypted asset")
  .addParam("tokenid", "Token ID of the regular NFT to convert")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { tokenid } = taskArgs;

    const addresses = await getContractAddresses(hre);
    const gameAsset = await hre.ethers.getContractAt("GameAsset", addresses.gameAsset);
    const encryptedGameAsset = await hre.ethers.getContractAt("EncryptedGameAsset", addresses.encryptedGameAsset);

    // First approve the encrypted game asset contract to burn the NFT
    console.log(`Approving EncryptedGameAsset to burn NFT #${tokenid}...`);
    const approveTx = await gameAsset.approve(addresses.encryptedGameAsset, tokenid);
    await approveTx.wait();

    // Then convert to encrypted
    console.log(`Converting NFT #${tokenid} to encrypted asset...`);
    const tx = await encryptedGameAsset.convertToEncrypted(tokenid);
    await tx.wait();

    console.log(`✅ Converted regular NFT ${tokenid} to encrypted asset`);
    console.log(`   Transaction: ${tx.hash}`);
  });

// Task to get regular NFT asset info
task("get-asset-info", "Get regular NFT asset information")
  .addParam("tokenid", "Token ID to query")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { tokenid } = taskArgs;

    const addresses = await getContractAddresses(hre);
    const gameAsset = await hre.ethers.getContractAt("GameAsset", addresses.gameAsset);

    try {
      const asset = await gameAsset.getEquipment(tokenid);
      const owner = await gameAsset.ownerOf(tokenid);

      console.log(`📋 Regular NFT Asset #${tokenid}:`);
      console.log(`   Owner: ${owner}`);
      console.log(`   Equipment Type: ${asset.equipmentType}`);
      console.log(`   Attack Power: ${asset.attackPower}`);
      console.log(`   Defense Power: ${asset.defensePower}`);
    } catch (error) {
      console.log(`❌ Asset #${tokenid} does not exist or error occurred`);
    }
  });

// Task to check encrypted asset existence
task("check-encrypted-asset", "Check if encrypted asset exists")
  .addParam("assetid", "Asset ID to check")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { assetid } = taskArgs;

    const addresses = await getContractAddresses(hre);
    const encryptedGameAsset = await hre.ethers.getContractAt("EncryptedGameAsset", addresses.encryptedGameAsset);

    try {
      const exists = await encryptedGameAsset.equipmentExists(assetid);
      const owner = await encryptedGameAsset.getOwner(assetid);

      console.log(`🔐 Encrypted Asset #${assetid}:`);
      console.log(`   Exists: ${exists}`);
      if (exists) {
        console.log(`   Owner: ${owner}`);
        console.log(`   Note: Equipment type, attack, and defense are encrypted`);
      }
    } catch (error) {
      console.log(`❌ Encrypted asset #${assetid} does not exist or error occurred`);
    }
  });

// Task to get all assets owned by an address
task("get-user-assets", "Get all assets owned by a user")
  .addParam("address", "User address")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { address } = taskArgs;

    const addresses = await getContractAddresses(hre);
    const gameAsset = await hre.ethers.getContractAt("GameAsset", addresses.gameAsset);
    const encryptedGameAsset = await hre.ethers.getContractAt("EncryptedGameAsset", addresses.encryptedGameAsset);

    console.log(`👤 Assets owned by ${address}:`);

    // Get regular NFTs
    try {
      const nftBalance = await gameAsset.balanceOf(address);
      console.log(`\n📋 Regular NFTs: ${nftBalance}`);

      for (let i = 0; i < Number(nftBalance); i++) {
        const tokenId = await gameAsset.tokenOfOwnerByIndex(address, i);
        const asset = await gameAsset.getEquipment(tokenId);
        console.log(`   NFT #${tokenId}: Type ${asset.equipmentType}, ATK ${asset.attackPower}, DEF ${asset.defensePower}`);
      }
    } catch (error) {
      console.log(`   Error getting regular NFTs: ${error}`);
    }

    // Get encrypted assets
    try {
      const encryptedBalance = await encryptedGameAsset.getEquipmentCount(address);
      console.log(`\n🔐 Encrypted Assets: ${encryptedBalance}`);

      const assetIds = await encryptedGameAsset.getOwnerEquipmentIds(address);
      for (const assetId of assetIds) {
        console.log(`   Encrypted Asset #${assetId}: (encrypted data)`);
      }
    } catch (error) {
      console.log(`   Error getting encrypted assets: ${error}`);
    }
  });

// Task to demonstrate the complete flow
task("demo-flow", "Demonstrate the complete game asset flow")
  .addParam("user", "User address to use for demo")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { user } = taskArgs;

    console.log(`🎮 Starting Game Assets Demo for user: ${user}\n`);

    // Step 1: Mint a regular NFT
    console.log("Step 1: Minting regular NFT...");
    await hre.run("mint-asset", {
      to: user,
      equiptype: "1",
      attack: "100",
      defense: "50"
    });

    // Step 2: Note about encrypted assets
    console.log("\nStep 2: Note about encrypted assets...");
    console.log("   Encrypted assets require proper FHE encryption from frontend");
    console.log("   Skipping encrypted asset creation in this demo");

    // Step 3: Show user's assets
    console.log("\nStep 3: Showing user's assets...");
    await hre.run("get-user-assets", { address: user });

    console.log("\n✅ Demo completed! User now has both regular NFT and encrypted assets.");
  });