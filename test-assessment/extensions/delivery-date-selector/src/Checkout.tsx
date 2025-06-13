import {
  useExtensionApi,
  useBuyerJourneyIntercept,
  useMetafield,
  BlockStack,
  DateField,
  Text,
} from "@shopify/ui-extensions-react/checkout";
import { useEffect, useState } from "react";

// Entry point of the Checkout UI Extension
export default function Checkout() {
  // Get store context
  const { shop } = useExtensionApi();

  // Read metafield value from the store to get delivery settings
  const deliverySettings = useMetafield({
    namespace: "delivery_settings",
    key: "config",
  });

  // Local state for parsed metafield values
  const [disabledDates, setDisabledDates] = useState<string[]>([]);
  const [disabledDays, setDisabledDays] = useState<number[]>([]);
  const [disabledRanges, setDisabledRanges] = useState<{ start: string; end: string }[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  // Load and parse metafield value when it becomes available
  useEffect(() => {
    if (!deliverySettings?.value) return;
  
    try {
      const parsed = JSON.parse(String(deliverySettings.value));
      setDisabledDates(parsed.blockedSpecificDates || []);
      setDisabledDays(parsed.blockedDays || []);
      setDisabledRanges(parsed.blockedRanges || []);
    } catch (err) {
      console.error("Error parsing metafield config:", err);
    }
  }, [deliverySettings?.value]);
  
  // Predicate function to check if a date is blocked
  const isDateBlocked = (iso: string, dayIndex: number): boolean => {
    const inDisabledDay = disabledDays.includes(dayIndex);
    const inDisabledDate = disabledDates.includes(iso);
    const inDisabledRange = disabledRanges.some(
      (range) => iso >= range.start && iso <= range.end
    );
    const isPastDate = iso < new Date().toISOString().split("T")[0];
    return inDisabledDay || inDisabledDate || inDisabledRange || isPastDate;
  };

  // Intercept checkout flow to prevent submission if an invalid date is selected
  useBuyerJourneyIntercept(() => {
    if (!selectedDate) {
      return {
        behavior: "block",
        reason: "You must select a delivery date.",
        errors: [{ message: "No date selected" }],
      };
    }

    const iso = selectedDate.split("T")[0];
    const dayIndex = new Date(iso).getDay();

    if (isDateBlocked(iso, dayIndex)) {
      return {
        behavior: "block",
        reason: "The selected date is not available for delivery.",
        errors: [{ message: "Invalid delivery date" }],
      };
    }

    return { behavior: "allow" };
  });

  return (
    <BlockStack>
      {/* For development: show raw metafield JSON */}
      {process.env.NODE_ENV === "development" && (
        <Text>Metafield JSON: {deliverySettings?.value}</Text>
      )}

      <Text>Select your delivery date</Text>

      {/* Error state if metafield is missing */}
      {!deliverySettings?.value && (
        <Text appearance="critical">Delivery configuration could not be loaded.</Text>
      )}

      {/* Main date input component */}
      <DateField
        label="Delivery date"
        value={selectedDate}
        onChange={(date) => {
          setSelectedDate(date);
          const iso = date.split("T")[0];
          const dayIndex = new Date(iso).getDay();
          const isBlocked = disabledDays.includes(dayIndex)
            || disabledDates.includes(iso)
            || disabledRanges.some(range => iso >= range.start && iso <= range.end);
  
          if (isBlocked) {
            setError("The selected date is not available for delivery.");
          } else {
            setError(undefined);
          }
        }}
        error={error}
      />

      {/* Show validation error if exists */}
      {error && <Text appearance="critical">{error}</Text>}
    </BlockStack>
  );
}