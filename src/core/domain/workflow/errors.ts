export class WorkflowEngineError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "WorkflowEngineError";
  }
}

export class NotFoundError extends WorkflowEngineError {
  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends WorkflowEngineError {
  constructor(message = "Forbidden") {
    super(message, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export class InvalidStateError extends WorkflowEngineError {
  constructor(message: string) {
    super(message, "INVALID_STATE");
    this.name = "InvalidStateError";
  }
}

export class ConfigurationError extends WorkflowEngineError {
  constructor(message: string) {
    super(message, "CONFIGURATION");
    this.name = "ConfigurationError";
  }
}

export class NotImplementedError extends WorkflowEngineError {
  constructor(feature: string) {
    super(`Not implemented: ${feature}`, "NOT_IMPLEMENTED");
    this.name = "NotImplementedError";
  }
}
