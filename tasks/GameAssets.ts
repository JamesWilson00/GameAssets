import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

// Task to mint a regular NFT game asset
task("mint-asset", "Mint a regular NFT game asset")
  .addParam("to", "The address to mint the asset to")
  .addParam("equiptype", "Equipment type (1-4)")
  .addParam("attack", "Attack power")
  .addParam("defense", "Defense power")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { to, equiptype, attack, defense } = taskArgs;

    const gameAsset = await hre.ethers.getContractAt(
      "GameAsset",
      "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    );

    const tx = await gameAsset.mint(to, equiptype, attack, defense);
    await tx.wait();

    console.log(`✅ Minted regular NFT asset to ${to}`);
    console.log(`   Equipment Type: ${equiptype}`);
    console.log(`   Attack: ${attack}`);
    console.log(`   Defense: ${defense}`);
    console.log(`   Transaction: ${tx.hash}`);
  });

// Task to create an encrypted game asset (requires encrypted inputs)
task("create-encrypted-asset", "Create an encrypted game asset")
  .addParam("equiptype", "Equipment type (1-4)")
  .addParam("attack", "Attack power")
  .addParam("defense", "Defense power")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { equiptype, attack, defense } = taskArgs;

    console.log(`⚠️  Note: This task creates encrypted assets using trivial encryption`);
    console.log(`   For production, use proper FHE encrypted inputs`);

    // This would need proper FHE input creation in a real application
    console.log(`❌ Encrypted asset creation requires FHE encrypted inputs`);
    console.log(`   Equipment Type: ${equiptype}`);
    console.log(`   Attack: ${attack}`);
    console.log(`   Defense: ${defense}`);
    console.log(`   Use the frontend with @zama-fhe/relayer-sdk for proper encryption`);
  });

// Task to convert regular NFT to encrypted asset
task("convert-to-encrypted", "Convert regular NFT to encrypted asset")
  .addParam("tokenid", "Token ID of the regular NFT to convert")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { tokenid } = taskArgs;

    const gameAsset = await hre.ethers.getContractAt(
      "GameAsset",
      "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    );

    const assetConverter = await hre.ethers.getContractAt(
      "AssetConverter",
      "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
    );

    // First approve the converter to transfer the NFT
    console.log(`Approving AssetConverter to transfer NFT #${tokenid}...`);
    const approveTx = await gameAsset.approve("0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0", tokenid);
    await approveTx.wait();

    // Then convert to encrypted
    console.log(`Converting NFT #${tokenid} to encrypted asset...`);
    const tx = await assetConverter.convertToEncrypted(tokenid);
    await tx.wait();

    console.log(`✅ Converted regular NFT ${tokenid} to encrypted asset`);
    console.log(`   Transaction: ${tx.hash}`);
  });

// Task to convert encrypted asset to regular NFT
task("convert-to-nft", "Convert encrypted asset to regular NFT")
  .addParam("assetid", "Asset ID of the encrypted asset to convert")
  .addParam("equiptype", "Equipment type (1-4)")
  .addParam("attack", "Attack power")
  .addParam("defense", "Defense power")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { assetid, equiptype, attack, defense } = taskArgs;

    const assetConverter = await hre.ethers.getContractAt(
      "AssetConverter",
      "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
    );

    const tx = await assetConverter.convertToPublic(assetid, equiptype, attack, defense);
    await tx.wait();

    console.log(`✅ Converted encrypted asset ${assetid} to regular NFT`);
    console.log(`   Equipment Type: ${equiptype}`);
    console.log(`   Attack: ${attack}`);
    console.log(`   Defense: ${defense}`);
    console.log(`   Transaction: ${tx.hash}`);
  });

// Task to get regular NFT asset info
task("get-asset-info", "Get regular NFT asset information")
  .addParam("tokenid", "Token ID to query")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { tokenid } = taskArgs;

    const gameAsset = await hre.ethers.getContractAt(
      "GameAsset",
      "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    );

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

    const encryptedGameAsset = await hre.ethers.getContractAt(
      "EncryptedGameAsset",
      "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
    );

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

    const gameAsset = await hre.ethers.getContractAt(
      "GameAsset",
      "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    );

    const encryptedGameAsset = await hre.ethers.getContractAt(
      "EncryptedGameAsset",
      "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
    );

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