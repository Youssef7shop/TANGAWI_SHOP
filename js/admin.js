// js/admin.js
import { supabase } from './supabase.js';

let currentAppId = null; // تخزين آيدي الطلب المفتوح حالياً

async function initAdminDashboard() {
    // 1. حماية الصفحة: التحقق من الرتبة
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user) return window.location.href = '../login.html';

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'Admin') {
        alert("لا تملك صلاحية لدخول هذه الصفحة!");
        return window.location.href = '../whitelist.html';
    }

    // 2. تحميل البيانات
    loadStatistics();
    loadApplications();
}

// دالة جلب الإحصائيات للبطاقات
async function loadStatistics() {
    // جلب عدد المستخدمين
    const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
    
    // جلب أعداد الطلبات حسب الحالة
    const { data: apps } = await supabase.from('whitelist').select('status');
    
    let pending = 0, accepted = 0, rejected = 0;
    apps.forEach(app => {
        if(app.status === 'Pending') pending++;
        if(app.status === 'Accepted') accepted++;
        if(app.status === 'Rejected') rejected++;
    });

    document.getElementById('count-users').textContent = usersCount;
    document.getElementById('count-all').textContent = apps.length;
    document.getElementById('count-pending').textContent = pending;
    document.getElementById('count-accepted').textContent = accepted;
    document.getElementById('count-rejected').textContent = rejected;
}

// دالة جلب الطلبات وعرضها في الجدول
async function loadApplications() {
    const { data: applications, error } = await supabase
        .from('whitelist')
        .select('*')
        .order('created_at', { ascending: false }); // الأحدث أولاً

    if (error) return console.error(error);

    const tbody = document.getElementById('table-body');
    tbody.innerHTML = ''; // تفريغ الجدول قبل إعادة الملء

    applications.forEach(app => {
        const date = new Date(app.created_at).toLocaleDateString('ar-MA'); // تنسيق التاريخ المغربي/العربي
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${app.fullname} <br><small>(${app.player_id})</small></td>
            <td>${app.discord}</td>
            <td>${date}</td>
            <td><strong>${app.status}</strong></td>
            <td><button class="view-btn" data-id="${app.id}">عرض التفاصيل</button></td>
        `;
        tbody.appendChild(tr);
    });

    // إضافة حدث الضغط لزر "عرض التفاصيل"
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            const selectedApp = applications.find(a => a.id === id);
            openModal(selectedApp);
        });
    });
}

// --- التعامل مع الـ Modal ---
const modal = document.getElementById('app-modal');
const rejectBox = document.getElementById('reject-box');

function openModal(app) {
    currentAppId = app.id; // حفظ الـ id للاستخدام عند القبول أو الرفض
    
    // تعبئة البيانات
    document.getElementById('detail-name').textContent = app.fullname;
    document.getElementById('detail-age').textContent = app.age;
    document.getElementById('detail-story').textContent = app.story;
    document.getElementById('detail-exp').textContent = app.experience;
    document.getElementById('detail-reason').textContent = app.reason;

    // إخفاء مربع سبب الرفض إن كان ظاهراً
    rejectBox.style.display = 'none';
    document.getElementById('reject-reason-input').value = '';

    // إخفاء أزرار التحكم إذا كان الطلب قد تم الرد عليه مسبقاً
    const actionsDiv = document.querySelector('.modal-actions');
    if(app.status !== 'Pending') {
        actionsDiv.style.display = 'none';
    } else {
        actionsDiv.style.display = 'block';
    }

    modal.style.display = 'block';
}

// إغلاق الـ Modal
document.getElementById('close-modal').addEventListener('click', () => {
    modal.style.display = 'none';
});

// زر القبول
document.getElementById('btn-accept').addEventListener('click', async () => {
    if(confirm('هل أنت متأكد من قبول هذا اللاعب؟')) {
        await updateApplicationStatus(currentAppId, 'Accepted', null);
    }
});

// زر الرفض (يظهر مربع كتابة السبب)
document.getElementById('btn-reject-trigger').addEventListener('click', () => {
    rejectBox.style.display = 'block';
});

// تأكيد الرفض مع السبب
document.getElementById('btn-confirm-reject').addEventListener('click', async () => {
    const reason = document.getElementById('reject-reason-input').value;
    if(!reason.trim()) return alert("يجب كتابة سبب الرفض!");
    
    await updateApplicationStatus(currentAppId, 'Rejected', reason);
});

// دالة تحديث الحالة في قاعدة البيانات
async function updateApplicationStatus(id, newStatus, rejectReason) {
    const { error } = await supabase
        .from('whitelist')
        .update({ status: newStatus, reject_reason: rejectReason })
        .eq('id', id);

    if (error) {
        alert("حدث خطأ أثناء التحديث");
        console.error(error);
    } else {
        alert("تم تحديث حالة الطلب بنجاح!");
        modal.style.display = 'none';
        loadStatistics(); // تحديث البطاقات
        loadApplications(); // تحديث الجدول
    }
}

// تسجيل الخروج
document.getElementById('logout-btn').addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = '../login.html';
});

// تشغيل اللوحة
initAdminDashboard();
