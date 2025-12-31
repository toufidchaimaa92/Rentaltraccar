import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import { router } from '@inertiajs/react';
import { LayoutDashboard, Lock, Moon, Sun } from 'lucide-react';
import { useEffect } from 'react';
import { useTheme } from './theme-provider';
import { useSearch } from '@/context/search-context';  // <-- Import your shared context

interface NavigationItem {
    title: string;
    href: string;
    icon: React.ReactNode;
}

const navigationItems: NavigationItem[] = [
    {
        title: 'Tableau de bord',
        href: '/dashboard',
        icon: <LayoutDashboard />,
    },
    {
        title: 'Sécurité',
        href: '/account/security',
        icon: <Lock />,
    },
];

export function AppCommand() {
    const { open: isOpen, setOpen: setIsOpen } = useSearch();  // Use context state
    const { setTheme } = useTheme();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsOpen(!isOpen);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, [isOpen, setIsOpen]);

    const goToRoute = (href: string) => {
        setIsOpen(false);
        router.visit(href);
    };

    const setMode = (mode: 'dark' | 'light') => {
        setIsOpen(false);
        setTheme(mode);
    };

    return (
        <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
            <Command>
                <CommandInput placeholder="Rechercher une commande..." />
                <CommandList>
                    <CommandEmpty>Aucun résultat.</CommandEmpty>
                    <CommandGroup heading="Aller vers...">
                        {navigationItems.map((item) => (
                            <CommandItem
                                key={item.href}
                                onSelect={() => goToRoute(item.href)}
                            >
                                {item.icon}
                                <span>{item.title}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="Thème">
                        <CommandItem onSelect={() => setMode('dark')}>
                            <Moon />
                            <span>Mode sombre</span>
                        </CommandItem>
                        <CommandItem onSelect={() => setMode('light')}>
                            <Sun />
                            <span>Mode clair</span>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </Command>
        </CommandDialog>
    );
}
