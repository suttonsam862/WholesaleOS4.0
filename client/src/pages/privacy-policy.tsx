export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-card rounded-lg shadow-lg border border-border p-8">
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: December 2025</p>

          <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p>Rich Habits OS ("Company," "we," "us," "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application (the "Service").</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
              <h3 className="text-lg font-semibold mb-2">Personal Information</h3>
              <p>We may collect personal information that you voluntarily provide, including:</p>
              <ul className="list-disc pl-6 space-y-1 my-2">
                <li>Name, email address, and phone number</li>
                <li>Account credentials and profile information</li>
                <li>Business information and organizational details</li>
                <li>Payment and billing information</li>
              </ul>

              <h3 className="text-lg font-semibold mb-2 mt-4">Automatically Collected Information</h3>
              <p>We automatically collect certain information when you use our Service:</p>
              <ul className="list-disc pl-6 space-y-1 my-2">
                <li>Log data (IP address, browser type, pages visited)</li>
                <li>Device information (hardware model, operating system)</li>
                <li>Usage information and interaction patterns</li>
                <li>Location information (if permitted)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
              <p>We use the information we collect for various purposes:</p>
              <ul className="list-disc pl-6 space-y-1 my-2">
                <li>To provide and maintain our Service</li>
                <li>To notify you about changes to our Service</li>
                <li>To allow you to participate in interactive features</li>
                <li>To provide customer support</li>
                <li>To gather analysis and analytics to improve our Service</li>
                <li>To monitor the usage of our Service</li>
                <li>To detect, prevent, and address technical and security issues</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
              <p>The security of your data is important to us. We use administrative, technical, and physical security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is completely secure, and we cannot guarantee absolute security.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Third-Party Services</h2>
              <p>We may employ third-party companies and individuals to assist in our Service ("Third-Party Service Providers"). These third parties may have access to your personal information only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
              <p>We retain your personal information for as long as necessary to provide our Service and fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required by law.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Your Privacy Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-1 my-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to processing of your data</li>
                <li>Request restriction of processing</li>
                <li>Data portability</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Cookies and Tracking</h2>
              <p>We use cookies and similar tracking technologies to enhance your experience with our Service. You can control cookies through your browser settings, though this may limit certain features of our Service.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Contact Us</h2>
              <p>If you have questions about this Privacy Policy or our privacy practices, please contact us at:</p>
              <div className="bg-muted/50 p-4 rounded mt-2">
                <p><strong>Rich Habits OS</strong></p>
                <p>Email: support@richhabits.os</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Changes to This Policy</h2>
              <p>We may update this Privacy Policy from time to time. We will notify you of any changes by updating the "Last updated" date at the top of this Policy.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
