'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check } from 'lucide-react';

interface ShareLinkProps {
  groupId: string;
}

export default function ShareLink({ groupId }: ShareLinkProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/group-order/${groupId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <p className="text-sm font-medium text-blue-900 mb-2">
        Share this link with others to join the group order
      </p>
      <div className="flex gap-2">
        <Input
          value={shareUrl}
          readOnly
          className="bg-white"
        />
        <Button
          onClick={handleCopy}
          variant="outline"
          className="shrink-0"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
