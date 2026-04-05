# Fix for "Missing or insufficient permissions" Error

## Problem
When users try to join a room, they get "Missing or insufficient permissions" error.

## Root Cause
1. Firestore security rules don't allow querying rooms by `inviteCode` for non-participants
2. Missing Firestore index for `inviteCode` queries

## Solution Steps

### 1. Deploy Updated Firestore Rules
The updated `firestore.rules` file now includes:
- `allow list` permission for querying rooms by inviteCode
- Proper security constraints for join operations

### 2. Deploy Updated Indexes
The updated `firestore.indexes.json` now includes:
- Index for querying `rooms` collection by `inviteCode` and `allowJoin`

### 3. Manual Deployment (if Firebase CLI not available)

#### Option A: Install Firebase CLI
```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore
```

#### Option B: Firebase Console
1. Go to Firebase Console → Firestore Database
2. Click "Rules" tab
3. Replace existing rules with content from `firestore.rules`
4. Click "Publish"
5. Go to "Indexes" tab
6. Click "Add index" and create:
   - Collection: `rooms`
   - Fields: `inviteCode` (Ascending), `allowJoin` (Ascending)

## Verification
After deploying:
1. Try joining a room with an invite code
2. The error should be resolved
3. Users can now successfully join rooms

## Technical Details
- The `allow list` rule permits authenticated users to query rooms by inviteCode
- The index ensures efficient querying and prevents permission errors
- Security is maintained with proper constraints on the query parameters
