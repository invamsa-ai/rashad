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
                if (tab.id === 'tabNafathApp') {
                    alert('طريقة التحقق عبر تطبيق نفاذ غير مفعلة حالياً، يرجى استخدام اسم المستخدم وكلمة المرور.');
                }

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
    // 3. معالجة إرسال النماذج (اسم المستخدم / تطبيق نفاذ)
    // ==========================================
    
    // أ) نموذج اسم المستخدم وكلمة المرور الأصلي
    const authForm = document.getElementById('authForm');
    if (authForm) {
        authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const submitBtn = authForm.querySelector('.btn-submit');
            const originalContent = submitBtn.innerHTML;
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> جاري التحقق الآمن...`;
            
            setTimeout(() => {
                alert('تم التحقق بنجاح ومطابقة الهوية الرقمية للطلب الإلكتروني.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalContent;
            }, 1500);
        });
    }

    // ب) نموذج رقم بطاقة الأحوال (الخاص بتبويب تطبيق نفاذ المضاف حديثاً)
    const appForm = document.getElementById('appForm');
    if (appForm) {
        appForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('تم إرسال طلب المطابقة الآمن للمنصة بنجاح.');
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
