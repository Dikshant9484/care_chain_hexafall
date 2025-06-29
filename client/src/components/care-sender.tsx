import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { contractService } from "@/lib/contracts";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import type { CareToken } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

const careMessageSchema = z.object({
  message: z.string().min(1, "Message is required").max(140, "Message must be 140 characters or less"),
});

interface CareSenderProps {
  walletAddress: string;
  networkId: number;
  careTokenAddress: string;
}

export default function CareSender({ walletAddress, networkId, careTokenAddress }: CareSenderProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof careMessageSchema>>({
    resolver: zodResolver(careMessageSchema),
    defaultValues: {
      message: "",
    },
  });

  // Fetch user's care tokens
  const { data: careTokens = [], refetch } = useQuery<CareToken[]>({
    queryKey: [`/api/care-tokens/${walletAddress}`],
    enabled: !!walletAddress,
  });

  const onSubmit = async (values: z.infer<typeof careMessageSchema>) => {
    setIsSubmitting(true);
    
    try {
      // Submit to smart contract
      const { txHash, tokenId } = await contractService.submitCareMessage(
        careTokenAddress,
        values.message
      );

      // Save to database
      await apiRequest("POST", "/api/care-tokens", {
        tokenId,
        senderAddress: walletAddress,
        message: values.message,
        transactionHash: txHash,
        networkId,
      });

      // Reset form and refetch data
      form.reset();
      refetch();

      toast({
        title: "Care Message Sent",
        description: "Your care message has been minted as an NFT",
      });
    } catch (error) {
      toast({
        title: "Failed to Send Care",
        description: error instanceof Error ? error.message : "Failed to submit care message",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTransactionHash = (hash: string): string => {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  return (
    <div className="max-w-2xl">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Send Care Message</h3>
      <p className="text-gray-600 mb-6">
        Share a heartfelt message and mint a soul-bound NFT as proof of your kindness.
      </p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Care Message</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Write a heartfelt message to share your care and kindness..."
                    className="resize-none"
                    rows={4}
                  />
                </FormControl>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Soul-bound NFT will be minted to your wallet</span>
                  <span className="text-xs text-gray-400">{field.value.length}/140</span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="bg-primary/5 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div>
                <h4 className="font-medium text-primary-foreground mb-1">About Care Tokens</h4>
                <p className="text-sm text-primary-foreground/80">
                  Your message will be permanently stored on the blockchain. The NFT you receive is soul-bound and cannot be transferred, representing your authentic act of kindness.
                </p>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary/90"
            size="lg"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
            </svg>
            {isSubmitting ? "Sending Care..." : "Send Care & Mint NFT"}
          </Button>
        </form>
      </Form>

      {/* Recent Care Messages */}
      {careTokens.length > 0 && (
        <div className="mt-8">
          <h4 className="font-medium text-gray-900 mb-4">Your Recent Care Messages</h4>
          <div className="space-y-3">
            {careTokens.map((token) => (
              <div key={token.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-gray-900 mb-2">"{token.message}"</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Token #{token.tokenId}</span>
                      <span>{formatDistanceToNow(new Date(token.createdAt), { addSuffix: true })}</span>
                      <span className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Confirmed</span>
                      </span>
                    </div>
                  </div>
                  <button 
                    className="text-gray-400 hover:text-gray-600"
                    title={`View transaction: ${token.transactionHash}`}
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
