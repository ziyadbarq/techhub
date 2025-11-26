/**
 * Employee Directory Use Cases
 * Barrel export for all employee directory use cases
 */

export { ListEmployeeDirectoryUseCase } from "./list-employee-directory.use-case";
export type {
  ListEmployeeDirectoryInput,
  ListEmployeeDirectoryOutput,
} from "./list-employee-directory.use-case";

export { GetReportingChainUseCase } from "./get-reporting-chain.use-case";
export type {
  GetReportingChainInput,
  GetReportingChainOutput,
} from "./get-reporting-chain.use-case";

export { GetDirectReportsUseCase } from "./get-direct-reports.use-case";
export type {
  GetDirectReportsInput,
  GetDirectReportsOutput,
} from "./get-direct-reports.use-case";

export { GetRootEmployeesUseCase } from "./get-root-employees.use-case";
export type { GetRootEmployeesOutput } from "./get-root-employees.use-case";
