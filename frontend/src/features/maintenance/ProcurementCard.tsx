'use client';

import { Package, Truck, CheckCircle2, Circle } from 'lucide-react';
import { clsx } from 'clsx';
import { GlowCard } from '@/components/ui/GlowCard';
import { StatusBadge, statusToVariant } from '@/components/ui/StatusBadge';
import { useOrchestratorState } from '@/hooks/useOrchestratorState';
import { Skeleton } from '@/components/ui/Skeleton';

const DELIVERY_STEPS = [
  { label: 'Order Placed', key: 'ORDERED' },
  { label: 'In Transit', key: 'IN_TRANSIT' },
  { label: 'Delivered', key: 'DELIVERED' },
];

function getDeliveryStepIndex(status: string): number {
  if (status === 'PENDING') return -1;
  if (status === 'ORDERED') return 0;
  if (status === 'DELIVERED') return 2;
  return 1; // Default: in transit
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function ProcurementCard() {
  const { data: state, isLoading } = useOrchestratorState();
  const order = state?.order ?? null;
  const supplier = state?.selected_supplier ?? null;

  if (isLoading) {
    return (
      <div className="glass-card p-6 flex flex-col gap-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="glass-card p-8 flex flex-col items-center justify-center gap-4 text-center min-h-[260px]">
        <div className="w-14 h-14 rounded-full bg-zinc-800/60 border border-zinc-700 flex items-center justify-center">
          <Package className="h-6 w-6 text-zinc-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-400">No procurement order</p>
          <p className="text-xs text-zinc-600 mt-1">
            A procurement order will be generated when parts are needed.
          </p>
        </div>
      </div>
    );
  }

  const supplierName = supplier?.name ?? order.supplier_id;
  const deliveryDate = order.estimated_delivery
    ? new Date(order.estimated_delivery).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

  const currentStepIndex = getDeliveryStepIndex(order.status);

  return (
    <GlowCard accent="emerald" className="p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <Package className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/70">
              Procurement Order
            </p>
            <p className="text-[10px] font-mono text-zinc-500 mt-0.5">{order.id}</p>
          </div>
        </div>
        <StatusBadge variant={statusToVariant(order.status)} />
      </div>

      {/* Supplier */}
      <div className="bg-zinc-900/60 rounded-lg p-3 border border-zinc-800">
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Supplier</p>
        <p className="text-sm font-bold text-zinc-100">{supplierName}</p>
        {supplier?.rating && (
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Rating:{' '}
            <span className="text-emerald-400 font-semibold">{supplier.rating.toFixed(1)}/5.0</span>
          </p>
        )}
      </div>

      {/* Order Details */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-900/60 rounded-lg p-3 border border-zinc-800">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Item</p>
          <p className="text-xs font-semibold text-zinc-200">{order.item_name}</p>
        </div>
        <div className="bg-zinc-900/60 rounded-lg p-3 border border-zinc-800">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Quantity</p>
          <p className="text-sm font-bold text-zinc-100">{order.quantity}</p>
        </div>
      </div>

      {/* Total Cost */}
      <div className="text-center py-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Total Cost</p>
        <p className="text-3xl font-black text-emerald-400 tabular-nums">
          {formatCurrency(order.total_cost)}
        </p>
      </div>

      {/* Estimated Delivery */}
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <Truck className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0" />
        <span>
          Estimated Delivery:{' '}
          <span className="text-zinc-200 font-semibold">{deliveryDate}</span>
        </span>
      </div>

      {/* Delivery Timeline */}
      <div>
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-3">Delivery Progress</p>
        <div className="flex items-center gap-0">
          {DELIVERY_STEPS.map((step, i) => {
            const isDone = i <= currentStepIndex;
            const isCurrent = i === currentStepIndex;
            const isLast = i === DELIVERY_STEPS.length - 1;

            return (
              <div key={step.key} className="flex items-center flex-1 min-w-0">
                {/* Step Node */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className={clsx(
                      'w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300',
                      isDone
                        ? 'bg-emerald-500 shadow-sm shadow-emerald-500/30'
                        : 'bg-zinc-800 border border-zinc-700'
                    )}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-zinc-950" />
                    ) : (
                      <Circle className="w-3 h-3 text-zinc-600" />
                    )}
                  </div>
                  <p
                    className={clsx(
                      'text-[9px] font-semibold mt-1 text-center leading-tight',
                      isCurrent
                        ? 'text-emerald-400'
                        : isDone
                        ? 'text-zinc-400'
                        : 'text-zinc-600'
                    )}
                  >
                    {step.label}
                  </p>
                </div>

                {/* Connector */}
                {!isLast && (
                  <div
                    className={clsx(
                      'flex-1 h-0.5 mx-1 rounded-full transition-all duration-500',
                      i < currentStepIndex ? 'bg-emerald-500' : 'bg-zinc-800'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </GlowCard>
  );
}
