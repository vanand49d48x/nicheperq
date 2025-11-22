import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";

const RefundPolicy = () => {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-6 max-w-4xl">
        <h1 className="text-4xl font-bold mb-2">Refund Policy</h1>
        <p className="text-muted-foreground mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

        <Card className="p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Our Commitment</h2>
            <p className="text-muted-foreground">
              At NichePerQ, we stand behind the quality of our service. If you're not satisfied, we offer 
              a fair and transparent refund policy to ensure your peace of mind.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. 7-Day Money-Back Guarantee</h2>
            <div className="space-y-3 text-muted-foreground">
              <p className="font-medium">Eligibility:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>New subscribers to any paid plan</li>
                <li>Request made within 7 days of initial subscription</li>
                <li>Applies to first-time purchases only</li>
                <li>Account must not have violated our Terms of Service</li>
              </ul>

              <p className="font-medium mt-4">What's Covered:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Full refund of your first subscription payment</li>
                <li>No questions asked within the 7-day window</li>
                <li>Processed within 5-10 business days to original payment method</li>
              </ul>

              <p className="font-medium mt-4">Exclusions:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Data usage exceeding 80% of plan limit (indicates extensive use)</li>
                <li>Renewal payments (only initial subscription qualifies)</li>
                <li>Requests after 7 days from signup</li>
                <li>Accounts flagged for abuse or policy violations</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Subscription Cancellations</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                <strong>Cancel Anytime:</strong> You can cancel your subscription at any time through 
                your account settings or by contacting support.
              </p>
              <p>
                <strong>Access Until Period Ends:</strong> After cancellation, you retain access to paid 
                features until the end of your current billing period.
              </p>
              <p>
                <strong>No Partial Refunds:</strong> Cancellations mid-cycle do not qualify for prorated refunds 
                (except during the 7-day guarantee period).
              </p>
              <p>
                <strong>Reactivation:</strong> You can reactivate your account anytime by resubscribing.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Upgrade & Downgrade Policy</h2>
            <div className="space-y-3 text-muted-foreground">
              <p className="font-medium">Upgrades:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Immediate access to higher-tier features</li>
                <li>Prorated credit applied for unused time on previous plan</li>
                <li>New pricing starts at next billing cycle</li>
              </ul>

              <p className="font-medium mt-4">Downgrades:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Changes take effect at next billing cycle</li>
                <li>You keep current plan features until cycle ends</li>
                <li>No refunds for downgrading mid-cycle</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Accuracy Disputes</h2>
            <p className="text-muted-foreground mb-3">
              If you believe our data quality does not meet reasonable expectations:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Contact support within 14 days with specific examples</li>
              <li>We will investigate and verify data sources</li>
              <li>If systemic issues are found, we may offer account credit or refund</li>
              <li>Minor inaccuracies do not qualify for refunds (no data source is perfect)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Service Downtime & Credits</h2>
            <div className="space-y-3 text-muted-foreground">
              <p className="font-medium">Unplanned Outages:</p>
              <p>
                If NichePerQ experiences unscheduled downtime exceeding 24 consecutive hours, affected users 
                receive a prorated credit for the downtime period.
              </p>

              <p className="font-medium mt-3">Scheduled Maintenance:</p>
              <p>
                Planned maintenance windows do not qualify for credits. We provide advance notice for 
                scheduled downtime.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. How to Request a Refund</h2>
            <div className="space-y-2 text-muted-foreground">
              <p className="font-medium">Step 1: Contact Support</p>
              <p className="ml-4">Email: support@nicheperq.com with "Refund Request" in subject line</p>
              
              <p className="font-medium mt-3">Step 2: Provide Information</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Account email address</li>
                <li>Reason for refund request (optional but helpful)</li>
                <li>Original payment method details (for verification)</li>
              </ul>

              <p className="font-medium mt-3">Step 3: Processing</p>
              <p className="ml-4">
                We typically respond within 1-2 business days and process approved refunds within 5-10 business days.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Chargebacks & Disputes</h2>
            <p className="text-muted-foreground">
              Please contact us directly before initiating a chargeback with your bank. Chargebacks result 
              in immediate account suspension and may incur dispute fees. We're committed to resolving issues 
              fairly without escalation.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Annual Plans</h2>
            <p className="text-muted-foreground">
              Annual subscriptions qualify for the 7-day money-back guarantee. After 7 days, annual plans 
              are non-refundable but can be cancelled to prevent renewal.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Questions?</h2>
            <p className="text-muted-foreground">
              For questions about refunds or billing, contact us at: billing@nicheperq.com
            </p>
          </section>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default RefundPolicy;
