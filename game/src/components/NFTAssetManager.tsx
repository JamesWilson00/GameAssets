import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import {
  GAME_ASSET_ADDRESS,
  GAME_ASSET_ABI,
  EQUIPMENT_TYPES,
  type EquipmentType,
  type GameAsset
} from '../config/gameAssets';

export function NFTAssetManager() {
  const { address } = useAccount();
  const [assets, setAssets] = useState<GameAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 随机装备状态
  const [randomEquipment, setRandomEquipment] = useState<{
    equipmentType: EquipmentType;
    attack: number;
    defense: number;
  } | null>(null);

  // 合约交互
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // 读取用户拥有的NFT数量
  const { data: balance } = useReadContract({
    address: GAME_ASSET_ADDRESS,
    abi: GAME_ASSET_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // 读取用户的所有装备
  const { data: allEquipments } = useReadContract({
    address: GAME_ASSET_ADDRESS,
    abi: GAME_ASSET_ABI,
    functionName: 'getAllEquipments',
    args: address ? [address] : undefined,
  });

  // 随机生成装备
  const generateRandomEquipment = () => {
    const equipmentTypes = [1, 2, 3, 4] as EquipmentType[];
    const randomType = equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)];
    const randomAttack = Math.floor(Math.random() * 200) + 50; // 50-249
    const randomDefense = Math.floor(Math.random() * 200) + 50; // 50-249

    const randomEquip = {
      equipmentType: randomType,
      attack: randomAttack,
      defense: randomDefense
    };

    console.log('生成随机装备:', randomEquip);

    setRandomEquipment(randomEquip);
  };

  // 创建NFT资产
  const handleMintAsset = async () => {
    if (!address || !randomEquipment) {
      alert('请先生成随机装备！');
      return;
    }

    console.log('准备铸造NFT，参数:', {
      to: address,
      equipmentType: randomEquipment.equipmentType,
      attack: randomEquipment.attack,
      defense: randomEquipment.defense
    });

    try {
      await writeContract({
        address: GAME_ASSET_ADDRESS,
        abi: GAME_ASSET_ABI,
        functionName: 'mint',
        args: [address, randomEquipment.equipmentType, randomEquipment.attack, randomEquipment.defense],
      });
    } catch (error) {
      console.error('创建NFT失败:', error);
    }
  };

  // 加载用户资产
  const loadUserAssets = async () => {
    if (!allEquipments || !address) return;

    setIsLoading(true);
    try {
      const [tokenIds, equipments] = allEquipments as [bigint[], any[]];

      const userAssets: GameAsset[] = tokenIds.map((tokenId, index) => {
        const equipment = equipments[index];
        return {
          tokenId: Number(tokenId),
          equipmentType: Number(equipment.equipmentType) as EquipmentType,
          attackPower: Number(equipment.attackPower),
          defensePower: Number(equipment.defensePower),
          owner: address
        };
      });

      setAssets(userAssets);
    } catch (error) {
      console.error('加载资产失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConfirmed) {
      loadUserAssets();
      // 重置随机装备
      setRandomEquipment(null);
    }
  }, [isConfirmed]);

  useEffect(() => {
    loadUserAssets();
  }, [address, allEquipments]);

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

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px', color: '#1f2937' }}>
        普通NFT资产管理
      </h2>

      {/* 创建新资产 */}
      <div style={{ ...cardStyle, marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px', color: '#374151' }}>
          随机生成装备NFT
        </h3>

        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          {randomEquipment ? (
            <div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#16a34a', marginBottom: '12px' }}>
                🎲 随机装备已生成：
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>装备类型</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                    {EQUIPMENT_TYPES[randomEquipment.equipmentType]}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>攻击力</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#dc2626' }}>
                    {randomEquipment.attack}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>防御力</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#2563eb' }}>
                    {randomEquipment.defense}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#6b7280' }}>
              点击"🎲 随机生成装备"按钮来生成随机装备属性
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            style={{
              ...buttonStyle,
              backgroundColor: '#8b5cf6',
              flex: '1',
              minWidth: '150px'
            }}
            onClick={generateRandomEquipment}
          >
            🎲 随机生成装备
          </button>

          <button
            style={{
              ...buttonStyle,
              backgroundColor: '#16a34a',
              flex: '1',
              minWidth: '150px',
              opacity: isPending || isConfirming || !randomEquipment ? 0.6 : 1,
              cursor: isPending || isConfirming || !randomEquipment ? 'not-allowed' : 'pointer'
            }}
            onClick={handleMintAsset}
            disabled={isPending || isConfirming || !randomEquipment}
          >
            {isPending ? '确认中...' : isConfirming ? '铸造中...' : '🎮 创建装备NFT'}
          </button>
        </div>

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
            🎉 随机装备NFT创建成功！
          </div>
        )}
      </div>

      {/* 资产列表 */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px', color: '#374151' }}>
          我的装备NFT ({balance ? balance.toString() : '0'})
        </h3>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            加载中...
          </div>
        ) : assets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            还没有任何装备NFT
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {assets.map((asset) => (
              <div key={asset.tokenId} style={{
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: 'white'
              }}>
                <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>
                  {EQUIPMENT_TYPES[asset.equipmentType]} #{asset.tokenId}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                  攻击力: {asset.attackPower}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                  防御力: {asset.defensePower}
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  Token ID: {asset.tokenId}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}