import MarketingLayout from '@/layouts/layout';
import Wrapper from "@/components/global/wrapper";
import Hero from "@/components/marketing/hero";
import { Head } from '@inertiajs/react';

const HomePage = () => {
    return (
        <>
            <Head>
                <title>Taliani Auto</title>
                <meta
                    name="description"
                    content="PasterLink is your ultimate app to paste, store, and share text or code instantly — fast, simple, and private."
                />
            </Head>

            <MarketingLayout>
                <Wrapper className="py-10 relative">
                    <Hero />
                </Wrapper>
            </MarketingLayout>
        </>
    );
};

export default HomePage;
