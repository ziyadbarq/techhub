/**
 * Asset Attachments Tab
 *
 * Holds documents tied to an asset - most commonly the signed delivery note
 * that the help desk scans after the employee signs the printed copy.
 */

"use client";

import { useCallback, useState } from "react";

import { AttachmentList } from "@/components/attachments/attachment-list";
import { AttachmentUploader } from "@/components/attachments/attachment-uploader";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { TargetObjectTypeEnum } from "@/generated/prisma";

/**
 * String literal rather than the generated enum object: a value import from
 * "@/generated/prisma" pulls the Prisma runtime (and sharp, via the DI graph)
 * into the browser bundle and breaks the production build.
 */
const ASSET_TARGET_TYPE: TargetObjectTypeEnum = "ASSET";

interface AssetAttachmentsTabProps {
  assetId: string;
  onChange?: () => void;
}

export function AssetAttachmentsTab({
  assetId,
  onChange,
}: AssetAttachmentsTabProps) {
  // Bumping this remounts the list so a fresh upload or delete shows up
  // without refetching the whole page.
  const [reloadKey, setReloadKey] = useState(0);

  const handleChanged = useCallback(() => {
    setReloadKey((key) => key + 1);
    onChange?.();
  }, [onChange]);

  return (
    <div className="space-y-6">
      <PermissionGuard permission={PERMISSIONS.ATTACHMENTS_CREATE}>
        <AttachmentUploader
          targetType={ASSET_TARGET_TYPE}
          targetId={assetId}
          onUploadComplete={handleChanged}
        />
      </PermissionGuard>

      <AttachmentList
        key={reloadKey}
        targetType={ASSET_TARGET_TYPE}
        targetId={assetId}
        onAttachmentDeleted={handleChanged}
      />
    </div>
  );
}
