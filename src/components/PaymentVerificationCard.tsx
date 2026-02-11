import { useState } from "react";
import { CheckCircle, XCircle, Loader2, Image, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Payment, PAYMENT_METHODS, useVerifyPayment, useCollectCash } from "@/hooks/usePayments";

interface PaymentVerificationCardProps {
  payment: Payment;
}

const PaymentVerificationCard = ({ payment }: PaymentVerificationCardProps) => {
  const [rejectionReason, setRejectionReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const verifyPayment = useVerifyPayment();
  const collectCash = useCollectCash();

  const method = PAYMENT_METHODS.find(m => m.value === payment.payment_method);
  const isPending = payment.payment_status === 'pending_verification' || payment.payment_status === 'cash_pending';

  const getStatusBadge = () => {
    switch (payment.payment_status) {
      case 'paid':
      case 'cash_collected':
        return <Badge variant="default">✓ Verified</Badge>;
      case 'pending_verification':
        return <Badge variant="secondary">Awaiting Verification</Badge>;
      case 'cash_pending':
        return <Badge variant="secondary">Cash Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'refunded':
        return <Badge variant="outline">Refunded</Badge>;
      default:
        return <Badge variant="secondary">{payment.payment_status}</Badge>;
    }
  };

  return (
    <Card className={isPending ? "border-primary/30 bg-primary/5" : ""}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{method?.icon}</span>
            <span className="font-medium text-sm">{method?.label}</span>
          </div>
          {getStatusBadge()}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Amount</span>
          <span className="font-bold text-primary">₨{payment.amount}</span>
        </div>

        {payment.transaction_reference && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Ref</span>
            <span className="text-sm font-mono">{payment.transaction_reference}</span>
          </div>
        )}

        {payment.screenshot_url && (
          <a
            href={payment.screenshot_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <Image className="h-4 w-4" />
            View Payment Proof
          </a>
        )}

        {payment.rejection_reason && (
          <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">
            Rejected: {payment.rejection_reason}
          </p>
        )}

        {/* Driver actions for pending digital payments */}
        {payment.payment_status === 'pending_verification' && (
          <div className="space-y-2 pt-2 border-t">
            {!showReject ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => verifyPayment.mutate({ paymentId: payment.id, action: 'approve' })}
                  disabled={verifyPayment.isPending}
                >
                  {verifyPayment.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  onClick={() => setShowReject(true)}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  placeholder="Reason for rejection"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  maxLength={200}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => verifyPayment.mutate({
                      paymentId: payment.id,
                      action: 'reject',
                      rejectionReason,
                    })}
                    disabled={verifyPayment.isPending || !rejectionReason}
                  >
                    Confirm Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowReject(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Driver action for cash payments */}
        {payment.payment_status === 'cash_pending' && (
          <div className="pt-2 border-t">
            <Button
              size="sm"
              className="w-full"
              onClick={() => collectCash.mutate(payment.id)}
              disabled={collectCash.isPending}
            >
              {collectCash.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-1" />
                  Mark Cash Collected
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentVerificationCard;
