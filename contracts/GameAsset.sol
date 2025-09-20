// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract GameAsset is ERC721, ERC721Enumerable, Ownable, AccessControl {
    struct Equipment {
        uint8 equipmentType;  // 1-4 equipment types
        uint32 attackPower;
        uint32 defensePower;
    }

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    mapping(uint256 => Equipment) public equipments;
    uint256 private _nextTokenId;

    event EquipmentMinted(uint256 indexed tokenId, uint8 equipmentType, uint32 attackPower, uint32 defensePower, address to);

    constructor(address initialOwner) ERC721("GameAsset", "GA") Ownable(initialOwner) {
        _nextTokenId = 1;
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(MINTER_ROLE, initialOwner);
    }

    function mint(address to, uint8 equipmentType, uint32 attackPower, uint32 defensePower) public onlyRole(MINTER_ROLE) returns (uint256) {
        require(equipmentType >= 1 && equipmentType <= 4, "Invalid equipment type");
        
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;
        
        equipments[tokenId] = Equipment({
            equipmentType: equipmentType,
            attackPower: attackPower,
            defensePower: defensePower
        });
        
        _safeMint(to, tokenId);
        
        emit EquipmentMinted(tokenId, equipmentType, attackPower, defensePower, to);
        return tokenId;
    }

    function getEquipment(uint256 tokenId) public view returns (Equipment memory) {
        require(_ownerOf(tokenId) != address(0), "Equipment does not exist");
        return equipments[tokenId];
    }

    function getAllEquipments(address owner) public view returns (uint256[] memory, Equipment[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](balance);
        Equipment[] memory ownerEquipments = new Equipment[](balance);

        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = tokenOfOwnerByIndex(owner, i);
            tokenIds[i] = tokenId;
            ownerEquipments[i] = equipments[tokenId];
        }

        return (tokenIds, ownerEquipments);
    }

    function burn(uint256 tokenId) public {
        require(_isAuthorized(_ownerOf(tokenId), msg.sender, tokenId), "Not authorized to burn");
        delete equipments[tokenId];
        _burn(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }
}