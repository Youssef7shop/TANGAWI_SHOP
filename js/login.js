// js/login.js
import { supabase } from './supabase.js';

const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'جاري تسجيل الدخول...';

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        // 1. تسجيل الدخول
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (authError) throw authError;

        // 2. جلب رتبة المستخدم لتوجيهه للصفحة الصحيحة
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('role')
            .eq('id', authData.user.id)
            .single();

        if (profileError) throw profileError;

        // 3. التوجيه بناءً على الرتبة (Role)
        if (profile.role === 'Admin') {
            window.location.href = '/admin/dashboard.html';
        } else {
            window.location.href = 'whitelist.html';
        }

    } catch (error) {
        errorMessage.textContent = "البريد الإلكتروني أو كلمة المرور غير صحيحة";
        errorMessage.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'تسجيل الدخول';
    }
});
