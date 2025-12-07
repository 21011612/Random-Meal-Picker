"use client";

/**
 * ============================================================================
 * RANDOM MEAL PICKER DAPP
 * ============================================================================
 *
 * Component này cho phép bạn:
 *  - Kết nối ví IOTA
 *  - Bấm nút "Pick Meal" để gọi smart contract `pick_random`
 *  - Hiển thị món ăn được chọn ngẫu nhiên từ danh sách cố định
 *
 * Toàn bộ logic contract nằm trong hooks/useContract.ts
 * ============================================================================
 */

import { useState, useMemo } from "react";
import { useCurrentAccount } from "@iota/dapp-kit";
import { useContract } from "@/hooks/useContract";
import { Button, Container, Heading, Text, TextField } from "@radix-ui/themes";
import ClipLoader from "react-spinners/ClipLoader";

const MEALS = [
  "🍣 Sushi",
  "🍕 Pizza",
  "🍔 Burger",
  "🍜 Phở",
  "🥗 Salad",
  "🍛 Curry",
];

const SampleIntegration = () => {
  const currentAccount = useCurrentAccount();
  const { data, actions, state, choiceId } = useContract();

  const [seedInput, setSeedInput] = useState<string>(() =>
    Math.floor(Math.random() * 100000).toString()
  );

  const isConnected = !!currentAccount;
  const isValidSeed =
    seedInput.trim() !== "" && !Number.isNaN(Number(seedInput));

  const { chosenMeal, chosenIndex } = useMemo(() => {
    if (!data)
      return {
        chosenMeal: null as string | null,
        chosenIndex: null as number | null,
      };
    const safeIndex = data.index % MEALS.length;
    return { chosenMeal: MEALS[safeIndex], chosenIndex: safeIndex };
  }, [data]);

  if (!isConnected) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
        }}
      >
        <div style={{ maxWidth: "500px", width: "100%" }}>
          <Heading size="6" style={{ marginBottom: "1rem" }}>
            🍽️ Random Meal Picker
          </Heading>
          <Text>
            Hãy kết nối ví IOTA của bạn để bắt đầu chọn món ngẫu nhiên cho cả
            nhóm.
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "1rem",
        background: "var(--gray-a2)",
      }}
    >
      <Container style={{ maxWidth: "800px", margin: "0 auto" }}>
        <Heading size="6" style={{ marginBottom: "2rem" }}>
          🍽️ Random Meal Picker
        </Heading>

        {/* Kết quả lựa chọn hiện tại */}
        {choiceId && data && (
          <div
            style={{
              marginBottom: "1rem",
              padding: "1.5rem",
              background: "var(--green-a3)",
              borderRadius: "8px",
              border: "2px solid var(--green-7)",
            }}
          >
            <Heading size="4" style={{ marginBottom: "0.5rem" }}>
              ✅ Đã chọn món ăn cho nhóm!
            </Heading>
            {chosenMeal && (
              <Text
                style={{
                  display: "block",
                  fontSize: "1.1rem",
                  marginBottom: "0.5rem",
                }}
              >
                Món được chọn: <strong>{chosenMeal}</strong>
              </Text>
            )}
            <Text
              size="1"
              style={{
                color: "var(--gray-a11)",
                display: "block",
                fontFamily: "monospace",
                wordBreak: "break-all",
              }}
            >
              MealChoice ID: {choiceId}
            </Text>
            <Text
              size="1"
              style={{
                color: "var(--gray-a11)",
                display: "block",
                fontFamily: "monospace",
                marginTop: "0.25rem",
              }}
            >
              index: {data.index} • seed: {data.seed}
            </Text>
          </div>
        )}

        {/* Form chọn seed & gọi pick_random */}
        <div
          style={{
            padding: "1.5rem",
            background: "var(--gray-a3)",
            borderRadius: "8px",
            marginBottom: "1rem",
          }}
        >
          <Heading size="4" style={{ marginBottom: "1rem" }}>
            Chọn món ngẫu nhiên 👨‍🍳
          </Heading>

          <Text size="2" style={{ display: "block", marginBottom: "0.5rem" }}>
            Danh sách món ăn (cố định trên frontend):
          </Text>
          <ul style={{ marginBottom: "1rem", paddingLeft: "1.2rem" }}>
            {MEALS.map((meal, idx) => (
              <li key={idx}>
                <Text size="2">
                  #{idx} – {meal}
                </Text>
              </li>
            ))}
          </ul>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              marginBottom: "1rem",
            }}
          >
            <div>
              <Text
                size="2"
                style={{ display: "block", marginBottom: "0.3rem" }}
              >
                Seed (số bất kỳ bạn thích)
              </Text>
              <TextField.Root
                value={seedInput}
                onChange={(e) => setSeedInput(e.target.value)}
                type="number"
                min="0"
              />
              <Text
                size="1"
                style={{
                  display: "block",
                  marginTop: "0.25rem",
                  color: "var(--gray-a11)",
                }}
              >
                Seed dùng làm đầu vào cho smart contract để tính toán ngẫu
                nhiên.
              </Text>
            </div>
          </div>

          <Button
            size="3"
            onClick={() =>
              actions.pickRandomMeal(
                MEALS.length,
                Number.isNaN(parseInt(seedInput, 10))
                  ? 0
                  : parseInt(seedInput, 10)
              )
            }
            disabled={!isConnected || !isValidSeed || state.isLoading}
          >
            {state.isLoading ? (
              <>
                <ClipLoader size={16} style={{ marginRight: "8px" }} />
                Đang chọn...
              </>
            ) : (
              "🎲 Pick Meal"
            )}
          </Button>

          {data && chosenMeal && (
            <div
              style={{
                marginTop: "1rem",
                padding: "1rem",
                background: "var(--gray-a4)",
                borderRadius: "8px",
              }}
            >
              <Text size="2">
                Kết quả hiện tại: <strong>{chosenMeal}</strong>{" "}
                {chosenIndex !== null && `(index ${chosenIndex})`}
              </Text>
            </div>
          )}
        </div>

        {/* Transaction Status */}
        {state.hash && (
          <div
            style={{
              marginTop: "1rem",
              padding: "1rem",
              background: "var(--gray-a3)",
              borderRadius: "8px",
            }}
          >
            <Text size="1" style={{ display: "block", marginBottom: "0.5rem" }}>
              Transaction Hash
            </Text>
            <Text
              size="2"
              style={{ fontFamily: "monospace", wordBreak: "break-all" }}
            >
              {state.hash}
            </Text>
            {state.isConfirmed && (
              <Text
                size="2"
                style={{
                  color: "green",
                  marginTop: "0.5rem",
                  display: "block",
                }}
              >
                ✅ Transaction confirmed!
              </Text>
            )}
          </div>
        )}

        {/* Error Display */}
        {state.error && (
          <div
            style={{
              marginTop: "1rem",
              padding: "1rem",
              background: "var(--red-a3)",
              borderRadius: "8px",
            }}
          >
            <Text style={{ color: "var(--red-11)" }}>
              Error: {(state.error as Error)?.message || String(state.error)}
            </Text>
          </div>
        )}
      </Container>
    </div>
  );
};

export default SampleIntegration;
