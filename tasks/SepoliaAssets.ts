import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

// Sepolia deployed contract addresses
const SEPOLIA_GAME_ASSET = "0xf2f91fC32d84b0BCDD67AC6D773bC27fD3F9Dc47";
const SEPOLIA_ENCRYPTED_GAME_ASSET = "0x109A899a0c2544C4523b802B4793e110AD4CF387";
const SEPOLIA_ASSET_CONVERTER = "0xA7E2A9d2D9F708694bfC1bCbC8d8d23AD7eeBa45";

// Task to mint a regular NFT game asset on Sepolia
task("sepolia-mint-asset", "Mint a regular NFT game asset on Sepolia")
  .addParam("to", "The address to mint the asset to")
  .addParam("equiptype", "Equipment type (1-4)")
  .addParam("attack", "Attack power")
  .addParam("defense", "Defense power")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { to, equiptype, attack, defense } = taskArgs;

    const gameAsset = await hre.ethers.getContractAt("GameAsset", SEPOLIA_GAME_ASSET);

    console.log(`🔨 Minting NFT asset on Sepolia...`);
    const tx = await gameAsset.mint(to, equiptype, attack, defense);
    await tx.wait();

    console.log(`✅ Minted regular NFT asset to ${to}`);
    console.log(`   Equipment Type: ${equiptype}`);
    console.log(`   Attack: ${attack}`);
    console.log(`   Defense: ${defense}`);
    console.log(`   Transaction: ${tx.hash}`);
    console.log(`   View on Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
  });

// Task to get regular NFT asset info on Sepolia
task("sepolia-get-asset-info", "Get regular NFT asset information on Sepolia")
  .addParam("tokenid", "Token ID to query")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { tokenid } = taskArgs;

    const gameAsset = await hre.ethers.getContractAt("GameAsset", SEPOLIA_GAME_ASSET);

    try {
      const asset = await gameAsset.getEquipment(tokenid);
      const owner = await gameAsset.ownerOf(tokenid);

      console.log(`📋 Regular NFT Asset #${tokenid} on Sepolia:`);
      console.log(`   Owner: ${owner}`);
      console.log(`   Equipment Type: ${asset.equipmentType}`);
      console.log(`   Attack Power: ${asset.attackPower}`);
      console.log(`   Defense Power: ${asset.defensePower}`);
      console.log(`   View on Etherscan: https://sepolia.etherscan.io/address/${SEPOLIA_GAME_ASSET}`);
    } catch (error) {
      console.log(`❌ Asset #${tokenid} does not exist or error occurred`);
    }
  });

// Task to get all assets owned by an address on Sepolia
task("sepolia-get-user-assets", "Get all assets owned by a user on Sepolia")
  .addParam("address", "User address")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { address } = taskArgs;

    const gameAsset = await hre.ethers.getContractAt("GameAsset", SEPOLIA_GAME_ASSET);
    const encryptedGameAsset = await hre.ethers.getContractAt("EncryptedGameAsset", SEPOLIA_ENCRYPTED_GAME_ASSET);

    console.log(`👤 Assets owned by ${address} on Sepolia:`);

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

    console.log(`\n🌐 View contracts on Etherscan:`);
    console.log(`   GameAsset: https://sepolia.etherscan.io/address/${SEPOLIA_GAME_ASSET}`);
    console.log(`   EncryptedGameAsset: https://sepolia.etherscan.io/address/${SEPOLIA_ENCRYPTED_GAME_ASSET}`);
  });

// Task to show the Sepolia deployment status
task("sepolia-status", "Show the current status of Sepolia deployed contracts")
  .setAction(async (_taskArgs, hre: HardhatRuntimeEnvironment) => {
    console.log("🌐 Game Assets System Status on Sepolia");
    console.log("=" .repeat(50));

    console.log("\n📋 Contract Addresses:");
    console.log(`   GameAsset: ${SEPOLIA_GAME_ASSET}`);
    console.log(`   EncryptedGameAsset: ${SEPOLIA_ENCRYPTED_GAME_ASSET}`);
    console.log(`   AssetConverter: ${SEPOLIA_ASSET_CONVERTER}`);

    console.log("\n🌐 Etherscan Links:");
    console.log(`   GameAsset: https://sepolia.etherscan.io/address/${SEPOLIA_GAME_ASSET}`);
    console.log(`   EncryptedGameAsset: https://sepolia.etherscan.io/address/${SEPOLIA_ENCRYPTED_GAME_ASSET}`);
    console.log(`   AssetConverter: https://sepolia.etherscan.io/address/${SEPOLIA_ASSET_CONVERTER}`);

    // Get contract instances
    const gameAsset = await hre.ethers.getContractAt("GameAsset", SEPOLIA_GAME_ASSET);

    // Check total supply of NFTs
    try {
      const totalSupply = await gameAsset.totalSupply();
      console.log(`\n📊 Total Regular NFTs on Sepolia: ${totalSupply}`);
    } catch (error) {
      console.log(`\n❌ Error getting total supply: ${error}`);
    }

    console.log(`\n✅ Available Sepolia Tasks:`);
    console.log(`   • sepolia-mint-asset - Mint regular NFT assets on Sepolia`);
    console.log(`   • sepolia-get-asset-info - Get NFT asset information on Sepolia`);
    console.log(`   • sepolia-get-user-assets - Get all assets owned by a user on Sepolia`);
    console.log(`   • sepolia-status - Show this status report`);

    console.log(`\n📝 Example Commands:`);
    console.log(`   npx hardhat sepolia-mint-asset --to [address] --equiptype [1-4] --attack [number] --defense [number] --network sepolia`);
    console.log(`   npx hardhat sepolia-get-user-assets --address [address] --network sepolia`);
  });