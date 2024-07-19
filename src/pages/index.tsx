import React, { useRef, useState, useEffect } from "react";
import { useWallet } from '@solana/wallet-adapter-react';
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
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  useEffect(() => {
    setMounted(true);
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      }).catch((error) => {
        console.error("Error enumerating devices:", error);
        alert("Error accessing media devices.");
      });
    } else {
      console.warn("navigator.mediaDevices.enumerateDevices not supported.");
      alert("Your device does not support media device enumeration.");
    }
  }, []);

  const handleDeviceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDeviceId(event.target.value);
  };

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

      // Get user's location
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
          id: 'NFTRek',
          method: 'mintCompressedNft',
          params: {
            name: "NFTrek",
            symbol: 'Trekking',
            owner: publicKey.toString(),
            description: "Minted your NFT at this cool location",
            attributes: [{
              trait_type: 'Cool Factor',
              value: 'Super',
            },
            {
              trait_type: 'Location',
              value: cityName,
            }],
            imageUrl: imgSrc,
            externalUrl: nftExternalUrl,
            sellerFeeBasisPoints: 6900,
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
    const screenshot = webRef.current.getScreenshot();
    if (screenshot) {
      setImgSrc(screenshot);
      setImageClicked(true);
      setIsCameraOpen(false);
    } else {
      alert("Failed to capture image.");
    }
  };

  const openCamera = () => {
    setIsCameraOpen(!isCameraOpen);
    setImageClicked(false);
  };

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({
        x: event.clientX,
        y: event.clientY,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const circleSize = 500;

  if (!mounted) return null;

  return (
    <main className="text-white w-full min-h-screen p-4">
      <div className="w-[100vw] h-full absolute bg-[url('../../public/Grid.svg')] bg-cover z-[-2]"></div>
      <div
        className="left-0 absolute z-[-1] w-full h-full bg-black"
        style={{
          WebkitMaskImage: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, transparent, black ${circleSize}px)`,
          maskImage: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, transparent, black ${circleSize}px)`,
        }}
      ></div>
      <div className="col-span-2 font-mono text-sm rounded-lg p-5 w-full flex flex-col text-center items-center justify-center">
        <div className="w-full flex flex-col items-center justify-center overflow-hidden rounded-md">
          <h1 className="text-xl sm:text-2xl md:text-7xl font-bold text-center text-white relative z-20">
            NFTRek
          </h1>
          <div className="w-[40rem] h-[20px] relative">
            {/* Gradients */}
            <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-[2px] w-3/4 blur-sm" />
            <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-px w-3/4" />
            <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-[5px] w-1/4 blur-sm" />
            <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-px w-1/4" />
            {/* Radial Gradient to prevent sharp edges */}
            <div className="absolute inset-0 w-full h-full  [mask-image:radial-gradient(350px_200px_at_top,transparent_20%,white)]"></div>
          </div>
        </div>
      </div>
      {publicKey ? (
        <div className="flex items-center justify-center">
          <WalletMultiButton />
        </div>
      ) : (
        <section className="flex flex-col gap-y-4 justify-center items-center">
          <button className="bg-blue-500 p-2 rounded-xl" onClick={openCamera}>Open camera</button>
          {isCameraOpen && (
            <>
              {devices.length > 0 ? (
                <>
                  <select onChange={handleDeviceChange} value={selectedDeviceId} className="bg-gray-800 p-2 rounded-xl">
                    {devices.map((device, index) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${index + 1}`}
                      </option>
                    ))}
                  </select>
                  <div className="w-[25%]">
                    <Webcam ref={webRef} videoConstraints={{ deviceId: selectedDeviceId }} />
                  </div>
                </>
              ) : (
                <div className="text-center">No video devices found</div>
              )}
            </>
          )}
          <button onClick={showImage}>Click image</button>
          <button onClick={event => mintCompressedNft(event)}>Mint it</button>
          {imageClicked && <img alt="clicked image" src={imgSrc} className="w-[25%] h-[240px]" />}
        </section>
      )}
    </main>
  );
}
