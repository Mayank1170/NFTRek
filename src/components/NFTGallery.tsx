import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface NFTData {
  id: string;
  content: {
    metadata: {
      name: string;
      description: string;
      image: string;
      attributes: Array<{
        trait_type: string;
        value: string;
      }>;
    };
  };
  grouping?: Array<{
    group_key: string;
    group_value: string;
  }>;
}

const NFTGallery: React.FC = () => {
  const { publicKey } = useWallet();
  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const detectMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobile(isMobileDevice);
    };
    detectMobile();
  }, []);

  // Memoized image URL function for better performance
  const getImageUrl = useMemo(() => (imageUrl: string): string => {
    if (!imageUrl) return '';
    
    if (imageUrl.startsWith('data:')) {
      return imageUrl;
    }
    
    if (imageUrl.includes('/ipfs/')) {
      const cid = imageUrl.split('/ipfs/')[1];
      return `https://ipfs.io/ipfs/${cid}`;
    }
    
    if (imageUrl.includes('arweave.net')) {
      return imageUrl;
    }
    
    return imageUrl;
  }, []);

  // Memoized time formatter
  const formatMintingTime = useCallback((attributes: Array<{trait_type: string; value: string}>) => {
    const mintedAt = attributes.find(attr => attr.trait_type === 'Minted At')?.value;
    const timeAttr = attributes.find(attr => attr.trait_type === 'Time')?.value;
    const dateAttr = attributes.find(attr => attr.trait_type === 'Created')?.value;
    
    if (mintedAt) {
      const date = new Date(mintedAt);
      return isMobile ? date.toLocaleDateString() : date.toLocaleString();
    } else if (dateAttr && timeAttr) {
      return isMobile ? dateAttr : `${dateAttr} ${timeAttr}`;
    } else if (dateAttr) {
      return dateAttr;
    }
    return 'Unknown';
  }, [isMobile]);

  const fetchUserNFTs = useCallback(async () => {
    if (!publicKey) return;
    
    setLoading(true);
    setError("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) throw new Error("API URL not configured");

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'nftrek-get-assets',
          method: 'getAssetsByOwner',
          params: {
            ownerAddress: publicKey.toString(),
            page: 1,
            limit: 1000,
            displayOptions: {
              showFungible: false,
              showNativeBalance: false
            }
          }
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || "Failed to fetch NFTs");
      }

      const nftrekNFTs = data.result.items
        .filter((nft: NFTData) => 
          nft.content?.metadata?.name?.includes('NFTrek') ||
          nft.grouping?.some(g => g.group_value === 'NFTREK')
        )
        .sort((a: NFTData, b: NFTData) => {
          const aDate = a.content?.metadata?.attributes?.find(attr => attr.trait_type === 'Created')?.value;
          const bDate = b.content?.metadata?.attributes?.find(attr => attr.trait_type === 'Created')?.value;
          if (aDate && bDate) {
            return new Date(bDate).getTime() - new Date(aDate).getTime();
          }
          return 0;
        });

      setNfts(nftrekNFTs);
    } catch (error) {
      console.error("Error fetching NFTs:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch NFTs");
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    if (publicKey) {
      fetchUserNFTs();
    }
  }, [publicKey, fetchUserNFTs]);

  if (!publicKey) {
    return (
      <div className="text-center py-8 h-full flex items-center justify-center">
        <div className="bg-yellow-400 rounded-3xl border-4 border-black p-8 max-w-sm mx-auto" style={{
          boxShadow: '0 8px 0 #000, 0 12px 25px rgba(0,0,0,0.3)',
          transform: 'rotate(2deg)'
        }}>
          <div className="text-4xl mb-4">🔐</div>
          <p className={`text-black font-black ${isMobile ? 'text-lg' : 'text-xl'}`} style={{
            fontFamily: '"Comic Sans MS", cursive',
            textShadow: '2px 2px 0px #fff'
          }}>
            Connect wallet to view your NFTrek collection!
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8 h-full flex items-center justify-center">
        <div className="bg-blue-400 rounded-3xl border-4 border-black p-8 max-w-sm mx-auto" style={{
          boxShadow: '0 8px 0 #000, 0 12px 25px rgba(0,0,0,0.3)'
        }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-black mx-auto mb-4"></div>
          <p className={`text-black font-black ${isMobile ? 'text-lg' : 'text-xl'}`} style={{
            fontFamily: '"Comic Sans MS", cursive'
          }}>
            Loading collection...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 h-full flex items-center justify-center">
        <div className="bg-red-400 rounded-3xl border-4 border-black p-8 max-w-sm mx-auto" style={{
          boxShadow: '0 8px 0 #000, 0 12px 25px rgba(0,0,0,0.3)',
          transform: 'rotate(-1deg)'
        }}>
          <div className="text-4xl mb-4">❌</div>
          <p className={`text-black font-black mb-4 ${isMobile ? 'text-base' : 'text-lg'}`} style={{
            fontFamily: '"Comic Sans MS", cursive'
          }}>
            D'oh! {error}
          </p>
          <button
            onClick={fetchUserNFTs}
            className={`bg-yellow-400 hover:bg-yellow-300 text-black font-black rounded-full border-3 border-black transition-all duration-300 ${isMobile ? 'px-4 py-2 text-sm' : 'px-6 py-3'}`}
            style={{
              fontFamily: '"Comic Sans MS", cursive',
              boxShadow: '0 4px 0 #000'
            }}
          >
            Try Again!
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <h2 className={`font-black text-black ${isMobile ? 'text-2xl' : 'text-4xl'}`} style={{
          fontFamily: '"Comic Sans MS", cursive',
          textShadow: '3px 3px 0px #FFB6C1, 6px 6px 0px rgba(0,0,0,0.3)',
          transform: 'rotate(-1deg)'
        }}>
          {isMobile ? 'Collection' : 'Your NFTrek Collection'}
        </h2>
        <button
          onClick={fetchUserNFTs}
          className={`bg-green-400 hover:bg-green-300 text-black font-black rounded-full border-3 border-black transition-all duration-300 flex items-center gap-2 ${isMobile ? 'px-4 py-2 text-sm' : 'px-6 py-3'}`}
          style={{
            fontFamily: '"Comic Sans MS", cursive',
            boxShadow: '0 6px 0 #000, 0 10px 20px rgba(0,0,0,0.3)'
          }}
        >
          <span>🔄</span>
          {!isMobile && 'Refresh'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {nfts.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-pink-300 rounded-3xl border-4 border-black p-8 max-w-sm mx-auto" style={{
              boxShadow: '0 12px 0 #000, 0 16px 30px rgba(0,0,0,0.3)',
              transform: 'rotate(1deg)'
            }}>
              <div className={`mb-4 ${isMobile ? 'text-6xl' : 'text-8xl'}`}>🏞️</div>
              <div className={`text-black font-black mb-4 ${isMobile ? 'text-xl' : 'text-2xl'}`} style={{
                fontFamily: '"Comic Sans MS", cursive',
                textShadow: '2px 2px 0px #fff'
              }}>
                No NFTrek adventures yet!
              </div>
              <p className={`text-black font-bold ${isMobile ? 'text-base' : 'text-lg'}`}>
                Start by capturing and minting your first geo-NFT!
              </p>
            </div>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            isMobile 
              ? 'grid-cols-1' 
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}>
            {nfts.map((nft, index) => (
              <div
                key={nft.id}
                className="bg-white rounded-3xl border-4 border-black overflow-hidden transition-all duration-300 hover:transform hover:scale-105"
                style={{
                  boxShadow: '0 8px 0 #000, 0 12px 25px rgba(0,0,0,0.3)',
                  transform: `rotate(${index % 2 === 0 ? '1deg' : '-1deg'})`
                }}
              >
                {/* Image */}
                {nft.content?.metadata?.image && (
                  <div className={`relative bg-yellow-400 border-b-4 border-black ${isMobile ? 'h-48' : 'h-48'}`}>
                    <img
                      src={getImageUrl(nft.content.metadata.image)}
                      alt={nft.content.metadata.name || "NFTrek NFT"}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const originalSrc = target.src;
                        
                        if (originalSrc.includes('ipfs.io')) {
                          target.src = originalSrc.replace('ipfs.io', 'cloudflare-ipfs.com');
                        } else if (originalSrc.includes('cloudflare-ipfs.com')) {
                          target.src = originalSrc.replace('cloudflare-ipfs.com', 'gateway.pinata.cloud');
                        } else {
                          target.style.display = 'none';
                          const placeholder = target.parentElement?.querySelector('.image-placeholder');
                          if (placeholder) {
                            (placeholder as HTMLElement).style.display = 'flex';
                          }
                        }
                      }}
                    />
                    <div className="image-placeholder absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-400 flex flex-col items-center justify-center text-black hidden">
                      <div className="text-4xl mb-2">📸</div>
                      <div className="text-sm font-bold">Loading...</div>
                    </div>
                    <div className={`absolute top-2 right-2 bg-red-500 text-white rounded-full border-2 border-black ${isMobile ? 'text-sm p-2' : 'text-lg p-2'}`}>
                      📍
                    </div>
                  </div>
                )}
                
                {/* Content */}
                <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
                  <h3 className={`font-black text-black mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`} style={{
                    fontFamily: '"Comic Sans MS", cursive'
                  }}>
                    {nft.content?.metadata?.name || "Unnamed NFT"}
                  </h3>
                  
                  {nft.content?.metadata?.description && !isMobile && (
                    <p className="text-gray-700 text-sm mb-3 font-semibold line-clamp-2">
                      {nft.content.metadata.description}
                    </p>
                  )}

                  {nft.content?.metadata?.attributes && (
                    <div className="space-y-2 mb-4">
                      {/* Minting time */}
                      <div className="bg-yellow-400 rounded-2xl border-3 border-black p-2">
                        <div className={`flex justify-between items-center ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          <span className="text-black font-bold">🕐 Minted:</span>
                          <span className="text-black font-black font-mono text-right">
                            {formatMintingTime(nft.content.metadata.attributes)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Location data */}
                      {nft.content.metadata.attributes
                        .filter(attr => ['Latitude', 'Longitude', 'Location'].includes(attr.trait_type))
                        .slice(0, isMobile ? 2 : 3) // Show fewer on mobile
                        .map((attr, index) => (
                        <div key={index} className={`flex justify-between bg-gray-100 rounded-xl p-2 border-2 border-black ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          <span className="text-black font-bold">
                            {attr.trait_type === 'Latitude' ? '📍 Lat:' : 
                             attr.trait_type === 'Longitude' ? '📍 Long:' :
                             attr.trait_type === 'Location' ? '🌍 Place:' : 
                             `${attr.trait_type}:`}
                          </span>
                          <span className="text-black font-black font-mono">
                            {attr.trait_type === 'Latitude' || attr.trait_type === 'Longitude' 
                              ? parseFloat(attr.value).toFixed(4)
                              : isMobile && attr.value.length > 15 ? attr.value.slice(0, 12) + '...' : attr.value
                            }
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className={`flex ${isMobile ? 'space-x-2' : 'space-x-3'}`}>
                    <a
                      href={`https://xray.helius.xyz/token/${nft.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex-1 bg-blue-500 hover:bg-blue-400 text-white font-black text-center rounded-full border-3 border-black transition-all duration-300 ${isMobile ? 'py-2 text-xs' : 'py-3 text-sm'}`}
                      style={{
                        fontFamily: '"Comic Sans MS", cursive',
                        boxShadow: '0 4px 0 #000',
                        textShadow: '1px 1px 0px rgba(0,0,0,0.5)'
                      }}
                    >
                      {isMobile ? 'xRay' : 'View on xRay'}
                    </a>
                    <a
                      href={`https://explorer.solana.com/address/${nft.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex-1 bg-green-500 hover:bg-green-400 text-white font-black text-center rounded-full border-3 border-black transition-all duration-300 ${isMobile ? 'py-2 text-xs' : 'py-3 text-sm'}`}
                      style={{
                        fontFamily: '"Comic Sans MS", cursive',
                        boxShadow: '0 4px 0 #000',
                        textShadow: '1px 1px 0px rgba(0,0,0,0.5)'
                      }}
                    >
                      {isMobile ? 'Explorer' : 'Explorer'}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer info */}
      <div className="mt-6 text-center flex-shrink-0">
        <div className="bg-yellow-400 rounded-full border-4 border-black px-6 py-3 inline-block" style={{
          boxShadow: '0 6px 0 #000, 0 10px 20px rgba(0,0,0,0.3)'
        }}>
          <p className={`text-black font-black ${isMobile ? 'text-sm' : 'text-lg'}`} style={{
            fontFamily: '"Comic Sans MS", cursive'
          }}>
            📍 {isMobile ? 'Geo-NFTs' : 'All NFTs include geological location data'}
          </p>
          {!isMobile && (
            <p className="text-black font-bold text-sm">
              🔗 Compressed NFTs for efficient storage
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NFTGallery;