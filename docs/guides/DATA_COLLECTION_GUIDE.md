# TechHub Data Collection Guide

**For**: All Barq teams contributing to TechHub initial data population
**Purpose**: Help teams understand what data is needed and provide clear examples
**Audience**: Non-technical stakeholders, department managers, data owners

**Last Updated**: 2025-11-23

---

## Table of Contents

- [Introduction](#introduction)
- [How to Use This Guide](#how-to-use-this-guide)
- [Data Collection Overview](#data-collection-overview)
- [Step-by-Step Data Collection](#step-by-step-data-collection)
  - [Step 1: Company Structure & People](#step-1-company-structure--people)
  - [Step 2: Vendors & Suppliers](#step-2-vendors--suppliers)
  - [Step 3: Physical Locations](#step-3-physical-locations)
  - [Step 4: IT Assets](#step-4-it-assets)
  - [Step 5: Software & Licenses](#step-5-software--licenses)
  - [Step 6: Services & Applications](#step-6-services--applications)
  - [Step 7: Contracts](#step-7-contracts)
  - [Step 8: Governance & Compliance](#step-8-governance--compliance)
- [Data Templates](#data-templates)
- [Frequently Asked Questions](#frequently-asked-questions)

---

## Introduction

**What is TechHub?**

TechHub is Barq's new enterprise IT Asset Management (ITAM) and Configuration Management Database (CMDB) system. It will serve as the **single source of truth** for:

- IT assets (laptops, servers, network equipment, etc.)
- Software licenses and entitlements
- IT services and applications
- Vendor relationships and contracts
- Physical locations and organizational structure
- Employee technology assignments

**Why are we doing this?**

- **SAMA Compliance**: Meet Saudi Central Bank regulatory requirements
- **Cost Optimization**: Track asset lifecycle and reduce wasteful spending
- **Risk Management**: Ensure proper asset disposal, license compliance, and security
- **Operational Excellence**: Know what we have, where it is, and who's using it

**Who needs to contribute?**

Every department that owns or uses IT assets, services, or manages vendor relationships:
- **IT Operations**: Asset inventory, service catalog
- **Finance**: Vendor contracts, purchase orders, costs
- **HR**: Employee information, organizational structure
- **Facilities**: Physical locations, office layouts
- **Security & Compliance**: Data classification, ownership
- **Procurement**: Vendor details, purchasing history

---

## How to Use This Guide

**Step-by-Step Process**:

1. **Read the section** relevant to your department/role
2. **Review the examples** to understand the data format
3. **Collect the data** using the provided templates (Excel/CSV)
4. **Validate completeness** (check required vs optional fields)
5. **Submit data** to the TechHub implementation team

**Required vs Optional Fields**:

- ✅ **Required**: Minimum data needed for the system to function
- ❌ **Optional**: Nice-to-have data that enriches the system

**Color Coding**:
- 🔵 **Blue**: Foundation data (do this first)
- 🟢 **Green**: Core asset/service data (do this second)
- 🟡 **Yellow**: Advanced features (do this after core data)

---

## Data Collection Overview

TechHub organizes data into **layers**. Each layer builds on the previous one:

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Foundation (Who, Where, What Vendors)          │
│ ➜ People, Org Structure, Locations, Vendors             │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 2: Assets & Services (What We Own/Use)            │
│ ➜ Laptops, Servers, Applications, Databases             │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 3: Relationships (How Things Connect)             │
│ ➜ Asset Assignments, Service Dependencies               │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 4: Operations (How We Manage)                     │
│ ➜ Maintenance, Disposals, Reservations, Compliance      │
└─────────────────────────────────────────────────────────┘
```

**The order matters!** You can't assign a laptop to someone until we know who that person is.

---

## Step-by-Step Data Collection

### Step 1: Company Structure & People 🔵

**Who provides this**: HR, IT Admin
**Why it matters**: We need to know who works at Barq, their roles, and organizational structure

#### 1.1 Organization Units (Departments & Teams)

**What is it?** Your company hierarchy: Company → Business Units → Departments → Teams

**Example**:
```
Barq (Company)
├── Technology (Business Unit)
│   ├── Engineering (Department)
│   │   ├── Backend Team (Team)
│   │   └── Frontend Team (Team)
│   └── Infrastructure (Department)
│       ├── Cloud Team (Team)
│       └── Networks Team (Team)
├── Operations (Business Unit)
│   └── Customer Support (Department)
└── Finance (Business Unit)
```

**Required Fields**:
- ✅ **Name**: Technology, Engineering, Backend Team
- ✅ **Level**: 1 (Company), 2 (Business Unit), 3 (Department), 4 (Team)

**Optional Fields**:
- ❌ **Manager**: Who manages this unit
- ❌ **Cost Center**: Finance cost center code
- ❌ **Description**: What this unit does

**Excel Template**:

| Name | Level | Parent Unit | Manager | Cost Center | Description |
|------|-------|-------------|---------|-------------|-------------|
| Barq | 1 | - | CEO Name | - | Financial services company |
| Technology | 2 | Barq | CTO Name | CC-1000 | Technology division |
| Engineering | 3 | Technology | VP Eng Name | CC-1100 | Software engineering |
| Backend Team | 4 | Engineering | Backend Lead | CC-1110 | Backend development |

---

#### 1.2 Employees (People)

**What is it?** Everyone who works at Barq and needs IT assets or system access

**Required Fields**:
- ✅ **First Name**: Ahmed
- ✅ **Last Name**: Al-Rashid
- ✅ **Email**: ahmed.alrashid@barq.com
- ✅ **Department**: Engineering
- ✅ **Primary Role**: Software Engineer

**Optional Fields**:
- ❌ **Employee ID**: EMP-12345
- ❌ **Phone**: +966 11 234 5678
- ❌ **Mobile**: +966 50 123 4567
- ❌ **Job Title**: Senior Backend Engineer
- ❌ **Manager**: Manager's name
- ❌ **Office Location**: Riyadh HQ - Floor 3
- ❌ **Hire Date**: 2023-01-15
- ❌ **Status**: Active/Inactive

**Example**:

| First Name | Last Name | Email | Employee ID | Department | Job Title | Manager | Office Location | Hire Date |
|------------|-----------|-------|-------------|------------|-----------|---------|-----------------|-----------|
| Ahmed | Al-Rashid | ahmed.alrashid@barq.com | EMP-12345 | Engineering | Senior Backend Engineer | Khalid Al-Otaibi | Riyadh HQ - Floor 3 | 2023-01-15 |
| Fatima | Al-Salem | fatima.alsalem@barq.com | EMP-12346 | Customer Support | Support Specialist | Sara Al-Harbi | Riyadh HQ - Floor 2 | 2022-06-01 |

**Real-World Example**:
```
👤 Ahmed Al-Rashid
   Employee ID: EMP-12345
   Role: Senior Backend Engineer
   Department: Engineering > Backend Team
   Reports to: Khalid Al-Otaibi (Engineering Manager)
   Office: Riyadh HQ - Floor 3, Desk 342
   Assets: Laptop (ASSET-0042), iPhone (ASSET-0156)
```

---

#### 1.3 Physical Locations

**What is it?** Where your offices, data centers, and equipment are located

**Hierarchy Example**:
```
Saudi Arabia (Country)
└── Riyadh (City)
    └── King Fahd Road Campus (Campus)
        └── HQ Building (Building)
            ├── Floor 1 (Floor)
            ├── Floor 2 (Floor)
            └── Floor 3 (Floor)
                ├── Server Room 3A (Room)
                │   └── Rack R3A-01 (Rack)
                └── IT Office 3B (Room)
```

**Required Fields**:
- ✅ **Name**: Riyadh HQ Building
- ✅ **Location Type**: Country, City, Campus, Building, Floor, Room, Rack

**Optional Fields**:
- ❌ **Address**: King Fahd Road, Riyadh
- ❌ **City**: Riyadh
- ❌ **Country**: Saudi Arabia
- ❌ **Postal Code**: 12345
- ❌ **GPS Coordinates**: Latitude, Longitude
- ❌ **Time Zone**: Asia/Riyadh

**Example**:

| Name | Type | Parent Location | Address | City | Country | Postal Code |
|------|------|-----------------|---------|------|---------|-------------|
| Saudi Arabia | COUNTRY | - | - | - | Saudi Arabia | - |
| Riyadh | CITY | Saudi Arabia | - | Riyadh | Saudi Arabia | - |
| King Fahd Road Campus | CAMPUS | Riyadh | King Fahd Road | Riyadh | Saudi Arabia | 11564 |
| HQ Building | BUILDING | King Fahd Road Campus | King Fahd Road | Riyadh | Saudi Arabia | 11564 |
| Floor 3 | FLOOR | HQ Building | - | Riyadh | Saudi Arabia | - |
| Server Room 3A | ROOM | Floor 3 | - | Riyadh | Saudi Arabia | - |

---

### Step 2: Vendors & Suppliers 🔵

**Who provides this**: Procurement, Finance
**Why it matters**: Track who we buy from, warranty providers, and contract relationships

#### 2.1 Vendors

**What is it?** Companies we purchase IT equipment, software, or services from

**Required Fields**:
- ✅ **Vendor Name**: Dell Technologies

**Optional Fields**:
- ❌ **Legal Name**: Dell Technologies Inc.
- ❌ **Vendor Type**: Manufacturer, Reseller, Service Provider, Consultant
- ❌ **Tax ID**: 123456789
- ❌ **Website**: https://www.dell.com
- ❌ **Email**: sales@dell.com
- ❌ **Phone**: +966 11 234 5678
- ❌ **Address**: Full address
- ❌ **Payment Terms**: Net 30 days
- ❌ **Preferred Vendor**: Yes/No
- ❌ **Tags**: Hardware, Laptops, Servers

**Example**:

| Vendor Name | Legal Name | Type | Tax ID | Website | Email | Phone | City | Country | Payment Terms | Preferred | Tags |
|-------------|------------|------|--------|---------|-------|-------|------|---------|---------------|-----------|------|
| Dell Technologies | Dell Technologies Inc. | MANUFACTURER | 123456789 | https://www.dell.com | sales@dell.com | +966 11 234 5678 | Riyadh | Saudi Arabia | Net 30 days | Yes | Hardware, Laptops |
| Microsoft | Microsoft Corporation | SERVICE_PROVIDER | 987654321 | https://www.microsoft.com | mssales@microsoft.com | +966 11 987 6543 | Riyadh | Saudi Arabia | Net 45 days | Yes | Software, Cloud |
| Jarir Bookstore | Jarir Marketing Company | RESELLER | 555123456 | https://www.jarir.com | b2b@jarir.com | +966 11 456 7890 | Riyadh | Saudi Arabia | Net 15 days | No | Reseller, Supplies |

**Real-World Example**:
```
🏢 Dell Technologies
   Type: Manufacturer
   Products: Laptops, Servers, Monitors
   Contact: sales@dell.com, +966 11 234 5678
   Payment: Net 30 days
   Preferred: ✅ Yes

   Used for:
   - 120 Dell Latitude laptops
   - 15 Dell PowerEdge servers
   - Warranty support contracts
```

---

#### 2.2 Vendor Contacts

**What is it?** Key people at vendor companies (account managers, support contacts)

**Required Fields**:
- ✅ **Vendor**: Dell Technologies
- ✅ **First Name**: Mohammed
- ✅ **Last Name**: Al-Zahrani

**Optional Fields**:
- ❌ **Job Title**: Account Manager
- ❌ **Email**: mohammed.alzahrani@dell.com
- ❌ **Phone**: +966 50 123 4567
- ❌ **Role**: Account Manager, Technical Support, Sales
- ❌ **Primary Contact**: Yes/No

**Example**:

| Vendor | First Name | Last Name | Title | Email | Phone | Role | Primary |
|--------|------------|-----------|-------|-------|-------|------|---------|
| Dell Technologies | Mohammed | Al-Zahrani | Account Manager | mohammed.alzahrani@dell.com | +966 50 123 4567 | Account Manager | Yes |
| Dell Technologies | Sara | Al-Harbi | Technical Support | sara.alharbi@dell.com | +966 50 987 6543 | Technical Support | No |
| Microsoft | Khaled | Al-Mutairi | Sales Executive | khaled.almutairi@microsoft.com | +966 50 234 5678 | Sales | Yes |

---

### Step 3: IT Assets 🟢

**Who provides this**: IT Operations, IT Asset Managers
**Why it matters**: Track every piece of IT equipment, its location, and who's using it

#### 3.1 Asset Categories

**What is it?** Types of assets you manage (Laptops, Servers, Monitors, etc.)

**Required Fields**:
- ✅ **Category Name**: Laptop

**Optional Fields**:
- ❌ **Description**: Portable computers for employees
- ❌ **Is Consumable**: No (Yes for items like cables, mice)

**Example**:

| Category Name | Description | Is Consumable |
|---------------|-------------|---------------|
| Laptop | Portable computers for employees | No |
| Desktop | Desktop computers for office use | No |
| Server | Physical and virtual servers | No |
| Monitor | Display screens | No |
| Network Equipment | Switches, routers, firewalls | No |
| Printer | Office printers | No |
| Mobile Phone | Company-issued phones | No |
| Mouse | Computer mice | Yes |
| Keyboard | Computer keyboards | Yes |
| Cables | Various cables and adapters | Yes |

---

#### 3.2 Asset Models

**What is it?** Specific models of equipment you purchase (e.g., "Dell Latitude 7420", "iPhone 14 Pro")

**Required Fields**:
- ✅ **Category**: Laptop
- ✅ **Vendor**: Dell Technologies
- ✅ **Model Name**: Dell Latitude 7420

**Optional Fields**:
- ❌ **Description**: 14-inch business laptop
- ❌ **Default Warranty**: 36 months
- ❌ **Specifications**: RAM, CPU, Storage, etc.

**Example**:

| Category | Vendor | Model Name | Description | Default Warranty (months) | Specs |
|----------|--------|------------|-------------|---------------------------|-------|
| Laptop | Dell Technologies | Dell Latitude 7420 | 14-inch business laptop | 36 | Intel i7, 16GB RAM, 512GB SSD |
| Laptop | Apple | MacBook Pro 14" M3 | Apple MacBook Pro 14-inch | 12 | M3 Pro, 18GB RAM, 512GB SSD |
| Server | Dell Technologies | PowerEdge R750 | 2U rack server | 60 | Dual Xeon, 128GB RAM, 2TB SSD |
| Mobile Phone | Apple | iPhone 14 Pro | Apple smartphone | 12 | 256GB, 5G |
| Monitor | Dell Technologies | UltraSharp U2723DE | 27-inch 4K monitor | 36 | 4K, USB-C, IPS |

---

#### 3.3 Individual Assets

**What is it?** Every single IT asset you own, with unique identifier

**Required Fields**:
- ✅ **Asset Tag**: ASSET-0001 (unique identifier, can be generated automatically)
- ✅ **Category**: Laptop

**Optional Fields**:
- ❌ **Model**: Dell Latitude 7420
- ❌ **Vendor**: Dell Technologies
- ❌ **Serial Number**: ABC123456789
- ❌ **Purchase Date**: 2024-01-15
- ❌ **Purchase Cost**: 5,000.00
- ❌ **Currency**: SAR
- ❌ **Condition**: NEW, GOOD, FAIR, POOR
- ❌ **Location**: Riyadh HQ - Floor 3
- ❌ **Assigned To**: Ahmed Al-Rashid
- ❌ **Status**: In Use, In Stock, Retired, Disposed
- ❌ **Warranty End Date**: 2027-01-15

**Example**:

| Asset Tag | Category | Model | Vendor | Serial Number | Purchase Date | Cost | Currency | Condition | Location | Assigned To | Status |
|-----------|----------|-------|--------|---------------|---------------|------|----------|-----------|----------|-------------|--------|
| ASSET-0001 | Laptop | Dell Latitude 7420 | Dell Technologies | DL7420-001234 | 2024-01-15 | 5,000 | SAR | NEW | Riyadh HQ - Floor 3 | Ahmed Al-Rashid | In Use |
| ASSET-0002 | Laptop | MacBook Pro 14" M3 | Apple | MBP14-567890 | 2024-02-20 | 9,500 | SAR | NEW | Riyadh HQ - Floor 2 | Fatima Al-Salem | In Use |
| ASSET-0003 | Server | PowerEdge R750 | Dell Technologies | PE750-999888 | 2023-06-10 | 45,000 | SAR | GOOD | Data Center - Rack 3A-01 | - | In Use |
| ASSET-0004 | Monitor | UltraSharp U2723DE | Dell Technologies | U27-445566 | 2024-01-15 | 2,200 | SAR | NEW | Storage Room | - | In Stock |

**Real-World Example**:
```
💻 Dell Latitude 7420 (ASSET-0001)
   Serial Number: DL7420-001234
   Purchase: Jan 15, 2024 for ر.س 5,000
   Condition: NEW
   Location: Riyadh HQ - Floor 3
   Assigned to: Ahmed Al-Rashid (EMP-12345)
   Warranty: Until Jan 15, 2027 (Dell 3-year warranty)

   Maintenance History:
   - Jan 20, 2024: Initial setup and deployment
   - Mar 15, 2024: Battery replacement (warranty claim)
```

---

#### 3.4 Stock Locations

**What is it?** Where you store unassigned assets (storage rooms, warehouses)

**Required Fields**:
- ✅ **Name**: IT Storage Room - Floor 3

**Optional Fields**:
- ❌ **Physical Location**: Riyadh HQ - Floor 3
- ❌ **Description**: Main IT equipment storage

**Example**:

| Name | Physical Location | Description |
|------|-------------------|-------------|
| IT Storage Room - Floor 3 | Riyadh HQ - Floor 3 | Main IT equipment storage |
| Data Center Spare Parts | Data Center - Room 3A | Server spare parts and components |
| Warehouse - Jeddah | Jeddah Office - Building A | Regional office asset storage |

---

### Step 4: Software & Licenses 🟢

**Who provides this**: IT Operations, Procurement, Finance
**Why it matters**: Ensure license compliance, avoid over-purchasing, track costs

#### 4.1 License Products

**What is it?** Software products you license (e.g., Microsoft 365, Adobe Creative Cloud, Oracle Database)

**Required Fields**:
- ✅ **Product Name**: Microsoft 365 Business Premium
- ✅ **Vendor**: Microsoft
- ✅ **License Type**: Per User, Per Device, Per Core, Per VM, Per Cluster

**Optional Fields**:
- ❌ **Description**: Office apps + cloud services
- ❌ **Version**: E3, E5, Standard, Enterprise, etc.

**Example**:

| Product Name | Vendor | License Type | Description | Version |
|--------------|--------|--------------|-------------|---------|
| Microsoft 365 Business Premium | Microsoft | Per User | Office apps + Teams + OneDrive | Business Premium |
| Adobe Creative Cloud | Adobe | Per User | Design and creative tools | All Apps |
| Oracle Database Enterprise Edition | Oracle | Per Core | Enterprise database | 19c |
| VMware vSphere | VMware | Per CPU | Virtualization platform | 8.0 |
| Zoom Business | Zoom | Per User | Video conferencing | Business |

---

#### 4.2 License Entitlements (What You Purchased)

**What is it?** The actual licenses you bought (quantity, dates, contract reference)

**Required Fields**:
- ✅ **Product**: Microsoft 365 Business Premium
- ✅ **Quantity Purchased**: 250
- ✅ **Start Date**: 2024-01-01

**Optional Fields**:
- ❌ **End Date**: 2025-12-31
- ❌ **Contract Reference**: Contract number or PO number
- ❌ **Allowed Scope**: Which departments/locations can use

**Example**:

| Product | Quantity Purchased | Start Date | End Date | Contract | Notes |
|---------|-------------------|------------|----------|----------|-------|
| Microsoft 365 Business Premium | 250 | 2024-01-01 | 2025-12-31 | CONTRACT-2024-001 | Annual subscription, auto-renew |
| Adobe Creative Cloud | 20 | 2024-03-01 | 2025-02-28 | CONTRACT-2024-005 | Design team only |
| Oracle Database Enterprise Edition | 64 cores | 2023-01-01 | 2026-12-31 | CONTRACT-2023-010 | 3-year enterprise agreement |

---

#### 4.3 License Allocations (Who's Using What)

**What is it?** Which employees/devices/systems are using which licenses

**Required Fields**:
- ✅ **Product**: Microsoft 365 Business Premium
- ✅ **Allocated To**: Ahmed Al-Rashid (or Device, or System)
- ✅ **Quantity**: 1

**Optional Fields**:
- ❌ **Allocation Date**: 2024-01-15
- ❌ **Notes**: Reason for allocation

**Example**:

| Product | Allocated To | Quantity | Allocation Date | Notes |
|---------|--------------|----------|-----------------|-------|
| Microsoft 365 Business Premium | Ahmed Al-Rashid | 1 | 2024-01-15 | New hire |
| Microsoft 365 Business Premium | Fatima Al-Salem | 1 | 2024-01-15 | Existing employee |
| Adobe Creative Cloud | Ahmed Al-Zahrani | 1 | 2024-03-10 | Joined design team |
| Oracle Database Enterprise Edition | Core Banking DB Server | 32 cores | 2023-01-15 | Production database |

**Real-World Example**:
```
📦 Microsoft 365 Business Premium
   Purchased: 250 licenses
   Contract: CONTRACT-2024-001 (Jan 1, 2024 - Dec 31, 2025)
   Cost: ر.س 375,000 (ر.س 1,500/user/year)

   Allocated: 232 / 250
   Available: 18

   Allocations:
   - Ahmed Al-Rashid (EMP-12345): 1 license since Jan 15, 2024
   - Fatima Al-Salem (EMP-12346): 1 license since Jan 15, 2024
   - ... (230 more employees)
```

---

### Step 5: Services & Applications 🟢

**Who provides this**: IT Operations, DevOps, Application Owners
**Why it matters**: Document IT service catalog, understand dependencies, support SAMA compliance

#### 5.1 Business Processes

**What is it?** Business functions that IT services support (e.g., Digital Payments, Identity Management, Core Banking)

**Required Fields**:
- ✅ **Process Name**: Digital Payments
- ✅ **Category**: Core Banking, Channels, Infrastructure, Support

**Optional Fields**:
- ❌ **Description**: What this business process does

**Example**:

| Process Name | Category | Description |
|--------------|----------|-------------|
| Digital Payments | Core Banking | Customer payment transactions via Barq app |
| Identity & Access Management | Infrastructure | User authentication and authorization |
| Core Banking System | Core Banking | Account management, transactions, ledger |
| Mobile Banking | Channels | Mobile app for customer banking |
| ATM Network | Channels | ATM transactions and cash withdrawals |
| Data Warehouse | Infrastructure | Business intelligence and reporting |

---

#### 5.2 IT Services

**What is it?** IT systems, applications, databases, APIs that support business operations

**Required Fields**:
- ✅ **Service Name**: Core Wallet Service
- ✅ **Service Type**: Application, Server, Network, Database, API, Cloud Service

**Optional Fields**:
- ❌ **Business Process**: Digital Payments
- ❌ **Description**: What the service does
- ❌ **Technical Owner**: Who manages it technically
- ❌ **Business Owner**: Who owns it from business perspective
- ❌ **Criticality**: Critical, High, Medium, Low
- ❌ **Business Impact**: High, Medium, Low
- ❌ **Is Essential Service**: Yes/No (for SAMA compliance)
- ❌ **Environment**: Production, UAT, Development, DR
- ❌ **Cloud Provider**: OCI, GCP, AWS, On-Premises
- ❌ **Deployment Date**: When it was deployed
- ❌ **Decommission Date**: Planned retirement date

**Example**:

| Service Name | Type | Business Process | Technical Owner | Business Owner | Criticality | Essential | Environment | Cloud Provider |
|--------------|------|------------------|-----------------|----------------|-------------|-----------|-------------|----------------|
| Core Wallet Service | APPLICATION | Digital Payments | Ahmed Al-Rashid | Khaled Al-Mutairi | CRITICAL | Yes | PRODUCTION | OCI_CLOUD |
| Active Directory | SERVER | Identity & Access | Sara Al-Harbi | - | HIGH | No | PRODUCTION | ON_PREM |
| Core Banking Database | DATABASE | Core Banking | Mohammed Al-Zahrani | Fatima Al-Salem | CRITICAL | Yes | PRODUCTION | OCI_CLOUD |
| Customer API Gateway | API | Mobile Banking | Khalid Al-Otaibi | - | HIGH | Yes | PRODUCTION | GCP_CLOUD |
| Data Warehouse | DATABASE | Data Analytics | Noura Al-Rashid | - | MEDIUM | No | PRODUCTION | OCI_CLOUD |

**Real-World Example**:
```
🌐 Core Wallet Service
   Type: Application
   Business Process: Digital Payments

   Ownership:
   - Technical Owner: Ahmed Al-Rashid (Backend Team)
   - Product Owner: Khaled Al-Mutairi (Product Manager)
   - Business Owner: Fatima Al-Salem (VP Operations)

   Classification:
   - Criticality: CRITICAL
   - Business Impact: HIGH
   - Data Confidentiality: RESTRICTED
   - Essential Service: ✅ Yes (SAMA regulated)

   Infrastructure:
   - Environment: Production
   - Location: OCI Cloud - Riyadh Region
   - IP Address: 10.10.5.42
   - Backup: Daily, last backup Dec 20, 2024

   Dependencies:
   - Runs on: App Server 01 (ASSET-0023)
   - Depends on: Core Banking Database, Payment Gateway API
   - Monitored by: Datadog APM
```

---

### Step 6: Contracts 🟢

**Who provides this**: Procurement, Finance, Legal
**Why it matters**: Track vendor obligations, renewal dates, financial commitments

#### 6.1 Contract Types

**What is it?** Categories of contracts (Software License, Maintenance, Professional Services, etc.)

**Example**:

| Contract Type | Description |
|---------------|-------------|
| Software License | Software subscription and license agreements |
| Hardware Maintenance | Equipment warranty and support contracts |
| Professional Services | Consulting and implementation services |
| Cloud Services | Cloud infrastructure and platform services |
| Telecommunications | Internet, phone, network connectivity |
| Managed Services | Outsourced IT operations and support |

---

#### 6.2 Contracts

**What is it?** Actual contracts with vendors

**Required Fields**:
- ✅ **Contract Type**: Software License
- ✅ **Vendor**: Microsoft
- ✅ **Contract Name**: Microsoft Enterprise Agreement 2024
- ✅ **Start Date**: 2024-01-01

**Optional Fields**:
- ❌ **Contract Number**: EA-2024-001
- ❌ **End Date**: 2026-12-31
- ❌ **Auto-Renew**: Yes/No
- ❌ **Total Value**: 1,000,000
- ❌ **Currency**: SAR
- ❌ **Payment Terms**: Annual, Quarterly, Monthly
- ❌ **Renewal Notice**: 90 days before end date
- ❌ **SLA Terms**: Service level agreements

**Example**:

| Contract Type | Vendor | Contract Name | Number | Start Date | End Date | Total Value | Currency | Auto-Renew |
|---------------|--------|---------------|--------|------------|----------|-------------|----------|------------|
| Software License | Microsoft | Microsoft Enterprise Agreement 2024 | EA-2024-001 | 2024-01-01 | 2026-12-31 | 1,125,000 | SAR | No |
| Hardware Maintenance | Dell Technologies | Dell ProSupport Plus 2024 | DPS-2024-042 | 2024-01-01 | 2027-12-31 | 225,000 | SAR | Yes |
| Cloud Services | Oracle | OCI Enterprise Agreement | OCI-2023-018 | 2023-06-01 | 2026-05-31 | 2,500,000 | SAR | No |
| Professional Services | Accenture | Digital Transformation Program | ACN-2024-003 | 2024-03-01 | 2024-12-31 | 750,000 | SAR | No |

**Real-World Example**:
```
📄 Microsoft Enterprise Agreement 2024 (EA-2024-001)
   Vendor: Microsoft Corporation
   Type: Software License
   Period: Jan 1, 2024 - Dec 31, 2026 (3 years)
   Value: ر.س 1,125,000 (annual: ر.س 375,000)
   Payment: Annual, Net 30 days
   Auto-Renew: No (manual renewal required)

   Covered Products:
   - 250 x Microsoft 365 Business Premium
   - 10 x Windows Server 2022 licenses
   - 5 x SQL Server Enterprise licenses

   Renewal Process:
   - Notice required: 90 days before Dec 31, 2026
   - Contact: Khaled Al-Mutairi (khaled.almutairi@microsoft.com)
```

---

### Step 7: Governance & Compliance 🟡

**Who provides this**: Security, Compliance, Data Governance teams
**Why it matters**: SAMA compliance, data classification, ownership accountability

#### 7.1 Data Domains

**What is it?** Categories of data you manage (PII, Financial Data, Customer Data, etc.)

**Example**:

| Data Domain | Description |
|-------------|-------------|
| Personal Identifiable Information (PII) | Customer names, IDs, contact information |
| Financial Data | Account balances, transactions, payment details |
| Authentication Credentials | Passwords, tokens, API keys |
| Customer Data | Customer profiles, preferences, history |
| Internal Operations | Employee data, HR records, payroll |
| Business Intelligence | Reports, analytics, dashboards |

---

#### 7.2 Data Ownership

**What is it?** Who is responsible for each type of data

**Required Fields**:
- ✅ **Data Domain**: Personal Identifiable Information (PII)
- ✅ **Data Owner**: Fatima Al-Salem (or Department)

**Optional Fields**:
- ❌ **Asset Category/CI Class**: Where this data lives (e.g., Core Banking Database)
- ❌ **Notes**: Ownership responsibilities

**Example**:

| Data Domain | Data Owner | Department | Asset/System | Notes |
|-------------|------------|------------|--------------|-------|
| Personal Identifiable Information (PII) | Fatima Al-Salem | Customer Support | Core Banking Database | SAMA regulated, strict access controls |
| Financial Data | Khalid Al-Mutairi | Finance | Core Banking Database | SAMA regulated, audit trail required |
| Authentication Credentials | Sara Al-Harbi | IT Security | Active Directory | Critical security asset |
| Business Intelligence | Ahmed Al-Zahrani | Analytics | Data Warehouse | Internal use only |

---

#### 7.3 Verification Campaigns

**What is it?** Scheduled audits to verify asset/data accuracy (e.g., annual asset inventory count)

**Required Fields**:
- ✅ **Campaign Name**: Annual IT Asset Verification 2024
- ✅ **Target**: Assets, Configuration Items, Services
- ✅ **Start Date**: 2024-12-01

**Optional Fields**:
- ❌ **End Date**: 2024-12-31
- ❌ **Description**: Purpose of campaign
- ❌ **Selection Criteria**: Which assets to verify (e.g., all laptops in Riyadh)

**Example**:

| Campaign Name | Target | Start Date | End Date | Description |
|---------------|--------|------------|----------|-------------|
| Annual IT Asset Verification 2024 | Assets | 2024-12-01 | 2024-12-31 | Verify all IT assets in Riyadh offices |
| Q1 2025 License Compliance Audit | Licenses | 2025-01-15 | 2025-02-15 | Verify all software license allocations |
| SAMA Essential Services Review | Services | 2024-06-01 | 2024-06-30 | Review all essential services for SAMA compliance |

---

### Step 8: Additional Data (Optional) 🟡

#### 8.1 Warranties

**What to provide**: Warranty details for each asset

| Asset | Warranty Type | Start Date | End Date | Vendor | Policy Number | Cost | Currency |
|-------|---------------|------------|----------|--------|---------------|------|----------|
| ASSET-0001 | Extended | 2024-01-15 | 2027-01-15 | Dell Technologies | DW-001234 | 750 | SAR |
| ASSET-0002 | Standard | 2024-02-20 | 2025-02-20 | Apple | APW-567890 | 0 | SAR |

---

#### 8.2 Maintenance Schedules

**What to provide**: Recurring maintenance for assets (servers, network equipment)

| Asset | Title | Frequency | Next Due | Assigned To | Priority |
|-------|-------|-----------|----------|-------------|----------|
| ASSET-0003 (Server) | Monthly system health check | MONTHLY | 2025-01-01 | Ahmed Al-Rashid | HIGH |
| Network Switch 01 | Quarterly firmware update | QUARTERLY | 2025-03-01 | Sara Al-Harbi | MEDIUM |

---

## Data Templates

Download Excel/CSV templates for easy data collection:

| Template | Who Fills | Priority |
|----------|-----------|----------|
| **Organization_Units.xlsx** | HR | 🔵 High |
| **Employees.xlsx** | HR | 🔵 High |
| **Locations.xlsx** | Facilities, IT | 🔵 High |
| **Vendors.xlsx** | Procurement | 🔵 High |
| **Vendor_Contacts.xlsx** | Procurement | 🟢 Medium |
| **Asset_Categories.xlsx** | IT Operations | 🔵 High |
| **Asset_Models.xlsx** | IT Operations | 🔵 High |
| **Assets.xlsx** | IT Operations | 🟢 Medium |
| **Licenses.xlsx** | IT Operations, Procurement | 🟢 Medium |
| **Services.xlsx** | IT Operations, DevOps | 🟢 Medium |
| **Contracts.xlsx** | Procurement, Finance | 🟢 Medium |
| **Warranties.xlsx** | IT Operations | 🟡 Low |
| **Maintenance_Schedules.xlsx** | IT Operations | 🟡 Low |

---

## Frequently Asked Questions

### General Questions

**Q: How accurate does the data need to be?**
A: For **required fields**, data must be 100% accurate (e.g., employee emails, asset serial numbers). For **optional fields**, do your best—we can update later.

**Q: What if I don't have all the data?**
A: Start with **required fields** only. We can add optional fields in phases.

**Q: Can we import data from existing spreadsheets?**
A: Yes! Work with the TechHub team to map your existing data to our templates.

**Q: What about data quality issues (duplicates, missing info)?**
A: The TechHub team will help clean and validate data before import.

---

### Asset-Specific Questions

**Q: Do I need to count every mouse and keyboard?**
A: No. Consumable items (mice, keyboards, cables) can be tracked as bulk stock, not individual assets. Focus on **major assets** (laptops, servers, monitors, phones).

**Q: What about assets in storage or not yet deployed?**
A: Include them! Use "In Stock" status and assign to stock location.

**Q: Should I include retired/disposed assets?**
A: No, only **active assets** (in use or in stock). We'll track disposals going forward.

**Q: How do I handle assets shared by multiple people?**
A: Assign to the **primary user** or to a **department/location** if truly shared (e.g., conference room TV).

---

### License-Specific Questions

**Q: Do I need to track every software installation?**
A: No, focus on **paid licenses** (Microsoft 365, Adobe, Oracle, etc.). Free/open-source software doesn't need license tracking.

**Q: What if licenses are bundled (e.g., Microsoft 365 includes Word, Excel, Teams)?**
A: Track the **parent product** (Microsoft 365), not individual apps.

**Q: How do I handle multi-year licenses?**
A: Provide the **full license period** (start and end date). The system will track renewals.

---

### Service-Specific Questions

**Q: What's the difference between a Service and an Asset?**
A:
- **Asset**: Physical/virtual equipment (laptop, server, VM)
- **Service**: Software system or application (Core Wallet Service, Active Directory, Payment API)

**Q: Do I need to include third-party SaaS (Zoom, Slack, etc.)?**
A: Yes, include all IT services that support business operations, including SaaS.

**Q: What's an "Essential Service"?**
A: Services critical to core banking or payment operations (SAMA regulated). Examples: Core Banking System, Payment Gateway, Digital Wallet.

---

### Contract-Specific Questions

**Q: Should I include expired contracts?**
A: No, only **active contracts** (not yet expired). Historical contracts aren't needed for initial data load.

**Q: What about verbal agreements or purchase orders without contracts?**
A: Include significant recurring relationships (e.g., annual software subscription). One-time purchases don't need contract records.

---

## Next Steps

1. **Download templates** relevant to your department
2. **Collect data** with your team
3. **Validate completeness** (check required fields are filled)
4. **Submit to TechHub team** via [email/portal/etc.]
5. **Review & clarify** any questions the TechHub team has
6. **Verify imported data** in TechHub system

---

## Support

**Questions or need help?**

- **TechHub Project Lead**: [Name, email@barq.com]
- **Technical Support**: [TechHub support email]
- **Documentation**: `/docs` folder in TechHub
- **Training Sessions**: [Schedule TBD]

---

**Thank you for contributing to TechHub!** Your data will help Barq achieve operational excellence, regulatory compliance, and cost optimization.

---

**Document Version**: 1.0
**Last Updated**: 2025-11-23
**Maintained By**: TechHub Implementation Team
