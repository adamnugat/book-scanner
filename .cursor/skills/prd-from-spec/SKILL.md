---
name: prd-from-spec
description: Tworzy profesjonalny PRD po polsku na podstawie pliku specyfikacji i pliku z promptem PRD, prowadząc ustrukturyzowaną rozmowę wieloetapową. Użyj, gdy użytkownik chce zamienić `spec.md`, `prd-prompt.md` lub podobne materiały w kompletny Product Requirements Document.
---

# PRD From Spec

## Cel

Ten skill służy do przekształcania roboczej specyfikacji produktu w profesjonalny PRD.

Domyślny tryb pracy:
- końcowy dokument powstaje po polsku
- praca jest interaktywna, nie jednoprzebiegowa
- `spec.md` jest punktem startu, a nie dowodem na kompletność wymagań
- `prd-prompt.md` wyznacza rygor pytań, poziom jakości i strukturę końcowego dokumentu

## Kiedy używać

Użyj tego skilla, gdy użytkownik:
- chce stworzyć PRD na podstawie istniejącej specyfikacji
- podaje `spec.md`, `prd-prompt.md` lub podobne pliki wejściowe
- prosi o "profesjonalne PRD", "product requirements document", "sformalizowanie wymagań" albo "zamianę specyfikacji w PRD"

Nie używaj tego skilla, jeśli użytkownik chce tylko krótkie streszczenie specyfikacji albo jednorazowy rewrite bez rozmowy i walidacji.

## Obowiązkowe wejścia

Przed rozpoczęciem:
1. Odczytaj plik ze specyfikacją produktu, zwykle `spec.md`
2. Odczytaj plik z promptem lub standardem PRD, zwykle `prd-prompt.md`
3. Jeśli któryś z plików nie istnieje albo nie został wskazany, poproś użytkownika o brakujący materiał

## Zasady pracy

1. Nie traktuj `spec.md` jako kompletnego PRD.
2. Nie dopisuj bezpodstawnie danych o rynku, ROI, budżecie, wolumenie użytkowników ani metrykach bazowych.
3. Każde twierdzenie zaklasyfikuj jako jedno z:
   - `potwierdzone w specyfikacji`
   - `rozsądny wniosek`
   - `założenie do potwierdzenia`
   - `otwarte pytanie`
4. Jeśli informacja biznesowa lub strategiczna nie wynika z materiału, zatrzymaj się i dopytaj.
5. Każdą funkcję połącz z:
   - potrzebą użytkownika
   - scenariuszem użycia
   - metryką biznesową lub produkową
6. Jeśli taki łańcuch nie istnieje, oznacz lukę zamiast ją maskować.

## Tryb interaktywny

Nie generuj od razu całego PRD.

Najpierw:
1. Wyciągnij z `spec.md` fakty, decyzje, zakres MVP, wymagania niefunkcjonalne, model domenowy i główny flow
2. Wypisz, czego nadal brakuje do pełnego PRD
3. Rozpocznij rozmowę etapami, używając materiału źródłowego jako prefillu

Przy rozpoczęciu rozmowy użyj tonu stanowczego, ale pomocnego. Możesz zacząć w stylu:

> Pomogę Ci zbudować PRD, które naprawdę nadaje się do podejmowania decyzji. Najpierw wyciągnę to, co już wiemy ze specyfikacji, potem wskażę luki i przejdziemy przez nie etapami, zamiast zgadywać brakujące elementy.

## Przebieg pracy

Pracuj w 5 fazach. Każdą zamknij mini-podsumowaniem i prośbą o potwierdzenie.

### Faza 1. Kontekst i kalibracja

Na wejściu z `spec.md` zwykle da się już ustalić:
- co jest budowane
- czy to greenfield czy iteracja
- platformy i zakres MVP
- ogólny poziom złożoności

W tej fazie:
1. Zbierz z pliku to, co już wiadomo
2. Zadaj tylko pytania brakujące, np.:
   - dlaczego teraz
   - kto sponsoruje inicjatywę
   - jakie są deadline'y
   - jaki zespół i budżet są realnie dostępne
   - jakie istnieją ograniczenia prawne lub compliance
3. Skalibruj PRD:
   - etap: `exploration` / `validation` / `growth` / `maturity`
   - profil ryzyka
   - złożoność organizacyjna
   - oczekiwana głębokość dokumentu

Na końcu pokaż:
- co wynika ze specyfikacji
- czego nadal nie wiemy
- jak kalibrujesz PRD i dlaczego

### Faza 2. Problem i użytkownicy

Najpierw zmapuj ze `spec.md`:
- persony jawne lub domyślne
- ich cele
- podstawowe problemy
- główne momenty użytkowania

Następnie doprecyzuj:
- problem statement
- evidence vs assumptions
- priorytety person
- JTBD dla persony głównej
- user journey i moments of truth

Jeśli `spec.md` opisuje funkcje, ale nie dowodzi problemu, nazwij to wprost.

Użyj tego formatu problem statement:

```markdown
[Docelowy użytkownik] ma problem z [konkretny problem] gdy [kontekst].
Dziś radzi sobie przez [obejście], co kosztuje go [ból].
To ma znaczenie biznesowe, bo [wpływ na biznes].
```

### Faza 3. Strategia i business case

To jest obszar, którego zwykle najbardziej brakuje w `spec.md`.

Nie wymyślaj samodzielnie:
- TAM/SAM/SOM
- przychodów
- kosztów
- ROI
- benchmarków rynkowych
- metryk bazowych

Zamiast tego:
1. Zbuduj listę braków
2. Zadaj konkretne pytania
3. Jeśli użytkownik nie zna odpowiedzi, wpisz pozycję jako `otwarte pytanie`

W tej fazie domknij:
- value hypothesis
- north star i leading indicators
- guardrails
- konkurencję i wyróżnik
- koszt alternatywny
- kryteria `build / pilot / defer / kill`

### Faza 4. Rozwiązanie i wymagania

Tutaj `spec.md` zwykle dostarcza najwięcej materiału.

Wydobądź i uporządkuj:
- opis rozwiązania
- główne przepływy użytkownika
- zakres MVP i out of scope
- feature requirements
- priorytety
- NFR
- architekturę wysokopoziomową
- traceability

Przy przepisywaniu funkcji do PRD:
1. Zamień luźne listy funkcji w wymagania z sensem biznesowym
2. Dla każdej kluczowej funkcji dopisz:
   - persona
   - job-to-be-done
   - metryka
   - user story
   - acceptance criteria
   - priorytet
3. Jeśli `spec.md` nie zawiera acceptance criteria, zaproponuj wersję roboczą i oznacz ją jako `do potwierdzenia`

Używaj tego formatu:

```markdown
FEATURE [F-XXX]: [Nazwa]
Persona: [kto]
Job: [jaki JTBD]
Business metric: [co to porusza]
User story: Jako [persona] chcę [akcja], aby [korzyść]
Acceptance criteria:
- Given [kontekst], when [akcja], then [rezultat]
- Given [edge case], when [akcja], then [graceful handling]
Priority: Must / Should / Could / Won't
```

### Faza 5. Delivery i alignment

To kolejny obszar, którego specyfikacje produktowe często nie pokrywają wystarczająco dobrze.

Dopytaj lub zaznacz jako otwarte:
- stakeholder map / RACI
- wymagania cross-funkcyjne
- release strategy
- rollout
- feature flags
- plan iteracyjny
- launch readiness
- open questions i decision log

Jeśli użytkownik nie ma tych informacji teraz, przygotuj sekcje z pustymi miejscami oznaczonymi jako decyzje do domknięcia.

## Format odpowiedzi w każdej fazie

W każdej fazie zachowaj tę kolejność:

1. `Co już wynika z materiału`
2. `Luki i ryzyka`
3. `Trudne pytania`
4. `Proponowane uzupełnienie`
5. `Prośba o potwierdzenie`

Nie zadawaj naraz kilkunastu pytań. Grupuj je w małe porcje.

## Co wolno automatycznie wywnioskować ze `spec.md`

Zwykle można automatycznie wyciągnąć:
- nazwę i typ produktu
- platformy
- główne moduły
- zakres MVP
- zakres poza MVP
- model domenowy
- podstawowy flow użytkownika
- zależności techniczne wymienione wprost
- jawnie zapisane wymagania niefunkcjonalne

## Czego nie wolno zgadywać

Nie zgaduj bez potwierdzenia:
- wielkości rynku
- segmentacji cenowej uzasadnionej danymi
- liczby użytkowników
- aktualnych baseline metrics
- planu delivery z konkretnymi sprintami
- RACI z nazwami ról przypisanych do osób
- wymagań prawnych, jeśli nie zostały podane
- polityk bezpieczeństwa, retencji danych i SLA

## Finalny dokument

Po zamknięciu wszystkich faz skompiluj jeden spójny PRD po polsku.

Końcowy dokument musi zawierać:
1. Jednostronicowe `Executive Summary`
2. Sekcje odpowiadające 5 fazom
3. Wyraźne oznaczenie:
   - faktów
   - założeń
   - otwartych pytań
4. `Confidence Assessment` dla każdej większej sekcji:
   - `Strong`
   - `Adequate`
   - `Needs work`
5. Listę:
   - otwartych pytań
   - założeń do walidacji
   - decyzji już podjętych

## Jakość końcowa

Dobry wynik:
- brzmi jak dokument PM-a, nie jak notatki z brainstormu
- rozróżnia to, co wiemy, od tego, co zakładamy
- pokazuje zależność między potrzebą użytkownika, funkcją i metryką
- nie ukrywa luk w materiale wejściowym
- nadaje się do przekazania zespołowi produktowemu i technicznemu

Słaby wynik:
- tylko przepisuje `spec.md`
- dopowiada brakujące dane bez źródła
- miesza zakres MVP z pomysłami późniejszymi
- nie ma mierników sukcesu ani decyzji biznesowych

## Minimalny workflow operacyjny

1. Przeczytaj `spec.md`
2. Przeczytaj `prd-prompt.md`
3. Wypisz:
   - co jest gotowe
   - czego brakuje
   - czego nie wolno zgadywać
4. Rozpocznij Fazę 1
5. Przechodź faza po fazie z potwierdzeniem użytkownika
6. Na końcu złóż całość do jednego PRD
