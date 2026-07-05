"use server";

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { 
  fetchWalletFromDb, 
  fetchServicesFromDb, 
  executeBookingInDb, 
  checkConnectionStatus, 
  resetDbState, 
  fetchTableRows, 
  updateWalletBalanceInDb,
  registerUser,
  loginUser
} from "./db";

export const getDbWallet = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ email: z.string().optional() }).optional().parse(d || {}))
  .handler(async ({ data }) => {
    return await fetchWalletFromDb(data?.email);
  });

export const getDbServices = createServerFn({ method: "GET" })
  .handler(async () => {
    return await fetchServicesFromDb();
  });

export const executeDbBooking = createServerFn({ method: "POST" })
  .validator((d: unknown) => 
    z.object({ serviceId: z.number(), amount: z.number(), email: z.string().optional() }).parse(d)
  )
  .handler(async ({ data }) => {
    return await executeBookingInDb(data.serviceId, data.amount, data.email);
  });

export const checkDbConnection = createServerFn({ method: "GET" })
  .handler(async () => {
    return await checkConnectionStatus();
  });

export const resetDb = createServerFn({ method: "POST" })
  .handler(async () => {
    return await resetDbState();
  });

export const getDbTableRows = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ tableName: z.string() }).parse(d))
  .handler(async ({ data }) => {
    return await fetchTableRows(data.tableName);
  });

export const updateDbWalletBalance = createServerFn({ method: "POST" })
  .validator((d: unknown) => 
    z.object({ newBalance: z.number(), email: z.string().optional() }).parse(d)
  )
  .handler(async ({ data }) => {
    return await updateWalletBalanceInDb(data.newBalance, data.email);
  });

export const registerDbUser = createServerFn({ method: "POST" })
  .validator((d: unknown) => 
    z.object({ email: z.string(), password: z.string() }).parse(d)
  )
  .handler(async ({ data }) => {
    if (!data) throw new Error("Invalid signup data.");
    return await registerUser(data.email, data.password);
  });

export const loginDbUser = createServerFn({ method: "POST" })
  .validator((d: unknown) => 
    z.object({ email: z.string(), password: z.string() }).parse(d)
  )
  .handler(async ({ data }) => {
    if (!data) throw new Error("Invalid login data.");
    return await loginUser(data.email, data.password);
  });
