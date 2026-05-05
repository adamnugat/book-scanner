## Context

Ekran zdjęć projektu w `apps/mobile` pobiera `PageImageResponse[]` z API i renderuje miniatury przez `thumbnailUrl || imageUrl`. Backend generuje prywatne, tokenizowane URL-e dla pliku oryginalnego i miniatury, a endpointy assetów wymagają tokenu i sprawdzają właściciela projektu. Ten mechanizm powinien zostać zachowany, bo zdjęcia stron są prywatną zawartością użytkownika.

Obecny przepływ po wyborze z galerii lub aparatu od razu wysyła assety, pokazując jedynie progres uploadu. Użytkownik nie ma więc miejsca, w którym może obejrzeć wykonane zdjęcie, usunąć błędny kadr przed wysłaniem i potwierdzić, że strona wygląda poprawnie. Dodatkowo komponenty obrazów nie pokazują jawnego stanu błędu/ładowania, więc uszkodzony albo niedostępny URL wygląda jak puste miejsce.

## Goals / Non-Goals

**Goals:**
- Poprawić niezawodność renderowania zdjęć stron na ekranach, które pokazują `PageImageResponse`.
- Dodać podgląd lokalnych zdjęć wykonanych aparatem lub wybranych z galerii przed ich wysłaniem do API.
- Zachować istniejący kontrakt uploadu i autoryzowane endpointy obrazów, o ile nie zostanie potwierdzona konkretna usterka po stronie generowania URL-i.
- Zapewnić czytelne stany UI: ładowanie obrazu, błąd obrazu, podgląd przed wysłaniem, anulowanie wybranych zdjęć i upload po potwierdzeniu.

**Non-Goals:**
- Brak zmian w modelach Prisma, migracjach i sposobie przechowywania plików w S3/MinIO.
- Brak zmian w logice OCR/TTS, udostępnianiu, deep linkach, offline audio cache, billing i autoryzacji.
- Brak wprowadzania nowego frameworka galerii, nowego dostawcy storage ani publicznych URL-i dla prywatnych zdjęć.

## Decisions

1. **Podgląd lokalnych assetów przed uploadem w ekranie zdjęć projektu.**
   - Podejście: po `launchImageLibraryAsync` albo `launchCameraAsync` zapisać wybrane assety w lokalnym stanie `pendingAssets`, pokazać modal/sekcję podglądu z miniaturami, nazwą i akcjami „Usuń”, „Anuluj” oraz „Wyślij”.
   - Rationale: użytkownik widzi dokładnie te pliki, które trafią do projektu, bez zmiany API i bez ryzyka zapisywania błędnych zdjęć.
   - Alternatives considered: automatyczny upload jak dziś z podglądem dopiero po odpowiedzi API; prostsze, ale nie rozwiązuje braku kontroli przed wysłaniem. Osobny ekran kreatora skanowania; większy zakres niż potrzebny do naprawy.

2. **Wspólny, odporny komponent renderowania zdjęcia strony.**
   - Podejście: wydzielić mały komponent/helper w `apps/mobile`, który przyjmuje `thumbnailUrl`, `imageUrl`, style i tryb skalowania, pokazuje placeholder podczas ładowania i komunikat/ikonę błędu przy `onError`.
   - Rationale: te same problemy renderowania występują na ekranie listy zdjęć, regionów tekstu i edytora sceny; wspólne zachowanie ogranicza duplikację i ułatwia testy.
   - Alternatives considered: dopisać `onError` osobno przy każdym `Image`; szybkie, ale łatwo rozjedzie się zachowanie UI. Zmienić kontrakt API na jedno pole `displayUrl`; niepotrzebne, jeśli obecne pola wystarczają.

3. **Najpierw diagnozować URL-e, a backend zmieniać tylko punktowo.**
   - Podejście: w implementacji sprawdzić, czy URL-e zwracane przez `GET /projects/:id/images` i upload są absolutne, osiągalne z Expo Web/native i mają prawidłowy content type. Jeśli problem dotyczy hosta/protokołu lub tokenu, poprawić wyłącznie generator URL-i albo endpoint assetów, bez zmiany prywatności dostępu.
   - Rationale: obecny backend ma już autoryzowane endpointy i tokeny assetów; rozbudowa storage byłaby nieproporcjonalna.
   - Alternatives considered: generowanie publicznych signed URL-i bezpośrednio z S3/MinIO; zwiększa zależność UI od storage i komplikuje prywatność projektów.

4. **Zachować kolejność i semantykę listy po uploadzie.**
   - Podejście: po potwierdzonym uploadzie dołączyć odpowiedź API do listy, a w razie potrzeby przeładować listę z backendu, aby `orderIndex` i URL-e pochodziły z jednego źródła prawdy.
   - Rationale: UI ma pozwalać użytkownikowi natychmiast przejść do reorder/regionów tekstu bez ręcznego odświeżenia.

## Risks / Trade-offs

- [Risk] Lokalne URI z aparatu/galerii mogą zachowywać się inaczej na web, iOS i Android. → Mitigation: trzymać podgląd na `ImagePickerAsset.uri`, testować web oraz co najmniej jedną platformę mobilną, a web drag-and-drop nadal mapować przez `URL.createObjectURL`.
- [Risk] Tokenizowane URL-e mogą wygasać albo nie działać po zmianie hosta API. → Mitigation: w przypadku błędu obrazu umożliwić odświeżenie listy, a backendowe poprawki ograniczyć do generowania URL-i z bieżącego requestu/API base.
- [Risk] Dodatkowy krok potwierdzenia może spowolnić upload wielu stron. → Mitigation: dla wielu assetów pokazać siatkę podglądu i jeden przycisk zbiorczego wysłania, bez wymuszania przeglądania każdego zdjęcia osobno.
- [Risk] Testy komponentów `Image` w React Native są ograniczone. → Mitigation: testować stan UI i callbacki `onLoad`/`onError` na poziomie komponentu oraz zachować API tests dla endpointów obrazów, jeśli backend zostanie dotknięty.
