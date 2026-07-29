// js/register.js
import { supabase } from './supabase.js';

const registerForm = document.getElementById('register-form');
const errorMessage = document.getElementById('error-message'); // عنصر لإظهار الأخطاء إن وجدت

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // تعطيل الزر لمنع الضغط المتكرر
    const submitBtn = registerForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'جاري إنشاء الحساب...';

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        // 1. إنشاء الحساب في نظام المصادقة
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
        });

        if (authError) throw authError;

        // 2. إدخال بيانات المستخدم (الاسم) في جدول public.users الخاص بنا
        if (authData.user) {
            const { error: dbError } = await supabase
                .from('users')
                .insert([
                    { id: authData.user.id, email: email, name: name, role: 'User' }
                ]);

            if (dbError) throw dbError;
        }

        // 3. التوجيه تلقائياً إلى صفحة الوايت ليست
        window.location.href = 'whitelist.html';

    } catch (error) {
        errorMessage.textContent = error.message;
        errorMessage.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'إنشاء حساب';
    }
});
