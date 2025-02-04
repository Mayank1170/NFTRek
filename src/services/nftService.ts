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
  
  export const getUserLocation = (): Promise<Location> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
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
  
  export const getCityName = async (latitude: number, longitude: number): Promise<string> => {
    const apiKey = process.env.NEXT_PUBLIC_OPENCAGE_API_KEY;
    const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${apiKey}`);
    const data = await response.json();
  
    if (data.results.length > 0) {
      return data.results[0].components.city || 
             data.results[0].components.town || 
             data.results[0].components.village || 
             'Unknown location';
    }
    throw new Error("Unable to determine location");
  };
  
  export const mintNFT = async ({ publicKey, cityName, location, imageUrl }: MintParams) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) throw new Error("API URL not configured");
  
    try {
      // Generate a unique identifier for the image
      const imageHash = await getImageHash(imageUrl);
      const permanentImageUrl = `https://nftrek-images.vercel.app/api/images/${imageHash}`;
      
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
                value: location.latitude.toFixed(4),
              },
              {
                trait_type: 'Longitude',
                value: location.longitude.toFixed(4),
              },
              {
                trait_type: 'Location',
                value: cityName,
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