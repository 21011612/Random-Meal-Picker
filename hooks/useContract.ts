"use client";

/**
 * ============================================================================
 * IOTA CONTRACT INTEGRATION HOOK - RANDOM MEAL PICKER
 * ============================================================================
 *
 * Hook này chứa toàn bộ logic tương tác smart contract cho dApp Random Meal Picker.
 * Nó gọi hàm `pick_random` trong Move module `meal_picker` để tạo một object
 * MealChoice chứa index món ăn đã chọn.
 *
 * ============================================================================
 */

import { useState } from "react";
import {
  useCurrentAccount,
  useIotaClient,
  useSignAndExecuteTransaction,
  useIotaClientQuery,
} from "@iota/dapp-kit";
import { Transaction } from "@iota/iota-sdk/transactions";
import type { IotaObjectData } from "@iota/iota-sdk/client";

// ============================================================================
// CONTRACT CONFIGURATION
// ============================================================================

// Package ID mới trên TESTNET mà bạn vừa publish
export const CONTRACT_PACKAGE_ID =
  "0x28c2944ed334a50545a55234dfbb1523a937be8d4fa33684138db819b62d96a1";

export const CONTRACT_MODULE = "meal_picker";
export const CONTRACT_METHODS = {
  PICK_RANDOM: "pick_random",
} as const;

// ============================================================================
// DATA EXTRACTION
// ============================================================================

export interface ContractData {
  index: number;
  seed: number;
  user: string;
}

function getMealChoiceFields(data: IotaObjectData): ContractData | null {
  if (data.content?.dataType !== "moveObject") {
    console.log("Data is not a moveObject:", data.content?.dataType);
    return null;
  }

  const fields = data.content.fields as Record<string, unknown>;
  if (!fields) {
    console.log("No fields found in object data");
    return null;
  }

  try {
    return {
      index: parseInt(String(fields.index), 10),
      seed: parseInt(String(fields.seed), 10),
      user: String(fields.user),
    };
  } catch (error) {
    console.error("Error parsing meal choice fields:", error);
    return null;
  }
}

// ============================================================================
// STATE TYPES
// ============================================================================

export interface ContractState {
  isLoading: boolean;
  isPending: boolean;
  isConfirming: boolean;
  isConfirmed: boolean;
  hash: string | undefined;
  error: Error | null;
}

export interface ContractActions {
  pickRandomMeal: (mealCount: number, seed: number) => Promise<void>;
  clearChoice: () => void;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export const useContract = () => {
  const currentAccount = useCurrentAccount();
  const address = currentAccount?.address;
  const packageId = CONTRACT_PACKAGE_ID;
  const iotaClient = useIotaClient();
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();

  const [choiceId, setChoiceId] = useState<string | null>(() => {
    if (typeof window !== "undefined" && currentAccount?.address) {
      return localStorage.getItem(`mealChoiceId_${currentAccount.address}`);
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [hash, setHash] = useState<string | undefined>();
  const [transactionError, setTransactionError] = useState<Error | null>(null);

  // Fetch MealChoice object (nếu đã có ID lưu trong localStorage)
  const {
    data,
    isPending: isFetching,
    error: queryError,
    refetch,
  } = useIotaClientQuery(
    "getObject",
    {
      id: choiceId!,
      options: { showContent: true, showOwner: true },
    },
    {
      enabled: !!choiceId,
    }
  );

  const fields = data?.data ? getMealChoiceFields(data.data) : null;
  const objectExists = !!data?.data;
  const hasValidData = !!fields;

  // Gọi hàm pick_random trên chain
  const pickRandomMeal = async (mealCount: number, seed: number) => {
    if (!packageId) return;

    try {
      setTransactionError(null);
      setHash(undefined);

      const tx = new Transaction();
      tx.moveCall({
        arguments: [tx.pure.u64(mealCount), tx.pure.u64(seed)],
        target: `${packageId}::${CONTRACT_MODULE}::${CONTRACT_METHODS.PICK_RANDOM}`,
      });

      signAndExecute(
        { transaction: tx as never },
        {
          onSuccess: async ({ digest }) => {
            setHash(digest);
            setIsLoading(true);
            try {
              const { effects } = await iotaClient.waitForTransaction({
                digest,
                options: { showEffects: true },
              });

              const created = effects?.created ?? [];
              const newChoiceId = created[0]?.reference?.objectId;

              if (newChoiceId) {
                setChoiceId(newChoiceId);
                if (typeof window !== "undefined" && address) {
                  localStorage.setItem(
                    `mealChoiceId_${address}`,
                    newChoiceId
                  );
                }
                await refetch();
              } else {
                console.warn("No MealChoice ID found in transaction effects");
              }
            } catch (waitError) {
              console.error("Error waiting for transaction:", waitError);
            } finally {
              setIsLoading(false);
            }
          },
          onError: (err) => {
            const error =
              err instanceof Error ? err : new Error(String(err));
            setTransactionError(error);
            console.error("Error:", err);
          },
        }
      );
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setTransactionError(error);
      console.error("Error calling pick_random:", err);
    }
  };

  const clearChoice = () => {
    setChoiceId(null);
    setTransactionError(null);
    setHash(undefined);
    if (typeof window !== "undefined" && address) {
      localStorage.removeItem(`mealChoiceId_${address}`);
    }
  };

  const actions: ContractActions = {
    pickRandomMeal,
    clearChoice,
  };

  const contractState: ContractState = {
    // KHÔNG cộng thêm isFetching nữa để nút không bị kẹt khi query object
    isLoading,
    isPending,
    isConfirming: false,
    isConfirmed: !!hash && !isLoading && !isPending,
    hash,
    error: queryError || transactionError,
  };

  return {
    data: fields,
    actions,
    state: contractState,
    choiceId,
    objectExists,
    hasValidData,
    isFetching,
  };
};
