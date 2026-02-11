import { useState } from "react";
import { Upload, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PAYMENT_METHODS, PaymentMethod, useCreatePayment } from "@/hooks/usePayments";

interface PaymentMethodSelectorProps {
  bookingId: string;
  rideId: string;
  driverId: string;
  amount: number;
  onSuccess?: () => void;
}

const PaymentMethodSelector = ({
  bookingId,
  rideId,
  driverId,
  amount,
  onSuccess,
}: PaymentMethodSelectorProps) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [transactionRef, setTransactionRef] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [step, setStep] = useState<'select' | 'proof' | 'done'>('select');
  const createPayment = useCreatePayment();

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    if (method === 'cash') {
      // Cash doesn't need proof
      setStep('proof');
    } else {
      setStep('proof');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        alert("Only JPEG, PNG, and WebP images are allowed");
        return;
      }
      setScreenshotFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedMethod) return;

    await createPayment.mutateAsync({
      bookingId,
      rideId,
      driverId,
      amount,
      paymentMethod: selectedMethod,
      transactionReference: transactionRef || undefined,
      screenshotFile: screenshotFile || undefined,
    });

    setStep('done');
    onSuccess?.();
  };

  if (step === 'done') {
    return (
      <div className="text-center py-6">
        <CheckCircle className="h-12 w-12 text-primary mx-auto mb-3" />
        <h3 className="font-semibold text-lg">Payment Submitted</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {selectedMethod === 'cash'
            ? "Pay the driver in cash when you meet."
            : "Your proof is being verified by the driver."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <p className="text-sm text-muted-foreground">Amount to pay</p>
        <p className="text-3xl font-bold text-primary">₨{amount}</p>
      </div>

      {step === 'select' && (
        <div className="grid grid-cols-2 gap-2">
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method.value}
              onClick={() => handleMethodSelect(method.value)}
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg border text-left transition-all",
                "hover:border-primary hover:bg-primary/5",
                selectedMethod === method.value
                  ? "border-primary bg-primary/10"
                  : "border-border"
              )}
            >
              <span className="text-xl">{method.icon}</span>
              <span className="text-sm font-medium">{method.label}</span>
            </button>
          ))}
        </div>
      )}

      {step === 'proof' && selectedMethod && (
        <div className="space-y-4">
          <button
            onClick={() => setStep('select')}
            className="text-sm text-primary hover:underline"
          >
            ← Change payment method
          </button>

          <Card className="bg-muted/30">
            <CardContent className="p-4 text-center">
              <p className="text-sm font-medium">
                {PAYMENT_METHODS.find(m => m.value === selectedMethod)?.icon}{' '}
                {PAYMENT_METHODS.find(m => m.value === selectedMethod)?.label}
              </p>
            </CardContent>
          </Card>

          {selectedMethod === 'cash' ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Please pay <span className="font-bold text-foreground">₨{amount}</span> in cash to the driver when you meet.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Transaction Reference / ID
                </label>
                <Input
                  placeholder="e.g. TXN123456789"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  maxLength={50}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Payment Screenshot (optional)
                </label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                  {screenshotFile ? (
                    <div className="space-y-2">
                      <CheckCircle className="h-6 w-6 text-primary mx-auto" />
                      <p className="text-sm">{screenshotFile.name}</p>
                      <button
                        onClick={() => setScreenshotFile(null)}
                        className="text-xs text-destructive hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                      <p className="text-sm text-muted-foreground">
                        Tap to upload screenshot
                      </p>
                      <p className="text-xs text-muted-foreground">
                        JPEG, PNG, WebP · Max 5MB
                      </p>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  )}
                </div>
              </div>
            </>
          )}

          <Button
            className="w-full bg-gradient-hero hover:opacity-90"
            onClick={handleSubmit}
            disabled={createPayment.isPending || (!transactionRef && selectedMethod !== 'cash' && !screenshotFile)}
          >
            {createPayment.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : selectedMethod === 'cash' ? (
              "Confirm Cash Payment"
            ) : (
              "Submit Payment Proof"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodSelector;
