/**
 * Security & Authentication Services Seed Configuration
 *
 * Defines authentication, identity management, and security services.
 * Includes Active Directory, Keycloak, Auth Service, Vault, PAM, and SIEM.
 */

export const SECURITY_SERVICES = [
  // Authentication & Identity
  {
    name: "Active Directory",
    serviceType: "APPLICATION" as const,
    description:
      "Microsoft Active Directory for employee authentication and directory services",
    businessPurpose: "Central employee identity and access management",
    dataConfidentiality: "RESTRICTED" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "CRITICAL" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    vendorCode: "MSFT",
    businessProcessCode: "IDENTITY_MGMT",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Omar Al-Shehri",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "ON_PREM" as const,
      region: "Riyadh",
      ipAddress: "10.0.1.10",
      hostname: "ad-dc01.barq.local",
      backupEnabled: true,
      backupSchedule: "daily",
    },
  },
  {
    name: "Keycloak",
    serviceType: "APPLICATION" as const,
    description:
      "Open-source identity and access management for customer authentication",
    businessPurpose:
      "Provides SSO and identity federation for customer-facing applications",
    gitlabRepoUrl: "https://gitlab.barq.com/infra/keycloak",
    dataConfidentiality: "RESTRICTED" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "CRITICAL" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "IDENTITY_MGMT",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Noura Al-Rashid",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-security",
    },
  },
  {
    name: "Auth Service",
    serviceType: "APPLICATION" as const,
    description:
      "Custom authentication service with OTP, biometric, and device fingerprinting",
    businessPurpose: "Multi-factor authentication for enhanced security",
    gitlabRepoUrl: "https://gitlab.barq.com/security/auth-service",
    dataConfidentiality: "RESTRICTED" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "CRITICAL" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "ACCESS_CONTROL",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Omar Al-Shehri",
        isPrimary: true,
      },
      {
        type: "PRODUCT" as const,
        personName: "Noura Al-Rashid",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-security",
    },
  },

  // Security & Compliance Tools
  {
    name: "Vault Secrets Management",
    serviceType: "APPLICATION" as const,
    description: "HashiCorp Vault for secrets and encryption key management",
    businessPurpose: "Centralized secrets management and encryption",
    gitlabRepoUrl: "https://gitlab.barq.com/security/vault",
    dataConfidentiality: "RESTRICTED" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "CRITICAL" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "ACCESS_CONTROL",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Noura Al-Rashid",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-security",
    },
  },
  {
    name: "Splunk SIEM",
    serviceType: "APPLICATION" as const,
    description: "Splunk for security information and event management",
    businessPurpose: "Security monitoring and compliance reporting",
    dataConfidentiality: "RESTRICTED" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "HIGH" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "COMPLIANCE_AUDIT",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Aisha Al-Malki",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "ON_PREM" as const,
      region: "Riyadh",
    },
  },
  {
    name: "CyberArk PAM",
    serviceType: "APPLICATION" as const,
    description: "CyberArk Privileged Access Management",
    businessPurpose:
      "Manages and secures privileged access to critical systems",
    dataConfidentiality: "RESTRICTED" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "HIGH" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "ACCESS_CONTROL",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Omar Al-Shehri",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "ON_PREM" as const,
      region: "Riyadh",
      hostname: "cyberark01.barq.local",
    },
  },

  // Network Security
  {
    name: "Cisco Firewall",
    serviceType: "NETWORK" as const,
    description: "Cisco ASA firewall for network security",
    businessPurpose: "Network perimeter security and traffic filtering",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "CRITICAL" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    vendorCode: "CISCO",
    businessProcessCode: "ACCESS_CONTROL",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Mohammed Al-Qarni",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "ON_PREM" as const,
      region: "Riyadh",
      ipAddress: "10.0.0.1",
      hostname: "fw01.barq.local",
    },
  },
  {
    name: "VPN Gateway",
    serviceType: "NETWORK" as const,
    description: "VPN gateway for secure remote access",
    businessPurpose: "Enables secure remote access for employees",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "HIGH" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "ACCESS_CONTROL",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Saud Al-Ajmi",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "ON_PREM" as const,
      region: "Riyadh",
      ipAddress: "10.0.0.5",
      hostname: "vpn01.barq.local",
    },
  },
] as const;
