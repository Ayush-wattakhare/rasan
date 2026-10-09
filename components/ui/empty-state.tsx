import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({
  icon = '📭',
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="p-12">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="text-6xl">{icon}</div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">{title}</h3>
            {description && (
              <p className="text-muted-foreground max-w-md">{description}</p>
            )}
          </div>
          {action && (
            <Button onClick={action.onClick}>{action.label}</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
