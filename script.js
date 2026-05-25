document.addEventListener('DOMContentLoaded', () => {
    const loginCard = document.getElementById('loginCard');
    const langSwitch = document.getElementById('langSwitch');

    // Action when user clicks the login card
    loginCard.addEventListener('click', () => {
        // Simple elegant feedback animation before action
        loginCard.style.transform = 'scale(0.95)';
        setTimeout(() => {
            loginCard.style.transform = 'translateY(-5px)';
            alert('Redirecting securely to Saudi National Single Sign-On (Nafath)...');
        }, 150);
    });

    // Language switcher simple simulation
    langSwitch.addEventListener('click', () => {
        const currentLang = langSwitch.querySelector('span').innerText;
        if (currentLang === 'عربي') {
            langSwitch.querySelector('span').innerText = 'English';
            document.body.style.direction = 'rtl';
        } else {
            langSwitch.querySelector('span').innerText = 'عربي';
            document.body.style.direction = 'ltr';
        }
    });
});
