# Data Schema

## 1. Overview
The **EHRJ Digital Campus & ERP** utilizes a centralized relational data architecture engineered specifically for the administrative, financial, and educational governance of **ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা (Eliotgonj Hazi Rohmatollah Jamiria Madrasha)**. 

The architecture is built on **Prisma ORM** interacting with a high-performance **SQLite 3 database engine** running in **Write-Ahead Logging (WAL)** mode. The database schema encompasses **120 strictly-typed models**, covering student lifecycles, Shariah financial fund segregation, Qawmi examination grading, multi-persona authorization (Admin, Principal, Teacher, Guardian), residential hostels, transport, inventory, human resources, and immutable audit logs.

### Key Architectural Invariants:
1. **Single-Process Fork Mode:** Because SQLite relies on file-level locks, production execution is pinned to a single PM2 worker process in fork mode to guarantee zero concurrency locking crashes.
2. **Connection Pragmas:** Initialized with `PRAGMA journal_mode = WAL;`, `PRAGMA busy_timeout = 5000;`, and `PRAGMA synchronous = NORMAL;` to provide concurrent read scalability without blocking writes.
3. **Relational Tenancy & Ownership:** Data isolation between guardians, students, and teachers is enforced through relational join tables (e.g., `GuardianStudent`, `TeacherAssignment`) and validated server-side.
4. **Shariah Fund Segregation:** Cash balances are partitioned into 5 independent Shariah funds (`GENERAL`, `LILLAH`, `ZAKAT`, `CONSTRUCTION`, `ORPHAN_SUPPORT`) with strict debit/credit balance validation.
5. **Historical Immutability:** Generated certificates, marksheet results, and money receipts store frozen JSON snapshots (`snapshotJson`), preventing historical records from altering when user profiles are modified.

---

## 2. Data Storage Technology
- **Database Engine:** SQLite 3 (Version 3.45+)
- **Storage Subsystem:** Local SSD file storage (`prisma/dev.db`, with WAL journal `dev.db-wal` and shared memory index `dev.db-shm`).
- **Object / File Storage:** Local server filesystem at `public/uploads/` for student photos, NID documents, and attachments; `backups/` for encrypted SQLite database snapshots.
- **ORM / Data Access Layer:** Prisma ORM (`@prisma/client` v5.22.0) with automated parameterization preventing SQL injection.
- **Database Driver:** Native Node.js bindings via Prisma Engine.

---

## 3. Entities / Tables

The system comprises 120 verified Prisma models partitioned into 12 core domains.


### 1. Core Identity, Access Control & Security Operations

#### User

**Purpose:**  
System user account representing administrative staff, principal, teachers, and guardians with role-based access credentials.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `name` | `String` | Yes | - | Entity attribute representing name |
| `username` | `String` | Yes | - | Entity attribute representing username |
| `email` | `String` | Yes | - | Entity attribute representing email |
| `phone` | `String?` | No | - | Entity attribute representing phone |
| `passwordHash` | `String` | Yes | - | Entity attribute representing passwordHash |
| `role` | `String` | Yes | - | Entity attribute representing role |
| `status` | `String` | Yes | `"ACTIVE"` | Operational state identifier |
| `twoFactorEnabled` | `Boolean` | Yes | `false` | Two-factor authentication toggle flag |
| `photoUrl` | `String?` | No | - | Entity attribute representing photoUrl |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `employee` | `Employee?` | No | - | Entity attribute representing employee |

**Primary Key:**  
`id`

**Foreign Keys:**  
None

**Unique Constraints:**  
`username`, `email`, `phone`, `username`, `email`, `phone`

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
- Field `role`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Strict administrative access only. Modifiable only by ADMIN role. Passwords hashed with bcrypt (salt cost 10).

---

#### Session

**Purpose:**  
Active authenticated session records tied to users and signed JWT tokens with expiration dates.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `userId` | `String` | Yes | - | Foreign key referencing user |
| `token` | `String` | Yes | - | Entity attribute representing token |
| `ipAddress` | `String?` | No | - | Entity attribute representing ipAddress |
| `userAgent` | `String?` | No | - | Entity attribute representing userAgent |
| `expiresAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `user` | `User` | Yes | - | Entity attribute representing user |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `user` (User): `fields: [userId], references: [id], onDelete: Cascade`

**Unique Constraints:**  
`token`, `token`

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Strict administrative access only. Modifiable only by ADMIN role. Passwords hashed with bcrypt (salt cost 10).

---

#### LoginHistory

**Purpose:**  
Audit trail of user authentication attempts, capturing IP addresses, user agents, and status.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `userId` | `String` | Yes | - | Foreign key referencing user |
| `ipAddress` | `String?` | No | - | Entity attribute representing ipAddress |
| `userAgent` | `String?` | No | - | Entity attribute representing userAgent |
| `status` | `String` | Yes | - | Operational state identifier |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `user` | `User` | Yes | - | Entity attribute representing user |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `user` (User): `fields: [userId], references: [id], onDelete: Cascade`

**Unique Constraints:**  
None

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
- Field `status`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### OtpCode

**Purpose:**  
One-time passwords issued for verification actions such as login or sensitive changes.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `email` | `String?` | No | - | Entity attribute representing email |
| `phone` | `String?` | No | - | Entity attribute representing phone |
| `code` | `String` | Yes | - | Entity attribute representing code |
| `purpose` | `String` | Yes | - | Entity attribute representing purpose |
| `expiresAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `usedAt` | `DateTime?` | No | - | Timestamp / Date record |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |

**Primary Key:**  
`id`

**Foreign Keys:**  
None

**Unique Constraints:**  
None

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### PasswordResetOtp

**Purpose:**  
Time-limited OTP verification records dedicated to account password recovery.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `email` | `String` | Yes | - | Entity attribute representing email |
| `otpHash` | `String` | Yes | - | Entity attribute representing otpHash |
| `resetToken` | `String?` | No | - | Entity attribute representing resetToken |
| `attempts` | `Int` | Yes | `0` | Entity attribute representing attempts |
| `isUsed` | `Boolean` | Yes | `false` | Entity attribute representing isUsed |
| `expiresAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |

**Primary Key:**  
`id`

**Foreign Keys:**  
None

**Unique Constraints:**  
`resetToken`, `resetToken`

**Indexes:**  
- `@@index([email, isUsed])`

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### AuditLog

**Purpose:**  
Immutable security ledger recording user actions, IP addresses, entity mutations, and changes.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `userId` | `String?` | No | - | Foreign key referencing user |
| `action` | `String` | Yes | - | Entity attribute representing action |
| `entityType` | `String` | Yes | - | Entity attribute representing entityType |
| `entityId` | `String?` | No | - | Foreign key referencing entity |
| `detailsJson` | `String?` | No | - | Immutable serialized JSON payload |
| `ipAddress` | `String?` | No | - | Entity attribute representing ipAddress |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `user` | `User?` | No | - | Entity attribute representing user |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `user` (User?): `fields: [userId], references: [id], onDelete: SetNull`

**Unique Constraints:**  
None

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Strict administrative access only. Modifiable only by ADMIN role. Passwords hashed with bcrypt (salt cost 10).

---

#### SystemBackup

**Purpose:**  
Metadata for automated and manual SQLite database backups with SHA-256 integrity checksums.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `backupCode` | `String` | Yes | - | Entity attribute representing backupCode |
| `type` | `String` | Yes | `"MANUAL"` | Entity attribute representing type |
| `status` | `String` | Yes | `"COMPLETED"` | Operational state identifier |
| `startedAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `completedAt` | `DateTime?` | No | - | Timestamp / Date record |
| `sizeBytes` | `Float?` | No | - | Entity attribute representing sizeBytes |
| `storagePath` | `String` | Yes | - | Entity attribute representing storagePath |
| `checksum` | `String?` | No | - | Entity attribute representing checksum |
| `databaseVersion` | `String` | Yes | `"SQLite 3"` | Entity attribute representing databaseVersion |
| `applicationVersion` | `String` | Yes | `"1.0.0"` | Entity attribute representing applicationVersion |
| `schemaVersion` | `String` | Yes | `"2026-PHASE16"` | Entity attribute representing schemaVersion |
| `initiatedById` | `String?` | No | - | Foreign key referencing initiatedBy |
| `retentionUntil` | `DateTime?` | No | - | Entity attribute representing retentionUntil |
| `verificationStatus` | `String` | Yes | `"PENDING"` | Operational state identifier |
| `verifiedAt` | `DateTime?` | No | - | Timestamp / Date record |
| `verificationDetails` | `String?` | No | - | Entity attribute representing verificationDetails |
| `failureReason` | `String?` | No | - | Entity attribute representing failureReason |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `initiatedBy` | `User?` | No | - | Entity attribute representing initiatedBy |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `initiatedBy` (User?): `"BackupInitiator", fields: [initiatedById], references: [id], onDelete: SetNull`

**Unique Constraints:**  
`backupCode`, `backupCode`

**Indexes:**  
- `@@index([type])`
- `@@index([status])`
- `@@index([verificationStatus])`
- `@@index([createdAt])`

**Status / Enum Values:**  
- Field `status`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Strict administrative access only. Modifiable only by ADMIN role. Passwords hashed with bcrypt (salt cost 10).

---

#### RestoreOperation

**Purpose:**  
Audit records for database restoration procedures tracking initiator, backup ID, and verification.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `restoreCode` | `String` | Yes | - | Entity attribute representing restoreCode |
| `backupId` | `String` | Yes | - | Foreign key referencing backup |
| `reason` | `String` | Yes | - | Entity attribute representing reason |
| `initiatedById` | `String` | Yes | - | Foreign key referencing initiatedBy |
| `startedAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `completedAt` | `DateTime?` | No | - | Timestamp / Date record |
| `status` | `String` | Yes | `"COMPLETED"` | Operational state identifier |
| `preRestoreBackupId` | `String?` | No | - | Foreign key referencing preRestoreBackup |
| `postRestoreHealthStatus` | `String` | Yes | `"HEALTHY"` | Operational state identifier |
| `failureReason` | `String?` | No | - | Entity attribute representing failureReason |
| `detailsJson` | `String?` | No | - | Immutable serialized JSON payload |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `backup` | `SystemBackup` | Yes | - | Entity attribute representing backup |
| `initiatedBy` | `User` | Yes | - | Entity attribute representing initiatedBy |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `backup` (SystemBackup): `fields: [backupId], references: [id], onDelete: Cascade`
- `initiatedBy` (User): `"RestoreInitiator", fields: [initiatedById], references: [id], onDelete: Cascade`

**Unique Constraints:**  
`restoreCode`, `restoreCode`

**Indexes:**  
- `@@index([status])`
- `@@index([createdAt])`

**Status / Enum Values:**  
- Field `status`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### SystemIncident

**Purpose:**  
Operational incident reports recording severity, status, root cause, and remediation steps.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `incidentCode` | `String` | Yes | - | Entity attribute representing incidentCode |
| `title` | `String` | Yes | - | Entity attribute representing title |
| `description` | `String` | Yes | - | Entity attribute representing description |
| `severity` | `String` | Yes | `"MEDIUM"` | Entity attribute representing severity |
| `status` | `String` | Yes | `"OPEN"` | Operational state identifier |
| `affectedService` | `String` | Yes | `"APPLICATION"` | Entity attribute representing affectedService |
| `detectedAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `acknowledgedAt` | `DateTime?` | No | - | Timestamp / Date record |
| `resolvedAt` | `DateTime?` | No | - | Timestamp / Date record |
| `detectedById` | `String?` | No | - | Foreign key referencing detectedBy |
| `assignedToId` | `String?` | No | - | Foreign key referencing assignedTo |
| `rootCause` | `String?` | No | - | Entity attribute representing rootCause |
| `impact` | `String?` | No | - | Entity attribute representing impact |
| `resolution` | `String?` | No | - | Entity attribute representing resolution |
| `preventiveAction` | `String?` | No | - | Entity attribute representing preventiveAction |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `detectedBy` | `User?` | No | - | Entity attribute representing detectedBy |
| `assignedTo` | `User?` | No | - | Entity attribute representing assignedTo |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `detectedBy` (User?): `"IncidentDetector", fields: [detectedById], references: [id], onDelete: SetNull`
- `assignedTo` (User?): `"IncidentAssignee", fields: [assignedToId], references: [id], onDelete: SetNull`

**Unique Constraints:**  
`incidentCode`, `incidentCode`

**Indexes:**  
- `@@index([status])`
- `@@index([severity])`
- `@@index([affectedService])`
- `@@index([createdAt])`

**Status / Enum Values:**  
- Field `status`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### IncidentEvent

**Purpose:**  
Chronological event logs attached to a specific system incident.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `incidentId` | `String` | Yes | - | Foreign key referencing incident |
| `eventType` | `String` | Yes | - | Entity attribute representing eventType |
| `description` | `String` | Yes | - | Entity attribute representing description |
| `performedByName` | `String?` | No | - | Entity attribute representing performedByName |
| `timestamp` | `DateTime` | Yes | `now(` | Entity attribute representing timestamp |
| `incident` | `SystemIncident` | Yes | - | Entity attribute representing incident |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `incident` (SystemIncident): `fields: [incidentId], references: [id], onDelete: Cascade`

**Unique Constraints:**  
None

**Indexes:**  
- `@@index([incidentId])`
- `@@index([timestamp])`

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### OperationalAlert

**Purpose:**  
Real-time system health and performance alerts flagged by operational monitors.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `alertKey` | `String` | Yes | - | Entity attribute representing alertKey |
| `title` | `String` | Yes | - | Entity attribute representing title |
| `description` | `String` | Yes | - | Entity attribute representing description |
| `severity` | `String` | Yes | `"WARNING"` | Entity attribute representing severity |
| `source` | `String` | Yes | - | Entity attribute representing source |
| `status` | `String` | Yes | `"ACTIVE"` | Operational state identifier |
| `occurrenceCount` | `Int` | Yes | `1` | Entity attribute representing occurrenceCount |
| `lastTriggeredAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `acknowledgedById` | `String?` | No | - | Foreign key referencing acknowledgedBy |
| `acknowledgedAt` | `DateTime?` | No | - | Timestamp / Date record |
| `resolvedAt` | `DateTime?` | No | - | Timestamp / Date record |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |

**Primary Key:**  
`id`

**Foreign Keys:**  
None

**Unique Constraints:**  
`alertKey`, `alertKey`

**Indexes:**  
- `@@index([status])`
- `@@index([severity])`
- `@@index([source])`

**Status / Enum Values:**  
- Field `status`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### MaintenanceWindow

**Purpose:**  
Scheduled or active maintenance periods displaying public notices and blocking mutations.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `isActive` | `Boolean` | Yes | `false` | Entity attribute representing isActive |
| `reason` | `String` | Yes | - | Entity attribute representing reason |
| `messageBn` | `String` | Yes | `"সিস্টেম রক্ষণাবেক্ষণ কাজ চলছে। অতিসত্বর স্বাভাবিক কার্যক্রমে ফিরবে ইনশাআল্লাহ।"` | Bangla language localized text |
| `messageEn` | `String` | Yes | `"System maintenance in progress. Normal operations will resume shortly inshaAllah."` | English language localized text |
| `startedAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `expectedEndAt` | `DateTime?` | No | - | Timestamp / Date record |
| `enabledById` | `String?` | No | - | Foreign key referencing enabledBy |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `enabledBy` | `User?` | No | - | Entity attribute representing enabledBy |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `enabledBy` (User?): `"MaintenanceEnabler", fields: [enabledById], references: [id], onDelete: SetNull`

**Unique Constraints:**  
None

**Indexes:**  
- `@@index([isActive])`

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### RecoveryDrill

**Purpose:**  
Verification records of simulated disaster recovery and backup restore tests.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `drillCode` | `String` | Yes | - | Entity attribute representing drillCode |
| `backupId` | `String` | Yes | - | Foreign key referencing backup |
| `status` | `String` | Yes | - | Operational state identifier |
| `rpoHours` | `Float` | Yes | `0` | Entity attribute representing rpoHours |
| `rtoSeconds` | `Float` | Yes | `0` | Entity attribute representing rtoSeconds |
| `detailsJson` | `String` | Yes | - | Immutable serialized JSON payload |
| `testedAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |

**Primary Key:**  
`id`

**Foreign Keys:**  
None

**Unique Constraints:**  
`drillCode`, `drillCode`

**Indexes:**  
- `@@index([status])`

**Status / Enum Values:**  
- Field `status`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---


### 2. Academic Structure, Registry & Admissions

#### AcademicSession

**Purpose:**  
Institutional academic years/hijri sessions governing enrollment, fees, and results.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `name` | `String` | Yes | - | Entity attribute representing name |
| `startDate` | `DateTime` | Yes | - | Timestamp / Date record |
| `endDate` | `DateTime` | Yes | - | Timestamp / Date record |
| `isCurrent` | `Boolean` | Yes | `false` | Entity attribute representing isCurrent |
| `status` | `String` | Yes | `"ACTIVE"` | Operational state identifier |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |

**Primary Key:**  
`id`

**Foreign Keys:**  
None

**Unique Constraints:**  
`name`, `name`

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
- Field `status`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### JamatClass

**Purpose:**  
Academic classes / Jamat levels (e.g. Dawra-e-Hadith, Mishkat, Hifz, Ibtedai).

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `nameBn` | `String` | Yes | - | Bangla language localized text |
| `nameEn` | `String` | Yes | - | English language localized text |
| `nameAr` | `String?` | No | - | Arabic language localized text |
| `code` | `String` | Yes | - | Entity attribute representing code |
| `genderType` | `String` | Yes | `"COMBINED"` | Entity attribute representing genderType |
| `sortOrder` | `Int` | Yes | `0` | Entity attribute representing sortOrder |
| `isActive` | `Boolean` | Yes | `true` | Entity attribute representing isActive |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |

**Primary Key:**  
`id`

**Foreign Keys:**  
None

**Unique Constraints:**  
`code`, `code`

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### Section

**Purpose:**  
Class divisions/sections (e.g. Section A, Section B) within an academic class.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `classId` | `String` | Yes | - | Foreign key referencing class |
| `nameBn` | `String` | Yes | - | Bangla language localized text |
| `nameEn` | `String` | Yes | - | English language localized text |
| `roomNo` | `String?` | No | - | Entity attribute representing roomNo |
| `maxCapacity` | `Int` | Yes | `50` | Entity attribute representing maxCapacity |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `jamatClass` | `JamatClass` | Yes | - | Entity attribute representing jamatClass |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `jamatClass` (JamatClass): `fields: [classId], references: [id], onDelete: Cascade`

**Unique Constraints:**  
None

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### Subject

**Purpose:**  
Curriculum courses/kitabs taught within specific jamats.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `classId` | `String` | Yes | - | Foreign key referencing class |
| `nameBn` | `String` | Yes | - | Bangla language localized text |
| `nameEn` | `String` | Yes | - | English language localized text |
| `nameAr` | `String?` | No | - | Arabic language localized text |
| `code` | `String` | Yes | - | Entity attribute representing code |
| `fullMarks` | `Float` | Yes | `100` | Entity attribute representing fullMarks |
| `passMarks` | `Float` | Yes | `33` | Entity attribute representing passMarks |
| `isOptional` | `Boolean` | Yes | `false` | Entity attribute representing isOptional |
| `sortOrder` | `Int` | Yes | `0` | Entity attribute representing sortOrder |
| `isActive` | `Boolean` | Yes | `true` | Entity attribute representing isActive |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `jamatClass` | `JamatClass` | Yes | - | Entity attribute representing jamatClass |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `jamatClass` (JamatClass): `fields: [classId], references: [id], onDelete: Cascade`

**Unique Constraints:**  
None

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### TeacherAssignment

**Purpose:**  
Teacher appointments linking specific teachers to assigned classes, sections, and subjects.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `teacherId` | `String` | Yes | - | Foreign key referencing teacher |
| `classId` | `String` | Yes | - | Foreign key referencing class |
| `sectionId` | `String?` | No | - | Foreign key referencing section |
| `subjectId` | `String?` | No | - | Foreign key referencing subject |
| `sessionId` | `String` | Yes | - | Foreign key referencing session |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `teacher` | `User` | Yes | - | Entity attribute representing teacher |
| `session` | `AcademicSession` | Yes | - | Entity attribute representing session |
| `section` | `Section?` | No | - | Entity attribute representing section |
| `subject` | `Subject?` | No | - | Entity attribute representing subject |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `teacher` (User): `fields: [teacherId], references: [id], onDelete: Cascade`
- `session` (AcademicSession): `fields: [sessionId], references: [id], onDelete: Cascade`
- `section` (Section?): `fields: [sectionId], references: [id], onDelete: SetNull`
- `subject` (Subject?): `fields: [subjectId], references: [id], onDelete: SetNull`

**Unique Constraints:**  
None

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### Student

**Purpose:**  
Core student demographic and academic profile registry.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `studentIdNumber` | `String` | Yes | - | Entity attribute representing studentIdNumber |
| `fullNameBn` | `String` | Yes | - | Bangla language localized text |
| `fullNameEn` | `String` | Yes | - | English language localized text |
| `fullNameAr` | `String?` | No | - | Arabic language localized text |
| `dateOfBirth` | `DateTime` | Yes | - | Entity attribute representing dateOfBirth |
| `gender` | `String` | Yes | - | Entity attribute representing gender |
| `bloodGroup` | `String?` | No | - | Entity attribute representing bloodGroup |
| `nationality` | `String` | Yes | `"Bangladeshi"` | Entity attribute representing nationality |
| `photoUrl` | `String?` | No | - | Entity attribute representing photoUrl |
| `birthCertificateNo` | `String?` | No | - | Entity attribute representing birthCertificateNo |
| `nidNo` | `String?` | No | - | Entity attribute representing nidNo |
| `fatherNameBn` | `String` | Yes | - | Bangla language localized text |
| `fatherNameEn` | `String?` | No | - | English language localized text |
| `fatherPhone` | `String?` | No | - | Entity attribute representing fatherPhone |
| `fatherOccupation` | `String?` | No | - | Entity attribute representing fatherOccupation |
| `motherNameBn` | `String` | Yes | - | Bangla language localized text |
| `motherNameEn` | `String?` | No | - | English language localized text |
| `motherPhone` | `String?` | No | - | Entity attribute representing motherPhone |
| `presentAddress` | `String` | Yes | - | Entity attribute representing presentAddress |
| `permanentAddress` | `String` | Yes | - | Entity attribute representing permanentAddress |
| `residentialStatus` | `String` | Yes | `"NON_RESIDENTIAL"` | Operational state identifier |
| `isOrphan` | `Boolean` | Yes | `false` | Entity attribute representing isOrphan |
| `isFinanciallyWeak` | `Boolean` | Yes | `false` | Entity attribute representing isFinanciallyWeak |
| `status` | `String` | Yes | `"ACTIVE"` | Operational state identifier |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |

**Primary Key:**  
`id`

**Foreign Keys:**  
None

**Unique Constraints:**  
`studentIdNumber`, `birthCertificateNo`, `studentIdNumber`, `birthCertificateNo`

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
- Field `gender`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Scoped access. Guardians can only query records of verified linked wards via `GuardianStudent` relationship.

---

#### Guardian

**Purpose:**  
Parent/guardian registry with contact details and portal credentials.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `userId` | `String?` | No | - | Foreign key referencing user |
| `fullNameBn` | `String` | Yes | - | Bangla language localized text |
| `fullNameEn` | `String?` | No | - | English language localized text |
| `relation` | `String` | Yes | - | Entity attribute representing relation |
| `phone` | `String` | Yes | - | Entity attribute representing phone |
| `email` | `String?` | No | - | Entity attribute representing email |
| `nidNo` | `String?` | No | - | Entity attribute representing nidNo |
| `occupation` | `String?` | No | - | Entity attribute representing occupation |
| `address` | `String?` | No | - | Entity attribute representing address |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `user` | `User?` | No | - | Entity attribute representing user |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `user` (User?): `fields: [userId], references: [id], onDelete: SetNull`

**Unique Constraints:**  
`phone`, `phone`

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### GuardianStudent

**Purpose:**  
Relational join table establishing parent-child links with primary contact designation.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `guardianId` | `String` | Yes | - | Foreign key referencing guardian |
| `studentId` | `String` | Yes | - | Foreign key referencing student |
| `isPrimary` | `Boolean` | Yes | `true` | Entity attribute representing isPrimary |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `guardian` | `Guardian` | Yes | - | Entity attribute representing guardian |
| `student` | `Student` | Yes | - | Entity attribute representing student |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `guardian` (Guardian): `fields: [guardianId], references: [id], onDelete: Cascade`
- `student` (Student): `fields: [studentId], references: [id], onDelete: Cascade`

**Unique Constraints:**  
`@@unique([guardianId, studentId])`

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Scoped access. Guardians can only query records of verified linked wards via `GuardianStudent` relationship.

---

#### Enrollment

**Purpose:**  
Student enrollment records binding a student to an academic session, class, section, and roll number.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `studentId` | `String` | Yes | - | Foreign key referencing student |
| `sessionId` | `String` | Yes | - | Foreign key referencing session |
| `classId` | `String` | Yes | - | Foreign key referencing class |
| `sectionId` | `String?` | No | - | Foreign key referencing section |
| `rollNumber` | `Int` | Yes | - | Entity attribute representing rollNumber |
| `status` | `String` | Yes | `"ACTIVE"` | Operational state identifier |
| `enrolledAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `student` | `Student` | Yes | - | Entity attribute representing student |
| `session` | `AcademicSession` | Yes | - | Entity attribute representing session |
| `jamatClass` | `JamatClass` | Yes | - | Entity attribute representing jamatClass |
| `section` | `Section?` | No | - | Entity attribute representing section |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `student` (Student): `fields: [studentId], references: [id], onDelete: Cascade`
- `session` (AcademicSession): `fields: [sessionId], references: [id], onDelete: Cascade`
- `jamatClass` (JamatClass): `fields: [classId], references: [id], onDelete: Cascade`
- `section` (Section?): `fields: [sectionId], references: [id], onDelete: SetNull`

**Unique Constraints:**  
`@@unique([sessionId, classId, sectionId, rollNumber])`

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
- Field `status`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### StudentDocument

**Purpose:**  
Metadata for uploaded student certificates, birth registration, and identity papers.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `studentId` | `String` | Yes | - | Foreign key referencing student |
| `documentType` | `String` | Yes | - | Entity attribute representing documentType |
| `fileUrl` | `String` | Yes | - | Entity attribute representing fileUrl |
| `fileName` | `String` | Yes | - | Entity attribute representing fileName |
| `fileSize` | `Int?` | No | - | Entity attribute representing fileSize |
| `mimeType` | `String?` | No | - | Entity attribute representing mimeType |
| `uploadedByUserId` | `String?` | No | - | Foreign key referencing uploadedByUser |
| `verificationStatus` | `String` | Yes | `"PENDING"` | Operational state identifier |
| `verificationReason` | `String?` | No | - | Entity attribute representing verificationReason |
| `verifiedAt` | `DateTime?` | No | - | Timestamp / Date record |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `student` | `Student` | Yes | - | Entity attribute representing student |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `student` (Student): `fields: [studentId], references: [id], onDelete: Cascade`

**Unique Constraints:**  
None

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
- Field `verificationStatus`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### Application

**Purpose:**  
Online public admission applications submitted for admin review and formal approval.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `applicationNumber` | `String` | Yes | - | Entity attribute representing applicationNumber |
| `source` | `String` | Yes | `"ONLINE"` | Entity attribute representing source |
| `sessionId` | `String?` | No | - | Foreign key referencing session |
| `desiredClassId` | `String` | Yes | - | Foreign key referencing desiredClass |
| `desiredSectionId` | `String?` | No | - | Foreign key referencing desiredSection |
| `studentNameBn` | `String` | Yes | - | Bangla language localized text |
| `studentNameEn` | `String` | Yes | - | English language localized text |
| `studentNameAr` | `String?` | No | - | Arabic language localized text |
| `dateOfBirth` | `DateTime` | Yes | - | Entity attribute representing dateOfBirth |
| `gender` | `String` | Yes | - | Entity attribute representing gender |
| `bloodGroup` | `String?` | No | - | Entity attribute representing bloodGroup |
| `birthCertificateNo` | `String?` | No | - | Entity attribute representing birthCertificateNo |
| `nidNo` | `String?` | No | - | Entity attribute representing nidNo |
| `nationality` | `String` | Yes | `"Bangladeshi"` | Entity attribute representing nationality |
| `desiredResidentialStatus` | `String` | Yes | `"NON_RESIDENTIAL"` | Operational state identifier |
| `fatherNameBn` | `String?` | No | - | Bangla language localized text |
| `fatherPhone` | `String?` | No | - | Entity attribute representing fatherPhone |
| `fatherOccupation` | `String?` | No | - | Entity attribute representing fatherOccupation |
| `motherNameBn` | `String?` | No | - | Bangla language localized text |
| `motherPhone` | `String?` | No | - | Entity attribute representing motherPhone |
| `guardianName` | `String` | Yes | - | Entity attribute representing guardianName |
| `guardianPhone` | `String` | Yes | - | Entity attribute representing guardianPhone |
| `guardianEmail` | `String?` | No | - | Entity attribute representing guardianEmail |
| `guardianRelation` | `String?` | No | `"FATHER"` | Entity attribute representing guardianRelation |
| `guardianAddress` | `String?` | No | - | Entity attribute representing guardianAddress |
| `address` | `String` | Yes | - | Entity attribute representing address |
| `presentAddress` | `String?` | No | - | Entity attribute representing presentAddress |
| `permanentAddress` | `String?` | No | - | Entity attribute representing permanentAddress |
| `previousInstitute` | `String?` | No | - | Entity attribute representing previousInstitute |
| `previousClass` | `String?` | No | - | Entity attribute representing previousClass |
| `isOrphan` | `Boolean` | Yes | `false` | Entity attribute representing isOrphan |
| `isFinanciallyWeak` | `Boolean` | Yes | `false` | Entity attribute representing isFinanciallyWeak |
| `financialAssistanceRequested` | `Boolean` | Yes | `false` | Entity attribute representing financialAssistanceRequested |
| `specialAssistanceDetails` | `String?` | No | - | Entity attribute representing specialAssistanceDetails |
| `documentsJson` | `String?` | No | - | Immutable serialized JSON payload |
| `submissionToken` | `String?` | No | - | Entity attribute representing submissionToken |
| `status` | `String` | Yes | `"SUBMITTED"` | Operational state identifier |
| `remarks` | `String?` | No | - | Entity attribute representing remarks |
| `reviewNotes` | `String?` | No | - | Entity attribute representing reviewNotes |
| `verificationStatus` | `String?` | No | `"PENDING"` | Operational state identifier |
| `verificationNotes` | `String?` | No | - | Entity attribute representing verificationNotes |
| `verifiedByUserId` | `String?` | No | - | Foreign key referencing verifiedByUser |
| `examInterviewScheduledAt` | `DateTime?` | No | - | Timestamp / Date record |
| `examInterviewResult` | `String?` | No | - | Entity attribute representing examInterviewResult |
| `correctionReason` | `String?` | No | - | Entity attribute representing correctionReason |
| `rejectionReason` | `String?` | No | - | Entity attribute representing rejectionReason |
| `rejectedByUserId` | `String?` | No | - | Foreign key referencing rejectedByUser |
| `approvedByUserId` | `String?` | No | - | Foreign key referencing approvedByUser |
| `createdStudentId` | `String?` | No | - | Foreign key referencing createdStudent |
| `submittedAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `reviewedAt` | `DateTime?` | No | - | Timestamp / Date record |
| `approvedAt` | `DateTime?` | No | - | Timestamp / Date record |
| `rejectedAt` | `DateTime?` | No | - | Timestamp / Date record |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |

**Primary Key:**  
`id`

**Foreign Keys:**  
None

**Unique Constraints:**  
`applicationNumber`, `submissionToken`, `applicationNumber`, `submissionToken`

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
- Field `gender`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### Attendance

**Purpose:**  
Daily attendance logs recorded for enrolled students across class sections.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `studentId` | `String` | Yes | - | Foreign key referencing student |
| `sessionId` | `String` | Yes | - | Foreign key referencing session |
| `classId` | `String` | Yes | - | Foreign key referencing class |
| `sectionId` | `String?` | No | - | Foreign key referencing section |
| `date` | `DateTime` | Yes | - | Entity attribute representing date |
| `status` | `String` | Yes | - | Operational state identifier |
| `remarks` | `String?` | No | - | Entity attribute representing remarks |
| `leaveReason` | `String?` | No | - | Entity attribute representing leaveReason |
| `markedByUserId` | `String?` | No | - | Foreign key referencing markedByUser |
| `updatedByUserId` | `String?` | No | - | Foreign key referencing updatedByUser |
| `correctionReason` | `String?` | No | - | Entity attribute representing correctionReason |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `student` | `Student` | Yes | - | Entity attribute representing student |
| `session` | `AcademicSession` | Yes | - | Entity attribute representing session |
| `jamatClass` | `JamatClass` | Yes | - | Entity attribute representing jamatClass |
| `section` | `Section?` | No | - | Entity attribute representing section |
| `markedByUser` | `User?` | No | - | Entity attribute representing markedByUser |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `student` (Student): `fields: [studentId], references: [id], onDelete: Cascade`
- `session` (AcademicSession): `fields: [sessionId], references: [id], onDelete: Cascade`
- `jamatClass` (JamatClass): `fields: [classId], references: [id], onDelete: Cascade`
- `section` (Section?): `fields: [sectionId], references: [id], onDelete: SetNull`
- `markedByUser` (User?): `fields: [markedByUserId], references: [id], onDelete: SetNull`

**Unique Constraints:**  
`@@unique([studentId, date])`

**Indexes:**  
- `@@index([sessionId, classId, sectionId, date])`
- `@@index([studentId, date])`
- `@@index([date, status])`

**Status / Enum Values:**  
- Field `status`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Scoped to teachers based on active `TeacherAssignment`. Locked after verification window expires.

---

#### AttendanceLock

**Purpose:**  
Administrative lock flags freezing past attendance records from unauthorized edits.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `sessionId` | `String` | Yes | - | Foreign key referencing session |
| `classId` | `String` | Yes | - | Foreign key referencing class |
| `sectionId` | `String?` | No | - | Foreign key referencing section |
| `date` | `DateTime` | Yes | - | Entity attribute representing date |
| `isLocked` | `Boolean` | Yes | `true` | Entity attribute representing isLocked |
| `lockedAt` | `DateTime?` | No | `now(` | Timestamp / Date record |
| `lockedByUserId` | `String?` | No | - | Foreign key referencing lockedByUser |
| `unlockedAt` | `DateTime?` | No | - | Timestamp / Date record |
| `unlockedByUserId` | `String?` | No | - | Foreign key referencing unlockedByUser |
| `reason` | `String?` | No | - | Entity attribute representing reason |
| `session` | `AcademicSession` | Yes | - | Entity attribute representing session |
| `jamatClass` | `JamatClass` | Yes | - | Entity attribute representing jamatClass |
| `section` | `Section?` | No | - | Entity attribute representing section |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `session` (AcademicSession): `fields: [sessionId], references: [id], onDelete: Cascade`
- `jamatClass` (JamatClass): `fields: [classId], references: [id], onDelete: Cascade`
- `section` (Section?): `fields: [sectionId], references: [id], onDelete: SetNull`

**Unique Constraints:**  
`@@unique([sessionId, classId, sectionId, date])`

**Indexes:**  
- `@@index([sessionId, classId, date])`

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---


### 3. Examinations & Qawmi Grading Engine

#### ExamType

**Purpose:**  
Categories of institutional examinations (e.g., First Term, Half-Yearly, Annual).

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `code` | `String` | Yes | - | Entity attribute representing code |
| `nameBn` | `String` | Yes | - | Bangla language localized text |
| `nameEn` | `String` | Yes | - | English language localized text |
| `sortOrder` | `Int` | Yes | `0` | Entity attribute representing sortOrder |
| `isActive` | `Boolean` | Yes | `true` | Entity attribute representing isActive |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |

**Primary Key:**  
`id`

**Foreign Keys:**  
None

**Unique Constraints:**  
`code`, `code`

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### Exam

**Purpose:**  
Specific scheduled examination events bound to an academic session and exam type.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `sessionId` | `String` | Yes | - | Foreign key referencing session |
| `examTypeId` | `String?` | No | - | Foreign key referencing examType |
| `nameBn` | `String` | Yes | - | Bangla language localized text |
| `nameEn` | `String` | Yes | - | English language localized text |
| `examType` | `String` | Yes | `"GENERAL"` | Entity attribute representing examType |
| `startDate` | `DateTime` | Yes | - | Timestamp / Date record |
| `endDate` | `DateTime` | Yes | - | Timestamp / Date record |
| `status` | `String` | Yes | `"DRAFT"` | Operational state identifier |
| `instructions` | `String?` | No | - | Entity attribute representing instructions |
| `isPublished` | `Boolean` | Yes | `false` | Entity attribute representing isPublished |
| `publishedAt` | `DateTime?` | No | - | Timestamp / Date record |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `session` | `AcademicSession` | Yes | - | Entity attribute representing session |
| `examTypeRef` | `ExamType?` | No | - | Entity attribute representing examTypeRef |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `session` (AcademicSession): `fields: [sessionId], references: [id], onDelete: Cascade`
- `examTypeRef` (ExamType?): `fields: [examTypeId], references: [id], onDelete: SetNull`

**Unique Constraints:**  
None

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
- Field `status`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### ExamSubject

**Purpose:**  
Subject-level exam allocations defining maximum marks, pass marks, and schedule.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `examId` | `String` | Yes | - | Foreign key referencing exam |
| `classId` | `String` | Yes | - | Foreign key referencing class |
| `subjectId` | `String` | Yes | - | Foreign key referencing subject |
| `examDate` | `DateTime` | Yes | - | Timestamp / Date record |
| `startTime` | `String` | Yes | - | Entity attribute representing startTime |
| `endTime` | `String` | Yes | - | Entity attribute representing endTime |
| `fullMarks` | `Float` | Yes | `100` | Entity attribute representing fullMarks |
| `passMarks` | `Float` | Yes | `33` | Entity attribute representing passMarks |
| `exam` | `Exam` | Yes | - | Entity attribute representing exam |
| `jamatClass` | `JamatClass` | Yes | - | Entity attribute representing jamatClass |
| `subject` | `Subject` | Yes | - | Entity attribute representing subject |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `exam` (Exam): `fields: [examId], references: [id], onDelete: Cascade`
- `jamatClass` (JamatClass): `fields: [classId], references: [id], onDelete: Cascade`
- `subject` (Subject): `fields: [subjectId], references: [id], onDelete: Cascade`

**Unique Constraints:**  
None

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### ExamRoutine

**Purpose:**  
Timetable schedules for examination sittings across rooms and sessions.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `examId` | `String` | Yes | - | Foreign key referencing exam |
| `classId` | `String` | Yes | - | Foreign key referencing class |
| `sectionId` | `String?` | No | - | Foreign key referencing section |
| `subjectId` | `String` | Yes | - | Foreign key referencing subject |
| `examDate` | `DateTime` | Yes | - | Timestamp / Date record |
| `startTime` | `String` | Yes | - | Entity attribute representing startTime |
| `endTime` | `String` | Yes | - | Entity attribute representing endTime |
| `roomNo` | `String?` | No | - | Entity attribute representing roomNo |
| `instructions` | `String?` | No | - | Entity attribute representing instructions |
| `status` | `String` | Yes | `"PUBLISHED"` | Operational state identifier |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `exam` | `Exam` | Yes | - | Entity attribute representing exam |
| `jamatClass` | `JamatClass` | Yes | - | Entity attribute representing jamatClass |
| `section` | `Section?` | No | - | Entity attribute representing section |
| `subject` | `Subject` | Yes | - | Entity attribute representing subject |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `exam` (Exam): `fields: [examId], references: [id], onDelete: Cascade`
- `jamatClass` (JamatClass): `fields: [classId], references: [id], onDelete: Cascade`
- `section` (Section?): `fields: [sectionId], references: [id], onDelete: SetNull`
- `subject` (Subject): `fields: [subjectId], references: [id], onDelete: Cascade`

**Unique Constraints:**  
None

**Indexes:**  
- `@@index([examId, classId, examDate])`

**Status / Enum Values:**  
- Field `status`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### AdmitCard

**Purpose:**  
Generated student examination admit cards with seat numbers and QR verification.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `examId` | `String` | Yes | - | Foreign key referencing exam |
| `studentId` | `String` | Yes | - | Foreign key referencing student |
| `rollNumber` | `Int` | Yes | - | Entity attribute representing rollNumber |
| `qrCodeToken` | `String` | Yes | - | Entity attribute representing qrCodeToken |
| `issuedAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `exam` | `Exam` | Yes | - | Entity attribute representing exam |
| `student` | `Student` | Yes | - | Entity attribute representing student |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `exam` (Exam): `fields: [examId], references: [id], onDelete: Cascade`
- `student` (Student): `fields: [studentId], references: [id], onDelete: Cascade`

**Unique Constraints:**  
`qrCodeToken`, `qrCodeToken`, `@@unique([examId, studentId])`

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### ExamMark

**Purpose:**  
Subject marks obtained by students in an exam, supporting draft and published states.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `examId` | `String` | Yes | - | Foreign key referencing exam |
| `studentId` | `String` | Yes | - | Foreign key referencing student |
| `subjectId` | `String` | Yes | - | Foreign key referencing subject |
| `classId` | `String?` | No | - | Foreign key referencing class |
| `sectionId` | `String?` | No | - | Foreign key referencing section |
| `marksObtained` | `Float?` | No | - | Entity attribute representing marksObtained |
| `isAbsent` | `Boolean` | Yes | `false` | Entity attribute representing isAbsent |
| `isExempt` | `Boolean` | Yes | `false` | Entity attribute representing isExempt |
| `letterGrade` | `String?` | No | - | Entity attribute representing letterGrade |
| `gradeRemarks` | `String?` | No | - | Entity attribute representing gradeRemarks |
| `status` | `String` | Yes | `"DRAFT"` | Operational state identifier |
| `submittedAt` | `DateTime?` | No | - | Timestamp / Date record |
| `recordedByUserId` | `String?` | No | - | Foreign key referencing recordedByUser |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `exam` | `Exam` | Yes | - | Entity attribute representing exam |
| `student` | `Student` | Yes | - | Entity attribute representing student |
| `subject` | `Subject` | Yes | - | Entity attribute representing subject |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `exam` (Exam): `fields: [examId], references: [id], onDelete: Cascade`
- `student` (Student): `fields: [studentId], references: [id], onDelete: Cascade`
- `subject` (Subject): `fields: [subjectId], references: [id], onDelete: Cascade`

**Unique Constraints:**  
`@@unique([examId, studentId, subjectId])`

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
- Field `status`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Scoped to teachers based on active `TeacherAssignment`. Locked after verification window expires.

---

#### Result

**Purpose:**  
Compiled student academic result records featuring total marks, Qawmi grade, and pass/fail status.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `examId` | `String` | Yes | - | Foreign key referencing exam |
| `studentId` | `String` | Yes | - | Foreign key referencing student |
| `sessionId` | `String?` | No | - | Foreign key referencing session |
| `classId` | `String?` | No | - | Foreign key referencing class |
| `rollNumber` | `Int?` | No | - | Entity attribute representing rollNumber |
| `totalMarks` | `Float` | Yes | `0` | Entity attribute representing totalMarks |
| `totalObtained` | `Float` | Yes | `0` | Entity attribute representing totalObtained |
| `totalFullMarks` | `Float` | Yes | `0` | Entity attribute representing totalFullMarks |
| `percentage` | `Float` | Yes | `0` | Entity attribute representing percentage |
| `finalGradeBn` | `String` | Yes | - | Bangla language localized text |
| `finalGradeEn` | `String?` | No | - | English language localized text |
| `isPassed` | `Boolean` | Yes | `true` | Entity attribute representing isPassed |
| `rankInClass` | `Int?` | No | - | Entity attribute representing rankInClass |
| `status` | `String` | Yes | `"DRAFT"` | Operational state identifier |
| `verificationCode` | `String?` | No | - | Entity attribute representing verificationCode |
| `snapshotJson` | `String?` | No | - | Immutable serialized JSON payload |
| `correctionReason` | `String?` | No | - | Entity attribute representing correctionReason |
| `publishedAt` | `DateTime?` | No | - | Timestamp / Date record |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `exam` | `Exam` | Yes | - | Entity attribute representing exam |
| `student` | `Student` | Yes | - | Entity attribute representing student |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `exam` (Exam): `fields: [examId], references: [id], onDelete: Cascade`
- `student` (Student): `fields: [studentId], references: [id], onDelete: Cascade`

**Unique Constraints:**  
`verificationCode`, `verificationCode`, `@@unique([examId, studentId])`

**Indexes:**  
- `@@index([verificationCode])`

**Status / Enum Values:**  
- Field `status`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Scoped access. Guardians can only query records of verified linked wards via `GuardianStudent` relationship.

---


### 4. Finance, Invoicing, Shariah Funds & Cashbook

#### FeeCategory

**Purpose:**  
Classification of institutional fees (e.g. Admission, Tuition, Boarding, Exam, Library).

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `nameBn` | `String` | Yes | - | Bangla language localized text |
| `nameEn` | `String` | Yes | - | English language localized text |
| `code` | `String` | Yes | - | Entity attribute representing code |
| `defaultAmount` | `Float` | Yes | `0` | Monetary amount in BDT (৳) |
| `isRecurring` | `Boolean` | Yes | `true` | Entity attribute representing isRecurring |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |

**Primary Key:**  
`id`

**Foreign Keys:**  
None

**Unique Constraints:**  
`code`, `code`

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### FeeStructure

**Purpose:**  
Prescribed fee rates defined per jamat, category, and academic session.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `sessionId` | `String` | Yes | - | Foreign key referencing session |
| `classId` | `String?` | No | - | Foreign key referencing class |
| `residentialStatus` | `String` | Yes | `"ALL"` | Operational state identifier |
| `feeType` | `String` | Yes | - | Entity attribute representing feeType |
| `nameBn` | `String` | Yes | - | Bangla language localized text |
| `amount` | `Float` | Yes | - | Entity attribute representing amount |
| `isRecurring` | `Boolean` | Yes | `false` | Entity attribute representing isRecurring |
| `billingMonth` | `String?` | No | - | Entity attribute representing billingMonth |
| `dueDay` | `Int` | Yes | `10` | Entity attribute representing dueDay |
| `lateFeeAmount` | `Float` | Yes | `0` | Monetary amount in BDT (৳) |
| `lateFeeGraceDays` | `Int` | Yes | `5` | Entity attribute representing lateFeeGraceDays |
| `fundCode` | `String` | Yes | `"GENERAL"` | Entity attribute representing fundCode |
| `isActive` | `Boolean` | Yes | `true` | Entity attribute representing isActive |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `session` | `AcademicSession` | Yes | - | Entity attribute representing session |
| `jamatClass` | `JamatClass?` | No | - | Entity attribute representing jamatClass |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `session` (AcademicSession): `fields: [sessionId], references: [id], onDelete: Cascade`
- `jamatClass` (JamatClass?): `fields: [classId], references: [id], onDelete: SetNull`

**Unique Constraints:**  
None

**Indexes:**  
- `@@index([sessionId, classId, feeType])`

**Status / Enum Values:**  
- Field `residentialStatus`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### FeeInvoice

**Purpose:**  
Billed fee statements generated for enrolled students with due dates and amounts.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `invoiceNumber` | `String` | Yes | - | Entity attribute representing invoiceNumber |
| `studentId` | `String` | Yes | - | Foreign key referencing student |
| `sessionId` | `String` | Yes | - | Foreign key referencing session |
| `feeType` | `String` | Yes | `"OTHER"` | Entity attribute representing feeType |
| `billingMonth` | `String?` | No | - | Entity attribute representing billingMonth |
| `title` | `String` | Yes | - | Entity attribute representing title |
| `dueDate` | `DateTime` | Yes | - | Timestamp / Date record |
| `totalAmount` | `Float` | Yes | - | Monetary amount in BDT (৳) |
| `discountAmount` | `Float` | Yes | `0` | Monetary amount in BDT (৳) |
| `waiverAmount` | `Float` | Yes | `0` | Monetary amount in BDT (৳) |
| `lateFeeAmount` | `Float` | Yes | `0` | Monetary amount in BDT (৳) |
| `netAmount` | `Float` | Yes | - | Monetary amount in BDT (৳) |
| `paidAmount` | `Float` | Yes | `0` | Monetary amount in BDT (৳) |
| `dueAmount` | `Float` | Yes | - | Monetary amount in BDT (৳) |
| `fundCode` | `String` | Yes | `"GENERAL"` | Entity attribute representing fundCode |
| `idempotencyKey` | `String?` | No | - | Entity attribute representing idempotencyKey |
| `status` | `String` | Yes | `"UNPAID"` | Operational state identifier |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `student` | `Student` | Yes | - | Entity attribute representing student |
| `session` | `AcademicSession` | Yes | - | Entity attribute representing session |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `student` (Student): `fields: [studentId], references: [id], onDelete: Cascade`
- `session` (AcademicSession): `fields: [sessionId], references: [id], onDelete: Cascade`

**Unique Constraints:**  
`invoiceNumber`, `idempotencyKey`, `invoiceNumber`, `idempotencyKey`

**Indexes:**  
- `@@index([studentId, sessionId, status])`

**Status / Enum Values:**  
- Field `fundCode`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Shariah and financial transaction security. Non-negative constraint enforced. Double-entry posting protected by database transaction.

---

#### InvoiceItem

**Purpose:**  
Itemized billing lines constituting a fee invoice.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `invoiceId` | `String` | Yes | - | Foreign key referencing invoice |
| `feeCategoryId` | `String` | Yes | - | Foreign key referencing feeCategory |
| `description` | `String` | Yes | - | Entity attribute representing description |
| `amount` | `Float` | Yes | - | Entity attribute representing amount |
| `invoice` | `FeeInvoice` | Yes | - | Entity attribute representing invoice |
| `feeCategory` | `FeeCategory` | Yes | - | Entity attribute representing feeCategory |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `invoice` (FeeInvoice): `fields: [invoiceId], references: [id], onDelete: Cascade`
- `feeCategory` (FeeCategory): `fields: [feeCategoryId], references: [id], onDelete: Cascade`

**Unique Constraints:**  
None

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### PaymentReceipt

**Purpose:**  
Official monetary payment receipts issued upon successful settlement of fee invoices.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `receiptNumber` | `String` | Yes | - | Entity attribute representing receiptNumber |
| `invoiceId` | `String` | Yes | - | Foreign key referencing invoice |
| `studentId` | `String` | Yes | - | Foreign key referencing student |
| `amount` | `Float` | Yes | - | Entity attribute representing amount |
| `paymentMethod` | `String` | Yes | - | Entity attribute representing paymentMethod |
| `transactionId` | `String?` | No | - | Foreign key referencing transaction |
| `paymentStatus` | `String` | Yes | `"SUCCESSFUL"` | Operational state identifier |
| `idempotencyKey` | `String?` | No | - | Entity attribute representing idempotencyKey |
| `fundCode` | `String` | Yes | `"GENERAL"` | Entity attribute representing fundCode |
| `financialAccountId` | `String?` | No | - | Foreign key referencing financialAccount |
| `receivedByUserId` | `String?` | No | - | Foreign key referencing receivedByUser |
| `receiptDate` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `qrCodeToken` | `String` | Yes | - | Entity attribute representing qrCodeToken |
| `notes` | `String?` | No | - | Entity attribute representing notes |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `invoice` | `FeeInvoice` | Yes | - | Entity attribute representing invoice |
| `student` | `Student` | Yes | - | Entity attribute representing student |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `invoice` (FeeInvoice): `fields: [invoiceId], references: [id], onDelete: Cascade`
- `student` (Student): `fields: [studentId], references: [id], onDelete: Cascade`

**Unique Constraints:**  
`receiptNumber`, `transactionId`, `idempotencyKey`, `qrCodeToken`, `receiptNumber`, `transactionId`, `idempotencyKey`, `qrCodeToken`

**Indexes:**  
- `@@index([transactionId])`
- `@@index([studentId, paymentStatus])`

**Status / Enum Values:**  
- Field `paymentStatus`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Shariah and financial transaction security. Non-negative constraint enforced. Double-entry posting protected by database transaction.

---

#### PaymentIntent

**Purpose:**  
Transient online payment initiation intents tracking gateway checkout progress.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `intentNumber` | `String` | Yes | - | Entity attribute representing intentNumber |
| `invoiceId` | `String` | Yes | - | Foreign key referencing invoice |
| `studentId` | `String` | Yes | - | Foreign key referencing student |
| `guardianUserId` | `String` | Yes | - | Foreign key referencing guardianUser |
| `amount` | `Float` | Yes | - | Entity attribute representing amount |
| `currency` | `String` | Yes | `"BDT"` | Entity attribute representing currency |
| `provider` | `String` | Yes | - | Entity attribute representing provider |
| `gatewayPaymentId` | `String?` | No | - | Foreign key referencing gatewayPayment |
| `gatewayTransactionId` | `String?` | No | - | Foreign key referencing gatewayTransaction |
| `status` | `String` | Yes | `"CREATED"` | Operational state identifier |
| `idempotencyKey` | `String` | Yes | - | Entity attribute representing idempotencyKey |
| `checkoutUrl` | `String?` | No | - | Entity attribute representing checkoutUrl |
| `clientCallbackUrl` | `String?` | No | - | Entity attribute representing clientCallbackUrl |
| `expiresAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `rawGatewayResponse` | `String?` | No | - | Entity attribute representing rawGatewayResponse |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `invoice` | `FeeInvoice` | Yes | - | Entity attribute representing invoice |
| `student` | `Student` | Yes | - | Entity attribute representing student |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `invoice` (FeeInvoice): `fields: [invoiceId], references: [id], onDelete: Cascade`
- `student` (Student): `fields: [studentId], references: [id], onDelete: Cascade`

**Unique Constraints:**  
`intentNumber`, `gatewayPaymentId`, `gatewayTransactionId`, `idempotencyKey`, `intentNumber`, `gatewayPaymentId`, `gatewayTransactionId`, `idempotencyKey`

**Indexes:**  
- `@@index([guardianUserId, status])`
- `@@index([gatewayPaymentId])`

**Status / Enum Values:**  
- Field `status`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### Refund

**Purpose:**  
Transactional record of full or partial payment refunds reversed back to payer and fund.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `refundNumber` | `String` | Yes | - | Entity attribute representing refundNumber |
| `paymentId` | `String` | Yes | - | Foreign key referencing payment |
| `invoiceId` | `String` | Yes | - | Foreign key referencing invoice |
| `amount` | `Float` | Yes | - | Entity attribute representing amount |
| `reason` | `String` | Yes | - | Entity attribute representing reason |
| `approvedByUserId` | `String?` | No | - | Foreign key referencing approvedByUser |
| `refundMethod` | `String` | Yes | `"CASH"` | Entity attribute representing refundMethod |
| `refundDate` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `fundCode` | `String` | Yes | `"GENERAL"` | Entity attribute representing fundCode |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `payment` | `PaymentReceipt` | Yes | - | Entity attribute representing payment |
| `invoice` | `FeeInvoice` | Yes | - | Entity attribute representing invoice |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `payment` (PaymentReceipt): `fields: [paymentId], references: [id], onDelete: Cascade`
- `invoice` (FeeInvoice): `fields: [invoiceId], references: [id], onDelete: Cascade`

**Unique Constraints:**  
`refundNumber`, `refundNumber`

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
- Field `fundCode`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### CashFund

**Purpose:**  
Shariah-segregated institutional cash funds (General, Lillah, Zakat, Construction, Orphan).

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `nameBn` | `String` | Yes | - | Bangla language localized text |
| `nameEn` | `String` | Yes | - | English language localized text |
| `code` | `String` | Yes | - | Entity attribute representing code |
| `currentBalance` | `Float` | Yes | `0` | Monetary amount in BDT (৳) |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |

**Primary Key:**  
`id`

**Foreign Keys:**  
None

**Unique Constraints:**  
`code`, `code`

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Shariah and financial transaction security. Non-negative constraint enforced. Double-entry posting protected by database transaction.

---

#### CashTransaction

**Purpose:**  
Double-entry cashbook ledger postings recording debits, credits, and fund balances.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `fundId` | `String` | Yes | - | Foreign key referencing fund |
| `type` | `String` | Yes | - | Entity attribute representing type |
| `category` | `String` | Yes | - | Entity attribute representing category |
| `amount` | `Float` | Yes | - | Entity attribute representing amount |
| `payeeOrPayer` | `String` | Yes | - | Entity attribute representing payeeOrPayer |
| `paymentMethod` | `String` | Yes | - | Entity attribute representing paymentMethod |
| `referenceNo` | `String?` | No | - | Entity attribute representing referenceNo |
| `receiptOrVoucherNo` | `String` | Yes | - | Entity attribute representing receiptOrVoucherNo |
| `attachmentUrl` | `String?` | No | - | Entity attribute representing attachmentUrl |
| `approvedByUserId` | `String?` | No | - | Foreign key referencing approvedByUser |
| `transactionDate` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `notes` | `String?` | No | - | Entity attribute representing notes |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `fund` | `CashFund` | Yes | - | Entity attribute representing fund |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `fund` (CashFund): `fields: [fundId], references: [id], onDelete: Cascade`

**Unique Constraints:**  
`receiptOrVoucherNo`, `receiptOrVoucherNo`

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Shariah and financial transaction security. Non-negative constraint enforced. Double-entry posting protected by database transaction.

---

#### FinancialAccount

**Purpose:**  
Institutional bank and cash accounts tracking ledger balances.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `nameBn` | `String` | Yes | - | Bangla language localized text |
| `nameEn` | `String` | Yes | - | English language localized text |
| `type` | `String` | Yes | - | Entity attribute representing type |
| `accountNumber` | `String?` | No | - | Entity attribute representing accountNumber |
| `bankName` | `String?` | No | - | Entity attribute representing bankName |
| `branchName` | `String?` | No | - | Entity attribute representing branchName |
| `currentBalance` | `Float` | Yes | `0` | Monetary amount in BDT (৳) |
| `isActive` | `Boolean` | Yes | `true` | Entity attribute representing isActive |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |

**Primary Key:**  
`id`

**Foreign Keys:**  
None

**Unique Constraints:**  
None

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### FinancialAssistance

**Purpose:**  
Financial hardship fee waivers, discounts, and concessions granted to eligible students.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `studentId` | `String` | Yes | - | Foreign key referencing student |
| `sessionId` | `String` | Yes | - | Foreign key referencing session |
| `reason` | `String` | Yes | - | Entity attribute representing reason |
| `isOrphan` | `Boolean` | Yes | `false` | Entity attribute representing isOrphan |
| `familyCondition` | `String?` | No | - | Entity attribute representing familyCondition |
| `waiverPercentage` | `Float` | Yes | `0` | Entity attribute representing waiverPercentage |
| `waiverAmount` | `Float` | Yes | `0` | Monetary amount in BDT (৳) |
| `feeCategoryTarget` | `String?` | No | - | Entity attribute representing feeCategoryTarget |
| `status` | `String` | Yes | `"PENDING"` | Operational state identifier |
| `approvedByUserId` | `String?` | No | - | Foreign key referencing approvedByUser |
| `validFrom` | `DateTime` | Yes | - | Entity attribute representing validFrom |
| `validTo` | `DateTime` | Yes | - | Entity attribute representing validTo |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `student` | `Student` | Yes | - | Entity attribute representing student |
| `session` | `AcademicSession` | Yes | - | Entity attribute representing session |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `student` (Student): `fields: [studentId], references: [id], onDelete: Cascade`
- `session` (AcademicSession): `fields: [sessionId], references: [id], onDelete: Cascade`

**Unique Constraints:**  
None

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
- Field `status`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### Scholarship

**Purpose:**  
Merit and hardship scholarship programs offering fixed or percentage fee reductions.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `nameBn` | `String` | Yes | - | Bangla language localized text |
| `code` | `String` | Yes | - | Entity attribute representing code |
| `discountType` | `String` | Yes | `"PERCENTAGE"` | Entity attribute representing discountType |
| `discountValue` | `Float` | Yes | - | Entity attribute representing discountValue |
| `applicableFeeType` | `String` | Yes | `"ALL"` | Entity attribute representing applicableFeeType |
| `isActive` | `Boolean` | Yes | `true` | Entity attribute representing isActive |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |

**Primary Key:**  
`id`

**Foreign Keys:**  
None

**Unique Constraints:**  
`code`, `code`

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### StudentScholarship

**Purpose:**  
Active scholarship allocations awarded to specific students.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `scholarshipId` | `String` | Yes | - | Foreign key referencing scholarship |
| `studentId` | `String` | Yes | - | Foreign key referencing student |
| `sessionId` | `String` | Yes | - | Foreign key referencing session |
| `effectiveFrom` | `DateTime` | Yes | - | Entity attribute representing effectiveFrom |
| `effectiveTo` | `DateTime` | Yes | - | Entity attribute representing effectiveTo |
| `approvedByUserId` | `String?` | No | - | Foreign key referencing approvedByUser |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `scholarship` | `Scholarship` | Yes | - | Entity attribute representing scholarship |
| `student` | `Student` | Yes | - | Entity attribute representing student |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `scholarship` (Scholarship): `fields: [scholarshipId], references: [id], onDelete: Cascade`
- `student` (Student): `fields: [studentId], references: [id], onDelete: Cascade`

**Unique Constraints:**  
`@@unique([scholarshipId, studentId, sessionId])`

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### PayrollRecord

**Purpose:**  
Salary disbursements and payroll expense transactions paid to madrasa staff.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `voucherNumber` | `String` | Yes | - | Entity attribute representing voucherNumber |
| `userId` | `String` | Yes | - | Foreign key referencing user |
| `month` | `String` | Yes | - | Entity attribute representing month |
| `baseSalary` | `Float` | Yes | - | Entity attribute representing baseSalary |
| `allowances` | `Float` | Yes | `0` | Entity attribute representing allowances |
| `deductions` | `Float` | Yes | `0` | Entity attribute representing deductions |
| `advanceDeduction` | `Float` | Yes | `0` | Entity attribute representing advanceDeduction |
| `netSalary` | `Float` | Yes | - | Entity attribute representing netSalary |
| `status` | `String` | Yes | `"DRAFT"` | Operational state identifier |
| `paymentMethod` | `String` | Yes | `"CASH"` | Entity attribute representing paymentMethod |
| `paymentDate` | `DateTime?` | No | - | Timestamp / Date record |
| `fundCode` | `String` | Yes | `"GENERAL"` | Entity attribute representing fundCode |
| `notes` | `String?` | No | - | Entity attribute representing notes |
| `approvedByUserId` | `String?` | No | - | Foreign key referencing approvedByUser |
| `employeeId` | `String?` | No | - | Foreign key referencing employee |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `user` | `User` | Yes | - | Entity attribute representing user |
| `employee` | `Employee?` | No | - | Entity attribute representing employee |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `user` (User): `fields: [userId], references: [id], onDelete: Cascade`
- `employee` (Employee?): `fields: [employeeId], references: [id], onDelete: SetNull`

**Unique Constraints:**  
`voucherNumber`, `voucherNumber`, `@@unique([userId, month])`

**Indexes:**  
- `@@index([employeeId])`

**Status / Enum Values:**  
- Field `status`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### InboundWebhookEvent

**Purpose:**  
Idempotent log of inbound webhooks received from payment gateways or external services.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `webhookId` | `String` | Yes | - | Foreign key referencing webhook |
| `provider` | `String` | Yes | - | Entity attribute representing provider |
| `eventType` | `String` | Yes | - | Entity attribute representing eventType |
| `payloadHash` | `String` | Yes | - | Entity attribute representing payloadHash |
| `signature` | `String?` | No | - | Entity attribute representing signature |
| `signatureStatus` | `String` | Yes | - | Operational state identifier |
| `processingStatus` | `String` | Yes | - | Operational state identifier |
| `idempotencyKey` | `String` | Yes | - | Entity attribute representing idempotencyKey |
| `correlationId` | `String?` | No | - | Foreign key referencing correlation |
| `attemptCount` | `Int` | Yes | `1` | Entity attribute representing attemptCount |
| `error` | `String?` | No | - | Entity attribute representing error |
| `receivedAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `processedAt` | `DateTime?` | No | - | Timestamp / Date record |

**Primary Key:**  
`id`

**Foreign Keys:**  
None

**Unique Constraints:**  
`webhookId`, `idempotencyKey`, `webhookId`, `idempotencyKey`

**Indexes:**  
- `@@index([provider, eventType])`
- `@@index([processingStatus])`

**Status / Enum Values:**  
- Field `signatureStatus`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### DeadLetterQueue

**Purpose:**  
Queue of permanently failed webhook or message payloads preserved for administrative diagnosis.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `source` | `String` | Yes | - | Entity attribute representing source |
| `referenceId` | `String` | Yes | - | Foreign key referencing reference |
| `provider` | `String?` | No | - | Entity attribute representing provider |
| `eventType` | `String` | Yes | - | Entity attribute representing eventType |
| `lastError` | `String` | Yes | - | Entity attribute representing lastError |
| `attempts` | `Int` | Yes | `1` | Entity attribute representing attempts |
| `correlationId` | `String?` | No | - | Foreign key referencing correlation |
| `resolutionStatus` | `String` | Yes | `"PENDING"` | Operational state identifier |
| `quarantinedAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `resolvedAt` | `DateTime?` | No | - | Timestamp / Date record |

**Primary Key:**  
`id`

**Foreign Keys:**  
None

**Unique Constraints:**  
None

**Indexes:**  
- `@@index([source, resolutionStatus])`

**Status / Enum Values:**  
- Field `resolutionStatus`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---


### 5. Documents, Institutional Governance & Reporting

#### DocumentTemplate

**Purpose:**  
Configurable layout templates for institutional certificates, transcripts, and forms.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `code` | `String` | Yes | - | Entity attribute representing code |
| `nameBn` | `String` | Yes | - | Bangla language localized text |
| `nameEn` | `String?` | No | - | English language localized text |
| `documentType` | `String` | Yes | - | Entity attribute representing documentType |
| `titleBn` | `String` | Yes | - | Bangla language localized text |
| `titleEn` | `String?` | No | - | English language localized text |
| `bodyBn` | `String` | Yes | - | Bangla language localized text |
| `bodyEn` | `String?` | No | - | English language localized text |
| `bodyAr` | `String?` | No | - | Arabic language localized text |
| `headerBn` | `String?` | No | - | Bangla language localized text |
| `footerBn` | `String?` | No | - | Bangla language localized text |
| `version` | `Int` | Yes | `1` | Entity attribute representing version |
| `feeAmount` | `Float` | Yes | `0` | Monetary amount in BDT (৳) |
| `requiresFee` | `Boolean` | Yes | `false` | Entity attribute representing requiresFee |
| `signatoryTitleBn` | `String` | Yes | `"মুহতামিম ও অধ্যক্ষ"` | Bangla language localized text |
| `isActive` | `Boolean` | Yes | `true` | Entity attribute representing isActive |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |

**Primary Key:**  
`id`

**Foreign Keys:**  
None

**Unique Constraints:**  
`code`, `code`

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### DocumentRequest

**Purpose:**  
Student or guardian formal requests for certificates, transcripts, or testimonials.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `requestNumber` | `String` | Yes | - | Entity attribute representing requestNumber |
| `studentId` | `String` | Yes | - | Foreign key referencing student |
| `guardianId` | `String?` | No | - | Foreign key referencing guardian |
| `sessionId` | `String?` | No | - | Foreign key referencing session |
| `documentType` | `String` | Yes | - | Entity attribute representing documentType |
| `purpose` | `String` | Yes | - | Entity attribute representing purpose |
| `requiredDate` | `DateTime?` | No | - | Timestamp / Date record |
| `notes` | `String?` | No | - | Entity attribute representing notes |
| `attachmentUrl` | `String?` | No | - | Entity attribute representing attachmentUrl |
| `status` | `String` | Yes | `"SUBMITTED"` | Operational state identifier |
| `reviewedByUserId` | `String?` | No | - | Foreign key referencing reviewedByUser |
| `reviewedAt` | `DateTime?` | No | - | Timestamp / Date record |
| `rejectionReason` | `String?` | No | - | Entity attribute representing rejectionReason |
| `feeInvoiceId` | `String?` | No | - | Foreign key referencing feeInvoice |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `student` | `Student` | Yes | - | Entity attribute representing student |
| `guardian` | `Guardian?` | No | - | Entity attribute representing guardian |
| `session` | `AcademicSession?` | No | - | Entity attribute representing session |
| `reviewedByUser` | `User?` | No | - | Entity attribute representing reviewedByUser |
| `feeInvoice` | `FeeInvoice?` | No | - | Entity attribute representing feeInvoice |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `student` (Student): `fields: [studentId], references: [id], onDelete: Cascade`
- `guardian` (Guardian?): `fields: [guardianId], references: [id], onDelete: SetNull`
- `session` (AcademicSession?): `fields: [sessionId], references: [id], onDelete: SetNull`
- `reviewedByUser` (User?): `"ReviewedDocumentRequests", fields: [reviewedByUserId], references: [id], onDelete: SetNull`
- `feeInvoice` (FeeInvoice?): `fields: [feeInvoiceId], references: [id], onDelete: SetNull`

**Unique Constraints:**  
`requestNumber`, `requestNumber`

**Indexes:**  
- `@@index([studentId, status])`
- `@@index([guardianId, status])`

**Status / Enum Values:**  
- Field `status`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### Certificate

**Purpose:**  
Issued institutional credentials with cryptographic verification codes and frozen snapshots.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `certificateNumber` | `String` | Yes | - | Entity attribute representing certificateNumber |
| `verificationCode` | `String` | Yes | - | Entity attribute representing verificationCode |
| `studentId` | `String` | Yes | - | Foreign key referencing student |
| `sessionId` | `String?` | No | - | Foreign key referencing session |
| `requestId` | `String?` | No | - | Foreign key referencing request |
| `templateId` | `String?` | No | - | Foreign key referencing template |
| `certificateType` | `String` | Yes | - | Entity attribute representing certificateType |
| `titleBn` | `String?` | No | - | Bangla language localized text |
| `titleEn` | `String?` | No | - | English language localized text |
| `version` | `Int` | Yes | `1` | Entity attribute representing version |
| `reissuedFromId` | `String?` | No | - | Foreign key referencing reissuedFrom |
| `status` | `String` | Yes | `"ISSUED"` | Operational state identifier |
| `issueDate` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `issuedByUserId` | `String?` | No | - | Foreign key referencing issuedByUser |
| `isRevoked` | `Boolean` | Yes | `false` | Entity attribute representing isRevoked |
| `revokedAt` | `DateTime?` | No | - | Timestamp / Date record |
| `revokedByUserId` | `String?` | No | - | Foreign key referencing revokedByUser |
| `revokeReason` | `String?` | No | - | Entity attribute representing revokeReason |
| `qrCodeUrl` | `String?` | No | - | Entity attribute representing qrCodeUrl |
| `snapshotJson` | `String?` | No | - | Immutable serialized JSON payload |
| `metadataJson` | `String?` | No | - | Immutable serialized JSON payload |
| `pdfUrl` | `String?` | No | - | Entity attribute representing pdfUrl |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `student` | `Student` | Yes | - | Entity attribute representing student |
| `session` | `AcademicSession?` | No | - | Entity attribute representing session |
| `request` | `DocumentRequest?` | No | - | Entity attribute representing request |
| `template` | `DocumentTemplate?` | No | - | Entity attribute representing template |
| `issuedByUser` | `User?` | No | - | Entity attribute representing issuedByUser |
| `revokedByUser` | `User?` | No | - | Entity attribute representing revokedByUser |
| `reissuedFrom` | `Certificate?` | No | - | Entity attribute representing reissuedFrom |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `student` (Student): `fields: [studentId], references: [id], onDelete: Cascade`
- `session` (AcademicSession?): `fields: [sessionId], references: [id], onDelete: SetNull`
- `request` (DocumentRequest?): `fields: [requestId], references: [id], onDelete: SetNull`
- `template` (DocumentTemplate?): `fields: [templateId], references: [id], onDelete: SetNull`
- `issuedByUser` (User?): `"IssuedCertificates", fields: [issuedByUserId], references: [id], onDelete: SetNull`
- `revokedByUser` (User?): `"RevokedCertificates", fields: [revokedByUserId], references: [id], onDelete: SetNull`
- `reissuedFrom` (Certificate?): `"CertificateReissueHistory", fields: [reissuedFromId], references: [id], onDelete: SetNull`

**Unique Constraints:**  
`certificateNumber`, `verificationCode`, `certificateNumber`, `verificationCode`

**Indexes:**  
- `@@index([studentId, certificateType])`
- `@@index([verificationCode])`
- `@@index([status])`

**Status / Enum Values:**  
- Field `status`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### PrincipalProfile

**Purpose:**  
Principal institutional message, signature image reference, and public announcements.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `fullNameBn` | `String` | Yes | - | Bangla language localized text |
| `fullNameEn` | `String` | Yes | - | English language localized text |
| `designationBn` | `String` | Yes | `"মুহতামিম ও শায়খুল হাদিস"` | Bangla language localized text |
| `designationEn` | `String` | Yes | `"Principal & Shaykhul Hadith"` | English language localized text |
| `bioBn` | `String?` | No | - | Bangla language localized text |
| `bioEn` | `String?` | No | - | English language localized text |
| `photoUrl` | `String?` | No | - | Entity attribute representing photoUrl |
| `signatureUrl` | `String?` | No | - | Entity attribute representing signatureUrl |
| `officialMessageBn` | `String` | Yes | - | Bangla language localized text |
| `officialMessageEn` | `String?` | No | - | English language localized text |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |

**Primary Key:**  
`id`

**Foreign Keys:**  
None

**Unique Constraints:**  
None

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### SavedReport

**Purpose:**  
Pre-compiled institutional analytics reports saved for historical review.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `title` | `String` | Yes | - | Entity attribute representing title |
| `description` | `String?` | No | - | Entity attribute representing description |
| `module` | `String` | Yes | - | Entity attribute representing module |
| `reportType` | `String` | Yes | - | Entity attribute representing reportType |
| `filtersJson` | `String` | Yes | - | Immutable serialized JSON payload |
| `isPublic` | `Boolean` | Yes | `false` | Entity attribute representing isPublic |
| `createdById` | `String` | Yes | - | Foreign key referencing createdBy |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `createdBy` | `User` | Yes | - | Entity attribute representing createdBy |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `createdBy` (User): `fields: [createdById], references: [id], onDelete: Cascade`

**Unique Constraints:**  
None

**Indexes:**  
- `@@index([module])`
- `@@index([createdById])`
- `@@index([createdAt])`

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### ReportSchedule

**Purpose:**  
Recurring automated report generation schedules.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `title` | `String` | Yes | - | Entity attribute representing title |
| `frequency` | `String` | Yes | - | Entity attribute representing frequency |
| `recipientEmails` | `String` | Yes | - | Entity attribute representing recipientEmails |
| `reportConfigJson` | `String` | Yes | - | Immutable serialized JSON payload |
| `isActive` | `Boolean` | Yes | `true` | Entity attribute representing isActive |
| `lastRunAt` | `DateTime?` | No | - | Timestamp / Date record |
| `nextRunAt` | `DateTime?` | No | - | Timestamp / Date record |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |

**Primary Key:**  
`id`

**Foreign Keys:**  
None

**Unique Constraints:**  
None

**Indexes:**  
- `@@index([frequency])`
- `@@index([isActive])`

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---


### 6. Communication & Outbox Notification Engine

#### Notice

**Purpose:**  
Institutional circulars and public/internal announcements with audience scoping.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `titleBn` | `String` | Yes | - | Bangla language localized text |
| `titleEn` | `String?` | No | - | English language localized text |
| `contentBn` | `String` | Yes | - | Bangla language localized text |
| `contentEn` | `String?` | No | - | English language localized text |
| `category` | `String` | Yes | `"GENERAL"` | Entity attribute representing category |
| `targetAudience` | `String` | Yes | `"ALL"` | Entity attribute representing targetAudience |
| `audience` | `String` | Yes | `"PUBLIC"` | Entity attribute representing audience |
| `priority` | `String` | Yes | `"NORMAL"` | Entity attribute representing priority |
| `status` | `String` | Yes | `"PUBLISHED"` | Operational state identifier |
| `isUrgent` | `Boolean` | Yes | `false` | Entity attribute representing isUrgent |
| `isPublished` | `Boolean` | Yes | `true` | Entity attribute representing isPublished |
| `isPinned` | `Boolean` | Yes | `false` | Entity attribute representing isPinned |
| `sessionId` | `String?` | No | - | Foreign key referencing session |
| `classId` | `String?` | No | - | Foreign key referencing class |
| `sectionId` | `String?` | No | - | Foreign key referencing section |
| `scheduledAt` | `DateTime?` | No | - | Timestamp / Date record |
| `expiresAt` | `DateTime?` | No | - | Timestamp / Date record |
| `attachmentUrl` | `String?` | No | - | Entity attribute representing attachmentUrl |
| `attachmentName` | `String?` | No | - | Entity attribute representing attachmentName |
| `attachmentType` | `String?` | No | - | Entity attribute representing attachmentType |
| `createdByUserId` | `String?` | No | - | Foreign key referencing createdByUser |
| `publishedByUserId` | `String?` | No | - | Foreign key referencing publishedByUser |
| `version` | `Int` | Yes | `1` | Entity attribute representing version |
| `publishedAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `session` | `AcademicSession?` | No | - | Entity attribute representing session |
| `jamatClass` | `JamatClass?` | No | - | Entity attribute representing jamatClass |
| `section` | `Section?` | No | - | Entity attribute representing section |
| `createdByUser` | `User?` | No | - | Entity attribute representing createdByUser |
| `publishedByUser` | `User?` | No | - | Entity attribute representing publishedByUser |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `session` (AcademicSession?): `fields: [sessionId], references: [id], onDelete: SetNull`
- `jamatClass` (JamatClass?): `fields: [classId], references: [id], onDelete: SetNull`
- `section` (Section?): `fields: [sectionId], references: [id], onDelete: SetNull`
- `createdByUser` (User?): `"CreatedNotices", fields: [createdByUserId], references: [id], onDelete: SetNull`
- `publishedByUser` (User?): `"PublishedNotices", fields: [publishedByUserId], references: [id], onDelete: SetNull`

**Unique Constraints:**  
None

**Indexes:**  
- `@@index([status, publishedAt])`
- `@@index([audience, status])`
- `@@index([isPinned, publishedAt])`

**Status / Enum Values:**  
- Field `status`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### Notification

**Purpose:**  
In-app notifications dispatched to specific users or broadcast audiences.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `recipientUserId` | `String` | Yes | - | Foreign key referencing recipientUser |
| `type` | `String` | Yes | - | Entity attribute representing type |
| `title` | `String` | Yes | - | Entity attribute representing title |
| `body` | `String` | Yes | - | Entity attribute representing body |
| `channel` | `String` | Yes | `"PORTAL"` | Entity attribute representing channel |
| `priority` | `String` | Yes | `"NORMAL"` | Entity attribute representing priority |
| `relatedEntityType` | `String?` | No | - | Entity attribute representing relatedEntityType |
| `relatedEntityId` | `String?` | No | - | Foreign key referencing relatedEntity |
| `actionUrl` | `String?` | No | - | Entity attribute representing actionUrl |
| `isRead` | `Boolean` | Yes | `false` | Entity attribute representing isRead |
| `readAt` | `DateTime?` | No | - | Timestamp / Date record |
| `expiresAt` | `DateTime?` | No | - | Timestamp / Date record |
| `idempotencyKey` | `String?` | No | - | Entity attribute representing idempotencyKey |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `recipientUser` | `User` | Yes | - | Entity attribute representing recipientUser |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `recipientUser` (User): `"UserNotifications", fields: [recipientUserId], references: [id], onDelete: Cascade`

**Unique Constraints:**  
`idempotencyKey`, `idempotencyKey`

**Indexes:**  
- `@@index([recipientUserId, isRead])`
- `@@index([recipientUserId, createdAt])`
- `@@index([type])`

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### NotificationDelivery

**Purpose:**  
Delivery logs tracking delivery channels, attempts, and receipt timestamps.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `notificationId` | `String?` | No | - | Foreign key referencing notification |
| `channel` | `String` | Yes | `"EMAIL"` | Entity attribute representing channel |
| `destination` | `String` | Yes | - | Entity attribute representing destination |
| `status` | `String` | Yes | `"QUEUED"` | Operational state identifier |
| `providerMessageId` | `String?` | No | - | Foreign key referencing providerMessage |
| `attemptCount` | `Int` | Yes | `0` | Entity attribute representing attemptCount |
| `maxAttempts` | `Int` | Yes | `3` | Timestamp / Date record |
| `lastAttemptAt` | `DateTime?` | No | - | Timestamp / Date record |
| `deliveredAt` | `DateTime?` | No | - | Timestamp / Date record |
| `failedAt` | `DateTime?` | No | - | Timestamp / Date record |
| `errorCode` | `String?` | No | - | Entity attribute representing errorCode |
| `errorMessage` | `String?` | No | - | Entity attribute representing errorMessage |
| `idempotencyKey` | `String?` | No | - | Entity attribute representing idempotencyKey |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `notification` | `Notification?` | No | - | Entity attribute representing notification |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `notification` (Notification?): `fields: [notificationId], references: [id], onDelete: Cascade`

**Unique Constraints:**  
`idempotencyKey`, `idempotencyKey`

**Indexes:**  
- `@@index([status])`
- `@@index([destination])`

**Status / Enum Values:**  
- Field `status`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### NotificationTemplate

**Purpose:**  
Pre-defined message templates for automated notifications.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `code` | `String` | Yes | - | Entity attribute representing code |
| `nameBn` | `String` | Yes | - | Bangla language localized text |
| `category` | `String` | Yes | `"OFFICIAL_NOTICE"` | Entity attribute representing category |
| `subjectTemplateBn` | `String` | Yes | - | Bangla language localized text |
| `subjectTemplateEn` | `String?` | No | - | English language localized text |
| `bodyTemplateBn` | `String` | Yes | - | Bangla language localized text |
| `bodyTemplateEn` | `String?` | No | - | English language localized text |
| `channels` | `String` | Yes | `"PORTAL,EMAIL"` | Entity attribute representing channels |
| `isMandatory` | `Boolean` | Yes | `false` | Entity attribute representing isMandatory |
| `isActive` | `Boolean` | Yes | `true` | Entity attribute representing isActive |
| `version` | `Int` | Yes | `1` | Entity attribute representing version |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |

**Primary Key:**  
`id`

**Foreign Keys:**  
None

**Unique Constraints:**  
`code`, `code`

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### NotificationPreference

**Purpose:**  
User communication preferences controlling notification delivery channels.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `userId` | `String` | Yes | - | Foreign key referencing user |
| `category` | `String` | Yes | - | Entity attribute representing category |
| `emailEnabled` | `Boolean` | Yes | `true` | Entity attribute representing emailEnabled |
| `portalEnabled` | `Boolean` | Yes | `true` | Entity attribute representing portalEnabled |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `user` | `User` | Yes | - | Entity attribute representing user |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `user` (User): `fields: [userId], references: [id], onDelete: Cascade`

**Unique Constraints:**  
`@@unique([userId, category])`

**Indexes:**  
- `@@index([userId])`

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### NotificationOutbox

**Purpose:**  
Persistent transactional outbox queue ensuring reliable, idempotent notification dispatch.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `eventType` | `String` | Yes | - | Entity attribute representing eventType |
| `entityType` | `String` | Yes | - | Entity attribute representing entityType |
| `entityId` | `String` | Yes | - | Foreign key referencing entity |
| `payloadJson` | `String` | Yes | - | Immutable serialized JSON payload |
| `idempotencyKey` | `String` | Yes | - | Entity attribute representing idempotencyKey |
| `status` | `String` | Yes | `"PENDING"` | Operational state identifier |
| `attempts` | `Int` | Yes | `0` | Entity attribute representing attempts |
| `maxAttempts` | `Int` | Yes | `3` | Timestamp / Date record |
| `processedAt` | `DateTime?` | No | - | Timestamp / Date record |
| `errorMessage` | `String?` | No | - | Entity attribute representing errorMessage |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |

**Primary Key:**  
`id`

**Foreign Keys:**  
None

**Unique Constraints:**  
`idempotencyKey`, `idempotencyKey`

**Indexes:**  
- `@@index([status])`
- `@@index([eventType])`

**Status / Enum Values:**  
- Field `status`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---


### 7. Library Management System

#### LibraryCategory

**Purpose:**  
Dewey-style or thematic classification hierarchy for library holdings.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `nameBn` | `String` | Yes | - | Bangla language localized text |
| `nameEn` | `String` | Yes | - | English language localized text |
| `description` | `String?` | No | - | Entity attribute representing description |
| `sortOrder` | `Int` | Yes | `0` | Entity attribute representing sortOrder |
| `isActive` | `Boolean` | Yes | `true` | Entity attribute representing isActive |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |

**Primary Key:**  
`id`

**Foreign Keys:**  
None

**Unique Constraints:**  
None

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### LibraryAuthor

**Purpose:**  
Biographical and bibliographical records of book authors.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `nameBn` | `String` | Yes | - | Bangla language localized text |
| `nameEn` | `String` | Yes | - | English language localized text |
| `nameAr` | `String?` | No | - | Arabic language localized text |
| `bio` | `String?` | No | - | Entity attribute representing bio |
| `isActive` | `Boolean` | Yes | `true` | Entity attribute representing isActive |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |

**Primary Key:**  
`id`

**Foreign Keys:**  
None

**Unique Constraints:**  
None

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### LibraryPublisher

**Purpose:**  
Publishing houses and presses producing madrasa library volumes.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `name` | `String` | Yes | - | Entity attribute representing name |
| `contactInfo` | `String?` | No | - | Entity attribute representing contactInfo |
| `address` | `String?` | No | - | Entity attribute representing address |
| `website` | `String?` | No | - | Entity attribute representing website |
| `notes` | `String?` | No | - | Entity attribute representing notes |
| `isActive` | `Boolean` | Yes | `true` | Entity attribute representing isActive |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |

**Primary Key:**  
`id`

**Foreign Keys:**  
None

**Unique Constraints:**  
None

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### LibraryBook

**Purpose:**  
Bibliographic catalogue titles held in the institutional library.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `titleBn` | `String` | Yes | - | Bangla language localized text |
| `titleEn` | `String` | Yes | - | English language localized text |
| `subtitle` | `String?` | No | - | Entity attribute representing subtitle |
| `categoryId` | `String` | Yes | - | Foreign key referencing category |
| `authorId` | `String` | Yes | - | Foreign key referencing author |
| `publisherId` | `String?` | No | - | Foreign key referencing publisher |
| `edition` | `String?` | No | - | Entity attribute representing edition |
| `publicationYear` | `Int?` | No | - | Entity attribute representing publicationYear |
| `isbn` | `String?` | No | - | Entity attribute representing isbn |
| `language` | `String` | Yes | `"BANGLA"` | Entity attribute representing language |
| `subject` | `String?` | No | - | Entity attribute representing subject |
| `shelfLocation` | `String?` | No | - | Entity attribute representing shelfLocation |
| `description` | `String?` | No | - | Entity attribute representing description |
| `coverImage` | `String?` | No | - | Entity attribute representing coverImage |
| `acquisitionInfo` | `String?` | No | - | Entity attribute representing acquisitionInfo |
| `notes` | `String?` | No | - | Entity attribute representing notes |
| `isDigital` | `Boolean` | Yes | `false` | Entity attribute representing isDigital |
| `digitalUrl` | `String?` | No | - | Entity attribute representing digitalUrl |
| `digitalType` | `String?` | No | - | Entity attribute representing digitalType |
| `accessRestricted` | `Boolean` | Yes | `false` | Entity attribute representing accessRestricted |
| `copyrightInfo` | `String?` | No | - | Entity attribute representing copyrightInfo |
| `status` | `String` | Yes | `"ACTIVE"` | Operational state identifier |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `category` | `LibraryCategory` | Yes | - | Entity attribute representing category |
| `author` | `LibraryAuthor` | Yes | - | Entity attribute representing author |
| `publisher` | `LibraryPublisher?` | No | - | Entity attribute representing publisher |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `category` (LibraryCategory): `fields: [categoryId], references: [id]`
- `author` (LibraryAuthor): `fields: [authorId], references: [id]`
- `publisher` (LibraryPublisher?): `fields: [publisherId], references: [id]`

**Unique Constraints:**  
None

**Indexes:**  
- `@@index([titleBn])`
- `@@index([titleEn])`
- `@@index([isbn])`
- `@@index([categoryId])`
- `@@index([authorId])`

**Status / Enum Values:**  
- Field `status`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### LibraryBookCopy

**Purpose:**  
Physical accession copies of catalogued books with condition ratings.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `bookId` | `String` | Yes | - | Foreign key referencing book |
| `accessionNo` | `String` | Yes | - | Entity attribute representing accessionNo |
| `barcode` | `String` | Yes | - | Entity attribute representing barcode |
| `qrToken` | `String` | Yes | - | Entity attribute representing qrToken |
| `condition` | `String` | Yes | `"GOOD"` | Entity attribute representing condition |
| `status` | `String` | Yes | `"AVAILABLE"` | Operational state identifier |
| `purchasePrice` | `Float` | Yes | `0` | Monetary amount in BDT (৳) |
| `source` | `String?` | No | - | Entity attribute representing source |
| `acquisitionDate` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `shelfLocation` | `String?` | No | - | Entity attribute representing shelfLocation |
| `notes` | `String?` | No | - | Entity attribute representing notes |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `book` | `LibraryBook` | Yes | - | Entity attribute representing book |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `book` (LibraryBook): `fields: [bookId], references: [id], onDelete: Cascade`

**Unique Constraints:**  
`accessionNo`, `barcode`, `qrToken`, `accessionNo`, `barcode`, `qrToken`

**Indexes:**  
- `@@index([bookId, status])`
- `@@index([accessionNo])`
- `@@index([barcode])`
- `@@index([qrToken])`

**Status / Enum Values:**  
- Field `status`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### LibraryMember

**Purpose:**  
Registered library borrowing members (students, teachers, staff).

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `memberNumber` | `String` | Yes | - | Entity attribute representing memberNumber |
| `memberType` | `String` | Yes | - | Entity attribute representing memberType |
| `studentId` | `String?` | No | - | Foreign key referencing student |
| `userId` | `String?` | No | - | Foreign key referencing user |
| `status` | `String` | Yes | `"ACTIVE"` | Operational state identifier |
| `maxBooks` | `Int?` | No | - | Entity attribute representing maxBooks |
| `startDate` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `endDate` | `DateTime?` | No | - | Timestamp / Date record |
| `notes` | `String?` | No | - | Entity attribute representing notes |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `student` | `Student?` | No | - | Entity attribute representing student |
| `user` | `User?` | No | - | Entity attribute representing user |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `student` (Student?): `fields: [studentId], references: [id], onDelete: SetNull`
- `user` (User?): `fields: [userId], references: [id], onDelete: SetNull`

**Unique Constraints:**  
`memberNumber`, `memberNumber`, `@@unique([memberType, studentId])`, `@@unique([memberType, userId])`

**Indexes:**  
- `@@index([memberNumber])`
- `@@index([status])`

**Status / Enum Values:**  
- Field `status`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### LibraryRule

**Purpose:**  
Circulation policies regulating borrowing limits, loan durations, and overdue fines.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `memberType` | `String` | Yes | - | Entity attribute representing memberType |
| `maxBooks` | `Int` | Yes | `2` | Entity attribute representing maxBooks |
| `loanDays` | `Int` | Yes | `14` | Entity attribute representing loanDays |
| `renewalLimit` | `Int` | Yes | `1` | Entity attribute representing renewalLimit |
| `finePerDay` | `Float` | Yes | `5.0` | Entity attribute representing finePerDay |
| `graceDays` | `Int` | Yes | `0` | Entity attribute representing graceDays |
| `lostChargeMultiplier` | `Float` | Yes | `1.5` | Entity attribute representing lostChargeMultiplier |
| `damagedChargeDefault` | `Float` | Yes | `50.0` | Entity attribute representing damagedChargeDefault |
| `isActive` | `Boolean` | Yes | `true` | Entity attribute representing isActive |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |

**Primary Key:**  
`id`

**Foreign Keys:**  
None

**Unique Constraints:**  
`memberType`, `memberType`

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### LibraryIssue

**Purpose:**  
Book borrowing transactions tracking checkout dates, due dates, and return condition.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `issueNumber` | `String` | Yes | - | Entity attribute representing issueNumber |
| `bookId` | `String` | Yes | - | Foreign key referencing book |
| `copyId` | `String` | Yes | - | Foreign key referencing copy |
| `memberId` | `String` | Yes | - | Foreign key referencing member |
| `issuedByUserId` | `String` | Yes | - | Foreign key referencing issuedByUser |
| `issueDate` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `dueDate` | `DateTime` | Yes | - | Timestamp / Date record |
| `returnDate` | `DateTime?` | No | - | Timestamp / Date record |
| `renewCount` | `Int` | Yes | `0` | Entity attribute representing renewCount |
| `status` | `String` | Yes | `"ISSUED"` | Operational state identifier |
| `overdueDays` | `Int` | Yes | `0` | Entity attribute representing overdueDays |
| `fineAmount` | `Float` | Yes | `0` | Monetary amount in BDT (৳) |
| `invoiceId` | `String?` | No | - | Foreign key referencing invoice |
| `notes` | `String?` | No | - | Entity attribute representing notes |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `book` | `LibraryBook` | Yes | - | Entity attribute representing book |
| `copy` | `LibraryBookCopy` | Yes | - | Entity attribute representing copy |
| `member` | `LibraryMember` | Yes | - | Entity attribute representing member |
| `issuedByUser` | `User` | Yes | - | Entity attribute representing issuedByUser |
| `invoice` | `FeeInvoice?` | No | - | Entity attribute representing invoice |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `book` (LibraryBook): `fields: [bookId], references: [id]`
- `copy` (LibraryBookCopy): `fields: [copyId], references: [id]`
- `member` (LibraryMember): `fields: [memberId], references: [id]`
- `issuedByUser` (User): `"IssuedLibraryIssues", fields: [issuedByUserId], references: [id]`
- `invoice` (FeeInvoice?): `fields: [invoiceId], references: [id], onDelete: SetNull`

**Unique Constraints:**  
`issueNumber`, `issueNumber`

**Indexes:**  
- `@@index([memberId, status])`
- `@@index([copyId, status])`
- `@@index([status, dueDate])`

**Status / Enum Values:**  
- Field `status`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### LibraryRenewal

**Purpose:**  
Loan extension records renewed by library members.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `issueId` | `String` | Yes | - | Foreign key referencing issue |
| `renewedByUserId` | `String` | Yes | - | Foreign key referencing renewedByUser |
| `prevDueDate` | `DateTime` | Yes | - | Timestamp / Date record |
| `newDueDate` | `DateTime` | Yes | - | Timestamp / Date record |
| `renewDate` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `notes` | `String?` | No | - | Entity attribute representing notes |
| `issue` | `LibraryIssue` | Yes | - | Entity attribute representing issue |
| `renewedByUser` | `User` | Yes | - | Entity attribute representing renewedByUser |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `issue` (LibraryIssue): `fields: [issueId], references: [id], onDelete: Cascade`
- `renewedByUser` (User): `"RenewedLibraryIssues", fields: [renewedByUserId], references: [id]`

**Unique Constraints:**  
None

**Indexes:**  
- `@@index([issueId])`

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### LibraryConditionHistory

**Purpose:**  
Historical condition degradation and maintenance logs for physical book copies.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `copyId` | `String` | Yes | - | Foreign key referencing copy |
| `recordedByUserId` | `String` | Yes | - | Foreign key referencing recordedByUser |
| `oldCondition` | `String` | Yes | - | Entity attribute representing oldCondition |
| `newCondition` | `String` | Yes | - | Entity attribute representing newCondition |
| `reason` | `String?` | No | - | Entity attribute representing reason |
| `chargeAmount` | `Float?` | No | - | Monetary amount in BDT (৳) |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `copy` | `LibraryBookCopy` | Yes | - | Entity attribute representing copy |
| `recordedByUser` | `User` | Yes | - | Entity attribute representing recordedByUser |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `copy` (LibraryBookCopy): `fields: [copyId], references: [id], onDelete: Cascade`
- `recordedByUser` (User): `"RecordedConditionHistories", fields: [recordedByUserId], references: [id]`

**Unique Constraints:**  
None

**Indexes:**  
- `@@index([copyId])`

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### LibraryAccessionSequence

**Purpose:**  
Atomic accession sequence generator ensuring unique, non-colliding book accession numbers.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `year` | `Int` | Yes | - | Entity attribute representing year |
| `lastSeq` | `Int` | Yes | `0` | Entity attribute representing lastSeq |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |

**Primary Key:**  
`id`

**Foreign Keys:**  
None

**Unique Constraints:**  
`year`, `year`

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### LibraryMemberSequence

**Purpose:**  
Atomic member sequence generator for unique library borrower cards.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `year` | `Int` | Yes | - | Entity attribute representing year |
| `lastSeq` | `Int` | Yes | `0` | Entity attribute representing lastSeq |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |

**Primary Key:**  
`id`

**Foreign Keys:**  
None

**Unique Constraints:**  
`year`, `year`

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---


### 8. Residential & Hostel Facilities

#### ResidentialEnrollment

**Purpose:**  
Hostel and boarding residency records allocating students to dormitories and beds.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `studentId` | `String` | Yes | - | Foreign key referencing student |
| `sessionId` | `String` | Yes | - | Foreign key referencing session |
| `residentialStatus` | `String` | Yes | - | Operational state identifier |
| `status` | `String` | Yes | `"ACTIVE"` | Operational state identifier |
| `admissionDate` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `checkInDate` | `DateTime?` | No | - | Timestamp / Date record |
| `checkOutDate` | `DateTime?` | No | - | Timestamp / Date record |
| `expectedEndDate` | `DateTime?` | No | - | Timestamp / Date record |
| `roomOrWardLabel` | `String?` | No | - | Entity attribute representing roomOrWardLabel |
| `bedOrSeatLabel` | `String?` | No | - | Entity attribute representing bedOrSeatLabel |
| `guardianConfirmed` | `Boolean` | Yes | `false` | Entity attribute representing guardianConfirmed |
| `notes` | `String?` | No | - | Entity attribute representing notes |
| `createdById` | `String?` | No | - | Foreign key referencing createdBy |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `student` | `Student` | Yes | - | Entity attribute representing student |
| `session` | `AcademicSession` | Yes | - | Entity attribute representing session |
| `createdBy` | `User?` | No | - | Entity attribute representing createdBy |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `student` (Student): `fields: [studentId], references: [id], onDelete: Cascade`
- `session` (AcademicSession): `fields: [sessionId], references: [id], onDelete: Cascade`
- `createdBy` (User?): `"ResidentialEnrollmentCreatedBy", fields: [createdById], references: [id], onDelete: SetNull`

**Unique Constraints:**  
`@@unique([studentId, sessionId])`

**Indexes:**  
- `@@index([status])`
- `@@index([residentialStatus])`
- `@@index([sessionId])`

**Status / Enum Values:**  
- Field `residentialStatus`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### ResidentialHistory

**Purpose:**  
Audit trail of student boarding movements, room changes, and checkouts.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `studentId` | `String` | Yes | - | Foreign key referencing student |
| `enrollmentId` | `String?` | No | - | Foreign key referencing enrollment |
| `sessionId` | `String` | Yes | - | Foreign key referencing session |
| `previousStatus` | `String` | Yes | - | Operational state identifier |
| `newStatus` | `String` | Yes | - | Operational state identifier |
| `effectiveDate` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `reason` | `String` | Yes | - | Entity attribute representing reason |
| `notes` | `String?` | No | - | Entity attribute representing notes |
| `recordedByUserId` | `String` | Yes | - | Foreign key referencing recordedByUser |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `student` | `Student` | Yes | - | Entity attribute representing student |
| `enrollment` | `ResidentialEnrollment?` | No | - | Entity attribute representing enrollment |
| `session` | `AcademicSession` | Yes | - | Entity attribute representing session |
| `recordedByUser` | `User` | Yes | - | Entity attribute representing recordedByUser |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `student` (Student): `fields: [studentId], references: [id], onDelete: Cascade`
- `enrollment` (ResidentialEnrollment?): `fields: [enrollmentId], references: [id], onDelete: SetNull`
- `session` (AcademicSession): `fields: [sessionId], references: [id], onDelete: Cascade`
- `recordedByUser` (User): `"ResidentialHistoryRecordedBy", fields: [recordedByUserId], references: [id]`

**Unique Constraints:**  
None

**Indexes:**  
- `@@index([studentId])`
- `@@index([sessionId])`
- `@@index([effectiveDate])`

**Status / Enum Values:**  
- Field `previousStatus`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### ResidentialRequest

**Purpose:**  
Boarding and food assistance applications submitted by students/guardians.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `requestNumber` | `String` | Yes | - | Entity attribute representing requestNumber |
| `studentId` | `String` | Yes | - | Foreign key referencing student |
| `guardianId` | `String` | Yes | - | Foreign key referencing guardian |
| `sessionId` | `String` | Yes | - | Foreign key referencing session |
| `requestType` | `String` | Yes | - | Entity attribute representing requestType |
| `currentStatus` | `String` | Yes | - | Operational state identifier |
| `requestedStatus` | `String` | Yes | - | Operational state identifier |
| `reason` | `String` | Yes | - | Entity attribute representing reason |
| `status` | `String` | Yes | `"SUBMITTED"` | Operational state identifier |
| `adminNotes` | `String?` | No | - | Entity attribute representing adminNotes |
| `reviewedByUserId` | `String?` | No | - | Foreign key referencing reviewedByUser |
| `reviewedAt` | `DateTime?` | No | - | Timestamp / Date record |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `student` | `Student` | Yes | - | Entity attribute representing student |
| `guardian` | `Guardian` | Yes | - | Entity attribute representing guardian |
| `session` | `AcademicSession` | Yes | - | Entity attribute representing session |
| `reviewedByUser` | `User?` | No | - | Entity attribute representing reviewedByUser |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `student` (Student): `fields: [studentId], references: [id], onDelete: Cascade`
- `guardian` (Guardian): `fields: [guardianId], references: [id], onDelete: Cascade`
- `session` (AcademicSession): `fields: [sessionId], references: [id], onDelete: Cascade`
- `reviewedByUser` (User?): `"ResidentialRequestReviewedBy", fields: [reviewedByUserId], references: [id], onDelete: SetNull`

**Unique Constraints:**  
`requestNumber`, `requestNumber`

**Indexes:**  
- `@@index([studentId])`
- `@@index([guardianId])`
- `@@index([status])`
- `@@index([requestNumber])`

**Status / Enum Values:**  
- Field `currentStatus`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### ResidentialRule

**Purpose:**  
Hostel governance rules, curfew timings, and residential fee guidelines.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `sessionId` | `String` | Yes | - | Foreign key referencing session |
| `monthlyHostelFee` | `Float` | Yes | `1500` | Entity attribute representing monthlyHostelFee |
| `monthlyFoodFee` | `Float` | Yes | `2000` | Entity attribute representing monthlyFoodFee |
| `admissionHostelFee` | `Float` | Yes | `1000` | Entity attribute representing admissionHostelFee |
| `dayCareFoodExempt` | `Boolean` | Yes | `true` | Entity attribute representing dayCareFoodExempt |
| `allowGuardianRequest` | `Boolean` | Yes | `true` | Entity attribute representing allowGuardianRequest |
| `checkInNoticeDays` | `Int` | Yes | `3` | Entity attribute representing checkInNoticeDays |
| `rulesNotesBn` | `String?` | No | - | Bangla language localized text |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `session` | `AcademicSession` | Yes | - | Entity attribute representing session |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `session` (AcademicSession): `fields: [sessionId], references: [id], onDelete: Cascade`

**Unique Constraints:**  
`sessionId`, `sessionId`

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### ResidentialRequestSequence

**Purpose:**  
Atomic sequential code generator for residential applications.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `year` | `Int` | Yes | - | Entity attribute representing year |
| `lastSeq` | `Int` | Yes | `0` | Entity attribute representing lastSeq |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |

**Primary Key:**  
`id`

**Foreign Keys:**  
None

**Unique Constraints:**  
`year`, `year`

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---


### 9. Transport & Fleet Operations

#### TransportDriver

**Purpose:**  
Institutional transport driver profiles, driving license details, and contact numbers.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `employeeId` | `String?` | No | - | Foreign key referencing employee |
| `name` | `String` | Yes | - | Entity attribute representing name |
| `phone` | `String` | Yes | - | Entity attribute representing phone |
| `address` | `String?` | No | - | Entity attribute representing address |
| `licenseNumber` | `String` | Yes | - | Entity attribute representing licenseNumber |
| `licenseExpiry` | `DateTime` | Yes | - | Entity attribute representing licenseExpiry |
| `emergencyContact` | `String?` | No | - | Entity attribute representing emergencyContact |
| `status` | `String` | Yes | `"ACTIVE"` | Operational state identifier |
| `notes` | `String?` | No | - | Entity attribute representing notes |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `employee` | `Employee?` | No | - | Entity attribute representing employee |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `employee` (Employee?): `fields: [employeeId], references: [id], onDelete: SetNull`

**Unique Constraints:**  
`phone`, `licenseNumber`, `phone`, `licenseNumber`

**Indexes:**  
- `@@index([status])`
- `@@index([employeeId])`

**Status / Enum Values:**  
- Field `status`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### TransportVehicle

**Purpose:**  
Fleet vehicle records (buses, microbuses, vans) with fitness, tax, and insurance data.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `vehicleNumber` | `String` | Yes | - | Entity attribute representing vehicleNumber |
| `vehicleType` | `String` | Yes | `"BUS"` | Entity attribute representing vehicleType |
| `model` | `String?` | No | - | Entity attribute representing model |
| `capacity` | `Int` | Yes | - | Entity attribute representing capacity |
| `driverId` | `String?` | No | - | Foreign key referencing driver |
| `status` | `String` | Yes | `"ACTIVE"` | Operational state identifier |
| `notes` | `String?` | No | - | Entity attribute representing notes |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `driver` | `TransportDriver?` | No | - | Entity attribute representing driver |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `driver` (TransportDriver?): `fields: [driverId], references: [id], onDelete: SetNull`

**Unique Constraints:**  
`vehicleNumber`, `vehicleNumber`

**Indexes:**  
- `@@index([status])`

**Status / Enum Values:**  
- Field `status`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### TransportRoute

**Purpose:**  
Designated transport routes connecting residential catchment areas to campus.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `routeName` | `String` | Yes | - | Entity attribute representing routeName |
| `routeCode` | `String` | Yes | - | Entity attribute representing routeCode |
| `description` | `String?` | No | - | Entity attribute representing description |
| `direction` | `String` | Yes | `"BOTH"` | Entity attribute representing direction |
| `startPoint` | `String` | Yes | - | Entity attribute representing startPoint |
| `endPoint` | `String` | Yes | - | Entity attribute representing endPoint |
| `vehicleId` | `String?` | No | - | Foreign key referencing vehicle |
| `monthlyFee` | `Float` | Yes | `800` | Entity attribute representing monthlyFee |
| `status` | `String` | Yes | `"ACTIVE"` | Operational state identifier |
| `effectiveDate` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `notes` | `String?` | No | - | Entity attribute representing notes |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `vehicle` | `TransportVehicle?` | No | - | Entity attribute representing vehicle |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `vehicle` (TransportVehicle?): `fields: [vehicleId], references: [id], onDelete: SetNull`

**Unique Constraints:**  
`routeCode`, `routeCode`

**Indexes:**  
- `@@index([status])`

**Status / Enum Values:**  
- Field `status`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### TransportStop

**Purpose:**  
Specific pick-up and drop-off stations along a transport route with fee tiers.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `routeId` | `String` | Yes | - | Foreign key referencing route |
| `stopName` | `String` | Yes | - | Entity attribute representing stopName |
| `address` | `String?` | No | - | Entity attribute representing address |
| `sequenceOrder` | `Int` | Yes | - | Entity attribute representing sequenceOrder |
| `pickupTime` | `String?` | No | - | Entity attribute representing pickupTime |
| `dropTime` | `String?` | No | - | Entity attribute representing dropTime |
| `status` | `String` | Yes | `"ACTIVE"` | Operational state identifier |
| `notes` | `String?` | No | - | Entity attribute representing notes |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `route` | `TransportRoute` | Yes | - | Entity attribute representing route |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `route` (TransportRoute): `fields: [routeId], references: [id], onDelete: Cascade`

**Unique Constraints:**  
`@@unique([routeId, sequenceOrder])`

**Indexes:**  
- `@@index([routeId, status])`

**Status / Enum Values:**  
- Field `status`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### TransportEnrollment

**Purpose:**  
Student bus pass allocations linking students to specific routes and stops.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `studentId` | `String` | Yes | - | Foreign key referencing student |
| `sessionId` | `String` | Yes | - | Foreign key referencing session |
| `routeId` | `String` | Yes | - | Foreign key referencing route |
| `pickupStopId` | `String` | Yes | - | Foreign key referencing pickupStop |
| `dropStopId` | `String?` | No | - | Foreign key referencing dropStop |
| `startDate` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `endDate` | `DateTime?` | No | - | Timestamp / Date record |
| `status` | `String` | Yes | `"ACTIVE"` | Operational state identifier |
| `monthlyFee` | `Float` | Yes | - | Entity attribute representing monthlyFee |
| `notes` | `String?` | No | - | Entity attribute representing notes |
| `createdById` | `String?` | No | - | Foreign key referencing createdBy |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `student` | `Student` | Yes | - | Entity attribute representing student |
| `session` | `AcademicSession` | Yes | - | Entity attribute representing session |
| `route` | `TransportRoute` | Yes | - | Entity attribute representing route |
| `pickupStop` | `TransportStop` | Yes | - | Entity attribute representing pickupStop |
| `dropStop` | `TransportStop?` | No | - | Entity attribute representing dropStop |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `student` (Student): `fields: [studentId], references: [id], onDelete: Cascade`
- `session` (AcademicSession): `fields: [sessionId], references: [id], onDelete: Cascade`
- `route` (TransportRoute): `fields: [routeId], references: [id], onDelete: Restrict`
- `pickupStop` (TransportStop): `"PickupStop", fields: [pickupStopId], references: [id], onDelete: Restrict`
- `dropStop` (TransportStop?): `"DropStop", fields: [dropStopId], references: [id], onDelete: SetNull`

**Unique Constraints:**  
None

**Indexes:**  
- `@@index([studentId, sessionId, status])`
- `@@index([routeId, status])`

**Status / Enum Values:**  
- Field `status`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### TransportRequest

**Purpose:**  
Guardian requests for transport enrollment or route adjustments.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `requestNumber` | `String` | Yes | - | Entity attribute representing requestNumber |
| `studentId` | `String` | Yes | - | Foreign key referencing student |
| `guardianId` | `String` | Yes | - | Foreign key referencing guardian |
| `sessionId` | `String` | Yes | - | Foreign key referencing session |
| `routeId` | `String` | Yes | - | Foreign key referencing route |
| `pickupStopId` | `String` | Yes | - | Foreign key referencing pickupStop |
| `dropStopId` | `String?` | No | - | Foreign key referencing dropStop |
| `preferredStartDate` | `DateTime` | Yes | - | Timestamp / Date record |
| `status` | `String` | Yes | `"SUBMITTED"` | Operational state identifier |
| `reason` | `String?` | No | - | Entity attribute representing reason |
| `adminNotes` | `String?` | No | - | Entity attribute representing adminNotes |
| `rejectionReason` | `String?` | No | - | Entity attribute representing rejectionReason |
| `reviewedByUserId` | `String?` | No | - | Foreign key referencing reviewedByUser |
| `reviewedAt` | `DateTime?` | No | - | Timestamp / Date record |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `student` | `Student` | Yes | - | Entity attribute representing student |
| `guardian` | `Guardian` | Yes | - | Entity attribute representing guardian |
| `session` | `AcademicSession` | Yes | - | Entity attribute representing session |
| `route` | `TransportRoute` | Yes | - | Entity attribute representing route |
| `pickupStop` | `TransportStop` | Yes | - | Entity attribute representing pickupStop |
| `dropStop` | `TransportStop?` | No | - | Entity attribute representing dropStop |
| `reviewedByUser` | `User?` | No | - | Entity attribute representing reviewedByUser |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `student` (Student): `fields: [studentId], references: [id], onDelete: Cascade`
- `guardian` (Guardian): `fields: [guardianId], references: [id], onDelete: Cascade`
- `session` (AcademicSession): `fields: [sessionId], references: [id], onDelete: Cascade`
- `route` (TransportRoute): `fields: [routeId], references: [id], onDelete: Restrict`
- `pickupStop` (TransportStop): `"RequestPickupStop", fields: [pickupStopId], references: [id], onDelete: Restrict`
- `dropStop` (TransportStop?): `"RequestDropStop", fields: [dropStopId], references: [id], onDelete: SetNull`
- `reviewedByUser` (User?): `"TransportRequestReviewedBy", fields: [reviewedByUserId], references: [id], onDelete: SetNull`

**Unique Constraints:**  
`requestNumber`, `requestNumber`

**Indexes:**  
- `@@index([studentId])`
- `@@index([guardianId])`
- `@@index([status])`
- `@@index([requestNumber])`

**Status / Enum Values:**  
- Field `status`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### TransportAssignmentHistory

**Purpose:**  
Historical logs of student transport route and vehicle reallocations.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `studentId` | `String` | Yes | - | Foreign key referencing student |
| `sessionId` | `String` | Yes | - | Foreign key referencing session |
| `enrollmentId` | `String?` | No | - | Foreign key referencing enrollment |
| `routeId` | `String` | Yes | - | Foreign key referencing route |
| `action` | `String` | Yes | - | Entity attribute representing action |
| `previousRouteId` | `String?` | No | - | Foreign key referencing previousRoute |
| `previousPickupStopId` | `String?` | No | - | Foreign key referencing previousPickupStop |
| `newPickupStopId` | `String?` | No | - | Foreign key referencing newPickupStop |
| `effectiveDate` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `reason` | `String?` | No | - | Entity attribute representing reason |
| `notes` | `String?` | No | - | Entity attribute representing notes |
| `recordedByUserId` | `String` | Yes | - | Foreign key referencing recordedByUser |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `student` | `Student` | Yes | - | Entity attribute representing student |
| `session` | `AcademicSession` | Yes | - | Entity attribute representing session |
| `enrollment` | `TransportEnrollment?` | No | - | Entity attribute representing enrollment |
| `route` | `TransportRoute` | Yes | - | Entity attribute representing route |
| `recordedByUser` | `User` | Yes | - | Entity attribute representing recordedByUser |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `student` (Student): `fields: [studentId], references: [id], onDelete: Cascade`
- `session` (AcademicSession): `fields: [sessionId], references: [id], onDelete: Cascade`
- `enrollment` (TransportEnrollment?): `fields: [enrollmentId], references: [id], onDelete: SetNull`
- `route` (TransportRoute): `fields: [routeId], references: [id], onDelete: Restrict`
- `recordedByUser` (User): `"TransportHistoryRecordedBy", fields: [recordedByUserId], references: [id]`

**Unique Constraints:**  
None

**Indexes:**  
- `@@index([studentId])`
- `@@index([routeId])`
- `@@index([effectiveDate])`

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### TransportRequestSequence

**Purpose:**  
Atomic sequential code generator for transport pass requests.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `year` | `Int` | Yes | - | Entity attribute representing year |
| `lastSeq` | `Int` | Yes | `0` | Entity attribute representing lastSeq |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |

**Primary Key:**  
`id`

**Foreign Keys:**  
None

**Unique Constraints:**  
`year`, `year`

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### TransportRule

**Purpose:**  
Rules governing transport fee calculations, safety regulations, and pass validity.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `sessionId` | `String` | Yes | - | Foreign key referencing session |
| `defaultMonthlyFee` | `Float` | Yes | `800` | Entity attribute representing defaultMonthlyFee |
| `allowGuardianRequest` | `Boolean` | Yes | `true` | Entity attribute representing allowGuardianRequest |
| `maxAdvanceDays` | `Int` | Yes | `30` | Entity attribute representing maxAdvanceDays |
| `notesBn` | `String?` | No | - | Bangla language localized text |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `session` | `AcademicSession` | Yes | - | Entity attribute representing session |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `session` (AcademicSession): `fields: [sessionId], references: [id], onDelete: Cascade`

**Unique Constraints:**  
`sessionId`, `sessionId`

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---


### 10. Inventory, Procurement & Fixed Assets

#### InventoryCategory

**Purpose:**  
Hierarchical classification of madrasa equipment, stationery, and consumables.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `code` | `String` | Yes | - | Entity attribute representing code |
| `nameBn` | `String` | Yes | - | Bangla language localized text |
| `nameEn` | `String?` | No | - | English language localized text |
| `description` | `String?` | No | - | Entity attribute representing description |
| `sortOrder` | `Int` | Yes | `0` | Entity attribute representing sortOrder |
| `isActive` | `Boolean` | Yes | `true` | Entity attribute representing isActive |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |

**Primary Key:**  
`id`

**Foreign Keys:**  
None

**Unique Constraints:**  
`code`, `code`

**Indexes:**  
- `@@index([isActive])`

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### InventoryLocation

**Purpose:**  
Physical storage rooms, warehouses, and almira locations across campus.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `code` | `String` | Yes | - | Entity attribute representing code |
| `nameBn` | `String` | Yes | - | Bangla language localized text |
| `nameEn` | `String?` | No | - | English language localized text |
| `description` | `String?` | No | - | Entity attribute representing description |
| `isActive` | `Boolean` | Yes | `true` | Entity attribute representing isActive |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |

**Primary Key:**  
`id`

**Foreign Keys:**  
None

**Unique Constraints:**  
`code`, `code`

**Indexes:**  
- `@@index([isActive])`

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### InventoryItem

**Purpose:**  
Consumable and non-consumable inventory catalog items.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `itemCode` | `String` | Yes | - | Entity attribute representing itemCode |
| `nameBn` | `String` | Yes | - | Bangla language localized text |
| `nameEn` | `String?` | No | - | English language localized text |
| `categoryId` | `String` | Yes | - | Foreign key referencing category |
| `unit` | `String` | Yes | - | Entity attribute representing unit |
| `description` | `String?` | No | - | Entity attribute representing description |
| `isConsumable` | `Boolean` | Yes | `true` | Entity attribute representing isConsumable |
| `minStock` | `Float` | Yes | `5` | Entity attribute representing minStock |
| `reorderLevel` | `Float` | Yes | `10` | Entity attribute representing reorderLevel |
| `maxStock` | `Float?` | No | - | Entity attribute representing maxStock |
| `defaultUnitCost` | `Float` | Yes | `0` | Monetary amount in BDT (৳) |
| `isActive` | `Boolean` | Yes | `true` | Entity attribute representing isActive |
| `notes` | `String?` | No | - | Entity attribute representing notes |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `category` | `InventoryCategory` | Yes | - | Entity attribute representing category |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `category` (InventoryCategory): `fields: [categoryId], references: [id], onDelete: Restrict`

**Unique Constraints:**  
`itemCode`, `itemCode`

**Indexes:**  
- `@@index([categoryId])`
- `@@index([isActive])`
- `@@index([itemCode])`

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### InventoryStockBalance

**Purpose:**  
Current stock quantity on hand tracked per inventory item and storage location.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `itemId` | `String` | Yes | - | Foreign key referencing item |
| `locationId` | `String` | Yes | - | Foreign key referencing location |
| `openingBalance` | `Float` | Yes | `0` | Monetary amount in BDT (৳) |
| `totalIn` | `Float` | Yes | `0` | Entity attribute representing totalIn |
| `totalOut` | `Float` | Yes | `0` | Entity attribute representing totalOut |
| `currentBalance` | `Float` | Yes | `0` | Monetary amount in BDT (৳) |
| `lastAdjustedAt` | `DateTime?` | No | - | Timestamp / Date record |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `item` | `InventoryItem` | Yes | - | Entity attribute representing item |
| `location` | `InventoryLocation` | Yes | - | Entity attribute representing location |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `item` (InventoryItem): `fields: [itemId], references: [id], onDelete: Cascade`
- `location` (InventoryLocation): `fields: [locationId], references: [id], onDelete: Cascade`

**Unique Constraints:**  
`@@unique([itemId, locationId])`

**Indexes:**  
- `@@index([itemId])`
- `@@index([locationId])`

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### InventoryTransaction

**Purpose:**  
Material inward, outward, transfer, and adjustment transactions.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `transactionNumber` | `String` | Yes | - | Entity attribute representing transactionNumber |
| `itemId` | `String` | Yes | - | Foreign key referencing item |
| `sourceLocationId` | `String?` | No | - | Foreign key referencing sourceLocation |
| `destLocationId` | `String?` | No | - | Foreign key referencing destLocation |
| `transactionType` | `String` | Yes | - | Entity attribute representing transactionType |
| `quantity` | `Float` | Yes | - | Entity attribute representing quantity |
| `unitCost` | `Float?` | No | - | Monetary amount in BDT (৳) |
| `totalCost` | `Float?` | No | - | Monetary amount in BDT (৳) |
| `reference` | `String?` | No | - | Entity attribute representing reference |
| `purpose` | `String?` | No | - | Entity attribute representing purpose |
| `recipient` | `String?` | No | - | Entity attribute representing recipient |
| `systemStockBefore` | `Float?` | No | - | Entity attribute representing systemStockBefore |
| `systemStockAfter` | `Float?` | No | - | Entity attribute representing systemStockAfter |
| `notes` | `String?` | No | - | Entity attribute representing notes |
| `recordedByUserId` | `String` | Yes | - | Foreign key referencing recordedByUser |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `item` | `InventoryItem` | Yes | - | Entity attribute representing item |
| `sourceLocation` | `InventoryLocation?` | No | - | Entity attribute representing sourceLocation |
| `destLocation` | `InventoryLocation?` | No | - | Entity attribute representing destLocation |
| `recordedByUser` | `User` | Yes | - | Entity attribute representing recordedByUser |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `item` (InventoryItem): `fields: [itemId], references: [id], onDelete: Restrict`
- `sourceLocation` (InventoryLocation?): `"SourceLocation", fields: [sourceLocationId], references: [id], onDelete: SetNull`
- `destLocation` (InventoryLocation?): `"DestLocation", fields: [destLocationId], references: [id], onDelete: SetNull`
- `recordedByUser` (User): `"InventoryTxRecordedBy", fields: [recordedByUserId], references: [id]`

**Unique Constraints:**  
`transactionNumber`, `transactionNumber`

**Indexes:**  
- `@@index([itemId])`
- `@@index([transactionType])`
- `@@index([createdAt])`
- `@@index([sourceLocationId])`
- `@@index([destLocationId])`

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### Supplier

**Purpose:**  
Approved commercial vendors and contractors supplying goods and services.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `supplierCode` | `String` | Yes | - | Entity attribute representing supplierCode |
| `name` | `String` | Yes | - | Entity attribute representing name |
| `contactPerson` | `String?` | No | - | Entity attribute representing contactPerson |
| `phone` | `String` | Yes | - | Entity attribute representing phone |
| `altPhone` | `String?` | No | - | Entity attribute representing altPhone |
| `email` | `String?` | No | - | Entity attribute representing email |
| `address` | `String?` | No | - | Entity attribute representing address |
| `taxNumber` | `String?` | No | - | Entity attribute representing taxNumber |
| `notes` | `String?` | No | - | Entity attribute representing notes |
| `isActive` | `Boolean` | Yes | `true` | Entity attribute representing isActive |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |

**Primary Key:**  
`id`

**Foreign Keys:**  
None

**Unique Constraints:**  
`supplierCode`, `supplierCode`

**Indexes:**  
- `@@index([isActive])`

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### PurchaseRequest

**Purpose:**  
Departmental purchase requisitions seeking procurement approval.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `requestNumber` | `String` | Yes | - | Entity attribute representing requestNumber |
| `title` | `String` | Yes | - | Entity attribute representing title |
| `purpose` | `String` | Yes | - | Entity attribute representing purpose |
| `priority` | `String` | Yes | `"NORMAL"` | Entity attribute representing priority |
| `status` | `String` | Yes | `"DRAFT"` | Operational state identifier |
| `requestedDate` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `requiredDate` | `DateTime?` | No | - | Timestamp / Date record |
| `totalEstimatedCost` | `Float` | Yes | `0` | Monetary amount in BDT (৳) |
| `adminNotes` | `String?` | No | - | Entity attribute representing adminNotes |
| `requestedByUserId` | `String` | Yes | - | Foreign key referencing requestedByUser |
| `reviewedByUserId` | `String?` | No | - | Foreign key referencing reviewedByUser |
| `reviewedAt` | `DateTime?` | No | - | Timestamp / Date record |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `requestedByUser` | `User` | Yes | - | Entity attribute representing requestedByUser |
| `reviewedByUser` | `User?` | No | - | Entity attribute representing reviewedByUser |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `requestedByUser` (User): `"PurchaseRequestRequestedBy", fields: [requestedByUserId], references: [id]`
- `reviewedByUser` (User?): `"PurchaseRequestReviewedBy", fields: [reviewedByUserId], references: [id], onDelete: SetNull`

**Unique Constraints:**  
`requestNumber`, `requestNumber`

**Indexes:**  
- `@@index([status])`
- `@@index([priority])`
- `@@index([requestedByUserId])`

**Status / Enum Values:**  
- Field `status`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### PurchaseRequestItem

**Purpose:**  
Itemized lines requested on a purchase requisition.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `requestId` | `String` | Yes | - | Foreign key referencing request |
| `itemId` | `String` | Yes | - | Foreign key referencing item |
| `quantity` | `Float` | Yes | - | Entity attribute representing quantity |
| `estimatedUnitCost` | `Float` | Yes | `0` | Monetary amount in BDT (৳) |
| `totalEstimated` | `Float` | Yes | `0` | Entity attribute representing totalEstimated |
| `notes` | `String?` | No | - | Entity attribute representing notes |
| `request` | `PurchaseRequest` | Yes | - | Entity attribute representing request |
| `item` | `InventoryItem` | Yes | - | Entity attribute representing item |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `request` (PurchaseRequest): `fields: [requestId], references: [id], onDelete: Cascade`
- `item` (InventoryItem): `fields: [itemId], references: [id], onDelete: Restrict`

**Unique Constraints:**  
None

**Indexes:**  
- `@@index([requestId])`
- `@@index([itemId])`

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### PurchaseOrder

**Purpose:**  
Official purchase contracts awarded to suppliers for goods or services.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `poNumber` | `String` | Yes | - | Entity attribute representing poNumber |
| `supplierId` | `String` | Yes | - | Foreign key referencing supplier |
| `purchaseRequestId` | `String?` | No | - | Foreign key referencing purchaseRequest |
| `orderDate` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `expectedDeliveryDate` | `DateTime?` | No | - | Timestamp / Date record |
| `subtotal` | `Float` | Yes | - | Entity attribute representing subtotal |
| `discount` | `Float` | Yes | `0` | Entity attribute representing discount |
| `tax` | `Float` | Yes | `0` | Entity attribute representing tax |
| `totalAmount` | `Float` | Yes | - | Monetary amount in BDT (৳) |
| `status` | `String` | Yes | `"DRAFT"` | Operational state identifier |
| `notes` | `String?` | No | - | Entity attribute representing notes |
| `approvedByUserId` | `String?` | No | - | Foreign key referencing approvedByUser |
| `approvedAt` | `DateTime?` | No | - | Timestamp / Date record |
| `createdById` | `String` | Yes | - | Foreign key referencing createdBy |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `supplier` | `Supplier` | Yes | - | Entity attribute representing supplier |
| `purchaseRequest` | `PurchaseRequest?` | No | - | Entity attribute representing purchaseRequest |
| `approvedByUser` | `User?` | No | - | Entity attribute representing approvedByUser |
| `createdByUser` | `User` | Yes | - | Entity attribute representing createdByUser |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `supplier` (Supplier): `fields: [supplierId], references: [id], onDelete: Restrict`
- `purchaseRequest` (PurchaseRequest?): `fields: [purchaseRequestId], references: [id], onDelete: SetNull`
- `approvedByUser` (User?): `"POApprovedBy", fields: [approvedByUserId], references: [id], onDelete: SetNull`
- `createdByUser` (User): `"POCreatedBy", fields: [createdById], references: [id]`

**Unique Constraints:**  
`poNumber`, `poNumber`

**Indexes:**  
- `@@index([supplierId])`
- `@@index([status])`
- `@@index([orderDate])`

**Status / Enum Values:**  
- Field `status`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### PurchaseOrderItem

**Purpose:**  
Itemized goods lines on an approved purchase order.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `purchaseOrderId` | `String` | Yes | - | Foreign key referencing purchaseOrder |
| `itemId` | `String` | Yes | - | Foreign key referencing item |
| `quantityOrdered` | `Float` | Yes | - | Entity attribute representing quantityOrdered |
| `quantityReceived` | `Float` | Yes | `0` | Entity attribute representing quantityReceived |
| `unitPrice` | `Float` | Yes | - | Monetary amount in BDT (৳) |
| `totalPrice` | `Float` | Yes | - | Monetary amount in BDT (৳) |
| `notes` | `String?` | No | - | Entity attribute representing notes |
| `purchaseOrder` | `PurchaseOrder` | Yes | - | Entity attribute representing purchaseOrder |
| `item` | `InventoryItem` | Yes | - | Entity attribute representing item |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `purchaseOrder` (PurchaseOrder): `fields: [purchaseOrderId], references: [id], onDelete: Cascade`
- `item` (InventoryItem): `fields: [itemId], references: [id], onDelete: Restrict`

**Unique Constraints:**  
None

**Indexes:**  
- `@@index([purchaseOrderId])`
- `@@index([itemId])`

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### GoodsReceipt

**Purpose:**  
Material inspection and delivery receiving notes acknowledging vendor deliveries.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `receiptNumber` | `String` | Yes | - | Entity attribute representing receiptNumber |
| `purchaseOrderId` | `String` | Yes | - | Foreign key referencing purchaseOrder |
| `receivedDate` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `locationId` | `String` | Yes | - | Foreign key referencing location |
| `deliveryChallanNumber` | `String?` | No | - | Entity attribute representing deliveryChallanNumber |
| `notes` | `String?` | No | - | Entity attribute representing notes |
| `financeExpenseId` | `String?` | No | - | Foreign key referencing financeExpense |
| `receivedByUserId` | `String` | Yes | - | Foreign key referencing receivedByUser |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `purchaseOrder` | `PurchaseOrder` | Yes | - | Entity attribute representing purchaseOrder |
| `receivedByUser` | `User` | Yes | - | Entity attribute representing receivedByUser |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `purchaseOrder` (PurchaseOrder): `fields: [purchaseOrderId], references: [id], onDelete: Restrict`
- `receivedByUser` (User): `"GRNReceivedBy", fields: [receivedByUserId], references: [id]`

**Unique Constraints:**  
`receiptNumber`, `receiptNumber`

**Indexes:**  
- `@@index([purchaseOrderId])`
- `@@index([receivedDate])`

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### GoodsReceiptItem

**Purpose:**  
Itemized quantities received and accepted against purchase orders.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `goodsReceiptId` | `String` | Yes | - | Foreign key referencing goodsReceipt |
| `purchaseOrderItemId` | `String?` | No | - | Foreign key referencing purchaseOrderItem |
| `itemId` | `String` | Yes | - | Foreign key referencing item |
| `quantityReceived` | `Float` | Yes | - | Entity attribute representing quantityReceived |
| `quantityDamaged` | `Float` | Yes | `0` | Entity attribute representing quantityDamaged |
| `quantityAccepted` | `Float` | Yes | - | Entity attribute representing quantityAccepted |
| `unitCost` | `Float` | Yes | - | Monetary amount in BDT (৳) |
| `totalCost` | `Float` | Yes | - | Monetary amount in BDT (৳) |
| `goodsReceipt` | `GoodsReceipt` | Yes | - | Entity attribute representing goodsReceipt |
| `purchaseOrderItem` | `PurchaseOrderItem?` | No | - | Entity attribute representing purchaseOrderItem |
| `item` | `InventoryItem` | Yes | - | Entity attribute representing item |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `goodsReceipt` (GoodsReceipt): `fields: [goodsReceiptId], references: [id], onDelete: Cascade`
- `purchaseOrderItem` (PurchaseOrderItem?): `fields: [purchaseOrderItemId], references: [id], onDelete: SetNull`
- `item` (InventoryItem): `fields: [itemId], references: [id], onDelete: Restrict`

**Unique Constraints:**  
None

**Indexes:**  
- `@@index([goodsReceiptId])`
- `@@index([itemId])`

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### InventoryAsset

**Purpose:**  
Capitalized institutional fixed assets with serial numbers, warranty, and depreciation.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `assetCode` | `String` | Yes | - | Entity attribute representing assetCode |
| `itemId` | `String` | Yes | - | Foreign key referencing item |
| `serialNumber` | `String?` | No | - | Entity attribute representing serialNumber |
| `purchaseCost` | `Float?` | No | - | Monetary amount in BDT (৳) |
| `purchaseDate` | `DateTime?` | No | - | Timestamp / Date record |
| `warrantyExpiry` | `DateTime?` | No | - | Entity attribute representing warrantyExpiry |
| `supplierId` | `String?` | No | - | Foreign key referencing supplier |
| `locationId` | `String` | Yes | - | Foreign key referencing location |
| `assignedUserId` | `String?` | No | - | Foreign key referencing assignedUser |
| `assignedEmployeeId` | `String?` | No | - | Foreign key referencing assignedEmployee |
| `assignedDepartment` | `String?` | No | - | Entity attribute representing assignedDepartment |
| `condition` | `String` | Yes | `"NEW"` | Entity attribute representing condition |
| `status` | `String` | Yes | `"AVAILABLE"` | Operational state identifier |
| `disposalDate` | `DateTime?` | No | - | Timestamp / Date record |
| `disposalValue` | `Float?` | No | - | Entity attribute representing disposalValue |
| `disposalReason` | `String?` | No | - | Entity attribute representing disposalReason |
| `notes` | `String?` | No | - | Entity attribute representing notes |
| `qrToken` | `String` | Yes | `uuid(` | Entity attribute representing qrToken |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `item` | `InventoryItem` | Yes | - | Entity attribute representing item |
| `location` | `InventoryLocation` | Yes | - | Entity attribute representing location |
| `supplier` | `Supplier?` | No | - | Entity attribute representing supplier |
| `assignedUser` | `User?` | No | - | Entity attribute representing assignedUser |
| `assignedEmployee` | `Employee?` | No | - | Entity attribute representing assignedEmployee |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `item` (InventoryItem): `fields: [itemId], references: [id], onDelete: Restrict`
- `location` (InventoryLocation): `fields: [locationId], references: [id], onDelete: Restrict`
- `supplier` (Supplier?): `fields: [supplierId], references: [id], onDelete: SetNull`
- `assignedUser` (User?): `"AssetAssignedUser", fields: [assignedUserId], references: [id], onDelete: SetNull`
- `assignedEmployee` (Employee?): `"AssetAssignedEmployee", fields: [assignedEmployeeId], references: [id], onDelete: SetNull`

**Unique Constraints:**  
`assetCode`, `qrToken`, `assetCode`, `qrToken`

**Indexes:**  
- `@@index([itemId])`
- `@@index([locationId])`
- `@@index([status])`
- `@@index([condition])`
- `@@index([assignedUserId])`
- `@@index([assignedEmployeeId])`
- `@@index([assetCode])`

**Status / Enum Values:**  
- Field `status`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### AssetAssignmentHistory

**Purpose:**  
Custody transfer logs tracking custody of assets to staff or departments.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `assetId` | `String` | Yes | - | Foreign key referencing asset |
| `assignedUserId` | `String?` | No | - | Foreign key referencing assignedUser |
| `assignedEmployeeId` | `String?` | No | - | Foreign key referencing assignedEmployee |
| `assignedDepartment` | `String?` | No | - | Entity attribute representing assignedDepartment |
| `locationId` | `String?` | No | - | Foreign key referencing location |
| `previousUserId` | `String?` | No | - | Foreign key referencing previousUser |
| `previousLocationId` | `String?` | No | - | Foreign key referencing previousLocation |
| `assignmentDate` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `returnDate` | `DateTime?` | No | - | Timestamp / Date record |
| `reason` | `String?` | No | - | Entity attribute representing reason |
| `notes` | `String?` | No | - | Entity attribute representing notes |
| `assignedByUserId` | `String` | Yes | - | Foreign key referencing assignedByUser |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `asset` | `InventoryAsset` | Yes | - | Entity attribute representing asset |
| `assignedByUser` | `User` | Yes | - | Entity attribute representing assignedByUser |
| `assignedEmployee` | `Employee?` | No | - | Entity attribute representing assignedEmployee |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `asset` (InventoryAsset): `fields: [assetId], references: [id], onDelete: Cascade`
- `assignedByUser` (User): `"AssetAssignedByUser", fields: [assignedByUserId], references: [id]`
- `assignedEmployee` (Employee?): `"AssetAssignedEmployeeHistory", fields: [assignedEmployeeId], references: [id], onDelete: SetNull`

**Unique Constraints:**  
None

**Indexes:**  
- `@@index([assetId])`
- `@@index([assignedUserId])`
- `@@index([assignedEmployeeId])`
- `@@index([assignmentDate])`

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### AssetConditionHistory

**Purpose:**  
Periodic condition inspection and repair histories for fixed assets.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `assetId` | `String` | Yes | - | Foreign key referencing asset |
| `previousCondition` | `String` | Yes | - | Entity attribute representing previousCondition |
| `newCondition` | `String` | Yes | - | Entity attribute representing newCondition |
| `previousStatus` | `String?` | No | - | Operational state identifier |
| `newStatus` | `String?` | No | - | Operational state identifier |
| `event` | `String` | Yes | - | Entity attribute representing event |
| `cost` | `Float?` | No | - | Entity attribute representing cost |
| `reason` | `String?` | No | - | Entity attribute representing reason |
| `notes` | `String?` | No | - | Entity attribute representing notes |
| `recordedByUserId` | `String` | Yes | - | Foreign key referencing recordedByUser |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `asset` | `InventoryAsset` | Yes | - | Entity attribute representing asset |
| `recordedByUser` | `User` | Yes | - | Entity attribute representing recordedByUser |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `asset` (InventoryAsset): `fields: [assetId], references: [id], onDelete: Cascade`
- `recordedByUser` (User): `"AssetConditionRecordedBy", fields: [recordedByUserId], references: [id]`

**Unique Constraints:**  
None

**Indexes:**  
- `@@index([assetId])`
- `@@index([event])`
- `@@index([createdAt])`

**Status / Enum Values:**  
- Field `previousStatus`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### InventorySequence

**Purpose:**  
Atomic serial sequence generator for purchase orders, requisitions, and MRRs.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `prefix` | `String` | Yes | - | Entity attribute representing prefix |
| `year` | `Int` | Yes | - | Entity attribute representing year |
| `lastSeq` | `Int` | Yes | `0` | Entity attribute representing lastSeq |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |

**Primary Key:**  
`id`

**Foreign Keys:**  
None

**Unique Constraints:**  
`@@unique([prefix, year])`

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---


### 11. Human Resources & Payroll Management

#### Employee

**Purpose:**  
Staff and teacher employment profiles, emergency contacts, and payroll affiliations.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `employeeId` | `String` | Yes | - | Foreign key referencing employee |
| `userId` | `String?` | No | - | Foreign key referencing user |
| `departmentId` | `String?` | No | - | Foreign key referencing department |
| `designationId` | `String?` | No | - | Foreign key referencing designation |
| `nameBn` | `String` | Yes | - | Bangla language localized text |
| `nameEn` | `String` | Yes | - | English language localized text |
| `nameAr` | `String?` | No | - | Arabic language localized text |
| `employeeType` | `String` | Yes | `"TEACHER"` | Entity attribute representing employeeType |
| `gender` | `String` | Yes | `"MALE"` | Entity attribute representing gender |
| `dateOfBirth` | `DateTime?` | No | - | Entity attribute representing dateOfBirth |
| `bloodGroup` | `String?` | No | - | Entity attribute representing bloodGroup |
| `mobile` | `String` | Yes | - | Entity attribute representing mobile |
| `email` | `String?` | No | - | Entity attribute representing email |
| `nidNumber` | `String?` | No | - | Entity attribute representing nidNumber |
| `presentAddress` | `String?` | No | - | Entity attribute representing presentAddress |
| `permanentAddress` | `String?` | No | - | Entity attribute representing permanentAddress |
| `emergencyContact` | `String?` | No | - | Entity attribute representing emergencyContact |
| `joiningDate` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `baseSalary` | `Float` | Yes | `0` | Entity attribute representing baseSalary |
| `status` | `String` | Yes | `"ACTIVE"` | Operational state identifier |
| `exitDate` | `DateTime?` | No | - | Timestamp / Date record |
| `exitReason` | `String?` | No | - | Entity attribute representing exitReason |
| `photoUrl` | `String?` | No | - | Entity attribute representing photoUrl |
| `qrToken` | `String` | Yes | `uuid(` | Entity attribute representing qrToken |
| `notes` | `String?` | No | - | Entity attribute representing notes |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `user` | `User?` | No | - | Entity attribute representing user |
| `department` | `EmployeeDepartment?` | No | - | Entity attribute representing department |
| `designation` | `EmployeeDesignation?` | No | - | Entity attribute representing designation |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `user` (User?): `"UserEmployee", fields: [userId], references: [id], onDelete: SetNull`
- `department` (EmployeeDepartment?): `fields: [departmentId], references: [id], onDelete: SetNull`
- `designation` (EmployeeDesignation?): `fields: [designationId], references: [id], onDelete: SetNull`

**Unique Constraints:**  
`employeeId`, `userId`, `qrToken`, `employeeId`, `userId`, `qrToken`

**Indexes:**  
- `@@index([status])`
- `@@index([departmentId])`
- `@@index([designationId])`
- `@@index([employeeType])`
- `@@index([mobile])`

**Status / Enum Values:**  
- Field `gender`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### EmployeeDepartment

**Purpose:**  
Administrative and academic departments (e.g. Hifz, Kitab, Administration).

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `nameBn` | `String` | Yes | - | Bangla language localized text |
| `nameEn` | `String` | Yes | - | English language localized text |
| `description` | `String?` | No | - | Entity attribute representing description |
| `sortOrder` | `Int` | Yes | `0` | Entity attribute representing sortOrder |
| `isActive` | `Boolean` | Yes | `true` | Entity attribute representing isActive |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |

**Primary Key:**  
`id`

**Foreign Keys:**  
None

**Unique Constraints:**  
`nameEn`, `nameEn`

**Indexes:**  
- `@@index([isActive])`

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### EmployeeDesignation

**Purpose:**  
Staff job titles and hierarchical ranking (e.g., Mudarris, Senior Ustadh, Accountant).

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `nameBn` | `String` | Yes | - | Bangla language localized text |
| `nameEn` | `String` | Yes | - | English language localized text |
| `departmentId` | `String?` | No | - | Foreign key referencing department |
| `description` | `String?` | No | - | Entity attribute representing description |
| `sortOrder` | `Int` | Yes | `0` | Entity attribute representing sortOrder |
| `isActive` | `Boolean` | Yes | `true` | Entity attribute representing isActive |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |

**Primary Key:**  
`id`

**Foreign Keys:**  
None

**Unique Constraints:**  
`nameEn`, `nameEn`

**Indexes:**  
- `@@index([isActive])`

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### EmployeeEmploymentHistory

**Purpose:**  
Chronological promotion, transfer, and tenure records for madrasa personnel.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `employeeId` | `String` | Yes | - | Foreign key referencing employee |
| `changeType` | `String` | Yes | - | Entity attribute representing changeType |
| `previousValue` | `String?` | No | - | Entity attribute representing previousValue |
| `newValue` | `String?` | No | - | Entity attribute representing newValue |
| `effectiveDate` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `reason` | `String?` | No | - | Entity attribute representing reason |
| `remarks` | `String?` | No | - | Entity attribute representing remarks |
| `recordedByUserId` | `String` | Yes | - | Foreign key referencing recordedByUser |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `employee` | `Employee` | Yes | - | Entity attribute representing employee |
| `recordedByUser` | `User` | Yes | - | Entity attribute representing recordedByUser |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `employee` (Employee): `fields: [employeeId], references: [id], onDelete: Cascade`
- `recordedByUser` (User): `"EmpHistoryRecordedBy", fields: [recordedByUserId], references: [id]`

**Unique Constraints:**  
None

**Indexes:**  
- `@@index([employeeId])`
- `@@index([changeType])`
- `@@index([effectiveDate])`

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### EmployeeQualification

**Purpose:**  
Academic certificates, Dawra-e-Hadith sanads, and professional diplomas held by staff.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `employeeId` | `String` | Yes | - | Foreign key referencing employee |
| `degreeTitle` | `String` | Yes | - | Entity attribute representing degreeTitle |
| `institution` | `String` | Yes | - | Entity attribute representing institution |
| `boardOrUniversity` | `String?` | No | - | Entity attribute representing boardOrUniversity |
| `majorOrSubject` | `String?` | No | - | Entity attribute representing majorOrSubject |
| `passingYear` | `Int?` | No | - | Entity attribute representing passingYear |
| `resultOrGrade` | `String?` | No | - | Entity attribute representing resultOrGrade |
| `certificateUrl` | `String?` | No | - | Entity attribute representing certificateUrl |
| `verificationStatus` | `String` | Yes | `"VERIFIED"` | Operational state identifier |
| `notes` | `String?` | No | - | Entity attribute representing notes |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `employee` | `Employee` | Yes | - | Entity attribute representing employee |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `employee` (Employee): `fields: [employeeId], references: [id], onDelete: Cascade`

**Unique Constraints:**  
None

**Indexes:**  
- `@@index([employeeId])`

**Status / Enum Values:**  
- Field `verificationStatus`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### EmployeeDocument

**Purpose:**  
Scanned NID copies, appointment letters, and educational credentials of staff.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `employeeId` | `String` | Yes | - | Foreign key referencing employee |
| `documentType` | `String` | Yes | - | Entity attribute representing documentType |
| `title` | `String` | Yes | - | Entity attribute representing title |
| `fileUrl` | `String` | Yes | - | Entity attribute representing fileUrl |
| `issueDate` | `DateTime?` | No | - | Timestamp / Date record |
| `expiryDate` | `DateTime?` | No | - | Timestamp / Date record |
| `verificationStatus` | `String` | Yes | `"VERIFIED"` | Operational state identifier |
| `verificationToken` | `String` | Yes | `uuid(` | Entity attribute representing verificationToken |
| `notes` | `String?` | No | - | Entity attribute representing notes |
| `uploadedByUserId` | `String` | Yes | - | Foreign key referencing uploadedByUser |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `employee` | `Employee` | Yes | - | Entity attribute representing employee |
| `uploadedByUser` | `User` | Yes | - | Entity attribute representing uploadedByUser |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `employee` (Employee): `fields: [employeeId], references: [id], onDelete: Cascade`
- `uploadedByUser` (User): `"EmpDocUploadedBy", fields: [uploadedByUserId], references: [id]`

**Unique Constraints:**  
`verificationToken`, `verificationToken`

**Indexes:**  
- `@@index([employeeId])`
- `@@index([documentType])`
- `@@index([expiryDate])`

**Status / Enum Values:**  
- Field `verificationStatus`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### EmployeeLeaveType

**Purpose:**  
Institutional leave categories (e.g., Casual, Medical, Hajj, Maternity).

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `code` | `String` | Yes | - | Entity attribute representing code |
| `nameBn` | `String` | Yes | - | Bangla language localized text |
| `nameEn` | `String` | Yes | - | English language localized text |
| `defaultDaysPerYear` | `Int` | Yes | `10` | Entity attribute representing defaultDaysPerYear |
| `isPaid` | `Boolean` | Yes | `true` | Entity attribute representing isPaid |
| `requiresDocument` | `Boolean` | Yes | `false` | Entity attribute representing requiresDocument |
| `isActive` | `Boolean` | Yes | `true` | Entity attribute representing isActive |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |

**Primary Key:**  
`id`

**Foreign Keys:**  
None

**Unique Constraints:**  
`code`, `code`

**Indexes:**  
- `@@index([isActive])`

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### EmployeeLeaveBalance

**Purpose:**  
Annual leave quotas and consumed balances tracked per employee.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `employeeId` | `String` | Yes | - | Foreign key referencing employee |
| `leaveTypeId` | `String` | Yes | - | Foreign key referencing leaveType |
| `year` | `Int` | Yes | - | Entity attribute representing year |
| `allocatedDays` | `Float` | Yes | - | Entity attribute representing allocatedDays |
| `usedDays` | `Float` | Yes | `0` | Entity attribute representing usedDays |
| `pendingDays` | `Float` | Yes | `0` | Entity attribute representing pendingDays |
| `remainingDays` | `Float` | Yes | - | Entity attribute representing remainingDays |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `employee` | `Employee` | Yes | - | Entity attribute representing employee |
| `leaveType` | `EmployeeLeaveType` | Yes | - | Entity attribute representing leaveType |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `employee` (Employee): `fields: [employeeId], references: [id], onDelete: Cascade`
- `leaveType` (EmployeeLeaveType): `fields: [leaveTypeId], references: [id], onDelete: Cascade`

**Unique Constraints:**  
`@@unique([employeeId, leaveTypeId, year])`

**Indexes:**  
- `@@index([employeeId, year])`

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### EmployeeLeaveRequest

**Purpose:**  
Formal employee leave applications with multi-tier approval workflow.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `requestCode` | `String` | Yes | - | Entity attribute representing requestCode |
| `employeeId` | `String` | Yes | - | Foreign key referencing employee |
| `leaveTypeId` | `String` | Yes | - | Foreign key referencing leaveType |
| `startDate` | `DateTime` | Yes | - | Timestamp / Date record |
| `endDate` | `DateTime` | Yes | - | Timestamp / Date record |
| `totalDays` | `Float` | Yes | - | Entity attribute representing totalDays |
| `reason` | `String` | Yes | - | Entity attribute representing reason |
| `emergencyContact` | `String?` | No | - | Entity attribute representing emergencyContact |
| `attachmentUrl` | `String?` | No | - | Entity attribute representing attachmentUrl |
| `status` | `String` | Yes | `"SUBMITTED"` | Operational state identifier |
| `reviewedByUserId` | `String?` | No | - | Foreign key referencing reviewedByUser |
| `reviewedAt` | `DateTime?` | No | - | Timestamp / Date record |
| `decisionReason` | `String?` | No | - | Entity attribute representing decisionReason |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `employee` | `Employee` | Yes | - | Entity attribute representing employee |
| `leaveType` | `EmployeeLeaveType` | Yes | - | Entity attribute representing leaveType |
| `reviewedByUser` | `User?` | No | - | Entity attribute representing reviewedByUser |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `employee` (Employee): `fields: [employeeId], references: [id], onDelete: Cascade`
- `leaveType` (EmployeeLeaveType): `fields: [leaveTypeId], references: [id], onDelete: Restrict`
- `reviewedByUser` (User?): `"EmpLeaveReviewedBy", fields: [reviewedByUserId], references: [id], onDelete: SetNull`

**Unique Constraints:**  
`requestCode`, `requestCode`

**Indexes:**  
- `@@index([employeeId])`
- `@@index([status])`
- `@@index([startDate, endDate])`

**Status / Enum Values:**  
- Field `status`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### EmployeeAttendanceRecord

**Purpose:**  
Daily staff biometric or manual attendance clock-in/out logs.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `employeeId` | `String` | Yes | - | Foreign key referencing employee |
| `date` | `DateTime` | Yes | - | Entity attribute representing date |
| `status` | `String` | Yes | `"PRESENT"` | Operational state identifier |
| `checkInTime` | `String?` | No | - | Entity attribute representing checkInTime |
| `checkOutTime` | `String?` | No | - | Entity attribute representing checkOutTime |
| `remarks` | `String?` | No | - | Entity attribute representing remarks |
| `recordedByUserId` | `String` | Yes | - | Foreign key referencing recordedByUser |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `employee` | `Employee` | Yes | - | Entity attribute representing employee |
| `recordedByUser` | `User` | Yes | - | Entity attribute representing recordedByUser |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `employee` (Employee): `fields: [employeeId], references: [id], onDelete: Cascade`
- `recordedByUser` (User): `"EmpAttendanceRecordedBy", fields: [recordedByUserId], references: [id]`

**Unique Constraints:**  
`@@unique([employeeId, date])`

**Indexes:**  
- `@@index([date, status])`

**Status / Enum Values:**  
- Field `status`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### HrSequence

**Purpose:**  
Atomic sequential identifier generator for staff ID cards and leave requests.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `prefix` | `String` | Yes | - | Entity attribute representing prefix |
| `year` | `Int` | Yes | - | Entity attribute representing year |
| `lastSeq` | `Int` | Yes | `0` | Entity attribute representing lastSeq |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |

**Primary Key:**  
`id`

**Foreign Keys:**  
None

**Unique Constraints:**  
`@@unique([prefix, year])`

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---


### 12. Help Desk & Support Ticketing

#### SupportRequestCategory

**Purpose:**  
Categorization for helpdesk support tickets (Academic, Technical, Financial).

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `code` | `String` | Yes | - | Entity attribute representing code |
| `nameBn` | `String` | Yes | - | Bangla language localized text |
| `nameEn` | `String` | Yes | - | English language localized text |
| `description` | `String?` | No | - | Entity attribute representing description |
| `icon` | `String?` | No | `"HelpCircle"` | Entity attribute representing icon |
| `sortOrder` | `Int` | Yes | `0` | Entity attribute representing sortOrder |
| `isActive` | `Boolean` | Yes | `true` | Entity attribute representing isActive |
| `slaHours` | `Int` | Yes | `48` | Entity attribute representing slaHours |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |

**Primary Key:**  
`id`

**Foreign Keys:**  
None

**Unique Constraints:**  
`code`, `code`

**Indexes:**  
- `@@index([isActive])`

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### SupportRequest

**Purpose:**  
Help desk support tickets submitted by guardians, teachers, or students.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `ticketNumber` | `String` | Yes | - | Entity attribute representing ticketNumber |
| `categoryId` | `String` | Yes | - | Foreign key referencing category |
| `studentId` | `String?` | No | - | Foreign key referencing student |
| `guardianId` | `String?` | No | - | Foreign key referencing guardian |
| `submittedByUserId` | `String` | Yes | - | Foreign key referencing submittedByUser |
| `assignedToUserId` | `String?` | No | - | Foreign key referencing assignedToUser |
| `resolvedByUserId` | `String?` | No | - | Foreign key referencing resolvedByUser |
| `requestType` | `String` | Yes | `"SERVICE_REQUEST"` | Entity attribute representing requestType |
| `priority` | `String` | Yes | `"NORMAL"` | Entity attribute representing priority |
| `status` | `String` | Yes | `"SUBMITTED"` | Operational state identifier |
| `subject` | `String` | Yes | - | Entity attribute representing subject |
| `description` | `String` | Yes | - | Entity attribute representing description |
| `relatedEntityType` | `String?` | No | - | Entity attribute representing relatedEntityType |
| `relatedEntityId` | `String?` | No | - | Foreign key referencing relatedEntity |
| `resolutionSummary` | `String?` | No | - | Entity attribute representing resolutionSummary |
| `resolutionDate` | `DateTime?` | No | - | Timestamp / Date record |
| `reopenReason` | `String?` | No | - | Entity attribute representing reopenReason |
| `isEscalated` | `Boolean` | Yes | `false` | Entity attribute representing isEscalated |
| `escalationReason` | `String?` | No | - | Entity attribute representing escalationReason |
| `firstResponseAt` | `DateTime?` | No | - | Timestamp / Date record |
| `slaTargetAt` | `DateTime?` | No | - | Timestamp / Date record |
| `closedAt` | `DateTime?` | No | - | Timestamp / Date record |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `category` | `SupportRequestCategory` | Yes | - | Entity attribute representing category |
| `student` | `Student?` | No | - | Entity attribute representing student |
| `guardian` | `Guardian?` | No | - | Entity attribute representing guardian |
| `submittedByUser` | `User` | Yes | - | Entity attribute representing submittedByUser |
| `assignedToUser` | `User?` | No | - | Entity attribute representing assignedToUser |
| `resolvedByUser` | `User?` | No | - | Entity attribute representing resolvedByUser |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `category` (SupportRequestCategory): `fields: [categoryId], references: [id], onDelete: Restrict`
- `student` (Student?): `fields: [studentId], references: [id], onDelete: SetNull`
- `guardian` (Guardian?): `fields: [guardianId], references: [id], onDelete: SetNull`
- `submittedByUser` (User): `"SupportRequestSubmittedBy", fields: [submittedByUserId], references: [id], onDelete: Restrict`
- `assignedToUser` (User?): `"SupportRequestAssignedTo", fields: [assignedToUserId], references: [id], onDelete: SetNull`
- `resolvedByUser` (User?): `"SupportRequestResolvedBy", fields: [resolvedByUserId], references: [id], onDelete: SetNull`

**Unique Constraints:**  
`ticketNumber`, `ticketNumber`

**Indexes:**  
- `@@index([status])`
- `@@index([categoryId])`
- `@@index([studentId])`
- `@@index([guardianId])`
- `@@index([submittedByUserId])`
- `@@index([priority])`
- `@@index([createdAt])`

**Status / Enum Values:**  
- Field `status`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### SupportRequestMessage

**Purpose:**  
Discussion thread messages exchanged between ticket creator and staff.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `requestId` | `String` | Yes | - | Foreign key referencing request |
| `authorUserId` | `String` | Yes | - | Foreign key referencing authorUser |
| `messageType` | `String` | Yes | `"USER_RESPONSE"` | Entity attribute representing messageType |
| `content` | `String` | Yes | - | Entity attribute representing content |
| `isInternal` | `Boolean` | Yes | `false` | Entity attribute representing isInternal |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |
| `request` | `SupportRequest` | Yes | - | Entity attribute representing request |
| `authorUser` | `User` | Yes | - | Entity attribute representing authorUser |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `request` (SupportRequest): `fields: [requestId], references: [id], onDelete: Cascade`
- `authorUser` (User): `"SupportMessageAuthor", fields: [authorUserId], references: [id], onDelete: Restrict`

**Unique Constraints:**  
None

**Indexes:**  
- `@@index([requestId])`
- `@@index([isInternal])`
- `@@index([createdAt])`

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### SupportRequestStatusHistory

**Purpose:**  
Status change logs recording ticket progression from Open to Resolved.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `requestId` | `String` | Yes | - | Foreign key referencing request |
| `previousStatus` | `String?` | No | - | Operational state identifier |
| `newStatus` | `String` | Yes | - | Operational state identifier |
| `reason` | `String?` | No | - | Entity attribute representing reason |
| `remarks` | `String?` | No | - | Entity attribute representing remarks |
| `recordedByUserId` | `String` | Yes | - | Foreign key referencing recordedByUser |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `request` | `SupportRequest` | Yes | - | Entity attribute representing request |
| `recordedByUser` | `User` | Yes | - | Entity attribute representing recordedByUser |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `request` (SupportRequest): `fields: [requestId], references: [id], onDelete: Cascade`
- `recordedByUser` (User): `"SupportHistoryRecordedBy", fields: [recordedByUserId], references: [id], onDelete: Restrict`

**Unique Constraints:**  
None

**Indexes:**  
- `@@index([requestId])`
- `@@index([createdAt])`

**Status / Enum Values:**  
- Field `previousStatus`: Represented as string in SQLite. Validated at application boundary (e.g. `ACTIVE`, `INACTIVE`, `PENDING`, `APPROVED`, `REJECTED`).

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### SupportRequestAttachment

**Purpose:**  
Files and screenshots attached to support requests.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `requestId` | `String` | Yes | - | Foreign key referencing request |
| `messageId` | `String?` | No | - | Foreign key referencing message |
| `fileName` | `String` | Yes | - | Entity attribute representing fileName |
| `fileUrl` | `String` | Yes | - | Entity attribute representing fileUrl |
| `fileSize` | `Int` | Yes | `0` | Entity attribute representing fileSize |
| `mimeType` | `String` | Yes | `"application/octet-stream"` | Entity attribute representing mimeType |
| `isInternal` | `Boolean` | Yes | `false` | Entity attribute representing isInternal |
| `uploadedByUserId` | `String` | Yes | - | Foreign key referencing uploadedByUser |
| `createdAt` | `DateTime` | Yes | `now(` | Timestamp / Date record |
| `request` | `SupportRequest` | Yes | - | Entity attribute representing request |
| `message` | `SupportRequestMessage?` | No | - | Entity attribute representing message |

**Primary Key:**  
`id`

**Foreign Keys:**  
- `request` (SupportRequest): `fields: [requestId], references: [id], onDelete: Cascade`
- `message` (SupportRequestMessage?): `fields: [messageId], references: [id], onDelete: SetNull`

**Unique Constraints:**  
None

**Indexes:**  
- `@@index([requestId])`
- `@@index([messageId])`

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

#### SupportRequestSequence

**Purpose:**  
Atomic sequence generator for support ticket reference numbers.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | Yes | `uuid(` | Primary key identifier |
| `prefix` | `String` | Yes | - | Entity attribute representing prefix |
| `year` | `Int` | Yes | - | Entity attribute representing year |
| `lastSeq` | `Int` | Yes | `0` | Entity attribute representing lastSeq |
| `updatedAt` | `DateTime` | Yes | - | Timestamp / Date record |

**Primary Key:**  
`id`

**Foreign Keys:**  
None

**Unique Constraints:**  
`@@unique([prefix, year])`

**Indexes:**  
Default primary/unique B-tree indexes only

**Status / Enum Values:**  
Standard database primitives

**Security / Access Notes:**  
Protected by server-side session authentication (`getSessionUser`) and role validation.

---

## 4. Authentication Data

Authentication is managed through the `User` and `Session` models:
1. **Credentials:** User passwords are stored as cryptographic bcrypt hashes (`password` field) using a work factor of 10. Plaintext passwords are never persisted.
2. **Roles:** Stored as `role` string attribute on `User`:
   - `ADMIN`: Institutional super-administrator with full ERP read/write authority.
   - `PRINCIPAL`: Institutional governance head with policy oversight, circular signing, and reporting access.
   - `TEACHER`: Academic faculty with attendance and mark entry rights scoped strictly to assigned subjects and jamats.
   - `GUARDIAN`: Parents/guardians with access scoped strictly to linked children via `GuardianStudent`.
3. **Session Management:** The `Session` table stores issued JSON Web Tokens (`token`), foreign-keyed to `User.id`, with an authoritative `expiresAt` timestamp. Session revocation physically deletes or invalidates the token record in the database.
4. **Login Audit:** `LoginHistory` records all login attempts (successful and failed), logging IP address, user-agent string, and timestamp.

---

## 5. Security Architecture

1. **Role-Based Access Control (RBAC):** Server-side guards inspect user roles in API route handlers via `getSessionUser()`.
2. **Object-Level Authorization & IDOR Defense:**
   - **Guardian Portal:** All student queries (`/api/portal/finance`, `/api/portal/results`, `/api/portal/attendance`) cross-reference the user's `guardianId` against `GuardianStudent` before executing database queries.
   - **Teacher Workplace:** Mark and attendance submissions check `TeacherAssignment` table to verify whether the teacher is assigned to the specified class, section, and subject.
3. **SQL Injection Defense:** All database queries utilize Prisma Client parameterized query builders. Raw queries (`$queryRawUnsafe`) are restricted strictly to safe administrative pragmas (`PRAGMA journal_mode`, `PRAGMA busy_timeout`).
4. **Audit Trail:** Critical operations automatically write an immutable row to `AuditLog` within an atomic transaction.

---

## 6. Storage & Files

- **File Attachments:** Uploaded images and documents (birth certificates, student photos, employee credentials, support ticket attachments) are written to `public/uploads/` using unique cryptographic UUID filenames.
- **Database Storage:** The database records relative file paths in fields such as `Student.photoUrl`, `StudentDocument.fileUrl`, `EmployeeDocument.fileUrl`, and `SupportRequestAttachment.fileUrl`.
- **Database Backups:** Snapshot files are archived in `backups/` with metadata tracked in `SystemBackup`.

---

## 7. Database Functions & Triggers

- **SQLite Engine Note:** SQLite does not utilize stored procedures or triggers in this architecture.
- **Application-Level Enforcements:** All complex business rules, atomic multi-table postings, sequential numbering, and validation logic are implemented in TypeScript service engines:
  - `src/lib/feeCalculationService.ts`: Calculates fee structures, scholarships, discounts, and sequential refund vouchers.
  - `src/lib/operationsEngine.ts`: Manages database backups, pre-restore snapshots, and system health checks.
  - `src/lib/payment/PaymentExecutionService.ts`: Executes double-entry fund allocation and invoice reconciliation within `prisma.$transaction`.

---

## 8. Important Constraints & Data Integrity

1. **Write-Ahead Logging (WAL):** SQLite WAL mode allows concurrent readers without blocking writes, essential for concurrent portal access.
2. **Financial Non-Negative Balances:** Cash funds in `CashFund` enforce non-negative constraints.
3. **Frozen Document Snapshots:** `Certificate.snapshotJson` stores student demographic data at the time of issuance, ensuring retrospective verification remains unaffected by future profile edits.
4. **Idempotency Keys:** `PaymentReceipt.idempotencyKey` and `NotificationOutbox.idempotencyKey` prevent duplicate payment processing or duplicate notification dispatches.

---

## 9. Unknown / Unverified Information

1. **Remote Cloud Storage Replication:** The SQLite database is hosted locally on the server filesystem. Automated offsite replication to S3, Backblaze, or cloud buckets is unconfigured in the existing deployment files.
2. **Native Database Triggers:** No native SQLite database triggers were discovered; all transactional invariants are enforced at the Node.js application layer.
