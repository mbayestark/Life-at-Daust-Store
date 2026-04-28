import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "expire stale pending-payment orders",
  { hours: 1 },
  internal.orders.expireStaleOrders
);

export default crons;
