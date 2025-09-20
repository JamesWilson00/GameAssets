import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { GameAsset, GameAsset__factory } from "../types";
import { expect } from "chai";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const signers: HardhatEthersSigner[] = await ethers.getSigners();
  const deployer = signers[0];
  
  const factory = (await ethers.getContractFactory("GameAsset")) as GameAsset__factory;
  const gameAssetContract = (await factory.deploy(deployer.address)) as GameAsset;
  const gameAssetContractAddress = await gameAssetContract.getAddress();

  return { gameAssetContract, gameAssetContractAddress };
}

describe("GameAsset", function () {
  let signers: Signers;
  let gameAssetContract: GameAsset;
  let gameAssetContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    ({ gameAssetContract, gameAssetContractAddress } = await deployFixture());
  });

  it("should deploy with correct name and symbol", async function () {
    expect(await gameAssetContract.name()).to.equal("GameAsset");
    expect(await gameAssetContract.symbol()).to.equal("GA");
  });

  it("should mint equipment with valid parameters", async function () {
    const equipmentType = 1;
    const attackPower = 100;
    const defensePower = 50;

    const tx = await gameAssetContract.mint(signers.alice.address, equipmentType, attackPower, defensePower);
    const receipt = await tx.wait();

    // Check if EquipmentMinted event was emitted
    const events = receipt?.logs || [];
    expect(events.length).to.be.greaterThan(0);

    // Check token ownership
    expect(await gameAssetContract.ownerOf(1)).to.equal(signers.alice.address);
    expect(await gameAssetContract.balanceOf(signers.alice.address)).to.equal(1);

    // Check equipment data
    const equipment = await gameAssetContract.getEquipment(1);
    expect(equipment.equipmentType).to.equal(equipmentType);
    expect(equipment.attackPower).to.equal(attackPower);
    expect(equipment.defensePower).to.equal(defensePower);
  });

  it("should revert when minting with invalid equipment type", async function () {
    await expect(
      gameAssetContract.mint(signers.alice.address, 0, 100, 50)
    ).to.be.revertedWith("Invalid equipment type");

    await expect(
      gameAssetContract.mint(signers.alice.address, 5, 100, 50)
    ).to.be.revertedWith("Invalid equipment type");
  });

  it("should allow only minter role to mint", async function () {
    await expect(
      gameAssetContract.connect(signers.alice).mint(signers.alice.address, 1, 100, 50)
    ).to.be.revertedWithCustomError(gameAssetContract, "AccessControlUnauthorizedAccount");
  });

  it("should return all equipments for an owner", async function () {
    // Mint multiple equipments for Alice
    await gameAssetContract.mint(signers.alice.address, 1, 100, 50);
    await gameAssetContract.mint(signers.alice.address, 2, 150, 75);
    await gameAssetContract.mint(signers.alice.address, 3, 200, 100);

    const [tokenIds, equipments] = await gameAssetContract.getAllEquipments(signers.alice.address);

    expect(tokenIds.length).to.equal(3);
    expect(equipments.length).to.equal(3);

    expect(tokenIds[0]).to.equal(1);
    expect(tokenIds[1]).to.equal(2);
    expect(tokenIds[2]).to.equal(3);

    expect(equipments[0].equipmentType).to.equal(1);
    expect(equipments[0].attackPower).to.equal(100);
    expect(equipments[0].defensePower).to.equal(50);

    expect(equipments[1].equipmentType).to.equal(2);
    expect(equipments[1].attackPower).to.equal(150);
    expect(equipments[1].defensePower).to.equal(75);

    expect(equipments[2].equipmentType).to.equal(3);
    expect(equipments[2].attackPower).to.equal(200);
    expect(equipments[2].defensePower).to.equal(100);
  });

  it("should support token transfers", async function () {
    await gameAssetContract.mint(signers.alice.address, 1, 100, 50);

    // Transfer from Alice to Bob
    await gameAssetContract.connect(signers.alice).transferFrom(
      signers.alice.address, 
      signers.bob.address, 
      1
    );

    expect(await gameAssetContract.ownerOf(1)).to.equal(signers.bob.address);
    expect(await gameAssetContract.balanceOf(signers.alice.address)).to.equal(0);
    expect(await gameAssetContract.balanceOf(signers.bob.address)).to.equal(1);
  });

  it("should increment token IDs correctly", async function () {
    await gameAssetContract.mint(signers.alice.address, 1, 100, 50);
    await gameAssetContract.mint(signers.bob.address, 2, 150, 75);

    expect(await gameAssetContract.ownerOf(1)).to.equal(signers.alice.address);
    expect(await gameAssetContract.ownerOf(2)).to.equal(signers.bob.address);

    const equipment1 = await gameAssetContract.getEquipment(1);
    const equipment2 = await gameAssetContract.getEquipment(2);

    expect(equipment1.equipmentType).to.equal(1);
    expect(equipment2.equipmentType).to.equal(2);
  });

  it("should revert when getting equipment that doesn't exist", async function () {
    await expect(
      gameAssetContract.getEquipment(999)
    ).to.be.revertedWith("Equipment does not exist");
  });
});