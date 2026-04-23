# Security Specification - Ṣe Ṣe Wá

## Data Invariants
1. A **User** profile must belong to the authenticated user (`uid` matches `request.auth.uid`).
2. A **Handyman** profile can only be created by an admin or the user themselves (if linked by `userId`).
3. A **JobRequest** must have a `userUid` that matches the sender.
4. **Chat** participation is restricted to users in the `participants` array.
5. **Messages** can only be sent by a participant of the parent chat.
6. **Notifications** are private to the `userId`.
7. **Disputes** must be raised by the user who was part of the original job.

## The "Dirty Dozen" Payloads (Red Team Tests)

### Payload 1: Identity Spoofing (User Profile)
- **Action:** `create` on `/users/victim_uid`
- **Data:** `{ "uid": "victim_uid", "email": "attacker@evil.com", "role": "admin" }`
- **Expected:** `PERMISSION_DENIED` (UID mismatch)

### Payload 2: Privilege Escalation (Role Change)
- **Action:** `update` on `/users/my_uid`
- **Data:** `{ "role": "admin" }`
- **Expected:** `PERMISSION_DENIED` (Role field immutable for non-admins)

### Payload 3: Orphaned Job Request
- **Action:** `create` on `/jobRequests/job1`
- **Data:** `{ "id": "job1", "proId": "non_existent_pro", "userUid": "my_uid", "status": "pending" }`
- **Expected:** `PERMISSION_DENIED` (Pro must exist)

### Payload 4: Unauthorized Chat Access
- **Action:** `get` on `/chats/private_chat`
- **Data:** N/A (User not in `participants`)
- **Expected:** `PERMISSION_DENIED`

### Payload 5: Spoofed Message Sender
- **Action:** `create` on `/chats/chat1/messages/msg1`
- **Data:** `{ "id": "msg1", "chatId": "chat1", "senderId": "victim_uid", "text": "spam" }`
- **Expected:** `PERMISSION_DENIED` (Sender ID mismatch)

### Payload 6: Resource Poisoning (ID Size)
- **Action:** `create` on `/notifications/[1MB_STRING_ID]`
- **Data:** `{ ... }`
- **Expected:** `PERMISSION_DENIED` (ID too long)

### Payload 7: Shadow Update (Ghost Fields)
- **Action:** `update` on `/handymen/pro1`
- **Data:** `{ "verified": true, "ghost_field": "injected" }`
- **Expected:** `PERMISSION_DENIED` (Extra field not allowed)

### Payload 8: Illegal Status Jump
- **Action:** `update` on `/jobRequests/job1`
- **Data:** `{ "status": "completed" }` (Current status is `cancelled`)
- **Expected:** `PERMISSION_DENIED` (Terminal state lock)

### Payload 9: PII Leak (User Search)
- **Action:** `list` on `/users`
- **Data:** `where("email", "==", "victim@secret.com")`
- **Expected:** `PERMISSION_DENIED` (Blanket reads/list forbidden for PII)

### Payload 10: Unauthorized Dispute Resolution
- **Action:** `update` on `/disputes/disp1`
- **Data:** `{ "status": "resolved" }` (User is not admin)
- **Expected:** `PERMISSION_DENIED`

### Payload 11: Malicious Array Growth
- **Action:** `update` on `/jobRequests/job1`
- **Data:** `{ "unlockedBy": ["huge_array_of_10000_uids..."] }`
- **Expected:** `PERMISSION_DENIED` (Array size limit exceeded)

### Payload 12: Client-Side Timestamp Spoofing
- **Action:** `create` on `/notifications/notif1`
- **Data:** `{ "createdAt": "2000-01-01T00:00:00Z" }`
- **Expected:** `PERMISSION_DENIED` (Must use server timestamp)
