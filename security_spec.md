# Firestore Security Specification

## 1. Data Invariants
- `/publicConfig/{configId}` is readable by all app clients so customers and Checkout see the current owner-configured package prices and module visibility, but NEVER contains PII, bank details, or PINs. Only a verified admin (`email == 'adhanom3@gmail.com' && email_verified == true` or doc in `/admins/{uid}`) can create or update it, with strict schema/size/type validation and server-enforced `request.time` timestamps.
- `/ownerSecrets/{secretId}` contains PII (`email`, `phoneOrVipps`, `bankAccount`, `payoutEmail`) and the owner `pin`. Only a verified admin matching `ownerUid == request.auth.uid` can read or write it.
- `/payouts/{payoutId}` and `/transactions/{txId}` are strictly admin-only and immutable once created.
- `/activeRooms/{roomCode}` holds non-PII active arrangement room codes (`roomCode` matching `^[A-Z0-9]{3,16}$`, display `hostName`, `activeGame`, `calledBallNumbers` <= 75 ints, `expiresAtMs`). Anyone knowing the exact `roomCode` may perform a single-document `get`, `list` is permanently denied (`false`), and only a verified admin (`isAdmin()`) matching `ownerUid == request.auth.uid` can create, update, or delete.
- All document IDs (`configId`, `secretId`, `userId`, `payoutId`, `txId`) must match `^[a-zA-Z0-9_\-]+$` and be `<= 128` chars.
- No collection allows blanket `list` without `resource.data.ownerUid == request.auth.uid` (except `publicConfig` if needed, though `publicConfig/app` and `activeRooms/{roomCode}` use single-doc `get` directly).

## 2. Adversarial "Dirty Dozen" Payloads (All Must Return PERMISSION_DENIED)
1. Unauthenticated write to `/publicConfig/app` -> DENIED.
2. Signed-in non-admin user (`other@gmail.com`, `email_verified: true`) updating `price1Hour` in `/publicConfig/app` -> DENIED.
3. Unverified email spoof (`adhanom3@gmail.com`, `email_verified: false`) writing `/publicConfig/app` -> DENIED.
4. Unauthenticated or non-admin `get` on `/ownerSecrets/settings` -> DENIED.
5. Admin shadow-field injection (`{ ..., isSuperAdmin: true }`) on `/publicConfig/app` -> DENIED.
6. Type/size poisoning (`appTitle` > 100 chars or negative `price1Hour: -50`) on `/publicConfig/app` -> DENIED.
7. ID poisoning (`secretId` > 128 chars or containing spaces/slashes) -> DENIED.
8. Client-forged `createdAt` or `updatedAt` timestamp not equal to `request.time` -> DENIED.
9. Immutable field mutation (`ownerUid` changed during `/ownerSecrets/settings` or `/activeRooms/{roomCode}` update) -> DENIED.
10. Blanket `list` query on `/ownerSecrets` or `/activeRooms` -> DENIED by rule constraint.
11. Modifying a completed `/payouts/{payoutId}` record -> DENIED.
12. Creating a `/transactions/{txId}` or `/activeRooms/{roomCode}` record with spoofed `ownerUid` != `request.auth.uid` -> DENIED.
13. Unauthenticated or non-admin create/delete on `/activeRooms/{roomCode}` or oversized `calledBallNumbers` (> 75) -> DENIED.
