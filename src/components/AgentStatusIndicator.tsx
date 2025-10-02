import { Brain, CheckCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AgentStatusIndicatorProps {
  documentsCount: number;
  isProcessing: boolean;
}

export function AgentStatusIndicator({ documentsCount, isProcessing }: AgentStatusIndicatorProps) {
  const getStatus = () => {
    if (isProcessing) {
      return {
        icon: Brain,
        label: "Processando...",
        variant: "secondary" as const,
        className: "animate-pulse"
      };
    }
    
    if (documentsCount > 0) {
      return {
        icon: CheckCircle,
        label: `Agente Ativo (${documentsCount} docs)`,
        variant: "default" as const,
        className: ""
      };
    }
    
    return {
      icon: AlertCircle,
      label: "Aguardando documentos",
      variant: "outline" as const,
      className: ""
    };
  };

  const status = getStatus();
  const Icon = status.icon;

  return (
    <Badge variant={status.variant} className={`flex items-center gap-2 ${status.className}`}>
      <Icon className="w-4 h-4" />
      {status.label}
    </Badge>
  );
}