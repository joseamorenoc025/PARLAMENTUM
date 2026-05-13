# CHANGELOG

## [Unreleased]

### feat(backup): implement encrypted backup and restore flow
- Added `electron/src/lib/cryptoUtils.js` for AES-256-GCM encryption/decryption.
- Added `electron/src/ipc/backup.handlers.js` with `backup:validateAndRestore` and `db:backup:encrypted` IPC handlers.
- Updated `dbManager` in `electron/src/db/index.js` to support clean shutdowns before database restoration.
- Created `src/components/onboarding/BackupRestoreStep.jsx` for the user interface.
- Integrated the restore flow into `src/components/onboarding/OnboardingWizard.jsx`.
- Replaced "Skip setup" with "Restore from backup" in the onboarding welcome screen.
- Added automatic backup of the current database before any restoration.
- Created `docs/BACKUP_RESTORE_GUIDE.md` for end-user guidance.
