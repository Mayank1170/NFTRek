# NFTRek 📸🌍

A fun location-based NFT minting app where you can capture photos and mint them as NFTs with your geographical coordinates embedded!

## What is NFTRek?

NFTRek lets you turn your travel memories into unique NFTs. Take a photo anywhere in the world, and we'll automatically capture your location to create a one-of-a-kind geographical NFT on Solana.

## Features

- 📸 **Camera Integration** - Capture photos directly in the app
- 🌍 **Automatic Geolocation** - Your location gets embedded in the NFT metadata  
- ⚡ **Compressed NFTs** - Cheaper minting on Solana blockchain
- 📱 **Mobile Friendly** - Works great on phones and tablets
- 🎨 **Fun UI** - Simpsons-inspired design that's actually enjoyable to use
- 🔗 **Multi-Wallet Support** - Connect with Phantom, Solflare, and more

## Quick Start

1. **Clone the repo**
   ```bash
   git clone https://github.com/yourusername/nftrek.git
   cd nftrek
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Add your Helius API key to .env.local
   ```

4. **Run the app**
   ```bash
   npm run dev
   ```

5. **Open http://localhost:3000** and start minting!

## Required Environment Variables

You'll need at least one API key:

- `NEXT_PUBLIC_API_URL` - Your Helius RPC endpoint (required for minting)

Optional but recommended:
- `NEXT_PUBLIC_NFT_STORAGE_KEY` - For reliable image hosting
- `NEXT_PUBLIC_OPENCAGE_API_KEY` - For better location names

## How It Works

1. Connect your Solana wallet
2. Allow location access when prompted
3. Take a photo using the in-app camera
4. Hit "Mint NFT" and we'll handle the rest!

Your NFT will include:
- Your captured image
- Exact coordinates (latitude/longitude)  
- City/location name
- Timestamp of when it was minted

## Tech Stack

- **Next.js** - React framework
- **Web3js** - For NFT minting
- **Compressed NFTs** - Cost-efficient NFT storage
- **TypeScript** - For better code quality
- **Tailwind CSS** - Styling

## Contributing

Found a bug or want to add a feature? Pull requests are welcome!

## License

MIT License - feel free to fork and make your own version!

---

*"Capture moments, mint memories!" 🍩*