import { injectable } from "inversify";
import {
  transformGraphDeviceToSyncInput,
  type GraphIntuneDevice,
} from "@/lib/schemas/graph-intune-device.schema";
import type {
  IIntuneDeviceMapperService,
  IntuneDeviceSyncInput,
} from "@/core/services/intune-device-mapper.service.interface";

@injectable()
export class IntuneDeviceMapperService implements IIntuneDeviceMapperService {
  transformGraphDeviceToSyncInput(
    device: GraphIntuneDevice,
  ): IntuneDeviceSyncInput {
    return transformGraphDeviceToSyncInput(device);
  }
}
