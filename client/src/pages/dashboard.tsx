import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { CareToken, CareReceipt, ContractAddress } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { Heart, Send, Coins, Trophy, TrendingUp, Users, MessageSquare, Award } from "lucide-react";

interface DashboardProps {
  walletAddress: string;
  networkId: number;
}

export default function Dashboard({ walletAddress, networkId }: DashboardProps) {
  const [stats, setStats] = useState({
    totalSent: 0,
    totalReceived: 0,
    kindnessScore: 0,
    recentActivity: 0
  });

  // Fetch user's care tokens
  const { data: careTokens = [] } = useQuery<CareToken[]>({
    queryKey: [`/api/care-tokens/${walletAddress}`],
    enabled: !!walletAddress,
  });

  // Fetch user's care receipts
  const { data: careReceipts = [] } = useQuery<CareReceipt[]>({
    queryKey: [`/api/care-receipts/${walletAddress}`],
    enabled: !!walletAddress,
  });

  // Fetch contract addresses
  const { data: contractAddresses } = useQuery<ContractAddress>({
    queryKey: [`/api/contracts/${networkId}`],
    enabled: !!networkId,
  });

  useEffect(() => {
    const totalSent = careTokens.length;
    const totalReceived = careReceipts.length;
    const kindnessScore = Math.min(100, (totalSent * 10) + (totalReceived * 15));
    
    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentActivity = [...careTokens, ...careReceipts].filter(
      item => new Date(item.createdAt) > sevenDaysAgo
    ).length;

    setStats({ totalSent, totalReceived, kindnessScore, recentActivity });
  }, [careTokens, careReceipts]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };

  const getKindnessLevel = (score: number) => {
    if (score >= 80) return { level: "Kindness Champion", color: "from-purple-600 to-pink-600", badge: "🏆" };
    if (score >= 60) return { level: "Heart Warrior", color: "from-blue-600 to-purple-600", badge: "⭐" };
    if (score >= 40) return { level: "Care Giver", color: "from-green-600 to-blue-600", badge: "💝" };
    if (score >= 20) return { level: "Kind Soul", color: "from-yellow-600 to-green-600", badge: "🌱" };
    return { level: "New Friend", color: "from-gray-600 to-yellow-600", badge: "👋" };
  };

  const kindnessLevel = getKindnessLevel(stats.kindnessScore);
  const areContractsDeployed = contractAddresses?.careTokenAddress && contractAddresses?.careReceiptAddress;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <motion.div
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section */}
        <motion.div
          variants={itemVariants}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Kindness Dashboard
              </h1>
              <p className="text-xl text-gray-300 mt-2">Your journey of spreading care</p>
            </div>
            <motion.div
              className={`px-6 py-3 rounded-2xl bg-gradient-to-r ${kindnessLevel.color} text-white font-semibold text-lg shadow-2xl`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {kindnessLevel.badge} {kindnessLevel.level}
            </motion.div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {/* Total Sent */}
          <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
            <Card className="bg-gradient-to-br from-purple-800/50 to-purple-900/50 border-purple-700/50 backdrop-blur-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-200 text-sm font-medium">Care Messages Sent</p>
                    <p className="text-3xl font-bold text-white">{stats.totalSent}</p>
                  </div>
                  <motion.div
                    className="p-3 bg-purple-600/30 rounded-full"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Send className="w-6 h-6 text-purple-300" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Received */}
          <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
            <Card className="bg-gradient-to-br from-pink-800/50 to-pink-900/50 border-pink-700/50 backdrop-blur-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-pink-200 text-sm font-medium">Care Receipts</p>
                    <p className="text-3xl font-bold text-white">{stats.totalReceived}</p>
                  </div>
                  <motion.div
                    className="p-3 bg-pink-600/30 rounded-full"
                    whileHover={{ scale: 1.2 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <Heart className="w-6 h-6 text-pink-300" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Kindness Score */}
          <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
            <Card className="bg-gradient-to-br from-blue-800/50 to-blue-900/50 border-blue-700/50 backdrop-blur-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-200 text-sm font-medium">Kindness Score</p>
                    <p className="text-3xl font-bold text-white">{stats.kindnessScore}</p>
                    <Progress value={stats.kindnessScore} className="mt-2 h-2" />
                  </div>
                  <motion.div
                    className="p-3 bg-blue-600/30 rounded-full"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Trophy className="w-6 h-6 text-blue-300" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
            <Card className="bg-gradient-to-br from-green-800/50 to-green-900/50 border-green-700/50 backdrop-blur-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-200 text-sm font-medium">Recent Activity</p>
                    <p className="text-3xl font-bold text-white">{stats.recentActivity}</p>
                    <p className="text-xs text-green-300">Last 7 days</p>
                  </div>
                  <motion.div
                    className="p-3 bg-green-600/30 rounded-full"
                    whileHover={{ scale: 1.1 }}
                    animate={{ y: [0, -2, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <TrendingUp className="w-6 h-6 text-green-300" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Recent Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Care Messages */}
          <motion.div variants={itemVariants}>
            <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                  <span>Recent Care Messages</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <AnimatePresence>
                  {careTokens.slice(0, 5).map((token, index) => (
                    <motion.div
                      key={token.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/30 hover:bg-gray-700/50 transition-colors"
                    >
                      <p className="text-gray-200 mb-2">"{token.message}"</p>
                      <div className="flex items-center justify-between text-sm">
                        <Badge variant="secondary" className="bg-purple-600/20 text-purple-300">
                          Token #{token.tokenId}
                        </Badge>
                        <span className="text-gray-400">
                          {formatDistanceToNow(new Date(token.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {careTokens.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <Send className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No care messages sent yet</p>
                    <p className="text-sm">Start spreading kindness!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Care Receipts */}
          <motion.div variants={itemVariants}>
            <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Award className="w-5 h-5 text-pink-400" />
                  <span>Recent Care Receipts</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <AnimatePresence>
                  {careReceipts.slice(0, 5).map((receipt, index) => (
                    <motion.div
                      key={receipt.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/30 hover:bg-gray-700/50 transition-colors"
                    >
                      <p className="text-gray-200 mb-2">"{receipt.acknowledgmentMessage}"</p>
                      <div className="flex items-center justify-between text-sm">
                        <Badge variant="secondary" className="bg-pink-600/20 text-pink-300">
                          Receipt #{receipt.tokenId}
                        </Badge>
                        <span className="text-gray-400">
                          {formatDistanceToNow(new Date(receipt.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        From: {receipt.originalSenderAddress.slice(0, 6)}...{receipt.originalSenderAddress.slice(-4)}
                      </p>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {careReceipts.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No care receipts yet</p>
                    <p className="text-sm">Acknowledge received kindness!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Contract Status */}
        {!areContractsDeployed && (
          <motion.div
            variants={itemVariants}
            className="mt-8"
          >
            <Card className="bg-yellow-800/50 border-yellow-700/50 backdrop-blur-lg">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-yellow-600/30 rounded-full">
                    <Coins className="w-6 h-6 text-yellow-300" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Deploy Contracts</h3>
                    <p className="text-yellow-200">Deploy smart contracts to start your kindness journey</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}