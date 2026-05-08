create table public."FMS" (
  id bigserial not null,
  timestamp timestamp without time zone null,
  complaint_id character varying(50) null,
  company_name character varying(150) null,
  mode_of_call character varying(50) null,
  id_number text null,
  project_name character varying(150) null,
  complaint_number character varying(100) null,
  complaint_date date null,
  beneficiary_name character varying(150) null,
  contact_number text null,
  village character varying(150) null,
  block character varying(150) null,
  district character varying(150) null,
  product character varying(150) null,
  make character varying(150) null,
  rating text null,
  qty integer null,
  insurance_type character varying(100) null,
  nature_of_complaint text null,
  technician_name character varying(150) null,
  technician_contact text null,
  assignee_whatsapp_number text null,
  planned timestamp without time zone null,
  actual timestamp without time zone null,
  delay integer null,
  status character varying(50) null,
  attend character varying(50) null,
  controller_rid_no character varying(100) null,
  product_sl_no character varying(100) null,
  challan_date date null,
  close_date date null,
  challan_no character varying(100) null,
  last_attend_status character varying(100) null,
  planned1 timestamp without time zone null,
  actual1 timestamp without time zone null,
  delay1 integer null,
  company character varying(150) null,
  email character varying(150) null,
  pdf text null,
  assign_to_vendor boolean null,
  created_at timestamp without time zone null default now(),
  constraint FMS_pkey primary key (id)
) TABLESPACE pg_default;

create trigger trigger_set_planned BEFORE INSERT on "FMS" for EACH row
execute FUNCTION set_planned_default ();






create table public."AssignToVendor" (
  id bigserial not null,
  timestamp timestamp without time zone null,
  vendor_name character varying(150) null,
  product_type character varying(150) null,
  send_details_to_vendor boolean null default false,
  vendor_complaint_id character varying(100) null,
  date date null,
  complaint_id character varying(50) null,
  upload_file text null,
  created_at timestamp without time zone null default now(),
  constraint AssignToVendor_pkey primary key (id)
) TABLESPACE pg_default;





create table public."Login" (
  id bigserial not null,
  username character varying(100) not null,
  password text not null,
  role character varying(50) null,
  contact_no character varying(20) null,
  alternate_contact_no character varying(20) null,
  tech_working_district character varying(150) null,
  created_at timestamp without time zone null default now(),
  page_access text[] null,
  email character varying(150) null,
  constraint Login_pkey primary key (id),
  constraint Login_username_key unique (username)
) TABLESPACE pg_default;



create table public."Master" (
  id bigserial not null,
  company_name character varying(150) null,
  mode_of_call character varying(50) null,
  project_name character varying(150) null,
  district character varying(150) null,
  technician_name character varying(150) null,
  technician_contact character varying(20) null,
  insurance_type character varying(100) null,
  tracker_status character varying(50) null,
  checked text null default false,
  company_name1 character varying(150) null,
  address text null,
  email_id character varying(150) null,
  phone_no character varying(20) null,
  vendor_name character varying(150) null,
  product_type character varying(150) null,
  created_at timestamp without time zone null default now(),
  constraint Master_pkey primary key (id)
) TABLESPACE pg_default;



create table public."Tracker" (
  id bigserial not null,
  timestamp timestamp without time zone null,
  serial_no character varying(100) null,
  complaint_id character varying(50) null,
  technician_name character varying(150) null,
  technician_number text null,
  beneficiary_name character varying(150) null,
  contact_number text null,
  village character varying(150) null,
  block character varying(150) null,
  district character varying(150) null,
  product character varying(150) null,
  make character varying(150) null,
  system_voltage character varying(50) null,
  nature_of_complaint text null,
  upload_documents text null,
  geotag_photo text null,
  action_taken text null,
  tracker_status character varying(50) null,
  latitude numeric(10, 6) null,
  longitude numeric(10, 6) null,
  address text null,
  planned timestamp without time zone null,
  actual timestamp without time zone null,
  checked text null,
  remark text null,
  created_at timestamp without time zone null default now(),
  constraint Tracker_pkey primary key (id)
) TABLESPACE pg_default;



create table public."VendorTracker" (
  id bigserial not null,
  timestamp timestamp without time zone null,
  serial_number character varying(100) null,
  complaint_id character varying(50) null,
  date date null,
  status character varying(50) null,
  remark text null,
  upload text null,
  planned timestamp without time zone null,
  actual timestamp without time zone null,
  created_at timestamp without time zone null default now(),
  planned_assignto_vendor timestamp without time zone null,
  actual_assignto_vendor timestamp without time zone null,
  constraint VendorTracker_pkey primary key (id)
) TABLESPACE pg_default;

