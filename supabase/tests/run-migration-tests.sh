#!/bin/bash
# Applies migrations 001 → 003 to a throwaway local Postgres database and checks the
# permission model (grants, RLS, guard triggers, payouts, notification triggers) by
# acting as anon / customer / vendor / rider / admin / service role.
#
# Requires: a local Postgres (psql, createdb, dropdb). No Docker or PostGIS needed:
# supabase-stub.sql emulates the Supabase roles and auth schema and stubs PostGIS.
#
# Usage: supabase/tests/run-migration-tests.sh            (DB name: rasan_migration_test)
set -u
cd "$(dirname "$0")"
DB=${DB:-rasan_migration_test}
MIG=../migrations
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# PostGIS is stubbed: drop the extension and GiST indexes, use the stub geography type.
sed -e 's/CREATE EXTENSION IF NOT EXISTS "postgis";/-- postgis stubbed/' \
    -e 's/GEOGRAPHY(POINT, 4326)/geography/g' -e 's/ USING GIST//gI' \
    "$MIG/001_initial_schema.sql" > "$TMP/001.sql"
# Seed the way an existing production DB looks before 003 (triggers off).
{ echo "SET session_replication_role = replica;"; cat seed.sql; echo "SET session_replication_role = origin;"; } > "$TMP/seed.sql"

dropdb --if-exists "$DB" && createdb "$DB" || exit 1
for f in supabase-stub.sql "$TMP/001.sql" "$MIG/002_fix_order_rls.sql" "$MIG/002_notifications_triggers.sql" \
         "$TMP/seed.sql" "$MIG/003_security_hardening.sql" "$MIG/003_security_hardening.sql"; do
  psql -X -q -v ON_ERROR_STOP=1 -d "$DB" -f "$f" > /dev/null 2> "$TMP/err" || { echo "Failed applying $f"; cat "$TMP/err"; exit 1; }
done
echo "Migrations applied (003 applied twice to check it is re-runnable)."
echo

PASS=0; FAIL=0
C=11111111-1111-1111-1111-111111111111; C2=22222222-2222-2222-2222-222222222222
V=33333333-3333-3333-3333-333333333333; R=44444444-4444-4444-4444-444444444444; A=55555555-5555-5555-5555-555555555555
VEN=aaaaaaaa-0000-0000-0000-000000000001; O1=dddddddd-0000-0000-0000-000000000001; O2=dddddddd-0000-0000-0000-000000000002; O3=dddddddd-0000-0000-0000-000000000003
S1=eeeeeeee-0000-0000-0000-000000000001; S2=eeeeeeee-0000-0000-0000-000000000002; MEAL=bbbbbbbb-0000-0000-0000-000000000001

# t "<name>" <role> <user-uuid|-> <expect: ok|err|rows=N> "<sql>"   (each case runs in a rolled-back transaction)
t() {
  local name="$1" role="$2" uid="$3" expect="$4" sql="$5" claims pre out rc res n
  if [ "$role" = "postgres" ]; then pre=""
  else
    if [ "$uid" = "-" ]; then claims="{\"role\":\"$role\"}"; else claims="{\"sub\":\"$uid\",\"role\":\"$role\"}"; fi
    pre="SET LOCAL ROLE $role; SELECT set_config('request.jwt.claims','$claims',true);"
  fi
  out=$(psql -X -At -v ON_ERROR_STOP=1 -d "$DB" -c "BEGIN; $pre" -c "$sql" -c "ROLLBACK;" 2>&1); rc=$?
  if [ $rc -ne 0 ]; then res=err
  elif [[ "$expect" == rows=* ]]; then
    n=$(echo "$out" | grep -E '^(UPDATE|DELETE|INSERT 0) [0-9]+' | tail -1 | grep -oE '[0-9]+$')
    [ -z "$n" ] && n=$(echo "$out" | grep -E '^[0-9]+$' | tail -1)
    res="rows=$n"
  else res=ok; fi
  if [ "$res" = "$expect" ]; then PASS=$((PASS+1)); echo "PASS  $name"
  else FAIL=$((FAIL+1)); echo "FAIL  $name  (expected $expect, got $res)"; echo "$out" | grep -i error | head -2 | sed 's/^/        /'; fi
}

echo "--- migration data checks"
t "app_metadata role backfilled"             postgres - rows=1 "select count(*) from auth.users where id='$V' and raw_app_meta_data->>'role'='vendor';"
t "legacy OTP moved to handover table"       postgres - rows=1 "select count(*) from order_handover_codes where order_id='$O1' and code='4821';"
t "legacy OTP stripped from address"         postgres - rows=0 "select count(*) from orders where delivery_address ? 'delivery_otp';"
t "in-flight order keeps old fallback PIN"   postgres - rows=1 "select count(*) from order_handover_codes where order_id='dddddddd-0000-0000-0000-000000000004' and code='7777';"
t "every open order has a PIN"               postgres - rows=0 "select count(*) from orders o where o.status not in ('delivered','cancelled') and not exists (select 1 from order_handover_codes h where h.order_id=o.id);"
t "live vendor owner grandfathered verified" postgres - rows=1 "select count(*) from profiles where id='66666666-6666-6666-6666-666666666666' and is_verified;"
t "vendors.is_active default false"          postgres - rows=1 "select count(*) from information_schema.columns where table_name='vendors' and column_name='is_active' and column_default='false';"

echo "--- profiles"
t "customer cannot make self admin"          authenticated $C err     "update profiles set role='admin' where id='$C';"
t "customer cannot un-suspend self"          authenticated $C err     "update profiles set is_active=true where id='$C';"
t "customer can edit own name"               authenticated $C rows=1  "update profiles set name='New' where id='$C';"
t "customer cannot read other profiles"      authenticated $C rows=0  "select count(*) from profiles where id='$C2';"
t "customer reads own profile"               authenticated $C rows=1  "select count(*) from profiles where id='$C';"
t "anon cannot read profiles"                anon - rows=0            "select count(*) from profiles;"
t "admin reads all profiles"                 authenticated $A rows=6  "select count(*) from profiles;"
t "role change syncs app_metadata"           postgres - rows=1        "update profiles set role='vendor' where id='$C2'; select count(*) from auth.users where id='$C2' and raw_app_meta_data->>'role'='vendor';"

echo "--- vendors"
t "anon lists active vendors (public cols)"  anon - ok                "select id, business_name, rating from vendors;"
t "anon cannot read bank_details"            anon - err               "select bank_details from vendors;"
t "user select * on vendors blocked"         authenticated $C err     "select * from vendors;"
t "owner sees own inactive vendor"           authenticated $V rows=1  "select count(*) from (select id from vendors where user_id='$V') x;"
t "vendor cannot set own rating"             authenticated $V err     "update vendors set rating=5 where user_id='$V';"
t "vendor edits storefront"                  authenticated $V rows=1  "update vendors set business_name='X', bank_details='{}' where user_id='$V';"
t "unverified vendor cannot go live"         authenticated $V err     "update vendors set is_active=true where user_id='$V';"
t "verified vendor can go live"              authenticated $V rows=1  "reset role; update profiles set is_verified=true where id='$V'; set local role authenticated; update vendors set is_active=true where user_id='$V';"
t "user cannot insert active vendor"         authenticated $C err     "insert into vendors(user_id,business_name,location,address,phone,email,operating_hours,is_active) values ('$C','B','POINT(1 1)','a','1','e','{}',true);"
t "user can insert pending vendor"           authenticated $C rows=1  "insert into vendors(user_id,business_name,location,address,phone,email,operating_hours) values ('$C','B','POINT(1 1)','a','1','e','{}');"

echo "--- delivery partners"
t "rider cannot edit earnings"               authenticated $R err     "update delivery_partners set earnings='{\"total\":99999}' where user_id='$R';"
t "rider cannot self-verify"                 authenticated $R err     "update delivery_partners set is_verified=true where user_id='$R';"
t "rider toggles online + location"          authenticated $R rows=1  "update delivery_partners set is_online=true, current_location='POINT(1 1)', updated_at=now() where user_id='$R';"
t "customer cannot read riders"              authenticated $C rows=0  "select count(*) from delivery_partners;"
t "anon cannot read riders"                  anon - rows=0            "select count(*) from delivery_partners;"
t "rider reads own row"                      authenticated $R rows=1  "select count(*) from delivery_partners where user_id='$R';"
t "user cannot insert verified rider"        authenticated $C err     "insert into delivery_partners(user_id,vehicle_type,vehicle_number,license_number,is_verified) values ('$C','bike','x','y',true);"
t "user can apply as rider"                  authenticated $C rows=1  "insert into delivery_partners(user_id,vehicle_type,vehicle_number,license_number,bank_details) values ('$C','bike','x','y','{}');"

echo "--- orders"
t "customer cannot insert orders"            authenticated $C err     "insert into orders(customer_id,vendor_id,items,subtotal,delivery_fee,tax,total,payment_method,delivery_address) values ('$C','$VEN','[]',1,0,0,1,'cash','{}');"
t "customer cannot mark paid"                authenticated $C err     "update orders set payment_status='paid' where id='$O3';"
t "customer cannot change status"            authenticated $C err     "update orders set status='delivered' where id='$O3';"
t "customer rates delivered order"           authenticated $C rows=1  "update orders set rating='{\"food\":5,\"delivery\":5}' where id='$O2';"
t "customer cannot rate undelivered order"   authenticated $C rows=0  "update orders set rating='{\"food\":5,\"delivery\":5}' where id='$O3';"
t "vendor cannot change order status"        authenticated $V err     "update orders set status='confirmed' where id='$O3';"
t "customer reads own orders"                authenticated $C rows=4  "select count(*) from orders;"
t "vendor reads kitchen orders"              authenticated $V rows=4  "select count(*) from orders;"
t "admin reads all orders"                   authenticated $A rows=4  "select count(*) from orders;"
t "admin reads all subscriptions"            authenticated $A rows=2  "select count(*) from subscriptions;"
t "admin cannot read handover PINs"          authenticated $A rows=0  "select count(*) from order_handover_codes;"
t "other customer sees none"                 authenticated $C2 rows=0 "select count(*) from orders;"
t "service role transitions order"           service_role - rows=1    "update orders set status='confirmed', payment_status='paid' where id='$O3';"

echo "--- handover codes"
t "customer reads own PINs"                  authenticated $C rows=3  "select count(*) from order_handover_codes;"
t "vendor cannot read PIN"                   authenticated $V rows=0  "select count(*) from order_handover_codes;"
t "rider cannot read PIN"                    authenticated $R rows=0  "select count(*) from order_handover_codes;"
t "customer cannot write PIN"                authenticated $C err     "insert into order_handover_codes(order_id,code) values ('$O3','1111');"
t "embed works for customer"                 authenticated $C rows=3  "select count(*) from orders o join order_handover_codes h on h.order_id=o.id;"

echo "--- subscriptions"
t "customer cannot insert subscription"      authenticated $C err     "insert into subscriptions(customer_id,vendor_id,plan_type,meal_type,start_date,end_date,delivery_time,address,price) values ('$C','$VEN','weekly','lunch','2026-10-11','2026-10-18','12:00','{}',1);"
t "customer cannot change price"             authenticated $C err     "update subscriptions set price=1 where id='$S1';"
t "customer cannot extend end_date"          authenticated $C err     "update subscriptions set end_date='2030-01-01' where id='$S1';"
t "customer pauses subscription"             authenticated $C rows=1  "update subscriptions set status='paused' where id='$S1';"
t "customer cannot revive cancelled"         authenticated $C err     "update subscriptions set status='active' where id='$S2';"
t "customer edits deliveries/address"        authenticated $C rows=1  "update subscriptions set deliveries='[]', address='{}', updated_at=now() where id='$S1';"
t "service role extends end_date"            service_role - rows=1    "update subscriptions set end_date='2026-10-19' where id='$S1';"

echo "--- reviews"
t "review own delivered order"               authenticated $C rows=1  "insert into reviews(meal_id,user_id,order_id,rating) values ('$MEAL','$C','$O2',5);"
t "no review for undelivered order"          authenticated $C err     "insert into reviews(meal_id,user_id,order_id,rating) values ('$MEAL','$C','$O3',5);"
t "no review for someone else's order"       authenticated $C2 err    "insert into reviews(meal_id,user_id,order_id,rating) values ('$MEAL','$C2','$O2',5);"

echo "--- payouts"
t "user cannot call request_payout"          authenticated $R err     "select request_payout('$R','delivery',10,'upi','{}',0.07);"
t "user cannot insert payout"                authenticated $R err     "insert into payouts(user_id,payee_type,amount,method,reference) values ('$R','delivery',10,'upi','X');"
t "rider overdraw rejected"                  service_role - err       "select request_payout('$R','delivery',150,'upi','{}',0.07);"
t "rider payout within balance"              service_role - rows=1    "select request_payout('$R','delivery',60,'upi','{}',0.07); select count(*) from delivery_partners where user_id='$R' and (earnings->>'total')::numeric=40;"
t "vendor payout within balance (930)"       service_role - rows=1    "select request_payout('$V','vendor',900,'bank','{}',0.07); select count(*) from payouts where user_id='$V' and status='pending';"
t "vendor second payout overdraws"           service_role - err       "select request_payout('$V','vendor',900,'bank','{}',0.07); select request_payout('$V','vendor',100,'bank','{}',0.07);"
t "user reads own payouts only"              authenticated $V rows=0  "select count(*) from payouts where user_id<>'$V';"

echo "--- fixed notification triggers"
t "order insert fires vendor notification"   service_role - rows=1    "insert into orders(id,customer_id,vendor_id,items,subtotal,delivery_fee,tax,total,payment_method,delivery_address) values ('dddddddd-0000-0000-0000-000000000009','$C','$VEN','[]',1,0,0,1,'cash','{}'); select count(*) from notifications where user_id='$V' and title='New Mission Received';"
t "rider pickup fires notifications"         service_role - rows=1    "update orders set status='ready' where id='$O3'; update orders set status='picked_up', delivery_partner_id='cccccccc-0000-0000-0000-000000000001' where id='$O3'; select count(*) from notifications where user_id='$V' and title='Order Picked Up';"
t "delivered credits rider once (trigger)"   service_role - rows=1    "update orders set status='delivered', delivery_fee=35 where id='$O1'; update orders set status='delivered' where id='$O1'; select count(*) from delivery_partners where user_id='$R' and (earnings->>'total')::numeric=135;"

echo; echo "PASSED $PASS  FAILED $FAIL"
dropdb --if-exists "$DB"
[ "$FAIL" -eq 0 ]
