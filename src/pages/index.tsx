import React, { useRef, useEffect, useState } from "react";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import Webcam from "react-webcam";
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import * as walletAdapterWallets from '@solana/wallet-adapter-wallets';
import * as web3 from '@solana/web3.js';
import { Result } from "postcss";
require('@solana/wallet-adapter-react-ui/styles.css');

const nftImageUrl = "https://nathan-galindo.vercel.app/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fimage-2.614ae0c9.jpg&w=640&q=75";
const nftExternalUrl = "https://nathan-galindo.vercel.app/";

export default function Home() {
  const apiUrl = "https://devnet.helius-rpc.com/?api-key=3a8a143d-88a8-4293-a040-e8be7aa7248c";
  const [imgSrc, setImgSrc] = useState<string>("");
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [imageClicked, setImageClicked] = useState<boolean>(false);
  const webRef = useRef<any>(null);

  const mintCompressedNft = async (event: { preventDefault: () => void }) => {
    event.preventDefault();

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'helius-fe-course',
        method: 'mintCompressedNft',
        params: {
          name: "Nathan's Second cNFT",
          symbol: 'NNFT',
          owner: publicKey,
          description:
            "Nathan's Super cool NFT",
          attributes: [
            {
              trait_type: 'Cool Factor',
              value: 'Super',
            },
          ],
          imageUrl: imgSrc,
          externalUrl: nftExternalUrl,
          sellerFeeBasisPoints: 6900,
        },
      })
    });

    const { result } = await response.json();
    console.log("RESULT", result);

    if (!result) {
      alert("Request failed")
      throw "Request failed"
    }

    setImgSrc(result.assetId);

    fetchNFT(result.assetId, event);
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

  // useEffect(() => {
  //   setApiUrl(
  //     connection.rpcEndpoint.includes("devnet")
  //       ? "https://devnet.helius-rpc.com/?api-key=fce0f723-9946-41ba-be98-6c30fe494e19"
  //       : "https://mainnet.helius-rpc.com/?api-key=fce0f723-9946-41ba-be98-6c30fe494e19"
  //   );
  // }, [connection]);

  return (
    <main className="bg-black text-white min-h-screen p-4">
      <section className="flex flex-col gap-y-4 justify-center items-center">
        <div className="col-span-2 font-mono text-sm rounded-lg p-5 bg-zinc-800 w-full flex flex-col text-center items-center justify-center">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Welcome to Nft-checkin</h1>
        </div>
        <button onClick={openCamera}>Click to open camera</button>
        <div className="w-[25%]">
          {isCameraOpen && <Webcam ref={webRef} />}
        </div>
        <button onClick={showImage}>Click image</button>
        <button onClick={event => mintCompressedNft(event)}>Mint it</button>
        {imageClicked && <img alt="clicked image" src={imgSrc} className="w-[25%] h-[240px]" />}
      </section>
    </main>
  );
}
