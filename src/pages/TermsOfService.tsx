import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";

const TermsOfService = () => {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-6 max-w-4xl">
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

        <Card className="p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing and using NichePerQ ("the Service"), you accept and agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Service Description</h2>
            <p className="text-muted-foreground mb-3">
              NichePerQ is a B2B lead generation platform that aggregates publicly available business information from 
              legitimate sources such as Google Maps, public business directories, and other lawful data sources.
            </p>
            <p className="text-muted-foreground">
              We provide verified business contact information including phone numbers, addresses, and website URLs 
              for legitimate business purposes only.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Acceptable Use Policy</h2>
            <div className="space-y-3 text-muted-foreground">
              <p className="font-medium">You agree to use NichePerQ data exclusively for:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Business-to-business (B2B) outreach and networking</li>
                <li>Legitimate marketing and sales activities</li>
                <li>Professional referral partnerships</li>
                <li>Market research and business intelligence</li>
              </ul>
              
              <p className="font-medium mt-4">You agree NOT to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Use data for spam, harassment, or unsolicited consumer marketing</li>
                <li>Resell, redistribute, or share data with unauthorized third parties</li>
                <li>Scrape, copy, or reverse-engineer our platform</li>
                <li>Violate CAN-SPAM, GDPR, CCPA, or other applicable laws</li>
                <li>Send bulk emails without proper opt-out mechanisms</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Data Compliance & Legal Basis</h2>
            <div className="space-y-3 text-muted-foreground">
              <h3 className="font-semibold text-foreground">CAN-SPAM Compliance</h3>
              <p>
                All business contact data provided is for B2B communications. Users must include clear unsubscribe 
                mechanisms, accurate sender information, and honor opt-out requests within 10 business days.
              </p>

              <h3 className="font-semibold text-foreground mt-4">GDPR Compliance (B2B Legitimate Interest)</h3>
              <p>
                We process publicly available business data under legitimate interest for B2B purposes (Article 6(1)(f) GDPR). 
                Business contacts have the right to request data deletion.
              </p>

              <h3 className="font-semibold text-foreground mt-4">CCPA Compliance</h3>
              <p>
                Business information obtained from public directories is exempt from CCPA under the "publicly available" 
                exception (CCPA § 1798.140(o)(2)).
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Subscription & Billing</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>• Subscriptions renew automatically unless cancelled</p>
              <p>• You may cancel anytime through your account settings</p>
              <p>• Refunds are provided as per our Refund Policy</p>
              <p>• Usage limits apply based on your subscription tier</p>
              <p>• Overages may result in service restrictions</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Account Security</h2>
            <p className="text-muted-foreground">
              You are responsible for maintaining the confidentiality of your account credentials. 
              Notify us immediately of any unauthorized access or security breaches.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Data Accuracy & Disclaimers</h2>
            <p className="text-muted-foreground">
              While we strive for accuracy, we cannot guarantee 100% accuracy of publicly sourced data. 
              NichePerQ is provided "as is" without warranties of any kind. We are not liable for business 
              decisions made based on our data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Termination</h2>
            <p className="text-muted-foreground">
              We reserve the right to suspend or terminate accounts that violate these terms, engage in 
              abusive behavior, or use our service for illegal purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              NichePerQ's total liability shall not exceed the amount paid by you in the past 12 months. 
              We are not liable for indirect, incidental, or consequential damages.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We may update these terms periodically. Continued use of the service after changes constitutes 
              acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Contact Information</h2>
            <p className="text-muted-foreground">
              For questions about these Terms of Service, contact us at: legal@nicheperq.com
            </p>
          </section>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TermsOfService;
