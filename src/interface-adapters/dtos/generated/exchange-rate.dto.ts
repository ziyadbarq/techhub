/**
 * Exchange Rate DTOs
 * Zod schemas for validating Exchange Rate inputs
 */

import { z } from "zod";
import { CURRENCY_CODES } from "@/lib/currencies.config";

const SUPPORTED_CURRENCIES = CURRENCY_CODES;

export const CreateExchangeRateSchema = z.object({
  currency: z
    .string()
    .length(3, "Currency code must be exactly 3 letters")
    .regex(/^[A-Z]{3}$/, "Currency code must contain only uppercase letters")
    .refine(
      (val) =>
        SUPPORTED_CURRENCIES.includes(
          val as (typeof SUPPORTED_CURRENCIES)[number],
        ),
      {
        message: `Currency must be one of: ${SUPPORTED_CURRENCIES.join(", ")}`,
      },
    ),
  rateToSAR: z
    .number({ message: "Exchange rate must be a number" })
    .positive("Exchange rate must be greater than zero")
    .max(999999, "Exchange rate is too large (max: 999999)")
    .refine(
      (val) => {
        const decimalPlaces = val.toString().split(".")[1]?.length || 0;
        return decimalPlaces <= 6;
      },
      {
        message: "Exchange rate cannot have more than 6 decimal places",
      },
    ),
  isActive: z.boolean().default(true),
});

export type CreateExchangeRateDTO = z.infer<typeof CreateExchangeRateSchema>;

export const UpdateExchangeRateSchema = z.object({
  id: z.string().min(1, "ID is required"),
  rateToSAR: z
    .number({ message: "Exchange rate must be a number" })
    .positive("Exchange rate must be greater than zero")
    .max(999999, "Exchange rate is too large (max: 999999)")
    .refine(
      (val) => {
        const decimalPlaces = val.toString().split(".")[1]?.length || 0;
        return decimalPlaces <= 6;
      },
      {
        message: "Exchange rate cannot have more than 6 decimal places",
      },
    )
    .optional(),
  isActive: z.boolean().optional(),
});

export type UpdateExchangeRateDTO = z.infer<typeof UpdateExchangeRateSchema>;

export const ConvertCurrencySchema = z.object({
  amount: z
    .number({ message: "Amount must be a number" })
    .nonnegative("Amount cannot be negative"),
  fromCurrency: z
    .string()
    .length(3, "Currency code must be exactly 3 letters")
    .regex(/^[A-Z]{3}$/, "Currency code must contain only uppercase letters")
    .refine(
      (val) =>
        SUPPORTED_CURRENCIES.includes(
          val as (typeof SUPPORTED_CURRENCIES)[number],
        ),
      {
        message: `Currency must be one of: ${SUPPORTED_CURRENCIES.join(", ")}`,
      },
    ),
});

export type ConvertCurrencyDTO = z.infer<typeof ConvertCurrencySchema>;

// Response DTOs (for presentation layer)
export interface ExchangeRateResponseDTO {
  id: string;
  currency: string;
  rateToSAR: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConvertCurrencyResponseDTO {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  convertedCurrency: string;
  exchangeRate: number;
}
