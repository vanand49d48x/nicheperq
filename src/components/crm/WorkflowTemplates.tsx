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
    description: "Re-engage leads that went cold. 3-email sequence over 14 days with value-first approach.",
    icon: TrendingUp,
    color: "blue",
    trigger: {
      type: "no_activity",
      days_inactive: 14
    },
    steps: [
      {
        step_order: 1,
        action_type: "email",
        delay_days: 0,
        email_type: "value_add",
        tone: "friendly",
        ai_prompt_hint: "Soft check-in, share 1 helpful insight or resource, ask if timing is bad."
      },
      {
        step_order: 2,
        action_type: "email",
        delay_days: 5,
        email_type: "follow_up",
        tone: "friendly",
        ai_prompt_hint: "Quick bump, acknowledge they're busy, offer to close the loop if no interest."
      },
      {
        step_order: 3,
        action_type: "email",
        delay_days: 5,
        email_type: "breakup",
        tone: "friendly",
        ai_prompt_hint: "Polite breakup; say you'll stop reaching out unless they want to reconnect."
      },
      {
        step_order: 4,
        action_type: "status",
        delay_days: 4,
        next_status: "cold"
      }
    ]
  },
  {
    name: "New Lead Nurture",
    description: "Welcome and qualify new leads. 5-email sequence over 10 days building trust and value.",
    icon: Sparkles,
    color: "purple",
    trigger: {
      type: "new_lead",
      status: "new"
    },
    steps: [
      {
        step_order: 1,
        action_type: "email",
        delay_days: 0,
        email_type: "introduction",
        tone: "friendly",
        ai_prompt_hint: "Intro & welcome email. Introduce yourself and set expectations."
      },
      {
        step_order: 2,
        action_type: "email",
        delay_days: 2,
        email_type: "value",
        tone: "professional",
        ai_prompt_hint: "Value email - case study or quick win relevant to their niche."
      },
      {
        step_order: 3,
        action_type: "email",
        delay_days: 3,
        email_type: "social_proof",
        tone: "professional",
        ai_prompt_hint: "Social proof + ask for call. Share testimonials and request a meeting."
      },
      {
        step_order: 4,
        action_type: "email",
        delay_days: 3,
        email_type: "objection_handling",
        tone: "professional",
        ai_prompt_hint: "Objection handling. Address common concerns preemptively."
      },
      {
        step_order: 5,
        action_type: "email",
        delay_days: 2,
        email_type: "deadline",
        tone: "direct",
        ai_prompt_hint: "Soft deadline / 'is this a priority?' Create gentle urgency."
      }
    ]
  },
  {
    name: "Hot Lead Closer",
    description: "Close deals faster after proposal sent. 3-email sequence over 3 days with urgency.",
    icon: Mail,
    color: "green",
    trigger: {
      type: "status_changed",
      status: "proposal_sent"
    },
    steps: [
      {
        step_order: 1,
        action_type: "email",
        delay_days: 0,
        email_type: "proposal_follow_up",
        tone: "professional",
        ai_prompt_hint: "Recap proposal + call to action. Make it easy to say yes."
      },
      {
        step_order: 2,
        action_type: "email",
        delay_days: 1,
        email_type: "objection_handling",
        tone: "professional",
        ai_prompt_hint: "Answer typical objections, add social proof. Reinforce value."
      },
      {
        step_order: 3,
        action_type: "email",
        delay_days: 2,
        email_type: "last_call",
        tone: "direct",
        ai_prompt_hint: "Last call / next steps; if no reply, update status to 'Stalled / Nurture'."
      },
      {
        step_order: 4,
        action_type: "status",
        delay_days: 1,
        next_status: "nurture"
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

      console.log('Inserting steps:', stepsToInsert);

      const { error: stepsError } = await supabase
        .from('workflow_steps')
        .insert(stepsToInsert);

      if (stepsError) {
        console.error('Steps insert error:', stepsError);
        throw stepsError;
      }

      console.log(`Successfully inserted ${stepsToInsert.length} steps for workflow ${workflow.id}`);

      toast({
        title: "Template Deployed!",
        description: `${template.name} with ${stepsToInsert.length} steps has been added. Scroll down to "Your Workflows" to activate it.`,
      });

      onTemplateDeployed();
    } catch (error: any) {
      console.error('Error deploying template:', error);
      toast({
        title: "Deployment Failed",
        description: error?.message || "Could not deploy workflow template",
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
                      {template.steps.filter(s => s.action_type === 'email').length} emails
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
                        Trigger: {template.trigger.type === 'no_activity' 
                          ? `${template.trigger.days_inactive}d inactivity`
                          : template.trigger.type === 'new_lead'
                          ? `New leads (status: ${template.trigger.status})`
                          : `Status change: ${template.trigger.status}`
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
