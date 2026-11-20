# AGENTS.md
# Battery Rush — AI Agent Development Guidelines

## 1. PROJECT IDENTITY

Project Name: Battery Rush

Project Type: Browser-based Motion Sensing Game

Primary Goal:
Develop an interactive kiosk game where players charge a virtual battery by running in place in front of a Kinect sensor.

Current Hardware:
- Kinect for Windows V1
- Windows 11

Frontend Technology:
- React
- TypeScript
- Vite
- Phaser 3
- Tailwind CSS

Sensor Technology:
- Microsoft Kinect SDK 1.8
- C#
- .NET Framework 4.8
- Kinect Skeleton Tracking

Communication:
- Local WebSocket
- JSON data transfer

The game must work without a webcam or MediaPipe when using Kinect mode.

---

## 2. GAMEPLAY CONCEPT

Battery Rush is a motion-based kiosk game.

Main gameplay flow:

1. Player opens Battery Rush.
2. Game checks Kinect connection.
3. Game detects the player's full body.
4. Player completes body calibration.
5. Countdown begins.
6. Player runs in place.
7. Kinect detects alternating left and right leg movements.
8. Every valid running cycle increases battery charge.
9. Battery reaches 100%.
10. Game displays completion screen and score.

Initial gameplay configuration:

- Battery target: 100%.
- Initial charge per valid running cycle: 2%.
- Calibration duration: 2 seconds.
- Initial knee lift threshold: 10 cm.
- Initial minimum cycle interval: 250 ms.

IMPORTANT:
These values are experimental defaults, not final calibrated values.

All gameplay parameters should be configurable.

---

## 3. CURRENT PROJECT STATUS

### Verified

- React/Vite/TypeScript/Phaser project exists.
- Existing webcam and MediaPipe implementation exists.
- Hand Wave Detector exists.
- Kinect for Windows V1 has been identified.
- Windows 11 recognizes the Kinect device.
- Kinect SDK 1.8 and Developer Toolkit 1.8 are installed.
- Skeleton Basics sample runs successfully.
- Full-body skeleton tracking works.
- Left leg movement is detected.
- Right leg movement is detected.
- Skeleton tracking was reported stable during initial testing.

### Not Yet Verified

- Kinect Bridge compilation.
- Kinect Bridge runtime on Windows 11.
- WebSocket communication.
- Browser connection to Kinect Bridge.
- RunningDetector implementation.
- Battery charging using Kinect.
- Complete Battery Rush Kinect gameplay.

NEVER claim an unverified feature is working.

---

## 4. REQUIRED ARCHITECTURE

Use the following architecture:

Kinect V1
    |
    v
Kinect SDK 1.8
    |
    v
C# Kinect Bridge
    |
    v
Local WebSocket
    |
    v
React + TypeScript
    |
    v
KinectSensor
    |
    v
RunningDetector
    |
    v
Game Controller
    |
    v
Phaser Battery Scene

Responsibilities:

### Kinect Bridge

- Initialize Kinect V1.
- Read SkeletonFrame.
- Identify tracked skeleton.
- Read HipCenter.
- Read KneeLeft and KneeRight.
- Read AnkleLeft and AnkleRight.
- Send skeleton data through WebSocket.
- Handle sensor disconnection.
- Release sensor resources properly.

### Frontend

- Connect to Kinect Bridge.
- Receive skeleton data.
- Validate tracking state.
- Process running movements.
- Generate normalized motion events.
- Update battery progress.
- Display sensor connection status.

### Phaser

- Render battery progress.
- Handle charging animations.
- Display game effects.
- Display completion state.

React and Phaser must not create conflicting sources of truth for game state.

---

## 5. SENSOR DATA CONTRACT

Expected WebSocket endpoint:

ws://127.0.0.1:8181/kinect

Example message:

{
  "type": "skeleton-frame",
  "tracking": true,
  "frame": 100,
  "timestamp": 123456789,
  "joints": {
    "hipCenter": {
      "x": 0.02,
      "y": 1.05,
      "z": 2.10,
      "state": "tracked"
    },
    "kneeLeft": {
      "x": -0.12,
      "y": 0.65,
      "z": 2.12,
      "state": "tracked"
    },
    "kneeRight": {
      "x": 0.13,
      "y": 0.72,
      "z": 2.11,
      "state": "tracked"
    }
  }
}

This is an example schema, not measured sensor data.

Maintain compatibility between the C# JSON contract and TypeScript interfaces.

Do not silently rename fields on either side.

---

## 6. RUNNING DETECTOR RULES

RunningDetector must detect alternating leg movements.

Expected sequence:

LEFT LEG UP
    |
RIGHT LEG DOWN
    |
RIGHT LEG UP
    |
LEFT LEG DOWN
    |
VALID RUNNING CYCLE

Requirements:

- Use relative knee position against HipCenter.
- Validate joint tracking state.
- Ignore NotTracked and unreliable joint data.
- Use configurable knee lift thresholds.
- Use minimum movement interval.
- Implement cooldown/debounce.
- Prevent repeated charging from a single held position.
- Prevent false positives caused by skeleton jitter.
- Handle temporary tracking loss.
- Reset detection state when calibration is restarted.

Each valid cycle generates one normalized event:

{
  "type": "run-cycle",
  "timestamp": 123456789,
  "confidence": 0.95
}

The confidence field must be based on an actual defined calculation, not a fabricated constant.

Do not charge the battery directly inside the low-level Kinect tracking callback.

Use a dedicated detector and game controller.

---

## 7. DOCUMENTATION RULES

Documentation is part of the development process.

Every meaningful implementation change must update relevant documentation.

Maintain these files:

### README.md
Contains:
- Project introduction.
- Installation instructions.
- Development commands.
- Main technologies.
- Basic project usage.

### docs/PROJECT_OVERVIEW.md
Contains:
- Game concept.
- Gameplay mechanics.
- Main features.
- Hardware requirements.

### docs/ARCHITECTURE.md
Contains:
- Frontend architecture.
- Kinect Bridge architecture.
- WebSocket communication.
- Sensor-to-game data flow.

### docs/KINECT_SETUP.md
Contains:
- Kinect V1 installation.
- SDK 1.8 installation.
- Runtime requirements.
- Driver verification.
- Windows 11 compatibility notes.
- Skeleton Basics testing procedure.

### docs/KINECT_BRIDGE.md
Contains:
- C# project setup.
- .NET Framework version.
- Kinect SDK references.
- Build instructions.
- Run instructions.
- WebSocket endpoint.
- JSON contract.
- Common errors.

### docs/RUNNING_DETECTOR.md
Contains:
- Running detection algorithm.
- Knee movement calculations.
- Calibration procedure.
- Threshold configuration.
- False-positive prevention.
- Testing scenarios.

### docs/TROUBLESHOOTING.md
Contains:
- Error description.
- Symptoms.
- Root cause.
- Diagnostic procedure.
- Solution.
- Verification result.

### docs/TESTING.md
Contains:
- Manual test scenarios.
- Expected results.
- Actual results.
- Test environment.
- Known limitations.

### docs/CHANGELOG.md
Record meaningful changes chronologically.

Each entry must include:
- Date.
- Modified files.
- Summary.
- Reason.
- Verification status.

---

## 8. MANDATORY TROUBLESHOOTING PROCEDURE

Whenever an error occurs:

STEP 1 — IDENTIFY

Read the complete error message.

Identify:
- Error source.
- Affected component.
- File and line number.
- Environment.
- Reproduction steps.

STEP 2 — INVESTIGATE

Inspect relevant source code and configuration.

Check:
- Dependencies.
- Package versions.
- SDK references.
- Driver status.
- WebSocket connectivity.
- Data format.
- Runtime logs.

Do not guess the root cause.

STEP 3 — REPRODUCE

Try to reproduce the issue before modifying code.

Determine whether the problem belongs to:

- Hardware.
- Kinect driver.
- Kinect SDK.
- C# Bridge.
- WebSocket.
- TypeScript.
- React.
- Phaser.
- Game logic.

STEP 4 — FIX

Implement the smallest reliable fix.

Rules:
- Preserve existing functionality.
- Avoid unnecessary refactoring.
- Do not remove working features.
- Do not change unrelated UI.
- Do not install unnecessary dependencies.
- Do not disable Windows security features as a first solution.

STEP 5 — VERIFY

Run relevant tests.

Examples:

Frontend:
npm run build
npm run lint

C#:
Build Solution
Run KinectBridge.exe

Integration:
- Connect to WebSocket.
- Confirm skeleton frames.
- Validate joint coordinates.
- Test left/right movement.
- Confirm run-cycle events.
- Confirm battery progress.

Only mark the issue resolved after successful verification.

STEP 6 — DOCUMENT

Update:
- TROUBLESHOOTING.md
- CHANGELOG.md
- Relevant technical documentation.

Include the actual root cause and tested solution.

---

## 9. ERROR HANDLING

### Kinect not detected

Check:
- USB connection.
- Kinect power adapter.
- Kinect Runtime 1.8.
- Device Manager.
- Kinect sensor status.

### Skeleton tracking unavailable

Check:
- Kinect sensor initialization.
- SkeletonStream.Enable().
- SkeletonFrameReady event.
- TrackingState.
- Sensor positioning.
- Lighting and physical environment.

### WebSocket connection failed

Check:
- Bridge process is running.
- Port 8181 is available.
- Endpoint path is correct.
- Browser uses the correct WebSocket URL.
- HttpListener permissions.
- Client/server connection logs.

### No running events

Check:
- Skeleton frames are received.
- KneeLeft and KneeRight are tracked.
- HipCenter is tracked.
- Coordinate units are correct.
- Calibration is valid.
- Threshold values are appropriate.
- Alternating movement logic is working.

### Battery does not increase

Check:
- RunningDetector emits run-cycle.
- Game controller receives the event.
- Charge configuration is valid.
- Game state is active.
- Battery is not already full.

---

## 10. CODE QUALITY RULES

- Use TypeScript strict typing.
- Avoid unnecessary any types.
- Keep sensor communication separate from game logic.
- Keep Kinect SDK dependencies inside C# Bridge.
- Do not import Kinect SDK into browser code.
- Avoid duplicate event listeners.
- Dispose WebSocket and Kinect resources correctly.
- Handle sensor disconnection gracefully.
- Avoid unnecessary React re-renders from raw skeleton frames.
- Use configurable thresholds.
- Keep code modular and maintainable.

---

## 11. PROJECT CHANGE MANAGEMENT

Before implementing a feature:

1. Inspect the current repository.
2. Read this AGENTS.md.
3. Read relevant documentation.
4. Identify existing implementation.
5. Identify affected files.
6. Explain the proposed changes.
7. Implement incrementally.
8. Run tests.
9. Update documentation.

Never assume the planned folder structure already exists.

Inspect actual files before editing.

Do not overwrite existing implementations without understanding their behavior.

Do not delete the existing webcam implementation unless explicitly requested.

Kinect mode is the primary gameplay target, but preserve existing functionality unless a migration is explicitly approved.

---

## 12. DEFINITION OF DONE

A feature is considered complete only when:

- Implementation exists.
- Code compiles.
- Relevant tests pass.
- Integration is verified where applicable.
- Error handling is implemented.
- Documentation is updated.
- Known limitations are recorded.

If hardware testing is unavailable, explicitly mark the feature as:

NOT HARDWARE VERIFIED.

---

## 13. FINAL INSTRUCTIONS TO AI AGENT

Act as a senior software engineer responsible for Battery Rush.

Prioritize:
1. Stability.
2. Hardware compatibility.
3. Correct sensor data.
4. Reliable motion detection.
5. Maintainable architecture.
6. Clear documentation.
7. Preserving existing functionality.

When encountering an error, investigate before changing code.

When making a change, explain what changed and why.

When a feature is not tested, say so clearly.

Never invent successful test results.

Always maintain project documentation as the codebase evolves.