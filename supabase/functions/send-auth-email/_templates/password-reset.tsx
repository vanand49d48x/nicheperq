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

interface PasswordResetEmailProps {
  supabase_url: string;
  email_action_type: string;
  redirect_to: string;
  token_hash: string;
  token: string;
}

export const PasswordResetEmail = ({
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
}: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset your NichePerQ password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Password Reset Request</Heading>
        <Text style={tagline}>Niche Insights. Real Growth.</Text>
        
        <Section style={section}>
          <Text style={text}>
            We received a request to reset your NichePerQ password. Click the button below to create a new password:
          </Text>
          
          <Link
            href={`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`}
            target="_blank"
            style={button}
          >
            Reset Your Password
          </Link>
          
          <Text style={text}>
            Or copy and paste this reset code:
          </Text>
          <code style={code}>{token}</code>
          
          <Section style={warningBox}>
            <Text style={warningText}>
              🔒 <strong>Security Notice:</strong> This link will expire in 60 minutes. If you didn&apos;t request a password reset, please ignore this email or contact support if you have concerns about your account security.
            </Text>
          </Section>
        </Section>
        
        <Hr style={hr} />
        
        <Text style={footer}>
          For security reasons, this link can only be used once. If you need another reset link, please visit the login page and click &quot;Forgot Password&quot; again.
        </Text>
        
        <Text style={footer}>
          <strong>NichePerQ</strong> - Niche Insights. Real Growth.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default PasswordResetEmail;

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
  backgroundColor: "#dc2626",
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

const warningBox = {
  backgroundColor: "#fef3c7",
  border: "1px solid #fbbf24",
  borderRadius: "8px",
  padding: "16px",
  marginTop: "24px",
};

const warningText = {
  color: "#78350f",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
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
