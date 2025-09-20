import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useReadContracts } from 'wagmi';
import {
  GAME_ASSET_ADDRESS,
  GAME_ASSET_ABI,
  ENCRYPTED_GAME_ASSET_ADDRESS,
  ENCRYPTED_GAME_ASSET_ABI,
  EQUIPMENT_TYPES,
  type EquipmentType,
  type EncryptedGameAsset,
  type GameAsset
} from '../config/gameAssets';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { useEthersSigner } from '../hooks/useEthersSigner';

export function EncryptedAssetManager() {
  const { address } = useAccount();
  const { instance: fheInstance, isLoading: fheLoading, error: fheError } = useZamaInstance();
  const signer = useEthersSigner();
  const [assets, setAssets] = useState<EncryptedGameAsset[]>([]);
  const [nfts, setNfts] = useState<GameAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingNfts, setIsLoadingNfts] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState<{ [key: number]: boolean }>({});
  const [isConverting, setIsConverting] = useState<{ [key: number]: boolean }>({});
  const [isApproving, setIsApproving] = useState<{ [key: number]: boolean }>({});
  const [approvalStatus, setApprovalStatus] = useState<{ [key: number]: boolean }>({});
  const [isBatchApproving, setIsBatchApproving] = useState(false);
  const [decryptedData, setDecryptedData] = useState<{
    [key: number]: {
      equipmentType: number,
      attack: number,
      defense: number
    }
  }>({});


  // Contract interaction
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Read user's encrypted asset count
  const { data: assetCount } = useReadContract({
    address: ENCRYPTED_GAME_ASSET_ADDRESS,
    abi: ENCRYPTED_GAME_ASSET_ABI,
    functionName: 'getEquipmentCount',
    args: address ? [address] : undefined,
  });

  // Read user's encrypted asset ID list
  const { data: encryptedAssetIds } = useReadContract({
    address: ENCRYPTED_GAME_ASSET_ADDRESS,
    abi: ENCRYPTED_GAME_ASSET_ABI,
    functionName: 'getOwnerEquipmentIds',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!assetCount && Number(assetCount) > 0,
    },
  });

  // Generate contract calls to read encrypted handles for each asset
  const getEncryptedAssetHandles = (assetIds: bigint[]) => {
    const contracts: any[] = [];
    assetIds.forEach(assetId => {
      contracts.push(
        {
          address: ENCRYPTED_GAME_ASSET_ADDRESS,
          abi: ENCRYPTED_GAME_ASSET_ABI,
          functionName: 'getEncryptedEquipmentType',
          args: [assetId],
        },
        {
          address: ENCRYPTED_GAME_ASSET_ADDRESS,
          abi: ENCRYPTED_GAME_ASSET_ABI,
          functionName: 'getEncryptedAttackPower',
          args: [assetId],
        },
        {
          address: ENCRYPTED_GAME_ASSET_ADDRESS,
          abi: ENCRYPTED_GAME_ASSET_ABI,
          functionName: 'getEncryptedDefensePower',
          args: [assetId],
        }
      );
    });
    return contracts;
  };

  // Batch read all encrypted asset handles
  const { data: encryptedHandlesData } = useReadContracts({
    contracts: encryptedAssetIds && Array.isArray(encryptedAssetIds) ?
      getEncryptedAssetHandles(encryptedAssetIds as bigint[]) : [],
    query: {
      enabled: !!encryptedAssetIds && Array.isArray(encryptedAssetIds) && encryptedAssetIds.length > 0,
    },
  });

  // Read user's NFT count
  const { data: nftCount } = useReadContract({
    address: GAME_ASSET_ADDRESS,
    abi: GAME_ASSET_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // Read user's all NFTs
  const { data: allNftData } = useReadContract({
    address: GAME_ASSET_ADDRESS,
    abi: GAME_ASSET_ABI,
    functionName: 'getAllEquipments',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!nftCount && Number(nftCount) > 0,
    },
  });


  // Read each NFT's approval status
  const getNftApprovals = (tokenIds: number[]) => {
    return tokenIds.map(tokenId => ({
      address: GAME_ASSET_ADDRESS,
      abi: GAME_ASSET_ABI,
      functionName: 'getApproved',
      args: [BigInt(tokenId)],
    }));
  };

  // Use useReadContracts to batch read approval status
  const { data: approvalData, refetch: refetchApprovals } = useReadContracts({
    contracts: nfts.length > 0 ? getNftApprovals(nfts.map(nft => nft.tokenId)) : [],
    query: {
      enabled: nfts.length > 0,
    },
  });

  // Check global approval status
  const { data: isApprovedForAll } = useReadContract({
    address: GAME_ASSET_ADDRESS,
    abi: GAME_ASSET_ABI,
    functionName: 'isApprovedForAll',
    args: address ? [address, ENCRYPTED_GAME_ASSET_ADDRESS] : undefined,
    query: {
      enabled: !!address,
    },
  });


  // Batch approve all NFTs
  const handleBatchApproveAllNfts = async () => {
    if (!address) return;

    setIsBatchApproving(true);

    try {
      await writeContract({
        address: GAME_ASSET_ADDRESS,
        abi: GAME_ASSET_ABI,
        functionName: 'setApprovalForAll',
        args: [ENCRYPTED_GAME_ASSET_ADDRESS, true],
      });

      // Refetch approval status after successful authorization
      setTimeout(() => {
        refetchApprovals();
        setIsBatchApproving(false);
      }, 3000);

    } catch (error) {
      console.error('Batch approval failed:', error);
      alert('Batch approval failed: ' + (error as Error).message);
      setIsBatchApproving(false);
    }
  };

  // Individual NFT approval (kept as backup)
  const handleApproveNft = async (tokenId: number) => {
    if (!address) return;

    setIsApproving(prev => ({ ...prev, [tokenId]: true }));

    try {
      await writeContract({
        address: GAME_ASSET_ADDRESS,
        abi: GAME_ASSET_ABI,
        functionName: 'approve',
        args: [ENCRYPTED_GAME_ASSET_ADDRESS, BigInt(tokenId)],
      });

      // Refetch approval status after successful authorization
      setTimeout(() => {
        refetchApprovals();
        setIsApproving(prev => ({ ...prev, [tokenId]: false }));
      }, 3000);

    } catch (error) {
      console.error('Authorization failed:', error);
      alert('Authorization failed: ' + (error as Error).message);
      setIsApproving(prev => ({ ...prev, [tokenId]: false }));
    }
  };

  // Convert NFT to encrypted asset
  const handleConvertNft = async (tokenId: number) => {
    if (!address || !approvalStatus[tokenId]) {
      alert('Please authorize this NFT first');
      return;
    }

    setIsConverting(prev => ({ ...prev, [tokenId]: true }));

    try {
      await writeContract({
        address: ENCRYPTED_GAME_ASSET_ADDRESS,
        abi: ENCRYPTED_GAME_ASSET_ABI,
        functionName: 'convertToEncrypted',
        args: [BigInt(tokenId)],
      });
      console.log('Conversion transaction submitted, waiting for confirmation...');
      // Note: Don't reset approval status here, wait for transaction confirmation
    } catch (error) {
      console.error('Conversion failed:', error);
      alert('Conversion failed: ' + (error as Error).message);
      setIsConverting(prev => ({ ...prev, [tokenId]: false }));
    }
  };

  // Decrypt asset attributes
  const handleDecryptAsset = async (assetId: number) => {
    if (!fheInstance || fheLoading || !address || !signer) return;

    // Find corresponding asset data
    const asset = assets.find(a => a.assetId === assetId);
    if (!asset) {
      alert('Corresponding asset data not found');
      return;
    }

    setIsDecrypting(prev => ({ ...prev, [assetId]: true }));

    try {
      // Use real encrypted handles obtained from the blockchain
      const encryptedTypeHandle = asset.encryptedEquipmentType;
      const encryptedAttackHandle = asset.encryptedAttack;
      const encryptedDefenseHandle = asset.encryptedDefense;

      console.log('Obtained encrypted handles:', {
        type: encryptedTypeHandle,
        attack: encryptedAttackHandle,
        defense: encryptedDefenseHandle
      });

      // Generate key pair
      const keypair = fheInstance.generateKeypair();
      const handleContractPairs = [
        {
          handle: encryptedTypeHandle as string,
          contractAddress: ENCRYPTED_GAME_ASSET_ADDRESS,
        },
        {
          handle: encryptedAttackHandle as string,
          contractAddress: ENCRYPTED_GAME_ASSET_ADDRESS,
        },
        {
          handle: encryptedDefenseHandle as string,
          contractAddress: ENCRYPTED_GAME_ASSET_ADDRESS,
        }
      ];

      const startTimeStamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = "10";
      const contractAddresses = [ENCRYPTED_GAME_ASSET_ADDRESS];

      const eip712 = fheInstance.createEIP712(keypair.publicKey, contractAddresses, startTimeStamp, durationDays);

      const signature = await (await signer).signTypedData(
        eip712.domain,
        {
          UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
        },
        eip712.message,
      );

      const result = await fheInstance.userDecrypt(
        handleContractPairs,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace("0x", ""),
        contractAddresses,
        address,
        startTimeStamp,
        durationDays,
      );

      const equipmentTypeValue = result[encryptedTypeHandle as string];
      const attackValue = result[encryptedAttackHandle as string];
      const defenseValue = result[encryptedDefenseHandle as string];

      console.log(`Asset ${assetId} decryption result:`, {
        equipmentType: equipmentTypeValue,
        attack: attackValue,
        defense: defenseValue
      });

      // Store decrypted data in state
      setDecryptedData(prev => ({
        ...prev,
        [assetId]: {
          equipmentType: equipmentTypeValue as number,
          attack: attackValue as number,
          defense: defenseValue as number
        }
      }));
    } catch (error) {
      console.error('Decryption failed:', error);
      alert('Decryption failed, please check permission settings or network connection');
    } finally {
      setIsDecrypting(prev => ({ ...prev, [assetId]: false }));
    }
  };

  // Handle NFT data
  useEffect(() => {
    if (allNftData && address) {
      const [tokenIds, equipments] = allNftData as [bigint[], any[]];
      const userNfts: GameAsset[] = [];

      for (let i = 0; i < tokenIds.length; i++) {
        userNfts.push({
          tokenId: Number(tokenIds[i]),
          equipmentType: Number(equipments[i].equipmentType) as EquipmentType,
          attackPower: Number(equipments[i].attackPower),
          defensePower: Number(equipments[i].defensePower),
          owner: address
        });
      }

      setNfts(userNfts);
    } else {
      setNfts([]);
    }
  }, [allNftData, address]);

  // Load user encrypted asset details
  const loadUserAssets = () => {
    if (!address || !encryptedAssetIds || !Array.isArray(encryptedAssetIds)) {
      setAssets([]);
      return;
    }

    if (!encryptedHandlesData) {
      setAssets([]);
      return;
    }

    setIsLoading(true);
    try {
      const userAssets: EncryptedGameAsset[] = [];
      const assetIdArray = encryptedAssetIds as bigint[];

      assetIdArray.forEach((assetId, index) => {
        const assetIdNum = Number(assetId);
        const handleIndex = index * 3; // Each asset has 3 handles (type, attack, defense)

        const typeHandle = encryptedHandlesData[handleIndex];
        const attackHandle = encryptedHandlesData[handleIndex + 1];
        const defenseHandle = encryptedHandlesData[handleIndex + 2];

        if (typeHandle?.status === 'success' &&
            attackHandle?.status === 'success' &&
            defenseHandle?.status === 'success') {
          userAssets.push({
            assetId: assetIdNum,
            encryptedEquipmentType: typeHandle.result as string,
            encryptedAttack: attackHandle.result as string,
            encryptedDefense: defenseHandle.result as string,
            owner: address
          });
        }
      });

      setAssets(userAssets);
      console.log('Loaded encrypted assets:', userAssets);
    } catch (error) {
      console.error('Failed to load encrypted assets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConfirmed) {
      console.log('Transaction confirmed successfully, reloading data...');
      loadUserAssets();
      // Reset all conversion states
      setIsConverting({});
      // Refetch approval status
      refetchApprovals();
    }
  }, [isConfirmed]);

  useEffect(() => {
    loadUserAssets();
  }, [address, encryptedAssetIds, encryptedHandlesData]);

  // Handle approval data
  useEffect(() => {
    if (nfts.length > 0) {
      const approvals: { [key: number]: boolean } = {};

      nfts.forEach((nft, index) => {
        // If globally approved, all NFTs are authorized
        if (isApprovedForAll) {
          approvals[nft.tokenId] = true;
        } else if (approvalData && approvalData[index]) {
          const approvalResult = approvalData[index];
          if (approvalResult?.status === 'success') {
            // Check if approval address is EncryptedGameAsset contract
            approvals[nft.tokenId] = approvalResult.result === ENCRYPTED_GAME_ASSET_ADDRESS;
          } else {
            approvals[nft.tokenId] = false;
          }
        } else {
          approvals[nft.tokenId] = false;
        }
      });

      setApprovalStatus(approvals);
    }
  }, [approvalData, nfts, isApprovedForAll]);

  const cardStyle = {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
    backgroundColor: '#f9fafb'
  };

  const buttonStyle = {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s'
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px'
  };


  if (fheLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '16px', color: '#6b7280', marginBottom: '16px' }}>
          Initializing Zama FHE...
        </div>
        <div style={{ fontSize: '14px', color: '#9ca3af' }}>
          Please wait, this may take a few seconds
        </div>
      </div>
    );
  }

  if (fheError) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '16px', color: '#dc2626', marginBottom: '16px' }}>
          FHE initialization failed
        </div>
        <div style={{ fontSize: '14px', color: '#9ca3af' }}>
          {fheError}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px', color: '#1f2937' }}>
        Encrypted Game Asset Management
      </h2>

      <div style={{
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '24px',
        fontSize: '14px',
        color: '#1e40af'
      }}>
        <strong>🔒 Privacy Protection:</strong> Uses Zama FHE technology to encrypt equipment attributes, ensuring complete privacy of game data
      </div>


      {/* Step 1: NFT Authorization Area - Only shown when there are unauthorized NFTs */}
      {nfts.length > 0 && nfts.some(nft => !approvalStatus[nft.tokenId]) && (
        <div style={{ ...cardStyle, marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px', color: '#374151' }}>
            Step 1: NFT Authorization Management
          </h3>

          <div style={{
            backgroundColor: '#e0f2fe',
            border: '1px solid #81d4fa',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
            fontSize: '14px',
            color: '#0277bd'
          }}>
            <strong>🔐 Authorization Instructions:</strong> Before converting NFTs to encrypted assets, you need to authorize the EncryptedGameAsset contract to operate your NFTs.
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                NFTs requiring authorization:
              </div>
              <button
                style={{
                  ...buttonStyle,
                  backgroundColor: '#16a34a',
                  fontSize: '14px',
                  fontWeight: '600',
                  opacity: isBatchApproving ? 0.6 : 1,
                  cursor: isBatchApproving ? 'not-allowed' : 'pointer'
                }}
                onClick={handleBatchApproveAllNfts}
                disabled={isBatchApproving}
              >
                {isBatchApproving ? '🔄 Authorizing...' : '⚡ Authorize NFTs'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {nfts.filter(nft => !approvalStatus[nft.tokenId]).map((nft) => (
                <div key={nft.tokenId} style={{
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '16px',
                  backgroundColor: 'white',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                        🎮 NFT #{nft.tokenId}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        {EQUIPMENT_TYPES[nft.equipmentType]}
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: '500' }}>
                      ❌ Unauthorized
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px', fontSize: '14px', color: '#374151' }}>
                    <div style={{ marginBottom: '4px' }}>
                      ⚔️ Attack: <span style={{ fontWeight: '600' }}>{nft.attackPower}</span>
                    </div>
                    <div>
                      🛡️ Defense: <span style={{ fontWeight: '600' }}>{nft.defensePower}</span>
                    </div>
                  </div>

                  <button
                    style={{
                      ...buttonStyle,
                      width: '100%',
                      fontSize: '14px',
                      backgroundColor: '#3b82f6',
                      opacity: isApproving[nft.tokenId] ? 0.6 : 1,
                      cursor: isApproving[nft.tokenId] ? 'not-allowed' : 'pointer'
                    }}
                    onClick={() => handleApproveNft(nft.tokenId)}
                    disabled={isApproving[nft.tokenId]}
                  >
                    {isApproving[nft.tokenId] ? 'Authorizing...' : 'Authorize this NFT'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* NFT Conversion Area */}
      <div style={{ ...cardStyle, marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px', color: '#374151' }}>
          {nfts.length > 0 && nfts.some(nft => !approvalStatus[nft.tokenId]) ? 'Step 2: ' : ''}Execute NFT Conversion
        </h3>

        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px',
          fontSize: '14px',
          color: '#856404'
        }}>
          <strong>⚠️ Conversion Warning:</strong> After conversion, the original NFT will be permanently destroyed and a corresponding encrypted asset will be created. Please ensure authorization is complete.
        </div>

        {nfts.filter(nft => approvalStatus[nft.tokenId]).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            No authorized NFTs available for conversion
            <br />
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>
              Please authorize your NFTs in the authorization area above first
            </span>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '16px', fontSize: '14px', color: '#6b7280' }}>
              Convertible authorized NFTs:
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {nfts.filter(nft => approvalStatus[nft.tokenId]).map((nft) => (
                <div key={nft.tokenId} style={{
                  border: '2px solid #16a34a',
                  borderRadius: '8px',
                  padding: '16px',
                  backgroundColor: '#f0fdf4',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                        🎮 NFT #{nft.tokenId}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        {EQUIPMENT_TYPES[nft.equipmentType]}
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: '500' }}>
                      ✅ Authorized
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px', fontSize: '14px', color: '#374151' }}>
                    <div style={{ marginBottom: '4px' }}>
                      ⚔️ Attack: <span style={{ fontWeight: '600' }}>{nft.attackPower}</span>
                    </div>
                    <div>
                      🛡️ Defense: <span style={{ fontWeight: '600' }}>{nft.defensePower}</span>
                    </div>
                  </div>

                  <button
                    style={{
                      ...buttonStyle,
                      width: '100%',
                      fontSize: '14px',
                      backgroundColor: '#dc2626',
                      opacity: isConverting[nft.tokenId] ? 0.6 : 1,
                      cursor: isConverting[nft.tokenId] ? 'not-allowed' : 'pointer'
                    }}
                    onClick={() => handleConvertNft(nft.tokenId)}
                    disabled={isConverting[nft.tokenId]}
                  >
                    {isConverting[nft.tokenId] ? 'Converting...' : '🔥 Convert to Encrypted Asset'}
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '16px', fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
              💡 Tip: Conversion will permanently destroy the original NFT, please operate with caution.
            </div>
          </div>
        )}
      </div>

      {/* Encrypted Asset List */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px', color: '#374151' }}>
          My Encrypted Equipment ({assetCount ? assetCount.toString() : '0'})
        </h3>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            Loading...
          </div>
        ) : assets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            No encrypted equipment yet
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {assets.map((asset) => (
              <div key={asset.assetId} style={{
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: 'white'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                    🔒 Encrypted Equipment #{asset.assetId}
                  </div>
                  <button
                    style={{
                      ...buttonStyle,
                      padding: '6px 12px',
                      fontSize: '12px',
                      backgroundColor: decryptedData[asset.assetId] ? '#16a34a' : '#3b82f6',
                      opacity: isDecrypting[asset.assetId] ? 0.6 : 1,
                      cursor: isDecrypting[asset.assetId] ? 'not-allowed' : 'pointer'
                    }}
                    onClick={() => handleDecryptAsset(asset.assetId)}
                    disabled={isDecrypting[asset.assetId]}
                  >
                    {isDecrypting[asset.assetId] ? 'Decrypting...' :
                     decryptedData[asset.assetId] ? '✅ Decrypted' : '🔓 Decrypt to View'}
                  </button>
                </div>

                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                  {decryptedData[asset.assetId] ? (
                    // Display decrypted data
                    <>
                      <div style={{ marginBottom: '4px' }}>
                        Equipment Type: <span style={{ fontWeight: '600', color: '#16a34a' }}>
                          {EQUIPMENT_TYPES[decryptedData[asset.assetId].equipmentType as EquipmentType]}
                        </span>
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        ⚔️ Attack: <span style={{ fontWeight: '600', color: '#dc2626' }}>
                          {decryptedData[asset.assetId].attack}
                        </span>
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        🛡️ Defense: <span style={{ fontWeight: '600', color: '#2563eb' }}>
                          {decryptedData[asset.assetId].defense}
                        </span>
                      </div>
                    </>
                  ) : (
                    // Display encrypted state
                    <>
                      <div style={{ marginBottom: '4px' }}>
                        Equipment Type: <span style={{ fontFamily: 'monospace', backgroundColor: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>
                          🔐 ***
                        </span>
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        Attack: <span style={{ fontFamily: 'monospace', backgroundColor: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>
                          🔐 ***
                        </span>
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        Defense: <span style={{ fontFamily: 'monospace', backgroundColor: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>
                          🔐 ***
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ fontSize: '12px', color: '#9ca3af', borderTop: '1px solid #e5e7eb', paddingTop: '8px' }}>
                  Asset ID: {asset.assetId}<br/>
                  All attributes are protected with FHE encryption
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}