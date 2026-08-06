(function () {
    'use strict';

    const copy = {
        ar: ['جارٍ الاتصال بـ Nonlate…', 'تتم إعادتك إلى التطبيق', 'لم تتم إعادتك تلقائيًا؟', 'اضغط هنا لفتح Nonlate'],
        bn: ['Nonlate-এর সাথে সংযোগ করা হচ্ছে…', 'আপনাকে অ্যাপে ফিরিয়ে নেওয়া হচ্ছে', 'স্বয়ংক্রিয়ভাবে ফেরত যাননি?', 'Nonlate খুলতে এখানে চাপুন'],
        cs: ['Připojování k Nonlate…', 'Přesměrováváme vás zpět do aplikace', 'Nedošlo k automatickému přesměrování?', 'Kliknutím otevřete Nonlate'],
        de: ['Verbindung mit Nonlate wird hergestellt…', 'Sie werden zurück zur App geleitet', 'Nicht automatisch weitergeleitet?', 'Hier klicken, um Nonlate zu öffnen'],
        en: ['Connecting to Nonlate…', 'Redirecting you back to the app', 'Not redirected automatically?', 'Click here to open Nonlate'],
        es: ['Conectando con Nonlate…', 'Volviendo a la aplicación', '¿No se te redirigió automáticamente?', 'Haz clic aquí para abrir Nonlate'],
        fa: ['در حال اتصال به Nonlate…', 'در حال بازگشت به برنامه', 'به‌طور خودکار هدایت نشدید؟', 'برای باز کردن Nonlate اینجا را بزنید'],
        fil: ['Kumokonekta sa Nonlate…', 'Ibinabalik ka sa app', 'Hindi awtomatikong naibalik?', 'Pindutin dito para buksan ang Nonlate'],
        fr: ['Connexion à Nonlate…', 'Retour vers l’application', 'Pas de redirection automatique ?', 'Cliquez ici pour ouvrir Nonlate'],
        he: ['מתחבר ל-Nonlate…', 'מחזירים אותך לאפליקציה', 'לא הועברת אוטומטית?', 'לחצו כאן כדי לפתוח את Nonlate'],
        hi: ['Nonlate से कनेक्ट हो रहा है…', 'आपको ऐप पर वापस भेजा जा रहा है', 'अपने-आप वापस नहीं गए?', 'Nonlate खोलने के लिए यहाँ टैप करें'],
        id: ['Menghubungkan ke Nonlate…', 'Mengalihkan Anda kembali ke aplikasi', 'Tidak dialihkan secara otomatis?', 'Ketuk di sini untuk membuka Nonlate'],
        it: ['Connessione a Nonlate…', 'Ritorno all’app', 'Nessun reindirizzamento automatico?', 'Tocca qui per aprire Nonlate'],
        ja: ['Nonlate に接続しています…', 'アプリに戻ります', '自動的に戻らない場合', 'ここをタップして Nonlate を開く'],
        ko: ['Nonlate에 연결하는 중…', '앱으로 돌아가는 중입니다', '자동으로 이동하지 않았나요?', '여기를 눌러 Nonlate 열기'],
        nl: ['Verbinding maken met Nonlate…', 'Je wordt teruggestuurd naar de app', 'Niet automatisch doorgestuurd?', 'Tik hier om Nonlate te openen'],
        pl: ['Łączenie z Nonlate…', 'Wracamy do aplikacji', 'Brak automatycznego przekierowania?', 'Kliknij tutaj, aby otworzyć Nonlate'],
        'pt-BR': ['Conectando ao Nonlate…', 'Redirecionando você de volta ao app', 'Não foi redirecionado automaticamente?', 'Toque aqui para abrir o Nonlate'],
        'pt-PT': ['A ligar ao Nonlate…', 'A redirecionar para a aplicação', 'Não foi redirecionado automaticamente?', 'Toque aqui para abrir o Nonlate'],
        ru: ['Подключение к Nonlate…', 'Возвращаем вас в приложение', 'Не удалось перейти автоматически?', 'Нажмите здесь, чтобы открыть Nonlate'],
        sv: ['Ansluter till Nonlate…', 'Du skickas tillbaka till appen', 'Omdirigerades du inte automatiskt?', 'Tryck här för att öppna Nonlate'],
        ta: ['Nonlate உடன் இணைக்கிறது…', 'பயன்பாட்டிற்கு திருப்பி அனுப்புகிறது', 'தானாக திரும்பவில்லையா?', 'Nonlate-ஐ திறக்க இங்கே தட்டவும்'],
        te: ['Nonlate‌కు కనెక్ట్ అవుతోంది…', 'మిమ్మల్ని యాప్‌కు తిరిగి పంపుతోంది', 'ఆటోమేటిక్‌గా వెళ్లలేదా?', 'Nonlate తెరవడానికి ఇక్కడ నొక్కండి'],
        th: ['กำลังเชื่อมต่อกับ Nonlate…', 'กำลังนำคุณกลับไปยังแอป', 'ไม่ได้กลับโดยอัตโนมัติใช่ไหม', 'แตะที่นี่เพื่อเปิด Nonlate'],
        tr: ['Nonlate’e bağlanılıyor…', 'Uygulamaya geri yönlendiriliyorsunuz', 'Otomatik olarak yönlendirilmediniz mi?', 'Nonlate’i açmak için buraya dokunun'],
        uk: ['Підключення до Nonlate…', 'Повертаємо вас до застосунку', 'Не вдалося перейти автоматично?', 'Натисніть тут, щоб відкрити Nonlate'],
        ur: ['Nonlate سے منسلک ہو رہا ہے…', 'آپ کو ایپ پر واپس بھیجا جا رہا ہے', 'خودکار طور پر واپس نہیں گئے؟', 'Nonlate کھولنے کے لیے یہاں دبائیں'],
        vi: ['Đang kết nối với Nonlate…', 'Đang đưa bạn trở lại ứng dụng', 'Không tự động chuyển hướng?', 'Nhấn vào đây để mở Nonlate'],
        'zh-Hans': ['正在连接到 Nonlate…', '正在返回应用', '没有自动跳转？', '点按此处打开 Nonlate'],
        'zh-Hant': ['正在連線至 Nonlate…', '正在返回 App', '沒有自動跳轉？', '點一下此處開啟 Nonlate']
    };

    function preferredLocale() {
        const requested = (navigator.languages && navigator.languages.length
            ? navigator.languages
            : [navigator.language || 'en']);
        for (const raw of requested) {
            const normalized = String(raw).replace('_', '-');
            const lower = normalized.toLowerCase();
            if (lower === 'iw' || lower.startsWith('iw-')) return 'he';
            if (lower === 'in' || lower.startsWith('in-')) return 'id';
            if (lower.startsWith('pt-br')) return 'pt-BR';
            if (lower.startsWith('pt')) return 'pt-PT';
            if (lower.startsWith('zh-tw') || lower.startsWith('zh-hk') || lower.startsWith('zh-hant')) return 'zh-Hant';
            if (lower.startsWith('zh')) return 'zh-Hans';
            const base = lower.split('-')[0];
            if (copy[base]) return base;
        }
        return 'en';
    }

    function localize() {
        const locale = preferredLocale();
        const values = copy[locale] || copy.en;
        const root = document.documentElement;
        root.lang = locale;
        root.dir = ['ar', 'fa', 'he', 'ur'].includes(locale) ? 'rtl' : 'ltr';

        const container = document.querySelector('.container');
        const heading = container && container.querySelector('h2');
        const redirect = container && container.querySelector(':scope > p');
        const manual = document.getElementById('manual-link');
        const manualPrompt = manual && manual.querySelector('p');
        const manualLink = document.getElementById('link');
        if (heading) heading.textContent = values[0];
        if (redirect) redirect.textContent = values[1];
        if (manualPrompt) manualPrompt.textContent = values[2];
        if (manualLink) manualLink.textContent = values[3];

        const compactHint = document.querySelector('.hint');
        const compactFallback = document.querySelector('.fallback');
        const compactLink = document.getElementById('open-link');
        if (compactHint) compactHint.textContent = values[1];
        if (compactFallback && compactLink) {
            compactFallback.replaceChildren(
                document.createTextNode(values[2] + ' '),
                compactLink
            );
            compactLink.textContent = values[3];
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', localize, { once: true });
    } else {
        localize();
    }
})();
