import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Header } from './Header';
import { NFTAssetManager } from './NFTAssetManager';
import { EncryptedAssetManager } from './EncryptedAssetManager';

type TabType = 'nft' | 'encrypted';

export function GameAssetsApp() {
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<TabType>('nft');

  const tabStyle = (isActive: boolean) => ({
    padding: '14px 28px',
    background: isActive
      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
    color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
    border: isActive ? '2px solid rgba(79, 172, 254, 0.5)' : '2px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px 12px 0 0',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 4px',
    transition: 'all 0.3s ease',
    textShadow: isActive ? '0 1px 2px rgba(0, 0, 0, 0.2)' : 'none',
    boxShadow: isActive
      ? '0 4px 15px rgba(102, 126, 234, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
      : '0 2px 8px rgba(0, 0, 0, 0.1)',
    position: 'relative' as const,
    overflow: 'hidden'
  });

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0c0c1a 0%, #1a1a2e 25%, #16213e 50%, #1a1a2e 75%, #0c0c1a 100%)',
    fontFamily: '"Orbitron", "Rajdhani", system-ui, -apple-system, sans-serif',
    position: 'relative' as const,
    overflow: 'hidden'
  };

  const mainStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    position: 'relative' as const,
    zIndex: 1
  };

  const cardStyle = {
    background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(22, 33, 62, 0.95) 100%)',
    borderRadius: '20px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 60px rgba(79, 172, 254, 0.1)',
    border: '1px solid rgba(79, 172, 254, 0.2)',
    overflow: 'hidden',
    position: 'relative' as const,
    backdropFilter: 'blur(10px)'
  };

  const tabsStyle = {
    display: 'flex',
    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.2) 0%, rgba(255, 255, 255, 0.05) 100%)',
    padding: '8px',
    borderRadius: '20px 20px 0 0',
    borderBottom: '1px solid rgba(79, 172, 254, 0.2)'
  };

  const contentStyle = {
    padding: '32px',
    minHeight: '500px',
    background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.01) 100%)'
  };

  if (!isConnected) {
    return (
      <div style={containerStyle}>
        {/* Animated background particles */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `
            radial-gradient(circle at 20% 80%, rgba(79, 172, 254, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(118, 75, 162, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(102, 126, 234, 0.05) 0%, transparent 50%)
          `,
          animation: 'float 6s ease-in-out infinite'
        }}>
          <style>{`
            @keyframes float {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-20px) rotate(1deg); }
            }
          `}</style>
        </div>
        <Header />
        <div style={mainStyle}>
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.9) 100%)',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 60px rgba(79, 172, 254, 0.1)',
            border: '1px solid rgba(79, 172, 254, 0.2)',
            position: 'relative' as const,
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(45deg, transparent 30%, rgba(79, 172, 254, 0.03) 50%, transparent 70%)',
              animation: 'shimmer 3s infinite'
            }}>
              <style>{`
                @keyframes shimmer {
                  0% { transform: translateX(-100%); }
                  100% { transform: translateX(100%); }
                }
              `}</style>
            </div>
            <h2 style={{
              fontSize: '28px',
              marginBottom: '16px',
              color: '#ffffff',
              background: 'linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 0 30px rgba(79, 172, 254, 0.3)',
              position: 'relative' as const,
              zIndex: 1
            }}>
              🎮 Encrypted Game Asset Management System
            </h2>
            <p style={{
              fontSize: '18px',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '24px',
              position: 'relative' as const,
              zIndex: 1
            }}>
              🔗 Please connect your wallet to start managing game assets
            </p>
            <p style={{
              fontSize: '16px',
              color: 'rgba(255, 255, 255, 0.6)',
              position: 'relative' as const,
              zIndex: 1
            }}>
              ⚔️ Supports creation, viewing and conversion of regular NFT assets and Zama encrypted assets
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Dynamic background particles */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `
          radial-gradient(circle at 20% 80%, rgba(79, 172, 254, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(118, 75, 162, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(102, 126, 234, 0.04) 0%, transparent 50%)
        `,
        animation: 'float 8s ease-in-out infinite'
      }}>
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            33% { transform: translateY(-15px) rotate(0.5deg); }
            66% { transform: translateY(-5px) rotate(-0.5deg); }
          }
        `}</style>
      </div>
      <Header />
      <div style={mainStyle}>
        <div style={cardStyle}>
          <div style={tabsStyle}>
            <button
              style={tabStyle(activeTab === 'nft')}
              onClick={() => setActiveTab('nft')}
            >
              🗡️ Regular NFT Assets
            </button>
            <button
              style={tabStyle(activeTab === 'encrypted')}
              onClick={() => setActiveTab('encrypted')}
            >
              🔐 Encrypted Game Assets
            </button>
          </div>

          <div style={contentStyle}>
            {activeTab === 'nft' && <NFTAssetManager />}
            {activeTab === 'encrypted' && <EncryptedAssetManager />}
          </div>
        </div>

        <div style={{
          marginTop: '24px',
          padding: '24px',
          background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.9) 100%)',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2), 0 0 40px rgba(79, 172, 254, 0.05)',
          border: '1px solid rgba(79, 172, 254, 0.15)',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.8)',
          position: 'relative' as const,
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, transparent 30%, rgba(79, 172, 254, 0.02) 50%, transparent 70%)',
            animation: 'shimmer 4s infinite'
          }} />
          <h3 style={{
            fontSize: '18px',
            color: '#ffffff',
            marginBottom: '12px',
            background: 'linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            position: 'relative' as const,
            zIndex: 1
          }}>
            ⚡ Feature Description:
          </h3>
          <ul style={{
            lineHeight: '1.8',
            paddingLeft: '20px',
            position: 'relative' as const,
            zIndex: 1
          }}>
            <li style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#4facfe' }}>🗡️ Regular NFT Assets:</strong> Create and manage NFTs with transparent equipment types (1-4), attack power, and defense power
            </li>
            <li>
              <strong style={{ color: '#00f2fe' }}>🔐 Encrypted Game Assets:</strong> Use Zama FHE technology to encrypt equipment attributes, protect game data privacy, support conversion of regular NFTs to encrypted assets
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}