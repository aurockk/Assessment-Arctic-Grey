/**
 * This file defines the main admin UI page for managing delivery settings in a Shopify app.
 * Merchants can configure:
 * - Specific dates to disable
 * - Day-of-week blocking (e.g. disable all Mondays)
 * - Date ranges to disable
 * These settings are saved to a metafield and used to control delivery behavior in checkout.
 */


import {
  Page,
  Card,
  BlockStack,
  InlineStack,
  Button,
  Modal,
  DatePicker,
  PageActions,
  Grid,
  Text,
  Icon,
  Divider,
  TextField,
  InlineGrid,
  ButtonGroup,
} from "@shopify/polaris";
import { DeleteIcon, EditIcon } from '@shopify/polaris-icons';
import { useCallback, useState } from "react";
import { useLoaderData, useSubmit } from "@remix-run/react";
import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

interface DeliverySettings {
  blockedSpecificDates: string[];
  blockedDays: number[];
  blockedRanges: { start: string; end: string }[];
}

// Loader function: Fetches initial data (shopId and delivery settings) from the Shopify metafield
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(`
    query {
      shop {
        id
        metafield(namespace: "delivery_settings", key: "config") {
          value
        }
      }
    }
  `);

  const jsonData = await response.json();
  const shopId = jsonData?.data?.shop?.id;
  const metafieldValue = jsonData?.data?.shop?.metafield?.value;

  let settings: DeliverySettings = {
    blockedSpecificDates: [],
    blockedDays: [],
    blockedRanges: [],
  };

  if (metafieldValue) {
    try {
      const parsed = JSON.parse(metafieldValue);
      settings = {
        blockedSpecificDates: parsed.blockedSpecificDates || [],
        blockedDays: parsed.blockedDays || [],
        blockedRanges: parsed.blockedRanges || [],
      };
    } catch (e) {
      console.error("Error parsing metafield JSON:", e);
    }
  }

  return json({ shopId, settings });
};

// Action function: Handles form submissions and saves updated delivery settings to the metafield
export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const shopId = formData.get("shopId") as string;
  const blockedSpecificDates = JSON.parse(formData.get("blockedSpecificDates") as string);
  const blockedDays = JSON.parse(formData.get("blockedDays") as string);
  const blockedRanges = JSON.parse(formData.get("blockedRanges") as string);

  const input = {
    namespace: "delivery_settings",
    key: "config",
    type: "json",
    ownerId: shopId,
    value: JSON.stringify({ blockedSpecificDates, blockedDays, blockedRanges }),
  };

  const response = await admin.graphql(`
    mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        userErrors {
          field
          message
        }
      }
    }
  `, { variables: { metafields: [input] } });

  const result = await response.json();
  const errors = result.data?.metafieldsSet?.userErrors;

  if (errors?.length) {
    console.error("GraphQL User Errors:", errors);
    return json({ errors }, { status: 400 });
  }

  return json({ success: true });
};

export default function DeliverySettingsPage() {
  const { shopId, settings } = useLoaderData<typeof loader>();
  const submit = useSubmit();

  const [specificDates, setSpecificDates] = useState(settings.blockedSpecificDates);
  const [blockedDays, setBlockedDays] = useState(settings.blockedDays);
  const [blockedRanges, setBlockedRanges] = useState(settings.blockedRanges);
  const [isDateModalOpen, setDateModalOpen] = useState(false);
  const [isRangeModalOpen, setRangeModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | undefined>();
  const [editing, setEditing] = useState<{ type: 'date' | 'range'; index: number } | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'date' | 'range'; index: number } | null>(null);

  // Toggles a specific day of the week as enabled/disabled for delivery
const toggleDay = (i: number) => {
    setBlockedDays(prev => prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i]);
  };

  // Triggers a POST request to save all delivery settings (dates, days, ranges) to the metafield
const save = () => {
    const form = new FormData();
    form.append("shopId", shopId);
    form.append("blockedSpecificDates", JSON.stringify(specificDates));
    form.append("blockedDays", JSON.stringify(blockedDays));
    form.append("blockedRanges", JSON.stringify(blockedRanges));
    submit(form, { method: "post" });
  };

  // Removes a selected item (date or range) from the UI and metafield state
const confirmDelete = () => {
    if (!itemToDelete) return;
    const { type, index } = itemToDelete;
    if (type === "date") {
      setSpecificDates(prev => prev.filter((_, i) => i !== index));
    } else {
      setBlockedRanges(prev => prev.filter((_, i) => i !== index));
    }
    setItemToDelete(null);
  };

  // Confirms the selected date from the date modal and updates the metafield state
const confirmDate = () => {
    const iso = selectedDate?.toISOString().split("T")[0];
    if (!iso) return;
    if (editing) {
      setSpecificDates(prev => {
        const copy = [...prev];
        copy[editing.index] = iso;
        return copy;
      });
    } else if (!specificDates.includes(iso)) {
      setSpecificDates(prev => [...prev, iso]);
    }
    setDateModalOpen(false);
    setEditing(null);
  };

  // Confirms the selected date range from the modal and updates the metafield state
const confirmRange = () => {
    if (!selectedRange) return;
    const range = {
      start: selectedRange.start.toISOString().split("T")[0],
      end: selectedRange.end.toISOString().split("T")[0],
    };
    if (editing) {
      setBlockedRanges(prev => {
        const copy = [...prev];
        copy[editing.index] = range;
        return copy;
      });
    } else {
      setBlockedRanges(prev => [...prev, range]);
    }
    setEditing(null);
    setRangeModalOpen(false);
  };

  return (
    <Page title="Dashboard" fullWidth>
      <Grid>
        {/* Days Block */}
        <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
        <Card roundedAbove="sm">
          <BlockStack gap="200">
            <InlineGrid columns="1fr">
              <Text as="h3" variant="headingMd">Select Days</Text>
              <Text as="p" variant="bodyMd">Pick the days of the week you’d like to enable or disable in the calendar.</Text>
            </InlineGrid>

            <Divider />

            <BlockStack gap="200">
              {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, i) => (
                <InlineStack key={day} align="space-between">
                  <Text as={"dd"}>{day}</Text>
                  <Button
                    size="slim"
                    tone={blockedDays.includes(i) ? "critical" : "success"}
                    onClick={() => toggleDay(i)}
                  >
                    {blockedDays.includes(i) ? "Disable" : "Enable"}
                  </Button>
                </InlineStack>
              ))}
            </BlockStack>
          </BlockStack>
        </Card>

        </Grid.Cell>

        {/* Dates Block */}
        <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
        <Card roundedAbove="sm">
          <BlockStack gap="200">
            <InlineGrid columns="1fr auto">
              <Text as="h3" variant="headingMd">Select Dates</Text>
              <InlineStack gap="200">
                <Button size="slim" onClick={() => { setEditing(null); setDateModalOpen(true); }}>
                  Add Date
                </Button>
                <Button size="slim" onClick={() => { setEditing(null); setRangeModalOpen(true); }}>
                  Add Date Range
                </Button>
              </InlineStack>
            </InlineGrid>

            <Text as="p" variant="bodyMd">
              Pick the dates you’d like to disable in the calendar.
            </Text>

            <Divider />

            <BlockStack gap="200">
              {specificDates.map((d, i) => (
                <InlineStack key={d} align="space-between">
                  <Text as={"dd"}>{d}</Text>
                  <ButtonGroup>
                    <Button icon={EditIcon} variant="plain" onClick={() => {
                      setSelectedDate(new Date(d));
                      setEditing({ type: 'date', index: i });
                      setDateModalOpen(true);
                    }} />
                    <Button icon={DeleteIcon} tone="critical" variant="plain" onClick={() => setItemToDelete({ type: 'date', index: i })} />
                  </ButtonGroup>
                </InlineStack>
              ))}

              {blockedRanges.map((r, i) => (
                <InlineStack key={`${r.start}-${r.end}`} align="space-between">
                  <Text as={"dd"}>{r.start} - {r.end}</Text>
                  <ButtonGroup>
                    <Button icon={EditIcon} variant="plain" onClick={() => {
                      setSelectedRange({ start: new Date(r.start), end: new Date(r.end) });
                      setEditing({ type: 'range', index: i });
                      setRangeModalOpen(true);
                    }} />
                    <Button icon={DeleteIcon} tone="critical" variant="plain" onClick={() => setItemToDelete({ type: 'range', index: i })} />
                  </ButtonGroup>
                </InlineStack>
              ))}
            </BlockStack>
          </BlockStack>
        </Card>
        </Grid.Cell>
      </Grid>

      <PageActions primaryAction={{ content: "Save Settings", onAction: save }} />

      {/* Modals */}
      <Modal open={isDateModalOpen} onClose={() => setDateModalOpen(false)} title="Select Date" primaryAction={{ content: "Confirm", onAction: confirmDate }}>
        <Modal.Section>
          <DatePicker
            month={new Date().getMonth()}
            year={new Date().getFullYear()}
            onChange={(range) => setSelectedDate(range.start)}
            selected={selectedDate || undefined}
            disableDatesBefore={new Date()}
          />
        </Modal.Section>
      </Modal>

      <Modal open={isRangeModalOpen} onClose={() => setRangeModalOpen(false)} title="Select Range" primaryAction={{ content: "Confirm", onAction: confirmRange }}>
        <Modal.Section>
          <DatePicker
            allowRange
            month={new Date().getMonth()}
            year={new Date().getFullYear()}
            onChange={(range) => setSelectedRange(range as any)}
            selected={selectedRange || undefined}
            disableDatesBefore={new Date()}
          />
        </Modal.Section>
      </Modal>

      <Modal open={!!itemToDelete} onClose={() => setItemToDelete(null)} title="Are you sure you want to remove?">
        <Modal.Section>
        <Text as="p">By clicking on "Yes", the selected item will be removed.</Text>
          <InlineStack>
            <Button tone="critical" onClick={confirmDelete}>Yes</Button>
            <Button onClick={() => setItemToDelete(null)}>No</Button>
          </InlineStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}