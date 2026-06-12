'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { resolveLang, SUPPORTED_LANGS } from '@/lib/lang';

const AppContext = createContext({ t: k => k, lang: 'pl', toggleLang: () => {}, colors: {} });

export const TRANSLATIONS = {
  en: {
    // Nav & layout
    dashboard: 'Dashboard', newOrder: 'New Order', settings: 'Settings', logOut: 'Log Out',
    poweredBy: 'Powered by LGK Courier',
    // Dashboard
    activeDeliveries: 'Active Deliveries', pendingOrders: 'Pending Orders', completedToday: 'Completed Today',
    orderHistory: 'Order History', track: 'Track', reorder: 'Reorder', viewProof: 'View Proof',
    viewDetails: 'View Details',
    noActive: 'No active deliveries', noPending: 'No pending orders', noCompleted: 'No completed deliveries today',
    searchOrders: 'Search orders...', allOrders: 'All Orders', thisMonth: 'This Month',
    totalSpent: 'Total Spent', avgDelivery: 'Avg Delivery',
    loading: 'Loading...', refresh: '⟳ Refresh', updated: 'Updated', autoRefreshNote: 'auto-refreshes every 30s',
    // Order card
    from: 'FROM', to: 'TO', deliveredAt: 'Delivered at', eta: 'ETA',
    // Status labels
    status_awaiting_payment: 'Awaiting Payment', status_pending: 'Pending', status_assigned: 'Assigned',
    status_collected: 'Collected', status_in_transit: 'In Transit', status_delivered: 'Delivered', status_cancelled: 'Cancelled',
    // Settings
    companyInfo: 'Company Information', billing: 'Billing', notifications: 'Notifications',
    saveChanges: 'Save Changes', deleteAccount: 'Delete Account', saving: 'Saving...', saved: 'Saved ✓',
    manualInvoice: 'Payment method: Manual invoice', stripeComingSoon: 'Stripe integration coming soon',
    demoData: 'Demo Data', demoDescription: 'Seed mock orders to preview the dashboard and proof of delivery',
    seedButton: 'Seed 3 Mock Orders', dangerZone: 'Danger Zone',
    dangerDescription: 'Permanently delete your account and all data. Cannot be undone.',
    // Delete account modal
    deleteModalTitle: 'Delete your account',
    deleteModalSubtitle: 'This action is permanent and cannot be undone',
    deleteModalWillDelete: 'The following will be permanently deleted:',
    deleteItem1: 'Your account and login credentials',
    deleteItem2: 'Your company profile and settings',
    deleteItem3: 'All orders and delivery history',
    deleteItem4: 'All GPS proof photos',
    deleteItem5: 'Your saved addresses',
    deleteItem6: 'All invoices and billing records',
    cancelKeepAccount: 'Cancel — keep my account',
    continueDelete: 'Continue',
    confirmDeletion: 'Confirm deletion',
    typeDeletePrompt: 'Type DELETE to permanently delete your account.',
    typeDeleteHere: 'Type DELETE here',
    cancel: 'Cancel',
    deleteMyAccount: 'Delete my account',
    deletingAccount: 'Deleting your account...',
    doNotClose: 'Please do not close this window.',
    deleteError: 'Something went wrong. Contact lgkcourierapp@gmail.com',
    language: 'Language', theme: 'Theme', dark: 'Dark', light: 'Light',
    savedAddresses: 'Saved Addresses', noSavedAddresses: 'No saved addresses yet. They will appear here after your first order.',
    setDefault: 'Set default', delete: 'Delete',
    // Order form
    placingOrder: 'Placing...', placeOrder: 'Place Order', pickup: 'Pickup', delivery: 'Delivery',
    package: 'Package', options: 'Options', priceBreakdown: 'Price Breakdown', total: 'Total',
    insurance: 'Package Insurance', insuranceNote: 'Covers loss or damage up to 500 PLN',
    fragile: 'Fragile package', asap: 'ASAP (1-2 hours)', sameDay: 'Same day (by 6pm)', scheduled: 'Scheduled',
    weight: 'Weight', timeWindow: 'Time Window', whatsappUpdates: 'WhatsApp delivery updates',
    sameAsPickup: 'Same as pickup address', contactName: 'Full name', contactPhone: 'Contact Phone',
    specialInstructions: 'Special instructions (optional)', deliveryNotes: 'Delivery Notes',
    accessCode: 'Gate code / access instructions (optional)', dimensions: 'Dimensions (optional)',
    distanceLabel: 'Distance', addOns: 'Add-ons', cityRate: 'City rate', timeWindowLine: 'Time window',
    shipmentProtection: 'Shipment protection included', shipmentProtectionNote: '(covers loss up to 500 PLN)',
    save: 'Save', skip: 'Skip',
    saveAddress: 'Save this address for next time?', saveRecipient: 'Save this recipient for next time?',
    labelPickup: 'Label (e.g. Our Warehouse)', labelRecipient: 'Label (e.g. Jan Kowalski)',
    pickupPlaceholder: 'Paste pickup address e.g. ul. Mickiewicza 15/3, 70-383 Szczecin',
    deliveryPlaceholder: 'Paste customer address e.g. Anna Nowak, ul. Piastów 22/4, 70-001 Szczecin',
    // Order detail — payment
    awaitingPaymentTitle: 'Payment required',
    awaitingPaymentDesc: 'Your order is reserved. Complete payment to assign a courier.',
    payNow: 'Pay now',
    alreadyPaid: 'Already paid? Payment confirmation can take 1-2 minutes. This page refreshes automatically.',
    contactIfNotConfirmed: 'if not confirmed after 5 minutes',
    paymentRequiredTitle: 'Payment required to confirm order',
    paymentReservedNote: 'Your order is reserved. Complete payment and a courier will be assigned within minutes.',
    oncePaymentReceived: 'Once payment is received your courier will be assigned automatically.',
    payViaRevolut: 'Pay via Revolut',
    payWithRevolut: 'Pay with Revolut',
    // Order detail — actions
    printLabel: 'Print Label',
    showToCourier: 'Show to Courier',
    reportProblem: 'Report a problem',
    reportTitle: 'Report a delivery issue',
    reportCategory: 'What happened?',
    reportDesc: 'Description (optional)',
    reportSubmit: 'Submit report',
    reportSuccess: 'Report submitted. We will contact you shortly.',
    invoiceDownload: 'Download Invoice',
    downloadInvoice: 'Download Invoice',
    // Order detail — timeline / proof
    timeline: 'Timeline', orderPlaced: 'Order placed', assignedCourier: 'Assigned to courier',
    collected: 'Package collected', inTransit: 'In transit', delivered: 'Delivered',
    proofOfDelivery: 'Proof of Delivery', downloadProof: 'Download Proof',
    reportProblemWA: 'Report Problem',
    orderPrefix: 'Order', qrCodes: 'QR Codes',
    // QR page
    qrLockedTitle: 'QR codes not available',
    qrLockedDesc: 'QR codes will be generated after payment is confirmed. Only scan a QR code on the label when status shows Pending.',
    blurredQRNote: 'QR code unlocks after payment is confirmed',
    generatingQr: 'Generating QR codes...', generating: 'Generating...', orderNotFound: 'Order not found',
    qrInstruction: 'Show these QR codes to your courier so they can scan pickup and delivery addresses instantly.',
    qrPickupPoint: 'Pickup Point', qrDeliveryPoint: 'Delivery Point',
    download: 'Download', printBothQr: 'Print Both QR Codes', tapToClose: 'Tap anywhere to close',
    // Label page
    labelLockedTitle: 'Label not available',
    labelLockedDesc: 'The QR label will unlock after payment is confirmed. No QR code on the label means the order is not paid.',
    // Address input
    savedAddressesLabel: 'Saved addresses', useAddress: 'Use →',
    differentAddress: '✏️ Different address', backToSaved: '← Back to saved addresses',
    addressDetected: '✅ Address detected', pasteFromClipboard: 'Paste from clipboard',
    streetSection: 'Street', citySection: 'City', contactSection: 'Contact',
    streetName: 'Street name', houseNo: 'No.', aptOffice: 'Apt/Office (optional)',
    selectCity: 'Select city...',
    // Auth
    signIn: 'Sign In', signUp: 'Create Account', email: 'Email', password: 'Password',
    companyName: 'Company name', noAccount: 'No account?', haveAccount: 'Have an account?',
    pleaseWait: 'Please wait...',
    businessPortal: 'Business Portal', resetPassword: 'Reset password',
    sendResetEmail: 'Send reset email', forgotPassword: 'Forgot password?',
    backToSignIn: '← Back to sign in',
    termsAgreement: 'By signing in you agree to our', termsLink: 'Terms', privacyLink: 'Privacy Policy',
    // Misc
    ordersThisMonth: 'Orders This Month', min: 'min',
    termsTitle: 'Terms of Service', lastUpdated: 'Last updated: May 2026',
    downloadPDF: 'Download PDF', privacyTitle: 'Privacy Policy',
    awaitingPayment: 'Awaiting Payment', confirmPayment: 'Confirm Payment Received',
    autoAssign: 'Auto-Assign Best Courier', packageReady: 'Package ready for pickup',
    preparePackage: 'Prepare your package before the courier arrives',
    // Weather
    weatherGood: 'Good conditions today',
    weatherAlert: 'Weather alert',
    weatherLoading: 'Loading weather...',
    weatherRainNote: 'Waterproof fragile parcels before leaving',
    weatherWindNote: 'Secure packages on cargo bike',
    weatherColdNote: 'E-bike battery range reduced — plan shorter routes',
    weatherHotNote: 'Carry extra water — stay hydrated',
    // Dashboard stat cards
    statsOrders: 'Orders (month)',
    statsSpent: 'Spent (month)',
    statsSuccess: 'Success rate',
    couriersNotified: 'Couriers notified · avg. acceptance time 3–8 min',
    emptyStateDesc: 'Place your first order and watch your courier deliver with GPS proof.',
    firstOrder: '+ Place your first order',
    firstDeliveryFree: 'First delivery free · GPS proof included',
    tagline: 'Less guessing. More doing.',
  },
  pl: {
    // Nav & layout
    dashboard: 'Panel', newOrder: 'Nowe zlecenie', settings: 'Ustawienia', logOut: 'Wyloguj się',
    poweredBy: 'Powered by LGK Courier',
    // Dashboard
    activeDeliveries: 'Aktywne dostawy', pendingOrders: 'Oczekujące zlecenia', completedToday: 'Ukończone dziś',
    orderHistory: 'Historia zleceń', track: 'Śledź', reorder: 'Zamów ponownie', viewProof: 'Zobacz dowód',
    viewDetails: 'Szczegóły',
    noActive: 'Brak aktywnych dostaw', noPending: 'Brak oczekujących zleceń', noCompleted: 'Brak ukończonych dostaw dziś',
    searchOrders: 'Szukaj zleceń...', allOrders: 'Wszystkie zlecenia', thisMonth: 'W tym miesiącu',
    totalSpent: 'Wydano łącznie', avgDelivery: 'Śr. czas dostawy',
    loading: 'Ładowanie...', refresh: '⟳ Odśwież', updated: 'Zaktualizowano', autoRefreshNote: 'odświeża się co 30s',
    // Order card
    from: 'OD', to: 'DO', deliveredAt: 'Dostarczono o', eta: 'ETA',
    // Status labels
    status_awaiting_payment: 'Oczekuje na płatność', status_pending: 'Oczekujące', status_assigned: 'Przydzielone',
    status_collected: 'Odebrane', status_in_transit: 'W drodze', status_delivered: 'Dostarczone', status_cancelled: 'Anulowane',
    // Settings
    companyInfo: 'Dane firmy', billing: 'Płatności', notifications: 'Powiadomienia',
    saveChanges: 'Zapisz zmiany', deleteAccount: 'Usuń konto', saving: 'Zapisywanie...', saved: 'Zapisano ✓',
    manualInvoice: 'Metoda płatności: Faktura ręczna', stripeComingSoon: 'Płatności online wkrótce',
    demoData: 'Dane demonstracyjne', demoDescription: 'Dodaj przykładowe zlecenia aby zobaczyć jak działa panel',
    seedButton: 'Dodaj 3 zlecenia demo', dangerZone: 'Strefa niebezpieczna',
    dangerDescription: 'Trwale usuń konto i wszystkie dane. Nie można cofnąć.',
    // Delete account modal
    deleteModalTitle: 'Usuń swoje konto',
    deleteModalSubtitle: 'Ta operacja jest trwała i nie można jej cofnąć',
    deleteModalWillDelete: 'Następujące dane zostaną trwale usunięte:',
    deleteItem1: 'Twoje konto i dane logowania',
    deleteItem2: 'Profil firmy i ustawienia',
    deleteItem3: 'Wszystkie zlecenia i historia dostaw',
    deleteItem4: 'Wszystkie zdjęcia GPS',
    deleteItem5: 'Zapisane adresy',
    deleteItem6: 'Faktury i dane rozliczeniowe',
    cancelKeepAccount: 'Anuluj — zachowaj konto',
    continueDelete: 'Kontynuuj',
    confirmDeletion: 'Potwierdź usunięcie',
    typeDeletePrompt: 'Wpisz DELETE aby trwale usunąć konto.',
    typeDeleteHere: 'Wpisz DELETE tutaj',
    cancel: 'Anuluj',
    deleteMyAccount: 'Usuń moje konto',
    deletingAccount: 'Usuwanie konta...',
    doNotClose: 'Nie zamykaj tego okna.',
    deleteError: 'Coś poszło nie tak. Napisz do lgkcourierapp@gmail.com',
    language: 'Język', theme: 'Motyw', dark: 'Ciemny', light: 'Jasny',
    savedAddresses: 'Zapisane adresy', noSavedAddresses: 'Brak zapisanych adresów. Pojawią się tutaj po pierwszym zleceniu.',
    setDefault: 'Ustaw jako domyślny', delete: 'Usuń',
    // Order form
    placingOrder: 'Wysyłanie...', placeOrder: 'Złóż zlecenie', pickup: 'Nadawca', delivery: 'Odbiorca',
    package: 'Paczka', options: 'Opcje', priceBreakdown: 'Szczegóły ceny', total: 'Łącznie',
    insurance: 'Ochrona przesyłki', insuranceNote: 'Pokrywa utratę lub uszkodzenie do 500 PLN',
    fragile: 'Paczka krucha', asap: 'Natychmiast (1-2 godz.)', sameDay: 'Tego samego dnia (do 18:00)', scheduled: 'Zaplanowane',
    weight: 'Waga', timeWindow: 'Czas realizacji', whatsappUpdates: 'Powiadomienia WhatsApp',
    sameAsPickup: 'Ten sam adres co nadawca', contactName: 'Imię i nazwisko', contactPhone: 'Numer telefonu',
    specialInstructions: 'Instrukcje specjalne (opcjonalnie)', deliveryNotes: 'Uwagi do dostawy',
    accessCode: 'Kod wejścia / brama (opcjonalnie)', dimensions: 'Wymiary (opcjonalnie)',
    distanceLabel: 'Dystans', addOns: 'Dodatki', cityRate: 'Stawka miejska', timeWindowLine: 'Okno czasowe',
    shipmentProtection: 'Ochrona przesyłki w cenie', shipmentProtectionNote: '(pokrywa stratę do 500 PLN)',
    save: 'Zapisz', skip: 'Pomiń',
    saveAddress: 'Zapisać ten adres na później?', saveRecipient: 'Zapisać odbiorcę na później?',
    labelPickup: 'Etykieta (np. Nasz magazyn)', labelRecipient: 'Etykieta (np. Jan Kowalski)',
    pickupPlaceholder: 'Wklej adres nadania np. ul. Mickiewicza 15/3, 70-383 Szczecin',
    deliveryPlaceholder: 'Wklej adres odbiorcy np. Anna Nowak, ul. Piastów 22/4, 70-001 Szczecin',
    // Order detail — payment
    awaitingPaymentTitle: 'Płatność wymagana',
    awaitingPaymentDesc: 'Twoje zlecenie jest zarezerwowane. Opłać je, aby przydzielić kuriera.',
    payNow: 'Zapłać teraz',
    alreadyPaid: 'Już zapłaciłem — płatność może potrwać 1-2 minuty. Ta strona odświeża się automatycznie.',
    contactIfNotConfirmed: 'jeśli nie potwierdzono po 5 minutach',
    paymentRequiredTitle: 'Wymagana płatność do potwierdzenia zamówienia',
    paymentReservedNote: 'Twoje zamówienie jest zarezerwowane. Opłać je, a kurier zostanie przydzielony w ciągu kilku minut.',
    oncePaymentReceived: 'Po otrzymaniu płatności kurier zostanie przydzielony automatycznie.',
    payViaRevolut: 'Zapłać przez Revolut',
    payWithRevolut: 'Zapłać przez Revolut',
    // Order detail — actions
    printLabel: 'Drukuj etykietę',
    showToCourier: 'Pokaż kurierowi',
    reportProblem: 'Zgłoś problem',
    reportTitle: 'Zgłoś problem z dostawą',
    reportCategory: 'Co się stało?',
    reportDesc: 'Opis (opcjonalnie)',
    reportSubmit: 'Wyślij zgłoszenie',
    reportSuccess: 'Zgłoszenie wysłane. Skontaktujemy się z Tobą wkrótce.',
    invoiceDownload: 'Pobierz fakturę',
    downloadInvoice: 'Pobierz fakturę',
    // Order detail — timeline / proof
    timeline: 'Historia statusów', orderPlaced: 'Zlecenie złożone', assignedCourier: 'Przydzielono kuriera',
    collected: 'Paczka odebrana', inTransit: 'W drodze do odbiorcy', delivered: 'Dostarczone',
    proofOfDelivery: 'Potwierdzenie doręczenia', downloadProof: 'Pobierz potwierdzenie',
    reportProblemWA: 'Zgłoś problem',
    orderPrefix: 'Zamówienie', qrCodes: 'Kody QR',
    // QR page
    qrLockedTitle: 'Kody QR niedostępne',
    qrLockedDesc: 'Kody QR zostaną wygenerowane po potwierdzeniu płatności. Zeskanuj kod na etykiecie dopiero gdy status zmieni się na "Oczekuje".',
    blurredQRNote: 'Kod QR zostanie odblokowany po opłaceniu zlecenia',
    generatingQr: 'Generowanie kodów QR...', generating: 'Generowanie...', orderNotFound: 'Nie znaleziono zamówienia',
    qrInstruction: 'Pokaż te kody QR kurierowi — może od razu zeskanować adresy nadania i dostawy.',
    qrPickupPoint: 'Punkt nadania', qrDeliveryPoint: 'Punkt dostawy',
    download: 'Pobierz', printBothQr: 'Drukuj oba kody QR', tapToClose: 'Dotknij, aby zamknąć',
    // Label page
    labelLockedTitle: 'Etykieta niedostępna',
    labelLockedDesc: 'Etykieta z kodem QR zostanie odblokowana po potwierdzeniu płatności. Brak kodu QR na etykiecie oznacza brak płatności.',
    // Address input
    savedAddressesLabel: 'Zapisane adresy', useAddress: 'Użyj →',
    differentAddress: '✏️ Inny adres', backToSaved: '← Powrót do zapisanych',
    addressDetected: '✅ Wykryto adres', pasteFromClipboard: 'Wklej ze schowka',
    streetSection: 'Ulica', citySection: 'Miasto', contactSection: 'Kontakt',
    streetName: 'Nazwa ulicy', houseNo: 'Nr', aptOffice: 'Lokal/Biuro (opcjonalnie)',
    selectCity: 'Wybierz miasto...',
    // Auth
    signIn: 'Zaloguj się', signUp: 'Utwórz konto', email: 'E-mail', password: 'Hasło',
    companyName: 'Nazwa firmy', noAccount: 'Nie masz konta?', haveAccount: 'Masz już konto?',
    pleaseWait: 'Proszę czekać...',
    businessPortal: 'Portal biznesowy', resetPassword: 'Resetuj hasło',
    sendResetEmail: 'Wyślij link resetujący', forgotPassword: 'Nie pamiętasz hasła?',
    backToSignIn: '← Powrót do logowania',
    termsAgreement: 'Logując się, akceptujesz nasze', termsLink: 'Regulamin', privacyLink: 'Politykę prywatności',
    // Misc
    ordersThisMonth: 'Zlecenia w tym miesiącu', min: 'min',
    termsTitle: 'Regulamin usługi', lastUpdated: 'Ostatnia aktualizacja: Maj 2026',
    downloadPDF: 'Pobierz PDF', privacyTitle: 'Polityka prywatności',
    awaitingPayment: 'Oczekuje na płatność', confirmPayment: 'Potwierdź otrzymanie płatności',
    autoAssign: 'Przydziel najlepszego kuriera', packageReady: 'Paczka gotowa do odbioru',
    preparePackage: 'Przygotuj paczkę przed przyjazdem kuriera',
    // Weather
    weatherGood: 'Dobre warunki dzisiaj',
    weatherAlert: 'Alert pogodowy',
    weatherLoading: 'Ładowanie pogody...',
    weatherRainNote: 'Zabezpiecz kruche paczki przed wyjazdem',
    weatherWindNote: 'Zabezpiecz paczki na rowerze cargo',
    weatherColdNote: 'Zasięg baterii e-roweru zmniejszony — planuj krótsze trasy',
    weatherHotNote: 'Weź dodatkową wodę — dbaj o nawodnienie',
    // Dashboard stat cards
    statsOrders: 'Zlecenia (mies.)',
    statsSpent: 'Wydatki (mies.)',
    statsSuccess: 'Skuteczność',
    couriersNotified: 'Kurierzy powiadomieni · średni czas przyjęcia 3–8 min',
    emptyStateDesc: 'Złóż pierwsze zlecenie i obserwuj jak kurier dostarcza Twój towar z GPS potwierdzeniem.',
    firstOrder: '+ Złóż pierwsze zlecenie',
    firstDeliveryFree: 'Pierwsza dostawa gratis · Potwierdzenie GPS w cenie',
    tagline: 'Less guessing. More doing.',
  },

  uk: {
    // Nav & layout
    dashboard: 'Панель', newOrder: 'Нове замовлення', settings: 'Налаштування', logOut: 'Вийти',
    poweredBy: 'Powered by LGK Courier',
    // Dashboard
    activeDeliveries: 'Активні доставки', pendingOrders: 'Очікуючі замовлення', completedToday: 'Завершено сьогодні',
    orderHistory: 'Історія замовлень', track: 'Відстежити', reorder: 'Повторити', viewProof: 'Переглянути підтвердження',
    viewDetails: 'Деталі',
    noActive: 'Немає активних доставок', noPending: 'Немає очікуючих замовлень', noCompleted: 'Немає завершених доставок сьогодні',
    searchOrders: 'Пошук замовлень...', allOrders: 'Всі замовлення', thisMonth: 'Цей місяць',
    totalSpent: 'Всього витрачено', avgDelivery: 'Сер. час доставки',
    loading: 'Завантаження...', refresh: '⟳ Оновити', updated: 'Оновлено', autoRefreshNote: 'автооновлення кожні 30с',
    // Order card
    from: 'ВІД', to: 'ДО', deliveredAt: 'Доставлено о', eta: 'ETA',
    // Status labels
    status_awaiting_payment: 'Очікує оплати', status_pending: 'Очікує', status_assigned: 'Призначено',
    status_collected: 'Забрано', status_in_transit: 'В дорозі', status_delivered: 'Доставлено', status_cancelled: 'Скасовано',
    // Settings
    companyInfo: 'Інформація про компанію', billing: 'Оплата', notifications: 'Сповіщення',
    saveChanges: 'Зберегти зміни', deleteAccount: 'Видалити акаунт', saving: 'Збереження...', saved: 'Збережено ✓',
    language: 'Мова', theme: 'Тема', dark: 'Темна', light: 'Світла',
    savedAddresses: 'Збережені адреси', noSavedAddresses: 'Немає збережених адрес.',
    setDefault: 'Встановити за замовчуванням', delete: 'Видалити',
    // Order form
    placingOrder: 'Розміщення...', placeOrder: 'Розмістити замовлення', pickup: 'Забір', delivery: 'Доставка',
    package: 'Пакет', options: 'Опції', priceBreakdown: 'Деталі ціни', total: 'Разом',
    insurance: 'Страхування пакету', insuranceNote: 'Покриває втрату або пошкодження до 500 PLN',
    fragile: 'Крихкий пакет', asap: 'Негайно (1-2 год.)', sameDay: 'Того ж дня (до 18:00)', scheduled: 'Заплановано',
    weight: 'Вага', timeWindow: 'Час виконання', whatsappUpdates: 'Оновлення WhatsApp',
    sameAsPickup: 'Та сама адреса, що й для забору', contactName: "Ім'я та прізвище", contactPhone: 'Контактний телефон',
    specialInstructions: 'Спеціальні інструкції (необов\'язково)', deliveryNotes: 'Примітки до доставки',
    accessCode: 'Код доступу / брама (необов\'язково)', dimensions: 'Розміри (необов\'язково)',
    distanceLabel: 'Відстань', addOns: 'Додатки', cityRate: 'Міська ставка', timeWindowLine: 'Часове вікно',
    save: 'Зберегти', skip: 'Пропустити',
    // Order detail
    awaitingPaymentTitle: 'Необхідна оплата', awaitingPaymentDesc: 'Ваше замовлення зарезервовано. Здійсніть оплату.',
    payNow: 'Сплатити зараз', alreadyPaid: 'Вже оплатили? Підтвердження може зайняти 1-2 хв.',
    payViaRevolut: 'Сплатити через Revolut', payWithRevolut: 'Сплатити через Revolut',
    printLabel: 'Друкувати', showToCourier: 'Показати кур\'єру',
    reportProblem: 'Повідомити про проблему', timeline: 'Хронологія',
    orderPlaced: 'Замовлення розміщено', assignedCourier: 'Кур\'єр призначений',
    collected: 'Пакет забрано', inTransit: 'В дорозі', delivered: 'Доставлено',
    proofOfDelivery: 'Підтвердження доставки', downloadProof: 'Завантажити підтвердження',
    orderNotFound: 'Замовлення не знайдено', orderPrefix: 'Замовлення',
    // Auth
    signIn: 'Увійти', signUp: 'Створити акаунт', email: 'Email', password: 'Пароль',
    companyName: 'Назва компанії', noAccount: 'Немає акаунту?', haveAccount: 'Є акаунт?',
    pleaseWait: 'Зачекайте...', resetPassword: 'Скинути пароль',
    backToSignIn: '← Назад до входу', forgotPassword: 'Забули пароль?',
    termsAgreement: 'Входячи, ви погоджуєтесь з нашими', termsLink: 'Умовами', privacyLink: 'Політикою конфіденційності',
    // Misc
    ordersThisMonth: 'Замовлення цього місяця', min: 'хв',
    awaitingPayment: 'Очікує оплати', confirmPayment: 'Підтвердити отримання оплати',
    packageReady: 'Пакет готовий до забору',
    preparePackage: 'Підготуйте пакет до приїзду кур\'єра',
    weatherGood: 'Гарні умови сьогодні', weatherAlert: 'Погодне попередження',
    weatherLoading: 'Завантаження погоди...',
    weatherRainNote: 'Захистіть крихкі пакети від дощу',
    weatherWindNote: 'Закріпіть пакети на вантажному велосипеді',
    weatherColdNote: 'Знижений заряд акумулятора — плануйте коротші маршрути',
    weatherHotNote: 'Візьміть воду — слідкуйте за гідратацією',
    // Dashboard stat cards
    statsOrders: 'Замовлення (міс.)',
    statsSpent: 'Витрати (міс.)',
    statsSuccess: 'Ефективність',
    couriersNotified: 'Кур\'єрів сповіщено · сер. час прийняття 3–8 хв',
    emptyStateDesc: 'Оформіть перше замовлення і спостерігайте, як кур\'єр доставляє з підтвердженням GPS.',
    firstOrder: '+ Перше замовлення',
    firstDeliveryFree: 'Перша доставка безкоштовно · GPS підтвердження в ціні',
    tagline: 'Less guessing. More doing.',
  },
};

export function AppProvider({ children }) {
  // Always start with 'pl' so server and client render identical HTML.
  // Read localStorage only after mount to avoid React hydration mismatch (#418).
  const [lang, setLangState] = useState('pl');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('lgk_lang');
      if (stored && SUPPORTED_LANGS.includes(stored)) { setLangState(stored); return; }
    } catch {}
    const resolved = resolveLang(null);
    if (resolved !== 'pl') setLangState(resolved);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  const setLang = (newLang) => {
    if (!SUPPORTED_LANGS.includes(newLang)) return;
    setLangState(newLang);
    try { localStorage.setItem('lgk_lang', newLang); } catch {}
    document.documentElement.setAttribute('lang', newLang);
    window.dispatchEvent(new Event('lgk-lang-change'));
  };

  const toggleLang = () => {
    const order = ['pl', 'en', 'uk'];
    const next = order[(order.indexOf(lang) + 1) % order.length];
    setLang(next);
  };

  const t = (key) => TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS['en'][key] ?? key;

  const colors = {
    bg: '#FFFFFF', card: '#F5F5F5', border: '#E5E5E5',
    text: '#0A0A0A', textSecondary: '#555555', input: '#F5F5F5',
  };

  return (
    <AppContext.Provider value={{ lang, setLang, toggleLang, t, colors }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}

export function useLangKey() {
  const { lang } = useApp();
  return lang;
}
