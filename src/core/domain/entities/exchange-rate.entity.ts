/**
 * Exchange Rate Domain Entity
 * Multi-currency support - stores exchange rates to SAR (Saudi Riyal)
 */

import { CURRENCY_CODES } from "@/lib/currencies.config";

export interface ExchangeRateProps {
  id: string;
  currency: string; // 3-letter ISO code (USD, EUR, GBP, etc. - SAR is base currency and not stored)
  rateToSAR: number; // 1 CURRENCY = X SAR
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExchangeRateProps {
  currency: string;
  rateToSAR: number;
  isActive?: boolean;
}

export class ExchangeRate {
  private constructor(private props: ExchangeRateProps) {}

  /**
   * Factory method: Create a new exchange rate
   */
  static create(props: CreateExchangeRateProps): ExchangeRate {
    // Validation
    ExchangeRate.validateCurrency(props.currency);
    ExchangeRate.validateRate(props.rateToSAR);

    const now = new Date();

    return new ExchangeRate({
      id: "", // Will be set by repository
      currency: props.currency.trim().toUpperCase(),
      rateToSAR: props.rateToSAR,
      isActive: props.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Factory method: Reconstitute from persistence
   */
  static reconstitute(props: ExchangeRateProps): ExchangeRate {
    return new ExchangeRate(props);
  }

  /**
   * Update exchange rate details
   */
  update(props: { rateToSAR?: number; isActive?: boolean }): void {
    if (props.rateToSAR !== undefined) {
      ExchangeRate.validateRate(props.rateToSAR);
      this.props.rateToSAR = props.rateToSAR;
    }

    if (props.isActive !== undefined) {
      this.props.isActive = props.isActive;
    }

    this.props.updatedAt = new Date();
  }

  /**
   * Deactivate this exchange rate
   */
  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  /**
   * Activate this exchange rate
   */
  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  // Business Rules & Validation

  private static validateCurrency(currency: string): void {
    if (!currency || currency.trim().length === 0) {
      throw new Error("Currency code cannot be empty");
    }

    const currencyUpper = currency.trim().toUpperCase();

    // SAR is the base currency and should not have an exchange rate entry
    if (currencyUpper === "SAR") {
      throw new Error("Cannot create exchange rate for SAR (base currency)");
    }

    // Must be exactly 3 letters
    if (currencyUpper.length !== 3) {
      throw new Error("Currency code must be exactly 3 letters (ISO 4217)");
    }

    // Must be alphabetic
    if (!/^[A-Z]{3}$/.test(currencyUpper)) {
      throw new Error("Currency code must contain only letters");
    }

    // Validate against supported currencies
    if (
      !CURRENCY_CODES.includes(currencyUpper as (typeof CURRENCY_CODES)[number])
    ) {
      throw new Error(
        `Currency code '${currencyUpper}' is not supported. Supported currencies: ${CURRENCY_CODES.join(", ")}`,
      );
    }
  }

  private static validateRate(rate: number): void {
    if (rate === undefined || rate === null) {
      throw new Error("Exchange rate cannot be empty");
    }

    if (typeof rate !== "number" || isNaN(rate)) {
      throw new Error("Exchange rate must be a valid number");
    }

    if (rate <= 0) {
      throw new Error("Exchange rate must be greater than zero");
    }

    if (rate > 999999) {
      throw new Error("Exchange rate is too large (max: 999999)");
    }

    // Validate precision (max 6 decimal places)
    if (Math.abs(rate * 1_000_000 - Math.floor(rate * 1_000_000)) > 0) {
      throw new Error("Exchange rate cannot have more than 6 decimal places");
    }
  }

  /**
   * Convert an amount to SAR using this exchange rate
   */
  convertToSAR(amount: number): number {
    if (amount === undefined || amount === null) {
      throw new Error("Amount cannot be empty");
    }

    if (typeof amount !== "number" || isNaN(amount)) {
      throw new Error("Amount must be a valid number");
    }

    if (amount < 0) {
      throw new Error("Amount cannot be negative");
    }

    return amount * this.props.rateToSAR;
  }

  /**
   * Check if this rate is for SAR (should always be 1.0)
   */
  isSAR(): boolean {
    return this.props.currency === "SAR";
  }

  // Getters

  get id(): string {
    return this.props.id;
  }

  get currency(): string {
    return this.props.currency;
  }

  get rateToSAR(): number {
    return this.props.rateToSAR;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Internal setters (for repository use)

  setId(id: string): void {
    if (this.props.id) {
      throw new Error("Cannot change exchange rate ID after it has been set");
    }
    this.props.id = id;
  }

  setUpdatedAt(date: Date): void {
    this.props.updatedAt = date;
  }

  /**
   * Convert to plain object for persistence
   */
  toObject(): ExchangeRateProps {
    return { ...this.props };
  }

  /**
   * Compare with another exchange rate
   */
  equals(other: ExchangeRate): boolean {
    return this.props.id === other.id;
  }
}
