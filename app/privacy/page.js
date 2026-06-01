'use client'
import { useState } from 'react'
import Link from 'next/link'

const STRINGS = {
  pl: {
    toggle: 'EN',
    title: 'Polityka Prywatności',
    company: 'LGK Holdings Sp. z o.o. (w organizacji)',
    updated: 'Wersja 1.1 — Czerwiec 2026',
    intro: 'Niniejsza Polityka Prywatności wyjaśnia, w jaki sposób LGK Holdings Sp. z o.o. (w organizacji) gromadzi, wykorzystuje, przechowuje i chroni Twoje dane osobowe podczas korzystania z Platformy LGK — Portalu LGK Business (lgk-business.vercel.app) oraz mobilnej aplikacji LGK Courier. Przeczytaj ten dokument uważnie. Jest prawnie wiążący. Jeśli nie akceptujesz niniejszej Polityki, nie możesz korzystać z Platformy.',
    s1_h: '1. Administrator danych',
    s1_b: `1.1 Administrator danych:
LGK Holdings Sp. z o.o. (w organizacji)
Szczecin, Polska
E-mail: lgkcourierapp@gmail.com
1.2 Zapytania dotyczące ochrony danych: lgkcourierapp@gmail.com
1.3 Niniejsza Polityka dotyczy:
— Klientów Biznesowych korzystających z Portalu LGK Business
— Kurierów korzystających z aplikacji LGK Courier
— Odbiorców dostaw zorganizowanych przez Platformę
— Odwiedzających stronę internetową
1.4 Mobilna aplikacja LGK Courier zbiera dodatkowe dane specyficzne dla operacji dostawy, w tym dane GPS lokalizacji podczas aktywnych sesji roboczych oraz Zdjęcia z dowodem. Patrz Sekcje 3.2, 3.4 i 3.5.`,
    s2_h: '2. Podstawa prawna przetwarzania',
    s2_b: `2.1 WYKONANIE UMOWY (art. 6 ust. 1 lit. b) — rejestracja konta, przetwarzanie zamówień, koordynacja dostaw, wypłata wynagrodzeń, generowanie Zdjęć z dowodem.
2.2 UZASADNIONY INTERES (art. 6 ust. 1 lit. f) — zapobieganie oszustwom, bezpieczeństwo platformy, logowanie audytowe, monitorowanie wydajności, ulepszanie platformy. LGK zidentyfikował uzasadniony interes jako podstawę prawną tego przetwarzania. Formalna Ocena Uzasadnionego Interesu jest prowadzona i dostępna dla organu nadzorczego na żądanie.
2.3 OBOWIĄZEK PRAWNY (art. 6 ust. 1 lit. c) — prowadzenie ewidencji finansowej na mocy Ustawy o rachunkowości, sprawozdawczość podatkowa, wnioski organów ścigania.
2.4 ZGODA (art. 6 ust. 1 lit. a) — przetwarzanie lokalizacji GPS podczas aktywnych sesji roboczych. Wyraźna, swobodnie udzielona, konkretna i świadoma zgoda uzyskana przed rozpoczęciem przetwarzania. Zgoda może być w każdej chwili cofnięta. Cofnięcie uniemożliwia korzystanie z funkcji zależnych od lokalizacji podczas sesji roboczych.
2.5 Nie przetwarzamy danych szczególnych kategorii (art. 9 RODO), chyba że zostały dobrowolnie ujawnione z powodów operacyjnych — w takim przypadku przetwarzamy je za Twoją wyraźną zgodą.`,
    s3_h: '3. Jakie dane zbieramy i w jakim celu',
    s3_b: `3.1 KLIENCI BIZNESOWI
Dane zbierane:
— Imię i nazwisko lub nazwa firmy
— Adres e-mail
— Numer telefonu
— Dane rejestracyjne firmy (NIP, REGON, jeśli podane)
— Adres rozliczeniowy
— Historia zamówień: adresy odbioru, adresy dostawy, dane przesyłki, znaczniki czasu
— Dane logowania (e-mail/hash hasła lub token Google OAuth)
— Dane użytkowania platformy: odwiedzone strony, znaczniki czasu sesji
— Logo firmy (jeśli przesłane)
— Korespondencja z LGK
Uwaga: Przetwarzanie płatności obsługiwane jest przez licencjonowane instytucje finansowe. LGK nie przechowuje numerów kart, danych IBAN ani danych płatniczych na własnych serwerach.
Dlaczego: zarządzanie kontem, przetwarzanie zamówień, fakturowanie, wsparcie, zapobieganie oszustwom, polska rachunkowość i zgodność podatkowa.

3.2 KURIERZY
Dane zbierane:
— Imię i nazwisko
— Adres e-mail
— Numer telefonu
— Typ pojazdu
— Dane konta płatniczego (przechowywane przez dostawcę usług płatniczych)
— Numer NIP (w przypadku działalności komercyjnej)
— Dane GPS lokalizacji — WYŁĄCZNIE PODCZAS AKTYWNYCH SESJI ROBOCZYCH (patrz Sekcja 3.4)
— Historia dostaw: zrealizowane przystanki, adresy, znaczniki czasu
— Zagregowane sumy przebiegu (pochodne z GPS, przechowywane do celów ewidencji podatkowej)
— Zdjęcia z dowodem
— Wynik Karma i wskaźniki wydajności
— Wkłady do BRAMA INTEL
— Kontyngent Intel Exchange i dane milestoneów
— Dane logowania
— Informacje o urządzeniu: model urządzenia, wersja systemu operacyjnego, wersja aplikacji
— Korespondencja z LGK
Dlaczego: zarządzanie kontem, dopasowywanie zamówień, wypłaty wynagrodzeń, weryfikacja dostaw, system BRAMA INTEL, jakość platformy, polska zgodność podatkowa.

3.3 ODBIORCY
Dane zbierane (dostarczone przez Klienta Biznesowego):
— Imię i nazwisko
— Adres dostawy
— Numer telefonu (do koordynacji dostawy)
— Uwagi dotyczące dostawy
Dlaczego: wyłącznie w celu koordynacji i realizacji dostawy oraz generowania GPS-zweryfikowanych Zdjęć z dowodem.
Uwaga: LGK jest podmiotem przetwarzającym dane odbiorców. Klient Biznesowy jest administratorem danych. Na mocy Regulaminu Klienci Biznesowi są zobowiązani do poinformowania odbiorców, że ich dostawa jest obsługiwana przez LGK i że zostanie wykonane Zdjęcie z dowodem GPS. Odbiorcy chcący skorzystać z praw RODO dotyczących danych dostawy powinni w pierwszej kolejności skontaktować się z Klientem Biznesowym. LGK odpowie bezpośrednio na wnioski podmiotów danych odbiorców, jeśli Klient Biznesowy nie jest w stanie działać.

3.4 DANE GPS LOKALIZACJI — KURIERZY
Co zbieramy: współrzędne GPS urządzenia Kuriera.
Kiedy zbieramy: WYŁĄCZNIE podczas aktywnej sesji roboczej — od momentu aktywacji aplikacji do pracy do momentu dezaktywacji sesji.
Czego NIE robimy:
— Nie śledzimy lokalizacji poza aktywnymi sesjami roboczymi
— Nie przechowujemy surowych współrzędnych GPS po zakończeniu sesji
— Nie udostępniamy lokalizacji Kuriera pracodawcom, Klientom Biznesowym ani stronom trzecim poza Platformą
— Nie używamy danych GPS do celów innych niż tutaj ujawnione
Do czego używamy:
— Ujawnianie BRAMA INTEL: kody bram wyświetlane wyłącznie w promieniu 100 metrów od budynku. Egzekwowane na poziomie bazy danych, nie tylko w aplikacji.
— Weryfikacja dostawy: współrzędne GPS osadzone w Zdjęciach z dowodem
— Ewidencja przebiegu: zagregowane sumy przechowywane jako pomoc Kurierom w ewidencji odliczeń podatkowych
— Pasywna weryfikacja pobytu: potwierdzenie, że Kurier pozostawał w lokalizacji przez minimalny czas w celu weryfikacji kodu BRAMA INTEL
Zapisy zgody obejmujące znacznik czasu i wersję platformy są przechowywane w rekordzie profilu Kuriera jako dowód zgody.
Podstawa prawna: Wyraźna zgoda (art. 6 ust. 1 lit. a RODO), uzyskana przez ekran zgody GPS w aplikacji przed pierwszą sesją roboczą. Zgodę można cofnąć w ustawieniach konta.

3.5 ZDJĘCIA Z DOWODEM
Zdjęcia z lokalizacją GPS i datownikiem wykonane w miejscu dostawy. Stanowią dane osobowe, gdy przedstawiają osoby możliwe do zidentyfikowania.
Kto ma do nich dostęp:
— Kurier (przez swój Vault — na stałe)
— Klient Biznesowy (przez portal — przez 12 miesięcy od dostawy)
— LGK (wyłącznie do rozstrzygania sporów i zapewnienia jakości)
Kto nie ma dostępu:
— Pracodawcy kurierów bez wyraźnej zgody Kuriera
— Strony trzecie
Kurierzy powinni wykonywać Zdjęcia z dowodem rejestrujące tylko to, co jest niezbędne do weryfikacji dostawy. LGK opiera się na uzasadnionym interesie weryfikacji dostawy tam, gdzie Zdjęcie z dowodem przypadkowo rejestruje strony trzecie. Kurierzy powinni unikać rejestrowania możliwych do zidentyfikowania osób, gdy jest to możliwe.

3.6 DANE BRAMA INTEL
Przetwarzane na podstawie uzasadnionego interesu polegającego na prowadzeniu wspólnotowego systemu bezpieczeństwa dla zawodowych kurierów. Po usunięciu konta identyfikator osobisty Kuriera jest usuwany (anonimizacja). Po anonimizacji kody BRAMA INTEL nie stanowią już danych osobowych zgodnie z art. 4 ust. 1 RODO, ponieważ nie można ich powiązać z możliwą do zidentyfikowania osobą.

3.7 PROFILOWANIE I ZAUTOMATYZOWANE PODEJMOWANIE DECYZJI
LGK używa zautomatyzowanych systemów profilujących wydajność Kuriera. Systemy te stanowią profilowanie zgodnie z art. 4 ust. 4 RODO.
System Karma:
— Dane wejściowe: wskaźnik realizacji dostaw, oceny klientów, zgodność z Zdjęciami z dowodem, liczba wkładów do BRAMA INTEL, liczba zweryfikowanych kodów
— Dane wyjściowe: wynik Karma (widoczny dla Kuriera w aplikacji)
— Konsekwencje: brak bezpośrednich konsekwencji wynikających wyłącznie z wyniku Karma
System Intel Exchange:
— Dane wejściowe: miesięczne wkłady do BRAMA INTEL (intel_quota_this_month), kolejne miesiące z zerowymi wkładami (consecutive_zero_months)
— Dane wyjściowe: poziom dostępu (pełny dostęp, zmniejszony priorytet, paywall)
— Progi: 2 kolejne miesiące z zerowymi wkładami powodują zmniejszony priorytet w kanale pracy; na kanale pracy wyświetlany jest ekran paywall
— Paywall nie blokuje dostępu całkowicie — zadania pozostają dostępne przy zmniejszonym priorytecie
Masz prawo zażądać ludzkiej weryfikacji każdej zautomatyzowanej decyzji, która istotnie na Ciebie wpływa. Kontakt: lgkcourierapp@gmail.com.

3.8 DANE SESJI ANONIMOWEJ
Anonimowe sesje robocze są powiązane z urządzeniem i ograniczone do 30 dni. Dane zbierane podczas sesji anonimowych obejmują lokalizację GPS, informacje o urządzeniu i historię dostaw powiązaną z identyfikatorem sesji anonimowej. Wkłady do BRAMA INTEL podczas sesji anonimowych są utrzymywane w stanie oczekiwania i nie są widoczne dla innych użytkowników do momentu rejestracji pełnego konta. Dane sesji anonimowej są usuwane 30 dni po ostatniej aktywności sesji, jeśli nie zostało zarejestrowane konto.
Anonimowi użytkownicy realizują prawo do usunięcia danych przez funkcję Usuń Sesję w aplikacji. Dane sesji powiązane z anonimowym identyfikatorem nie mogą być przypisane do osoby fizycznej po usunięciu.

3.9 ODWIEDZAJĄCY STRONĘ
Dane zbierane automatycznie:
— Adres IP (anonimizowany po 7 dniach)
— Typ i wersja przeglądarki
— Odwiedzone strony i czas spędzony
— Źródło odesłania
— Typ urządzenia
Dlaczego: funkcjonalność strony, zagregowana analityka, bezpieczeństwo.
Nie używamy reklamowych plików cookie. Nie śledzimy Cię na innych stronach.`,
    s4_h: '4. Jak długo przechowujemy Twoje dane',
    s4_b: `4.1 Dane konta (imię, e-mail, telefon, dane logowania, informacje o urządzeniu) — przechowywane podczas aktywnego konta. Usunięte w ciągu 30 dni od usunięcia konta.
4.2 Rekordy dostaw (adresy, znaczniki czasu, szczegóły zamówienia) — 5 lat od realizacji (polskie prawo rachunkowe).
4.3 Zdjęcia z dowodem — 3 lata od daty dostawy. Dostępne dla Kuriera bezterminowo w jego Vault, chyba że je usunie. Dostępne dla Klienta Biznesowego przez 12 miesięcy od dostawy.
4.4 Ewidencja finansowa (faktury, płatności, zarobki) — 5 lat (polskie prawo rachunkowe). Nie można ich usunąć na żądanie w okresie przechowywania.
4.5 Dane GPS lokalizacji — surowe współrzędne nie są przechowywane po zakończeniu sesji roboczej. Zagregowane sumy przebiegu przechowywane przez czas trwania konta i usunięte po zamknięciu konta.
4.6 Dziennik audytu — 5 lat. Niezmienny — nie można go zmienić ani usunąć.
4.7 BRAMA INTEL — anonimizowany po usunięciu konta. Przechowywany przez 90 dni aktywnych, następnie 3 lata w zanonimizowanej formie archiwalnej.
4.8 Korespondencja z pomocą techniczną — 3 lata od daty komunikacji.
4.9 Dane listy oczekujących — przechowywane wyłącznie w celu powiadamiania zarejestrowanych osób, gdy Platforma zostanie uruchomiona w ich obszarze. Nie używane do innych celów marketingowych bez odrębnej zgody. Poproś o usunięcie w dowolnym momencie: lgkcourierapp@gmail.com.
4.10 Dane sesji anonimowej — usunięte 30 dni po ostatniej aktywności sesji, jeśli nie zostało zarejestrowane konto.`,
    s5_h: '5. Komu udostępniamy Twoje dane',
    s5_b: `Nie sprzedajemy Twoich danych osobowych. Nie udostępniamy ich reklamodawcom. Udostępniamy je wyłącznie w następujący sposób:

5.1 MIĘDZY UŻYTKOWNIKAMI PLATFORMY (operacyjnie niezbędne)
Klienci Biznesowi otrzymują: imię Kuriera, Zdjęcie z dowodem, status dostawy, potwierdzenie dostawy GPS.
NIE otrzymują: zarobków Kuriera, historii lokalizacji, danych płatniczych.
Kurierzy otrzymują: adres odbioru, adres dostawy, imię i telefon odbiorcy, szczegóły przesyłki.
NIE otrzymują: danych finansowych Klienta Biznesowego, danych innych kurierów.

5.2 DOSTAWCY USŁUG TECHNOLOGICZNYCH (podmioty przetwarzające)
— Supabase Inc. — hosting bazy danych i uwierzytelnianie. Serwery w UE (Frankfurt). Umowa Powierzenia w miejscu.
— Vercel Inc. — hosting stron internetowych.
— Dostawcy usług płatniczych — wypłaty i przetwarzanie płatności obsługiwane przez licencjonowanych dostawców usług płatniczych. LGK nie działa jako instytucja płatnicza.
— Expo / EAS — budowanie i dystrybucja aplikacji mobilnych.
— Google LLC — uwierzytelnianie OAuth (jeśli logowanie przez Google), dystrybucja Google Play.
— Sentry — wyłącznie zanonimizowane raporty o awariach, bez osobistych danych dostawy.
Wszyscy dostawcy związani Umowami Powierzenia.

5.3 ORGANY ŚCIGANIA I ORGANY REGULACYJNE
Gdy wymagane przez prawo lub ważny nakaz sądowy. LGK powiadomi Cię, gdy jest to prawnie dozwolone.

5.4 TRANSAKCJE BIZNESOWE
W przypadku fuzji lub przejęcia dane mogą zostać przeniesione do przejmującego podmiotu. Zostaniesz powiadomiony przed przeniesieniem.

5.5 CZEGO NIGDY NIE UDOSTĘPNIAMY
— Zarobków Kuriera pracodawcom ani stronom trzecim
— Historii lokalizacji GPS Kuriera komukolwiek poza Platformą
— Zdjęć z dowodem pracodawcom bez wyraźnej zgody Kuriera
— Danych osobowych brokerom danych, reklamodawcom ani firmom marketingowym
— BRAMA INTEL zbiorczo stronom trzecim`,
    s6_h: '6. Międzynarodowe transfery danych',
    s6_b: `6.1 Główna baza danych: Supabase, Frankfurt, Niemcy (UE/EOG).
6.2 Niektórzy dostawcy (procesory płatności, Vercel, Google) mogą przetwarzać dane poza UE/EOG. Zapewniamy odpowiednią ochronę poprzez Standardowe Klauzule Umowne (Decyzja Wykonawcza Komisji (UE) 2021/914) i Umowy Powierzenia wymagające standardów ochrony na poziomie UE.
6.3 Skontaktuj się z lgkcourierapp@gmail.com, aby uzyskać informacje o zabezpieczeniach dla każdego transferu międzynarodowego.`,
    s7_h: '7. Twoje prawa na mocy RODO',
    s7_b: `Odpowiemy na wszystkie wnioski w ciągu 30 dni. Żadna opłata nie ma zastosowania, chyba że wniosek jest oczywiście nieuzasadniony lub nadmierny.

7.1 PRAWO DOSTĘPU (art. 15) — poproś o kopię wszystkich danych, które LGK posiada na Twój temat.
E-mail: lgkcourierapp@gmail.com
Temat: „Wniosek o dostęp do danych — [Twoje imię i nazwisko]"

7.2 PRAWO DO SPROSTOWANIA (art. 16) — poproś o poprawienie niedokładnych danych. Większość danych profilu można zaktualizować na Platformie.

7.3 PRAWO DO USUNIĘCIA (art. 17) — poproś o usunięcie, gdy dane nie są już niezbędne, zgoda jest cofnięta lub dane były niezgodnie z prawem przetwarzane. Ograniczenia: ewidencja finansowa (5 lat) i dzienniki audytu (5 lat) nie mogą być usunięte na mocy prawa polskiego. Poinformujemy Cię dokładnie, co może, a co nie może zostać usunięte. Funkcja Usuń Konto inicjuje kaskadowe usunięcie wszystkich usuwalnych danych w ciągu 30 dni.

7.4 PRAWO DO OGRANICZENIA PRZETWARZANIA (art. 18) — poproś, abyśmy przechowywali, ale nie używali Twoich danych, gdy kwestionowana jest dokładność lub oczekuje na decyzja.

7.5 PRAWO DO PRZENOSZENIA DANYCH (art. 20) — otrzymaj swoje dane w formacie nadającym się do odczytu maszynowego (JSON). Wniosek przez lgkcourierapp@gmail.com.

7.6 PRAWO SPRZECIWU (art. 21) — sprzeciw wobec przetwarzania opartego na uzasadnionym interesie. Bezwzględne prawo sprzeciwu wobec marketingu bezpośredniego (obecnie nie wysyłamy e-maili marketingowych).

7.7 PRAWA ZWIĄZANE Z PROFILOWANIEM (art. 22) — LGK używa zautomatyzowanych systemów profilowania opisanych w Sekcji 3.7. Masz prawo zażądać ludzkiej weryfikacji każdej decyzji profilowania, która istotnie wpływa na Twój dostęp do dostaw lub zarobków. Kontakt: lgkcourierapp@gmail.com.

7.8 PRAWO DO COFNIĘCIA ZGODY — cofnij zgodę GPS w dowolnym momencie przez ustawienia Platformy. Cofnięcie nie wpływa na zgodność z prawem wcześniejszego przetwarzania.

7.9 PRAWO DO ZŁOŻENIA SKARGI:
Urząd Ochrony Danych Osobowych (UODO)
ul. Stawki 2, 00-193 Warszawa
www.uodo.gov.pl · kancelaria@uodo.gov.pl
Tel.: +48 22 531 03 00
Możesz również złożyć skargę do organu nadzorczego w kraju swojego zamieszkania w UE.`,
    s8_h: '8. Jak chronimy Twoje dane',
    s8_b: `8.1 ŚRODKI TECHNICZNE
— Szyfrowanie podczas transmisji: HTTPS/TLS na wszystkich komunikacjach Platformy
— Szyfrowanie w spoczynku: AES-256 przez infrastrukturę Supabase
— Bezpieczeństwo na poziomie wierszy: kontrole dostępu do bazy danych egzekwowane na poziomie bazy danych, nie tylko w kodzie aplikacji
— Przechowywanie Zdjęć z dowodem: prywatny zasobnik, podpisane adresy URL z ograniczonym czasem ważności
— Tokeny sesji: szyfrowane przechowywanie na urządzeniu (expo-secure-store), nie zwykły tekst
— Logowanie audytowe: niezmienne, nie może być modyfikowane ani usuwane przez żadnego użytkownika, w tym administratorów LGK
8.2 ŚRODKI ORGANIZACYJNE
— Kontrola dostępu: dostęp pracowników ograniczony do wymagań roli, dostęp administratora rejestrowany
— Reagowanie na incydenty: UODO powiadamiany w ciągu 72 godzin o naruszeniu stwarzającym ryzyko dla Twoich praw. Dotknięte osoby powiadamiane bez zbędnej zwłoki, gdy naruszenie może skutkować wysokim ryzykiem, z opisem: charakteru naruszenia, danych, których dotyczy, prawdopodobnych konsekwencji i podjętych środków.
— Minimalizacja danych: zbieramy tylko to, co niezbędne i regularnie przeglądamy przechowywanie`,
    s9_h: '9. Pliki cookie i śledzenie',
    s9_b: `9.1 Portal LGK Business używa wyłącznie niezbędnych plików cookie. Sesyjne pliki cookie uwierzytelniające są wymagane do funkcjonowania Platformy. Podstawa prawna: wykonanie umowy.
9.2 Aplikacja LGK Courier nie używa plików cookie przeglądarki. Sesje przechowywane w szyfrowanym magazynie urządzenia.
9.3 Strony docelowe LGK nie używają reklamowych ani śledzących plików cookie. Logi serwera rejestrują adresy IP dla bezpieczeństwa i są usuwane po 7 dniach.`,
    s10_h: '10. Dane dzieci',
    s10_b: `10.1 Platforma nie jest przeznaczona dla osób poniżej 18 roku życia. LGK nie zbiera świadomie danych osobowych od dzieci.
10.2 Jeśli uważasz, że osoba poniżej 18 roku życia zarejestrowała się, natychmiast skontaktuj się z lgkcourierapp@gmail.com. Usuniemy konto i wszystkie powiązane dane niezwłocznie.`,
    s11_h: '11. Rejestr czynności przetwarzania (RoPA)',
    s11_b: `Na mocy art. 30 RODO LGK prowadzi wewnętrzny Rejestr Czynności Przetwarzania dostępny dla UODO na żądanie.

Czynność przetwarzania | Podstawa prawna | Okres przechowywania
Rejestracja konta | Umowa | Konto + 30 dni
Przetwarzanie zamówień | Umowa | 5 lat
GPS lokalizacji (sesje robocze) | Zgoda | Nie przechowywany po sesji
Zagregowany przebieg | Umowa / Uzasadniony interes | Czas trwania konta
Zdjęcia z dowodem | Umowa / Uzasadniony interes | 3 lata
Wypłaty wynagrodzeń | Umowa / Obowiązek prawny | 5 lat
Logowanie audytowe | Uzasadniony interes / Obowiązek prawny | 5 lat
Profilowanie wydajności | Uzasadniony interes | Czas trwania konta
BRAMA Intel | Uzasadniony interes + Zgoda | 90 dni aktywne, 3 lata archiwum
Dane sesji anonimowej | Uzasadniony interes | 30 dni od ostatniej sesji`,
    s12_h: '12. Zmiany Polityki',
    s12_b: `12.1 Istotne zmiany komunikowane e-mailem co najmniej 30 dni przed wejściem w życie.
12.2 Zaktualizowana Polityka opublikowana na lgk-business.vercel.app/privacy. Dalsze korzystanie po dacie wejścia w życie oznacza akceptację.
12.3 W przypadku zmian wpływających na podstawę prawną lub wprowadzających nowe kategorie danych: jeśli jest to wymagane przez prawo, poszukujemy nowej zgody.`,
    s13_h: '13. Kontakt i skargi',
    s13_b_pre: 'E-mail: ',
    s13_b_post: `
Temat: „Ochrona danych — [Twoje zapytanie]"
Odpowiedź: w ciągu 30 dni

Ostatnia aktualizacja: Czerwiec 2026 · Wersja 1.1
LGK Holdings Sp. z o.o. (w organizacji) · Szczecin, Polska`,
    footer: 'L° LGK Holdings · Szczecin · lgkcourierapp@gmail.com',
  },
  en: {
    toggle: 'PL',
    title: 'Privacy Policy',
    company: 'LGK Holdings Sp. z o.o. (w organizacji)',
    updated: 'Version 1.1 — June 2026',
    intro: 'This Privacy Policy explains how LGK Holdings Sp. z o.o. (w organizacji) collects, uses, stores, and protects your personal data when you use the LGK Platform — the LGK Business Portal (lgk-business.vercel.app) and the LGK Courier mobile application. Read this document carefully. It is legally binding. If you do not accept this Policy, you must not use the Platform.',
    s1_h: '1. Data Controller',
    s1_b: `1.1 Data controller:
LGK Holdings Sp. z o.o. (w organizacji)
Szczecin, Poland
Email: lgkcourierapp@gmail.com
1.2 Data protection enquiries: lgkcourierapp@gmail.com
1.3 This Policy applies to:
— Business Clients using the LGK Business Portal
— Couriers using the LGK Courier app
— Recipients of deliveries arranged through the Platform
— Website visitors
1.4 The LGK Courier mobile application collects additional data specific to delivery operations, including GPS location data during active working sessions and Proof Photos. See Sections 3.2, 3.4, and 3.5.`,
    s2_h: '2. Legal Basis for Processing',
    s2_b: `2.1 CONTRACT PERFORMANCE (Article 6(1)(b)) — account registration, order processing, delivery coordination, earnings payments, Proof Photo generation.
2.2 LEGITIMATE INTERESTS (Article 6(1)(f)) — fraud prevention, platform security, audit logging, performance monitoring, platform improvement. LGK has identified legitimate interests as the legal basis for this processing. A formal Legitimate Interests Assessment is maintained and available to the supervisory authority on request.
2.3 LEGAL OBLIGATION (Article 6(1)(c)) — financial record-keeping under Polish Accounting Act (Ustawa o rachunkowości), tax reporting, law enforcement requests.
2.4 CONSENT (Article 6(1)(a)) — GPS location processing during active working sessions. Explicit, freely given, specific, and informed consent obtained before processing begins. Consent may be withdrawn at any time. Withdrawal prevents use of location-dependent features during working sessions.
2.5 We do not process special category data (GDPR Article 9) unless voluntarily disclosed for operational reasons, in which case we process it with your explicit consent.`,
    s3_h: '3. What Data We Collect and Why',
    s3_b: `3.1 BUSINESS CLIENTS
Data collected:
— Full name or company name
— Email address
— Phone number
— Company registration details (NIP, REGON where provided)
— Billing address
— Order history: pickup addresses, delivery addresses, package details, timestamps
— Login credentials (email/password hash or Google OAuth token)
— Platform usage data: pages visited, session timestamps
— Company logo (if uploaded)
— Communication records with LGK
Note: Payment processing is handled by licensed financial institutions. LGK does not store card numbers, IBAN details, or payment credentials on its own servers.
Why: account management, order processing, invoicing, support, fraud prevention, Polish accounting and tax compliance.

3.2 COURIERS
Data collected:
— Full name
— Email address
— Phone number
— Vehicle type
— Payment account details (held by the payment service provider)
— NIP number (where operating commercially)
— GPS location data — DURING ACTIVE WORKING SESSIONS ONLY (see Section 3.4)
— Delivery history: stops completed, addresses, timestamps
— Aggregate mileage totals (derived from GPS, retained for tax record-keeping)
— Proof Photos
— Karma score and performance metrics
— BRAMA INTEL contributions
— Intel Exchange quota and milestone data
— Login credentials
— Device information: device model, OS version, app version
— Communication records with LGK
Why: account management, order matching, earnings payments, delivery verification, BRAMA INTEL system, platform quality, Polish tax reporting compliance.

3.3 RECIPIENTS
Data collected (provided by the Business Client):
— Name
— Delivery address
— Phone number (for delivery coordination)
— Delivery notes
Why: solely to coordinate and complete the delivery and to generate GPS-verified Proof Photos as delivery evidence.
Note: LGK is a data processor for recipient data. The Business Client is the data controller. Business Clients are required under the Terms of Service to inform recipients that their delivery is being handled by LGK and that a GPS Proof Photo will be taken. Recipients wishing to exercise their GDPR rights regarding delivery data should contact the Business Client in the first instance. LGK will respond to recipient data subject requests directly where the Business Client is unable to act.

3.4 GPS LOCATION DATA — COURIERS
What we collect: GPS coordinates of the Courier's device.
When we collect it: ONLY during an active working session — from the moment a Courier activates the app for work to the moment they deactivate the session.
What we do NOT do:
— We do not track location outside of active working sessions
— We do not store raw GPS coordinates after session completion
— We do not share Courier location with employers, Business Clients, or any third party outside the Platform
— We do not use GPS data for purposes other than those disclosed here
What we use it for:
— BRAMA INTEL reveal: gate codes shown only within 100 metres of a building. Enforced at the database level, not just in app.
— Delivery verification: GPS coordinates embedded in Proof Photos
— Mileage logging: aggregate totals retained to assist Couriers with tax deduction records
— Passive dwell verification: confirming Courier remained at a location for minimum time to verify a BRAMA INTEL code
Consent records including timestamp and platform version are stored in the Courier's profile record as evidence of consent.
Legal basis: Explicit consent (GDPR Article 6(1)(a)), obtained via the in-app GPS consent screen before the first working session. Consent may be withdrawn via account settings.

3.5 PROOF PHOTOS
GPS-timestamped photographs taken at the point of delivery. They constitute personal data where they depict identifiable individuals.
Who can access them:
— The Courier (via their Vault — permanently)
— The Business Client (via portal — for 12 months from delivery)
— LGK (for dispute resolution and quality assurance only)
Who cannot access them:
— Employers of couriers without the Courier's explicit consent
— Third parties
Couriers should take Proof Photos capturing only what is necessary to verify delivery. LGK relies on the legitimate interest of delivery verification where a Proof Photo incidentally captures third parties. Couriers should avoid capturing identifiable individuals where possible.

3.6 BRAMA INTEL DATA
Processed under the legitimate interest of operating a community safety and intelligence system for professional couriers. Upon account deletion, the contributing Courier's personal identifier is removed (anonymisation). Once anonymised, BRAMA INTEL codes no longer constitute personal data under GDPR Article 4(1) as they cannot be linked to an identifiable individual.

3.7 PROFILING AND AUTOMATED DECISION-MAKING
LGK uses automated systems that profile Courier performance. These systems constitute profiling under GDPR Article 4(4).
Karma scoring system:
— Inputs: delivery completion rate, client ratings, Proof Photo compliance, BRAMA INTEL contribution count, verified codes count
— Outputs: Karma score (visible to Courier in app)
— Consequences: no direct consequences from Karma score alone
Intel Exchange system:
— Inputs: monthly BRAMA INTEL contributions (intel_quota_this_month), consecutive months with zero contributions (consecutive_zero_months)
— Outputs: access tier (full access, reduced priority, paywall)
— Thresholds: 2 consecutive months of zero contributions triggers reduced job feed priority; paywall screen shown on job feed
— Paywall does not block access entirely — jobs remain claimable at reduced priority
You have the right to request human review of any automated decision that significantly affects you. Contact lgkcourierapp@gmail.com.

3.8 ANONYMOUS SESSION DATA
Anonymous working sessions are device-bound and limited to 30 days. Data collected during anonymous sessions includes GPS location, device information, and delivery history linked to the anonymous session ID. BRAMA INTEL contributions during anonymous sessions are held in pending status and not made visible to other users until the Courier registers a full account. Anonymous session data is deleted 30 days after the last session activity if no account is registered.
Anonymous users exercise their right to erasure via the in-app Delete Session function. Session data linked to an anonymous ID cannot be attributed to a natural person after deletion.

3.9 WEBSITE VISITORS
Data collected automatically:
— IP address (anonymised after 7 days)
— Browser type and version
— Pages visited and time spent
— Referral source
— Device type
Why: website functionality, aggregate analytics, security.
We do not use advertising cookies. We do not track you across other websites.`,
    s4_h: '4. How Long We Keep Your Data',
    s4_b: `4.1 Account data (name, email, phone, login, device information) — retained while account is active. Deleted within 30 days of account deletion.
4.2 Delivery records (addresses, timestamps, order details) — 5 years from completion (Polish accounting law).
4.3 Proof Photos — 3 years from date of delivery. Available to Courier indefinitely in their Vault unless they delete them. Available to Business Client for 12 months from delivery.
4.4 Financial records (invoices, payments, earnings) — 5 years (Polish accounting law). Cannot be deleted on request during retention period.
4.5 GPS location data — raw coordinates not stored after working session completion. Aggregate mileage totals retained for duration of account and deleted upon account closure.
4.6 Audit log — 5 years. Immutable — cannot be altered or deleted.
4.7 BRAMA INTEL — anonymised on account deletion. Retained for 90 days active, then 3 years in anonymised archive form.
4.8 Support communications — 3 years from date of communication.
4.9 Waitlist data — retained solely to notify registrants when the Platform launches in their area. Not used for other marketing purposes without separate consent. Request removal at any time: lgkcourierapp@gmail.com.
4.10 Anonymous session data — deleted 30 days after last session activity if no account registered.`,
    s5_h: '5. Who We Share Your Data With',
    s5_b: `We do not sell your personal data. We do not share it with advertisers. We share it only as follows:

5.1 BETWEEN PLATFORM USERS (operationally necessary)
Business Clients receive: Courier first name, Proof Photo, delivery status, GPS delivery confirmation.
They do NOT receive: Courier earnings, location history, payment details.
Couriers receive: Pickup address, delivery address, recipient name and phone, package details.
They do NOT receive: Business Client financial details, other couriers' data.

5.2 TECHNOLOGY SERVICE PROVIDERS (data processors)
— Supabase Inc. — database hosting and authentication. Servers in EU (Frankfurt). Data Processing Agreement in place.
— Vercel Inc. — web hosting.
— Payment service providers — earnings disbursement and payment processing handled by licensed payment service providers. LGK does not act as a payment institution.
— Expo / EAS — mobile app build and distribution.
— Google LLC — OAuth authentication (if sign-in with Google), Google Play distribution.
— Sentry — anonymised crash reports only, no personal delivery data.
All providers bound by Data Processing Agreements.

5.3 LAW ENFORCEMENT AND REGULATORY AUTHORITIES
Where required by law or valid court order. LGK will notify you where legally permitted.

5.4 BUSINESS TRANSFERS
In event of merger or acquisition, data may transfer to acquiring entity. You will be notified before transfer.

5.5 WHAT WE NEVER SHARE
— Courier earnings with employers or any third party
— Courier GPS location history with anyone outside the Platform
— Proof Photos with employers without Courier's explicit consent
— Personal data to data brokers, advertisers, or marketing companies
— BRAMA INTEL in bulk with any third party`,
    s6_h: '6. International Data Transfers',
    s6_b: `6.1 Primary database: Supabase, Frankfurt, Germany (EU/EEA).
6.2 Some providers (payment processors, Vercel, Google) may process data outside the EU/EEA. We ensure adequate protection through Standard Contractual Clauses (Commission Implementing Decision (EU) 2021/914) and Data Processing Agreements requiring EU-level protection standards.
6.3 Contact lgkcourierapp@gmail.com for information about safeguards for any international transfer.`,
    s7_h: '7. Your Rights Under GDPR',
    s7_b: `We will respond to all requests within 30 days. No fee applies unless a request is manifestly unfounded or excessive.

7.1 RIGHT OF ACCESS (Article 15) — request a copy of all data LGK holds about you.
Email: lgkcourierapp@gmail.com
Subject: "Data Subject Access Request — [your name]"

7.2 RIGHT TO RECTIFICATION (Article 16) — request correction of inaccurate data. Most profile data can be updated in the Platform.

7.3 RIGHT TO ERASURE (Article 17) — request deletion where data is no longer necessary, consent is withdrawn, or data was unlawfully processed. Limitations: financial records (5 years) and audit logs (5 years) cannot be deleted under Polish law. We will tell you exactly what can and cannot be deleted. The Delete Account function initiates cascade deletion of all deletable data within 30 days.

7.4 RIGHT TO RESTRICTION (Article 18) — request we store but not use your data where accuracy is contested or a decision is pending.

7.5 RIGHT TO DATA PORTABILITY (Article 20) — receive your data in a machine-readable format (JSON). Request via lgkcourierapp@gmail.com.

7.6 RIGHT TO OBJECT (Article 21) — object to processing based on legitimate interests. Absolute right to object to direct marketing (we do not currently send marketing emails).

7.7 RIGHTS RELATED TO PROFILING (Article 22) — LGK uses automated profiling systems described in Section 3.7. You have the right to request human review of any profiling decision that significantly affects your access to deliveries or earnings. Contact lgkcourierapp@gmail.com.

7.8 RIGHT TO WITHDRAW CONSENT — withdraw GPS consent at any time via Platform settings. Withdrawal does not affect the lawfulness of prior processing.

7.9 RIGHT TO LODGE A COMPLAINT:
Urząd Ochrony Danych Osobowych (UODO)
ul. Stawki 2, 00-193 Warszawa
www.uodo.gov.pl · kancelaria@uodo.gov.pl
Phone: +48 22 531 03 00
You may also lodge a complaint with the supervisory authority in your country of residence within the EU.`,
    s8_h: '8. How We Protect Your Data',
    s8_b: `8.1 TECHNICAL MEASURES
— Encryption in transit: HTTPS/TLS on all Platform communications
— Encryption at rest: AES-256 via Supabase infrastructure
— Row Level Security: database-level access controls enforced at the database layer, not just in application code
— Proof Photo storage: private bucket, time-limited signed URLs
— Session tokens: encrypted device storage (expo-secure-store), not plain text
— Audit logging: immutable, cannot be modified or deleted by any user including LGK administrators
8.2 ORGANISATIONAL MEASURES
— Access control: staff access restricted to role requirements, admin access logged
— Incident response: UODO notified within 72 hours of a breach posing risk to your rights. Affected individuals notified without undue delay where the breach is likely to result in high risk, describing: nature of breach, data affected, likely consequences, and measures taken.
— Data minimisation: we collect only what is necessary and regularly review retention`,
    s9_h: '9. Cookies and Tracking',
    s9_b: `9.1 The LGK Business Portal uses strictly necessary cookies only. Session authentication cookies are required for the Platform to function. Legal basis: contract performance.
9.2 The LGK Courier app does not use browser cookies. Sessions stored in encrypted device storage.
9.3 LGK landing pages do not use advertising or tracking cookies. Server logs record IP addresses for security and are deleted after 7 days.`,
    s10_h: '10. Children\'s Data',
    s10_b: `10.1 The Platform is not intended for persons under 18. LGK does not knowingly collect personal data from children.
10.2 If you believe a person under 18 has registered, contact lgkcourierapp@gmail.com immediately. We will delete the account and all associated data promptly.`,
    s11_h: '11. Record of Processing Activities (RoPA)',
    s11_b: `Under GDPR Article 30, LGK maintains an internal Record of Processing Activities available to UODO on request.

Processing activity | Legal basis | Retention
Account registration | Contract | Account + 30 days
Order processing | Contract | 5 years
GPS location (working sessions) | Consent | Not retained after session
Aggregate mileage | Contract / Legitimate interest | Account duration
Proof Photos | Contract / Legitimate interest | 3 years
Earnings payments | Contract / Legal obligation | 5 years
Audit logging | Legitimate interest / Legal obligation | 5 years
Performance profiling | Legitimate interest | Account duration
BRAMA Intel | Legitimate interest + Consent | 90 days active, 3 years archive
Anonymous session data | Legitimate interest | 30 days from last session`,
    s12_h: '12. Changes to This Policy',
    s12_b: `12.1 Material changes communicated by email at least 30 days before taking effect.
12.2 Updated policy published at lgk-business.vercel.app/privacy. Continued use after effective date constitutes acceptance.
12.3 For changes affecting legal basis or introducing new data categories: fresh consent sought where required by law.`,
    s13_h: '13. Contact and Complaints',
    s13_b_pre: 'Email: ',
    s13_b_post: `
Subject: "Data Protection — [your query]"
Response: within 30 days

Last updated: June 2026 · Version 1.1
LGK Holdings Sp. z o.o. (w organizacji) · Szczecin, Poland`,
    footer: 'L° LGK Holdings · Szczecin · lgkcourierapp@gmail.com',
  },
}

const EMAIL = 'lgkcourierapp@gmail.com'

const bodyStyle = {
  color: '#555',
  fontSize: 14,
  lineHeight: 1.8,
  whiteSpace: 'pre-line',
  margin: 0,
}

const linkStyle = {
  color: '#0A0A0A',
  fontWeight: 600,
  textDecoration: 'underline',
}

export default function PrivacyPage() {
  const [lang, setLang] = useState('pl')
  const s = STRINGS[lang]

  const sections = [
    { h: s.s1_h, b: s.s1_b },
    { h: s.s2_h, b: s.s2_b },
    { h: s.s3_h, b: s.s3_b },
    { h: s.s4_h, b: s.s4_b },
    { h: s.s5_h, b: s.s5_b },
    { h: s.s6_h, b: s.s6_b },
    { h: s.s7_h, b: s.s7_b },
    { h: s.s8_h, b: s.s8_b },
    { h: s.s9_h, b: s.s9_b },
    { h: s.s10_h, b: s.s10_b },
    { h: s.s11_h, b: s.s11_b },
    { h: s.s12_h, b: s.s12_b },
    {
      h: s.s13_h,
      raw: true,
      custom: (
        <p style={bodyStyle}>
          {s.s13_b_pre}
          <a href={`mailto:${EMAIL}`} style={linkStyle}>{EMAIL}</a>
          {s.s13_b_post}
        </p>
      ),
    },
  ]

  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: '#0A0A0A' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <span style={{ background: '#D4FF00', color: '#0A0A0A', fontWeight: 900, padding: '4px 10px', borderRadius: 20, fontSize: 14 }}>L°</span>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#0A0A0A' }}>LGK Business</span>
          </Link>
          <button
            onClick={() => setLang(l => l === 'pl' ? 'en' : 'pl')}
            style={{ background: 'transparent', border: '1px solid #E5E5E5', color: '#555', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}
          >
            {s.toggle}
          </button>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>{s.title}</h1>
        <p style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>{s.company}</p>
        <p style={{ color: '#888', fontSize: 13, marginBottom: 32 }}>{s.updated}</p>

        {/* Intro */}
        <div style={{ background: '#FAFAFA', border: '1px solid #E5E5E5', borderRadius: 8, padding: '14px 16px', marginBottom: 48 }}>
          <p style={{ fontSize: 13, color: '#333', lineHeight: 1.7, margin: 0 }}>{s.intro}</p>
        </div>

        {/* Sections */}
        {sections.map((sec, i) => (
          <div key={i} style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: '#0A0A0A' }}>{sec.h}</h2>
            {sec.raw ? sec.custom : <p style={bodyStyle}>{sec.b}</p>}
          </div>
        ))}

        {/* Footer */}
        <div style={{ borderTop: '1px solid #E5E5E5', paddingTop: 24, marginTop: 48, textAlign: 'center', color: '#888', fontSize: 12 }}>
          {s.footer}
        </div>
      </div>
    </div>
  )
}
