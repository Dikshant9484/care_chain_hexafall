import { ethers } from "ethers";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export class Web3Service {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;

  async connectWallet(): Promise<{ address: string; networkId: number }> {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed");
    }

    try {
      // Request account access
      await window.ethereum.request({ method: "eth_requestAccounts" });

      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();

      const address = await this.signer.getAddress();
      const network = await this.provider.getNetwork();
      const networkId = Number(network.chainId);

      return { address, networkId };
    } catch (error) {
      throw new Error("Failed to connect wallet");
    }
  }

  async getNetwork(): Promise<number> {
    if (!this.provider) {
      throw new Error("Wallet not connected");
    }

    const network = await this.provider.getNetwork();
    return Number(network.chainId);
  }

  async getAddress(): Promise<string> {
    if (!this.signer) {
      throw new Error("Wallet not connected");
    }

    return await this.signer.getAddress();
  }

  getSigner(): ethers.JsonRpcSigner {
    if (!this.signer) {
      throw new Error("Wallet not connected");
    }
    return this.signer;
  }

  getProvider(): ethers.BrowserProvider {
    if (!this.provider) {
      throw new Error("Wallet not connected");
    }
    return this.provider;
  }

  isConnected(): boolean {
    return this.provider !== null && this.signer !== null;
  }

  async switchNetwork(networkId: number): Promise<void> {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed");
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${networkId.toString(16)}` }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        throw new Error("Network not added to MetaMask");
      }
      throw new Error("Failed to switch network");
    }
  }
}

export const web3Service = new Web3Service();
