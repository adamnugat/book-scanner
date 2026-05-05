## Why

Po zakończonym OCR użytkownik nie może przejść do generowania audiobooka, ponieważ w aplikacji brakuje widocznej akcji uruchamiającej Text to Speech. Dodatkowo zakładka „Głos i audio” nie pokazuje dostępnych głosów ani pozycji audio mimo skonfigurowanego klucza ElevenLabs, co blokuje podstawowy przepływ od zdjęć książki do nagrania.

## What Changes

- Dodać użytkownikowi jasny sposób uruchomienia procesu Text to Speech po wykonanym OCR, gdy projekt lub sceny są gotowe do generowania audio.
- Zapewnić, że zakładka „Głos i audio” prezentuje dostępne głosy z backendu oraz sensowny stan pusty lub błąd, jeśli konfiguracja ElevenLabs jest niepoprawna.
- Po uruchomieniu TTS generować audio dla scen gotowych do syntezy, aktualizować statusy scen/projektu i odświeżać listę audio w aplikacji.
- Zachować istniejącą abstrakcję providerów TTS: mock w development/test oraz ElevenLabs po ustawieniu `TTS_PROVIDER=elevenlabs`.
- Nie zmieniać rozliczeń, limitów planów, udostępniania projektów, OCR, storage ani auth poza tym, co jest konieczne do przejścia z OCR do TTS.

## Capabilities

### New Capabilities

- `text-to-speech-generation`: Obsługa wyboru głosu, uruchamiania syntezy mowy po OCR oraz wyświetlania wygenerowanych pozycji audio.

### Modified Capabilities

- Brak.

## Impact

- `apps/api`: endpointy i logika TTS, integracja z providerem ElevenLabs, lista głosów, statusy scen/projektu, testy API.
- `apps/mobile`: ekran projektu po OCR, zakładka „Głos i audio”, akcja uruchomienia TTS, odświeżanie głosów i audio, testy komponentów/przepływu.
- `packages/shared`: ewentualne kontrakty request/response dla głosów, uruchamiania TTS i listy audio, jeśli obecne typy nie pokrywają przepływu.
- Weryfikacja powinna objąć testy backendu, testy mobile oraz lint/format dla zmienionych workspaces.
