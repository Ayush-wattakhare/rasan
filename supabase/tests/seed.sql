-- ids
\set C  '11111111-1111-1111-1111-111111111111'
\set C2 '22222222-2222-2222-2222-222222222222'
\set V  '33333333-3333-3333-3333-333333333333'
\set R  '44444444-4444-4444-4444-444444444444'
\set A  '55555555-5555-5555-5555-555555555555'
INSERT INTO auth.users(id,email) VALUES (:'C','c@x.in'),(:'C2','c2@x.in'),(:'V','v@x.in'),(:'R','r@x.in'),(:'A','a@x.in');
INSERT INTO profiles(id,email,name,role,is_verified) VALUES
 (:'C','c@x.in','Cust','customer',true),(:'C2','c2@x.in','Cust2','customer',true),
 (:'V','v@x.in','Chef','vendor',false),(:'R','r@x.in','Rider','delivery',true),(:'A','a@x.in','Admin','admin',true);
INSERT INTO vendors(id,user_id,business_name,location,address,phone,email,operating_hours,is_active,bank_details)
 VALUES ('aaaaaaaa-0000-0000-0000-000000000001',:'V','Chef Kitchen','POINT(73 18)','Pune','9','v@x.in','{}',false,'{"account_number":"123456789"}');
INSERT INTO meals(id,vendor_id,name,category,meal_type,price,preparation_time)
 VALUES ('bbbbbbbb-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','Thali','main','lunch',150,20);
INSERT INTO delivery_partners(id,user_id,vehicle_type,vehicle_number,license_number,is_verified,earnings,bank_details)
 VALUES ('cccccccc-0000-0000-0000-000000000001',:'R','bike','MH1','DL1',true,'{"today":0,"this_week":0,"this_month":0,"total":100}','{"account_number":"999"}');
-- O1 out for delivery with legacy OTP in address; O2 delivered; O3 pending online unpaid
INSERT INTO orders(id,order_number,customer_id,vendor_id,delivery_partner_id,items,subtotal,delivery_fee,tax,total,status,payment_status,payment_method,delivery_address) VALUES
 ('dddddddd-0000-0000-0000-000000000001','ORD-1',:'C','aaaaaaaa-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000001','[]',150,0,2,152,'out_for_delivery','pending','cash','{"street":"MG Rd","delivery_otp":"4821"}'),
 ('dddddddd-0000-0000-0000-000000000002','ORD-2',:'C','aaaaaaaa-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000001','[{"meal_id":"bbbbbbbb-0000-0000-0000-000000000001"}]',1000,0,0,1000,'delivered','paid','upi','{"street":"MG Rd"}'),
 ('dddddddd-0000-0000-0000-000000000003','ORD-3',:'C','aaaaaaaa-0000-0000-0000-000000000001',NULL,'[]',150,0,2,152,'pending','pending','upi','{"street":"MG Rd"}');
INSERT INTO subscriptions(id,customer_id,vendor_id,plan_type,meal_type,start_date,end_date,delivery_time,address,price,status) VALUES
 ('eeeeeeee-0000-0000-0000-000000000001',:'C','aaaaaaaa-0000-0000-0000-000000000001','weekly','lunch','2026-10-11','2026-10-18','12:00','{}',720,'active'),
 ('eeeeeeee-0000-0000-0000-000000000002',:'C','aaaaaaaa-0000-0000-0000-000000000001','weekly','lunch','2026-09-01','2026-09-08','12:00','{}',720,'cancelled');

-- In-flight order created by the old app without a stored PIN
INSERT INTO orders(id,order_number,customer_id,vendor_id,items,subtotal,delivery_fee,tax,total,status,payment_status,payment_method,delivery_address) VALUES
 ('dddddddd-0000-0000-0000-000000000004','ORD-20261009-7777',:'C','aaaaaaaa-0000-0000-0000-000000000001','[]',150,0,2,152,'preparing','pending','cash','{"street":"MG Rd"}');
-- A kitchen that is already live but whose owner was never marked verified
INSERT INTO auth.users(id,email) VALUES ('66666666-6666-6666-6666-666666666666','v2@x.in');
INSERT INTO profiles(id,email,name,role,is_verified) VALUES ('66666666-6666-6666-6666-666666666666','v2@x.in','Chef2','vendor',false);
INSERT INTO vendors(id,user_id,business_name,location,address,phone,email,operating_hours,is_active)
 VALUES ('aaaaaaaa-0000-0000-0000-000000000002','66666666-6666-6666-6666-666666666666','Live Kitchen','POINT(73 18)','Pune','9','v2@x.in','{}',true);
