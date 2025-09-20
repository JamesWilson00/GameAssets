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

  // Random equipment state
  const [randomEquipment, setRandomEquipment] = useState<{
    equipmentType: EquipmentType;
    attack: number;
    defense: number;
  } | null>(null);

  // Contract interaction
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Read user's NFT balance
  const { data: balance } = useReadContract({
    address: GAME_ASSET_ADDRESS,
    abi: GAME_ASSET_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // Read user's all equipment
  const { data: allEquipments } = useReadContract({
    address: GAME_ASSET_ADDRESS,
    abi: GAME_ASSET_ABI,
    functionName: 'getAllEquipments',
    args: address ? [address] : undefined,
  });

  // Generate random equipment
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

    console.log('Generated random equipment:', randomEquip);

    setRandomEquipment(randomEquip);
  };

  // Mint NFT Asset
  const handleMintAsset = async () => {
    if (!address || !randomEquipment) {
      alert('Please generate random equipment first!');
      return;
    }

    console.log('Preparing to mint NFT, parameters:', {
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
      console.error('Failed to create NFT:', error);
    }
  };

  // Load user assets
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
      console.error('Failed to load assets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConfirmed) {
      loadUserAssets();
      // Reset random equipment
      setRandomEquipment(null);
    }
  }, [isConfirmed]);

  useEffect(() => {
    loadUserAssets();
  }, [address, allEquipments]);

  const cardStyle = {
    border: '1px solid rgba(79, 172, 254, 0.2)',
    borderRadius: '16px',
    padding: '24px',
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    position: 'relative' as const,
    overflow: 'hidden'
  };

  const buttonStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    padding: '12px 24px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
    position: 'relative' as const,
    overflow: 'hidden'
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
      <h2 style={{
        fontSize: '24px',
        fontWeight: '700',
        marginBottom: '32px',
        color: '#ffffff',
        background: 'linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        textShadow: '0 0 20px rgba(79, 172, 254, 0.3)',
        fontFamily: '"Orbitron", monospace'
      }}>
        🗡️ Regular NFT Asset Management
      </h2>

      {/* Create new asset */}
      <div style={{ ...cardStyle, marginBottom: '24px' }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          marginBottom: '20px',
          color: '#ffffff',
          fontFamily: '"Rajdhani", sans-serif',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
        }}>
          🎲 Random Generate Equipment NFT
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
                🎲 Random Equipment Generated:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Equipment Type</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                    {EQUIPMENT_TYPES[randomEquipment.equipmentType]}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Attack Power</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#dc2626' }}>
                    {randomEquipment.attack}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Defense Power</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#2563eb' }}>
                    {randomEquipment.defense}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#6b7280' }}>
              Click "🎲 Generate Random Equipment" button to generate random equipment attributes
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
            🎲 Generate Random Equipment
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
            {isPending ? 'Confirming...' : isConfirming ? 'Minting...' : '🎮 Create Equipment NFT'}
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
            Error: {error.message}
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
            🎉 Random Equipment NFT Created Successfully!
          </div>
        )}
      </div>

      {/* Asset list */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px', color: '#374151' }}>
          My Equipment NFTs ({balance ? balance.toString() : '0'})
        </h3>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            Loading...
          </div>
        ) : assets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            No equipment NFTs yet
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
                  Attack: {asset.attackPower}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                  Defense: {asset.defensePower}
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