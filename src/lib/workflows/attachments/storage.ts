import "server-only";
import {
  createPrivateFileStorage,
  type PrivateFileStorage,
} from "@/lib/storage/private-file-storage";

/**
 * Private storage for request attachments (GCS, or a dev-only private folder).
 *
 * Kept apart from `./server` (request access checks) so the background
 * worker can use it without pulling in session and permission helpers.
 */
export function workflowFileStorage(): PrivateFileStorage {
  return createPrivateFileStorage({
    devDir: ".workflow-uploads-dev",
    devPrefix: "wf-dev",
  });
}
