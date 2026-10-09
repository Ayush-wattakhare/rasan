const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const envFile = fs.readFileSync('d:/project/Rasan/.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0) {
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    env[key] = val;
  }
});
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const partnerId = '7080066c-996a-4230-a1f4-6a87d5b0d921';

  // 1. Update orders delivered by this partner to have guaranteed base delivery pay of 35
  const { data: updatedOrders, error: orderErr } = await supabase
    .from('orders')
    .update({ delivery_fee: 35 })
    .eq('delivery_partner_id', partnerId)
    .select('id, order_number, delivery_fee, status');

  console.log('UPDATED ORDERS:', updatedOrders, orderErr);

  // 2. Clear mock 34,500 from partner record and set genuine earnings
  const genuineTotal = (updatedOrders || []).length * 35;
  const { data: updatedPartner, error: partnerErr } = await supabase
    .from('delivery_partners')
    .update({
      earnings: {
        today: 35,
        this_week: genuineTotal,
        this_month: genuineTotal,
        total: genuineTotal,
      },
      total_deliveries: (updatedOrders || []).length,
    })
    .eq('id', partnerId)
    .select('id, earnings, total_deliveries');

  console.log('UPDATED PARTNER:', updatedPartner, partnerErr);
}
run();
