import { Config } from 'ziggy-js';

export interface User {
    id: number;
    name: string;
    email: string | null;
    phone?: string | null;
    email_verified_at?: string;
    profile_photo_url: string | undefined;
    two_factor_confirmed_at: string | null;
    role?: string;
    status?: string;
    notes?: string | null;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    ziggy: Config & { location: string };
};
