# TODO: Remove Video Call Functionality

## Steps to Complete

- [x] Delete video call components: VideoCallButton.tsx, VideoCallModal.tsx, IncomingCallModal.tsx, ActiveCallBanner.tsx
- [x] Update ChatRoom.tsx: Remove video call imports, render blocks, props, and handlers
- [x] Update ChatWindow.tsx: Remove video call buttons, ActiveCallBanner, and related props
- [x] Update useChat.ts: Remove video call functions, activeCall state, WebRTC code, incomingCall state
- [x] Update types.ts: Remove activeCall property from Room interface
- [x] Update TODO.md: Remove video call related tasks (this file)
- [x] Test application: Ensure no video call features remain, no broken imports, chat functionality works
