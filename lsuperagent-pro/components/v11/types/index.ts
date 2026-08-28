export type AppRoute =
  | 'landing'
  | 'smart_chat'
  | 'deep_research'
  | 'create_image'
  | 'agent_mode'
  | 'memory'
  | 'settings'
  | 'projects'
  | 'runtime'
  | 'audit';

export type ToolCategory = 'all' | 'ai_writing' | 'design' | 'analysis' | 'development';

export interface ToolItem {
  id: string;
  name: string;
  nameEn: string;
  category: ToolCategory;
  description: string;
  badge: 'Beta' | 'Coming Soon' | 'Ready' | 'Preview';
  icon: string;
  capabilities: string[];
  route?: AppRoute;
  statusText: string;
}

export type StreamingStatus =
  | 'idle'
  | 'queued'
  | 'running'
  | 'partial'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'retry';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  status?: StreamingStatus;
  isDemo?: boolean;
  tokens?: number;
}

export interface ResearchPlanStep {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  sources?: string[];
  findings?: string;
}

export interface ResearchTask {
  id: string;
  query: string;
  depth: 'standard' | 'deep' | 'comprehensive';
  status: 'idle' | 'searching' | 'synthesizing' | 'reviewing' | 'completed' | 'error';
  steps: ResearchPlanStep[];
  report?: string;
  createdAt: string;
}

export type ImageWorkflowStage =
  | 'prompt_input'
  | 'brief_picture'
  | 'approval_pending'
  | 'rendering'
  | 'qc_check'
  | 'completed'
  | 'rejected';

export interface ImageGenerationItem {
  id: string;
  prompt: string;
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:3';
  style: string;
  stage: ImageWorkflowStage;
  briefSummary?: {
    composition: string;
    colorPalette: string[];
    lighting: string;
    elements: string[];
  };
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  renderProgress?: number;
  qcResult?: {
    score: number;
    passed: boolean;
    artifactsChecked: boolean;
    details: string;
  };
  mockImageUrl?: string;
  createdAt: string;
}

export interface AgentStep {
  id: string;
  title: string;
  tool: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  output?: string;
}

export interface AgentTask {
  id: string;
  objective: string;
  mode: 'autonomous' | 'supervised' | 'manual_approval';
  status: 'idle' | 'planning' | 'executing' | 'completed' | 'failed' | 'paused';
  steps: AgentStep[];
  logs: string[];
  createdAt: string;
}

export interface MemoryEntry {
  id: string;
  category: 'preference' | 'project_rule' | 'user_profile' | 'context_fact';
  key: string;
  value: string;
  importance: 'high' | 'medium' | 'low';
  updatedAt: string;
  isSynced: boolean;
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  route: AppRoute;
  status: 'SUCCESS' | 'WARNING' | 'FAILED' | 'NOT_CONNECTED';
  details: string;
}

export interface RuntimeGatewayStatus {
  connected: boolean;
  statusText: 'NOT_CONNECTED' | 'CONNECTED' | 'DEGRADED';
  adapterName: string;
  mode: 'MockRuntimeAdapter' | 'LiveGateway';
  apiLatencyMs: number;
  activeProvider: string;
  supabaseAuth: 'DISCONNECTED' | 'READY';
  version: string;
  lastChecked: string;
}
