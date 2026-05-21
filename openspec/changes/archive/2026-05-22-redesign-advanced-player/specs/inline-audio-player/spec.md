## MODIFIED Requirements

### Requirement: Odtwarzanie audio inline na ekranie szczegółów projektu
Ekran szczegółów projektu SHALL umożliwiać odtwarzanie audiobooka bez przechodzenia do osobnego ekranu odtwarzacza. Panel `AudioFlowPlayerPanel` MUST inicjować i sterować odtwarzaniem za pomocą hooka `useAudioPlayer`.

Dodatkowo: ten sam komponent `AudioFlowPlayerPanel` MUST być reużyty na ekranie zaawansowanego odtwarzacza (`projects/[id]/player.tsx`) z identycznym zestawem propsów (`progress`, `currentTime`, `totalTime`, `isPlaying`, `onPlayPress`, `onPreviousPress`, `onNextPress`, `onSkipBack`, `onSkipForward`), aby zapewnić spójność UX między obydwoma widokami.

#### Scenario: Pierwsze naciśnięcie play
- **WHEN** użytkownik naciśnie przycisk play na ekranie szczegółów projektu
- **THEN** system SHALL załadować playlist dla projektu, rozpocząć odtwarzanie pierwszego elementu i zmienić ikonę przycisku na ⏸

#### Scenario: Pauza odtwarzania
- **WHEN** użytkownik naciśnie przycisk odtwarzania podczas aktywnego odtwarzania
- **THEN** system SHALL wstrzymać odtwarzanie i zmienić ikonę przycisku na ▶

#### Scenario: Wznowienie odtwarzania
- **WHEN** użytkownik naciśnie przycisk odtwarzania podczas pauzy
- **THEN** system SHALL wznowić odtwarzanie od miejsca wstrzymania

#### Scenario: Spójność panelu między ekranem szczegółów a zaawansowanym odtwarzaczem
- **WHEN** użytkownik tapnie "Zaawansowany odtwarzacz" z ekranu szczegółów projektu
- **THEN** ekran zaawansowany SHALL renderować ten sam komponent `AudioFlowPlayerPanel` (import z `components/audioflow`) z tymi samymi propsami i identycznym wyglądem (paskiem postępu, kontrolkami transportu, przyciskami skip ±10s)
