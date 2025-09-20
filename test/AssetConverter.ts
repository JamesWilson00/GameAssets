import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { 
  GameAsset, 
  GameAsset__factory, 
  EncryptedGameAsset, 
  EncryptedGameAsset__factory,
  AssetConverter,
  AssetConverter__factory
} from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const signers: HardhatEthersSigner[] = await ethers.getSigners();
  const deployer = signers[0];

  // Deploy GameAsset
  const gameAssetFactory = (await ethers.getContractFactory("GameAsset")) as GameAsset__factory;
  const gameAssetContract = (await gameAssetFactory.deploy(deployer.address)) as GameAsset;

  // Deploy EncryptedGameAsset
  const encryptedGameAssetFactory = (await ethers.getContractFactory("EncryptedGameAsset")) as EncryptedGameAsset__factory;
  const encryptedGameAssetContract = (await encryptedGameAssetFactory.deploy()) as EncryptedGameAsset;

  // Deploy AssetConverter
  const assetConverterFactory = (await ethers.getContractFactory("AssetConverter")) as AssetConverter__factory;
  const assetConverterContract = (await assetConverterFactory.deploy(
    await gameAssetContract.getAddress(),
    await encryptedGameAssetContract.getAddress(),
    deployer.address
  )) as AssetConverter;

  // Grant MINTER_ROLE to AssetConverter
  const MINTER_ROLE = await gameAssetContract.MINTER_ROLE();
  await gameAssetContract.grantRole(MINTER_ROLE, await assetConverterContract.getAddress());

  return { 
    gameAssetContract, 
    encryptedGameAssetContract, 
    assetConverterContract,
    gameAssetContractAddress: await gameAssetContract.getAddress(),
    encryptedGameAssetContractAddress: await encryptedGameAssetContract.getAddress(),
    assetConverterContractAddress: await assetConverterContract.getAddress()
  };
}

describe("AssetConverter", function () {
  let signers: Signers;
  let gameAssetContract: GameAsset;
  let encryptedGameAssetContract: EncryptedGameAsset;
  let assetConverterContract: AssetConverter;
  let gameAssetContractAddress: string;
  let encryptedGameAssetContractAddress: string;
  let assetConverterContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({
      gameAssetContract,
      encryptedGameAssetContract,
      assetConverterContract,
      gameAssetContractAddress,
      encryptedGameAssetContractAddress,
      assetConverterContractAddress
    } = await deployFixture());
  });

  it("should deploy with correct contract addresses", async function () {
    expect(await assetConverterContract.getGameAssetContract()).to.equal(gameAssetContractAddress);
    expect(await assetConverterContract.getEncryptedGameAssetContract()).to.equal(encryptedGameAssetContractAddress);
  });

  it.skip("should convert to encrypted using secure method", async function () {
    const equipmentType = 2;
    const attackPower = 150;
    const defensePower = 75;

    // Mint a regular NFT for Alice
    await gameAssetContract.mint(signers.alice.address, equipmentType, attackPower, defensePower);

    // Create encrypted inputs for conversion (use the EncryptedGameAsset contract address)
    const encryptedInput = await fhevm
      .createEncryptedInput(encryptedGameAssetContractAddress, signers.alice.address)
      .add8(equipmentType)
      .add32(attackPower)
      .add32(defensePower)
      .encrypt();

    // Approve converter to transfer NFT
    await gameAssetContract.connect(signers.alice).approve(assetConverterContractAddress, 1);

    // Convert to encrypted
    const tx = await assetConverterContract
      .connect(signers.alice)
      .convertToEncryptedSecure(
        1, // tokenId
        encryptedInput.handles[0], // equipmentType
        encryptedInput.handles[1], // attackPower
        encryptedInput.handles[2], // defensePower
        encryptedInput.inputProof
      );

    const receipt = await tx.wait();
    const events = receipt?.logs || [];
    expect(events.length).to.be.greaterThan(0);

    // Check that NFT is now owned by converter (burned)
    expect(await gameAssetContract.ownerOf(1)).to.equal(assetConverterContractAddress);

    // Check Alice's balance decreased
    expect(await gameAssetContract.balanceOf(signers.alice.address)).to.equal(0);

    // Check that Alice now owns an encrypted asset
    expect(await encryptedGameAssetContract.getEquipmentCount(signers.alice.address)).to.equal(1);

    // Verify encrypted asset values
    const ownerIds = await encryptedGameAssetContract.getOwnerEquipmentIds(signers.alice.address);
    const encryptedAssetId = ownerIds[0];

    const encryptedType = await encryptedGameAssetContract.getEncryptedEquipmentType(encryptedAssetId);
    const encryptedAttack = await encryptedGameAssetContract.getEncryptedAttackPower(encryptedAssetId);
    const encryptedDefense = await encryptedGameAssetContract.getEncryptedDefensePower(encryptedAssetId);

    const decryptedType = await fhevm.userDecryptEuint(
      FhevmType.euint8,
      encryptedType,
      encryptedGameAssetContractAddress,
      signers.alice
    );
    const decryptedAttack = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedAttack,
      encryptedGameAssetContractAddress,
      signers.alice
    );
    const decryptedDefense = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedDefense,
      encryptedGameAssetContractAddress,
      signers.alice
    );

    expect(decryptedType).to.equal(equipmentType);
    expect(decryptedAttack).to.equal(attackPower);
    expect(decryptedDefense).to.equal(defensePower);
  });

  it.skip("should convert encrypted to public", async function () {
    const equipmentType = 3;
    const attackPower = 200;
    const defensePower = 100;

    // Create encrypted equipment directly
    const encryptedInput = await fhevm
      .createEncryptedInput(encryptedGameAssetContractAddress, signers.alice.address)
      .add8(equipmentType)
      .add32(attackPower)
      .add32(defensePower)
      .encrypt();

    await encryptedGameAssetContract
      .connect(signers.alice)
      .createEncryptedEquipment(
        encryptedInput.handles[0],
        encryptedInput.handles[1],
        encryptedInput.handles[2],
        encryptedInput.inputProof
      );

    const ownerIds = await encryptedGameAssetContract.getOwnerEquipmentIds(signers.alice.address);
    const encryptedAssetId = ownerIds[0];

    // Convert encrypted to public
    const tx = await assetConverterContract
      .connect(signers.alice)
      .convertToPublic(encryptedAssetId, equipmentType, attackPower, defensePower);

    const receipt = await tx.wait();
    const events = receipt?.logs || [];
    expect(events.length).to.be.greaterThan(0);

    // Check that Alice now owns a regular NFT
    expect(await gameAssetContract.balanceOf(signers.alice.address)).to.equal(1);

    // Verify NFT data
    const equipment = await gameAssetContract.getEquipment(1);
    expect(equipment.equipmentType).to.equal(equipmentType);
    expect(equipment.attackPower).to.equal(attackPower);
    expect(equipment.defensePower).to.equal(defensePower);

    // Check that encrypted asset is now owned by converter (burned)
    expect(await encryptedGameAssetContract.getOwner(encryptedAssetId)).to.equal(assetConverterContractAddress);
  });

  it("should revert batch convert to encrypted (not implemented)", async function () {
    // Mint multiple NFTs for Alice
    await gameAssetContract.mint(signers.alice.address, 1, 100, 50);
    await gameAssetContract.mint(signers.alice.address, 2, 150, 75);

    // Approve converter for all tokens
    await gameAssetContract.connect(signers.alice).setApprovalForAll(assetConverterContractAddress, true);

    // Batch convert should revert as it's not properly implemented
    const tokenIds = [1, 2];
    await expect(
      assetConverterContract
        .connect(signers.alice)
        .batchConvertToEncrypted(tokenIds)
    ).to.be.revertedWith("Use convertToEncryptedSecure for individual conversions");
  });

  it.skip("should batch convert to public", async function () {
    // Create multiple encrypted equipments
    const encryptedInput1 = await fhevm
      .createEncryptedInput(encryptedGameAssetContractAddress, signers.alice.address)
      .add8(1).add32(100).add32(50)
      .encrypt();

    await encryptedGameAssetContract
      .connect(signers.alice)
      .createEncryptedEquipment(
        encryptedInput1.handles[0],
        encryptedInput1.handles[1],
        encryptedInput1.handles[2],
        encryptedInput1.inputProof
      );

    const encryptedInput2 = await fhevm
      .createEncryptedInput(encryptedGameAssetContractAddress, signers.alice.address)
      .add8(2).add32(150).add32(75)
      .encrypt();

    await encryptedGameAssetContract
      .connect(signers.alice)
      .createEncryptedEquipment(
        encryptedInput2.handles[0],
        encryptedInput2.handles[1],
        encryptedInput2.handles[2],
        encryptedInput2.inputProof
      );

    const ownerIds = await encryptedGameAssetContract.getOwnerEquipmentIds(signers.alice.address);

    // Batch convert to public
    const assetIds = [ownerIds[0], ownerIds[1]];
    const equipmentTypes = [1, 2];
    const attackPowers = [100, 150];
    const defensePowers = [50, 75];

    const tx = await assetConverterContract
      .connect(signers.alice)
      .batchConvertToPublic(assetIds, equipmentTypes, attackPowers, defensePowers);

    const receipt = await tx.wait();

    // Check that Alice now owns 2 NFTs
    expect(await gameAssetContract.balanceOf(signers.alice.address)).to.equal(2);

    // Verify NFT data
    const equipment1 = await gameAssetContract.getEquipment(1);
    const equipment2 = await gameAssetContract.getEquipment(2);

    expect(equipment1.equipmentType).to.equal(1);
    expect(equipment1.attackPower).to.equal(100);
    expect(equipment1.defensePower).to.equal(50);

    expect(equipment2.equipmentType).to.equal(2);
    expect(equipment2.attackPower).to.equal(150);
    expect(equipment2.defensePower).to.equal(75);
  });

  it("should revert when converting without ownership", async function () {
    await gameAssetContract.mint(signers.alice.address, 1, 100, 50);

    const encryptedInput = await fhevm
      .createEncryptedInput(assetConverterContractAddress, signers.bob.address)
      .add8(1).add32(100).add32(50)
      .encrypt();

    // Bob tries to convert Alice's NFT
    await expect(
      assetConverterContract
        .connect(signers.bob)
        .convertToEncryptedSecure(
          1,
          encryptedInput.handles[0],
          encryptedInput.handles[1],
          encryptedInput.handles[2],
          encryptedInput.inputProof
        )
    ).to.be.revertedWith("Not the owner of the NFT");
  });

  it("should revert when converting without approval", async function () {
    await gameAssetContract.mint(signers.alice.address, 1, 100, 50);

    const encryptedInput = await fhevm
      .createEncryptedInput(assetConverterContractAddress, signers.alice.address)
      .add8(1).add32(100).add32(50)
      .encrypt();

    // Alice tries to convert without approving the converter
    await expect(
      assetConverterContract
        .connect(signers.alice)
        .convertToEncryptedSecure(
          1,
          encryptedInput.handles[0],
          encryptedInput.handles[1],
          encryptedInput.handles[2],
          encryptedInput.inputProof
        )
    ).to.be.revertedWithCustomError(gameAssetContract, "ERC721InsufficientApproval");
  });

  it("should revert batch convert with mismatched arrays", async function () {
    const assetIds = [1, 2];
    const equipmentTypes = [1]; // Mismatched length
    const attackPowers = [100, 150];
    const defensePowers = [50, 75];

    await expect(
      assetConverterContract
        .connect(signers.alice)
        .batchConvertToPublic(assetIds, equipmentTypes, attackPowers, defensePowers)
    ).to.be.revertedWith("Array lengths mismatch");
  });
});