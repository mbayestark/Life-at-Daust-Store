/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as clearAllData from "../clearAllData.js";
import type * as clearProducts from "../clearProducts.js";
import type * as collections from "../collections.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as naboopay from "../naboopay.js";
import type * as orders from "../orders.js";
import type * as products from "../products.js";
import type * as seedCollections from "../seedCollections.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  clearAllData: typeof clearAllData;
  clearProducts: typeof clearProducts;
  collections: typeof collections;
  files: typeof files;
  http: typeof http;
  naboopay: typeof naboopay;
  orders: typeof orders;
  products: typeof products;
  seedCollections: typeof seedCollections;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
