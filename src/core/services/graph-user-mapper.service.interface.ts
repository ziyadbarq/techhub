import type {
  GraphUser as LibGraphUser,
  TransformGraphUserOptions as LibTransformOptions,
  SyncResult as LibSyncResult,
  PersonSyncInput,
} from "@/lib/schemas/graph-user.schema";

export type GraphUser = LibGraphUser;
export type TransformGraphUserOptions = LibTransformOptions;
export type SyncResult = LibSyncResult;

export interface IGraphUserMapperService {
  isInternalUser(user: GraphUser): boolean;
  transformGraphUserToPerson(
    user: GraphUser,
    options: TransformGraphUserOptions,
  ): PersonSyncInput;
}
