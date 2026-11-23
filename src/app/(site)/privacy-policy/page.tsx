import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo/metadata";
import { OwnerPlaceholder, PolicyPage } from "@/components/editorial/PolicyPage";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description: "What information Gloss & Thread collects, how it is used, and the choices you have.",
  path: "/privacy-policy/",
});

export default function PrivacyPolicyPage() {
  return (
    <PolicyPage
      title="Privacy Policy"
      path="/privacy-policy/"
      intro="This policy explains what information we collect when you use Gloss & Thread and how we use it."
      updated="[set on publication]"
    >
      <p>
        <strong>Note for the site owner:</strong> this policy describes how the software behind this site works. Have it
        reviewed by a qualified professional and complete the marked details before launch, particularly if you enable
        advertising or analytics or serve readers in states with specific privacy laws (for example California, Virginia,
        Colorado, Connecticut or Texas).
      </p>
      <h2>Who we are</h2>
      <p>
        This site is operated by <OwnerPlaceholder>legal entity name and mailing address</OwnerPlaceholder>. Privacy questions
        can be sent through our <Link href="/contact/?topic=PRIVACY">contact form</Link>.
      </p>
      <h2>Information you give us</h2>
      <ul>
        <li><strong>Contact form:</strong> your name, email address and message, used only to respond to you and kept in our editorial system.</li>
        <li><strong>Newsletter:</strong> if signups are open, your email address is sent to our email provider to deliver the newsletter. You can unsubscribe from any email.</li>
      </ul>
      <h2>Information collected automatically</h2>
      <ul>
        <li><strong>Server logs:</strong> standard technical data such as IP address, browser type and pages requested, used for security and reliability.</li>
        <li><strong>Analytics (if enabled):</strong> we may use Google Analytics to understand which stories are read. It uses cookies and collects usage data in aggregate.</li>
        <li><strong>Advertising (if enabled):</strong> ad partners such as Google AdSense may use cookies to serve and measure ads, including personalized ads where permitted. You can manage Google ad personalization at <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">adssettings.google.com</a>.</li>
      </ul>
      <h2>How we use information</h2>
      <p>To publish and improve the site, respond to messages, send newsletters you requested, keep the site secure, and comply with law. We do not sell your contact-form or newsletter information.</p>
      <h2>Your choices and rights</h2>
      <p>
        Depending on where you live, you may have rights to access, correct, delete or opt out of certain uses of your personal
        information. To make a request, <Link href="/contact/?topic=PRIVACY">contact us</Link>. <OwnerPlaceholder>describe opt-out mechanism, e.g. consent management platform, if ads are enabled</OwnerPlaceholder>
      </p>
      <h2>Children</h2>
      <p>This site is not directed to children under 13, and we do not knowingly collect their personal information.</p>
      <h2>Changes</h2>
      <p>We will post any changes to this policy on this page with a new “last updated” date.</p>
    </PolicyPage>
  );
}
