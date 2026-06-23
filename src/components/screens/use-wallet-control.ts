"use client";

import { useCallback, useMemo, useState } from "react";

import { providerRequest } from "@/lib/provider-gateway-client";
import type { WalletProfile } from "@/lib/types";
import type { WalletPolicy, WalletReadiness, WalletRecord } from "@/lib/wallet-control-types";

const DEFAULT_POLICY_AMOUNT = "7500000000";

export function useWalletControl(operatorToken: string) {
  const [wallets, setWallets] = useState<WalletRecord[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [readiness, setReadiness] = useState<WalletReadiness | null>(null);
  const [policy, setPolicy] = useState<WalletPolicy | null>(null);
  const [walletLabel, setWalletLabel] = useState("Judge Testnet Wallet");
  const [walletAccountHash, setWalletAccountHash] = useState("");
  const [walletSigningMode, setWalletSigningMode] = useState("external");
  const [policyAmount, setPolicyAmount] = useState(DEFAULT_POLICY_AMOUNT);
  const [dailyLimit, setDailyLimit] = useState("");
  const [sessionLimit, setSessionLimit] = useState("");
  const [policyTool, setPolicyTool] = useState("get_quote");
  const [policyDisabled, setPolicyDisabled] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Connect operator access to load wallet records.");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedWallet = wallets.find((wallet) => wallet.id === selectedWalletId) ?? null;
  const walletProfiles = useMemo(() => wallets.map((wallet) => toWalletProfile(wallet, readiness)), [readiness, wallets]);

  const refreshReadiness = useCallback(async (walletId = selectedWalletId, token = operatorToken) => {
    if (!walletId || !token) return;
    const result = await providerRequest<WalletReadiness>(`/api/wallets/${walletId}/readiness`, {
      operatorToken: token,
    });
    setReadiness(result);
    setStatusMessage(result.ready ? "Wallet readiness confirmed from CSPR.cloud." : result.reason);
  }, [operatorToken, selectedWalletId]);

  const loadPolicy = useCallback(async (walletId = selectedWalletId, token = operatorToken) => {
    if (!walletId || !token) return;
    const result = await providerRequest<{ policy: WalletPolicy | null }>(`/api/wallets/${walletId}/policy`, {
      operatorToken: token,
    });
    setPolicy(result.policy);
    if (result.policy) {
      setPolicyAmount(result.policy.maxPerCall);
      setDailyLimit(result.policy.dailyLimit ?? "");
      setSessionLimit(result.policy.sessionLimit ?? "");
      setPolicyDisabled(result.policy.disabled);
      setPolicyTool(result.policy.allowedTools[0] ?? "get_quote");
    }
  }, [operatorToken, selectedWalletId]);

  const loadWallets = useCallback(async (token = operatorToken) => {
    if (!token) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await providerRequest<{ wallets: WalletRecord[] }>("/api/wallets", { operatorToken: token });
      setWallets(result.wallets);
      const nextWalletId = selectedWalletId || result.wallets[0]?.id || "";
      setSelectedWalletId(nextWalletId);
      setStatusMessage(result.wallets.length ? "Loaded wallet records from Postgres." : "No wallet profiles created yet.");
      if (nextWalletId) {
        await refreshReadiness(nextWalletId, token);
        await loadPolicy(nextWalletId, token);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "wallets_failed");
    } finally {
      setLoading(false);
    }
  }, [loadPolicy, operatorToken, refreshReadiness, selectedWalletId]);

  async function createWallet() {
    if (!operatorToken) return setErrorMessage("Operator access token is required.");
    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await providerRequest<{ wallet: WalletRecord }>("/api/wallets", {
        body: { accountHash: walletAccountHash, label: walletLabel, signingMode: walletSigningMode },
        method: "POST",
        operatorToken,
      });
      setSelectedWalletId(result.wallet.id);
      setWalletAccountHash("");
      setStatusMessage("Wallet profile saved. Refresh readiness to check CSPR.cloud balances.");
      await loadWallets(operatorToken);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "wallet_create_failed");
    } finally {
      setLoading(false);
    }
  }

  async function savePolicy() {
    if (!operatorToken) return setErrorMessage("Operator access token is required.");
    if (!selectedWalletId) return setErrorMessage("Select a wallet before saving policy.");
    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await providerRequest<{ policy: WalletPolicy }>(`/api/wallets/${selectedWalletId}/policy`, {
        body: {
          allowedTools: policyTool ? [policyTool] : [],
          dailyLimit: dailyLimit || undefined,
          disabled: policyDisabled,
          maxPerCall: policyAmount,
          sessionLimit: sessionLimit || undefined,
        },
        method: "POST",
        operatorToken,
      });
      setPolicy(result.policy);
      setStatusMessage("Spend policy saved. It will run before x402 payment signing.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "wallet_policy_failed");
    } finally {
      setLoading(false);
    }
  }

  function selectWallet(walletId: string) {
    setSelectedWalletId(walletId);
    setReadiness(null);
    setPolicy(null);
    void refreshReadiness(walletId);
    void loadPolicy(walletId);
  }

  return {
    createWallet,
    dailyLimit,
    errorMessage,
    loading,
    loadWallets,
    policy,
    policyAmount,
    policyDisabled,
    policyTool,
    refreshReadiness,
    readiness,
    savePolicy,
    selectWallet,
    selectedWallet,
    selectedWalletId,
    sessionLimit,
    setDailyLimit,
    setPolicyAmount,
    setPolicyDisabled,
    setPolicyTool,
    setSessionLimit,
    setWalletAccountHash,
    setWalletLabel,
    setWalletSigningMode,
    statusMessage,
    walletAccountHash,
    walletLabel,
    walletProfiles,
    wallets,
    walletSigningMode,
  };
}

function toWalletProfile(wallet: WalletRecord, readiness: WalletReadiness | null): WalletProfile {
  const active = readiness?.accountHash === wallet.accountHash ? readiness : null;
  return {
    account: `0x${wallet.accountHash.slice(0, 4)}...${wallet.accountHash.slice(-4)}`,
    balance: active?.assetBalance ?? "unavailable",
    fullAccount: `account-hash-${wallet.accountHash}`,
    funded: Boolean(active?.ready),
    id: wallet.id,
    network: wallet.network,
    signingMode: wallet.signingMode,
    status: active?.ready ? "ready" : "not ready",
  };
}
