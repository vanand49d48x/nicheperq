import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Shield, CheckCircle2, Lock, Users, FileText, Globe } from "lucide-react";

const DataEthics = () => {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-6 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Data Ethics & Compliance</h1>
          <p className="text-muted-foreground">Our commitment to responsible data practices</p>
        </div>

        <Card className="p-8 space-y-8">
          <section className="flex gap-4">
            <Shield className="h-8 w-8 text-primary flex-shrink-0" />
            <div>
              <h2 className="text-2xl font-semibold mb-3">Our Ethical Foundation</h2>
              <p className="text-muted-foreground">
                At NichePerQ, we believe that powerful data tools come with great responsibility. We are committed 
                to providing high-quality business intelligence while maintaining the highest ethical standards 
                and legal compliance.
              </p>
            </div>
          </section>

          <section className="flex gap-4">
            <Globe className="h-8 w-8 text-primary flex-shrink-0" />
            <div>
              <h2 className="text-2xl font-semibold mb-3">Publicly Available Data Only</h2>
              <div className="space-y-3 text-muted-foreground">
                <p className="font-medium">We exclusively source data from legitimate public sources:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Google Maps and Google Business Profiles</li>
                  <li>Official business directories and registries</li>
                  <li>Public websites and company pages</li>
                  <li>Government business databases (where applicable)</li>
                </ul>
                <p className="mt-3">
                  <strong>We never:</strong> Scrape private databases, purchase illicit data, or obtain information 
                  through hacking, social engineering, or unauthorized access.
                </p>
              </div>
            </div>
          </section>

          <section className="flex gap-4">
            <CheckCircle2 className="h-8 w-8 text-primary flex-shrink-0" />
            <div>
              <h2 className="text-2xl font-semibold mb-3">Legal Compliance Framework</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">✅ CAN-SPAM Act (United States)</h3>
                  <p className="text-muted-foreground">
                    All business contact data is for B2B communications. Our platform enables users to comply 
                    with CAN-SPAM by providing accurate sender information and contact details.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">✅ GDPR (European Union)</h3>
                  <p className="text-muted-foreground">
                    We process publicly available business data under the <strong>legitimate interest</strong> legal 
                    basis (Article 6(1)(f) GDPR) for B2B purposes. Business contacts maintain all GDPR rights 
                    including data access, rectification, and erasure.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">✅ CCPA (California)</h3>
                  <p className="text-muted-foreground">
                    Business information from public directories qualifies under the <strong>"publicly available 
                    information"</strong> exemption (CCPA § 1798.140(o)(2)).
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">✅ TCPA (Telephone Consumer Protection Act)</h3>
                  <p className="text-muted-foreground">
                    Phone numbers are for business lines only. Users must obtain proper consent before making 
                    automated calls or sending SMS.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="flex gap-4">
            <Users className="h-8 w-8 text-primary flex-shrink-0" />
            <div>
              <h2 className="text-2xl font-semibold mb-3">B2B Focus & Use Case Restrictions</h2>
              <div className="space-y-3 text-muted-foreground">
                <p className="font-medium">NichePerQ is designed exclusively for legitimate B2B purposes:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Professional networking and referral partnerships</li>
                  <li>Market research and competitive intelligence</li>
                  <li>B2B sales outreach and lead generation</li>
                  <li>Business development and partnership opportunities</li>
                </ul>

                <p className="mt-4 font-medium text-destructive">Prohibited Uses:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Consumer marketing or B2C spam</li>
                  <li>Harassment, stalking, or malicious intent</li>
                  <li>Selling or redistributing data to third parties</li>
                  <li>Illegal activities or fraudulent schemes</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="flex gap-4">
            <Lock className="h-8 w-8 text-primary flex-shrink-0" />
            <div>
              <h2 className="text-2xl font-semibold mb-3">Data Security & Privacy</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>• <strong>Encryption:</strong> All data is encrypted in transit (TLS 1.3) and at rest (AES-256)</p>
                <p>• <strong>Access Controls:</strong> Role-based permissions and multi-factor authentication</p>
                <p>• <strong>Regular Audits:</strong> Quarterly security assessments and penetration testing</p>
                <p>• <strong>Data Minimization:</strong> We collect only what's necessary for our service</p>
                <p>• <strong>Retention Limits:</strong> Data is retained only as long as legally required</p>
              </div>
            </div>
          </section>

          <section className="flex gap-4">
            <FileText className="h-8 w-8 text-primary flex-shrink-0" />
            <div>
              <h2 className="text-2xl font-semibold mb-3">Transparency & Accountability</h2>
              <div className="space-y-3 text-muted-foreground">
                <p><strong>Data Sources:</strong> We clearly disclose our data sources and collection methods</p>
                <p><strong>Opt-Out Process:</strong> Business contacts can request removal via our Data Subject Request form</p>
                <p><strong>User Education:</strong> We provide compliance guidance to help users follow best practices</p>
                <p><strong>Incident Response:</strong> We maintain a 24-hour breach notification policy</p>
                <p><strong>Regular Updates:</strong> Our compliance policies are reviewed quarterly and updated as laws evolve</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Data Subject Rights</h2>
            <p className="text-muted-foreground mb-3">
              If you are a business owner whose information appears in our database, you have the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li><strong>Access:</strong> Request a copy of your data</li>
              <li><strong>Rectification:</strong> Correct inaccurate information</li>
              <li><strong>Erasure:</strong> Request removal from our database</li>
              <li><strong>Objection:</strong> Object to processing of your business information</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              To exercise these rights, email: <strong>privacy@nicheperq.com</strong>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">User Accountability</h2>
            <p className="text-muted-foreground mb-3">
              While we provide ethical data, users must use it responsibly:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Always include accurate sender information in emails</li>
              <li>Provide clear opt-out mechanisms (unsubscribe links)</li>
              <li>Honor opt-out requests promptly (within 10 days)</li>
              <li>Avoid misleading subject lines or deceptive content</li>
              <li>Respect do-not-contact requests</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Continuous Improvement</h2>
            <p className="text-muted-foreground">
              We actively monitor regulatory changes, engage with privacy advocacy groups, and invest in 
              compliance infrastructure to stay ahead of evolving data protection standards.
            </p>
          </section>

          <section className="border-t pt-6">
            <h2 className="text-2xl font-semibold mb-3">Contact Our Compliance Team</h2>
            <div className="text-muted-foreground space-y-1">
              <p><strong>General Inquiries:</strong> compliance@nicheperq.com</p>
              <p><strong>Data Subject Requests:</strong> privacy@nicheperq.com</p>
              <p><strong>Data Protection Officer:</strong> dpo@nicheperq.com</p>
              <p><strong>Security Issues:</strong> security@nicheperq.com</p>
            </div>
          </section>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DataEthics;
