# 🛒 Shopify Delivery Date Selector

This Shopify app allows merchants to manage delivery restrictions by disabling:
- Specific days of the week
- Specific calendar dates
- Custom date ranges

These settings are saved in a metafield and used to validate checkout dates through a Checkout UI Extension.

---

## 🧠 Features

- ✅ Admin dashboard built with **Remix, TypeScript, and React**
- 📆 Custom UI for selecting blocked weekdays, dates, and ranges
- 🔒 Dates validated in **Checkout UI Extension**
- 🧩 Settings persisted using Shopify **metafields**
- 🧪 Draft-safe architecture and API
- 🔄 Works with `@shopify/ui-extensions-react/checkout`

---

## 🚀 How It Works

### 1. Admin Panel
Merchants can:
- Toggle weekdays to block (e.g. disable all Sundays)
- Add/remove single calendar dates
- Add/remove date ranges (e.g. block a whole week)

All selected data is saved in a metafield (`delivery_settings.config`).

### 2. Checkout Extension
- The extension reads the metafield and disables matching dates.
- If a customer selects an invalid date, the checkout is **blocked** with a message.

---

## 🛠️ Technologies

- 🧠 **React + TypeScript**
- 💨 Remix
- 🧩 Shopify Polaris for admin UI
- 📦 Shopify UI Extensions API
- 🧾 Metafield Storage (JSON)

---

## 🧪 Metafield Spec

Namespace: `delivery_settings` 
Key: `config` 
Type: `json`

```json
{
  "blockedSpecificDates": ["2025-06-18", "2025-06-25"],
  "blockedDays": [0, 5], // Sunday, Friday
  "blockedRanges": [
    { "start": "2025-06-18", "end": "2025-06-25" }
  ]
}
```

---

## ⚠️ Known Limitation

The Checkout UI Extension is not currently rendered in the checkout preview due to potential restrictions in live vs. draft configuration behavior.

### Hypothesis:
> "If a checkout profile is already live, Shopify may ignore new draft extensions unless that profile is explicitly switched to use the draft."

---

## 🔎 Troubleshooting Attempts

- Verified correct `shopify.extension.toml` `target`
- Verified metafield accessibility
- CLI deploys without error
- Preview is not reflecting UI extension on checkout
- Draft configuration is not being rendered despite being updated

---

## 📸 Screenshots

- Admin dashboard with blocked days
- Date range editor modal

---

## ✨ Improvements for Production

- Toggle to **enable/disable** the feature
- Better alignment with **Figma design**

---

## 🧾 Scripts

```bash
# Development
shopify app dev

# Deploy
shopify app deploy
```

---

## 📂 File Structure

```
test-assessment/
├── app/routes/app._index.tsx        # Admin panel (Remix route)
├── extensions/delivery-date-selector/src/Checkout.tsx  # UI Extension
├── shopify.extension.toml           # Extension config
├── shopify.app.toml                 # App config
```

## 🚀 How It Works

### 1. Admin Dashboard
Merchants can:
- Select **days** to disable (via buttons)
- Add or remove **individual dates**
- Add or remove **date ranges**
- Save the configuration to a **Shopify metafield**

### 2. Checkout UI Extension
- Injects a date selector into the checkout
- Blocks past dates, disabled days, ranges, and specific dates
- Prevents checkout submission if a blocked date is selected
- Metafield values are loaded dynamically

---

## 🧪 How to Run

### Development
```bash
shopify app dev
```
### Build & Deploy Extension 
```bash
shopify app deploy
```
---

## ⚠️ Known Issue
Despite correct metafield configuration and extension bundling, the Checkout UI Extension is not rendering in the checkout. This is likely due to Shopify's current restriction on using purchase.checkout.block.render in draft configurations, or due to an existing live checkout configuration conflicting with the extension.

### Troubleshooting Attempts
- Verified correct shopify.extension.toml target
- Verified metafield accessibility
- CLI deploys without error
- Preview is not reflecting UI extension on checkout
- Draft configuration is not being rendered despite being updated

## ⚠️ setup-metafield-definition.tsx — Initialization Utility

This optional route is intended to **create the metafield definition** `delivery_settings.config` programmatically.

- 🛠️ **Use it only once per development store** to initialize the JSON metafield used in both the Admin and Checkout UI.
- 🔐 It sets proper access scopes: `MERCHANT_READ_WRITE` for Admin, and `PUBLIC_READ` for Storefront.
- 🚫 This file is **not meant to be deployed in production**, and should remain **commented out** to avoid accidental execution.
- ✅ Once the metafield definition is created, your app will be able to read/write delivery configuration data.

To use it:
1. Uncomment the file.
2. Visit the route in the browser while your app is running.
3. Comment it again after use.

---

## 👤 Author 
Auristela Diaz 

## 📜 License 
This project was developed as part of a technical assessment and is not licensed for commercial use without permission.
