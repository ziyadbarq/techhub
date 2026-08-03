import { injectable } from "inversify";

import type {
  BinaryExpr,
  DateAddExpr,
  Expression,
  ExpressionContext,
  InExpr,
  LogicalExpr,
} from "@/core/domain/workflow";

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Expression evaluator service interface.
 *
 * Evaluates the workflow JSON expression DSL used by:
 *  - Computed fields
 *  - Field visibility rules
 *  - Conditional Branch step routing
 *  - Scored Matrix routing
 *  - SLA "until" expressions
 */
export interface IExpressionEvaluator {
  evaluate(expr: Expression, ctx: ExpressionContext): unknown;
  evaluateBoolean(expr: Expression, ctx: ExpressionContext): boolean;
  evaluateNumber(expr: Expression, ctx: ExpressionContext): number;
}

@injectable()
export class ExpressionEvaluatorService implements IExpressionEvaluator {
  evaluate(expr: Expression, ctx: ExpressionContext): unknown {
    if (isObject(expr) && "const" in expr) return expr.const;
    if (isObject(expr) && "field" in expr) {
      return readField(ctx.fields, expr.field as string);
    }
    if (isObject(expr) && "now" in expr) return ctx.now ?? new Date();
    if (isObject(expr) && "not" in expr) {
      return !truthy(this.evaluate(expr.not as Expression, ctx));
    }

    if (isObject(expr) && ("and" in expr || "or" in expr)) {
      return this.evaluateLogical(expr as unknown as LogicalExpr, ctx);
    }
    if (isObject(expr) && "op" in expr) {
      return this.evaluateBinary(expr as unknown as BinaryExpr, ctx);
    }
    if (isObject(expr) && "in" in expr) {
      return this.evaluateIn(expr as unknown as InExpr, ctx);
    }
    if (isObject(expr) && "addDays" in expr) {
      return this.evaluateAddDays(expr as unknown as DateAddExpr, ctx);
    }

    throw new Error(`Unknown expression: ${JSON.stringify(expr)}`);
  }

  evaluateBoolean(expr: Expression, ctx: ExpressionContext): boolean {
    return truthy(this.evaluate(expr, ctx));
  }

  evaluateNumber(expr: Expression, ctx: ExpressionContext): number {
    const v = this.evaluate(expr, ctx);
    if (typeof v === "number") return v;
    if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
      return Number(v);
    }
    if (v instanceof Date) return v.getTime();
    throw new Error(`Expected numeric expression, got: ${JSON.stringify(v)}`);
  }

  private evaluateLogical(expr: LogicalExpr, ctx: ExpressionContext): boolean {
    if (expr.and) {
      for (const sub of expr.and) {
        if (!truthy(this.evaluate(sub, ctx))) return false;
      }
      return true;
    }
    if (expr.or) {
      for (const sub of expr.or) {
        if (truthy(this.evaluate(sub, ctx))) return true;
      }
      return false;
    }
    return false;
  }

  private evaluateBinary(expr: BinaryExpr, ctx: ExpressionContext): unknown {
    const left = this.evaluate(expr.left, ctx);
    const right = this.evaluate(expr.right, ctx);
    switch (expr.op) {
      case "==":
        return looseEqual(left, right);
      case "!=":
        return !looseEqual(left, right);
      case "<":
        return compare(left, right) < 0;
      case "<=":
        return compare(left, right) <= 0;
      case ">":
        return compare(left, right) > 0;
      case ">=":
        return compare(left, right) >= 0;
      case "+":
        return arithmetic(left, right, (a, b) => a + b);
      case "-":
        return arithmetic(left, right, (a, b) => a - b);
      case "*":
        return arithmetic(left, right, (a, b) => a * b);
      case "/":
        return arithmetic(left, right, (a, b) => a / b);
    }
  }

  private evaluateIn(expr: InExpr, ctx: ExpressionContext): boolean {
    const v = this.evaluate(expr.in.value, ctx);
    return expr.in.list.some((item) => looseEqual(this.evaluate(item, ctx), v));
  }

  private evaluateAddDays(expr: DateAddExpr, ctx: ExpressionContext): Date {
    const dateRaw = this.evaluate(expr.addDays.date, ctx);
    const days = this.evaluateNumber(expr.addDays.days, ctx);
    const date =
      dateRaw instanceof Date ? new Date(dateRaw) : new Date(String(dateRaw));
    date.setUTCDate(date.getUTCDate() + days);
    return date;
  }
}

function readField(fields: Record<string, unknown>, key: string): unknown {
  if (Object.prototype.hasOwnProperty.call(fields, key)) return fields[key];
  if (key.includes(".")) {
    return key.split(".").reduce<unknown>((acc, part) => {
      if (isObject(acc)) return acc[part];
      return undefined;
    }, fields);
  }
  return undefined;
}

function truthy(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0 && !Number.isNaN(v);
  if (typeof v === "string") return v.length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

function looseEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || a === undefined) return b === null || b === undefined;
  if (b === null || b === undefined) return false;
  if (typeof a === "number" && typeof b === "number") return a === b;
  return String(a) === String(b);
}

function compare(a: unknown, b: unknown): number {
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === "number" && typeof b === "number") return a - b;
  const sa = String(a);
  const sb = String(b);
  return sa < sb ? -1 : sa > sb ? 1 : 0;
}

function arithmetic(
  a: unknown,
  b: unknown,
  op: (x: number, y: number) => number,
): number {
  const na = typeof a === "number" ? a : Number(a);
  const nb = typeof b === "number" ? b : Number(b);
  if (Number.isNaN(na) || Number.isNaN(nb)) {
    throw new Error("Arithmetic requires numeric operands");
  }
  return op(na, nb);
}
