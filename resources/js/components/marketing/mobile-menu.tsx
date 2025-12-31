import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NAV_LINKS } from "@/constants";
import { Menu, X } from "lucide-react";
import { Link } from "@inertiajs/react";

const MobileMenu = () => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {open ? <X className="h-8 w-8" /> : <Menu className="h-6 w-6" />}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:w-[300px] pt-10 px-6 bg-background border-l shadow-xl max-w-full overflow-x-hidden"
      >
        <SheetHeader className="mb-6">
          <SheetTitle className="text-left text-xl font-semibold">
            Menu
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col space-y-4 max-w-full overflow-x-hidden">
          {NAV_LINKS.map((link, index) => (
            <Link
              key={index}
              href={link.href}
              className="text-base font-medium text-muted-foreground hover:text-primary transition-colors"
              onClick={() => setOpen(false)}
            >
              {link.name}
            </Link>
          ))}

          <div className="mt-6 border-t border-border pt-6 flex flex-col gap-3 max-w-full overflow-x-hidden">
            <Link href="/login" className="w-full block" onClick={() => setOpen(false)}>
              <Button variant="outline" className="w-full max-w-full min-w-0">
                Se connecter
              </Button>
            </Link>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;
