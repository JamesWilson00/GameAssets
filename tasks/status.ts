import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

// Task to show the current status of all contracts and functionality
task("status", "Show the current status of deployed contracts and functionality")
  .setAction(async (_taskArgs, hre: HardhatRuntimeEnvironment) => {
    const gameAssetAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const encryptedGameAssetAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    const assetConverterAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

    console.log("🎮 Game Assets System Status");
    console.log("=" .repeat(50));

    // Get contract instances
    const gameAsset = await hre.ethers.getContractAt("GameAsset", gameAssetAddress);
    const encryptedGameAsset = await hre.ethers.getContractAt("EncryptedGameAsset", encryptedGameAssetAddress);
    const assetConverter = await hre.ethers.getContractAt("AssetConverter", assetConverterAddress);

    console.log("\n📋 Contract Addresses:");
    console.log(`   GameAsset: ${gameAssetAddress}`);
    console.log(`   EncryptedGameAsset: ${encryptedGameAssetAddress}`);
    console.log(`   AssetConverter: ${assetConverterAddress}`);

    // Check total supply of NFTs
    try {
      const totalSupply = await gameAsset.totalSupply();
      console.log(`\n📊 Total Regular NFTs: ${totalSupply}`);
    } catch (error) {
      console.log(`\n❌ Error getting total supply: ${error}`);
    }

    // List a few accounts and their assets
    const accounts = await hre.ethers.getSigners();
    console.log(`\n👥 Account Assets (first 3 accounts):`);

    for (let i = 0; i < Math.min(3, accounts.length); i++) {
      const address = accounts[i].address;
      console.log(`\n   Account ${i + 1}: ${address}`);

      try {
        const nftBalance = await gameAsset.balanceOf(address);
        console.log(`     Regular NFTs: ${nftBalance}`);

        if (Number(nftBalance) > 0) {
          for (let j = 0; j < Number(nftBalance); j++) {
            const tokenId = await gameAsset.tokenOfOwnerByIndex(address, j);
            const equipment = await gameAsset.getEquipment(tokenId);
            console.log(`       NFT #${tokenId}: Type ${equipment.equipmentType}, ATK ${equipment.attackPower}, DEF ${equipment.defensePower}`);
          }
        }

        const encryptedBalance = await encryptedGameAsset.getEquipmentCount(address);
        console.log(`     Encrypted Assets: ${encryptedBalance}`);

        if (Number(encryptedBalance) > 0) {
          const assetIds = await encryptedGameAsset.getOwnerEquipmentIds(address);
          for (const assetId of assetIds) {
            console.log(`       Encrypted Asset #${assetId}: (encrypted data)`);
          }
        }
      } catch (error) {
        console.log(`     Error checking assets: ${error}`);
      }
    }

    console.log(`\n✅ Working Tasks:`);
    console.log(`   • accounts - List all accounts`);
    console.log(`   • mint-asset - Mint regular NFT assets`);
    console.log(`   • get-asset-info - Get NFT asset information`);
    console.log(`   • get-user-assets - Get all assets owned by a user`);
    console.log(`   • demo-flow - Run a complete demo`);
    console.log(`   • status - Show this status report`);

    console.log(`\n⚠️ Limited Functionality:`);
    console.log(`   • create-encrypted-asset - Requires frontend FHE encryption`);
    console.log(`   • convert-to-encrypted - Not fully implemented in AssetConverter`);
    console.log(`   • convert-to-nft - Depends on encrypted assets existing`);

    console.log(`\n📝 To test the system:`);
    console.log(`   1. npx hardhat mint-asset --to [address] --equiptype [1-4] --attack [number] --defense [number] --network localhost`);
    console.log(`   2. npx hardhat get-user-assets --address [address] --network localhost`);
    console.log(`   3. npx hardhat demo-flow --user [address] --network localhost`);
  });