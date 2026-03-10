import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DollarSign, TrendingUp, Car, CheckCircle, Clock, Loader2, Banknote } from "lucide-react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useDriverPayments } from "@/hooks/usePayments";
import { useMyRides } from "@/hooks/useRides";
import { format } from "date-fns";

const DriverEarnings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: payments, isLoading: paymentsLoading } = useDriverPayments();
  const { data: rides, isLoading: ridesLoading } = useMyRides();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const isLoading = authLoading || paymentsLoading || ridesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const verifiedPayments = payments?.filter(p => p.payment_status === 'paid' || p.payment_status === 'cash_collected') || [];
  const pendingPayments = payments?.filter(p => p.payment_status === 'pending_verification' || p.payment_status === 'cash_pending') || [];
  
  const totalEarnings = verifiedPayments.reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalRides = rides?.length || 0;
  const completedPayments = verifiedPayments.length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Verified</Badge>;
      case 'cash_collected': return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Cash Collected</Badge>;
      case 'pending_verification': return <Badge variant="secondary">Pending</Badge>;
      case 'cash_pending': return <Badge variant="outline">Cash Pending</Badge>;
      case 'failed': return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getMethodIcon = (method: string) => {
    const icons: Record<string, string> = {
      easypaisa: '📱', jazzcash: '📲', sadapay: '💳', nayapay: '💰',
      raast: '⚡', bank_transfer: '🏦', cash: '💵',
    };
    return icons[method] || '💳';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8 px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Driver Earnings</h1>
          <p className="text-muted-foreground mt-1">Track your income and payment history</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <p className="text-2xl font-bold text-green-600">₨{totalEarnings.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Earned</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 mx-auto text-amber-500 mb-2" />
              <p className="text-2xl font-bold text-amber-500">₨{pendingAmount.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Car className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">{totalRides}</p>
              <p className="text-xs text-muted-foreground">Total Rides</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">{completedPayments}</p>
              <p className="text-xs text-muted-foreground">Payments Received</p>
            </CardContent>
          </Card>
        </div>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!payments || payments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Banknote className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No payments received yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getMethodIcon(payment.payment_method)}</span>
                      <div>
                        <p className="font-medium capitalize">{payment.payment_method.replace('_', ' ')}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(payment.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                        {payment.transaction_reference && (
                          <p className="text-xs text-muted-foreground font-mono">Ref: {payment.transaction_reference}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₨{payment.amount.toLocaleString()}</p>
                      {getStatusBadge(payment.payment_status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DriverEarnings;
