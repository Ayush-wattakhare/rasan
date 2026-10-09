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
  const orderId = 'eeb5c7f7-cbb4-4667-a976-393f6dcc8ef2';
  const { data: order, error } = await supabase.from('orders').select('*').eq('id', orderId).single();
  console.log('ORDER in DB:', {
    id: order?.id,
    status: order?.status,
    vendor_id: order?.vendor_id,
    customer_id: order?.customer_id,
    delivery_partner_id: order?.delivery_partner_id,
    created_at: order?.created_at,
    updated_at: order?.updated_at,
  });
  if (error) console.log('ERROR:', error);
}
run();
