import { NAV_LINKS } from "@/constants";
import { Link } from '@inertiajs/react';
import SvgIcon from "../global/iconssvg";
import Wrapper from "../global/wrapper";
import MobileMenu from "./mobile-menu";
import { buttonVariants } from "@/components/ui/button";

interface NavbarProps {
  user?: any; // Ajuste selon ton type utilisateur
}

const Navbar = ({ user }: NavbarProps) => {
  return (
    <header className="sticky top-0 w-full h-16 bg-background/80 backdrop-blur-sm z-50">
      <Wrapper className="h-full">
        <div className="flex items-center justify-between h-full">

          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2" aria-label="Accueil Taliani Auto">
              <SvgIcon className="w-8" />
              <span className="text-xl font-semibold hidden lg:block">
                Taliani Auto
              </span>
            </Link>
          </div>

          {/* Navigation Links (Desktop) - Centrés */}
          <div className="hidden lg:flex flex-1 justify-center">
            <ul className="flex items-center gap-8">
              {NAV_LINKS.map((link, index) => (
                <li key={index} className="text-sm font-medium link">
                  <Link href={link.href}>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* User Section */}
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center">
              {user ? (
                <Link href="/dashboard" className={buttonVariants({ size: "sm" })}>
                  Tableau de bord
                </Link>
              ) : (
                <Link href="/login" className={buttonVariants({ size: "sm" })}>
                  Se connecter
                </Link>
              )}
            </div>

            {/* Mobile menu toggle */}
            <MobileMenu />
          </div>

        </div>
      </Wrapper>
    </header>
  );
};

export default Navbar;
