import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import WalletConnection from "@/components/wallet-connection";
import ContractDeployer from "@/components/contract-deployer";
import CareSender from "@/components/care-sender";
import CareReceiver from "@/components/care-receiver";
import Dashboard from "@/pages/dashboard";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import type { ContractAddress } from "@shared/schema";
import { LayoutDashboard, Rocket, Send, Heart } from "lucide-react";

export default function Home() {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [networkId, setNetworkId] = useState<number>(0);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Fetch contract addresses for the current network
  const { data: contractAddresses, refetch: refetchContracts } = useQuery<ContractAddress>({
    queryKey: [`/api/contracts/${networkId}`],
    enabled: !!networkId,
  });

  useEffect(() => {
    // Switch to deploy tab if contracts are not deployed and not on dashboard
    if (networkId && !contractAddresses && activeTab !== "dashboard") {
      setActiveTab("deploy");
    }
  }, [networkId, contractAddresses, activeTab]);

  const handleConnectionChange = async (connected: boolean, address?: string, netId?: number) => {
    setIsWalletConnected(connected);
    if (connected && address && netId) {
      setWalletAddress(address);
      setNetworkId(netId);
      
      // Create or get user
      try {
        await apiRequest("POST", "/api/users", {
          walletAddress: address,
        });
      } catch (error) {
        // User might already exist, that's okay
        console.log("User creation/fetch:", error);
      }
    } else {
      setWalletAddress("");
      setNetworkId(0);
    }
  };

  const handleDeploymentComplete = (careTokenAddress: string, careReceiptAddress: string) => {
    refetchContracts();
    setActiveTab("send");
  };

  const areContractsDeployed = contractAddresses?.careTokenAddress && contractAddresses?.careReceiptAddress;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Header */}
      <motion.header 
        className="relative z-10 glassmorphism border-b border-white/10"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center premium-glow">
                <span className="text-white font-bold text-sm">CC</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Care Coin
              </h1>
            </motion.div>
            
            <WalletConnection onConnectionChange={handleConnectionChange} />
          </div>
        </div>
      </motion.header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Tabs */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Card className="glassmorphism border-white/10 shadow-2xl">
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4 bg-gray-800/50 border-b border-white/10">
                  <TabsTrigger 
                    value="dashboard" 
                    className="flex items-center space-x-2 data-[state=active]:bg-purple-600/50"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="deploy" 
                    className="flex items-center space-x-2 data-[state=active]:bg-purple-600/50"
                  >
                    <Rocket className="w-4 h-4" />
                    <span>Deploy</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="send" 
                    disabled={!areContractsDeployed || !isWalletConnected}
                    className="flex items-center space-x-2 data-[state=active]:bg-purple-600/50"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Care</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="receive" 
                    disabled={!areContractsDeployed || !isWalletConnected}
                    className="flex items-center space-x-2 data-[state=active]:bg-purple-600/50"
                  >
                    <Heart className="w-4 h-4" />
                    <span>Receive Care</span>
                  </TabsTrigger>
                </TabsList>

                <div className="p-6">
                  <TabsContent value="dashboard" className="m-0">
                    {isWalletConnected && networkId ? (
                      <Dashboard 
                        walletAddress={walletAddress}
                        networkId={networkId}
                      />
                    ) : (
                      <motion.div 
                        className="text-center py-16"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <div className="w-24 h-24 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mx-auto mb-6 flex items-center justify-center premium-glow">
                          <LayoutDashboard className="w-12 h-12 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h3>
                        <p className="text-gray-300 max-w-md mx-auto">
                          Connect your MetaMask wallet to access your personalized kindness dashboard and start your journey.
                        </p>
                      </motion.div>
                    )}
                  </TabsContent>

                  <TabsContent value="deploy" className="m-0">
                    {isWalletConnected && networkId ? (
                      <ContractDeployer 
                        networkId={networkId}
                        onDeploymentComplete={handleDeploymentComplete}
                      />
                    ) : (
                      <motion.div 
                        className="text-center py-16"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center premium-glow">
                          <Rocket className="w-12 h-12 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4">Ready to Deploy</h3>
                        <p className="text-gray-300 max-w-md mx-auto">
                          Connect your wallet to deploy smart contracts and start the KindnessCoin ecosystem.
                        </p>
                      </motion.div>
                    )}
                  </TabsContent>

                  <TabsContent value="send" className="m-0">
                    {isWalletConnected && areContractsDeployed ? (
                      <CareSender
                        walletAddress={walletAddress}
                        networkId={networkId}
                        careTokenAddress={contractAddresses.careTokenAddress!}
                      />
                    ) : (
                      <motion.div 
                        className="text-center py-16"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <div className="w-24 h-24 bg-gradient-to-r from-green-600 to-blue-600 rounded-full mx-auto mb-6 flex items-center justify-center premium-glow">
                          <Send className="w-12 h-12 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4">Share Your Kindness</h3>
                        <p className="text-gray-300 max-w-md mx-auto">
                          {!isWalletConnected 
                            ? "Connect your wallet to start sending care messages and spreading kindness."
                            : "Deploy contracts first to begin your kindness journey."
                          }
                        </p>
                      </motion.div>
                    )}
                  </TabsContent>

                  <TabsContent value="receive" className="m-0">
                    {isWalletConnected && areContractsDeployed ? (
                      <CareReceiver
                        walletAddress={walletAddress}
                        networkId={networkId}
                        careReceiptAddress={contractAddresses.careReceiptAddress!}
                      />
                    ) : (
                      <motion.div 
                        className="text-center py-16"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <div className="w-24 h-24 bg-gradient-to-r from-pink-600 to-red-600 rounded-full mx-auto mb-6 flex items-center justify-center premium-glow">
                          <Heart className="w-12 h-12 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4">Acknowledge Kindness</h3>
                        <p className="text-gray-300 max-w-md mx-auto">
                          {!isWalletConnected 
                            ? "Connect your wallet to acknowledge and thank those who showed you care."
                            : "Deploy contracts first to start creating receipt NFTs."
                          }
                        </p>
                      </motion.div>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
