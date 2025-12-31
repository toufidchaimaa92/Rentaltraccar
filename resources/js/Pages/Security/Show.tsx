import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import DeleteUserForm from './Partials/DeleteUserForm';

export default function Show({
    isUpdateProfileEnabled,
    isUpdatePasswordEnabled,
}: PageProps<{
    isUpdateProfileEnabled: boolean;
    isUpdatePasswordEnabled: boolean;
}>) {
    return (
        <AuthenticatedLayout>
            <Head title="Security" />

            <div className="mx-auto flex max-w-4xl flex-col gap-4">
                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold">Account security</h1>
                </div>

                {isUpdateProfileEnabled && (
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                        <UpdateProfileInformationForm />
                    </div>
                )}

                {isUpdatePasswordEnabled && (
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                        <UpdatePasswordForm />
                    </div>
                )}

                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <DeleteUserForm />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
