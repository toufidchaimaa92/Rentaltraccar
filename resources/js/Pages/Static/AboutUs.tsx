// resources/js/Pages/AboutUs.tsx
import { Head } from '@inertiajs/react';
import MarketingLayout from '@/layouts/layout';
import Wrapper from '@/components/global/wrapper';

const AboutUsPage = () => {
  return (
    <MarketingLayout>
      <Head title="About Us">
        <meta
          name="description"
          content="Learn more about PasterLink.com — our mission, vision, and the team behind the fastest and most reliable paste + link sharing platform."
        />
      </Head>

      <Wrapper>
        <h1 className="text-4xl md:text-6xl font-heading font-bold my-12 text-center w-full">
          About Us
        </h1>

        <section className="mt-10 space-y-6">
          <p>
            <strong>PasterLink.com</strong> is more than just a pastebin or link shortener — it’s a platform built for speed, security, and simplicity.
            Whether you're a developer, creator, marketer, or everyday user, we help you store, share, and distribute information with confidence.
          </p>

          <h2 className="text-xl font-semibold mt-10">🚀 Our Mission</h2>
          <p>
            To empower users worldwide with a reliable, ad-free tool to instantly create and share pastes, links, QR codes, and more —
            all while prioritizing privacy, performance, and transparency.
          </p>

          <h2 className="text-xl font-semibold mt-10">🌍 Who We Serve</h2>
          <p>
            PasterLink is trusted by students, tech enthusiasts, security researchers, educators, and professionals who need a clean,
            fast, and permanent way to share information without distractions or surveillance.
          </p>

          <h2 className="text-xl font-semibold mt-10">⚙️ What Makes Us Different?</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>No forced ads or cluttered UI — just clean tools that work.</li>
            <li>Anonymous usage with optional accounts for personalization.</li>
            <li>Built-in URL shortening, QR code generation, and analytics.</li>
            <li>Strong content moderation and security rules to protect users.</li>
            <li>Open to feedback, constantly improving based on community needs.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-10">💡 Our Philosophy</h2>
          <p>
            We believe the internet should be fast, private, and accessible. That’s why we designed PasterLink from the ground up
            to be transparent, easy to use, and free from corporate exploitation.
          </p>

          <h2 className="text-xl font-semibold mt-10">🤝 Contact & Collaboration</h2>
          <p>
            We're open to suggestions, partnerships, and contributions. Want to get in touch? Reach us at{' '}
            <a href="mailto:welcome@pasterlink.com" className="underline">
              welcome@pasterlink.com
            </a>{' '}
            or follow our roadmap for future features.
          </p>

          <h2 className="text-xl font-semibold mt-10">🔒 Built with Privacy in Mind</h2>
          <p>
            We do not track you across the web. Our Privacy Policy and Terms make it clear: we respect your rights as a user, and we
            don't sell your data.
          </p>
        </section>

        <p className="mt-16 text-center font-medium text-muted-foreground">
          Thanks for trusting PasterLink — a faster, cleaner, and more private way to paste and share.
        </p>
      </Wrapper>
    </MarketingLayout>
  );
};

export default AboutUsPage;
