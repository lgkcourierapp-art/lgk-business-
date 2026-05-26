'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext({ t: k => k, lang: 'en', toggleLang: () => {}, colors: {} });

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
  }
};

export function AppProvider({ children }) {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    const stored = localStorage.getItem('lgk_lang');
    if (stored) setLang(stored);
    else if (navigator.language?.startsWith('pl')) setLang('pl');
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  const toggleLang = () => {
    const next = lang === 'en' ? 'pl' : 'en';
    setLang(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lgk_lang', next);
    }
    document.documentElement.setAttribute('lang', next);
    window.dispatchEvent(new Event('lgk-lang-change'));
  };

  const t = (key) => TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS['en'][key] ?? key;

  const colors = {
    bg: '#FFFFFF', card: '#F5F5F5', border: '#E5E5E5',
    text: '#0A0A0A', textSecondary: '#555555', input: '#F5F5F5',
  };

  return (
    <AppContext.Provider value={{ lang, toggleLang, t, colors }}>
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
