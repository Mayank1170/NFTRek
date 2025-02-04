export const uploadImageToNFTStorage = async (imageData: string) => {
    try {
      // Remove data URL prefix to get base64 data
      const base64Data = imageData.split(',')[1];
      
      // Convert base64 to Blob
      const byteCharacters = atob(base64Data);
      const byteArrays = [];
      
      for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
        const slice = byteCharacters.slice(offset, offset + 1024);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      
      const blob = new Blob(byteArrays, { type: 'image/jpeg' });
      const file = new File([blob], 'nftrek-image.jpg', { type: 'image/jpeg' });
  
      // Upload to NFT.Storage
      const formData = new FormData();
      formData.append('file', file);
  
      const response = await fetch('https://api.nft.storage/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_NFT_STORAGE_KEY}`,
        },
        body: formData
      });
  
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to upload image');
      }
  
      // Return IPFS URL
      return `https://ipfs.io/ipfs/${data.value.cid}`;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  };

  const BUNDLR_URL = 'https://node1.bundlr.network';
  const HELIUS_URL = 'https://upload.xnfts.dev/upload';
  

 export const uploadToArweave = async (base64Image: string): Promise<string> => {
  try {
    // Remove data URL prefix if present
    const base64Data = base64Image.includes('base64,') ? 
      base64Image.split('base64,')[1] : base64Image;

    // Convert base64 to binary
    const binaryData = Buffer.from(base64Data, 'base64');

    // Upload to Helius upload service
    const response = await fetch(HELIUS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'image/jpeg',
      },
      body: binaryData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.url; // This will be an Arweave URL
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error('Failed to upload image');
  }
};
