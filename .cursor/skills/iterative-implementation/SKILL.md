---
name: iterative-implementation
description: Prowadzi iteracyjne wdrożenie specyfikacji MVP aplikacji audiobookowej z pliku spec.md. Definiuje 13 iteracji od pustego repo do kompletnego MVP, z kryteriami akceptacji i testami dla każdej. Wymusza rozdzielenie agenta implementującego od agenta walidującego. Użyj, gdy użytkownik chce wdrożyć kolejną iterację planu, sprawdzić postęp, uruchomić walidację lub zapytać o kryteria akceptacji danego etapu.
---

# Iterative Implementation – Audiobook MVP

## Cel

Ten skill jest mapą drogową wdrożenia `spec.md`. Opisuje 13 iteracji (0–12), które prowadzą od pustego repozytorium do kompletnego MVP aplikacji audiobookowej (web + iOS + Android).

## Kiedy używać

- Użytkownik prosi o wdrożenie kolejnej iteracji
- Użytkownik pyta o status, zakres lub kryteria akceptacji danego etapu
- Użytkownik chce uruchomić walidację ukończonej iteracji
- Użytkownik prosi o przegląd postępu lub plan dalszych prac

## Plan iteracji

Pełny plan z kryteriami akceptacji i testami: [plan.md](plan.md)

## Zasady pracy

### 1. Rozdzielenie ról

Wdrożenie wymaga dwóch osobnych agentów:

- **Agent implementujący** – pisze kod, tworzy pliki, instaluje zależności, konfiguruje infrastrukturę. Używaj `subagent_type: "generalPurpose"` lub `"best-of-n-runner"`.
- **Agent walidujący** – sprawdza kryteria akceptacji, uruchamia testy, weryfikuje poprawność. Używaj `subagent_type: "generalPurpose"` w trybie readonly lub `subagent_type: "shell"` do uruchamiania testów.

Nigdy nie waliduj własnej pracy tym samym agentem, który ją wykonał. Po zakończeniu implementacji iteracji, uruchom osobnego agenta walidującego.

### 2. Kolejność iteracji

Iteracje muszą być realizowane po kolei. Każda bazuje na rezultatach poprzedniej:

```
I-0  Scaffold → I-1  Auth → I-2  Projekty → I-3  Zdjęcia →
I-4  OCR → I-5  Edycja scen → I-6  TTS → I-7  Player →
I-8  Sharing/QR → I-9  Cennik → I-10 Offline → I-11 Web polish → I-12 Hardening
```

### 3. Workflow jednej iteracji

Dla każdej iteracji wykonaj:

1. **Przeczytaj plan.md** – sekcję odpowiadającą bieżącej iteracji
2. **Sprawdź stan repo** – upewnij się, że poprzednia iteracja jest zakończona i zwalidowana
3. **Implementuj** – używając agenta implementującego, realizuj cele iteracji
4. **Waliduj** – używając osobnego agenta walidującego, zweryfikuj kryteria akceptacji i uruchom testy
5. **Udokumentuj** – zaktualizuj status iteracji w pliku `progress.md` w katalogu głównym projektu

### 4. Dokumentowanie postępu

Po każdej iteracji aktualizuj plik `progress.md`:

```markdown
## Iteracja N: [Nazwa]
- Status: ✅ ukończona / 🔄 w toku / ❌ zablokowana
- Data rozpoczęcia: YYYY-MM-DD
- Data zakończenia: YYYY-MM-DD
- Walidacja: ✅ przeszła / ❌ wymaga poprawek
- Uwagi: [opcjonalne notatki]
```

### 5. Raportowanie walidacji

Agent walidujący zwraca raport w formacie:

```markdown
## Raport walidacji – Iteracja N

### Kryteria akceptacji
- [x] Kryterium 1 – PASS
- [ ] Kryterium 2 – FAIL: [powód]

### Testy
- [x] Test 1 – PASS
- [ ] Test 2 – FAIL: [opis błędu]

### Podsumowanie
[Ocena ogólna, lista blokerów do naprawienia]
```

### 6. Obsługa niepowodzeń

Jeśli walidacja wykaże błędy:
1. Wróć do agenta implementującego z listą konkretnych problemów
2. Agent implementujący naprawia tylko wskazane problemy
3. Ponowna walidacja (agent walidujący)
4. Powtarzaj aż wszystkie kryteria przejdą

### 7. Bez kodu w dokumentacji

Plik `progress.md` i raporty walidacji opisują co działa, nie jak jest zaimplementowane. Dokumentuj decyzje, status i wyniki – nie fragmenty kodu.

## Szybki start

Aby rozpocząć implementację od iteracji 0:

> Przeczytaj plan.md, sekcję Iteracji 0. Zaimplementuj wszystkie cele tej iteracji, a następnie uruchom osobnego agenta do walidacji kryteriów akceptacji.

Aby kontynuować od konkretnej iteracji:

> Przeczytaj progress.md, sprawdź ostatnią ukończoną iterację. Przejdź do następnej iteracji w plan.md i zaimplementuj ją.
