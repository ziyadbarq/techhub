import { injectable } from "inversify";
import {
  isInternalUser,
  transformGraphUserToPerson,
} from "@/lib/schemas/graph-user.schema";
import type {
  GraphUser,
  IGraphUserMapperService,
  TransformGraphUserOptions,
} from "@/core/services/graph-user-mapper.service.interface";

@injectable()
export class GraphUserMapperService implements IGraphUserMapperService {
  isInternalUser(user: GraphUser): boolean {
    return isInternalUser(user);
  }

  transformGraphUserToPerson(
    user: GraphUser,
    options: TransformGraphUserOptions,
  ) {
    return transformGraphUserToPerson(user, options);
  }
}
