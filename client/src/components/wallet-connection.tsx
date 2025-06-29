import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { web3Service } from "@/lib/web3";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Zap } from "lucide-react";

interface WalletConnectionProps {
  onConnectionChange: (connected: boolean, address?: string, networkId?: number) => void;
}

export default function WalletConnection({ onConnectionChange }: WalletConnectionProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string>("");
  const [networkId, setNetworkId] = useState<number>(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if wallet is already connected
    checkConnection();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const checkConnection = async () => {
    try {
      if (web3Service.isConnected()) {
        const userAddress = await web3Service.getAddress();
        const userNetworkId = await web3Service.getNetwork();
        setIsConnected(true);
        setAddress(userAddress);
        setNetworkId(userNetworkId);
        onConnectionChange(true, userAddress, userNetworkId);
      }
    } catch (error) {
      // Wallet not connected
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      handleDisconnect();
    } else {
      checkConnection();
    }
  };

  const handleChainChanged = () => {
    checkConnection();
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const { address: userAddress, networkId: userNetworkId } = await web3Service.connectWallet();
      setIsConnected(true);
      setAddress(userAddress);
      setNetworkId(userNetworkId);
      onConnectionChange(true, userAddress, userNetworkId);
      
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to MetaMask",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setAddress("");
    setNetworkId(0);
    onConnectionChange(false);
  };

  const getNetworkName = (chainId: number): string => {
    const networks: Record<number, string> = {
      1: "Ethereum",
      3: "Ropsten",
      4: "Rinkeby",
      5: "Goerli",
      11155111: "Sepolia",
      137: "Polygon",
      80001: "Mumbai",
    };
    return networks[chainId] || `Network ${chainId}`;
  };

  const formatAddress = (addr: string): string => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="flex items-center space-x-4">
      {isConnected && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30">
            {getNetworkName(networkId)}
          </Badge>
        </motion.div>
      )}
      
      {isConnected ? (
        <motion.div 
          className="flex items-center space-x-3 glassmorphism px-4 py-2 rounded-lg"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          whileHover={{ scale: 1.02 }}
        >
          <motion.div 
            className="w-2 h-2 bg-green-400 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-sm font-medium text-white">
            {formatAddress(address)}
          </span>
        </motion.div>
      ) : (
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            onClick={handleConnect} 
            disabled={isConnecting}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-none shadow-lg premium-glow"
          >
            {isConnecting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="mr-2"
              >
                <Zap className="w-4 h-4" />
              </motion.div>
            ) : (
              <Wallet className="w-4 h-4 mr-2" />
            )}
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
