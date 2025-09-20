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

  // 表单状态
  const [equipmentType, setEquipmentType] = useState<EquipmentType>(1);
  const [attack, setAttack] = useState(50);
  const [defense, setDefense] = useState(50);

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

  // 创建NFT资产
  const handleMintAsset = async () => {
    if (!address) return;

    try {
      await writeContract({
        address: GAME_ASSET_ADDRESS,
        abi: GAME_ASSET_ABI,
        functionName: 'mint',
        args: [address, equipmentType, attack, defense],
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
      // 重置表单
      setEquipmentType(1);
      setAttack(50);
      setDefense(50);
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
          创建新装备NFT
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              装备类型
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
              攻击力 (1-1000)
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
              防御力 (1-1000)
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
            opacity: isPending || isConfirming ? 0.6 : 1,
            cursor: isPending || isConfirming ? 'not-allowed' : 'pointer'
          }}
          onClick={handleMintAsset}
          disabled={isPending || isConfirming}
        >
          {isPending ? '确认中...' : isConfirming ? '铸造中...' : '创建装备NFT'}
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
            NFT创建成功！
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