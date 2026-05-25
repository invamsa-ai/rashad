document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. تفاعلات الصفحة الرئيسية ---
    const loginCard = document.getElementById('loginCard');
    if (loginCard) {
        loginCard.addEventListener('click', () => {
            loginCard.style.transform = 'scale(0.95)';
            setTimeout(() => {
                // الانتقال إلى صفحة تسجيل الدخول
                window.location.href = 'login.html';
            }, 150);
        });
    }

    // --- 2. تفاعلات صفحة تسجيل الدخول ---
    const authForm = document.getElementById('authForm');
    if (authForm) {
        authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const submitBtn = document.querySelector('.btn-submit');
            const originalContent = submitBtn.innerHTML;
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> جاري التحقق الآمن...`;
            
            setTimeout(() => {
                alert('تم التحقق بنجاح ومطابقة الهوية الرقمية.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalContent;
            }, 1500);
        });
    }

    const collapsedAccordion = document.querySelector('.accordion-item.collapsed');
    if (collapsedAccordion) {
        collapsedAccordion.addEventListener('click', () => {
            alert('طريقة التحقق عبر تطبيق نفاذ غير مفعلة حالياً، يرجى استخدام اسم المستخدم وكلمة المرور.');
        });
    }

    // --- 3. زر تبديل اللغة (مشترك) ---
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
