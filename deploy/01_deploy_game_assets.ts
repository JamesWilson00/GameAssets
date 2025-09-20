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

  // Deploy EncryptedGameAsset contract with GameAsset address
  const deployedEncryptedGameAsset = await deploy("EncryptedGameAsset", {
    from: deployer,
    args: [deployer, deployedGameAsset.address], // initialOwner and gameAssetContract parameters
    log: true,
  });
  console.log(`EncryptedGameAsset contract: `, deployedEncryptedGameAsset.address);

  console.log("All Game Assets contracts deployed successfully!");
};

export default func;
func.id = "deploy_game_assets";
func.tags = ["GameAssets"];