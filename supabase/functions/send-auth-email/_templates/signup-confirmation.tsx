import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
} from "https://esm.sh/@react-email/components@0.0.22";
import * as React from "https://esm.sh/react@18.3.1";

interface SignupConfirmationEmailProps {
  supabase_url: string;
  email_action_type: string;
  redirect_to: string;
  token_hash: string;
  token: string;
}

export const SignupConfirmationEmail = ({
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
}: SignupConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to NichePerQ - Confirm your email to get started</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome to NichePerQ!</Heading>
        <Text style={tagline}>Niche Insights. Real Growth.</Text>
        
        <Section style={section}>
          <Text style={text}>
            Thank you for signing up! We&apos;re excited to help you discover high-quality leads and grow your business.
          </Text>
          
          <Text style={text}>
            Click the button below to confirm your email and access your account:
          </Text>
          
          <Link
            href={`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`}
            target="_blank"
            style={button}
          >
            Confirm Email & Get Started
          </Link>
          
          <Text style={text}>
            Or copy and paste this confirmation code:
          </Text>
          <code style={code}>{token}</code>
          
          <Hr style={hr} />
          
          <Text style={featureTitle}>What you can do with NichePerQ:</Text>
          <ul style={featureList}>
            <li style={featureItem}>🎯 Search unlimited niches and discover quality leads</li>
            <li style={featureItem}>📊 View detailed business information with ratings & reviews</li>
            <li style={featureItem}>🗺️ Visualize leads on an interactive map</li>
            <li style={featureItem}>💼 Manage contacts with our powerful CRM</li>
            <li style={featureItem}>🤖 Leverage AI for email outreach and lead scoring</li>
          </ul>
        </Section>
        
        <Hr style={hr} />
        
        <Text style={footer}>
          If you didn&apos;t create this account, you can safely ignore this email.
        </Text>
        
        <Text style={footer}>
          <strong>NichePerQ</strong> - Niche Insights. Real Growth.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default SignupConfirmationEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "32px",
  fontWeight: "700",
  margin: "40px 0 20px",
  padding: "0 40px",
  lineHeight: "1.2",
};

const tagline = {
  color: "#6b7280",
  fontSize: "16px",
  fontStyle: "italic",
  margin: "0 0 30px",
  padding: "0 40px",
};

const section = {
  padding: "0 40px",
};

const text = {
  color: "#4b5563",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 0",
};

const button = {
  backgroundColor: "#10b981",
  borderRadius: "8px",
  color: "#fff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "600",
  lineHeight: "50px",
  textAlign: "center" as const,
  textDecoration: "none",
  width: "100%",
  padding: "0 20px",
  marginTop: "20px",
  marginBottom: "20px",
};

const code = {
  display: "inline-block",
  padding: "16px 4.5%",
  width: "90.5%",
  backgroundColor: "#f3f4f6",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
  color: "#1a1a1a",
  fontSize: "18px",
  fontWeight: "600",
  letterSpacing: "2px",
  fontFamily: "monospace",
  textAlign: "center" as const,
  margin: "16px 0",
};

const featureTitle = {
  color: "#1a1a1a",
  fontSize: "18px",
  fontWeight: "600",
  marginTop: "32px",
  marginBottom: "16px",
};

const featureList = {
  color: "#4b5563",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0",
  padding: "0 0 0 20px",
};

const featureItem = {
  marginBottom: "12px",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "42px 0 26px",
};

const footer = {
  color: "#9ca3af",
  fontSize: "14px",
  lineHeight: "24px",
  padding: "0 40px",
  margin: "8px 0",
};
