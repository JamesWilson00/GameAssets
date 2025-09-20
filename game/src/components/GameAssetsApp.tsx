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
              加密游戏资产管理系统
            </h2>
            <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '24px' }}>
              请连接您的钱包以开始管理游戏资产
            </p>
            <p style={{ fontSize: '14px', color: '#9ca3af' }}>
              支持普通NFT资产和Zama加密资产的创建、查看和转换
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
              普通NFT资产
            </button>
            <button
              style={tabStyle(activeTab === 'encrypted')}
              onClick={() => setActiveTab('encrypted')}
            >
              加密游戏资产
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
            功能说明：
          </h3>
          <ul style={{ lineHeight: '1.6', paddingLeft: '20px' }}>
            <li><strong>普通NFT资产：</strong>创建和管理装备类型(1-4)、攻击力、防御力透明可见的NFT</li>
            <li><strong>加密游戏资产：</strong>使用Zama FHE技术加密装备属性，保护游戏数据隐私，支持普通NFT转换为加密资产</li>
          </ul>
        </div>
      </div>
    </div>
  );
}