import React, { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { getUserLocation, getCityName, mintNFT, verifyNFT } from "@/services/nftService";

// Lazy load components for better performance
const Camera = lazy(() => import("@/components/Camera"));
const NFTGallery = lazy(() => import("@/components/NFTGallery"));

// Loading component for suspense fallbacks
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="bg-yellow-400 rounded-3xl border-4 border-black p-6" style={{
      boxShadow: '0 8px 0 #000, 0 12px 25px rgba(0,0,0,0.3)'
    }}>
      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-black mx-auto mb-3"></div>
      <p className="text-black font-black text-center" style={{
        fontFamily: '"Comic Sans MS", cursive'
      }}>
        Loading...
      </p>
    </div>
  </div>
);

export default function Home() {
  const [imgSrc, setImgSrc] = useState<string>("");
  const { publicKey, connected, connecting } = useWallet();
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [imageClicked, setImageClicked] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [mintingStatus, setMintingStatus] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'mint' | 'gallery'>('mint');
  const [viewportHeight, setViewportHeight] = useState('100vh');

  // Mobile optimization: Handle viewport height for mobile browsers
  useEffect(() => {
    const handleResize = () => {
      // Use window.innerHeight for mobile browsers to account for address bar
      setViewportHeight(`${window.innerHeight}px`);
    };

    const detectMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobile(isMobileDevice);
      
      // Set initial viewport height
      handleResize();
    };

    detectMobile();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Memoized handlers for better performance
  const handleCapture = useCallback((imageSrc: string) => {
    setImgSrc(imageSrc);
    setImageClicked(true);
    setIsCameraOpen(false);
  }, []);

  const handleTabSwitch = useCallback((tab: 'mint' | 'gallery') => {
    setActiveTab(tab);
    // Close camera when switching tabs
    if (tab === 'gallery') {
      setIsCameraOpen(false);
    }
  }, []);

  const handleMintNFT = useCallback(async (event: React.MouseEvent) => {
    event.preventDefault();
    setIsMinting(true);
    setMintingStatus("D'oh! Initializing...");

    try {
      if (!publicKey) {
        throw new Error("Please connect your wallet first, dude!");
      }

      if (!imgSrc) {
        throw new Error("Capture an image first, man!");
      }

      setMintingStatus("🍩 Getting your location...");
      const location = await getUserLocation();
      
      setMintingStatus("🏠 Finding your Springfield...");
      const cityName = await getCityName(location.latitude, location.longitude);
      
      setMintingStatus("📸 Uploading to the cloud...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMintingStatus("⚡ Minting your NFT...");
      const result = await mintNFT({
        publicKey: publicKey.toString(),
        cityName,
        location,
        imageUrl: imgSrc
      });

      setMintingStatus("✅ Verifying NFT...");
      await verifyNFT(result.assetId);

      // Mobile-friendly alert with shorter message
      if (isMobile) {
        alert(
          `🎉 NFT Minted!\n\n` +
          `📍 ${cityName}\n` +
          `🆔 ${result.assetId.slice(0, 8)}...\n\n` +
          `Check "My Collection" tab!`
        );
      } else {
        alert(
          `🎉 Woo-hoo! NFT Minted Successfully!\n\n` +
          `📍 Location: ${cityName}\n` +
          `🌍 Coordinates: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}\n` +
          `🆔 Asset ID: ${result.assetId}\n\n` +
          `✨ Check the "My Collection" tab to view it!\n\n` +
          `🔗 View on:\n` +
          `• Helius xRay: https://xray.helius.xyz/token/${result.assetId}`
        );
      }

      setActiveTab('gallery');
      setImageClicked(false);
      setImgSrc("");

    } catch (error) {
      console.error("Error:", error);
      let errorMessage = "D'oh! Something went wrong!";
      
      if (error instanceof Error) {
        if (error.message.includes("Location access denied")) {
          errorMessage = isMobile 
            ? "📍 Please enable location access in your browser settings!"
            : "📍 Location access is required. Please enable location permissions and try again!";
        } else if (error.message.includes("Location")) {
          errorMessage = `📍 Location Error: ${error.message}`;
        } else {
          errorMessage = error.message;
        }
      }
      
      alert(errorMessage);
    } finally {
      setIsMinting(false);
      setMintingStatus("");
    }
  }, [publicKey, imgSrc, isMobile]);

  if (!mounted) return null;

  return (
    <main 
      className="relative overflow-hidden"
      style={{
        minHeight: viewportHeight,
        background: 'linear-gradient(135deg, #FFB6C1 0%, #87CEEB 50%, #FFB6C1 100%)'
      }}
    >
      {/* Optimized clouds background - fewer elements for mobile */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-16 h-8 bg-white rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute top-20 right-20 w-12 h-6 bg-white rounded-full opacity-50 animate-pulse delay-1000"></div>
        {!isMobile && (
          <div className="absolute top-32 left-1/3 w-20 h-12 bg-white rounded-full opacity-40 animate-pulse delay-2000"></div>
        )}
      </div>

      <div className="relative z-10 h-full flex flex-col">
        {/* Header - Responsive sizing */}
        <header className="text-center py-6 px-4">
          <div className="relative">
            <h1 
              className={`font-black text-black mb-2 ${isMobile ? 'text-4xl' : 'text-6xl md:text-8xl'}`}
              style={{
                fontFamily: '"Comic Sans MS", cursive',
                textShadow: '4px 4px 0px #FF1493, 8px 8px 0px rgba(0,0,0,0.3)',
                transform: 'rotate(-2deg)'
              }}
            >
              NFTREK
            </h1>
            <p 
              className={`font-bold text-black mb-1 ${isMobile ? 'text-lg' : 'text-2xl md:text-3xl'}`}
              style={{
                fontFamily: '"Comic Sans MS", cursive',
                textShadow: '2px 2px 0px #fff'
              }}
            >
              Capture Moments, Mint Memories!
            </p>
            <p className={`text-gray-800 font-semibold ${isMobile ? 'text-sm' : 'text-lg'}`}>
              📍 Geological location data included!
            </p>
          </div>
        </header>

        {/* Tab Navigation - Mobile optimized */}
        <div className="flex justify-center mb-4 px-4">
          <div className="bg-yellow-400 rounded-full p-1 border-4 border-black shadow-lg" style={{
            boxShadow: '0 8px 0 #000, 0 12px 20px rgba(0,0,0,0.3)'
          }}>
            <button
              onClick={() => handleTabSwitch('mint')}
              className={`px-4 py-2 rounded-full font-black transition-all duration-300 border-3 ${isMobile ? 'text-sm' : 'text-lg'} ${
                activeTab === 'mint'
                  ? 'bg-red-500 text-white border-black shadow-inner transform translate-y-1'
                  : 'bg-white text-black border-black hover:bg-yellow-100 hover:transform hover:translate-y-1'
              }`}
              style={{
                fontFamily: '"Comic Sans MS", cursive',
                textShadow: activeTab === 'mint' ? '2px 2px 0px rgba(0,0,0,0.5)' : 'none'
              }}
            >
              📸 Mint NFT
            </button>
            <button
              onClick={() => handleTabSwitch('gallery')}
              className={`px-4 py-2 rounded-full font-black transition-all duration-300 border-3 ml-1 ${isMobile ? 'text-sm' : 'text-lg'} ${
                activeTab === 'gallery'
                  ? 'bg-red-500 text-white border-black shadow-inner transform translate-y-1'
                  : 'bg-white text-black border-black hover:bg-yellow-100 hover:transform hover:translate-y-1'
              }`}
              style={{
                fontFamily: '"Comic Sans MS", cursive',
                textShadow: activeTab === 'gallery' ? '2px 2px 0px rgba(0,0,0,0.5)' : 'none'
              }}
            >
              🖼️ Collection
            </button>
          </div>
        </div>

        {/* Main Content - Flex grow to fill remaining space */}
        <div className="flex-1 px-4 pb-4 overflow-hidden">
          {activeTab === 'mint' ? (
            <div className="h-full max-w-4xl mx-auto">
              <div className="bg-white rounded-3xl border-6 border-black p-4 h-full flex flex-col relative" style={{
                boxShadow: '0 12px 0 #000, 0 16px 30px rgba(0,0,0,0.3)',
                transform: 'rotate(1deg)'
              }}>
                {/* Decorative elements - Hidden on mobile for performance */}
                {!isMobile && (
                  <>
                    <div className="absolute -top-4 -left-4 w-8 h-8 bg-yellow-400 rounded-full border-3 border-black"></div>
                    <div className="absolute -top-4 -right-4 w-8 h-8 bg-red-500 rounded-full border-3 border-black"></div>
                    <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-blue-500 rounded-full border-3 border-black"></div>
                    <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-green-500 rounded-full border-3 border-black"></div>
                  </>
                )}

                {/* Wallet Connection */}
                <div className="text-center mb-4">
                  <div className="mb-4">
                    <WalletMultiButton 
                      className={`!bg-yellow-400 !border-4 !border-black !rounded-full !font-black !text-black hover:!bg-yellow-300 !transition-all !duration-300 ${
                        isMobile ? '!px-6 !py-3 !text-sm' : '!px-8 !py-4'
                      }`}
                      style={{
                        fontFamily: '"Comic Sans MS", cursive',
                        boxShadow: '0 6px 0 #000, 0 10px 20px rgba(0,0,0,0.3)',
                        textShadow: 'none'
                      }}
                    />
                  </div>
                  
                  {connecting ? (
                    <p className={`text-blue-600 font-bold ${isMobile ? 'text-sm' : 'text-lg'}`} style={{
                      fontFamily: '"Comic Sans MS", cursive'
                    }}>
                      Connecting wallet...
                    </p>
                  ) : connected ? (
                    <div className="space-y-2">
                      <p className={`text-green-600 font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`} style={{
                        fontFamily: '"Comic Sans MS", cursive',
                        textShadow: '2px 2px 0px #fff'
                      }}>
                        🎉 Ready to create geo-NFTs!
                      </p>
                      <p className={`text-gray-700 font-semibold ${isMobile ? 'text-sm' : 'text-lg'}`}>
                        📍 Location will be captured for metadata
                      </p>
                    </div>
                  ) : (
                    <p className={`text-red-600 font-bold ${isMobile ? 'text-lg' : 'text-xl'}`} style={{
                      fontFamily: '"Comic Sans MS", cursive',
                      textShadow: '2px 2px 0px #fff'
                    }}>
                      Connect wallet to start!
                    </p>
                  )}
                </div>

                {/* Camera Section - Scrollable on mobile */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Camera Button */}
                  <div className="text-center mb-4">
                    <button
                      className={`bg-blue-500 hover:bg-blue-400 text-white font-black rounded-full border-4 border-black transition-all duration-300 disabled:opacity-50 ${
                        isMobile ? 'px-8 py-4 text-lg' : 'px-12 py-6 text-xl'
                      }`}
                      onClick={() => setIsCameraOpen(!isCameraOpen)}
                      disabled={isMinting}
                      style={{
                        fontFamily: '"Comic Sans MS", cursive',
                        boxShadow: '0 8px 0 #000, 0 12px 25px rgba(0,0,0,0.3)',
                        textShadow: '2px 2px 0px rgba(0,0,0,0.5)',
                        transform: isCameraOpen ? 'translateY(4px)' : 'none'
                      }}
                    >
                      {isCameraOpen ? "📷 Close" : "📸 Camera"}
                    </button>
                  </div>

                  {/* Camera Component */}
                  <div className="flex-1 overflow-hidden">
                    <Suspense fallback={<LoadingSpinner />}>
                      <Camera
                        isMobile={isMobile}
                        isCameraOpen={isCameraOpen}
                        onCapture={handleCapture}
                      />
                    </Suspense>
                  </div>

                  {/* Image Preview and Mint Button */}
                  {imageClicked && (
                    <div className="mt-4 flex flex-col items-center gap-4">
                      <div className="relative max-w-xs mx-auto">
                        <div className="bg-yellow-400 p-3 rounded-3xl border-4 border-black" style={{
                          boxShadow: '0 8px 0 #000, 0 12px 25px rgba(0,0,0,0.3)'
                        }}>
                          <img
                            alt="captured"
                            src={imgSrc}
                            className="w-full h-auto rounded-2xl border-3 border-black max-h-48 object-cover"
                          />
                        </div>
                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xl p-2 rounded-full border-3 border-black">
                          📍
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <button
                          onClick={handleMintNFT}
                          disabled={isMinting || !connected}
                          className={`bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-400 hover:to-red-400 text-white font-black rounded-full border-4 border-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                            isMobile ? 'px-8 py-4 text-lg' : 'px-16 py-6 text-2xl'
                          }`}
                          style={{
                            fontFamily: '"Comic Sans MS", cursive',
                            boxShadow: '0 8px 0 #000, 0 12px 25px rgba(0,0,0,0.3)',
                            textShadow: '2px 2px 0px rgba(0,0,0,0.5)'
                          }}
                        >
                          {isMinting ? (
                            <span className="flex items-center gap-2">
                              <div className={`animate-spin rounded-full border-b-2 border-white ${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`}></div>
                              {isMobile ? mintingStatus.split(' ')[0] + '...' : mintingStatus}
                            </span>
                          ) : (
                            "🌍 Mint NFT!"
                          )}
                        </button>
                        {!isMinting && (
                          <p className={`text-gray-700 mt-2 font-bold ${isMobile ? 'text-sm' : 'text-lg'}`} style={{
                            fontFamily: '"Comic Sans MS", cursive'
                          }}>
                            ⚡ Captures your location
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full bg-white rounded-3xl border-6 border-black p-4 overflow-hidden" style={{
              boxShadow: '0 12px 0 #000, 0 16px 30px rgba(0,0,0,0.3)',
              transform: 'rotate(-0.5deg)'
            }}>
              <Suspense fallback={<LoadingSpinner />}>
                <NFTGallery />
              </Suspense>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}