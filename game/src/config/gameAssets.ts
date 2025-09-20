// 游戏资产合约地址和ABI - 从deployments/sepolia复制
export const GAME_ASSET_ADDRESS = '0xc8010c6A0c602Db46C6E0e42C744AE3c3923d866';
export const ENCRYPTED_GAME_ASSET_ADDRESS = '0x8D0A458F6dFe1656b6BbEa206E5A35BBA1d1992a';

// 从GameAsset.json复制的关键ABI函数
export const GAME_ASSET_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint8",
        "name": "equipmentType",
        "type": "uint8"
      },
      {
        "internalType": "uint32",
        "name": "attackPower",
        "type": "uint32"
      },
      {
        "internalType": "uint32",
        "name": "defensePower",
        "type": "uint32"
      }
    ],
    "name": "mint",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "getAllEquipments",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      },
      {
        "components": [
          {
            "internalType": "uint8",
            "name": "equipmentType",
            "type": "uint8"
          },
          {
            "internalType": "uint32",
            "name": "attackPower",
            "type": "uint32"
          },
          {
            "internalType": "uint32",
            "name": "defensePower",
            "type": "uint32"
          }
        ],
        "internalType": "struct GameAsset.Equipment[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "getEquipment",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint8",
            "name": "equipmentType",
            "type": "uint8"
          },
          {
            "internalType": "uint32",
            "name": "attackPower",
            "type": "uint32"
          },
          {
            "internalType": "uint32",
            "name": "defensePower",
            "type": "uint32"
          }
        ],
        "internalType": "struct GameAsset.Equipment",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "ownerOf",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "tokenOfOwnerByIndex",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "burn",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "getApproved",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// 加密游戏资产ABI（更新后的版本）
export const ENCRYPTED_GAME_ASSET_ABI = [
  {
    "inputs": [
      {
        "internalType": "externalEuint8",
        "name": "equipmentType",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint32",
        "name": "attackPower",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint32",
        "name": "defensePower",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "inputProof",
        "type": "bytes"
      }
    ],
    "name": "createEncryptedEquipment",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "assetId",
        "type": "uint256"
      }
    ],
    "name": "getEncryptedEquipmentType",
    "outputs": [
      {
        "internalType": "euint8",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "assetId",
        "type": "uint256"
      }
    ],
    "name": "getEncryptedAttackPower",
    "outputs": [
      {
        "internalType": "euint32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "assetId",
        "type": "uint256"
      }
    ],
    "name": "getEncryptedDefensePower",
    "outputs": [
      {
        "internalType": "euint32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "assetId",
        "type": "uint256"
      }
    ],
    "name": "getOwner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "getOwnerEquipmentIds",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "getEquipmentCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "assetId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      }
    ],
    "name": "transferEncryptedEquipment",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "convertToEncrypted",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getGameAssetContract",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_gameAssetContract",
        "type": "address"
      }
    ],
    "name": "setGameAssetContract",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

// 装备类型枚举
export const EQUIPMENT_TYPES = {
  1: "武器",
  2: "护甲",
  3: "头盔",
  4: "饰品"
} as const;

export type EquipmentType = keyof typeof EQUIPMENT_TYPES;

// 游戏资产接口
export interface GameAsset {
  tokenId: number;
  equipmentType: EquipmentType;
  attackPower: number;
  defensePower: number;
  owner: string;
}

export interface EncryptedGameAsset {
  assetId: number;
  encryptedEquipmentType: string; // 加密的装备类型handle
  encryptedAttack: string; // 加密的攻击力handle
  encryptedDefense: string; // 加密的防御力handle
  owner: string;
}