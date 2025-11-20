/**
 * Service Interfaces Barrel Export
 *
 * This file exports all service interfaces from the core layer.
 * Services define contracts for infrastructure implementations.
 */

// AI Services
export type { IAIContentGeneratorService } from "./ai-content-generator.service.interface";
export type { IAIPromptManagerService } from "./ai-prompt-manager.service.interface";
export type { IAIDebugTraceService } from "./ai-debug-trace.service.interface";

// File Storage Service
export type {
  IFileStorageService,
  FileEncoding,
} from "./file-storage.service.interface";

// Logger Service
export type {
  ILoggerService,
  LogLevel,
  PerformanceTimer,
  AuditLogEntry,
} from "./logger.service.interface";

// CSV Service
export type {
  ICSVService,
  CSVExportOptions,
  CSVImportOptions,
  CSVImportResult,
} from "./csv.service.interface";

// AI Content Generator Types
export type {
  AIGenerationResult,
  OutlineGenerationInput,
  PresentationOutline,
  SlideOutline,
  ClickAnimation,
  SlideContentGenerationInput,
  GeneratedSlide,
  CodeBlockMetadata,
  Diagram,
  SlideTransition,
  ElementAnimation,
  SlideRefinementInput,
  ThemeRecommendation,
  QualityReview,
} from "./ai-content-generator.service.interface";

// Real-time Services
export type {
  ISSEService,
  SSEEvent,
  SSEStreamOptions,
} from "./sse.service.interface";
export type {
  IRealtimeService,
  IRealtimePresenceService,
  RealtimeMessage,
  RoomParticipant,
  RoomInfo,
  PresenceInfo,
  ConnectionState,
} from "./realtime.service.interface";

// Email Service
export type {
  IEmailService,
  EmailMessage,
  EmailAttachment,
  SendEmailResult,
} from "./email.service.interface";
