# TODO: Remove Video Call Functionality

## Steps to Complete

- [x] Delete video call component files: VideoCallButton.tsx, VideoCallModal.tsx, IncomingCallModal.tsx, ActiveCallBanner.tsx
- [x] Remove video call code from useChat.ts: remove startVideoCall, joinVideoCall, leaveVideoCall functions, incomingCall state, peerConnection, localStream, remoteStream, and related socket listeners
- [x] Update types.ts: remove activeCall from Room interface
- [x] Update ChatRoom.tsx: remove VideoCallModal, IncomingCallModal imports and usage, remove onStartVideoCall, onJoinVideoCall props and handlers, remove isUserInCall logic
- [x] Update ChatWindow.tsx: remove ActiveCallBanner import and usage, remove onStartVideoCall, onJoinVideoCall props, remove video call button and banner rendering
- [x] Update TODO.md: mark video call removal as complete after verification

## Followup Steps
- [x] Run the app (`npm run dev`) to verify no errors after removal
- [x] Test chat functionality to ensure no regressions
