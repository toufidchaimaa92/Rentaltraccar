import { Button } from '@/components/ui/button';
import AuthenticationLayout from '@/layouts/AuthenticationLayout';
import { Head, Link } from '@inertiajs/react';
import { MailOpen } from 'lucide-react';

export default function PasswordResetSent() {
    return (
        <AuthenticationLayout>
            <Head title="Lien de réinitialisation envoyé" />

            <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="bg-muted rounded-full p-3">
                        <MailOpen className="size-6" />
                    </div>
                    <h1 className="text-2xl font-bold">Vérifiez vos e-mails</h1>
                    <p className="text-muted-foreground text-sm text-balance">
                        Nous avons envoyé un lien de réinitialisation à votre adresse e-mail. Consultez votre boîte de réception et suivez les instructions.
                    </p>
                </div>

                <div className="grid gap-4">
                    <Button asChild variant="outline" className="w-full">
                        <Link href={route('login')}>Retour à la connexion</Link>
                    </Button>

                    <div className="text-center text-sm">
                        Vous n’avez pas reçu l’e-mail ?{' '}
                        <Link
                            href={route('auth.forgot-password')}
                            className="underline underline-offset-4"
                        >
                            Réessayer
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticationLayout>
    );
}
