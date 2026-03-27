import { describe, expect, it } from "vitest";
import { extractResourceId, extractResourceName } from "../oci-service-mapping";

describe("oci-service-mapping", () => {
  describe("extractResourceId", () => {
    it("creates bounded deterministic CI keys for buckets", () => {
      const compartmentId =
        "ocid1.compartment.oc1..aaaaaaaamxag2nf6hnuvd4nhsl5iwm2wllea5s7qn4e2unm7iwdztkviybza";
      const rawBucket = {
        namespace: "axbp9ow0rohq",
        name: "uat-pci-infra-shutdown-turnon-bucket",
      };

      const first = extractResourceId("buckets", rawBucket, compartmentId);
      const second = extractResourceId("buckets", rawBucket, compartmentId);

      expect(first).toBe(second);
      expect(first.length).toBeLessThanOrEqual(100);
      expect(first).toMatch(/^oci\.bucket\.[a-f0-9]{40}$/);
    });

    it("preserves OCI ids that already satisfy ciKey validation", () => {
      const rawCompute = {
        id: "ocid1.instance.oc1.me-jeddah-1.anvgkljrmkbxdmqcely3kencfq6yqjdzpojfcvpw7hzppopaaoy43iez3x2q",
      };

      expect(extractResourceId("compute", rawCompute, "ignored")).toBe(
        rawCompute.id,
      );
    });

    it("hashes OCI ids that exceed the CMDB ciKey limit", () => {
      const rawNlb = {
        id: "ocid1.networkloadbalancer.oc1.me-jeddah-1.amaaaaaamkbxdmqanrgn3sx77hwqrlxrkhscaleltul7d52zdnmtmtizyhha",
      };

      const first = extractResourceId("nlb", rawNlb, "ignored");
      const second = extractResourceId("nlb", rawNlb, "ignored");

      expect(first).toBe(second);
      expect(first.length).toBeLessThanOrEqual(100);
      expect(first).toMatch(/^oci\.nlb\.[a-f0-9]{40}$/);
    });
  });

  describe("extractResourceName", () => {
    it("trims leading and trailing whitespace from OCI resource names", () => {
      expect(
        extractResourceName({
          "display-name": "  dr-orcale-crm-gsh ",
        }),
      ).toBe("dr-orcale-crm-gsh");
    });
  });
});
