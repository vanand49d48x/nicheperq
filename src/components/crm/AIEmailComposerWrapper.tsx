import { FeatureGate } from "@/components/FeatureGate";
import { AIEmailComposer } from "./AIEmailComposer";

interface AIEmailComposerWrapperProps {
  leadId: string;
  leadName: string;
  onEmailSent?: () => void;
  onClose?: () => void;
}

export const AIEmailComposerWrapper = (props: AIEmailComposerWrapperProps) => {
  return (
    <FeatureGate feature="ai">
      <AIEmailComposer {...props} />
    </FeatureGate>
  );
};
