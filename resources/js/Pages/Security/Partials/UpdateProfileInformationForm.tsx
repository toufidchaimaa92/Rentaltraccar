import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import ErrorFeedback from '@/components/ui/error-feedback';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/PhoneInput';
import { PageProps } from '@/types';
import { useForm, usePage } from '@inertiajs/react';
import { Pencil } from 'lucide-react';
import { FormEventHandler, useRef, useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function UpdateProfileInformation() {
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const photoInput = useRef<HTMLInputElement>(null);

    const { auth } = usePage<PageProps>().props;
    const user = auth.user;

    const { data, setData, post, errors, processing } = useForm({
        _method: 'PATCH',
        name: user.name,
        email: user.email ?? '',
        phone: user.phone ?? '',
        photo: null as File | null,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        updateProfileInformation();
    };

    const updateProfileInformation = () => {
        if (photoInput.current?.files?.[0]) {
            data.photo = photoInput.current.files[0];
        }

        post(route('profile.update'), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Profile updated successfully');
                clearPhotoFileInput();
            },
            onError: (errors) => {
                toast.error('Something went wrong', errors);
            },
        });
    };

    const selectNewPhoto = () => {
        photoInput.current!.click();
    };

    const updatePhotoPreview = () => {
        const photo = photoInput.current!.files![0];
        if (!photo) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            setPhotoPreview(e.target?.result as string | null);
        };
        reader.readAsDataURL(photo);
    };

    const clearPhotoFileInput = () => {
        if (photoInput.current?.value) {
            photoInput.current.value = '';
        }
    };

    return (
        <section className="space-y-6">
            <header className="space-y-1">
                <h2 className="text-lg font-medium">Profile Information</h2>
                <p className="text-muted-foreground text-sm">
                    Update your account's profile details and contact information.
                </p>
            </header>

            <form onSubmit={submit} className="flex flex-col gap-4">
                {/* Profile photo */}
                <div>
                    <input
                        id="photo"
                        ref={photoInput}
                        name="photo"
                        type="file"
                        className="hidden"
                        onChange={updatePhotoPreview}
                        accept="image/*"
                    />
                    <div className="flex items-center gap-4">
                        <div className="group relative">
                            <Avatar className="h-16 w-16 rounded-lg">
                                <AvatarImage
                                    src={photoPreview || user.profile_photo_url}
                                    alt={`${user.name}'s profile photo`}
                                />
                                <AvatarFallback className="h-16 w-16 rounded-lg text-xl">
                                    {user.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div
                                className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-lg bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
                                onClick={selectNewPhoto}
                            >
                                <Pencil className="h-4 w-4 text-white" />
                            </div>
                        </div>
                    </div>
                    <ErrorFeedback message={errors.photo} />
                </div>

                {/* Name */}
                <div className="flex flex-col gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name"
                        className="w-full"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        autoComplete="name"
                    />
                    <ErrorFeedback message={errors.name} />
                </div>

                {/* Email */}
                <div className="flex flex-col gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        className="w-full"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        autoComplete="username"
                        placeholder="vous@exemple.com"
                    />
                    <ErrorFeedback message={errors.email} />
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <PhoneInput
                        id="phone"
                        value={data.phone}
                        onChange={(value) => setData('phone', value || '')}
                        placeholder="Téléphone"
                    />
                    <ErrorFeedback message={errors.phone} />
                    <p className="text-xs text-muted-foreground">
                        Email ou téléphone requis.
                    </p>
                </div>

                {/* Save Button */}
                <div className="flex items-center gap-3">
                    <Button disabled={processing}>Save</Button>
                </div>
            </form>
        </section>
    );
}
