import { Suspense } from 'react';
import { RegisterForm } from '@/components/auth/register-form';

export const metadata = {
  title: 'Register | Rasan',
  description: 'Create your Rasan account',
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
