/**
 * JSON expression DSL used by:
 *  - Computed fields
 *  - Field visibility rules
 *  - Conditional Branch step routing
 *  - Scored Matrix routing
 *  - SLA "until" expressions
 *
 * Deterministic, side-effect-free, not Turing-complete.
 */

export type Expression =
  | LiteralExpr
  | FieldExpr
  | NowExpr
  | UnaryExpr
  | BinaryExpr
  | LogicalExpr
  | InExpr
  | DateAddExpr;

export interface LiteralExpr {
  const: string | number | boolean | null;
}

export interface FieldExpr {
  field: string;
}

export interface NowExpr {
  now: true;
}

export interface UnaryExpr {
  not: Expression;
}

export interface BinaryExpr {
  op: "==" | "!=" | "<" | "<=" | ">" | ">=" | "+" | "-" | "*" | "/";
  left: Expression;
  right: Expression;
}

export interface LogicalExpr {
  and?: Expression[];
  or?: Expression[];
}

export interface InExpr {
  in: { value: Expression; list: Expression[] };
}

export interface DateAddExpr {
  addDays: { date: Expression; days: Expression };
}

export interface ExpressionContext {
  fields: Record<string, unknown>;
  /** ISO timestamp; if omitted, runtime now() is used. */
  now?: Date;
}
