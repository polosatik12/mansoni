
## Plan: Fix Video Circle Recording and Playback

### Problem Analysis

Two bugs identified:

**Bug 1: Send button not working**
The `VideoCircleRecorder` component uses `MediaRecorder` with `video/webm` as the only format option. On iOS Safari, `video/webm` is NOT supported. When `MediaRecorder` is created with an unsupported mimeType, it throws an error. This causes `startRecording()` to fail silently (no try-catch), so `isRecording` never becomes `true`, and the send button stays disabled (`disabled={!isRecording || recordingTime < 1}`).

Additionally, `handleVideoRecord` hardcodes the file type as `video/webm`, which needs to match the actual recorded format.

**Bug 2: Play button appears on second recording, no camera feed**
On iOS, setting `video.srcObject` doesn't always auto-play even with the `autoPlay` attribute. After the component remounts for a second recording, the browser shows a native play button instead of the live camera feed. Need to explicitly call `videoRef.current.play()` after assigning the stream.

---

### Technical Changes

#### File: `src/components/chat/VideoCircleRecorder.tsx`

1. **Fix MediaRecorder format for iOS** -- Add MP4/H.264 fallback:
   - Check `video/mp4` support before falling back
   - If no mimeType is supported, create MediaRecorder without specifying one (browser default)
   - Store the actual mimeType used for the Blob creation

2. **Fix camera autoplay on iOS** -- After setting `videoRef.current.srcObject`, explicitly call `videoRef.current.play().catch(...)` to ensure the video stream starts playing

3. **Add try-catch to `startRecording()`** -- Wrap MediaRecorder creation in try-catch to prevent silent failures and show a toast error

#### File: `src/components/chat/ChatConversation.tsx`

4. **Fix file type in `handleVideoRecord`** -- Accept the actual mimeType from the recorder callback instead of hardcoding `video/webm`. Update the `onRecord` callback signature to include the mimeType, or detect it from the blob.

---

### Summary of Changes

| File | Change |
|------|--------|
| `VideoCircleRecorder.tsx` | Add MP4/fallback mimeType detection, explicit `video.play()`, try-catch in startRecording |
| `ChatConversation.tsx` | Use blob's actual type for the File constructor instead of hardcoding webm |
