import type {
  FetchDevicesOptions as LibFetchDevicesOptions,
  GraphIntuneDevice as LibGraphIntuneDevice,
  transformGraphDeviceToSyncInput,
} from "@/lib/schemas/graph-intune-device.schema";

export type GraphIntuneDevice = LibGraphIntuneDevice;
export type FetchDevicesOptions = LibFetchDevicesOptions;
export type IntuneFetchDevicesOptions = LibFetchDevicesOptions;
export type IntuneDeviceSyncInput = ReturnType<
  typeof transformGraphDeviceToSyncInput
>;

export interface IIntuneDeviceMapperService {
  transformGraphDeviceToSyncInput(
    device: GraphIntuneDevice,
  ): IntuneDeviceSyncInput;
}
