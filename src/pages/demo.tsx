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
