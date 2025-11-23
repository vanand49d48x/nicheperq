import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Mail, Clock, TrendingUp } from "lucide-react";
import { useState } from "react";

interface WorkflowTemplate {
  name: string;
  description: string;
  icon: any;
  color: string;
  trigger: any;
  steps: any[];
}

const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    name: "Cold Lead Revival",
    description: "Re-engage leads that went cold. 4-touch sequence over 14 days with value-first approach.",
    icon: TrendingUp,
    color: "blue",
    trigger: {
      type: "inactivity",
      days: 14
    },
    steps: [
      {
        step_order: 1,
        action_type: "send_email",
        delay_days: 0,
        email_type: "re_engagement",
        tone: "friendly",
        ai_prompt_hint: "Brief check-in referencing our last conversation. Ask if their priorities have changed. Offer one new insight about their niche."
      },
      {
        step_order: 2,
        action_type: "wait",
        delay_days: 3
      },
      {
        step_order: 3,
        action_type: "send_email",
        delay_days: 0,
        email_type: "value_share",
        tone: "helpful",
        ai_prompt_hint: "Share a case study or success story relevant to their niche. No hard sell, just value. Ask one thoughtful question."
      },
      {
        step_order: 4,
        action_type: "wait",
        delay_days: 4
      },
      {
        step_order: 5,
        action_type: "send_email",
        delay_days: 0,
        email_type: "last_attempt",
        tone: "professional",
        ai_prompt_hint: "Final breakup email. Acknowledge they might not be interested right now. Leave door open for future. Use reverse psychology - 'Should I close your file?'"
      },
      {
        step_order: 6,
        action_type: "wait",
        delay_days: 7
      },
      {
        step_order: 7,
        action_type: "update_status",
        delay_days: 0,
        next_status: "unqualified"
      }
    ]
  },
  {
    name: "New Lead Nurture",
    description: "Welcome and qualify new leads. 5-touch sequence over 10 days building trust and understanding needs.",
    icon: Sparkles,
    color: "purple",
    trigger: {
      type: "status_change",
      from_status: "new",
      to_status: "contacted"
    },
    steps: [
      {
        step_order: 1,
        action_type: "send_email",
        delay_days: 0,
        email_type: "introduction",
        tone: "friendly",
        ai_prompt_hint: "Warm welcome. Briefly introduce yourself and your value proposition for their niche. Ask about their biggest challenge right now."
      },
      {
        step_order: 2,
        action_type: "wait",
        delay_days: 2
      },
      {
        step_order: 3,
        action_type: "send_email",
        delay_days: 0,
        email_type: "qualification",
        tone: "consultative",
        ai_prompt_hint: "Ask qualifying questions about their business goals, timeline, and decision-making process. Show genuine curiosity about their niche."
      },
      {
        step_order: 4,
        action_type: "wait",
        delay_days: 3
      },
      {
        step_order: 5,
        action_type: "send_email",
        delay_days: 0,
        email_type: "education",
        tone: "helpful",
        ai_prompt_hint: "Share educational content or insight specific to their niche. Position yourself as a trusted advisor, not a salesperson."
      },
      {
        step_order: 6,
        action_type: "wait",
        delay_days: 3
      },
      {
        step_order: 7,
        action_type: "send_email",
        delay_days: 0,
        email_type: "meeting_request",
        tone: "professional",
        ai_prompt_hint: "Soft call-to-action. Suggest a brief call to discuss their specific needs. Make it low-pressure and high-value."
      },
      {
        step_order: 8,
        action_type: "wait",
        delay_days: 2
      },
      {
        step_order: 9,
        action_type: "update_status",
        delay_days: 0,
        next_status: "qualified"
      }
    ]
  },
  {
    name: "Hot Lead Closer",
    description: "Move qualified leads to closed. Aggressive 3-day sequence with urgency and social proof.",
    icon: Mail,
    color: "green",
    trigger: {
      type: "status_change",
      from_status: "qualified",
      to_status: "proposal_sent"
    },
    steps: [
      {
        step_order: 1,
        action_type: "send_email",
        delay_days: 0,
        email_type: "proposal_follow_up",
        tone: "enthusiastic",
        ai_prompt_hint: "Follow up on proposal. Highlight 2-3 key benefits specific to their niche. Create urgency with a soft deadline or limited availability."
      },
      {
        step_order: 2,
        action_type: "wait",
        delay_days: 1
      },
      {
        step_order: 3,
        action_type: "send_email",
        delay_days: 0,
        email_type: "social_proof",
        tone: "confident",
        ai_prompt_hint: "Share a relevant success story or testimonial from someone in their niche. Use numbers and specifics. Address common objections proactively."
      },
      {
        step_order: 4,
        action_type: "wait",
        delay_days: 1
      },
      {
        step_order: 5,
        action_type: "send_email",
        delay_days: 0,
        email_type: "closing",
        tone: "direct",
        ai_prompt_hint: "Direct ask. What questions can I answer? What's holding you back? Offer to hop on a quick call to finalize details. Create urgency - limited slots, pricing changes, etc."
      },
      {
        step_order: 6,
        action_type: "wait",
        delay_days: 1
      },
      {
        step_order: 7,
        action_type: "update_status",
        delay_days: 0,
        next_status: "negotiating"
      }
    ]
  }
];

export default function WorkflowTemplates({ onTemplateDeployed }: { onTemplateDeployed: () => void }) {
  const { toast } = useToast();
  const [deployingTemplate, setDeployingTemplate] = useState<string | null>(null);

  const deployTemplate = async (template: WorkflowTemplate) => {
    setDeployingTemplate(template.name);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to deploy templates",
          variant: "destructive",
        });
        return;
      }

      // Create workflow
      const { data: workflow, error: workflowError } = await supabase
        .from('ai_workflows')
        .insert({
          user_id: user.id,
          name: template.name,
          description: template.description,
          trigger: template.trigger,
          is_active: false // Start paused so user can review
        })
        .select()
        .single();

      if (workflowError) throw workflowError;

      // Create workflow steps
      const stepsToInsert = template.steps.map(step => ({
        ...step,
        workflow_id: workflow.id
      }));

      const { error: stepsError } = await supabase
        .from('workflow_steps')
        .insert(stepsToInsert);

      if (stepsError) throw stepsError;

      toast({
        title: "Template Deployed!",
        description: `${template.name} has been added to your workflows. Review and activate when ready.`,
      });

      onTemplateDeployed();
    } catch (error) {
      console.error('Error deploying template:', error);
      toast({
        title: "Deployment Failed",
        description: "Could not deploy workflow template",
        variant: "destructive",
      });
    } finally {
      setDeployingTemplate(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Workflow Templates
        </CardTitle>
        <CardDescription>
          Deploy proven email sequences instantly. These templates are based on best practices and can be customized after deployment.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {WORKFLOW_TEMPLATES.map((template) => {
            const Icon = template.icon;
            const isDeploying = deployingTemplate === template.name;
            
            return (
              <Card key={template.name} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 text-${template.color}-500`} />
                      <CardTitle className="text-base">{template.name}</CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {template.steps.filter(s => s.action_type === 'send_email').length} emails
                    </Badge>
                  </div>
                  <CardDescription className="text-xs mt-2">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {template.steps
                          .reduce((sum, step) => sum + (step.delay_days || 0), 0)} day sequence
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />
                      <span>
                        Trigger: {template.trigger.type === 'inactivity' 
                          ? `${template.trigger.days}d inactivity`
                          : `Status: ${template.trigger.to_status}`
                        }
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => deployTemplate(template)}
                    disabled={isDeploying}
                    className="w-full"
                    size="sm"
                  >
                    {isDeploying ? "Deploying..." : "Deploy Template"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
