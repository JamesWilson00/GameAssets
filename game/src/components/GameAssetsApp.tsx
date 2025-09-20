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
    padding: '12px 24px',
    backgroundColor: isActive ? '#3b82f6' : '#e5e7eb',
    color: isActive ? 'white' : '#374151',
    border: 'none',
    borderRadius: '8px 8px 0 0',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    margin: '0 2px',
    transition: 'all 0.2s ease'
  });

  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  };

  const mainStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px'
  };

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden'
  };

  const tabsStyle = {
    display: 'flex',
    backgroundColor: '#e5e7eb',
    padding: '4px',
    borderRadius: '8px 8px 0 0'
  };

  const contentStyle = {
    padding: '24px'
  };

  if (!isConnected) {
    return (
      <div style={containerStyle}>
        <Header />
        <div style={mainStyle}>
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ fontSize: '24px', marginBottom: '16px', color: '#1f2937' }}>
              Encrypted Game Asset Management System
            </h2>
            <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '24px' }}>
              Please connect your wallet to start managing game assets
            </p>
            <p style={{ fontSize: '14px', color: '#9ca3af' }}>
              Supports creation, viewing and conversion of regular NFT assets and Zama encrypted assets
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <Header />
      <div style={mainStyle}>
        <div style={cardStyle}>
          <div style={tabsStyle}>
            <button
              style={tabStyle(activeTab === 'nft')}
              onClick={() => setActiveTab('nft')}
            >
              Regular NFT Assets
            </button>
            <button
              style={tabStyle(activeTab === 'encrypted')}
              onClick={() => setActiveTab('encrypted')}
            >
              Encrypted Game Assets
            </button>
          </div>

          <div style={contentStyle}>
            {activeTab === 'nft' && <NFTAssetManager />}
            {activeTab === 'encrypted' && <EncryptedAssetManager />}
          </div>
        </div>

        <div style={{
          marginTop: '20px',
          padding: '16px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)',
          fontSize: '14px',
          color: '#6b7280'
        }}>
          <h3 style={{ fontSize: '16px', color: '#1f2937', marginBottom: '8px' }}>
            Feature Description:
          </h3>
          <ul style={{ lineHeight: '1.6', paddingLeft: '20px' }}>
            <li><strong>Regular NFT Assets:</strong> Create and manage NFTs with transparent equipment types (1-4), attack power, and defense power</li>
            <li><strong>Encrypted Game Assets:</strong> Use Zama FHE technology to encrypt equipment attributes, protect game data privacy, support conversion of regular NFTs to encrypted assets</li>
          </ul>
        </div>
      </div>
    </div>
  );
}