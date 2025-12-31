import { Head } from '@inertiajs/react';
import MarketingLayout from '@/layouts/layout';
import Wrapper from '@/components/global/wrapper';

const TermsAndConditionsPage = () => {
  return (
    <MarketingLayout>
      <Head title="Terms and Conditions">
        <meta
          name="description"
          content="Read PasterLink.com's Terms and Conditions to understand our policies on content, liability, privacy, and user conduct."
        />
      </Head>

      <Wrapper>
        <h1 className="text-4xl md:text-6xl font-heading font-bold my-12 text-center w-full">
          Terms and Conditions
        </h1>
        <p className="text-sm mb-2 italic mt-20">Last updated: 26th May 2025</p>

        <p className="mt-4">
          Welcome to <strong>PasterLink.com</strong> (“PasterLink”, “we”, “our”, or “us”). These Terms and Conditions (“Terms”) govern your access to and use of our website, products, and services.
        </p>

        <p className="mt-4">
          By accessing or using the Service, you (“User”, “you”) agree to be legally bound by these Terms. If you do not agree, please do not use the Service.
        </p>

        <h2 className="text-xl font-medium mt-8">1. Eligibility and Acceptance</h2>
        <p className="mt-4">To use our services:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>You must be at least 18 years old or have guardian consent.</li>
          <li>You agree to abide by these Terms in full.</li>
        </ul>

        <h2 className="text-xl font-medium mt-8">2. Changes to Terms</h2>
        <p className="mt-4">
          We reserve the right to update these Terms at any time. Your continued use after changes constitutes acceptance of the new Terms.
        </p>

        <h2 className="text-xl font-medium mt-8">3. Account and Security</h2>
        <p className="mt-4">
          You are responsible for maintaining the security of your account credentials. We are not liable for unauthorized access resulting from your failure to safeguard your information.
        </p>

        <h2 className="text-xl font-medium mt-8">4. Acceptable Use Policy</h2>
        <p className="mt-4">You may not use our service to:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Post illegal, abusive, or harmful content</li>
          <li>Transmit viruses or malware</li>
          <li>Engage in spam, phishing, or scraping</li>
        </ul>

        <h2 className="text-xl font-medium mt-8">5. Paste and Link Services</h2>
        <h3 className="text-lg font-semibold mt-6">5.1 URL Shortening</h3>
        <p className="mt-2">You may not use our shortener to link to scams, phishing sites, adult content, or malware.</p>

        <h3 className="text-lg font-semibold mt-6">5.2 Paste Creation</h3>
        <p className="mt-2">Users are solely responsible for paste content. We may remove content at our discretion.</p>

        <h3 className="text-lg font-semibold mt-6">5.3 QR Codes and Analytics</h3>
        <p className="mt-2">Use QR codes and analytics ethically. Abuse will lead to removal or suspension.</p>

        <h2 className="text-xl font-medium mt-8">6. User Content</h2>
        <p className="mt-4">
          You retain ownership of your content but grant us a license to host and display it. You are solely responsible for ensuring you have the right to post your content.
        </p>

        <h2 className="text-xl font-medium mt-8">7. Intellectual Property</h2>
        <p className="mt-4">
          All PasterLink content and branding are protected. You may not use our name, logo, or platform materials without permission.
        </p>

        <h2 className="text-xl font-medium mt-8">8. Privacy and Data Protection</h2>
        <p className="mt-4">
          Your privacy matters. Please read our <a href="/privacy-policy" className="underline">Privacy Policy</a> to understand how we collect and use your data.
        </p>

        <h2 className="text-xl font-medium mt-8">9. Termination</h2>
        <p className="mt-4">
          We may suspend or terminate your access for violations. You may delete your account at any time.
        </p>

        <h2 className="text-xl font-medium mt-8">10. Disclaimer</h2>
        <p className="mt-4">
          Our services are provided “as is.” We make no guarantees about availability or error-free performance.
        </p>

        <h2 className="text-xl font-medium mt-8">11. Limitation of Liability</h2>
        <p className="mt-4">
          We are not liable for indirect damages. Our total liability is limited to USD $50 or the minimum permitted by law.
        </p>

        <h2 className="text-xl font-medium mt-8">12. Indemnification</h2>
        <p className="mt-4">
          You agree to indemnify and hold us harmless from claims arising from your use of our services or your content.
        </p>

        <h2 className="text-xl font-medium mt-8">13. Governing Law and Jurisdiction</h2>
        <p className="mt-2">
          These Terms shall be governed by and construed in accordance with the applicable laws of your country of residence. Any disputes arising out of or relating to these Terms shall be subject to the exclusive jurisdiction of the competent courts in your country of residence.
        </p>

        <h2 className="text-xl font-medium mt-8">14. Business Transfers</h2>
        <p className="mt-4">
          If we are acquired or merged, your data may be transferred. We will notify you if required by law.
        </p>

        <h2 className="text-xl font-medium mt-8">15. Prohibited Content</h2>
        <p className="mt-4">You may not use PasterLink to post or link to:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Stolen credentials</li>
          <li>Malware or phishing sites</li>
          <li>Violent, hateful, or abusive content</li>
          <li>CSAM or illegal content</li>
          <li>Copyright-infringing material</li>
        </ul>

        <h2 className="text-xl font-medium mt-8">16. Contact</h2>
        <p className="mt-4">
          If you have questions about these Terms, please contact us at:{' '}
          <a href="mailto:welcome@pasterlink.com" className="underline">
          welcome@pasterlink.com
          </a>
        </p>

        <p className="mt-8 font-semibold">By using PasterLink.com, you agree to these Terms.</p>
      </Wrapper>
    </MarketingLayout>
  );
};

export default TermsAndConditionsPage;