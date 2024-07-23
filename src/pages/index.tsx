import React, { useRef, useState, useEffect, ChangeEvent } from "react";
import { useWallet } from '@solana/wallet-adapter-react';
import { SparklesCore } from "@/components/ui/sparkles";
import Webcam from "react-webcam";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
require('@solana/wallet-adapter-react-ui/styles.css');

const nftExternalUrl = "NFTRek";

export default function Home() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const [imgSrc, setImgSrc] = useState<string>("");
  const { publicKey } = useWallet();
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [imageClicked, setImageClicked] = useState<boolean>(false);
  const webRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  const getUserLocation = (): Promise<{ latitude: number, longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => reject(error)
        );
      }
    });
  };

  const getCityName = async (latitude: number, longitude: number): Promise<string> => {
    const apiKey = process.env.NEXT_PUBLIC_OPENCAGE_API_KEY;
    const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${apiKey}`);
    const data = await response.json();

    if (data.results.length > 0) {
      return data.results[0].components.city || data.results[0].components.town || data.results[0].components.village || 'Unknown location';
    } else {
      throw new Error("Unable to determine location");
    }
  };

  const mintCompressedNft = async (event: { preventDefault: () => void }) => {
    event.preventDefault();

    try {
      if (!publicKey) {
        alert("Wallet is not connected");
        return;
      }

      const { latitude, longitude } = await getUserLocation();
      const cityName = await getCityName(latitude, longitude);
      console.log(`Location: ${cityName} (${latitude}, ${longitude})`);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'nftrek-minting',
          method: 'mintCompressedNft',
          params: {
            name: `NFTrek: ${cityName}`,
            symbol: 'NFTRK',
            owner: publicKey.toString(),
            description: `This NFT represents your trek in ${cityName}. Captured and minted on-location!`,
            attributes: [
              {
                trait_type: 'Location',
                value: cityName,
              },
              {
                trait_type: 'Latitude',
                value: latitude.toFixed(4),
              },
              {
                trait_type: 'Longitude',
                value: longitude.toFixed(4),
              },
              // {
              //   trait_type: 'Elevation',
              //   value: getSelection(latitude, longitude), // You'll need to implement this function
              // },
              {
                trait_type: 'Weather',
                value: getCurrentWeather(cityName), // You'll need to implement this function
              },
              {
                trait_type: 'Trek Date',
                value: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
              }
            ],
            imageUrl: imgSrc,
            externalUrl: `https://nftrek.com/treks/${cityName.toLowerCase().replace(/\s+/g, '-')}`,
            sellerFeeBasisPoints: 500, // 5% royalty fee
          },
        })
      });

      const jsonResponse = await response.json();
      console.log("JSON Response:", jsonResponse);

      if (jsonResponse.error) {
        console.error("API Error:", jsonResponse.error);
        alert(`Failed to mint NFT: ${jsonResponse.error.message}`);
        return;
      }

      const { result } = jsonResponse;

      if (!result) {
        console.error("No result in response.");
        alert("Request failed");
        return;
      }

      setImgSrc(result.assetId);
      fetchNFT(result.assetId, event);
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while minting NFT.");
    }
  };

  const fetchNFT = async (assetId: string, event: { preventDefault: () => void }) => {
    event.preventDefault();

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'my-id',
          method: 'getAsset',
          params: {
            id: assetId
          }
        })
      });

      const jsonResponse = await response.json();
      console.log("JSON Response:", jsonResponse);

      if (jsonResponse.error) {
        console.error("Error:", jsonResponse.error);
        alert(`Failed to fetch NFT: ${jsonResponse.error.message}`);
        return;
      }

      const { result } = jsonResponse;

      if (result && result.content && result.content.links && result.content.links.image) {
        // setImgSrc(result.content.links.image);
      } else {
        alert("Failed to fetch NFT image.");
      }

      return { result };
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const showImage = () => {
    if (isMobile) {
      setImageClicked(true);
      setIsCameraOpen(false);
    } else {
      const screenshot = webRef.current.getScreenshot();
      if (screenshot) {
        setImgSrc(screenshot);
        setImageClicked(true);
        setIsCameraOpen(false);
      } else {
        alert("Failed to capture image.");
      }
    }
  };

  const openCamera = () => {
    setIsCameraOpen(!isCameraOpen);
    setImageClicked(false);
  };

  const handleMobileCapture = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          setImgSrc(result);
          setImageClicked(true);
          setIsCameraOpen(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!mounted) return null;

  return (
    <main className="text-white w-full min-h-screen bg-gradient-to-b from-gray-900 to-black overflow-hidden">
      {/* Background sparkles effect */}
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

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            NFTRek
          </h1>
          <p className="mt-4 text-xl text-gray-300">Capture. Mint. Explore.</p>
        </header>

        {/* Main content */}
        <div className="max-w-3xl px-5 mx-auto bg-gray-800 bg-opacity-50 rounded-xl shadow-2xl overflow-hidden">
          {publicKey ? (
            <div className="p-8 text-center">
              <WalletMultiButton className="mb-8" />
              <p className="text-lg mb-4">Wallet connected. Ready to mint your NFT!</p>
            </div>
          ) : (
            <div className="p-8">
              <div className="text-center">
                <WalletMultiButton />
              </div>

            </div>
          )}
          <div className="mb-8 text-center">
            <button
              className="px-6 py-3 bg-blue-500 rounded-full text-white font-semibold hover:bg-blue-600 transition duration-300"
              onClick={openCamera}
            >
              {isCameraOpen ? "Close Camera" : "Open Camera"}
            </button>
          </div>
          {isCameraOpen && (
            <div className="mb-8">
              {isMobile ? (
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleMobileCapture}
                  className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              ) : (
                <Webcam
                  ref={webRef}
                  className="w-full rounded-lg"
                />
              )}
              {isCameraOpen && !isMobile && (
                <div className="text-center mb-8">
                  <button
                    onClick={showImage}
                    className="px-6 py-3 bg-green-500 rounded-full text-white font-semibold hover:bg-green-600 transition duration-300"
                  >
                    Capture Image
                  </button>
                </div>
              )}

            </div>
          )}
          {imageClicked && (
            <div className="w-full flex flex-col items-center mb-8 gap-8">
              <img
                alt="captured image"
                src={imgSrc}
                className="w-full h-auto rounded-lg shadow-lg"
              />
              <button
                onClick={event => mintCompressedNft(event)}
                className="w-fit px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition duration-300"
              >
                Mint NFT
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-400">
          <p>&copy; 2024 NFTRek. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}

function getCurrentWeather(cityName: string) {
  throw new Error("Function not implemented.");
}
