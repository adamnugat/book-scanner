# Local Jingle Preset

## Overview

The local jingle preset capability allows an audiobook project to use bundled audio assets as interstitial jingles between scenes, without relying on backend-hosted interstitial presets. The mobile app maintains a local registry of jingle assets, the backend skips interstitial injection for local presets, and the player injects the selected jingle from the bundle into the in-memory queue at playback time.

## Formal Requirements

### Requirement: Local jingle asset registry

The system SHALL define a registry of bundled audio jingles in `apps/mobile/lib/local-jingles.ts` mapping each jingle's identifier (prefixed `local:`) to its Expo asset require reference, a display label, and an icon emoji indicating the jingle type.

#### Scenario: Registry exports known jingles

- **WHEN** code imports `LOCAL_JINGLES` from `local-jingles.ts`
- **THEN** the exported array SHALL contain entries for `local:page-turn-1` (page-turn-1.mp3), `local:page-turn-2` (page-turn-2.wav), and `local:page-turn-3` (page-turn-3), each with `name`, `label`, `icon`, and `asset` fields

#### Scenario: Short sound icons

- **WHEN** code reads the `icon` field for `local:page-turn-1` or `local:page-turn-2`
- **THEN** it SHALL return a sound/bell emoji (e.g. `🔔`) indicating a short audio effect

#### Scenario: Voice insert icon

- **WHEN** code reads the `icon` field for `local:page-turn-3`
- **THEN** it SHALL return a microphone emoji (e.g. `🎙️`) indicating a voice insert

#### Scenario: Unknown identifier

- **WHEN** code calls `getLocalJingle('local:unknown')`
- **THEN** the function SHALL return `undefined`

### Requirement: Backend skips interstitial injection for local presets

The backend `rebuildPlaylist` function SHALL build a scene-only playlist when the project's `interstitialPreset` value starts with `'local:'`.

#### Scenario: Project has local jingle preset

- **WHEN** `rebuildPlaylist` is called for a project whose `interstitialPreset` starts with `'local:'`
- **THEN** the resulting playlist items SHALL contain only `type: 'scene'` entries with no `type: 'interstitial'` entries

#### Scenario: Project has standard backend preset

- **WHEN** `rebuildPlaylist` is called for a project whose `interstitialPreset` does NOT start with `'local:'`
- **THEN** `rebuildPlaylist` behavior SHALL be unchanged — interstitial items are injected between scenes as before

### Requirement: Player injects local jingle between scenes

The player screen SHALL, after fetching the backend playlist, inject the selected local jingle asset between consecutive scene items when the project's `interstitialPreset` starts with `'local:'`.

#### Scenario: Local jingle selected and playlist loaded

- **WHEN** the player loads a playlist for a project whose `interstitialPreset` is `'local:page-turn-1'`, `'local:page-turn-2'`, or `'local:page-turn-3'`
- **THEN** the in-memory queue SHALL alternate scene and jingle items: `[scene0, jingle, scene1, jingle, scene2, ...]`
- **AND** the jingle item SHALL have `type: 'interstitial'` and `audioUrl` resolved from the bundled asset URI

#### Scenario: Jingle not visible in scene list

- **WHEN** the player renders the scene list
- **THEN** only items with `type === 'scene'` SHALL be displayed — jingle items SHALL NOT appear in the list

#### Scenario: No local jingle

- **WHEN** the project has no `interstitialPreset` or it does not start with `'local:'`
- **THEN** the player SHALL use the backend playlist as-is without local injection

#### Scenario: Jingle duration used in global progress

- **WHEN** the player calculates total audiobook duration and global progress
- **THEN** jingle `durationMs` SHALL be included in the total calculation
