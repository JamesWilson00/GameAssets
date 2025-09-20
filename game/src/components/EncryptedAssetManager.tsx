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

  // 表单状态
  const [equipmentType, setEquipmentType] = useState<EquipmentType>(1);
  const [attack, setAttack] = useState(50);
  const [defense, setDefense] = useState(50);

  // 合约交互
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // 读取用户拥有的加密资产数量
  const { data: assetCount } = useReadContract({
    address: ENCRYPTED_GAME_ASSET_ADDRESS,
    abi: ENCRYPTED_GAME_ASSET_ABI,
    functionName: 'getEquipmentCount',
    args: address ? [address] : undefined,
  });

  // 读取用户拥有的加密资产ID列表
  const { data: encryptedAssetIds } = useReadContract({
    address: ENCRYPTED_GAME_ASSET_ADDRESS,
    abi: ENCRYPTED_GAME_ASSET_ABI,
    functionName: 'getOwnerEquipmentIds',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!assetCount && Number(assetCount) > 0,
    },
  });

  // 为每个加密资产生成读取加密句柄的合约调用
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

  // 批量读取所有加密资产的句柄
  const { data: encryptedHandlesData } = useReadContracts({
    contracts: encryptedAssetIds && Array.isArray(encryptedAssetIds) ?
      getEncryptedAssetHandles(encryptedAssetIds as bigint[]) : [],
    query: {
      enabled: !!encryptedAssetIds && Array.isArray(encryptedAssetIds) && encryptedAssetIds.length > 0,
    },
  });

  // 读取用户拥有的NFT数量
  const { data: nftCount } = useReadContract({
    address: GAME_ASSET_ADDRESS,
    abi: GAME_ASSET_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // 读取用户的所有NFT
  const { data: allNftData } = useReadContract({
    address: GAME_ASSET_ADDRESS,
    abi: GAME_ASSET_ABI,
    functionName: 'getAllEquipments',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!nftCount && Number(nftCount) > 0,
    },
  });

  // 创建加密资产
  const handleCreateAsset = async () => {
    if (!address || !fheInstance || fheLoading) return;

    try {
      // 使用Zama FHE加密输入
      const input = fheInstance.createEncryptedInput(ENCRYPTED_GAME_ASSET_ADDRESS, address);
      input.add8(equipmentType);  // 装备类型
      input.add32(attack);        // 攻击力
      input.add32(defense);       // 防御力

      const encryptedInput = await input.encrypt();

      await writeContract({
        address: ENCRYPTED_GAME_ASSET_ADDRESS,
        abi: ENCRYPTED_GAME_ASSET_ABI,
        functionName: 'createEncryptedEquipment',
        args: [
          encryptedInput.handles[0], // 加密的装备类型
          encryptedInput.handles[1], // 加密的攻击力
          encryptedInput.handles[2], // 加密的防御力
          encryptedInput.inputProof
        ],
      });
    } catch (error) {
      console.error('创建加密资产失败:', error);
    }
  };

  // 读取每个NFT的授权状态
  const getNftApprovals = (tokenIds: number[]) => {
    return tokenIds.map(tokenId => ({
      address: GAME_ASSET_ADDRESS,
      abi: GAME_ASSET_ABI,
      functionName: 'getApproved',
      args: [BigInt(tokenId)],
    }));
  };

  // 使用useReadContracts批量读取授权状态
  const { data: approvalData, refetch: refetchApprovals } = useReadContracts({
    contracts: nfts.length > 0 ? getNftApprovals(nfts.map(nft => nft.tokenId)) : [],
    query: {
      enabled: nfts.length > 0,
    },
  });

  // 检查全局授权状态
  const { data: isApprovedForAll } = useReadContract({
    address: GAME_ASSET_ADDRESS,
    abi: GAME_ASSET_ABI,
    functionName: 'isApprovedForAll',
    args: address ? [address, ENCRYPTED_GAME_ASSET_ADDRESS] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // 批量授权所有NFT
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

      // 授权成功后重新获取授权状态
      setTimeout(() => {
        refetchApprovals();
        setIsBatchApproving(false);
      }, 3000);

    } catch (error) {
      console.error('批量授权失败:', error);
      alert('批量授权失败: ' + (error as Error).message);
      setIsBatchApproving(false);
    }
  };

  // 单个授权NFT（保留作为备用）
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

      // 授权成功后重新获取授权状态
      setTimeout(() => {
        refetchApprovals();
        setIsApproving(prev => ({ ...prev, [tokenId]: false }));
      }, 3000);

    } catch (error) {
      console.error('授权失败:', error);
      alert('授权失败: ' + (error as Error).message);
      setIsApproving(prev => ({ ...prev, [tokenId]: false }));
    }
  };

  // 转换NFT为加密资产
  const handleConvertNft = async (tokenId: number) => {
    if (!address || !approvalStatus[tokenId]) {
      alert('请先授权此NFT');
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
      console.log('转换完成！');
      // 重置授权状态
      setApprovalStatus(prev => ({ ...prev, [tokenId]: false }));
    } catch (error) {
      console.error('转换失败:', error);
      alert('转换失败: ' + (error as Error).message);
    } finally {
      setIsConverting(prev => ({ ...prev, [tokenId]: false }));
    }
  };

  // 解密资产属性
  const handleDecryptAsset = async (assetId: number) => {
    if (!fheInstance || fheLoading || !address || !signer) return;

    // 查找对应的资产数据
    const asset = assets.find(a => a.assetId === assetId);
    if (!asset) {
      alert('找不到对应的资产数据');
      return;
    }

    setIsDecrypting(prev => ({ ...prev, [assetId]: true }));

    try {
      // 使用从链上获取的真实加密句柄
      const encryptedTypeHandle = asset.encryptedEquipmentType;
      const encryptedAttackHandle = asset.encryptedAttack;
      const encryptedDefenseHandle = asset.encryptedDefense;

      console.log('获取到的加密句柄:', {
        type: encryptedTypeHandle,
        attack: encryptedAttackHandle,
        defense: encryptedDefenseHandle
      });

      // 生成密钥对
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

      console.log(`资产 ${assetId} 解密结果:`, {
        equipmentType: equipmentTypeValue,
        attack: attackValue,
        defense: defenseValue
      });

      // 将解密数据存储到状态中
      setDecryptedData(prev => ({
        ...prev,
        [assetId]: {
          equipmentType: equipmentTypeValue as number,
          attack: attackValue as number,
          defense: defenseValue as number
        }
      }));
    } catch (error) {
      console.error('解密失败:', error);
      alert('解密失败，请检查权限设置或网络连接');
    } finally {
      setIsDecrypting(prev => ({ ...prev, [assetId]: false }));
    }
  };

  // 处理NFT数据
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

  // 加载用户加密资产详情
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
        const handleIndex = index * 3; // 每个资产有3个句柄（type, attack, defense）

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
      console.log('加载的加密资产:', userAssets);
    } catch (error) {
      console.error('加载加密资产失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConfirmed) {
      loadUserAssets();
      // 重置表单
      setEquipmentType(1);
      setAttack(50);
      setDefense(50);
    }
  }, [isConfirmed]);

  useEffect(() => {
    loadUserAssets();
  }, [address, encryptedAssetIds, encryptedHandlesData]);

  // 处理授权数据
  useEffect(() => {
    if (nfts.length > 0) {
      const approvals: { [key: number]: boolean } = {};

      nfts.forEach((nft, index) => {
        // 如果有全局授权，则所有NFT都被授权
        if (isApprovedForAll) {
          approvals[nft.tokenId] = true;
        } else if (approvalData && approvalData[index]) {
          const approvalResult = approvalData[index];
          if (approvalResult?.status === 'success') {
            // 检查授权地址是否为EncryptedGameAsset合约地址
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

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer'
  };

  if (fheLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '16px', color: '#6b7280', marginBottom: '16px' }}>
          正在初始化Zama FHE...
        </div>
        <div style={{ fontSize: '14px', color: '#9ca3af' }}>
          请稍候，这可能需要几秒钟
        </div>
      </div>
    );
  }

  if (fheError) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '16px', color: '#dc2626', marginBottom: '16px' }}>
          FHE初始化失败
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
        加密游戏资产管理
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
        <strong>🔒 隐私保护：</strong> 使用Zama FHE技术加密装备属性，确保游戏数据完全隐私
      </div>

      {/* 创建新加密资产 */}
      <div style={{ ...cardStyle, marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px', color: '#374151' }}>
          创建新的加密装备
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              装备类型 (将被加密)
            </label>
            <select
              style={selectStyle}
              value={equipmentType}
              onChange={(e) => setEquipmentType(Number(e.target.value) as EquipmentType)}
            >
              {Object.entries(EQUIPMENT_TYPES).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              攻击力 (将被加密)
            </label>
            <input
              type="number"
              style={inputStyle}
              min="1"
              max="1000"
              value={attack}
              onChange={(e) => setAttack(Number(e.target.value))}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              防御力 (将被加密)
            </label>
            <input
              type="number"
              style={inputStyle}
              min="1"
              max="1000"
              value={defense}
              onChange={(e) => setDefense(Number(e.target.value))}
            />
          </div>
        </div>

        <button
          style={{
            ...buttonStyle,
            opacity: isPending || isConfirming || fheLoading || !fheInstance ? 0.6 : 1,
            cursor: isPending || isConfirming || fheLoading || !fheInstance ? 'not-allowed' : 'pointer'
          }}
          onClick={handleCreateAsset}
          disabled={isPending || isConfirming || fheLoading || !fheInstance}
        >
          {isPending ? '确认中...' : isConfirming ? '创建中...' : '创建加密装备'}
        </button>

        {error && (
          <div style={{
            marginTop: '12px',
            padding: '8px 12px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            color: '#dc2626',
            fontSize: '14px'
          }}>
            错误: {error.message}
          </div>
        )}

        {isConfirmed && (
          <div style={{
            marginTop: '12px',
            padding: '8px 12px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '6px',
            color: '#16a34a',
            fontSize: '14px'
          }}>
            加密资产创建成功！所有属性已安全加密。
          </div>
        )}
      </div>

      {/* 第一步：NFT授权区域 - 只在有未授权的NFT时显示 */}
      {nfts.length > 0 && nfts.some(nft => !approvalStatus[nft.tokenId]) && (
        <div style={{ ...cardStyle, marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px', color: '#374151' }}>
            第一步：NFT授权管理
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
            <strong>🔐 授权说明：</strong> 在转换NFT为加密资产前，需要先授权EncryptedGameAsset合约操作您的NFT。
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                需要授权的NFT：
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
                {isBatchApproving ? '🔄 授权中...' : '⚡ 授权NFT'}
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
                      ❌ 未授权
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px', fontSize: '14px', color: '#374151' }}>
                    <div style={{ marginBottom: '4px' }}>
                      ⚔️ 攻击力: <span style={{ fontWeight: '600' }}>{nft.attackPower}</span>
                    </div>
                    <div>
                      🛡️ 防御力: <span style={{ fontWeight: '600' }}>{nft.defensePower}</span>
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
                    {isApproving[nft.tokenId] ? '授权中...' : '授权此NFT'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* NFT转换区域 */}
      <div style={{ ...cardStyle, marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px', color: '#374151' }}>
          {nfts.length > 0 && nfts.some(nft => !approvalStatus[nft.tokenId]) ? '第二步：' : ''}执行NFT转换
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
          <strong>⚠️ 转换警告：</strong> 转换后原NFT将被永久销毁，创建对应的加密资产。请确保已完成授权。
        </div>

        {nfts.filter(nft => approvalStatus[nft.tokenId]).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            没有已授权的NFT可以转换
            <br />
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>
              请先在上方授权区域授权您的NFT
            </span>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '16px', fontSize: '14px', color: '#6b7280' }}>
              可转换的已授权NFT：
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
                      ✅ 已授权
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px', fontSize: '14px', color: '#374151' }}>
                    <div style={{ marginBottom: '4px' }}>
                      ⚔️ 攻击力: <span style={{ fontWeight: '600' }}>{nft.attackPower}</span>
                    </div>
                    <div>
                      🛡️ 防御力: <span style={{ fontWeight: '600' }}>{nft.defensePower}</span>
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
                    {isConverting[nft.tokenId] ? '转换中...' : '🔥 转换为加密资产'}
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '16px', fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
              💡 提示：转换将永久销毁原NFT，请慎重操作。
            </div>
          </div>
        )}
      </div>

      {/* 加密资产列表 */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px', color: '#374151' }}>
          我的加密装备 ({assetCount ? assetCount.toString() : '0'})
        </h3>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            加载中...
          </div>
        ) : assets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            还没有任何加密装备
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
                    🔒 加密装备 #{asset.assetId}
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
                    {isDecrypting[asset.assetId] ? '解密中...' :
                     decryptedData[asset.assetId] ? '✅ 已解密' : '🔓 解密查看'}
                  </button>
                </div>

                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                  {decryptedData[asset.assetId] ? (
                    // 显示解密后的数据
                    <>
                      <div style={{ marginBottom: '4px' }}>
                        装备类型: <span style={{ fontWeight: '600', color: '#16a34a' }}>
                          {EQUIPMENT_TYPES[decryptedData[asset.assetId].equipmentType as EquipmentType]}
                        </span>
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        ⚔️ 攻击力: <span style={{ fontWeight: '600', color: '#dc2626' }}>
                          {decryptedData[asset.assetId].attack}
                        </span>
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        🛡️ 防御力: <span style={{ fontWeight: '600', color: '#2563eb' }}>
                          {decryptedData[asset.assetId].defense}
                        </span>
                      </div>
                    </>
                  ) : (
                    // 显示加密状态
                    <>
                      <div style={{ marginBottom: '4px' }}>
                        装备类型: <span style={{ fontFamily: 'monospace', backgroundColor: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>
                          🔐 加密中...
                        </span>
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        攻击力: <span style={{ fontFamily: 'monospace', backgroundColor: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>
                          🔐 加密中...
                        </span>
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        防御力: <span style={{ fontFamily: 'monospace', backgroundColor: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>
                          🔐 加密中...
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ fontSize: '12px', color: '#9ca3af', borderTop: '1px solid #e5e7eb', paddingTop: '8px' }}>
                  资产ID: {asset.assetId}<br/>
                  所有属性已使用FHE加密保护
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}