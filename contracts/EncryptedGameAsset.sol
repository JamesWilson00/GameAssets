// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, euint32, externalEuint8, externalEuint32, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./GameAsset.sol";

contract EncryptedGameAsset is SepoliaConfig, AccessControl {
    struct EncryptedEquipment {
        euint8 equipmentType; // Encrypted equipment type (1-4)
        euint32 attackPower; // Encrypted attack power
        euint32 defensePower; // Encrypted defense power
        address owner; // Owner address (not encrypted)
    }

    bytes32 public constant CONVERTER_ROLE = keccak256("CONVERTER_ROLE");

    GameAsset public gameAssetContract;

    mapping(uint256 => EncryptedEquipment) public encryptedEquipments;
    mapping(address => uint256[]) public ownerEquipments;
    uint256 private _nextAssetId;

    event EncryptedEquipmentCreated(uint256 indexed assetId, address indexed owner);
    event EncryptedEquipmentTransferred(uint256 indexed assetId, address indexed from, address indexed to);
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

    constructor(address initialOwner, address _gameAssetContract) {
        _nextAssetId = 1;
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        gameAssetContract = GameAsset(_gameAssetContract);
    }


    function transferEncryptedEquipment(uint256 assetId, address to) external {
        require(encryptedEquipments[assetId].owner == msg.sender, "Not the owner");
        require(to != address(0), "Invalid recipient");

        address from = msg.sender;
        encryptedEquipments[assetId].owner = to;

        // Remove from sender's list
        uint256[] storage fromEquipments = ownerEquipments[from];
        for (uint256 i = 0; i < fromEquipments.length; i++) {
            if (fromEquipments[i] == assetId) {
                fromEquipments[i] = fromEquipments[fromEquipments.length - 1];
                fromEquipments.pop();
                break;
            }
        }

        // Add to recipient's list
        ownerEquipments[to].push(assetId);

        // Update ACL permissions
        FHE.allow(encryptedEquipments[assetId].equipmentType, to);
        FHE.allow(encryptedEquipments[assetId].attackPower, to);
        FHE.allow(encryptedEquipments[assetId].defensePower, to);

        emit EncryptedEquipmentTransferred(assetId, from, to);
    }

    function getEncryptedEquipmentType(uint256 assetId) external view returns (euint8) {
        require(encryptedEquipments[assetId].owner != address(0), "Equipment does not exist");
        return encryptedEquipments[assetId].equipmentType;
    }

    function getEncryptedAttackPower(uint256 assetId) external view returns (euint32) {
        require(encryptedEquipments[assetId].owner != address(0), "Equipment does not exist");
        return encryptedEquipments[assetId].attackPower;
    }

    function getEncryptedDefensePower(uint256 assetId) external view returns (euint32) {
        require(encryptedEquipments[assetId].owner != address(0), "Equipment does not exist");
        return encryptedEquipments[assetId].defensePower;
    }

    function getOwner(uint256 assetId) external view returns (address) {
        return encryptedEquipments[assetId].owner;
    }

    function getOwnerEquipmentIds(address owner) external view returns (uint256[] memory) {
        return ownerEquipments[owner];
    }

    function getEquipmentCount(address owner) external view returns (uint256) {
        return ownerEquipments[owner].length;
    }

    function equipmentExists(uint256 assetId) external view returns (bool) {
        return encryptedEquipments[assetId].owner != address(0);
    }

    // Convert regular NFT to encrypted asset
    function convertToEncrypted(uint256 tokenId) external {
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

        // Create encrypted asset using the internal function
        uint256 encryptedAssetId = _createEncryptedEquipment(
            encryptedType,
            encryptedAttack,
            encryptedDefense,
            msg.sender
        );

        emit AssetConverted(msg.sender, tokenId, encryptedAssetId, true);
    }

    // Internal function to create encrypted equipment
    function _createEncryptedEquipment(
        euint8 equipmentType,
        euint32 attackPower,
        euint32 defensePower,
        address owner
    ) internal returns (uint256) {
        uint256 assetId = _nextAssetId;
        _nextAssetId++;

        encryptedEquipments[assetId] = EncryptedEquipment({
            equipmentType: equipmentType,
            attackPower: attackPower,
            defensePower: defensePower,
            owner: owner
        });

        ownerEquipments[owner].push(assetId);

        // Set ACL permissions
        FHE.allowThis(equipmentType);
        FHE.allowThis(attackPower);
        FHE.allowThis(defensePower);
        FHE.allow(equipmentType, owner);
        FHE.allow(attackPower, owner);
        FHE.allow(defensePower, owner);

        emit EncryptedEquipmentCreated(assetId, owner);
        return assetId;
    }

    // Update the existing function to use the internal function
    function createEncryptedEquipmentFromConverter(
        euint8 equipmentType,
        euint32 attackPower,
        euint32 defensePower,
        address owner
    ) external onlyRole(CONVERTER_ROLE) returns (uint256) {
        return _createEncryptedEquipment(equipmentType, attackPower, defensePower, owner);
    }

    // Function to set the GameAsset contract address (only admin)
    function setGameAssetContract(address _gameAssetContract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        gameAssetContract = GameAsset(_gameAssetContract);
    }

    // View function to get the GameAsset contract address
    function getGameAssetContract() external view returns (address) {
        return address(gameAssetContract);
    }
}
