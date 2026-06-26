import { cleanupAll } from "./lib";

// Runs once after the whole suite — removes every smoke_* user and smoke- vendor
// (and their menus/dishes/orders) so nothing test-related is left behind.
export default async function globalTeardown() {
  await cleanupAll();
}
