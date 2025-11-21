import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";

const PrivacyPolicy = () => {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-6 max-w-4xl">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

        <Card className="p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground">
              LeadGen ("we," "our," or "us") respects your privacy. This Privacy Policy explains how we collect, 
              use, and protect your personal information when you use our B2B lead generation platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-lg font-semibold mt-4 mb-2">2.1 Account Information</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Email address</li>
              <li>Name and company information</li>
              <li>Billing and payment details</li>
              <li>Account preferences and settings</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4 mb-2">2.2 Usage Data</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Search queries and filters</li>
              <li>Downloaded lead data</li>
              <li>Feature usage and interaction patterns</li>
              <li>Login history and session information</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4 mb-2">2.3 Technical Data</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>IP address and device information</li>
              <li>Browser type and version</li>
              <li>Cookies and similar tracking technologies</li>
              <li>Error logs and performance metrics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>To provide and improve our lead generation services</li>
              <li>To process payments and manage subscriptions</li>
              <li>To send service updates and important notifications</li>
              <li>To analyze usage patterns and optimize performance</li>
              <li>To prevent fraud and ensure platform security</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Legal Basis for Processing (GDPR)</h2>
            <div className="space-y-3 text-muted-foreground">
              <p><strong>Contract Performance:</strong> Processing your account data to provide our services</p>
              <p><strong>Legitimate Interest:</strong> Aggregating publicly available business data for B2B purposes</p>
              <p><strong>Legal Obligation:</strong> Complying with tax, accounting, and regulatory requirements</p>
              <p><strong>Consent:</strong> Marketing communications (opt-in only)</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Sharing & Third Parties</h2>
            <div className="space-y-3 text-muted-foreground">
              <p className="font-medium">We share your data only with:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Payment processors (Stripe) for billing</li>
                <li>Cloud infrastructure providers (for hosting and storage)</li>
                <li>Analytics services (anonymized usage data)</li>
                <li>Legal authorities when required by law</li>
              </ul>
              <p className="mt-3">
                We <strong>never</strong> sell your personal information to third parties.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your account data for as long as your account is active. After account deletion, 
              we may retain certain information for up to 7 years for legal and compliance purposes. 
              Usage logs and analytics data are retained for 2 years.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
            <div className="space-y-2 text-muted-foreground">
              <p className="font-medium">Under GDPR and CCPA, you have the right to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Rectification:</strong> Correct inaccurate information</li>
                <li><strong>Erasure:</strong> Request deletion of your account data</li>
                <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
                <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
                <li><strong>Opt-Out:</strong> Unsubscribe from marketing emails</li>
              </ul>
              <p className="mt-3">To exercise these rights, contact us at: privacy@leadgen.com</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Cookies & Tracking</h2>
            <p className="text-muted-foreground mb-3">
              We use cookies for authentication, preferences, and analytics. You can manage cookie 
              preferences through your browser settings.
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li><strong>Essential Cookies:</strong> Required for login and core functionality</li>
              <li><strong>Analytics Cookies:</strong> Help us understand usage patterns</li>
              <li><strong>Preference Cookies:</strong> Remember your settings</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Security Measures</h2>
            <p className="text-muted-foreground">
              We implement industry-standard security measures including encryption, secure hosting, 
              regular security audits, and access controls. However, no system is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Children's Privacy</h2>
            <p className="text-muted-foreground">
              LeadGen is a B2B service not intended for individuals under 18. We do not knowingly 
              collect data from children.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. International Data Transfers</h2>
            <p className="text-muted-foreground">
              Your data may be processed in the United States or other countries where our service 
              providers operate. We ensure appropriate safeguards are in place.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy periodically. We will notify you of significant changes 
              via email or through the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
            <div className="text-muted-foreground space-y-1">
              <p>For privacy-related questions or requests:</p>
              <p className="font-medium">Email: privacy@leadgen.com</p>
              <p className="font-medium">Data Protection Officer: dpo@leadgen.com</p>
            </div>
          </section>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PrivacyPolicy;
