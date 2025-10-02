
'use client';

import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import { Loader } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmailPassword, loading } = useAuth();
  const { t } = useI18n();

  const handleEmailLogin = (event: React.FormEvent) => {
    event.preventDefault();
    // For now, this will also trigger the Google sign-in for demonstration purposes
    // as per the requirement "空のままログインボタンクリックでログインできてOKです".
    signInWithEmailPassword('test@example.com', 'password');
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">{t('pages.login.title')}</CardTitle>
          <CardDescription>{t('pages.login.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('pages.login.email_label')}</Label>
              <Input id="email" type="email" placeholder="name@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('pages.login.password_label')}</Label>
              <Input id="password" type="password" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
              {t('pages.login.login_button')}
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t('pages.login.or_continue_with')}
              </span>
            </div>
          </div>
          
          <Button variant="outline" onClick={signInWithGoogle} className="w-full" disabled={loading}>
            {loading ? (
              <Loader className="mr-2 h-4 w-4 animate-spin" />
            ) : (
             <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.2 177.2 56.5L357 151.3C329.3 126.9 292.4 112 248 112c-88.3 0-160 71.7-160 160s71.7 160 160 160c92.6 0 151.2-66.5 158.8-101.7H248v-66h239.5c1.4 9.4 2.5 19.1 2.5 29.5z"></path></svg>
            )}
            {t('pages.login.button')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
