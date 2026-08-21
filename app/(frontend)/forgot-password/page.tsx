import type { Metadata } from 'next'
import { PasswordRecovery } from '@/app/_components/password-recovery'
export const metadata: Metadata = { title: 'Reset password', robots: { index: false, follow: false } }
export default function ForgotPasswordPage() { return <PasswordRecovery /> }
