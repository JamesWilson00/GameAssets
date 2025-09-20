// Zama FHE 配置 - 基于Sepolia测试网
export const FHE_CONFIG = {
  // FHEVM Host chain id (Sepolia)
  chainId: 11155111,
  // Gateway chain id
  gatewayChainId: 55815,
  // ACL合约地址 (FHEVM Host chain)
  aclContractAddress: "0x687820221192C5B662b25367F70076A37bc79b6c",
  // KMS验证器合约地址 (FHEVM Host chain)
  kmsContractAddress: "0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC",
  // 输入验证器合约地址 (FHEVM Host chain)
  inputVerifierContractAddress: "0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4",
  // 解密地址 (Gateway chain)
  verifyingContractAddressDecryption: "0xb6E160B1ff80D67Bfe90A85eE06Ce0A2613607D1",
  // 输入验证地址 (Gateway chain)
  verifyingContractAddressInputVerification: "0x7048C39f048125eDa9d678AEbaDfB22F7900a29F",
  // RPC提供者
  network: "https://eth-sepolia.public.blastapi.io",
  // Relayer URL
  relayerUrl: "https://relayer.testnet.zama.cloud",
};

// Sepolia配置的简化版本
export const SepoliaConfig = {
  ...FHE_CONFIG
};