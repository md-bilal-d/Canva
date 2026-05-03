/**
 * RecordingService.js
 * Logic for capturing and replaying canvas sessions.
 */

export default class RecordingService {
  constructor() {
    this.frames = [];
    this.isRecording = false;
    this.startTime = 0;
  }

  start() {
    this.frames = [];
    this.isRecording = true;
    this.startTime = Date.now();
    console.log("[REC] Recording started");
  }

  stop() {
    this.isRecording = false;
    const duration = Date.now() - this.startTime;
    console.log(`[REC] Recording stopped. Captured ${this.frames.length} frames over ${duration}ms`);
    return {
        duration,
        frames: this.frames,
        capturedAt: new Date().toISOString()
    };
  }

  capture(viewport, shapes, stickyNotes) {
    if (!this.isRecording) return;

    // We only capture a diff or a subset to save space
    // For now, let's just capture everything for simplicity
    this.frames.push({
      t: Date.now() - this.startTime,
      v: { ...viewport },
      s: JSON.parse(JSON.stringify(shapes)),
      n: JSON.parse(JSON.stringify(stickyNotes))
    });
  }

  /**
   * Downloads the recording as a JSON file.
   */
  download(recording) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(recording));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `canvas_replay_${Date.now()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }
}
