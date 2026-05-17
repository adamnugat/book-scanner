## Why

Użytkownik chce, aby odtwarzacz audiobooka odtwarzał krótkie dźwięki (wstawki muzyczne) pomiędzy scenami — np. efekt przewracania strony — ale bez wyświetlania tych dźwięków jako osobnych pozycji na liście ścieżek. Trzy lokalne pliki audio (`page-turn-1.mp3`, `page-turn-2.wav`, `page-turn-3`) są dołączone do aplikacji jako zasoby lokalne w `apps/mobile/assets/audio/`. Pierwsze dwa to krótkie efekty dźwiękowe, trzeci to wstawka głosowa.

## What Changes

- Użytkownik może wybrać wstawkę muzyczną przy tworzeniu i edycji projektu z listy opcji zawierającej lokalne pliki `page-turn-1`, `page-turn-2` i `page-turn-3`.
- Każda opcja na liście wyświetla ikonę sugerującą typ: ikona dźwięku dla krótkich efektów (page-turn-1, page-turn-2) i ikona mikrofonu/głosu dla wstawki głosowej (page-turn-3).
- Odtwarzacz wstrzykuje wybrany lokalny dźwięk pomiędzy scenami podczas odtwarzania playlisty.
- Wstawki NIE są widoczne na liście scen w odtwarzaczu (ekran gracza filtruje już `type === 'scene'`).
- Wybór wstawki muzycznej jest przechowywany w projekcie (pole `interstitialPreset`).
- Lokalny dźwięk jest wstrzykiwany po stronie frontendu w kolejkę odtwarzania — bez zmian w backendzie ani schemacie playlisty.

**Non-goals:**
- Brak zmian w backendowych presetach wstawek (`InterstitialPreset` w bazie danych).
- Brak zmian w API ani kontraktach REST.
- Brak zmian w logice OCR/TTS, autoryzacji ani przechowywania plików.
- Brak zmian w logice offline cache dla wstawek (istniejąca ścieżka offline pomija wstawki).

## Capabilities

### New Capabilities

- `local-jingle-preset`: Lokalne pliki audio bundlowane w aplikacji jako presety wstawek muzycznych — identyfikowane po nazwie, odtwarzane bezpośrednio z zasobów aplikacji bez fetchowania z serwera.

### Modified Capabilities

- `audiobook-creation-wizard`: Ekran tworzenia projektu pokazuje teraz lokalnie dostępne presety wstawek zamiast (lub obok) presetów backendowych.

## Impact

- `apps/mobile`: Główne zmiany — ekran tworzenia projektu (`projects/new/index.tsx`), odtwarzacz (`projects/[id]/player.tsx`), nowy moduł z mapowaniem lokalnych plików audio.
- `apps/mobile/assets/audio/`: Zasoby już dodane.
- `packages/shared`: Brak zmian.
- `apps/api`: Brak zmian.
- Weryfikacja: `npm run test:mobile`, `npm run lint`.
