// 游戏资产合约地址和ABI - 从deployments/sepolia复制
export const GAME_ASSET_ADDRESS = '0xf2f91fC32d84b0BCDD67AC6D773bC27fD3F9Dc47';
export const ENCRYPTED_GAME_ASSET_ADDRESS = '0x109A899a0c2544C4523b802B4793e110AD4CF387';
export const ASSET_CONVERTER_ADDRESS = '0xA7E2A9d2D9F708694bfC1bCbC8d8d23AD7eeBa45';

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
  }
] as const;

// 加密游戏资产ABI（简化版本）
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
        "name": "attack",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint32",
        "name": "defense",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "inputProof",
        "type": "bytes"
      }
    ],
    "name": "createAsset",
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
    "name": "getAsset",
    "outputs": [
      {
        "internalType": "euint8",
        "name": "equipmentType",
        "type": "bytes32"
      },
      {
        "internalType": "euint32",
        "name": "attack",
        "type": "bytes32"
      },
      {
        "internalType": "euint32",
        "name": "defense",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserAssetCount",
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
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "getUserAssetByIndex",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// 资产转换器ABI（简化版本）
export const ASSET_CONVERTER_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "convertToEncrypted",
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
    "name": "convertToNFT",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
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