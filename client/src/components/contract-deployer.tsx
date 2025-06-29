import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { contractService } from "@/lib/contracts";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ContractDeployerProps {
  networkId: number;
  onDeploymentComplete: (careTokenAddress: string, careReceiptAddress: string) => void;
}

export default function ContractDeployer({ networkId, onDeploymentComplete }: ContractDeployerProps) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const [careTokenStatus, setCareTokenStatus] = useState<"pending" | "deploying" | "deployed">("pending");
  const [careReceiptStatus, setCareReceiptStatus] = useState<"pending" | "deploying" | "deployed">("pending");
  const { toast } = useToast();

  const handleDeploy = async () => {
    setIsDeploying(true);
    setDeploymentProgress(0);

    try {
      // Deploy CareToken contract
      setCareTokenStatus("deploying");
      setDeploymentProgress(25);
      
      const careTokenAddress = await contractService.deployCareTokenContract(networkId);
      setCareTokenStatus("deployed");
      setDeploymentProgress(50);

      // Deploy CareReceipt contract
      setCareReceiptStatus("deploying");
      setDeploymentProgress(75);
      
      const careReceiptAddress = await contractService.deployCareReceiptContract(networkId);
      setCareReceiptStatus("deployed");
      setDeploymentProgress(90);

      // Save contract addresses to database
      await apiRequest("POST", "/api/contracts/deploy", {
        networkId,
        careTokenAddress,
        careReceiptAddress,
      });

      setDeploymentProgress(100);
      onDeploymentComplete(careTokenAddress, careReceiptAddress);

      toast({
        title: "Deployment Successful",
        description: "Both contracts have been deployed successfully",
      });
    } catch (error) {
      toast({
        title: "Deployment Failed",
        description: error instanceof Error ? error.message : "Failed to deploy contracts",
        variant: "destructive",
      });
      
      // Reset status on error
      setCareTokenStatus("pending");
      setCareReceiptStatus("pending");
      setDeploymentProgress(0);
    } finally {
      setIsDeploying(false);
    }
  };

  const getStatusBadge = (status: "pending" | "deploying" | "deployed") => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "deploying":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Deploying...</Badge>;
      case "deployed":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Deployed</Badge>;
    }
  };

  return (
    <div className="max-w-2xl">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Deploy Smart Contracts</h3>
      <p className="text-gray-600 mb-6">
        Deploy the CareToken and CareReceipt contracts to start sharing kindness on the blockchain.
      </p>
      
      {/* Contract Status */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <div className="font-medium text-gray-900">CareToken Contract</div>
              <div className="text-sm text-gray-500">Soul-bound NFTs for care messages</div>
            </div>
          </div>
          {getStatusBadge(careTokenStatus)}
        </div>
        
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </div>
            <div>
              <div className="font-medium text-gray-900">CareReceipt Contract</div>
              <div className="text-sm text-gray-500">Soul-bound NFTs for acknowledgments</div>
            </div>
          </div>
          {getStatusBadge(careReceiptStatus)}
        </div>
      </div>

      {/* Deploy Button */}
      <Button 
        onClick={handleDeploy} 
        disabled={isDeploying || careTokenStatus === "deployed"}
        className="w-full bg-primary hover:bg-primary/90"
        size="lg"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
        {isDeploying ? "Deploying Contracts..." : "Deploy Contracts"}
      </Button>

      {/* Deploy Progress */}
      {isDeploying && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-3 mb-3">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
            <span className="text-blue-700 font-medium">Deploying contracts...</span>
          </div>
          <Progress value={deploymentProgress} className="mb-2" />
          <div className="text-sm text-blue-600">
            {deploymentProgress < 50 ? "Deploying CareToken contract..." : 
             deploymentProgress < 90 ? "Deploying CareReceipt contract..." : 
             "Saving contract addresses..."}
          </div>
        </div>
      )}
    </div>
  );
}
