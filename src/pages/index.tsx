import React, { useState, useEffect } from "react";
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { SparklesCore } from "@/components/ui/sparkles";
import Camera from "@/components/Camera";
import { getUserLocation, getCityName, mintNFT, verifyNFT } from "@/services/nftService";

export default function Home() {
  const [imgSrc, setImgSrc] = useState<string>("");
  const { publicKey } = useWallet();
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [imageClicked, setImageClicked] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [mintingStatus, setMintingStatus] = useState<string>("");

  useEffect(() => {
    setMounted(true);
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  const handleCapture = (imageSrc: string) => {
    setImgSrc(imageSrc);
    setImageClicked(true);
    setIsCameraOpen(false);
  };

  const handleMintNFT = async (event: React.MouseEvent) => {
    event.preventDefault();
    setIsMinting(true);
    setMintingStatus("Initializing...");

    try {
      if (!publicKey) {
        throw new Error("Please connect your wallet first");
      }

      if (!imgSrc) {
        throw new Error("Please capture an image first");
      }

      setMintingStatus("Getting location...");
      const location = await getUserLocation();
      
      setMintingStatus("Fetching city name...");
      const cityName = await getCityName(location.latitude, location.longitude);
      
      setMintingStatus("Minting NFT...");
      const result = await mintNFT({
        publicKey: publicKey.toString(),
        cityName,
        location,
        imageUrl: imgSrc
      });

      setMintingStatus("Verifying NFT...");
      await verifyNFT(result.assetId);

      alert(
        `NFT Minted Successfully!\n\n` +
        `Location: ${cityName}\n` +
        `Asset ID: ${result.assetId}\n\n` +
        `View on:\n` +
        `• Solana Explorer: https://explorer.solana.com/address/${result.assetId}\n` +
        `• Helius: https://xray.helius.xyz/token/${result.assetId}`
      );

    } catch (error) {
      console.error("Error:", error);
      alert(error instanceof Error ? error.message : "Failed to mint NFT");
    } finally {
      setIsMinting(false);
      setMintingStatus("");
    }
  };

  if (!mounted) return null;

  return (
    <main className="text-white w-full min-h-screen bg-gradient-to-b from-gray-900 to-black overflow-hidden">
      <div className="w-full h-full absolute">
        <SparklesCore
          id="tsparticles"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={100}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            NFTRek
          </h1>
          <p className="mt-4 text-xl text-gray-300">Capture. Mint. Explore.</p>
        </header>

        <div className="max-w-3xl px-5 mx-auto bg-gray-800 bg-opacity-50 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-8 text-center">
            <WalletMultiButton className="mb-8" />
            {publicKey ? (
              <p className="text-lg mb-4">Ready to create your NFTrek!</p>
            ) : (
              <p className="text-lg mb-4">Connect your wallet to get started</p>
            )}
          </div>

          <div className="mb-8 text-center">
            <button
              className="px-6 py-3 bg-blue-500 rounded-full text-white font-semibold hover:bg-blue-600 transition duration-300"
              onClick={() => setIsCameraOpen(!isCameraOpen)}
              disabled={isMinting}
            >
              {isCameraOpen ? "Close Camera" : "Open Camera"}
            </button>
          </div>

          <Camera
            isMobile={isMobile}
            isCameraOpen={isCameraOpen}
            onCapture={handleCapture}
          />

          {imageClicked && (
            <div className="w-full flex flex-col items-center mb-8 gap-8">
              <img
                alt="captured"
                src={imgSrc}
                className="w-full h-auto rounded-lg shadow-lg"
              />
              <button
                onClick={handleMintNFT}
                disabled={isMinting || !publicKey}
                className="w-fit px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isMinting ? mintingStatus : "Mint NFT"}
              </button>
            </div>
          )}
        </div>

        <footer className="mt-12 text-center text-gray-400">
          <p>&copy; 2024 NFTRek. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}