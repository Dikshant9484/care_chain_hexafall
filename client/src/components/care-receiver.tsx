import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { contractService } from "@/lib/contracts";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import type { CareReceipt } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

const acknowledgmentSchema = z.object({
  senderAddress: z.string().min(1, "Sender address is required").regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
  acknowledgmentMessage: z.string().min(1, "Acknowledgment message is required").max(140, "Message must be 140 characters or less"),
});

interface CareReceiverProps {
  walletAddress: string;
  networkId: number;
  careReceiptAddress: string;
}

export default function CareReceiver({ walletAddress, networkId, careReceiptAddress }: CareReceiverProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof acknowledgmentSchema>>({
    resolver: zodResolver(acknowledgmentSchema),
    defaultValues: {
      senderAddress: "",
      acknowledgmentMessage: "",
    },
  });

  // Fetch user's care receipts
  const { data: careReceipts = [], refetch } = useQuery<CareReceipt[]>({
    queryKey: [`/api/care-receipts/${walletAddress}`],
    enabled: !!walletAddress,
  });

  const onSubmit = async (values: z.infer<typeof acknowledgmentSchema>) => {
    setIsSubmitting(true);
    
    try {
      // Submit to smart contract
      const { txHash, tokenId } = await contractService.acknowledgeCare(
        careReceiptAddress,
        values.senderAddress,
        values.acknowledgmentMessage
      );

      // Save to database
      await apiRequest("POST", "/api/care-receipts", {
        tokenId,
        receiverAddress: walletAddress,
        originalSenderAddress: values.senderAddress,
        acknowledgmentMessage: values.acknowledgmentMessage,
        transactionHash: txHash,
        networkId,
      });

      // Reset form and refetch data
      form.reset();
      refetch();

      toast({
        title: "Care Acknowledged",
        description: "Your acknowledgment has been minted as a receipt NFT",
      });
    } catch (error) {
      toast({
        title: "Failed to Acknowledge Care",
        description: error instanceof Error ? error.message : "Failed to create receipt",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="max-w-2xl">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Acknowledge Received Care</h3>
      <p className="text-gray-600 mb-6">
        Create a receipt NFT to acknowledge and thank someone who showed you care.
      </p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="senderAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sender's Wallet Address</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="0x742d35Cc6652C82c5ee12e41c1f6E42b6454f3a2"
                  />
                </FormControl>
                <p className="text-xs text-gray-500">
                  Enter the wallet address of the person who sent you care
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="acknowledgmentMessage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Acknowledgment</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Thank you for your kindness! Your message brightened my day..."
                    className="resize-none"
                    rows={4}
                  />
                </FormControl>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Receipt NFT will be minted to your wallet</span>
                  <span className="text-xs text-gray-400">{field.value.length}/140</span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              <div>
                <h4 className="font-medium text-green-900 mb-1">About Care Receipts</h4>
                <p className="text-sm text-green-700">
                  Your acknowledgment creates a permanent record of gratitude on the blockchain, connecting you with the original sender.
                </p>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            {isSubmitting ? "Creating Receipt..." : "Create Receipt NFT"}
          </Button>
        </form>
      </Form>

      {/* Received Care History */}
      {careReceipts.length > 0 && (
        <div className="mt-8">
          <h4 className="font-medium text-gray-900 mb-4">Your Care Receipts</h4>
          <div className="space-y-3">
            {careReceipts.map((receipt) => (
              <div key={receipt.id} className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-green-700">From:</span>
                      <span className="text-sm text-green-600 font-mono">
                        {formatAddress(receipt.originalSenderAddress)}
                      </span>
                    </div>
                    <p className="text-gray-900 mb-2">"{receipt.acknowledgmentMessage}"</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Receipt #{receipt.tokenId}</span>
                      <span>{formatDistanceToNow(new Date(receipt.createdAt), { addSuffix: true })}</span>
                      <span className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Confirmed</span>
                      </span>
                    </div>
                  </div>
                  <button 
                    className="text-gray-400 hover:text-gray-600"
                    title={`View transaction: ${receipt.transactionHash}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
