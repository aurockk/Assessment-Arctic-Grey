// import { authenticate } from "../shopify.server";
// import type { LoaderFunctionArgs } from "@remix-run/node";

/**
 * This route creates the metafield definition `delivery_settings.config`
 * if it doesn't already exist.
 * 
 * 🛠️ It should be used only once per development store.
 * ⚠️ Not for production use.
 */
// export async function loader({ request }: LoaderFunctionArgs) {
//   const { admin } = await authenticate.admin(request);

//   // Step 1: Check if the metafield definition already exists
//   const check = await admin.graphql(`
//     query {
//       metafieldDefinitions(first: 1, namespace: "delivery_settings", key: "config") {
//         edges {
//           node {
//             id
//             name
//           }
//         }
//       }
//     }
//   `);

//   const checkJson = await check.json();
//   const existing = checkJson?.data?.metafieldDefinitions?.edges?.[0]?.node;

//   if (existing) {
//     console.log("✅ Metafield definition already exists:", existing.name);
//     return new Response("Metafield definition already exists");
//   }

//   // Step 2: Create the metafield definition
//   const response = await admin.graphql(`
//     mutation {
//       metafieldDefinitionCreate(definition: {
//         name: "Delivery Settings",
//         namespace: "delivery_settings",
//         key: "config",
//         type: "json",
//         ownerType: SHOP,
//         access: {
//           admin: MERCHANT_READ_WRITE,
//           storefront: PUBLIC_READ
//         }
//       }) {
//         createdDefinition {
//           id
//         }
//         userErrors {
//           field
//           message
//         }
//       }
//     }
//   `);

//   const json = await response.json();
//   console.log("📦 Result:", JSON.stringify(json, null, 2));

//   return new Response("Metafield definition created successfully");
// }
