import { Head } from '@inertiajs/react';
import MarketingLayout from '@/layouts/layout';
import Wrapper from '@/components/global/wrapper';

const SupportPage = () => (
  <MarketingLayout>
    <Head title="Support - PasterLink" />
    <Wrapper>
      <h1 className="text-4xl md:text-5xl font-bold font-heading mb-10 text-center">🛠️ Support</h1>
      <p className="text-center max-w-2xl mx-auto text-muted-foreground mb-8">
        Need help? Have questions? We’ve got answers.
      </p>

      <div className="space-y-6">
        <p>
          For general questions, visit our{' '}
          <a href="/faq" className="underline text-blue-600">
            FAQ
          </a>{' '}
          or contact us at{' '}
          <a href="mailto:support@pasterlink.com" className="underline">
            support@pasterlink.com
          </a>.
        </p>
        <p>For bug reports or suggestions, open an issue on our GitHub or reach out via email.</p>
      </div>
    </Wrapper>
  </MarketingLayout>
);

export default SupportPage;
