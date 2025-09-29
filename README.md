# 🎮 Encrypted Game Assets Platform

[![License](https://img.shields.io/badge/license-BSD--3--Clause--Clear-blue.svg)](LICENSE)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636.svg?logo=solidity)](https://soliditylang.org/)
[![React](https://img.shields.io/badge/React-19.1.1-61DAFB.svg?logo=react)](https://reactjs.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.26.0-FFF100.svg?logo=hardhat)](https://hardhat.org/)
[![FHEVM](https://img.shields.io/badge/FHEVM-Zama-764ba2.svg)](https://docs.zama.ai/fhevm)

A revolutionary blockchain gaming platform that leverages **Zama's Fully Homomorphic Encryption (FHE)** technology to create and manage both transparent and encrypted game assets. This platform enables seamless conversion between traditional NFTs and encrypted assets while maintaining complete privacy for sensitive game data.

## 🌟 Key Features

### 🗡️ **Dual Asset System**
- **Traditional NFT Assets**: Standard ERC-721 tokens with transparent attributes
- **Encrypted Game Assets**: FHE-powered assets with private equipment stats
- **Seamless Conversion**: Convert between transparent and encrypted assets

### 🔐 **Privacy-Preserving Gaming**
- **Encrypted Attributes**: Equipment type, attack power, and defense power are fully encrypted
- **On-Chain Privacy**: Perform computations on encrypted data without revealing values
- **Access Control**: Granular permissions using Zama's ACL system

### ⚔️ **Equipment Management**
- **4 Equipment Types**: Diverse equipment categories (1-4)
- **Dynamic Stats**: Configurable attack and defense power values
- **Ownership Tracking**: Complete asset provenance and ownership history

## 🏗️ Architecture Overview

### Smart Contracts
```
contracts/
├── GameAsset.sol           # Traditional ERC-721 NFT implementation
├── EncryptedGameAsset.sol  # FHE-powered encrypted asset management
└── AssetConverter.sol      # Conversion logic between asset types
```

### Frontend Application
```
game/
├── src/
│   ├── components/         # React components for asset management
│   ├── hooks/             # Custom hooks for blockchain interactions
│   └── config/            # Zama and Wagmi configurations
```

## 🚀 Technical Stack

### Blockchain Infrastructure
- **Smart Contracts**: Solidity 0.8.24
- **Development Framework**: Hardhat 2.26.0
- **FHE Technology**: Zama FHEVM 0.8.0
- **Standards**: ERC-721, OpenZeppelin Contracts

### Frontend Technology
- **Framework**: React 19.1.1 + TypeScript
- **Build Tool**: Vite 7.1.6
- **Wallet Integration**: RainbowKit 2.2.8
- **Blockchain Interaction**: Wagmi 2.17.0 + Viem 2.37.6
- **FHE Client**: Zama Relayer SDK 0.2.0

### Development Tools
- **Testing**: Hardhat + Mocha + Chai
- **Deployment**: Hardhat Deploy
- **Code Quality**: ESLint + Prettier + Solhint
- **Type Safety**: TypeScript + TypeChain

## 🔧 Installation & Setup

### Prerequisites
- Node.js ≥ 20.0.0
- npm ≥ 7.0.0
- MetaMask or compatible wallet

### 1. Clone Repository
```bash
git clone https://github.com/your-org/GameAssets.git
cd GameAssets
```

### 2. Install Dependencies
```bash
# Install contract dependencies
npm install

# Install frontend dependencies
cd game
npm install
cd ..
```

### 3. Environment Configuration
```bash
cp .env.example .env
```

Configure your `.env` file:
```bash
PRIVATE_KEY=your_private_key_here
INFURA_API_KEY=your_infura_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### 4. Compile Contracts
```bash
npm run compile
```

### 5. Run Tests
```bash
npm run test
```

## 🚢 Deployment

### Sepolia Testnet Deployment
```bash
# Deploy contracts to Sepolia
npm run deploy:sepolia

# Deploy with frontend updates
npm run deploy:sepolia:full
```

### Local Development
```bash
# Start local Hardhat network
npx hardhat node

# Deploy to local network
npx hardhat deploy --network localhost

# Start frontend development server
cd game
npm run dev
```

## 📖 Usage Guide

### Creating Traditional NFT Assets

```solidity
// Mint a new game asset NFT
function mint(
    address to,
    uint8 equipmentType,    // 1-4
    uint32 attackPower,
    uint32 defensePower
) public onlyRole(MINTER_ROLE) returns (uint256)
```

### Converting to Encrypted Assets

```solidity
// Convert NFT to encrypted asset
function convertToEncrypted(uint256 tokenId) external
```

### Managing Encrypted Assets

```solidity
// Create encrypted equipment with FHE
function _createEncryptedEquipment(
    euint8 equipmentType,   // Encrypted type
    euint32 attackPower,    // Encrypted attack
    euint32 defensePower,   // Encrypted defense
    address owner
) internal returns (uint256)
```

### Frontend Integration

```typescript
// Initialize Zama instance
const instance = await createInstance(SepoliaConfig);

// Create encrypted input
const input = instance.createEncryptedInput(contractAddress, userAddress);
input.add8(equipmentType);
input.add32(attackPower);
input.add32(defensePower);
const encryptedInput = await input.encrypt();

// Call contract with encrypted data
await contract.createEncryptedEquipment(
    encryptedInput.handles[0],
    encryptedInput.handles[1],
    encryptedInput.handles[2],
    encryptedInput.inputProof
);
```

## 🎯 Problem Solved

### Traditional Gaming Challenges
- **MEV Exploitation**: Front-running and sandwich attacks on game transactions
- **Data Transparency**: All game stats visible on-chain, enabling unfair advantages
- **Privacy Loss**: Complete gameplay strategies exposed to competitors

### Our Solution
- **Encrypted Gameplay**: Hide critical game data while maintaining verifiability
- **Fair Competition**: Prevent information asymmetry between players
- **Flexible Privacy**: Choose between transparent and private asset management
- **Future-Proof**: Ready for Web3 gaming evolution with privacy-first approach

## 🔮 Future Roadmap

### Phase 1: Enhanced Privacy Features
- **Encrypted Battles**: Private combat calculations using FHE
- **Hidden Inventories**: Completely private asset collections
- **Stealth Trading**: Anonymous asset marketplace

### Phase 2: Advanced Gaming Mechanics
- **Equipment Crafting**: Combine encrypted assets with hidden formulas
- **Level Progression**: Private character advancement systems
- **Guild Management**: Encrypted team formations and strategies

### Phase 3: Cross-Chain Integration
- **Multi-Chain Assets**: Bridge encrypted assets across networks
- **Interoperability**: Connect with other FHE-enabled games
- **Unified Identity**: Cross-game encrypted player profiles

### Phase 4: Ecosystem Expansion
- **SDK Release**: Tools for developers to build FHE games
- **Marketplace**: Decentralized exchange for encrypted assets
- **Governance**: DAO-driven platform evolution

## 🛡️ Security Features

### Smart Contract Security
- **Access Control**: Role-based permissions using OpenZeppelin
- **Reentrancy Protection**: SafeERC721 implementations
- **Input Validation**: Comprehensive parameter checking
- **Upgrade Safety**: Immutable core logic with modular extensions

### FHE Security
- **Cryptographic Privacy**: Zama's threshold network security
- **Access Control Lists**: Granular permission management
- **Proof Verification**: ZK proofs for encrypted operations
- **Key Management**: Distributed key generation and storage

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow Solidity style guide
- Write comprehensive tests
- Document all functions
- Use TypeScript for frontend code
- Maintain gas efficiency

## 📄 License

This project is licensed under the BSD-3-Clause-Clear License. See [LICENSE](LICENSE) for details.

## 🔗 Resources

### Documentation
- [Zama FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Hardhat Documentation](https://hardhat.org/docs)
- [RainbowKit Documentation](https://rainbowkit.com)

### Community
- [Zama Community Forum](https://community.zama.ai)
- [Discord Server](https://discord.gg/fhe-org)
- [GitHub Discussions](https://github.com/your-org/GameAssets/discussions)

### Support
- [Technical Issues](https://github.com/your-org/GameAssets/issues)
- [Feature Requests](https://github.com/your-org/GameAssets/issues/new?template=feature_request.md)
- [Security Reports](mailto:security@yourorg.com)

## 🎮 Game On!

Ready to revolutionize blockchain gaming with privacy-preserving assets? Join our community and start building the future of encrypted gaming today!

---

**Built with ❤️ by the GameAssets Team**

*Powered by Zama's Fully Homomorphic Encryption Technology*