import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import AuthenticationLayout from '@/layouts/AuthenticationLayout';
import AuthCard from '@/Pages/Auth/AuthCard';
import { FileWarning } from 'lucide-react';

export default function NotFound() {
  return (
    <AuthenticationLayout>
      <Head title="Page introuvable" />

      <main className="flex w-full items-center justify-center">
        <AuthCard>
          <div className="flex flex-col items-center text-center space-y-4 mb-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FileWarning className="h-6 w-6" />
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight">Page introuvable</h1>
              <p className="text-sm text-muted-foreground">
                Cette page n’existe pas ou a été déplacée. Vérifiez l’URL ou revenez à l’accueil.
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <Link href="/" className="w-full">
              <Button className="w-full">Retour à l’accueil</Button>
            </Link>
          </div>
        </AuthCard>
      </main>
    </AuthenticationLayout>
  );
}
