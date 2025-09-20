import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import {
  GAME_ASSET_ADDRESS,
  GAME_ASSET_ABI,
  ENCRYPTED_GAME_ASSET_ADDRESS,
  ENCRYPTED_GAME_ASSET_ABI,
  ASSET_CONVERTER_ADDRESS,
  ASSET_CONVERTER_ABI,
  EQUIPMENT_TYPES,
  type GameAsset,
  type EncryptedGameAsset,
  type EquipmentType
} from '../config/gameAssets';

export function AssetConverter() {
  const { address } = useAccount();
  const [selectedNFTId, setSelectedNFTId] = useState<number | null>(null);
  const [selectedEncryptedId, setSelectedEncryptedId] = useState<number | null>(null);
  const [conversionType, setConversionType] = useState<'toEncrypted' | 'toNFT'>('toEncrypted');
  const [nftAssets, setNftAssets] = useState<GameAsset[]>([]);
  const [encryptedAssets, setEncryptedAssets] = useState<EncryptedGameAsset[]>([]);

  // 合约交互
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // 读取用户拥有的NFT数量
  const { data: nftBalance } = useReadContract({
    address: GAME_ASSET_ADDRESS,
    abi: GAME_ASSET_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // 读取用户拥有的NFT装备
  const { data: allNFTEquipments } = useReadContract({
    address: GAME_ASSET_ADDRESS,
    abi: GAME_ASSET_ABI,
    functionName: 'getAllEquipments',
    args: address ? [address] : undefined,
  });

  // 读取用户拥有的加密资产数量
  const { data: encryptedBalance } = useReadContract({
    address: ENCRYPTED_GAME_ASSET_ADDRESS,
    abi: ENCRYPTED_GAME_ASSET_ABI,
    functionName: 'getUserAssetCount',
    args: address ? [address] : undefined,
  });

  // NFT转加密资产
  const handleConvertToEncrypted = async () => {
    if (!selectedNFTId || !address) return;

    try {
      await writeContract({
        address: ASSET_CONVERTER_ADDRESS,
        abi: ASSET_CONVERTER_ABI,
        functionName: 'convertToEncrypted',
        args: [selectedNFTId],
      });
    } catch (error) {
      console.error('转换为加密资产失败:', error);
    }
  };

  // 加密资产转NFT
  const handleConvertToNFT = async () => {
    if (!selectedEncryptedId || !address) return;

    try {
      await writeContract({
        address: ASSET_CONVERTER_ADDRESS,
        abi: ASSET_CONVERTER_ABI,
        functionName: 'convertToNFT',
        args: [selectedEncryptedId],
      });
    } catch (error) {
      console.error('转换为NFT失败:', error);
    }
  };

  // 加载NFT资产
  const loadNFTAssets = () => {
    if (!allNFTEquipments || !address) return;

    try {
      const [tokenIds, equipments] = allNFTEquipments as [bigint[], any[]];

      const assets: GameAsset[] = tokenIds.map((tokenId, index) => {
        const equipment = equipments[index];
        return {
          tokenId: Number(tokenId),
          equipmentType: Number(equipment.equipmentType) as EquipmentType,
          attackPower: Number(equipment.attackPower),
          defensePower: Number(equipment.defensePower),
          owner: address
        };
      });

      setNftAssets(assets);
    } catch (error) {
      console.error('加载NFT资产失败:', error);
    }
  };

  // 加载加密资产（模拟数据，实际需要合约支持）
  const loadEncryptedAssets = () => {
    if (!encryptedBalance || !address) return;

    try {
      // 由于加密资产的属性是加密的，这里只能显示基本信息
      const assets: EncryptedGameAsset[] = [];
      const count = Number(encryptedBalance);

      for (let i = 0; i < count; i++) {
        assets.push({
          assetId: i,
          encryptedEquipmentType: `encrypted_type_${i}`,
          encryptedAttack: `encrypted_attack_${i}`,
          encryptedDefense: `encrypted_defense_${i}`,
          owner: address
        });
      }

      setEncryptedAssets(assets);
    } catch (error) {
      console.error('加载加密资产失败:', error);
    }
  };

  useEffect(() => {
    loadNFTAssets();
  }, [allNFTEquipments, address]);

  useEffect(() => {
    loadEncryptedAssets();
  }, [encryptedBalance, address]);

  useEffect(() => {
    if (isConfirmed) {
      // 重置选择并重新加载数据
      setSelectedNFTId(null);
      setSelectedEncryptedId(null);
      loadNFTAssets();
      loadEncryptedAssets();
    }
  }, [isConfirmed]);

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

  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#6b7280'
  };

  const selectedButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#10b981'
  };

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px', color: '#1f2937' }}>
        资产转换
      </h2>

      <div style={{
        backgroundColor: '#fef3c7',
        border: '1px solid #fbbf24',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '24px',
        fontSize: '14px',
        color: '#92400e'
      }}>
        <strong>⚠️ 注意：</strong> 资产转换是不可逆的过程，请谨慎操作
      </div>

      {/* 转换类型选择 */}
      <div style={{ ...cardStyle, marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px', color: '#374151' }}>
          选择转换类型
        </h3>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <button
            style={conversionType === 'toEncrypted' ? selectedButtonStyle : secondaryButtonStyle}
            onClick={() => setConversionType('toEncrypted')}
          >
            NFT → 加密资产
          </button>
          <button
            style={conversionType === 'toNFT' ? selectedButtonStyle : secondaryButtonStyle}
            onClick={() => setConversionType('toNFT')}
          >
            加密资产 → NFT
          </button>
        </div>

        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          {conversionType === 'toEncrypted'
            ? '将透明的NFT转换为隐私保护的加密资产'
            : '将加密资产转换为透明可见的NFT'
          }
        </div>
      </div>

      {/* NFT转加密资产 */}
      {conversionType === 'toEncrypted' && (
        <div style={{ ...cardStyle, marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px', color: '#374151' }}>
            选择要转换的NFT
          </h3>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
              您拥有 {nftBalance ? nftBalance.toString() : '0'} 个NFT装备
            </div>

            {/* NFT装备列表 */}
            <div style={{
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white',
              minHeight: '120px',
              maxHeight: '300px',
              overflow: 'auto'
            }}>
              {nftAssets.length === 0 ? (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: '#6b7280'
                }}>
                  没有可转换的NFT装备
                </div>
              ) : (
                <div style={{ padding: '8px' }}>
                  {nftAssets.map((asset) => (
                    <div
                      key={asset.tokenId}
                      style={{
                        padding: '12px',
                        margin: '4px 0',
                        border: selectedNFTId === asset.tokenId ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        backgroundColor: selectedNFTId === asset.tokenId ? '#eff6ff' : 'white',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => setSelectedNFTId(asset.tokenId)}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontWeight: '600', color: '#1f2937' }}>
                            {EQUIPMENT_TYPES[asset.equipmentType]} #{asset.tokenId}
                          </div>
                          <div style={{ fontSize: '14px', color: '#6b7280' }}>
                            攻击力: {asset.attackPower} | 防御力: {asset.defensePower}
                          </div>
                        </div>
                        {selectedNFTId === asset.tokenId && (
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: '#3b82f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <span style={{ color: 'white', fontSize: '12px' }}>✓</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedNFTId && (
              <div style={{
                marginTop: '12px',
                padding: '8px 12px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '6px',
                color: '#16a34a',
                fontSize: '14px'
              }}>
                已选择NFT #{selectedNFTId}
              </div>
            )}
          </div>

          <button
            style={{
              ...buttonStyle,
              opacity: isPending || isConfirming || !selectedNFTId ? 0.6 : 1,
              cursor: isPending || isConfirming || !selectedNFTId ? 'not-allowed' : 'pointer'
            }}
            onClick={handleConvertToEncrypted}
            disabled={isPending || isConfirming || !selectedNFTId}
          >
            {isPending ? '确认中...' : isConfirming ? '转换中...' : '转换为加密资产'}
          </button>
        </div>
      )}

      {/* 加密资产转NFT */}
      {conversionType === 'toNFT' && (
        <div style={{ ...cardStyle, marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px', color: '#374151' }}>
            选择要转换的加密资产
          </h3>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
              您拥有 {encryptedBalance ? encryptedBalance.toString() : '0'} 个加密装备
            </div>

            {/* 加密资产列表 */}
            <div style={{
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white',
              minHeight: '120px',
              maxHeight: '300px',
              overflow: 'auto'
            }}>
              {encryptedAssets.length === 0 ? (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: '#6b7280'
                }}>
                  没有可转换的加密装备
                </div>
              ) : (
                <div style={{ padding: '8px' }}>
                  {encryptedAssets.map((asset) => (
                    <div
                      key={asset.assetId}
                      style={{
                        padding: '12px',
                        margin: '4px 0',
                        border: selectedEncryptedId === asset.assetId ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        backgroundColor: selectedEncryptedId === asset.assetId ? '#eff6ff' : 'white',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => setSelectedEncryptedId(asset.assetId)}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontWeight: '600', color: '#1f2937' }}>
                            🔒 加密装备 #{asset.assetId}
                          </div>
                          <div style={{ fontSize: '14px', color: '#6b7280' }}>
                            装备类型: <span style={{
                              fontFamily: 'monospace',
                              backgroundColor: '#f3f4f6',
                              padding: '2px 4px',
                              borderRadius: '3px'
                            }}>加密中...</span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                            所有属性已使用FHE加密保护
                          </div>
                        </div>
                        {selectedEncryptedId === asset.assetId && (
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: '#3b82f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <span style={{ color: 'white', fontSize: '12px' }}>✓</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedEncryptedId && (
              <div style={{
                marginTop: '12px',
                padding: '8px 12px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '6px',
                color: '#16a34a',
                fontSize: '14px'
              }}>
                已选择加密资产 #{selectedEncryptedId}
              </div>
            )}
          </div>

          <button
            style={{
              ...buttonStyle,
              opacity: isPending || isConfirming || !selectedEncryptedId ? 0.6 : 1,
              cursor: isPending || isConfirming || !selectedEncryptedId ? 'not-allowed' : 'pointer'
            }}
            onClick={handleConvertToNFT}
            disabled={isPending || isConfirming || !selectedEncryptedId}
          >
            {isPending ? '确认中...' : isConfirming ? '转换中...' : '转换为NFT'}
          </button>
        </div>
      )}

      {/* 交易状态 */}
      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#dc2626',
          fontSize: '14px',
          marginBottom: '16px'
        }}>
          转换失败: {error.message}
        </div>
      )}

      {isConfirmed && (
        <div style={{
          padding: '12px',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          color: '#16a34a',
          fontSize: '14px',
          marginBottom: '16px'
        }}>
          资产转换成功！
        </div>
      )}

      {/* 转换说明 */}
      <div style={{
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '14px',
        color: '#475569'
      }}>
        <h4 style={{ fontSize: '16px', color: '#1e293b', marginBottom: '8px' }}>
          转换说明：
        </h4>
        <ul style={{ lineHeight: '1.6', paddingLeft: '20px', margin: 0 }}>
          <li><strong>NFT → 加密资产：</strong> 将透明的装备属性转换为FHE加密保护，提升隐私性</li>
          <li><strong>加密资产 → NFT：</strong> 将加密的装备属性解密并转换为标准NFT，便于交易</li>
          <li><strong>Gas费用：</strong> 转换过程需要支付相应的Gas费用</li>
          <li><strong>不可逆性：</strong> 转换完成后无法撤销，请谨慎操作</li>
        </ul>
      </div>
    </div>
  );
}