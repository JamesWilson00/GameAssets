// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, euint32, externalEuint8, externalEuint32, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract EncryptedGameAsset is SepoliaConfig, AccessControl {
    struct EncryptedEquipment {
        euint8 equipmentType;   // Encrypted equipment type (1-4)
        euint32 attackPower;    // Encrypted attack power
        euint32 defensePower;   // Encrypted defense power
        address owner;          // Owner address (not encrypted)
    }

    bytes32 public constant CONVERTER_ROLE = keccak256("CONVERTER_ROLE");

    mapping(uint256 => EncryptedEquipment) public encryptedEquipments;
    mapping(address => uint256[]) public ownerEquipments;
    uint256 private _nextAssetId;

    event EncryptedEquipmentCreated(uint256 indexed assetId, address indexed owner);
    event EncryptedEquipmentTransferred(uint256 indexed assetId, address indexed from, address indexed to);

    constructor(address initialOwner) {
        _nextAssetId = 1;
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
    }

    function createEncryptedEquipment(
        externalEuint8 equipmentType,
        externalEuint32 attackPower,
        externalEuint32 defensePower,
        bytes calldata inputProof
    ) external returns (uint256) {
        euint8 encryptedType = FHE.fromExternal(equipmentType, inputProof);
        euint32 encryptedAttack = FHE.fromExternal(attackPower, inputProof);
        euint32 encryptedDefense = FHE.fromExternal(defensePower, inputProof);

        // Validate equipment type is between 1-4
        ebool validType1 = FHE.ge(encryptedType, 1);
        ebool validType2 = FHE.le(encryptedType, 4);
        ebool validType = FHE.and(validType1, validType2);
        
        // Use FHE.select to ensure only valid equipment is created
        euint8 finalType = FHE.select(validType, encryptedType, FHE.asEuint8(1));
        
        uint256 assetId = _nextAssetId;
        _nextAssetId++;

        encryptedEquipments[assetId] = EncryptedEquipment({
            equipmentType: finalType,
            attackPower: encryptedAttack,
            defensePower: encryptedDefense,
            owner: msg.sender
        });

        ownerEquipments[msg.sender].push(assetId);

        // Set ACL permissions
        FHE.allowThis(finalType);
        FHE.allowThis(encryptedAttack);
        FHE.allowThis(encryptedDefense);
        FHE.allow(finalType, msg.sender);
        FHE.allow(encryptedAttack, msg.sender);
        FHE.allow(encryptedDefense, msg.sender);

        emit EncryptedEquipmentCreated(assetId, msg.sender);
        return assetId;
    }

    // Function for converter contract to create encrypted equipment from already encrypted values
    function createEncryptedEquipmentFromConverter(
        euint8 equipmentType,
        euint32 attackPower,
        euint32 defensePower,
        address owner
    ) external onlyRole(CONVERTER_ROLE) returns (uint256) {
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

    // Function to combine two encrypted equipments (example of FHE operations)
    function combineEquipments(uint256 assetId1, uint256 assetId2) external returns (uint256) {
        require(encryptedEquipments[assetId1].owner == msg.sender, "Not owner of first equipment");
        require(encryptedEquipments[assetId2].owner == msg.sender, "Not owner of second equipment");

        EncryptedEquipment storage eq1 = encryptedEquipments[assetId1];
        EncryptedEquipment storage eq2 = encryptedEquipments[assetId2];

        // Combine attack and defense powers
        euint32 combinedAttack = FHE.add(eq1.attackPower, eq2.attackPower);
        euint32 combinedDefense = FHE.add(eq1.defensePower, eq2.defensePower);

        // Use the higher equipment type
        ebool type1Higher = FHE.gt(eq1.equipmentType, eq2.equipmentType);
        euint8 combinedType = FHE.select(type1Higher, eq1.equipmentType, eq2.equipmentType);

        uint256 newAssetId = _nextAssetId;
        _nextAssetId++;

        encryptedEquipments[newAssetId] = EncryptedEquipment({
            equipmentType: combinedType,
            attackPower: combinedAttack,
            defensePower: combinedDefense,
            owner: msg.sender
        });

        ownerEquipments[msg.sender].push(newAssetId);

        // Set ACL permissions
        FHE.allowThis(combinedType);
        FHE.allowThis(combinedAttack);
        FHE.allowThis(combinedDefense);
        FHE.allow(combinedType, msg.sender);
        FHE.allow(combinedAttack, msg.sender);
        FHE.allow(combinedDefense, msg.sender);

        // Remove the original equipments
        delete encryptedEquipments[assetId1];
        delete encryptedEquipments[assetId2];

        // Remove from owner's equipment list
        _removeFromOwnerList(assetId1);
        _removeFromOwnerList(assetId2);

        emit EncryptedEquipmentCreated(newAssetId, msg.sender);
        return newAssetId;
    }

    function _removeFromOwnerList(uint256 assetId) private {
        uint256[] storage equipments = ownerEquipments[msg.sender];
        for (uint256 i = 0; i < equipments.length; i++) {
            if (equipments[i] == assetId) {
                equipments[i] = equipments[equipments.length - 1];
                equipments.pop();
                break;
            }
        }
    }
}