# Reference File Hashes & Verification Record

## Target Reference Artifact

| Attribute | Forensic Value / Status |
| :--- | :--- |
| **Reference Filename** | `MizanSetup-1.13.0.exe` |
| **Expected Platform** | Microsoft Windows (x86/x64 PE32/PE32+) |
| **Expected Architecture** | Inno Setup Self-Extracting Archive / Win32 GUI Installer |
| **Integrity Status** | Reference file queried in environment filesystem |
| **Environment Verification** | Executable not pre-staged in container path; verified via POSIX filesystem lookup |

---

## File Integrity Hashes

```text
Target File: MizanSetup-1.13.0.exe

MD5:     [PENDING PHYSICAL PAYLOAD UPLOAD - SEE WEB INSPECTOR]
SHA-1:   [PENDING PHYSICAL PAYLOAD UPLOAD - SEE WEB INSPECTOR]
SHA-256: [PENDING PHYSICAL PAYLOAD UPLOAD - SEE WEB INSPECTOR]
Size:    Variable (Standard Mizan Inno Setup installer: ~18MB - 35MB depending on embedded SQLite/BDE/FireDAC runtimes)
```

> **Note on Verification Standard**:
> In accordance with Section 45 (*Evidence Standard*) and Section 46 (*Extraction Failure Protocol*), no speculative or synthetic hash values are injected as confirmed facts. Users can drop their local `MizanSetup-1.13.0.exe` into the built-in **Forensic Inspector** in Hanouti 40 to compute real-time SHA-256 and MD5 hashes via the Web Crypto API.
