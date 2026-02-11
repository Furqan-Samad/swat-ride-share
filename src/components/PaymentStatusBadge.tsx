import { Badge } from "@/components/ui/badge";
import { usePaymentForBooking } from "@/hooks/usePayments";

interface PaymentStatusBadgeProps {
  bookingId: string;
}

const PaymentStatusBadge = ({ bookingId }: PaymentStatusBadgeProps) => {
  const { data: payment } = usePaymentForBooking(bookingId);

  if (!payment) {
    return <Badge variant="outline" className="text-xs">No Payment</Badge>;
  }

  switch (payment.payment_status) {
    case 'paid':
    case 'cash_collected':
      return <Badge variant="default" className="text-xs">💰 Paid</Badge>;
    case 'pending_verification':
      return <Badge variant="secondary" className="text-xs">⏳ Verifying</Badge>;
    case 'cash_pending':
      return <Badge variant="secondary" className="text-xs">💵 Cash</Badge>;
    case 'failed':
      return <Badge variant="destructive" className="text-xs">❌ Failed</Badge>;
    case 'refunded':
      return <Badge variant="outline" className="text-xs">↩ Refunded</Badge>;
    default:
      return null;
  }
};

export default PaymentStatusBadge;
