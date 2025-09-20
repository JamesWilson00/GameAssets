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
  type EncryptedGameAsset
} from '../config/gameAssets';

export function AssetConverter() {
  const { address } = useAccount();
  const [selectedNFTId, setSelectedNFTId] = useState<number | null>(null);
  const [selectedEncryptedId, setSelectedEncryptedId] = useState<number | null>(null);
  const [conversionType, setConversionType] = useState<'toEncrypted' | 'toNFT'>('toEncrypted');

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

  useEffect(() => {
    if (isConfirmed) {
      // 重置选择
      setSelectedNFTId(null);
      setSelectedEncryptedId(null);
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

            {/* 这里应该显示用户的NFT列表 */}
            <div style={{
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '12px',
              backgroundColor: 'white',
              minHeight: '120px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280'
            }}>
              NFT列表加载中... (需要实现NFT获取逻辑)
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

            {/* 这里应该显示用户的加密资产列表 */}
            <div style={{
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '12px',
              backgroundColor: 'white',
              minHeight: '120px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280'
            }}>
              加密资产列表加载中... (需要实现加密资产获取逻辑)
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