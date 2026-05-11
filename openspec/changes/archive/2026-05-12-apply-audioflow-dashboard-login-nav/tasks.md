## 1. Global Navigation (Header & Footer)

- [x] 1.1 Utwórz komponent `AudioFlowTopNavigation` w `apps/mobile/components/audioflow-global-navigation.tsx` (obsługa tytułu, przycisku wstecz, przycisku menu).
- [x] 1.2 Utwórz komponent `AudioFlowBottomNavigation` w `apps/mobile/components/audioflow-global-navigation.tsx` (obsługa zakładek: biblioteka, nowy projekt).
- [x] 1.3 Zaktualizuj `apps/mobile/app/(app)/_layout.tsx` aby używał nowych komponentów nawigacyjnych (zastąpienie natywnego headera i dodanie footera).
- [x] 1.4 Zaktualizuj logikę ukrywania/pokazywania headera w zależności od ekranu (np. ukrycie na ekranie logowania, zmiana wyglądu na dashboardzie).

## 2. Login Screen

- [x] 2.1 Przebuduj `apps/mobile/app/(auth)/login.tsx` (lub `index.tsx` jeśli to główny ekran auth) używając komponentów AudioFlow (tło, pola tekstowe, przyciski).
- [x] 2.2 Upewnij się, że walidacja i obsługa błędów działają poprawnie w nowym UI.
- [x] 2.3 Sprawdź brak regresji w nawigacji po udanym logowaniu.

## 3. Dashboard

- [x] 3.1 Przebuduj `apps/mobile/app/(app)/index.tsx` używając komponentów AudioFlow.
- [x] 3.2 Usuń stare komponenty filtrów i sortowania z widoku Dashboardu.
- [x] 3.3 Dodaj widżet "Ostatnio odtwarzane" na górze listy projektów z przyciskiem play i paskiem postępu.
- [x] 3.4 Podłącz widżet "Ostatnio odtwarzane" do danych z API (najnowszy projekt) i upewnij się, że przycisk play nawiguje do odtwarzacza.
- [x] 3.5 Zaktualizuj listę projektów, aby używała kart w stylu AudioFlow.
- [x] 3.6 Zaktualizuj puste i ładujące stany Dashboardu do stylu AudioFlow.

## 4. Project Details

- [x] 4.1 Przebuduj `apps/mobile/app/(app)/projects/[id]/index.tsx` używając komponentów AudioFlow.
- [x] 4.2 Zaimplementuj górny kontener z odtwarzaczem audio (hero-player) lub panel "next-step" w zależności od stanu projektu.
- [x] 4.3 Zaktualizuj siatkę narzędzi projektu (zdjęcia, OCR, TTS, udostępnianie) do stylu AudioFlow (glass grid).
- [x] 4.4 Przenieś akcje zarządzania projektem (edycja, usuwanie) do menu kontekstowego (dostępnego z górnej nawigacji).
- [x] 4.5 Zweryfikuj, że wszystkie akcje (nawigacja do narzędzi, usuwanie) działają bez regresji.

## 5. Verification & Tests

- [x] 5.1 Uruchom `npm run lint` i popraw ewentualne błędy.
- [x] 5.2 Uruchom `npm run test:mobile` aby zweryfikować brak regresji w testach jednostkowych.
- [x] 5.3 Zaktualizuj lub dodaj nowe testy snapshotowe/komponentowe dla nowych widoków (jeśli dotyczy).
