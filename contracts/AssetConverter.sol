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
        
        // Burn the NFT
        gameAssetContract.transferFrom(msg.sender, address(this), tokenId);
        
        // Create encrypted versions of the stats
        euint8 encryptedType = FHE.asEuint8(equipment.equipmentType);
        euint32 encryptedAttack = FHE.asEuint32(equipment.attackPower);
        euint32 encryptedDefense = FHE.asEuint32(equipment.defensePower);
        
        // Create encrypted asset by directly calling internal function
        uint256 encryptedAssetId = _createEncryptedAsset(
            encryptedType,
            encryptedAttack,
            encryptedDefense,
            msg.sender
        );
        
        emit AssetConverted(msg.sender, tokenId, encryptedAssetId, true);
        return encryptedAssetId;
    }

    // Convert encrypted asset back to regular NFT (requires decryption)
    function convertToPublic(
        uint256 assetId,
        uint8 equipmentType,
        uint32 attackPower,
        uint32 defensePower
    ) external returns (uint256) {
        require(encryptedGameAssetContract.getOwner(assetId) == msg.sender, "Not the owner of the encrypted asset");
        
        // Validate the provided values match the encrypted values
        // In a real implementation, this would require a zero-knowledge proof or decryption oracle
        // For now, we trust the user provides correct values
        require(equipmentType >= 1 && equipmentType <= 4, "Invalid equipment type");
        
        // Transfer encrypted asset to this contract (burn equivalent)
        encryptedGameAssetContract.transferEncryptedEquipment(assetId, address(this));
        
        // Mint new NFT with the decrypted values
        uint256 newTokenId = gameAssetContract.mint(msg.sender, equipmentType, attackPower, defensePower);
        
        emit EncryptedAssetConverted(msg.sender, assetId, newTokenId, true);
        return newTokenId;
    }

    // Internal function to create encrypted asset
    function _createEncryptedAsset(
        euint8 equipmentType,
        euint32 attackPower,
        euint32 defensePower,
        address owner
    ) internal returns (uint256) {
        // This would need to be implemented by modifying EncryptedGameAsset contract
        // or by making this contract have special permissions
        // For now, we'll use a simplified approach
        
        // Note: In a production system, you'd need a more sophisticated approach
        // to create encrypted assets from this converter contract
        revert("Direct encrypted asset creation not implemented - use createEncryptedEquipment");
    }

    // Alternative conversion method using external inputs for better security
    function convertToEncryptedSecure(
        uint256 tokenId,
        externalEuint8 equipmentType,
        externalEuint32 attackPower,
        externalEuint32 defensePower,
        bytes calldata inputProof
    ) external returns (uint256) {
        require(gameAssetContract.ownerOf(tokenId) == msg.sender, "Not the owner of the NFT");
        
        // Get equipment data from NFT for validation
        GameAsset.Equipment memory equipment = gameAssetContract.getEquipment(tokenId);
        
        // Convert external inputs to internal encrypted values
        euint8 encryptedType = FHE.fromExternal(equipmentType, inputProof);
        euint32 encryptedAttack = FHE.fromExternal(attackPower, inputProof);
        euint32 encryptedDefense = FHE.fromExternal(defensePower, inputProof);
        
        // In a production system, you'd want to verify the encrypted values match the NFT values
        // This could be done using zero-knowledge proofs or other cryptographic methods
        
        // Burn the NFT
        gameAssetContract.transferFrom(msg.sender, address(this), tokenId);
        
        // Create encrypted asset using the EncryptedGameAsset contract
        uint256 encryptedAssetId = encryptedGameAssetContract.createEncryptedEquipment(
            equipmentType,
            attackPower,
            defensePower,
            inputProof
        );
        
        emit AssetConverted(msg.sender, tokenId, encryptedAssetId, true);
        return encryptedAssetId;
    }

    // Batch conversion functions
    function batchConvertToEncrypted(uint256[] calldata tokenIds) external returns (uint256[] memory) {
        uint256[] memory encryptedAssetIds = new uint256[](tokenIds.length);
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(gameAssetContract.ownerOf(tokenIds[i]) == msg.sender, "Not the owner of the NFT");
            
            // Get equipment data from NFT
            GameAsset.Equipment memory equipment = gameAssetContract.getEquipment(tokenIds[i]);
            
            // Burn the NFT
            gameAssetContract.transferFrom(msg.sender, address(this), tokenIds[i]);
            
            // Create encrypted versions of the stats
            euint8 encryptedType = FHE.asEuint8(equipment.equipmentType);
            euint32 encryptedAttack = FHE.asEuint32(equipment.attackPower);
            euint32 encryptedDefense = FHE.asEuint32(equipment.defensePower);
            
            // For simplicity, we'll revert here as this requires complex encrypted asset creation
            revert("Use convertToEncryptedSecure for individual conversions");
        }
        
        return encryptedAssetIds;
    }

    function batchConvertToPublic(
        uint256[] calldata assetIds,
        uint8[] calldata equipmentTypes,
        uint32[] calldata attackPowers,
        uint32[] calldata defensePowers
    ) external returns (uint256[] memory) {
        require(
            assetIds.length == equipmentTypes.length &&
            assetIds.length == attackPowers.length &&
            assetIds.length == defensePowers.length,
            "Array lengths mismatch"
        );
        
        uint256[] memory tokenIds = new uint256[](assetIds.length);
        
        for (uint256 i = 0; i < assetIds.length; i++) {
            require(encryptedGameAssetContract.getOwner(assetIds[i]) == msg.sender, "Not the owner of the encrypted asset");
            
            // Validate the provided values
            require(equipmentTypes[i] >= 1 && equipmentTypes[i] <= 4, "Invalid equipment type");
            
            // Transfer encrypted asset to this contract (burn equivalent)
            encryptedGameAssetContract.transferEncryptedEquipment(assetIds[i], address(this));
            
            // Mint new NFT with the decrypted values
            tokenIds[i] = gameAssetContract.mint(msg.sender, equipmentTypes[i], attackPowers[i], defensePowers[i]);
            
            emit EncryptedAssetConverted(msg.sender, assetIds[i], tokenIds[i], true);
        }
        
        return tokenIds;
    }

    // View functions
    function getGameAssetContract() external view returns (address) {
        return address(gameAssetContract);
    }

    function getEncryptedGameAssetContract() external view returns (address) {
        return address(encryptedGameAssetContract);
    }
}