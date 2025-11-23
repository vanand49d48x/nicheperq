import { useState, useCallback, useEffect } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

interface NodeData extends Record<string, unknown> {
  emailType?: string;
  tone?: string;
  aiHint?: string;
  delayDays?: number;
  conditionType?: string;
  conditionValue?: string;
  nextStatus?: string;
}

type WorkflowNode = Node<NodeData>;
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Plus, Save, Mail, Clock, GitBranch, Play, Eye, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Custom Node Components
const EmailNode = ({ data }: any) => (
  <div className="px-4 py-3 border-2 border-primary rounded-lg bg-card shadow-lg min-w-[220px] relative">
    <div className="absolute -top-3 -left-3 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
      {data.stepNumber || '?'}
    </div>
    <div className="flex items-center gap-2 mb-2">
      <Mail className="h-4 w-4 text-primary" />
      <span className="font-semibold text-sm">📧 Send Email</span>
    </div>
    <div className="text-xs font-medium text-foreground mb-1">
      {data.emailType ? data.emailType.replace(/_/g, ' ').toUpperCase() : 'DRAFT EMAIL'}
    </div>
    {data.tone && (
      <Badge variant="outline" className="mt-1 text-xs">
        Tone: {data.tone}
      </Badge>
    )}
  </div>
);

const DelayNode = ({ data }: any) => (
  <div className="px-4 py-3 border-2 border-accent rounded-lg bg-card shadow-lg min-w-[220px] relative">
    <div className="absolute -top-3 -left-3 bg-accent text-accent-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
      {data.stepNumber || '?'}
    </div>
    <div className="flex items-center gap-2 mb-2">
      <Clock className="h-4 w-4 text-accent" />
      <span className="font-semibold text-sm">⏰ Wait</span>
    </div>
    <div className="text-xs font-medium text-foreground">
      Wait {data.delayDays || 1} day{data.delayDays !== 1 ? 's' : ''} then continue
    </div>
  </div>
);

const ConditionNode = ({ data }: any) => (
  <div className="px-4 py-3 border-2 border-yellow-500 rounded-lg bg-card shadow-lg min-w-[220px] relative">
    <div className="absolute -top-3 -left-3 bg-yellow-500 text-yellow-950 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
      {data.stepNumber || '?'}
    </div>
    <div className="flex items-center gap-2 mb-2">
      <GitBranch className="h-4 w-4 text-yellow-500" />
      <span className="font-semibold text-sm">🔀 If/Then Branch</span>
    </div>
    <div className="text-xs font-medium text-foreground">
      {data.conditionType ? data.conditionType.replace(/_/g, ' ').toUpperCase() : 'CHECK CONDITION'}
    </div>
  </div>
);

const StatusNode = ({ data }: any) => (
  <div className="px-4 py-3 border-2 border-green-500 rounded-lg bg-card shadow-lg min-w-[220px] relative">
    <div className="absolute -top-3 -left-3 bg-green-500 text-green-950 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
      {data.stepNumber || '?'}
    </div>
    <div className="flex items-center gap-2 mb-2">
      <Play className="h-4 w-4 text-green-500" />
      <span className="font-semibold text-sm">✅ Change Status</span>
    </div>
    <div className="text-xs font-medium text-foreground">
      Move lead to: {data.nextStatus ? data.nextStatus.replace(/_/g, ' ').toUpperCase() : 'CONTACTED'}
    </div>
  </div>
);

const StartNode = () => (
  <div className="px-6 py-4 border-2 border-secondary rounded-full bg-gradient-primary text-primary-foreground shadow-lg">
    <span className="font-bold text-base">🚀 WORKFLOW START</span>
  </div>
);

const nodeTypes: NodeTypes = {
  email: EmailNode,
  delay: DelayNode,
  condition: ConditionNode,
  status: StatusNode,
  start: StartNode,
};

interface VisualWorkflowBuilderProps {
  workflowId?: string;
  onBack: () => void;
}

export default function VisualWorkflowBuilder({ workflowId, onBack }: VisualWorkflowBuilderProps) {
  const { toast } = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNode>([
    {
      id: 'start',
      type: 'start',
      position: { x: 250, y: 50 },
      data: {},
    },
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [workflowName, setWorkflowName] = useState('New Workflow');
  const [emailPreview, setEmailPreview] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | undefined>(workflowId);

  useEffect(() => {
    if (workflowId) {
      loadWorkflow(workflowId);
    }
  }, [workflowId]);

  const loadWorkflow = async (id: string) => {
    try {
      const { data: workflow, error: workflowError } = await supabase
        .from('ai_workflows')
        .select('*')
        .eq('id', id)
        .single();

      if (workflowError) throw workflowError;

      const { data: steps, error: stepsError } = await supabase
        .from('workflow_steps')
        .select('*')
        .eq('workflow_id', id)
        .order('step_order');

      if (stepsError) throw stepsError;

      setWorkflowName(workflow.name);
      setCurrentWorkflowId(id);

      // Convert steps to nodes
      const newNodes: WorkflowNode[] = [
        {
          id: 'start',
          type: 'start',
          position: { x: 250, y: 50 },
          data: {},
        },
      ];

      steps.forEach((step, index) => {
        newNodes.push({
          id: step.id,
          type: step.action_type,
          position: { x: 250, y: (index + 1) * 120 + 50 },
          data: {
            stepNumber: index + 1,
            emailType: step.email_type,
            tone: step.tone,
            aiHint: step.ai_prompt_hint,
            delayDays: step.delay_days,
            conditionType: step.condition_type,
            conditionValue: step.condition_value,
            nextStatus: step.next_status,
          },
        });
      });

      setNodes(newNodes);

      // Auto-connect nodes in sequence
      const newEdges: Edge[] = [];
      for (let i = 0; i < newNodes.length - 1; i++) {
        newEdges.push({
          id: `e${i}`,
          source: newNodes[i].id,
          target: newNodes[i + 1].id,
          type: 'smoothstep',
          animated: true,
        });
      }
      setEdges(newEdges);

      toast({
        title: "Workflow Loaded",
        description: `"${workflow.name}" loaded successfully`,
      });
    } catch (error) {
      console.error('Load error:', error);
      toast({
        title: "Load Failed",
        description: "Could not load workflow",
        variant: "destructive",
      });
    }
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event: any, node: WorkflowNode) => {
    setSelectedNode(node);
  }, []);

  const addNode = (type: string) => {
    const stepNumber = nodes.length; // Current length = next step number
    const newNode: WorkflowNode = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: 250, y: nodes.length * 120 + 150 },
      data: { 
        ...getDefaultNodeData(type),
        stepNumber
      },
    };
    setNodes((nds) => [...nds, newNode]);
    
    // Auto-connect to the last node
    if (nodes.length > 0) {
      const lastNode = nodes[nodes.length - 1];
      const newEdge: Edge = {
        id: `e${edges.length}`,
        source: lastNode.id,
        target: newNode.id,
        type: 'smoothstep',
        animated: true,
      };
      setEdges((eds) => [...eds, newEdge]);
    }
  };

  const getDefaultNodeData = (type: string): NodeData => {
    switch (type) {
      case 'email':
        return { emailType: 'follow_up', tone: 'professional' };
      case 'delay':
        return { delayDays: 3 };
      case 'condition':
        return { conditionType: 'email_opened' };
      case 'status':
        return { nextStatus: 'contacted' };
      default:
        return {};
    }
  };

  const updateNodeData = (key: string, value: any) => {
    if (!selectedNode) return;
    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNode.id
          ? { ...node, data: { ...node.data, [key]: value } }
          : node
      )
    );
    setSelectedNode((prev) => prev ? { ...prev, data: { ...prev.data, [key]: value } } : null);
  };

  const generateEmailPreview = async () => {
    if (!selectedNode || selectedNode.type !== 'email') return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get a sample lead for preview
    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user.id)
      .limit(5);

    if (!leads || leads.length === 0) {
      toast({
        title: "No Leads Available",
        description: "Add some leads first to preview emails",
        variant: "destructive",
      });
      return;
    }

    const leadId = selectedLeadId || leads[0].id;
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-draft-email', {
        body: {
          leadId,
          emailType: selectedNode.data.emailType,
          tone: selectedNode.data.tone,
          aiHint: selectedNode.data.aiHint,
        },
      });

      if (error) throw error;

      setEmailPreview({
        subject: data.subject,
        body: data.body,
        leadName: leads.find(l => l.id === leadId)?.business_name,
      });
      setPreviewOpen(true);
    } catch (error) {
      console.error('Email preview error:', error);
      toast({
        title: "Preview Failed",
        description: "Could not generate email preview",
        variant: "destructive",
      });
    }
  };

  const saveWorkflow = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Convert visual nodes to workflow steps
    const steps = nodes
      .filter(n => n.type !== 'start')
      .map((node, index) => ({
        step_order: index + 1,
        action_type: node.type || 'email',
        delay_days: node.data?.delayDays || 0,
        email_type: node.data?.emailType || null,
        tone: node.data?.tone || null,
        ai_prompt_hint: node.data?.aiHint || null,
        condition_type: node.data?.conditionType || null,
        condition_value: node.data?.conditionValue || null,
        next_status: node.data?.nextStatus || null,
        branch_to_step_order: null,
      }));

    try {
      if (currentWorkflowId) {
        // Update existing workflow
        const { error: workflowError } = await supabase
          .from('ai_workflows')
          .update({
            name: workflowName,
            description: `Visual workflow with ${steps.length} steps`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentWorkflowId);

        if (workflowError) throw workflowError;

        // Delete old steps
        await supabase
          .from('workflow_steps')
          .delete()
          .eq('workflow_id', currentWorkflowId);

        // Insert new steps
        const stepsToInsert = steps.map(step => ({
          ...step,
          workflow_id: currentWorkflowId,
        }));

        const { error: stepsError } = await supabase
          .from('workflow_steps')
          .insert(stepsToInsert);

        if (stepsError) throw stepsError;

        toast({
          title: "Workflow Updated",
          description: `"${workflowName}" has been updated successfully`,
        });
      } else {
        // Create new workflow
        const { data: workflow, error: workflowError } = await supabase
          .from('ai_workflows')
          .insert({
            user_id: user.id,
            name: workflowName,
            description: `Visual workflow with ${steps.length} steps`,
            trigger: { type: 'manual', value: '' },
            is_active: false,
          })
          .select()
          .single();

        if (workflowError) throw workflowError;

        // Save steps
        const stepsToInsert = steps.map(step => ({
          ...step,
          workflow_id: workflow.id,
        }));

        const { error: stepsError } = await supabase
          .from('workflow_steps')
          .insert(stepsToInsert);

        if (stepsError) throw stepsError;

        setCurrentWorkflowId(workflow.id);

        toast({
          title: "Workflow Saved",
          description: `"${workflowName}" has been saved successfully`,
        });
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save Failed",
        description: "Could not save workflow",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-[calc(100vh-200px)] flex gap-4">
      {/* Toolbar */}
      <Card className="w-64 flex-shrink-0 overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Workflow Builder</CardTitle>
            <Button variant="ghost" size="sm" onClick={onBack}>
              Back
            </Button>
          </div>
          <div className="bg-accent/50 border border-border rounded-lg p-3 mt-2">
            <p className="text-xs text-muted-foreground">
              📋 <strong>You're building:</strong> An automated email sequence that runs when leads match certain conditions.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              ➡️ <strong>Flow:</strong> Steps run top-to-bottom. Arrows show the path.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Workflow Name</Label>
            <Input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="My Workflow"
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Add Step</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => addNode('email')}
                className="w-full"
              >
                <Mail className="h-4 w-4 mr-1" />
                Email
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addNode('delay')}
                className="w-full"
              >
                <Clock className="h-4 w-4 mr-1" />
                Wait
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addNode('condition')}
                className="w-full"
              >
                <GitBranch className="h-4 w-4 mr-1" />
                Branch
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addNode('status')}
                className="w-full"
              >
                <Play className="h-4 w-4 mr-1" />
                Status
              </Button>
            </div>
          </div>

          <Separator />

          <Button onClick={saveWorkflow} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Save Workflow
          </Button>
        </CardContent>
      </Card>

      {/* Canvas */}
      <div className="flex-1 border rounded-lg bg-background">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {/* Properties Panel */}
      {selectedNode && selectedNode.type !== 'start' && (
        <Card className="w-80 flex-shrink-0 overflow-y-auto">
          <CardHeader>
            <CardTitle className="text-lg">Step Properties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedNode.type === 'email' && (
              <>
                <div>
                  <Label>Email Type</Label>
                  <Select
                    value={selectedNode.data?.emailType || ''}
                    onValueChange={(value) => updateNodeData('emailType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="introduction">Introduction</SelectItem>
                      <SelectItem value="follow_up">Follow Up</SelectItem>
                      <SelectItem value="value_proposition">Value Proposition</SelectItem>
                      <SelectItem value="case_study">Case Study</SelectItem>
                      <SelectItem value="closing">Closing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tone</Label>
                  <Select
                    value={selectedNode.data?.tone || ''}
                    onValueChange={(value) => updateNodeData('tone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>AI Hint (Optional)</Label>
                  <Textarea
                    value={selectedNode.data?.aiHint || ''}
                    onChange={(e) => updateNodeData('aiHint', e.target.value)}
                    placeholder="e.g., Mention our recent partnership success..."
                    rows={3}
                  />
                </div>

                <Button onClick={generateEmailPreview} className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Email
                </Button>
              </>
            )}

            {selectedNode.type === 'delay' && (
              <div>
                <Label>Delay (Days)</Label>
                <Input
                  type="number"
                  value={selectedNode.data?.delayDays || 1}
                  onChange={(e) => updateNodeData('delayDays', parseInt(e.target.value))}
                  min={1}
                />
              </div>
            )}

            {selectedNode.type === 'condition' && (
              <>
                <div>
                  <Label>Condition Type</Label>
                  <Select
                    value={selectedNode.data?.conditionType || ''}
                    onValueChange={(value) => updateNodeData('conditionType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email_opened">Email Opened</SelectItem>
                      <SelectItem value="email_clicked">Link Clicked</SelectItem>
                      <SelectItem value="reply_received">Reply Received</SelectItem>
                      <SelectItem value="no_response">No Response</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {selectedNode.type === 'status' && (
              <div>
                <Label>New Status</Label>
                <Select
                  value={selectedNode.data?.nextStatus || ''}
                  onValueChange={(value) => updateNodeData('nextStatus', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="in_conversation">In Conversation</SelectItem>
                    <SelectItem value="active_partner">Active Partner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Email Preview Sheet */}
      <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
        <SheetContent side="right" className="w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Email Preview</SheetTitle>
          </SheetHeader>
          {emailPreview && (
            <div className="mt-6 space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">To</Label>
                <p className="font-medium">{emailPreview.leadName}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Subject</Label>
                <p className="font-medium">{emailPreview.subject}</p>
              </div>
              <Separator />
              <div>
                <Label className="text-xs text-muted-foreground">Body</Label>
                <div
                  className="mt-2 p-4 border rounded-lg bg-muted/50 whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: emailPreview.body }}
                />
              </div>
              <Button onClick={() => generateEmailPreview()} variant="outline" className="w-full">
                <Sparkles className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}