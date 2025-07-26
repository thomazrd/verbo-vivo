
"use client";

// This is a conceptual file. 
// The actual login page is at /src/app/(auth)/login/page.tsx.
// The admin layout will handle redirection if a non-admin user is logged in.
// An explicit admin login page might be needed if you separate user bases,
// but with the current design (role-based), it's not strictly necessary.

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLoginPage() {
    const router = useRouter();
    useEffect(() => {
        // Redirect to the main login page
        router.push('/login');
    }, [router]);

    return (
        <div>
            <p>Redirecionando para a página de login...</p>
        </div>
    );
}

    