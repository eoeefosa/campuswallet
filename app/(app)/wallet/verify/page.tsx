"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatNaira } from "@/lib/format";

interface VerifyResult {
  status: string;
  amount: number;
  reference: string;
}

export default function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const params = use(searchParams);
  const reference = params.reference ?? params.trxref ?? "";
  const router = useRouter();
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!reference) {
      router.replace("/wallet");
      return;
    }
    api
      .get<VerifyResult>(`/payments/verify/${reference}`)
      .then(setResult)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Verification failed"),
      );
  }, [reference, router]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="text-5xl mb-4">❌</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Payment Failed
        </h2>
        <p className="text-gray-500 text-sm mb-6">{error}</p>
        <Link
          href="/wallet"
          className="bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700"
        >
          Back to Wallet
        </Link>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400 text-sm">Verifying payment…</div>
      </div>
    );
  }

  const success = result.status === "success";

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center max-w-sm mx-auto">
      <div className="text-5xl mb-4">{success ? "✅" : "❌"}</div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        {success ? "Payment Successful!" : "Payment Unsuccessful"}
      </h2>
      {success && (
        <p className="text-gray-500 text-sm mb-2">
          {formatNaira(result.amount / 100)} has been added to your wallet.
        </p>
      )}
      <p className="text-xs text-gray-400 mb-6">Ref: {result.reference}</p>
      <Link
        href="/wallet"
        className="bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
      >
        Back to Wallet
      </Link>
    </div>
  );
}
