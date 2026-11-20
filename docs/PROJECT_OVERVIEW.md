# Project Overview

Battery Rush is a kiosk motion game in which a player charges a virtual battery by running in place in front of Kinect for Windows V1. React owns session state, Phaser renders the battery, and a local C# bridge forwards Kinect SDK 1.8 skeleton coordinates over WebSocket.

## Gameplay

Connect the bridge, stand fully in view for the 2-second calibration, start the countdown, and alternate left/right knee lifts. Each detected left-up/right-up/left-down cycle adds 2% toward 100%. Initial detector defaults are 10 cm knee lift and 250 ms minimum cycle separation; they are experimental and configurable in `RunningDetector`.

## Hardware

Kinect for Windows V1 with correct power adapter, Kinect SDK/Runtime 1.8, Windows PC, .NET Framework 4.8, and browser on the same machine. Webcam/MediaPipe remains a separate existing fallback. Kinect Windows 11 and browser-to-bridge behavior remain unverified until tested on hardware.
