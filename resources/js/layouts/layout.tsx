import React from 'react';
import Footer from "@/components/marketing/footer";
import Navbar from "@/components/marketing/navbar";
import { usePage } from '@inertiajs/react';

interface Props {
  children: React.ReactNode;
}

const MarketingLayout = ({ children }: Props) => {
  const { auth } = usePage().props as any;

  return (
    <div className="w-full overflow-x-hidden"> {/* ✅ empêche le scroll horizontal */}
      <Navbar user={auth?.user} />
      <main className="mx-auto w-full relative z-40">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default MarketingLayout;
