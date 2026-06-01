'use client'
import { useState } from 'react'
import Link from 'next/link'

const STRINGS = {
  pl: {
    toggle: 'EN',
    title: 'Regulamin świadczenia usług',
    company: 'LGK Holdings Sp. z o.o. (w organizacji)',
    updated: 'Wersja 1.1 — Czerwiec 2026',
    notice: 'Regulamin świadczenia usług stanowi prawnie wiążącą umowę między Tobą a LGK Holdings Sp. z o.o. (w organizacji). Rejestrując konto, pobierając aplikację LGK Courier lub składając zamówienie przez Portal LGK Business, potwierdzasz, że przeczytałeś, rozumiesz i akceptujesz niniejszy Regulamin w całości. Jeśli nie akceptujesz Regulaminu, nie możesz korzystać z Platformy.',
    s1_h: '1. Strony i Definicje',
    s1_b: `1.1 „LGK", „my", „nas", „nasz" oznacza LGK Holdings Sp. z o.o. (w organizacji), zarejestrowaną w Szczecinie, Polska. Kontakt: lgkcourierapp@gmail.com
1.2 „Klient Biznesowy" — firma lub osoba fizyczna korzystająca z Portalu LGK Business w celu składania zamówień na dostawy.
1.3 „Kurier" — niezależny zleceniobiorca korzystający z aplikacji LGK Courier do realizacji zamówień.
1.4 „Platforma" — Portal LGK Business, aplikacja LGK Courier oraz wszystkie powiązane API i systemy.
1.5 „Dostawa" — jednorazowy odbiór i transport towarów z Adresu Odbioru na Adres Dostawy w Obszarze Usług.
1.6 „BRAMA INTEL" — wspólnotowa baza danych wywiadowczych o dostępie do budynków, zawierająca kody bram, wskazówki parkingowe, informacje o dostępie do budynków i harmonogramy portierów.
1.7 „Zamówienie" — potwierdzone zlecenie dostawy złożone przez Portal Biznesowy.
1.8 „Zdjęcie z dowodem" — zdjęcie z lokalizacją GPS i datownikiem, wykonane przez Kuriera w miejscu dostawy jako dowód realizacji.
1.9 „Obszar Usług" — Szczecin, Polska i okolice. LGK może rozszerzyć lub ograniczyć Obszar Usług z rozsądnym wyprzedzeniem.
1.10 „Wykroczenie" — zachowanie naruszające niniejszy Regulamin, prawo polskie lub standardy zawodowe wymagane od uczestników Platformy.`,
    s2_h: '2. Charakter usługi i rola LGK',
    s2_b: `2.1 LGK działa jako technologiczny pośrednik. LGK nie jest przewoźnikiem, spedytorem ani firmą transportową w rozumieniu polskiego Prawa przewozowego (1984).
2.2 Kurierzy są niezależnymi zleceniobiorcami — nie są pracownikami, pełnomocnikami ani przedstawicielami LGK.
2.3 LGK nie gwarantuje dostępności Kurierów ani realizacji Zamówień.
2.4 Umowa dostawy jest zawarta między Klientem Biznesowym a Kurierem. LGK ułatwia tę relację, ale nie jest jej stroną.
2.5 Żadne postanowienie Regulaminu nie tworzy stosunku pracy, partnerstwa ani pełnomocnictwa między LGK a Kurierem.`,
    s3_h: '3. Rejestracja konta i kwalifikowalność',
    s3_b: `3.1 Musisz mieć ukończone 18 lat i być zdolny do zawierania umów zgodnie z prawem polskim.
3.2 Musisz podać rzetelne dane rejestracyjne. LGK zastrzega sobie prawo do weryfikacji tożsamości i statusu prawnego.
3.3 Kurierzy działający komercyjnie muszą podać numer NIP i potwierdzić legalne prawo do pracy w Polsce.
3.4 Jesteś odpowiedzialny za dane do logowania. Niezwłocznie powiadom lgkcourierapp@gmail.com w przypadku podejrzenia nieautoryzowanego dostępu.
3.5 Jedno konto na osobę lub podmiot. Tworzenie wielu kont w celu obejścia zawieszenia lub ograniczeń jest istotnym naruszeniem i podstawą do trwałego zablokowania.
3.6 LGK zastrzega sobie prawo do odmowy rejestracji bez podania przyczyny.
3.7 Dostęp anonimowy do Platformy jest dozwolony dla jednej sesji powiązanej z urządzeniem, nieprzekraczającej 30 dni. Po 30 dniach wymagana jest rejestracja, aby kontynuować korzystanie z Platformy. Wkłady do BRAMA INTEL dokonane podczas sesji anonimowych są utrzymywane w stanie oczekiwania i nie będą widoczne dla innych użytkowników do momentu rejestracji pełnego konta.`,
    s4_h: '4. Obowiązki Klienta Biznesowego',
    s4_b: `4.1 Składając Zamówienie, Klient Biznesowy oświadcza i gwarantuje, że:
a) Towary są legalnie dopuszczone do transportu na mocy prawa polskiego
b) Adresy odbioru i dostawy są dokładne i kompletne
c) Towary są odpowiednio zapakowane na potrzeby normalnej obsługi
d) Towary nie wymagają specjalistycznego traktowania, które nie zostało ujawnione przy zamawianiu
e) Odbiorca jest świadomy dostawy i dostępny do jej odbioru
f) Klient Biznesowy poinformował odbiorcę, że jego dostawa jest obsługiwana przez LGK i że w miejscu dostawy zostanie wykonane Zdjęcie z dowodem GPS

4.2 TOWARY ZABRONIONE — podstawa do natychmiastowego zawieszenia konta:
— Nielegalne lub kontrolowane substancje na mocy polskiego prawa karnego
— Broń, broń palna, amunicja lub materiały wybuchowe
— Materiały niebezpieczne podlegające przepisom ADR
— Żywe zwierzęta
— Szczątki ludzkie lub próbki biologiczne
— Towary podrobione lub naruszające prawa własności intelektualnej
— Gotówka powyżej 10 000 PLN na dostawę
— Przedmioty wymagające specjalnej licencji przewoźnika

4.3 Klient Biznesowy ponosi odpowiedzialność za wszelkie straty, szkody, kary lub konsekwencje prawne wynikające z towarów zabronionych lub nieujawnionych.

4.4 Klientom Biznesowym nie wolno kontaktować się z Kurierami poza Platformą w sprawach związanych z dostawą ani angażować Kurierów do pracy poza Platformą w trakcie rejestracji i przez 12 miesięcy od zakończenia korzystania z konta.`,
    s5_h: '5. Obowiązki Kuriera i standardy postępowania',
    s5_b: `5.1 Kurierzy potwierdzają i gwarantują, że:
a) Posiadają legalne prawo do pracy w Polsce
b) Działają jako niezależni zleceniobiorcy, nie jako pracownicy LGK
c) Są wyłącznie odpowiedzialni za własne zobowiązania podatkowe i składki ZUS
d) Posiadają ważne ubezpieczenie od odpowiedzialności cywilnej
e) Posiadają ważne prawo jazdy i ubezpieczenie OC pojazdu (pojazdy silnikowe)
f) Są fizycznie zdolni do wykonywania przyjętych dostaw
g) Mogą swobodnie przyjmować lub odmawiać Zamówień według własnego uznania i nie są karani przez LGK za odmowę Zamówień

5.2 Podczas każdej sesji roboczej Kurierzy muszą:
a) Odbierać i dostarczać wyłącznie pod potwierdzone adresy na Platformie
b) Wykonać Zdjęcie z dowodem GPS przed oznaczeniem każdej dostawy jako zrealizowanej
c) Obsługiwać towary z należytą zawodową starannością
d) Niezwłocznie skontaktować się z Klientem Biznesowym, gdy dostawy nie można zrealizować
e) Zgłosić wypadki drogowe, uszkodzenia lub kwestie bezpieczeństwa do LGK w ciągu 2 godzin

5.3 Kurierzy nie mogą:
a) Dostarczać pod inny adres niż potwierdzony na Platformie bez wyraźnej pisemnej instrukcji przez Platformę
b) Otwierać, manipulować ani sprawdzać zawartości przesyłek
c) Przyjmować płatności za dostawę poza Platformą
d) Udostępniać kodów BRAMA INTEL poza Platformą
e) Eksploatować niesprawnego, nieubezpieczonego lub nielegalnie użytkowanego pojazdu
f) Korzystać z Platformy pod wpływem alkoholu, narkotyków lub innych substancji upośledzających zdolność do pracy
g) Podawać się za pracowników lub pełnomocników LGK

5.4 WYKROCZENIA — podstawa do natychmiastowego zawieszenia i trwałego usunięcia:
a) Kradzież, oszustwo lub nieuczciwość w jakiejkolwiek formie
b) Fizyczna lub słowna agresja wobec odbiorców, Klientów Biznesowych lub personelu LGK
c) Nękanie, dyskryminacja lub groźby
d) Fałszowanie Zdjęć z dowodem, potwierdzeń dostawy lub jakichkolwiek danych na Platformie
e) Udostępnianie danych logowania osobom trzecim
f) Zakładanie wielu kont lub prowadzenie kont w imieniu innych osób
g) Działania przynoszące LGK ujmę
h) Odpowiednie wyroki skazujące w trakcie okresu rejestracji
i) Podanie fałszywych informacji podczas rejestracji lub w późniejszym czasie
j) Systematyczne niespełnianie standardów dostawy skutkujące trwałymi negatywnymi opiniami klientów

5.5 LGK prowadzi system ocen i monitorowania wyników. Kurierzy konsekwentnie niespełniający standardów platformy mogą mieć zmniejszony priorytet zadań, zostać zawieszeni lub usunięci.

5.6 KARMA I DANE INTEL — Wyniki Karma, wkłady do BRAMA INTEL, status milestoneów i reputacja na platformie są własnością Platformy. Nie można ich przenosić, sprzedawać ani dochodzić po rozwiązaniu umowy. Wkłady do BRAMA INTEL są anonimizowane po usunięciu konta, ale pozostają we wspólnotowej bazie danych.`,
    s6_h: '6. Ceny, płatności i fakturowanie',
    s6_b: `6.1 Cennik dostępny na lgk-business.vercel.app. LGK może zmieniać ceny z 14-dniowym pisemnym wyprzedzeniem.
6.2 Poziomy subskrypcji (Starter, Business, Fleet) zgodnie z publikacją w momencie rejestracji. Zmiany poziomu wymagają 30-dniowego wyprzedzenia.
6.3 Przetwarzanie płatności i wypłaty wynagrodzenia obsługiwane są przez licencjonowane instytucje finansowe i dostawców usług płatniczych. LGK nie przechowuje numerów kart, danych IBAN ani danych płatniczych na własnych serwerach.
6.4 Wszystkie ceny są cenami netto (bez 23% VAT). Faktury VAT wystawiane na żądanie.
6.5 Wynagrodzenia Kurierów wypłacane w każdy poniedziałek. LGK może:
a) Wstrzymać płatność za dostawy będące przedmiotem aktywnego dochodzenia
b) Potrącić potwierdzone straty spowodowane bezpośrednio przez naruszenie przez Kuriera
c) Zawiesić wypłaty wynagrodzenia dla zawieszonych lub badanych kont
6.6 Kurierzy są wyłącznie odpowiedzialni za deklarowanie i płacenie podatku dochodowego oraz składek ZUS od wszystkich zarobków na Platformie.
6.7 Prowizja platformy LGK jest odliczana od kwoty brutto opłaty za dostawę przed wypłatą Kurierowi.`,
    s7_h: '7. Ograniczenie odpowiedzialności',
    s7_b: `7.1 MAKSYMALNA ODPOWIEDZIALNOŚĆ FINANSOWA LGK wobec każdej ze stron jest ograniczona do:
a) Na jedną Dostawę: 500 PLN
b) Łącznie na Klienta Biznesowego w miesiącu kalendarzowym: 5 000 PLN
c) Łącznie na Kuriera w miesiącu kalendarzowym: 2 000 PLN

7.2 LGK nie ponosi odpowiedzialności za:
a) Utratę działalności, przychodów, zysku ani żadne pośrednie straty
b) Uszkodzenia wynikające z nieodpowiedniego opakowania
c) Opóźnienia spowodowane błędnymi adresami, niedostępnymi lokalizacjami lub nieobecnymi odbiorcami
d) Straty wynikające z towarów zabronionych
e) Dokładność lub niezawodność kodów BRAMA INTEL
f) Działania lub zaniechania Kuriera jako niezależnego zleceniobiorcy
g) Przerwy w działaniu Platformy, gdy podjęto rozsądne środki ostrożności
h) Zdarzenia siły wyższej

7.3 Nic w Regulaminie nie ogranicza odpowiedzialności za śmierć lub obrażenia ciała wynikające z zaniedbania, oszustwa ani żadnej odpowiedzialności, której nie można wyłączyć na mocy prawa polskiego.`,
    s8_h: '8. Procedura reklamacyjna',
    s8_b: `8.1 Maksymalna odpowiedzialność finansowa LGK na dostawę wynosi 500 PLN. Jest to umowny limit odpowiedzialności, a nie produkt ubezpieczeniowy. Klienci Biznesowi wymagający ubezpieczenia dla przedmiotów o wyższej wartości muszą zapewnić własne ubezpieczenie handlowe.
8.2 Aby złożyć reklamację:
a) Wyślij zgłoszenie na lgkcourierapp@gmail.com w ciągu 24 godzin od planowanego czasu dostawy
b) Podaj fotograficzne dowody uszkodzenia
c) Zachowaj uszkodzone towary do kontroli przez 14 dni
8.3 Reklamacja zostaje odrzucona, gdy: towary były nieodpowiednio zapakowane, towary były zabronione, Zdjęcie z dowodem potwierdza prawidłową dostawę, reklamacja złożona po upływie 24-godzinnego okna, uszkodzenie wynika z charakteru nieujawnionych towarów.
8.4 Rozszerzone pokrycie dostępne na żądanie.`,
    s9_h: '9. BRAMA INTEL',
    s9_b: `9.1 BRAMA INTEL to system wspólnotowej analizy wywiadowczej tworzony dobrowolnie przez Kurierów.
9.2 Dokonując wkładu do Intel, Kurier:
a) Udziela LGK wieczystej, nieodwołalnej, bezpłatnej licencji na przechowywanie, weryfikację, wyświetlanie i udostępnianie tego Intel
b) Potwierdza, że Intel został uzyskany zgodnie z prawem
c) Przyjmuje do wiadomości, że Intel jest anonimizowany, ale nie usuwany po usunięciu konta
d) Potwierdza, że zgoda w aplikacji została wyrażona w momencie przesyłania
9.3 LGK nie udziela żadnej gwarancji co do dokładności lub niezawodności BRAMA INTEL. Używanie odbywa się na własne ryzyko Kuriera.
9.4 BRAMA INTEL jest własnością Platformy. Nie może być wydobywany, eksportowany, udostępniany, sprzedawany ani ujawniany poza Platformą.
9.5 Kody wygasają automatycznie po 90 dniach.
9.6 Każdy Kurier używający kodów dostępu do budynków w celach innych niż profesjonalna dostawa — w tym do nieautoryzowanego wejścia do budynku — narusza polskie prawo karne (art. 193 Kodeksu Karnego — naruszenie miru domowego) i zostanie trwale usunięty z Platformy. LGK będzie w pełni współpracować z organami ścigania w każdym takim dochodzeniu.`,
    s10_h: '10. Zawieszenie i rozwiązanie umowy',
    s10_b: `10.1 LGK może natychmiastowo zawiesić konto bez powiadomienia w przypadku:
a) Uzasadnionego podejrzenia oszustwa, kradzieży lub działalności przestępczej
b) Aktywnego sporu lub dochodzenia dotyczącego konta
c) Naruszenia stwarzającego ryzyko dla innych użytkowników Platformy lub LGK
d) Wzorca poważnych skarg (Kurierzy)
e) Zaległych nieopłaconych faktur (Klienci Biznesowi)
f) Wniosku organów ścigania wymagającego zawieszenia
10.2 Zawieszone konta powiadamiane emailem. Dochodzenie zakończone w ciągu 14 dni roboczych, chyba że sprawa przekazana organom ścigania.
10.3 Po dochodzeniu LGK może: przywrócić konto, trwale je zakończyć lub przekazać sprawę polskim organom ścigania.
10.4 TRWAŁE ZAKOŃCZENIE w przypadku:
a) Potwierdzonego Wykroczenia z punktu 5.4
b) Otrzymania odpowiedniego wyroku skazującego
c) Potwierdzenia fałszywych danych rejestracyjnych
d) Potwierdzonego systematycznego oszustwa lub nadużycia Platformy
e) Wielokrotnego przesyłania zabronionych towarów przez Klienta Biznesowego
f) Wymogu prawnego lub nakazu sądowego
10.5 Po trwałym zakończeniu: wszystkie dostępy do Platformy natychmiastowo odwołane; oczekujące wynagrodzenia mogą być wstrzymane; posiadacz konta nie może ponownie się zarejestrować bez wyraźnej pisemnej zgody LGK.
10.6 DOBROWOLNE ZAKOŃCZENIE — przez Ustawienia → Usuń Konto. 4-etapowy proces potwierdzenia. Dane przetwarzane zgodnie z Polityką Prywatności.
10.7 ODWOŁANIE — pisemne odwołanie na lgkcourierapp@gmail.com w ciągu 14 dni. LGK przekaże pisemne uzasadnienie wyniku odwołania w ciągu 14 dni roboczych. Decyzja LGK w sprawie odwołania jest ostateczna w ramach Platformy.`,
    s11_h: '11. Ochrona danych',
    s11_b: `11.1 Dane przetwarzane zgodnie z RODO (UE 2016/679) i polską Ustawą o ochronie danych osobowych (2018). Pełne szczegóły na lgk-business.vercel.app/privacy.
11.2 Dane GPS lokalizacji przetwarzane wyłącznie podczas aktywnych sesji roboczych. Nie przechowywane historycznie po zakończeniu sesji. Wyraźna zgoda uzyskana przed pierwszą sesją roboczą.
11.3 Klienci Biznesowi przesyłający dane osobowe odbiorców są administratorami tych danych. LGK przetwarza je jako podmiot przetwarzający zgodnie z art. 28 RODO. Umowa Powierzenia dostępna na żądanie i musi zostać zawarta przed komercyjnym użytkowaniem na dużą skalę.
11.4 Zdjęcia z dowodem przetwarzane wyłącznie do weryfikacji dostawy i rozstrzygania sporów.`,
    s12_h: '12. Własność intelektualna',
    s12_b: `12.1 Całe IP Platformy — oprogramowanie, design, branding, algorytmy, baza danych BRAMA INTEL — jest wyłączną własnością LGK Holdings Sp. z o.o.
12.2 Otrzymujesz ograniczoną, osobistą, niewyłączną, nieprzekazywalną, odwołalną licencję na korzystanie z Platformy zgodnie z jej przeznaczeniem. Wygasa natychmiastowo po zakończeniu konta.
12.3 Nie możesz kopiować, dokonywać inżynierii wstecznej, dekompilować, dystrybuować ani tworzyć dzieł pochodnych z żadnego elementu Platformy.`,
    s13_h: '13. Dostępność Platformy',
    s13_b: `13.1 LGK działa na zasadzie dołożenia wszelkich starań. Brak gwarancji nieprzerwanej dostępności.
13.2 Istotne zmiany funkcji komunikowane z rozsądnym wyprzedzeniem.
13.3 Zaktualizowany Regulamin opublikowany na Platformie i komunikowany emailem. Dalsze korzystanie po dacie wejścia w życie oznacza akceptację.
13.4 Zmiany istotnie wpływające na zarobki Kurierów: 60 dni wyprzedzenia.`,
    s14_h: '14. Google Play',
    s14_b: `14.1 Google LLC nie jest stroną niniejszego Regulaminu i nie ma żadnych zobowiązań wobec Kurierów w zakresie aplikacji LGK Courier. Warunki Google Play regulują relację między Tobą a Google LLC oddzielnie.`,
    s15_h: '15. Zakazane sposoby użytkowania',
    s15_b: `Nie możesz korzystać z Platformy w celu:
a) Prowadzenia działalności nielegalnej na mocy prawa polskiego lub unijnego
b) Przesyłania złośliwego kodu lub zakłócania infrastruktury Platformy
c) Próby nieautoryzowanego dostępu do systemów Platformy
d) Pobierania, zbierania lub systematycznego gromadzenia danych z Platformy
e) Podszywania się pod jakąkolwiek osobę lub podmiot
f) Ułatwiania prania pieniędzy, uchylania się od podatków lub przestępczości finansowej`,
    s16_h: '16. Rozwiązywanie sporów',
    s16_b: `16.1 Bezpośrednie rozwiązanie w pierwszej kolejności: lgkcourierapp@gmail.com — LGK odpowiada w ciągu 5 dni roboczych.
16.2 Nierozwiązane po 30 dniach: właściwość sądów dla Szczecina, Polska.
16.3 Regulowane przez prawo polskie. Konwencja wiedeńska (CISG) nie ma zastosowania.
16.4 Konsumenci UE mogą korzystać z platformy ODR: ec.europa.eu/consumers/odr
16.5 LGK może w każdym czasie dochodzić pilnych środków tymczasowych przed właściwymi sądami.`,
    s17_h: '17. Postanowienia ogólne',
    s17_b_pre: `17.1 ROZDZIELNOŚĆ — nieważne postanowienia zostają oddzielone; reszta obowiązuje.
17.2 ZRZECZENIE — brak egzekwowania nie stanowi zrzeczenia się przyszłego egzekwowania.
17.3 CAŁOŚĆ UMOWY — niniejszy Regulamin, Polityka Prywatności oraz ewentualna Umowa Powierzenia stanowią pełną umowę.
17.4 CESJA — LGK może dokonać cesji przy restrukturyzacji korporacyjnej. Użytkownicy nie mogą dokonać cesji bez pisemnej zgody.
17.5 JĘZYK — opublikowano po angielsku i polsku. Wersja polska jest obowiązująca w sporach na mocy prawa polskiego.
17.6 KONTAKT — powiadomienia prawne na `,
    s17_b_post: '. Uznane za doręczone następnego dnia roboczego.',
    footer: 'Ostatnia aktualizacja: Czerwiec 2026 · Wersja 1.1\nLGK Holdings Sp. z o.o. (w organizacji) · Szczecin, Polska',
  },
  en: {
    toggle: 'PL',
    title: 'Terms of Service',
    company: 'LGK Holdings Sp. z o.o. (w organizacji)',
    updated: 'Version 1.1 — June 2026',
    notice: 'These Terms of Service form a legally binding agreement between you and LGK Holdings Sp. z o.o. (w organizacji). By registering an account, downloading the LGK Courier app, or placing an order through the LGK Business Portal, you confirm that you have read, understood, and accept these Terms in full. If you do not accept these Terms you must not use the Platform.',
    s1_h: '1. Parties and Definitions',
    s1_b: `1.1 "LGK", "we", "us", "our" means LGK Holdings Sp. z o.o. (w organizacji), registered in Szczecin, Poland.
Contact: lgkcourierapp@gmail.com
1.2 "Business Client" — company or individual using the LGK Business Portal to place delivery orders.
1.3 "Courier" — independent contractor using the LGK Courier app to fulfil delivery orders.
1.4 "Platform" — LGK Business Portal, LGK Courier app, and all associated APIs and systems.
1.5 "Delivery" — single collection and transportation of goods from Pickup Address to Delivery Address within the Service Area.
1.6 "BRAMA INTEL" — community-sourced building access intelligence database including gate codes, parking tips, building access notes, and warden schedule information.
1.7 "Order" — confirmed delivery request submitted through the Business Portal.
1.8 "Proof Photo" — GPS-timestamped photograph taken by a Courier at point of delivery as evidence of completion.
1.9 "Service Area" — Szczecin, Poland and surrounding area. LGK may extend or reduce the Service Area with reasonable notice.
1.10 "Misconduct" — any behaviour violating these Terms, Polish law, or professional standards expected of Platform participants.`,
    s2_h: "2. Nature of the Service and LGK's Role",
    s2_b: `2.1 LGK operates as a technology intermediary. LGK is not a carrier, freight forwarder, or transport company within the meaning of Polish transport law (Prawo przewozowe, 1984).
2.2 Couriers are independent contractors — not employees, agents, or representatives of LGK.
2.3 LGK does not guarantee Courier availability or Order completion.
2.4 The delivery contract is between the Business Client and the Courier. LGK facilitates this relationship but is not a party to it.
2.5 Nothing in these Terms creates an employment relationship, partnership, or agency between LGK and any Courier.`,
    s3_h: '3. Account Registration and Eligibility',
    s3_b: `3.1 You must be at least 18 years of age and legally capable of entering contracts under Polish law.
3.2 You must provide accurate registration information. LGK reserves the right to verify identity and legal status.
3.3 Couriers operating commercially must provide their NIP number and confirm their legal right to work in Poland.
3.4 You are responsible for your account credentials. Notify lgkcourierapp@gmail.com immediately if you suspect unauthorised access.
3.5 One account per person or entity. Creating multiple accounts to circumvent suspension or restrictions is a material breach and grounds for permanent ban.
3.6 LGK reserves the right to decline registration without reasons.
3.7 Anonymous access to the Platform is permitted for a single device-bound session not exceeding 30 days. After 30 days, registration is required to continue using the Platform. BRAMA INTEL contributions made during anonymous sessions are held in pending status and will not become visible to other users until the Courier registers a full account.`,
    s4_h: '4. Business Client Obligations',
    s4_b: `4.1 By placing an Order, the Business Client warrants that:
a) Goods are legally permitted for transport under Polish law
b) Pickup and delivery addresses are accurate and complete
c) Goods are adequately packaged for normal handling
d) Goods do not require specialist handling not disclosed at ordering
e) The recipient is aware of and available for the delivery
f) The Business Client has informed the recipient that their delivery is being handled by LGK and that a GPS Proof Photo will be taken at the point of delivery

4.2 PROHIBITED GOODS — grounds for immediate account suspension:
— Illegal substances or controlled substances under Polish criminal law
— Weapons, firearms, ammunition, or explosives
— Hazardous materials under ADR regulations
— Live animals of any kind
— Human remains or biological specimens
— Counterfeit or IP-infringing goods
— Cash exceeding PLN 10,000 per delivery
— Any item requiring a specialist carrier licence

4.3 The Business Client is liable for all loss, damage, fines, or legal consequences arising from prohibited or undisclosed goods.

4.4 Business Clients must not contact Couriers outside the Platform for delivery-related purposes, and must not engage Couriers for off-platform work during registration and for 12 months following account termination.`,
    s5_h: '5. Courier Obligations and Standards of Conduct',
    s5_b: `5.1 Couriers confirm and warrant that they:
a) Are legally entitled to work in Poland
b) Operate as an independent contractor, not an LGK employee
c) Are solely responsible for their own tax obligations and ZUS
d) Hold valid personal liability insurance
e) Hold valid driving licence and vehicle OC insurance (motor vehicles)
f) Are physically capable of performing accepted deliveries
g) Are free to accept or decline any Order at their discretion and are not penalised by LGK for declining Orders

5.2 During each working session, Couriers must:
a) Collect and deliver only to confirmed Platform addresses
b) Take a GPS-timestamped Proof Photo before marking each delivery complete
c) Handle goods with reasonable professional care
d) Contact the Business Client promptly if delivery cannot be completed
e) Report traffic incidents, damage, or safety concerns to LGK within 2 hours

5.3 Couriers must never:
a) Deliver to an address different from the confirmed Platform address without explicit written instruction via the Platform
b) Open, tamper with, or inspect package contents
c) Accept payment for a delivery outside the Platform
d) Share BRAMA INTEL codes outside the Platform
e) Operate an unroadworthy, uninsured, or illegally operated vehicle
f) Operate the Platform while under the influence of alcohol, drugs, or any impairing substance
g) Represent themselves as LGK employees or agents

5.4 MISCONDUCT — grounds for immediate suspension and permanent removal:
a) Theft, fraud, or dishonesty in any form
b) Physical or verbal abuse of recipients, Business Clients, or LGK staff
c) Harassment, discrimination, or threatening behaviour
d) Falsifying Proof Photos, delivery confirmations, or any Platform data
e) Sharing account credentials with any third party
f) Operating multiple accounts or accounts on behalf of others
g) Any activity bringing LGK into disrepute
h) Relevant criminal conviction during registration period
i) Providing false information during registration or at any time
j) Systematic failure to meet delivery standards resulting in sustained negative client feedback

5.5 LGK operates a rating and performance monitoring system. Couriers consistently below platform standards may face reduced job prioritisation, suspension, or removal.

5.6 KARMA AND INTEL DATA — Karma scores, BRAMA INTEL contributions, milestone status, and platform reputation are properties of the Platform. They cannot be transferred, sold, or claimed upon termination. Contributed BRAMA INTEL is anonymised on account deletion but remains in the community database.`,
    s6_h: '6. Pricing, Payment, and Invoicing',
    s6_b: `6.1 Pricing published at lgk-business.vercel.app. LGK may amend pricing with 14 days' written notice.
6.2 Subscription tiers (Starter, Business, Fleet) as published at registration. Tier changes require 30 days' notice.
6.3 Payment processing and earnings disbursement are handled by licensed financial institutions and payment service providers. LGK does not store card numbers, IBAN details, or payment credentials on its own servers.
6.4 All prices are net of Polish VAT (23%). VAT invoices issued on request.
6.5 Courier earnings are paid weekly every Monday. LGK may:
a) Withhold payment for deliveries under active dispute investigation
b) Deduct confirmed losses directly caused by Courier breach
c) Suspend earnings payments to suspended or investigated accounts
6.6 Couriers are solely responsible for declaring and paying income tax and ZUS contributions on all Platform earnings.
6.7 LGK's platform commission is deducted from gross delivery fee before Courier payout.`,
    s7_h: '7. Limitation of Liability',
    s7_b: `7.1 LGK'S MAXIMUM FINANCIAL LIABILITY per party is limited to:
a) Per individual Delivery: PLN 500
b) Aggregate per Business Client per calendar month: PLN 5,000
c) Aggregate per Courier per calendar month: PLN 2,000

7.2 LGK accepts no liability for:
a) Loss of business, revenue, profit, or any indirect loss
b) Damage where adequate packaging was not provided
c) Delays from incorrect addresses, inaccessible locations, or unavailable recipients
d) Loss from prohibited goods
e) Accuracy or reliability of BRAMA INTEL codes
f) Any act or omission of a Courier as independent contractor
g) Platform downtime where reasonable precautions were taken
h) Force majeure events

7.3 Nothing limits liability for death or personal injury from negligence, fraud, or any liability that cannot be excluded under Polish law.`,
    s8_h: '8. Claims Procedure',
    s8_b: `8.1 LGK's maximum financial liability per delivery is PLN 500. This is a contractual liability cap, not a regulated insurance product. Business Clients requiring insurance for higher-value items must arrange their own commercial insurance.
8.2 To make a claim:
a) Submit to lgkcourierapp@gmail.com within 24 hours of scheduled delivery time
b) Provide photographic evidence of damage
c) Retain damaged goods for inspection for 14 days
8.3 Claims declined where: goods inadequately packaged, goods prohibited, Proof Photo confirms correct delivery, claim submitted outside 24-hour window, damage from inherent nature of undeclared goods.
8.4 Enhanced coverage available on request.`,
    s9_h: '9. BRAMA INTEL',
    s9_b: `9.1 BRAMA INTEL is a community intelligence system contributed voluntarily by Couriers.
9.2 By contributing Intel, the Courier:
a) Grants LGK a perpetual, irrevocable, royalty-free licence to store, verify, display, and share that Intel
b) Confirms the Intel was lawfully obtained
c) Acknowledges Intel is anonymised but not deleted on account deletion
d) Confirms in-app consent was provided at submission
9.3 LGK makes no warranty as to accuracy or reliability of BRAMA INTEL. Use is at Courier's own risk.
9.4 BRAMA INTEL is proprietary to the Platform. It may not be extracted, exported, shared, sold, or disclosed outside the Platform.
9.5 Codes expire automatically after 90 days.
9.6 Any Courier using building access codes for purposes other than professional delivery — including unauthorised building entry — is in breach of Polish criminal law (Article 193 Kodeks Karny — naruszenie miru domowego) and will be permanently removed from the Platform. LGK will cooperate fully with law enforcement in any such investigation.`,
    s10_h: '10. Suspension and Termination',
    s10_b: `10.1 LGK may immediately suspend any account without notice where:
a) Reasonable suspicion of fraud, theft, or criminal activity
b) Active dispute or investigation involving the account
c) Breach posing risk to other Platform users or LGK
d) Pattern of serious complaints (Couriers)
e) Outstanding unpaid invoices (Business Clients)
f) Law enforcement request requiring suspension
10.2 Suspended accounts notified by email. Investigation concluded within 14 business days unless referred to law enforcement.
10.3 Following investigation LGK may: reinstate, permanently terminate, or refer to Polish law enforcement.
10.4 PERMANENT TERMINATION where:
a) Misconduct in Section 5.4 confirmed
b) Relevant criminal conviction received
c) False registration information confirmed
d) Systematic fraud or Platform abuse confirmed
e) Business Client repeatedly submits prohibited goods
f) Required by law or court order
10.5 Upon permanent termination: all Platform access immediately revoked; pending earnings may be withheld; account holder may not re-register without LGK's explicit written consent.
10.6 VOLUNTARY TERMINATION — via Settings → Delete Account. 4-step confirmation process. Data processed per Privacy Policy.
10.7 APPEAL — written appeal to lgkcourierapp@gmail.com within 14 days. LGK will provide written reasons for appeal outcome within 14 business days. LGK's appeal decision is final within the Platform.`,
    s11_h: '11. Data Protection',
    s11_b: `11.1 Data processed per GDPR (EU 2016/679) and Polish Act on Personal Data Protection (2018). Full details at lgk-business.vercel.app/privacy.
11.2 GPS location data processed during active working sessions only. Not stored historically after session completion. Explicit consent obtained before first working session.
11.3 Business Clients submitting recipient personal data are data controllers for that data. LGK processes it as data processor under Article 28 GDPR. A Data Processing Agreement (Umowa Powierzenia) is available on request and must be executed before commercial volume use.
11.4 Proof Photos processed solely for delivery verification and dispute resolution.`,
    s12_h: '12. Intellectual Property',
    s12_b: `12.1 All Platform IP — software, design, branding, algorithms, BRAMA INTEL database — is the exclusive property of LGK Holdings Sp. z o.o.
12.2 You receive a limited, personal, non-exclusive, non-transferable, revocable licence to use the Platform for its intended purpose. Terminates immediately on account termination.
12.3 You must not copy, reverse engineer, decompile, distribute, or create derivative works from any Platform element.`,
    s13_h: '13. Platform Availability',
    s13_b: `13.1 LGK operates on a best-efforts basis. No guarantee of uninterrupted availability.
13.2 Material feature changes communicated with reasonable notice.
13.3 Updated Terms published on Platform and communicated by email. Continued use after effective date constitutes acceptance.
13.4 Changes materially affecting Courier earnings: 60 days' notice.`,
    s14_h: '14. Google Play',
    s14_b: `14.1 Google LLC is not a party to these Terms and has no obligations to Couriers regarding the LGK Courier app. Google Play's terms govern the relationship between you and Google LLC separately.`,
    s15_h: '15. Prohibited Uses',
    s15_b: `You must not use the Platform to:
a) Engage in unlawful activity under Polish or EU law
b) Transmit malicious code or disrupt Platform infrastructure
c) Attempt unauthorised access to any Platform system
d) Scrape, harvest, or systematically collect Platform data
e) Impersonate any person or entity
f) Facilitate money laundering, tax evasion, or financial crime`,
    s16_h: '16. Dispute Resolution',
    s16_b: `16.1 Direct resolution first: lgkcourierapp@gmail.com — LGK responds within 5 business days.
16.2 Unresolved after 30 days: jurisdiction of courts competent for Szczecin, Poland.
16.3 Governed by Polish law. CISG does not apply.
16.4 EU consumers may use the ODR platform: ec.europa.eu/consumers/odr
16.5 LGK may seek urgent injunctive relief from competent courts at any time.`,
    s17_h: '17. General Provisions',
    s17_b_pre: `17.1 SEVERABILITY — invalid provisions severed; remainder continues.
17.2 WAIVER — failure to enforce does not waive future enforcement.
17.3 ENTIRE AGREEMENT — these Terms, Privacy Policy, and any DPA constitute the full agreement.
17.4 ASSIGNMENT — LGK may assign on corporate restructuring. Users may not assign without written consent.
17.5 LANGUAGE — published in English and Polish. Polish version prevails for disputes under Polish law.
17.6 CONTACT — legal notices to `,
    s17_b_post: '. Deemed received next business day.',
    footer: 'Last updated: June 2026 · Version 1.1\nLGK Holdings Sp. z o.o. (w organizacji) · Szczecin, Poland',
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

export default function TermsPage() {
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
    { h: s.s13_h, b: s.s13_b },
    { h: s.s14_h, b: s.s14_b },
    { h: s.s15_h, b: s.s15_b },
    { h: s.s16_h, b: s.s16_b },
    {
      h: s.s17_h,
      raw: true,
      custom: (
        <p style={bodyStyle}>
          {s.s17_b_pre}
          <a href={`mailto:${EMAIL}`} style={linkStyle}>{EMAIL}</a>
          {s.s17_b_post}
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

        {/* Important notice */}
        <div style={{ background: '#FAFAFA', border: '1px solid #E5E5E5', borderRadius: 8, padding: '14px 16px', marginBottom: 48 }}>
          <p style={{ fontSize: 13, color: '#333', lineHeight: 1.7, margin: 0 }}>{s.notice}</p>
        </div>

        {/* Sections */}
        {sections.map((sec, i) => (
          <div key={i} style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: '#0A0A0A' }}>{sec.h}</h2>
            {sec.raw ? sec.custom : <p style={bodyStyle}>{sec.b}</p>}
          </div>
        ))}

        {/* Footer */}
        <div style={{ borderTop: '1px solid #E5E5E5', paddingTop: 24, marginTop: 48, textAlign: 'center', color: '#888', fontSize: 12, whiteSpace: 'pre-line' }}>
          {s.footer}
        </div>
      </div>
    </div>
  )
}
