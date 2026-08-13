import React, { useEffect, useRef, useState } from "react";
import { CreditCard, Loader2, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fetchSquareConfig } from "@/api/square";

type SquareCardTokenResult =
  | {
      status: "OK";
      token: string;
    }
  | {
      status: string;
      errors?: Array<{ message?: string; detail?: string; code?: string }>;
    };

type SquareCard = {
  attach: (selector: string) => Promise<void>;
  tokenize: (verificationDetails?: Record<string, unknown>) => Promise<SquareCardTokenResult>;
  destroy: () => Promise<boolean>;
};

type SquarePayments = {
  card: () => Promise<SquareCard>;
};

declare global {
  interface Window {
    Square?: {
      payments: (applicationId: string, locationId: string) => SquarePayments;
    };
  }
}

type SquareCardCheckoutProps = {
  total: number;
  isSubmitting: boolean;
  billingContact: {
    givenName?: string;
    familyName?: string;
    email?: string;
    phone?: string;
    addressLines?: string[];
    city?: string;
    state?: string;
    countryCode?: string;
    postalCode?: string;
  };
  onSubmitToken: (paymentToken: string) => Promise<void>;
  submitError?: string;
};

const loadSquareScript = async (environment: string) => {
  if (window.Square) {
    return;
  }

  const existingScript = document.querySelector<HTMLScriptElement>("script[data-square-web-payments]");

  if (existingScript) {
    await new Promise<void>((resolve, reject) => {
      if (window.Square) {
        resolve();
        return;
      }

      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Square SDK")), {
        once: true,
      });
    });
    return;
  }

  const script = document.createElement("script");
  script.src =
    environment === "production" || environment === "prod"
      ? "https://web.squarecdn.com/v1/square.js"
      : "https://sandbox.web.squarecdn.com/v1/square.js";
  script.async = true;
  script.dataset.squareWebPayments = "true";

  await new Promise<void>((resolve, reject) => {
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Square SDK"));
    document.head.appendChild(script);
  });
};

const SquareCardCheckout = ({
  total,
  isSubmitting,
  billingContact,
  onSubmitToken,
  submitError,
}: SquareCardCheckoutProps) => {
  const cardRef = useRef<SquareCard | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [isLoadingSquare, setIsLoadingSquare] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const initializeSquare = async () => {
      try {
        setIsLoadingSquare(true);
        setPaymentError("");

        const config = await fetchSquareConfig();

        if (cancelled) {
          return;
        }

        await loadSquareScript(config.environment);

        if (cancelled || !window.Square) {
          return;
        }

        const payments = window.Square.payments(config.applicationId, config.locationId);
        const card = await payments.card();

        if (cancelled) {
          await card.destroy();
          return;
        }

        await card.attach("#square-card-container");
        cardRef.current = card;
        setIsReady(true);
      } catch (error) {
        if (!cancelled) {
          setPaymentError(error instanceof Error ? error.message : "Failed to load card entry");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSquare(false);
        }
      }
    };

    initializeSquare();

    return () => {
      cancelled = true;
      void cardRef.current?.destroy();
      cardRef.current = null;
    };
  }, []);

  const handlePay = async () => {
    const card = cardRef.current;

    if (!card) {
      setPaymentError("Payment form is still loading. Please wait a moment and try again.");
      return;
    }

    setPaymentError("");

    try {
      const tokenResult = await card.tokenize({
        billingContact,
        intent: "STORE",
        customerInitiated: true,
        sellerKeyedIn: false,
      });

      if (tokenResult.status !== "OK") {
        const errorResult = tokenResult as Exclude<SquareCardTokenResult, { status: "OK" }>;
        const message =
          errorResult.errors?.[0]?.detail ||
          errorResult.errors?.[0]?.message ||
          "Unable to verify your card.";
        setPaymentError(message);
        return;
      }

      const successResult = tokenResult as Extract<SquareCardTokenResult, { status: "OK" }>;
      await onSubmitToken(successResult.token);
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "Card payment failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/20 p-4">
        <div className="flex items-center justify-between gap-4 mb-3">
          <h3 className="text-sm font-semibold text-foreground">Payment details</h3>
          <span className="text-sm font-semibold text-primary">${total.toFixed(2)}</span>
        </div>
        <div id="square-card-container" className="min-h-[180px]" />
        {isLoadingSquare && (
          <div className="mt-3 text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading secure card form...
          </div>
        )}
      </div>

      <Button
        type="button"
        onClick={handlePay}
        disabled={isSubmitting || isLoadingSquare || !isReady}
        className="w-full bg-royal hover:bg-royal-dark text-white h-12 text-base font-semibold gap-2"
      >
        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
        {isSubmitting ? "Saving card..." : `Save Card & Submit for Approval`}
      </Button>

      {(submitError || paymentError) && (
        <p className="text-sm text-destructive text-center">{submitError || paymentError}</p>
      )}

      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Shield className="h-3.5 w-3.5" />
        Secure Square card entry. Your card will be charged after admin approval.
      </div>
    </div>
  );
};

export default SquareCardCheckout;
