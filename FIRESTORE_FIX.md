# Fix for "Missing or insufficient permissions" Error

## Problem
When users try to join a room, they get "Missing or insufficient permissions" error.

## Root Cause
Complex Firestore security rules that are too restrictive for room joining operations.

## Immediate Solution - Step 1 (Testing)
I've created **simplified permissive rules** for testing:

```javascript
// ROOMS - TEMPORARY PERMISSIVE RULES FOR TESTING
match /rooms/{roomId} {
  allow read, list, create, update: if request.auth != null;
  
  // MESSAGES
  match /messages/{messageId} {
    allow read, create: if request.auth != null;
    allow update, delete: if false;
  }
}
```

## Deploy Steps

### Option 1: Firebase CLI
```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore
```

### Option 2: Firebase Console
1. Go to Firebase Console → Firestore Database
2. Click "Rules" tab
3. Replace with content from `firestore.rules`
4. Click "Publish"

## Test After Deployment
1. Try joining a room with invite code
2. If it works, the issue was rule complexity
3. Then we can add back proper security rules

## Next Steps (After Testing)
Once confirmed working, we'll implement proper secure rules that:
- Allow invite code queries
- Secure room joining
- Prevent unauthorized access

## Why This Approach
- Simplifies debugging by removing rule complexity
- Isolates whether the issue is rules vs. code logic
- Temporary permissive rules for testing only
- Will be replaced with secure rules after testing
