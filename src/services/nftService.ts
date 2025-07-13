interface Location {
  latitude: number;
  longitude: number;
}

interface MintParams {
  publicKey: string;
  cityName: string;
  location: Location;
  imageUrl: string;
}

const getImageHash = async (imageData: string): Promise<string> => {
  const base64Data = imageData.split(',')[1];
  const byteArray = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
  const hashBuffer = await crypto.subtle.digest('SHA-256', byteArray);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// Upload image to NFT.Storage (free for NFTs) with fallbacks
const uploadImageToIPFS = async (imageData: string): Promise<string> => {
  try {
    // For better reliability, let's use direct base64 embedding first for small images
    const base64Data = imageData.split(',')[1];
    const sizeInMB = (base64Data.length * 0.75) / (1024 * 1024);
    
    if (sizeInMB < 0.3) { // If less than 0.3MB, embed directly
      return imageData;
    }

    // Try NFT.Storage first (free for NFTs)
    const nftStorageKey = process.env.NEXT_PUBLIC_NFT_STORAGE_KEY;
    if (nftStorageKey && nftStorageKey !== 'your_nft_storage_key_here') {
      try {
        // Convert base64 to blob
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });
        
        const formData = new FormData();
        formData.append('file', blob, `nftrek-${Date.now()}.jpg`);

        const response = await fetch('https://api.nft.storage/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${nftStorageKey}`,
          },
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          return `https://nftstorage.link/ipfs/${data.value.cid}`;
        }
      } catch (error) {
        console.warn('NFT.Storage upload failed:', error);
      }
    }

    // Fallback: Try Pinata if available
    const pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT;
    if (pinataJWT && pinataJWT !== 'your_pinata_jwt_here') {
      try {
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });
        
        const formData = new FormData();
        formData.append('file', blob, `nftrek-${Date.now()}.jpg`);

        const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${pinataJWT}`,
          },
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
        }
      } catch (error) {
        console.warn('Pinata upload failed:', error);
      }
    }

    // Final fallback: use base64 directly
    console.warn('All IPFS uploads failed, using base64 data URL');
    return imageData;

  } catch (error) {
    console.error('Image upload error:', error);
    return imageData; // Always fallback to base64
  }
};

export const getUserLocation = (): Promise<Location> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"));
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          let errorMessage = "Unable to retrieve your location";
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied by user";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out";
              break;
          }
          
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    }
  });
};

export const getCityName = async (latitude: number, longitude: number): Promise<string> => {
  try {
    // Try multiple geocoding services for better reliability
    
    // First try: OpenCage (if API key is available)
    const openCageKey = process.env.NEXT_PUBLIC_OPENCAGE_API_KEY;
    if (openCageKey) {
      try {
        const response = await fetch(
          `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${openCageKey}&language=en&pretty=1`
        );
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          const components = data.results[0].components;
          return components.city || 
                 components.town || 
                 components.village || 
                 components.county ||
                 components.state ||
                 'Unknown Location';
        }
      } catch (error) {
        console.warn('OpenCage geocoding failed:', error);
      }
    }

    // Fallback: Use Nominatim (free, no API key required)
    const nominatimResponse = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'NFTrek-App/1.0'
        }
      }
    );

    if (nominatimResponse.ok) {
      const data = await nominatimResponse.json();
      if (data.address) {
        return data.address.city || 
               data.address.town || 
               data.address.village || 
               data.address.county ||
               data.address.state ||
               data.display_name?.split(',')[0] ||
               'Unknown Location';
      }
    }

    // Ultimate fallback: return coordinates
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    
  } catch (error) {
    console.error("Geocoding error:", error);
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
};

export const mintNFT = async ({ publicKey, cityName, location, imageUrl }: MintParams) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) throw new Error("API URL not configured");

  try {
    // Upload image to IPFS for better reliability
    const permanentImageUrl = await uploadImageToIPFS(imageUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'nftrek-mint',
        method: 'mintCompressedNft',
        params: {
          name: `NFTrek: ${cityName}`,
          symbol: 'NFTREK',
          owner: publicKey,
          description: `This NFT represents your trek in ${cityName}. Location: Lat ${location.latitude.toFixed(4)}, Long ${location.longitude.toFixed(4)}`,
          attributes: [
            {
              trait_type: 'Latitude',
              value: location.latitude.toFixed(6),
            },
            {
              trait_type: 'Longitude',
              value: location.longitude.toFixed(6),
            },
            {
              trait_type: 'Location',
              value: cityName,
            },
            {
              trait_type: 'Collection',
              value: 'NFTrek Adventures',
            },
            {
              trait_type: 'Created',
              value: new Date().toISOString().split('T')[0],
            },
            {
              trait_type: 'Minted At',
              value: new Date().toISOString(),
            },
            {
              trait_type: 'Time',
              value: new Date().toLocaleTimeString(),
            }
          ],
          imageUrl: permanentImageUrl,
          externalUrl: 'https://nftrek.vercel.app/',
          sellerFeeBasisPoints: 500,
          creators: [{
            address: publicKey,
            share: 100
          }]
        }
      })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || "Failed to mint NFT");
    }

    return data.result;
  } catch (error) {
    console.error("Minting error:", error);
    throw error;
  }
};

export const verifyNFT = async (assetId: string) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) throw new Error("API URL not configured");

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'nftrek-verify',
        method: 'getAsset',
        params: {
          id: assetId,
          displayOptions: {
            showFungible: true
          }
        }
      })
    });

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error("Verification error:", error);
    throw error;
  }
};