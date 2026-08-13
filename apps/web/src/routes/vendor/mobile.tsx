import { useEffect, useState } from "react";
import {
  getMobileStatus,
  startMobileVerification,
  verifyMobile,
} from "../../lib/mobile-api.js";
import { useTextReveal } from "../../hooks/use-text-reveal.js";
import { Card, Button, Spinner } from "../../components/ui.js";

type Phase = "status" | "phone-input" | "otp-entry" | "success";

interface MobileStatusData {
  verified: boolean;
  phoneNumber?: string;
  verificationToken?: string;
}

export function VendorMobilePage(): React.ReactElement {
  const [phase, setPhase] = useState<Phase>("status");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [status, setStatus] = useState<MobileStatusData | null>(null);
  const titleRef = useTextReveal<HTMLHeadingElement>();

  useEffect(() => {
    checkMobileStatus();
  }, []);

  async function checkMobileStatus(): Promise<void> {
    try {
      const data = await getMobileStatus();
      setStatus(data);
      setPhase(data.verified ? "success" : "phone-input");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check status");
      setPhase("phone-input");
    } finally {
      setLoading(false);
    }
  }

  async function handleStartVerification(): Promise<void> {
    const sanitized = phoneNumber.replace(/\D/g, "");
    if (!sanitized || sanitized.length < 10) {
      setError("Enter a valid phone number.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await startMobileVerification(sanitized);
      setPhase("otp-entry");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to start verification. Try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(): Promise<void> {
    if (!otpCode || otpCode.length !== 6 || !/^\d+$/.test(otpCode)) {
      setError("Enter a 6-digit code.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await verifyMobile(otpCode);
      setPhase("success");
      await checkMobileStatus();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid code. Try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading && phase === "status") {
    return (
      <div className="mt-16 grid place-items-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (phase === "success") {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="mt-12 grid place-items-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-500">
            <span className="text-2xl font-bold">✓</span>
          </div>
          <h1
            ref={titleRef}
            className="mt-4 text-2xl font-bold text-slate-900"
          >
            Mobile verified
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Your phone number has been confirmed.
          </p>
        </div>
        <Card className="mt-8 p-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
              <span className="text-sm font-medium text-slate-600">
                Verified number
              </span>
              <span className="ml-auto text-sm font-semibold text-slate-900">
                {status?.phoneNumber}
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-emerald-50 p-3">
              <span className="text-xs font-medium text-emerald-600">
                In vendor directory
              </span>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (phase === "phone-input") {
    return (
      <div className="mx-auto max-w-md">
        <h1
          ref={titleRef}
          className="text-2xl font-bold tracking-tight text-slate-900"
        >
          Verify your phone
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          We'll send a code to confirm your number.
        </p>

        <Card className="mt-8 p-6">
          <label className="block text-xs font-medium text-slate-700">
            Phone number
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => {
              setPhoneNumber(e.target.value);
              if (error) setError(null);
            }}
            placeholder="10-digit number"
            className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {error && (
            <p className="mt-2 text-xs text-rose-600">{error}</p>
          )}
          <Button
            onClick={handleStartVerification}
            disabled={loading}
            className="mt-6 w-full"
          >
            {loading ? <Spinner className="h-4 w-4" /> : "Send code"}
          </Button>
        </Card>
      </div>
    );
  }

  // OTP entry phase
  return (
    <div className="mx-auto max-w-md">
      <h1
        ref={titleRef}
        className="text-2xl font-bold tracking-tight text-slate-900"
      >
        Enter the code
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        We sent a 6-digit code to {phoneNumber}.
      </p>

      <Card className="mt-8 p-6">
        <label className="block text-xs font-medium text-slate-700">
          Verification code
        </label>
        <input
          type="text"
          value={otpCode}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "").slice(0, 6);
            setOtpCode(val);
            if (error) setError(null);
          }}
          placeholder="000000"
          maxLength={6}
          className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-2xl font-semibold tracking-widest placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        {error && (
          <p className="mt-2 text-xs text-rose-600">{error}</p>
        )}
        <Button
          onClick={handleVerifyOtp}
          disabled={loading || otpCode.length !== 6}
          className="mt-6 w-full"
        >
          {loading ? <Spinner className="h-4 w-4" /> : "Verify"}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setPhase("phone-input");
            setOtpCode("");
            setError(null);
          }}
          className="mt-3 w-full"
        >
          Change number
        </Button>
      </Card>
    </div>
  );
}

export default VendorMobilePage;
