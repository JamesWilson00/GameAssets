import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploying Game Assets contracts...");

  // Deploy GameAsset contract
  const deployedGameAsset = await deploy("GameAsset", {
    from: deployer,
    args: [deployer], // initialOwner parameter
    log: true,
  });
  console.log(`GameAsset contract: `, deployedGameAsset.address);

  // Deploy EncryptedGameAsset contract
  const deployedEncryptedGameAsset = await deploy("EncryptedGameAsset", {
    from: deployer,
    args: [deployer], // initialOwner parameter
    log: true,
  });
  console.log(`EncryptedGameAsset contract: `, deployedEncryptedGameAsset.address);

  // Deploy AssetConverter contract
  const deployedAssetConverter = await deploy("AssetConverter", {
    from: deployer,
    args: [deployedGameAsset.address, deployedEncryptedGameAsset.address, deployer],
    log: true,
  });
  console.log(`AssetConverter contract: `, deployedAssetConverter.address);

  // Grant MINTER_ROLE to AssetConverter so it can mint NFTs
  const gameAsset = await hre.ethers.getContractAt("GameAsset", deployedGameAsset.address);
  const MINTER_ROLE = await gameAsset.MINTER_ROLE();
  await gameAsset.grantRole(MINTER_ROLE, deployedAssetConverter.address);
  console.log(`Granted MINTER_ROLE to AssetConverter contract`);

  // Grant CONVERTER_ROLE to AssetConverter so it can create encrypted assets
  const encryptedGameAsset = await hre.ethers.getContractAt("EncryptedGameAsset", deployedEncryptedGameAsset.address);
  const CONVERTER_ROLE = await encryptedGameAsset.CONVERTER_ROLE();
  await encryptedGameAsset.grantRole(CONVERTER_ROLE, deployedAssetConverter.address);
  console.log(`Granted CONVERTER_ROLE to AssetConverter contract`);

  console.log("All Game Assets contracts deployed successfully!");
};

export default func;
func.id = "deploy_game_assets";
func.tags = ["GameAssets"];