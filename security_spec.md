# Security Specification - Ṣe Ṣe Wá

## Data Invariants
1. A **Handyman** profile must be linked to a valid authenticated user (`userId`).
2. A **JobRequest** must have a valid `proId` and `userUid`.
3. **Escrow Payments** can only be released by the `userUid` (client) or an admin.
4. **Chat Messages** can only be read/written by participants of the chat.
5. **Private User Data** (PII) must be restricted to the owner.

## The "Dirty Dozen" Payloads (Attack Vectors)

1. **Identity Spoofing**: Attempt to create a Handyman profile with a `userId` different from the authenticated user.
2. **Review Bombing**: Attempt to create a review using another user's ID.
3. **Escrow Theft**: Attempt to release payment for a job request where the attacker is not the client.
4. **PII Leak**: Attempt to read the `users` collection document for another user.
5. **Job Hijacking**: Attempt to update the status of a job request assigned to someone else.
6. **Chat Snooping**: Attempt to read messages in a `chatId` where the user is not a participant.
7. **System Field Injection**: Attempt to set `verified: true` or `ninVerified: true` on a handyman profile via the client SDK.
8. **Resource Exhaustion**: Attempt to write a 1MB string into a `description` field.
9. **Ghost Message**: Attempt to send a message into a chat as a different `senderId`.
10. **State Skipping**: Attempt to move a job request from `pending` directly to `completed` without the intermediate steps/signatures.
11. **Admin Escalation**: Attempt to set `role: "admin"` on own user profile.
12. **Orphaned Writes**: Attempt to create a job request for a `proId` that doesn't exist.

## Test Strategy
All the above payloads MUST return `PERMISSION_DENIED`.
Detailed tests will be implemented in `firestore.rules.test.ts`.
