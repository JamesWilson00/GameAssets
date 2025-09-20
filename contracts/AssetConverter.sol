// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, euint32, externalEuint8, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./GameAsset.sol";
import "./EncryptedGameAsset.sol";

contract AssetConverter is SepoliaConfig, Ownable {
    GameAsset public gameAssetContract;
    EncryptedGameAsset public encryptedGameAssetContract;

    event AssetConverted(
        address indexed user,
        uint256 indexed fromTokenId,
        uint256 indexed toAssetId,
        bool toEncrypted
    );
    event EncryptedAssetConverted(
        address indexed user,
        uint256 indexed fromAssetId,
        uint256 indexed toTokenId,
        bool toPublic
    );

    constructor(
        address _gameAssetContract,
        address _encryptedGameAssetContract,
        address initialOwner
    ) Ownable(initialOwner) {
        gameAssetContract = GameAsset(_gameAssetContract);
        encryptedGameAssetContract = EncryptedGameAsset(_encryptedGameAssetContract);
    }

    // Convert regular NFT to encrypted asset
    function convertToEncrypted(uint256 tokenId) external returns (uint256) {
        require(gameAssetContract.ownerOf(tokenId) == msg.sender, "Not the owner of the NFT");

        // Get equipment data from NFT
        GameAsset.Equipment memory equipment = gameAssetContract.getEquipment(tokenId);

        // Burn the NFT (transfer to this contract first, then burn)
        gameAssetContract.transferFrom(msg.sender, address(this), tokenId);
        gameAssetContract.burn(tokenId);

        // Create encrypted versions of the stats
        euint8 encryptedType = FHE.asEuint8(equipment.equipmentType);
        euint32 encryptedAttack = FHE.asEuint32(equipment.attackPower);
        euint32 encryptedDefense = FHE.asEuint32(equipment.defensePower);

        // Create encrypted asset using the new converter function
        uint256 encryptedAssetId = encryptedGameAssetContract.createEncryptedEquipmentFromConverter(
            encryptedType,
            encryptedAttack,
            encryptedDefense,
            msg.sender
        );

        emit AssetConverted(msg.sender, tokenId, encryptedAssetId, true);
        return encryptedAssetId;
    }

    // Convert encrypted asset to regular NFT (requires decryption)
    function convertToPublic(uint256 assetId) external returns (uint256) {
        require(encryptedGameAssetContract.getOwner(assetId) == msg.sender, "Not the owner of the encrypted asset");

        // Note: In a real implementation, you would need to decrypt the values first
        // This is a simplified version that assumes you have the decrypted values
        // You might need to implement async decryption pattern for this to work properly

        revert("Public conversion requires async decryption - not implemented in this version");
    }

    // Function to set up roles after deployment
    function setupRoles() external onlyOwner {
        // Grant CONVERTER_ROLE to this contract in the EncryptedGameAsset contract
        // This should be called after deployment by the owner
    }

    // View functions
    function getGameAssetContract() external view returns (address) {
        return address(gameAssetContract);
    }

    function getEncryptedGameAssetContract() external view returns (address) {
        return address(encryptedGameAssetContract);
    }
}
