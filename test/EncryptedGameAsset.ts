import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { EncryptedGameAsset, EncryptedGameAsset__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("EncryptedGameAsset")) as EncryptedGameAsset__factory;
  const encryptedGameAssetContract = (await factory.deploy()) as EncryptedGameAsset;
  const encryptedGameAssetContractAddress = await encryptedGameAssetContract.getAddress();

  return { encryptedGameAssetContract, encryptedGameAssetContractAddress };
}

describe("EncryptedGameAsset", function () {
  let signers: Signers;
  let encryptedGameAssetContract: EncryptedGameAsset;
  let encryptedGameAssetContractAddress: string;

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

    ({ encryptedGameAssetContract, encryptedGameAssetContractAddress } = await deployFixture());
  });

  it("should create encrypted equipment", async function () {
    const equipmentType = 1;
    const attackPower = 100;
    const defensePower = 50;

    // Create encrypted inputs
    const encryptedInput = await fhevm
      .createEncryptedInput(encryptedGameAssetContractAddress, signers.alice.address)
      .add8(equipmentType)   // euint8 for equipment type
      .add32(attackPower)    // euint32 for attack power
      .add32(defensePower)   // euint32 for defense power
      .encrypt();

    const tx = await encryptedGameAssetContract
      .connect(signers.alice)
      .createEncryptedEquipment(
        encryptedInput.handles[0], // equipmentType
        encryptedInput.handles[1], // attackPower
        encryptedInput.handles[2], // defensePower
        encryptedInput.inputProof
      );

    const receipt = await tx.wait();
    const events = receipt?.logs || [];
    expect(events.length).to.be.greaterThan(0);

    // Check owner
    expect(await encryptedGameAssetContract.getOwner(1)).to.equal(signers.alice.address);

    // Check equipment count
    expect(await encryptedGameAssetContract.getEquipmentCount(signers.alice.address)).to.equal(1);

    // Check equipment exists
    expect(await encryptedGameAssetContract.equipmentExists(1)).to.be.true;

    // Check owner's equipment IDs
    const ownerIds = await encryptedGameAssetContract.getOwnerEquipmentIds(signers.alice.address);
    expect(ownerIds.length).to.equal(1);
    expect(ownerIds[0]).to.equal(1);
  });

  it("should decrypt encrypted equipment values", async function () {
    const equipmentType = 2;
    const attackPower = 150;
    const defensePower = 75;

    // Create encrypted inputs
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

    // Get encrypted values
    const encryptedType = await encryptedGameAssetContract.getEncryptedEquipmentType(1);
    const encryptedAttack = await encryptedGameAssetContract.getEncryptedAttackPower(1);
    const encryptedDefense = await encryptedGameAssetContract.getEncryptedDefensePower(1);

    // Decrypt values
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

  it("should handle invalid equipment type", async function () {
    const equipmentType = 0; // Invalid type
    const attackPower = 100;
    const defensePower = 50;

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

    // The contract should default invalid type to 1
    const encryptedType = await encryptedGameAssetContract.getEncryptedEquipmentType(1);
    const decryptedType = await fhevm.userDecryptEuint(
      FhevmType.euint8,
      encryptedType,
      encryptedGameAssetContractAddress,
      signers.alice
    );

    expect(decryptedType).to.equal(1); // Should be defaulted to 1
  });

  it("should transfer encrypted equipment", async function () {
    const equipmentType = 1;
    const attackPower = 100;
    const defensePower = 50;

    // Create encrypted equipment for Alice
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

    // Transfer to Bob
    await encryptedGameAssetContract
      .connect(signers.alice)
      .transferEncryptedEquipment(1, signers.bob.address);

    // Check new owner
    expect(await encryptedGameAssetContract.getOwner(1)).to.equal(signers.bob.address);

    // Check equipment counts
    expect(await encryptedGameAssetContract.getEquipmentCount(signers.alice.address)).to.equal(0);
    expect(await encryptedGameAssetContract.getEquipmentCount(signers.bob.address)).to.equal(1);

    // Check Bob can decrypt the values
    const encryptedType = await encryptedGameAssetContract.getEncryptedEquipmentType(1);
    const decryptedType = await fhevm.userDecryptEuint(
      FhevmType.euint8,
      encryptedType,
      encryptedGameAssetContractAddress,
      signers.bob
    );

    expect(decryptedType).to.equal(equipmentType);
  });

  it("should combine equipments", async function () {
    // Create first equipment
    const encryptedInput1 = await fhevm
      .createEncryptedInput(encryptedGameAssetContractAddress, signers.alice.address)
      .add8(1)   // type 1
      .add32(100) // attack 100
      .add32(50)  // defense 50
      .encrypt();

    await encryptedGameAssetContract
      .connect(signers.alice)
      .createEncryptedEquipment(
        encryptedInput1.handles[0],
        encryptedInput1.handles[1],
        encryptedInput1.handles[2],
        encryptedInput1.inputProof
      );

    // Create second equipment
    const encryptedInput2 = await fhevm
      .createEncryptedInput(encryptedGameAssetContractAddress, signers.alice.address)
      .add8(2)   // type 2
      .add32(75)  // attack 75
      .add32(25)  // defense 25
      .encrypt();

    await encryptedGameAssetContract
      .connect(signers.alice)
      .createEncryptedEquipment(
        encryptedInput2.handles[0],
        encryptedInput2.handles[1],
        encryptedInput2.handles[2],
        encryptedInput2.inputProof
      );

    // Combine equipments
    const combineTx = await encryptedGameAssetContract
      .connect(signers.alice)
      .combineEquipments(1, 2);

    await combineTx.wait();

    // Check that Alice now has 1 equipment (the combined one)
    expect(await encryptedGameAssetContract.getEquipmentCount(signers.alice.address)).to.equal(1);

    // Check that the combined equipment has the right values
    const ownerIds = await encryptedGameAssetContract.getOwnerEquipmentIds(signers.alice.address);
    const combinedId = ownerIds[0];

    const encryptedType = await encryptedGameAssetContract.getEncryptedEquipmentType(combinedId);
    const encryptedAttack = await encryptedGameAssetContract.getEncryptedAttackPower(combinedId);
    const encryptedDefense = await encryptedGameAssetContract.getEncryptedDefensePower(combinedId);

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

    expect(decryptedType).to.equal(2); // Higher type wins
    expect(decryptedAttack).to.equal(175); // 100 + 75
    expect(decryptedDefense).to.equal(75); // 50 + 25

    // Check that original equipments are deleted
    expect(await encryptedGameAssetContract.equipmentExists(1)).to.be.false;
    expect(await encryptedGameAssetContract.equipmentExists(2)).to.be.false;
  });

  it("should revert transfer for non-owner", async function () {
    const encryptedInput = await fhevm
      .createEncryptedInput(encryptedGameAssetContractAddress, signers.alice.address)
      .add8(1)
      .add32(100)
      .add32(50)
      .encrypt();

    await encryptedGameAssetContract
      .connect(signers.alice)
      .createEncryptedEquipment(
        encryptedInput.handles[0],
        encryptedInput.handles[1],
        encryptedInput.handles[2],
        encryptedInput.inputProof
      );

    // Bob tries to transfer Alice's equipment
    await expect(
      encryptedGameAssetContract
        .connect(signers.bob)
        .transferEncryptedEquipment(1, signers.bob.address)
    ).to.be.revertedWith("Not the owner");
  });

  it("should revert when accessing non-existent equipment", async function () {
    await expect(
      encryptedGameAssetContract.getEncryptedEquipmentType(999)
    ).to.be.revertedWith("Equipment does not exist");

    await expect(
      encryptedGameAssetContract.getEncryptedAttackPower(999)
    ).to.be.revertedWith("Equipment does not exist");

    await expect(
      encryptedGameAssetContract.getEncryptedDefensePower(999)
    ).to.be.revertedWith("Equipment does not exist");
  });
});