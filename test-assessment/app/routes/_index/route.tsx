import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";

import { login } from "../../shopify.server";

import styles from "./styles.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData<typeof loader>();

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>Delivery Date Selector for Shopify</h1>
        <p className={styles.text}>
          Easily manage delivery availability by disabling specific days and date ranges.
        </p>

        {showForm && (
          <Form className={styles.form} method="post" action="/auth/login">
            <label className={styles.label}>
              <span>Shop domain</span>
              <input
                className={styles.input}
                type="text"
                name="shop"
                defaultValue="auri-assessment-fresh-store.myshopify.com"
              />
              <span>e.g: my-shop-domain.myshopify.com</span>
            </label>
            <button className={styles.button} type="submit">
              Install App
            </button>
          </Form>
        )}

        <ul className={styles.list}>
          <li>
            <strong>Disable weekdays</strong>. Block deliveries on specific days of the week.
          </li>
          <li>
            <strong>Block custom dates</strong>. Disable one or more calendar days.
          </li>
          <li>
            <strong>Set date ranges</strong>. Prevent deliveries during vacations or holidays.
          </li>
        </ul>
      </div>
    </div>
  );
}
