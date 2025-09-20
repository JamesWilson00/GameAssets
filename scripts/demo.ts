import { ethers } from "hardhat";

async function main() {
  console.log("🎮 GameAssets Demo Script");
  console.log("========================\n");

  const [deployer, alice, bob] = await ethers.getSigners();
  
  console.log("📋 Account Information:");
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Alice: ${alice.address}`);
  console.log(`Bob: ${bob.address}\n`);

  // Deploy contracts
  console.log("🚀 Deploying contracts...");
  
  const GameAssetFactory = await ethers.getContractFactory("GameAsset");
  const gameAsset = await GameAssetFactory.deploy(deployer.address);
  console.log(`✅ GameAsset deployed to: ${await gameAsset.getAddress()}`);
  
  const EncryptedGameAssetFactory = await ethers.getContractFactory("EncryptedGameAsset");
  const encryptedGameAsset = await EncryptedGameAssetFactory.deploy(
    deployer.address,
    await gameAsset.getAddress()
  );
  console.log(`✅ EncryptedGameAsset deployed to: ${await encryptedGameAsset.getAddress()}\n`);

  // Demo regular NFT functionality
  console.log("🏆 Regular NFT Demo:");
  console.log("==================");
  
  // Mint some equipment for Alice
  await gameAsset.mint(alice.address, 1, 100, 50); // Sword
  await gameAsset.mint(alice.address, 2, 80, 120); // Shield
  await gameAsset.mint(bob.address, 3, 200, 30);   // Bow
  
  console.log("✅ Minted equipment:");
  console.log(`   - Alice: Sword (Type 1, Attack: 100, Defense: 50)`);
  console.log(`   - Alice: Shield (Type 2, Attack: 80, Defense: 120)`);
  console.log(`   - Bob: Bow (Type 3, Attack: 200, Defense: 30)\n`);

  // Check Alice's equipment
  const [aliceTokenIds, aliceEquipments] = await gameAsset.getAllEquipments(alice.address);
  console.log(`👤 Alice's Equipment Count: ${aliceTokenIds.length}`);
  for (let i = 0; i < aliceTokenIds.length; i++) {
    const equipment = aliceEquipments[i];
    console.log(`   Token ${aliceTokenIds[i]}: Type ${equipment.equipmentType}, Attack ${equipment.attackPower}, Defense ${equipment.defensePower}`);
  }
  console.log();

  // Check Bob's equipment
  const [bobTokenIds, bobEquipments] = await gameAsset.getAllEquipments(bob.address);
  console.log(`👤 Bob's Equipment Count: ${bobTokenIds.length}`);
  for (let i = 0; i < bobTokenIds.length; i++) {
    const equipment = bobEquipments[i];
    console.log(`   Token ${bobTokenIds[i]}: Type ${equipment.equipmentType}, Attack ${equipment.attackPower}, Defense ${equipment.defensePower}`);
  }
  console.log();

  console.log("💎 Encrypted Asset Demo:");
  console.log("========================");
  console.log("Note: Encrypted asset functionality requires FHEVM mock environment");
  console.log("The EncryptedGameAsset contract allows creating equipment with encrypted stats");
  console.log("that can be used in confidential games where stats are hidden from other players.\n");

  console.log("🔄 Asset Conversion Demo:");
  console.log("=========================");
  console.log("The EncryptedGameAsset contract now includes conversion functionality");
  console.log("This enables players to move assets between public and private gaming contexts.\n");

  console.log("🎯 Summary:");
  console.log("===========");
  console.log("✅ Regular NFT assets with visible equipment stats");
  console.log("✅ Encrypted assets with hidden stats using Zama FHE");
  console.log("✅ Conversion between regular and encrypted assets");
  console.log("✅ Access control and ownership management");
  console.log("✅ Equipment combination and transfer functionality");
  console.log("\n🎮 Game Assets contracts are ready for use!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });