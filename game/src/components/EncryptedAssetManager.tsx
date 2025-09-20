import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import {
  ENCRYPTED_GAME_ASSET_ADDRESS,
  ENCRYPTED_GAME_ASSET_ABI,
  EQUIPMENT_TYPES,
  type EquipmentType,
  type EncryptedGameAsset
} from '../config/gameAssets';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { useEthersSigner } from '../hooks/useEthersSigner';

export function EncryptedAssetManager() {
  const { address } = useAccount();
  const { instance: fheInstance, isLoading: fheLoading, error: fheError } = useZamaInstance();
  const signer = useEthersSigner();
  const [assets, setAssets] = useState<EncryptedGameAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState<{ [key: number]: boolean }>({});

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

  // 解密资产属性
  const handleDecryptAsset = async (assetId: number, asset: EncryptedGameAsset) => {
    if (!fheInstance || fheLoading || !address || !signer) return;

    setIsDecrypting(prev => ({ ...prev, [assetId]: true }));

    try {
      // 生成密钥对
      const keypair = fheInstance.generateKeypair();
      const handleContractPairs = [
        {
          handle: asset.encryptedEquipmentType,
          contractAddress: ENCRYPTED_GAME_ASSET_ADDRESS,
        },
        {
          handle: asset.encryptedAttack,
          contractAddress: ENCRYPTED_GAME_ASSET_ADDRESS,
        },
        {
          handle: asset.encryptedDefense,
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

      const equipmentTypeValue = result[asset.encryptedEquipmentType];
      const attackValue = result[asset.encryptedAttack];
      const defenseValue = result[asset.encryptedDefense];

      console.log(`资产 ${assetId} 解密结果:`, {
        equipmentType: equipmentTypeValue,
        attack: attackValue,
        defense: defenseValue
      });

      alert(`资产解密成功!\n装备类型: ${EQUIPMENT_TYPES[equipmentTypeValue as EquipmentType]}\n攻击力: ${attackValue}\n防御力: ${defenseValue}`);
    } catch (error) {
      console.error('解密失败:', error);
      alert('解密失败，请检查权限设置');
    } finally {
      setIsDecrypting(prev => ({ ...prev, [assetId]: false }));
    }
  };

  // 加载用户资产
  const loadUserAssets = async () => {
    if (!address || !assetCount) return;

    setIsLoading(true);
    try {
      const userAssets: EncryptedGameAsset[] = [];
      const countNum = Number(assetCount);

      for (let i = 0; i < countNum; i++) {
        // TODO: 从合约获取用户的每个资产详情
        // 这里需要根据实际合约ABI调整
      }

      setAssets(userAssets);
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
  }, [address, assetCount]);

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
                      opacity: isDecrypting[asset.assetId] ? 0.6 : 1,
                      cursor: isDecrypting[asset.assetId] ? 'not-allowed' : 'pointer'
                    }}
                    onClick={() => handleDecryptAsset(asset.assetId, asset)}
                    disabled={isDecrypting[asset.assetId]}
                  >
                    {isDecrypting[asset.assetId] ? '解密中...' : '解密查看'}
                  </button>
                </div>

                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                  <div style={{ marginBottom: '4px' }}>
                    装备类型: <span style={{ fontFamily: 'monospace', backgroundColor: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>
                      加密中...
                    </span>
                  </div>
                  <div style={{ marginBottom: '4px' }}>
                    攻击力: <span style={{ fontFamily: 'monospace', backgroundColor: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>
                      加密中...
                    </span>
                  </div>
                  <div style={{ marginBottom: '4px' }}>
                    防御力: <span style={{ fontFamily: 'monospace', backgroundColor: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>
                      加密中...
                    </span>
                  </div>
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