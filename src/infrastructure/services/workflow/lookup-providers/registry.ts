import { injectable, multiInject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type {
  ILookupProvider,
  ILookupProviderRegistry,
} from "@/core/domain/workflow/lookup-provider.interface";

@injectable()
export class LookupProviderRegistry implements ILookupProviderRegistry {
  private readonly map: Map<string, ILookupProvider>;

  constructor(
    @multiInject(DI_TOKENS.IWorkflowLookupProvider)
    providers: ILookupProvider[],
  ) {
    this.map = new Map(providers.map((p) => [p.key, p]));
  }

  get(key: string): ILookupProvider {
    const provider = this.map.get(key);
    if (!provider) {
      throw new Error(
        `LookupProviderRegistry: no provider registered for key "${key}".`,
      );
    }
    return provider;
  }

  has(key: string): boolean {
    return this.map.has(key);
  }

  keys(): string[] {
    return [...this.map.keys()];
  }
}
