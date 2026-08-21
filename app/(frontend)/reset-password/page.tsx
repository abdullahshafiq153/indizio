import type { Metadata } from 'next'
import { PasswordRecovery } from '@/app/_components/password-recovery'
export const metadata: Metadata = { title: 'Choose a new password', robots: { index: false, follow: false } }
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) { const { token } = await searchParams; return <PasswordRecovery token={token} /> }
