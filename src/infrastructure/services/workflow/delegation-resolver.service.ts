import { injectable } from "inversify";

import type { Tx } from "@/core/repositories/workflow";

const MAX_CHAIN_DEPTH = 3;

export interface DelegationResolution {
  resolved: string[];
  chains: Record<string, string[]>;
}

/**
 * Delegation resolver interface
 */
export interface IDelegationResolver {
  /**
   * Out-of-office / delegation resolution. When a user has an active delegation
   * (now ∈ [startsAt, endsAt] and isActive=true), assignment redirects to the
   * delegate. Chains follow up to 3 hops and short-circuit on cycles.
   *
   * Returns: the final user list AFTER delegation, plus a per-user chain
   * showing the original→...→final hops for the AssigneeSnapshot record.
   */
  applyDelegations(
    tx: Tx,
    userIds: string[],
    now?: Date,
  ): Promise<DelegationResolution>;
}

@injectable()
export class DelegationResolverService implements IDelegationResolver {
  async applyDelegations(
    tx: Tx,
    userIds: string[],
    now: Date = new Date(),
  ): Promise<DelegationResolution> {
    const chains: Record<string, string[]> = {};
    const resolvedSet = new Set<string>();

    for (const original of userIds) {
      const chain = [original];
      let current = original;
      const seen = new Set<string>([original]);

      for (let hop = 0; hop < MAX_CHAIN_DEPTH; hop++) {
        const delegation = await tx.delegation.findFirst({
          where: {
            fromUserId: current,
            isActive: true,
            startsAt: { lte: now },
            OR: [{ endsAt: null }, { endsAt: { gte: now } }],
          },
          select: { toUserId: true },
          orderBy: { createdAt: "desc" },
        });
        if (!delegation || seen.has(delegation.toUserId)) break;
        chain.push(delegation.toUserId);
        seen.add(delegation.toUserId);
        current = delegation.toUserId;
      }

      resolvedSet.add(current);
      if (chain.length > 1) chains[current] = chain;
    }

    return { resolved: [...resolvedSet], chains };
  }
}
