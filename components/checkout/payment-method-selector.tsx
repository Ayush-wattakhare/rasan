'use client';

import { CreditCard, Wallet, Banknote, Smartphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { PaymentMethod } from '@/types';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod | null;
  onSelectMethod: (method: PaymentMethod) => void;
}

const paymentMethods: {
  value: PaymentMethod;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'card',
    label: 'Credit/Debit Card',
    description: 'Pay securely with your card',
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    value: 'upi',
    label: 'UPI',
    description: 'Pay using UPI apps',
    icon: <Smartphone className="h-5 w-5" />,
  },
  {
    value: 'wallet',
    label: 'Wallet',
    description: 'Pay using digital wallet',
    icon: <Wallet className="h-5 w-5" />,
  },
  {
    value: 'cash',
    label: 'Cash on Delivery',
    description: 'Pay when you receive your order',
    icon: <Banknote className="h-5 w-5" />,
  },
];

export function PaymentMethodSelector({
  selectedMethod,
  onSelectMethod,
}: PaymentMethodSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Method</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedMethod || ''}
          onValueChange={(value) => onSelectMethod(value as PaymentMethod)}
        >
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div
                key={method.value}
                className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-accent cursor-pointer"
                onClick={() => onSelectMethod(method.value)}
              >
                <RadioGroupItem value={method.value} id={method.value} />
                <Label
                  htmlFor={method.value}
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-1">
                    {method.icon}
                    <span className="font-medium">{method.label}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {method.description}
                  </div>
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
