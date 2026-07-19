/**
 * Unit of Work Service Interface
 *
 * Runs a piece of work atomically: either every repository write inside the
 * callback commits, or none do. Use cases inject this (never a database
 * client) whenever they perform multiple writes, or a check-then-write that
 * must not race with concurrent requests.
 */

export interface IUnitOfWork {
  /**
   * Executes `work` inside a single atomic transaction. Repository calls made
   * within the callback (directly or through other injected services) share
   * the transaction. Nested `execute` calls join the outer transaction.
   *
   * @throws Rethrows any error from `work` after rolling back.
   */
  execute<T>(work: () => Promise<T>): Promise<T>;
}
