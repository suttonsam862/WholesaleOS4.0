--
-- PostgreSQL database dump
--

\restrict 7AJE29Mmpx42aRfBt1edNYAmcbLkCNOANYOSchMOlh0bfHRiHSNJlsaCI9gTR0C

-- Dumped from database version 16.11 (b740647)
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

SET SESSION AUTHORIZATION DEFAULT;

ALTER TABLE public.users DISABLE TRIGGER ALL;

COPY public.users (id, email, first_name, last_name, profile_image_url, name, role, password_hash, is_active, phone, avatar_url, created_at, updated_at, active, is_invited, has_completed_setup, invited_at, invited_by, sales_map_enabled) FROM stdin;
dee15298-a714-408c-bacd-09a9e1af5b68	codyfoote@rich-habits.com	Cody	Foote	\N	Cody Foote	sales	$2b$10$qmu6iPPHONfME/CmJBfFy.PCLLTNFRTEj0nt09c0UYSAFo62pSB5S	t	‭+1 (480) 593-1952‬	\N	2025-09-27 17:04:27.54617	2025-09-27 17:04:27.54617	t	f	f	\N	\N	f
ANQ3NH	ANQ3NH@example.com	John	Doe	\N	John Doe	sales	\N	t	\N	\N	2025-09-27 17:06:23.753536	2025-09-27 17:06:23.753536	t	f	f	\N	\N	f
H0RhOh	H0RhOh@example.com	John	Doe	\N	John Doe	sales	\N	t	\N	\N	2025-09-28 19:41:13.506747	2025-09-28 19:41:13.506747	t	f	f	\N	\N	f
mfg_user_${nanoid(6)}	manufacturer@company.com	Manufacturing	Manager	\N	Manufacturing Manager	sales	\N	t	\N	\N	2025-09-28 19:44:49.390986	2025-09-28 19:44:49.390986	t	f	f	\N	\N	f
G9lwpc	salesW3rQer@example.com	Sales	Person	\N	Sales Person	sales	\N	t	\N	\N	2025-09-28 20:13:48.742089	2025-09-28 20:13:48.742089	t	f	f	\N	\N	f
qhFCtN	salesB3Ok4A@example.com	Sales	Person	\N	Sales Person	sales	\N	t	\N	\N	2025-09-28 20:19:10.499773	2025-09-28 20:29:18.647	t	f	f	\N	\N	f
test-catalog-user	catalog@example.com	Admin	User	\N	Admin User	sales	\N	t	\N	\N	2025-10-03 05:57:50.420343	2025-10-03 05:57:50.420343	t	f	f	\N	\N	f
062a8195-70f4-48a6-bc6d-30cd313c8cfa	sam@local.test	Sam	Sutton	\N	Sam Sutton	admin	$2b$10$pKBIakmIrqiL98aOUFPHeOJvzorVyvRv5y2aZ8CE2hfy7yavzmjuy	t	\N	\N	2025-09-26 20:25:31.420322	2025-09-26 20:25:31.420322	t	f	f	\N	\N	f
test-catalog-admin	catalog-admin@example.com	Admin	User	\N	Admin User	admin	\N	t	\N	\N	2025-10-03 05:59:28.60835	2025-10-03 05:59:28.60835	t	f	f	\N	\N	f
LW0Vds	LW0Vds@example.com	Admin	User	\N	Admin User	sales	\N	t	\N	\N	2025-09-29 02:50:51.603566	2025-09-29 02:50:51.603566	t	f	f	\N	\N	f
evlNvj	adminNpVaQ9@example.com	Admin	User	\N	Admin User	admin	\N	t	\N	\N	2025-09-29 03:02:08.079643	2025-09-29 03:02:08.079643	t	f	f	\N	\N	f
admin-sales-test	admin@salestest.com	Admin	Sales	\N	Admin Sales	admin	\N	t	\N	\N	2025-09-30 14:49:27.216054	2025-09-30 14:57:32.464	t	f	f	\N	\N	f
038c49f9-ccbc-4be6-bc37-7635842a6132	salesperson1@test.com	Sales	Person	\N	Sales Person	sales	$2b$10$pKBIakmIrqiL98aOUFPHeOJvzorVyvRv5y2aZ8CE2hfy7yavzmjuy	t	\N	\N	2025-09-26 20:25:31.559153	2025-09-30 14:58:33.6	t	f	f	\N	\N	f
HuV7XZ	HuV7XZ@example.com	John	Doe	\N	John Doe	sales	\N	t	\N	\N	2025-09-29 18:42:59.905212	2025-09-29 18:42:59.905212	t	f	f	\N	\N	f
test-manufacturer-mgmt-user	test-mfr@test.com	Test	Admin	\N	Test Admin	admin	\N	t	\N	\N	2025-09-30 21:10:51.259201	2025-09-30 21:10:51.259201	t	f	f	\N	\N	f
JlQeAt	JlQeAt@example.com	Test	Contact	\N	Test Contact	sales	\N	t	\N	\N	2025-09-29 19:34:26.876412	2025-09-29 19:34:26.876412	t	f	f	\N	\N	f
test-catalog-v3	catalog-v3@example.com	\N	\N	\N	catalog-v3@example.com	admin	\N	t	\N	\N	2025-10-03 06:08:47.893465	2025-10-03 06:08:47.893465	t	f	f	\N	\N	f
05ce585e-fd96-4cdd-a9e8-ebd149ac92df	testuser-S5U0mZ@test.com	Test	User	\N	Test User	sales	$2b$10$9UjvAbDhJ6gC2S19cJqc3OtfFCnp6BRusnZsO8o9cdVEEwtgZXXb2	t	\N	\N	2025-10-04 00:16:38.848142	2025-10-04 00:16:38.848142	t	f	f	\N	\N	f
iJE3ey	iJE3ey@example.com	Sales	User	\N	Sales User	sales	\N	t	\N	\N	2025-10-03 02:39:38.793678	2025-10-03 02:39:38.793678	t	f	f	\N	\N	f
designer-test-user	designer@test.com	Test	Designer	\N	Test Designer	designer	\N	t	\N	\N	2025-10-03 02:43:36.173315	2025-10-03 02:43:36.173315	t	f	f	\N	\N	f
1AJIFa	admin_C611z@test.com	Admin	User	\N	Admin User	sales	\N	t	\N	\N	2025-10-03 03:07:38.568534	2025-10-03 03:07:38.568534	t	f	f	\N	\N	f
N4g2r-	adminPsJj5R@test.com	Admin	User	\N	Admin User	sales	\N	t	\N	\N	2025-10-03 03:14:15.980727	2025-10-03 03:14:15.980727	t	f	f	\N	\N	f
F228gj	F228gj@example.com	John	Doe	\N	John Doe	sales	\N	t	\N	\N	2025-10-03 05:45:30.514831	2025-10-03 05:45:30.514831	t	f	f	\N	\N	f
test-catalog-final	catalog-final@example.com	John	Doe	\N	John Doe	admin	\N	t	\N	\N	2025-10-03 06:20:44.700951	2025-10-03 06:22:19.977	t	f	f	\N	\N	f
admin-final-test	admin-final@example.com	\N	\N	\N	admin-final@example.com	admin	\N	t	\N	\N	2025-10-03 06:29:50.367841	2025-10-03 06:29:50.367841	t	f	f	\N	\N	f
order-test-admin	order-admin@example.com	\N	\N	\N	order-admin@example.com	admin	\N	t	\N	\N	2025-10-03 06:37:11.350478	2025-10-03 06:37:11.350478	t	f	f	\N	\N	f
order-workflow-test	order-test@example.com	Test	User	\N	Test User	sales	\N	t	\N	\N	2025-10-03 06:46:45.958098	2025-10-03 06:46:45.958098	t	f	f	\N	\N	f
xSPvRt	xSPvRt@example.com	John	Doe	\N	John Doe	sales	\N	t	\N	\N	2025-10-03 18:18:33.140093	2025-10-03 18:18:33.140093	t	f	f	\N	\N	f
final-mfg-test	final-test@example.com	\N	\N	\N	final-test@example.com	admin	\N	t	\N	\N	2025-10-03 07:01:06.429082	2025-10-03 07:01:06.429082	t	f	f	\N	\N	f
ADiI7O	ADiI7O@example.com	John	Doe	\N	John Doe	sales	\N	t	\N	\N	2025-10-03 16:03:56.903322	2025-10-03 16:03:56.903322	t	f	f	\N	\N	f
yVAU78	yVAU78@example.com	John	Doe	\N	John Doe	sales	\N	t	\N	\N	2025-10-03 17:18:55.150801	2025-10-03 17:18:55.150801	t	f	f	\N	\N	f
t3onPB	t3onPB@example.com	John	Doe	\N	John Doe	sales	\N	t	\N	\N	2025-10-03 18:36:19.163842	2025-10-03 18:36:19.163842	t	f	f	\N	\N	f
sales-test-456	sales@test.com	Sales	User	\N	Sales User	sales	\N	t	\N	\N	2025-09-29 23:23:40.774113	2025-10-14 03:33:02.033	t	f	f	\N	\N	f
test_admin_mfg	testadmin@example.com	Admin	User	\N	Admin User	sales	\N	t	\N	\N	2025-10-03 19:05:24.361378	2025-10-03 19:11:38.79	t	f	f	\N	\N	f
a0eJC3	sales1@example.com	Sales	User	\N	Sales User	sales	\N	t	\N	\N	2025-10-04 00:24:43.72119	2025-10-04 00:33:05.399	t	f	f	\N	\N	f
admin_id	admin@example.com	Admin	User	\N	Admin User	admin	\N	t	\N	\N	2025-09-28 21:00:55.333604	2025-11-16 05:52:17.854	t	f	f	\N	\N	f
test-user	test@example.com	Test	User	\N	Test User	sales	\N	t	\N	\N	2025-10-03 16:54:54.060882	2025-11-24 17:34:20.984	t	f	f	\N	\N	f
test-admin-automated-auth	test-admin@automated-testing.local	Test	Admin	\N	Test Admin	admin	$2b$10$2sShN6AT9s1CHJPf4lpLIegz.y2siJsTr5zds0ERpuJI.UeVjb8gG	t	\N	\N	2025-09-29 04:27:18.748	2025-10-14 03:18:10.323	t	f	f	\N	\N	f
admin-test-123	admin@test.com	Admin	User	\N	Admin User	admin	\N	t	\N	\N	2025-09-27 14:22:16.152888	2025-10-30 04:13:16.808	t	f	f	\N	\N	f
41090967	samsutton@rich-habits.com	\N	\N	\N	samsutton@rich-habits.com	admin	\N	t	\N	\N	2025-09-26 18:30:32.67248	2025-12-12 09:36:28.751	t	f	f	\N	\N	f
admin_test_1	admin_test_1@example.com	Admin	User	\N	Admin User	admin	\N	t	\N	\N	2025-10-13 17:14:36.451236	2025-10-13 17:14:36.451236	t	f	f	\N	\N	f
designer1_sub	designer1@example.com	Designer	One	\N	Designer One	designer	\N	t	\N	\N	2025-10-04 00:38:10.715172	2025-10-04 00:53:07.372	t	f	f	\N	\N	f
d33441ea-4eae-4e49-923f-26e05e058c0e	manufacturer@test.com	Manufacturer	User	\N	Manufacturer User	manufacturer	\N	t	\N	\N	2025-10-05 01:48:58.612474	2025-10-05 01:49:12.638	t	f	f	\N	\N	f
I48Qn7	I48Qn7@example.com	Manufacturer	User	\N	Manufacturer User	sales	\N	t	\N	\N	2025-10-05 03:33:56.439294	2025-10-05 03:33:56.439294	t	f	f	\N	\N	f
B299kk	B299kk@example.com	John	Doe	\N	John Doe	sales	\N	t	\N	\N	2025-10-06 04:52:28.58809	2025-10-06 04:52:28.58809	t	f	f	\N	\N	f
admin1_sub	admin1_sub@example.com	Admin	User	\N	Admin User	sales	\N	t	\N	\N	2025-10-06 16:19:21.753409	2025-10-06 16:19:21.753409	t	f	f	\N	\N	f
admin_role_sub	admin_role_sub@example.com	Admin	Role	\N	Admin Role	admin	\N	t	\N	\N	2025-10-06 16:20:31.011175	2025-10-06 16:20:31.011175	t	f	f	\N	\N	f
bN-fO7	bN-fO7@example.com	John	Doe	\N	John Doe	sales	\N	t	\N	\N	2025-10-06 16:36:12.502969	2025-10-06 16:36:12.502969	t	f	f	\N	\N	f
Q6p2py	Q6p2py@example.com	John	Doe	\N	John Doe	sales	\N	t	\N	\N	2025-10-07 17:50:54.284397	2025-10-07 17:50:54.284397	t	f	f	\N	\N	f
ragDI4	ragDI4@example.com	John	Doe	\N	John Doe	sales	\N	t	\N	\N	2025-10-08 18:14:43.647947	2025-10-08 18:14:43.647947	t	f	f	\N	\N	f
admin-Yjy6Tw	admin-XdVD@example.com	Admin	User	\N	Admin User	sales	\N	t	\N	\N	2025-10-08 18:16:39.945283	2025-10-08 18:16:39.945283	t	f	f	\N	\N	f
finance-p3T-ba	finance-p3T-ba@example.com	Finance	User	\N	Finance User	finance	\N	t	\N	\N	2025-10-08 18:22:41.094378	2025-10-08 18:22:41.094378	t	f	f	\N	\N	f
xa9662	financey47BkQ@example.com	Finance	User	\N	Finance User	finance	\N	t	\N	\N	2025-10-08 18:44:07.964094	2025-10-08 18:44:07.964094	t	f	f	\N	\N	f
15DNxi	financeqAt8Cy@example.com	Finance	User	\N	Finance User	finance	\N	t	\N	\N	2025-10-08 18:54:29.093784	2025-10-08 18:54:29.093784	t	f	f	\N	\N	f
5nEJcV	5nEJcV@example.com	Manufacturer	User	\N	Manufacturer User	manufacturer	\N	t	\N	\N	2025-10-13 19:23:50.566729	2025-10-13 19:23:50.566729	t	f	f	\N	\N	f
UTYMiX	financehSSp6c@example.com	Finance	User	\N	Finance User	sales	\N	t	\N	\N	2025-10-08 19:01:45.632024	2025-10-08 19:05:52.973	t	f	f	\N	\N	f
6dqKzF	finance4qihvS@example.com	Finance	User	\N	Finance User	finance	\N	t	\N	\N	2025-10-08 19:10:23.062875	2025-10-08 19:10:23.062875	t	f	f	\N	\N	f
XPnWeN	financenMbz_Q@example.com	Finance	User	\N	Finance User	sales	\N	t	\N	\N	2025-10-08 19:16:03.624536	2025-10-08 19:16:03.624536	t	f	f	\N	\N	f
u4pDYW	finance0HyKFr@example.com	Finance	User	\N	Finance User	finance	\N	t	\N	\N	2025-10-08 19:17:01.012802	2025-10-08 19:17:01.012802	t	f	f	\N	\N	f
OpohU1	OpohU1@example.com	Manufacturer	User	\N	Manufacturer User	sales	\N	t	\N	\N	2025-10-13 19:35:15.287555	2025-10-13 19:35:15.287555	t	f	f	\N	\N	f
sales_test_user	salestest@test.com	Sales	Tester	\N	Sales Tester	sales	\N	t	\N	\N	2025-10-10 18:31:26.783475	2025-10-10 18:31:58.762	t	f	f	\N	\N	f
-TcOyb	QWPWLA@example.com	Manufacturer	User	\N	Manufacturer User	manufacturer	\N	t	\N	\N	2025-10-13 19:35:57.756625	2025-10-13 19:35:57.756625	t	f	f	\N	\N	f
sales_user_test	salesuser@test.com	Sales	User	\N	Sales User	sales	\N	t	\N	\N	2025-10-10 18:22:47.54862	2025-10-10 18:33:57.298	t	f	f	\N	\N	f
XMOE4G	XMOE4G@example.com	John	Doe	\N	John Doe	sales	\N	t	\N	\N	2025-10-11 03:02:24.387514	2025-10-11 03:02:24.387514	t	f	f	\N	\N	f
1NDMmR	1NDMmR@example.com	Admin	User	\N	Admin User	sales	\N	t	\N	\N	2025-10-11 03:20:48.513858	2025-10-11 03:20:48.513858	t	f	f	\N	\N	f
test-user-001	test@richabits.com	Test	User	\N	Test User	sales	\N	t	\N	\N	2025-10-11 21:59:55.597222	2025-10-11 21:59:55.597222	t	f	f	\N	\N	f
HLudrP	HLudrP@example.com	John	Doe	\N	John Doe	sales	\N	t	\N	\N	2025-10-11 23:06:36.862649	2025-10-11 23:06:36.862649	t	f	f	\N	\N	f
admin-role-001	admin.role@example.com	Admin	Role	\N	Admin Role	admin	\N	t	\N	\N	2025-10-11 23:29:02.200842	2025-10-11 23:29:02.200842	t	f	f	\N	\N	f
test-admin-mfg	admin-mfg@test.com	Admin	User	\N	Admin User	admin	\N	t	\N	\N	2025-10-12 00:03:06.093527	2025-10-12 00:03:06.093527	t	f	f	\N	\N	f
test-mfg-filter	mfg-filter@test.com	Test	User	\N	Test User	sales	\N	t	\N	\N	2025-10-12 00:10:59.98774	2025-10-12 00:10:59.98774	t	f	f	\N	\N	f
test-user-manufacturing	manufacturing-tester@example.com	Manufacturing	Tester	\N	Manufacturing Tester	sales	\N	t	\N	\N	2025-10-12 00:25:33.982806	2025-10-12 00:25:33.982806	t	f	f	\N	\N	f
j96Jh6	s82vHn@example.com	Admin	User	\N	Admin User	admin	\N	t	\N	\N	2025-10-13 19:36:57.868335	2025-10-13 19:36:57.868335	t	f	f	\N	\N	f
rb012w	rb012w@example.com	John	Doe	\N	John Doe	sales	\N	t	\N	\N	2025-10-13 19:49:34.292389	2025-10-13 19:49:34.292389	t	f	f	\N	\N	f
admin-test-001	admin@richhabits.com	Admin	User	\N	Admin User	admin	\N	t	\N	\N	2025-10-11 23:24:51.892417	2025-10-12 01:40:51.12	t	f	f	\N	\N	f
test-manufacturer-LfZX70	manufacturerz8Ez_g@test.com	Test	Manufacturer	\N	Test Manufacturer	manufacturer	\N	t	\N	\N	2025-10-13 01:56:19.512674	2025-10-13 01:56:19.512674	t	f	f	\N	\N	f
test-admin-LWSccp	adminSwsHVO@test.com	Test	Admin	\N	Test Admin	admin	\N	t	\N	\N	2025-10-13 02:02:58.496635	2025-10-13 02:02:58.496635	t	f	f	\N	\N	f
test-manufacturer-2fViIQ	manufacturer8XK4sH@test.com	Test	Manufacturer	\N	Test Manufacturer	sales	\N	t	\N	\N	2025-10-13 02:07:16.606882	2025-10-13 02:07:16.606882	t	f	f	\N	\N	f
5naj6j	adminBCSYp8@test.com	Admin	User	\N	Admin User	sales	\N	t	\N	\N	2025-10-13 14:49:59.148996	2025-10-13 14:49:59.148996	t	f	f	\N	\N	f
_aKz-M	admingaeVY3@test.com	Admin	User	\N	Admin User	admin	\N	t	\N	\N	2025-10-13 14:55:28.066898	2025-10-13 14:55:28.066898	t	f	f	\N	\N	f
es8Tea	es8Tea@example.com	Sales	Person	\N	Sales Person	sales	\N	t	\N	\N	2025-10-13 17:11:02.524467	2025-10-13 17:11:02.524467	t	f	f	\N	\N	f
test_sales_1	test_sales_1@example.com	Test	Sales	\N	Test Sales	sales	\N	t	\N	\N	2025-10-13 17:13:18.750545	2025-10-13 17:13:18.750545	t	f	f	\N	\N	f
mfg_W_95oP	mfg_msot@example.com	Mfg	Tester	\N	Mfg Tester	sales	\N	t	\N	\N	2025-10-13 19:54:49.549877	2025-10-13 19:54:49.549877	t	f	f	\N	\N	f
0b13f2	0b13f2@example.com	John	Doe	\N	John Doe	sales	\N	t	\N	\N	2025-10-14 02:20:09.614603	2025-10-14 02:20:09.614603	t	f	f	\N	\N	f
TlL-4W	TlL-4W@example.com	John	Doe	\N	John Doe	sales	\N	t	\N	\N	2025-10-14 02:23:56.820024	2025-10-14 02:23:56.820024	t	f	f	\N	\N	f
Sk61vg	admin@E0AnBP.com	John	Doe	\N	John Doe	sales	\N	t	\N	\N	2025-10-14 02:34:00.639976	2025-10-14 02:34:00.639976	t	f	f	\N	\N	f
upload-test-123	uploadtest@example.com	Upload	Tester	\N	Upload Tester	admin	\N	t	\N	\N	2025-10-14 03:40:25.658592	2025-10-14 03:40:25.658592	t	f	f	\N	\N	f
yOyMkW	yOyMkW@example.com	John	Doe	\N	John Doe	sales	\N	t	\N	\N	2025-10-14 05:04:27.225781	2025-10-14 05:04:27.225781	t	f	f	\N	\N	f
Lve3hd	Lve3hd@example.com	John	Doe	\N	John Doe	sales	\N	t	\N	\N	2025-10-14 21:20:24.862922	2025-10-14 21:20:24.862922	t	f	f	\N	\N	f
nqQGU8	nqQGU8@example.com	John	Doe	\N	John Doe	sales	\N	t	\N	\N	2025-10-15 05:12:36.194671	2025-10-15 05:12:36.194671	t	f	f	\N	\N	f
test_admin_perms	test_perms@example.com	Test	Admin	\N	Test Admin	admin	\N	t	\N	\N	2025-10-14 20:36:25.832428	2025-10-14 20:43:39.604	t	f	f	\N	\N	f
test_admin_issues	test_issues@example.com	Test	Issues	\N	Test Issues	sales	\N	t	\N	\N	2025-10-14 20:53:24.001136	2025-10-14 20:53:24.001136	t	f	f	\N	\N	f
test_event_fix	test_event@example.com	Event	Tester	\N	Event Tester	sales	\N	t	\N	\N	2025-10-14 20:56:56.788786	2025-10-14 20:56:56.788786	t	f	f	\N	\N	f
RrrHfL	RrrHfL@example.com	John	Doe	\N	John Doe	sales	\N	t	\N	\N	2025-10-15 05:19:03.94664	2025-10-15 05:19:03.94664	t	f	f	\N	\N	f
8pj4HX	8pj4HX@example.com	John	Doe	\N	John Doe	sales	\N	t	\N	\N	2025-10-15 05:33:30.775969	2025-10-15 05:33:30.775969	t	f	f	\N	\N	f
g7okdV	g7okdV@example.com	Admin	User	\N	Admin User	sales	\N	t	\N	\N	2025-10-15 19:43:41.934852	2025-10-15 19:43:41.934852	t	f	f	\N	\N	f
4LJZbU	4LJZbU@example.com	Admin	User	\N	Admin User	sales	\N	t	\N	\N	2025-10-15 19:46:14.841695	2025-10-15 19:46:14.841695	t	f	f	\N	\N	f
admin_rCGuk1	admin_rCGuk1@example.com	Super	Admin	\N	Super Admin	admin	\N	t	\N	\N	2025-10-15 19:47:15.261472	2025-10-15 19:47:15.261472	t	f	f	\N	\N	f
udRreB	udRreB@example.com	John	Doe	\N	John Doe	sales	\N	t	\N	\N	2025-10-15 22:05:35.101379	2025-10-15 22:05:35.101379	t	f	f	\N	\N	f
4NQtH-	adminggmUnM@test.com	Test	Admin	\N	Test Admin	admin	\N	t	\N	\N	2025-10-15 23:16:31.87407	2025-10-15 23:16:31.87407	t	f	f	\N	\N	f
CTFAxZ	adminPIFM37@test.com	Test	Admin	\N	Test Admin	admin	\N	t	\N	\N	2025-10-15 23:28:32.241915	2025-10-15 23:28:32.241915	t	f	f	\N	\N	f
gBk7gq	gBk7gq@example.com	John	Doe	\N	John Doe	sales	\N	t	\N	\N	2025-10-16 05:04:50.325743	2025-10-16 05:04:50.325743	t	f	f	\N	\N	f
test-viewer-user	testviewer@example.com	Test	Viewer	\N	Test Viewer	sales	\N	t	\N	\N	2025-10-16 13:44:40.656925	2025-10-16 13:44:40.656925	t	f	f	\N	\N	f
_OXw9-	adminlMcAOc@example.com	Admin	User	\N	Admin User	sales	\N	t	\N	\N	2025-10-16 18:58:58.245314	2025-10-16 18:58:58.245314	t	f	f	\N	\N	f
jURtSM	adminpjbfcg@example.com	Admin	User	\N	Admin User	sales	\N	t	\N	\N	2025-10-16 19:03:39.193126	2025-10-16 19:03:39.193126	t	f	f	\N	\N	f
zkfHLJ	zkfHLJ@example.com	John	Doe	\N	John Doe	sales	\N	t	\N	\N	2025-10-16 19:36:50.504184	2025-10-16 19:36:50.504184	t	f	f	\N	\N	f
nyAcqv	nyAcqv@example.com	John	Doe	\N	John Doe	sales	\N	t	\N	\N	2025-10-16 19:42:10.777781	2025-10-16 19:42:10.777781	t	f	f	\N	\N	f
admin_auto	admin_auto@example.com	Auto	Admin	\N	Auto Admin	admin	\N	t	\N	\N	2025-10-16 19:47:15.652246	2025-10-16 19:47:15.652246	t	f	f	\N	\N	f
qpp8Vz	qpp8Vz@example.com	John	Doe	\N	John Doe	sales	\N	t	\N	\N	2025-10-17 05:21:00.458854	2025-10-17 05:21:00.458854	t	f	f	\N	\N	f
8d2HSy	8d2HSy@example.com	John	Doe	\N	John Doe	sales	\N	t	\N	\N	2025-10-17 05:26:36.10057	2025-10-17 05:26:36.10057	t	f	f	\N	\N	f
test-ops-user	ops@test.com	Ops	User	\N	Ops User	sales	\N	t	\N	\N	2025-10-17 05:55:33.198492	2025-10-17 05:55:33.198492	t	f	f	\N	\N	f
5iK9Ry	5iK9Ry@example.com	John	Doe	\N	John Doe	sales	\N	t	\N	\N	2025-10-17 06:21:36.248407	2025-10-17 06:21:36.248407	t	f	f	\N	\N	f
test-user-1	testuser1@example.com	Test	User	\N	Test User	sales	\N	t	\N	\N	2025-10-17 06:27:39.417427	2025-10-17 06:27:39.417427	t	f	f	\N	\N	f
vLa6C2	adminuP18dI@example.com	Test	Admin	\N	Test Admin	sales	\N	t	\N	\N	2025-10-19 04:19:47.774548	2025-10-19 04:19:47.774548	t	f	f	\N	\N	f
3jBnYq	admin1TMQWG@example.com	Test	Admin	\N	Test Admin	admin	\N	t	\N	\N	2025-10-19 04:21:53.131489	2025-10-19 04:21:53.131489	t	f	f	\N	\N	f
ZMJXz8	admin81qPtU@example.com	Test	Admin	\N	Test Admin	sales	\N	t	\N	\N	2025-10-19 04:35:21.155892	2025-10-19 04:35:21.155892	t	f	f	\N	\N	f
test-mfg-export-user	mfgexport@test.com	Export	Tester	\N	Export Tester	sales	\N	t	\N	\N	2025-10-19 04:59:05.126917	2025-10-19 05:06:17.67	t	f	f	\N	\N	f
admin-export-final	admin-final@test.com	Admin	Final	\N	Admin Final	admin	\N	t	\N	\N	2025-10-19 05:11:27.215024	2025-10-19 05:11:27.215024	t	f	f	\N	\N	f
admin-test-final	admin-test-final@test.com	Admin	Test	\N	Admin Test	admin	\N	t	\N	\N	2025-10-19 05:19:23.821734	2025-10-19 05:19:23.821734	t	f	f	\N	\N	f
test-export-v2	test-export-v2@test.com	Test	User	\N	Test User	admin	\N	t	\N	\N	2025-10-20 02:11:08.956191	2025-10-20 02:11:08.956191	t	f	f	\N	\N	f
test-export-fixed	test-export-fixed@test.com	Test	Exporter	\N	Test Exporter	admin	\N	t	\N	\N	2025-10-20 02:23:00.431231	2025-10-20 02:23:00.431231	t	f	f	\N	\N	f
pdf-test-user	pdf-test@test.com	PDF	Tester	\N	PDF Tester	admin	\N	t	\N	\N	2025-10-20 03:01:09.215333	2025-10-20 03:01:09.215333	t	f	f	\N	\N	f
aspect-test-user	aspect-test@test.com	Aspect	Tester	\N	Aspect Tester	admin	\N	t	\N	\N	2025-10-20 03:15:29.764815	2025-10-20 03:15:29.764815	t	f	f	\N	\N	f
aspect-fixed	aspect-fixed@test.com	Fix	Test	\N	Fix Test	admin	\N	t	\N	\N	2025-10-20 03:18:36.124582	2025-10-20 03:18:36.124582	t	f	f	\N	\N	f
test-admin-sub-2	admin2@test.com	Test	Admin	\N	Test Admin	admin	\N	t	\N	\N	2025-10-20 06:43:38.300339	2025-10-20 06:44:45.801	t	f	f	\N	\N	f
H7a4Pe	H7a4Pe@example.com	John	Doe	\N	John Doe	sales	\N	t	\N	\N	2025-10-21 05:23:42.839897	2025-10-21 05:23:42.839897	t	f	f	\N	\N	f
Mn1Ipn	Mn1Ipn@example.com	John	Doe	\N	John Doe	admin	\N	t	\N	\N	2025-10-21 05:39:33.435745	2025-10-21 05:39:33.435745	t	f	f	\N	\N	f
SVBEA0	SVBEA0@example.com	John	Doe	\N	John Doe	sales	\N	t	\N	\N	2025-10-21 16:56:28.538486	2025-10-21 16:56:28.538486	t	f	f	\N	\N	f
laird-sales-test	laird@richhabits.com	Laird	Sales	\N	Laird Sales	sales	\N	t	\N	\N	2025-10-21 21:47:59.332358	2025-10-21 21:51:45.743	t	f	f	\N	\N	f
jacA_A	jacA_A@example.com	John	Doe	\N	John Doe	sales	\N	t	\N	\N	2025-10-21 22:11:17.806221	2025-10-21 22:11:17.806221	t	f	f	\N	\N	f
Ly4-z1	Ly4-z1@example.com	Sales	User	\N	Sales User	sales	\N	t	\N	\N	2025-10-22 04:47:56.414017	2025-10-22 04:47:56.414017	t	f	f	\N	\N	f
58Ok4o	58Ok4o@example.com	Admin	User	\N	Admin User	sales	\N	t	\N	\N	2025-10-22 22:37:34.633431	2025-10-22 22:37:34.633431	t	f	f	\N	\N	f
qJ2kEP	userRi1GRx@example.com	Test	User	\N	Test User	sales	\N	t	\N	\N	2025-10-22 22:51:36.84349	2025-10-22 22:51:36.84349	t	f	f	\N	\N	f
8BAbwC	userPHFbVW@example.com	Test	User	\N	Test User	sales	\N	t	\N	\N	2025-10-22 22:56:39.533436	2025-10-22 22:56:39.533436	t	f	f	\N	\N	f
bhUwNc	useriGZJCz@example.com	Test	User	\N	Test User	sales	\N	t	\N	\N	2025-10-22 23:03:17.478298	2025-10-22 23:03:17.478298	t	f	f	\N	\N	f
qeqjtZ	qeqjtZ@example.com	John	Doe	\N	John Doe	sales	\N	t	\N	\N	2025-10-22 23:44:13.623317	2025-10-22 23:44:13.623317	t	f	f	\N	\N	f
ljpynF	testuserVHgHMi@example.com	Test	User	\N	Test User	sales	\N	t	\N	\N	2025-10-22 23:55:25.857771	2025-10-22 23:55:25.857771	t	f	f	\N	\N	f
acUVIU	testuseroVCyLg@example.com	Test	User	\N	Test User	sales	\N	t	\N	\N	2025-10-23 00:02:06.684975	2025-10-23 00:02:06.684975	t	f	f	\N	\N	f
Sh1kHT	testuserPPydsN@example.com	Test	User	\N	Test User	sales	\N	t	\N	\N	2025-10-23 00:07:19.282497	2025-10-23 00:07:19.282497	t	f	f	\N	\N	f
pOwguj	testuserJCerpa@example.com	Test	User	\N	Test User	sales	\N	t	\N	\N	2025-10-23 00:11:09.897568	2025-10-23 00:11:09.897568	t	f	f	\N	\N	f
XYyx5A	testuserrr7Irz@example.com	Test	User	\N	Test User	sales	\N	t	\N	\N	2025-10-23 00:15:16.350133	2025-10-23 00:15:16.350133	t	f	f	\N	\N	f
test-user-123	designer@example.com	Test	Designer	\N	Test Designer	sales	\N	t	\N	\N	2025-10-28 15:25:27.213521	2025-10-28 15:25:27.213521	t	f	f	\N	\N	f
test-sales-user-456	salesuser@example.com	Sales	User	\N	Sales User	sales	\N	t	\N	\N	2025-10-29 02:52:04.293226	2025-10-29 02:52:04.293226	t	f	f	\N	\N	f
4dibof	ops@example.com	Operations	User	\N	Operations User	sales	\N	t	\N	\N	2025-10-29 16:58:31.914805	2025-10-29 16:58:31.914805	t	f	f	\N	\N	f
UvMMXN	UvMMXN@example.com	Operations	Ops	\N	Operations Ops	sales	\N	t	\N	\N	2025-10-30 03:30:11.201996	2025-10-30 03:30:11.201996	t	f	f	\N	\N	f
9XVdOb	9XVdOb@example.com	Operations	Ops	\N	Operations Ops	sales	\N	t	\N	\N	2025-10-30 03:36:26.470757	2025-10-30 03:36:26.470757	t	f	f	\N	\N	f
vmxBeB	vmxBeB@example.com	Operations	Ops	\N	Operations Ops	sales	\N	t	\N	\N	2025-10-30 03:42:43.623844	2025-10-30 03:42:43.623844	t	f	f	\N	\N	f
sM-CQu	sM-CQu@example.com	Admin	User	\N	Admin User	sales	\N	t	\N	\N	2025-10-30 03:45:53.513303	2025-10-30 03:45:53.513303	t	f	f	\N	\N	f
c8-NV6	c8-NV6@example.com	John	Doe	\N	John Doe	sales	\N	t	\N	\N	2025-11-10 18:09:58.489013	2025-11-10 18:09:58.489013	t	f	f	\N	\N	f
fyBcqk	fyBcqk@example.com	Admin	User	\N	Admin User	sales	\N	t	\N	\N	2025-11-19 19:49:47.419143	2025-11-19 19:49:47.419143	t	f	f	\N	\N	f
test-user-BDEgqO	testuser@example.com	Test	User	\N	Test User	sales	\N	t	\N	\N	2025-11-10 22:31:45.204094	2025-11-10 22:46:53.535	t	f	f	\N	\N	f
FxwoZC	FxwoZC@example.com	Admin	User	\N	Admin User	sales	\N	t	\N	\N	2025-11-12 18:20:08.572345	2025-11-12 18:20:08.572345	t	f	f	\N	\N	f
manu_Gb4DLP	manu_Gb4DLP@example.com	Manu	User	\N	Manu User	sales	\N	t	\N	\N	2025-11-12 18:21:39.653875	2025-11-12 18:21:39.653875	t	f	f	\N	\N	f
k15cuh	k15cuh@example.com	John	Doe	\N	John Doe	sales	\N	t	\N	\N	2025-11-16 05:40:55.373747	2025-11-16 05:40:55.373747	t	f	f	\N	\N	f
i37Vjf	i37Vjf@example.com	Admin	User	\N	Admin User	sales	\N	t	\N	\N	2025-11-16 05:48:49.932343	2025-11-16 05:48:49.932343	t	f	f	\N	\N	f
zweyLM	zweyLM@example.com	Admin	User	\N	Admin User	sales	\N	t	\N	\N	2025-11-16 06:00:35.712072	2025-11-16 06:00:35.712072	t	f	f	\N	\N	f
qpAMWI	qpAMWI@example.com	Admin	User	\N	Admin User	sales	\N	t	\N	\N	2025-11-16 06:11:38.916976	2025-11-16 06:11:38.916976	t	f	f	\N	\N	f
DvtrZZ	DvtrZZ@example.com	John	Doe	\N	John Doe	sales	\N	t	\N	\N	2025-11-19 03:16:29.312272	2025-11-19 03:16:29.312272	t	f	f	\N	\N	f
iMwHvx	iMwHvx@example.com	John	Doe	\N	John Doe	sales	\N	t	\N	\N	2025-11-19 03:26:17.518394	2025-11-19 03:26:17.518394	t	f	f	\N	\N	f
aKf_s7	aKf_s7@example.com	Admin	User	\N	Admin User	sales	\N	t	\N	\N	2025-11-19 17:00:34.473538	2025-11-19 17:00:34.473538	t	f	f	\N	\N	f
tdQCKE	tdQCKE@example.com	Admin	User	\N	Admin User	sales	\N	t	\N	\N	2025-11-19 19:41:57.800103	2025-11-19 19:41:57.800103	t	f	f	\N	\N	f
KPC1H8	KPC1H8@example.com	Test	User	\N	Test User	sales	\N	t	\N	\N	2025-11-19 19:48:13.930032	2025-11-19 19:48:13.930032	t	f	f	\N	\N	f
54c442d2-114e-444d-9832-0eeb719f7bed	carter@local.test	Carter	Vail	\N	Carter Vail	sales	$2b$10$pKBIakmIrqiL98aOUFPHeOJvzorVyvRv5y2aZ8CE2hfy7yavzmjuy	t	\N	\N	2025-09-26 20:25:31.455389	2025-09-26 20:25:31.455389	t	f	f	\N	\N	f
1afdf7c4-c2d6-458f-8a8e-b8242d366024	diangelo@local.test	Diangelo	Perry	\N	Diangelo Perry	sales	$2b$10$pKBIakmIrqiL98aOUFPHeOJvzorVyvRv5y2aZ8CE2hfy7yavzmjuy	t	\N	\N	2025-09-26 20:25:31.593463	2025-09-26 20:25:31.593463	t	f	f	\N	\N	f
0c17b360-653e-4581-9444-d21613863b48	kg@local.test	KG	\N	\N	KG	sales	$2b$10$pKBIakmIrqiL98aOUFPHeOJvzorVyvRv5y2aZ8CE2hfy7yavzmjuy	t	\N	\N	2025-09-26 20:25:31.628235	2025-09-26 20:25:31.628235	t	f	f	\N	\N	f
a4c98edf-038e-40d7-9667-10f67a95fc44	baker@local.test	Baker	Stewart	\N	Baker Stewart	designer	$2b$10$pKBIakmIrqiL98aOUFPHeOJvzorVyvRv5y2aZ8CE2hfy7yavzmjuy	t	\N	\N	2025-09-26 20:25:31.662727	2025-09-26 20:25:31.662727	t	f	f	\N	\N	f
d611f424-250b-4120-9352-099171fe0bac	design1@local.test	Designer	One	\N	Designer One	designer	$2b$10$pKBIakmIrqiL98aOUFPHeOJvzorVyvRv5y2aZ8CE2hfy7yavzmjuy	t	\N	\N	2025-09-26 20:25:31.696986	2025-09-26 20:25:31.696986	t	f	f	\N	\N	f
26cc0079-86b0-4991-8155-e9e0be2c8778	design2@local.test	Designer	Two	\N	Designer Two	designer	$2b$10$pKBIakmIrqiL98aOUFPHeOJvzorVyvRv5y2aZ8CE2hfy7yavzmjuy	t	\N	\N	2025-09-26 20:25:31.731151	2025-09-26 20:25:31.731151	t	f	f	\N	\N	f
cb0bd046-7c15-4823-aa32-192243120de1	mfg_ig@local.test	ImprintGenie	\N	\N	ImprintGenie	manufacturer	$2b$10$pKBIakmIrqiL98aOUFPHeOJvzorVyvRv5y2aZ8CE2hfy7yavzmjuy	t	\N	\N	2025-09-26 20:25:31.80087	2025-09-26 20:25:31.80087	t	f	f	\N	\N	f
b7f37c3a-b1cf-4309-a9f7-6db2ba2b34b5	charlie@local.test	Charlie	Reeves	\N	Charlie Reeves	sales	$2b$10$UiDyVDvdDA0dIB7nRoYxzebUicVjyCmez.DJTJCeLelCvR.pkJyiG	t	\N	\N	2025-09-30 15:42:20.16513	2025-09-30 15:42:20.16513	t	f	f	\N	\N	f
004416c6-91e3-4972-b190-645981b54616	heather@local.test	Heather		\N	Heather	ops	$2b$10$pKBIakmIrqiL98aOUFPHeOJvzorVyvRv5y2aZ8CE2hfy7yavzmjuy	t	\N	\N	2025-09-26 20:25:31.524478	2025-10-29 16:56:22.716	t	f	f	\N	\N	f
admin-test-user	admin@local.test	Admin	User	\N	Admin User	admin	$2b$10$pKBIakmIrqiL98aOUFPHeOJvzorVyvRv5y2aZ8CE2hfy7yavzmjuy	t	\N	\N	2025-09-26 20:25:31.377486	2025-10-15 23:03:17.033	t	f	f	\N	\N	f
02426b4f-cdce-45bd-b546-6253dfe5f87a	nicole@local.test	Nicole	HoC	\N	Nicole HoC	ops	$2b$10$pKBIakmIrqiL98aOUFPHeOJvzorVyvRv5y2aZ8CE2hfy7yavzmjuy	t	\N	\N	2025-09-26 20:25:31.489886	2025-10-04 00:57:32.54	t	f	f	\N	\N	f
dcc51a50-8488-4461-aec3-aa266992e1e2	mfg_hawk@local.test	Auto	Manufacturer	\N	Auto Manufacturer	manufacturer	$2b$10$pKBIakmIrqiL98aOUFPHeOJvzorVyvRv5y2aZ8CE2hfy7yavzmjuy	t	\N	\N	2025-09-26 20:25:31.765871	2025-10-13 19:55:55.28	t	f	f	\N	\N	f
3f35cb86-89b4-4359-a87a-4da43fd2eb96	testmanu@rich-habits.com	Test	Manufacturing	\N	TM Test	manufacturer	$2b$10$nxYGDWilDM3192qeHxs53uWSD8SEcwihSxs5NNkWNOTxQW2YFtjJe	t	\N	\N	2025-11-14 19:16:39.360348	2025-11-14 19:16:39.360348	t	f	f	\N	\N	f
test-sales-user	sales@example.com	Sales	User	\N	Sales User	sales	\N	t	\N	\N	2025-11-24 17:49:39.415939	2025-11-24 17:51:13.099	t	f	f	\N	\N	f
test-sales-automated-auth	test-sales@automated-testing.local	Test	Sales	\N	Test Sales (Automated)	sales	$2b$10$KJH1uhrkcAGuq8xPSdApAurdlmfygl60F7hK5ap2dE8SVQ0HrrqES	t	\N	\N	2025-12-12 05:59:14.243	2025-12-12 05:59:14.243	t	f	f	\N	\N	f
test-manufacturer-automated-auth	test-manufacturer@automated-testing.local	Test	Manufacturer	\N	Test Manufacturer (Automated)	manufacturer	$2b$10$m/RfDTwFhulSDKxwJNYAsO2TDcqOUV4unJwDrgIMjBxcomDE3dZ5q	t	\N	\N	2025-12-12 06:02:53.133	2025-12-12 06:02:53.133	t	f	f	\N	\N	f
test-designer-automated-auth	test-designer@automated-testing.local	Test	Designer	\N	Test Designer (Automated)	designer	$2b$10$daNore8YPB0yPYFamoubGeGRHCsHnsDAGW7PWf3X01oUL3Ro1OmMK	t	\N	\N	2025-12-12 06:14:18.018	2025-12-12 06:14:18.018	t	f	f	\N	\N	f
test-ops-automated-auth	test-ops@automated-testing.local	Test	Ops	\N	Test Ops (Automated)	ops	$2b$10$UQ1EXHZMGpru3rrmrH7HnOuIp/t1h0xe8ZzOaVpRcWtuAQ6Nppf.K	t	\N	\N	2025-12-12 06:15:10.384	2025-12-12 06:15:10.384	t	f	f	\N	\N	f
\.


ALTER TABLE public.users ENABLE TRIGGER ALL;

--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.categories DISABLE TRIGGER ALL;

COPY public.categories (id, name, description, created_at, updated_at, image_url, archived, archived_at, archived_by) FROM stdin;
1	Apparel	Clothing and accessories	2025-09-26 19:23:37.148	2025-09-26 19:23:37.148	\N	f	\N	\N
2	Sportswear	Athletic clothing and gear	2025-09-26 19:32:36.501	2025-09-26 19:32:36.501	\N	f	\N	\N
3	Basics	Basic clothing items	2025-09-26 19:38:37.315	2025-09-26 19:38:37.315	\N	f	\N	\N
4	Electronics	Electronic devices and gadgets	2025-09-26 19:52:59.679	2025-09-26 19:52:59.679	\N	f	\N	\N
5	Tees	Short/long sleeve cotton & blends	2025-09-26 20:25:32.553483	2025-09-26 20:25:32.553483	\N	f	\N	\N
6	Fleece	Hoodies, crewnecks, sweats	2025-09-26 20:25:32.596006	2025-09-26 20:25:32.596006	\N	f	\N	\N
7	Shorts	Practice & lifestyle shorts	2025-09-26 20:25:32.631875	2025-09-26 20:25:32.631875	\N	f	\N	\N
8	Tech Suits	Two-piece compression sets	2025-09-26 20:25:32.6693	2025-09-26 20:25:32.6693	\N	f	\N	\N
9	Singlets	Performance wrestling singlets	2025-09-26 20:25:32.702407	2025-09-26 20:25:32.702407	\N	f	\N	\N
10	Bags	Backpacks and gear bags	2025-09-26 20:25:32.736295	2025-09-26 20:25:32.736295	\N	f	\N	\N
19	E2E Test Category mv_9Ty	Test category for E2E	2025-10-03 06:00:06.68138	2025-10-03 06:00:06.68138	\N	f	\N	\N
20	E2E Category ilOrY2	Test category	2025-10-03 06:09:26.040421	2025-10-03 06:09:26.040421	\N	f	\N	\N
21	Test Cat rBi7	E2E test	2025-10-03 06:22:59.186707	2025-10-03 06:22:59.186707	\N	f	\N	\N
22	Final Cat pqN	Final test	2025-10-03 06:31:20.303513	2025-10-03 06:31:20.303513	\N	f	\N	\N
23	Order Test aMP	For order test	2025-10-03 06:37:51.089012	2025-10-03 06:37:51.089012	\N	f	\N	\N
24	Order Cat 25	For order	2025-10-03 06:48:56.982438	2025-10-03 06:48:56.982438	\N	f	\N	\N
25	E2E Cat 2YJqH0		2025-10-04 00:18:17.279598	2025-10-04 00:18:17.279598	\N	f	\N	\N
26	Test Category nN-xUj	Test category with image	2025-10-15 22:09:51.804932	2025-10-15 22:09:51.804932	\N	f	\N	\N
\.


ALTER TABLE public.categories ENABLE TRIGGER ALL;

--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.organizations DISABLE TRIGGER ALL;

COPY public.organizations (id, name, sports, city, state, shipping_address, notes, logo_url, created_at, updated_at, territory, client_type, annual_volume, preferred_salesperson_id, brand_primary_color, brand_secondary_color, brand_pantone_code, brand_guidelines_url, archived, archived_at, archived_by, geo_lat, geo_lng, geo_precision, geo_source, geo_updated_at) FROM stdin;
4	East Hamilton High School	Wrestling	Chattanooga	TN	\N	Spirit pack client	\N	2025-09-26 20:25:32.06945	2025-09-26 20:25:32.06945	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
5	Mortimer Jordan High School	Wrestling	Morris	AL	\N	\N	\N	2025-09-26 20:25:32.110244	2025-09-26 20:25:32.110244	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
7	Tarleton State Wrestling	Wrestling	Stephenville	TX	\N	Team-worn gear only	\N	2025-09-26 20:25:32.191084	2025-09-26 20:25:32.191084	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
8	Team GATA	Wrestling	Gulf Coast	FL	\N	\N	\N	2025-09-26 20:25:32.234914	2025-09-26 20:25:32.234914	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
9	Gulf Coast Wrestling Club	Wrestling	Gulf Breeze	FL	\N	\N	\N	2025-09-26 20:25:32.271536	2025-09-26 20:25:32.271536	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
10	Brooks High School	Wrestling	Killen	AL	\N	\N	\N	2025-09-26 20:25:32.309447	2025-09-26 20:25:32.309447	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
19	Oak Mountain High School	Wrestling	Birmingham	AL	5476 Caldwell Mill Rd		\N	2025-09-27 14:14:15.860773	2025-09-27 14:14:15.860773	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
21	Daphne High School	Wrestling	Daphne	AL	9300 Champions Way, Daphne, AL 36526		\N	2025-09-29 18:58:06.838079	2025-09-29 18:58:06.838079	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
25	Weaver Golf	Golf	Weaver	AL	\N	Sponsorship interest	\N	2025-09-30 15:42:20.661003	2025-09-30 15:42:20.661003	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
26	Fultondale High School	Wrestling	Fultondale	AL	\N	\N	\N	2025-09-30 15:42:20.782877	2025-09-30 15:42:20.782877	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
27	Dora High School	Wrestling	Dora	AL	330 Glen C. Gant Circle, Dora, AL 35059		\N	2025-09-30 16:37:28.154756	2025-09-30 16:37:28.154756	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
28	E2E Test High School L_g8MM	Football, Basketball	Test City	CA	123 Test St, Test City, CA 90000	E2E created org	\N	2025-10-03 05:47:30.649336	2025-10-03 05:47:30.649336	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
29	Order Test Org uF	Football	Test City	CA	123 Test St, Test City, CA 90000	Created for order workflow test	\N	2025-10-03 06:39:55.195702	2025-10-03 06:39:55.195702	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
30	Order Org l-	Football	Test City	CA			\N	2025-10-03 06:51:18.306778	2025-10-03 06:51:18.306778	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
32	Test Org for Sales	\N	\N	\N	\N	\N	\N	2025-10-10 18:36:55.420937	2025-10-10 18:36:55.420937	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
23	Spain Park High School	Wrestling	Hoover	AL	4700 Jaguar Dr, Birmingham, AL 35242		\N	2025-09-29 19:06:41.910952	2025-09-29 19:06:41.910952	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
58	Sunset High School	Wrestling, Track	Las Vegas	NV	\N	High school athletics program	\N	2025-12-12 11:40:23.168817	2025-12-12 11:40:23.168817	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
17	Homewood High School	Wrestling	Homewood	AL			/public-objects/products/2025/10/img_1760547964137_1a4vjv	2025-09-26 23:48:51.790049	2025-10-15 17:06:08.223	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
35	Image Sync Test Org 6Ga0fM	\N	\N	\N	\N	\N	\N	2025-10-16 19:37:14.694983	2025-10-16 19:37:14.694983	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
36	Image Sync Test Org OfRgCA	\N	\N	\N	\N	\N	\N	2025-10-16 19:42:51.955717	2025-10-16 19:42:51.955717	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
59	Heritage Academy	Swimming, Soccer	Tampa	FL	\N	High school athletics program	\N	2025-12-12 11:40:23.201902	2025-12-12 11:40:23.201902	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
24	Ramsay High School	Wrestling	Birmingham	AL	1800 13th Avenue South Birmingham, Alabama 35205		\N	2025-09-29 19:08:03.89185	2025-09-29 19:08:03.89185	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
22	Sam Everett High School	Wrestling	Maryville	TN	1308 E Lamar Alexander Dr Maryville, TN 37804 \n		/public-objects/products/2025/10/img_1760673396252_vool1x	2025-09-29 19:06:18.091763	2025-10-17 03:56:39.781	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
60	Liberty High School	Football, Basketball	Indianapolis	IN	\N	High school athletics program	\N	2025-12-12 11:40:23.230543	2025-12-12 11:40:23.230543	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
31	Test Org wT8c	Football		\N			\N	2025-10-04 00:17:40.197174	2025-10-04 00:17:40.197174	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
34	Test Org			\N			/public-objects/products/2025/10/img_1760545765639_svg4yl	2025-10-13 02:00:43.638547	2025-10-15 16:29:32.575	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
38	Test Sales Org _I5x6W		Test City	TS			/public-objects/products/2025/10/img_1761938645300_cach7r	2025-10-22 04:49:22.555462	2025-11-16 06:01:17.064	\N	\N	\N	\N	#FF5733	#3366FF	123C	https://example.com/guidelines	f	\N	\N	\N	\N	\N	\N	\N
37	Test Org for Laird	Football	Test City	\N	UNIQUE_ADDRESS_TEST_p2p9ux7p	UNIQUE_NOTES_TEST_BQ2JaQtq	\N	2025-10-21 21:53:09.910969	2025-10-21 22:12:07.819	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
39	Lincoln High School	Football, Basketball	Portland	OR	\N	High school athletics program	\N	2025-12-12 11:40:22.547389	2025-12-12 11:40:22.547389	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
40	Jefferson Academy	Wrestling, Track	Denver	CO	\N	High school athletics program	\N	2025-12-12 11:40:22.583187	2025-12-12 11:40:22.583187	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
41	Roosevelt High School	Soccer, Baseball	Seattle	WA	\N	High school athletics program	\N	2025-12-12 11:40:22.657287	2025-12-12 11:40:22.657287	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
42	Washington Prep	Basketball, Football	Chicago	IL	\N	High school athletics program	\N	2025-12-12 11:40:22.687317	2025-12-12 11:40:22.687317	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
43	Kennedy High School	Wrestling, Swimming	Sacramento	CA	\N	High school athletics program	\N	2025-12-12 11:40:22.717823	2025-12-12 11:40:22.717823	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
44	Franklin High School	Football, Track	Nashville	TN	\N	High school athletics program	\N	2025-12-12 11:40:22.749129	2025-12-12 11:40:22.749129	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
45	Madison Academy	Baseball, Basketball	Phoenix	AZ	\N	High school athletics program	\N	2025-12-12 11:40:22.779628	2025-12-12 11:40:22.779628	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
46	Adams High School	Football, Wrestling	Dallas	TX	\N	High school athletics program	\N	2025-12-12 11:40:22.810518	2025-12-12 11:40:22.810518	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
47	Jackson High School	Track, Soccer	Atlanta	GA	\N	High school athletics program	\N	2025-12-12 11:40:22.84036	2025-12-12 11:40:22.84036	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
48	Monroe Prep	Swimming, Basketball	Miami	FL	\N	High school athletics program	\N	2025-12-12 11:40:22.869997	2025-12-12 11:40:22.869997	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
49	Riverside High School	Football, Baseball	Austin	TX	\N	High school athletics program	\N	2025-12-12 11:40:22.89961	2025-12-12 11:40:22.89961	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
50	Oak Grove Academy	Wrestling, Football	Birmingham	AL	\N	High school athletics program	\N	2025-12-12 11:40:22.928732	2025-12-12 11:40:22.928732	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
51	Cedar Falls High School	Hockey, Basketball	Minneapolis	MN	\N	High school athletics program	\N	2025-12-12 11:40:22.957696	2025-12-12 11:40:22.957696	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
52	Pine Ridge High School	Soccer, Wrestling	Salt Lake City	UT	\N	High school athletics program	\N	2025-12-12 11:40:22.988037	2025-12-12 11:40:22.988037	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
53	Valley View High School	Track, Swimming	San Diego	CA	\N	High school athletics program	\N	2025-12-12 11:40:23.017246	2025-12-12 11:40:23.017246	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
54	Eastwood Academy	Football, Basketball	Houston	TX	\N	High school athletics program	\N	2025-12-12 11:40:23.047656	2025-12-12 11:40:23.047656	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
55	Westbrook High School	Wrestling, Baseball	Philadelphia	PA	\N	High school athletics program	\N	2025-12-12 11:40:23.077541	2025-12-12 11:40:23.077541	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
56	Northside Prep	Soccer, Hockey	Boston	MA	\N	High school athletics program	\N	2025-12-12 11:40:23.110081	2025-12-12 11:40:23.110081	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
57	Southgate High School	Basketball, Football	Charlotte	NC	\N	High school athletics program	\N	2025-12-12 11:40:23.139585	2025-12-12 11:40:23.139585	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
61	Unity High School	Wrestling, Baseball	Columbus	OH	\N	High school athletics program	\N	2025-12-12 11:40:23.259962	2025-12-12 11:40:23.259962	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
62	Victory Prep	Basketball, Track	Memphis	TN	\N	High school athletics program	\N	2025-12-12 11:40:23.290031	2025-12-12 11:40:23.290031	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
63	Pioneer High School	Football, Hockey	Detroit	MI	\N	High school athletics program	\N	2025-12-12 11:40:23.316953	2025-12-12 11:40:23.316953	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
64	Frontier Academy	Wrestling, Football	Oklahoma City	OK	\N	High school athletics program	\N	2025-12-12 11:40:23.344838	2025-12-12 11:40:23.344838	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
65	Mountain View High School	Soccer, Track	Colorado Springs	CO	\N	High school athletics program	\N	2025-12-12 11:40:23.373689	2025-12-12 11:40:23.373689	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
66	Lakeside High School	Hockey, Basketball	Milwaukee	WI	\N	High school athletics program	\N	2025-12-12 11:40:23.401706	2025-12-12 11:40:23.401706	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
67	Creekside Academy	Baseball, Football	Kansas City	MO	\N	High school athletics program	\N	2025-12-12 11:40:23.430347	2025-12-12 11:40:23.430347	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
68	Ridgewood High School	Wrestling, Soccer	Raleigh	NC	\N	High school athletics program	\N	2025-12-12 11:40:23.457686	2025-12-12 11:40:23.457686	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
69	Brookfield Prep	Basketball, Track	Louisville	KY	\N	High school athletics program	\N	2025-12-12 11:40:23.486638	2025-12-12 11:40:23.486638	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
70	Fairview High School	Football, Wrestling	Albuquerque	NM	\N	High school athletics program	\N	2025-12-12 11:40:23.519717	2025-12-12 11:40:23.519717	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
71	Clearwater Academy	Swimming, Baseball	Jacksonville	FL	\N	High school athletics program	\N	2025-12-12 11:40:23.548872	2025-12-12 11:40:23.548872	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
72	Springdale High School	Soccer, Basketball	Tucson	AZ	\N	High school athletics program	\N	2025-12-12 11:40:23.57767	2025-12-12 11:40:23.57767	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
73	Meadowbrook High School	Wrestling, Football	Fresno	CA	\N	High school athletics program	\N	2025-12-12 11:40:23.606957	2025-12-12 11:40:23.606957	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
74	Hilltop Academy	Track, Baseball	Omaha	NE	\N	High school athletics program	\N	2025-12-12 11:40:23.636032	2025-12-12 11:40:23.636032	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
75	Oakwood High School	Basketball, Football	Cleveland	OH	\N	High school athletics program	\N	2025-12-12 11:40:23.667793	2025-12-12 11:40:23.667793	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
76	Sycamore Prep	Wrestling, Swimming	Virginia Beach	VA	\N	High school athletics program	\N	2025-12-12 11:40:23.69712	2025-12-12 11:40:23.69712	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
77	Maple Grove High School	Football, Basketball	New Orleans	LA	\N	High school athletics program	\N	2025-12-12 11:40:23.725943	2025-12-12 11:40:23.725943	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
78	Willow Creek Academy	Hockey, Soccer	Portland	ME	\N	High school athletics program	\N	2025-12-12 11:40:23.756216	2025-12-12 11:40:23.756216	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
79	Evergreen High School	Wrestling, Track	Boise	ID	\N	High school athletics program	\N	2025-12-12 11:40:23.786182	2025-12-12 11:40:23.786182	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
80	Summit Prep	Basketball, Baseball	Spokane	WA	\N	High school athletics program	\N	2025-12-12 11:40:23.816713	2025-12-12 11:40:23.816713	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
81	Central High School	Football, Wrestling	Little Rock	AR	\N	High school athletics program	\N	2025-12-12 11:40:23.845477	2025-12-12 11:40:23.845477	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
82	Coastal Academy	Swimming, Soccer	Charleston	SC	\N	High school athletics program	\N	2025-12-12 11:40:23.875898	2025-12-12 11:40:23.875898	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
83	Prairie View High School	Track, Basketball	Wichita	KS	\N	High school athletics program	\N	2025-12-12 11:40:23.905805	2025-12-12 11:40:23.905805	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
84	Harbor High School	Baseball, Football	San Francisco	CA	\N	High school athletics program	\N	2025-12-12 11:40:23.935473	2025-12-12 11:40:23.935473	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
85	Forest Hills Academy	Hockey, Wrestling	Hartford	CT	\N	High school athletics program	\N	2025-12-12 11:40:23.964721	2025-12-12 11:40:23.964721	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
86	Stonebridge High School	Soccer, Basketball	Providence	RI	\N	High school athletics program	\N	2025-12-12 11:40:23.993649	2025-12-12 11:40:23.993649	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
87	Greenfield Prep	Wrestling, Football	Des Moines	IA	\N	High school athletics program	\N	2025-12-12 11:40:24.022754	2025-12-12 11:40:24.022754	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
88	Ashland High School	Track, Swimming	Richmond	VA	\N	High school athletics program	\N	2025-12-12 11:40:24.05113	2025-12-12 11:40:24.05113	\N	high_school	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
89	Pacific State University	Football, Basketball	Los Angeles	CA	\N	University athletics department	\N	2025-12-12 11:40:24.080583	2025-12-12 11:40:24.080583	\N	college	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
90	Northern Tech Institute	Wrestling, Rowing	Boston	MA	\N	University athletics department	\N	2025-12-12 11:40:24.109702	2025-12-12 11:40:24.109702	\N	college	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
91	Midwest State College	Basketball, Track	Chicago	IL	\N	University athletics department	\N	2025-12-12 11:40:24.138233	2025-12-12 11:40:24.138233	\N	college	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
92	Southern University	Football, Baseball	Atlanta	GA	\N	University athletics department	\N	2025-12-12 11:40:24.167968	2025-12-12 11:40:24.167968	\N	college	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
93	Eastern State College	Soccer, Wrestling	New York	NY	\N	University athletics department	\N	2025-12-12 11:40:24.20077	2025-12-12 11:40:24.20077	\N	college	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
94	Rocky Mountain University	Hockey, Skiing	Denver	CO	\N	University athletics department	\N	2025-12-12 11:40:24.229846	2025-12-12 11:40:24.229846	\N	college	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
95	Coastal Tech	Swimming, Tennis	Miami	FL	\N	University athletics department	\N	2025-12-12 11:40:24.25791	2025-12-12 11:40:24.25791	\N	college	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
96	Prairie State University	Football, Wrestling	Lincoln	NE	\N	University athletics department	\N	2025-12-12 11:40:24.286952	2025-12-12 11:40:24.286952	\N	college	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
97	Valley Tech Institute	Basketball, Golf	Phoenix	AZ	\N	University athletics department	\N	2025-12-12 11:40:24.316691	2025-12-12 11:40:24.316691	\N	college	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
98	Great Lakes College	Hockey, Basketball	Detroit	MI	\N	University athletics department	\N	2025-12-12 11:40:24.345377	2025-12-12 11:40:24.345377	\N	college	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
99	Central Plains University	Football, Track	Dallas	TX	\N	University athletics department	\N	2025-12-12 11:40:24.374495	2025-12-12 11:40:24.374495	\N	college	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
100	Mountain State College	Wrestling, Skiing	Salt Lake City	UT	\N	University athletics department	\N	2025-12-12 11:40:24.403746	2025-12-12 11:40:24.403746	\N	college	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
101	Gulf Coast University	Baseball, Swimming	Houston	TX	\N	University athletics department	\N	2025-12-12 11:40:24.432557	2025-12-12 11:40:24.432557	\N	college	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
102	Northeast Tech	Wrestling, Soccer	Philadelphia	PA	\N	University athletics department	\N	2025-12-12 11:40:24.461696	2025-12-12 11:40:24.461696	\N	college	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
103	Southwest State College	Basketball, Football	Albuquerque	NM	\N	University athletics department	\N	2025-12-12 11:40:24.490875	2025-12-12 11:40:24.490875	\N	college	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
104	Lakeshore University	Hockey, Wrestling	Milwaukee	WI	\N	University athletics department	\N	2025-12-12 11:40:24.520418	2025-12-12 11:40:24.520418	\N	college	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
105	Appalachian Tech	Basketball, Track	Charlotte	NC	\N	University athletics department	\N	2025-12-12 11:40:24.550438	2025-12-12 11:40:24.550438	\N	college	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
106	Pacific Northwest College	Soccer, Rowing	Seattle	WA	\N	University athletics department	\N	2025-12-12 11:40:24.57895	2025-12-12 11:40:24.57895	\N	college	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
107	Heartland State University	Football, Wrestling	Kansas City	MO	\N	University athletics department	\N	2025-12-12 11:40:24.607833	2025-12-12 11:40:24.607833	\N	college	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
108	Capital Region Tech	Basketball, Baseball	Sacramento	CA	\N	University athletics department	\N	2025-12-12 11:40:24.636348	2025-12-12 11:40:24.636348	\N	college	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
109	Panther Train LLC	\N	Birmingham	AL	\N	Rich Habits in-house merch and company gear	\N	2025-12-12 11:40:24.665747	2025-12-12 11:40:24.665747	\N	in_house	\N	\N	#6B21A8	#FBBF24	\N	\N	f	\N	\N	\N	\N	\N	\N	\N
\.


ALTER TABLE public.organizations ENABLE TRIGGER ALL;

--
-- Data for Name: contacts; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.contacts DISABLE TRIGGER ALL;

COPY public.contacts (id, org_id, name, email, phone, role_title, created_at, updated_at, role, is_primary, image_url) FROM stdin;
1	4	Head Coach	eham_coach@demo.org	000-000-0001	Wrestling Coach	2025-09-26 20:25:32.402244	2025-09-26 20:25:32.402244	other	f	\N
2	7	Program Director	tarleton_dir@demo.org	000-000-0002	Director	2025-09-26 20:25:32.460632	2025-09-26 20:25:32.460632	other	f	\N
3	8	Club Admin	gata_admin@demo.org	000-000-0003	Admin	2025-09-26 20:25:32.512789	2025-09-26 20:25:32.512789	other	f	\N
10	29	Order Tester	order-test@example.com	(555) 123-4567		2025-10-03 06:41:04.48775	2025-10-03 06:41:04.48775	other	f	\N
11	30	Test Customer	customer@example.com	(555) 123-4567	Customer	2025-10-03 06:52:47.925263	2025-10-03 06:52:47.925263	other	f	\N
12	\N	Automated Test Contact	xutDFu@example.com	555-999-0000	\N	2025-10-15 05:26:22.294129	2025-10-15 05:26:22.294129	other	f	\N
5	\N	John Test Contact	john@test.com	555-555-0100	\N	2025-09-28 21:05:56.509864	2025-09-28 21:05:56.509864	other	f	\N
6	4	Jane Quote Contact	jane@quotes.com	555-555-0101	\N	2025-09-28 21:05:56.509864	2025-09-28 21:05:56.509864	other	f	\N
7	5	Mike Demo Contact	mike@demo.com	555-555-0102	\N	2025-09-28 21:05:56.509864	2025-09-28 21:05:56.509864	other	f	\N
8	\N	Sarah Test User	sarah@test.com	555-555-0103	\N	2025-09-28 21:05:56.509864	2025-09-28 21:05:56.509864	other	f	\N
9	28	John Test qBEh	john.test.M9tF@example.com	555-555-1234	Coach	2025-10-03 05:49:57.135152	2025-10-03 05:49:57.135152	other	f	\N
14	26	Test Customer	testcustomer@example.com	(555) 999-8888	\N	2025-12-03 06:39:06.305921	2025-12-03 06:39:34.855	customer	f	\N
15	30	New Person	newperson@neworg.com	(555) 111-2222	\N	2025-12-03 06:39:53.336769	2025-12-03 06:39:53.336769	customer	f	\N
16	58	Coach Mike Thompson	mthompson@lincoln.edu	503-555-0101	Athletic Director	2025-12-12 11:40:25.070359	2025-12-12 11:40:25.070359	customer	f	\N
17	59	Sarah Johnson	sjohnson@jefferson.edu	303-555-0102	Sports Coordinator	2025-12-12 11:40:25.102733	2025-12-12 11:40:25.102733	customer	f	\N
18	60	David Chen	dchen@roosevelt.edu	206-555-0103	Head Coach	2025-12-12 11:40:25.131319	2025-12-12 11:40:25.131319	customer	f	\N
19	39	Maria Garcia	mgarcia@washingtonprep.edu	312-555-0104	Team Manager	2025-12-12 11:40:25.160564	2025-12-12 11:40:25.160564	customer	f	\N
20	40	James Wilson	jwilson@kennedy.edu	916-555-0105	Wrestling Coach	2025-12-12 11:40:25.189631	2025-12-12 11:40:25.189631	customer	f	\N
21	41	Emily Brown	ebrown@franklin.edu	615-555-0106	Athletic Trainer	2025-12-12 11:40:25.219686	2025-12-12 11:40:25.219686	customer	f	\N
22	46	Robert Taylor	rtaylor@riverside.edu	512-555-0107	Football Coach	2025-12-12 11:40:25.248917	2025-12-12 11:40:25.248917	customer	f	\N
23	47	Jennifer Martinez	jmartinez@oakgrove.edu	205-555-0108	Team Coordinator	2025-12-12 11:40:25.278395	2025-12-12 11:40:25.278395	customer	f	\N
24	51	William Anderson	wanderson@eastwood.edu	713-555-0109	Athletic Director	2025-12-12 11:40:25.306022	2025-12-12 11:40:25.306022	customer	f	\N
25	56	Lisa Thomas	lthomas@heritage.edu	813-555-0110	Sports Manager	2025-12-12 11:40:25.33491	2025-12-12 11:40:25.33491	customer	f	\N
26	89	Dr. Mark Peters	mpeters@pacificstate.edu	213-555-0201	Athletic Department Head	2025-12-12 11:40:25.364215	2025-12-12 11:40:25.364215	customer	f	\N
27	90	Prof. Susan Clark	sclark@northerntech.edu	617-555-0202	Sports Director	2025-12-12 11:40:25.394427	2025-12-12 11:40:25.394427	customer	f	\N
28	91	Dean Tom Richards	trichards@midweststate.edu	312-555-0203	Athletic Coordinator	2025-12-12 11:40:25.423299	2025-12-12 11:40:25.423299	customer	f	\N
29	92	Coach Pat Murphy	pmurphy@southern.edu	404-555-0204	Head Coach	2025-12-12 11:40:25.450956	2025-12-12 11:40:25.450956	customer	f	\N
30	93	Angela White	awhite@easternstate.edu	212-555-0205	Team Manager	2025-12-12 11:40:25.479548	2025-12-12 11:40:25.479548	customer	f	\N
31	99	Steve Harris	sharris@centralplains.edu	214-555-0206	Sports Coordinator	2025-12-12 11:40:25.509648	2025-12-12 11:40:25.509648	customer	f	\N
32	104	Karen Lee	klee@appalachian.edu	704-555-0207	Athletic Trainer	2025-12-12 11:40:25.537824	2025-12-12 11:40:25.537824	customer	f	\N
33	109	Brian Scott	bscott@panthertrainllc.com	205-555-0301	Operations Manager	2025-12-12 11:40:25.566672	2025-12-12 11:40:25.566672	customer	t	\N
34	109	Michelle Davis	mdavis@panthertrainllc.com	205-555-0302	Design Lead	2025-12-12 11:40:25.595399	2025-12-12 11:40:25.595399	customer	f	\N
35	109	Kevin Wright	kwright@panthertrainllc.com	205-555-0303	Sales Director	2025-12-12 11:40:25.624513	2025-12-12 11:40:25.624513	customer	f	\N
\.


ALTER TABLE public.contacts ENABLE TRIGGER ALL;

--
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.leads DISABLE TRIGGER ALL;

COPY public.leads (id, lead_code, org_id, contact_id, owner_user_id, stage, source, notes, claimed_at, score, created_at, updated_at, archived, archived_at, archived_by, geo_lat, geo_lng, geo_precision, geo_source, geo_updated_at) FROM stdin;
3	L-00003	8	3	1afdf7c4-c2d6-458f-8a8e-b8242d366024	future_lead	referral	Club pack + backpacks	\N	55	2025-09-26 20:25:34.47105	2025-09-26 20:25:34.47105	f	\N	\N	\N	\N	\N	\N	\N
1	L-00001	\N	\N	\N	future_lead	Trade Show		\N	85	2025-09-26 19:13:04.038	2025-09-26 19:13:04.038	f	\N	\N	\N	\N	\N	\N	\N
7	L-00004	28	\N	\N	future_lead	Referral	E2E test lead 86sU	\N	50	2025-10-03 05:48:23.548863	2025-10-03 05:48:23.548863	f	\N	\N	\N	\N	\N	\N	\N
8	L-00005	31	11	a0eJC3	future_lead	website		\N	50	2025-10-04 00:25:55.875703	2025-10-04 00:25:55.875703	f	\N	\N	\N	\N	\N	\N	\N
2	L-00002	7	2	54c442d2-114e-444d-9832-0eeb719f7bed	mock_up	inbound	Team-worn gear only; license questions	2025-09-26 20:25:34.374	80	2025-09-26 20:25:34.382502	2025-09-26 20:25:34.382502	f	\N	\N	\N	\N	\N	\N	\N
9	L-00006	34	12	RrrHfL	lead	test_pipeline		\N	75	2025-10-15 05:21:12.918909	2025-10-15 05:27:30.743	f	\N	\N	\N	\N	\N	\N	\N
10	L-00007	34	\N	8pj4HX	lead	pipeline_test		\N	80	2025-10-15 05:36:16.19821	2025-10-15 05:37:26.529	f	\N	\N	\N	\N	\N	\N	\N
11	L-00008	37	\N	laird-sales-test	future_lead	website		\N	50	2025-10-21 21:56:53.690499	2025-10-21 21:56:53.690499	f	\N	\N	\N	\N	\N	\N	\N
\.


ALTER TABLE public.leads ENABLE TRIGGER ALL;

--
-- Data for Name: manufacturers; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.manufacturers DISABLE TRIGGER ALL;

COPY public.manufacturers (id, name, contact_name, email, phone, notes, lead_time_days, min_order_qty, created_at, updated_at, logo_url) FROM stdin;
1	Hawk Manufacturing	Hawk Team	hawk@demo.mfg	000-000-1001	Pakistan partner; dedicated Rich Habits wing	21	12	2025-09-26 20:25:34.174672	2025-09-26 20:25:34.174672	\N
2	ImprintGenie	Brian Emmen	brian@imprintgenie.demo	000-000-1002	Stateside on-demand / parent stores	10	1	2025-09-26 20:25:34.214847	2025-09-26 20:25:34.214847	\N
3	Updated Manufacturing Co	John Smith	john@testmfr.com	+1 555-1234	Reliable manufacturer for custom apparel	28	50	2025-09-30 21:13:19.887333	2025-09-30 21:14:43.163	\N
4	Test Manufacturer Inc	Test Contact	test@manufacturer.com	555-1234	\N	14	1	2025-10-13 01:57:24.378056	2025-10-13 01:57:24.378056	\N
5	Test Manufacturer Auto 2rRDhw	\N	\N	\N	\N	14	1	2025-10-13 19:36:11.111065	2025-10-13 19:36:11.111065	\N
6	AutoAssign Test ylSk3a	\N	\N	\N	\N	14	1	2025-10-13 19:50:30.863531	2025-10-13 19:50:30.863531	\N
\.


ALTER TABLE public.manufacturers ENABLE TRIGGER ALL;

--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.orders DISABLE TRIGGER ALL;

COPY public.orders (id, order_code, org_id, lead_id, salesperson_id, order_name, status, design_approved, sizes_validated, deposit_received, invoice_url, order_folder, size_form_link, manufacturer_id, est_delivery, tracking_number, priority, created_at, updated_at, shipping_address, bill_to_address, contact_name, contact_email, contact_phone) FROM stdin;
36	O-00018	36	\N	qpp8Vz	Test Order 8RItHu	new	f	f	f	\N	\N	\N	\N	\N	\N	normal	2025-10-17 05:23:46.518608	2025-10-17 05:23:46.518608	\N	\N	\N	\N	\N
37	O-00019	36	\N	8d2HSy	Custom Test Order zIP8pJ	new	f	f	f	\N	\N	\N	\N	\N	\N	normal	2025-10-17 05:30:33.223982	2025-10-17 05:30:33.223982	\N	\N	\N	\N	\N
38	O-00020	38	\N	UvMMXN	Automated Test Order 1	new	f	f	f	\N	\N	\N	\N	\N	\N	normal	2025-10-30 03:32:13.176761	2025-10-30 03:32:13.176761	\N	\N	\N	\N	\N
39	O-00021	38	\N	9XVdOb	TEST Order for Tracking	new	t	f	f			\N	\N	\N		normal	2025-10-30 03:38:37.926794	2025-11-19 01:30:11.225	\N	\N	\N	\N	\N
35	O-00017	22	\N	b7f37c3a-b1cf-4309-a9f7-6db2ba2b34b5	2025 Test Order	production	f	f	f	\N	\N	\N	\N	2025-10-23	\N	normal	2025-10-17 03:56:12.683759	2025-11-19 20:58:38.014	\N	\N	\N	\N	\N
42	O-00022	37	\N	dee15298-a714-408c-bacd-09a9e1af5b68	Skull and Crossbones Singlet Order, 2025	new	f	f	f	\N	\N	\N	\N	2025-12-04	\N	normal	2025-11-24 07:15:14.765782	2025-11-24 07:15:14.765782	\N	\N	\N	\N	\N
19	O-00004	30	\N	ADiI7O	Test Order - Line Item Flow	new	f	f	f	\N	\N	\N	\N	\N	\N	normal	2025-10-03 16:06:59.306294	2025-10-03 16:06:59.306294	\N	\N	\N	\N	\N
20	O-00005	30	\N	yVAU78	Test Order - Price Break Removal	new	f	f	f	\N	\N	\N	\N	\N	\N	normal	2025-10-03 17:22:00.693738	2025-10-03 17:22:00.693738	\N	\N	\N	\N	\N
22	O-00007	30	\N	t3onPB	E2E Test Order 1759516655750	new	f	f	f				\N	2025-10-15		normal	2025-10-03 18:38:35.375748	2025-10-03 18:54:51.527	\N	\N	\N	\N	\N
23	O-00008	30	\N	test_admin_mfg	Test Order 001	new	f	f	f	\N	\N	\N	\N	\N	\N	normal	2025-10-03 19:07:42.789521	2025-10-03 19:07:42.789521	\N	\N	\N	\N	\N
21	O-00006	30	\N	\N	Test Automated Manufacturing - t5FmYd	new	f	f	f	\N	\N	\N	\N	\N	\N	high	2025-10-03 18:21:54.268887	2025-10-04 00:19:12.142	\N	\N	\N	\N	\N
24	O-00009	31	\N	a0eJC3	Test Order vDH9	new	f	f	f	\N	\N	\N	\N	\N	\N	normal	2025-10-04 00:28:26.326381	2025-10-04 00:28:26.326381	\N	\N	\N	\N	\N
25	O-00010	32	\N	XMOE4G	E2E Test Order	production	f	f	f				\N	2025-10-30		normal	2025-10-11 03:08:31.298053	2025-10-11 03:16:05.519	\N	\N	\N	\N	\N
26	O-00011	32	\N	\N	Test Order - No Manufacturer Assignment	completed	f	f	f	\N	\N	\N	\N	\N	\N	normal	2025-10-11 21:35:07.211284	2025-10-11 21:38:12.458	\N	\N	\N	\N	\N
28	TEST-ORD-001	34	\N	\N	Test Order	production	f	f	f	\N	\N	\N	\N	\N	\N	normal	2025-10-13 02:00:43.638547	2025-10-13 02:00:43.638547	\N	\N	\N	\N	\N
30	O-00012	4	\N	\N	Test 0kJYwd	new	f	f	f	\N	\N	\N	\N	\N	\N	normal	2025-10-13 19:53:10.691692	2025-10-13 19:53:10.691692	\N	\N	\N	\N	\N
31	O-00013	34	\N	test-user	E2E Test Order 1760560104156	production	f	f	f	\N	\N	\N	\N	\N	\N	normal	2025-10-15 20:32:28.901784	2025-10-16 13:42:43.249	\N	\N	\N	\N	\N
32	O-00014	34	\N	test-viewer-user	Test Order for Image Viewer	new	f	f	f	\N	\N	\N	\N	\N	\N	normal	2025-10-16 13:49:32.883098	2025-10-16 13:49:32.883098	\N	\N	\N	\N	\N
33	O-00015	35	\N	zkfHLJ	Image Sync Test KgMHd3	new	f	f	f	\N	\N	\N	\N	\N	\N	normal	2025-10-16 19:38:12.403124	2025-10-16 19:38:12.403124	\N	\N	\N	\N	\N
34	O-00016	36	\N	nyAcqv	Image Sync Test 7H8jj3	new	f	f	f	\N	\N	\N	\N	\N	\N	normal	2025-10-16 19:44:45.493344	2025-10-16 19:44:45.493344	\N	\N	\N	\N	\N
15	O-00001	27	\N	0c17b360-653e-4581-9444-d21613863b48	Homewood	production	t	t	t				\N	2025-10-01		normal	2025-09-30 19:23:09.47086	2025-12-03 06:39:06.337	Test Organization LLC\n123 Test Street\nTest City, TS 12345\nUSA	Test Organization LLC\n123 Test Street\nTest City, TS 12345\nUSA	Test Customer	testcustomer@example.com	(555) 123-4567
16	O-00002	26	\N	dee15298-a714-408c-bacd-09a9e1af5b68	Homewood	new	f	f	f	\N	\N	\N	\N	2025-09-30	\N	normal	2025-09-30 20:06:04.642217	2025-12-03 06:39:34.872	Another Location\n456 New Street\nNew City, NC 67890\nUSA	\N	Test Customer Updated	testcustomer@example.com	(555) 999-8888
18	O-00003	30	\N	\N	Test Order yd5	production	f	f	f				\N	2025-10-15		normal	2025-10-03 06:54:58.104221	2025-12-03 06:39:53.353	Brand New Organization\n789 New Org Way\nNew Org City, NO 99999\nUSA	\N	New Person	newperson@neworg.com	(555) 111-2222
44	ORD-SEED-001	39	\N	54c442d2-114e-444d-9832-0eeb719f7bed	2025 Football Season Pack	new	f	f	f	\N	\N	\N	\N	2026-02-12	\N	normal	2025-12-12 11:40:25.705713	2025-12-12 11:40:25.705713	Portland, OR	\N	\N	\N	\N
45	ORD-SEED-002	40	\N	54c442d2-114e-444d-9832-0eeb719f7bed	Wrestling Team Gear	waiting_sizes	f	f	f	\N	\N	\N	\N	2026-02-12	\N	normal	2025-12-12 11:40:25.738001	2025-12-12 11:40:25.738001	Denver, CO	\N	\N	\N	\N
46	ORD-SEED-003	41	\N	54c442d2-114e-444d-9832-0eeb719f7bed	Soccer Spring Collection	invoiced	f	f	f	\N	\N	\N	\N	2026-02-12	\N	normal	2025-12-12 11:40:25.76773	2025-12-12 11:40:25.76773	Seattle, WA	\N	\N	\N	\N
47	ORD-SEED-004	89	\N	54c442d2-114e-444d-9832-0eeb719f7bed	Championship Apparel	production	f	f	f	\N	\N	\N	\N	2026-02-12	\N	normal	2025-12-12 11:40:25.799686	2025-12-12 11:40:25.799686	Los Angeles, CA	\N	\N	\N	\N
48	ORD-SEED-005	90	\N	54c442d2-114e-444d-9832-0eeb719f7bed	Rowing Team Order	shipped	f	f	f	\N	\N	\N	\N	2026-02-12	\N	normal	2025-12-12 11:40:25.829861	2025-12-12 11:40:25.829861	Boston, MA	\N	\N	\N	\N
49	ORD-SEED-006	91	\N	54c442d2-114e-444d-9832-0eeb719f7bed	Basketball Season 2025	completed	f	f	f	\N	\N	\N	\N	2026-02-12	\N	normal	2025-12-12 11:40:25.861839	2025-12-12 11:40:25.861839	Chicago, IL	\N	\N	\N	\N
50	ORD-SEED-007	109	\N	54c442d2-114e-444d-9832-0eeb719f7bed	Company Staff Shirts	new	f	f	f	\N	\N	\N	\N	2026-02-12	\N	normal	2025-12-12 11:40:25.891767	2025-12-12 11:40:25.891767	Birmingham, AL	\N	\N	\N	\N
51	ORD-SEED-008	92	\N	54c442d2-114e-444d-9832-0eeb719f7bed	Baseball Team Uniforms	waiting_sizes	f	f	f	\N	\N	\N	\N	2026-02-12	\N	normal	2025-12-12 11:40:25.921716	2025-12-12 11:40:25.921716	Atlanta, GA	\N	\N	\N	\N
52	ORD-SEED-009	93	\N	54c442d2-114e-444d-9832-0eeb719f7bed	Soccer Team Kit	invoiced	f	f	f	\N	\N	\N	\N	2026-02-12	\N	normal	2025-12-12 11:40:25.951983	2025-12-12 11:40:25.951983	New York, NY	\N	\N	\N	\N
53	ORD-SEED-010	94	\N	54c442d2-114e-444d-9832-0eeb719f7bed	Winter Sports Bundle	production	f	f	f	\N	\N	\N	\N	2026-02-12	\N	normal	2025-12-12 11:40:25.982438	2025-12-12 11:40:25.982438	Denver, CO	\N	\N	\N	\N
54	ORD-SEED-011	95	\N	54c442d2-114e-444d-9832-0eeb719f7bed	Swim Team Apparel	new	f	f	f	\N	\N	\N	\N	2026-02-12	\N	normal	2025-12-12 11:40:26.014276	2025-12-12 11:40:26.014276	Miami, FL	\N	\N	\N	\N
55	ORD-SEED-012	96	\N	54c442d2-114e-444d-9832-0eeb719f7bed	Football Fall 2025	waiting_sizes	f	f	f	\N	\N	\N	\N	2026-02-12	\N	normal	2025-12-12 11:40:26.044867	2025-12-12 11:40:26.044867	Lincoln, NE	\N	\N	\N	\N
\.


ALTER TABLE public.orders ENABLE TRIGGER ALL;

--
-- Data for Name: design_jobs; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.design_jobs DISABLE TRIGGER ALL;

COPY public.design_jobs (id, job_code, org_id, lead_id, brief, urgency, status, assigned_designer_id, rendition_count, final_link, created_at, updated_at, order_id, requirements, rendition_urls, reference_files, deadline, priority, status_changed_at, rendition_mockup_url, rendition_production_url, internal_notes, client_feedback, salesperson_id, archived, archived_at, logo_urls, design_reference_urls, additional_file_urls, design_style_url, final_design_urls) FROM stdin;
20	J-00001	4	1	Primary purple, bold RH mark, minimal white accent tee + hoodie mockups	normal	in_progress	a4c98edf-038e-40d7-9667-10f67a95fc44	0	\N	2025-09-30 15:42:22.511794	2025-09-30 15:42:22.511794	\N	\N	\N	\N	\N	normal	2025-09-30 15:42:22.511794	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
21	DJ-00002	17	\N	Fix Black Singlets to look more like 2023 singlets.	high	in_progress	\N	0	\N	2025-09-30 16:46:24.944347	2025-10-04 00:39:27.904	\N	Black, navy band on chest.	\N	\N	2025-10-01	high	2025-10-04 00:39:27.904	\N	\N			\N	f	\N	\N	\N	\N	\N	\N
23	TEST-SALES	32	\N	\N	normal	draft	\N	0	\N	2025-10-10 18:37:09.458237	2025-10-10 18:37:09.458237	\N	\N	\N	\N	\N	normal	2025-10-10 18:37:09.458237	\N	\N	\N	\N	sales_user_test	f	\N	\N	\N	\N	\N	\N
19	DJ-00001	4	\N	Test design job for salesperson 1	normal	pending	\N	0	\N	2025-09-30 14:53:57.398559	2025-10-11 22:02:49.371	\N		\N	\N	\N	normal	2025-09-30 14:53:57.398559	\N	\N		\N	\N	f	\N	\N	\N	\N	\N	\N
24	DJ-00003	34	\N	Test attachment job for QA	normal	pending	d611f424-250b-4120-9352-099171fe0bac	0	\N	2025-10-13 14:58:27.745275	2025-10-16 05:15:27.107	\N	Test requirements	\N	\N	\N	normal	2025-10-13 14:58:27.745275	\N	\N		\N	\N	f	\N	\N	\N	\N	\N	\N
25	DJ-00004	34	\N	Test design job with attachments	normal	pending	\N	0	\N	2025-10-16 05:06:36.674187	2025-12-12 04:13:17.825	\N		\N	\N	\N	normal	2025-12-12 04:13:17.825	\N	\N			\N	f	\N	{/public-objects/products/2025/11/img_1762286957088_xbcvli}	{/public-objects/products/2025/12/img_1765512792393_v62667}	{/public-objects/products/2025/12/img_1765512784446_4c09pt}	\N	{/public-objects/products/2025/12/img_1765512702151_v2h7m7}
26	DJ-SEED-001	39	\N	Modern football logo with school colors (purple and gold)	high	in_progress	designer-test-user	0	\N	2025-12-12 11:40:26.537041	2025-12-12 11:40:26.537041	\N	\N	\N	\N	2026-01-12	high	2025-12-12 11:40:26.537041	\N	\N	\N	\N	54c442d2-114e-444d-9832-0eeb719f7bed	f	\N	\N	\N	\N	\N	\N
27	DJ-SEED-002	89	\N	Championship merchandise designs - clean, modern aesthetic	normal	pending	designer-test-user	0	\N	2025-12-12 11:40:26.569579	2025-12-12 11:40:26.569579	\N	\N	\N	\N	2026-01-12	normal	2025-12-12 11:40:26.569579	\N	\N	\N	\N	54c442d2-114e-444d-9832-0eeb719f7bed	f	\N	\N	\N	\N	\N	\N
28	DJ-SEED-003	90	\N	Rowing team apparel with vintage nautical theme	low	review	designer-test-user	0	\N	2025-12-12 11:40:26.598562	2025-12-12 11:40:26.598562	\N	\N	\N	\N	2026-01-12	normal	2025-12-12 11:40:26.598562	\N	\N	\N	\N	54c442d2-114e-444d-9832-0eeb719f7bed	f	\N	\N	\N	\N	\N	\N
29	DJ-SEED-004	109	\N	New company staff shirts with updated branding	normal	approved	designer-test-user	0	\N	2025-12-12 11:40:26.628856	2025-12-12 11:40:26.628856	\N	\N	\N	\N	2026-01-12	normal	2025-12-12 11:40:26.628856	\N	\N	\N	\N	54c442d2-114e-444d-9832-0eeb719f7bed	f	\N	\N	\N	\N	\N	\N
30	DJ-SEED-005	40	\N	Wrestling singlets with aggressive panther design	high	in_progress	designer-test-user	0	\N	2025-12-12 11:40:26.660557	2025-12-12 11:40:26.660557	\N	\N	\N	\N	2026-01-12	high	2025-12-12 11:40:26.660557	\N	\N	\N	\N	54c442d2-114e-444d-9832-0eeb719f7bed	f	\N	\N	\N	\N	\N	\N
31	DJ-SEED-006	92	\N	Baseball uniform refresh for 2025 season	normal	pending	designer-test-user	0	\N	2025-12-12 11:40:26.692042	2025-12-12 11:40:26.692042	\N	\N	\N	\N	2026-01-12	normal	2025-12-12 11:40:26.692042	\N	\N	\N	\N	54c442d2-114e-444d-9832-0eeb719f7bed	f	\N	\N	\N	\N	\N	\N
32	DJ-SEED-007	41	\N	Soccer kit with modern gradient design	low	pending	designer-test-user	0	\N	2025-12-12 11:40:26.722023	2025-12-12 11:40:26.722023	\N	\N	\N	\N	2026-01-12	normal	2025-12-12 11:40:26.722023	\N	\N	\N	\N	54c442d2-114e-444d-9832-0eeb719f7bed	f	\N	\N	\N	\N	\N	\N
\.


ALTER TABLE public.design_jobs ENABLE TRIGGER ALL;

--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.products DISABLE TRIGGER ALL;

COPY public.products (id, sku, name, category_id, description, base_price, active, created_at, updated_at, style, min_order_qty, sizes, status, primary_image_url, additional_images, archived, archived_at, archived_by) FROM stdin;
1	TSHIRT-001	Classic T-Shirt	1	Premium cotton t-shirt	24.99	t	2025-09-26 19:24:41.322	2025-09-26 19:24:41.322	\N	1	\N	active	\N	\N	f	\N	\N
2	HOODIE-001	Athletic Hoodie	2	Premium athletic hoodie	59.99	t	2025-09-26 19:33:27.002	2025-09-26 19:33:27.002	\N	1	\N	active	\N	\N	f	\N	\N
3	BASIC-TEE	Basic T-Shirt	3	Basic clothing item	19.99	t	2025-09-26 19:39:36.644	2025-09-26 19:39:36.644	\N	1	\N	active	\N	\N	f	\N	\N
4	PHONE-001	Smartphone	4		299.99	t	2025-09-26 19:53:41.851	2025-09-26 19:53:41.851	\N	1	\N	active	\N	\N	f	\N	\N
5	TEE-C1717	Rich Habits Heavy Tee	5	Comfort Colors-style heavyweight tee	25.00	t	2025-09-26 20:25:32.788375	2025-09-26 20:25:32.788375	\N	1	\N	active	\N	\N	f	\N	\N
6	FLEECE-CRW	Rich Habits Crewneck	6	Midweight crewneck fleece	30.00	t	2025-09-26 20:25:32.849912	2025-09-26 20:25:32.849912	\N	1	\N	active	\N	\N	f	\N	\N
7	SHORTS-CORE	Core Training Shorts	7	Lightweight training shorts	20.00	t	2025-09-26 20:25:32.9001	2025-09-26 20:25:32.9001	\N	1	\N	active	\N	\N	f	\N	\N
8	TECH-SET	Performance Tech Suit	8	Compression top + bottom	60.00	t	2025-09-26 20:25:32.950379	2025-09-26 20:25:32.950379	\N	1	\N	active	\N	\N	f	\N	\N
9	SINGLET-RH	Performance Wrestling Singlet	9	Pro-cut, sublimated	35.00	t	2025-09-26 20:25:33.004932	2025-09-26 20:25:33.004932	\N	1	\N	active	\N	\N	f	\N	\N
10	BAG-BPK	Team Backpack	10	Team backpack with logo	30.00	t	2025-09-26 20:25:33.053372	2025-09-26 20:25:33.053372	\N	1	\N	active	\N	\N	f	\N	\N
16	BAG-AUT-1315	Auto SKU Product 9UfF12	10	This product has an auto-generated SKU	49.99	t	2025-09-27 00:30:25.762652	2025-09-27 00:30:25.762652	\N	1	\N	active	\N	\N	f	\N	\N
29	SIN-TWO-6774	Doublet	9	\N	50.00	t	2025-09-29 19:18:53.664673	2025-09-29 19:18:53.664673	Two-Piece	1	\N	active	\N	\N	f	\N	\N
30	SHO-MMA-4974	Fight Shorts	7	MMA Fight Shorts with optional lining inserted.	2.00	t	2025-09-29 19:20:45.625168	2025-09-29 19:20:45.625168	MMA	1	\N	active	\N	\N	f	\N	\N
33	TEE-REG-5372	Cotton Short Sleeve Tee	5	\N	12.50	t	2025-09-29 19:26:06.342999	2025-09-29 19:26:06.342999	Regular Fit	1	\N	active	\N	\N	f	\N	\N
34	TEE-REG-5358	Triblend Short Sleeve Tee	5	\N	15.00	t	2025-09-29 19:26:31.887456	2025-09-29 19:26:31.887456	Regular, Athletic	1	\N	active	\N	\N	f	\N	\N
36	TEE-REG-6911	Short Sleeve Tee	5	\N	12.50	t	2025-09-30 17:56:06.842909	2025-09-30 17:56:06.842909	Regular Fit	1	\N	active	\N	\N	f	\N	\N
37	E2E-E2E-9044	E2E Test Product 2kds	19	TestTest product	29.99	t	2025-10-03 06:03:19.09499	2025-10-03 06:03:19.09499	\N	1	\N	active	\N	\N	f	\N	\N
38	SKU-OXmVtR	E2E Product h5p7 EDITED	20	Test product	49.99	t	2025-10-03 06:16:11.537976	2025-10-03 06:17:10.508	\N	1	\N	active	\N	\N	f	\N	\N
39	TES-TES-4299	Test Prod FEM EDITED	21	Test\n	39.99	t	2025-10-03 06:24:38.827797	2025-10-03 06:25:12.223	\N	1	\N	active	\N	\N	f	\N	\N
40	FIN-FIN-1840	Final Prod fX0 UPDATED	22	Final	99.99	t	2025-10-03 06:32:35.485185	2025-10-03 06:33:12.653	\N	1	\N	active	\N	\N	f	\N	\N
41	ORD-ORD-6686	Order Product _z	23	Test	50.00	t	2025-10-03 06:38:32.04982	2025-10-03 06:38:32.04982	\N	1	\N	active	\N	\N	f	\N	\N
42	ORD-ORD-7479	Order Prod aC	24	Test	75.00	t	2025-10-03 06:49:39.077866	2025-10-03 06:49:39.077866	\N	1	\N	active	\N	\N	f	\N	\N
17	BagARH	OIDC Debug Product km-kdV	10		12.99	t	2025-09-27 01:04:49.51619	2025-10-08 13:55:59.05	Debug	1	\N	active	\N	\N	f	\N	\N
43	E2E-E2E-7949	E2E Product ZaXE-d	25	Created by E2E test	29.99	t	2025-10-13 19:38:14.174046	2025-10-13 19:38:14.174046	\N	1	\N	active	\N	\N	f	\N	\N
44	APP-TES-2939	Test Product EAiNyP	1	\N	19.99	t	2025-10-13 19:50:52.085953	2025-10-13 19:50:52.085953	\N	1	\N	active	\N	\N	f	\N	\N
27	NEG-001	Negative Price Product	1	\N	1.00	t	2025-09-27 09:29:16.369007	2025-09-27 09:29:16.369007	\N	1	\N	active	\N	\N	f	\N	\N
\.


ALTER TABLE public.products ENABLE TRIGGER ALL;

--
-- Data for Name: product_variants; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.product_variants DISABLE TRIGGER ALL;

COPY public.product_variants (id, product_id, variant_code, color, size, material, msrp, cost, image_url, created_at, updated_at, default_manufacturer_id, backup_manufacturer_id, archived, archived_at, archived_by) FROM stdin;
1	4	PHONE-001-BLK	Black	128GB	Plastic	349.99	200.00		2025-09-26 19:54:10.903	2025-09-26 19:54:10.903	\N	\N	f	\N	\N
2	5	TEE-C1717-BLK	Black	\N	Cotton	25.00	11.00	\N	2025-09-26 20:25:33.10846	2025-09-26 20:25:33.10846	\N	\N	f	\N	\N
3	6	FLEECE-CRW-CHR	Charcoal	\N	Fleece	30.00	14.00	\N	2025-09-26 20:25:33.175369	2025-09-26 20:25:33.175369	\N	\N	f	\N	\N
7	10	BAG-BPK-BLK	Black	\N	Nylon	30.00	14.00	\N	2025-09-26 20:25:33.393039	2025-09-26 20:25:33.393039	\N	\N	f	\N	\N
9	1	TSHIRT-001-BLU-L	Blue	L	Cotton	27.99	12.50	\N	2025-09-27 07:10:24.027322	2025-09-27 07:10:24.027322	\N	\N	f	\N	\N
10	2	HOODIE-001-GRY	Gray	\N	Polyester	64.99	\N	\N	2025-09-27 07:10:25.191416	2025-09-27 07:10:25.191416	\N	\N	f	\N	\N
8	1	TSHIRT-001-RED-M	Red	M	Cotton	32.99	15.00	\N	2025-09-27 07:10:22.958584	2025-09-27 07:10:22.958584	\N	\N	f	\N	\N
6	9	SINGLET-RH	Sublimated	YS-4XL	Poly/Spandex	50.00	18.00		2025-09-26 20:25:33.333401	2025-09-29 02:21:42.704	\N	\N	f	\N	\N
4	7	SHORTS-CORE	Any	YS-4XL	Poly/Spandex	25.00	10.00		2025-09-26 20:25:33.231359	2025-09-29 19:19:55.684	\N	\N	f	\N	\N
5	8	TECH-SET-TOP	ANY	YS-4XL	Elastane	65.00	30.00		2025-09-26 20:25:33.280234	2025-09-29 19:22:00.473	\N	\N	f	\N	\N
13	7	SHORTS-CORE-BLK	Black	\N	Poly	20.00	9.00	\N	2025-09-30 15:42:21.395472	2025-09-30 15:42:21.395472	\N	\N	f	\N	\N
14	8	TECH-SET-PURP	Purple	\N	Comp	60.00	28.00	\N	2025-09-30 15:42:21.459227	2025-09-30 15:42:21.459227	\N	\N	f	\N	\N
16	9	WomensCut	Sublimated	YS-4XL	Poly/Spandex	50.00	17.00		2025-09-30 16:44:10.769814	2025-09-30 16:44:10.769814	\N	\N	f	\N	\N
17	39	VAR-xyA	Navy	XL	Polyester	29.99	15.00		2025-10-03 06:26:19.631344	2025-10-03 06:26:19.631344	3	\N	f	\N	\N
18	40	FINAL-WFCrimsonXXLSilk	Gold			29.99	15.00		2025-10-03 06:34:34.9738	2025-10-03 06:35:05.428	3	\N	f	\N	\N
19	41	ORDER-VAR-SI	Black	L	Cotton	59.99	25.00		2025-10-03 06:39:10.29339	2025-10-03 06:39:10.29339	3	\N	f	\N	\N
20	42	ORD-VAR-ON	Red	M	Cotton	29.99	15.00		2025-10-03 06:50:44.945675	2025-10-03 07:03:47.88	3	\N	f	\N	\N
21	9	SINGLET-RH-PURP	Purple		Sublimated	35.00	18.00		2025-10-03 17:51:05.586325	2025-10-03 18:46:55.779	3	\N	f	\N	\N
22	1	VAR-TEST	\N	\N	\N	19.99	5.00	\N	2025-10-13 02:00:43.638547	2025-10-13 02:00:43.638547	\N	\N	f	\N	\N
23	43	VAR-pi7VWP	Red	M	Cotton	29.99	15.00		2025-10-13 19:40:23.408737	2025-10-13 19:41:08.204	5	\N	f	\N	\N
24	44	VAR-18QKZY	Red	M	\N	\N	\N	\N	2025-10-13 19:52:10.478576	2025-10-13 19:52:10.478576	6	\N	f	\N	\N
\.


ALTER TABLE public.product_variants ENABLE TRIGGER ALL;

--
-- Data for Name: ai_design_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.ai_design_sessions DISABLE TRIGGER ALL;

COPY public.ai_design_sessions (id, session_code, design_job_id, order_id, variant_id, user_id, prompt, context_variant_ids, generated_concepts, selected_concept_index, status, ai_provider, model_version, tokens_used, generation_duration, error_message, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.ai_design_sessions ENABLE TRIGGER ALL;

--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs DISABLE TRIGGER ALL;

COPY public.audit_logs (id, actor_user_id, entity, entity_id, action, before_json, after_json, created_at) FROM stdin;
14	41090967	organization	17	created	\N	{"id":17,"name":"Homewood High School","sports":"Wrestling","city":"Homewood","state":"AL","shippingAddress":"","notes":"","logoUrl":null,"createdAt":"2025-09-26T23:48:51.790Z","updatedAt":"2025-09-26T23:48:51.790Z"}	2025-09-26 23:48:51.829629
21	41090967	design_job	17	created	\N	{"id":17,"jobCode":"DJ-00009","orgId":17,"leadId":4,"orderId":7,"brief":"aaaa","requirements":"aaa","urgency":"normal","status":"pending","assignedDesignerId":null,"renditionCount":0,"renditionUrls":null,"renditionMockupUrl":null,"renditionProductionUrl":null,"finalLink":null,"referenceFiles":null,"deadline":"2025-10-01","priority":"normal","internalNotes":"aaa","clientFeedback":null,"statusChangedAt":"2025-09-27T05:50:29.350Z","createdAt":"2025-09-27T05:50:29.350Z","updatedAt":"2025-09-27T05:50:29.350Z"}	2025-09-27 05:50:29.379532
23	41090967	organization	19	created	\N	{"id":19,"name":"Oak Mountain High School","sports":"Wrestling","city":"Birmingham","state":"Alabama","shippingAddress":"5476 Caldwell Mill Rd","notes":"","logoUrl":null,"createdAt":"2025-09-27T14:14:15.860Z","updatedAt":"2025-09-27T14:14:15.860Z"}	2025-09-27 14:14:15.898294
24	41090967	order	1	deleted	{"id":1,"orderCode":"O-00001","orgId":4,"leadId":1,"salespersonId":"038c49f9-ccbc-4be6-bc37-7635842a6132","orderName":"2025 Spirit Pack","status":"waiting_sizes","designApproved":true,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"manufacturerId":1,"estDelivery":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-09-26T20:25:34.683Z","updatedAt":"2025-09-26T20:25:34.683Z"}	\N	2025-09-27 17:03:08.416694
25	41090967	salesperson	6	created	\N	{"id":6,"userId":"dee15298-a714-408c-bacd-09a9e1af5b68","territory":"Southwest","quotaMonthly":"30000.00","commissionRate":"0.1000","active":true,"notes":"","defaultOrgScope":"","createdAt":"2025-09-27T17:09:05.619Z","updatedAt":"2025-09-27T17:09:05.619Z"}	2025-09-27 17:09:05.650132
26	41090967	organization	20	created	\N	{"id":20,"name":"Rockwall High School","sports":"Wrestling","city":"Rockwall","state":"TX","shippingAddress":"Rockwall High School\\n1250 S. State Highway 205\\nRockwall, TX 75087","notes":"","logoUrl":null,"createdAt":"2025-09-27T17:09:50.284Z","updatedAt":"2025-09-27T17:09:50.284Z"}	2025-09-27 17:09:50.312146
27	41090967	order	9	created	\N	{"id":9,"orderCode":"O-00001","orgId":17,"leadId":null,"salespersonId":null,"orderName":"Homewood","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"manufacturerId":null,"estDelivery":"2025-10-03","trackingNumber":null,"priority":"normal","createdAt":"2025-09-28T18:54:16.835Z","updatedAt":"2025-09-28T18:54:16.835Z"}	2025-09-28 18:54:16.874544
28	41090967	order_line_item	10	created	\N	{"id":10,"orderId":9,"variantId":9,"itemName":null,"colorNotes":null,"yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":1,"m":0,"l":0,"xl":0,"xxl":0,"xxxl":0,"unitPrice":"27.99","qtyTotal":1,"lineTotal":"27.99","notes":"","createdAt":"2025-09-28T18:54:17.029Z","updatedAt":"2025-09-28T18:54:17.029Z"}	2025-09-28 18:54:17.053423
29	41090967	variant	6	updated	{"id":6,"productId":9,"variantCode":"SINGLET-RH-PURP","color":"Purple","size":null,"material":"Sublimated","msrp":"35.00","cost":"18.00","imageUrl":null,"createdAt":"2025-09-26T20:25:33.333Z","updatedAt":"2025-09-26T20:25:33.333Z"}	{"id":6,"productId":9,"variantCode":"SINGLET-RH","color":"Sublimated","size":"YS-4XL","material":"Poly/Spandex","msrp":"50.00","cost":"18.00","imageUrl":"","createdAt":"2025-09-26T20:25:33.333Z","updatedAt":"2025-09-29T02:21:42.704Z"}	2025-09-29 02:21:42.734265
30	41090967	order	9	updated	{"id":9,"orderCode":"O-00001","orgId":17,"leadId":null,"salespersonId":null,"orderName":"Homewood","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"manufacturerId":null,"estDelivery":"2025-10-03","trackingNumber":null,"priority":"normal","createdAt":"2025-09-28T18:54:16.835Z","updatedAt":"2025-09-28T18:54:16.835Z"}	{"id":9,"orderCode":"O-00001","orgId":17,"leadId":null,"salespersonId":null,"orderName":"Homewood","status":"waiting_sizes","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"manufacturerId":null,"estDelivery":"2025-10-03","trackingNumber":null,"priority":"normal","createdAt":"2025-09-28T18:54:16.835Z","updatedAt":"2025-09-29T03:31:32.017Z"}	2025-09-29 03:31:32.045758
33	admin-test-123	organization	20	deleted	{"id":20,"name":"Rockwall High School","sports":"Wrestling","city":"Rockwall","state":"TX","shippingAddress":"Rockwall High School\\n1250 S. State Highway 205\\nRockwall, TX 75087","notes":"","logoUrl":null,"territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-09-27T17:09:50.284Z","updatedAt":"2025-09-27T17:09:50.284Z"}	\N	2025-09-29 18:46:10.195861
34	41090967	organization	11	deleted	{"id":11,"name":"Fultondale High School","sports":"Wrestling","city":"Fultondale","state":"AL","shippingAddress":null,"notes":null,"logoUrl":null,"territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-09-26T20:25:32.343Z","updatedAt":"2025-09-26T20:25:32.343Z"}	\N	2025-09-29 18:54:00.092694
35	41090967	organization	3	deleted	{"id":3,"name":"Springfield College","sports":"Baseball, Track","city":"Springfield","state":"MA","shippingAddress":"","notes":"","logoUrl":null,"territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-09-26T19:11:33.742Z","updatedAt":"2025-09-26T19:11:33.742Z"}	\N	2025-09-29 18:55:31.92611
36	41090967	organization	6	deleted	{"id":6,"name":"Weaver Golf","sports":"Golf","city":"Weaver","state":"AL","shippingAddress":null,"notes":"Sponsorship interest","logoUrl":null,"territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-09-26T20:25:32.155Z","updatedAt":"2025-09-26T20:25:32.155Z"}	\N	2025-09-29 18:57:46.0887
37	41090967	organization	21	created	\N	{"id":21,"name":"Daphne High School","sports":"Wrestling","city":"Daphne","state":"Alabama","shippingAddress":"9300 Champions Way, Daphne, AL 36526","notes":"","logoUrl":null,"territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-09-29T18:58:06.838Z","updatedAt":"2025-09-29T18:58:06.838Z"}	2025-09-29 18:58:06.868327
38	41090967	organization	22	created	\N	{"id":22,"name":"Sam Everett High School","sports":"Wrestling","city":"Maryville","state":"Tennessee","shippingAddress":"1308 E Lamar Alexander Dr Maryville, TN 37804 \\n","notes":"","logoUrl":null,"territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-09-29T19:06:18.091Z","updatedAt":"2025-09-29T19:06:18.091Z"}	2025-09-29 19:06:18.130786
39	41090967	organization	23	created	\N	{"id":23,"name":"Spain Park High School","sports":"Wrestling","city":"Hoover","state":"Alabama","shippingAddress":"4700 Jaguar Dr, Birmingham, AL 35242","notes":"","logoUrl":null,"territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-09-29T19:06:41.910Z","updatedAt":"2025-09-29T19:06:41.910Z"}	2025-09-29 19:06:41.93518
40	41090967	organization	24	created	\N	{"id":24,"name":"Ramsay High School","sports":"Wrestling","city":"Birmingham","state":"Alabama","shippingAddress":"1800 13th Avenue South Birmingham, Alabama 35205","notes":"","logoUrl":null,"territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-09-29T19:08:03.891Z","updatedAt":"2025-09-29T19:08:03.891Z"}	2025-09-29 19:08:03.914444
41	41090967	design_job	1	deleted	{"id":1,"jobCode":"J-00001","orgId":4,"leadId":1,"orderId":null,"brief":"Primary purple, bold RH mark, minimal white accent tee + hoodie mockups","requirements":null,"urgency":"normal","status":"in_progress","assignedDesignerId":"a4c98edf-038e-40d7-9667-10f67a95fc44","renditionCount":0,"renditionUrls":null,"renditionMockupUrl":null,"renditionProductionUrl":null,"finalLink":null,"referenceFiles":null,"deadline":null,"priority":"normal","internalNotes":null,"clientFeedback":null,"statusChangedAt":"2025-09-26T22:47:40.338Z","createdAt":"2025-09-26T20:25:34.566Z","updatedAt":"2025-09-26T20:25:34.566Z","organization":{"id":4,"name":"East Hamilton High School","sports":"Wrestling","city":"Chattanooga","state":"TN","shippingAddress":null,"notes":"Spirit pack client","logoUrl":null,"territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-09-26T20:25:32.069Z","updatedAt":"2025-09-26T20:25:32.069Z"},"designer":{"id":"a4c98edf-038e-40d7-9667-10f67a95fc44","email":"baker@local","firstName":"Baker","lastName":"Stewart","profileImageUrl":null,"name":"Baker Stewart","role":"designer","passwordHash":"$2b$10$pKBIakmIrqiL98aOUFPHeOJvzorVyvRv5y2aZ8CE2hfy7yavzmjuy","isActive":true,"phone":null,"avatarUrl":null,"createdAt":"2025-09-26T20:25:31.662Z","updatedAt":"2025-09-26T20:25:31.662Z"}}	\N	2025-09-29 19:09:17.200411
42	41090967	order	11	deleted	{"id":11,"orderCode":"O-00002","orgId":null,"leadId":null,"salespersonId":null,"orderName":"FINAL SUCCESS ORDER","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"manufacturerId":null,"estDelivery":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-09-29T05:09:32.158Z","updatedAt":"2025-09-29T05:09:32.158Z"}	\N	2025-09-29 19:09:41.087462
43	41090967	order	12	deleted	{"id":12,"orderCode":"O-00003","orgId":null,"leadId":null,"salespersonId":null,"orderName":"FINAL SUCCESS ORDER","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"manufacturerId":null,"estDelivery":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-09-29T05:10:40.698Z","updatedAt":"2025-09-29T05:10:40.698Z"}	\N	2025-09-29 19:09:44.159206
44	41090967	order	9	deleted	{"id":9,"orderCode":"O-00001","orgId":17,"leadId":null,"salespersonId":null,"orderName":"Homewood","status":"waiting_sizes","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"manufacturerId":null,"estDelivery":"2025-10-03","trackingNumber":null,"priority":"normal","createdAt":"2025-09-28T18:54:16.835Z","updatedAt":"2025-09-29T03:31:32.017Z"}	\N	2025-09-29 19:09:47.735446
45	41090967	product	29	created	\N	{"id":29,"sku":"SIN-TWO-6774","name":"Doublet","categoryId":9,"style":"Two-Piece","description":null,"basePrice":"50.00","minOrderQty":1,"sizes":null,"primaryImageUrl":null,"additionalImages":null,"status":"active","active":true,"createdAt":"2025-09-29T19:18:53.664Z","updatedAt":"2025-09-29T19:18:53.664Z"}	2025-09-29 19:18:53.716493
46	41090967	variant	4	updated	{"id":4,"productId":7,"variantCode":"SHORTS-CORE-BLK","color":"Black","size":null,"material":"Poly","msrp":"20.00","cost":"9.00","imageUrl":null,"createdAt":"2025-09-26T20:25:33.231Z","updatedAt":"2025-09-26T20:25:33.231Z"}	{"id":4,"productId":7,"variantCode":"SHORTS-CORE","color":"Any","size":"YS-4XL","material":"Poly/Spandex","msrp":"25.00","cost":"10.00","imageUrl":"","createdAt":"2025-09-26T20:25:33.231Z","updatedAt":"2025-09-29T19:19:55.684Z"}	2025-09-29 19:19:55.719315
47	41090967	product	30	created	\N	{"id":30,"sku":"SHO-MMA-4974","name":"Fight Shorts","categoryId":7,"style":"MMA","description":"MMA Fight Shorts with optional lining inserted.","basePrice":"2.00","minOrderQty":1,"sizes":null,"primaryImageUrl":null,"additionalImages":null,"status":"active","active":true,"createdAt":"2025-09-29T19:20:45.625Z","updatedAt":"2025-09-29T19:20:45.625Z"}	2025-09-29 19:20:45.664128
48	41090967	variant	5	updated	{"id":5,"productId":8,"variantCode":"TECH-SET-PURP","color":"Purple","size":null,"material":"Comp","msrp":"60.00","cost":"28.00","imageUrl":null,"createdAt":"2025-09-26T20:25:33.280Z","updatedAt":"2025-09-26T20:25:33.280Z"}	{"id":5,"productId":8,"variantCode":"TECH-SET-TOP","color":"ANY","size":"YS-4XL","material":"Elastane","msrp":"65.00","cost":"30.00","imageUrl":"","createdAt":"2025-09-26T20:25:33.280Z","updatedAt":"2025-09-29T19:22:00.473Z"}	2025-09-29 19:22:00.500865
49	41090967	product	31	created	\N	{"id":31,"sku":"TEC-ZIP-8598","name":"Tech Suit Top","categoryId":8,"style":"Zip Up Jacket","description":null,"basePrice":"32.50","minOrderQty":1,"sizes":null,"primaryImageUrl":null,"additionalImages":null,"status":"active","active":true,"createdAt":"2025-09-29T19:23:30.981Z","updatedAt":"2025-09-29T19:23:30.981Z"}	2025-09-29 19:23:31.018743
50	41090967	product	32	created	\N	{"id":32,"sku":"TEC-WAR-2819","name":"Tech Suit Bottoms","categoryId":8,"style":"Warmup Pants","description":null,"basePrice":"32.50","minOrderQty":1,"sizes":null,"primaryImageUrl":null,"additionalImages":null,"status":"active","active":true,"createdAt":"2025-09-29T19:25:33.843Z","updatedAt":"2025-09-29T19:25:33.843Z"}	2025-09-29 19:25:33.897926
51	41090967	product	33	created	\N	{"id":33,"sku":"TEE-REG-5372","name":"Cotton Short Sleeve Tee","categoryId":5,"style":"Regular Fit","description":null,"basePrice":"12.50","minOrderQty":1,"sizes":null,"primaryImageUrl":null,"additionalImages":null,"status":"active","active":true,"createdAt":"2025-09-29T19:26:06.342Z","updatedAt":"2025-09-29T19:26:06.342Z"}	2025-09-29 19:26:06.385917
52	41090967	product	34	created	\N	{"id":34,"sku":"TEE-REG-5358","name":"Triblend Short Sleeve Tee","categoryId":5,"style":"Regular, Athletic","description":null,"basePrice":"15.00","minOrderQty":1,"sizes":null,"primaryImageUrl":null,"additionalImages":null,"status":"active","active":true,"createdAt":"2025-09-29T19:26:31.887Z","updatedAt":"2025-09-29T19:26:31.887Z"}	2025-09-29 19:26:31.928887
53	41090967	product	35	created	\N	{"id":35,"sku":"TEE-LON-7488","name":"Dri-Fit Long Sleeve Tee","categoryId":5,"style":"Long Sleeve, Athletic","description":null,"basePrice":"17.50","minOrderQty":1,"sizes":null,"primaryImageUrl":null,"additionalImages":null,"status":"active","active":true,"createdAt":"2025-09-29T19:27:13.410Z","updatedAt":"2025-09-29T19:27:13.410Z"}	2025-09-29 19:27:13.443991
54	admin-sales-test	order	13	created	\N	{"id":13,"orderCode":"O-00001","orgId":4,"leadId":null,"salespersonId":"admin-sales-test","orderName":"Order for Sales Person 1","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"manufacturerId":null,"estDelivery":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-09-30T14:49:57.971Z","updatedAt":"2025-09-30T14:49:57.971Z"}	2025-09-30 14:49:58.002079
55	admin-sales-test	order	14	created	\N	{"id":14,"orderCode":"O-00002","orgId":4,"leadId":null,"salespersonId":"admin-sales-test","orderName":"Unassigned Order","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"manufacturerId":null,"estDelivery":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-09-30T14:49:58.141Z","updatedAt":"2025-09-30T14:49:58.141Z"}	2025-09-30 14:49:58.158272
56	admin-sales-test	design_job	19	created	\N	{"id":19,"jobCode":"DJ-00001","orgId":4,"leadId":null,"orderId":null,"salespersonId":null,"brief":"Test design job for salesperson 1","requirements":"","urgency":"normal","status":"pending","assignedDesignerId":null,"renditionCount":0,"renditionUrls":null,"renditionMockupUrl":null,"renditionProductionUrl":null,"finalLink":null,"referenceFiles":null,"deadline":null,"priority":"normal","internalNotes":"","clientFeedback":null,"statusChangedAt":"2025-09-30T14:53:57.398Z","createdAt":"2025-09-30T14:53:57.398Z","updatedAt":"2025-09-30T14:53:57.398Z"}	2025-09-30 14:53:57.446331
57	41090967	organization	27	created	\N	{"id":27,"name":"Dora High School","sports":"Wrestling","city":"Dora","state":"AL","shippingAddress":"330 Glen C. Gant Circle, Dora, AL 35059","notes":"","logoUrl":null,"territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-09-30T16:37:28.154Z","updatedAt":"2025-09-30T16:37:28.154Z"}	2025-09-30 16:37:28.189559
58	41090967	order	13	deleted	{"id":13,"orderCode":"O-00001","orgId":4,"leadId":null,"salespersonId":"038c49f9-ccbc-4be6-bc37-7635842a6132","orderName":"Order for Sales Person 1","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"manufacturerId":null,"estDelivery":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-09-30T14:49:57.971Z","updatedAt":"2025-09-30T14:49:57.971Z"}	\N	2025-09-30 16:37:37.707277
59	41090967	order	14	deleted	{"id":14,"orderCode":"O-00002","orgId":4,"leadId":null,"salespersonId":null,"orderName":"Unassigned Order","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"manufacturerId":null,"estDelivery":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-09-30T14:49:58.141Z","updatedAt":"2025-09-30T14:49:58.141Z"}	\N	2025-09-30 16:37:40.690883
60	41090967	variant	15	deleted	{"id":15,"productId":9,"variantCode":"SINGLET-RH-PURP","color":"Purple","size":null,"material":"Sublimated","msrp":"35.00","cost":"18.00","imageUrl":null,"createdAt":"2025-09-30T15:42:21.511Z","updatedAt":"2025-09-30T15:42:21.511Z"}	\N	2025-09-30 16:42:41.266828
61	41090967	variant	16	created	\N	{"id":16,"productId":9,"variantCode":"WomensCut","color":"Sublimated","size":"YS-4XL","material":"Poly/Spandex","msrp":"50.00","cost":"17.00","imageUrl":"","createdAt":"2025-09-30T16:44:10.769Z","updatedAt":"2025-09-30T16:44:10.769Z"}	2025-09-30 16:44:10.799271
62	41090967	design_job	21	created	\N	{"id":21,"jobCode":"DJ-00002","orgId":17,"leadId":null,"orderId":null,"salespersonId":null,"brief":"Fix Black Singlets to look more like 2023 singlets.","requirements":"Black, navy band on chest.","urgency":"high","status":"pending","assignedDesignerId":null,"renditionCount":0,"renditionUrls":null,"renditionMockupUrl":null,"renditionProductionUrl":null,"finalLink":null,"referenceFiles":null,"deadline":"2025-10-01","priority":"high","internalNotes":"","clientFeedback":null,"statusChangedAt":"2025-09-30T16:46:24.944Z","createdAt":"2025-09-30T16:46:24.944Z","updatedAt":"2025-09-30T16:46:24.944Z"}	2025-09-30 16:46:24.966973
63	41090967	product	32	deleted	{"id":32,"sku":"TEC-WAR-2819","name":"Tech Suit Bottoms","categoryId":8,"style":"Warmup Pants","description":null,"basePrice":"32.50","minOrderQty":1,"sizes":null,"primaryImageUrl":null,"additionalImages":null,"status":"active","active":true,"createdAt":"2025-09-29T19:25:33.843Z","updatedAt":"2025-09-29T19:25:33.843Z"}	\N	2025-09-30 16:48:50.060982
64	41090967	product	31	deleted	{"id":31,"sku":"TEC-ZIP-8598","name":"Tech Suit Top","categoryId":8,"style":"Zip Up Jacket","description":null,"basePrice":"32.50","minOrderQty":1,"sizes":null,"primaryImageUrl":null,"additionalImages":null,"status":"active","active":true,"createdAt":"2025-09-29T19:23:30.981Z","updatedAt":"2025-09-29T19:23:30.981Z"}	\N	2025-09-30 16:48:52.434783
65	41090967	salesperson	2	deleted	{"id":2,"userId":"038c49f9-ccbc-4be6-bc37-7635842a6132","territory":"Southeast (AL/GA/FL)","quotaMonthly":"20000.00","commissionRate":"0.1000","active":true,"notes":"Director of Sales; strong HS football/tennis network.","defaultOrgScope":null,"maxLeadsPerWeek":50,"autoAssignLeads":true,"workloadScore":"0.00","lastAssignedAt":null,"preferredClientTypes":null,"skills":null,"createdAt":"2025-09-26T20:25:31.925Z","updatedAt":"2025-09-26T20:25:31.925Z"}	\N	2025-09-30 17:31:49.755941
66	41090967	salesperson	7	deleted	{"id":7,"userId":"qhFCtN","territory":"North","quotaMonthly":"50000.00","commissionRate":"0.1000","active":true,"notes":null,"defaultOrgScope":null,"maxLeadsPerWeek":50,"autoAssignLeads":true,"workloadScore":"0.00","lastAssignedAt":null,"preferredClientTypes":null,"skills":null,"createdAt":"2025-09-28T20:22:44.199Z","updatedAt":"2025-09-28T20:22:44.199Z"}	\N	2025-09-30 17:31:57.254667
67	41090967	product	36	created	\N	{"id":36,"sku":"TEE-REG-6911","name":"Short Sleeve Tee","categoryId":5,"style":"Regular Fit","description":null,"basePrice":"12.50","minOrderQty":1,"sizes":null,"primaryImageUrl":null,"additionalImages":null,"status":"active","active":true,"createdAt":"2025-09-30T17:56:06.842Z","updatedAt":"2025-09-30T17:56:06.842Z"}	2025-09-30 17:56:06.89312
68	41090967	product	35	deleted	{"id":35,"sku":"TEE-LON-7488","name":"Dri-Fit Long Sleeve Tee","categoryId":5,"style":"Long Sleeve, Athletic","description":null,"basePrice":"17.50","minOrderQty":1,"sizes":null,"primaryImageUrl":null,"additionalImages":null,"status":"active","active":true,"createdAt":"2025-09-29T19:27:13.410Z","updatedAt":"2025-09-29T19:27:13.410Z"}	\N	2025-09-30 18:40:20.041598
69	41090967	order	15	created	\N	{"id":15,"orderCode":"O-00001","orgId":27,"leadId":null,"salespersonId":"0c17b360-653e-4581-9444-d21613863b48","orderName":"Homewood","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"manufacturerId":null,"estDelivery":"2025-10-01","trackingNumber":null,"priority":"normal","createdAt":"2025-09-30T19:23:09.470Z","updatedAt":"2025-09-30T19:23:09.470Z","lineItems":[{"id":14,"orderId":15,"variantId":14,"itemName":"Performance Tech Suit - TECH-SET-PURP (Purple)","colorNotes":"Purple","yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":0,"m":0,"l":0,"xl":0,"xxl":0,"xxxl":0,"unitPrice":"0.00","qtyTotal":0,"lineTotal":"0.00","notes":null,"createdAt":"2025-09-30T19:23:09.470Z","updatedAt":"2025-09-30T19:23:09.470Z"}]}	2025-09-30 19:23:09.748479
70	41090967	order_line_item	17	created	\N	{"id":17,"orderId":15,"variantId":5,"itemName":null,"colorNotes":null,"yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":0,"m":0,"l":0,"xl":0,"xxl":0,"xxxl":0,"unitPrice":"57.00","qtyTotal":0,"lineTotal":"0.00","notes":null,"createdAt":"2025-09-30T19:31:56.845Z","updatedAt":"2025-09-30T19:31:56.845Z"}	2025-09-30 19:31:56.882914
71	41090967	user	1047444630	deleted	{"id":"admin-test-perm-fix","email":"admin-perm@test.com","firstName":null,"lastName":null,"profileImageUrl":null,"name":"admin-perm@test.com","role":"admin","passwordHash":null,"isActive":true,"phone":null,"avatarUrl":null,"createdAt":"2025-09-30T16:09:19.100Z","updatedAt":"2025-09-30T16:09:19.100Z"}	\N	2025-09-30 20:05:37.75965
72	41090967	order	16	created	\N	{"id":16,"orderCode":"O-00002","orgId":26,"leadId":null,"salespersonId":"dee15298-a714-408c-bacd-09a9e1af5b68","orderName":"Homewood","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"manufacturerId":null,"estDelivery":"2025-09-30","trackingNumber":null,"priority":"normal","createdAt":"2025-09-30T20:06:04.642Z","updatedAt":"2025-09-30T20:06:04.642Z","lineItems":[{"id":18,"orderId":16,"variantId":16,"itemName":"Performance Wrestling Singlet - WomensCut (Sublimated)","colorNotes":"Sublimated","yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":0,"m":0,"l":0,"xl":0,"xxl":0,"xxxl":0,"unitPrice":"0.00","qtyTotal":0,"lineTotal":"0.00","notes":null,"createdAt":"2025-09-30T20:06:04.642Z","updatedAt":"2025-09-30T20:06:04.642Z"}]}	2025-09-30 20:06:04.848941
73	test-manufacturer-mgmt-user	manufacturer	3	created	\N	{"id":3,"name":"Test Manufacturing Co","contactName":"John Smith","email":"john@testmfr.com","phone":"+1 555-1234","notes":"Reliable manufacturer for custom apparel","leadTimeDays":21,"minOrderQty":50,"createdAt":"2025-09-30T21:13:19.887Z","updatedAt":"2025-09-30T21:13:19.887Z"}	2025-09-30 21:13:19.928606
74	test-manufacturer-mgmt-user	manufacturer	3	updated	{"id":3,"name":"Test Manufacturing Co","contactName":"John Smith","email":"john@testmfr.com","phone":"+1 555-1234","notes":"Reliable manufacturer for custom apparel","leadTimeDays":21,"minOrderQty":50,"createdAt":"2025-09-30T21:13:19.887Z","updatedAt":"2025-09-30T21:13:19.887Z"}	{"id":3,"name":"Updated Manufacturing Co","contactName":"John Smith","email":"john@testmfr.com","phone":"+1 555-1234","notes":"Reliable manufacturer for custom apparel","leadTimeDays":28,"minOrderQty":50,"createdAt":"2025-09-30T21:13:19.887Z","updatedAt":"2025-09-30T21:14:43.163Z"}	2025-09-30 21:14:43.18819
75	admin_id	organization	28	created	\N	{"id":28,"name":"E2E Test High School L_g8MM","sports":"Football, Basketball","city":"Test City","state":"CA","shippingAddress":"123 Test St, Test City, CA 90000","notes":"E2E created org","logoUrl":null,"territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-10-03T05:47:30.649Z","updatedAt":"2025-10-03T05:47:30.649Z"}	2025-10-03 05:47:30.677739
76	admin_id	lead	7	created	\N	{"id":7,"leadCode":"L-00004","orgId":28,"contactId":null,"ownerUserId":null,"stage":"unclaimed","source":"Referral","notes":"E2E test lead 86sU","claimedAt":null,"score":50,"createdAt":"2025-10-03T05:48:23.548Z","updatedAt":"2025-10-03T05:48:23.548Z"}	2025-10-03 05:48:23.569914
77	admin_id	contact	9	created	\N	{"id":9,"orgId":28,"name":"John Test qBEh","email":"john.test.M9tF@example.com","phone":"555-1234","roleTitle":"Coach","role":"other","isPrimary":false,"createdAt":"2025-10-03T05:49:57.135Z","updatedAt":"2025-10-03T05:49:57.135Z"}	2025-10-03 05:49:57.159163
78	test-catalog-admin	category	19	created	\N	{"id":19,"name":"E2E Test Category mv_9Ty","description":"Test category for E2E","createdAt":"2025-10-03T06:00:06.681Z","updatedAt":"2025-10-03T06:00:06.681Z"}	2025-10-03 06:00:06.714711
79	test-catalog-admin	product	37	created	\N	{"id":37,"sku":"E2E-E2E-9044","name":"E2E Test Product 2kds","categoryId":19,"style":null,"description":"TestTest product","basePrice":"29.99","minOrderQty":1,"sizes":null,"primaryImageUrl":null,"additionalImages":null,"status":"active","active":true,"createdAt":"2025-10-03T06:03:19.094Z","updatedAt":"2025-10-03T06:03:19.094Z"}	2025-10-03 06:03:19.13384
80	test-catalog-v3	category	20	created	\N	{"id":20,"name":"E2E Category ilOrY2","description":"Test category","createdAt":"2025-10-03T06:09:26.040Z","updatedAt":"2025-10-03T06:09:26.040Z"}	2025-10-03 06:09:26.074202
81	test-catalog-v3	product	38	created	\N	{"id":38,"sku":"SKU-OXmVtR","name":"E2E Product h5p7","categoryId":20,"style":null,"description":"Test product","basePrice":"49.99","minOrderQty":1,"sizes":null,"primaryImageUrl":null,"additionalImages":null,"status":"active","active":true,"createdAt":"2025-10-03T06:16:11.537Z","updatedAt":"2025-10-03T06:16:11.537Z"}	2025-10-03 06:16:11.607083
82	test-catalog-v3	product	38	updated	{"id":38,"sku":"SKU-OXmVtR","name":"E2E Product h5p7","categoryId":20,"style":null,"description":"Test product","basePrice":"49.99","minOrderQty":1,"sizes":null,"primaryImageUrl":null,"additionalImages":null,"status":"active","active":true,"createdAt":"2025-10-03T06:16:11.537Z","updatedAt":"2025-10-03T06:16:11.537Z"}	{"id":38,"sku":"SKU-OXmVtR","name":"E2E Product h5p7 EDITED","categoryId":20,"style":null,"description":"Test product","basePrice":"49.99","minOrderQty":1,"sizes":null,"primaryImageUrl":null,"additionalImages":null,"status":"active","active":true,"createdAt":"2025-10-03T06:16:11.537Z","updatedAt":"2025-10-03T06:17:10.508Z"}	2025-10-03 06:17:10.551383
83	test-catalog-final	category	21	created	\N	{"id":21,"name":"Test Cat rBi7","description":"E2E test","createdAt":"2025-10-03T06:22:59.186Z","updatedAt":"2025-10-03T06:22:59.186Z"}	2025-10-03 06:22:59.216931
84	test-catalog-final	product	39	created	\N	{"id":39,"sku":"TES-TES-4299","name":"Test Prod FEM","categoryId":21,"style":null,"description":"Test\\n","basePrice":"39.99","minOrderQty":1,"sizes":null,"primaryImageUrl":null,"additionalImages":null,"status":"active","active":true,"createdAt":"2025-10-03T06:24:38.827Z","updatedAt":"2025-10-03T06:24:38.827Z"}	2025-10-03 06:24:38.869932
85	test-catalog-final	product	39	updated	{"id":39,"sku":"TES-TES-4299","name":"Test Prod FEM","categoryId":21,"style":null,"description":"Test\\n","basePrice":"39.99","minOrderQty":1,"sizes":null,"primaryImageUrl":null,"additionalImages":null,"status":"active","active":true,"createdAt":"2025-10-03T06:24:38.827Z","updatedAt":"2025-10-03T06:24:38.827Z"}	{"id":39,"sku":"TES-TES-4299","name":"Test Prod FEM EDITED","categoryId":21,"style":null,"description":"Test\\n","basePrice":"39.99","minOrderQty":1,"sizes":null,"primaryImageUrl":null,"additionalImages":null,"status":"active","active":true,"createdAt":"2025-10-03T06:24:38.827Z","updatedAt":"2025-10-03T06:25:12.223Z"}	2025-10-03 06:25:12.279812
86	test-catalog-final	variant	17	created	\N	{"id":17,"productId":39,"variantCode":"VAR-xyA","color":"Navy","size":"XL","material":"Polyester","msrp":"29.99","cost":"15.00","imageUrl":"","defaultManufacturerId":3,"backupManufacturerId":null,"createdAt":"2025-10-03T06:26:19.631Z","updatedAt":"2025-10-03T06:26:19.631Z"}	2025-10-03 06:26:19.656357
87	admin-final-test	category	22	created	\N	{"id":22,"name":"Final Cat pqN","description":"Final test","createdAt":"2025-10-03T06:31:20.303Z","updatedAt":"2025-10-03T06:31:20.303Z"}	2025-10-03 06:31:20.334482
88	admin-final-test	product	40	created	\N	{"id":40,"sku":"FIN-FIN-1840","name":"Final Prod fX0","categoryId":22,"style":null,"description":"Final","basePrice":"99.99","minOrderQty":1,"sizes":null,"primaryImageUrl":null,"additionalImages":null,"status":"active","active":true,"createdAt":"2025-10-03T06:32:35.485Z","updatedAt":"2025-10-03T06:32:35.485Z"}	2025-10-03 06:32:35.532755
89	admin-final-test	product	40	updated	{"id":40,"sku":"FIN-FIN-1840","name":"Final Prod fX0","categoryId":22,"style":null,"description":"Final","basePrice":"99.99","minOrderQty":1,"sizes":null,"primaryImageUrl":null,"additionalImages":null,"status":"active","active":true,"createdAt":"2025-10-03T06:32:35.485Z","updatedAt":"2025-10-03T06:32:35.485Z"}	{"id":40,"sku":"FIN-FIN-1840","name":"Final Prod fX0 UPDATED","categoryId":22,"style":null,"description":"Final","basePrice":"99.99","minOrderQty":1,"sizes":null,"primaryImageUrl":null,"additionalImages":null,"status":"active","active":true,"createdAt":"2025-10-03T06:32:35.485Z","updatedAt":"2025-10-03T06:33:12.653Z"}	2025-10-03 06:33:12.697097
90	admin-final-test	variant	18	created	\N	{"id":18,"productId":40,"variantCode":"FINAL-WFCrimsonXXLSilk","color":"","size":"","material":"","msrp":"29.99","cost":"15.00","imageUrl":"","defaultManufacturerId":3,"backupManufacturerId":null,"createdAt":"2025-10-03T06:34:34.973Z","updatedAt":"2025-10-03T06:34:34.973Z"}	2025-10-03 06:34:34.998638
91	admin-final-test	variant	18	updated	{"id":18,"productId":40,"variantCode":"FINAL-WFCrimsonXXLSilk","color":"","size":"","material":"","msrp":"29.99","cost":"15.00","imageUrl":"","defaultManufacturerId":3,"backupManufacturerId":null,"createdAt":"2025-10-03T06:34:34.973Z","updatedAt":"2025-10-03T06:34:34.973Z"}	{"id":18,"productId":40,"variantCode":"FINAL-WFCrimsonXXLSilk","color":"Gold","size":"","material":"","msrp":"29.99","cost":"15.00","imageUrl":"","defaultManufacturerId":3,"backupManufacturerId":null,"createdAt":"2025-10-03T06:34:34.973Z","updatedAt":"2025-10-03T06:35:05.428Z"}	2025-10-03 06:35:05.454703
92	order-test-admin	category	23	created	\N	{"id":23,"name":"Order Test aMP","description":"For order test","createdAt":"2025-10-03T06:37:51.089Z","updatedAt":"2025-10-03T06:37:51.089Z"}	2025-10-03 06:37:51.120955
93	order-test-admin	product	41	created	\N	{"id":41,"sku":"ORD-ORD-6686","name":"Order Product _z","categoryId":23,"style":null,"description":"Test","basePrice":"50.00","minOrderQty":1,"sizes":null,"primaryImageUrl":null,"additionalImages":null,"status":"active","active":true,"createdAt":"2025-10-03T06:38:32.049Z","updatedAt":"2025-10-03T06:38:32.049Z"}	2025-10-03 06:38:32.121021
94	order-test-admin	variant	19	created	\N	{"id":19,"productId":41,"variantCode":"ORDER-VAR-SI","color":"Black","size":"L","material":"Cotton","msrp":"59.99","cost":"25.00","imageUrl":"","defaultManufacturerId":3,"backupManufacturerId":null,"createdAt":"2025-10-03T06:39:10.293Z","updatedAt":"2025-10-03T06:39:10.293Z"}	2025-10-03 06:39:10.32076
95	order-test-admin	organization	29	created	\N	{"id":29,"name":"Order Test Org uF","sports":"Football","city":"Test City","state":"CA","shippingAddress":"123 Test St, Test City, CA 90000","notes":"Created for order workflow test","logoUrl":null,"territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-10-03T06:39:55.195Z","updatedAt":"2025-10-03T06:39:55.195Z"}	2025-10-03 06:39:55.222041
96	order-test-admin	contact	10	created	\N	{"id":10,"orgId":29,"name":"Order Tester","email":"order-test@example.com","phone":"(555) 123-4567","roleTitle":"","role":"other","isPrimary":false,"createdAt":"2025-10-03T06:41:04.487Z","updatedAt":"2025-10-03T06:41:04.487Z"}	2025-10-03 06:41:04.515529
97	admin_id	category	24	created	\N	{"id":24,"name":"Order Cat 25","description":"For order","createdAt":"2025-10-03T06:48:56.982Z","updatedAt":"2025-10-03T06:48:56.982Z"}	2025-10-03 06:48:57.005703
98	admin_id	product	42	created	\N	{"id":42,"sku":"ORD-ORD-7479","name":"Order Prod aC","categoryId":24,"style":null,"description":"Test","basePrice":"75.00","minOrderQty":1,"sizes":null,"primaryImageUrl":null,"additionalImages":null,"status":"active","active":true,"createdAt":"2025-10-03T06:49:39.077Z","updatedAt":"2025-10-03T06:49:39.077Z"}	2025-10-03 06:49:39.116919
99	admin_id	variant	20	created	\N	{"id":20,"productId":42,"variantCode":"ORD-VAR-ON","color":"Red","size":"M","material":"Cotton","msrp":"29.99","cost":"15.00","imageUrl":"","defaultManufacturerId":3,"backupManufacturerId":null,"createdAt":"2025-10-03T06:50:44.945Z","updatedAt":"2025-10-03T06:50:44.945Z"}	2025-10-03 06:50:44.966534
100	admin_id	organization	30	created	\N	{"id":30,"name":"Order Org l-","sports":"Football","city":"Test City","state":"CA","shippingAddress":"","notes":"","logoUrl":null,"territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-10-03T06:51:18.306Z","updatedAt":"2025-10-03T06:51:18.306Z"}	2025-10-03 06:51:18.326891
101	admin_id	contact	11	created	\N	{"id":11,"orgId":30,"name":"Test Customer","email":"customer@example.com","phone":"(555) 123-4567","roleTitle":"Customer","role":"other","isPrimary":false,"createdAt":"2025-10-03T06:52:47.925Z","updatedAt":"2025-10-03T06:52:47.925Z"}	2025-10-03 06:52:47.947589
102	admin_id	order	18	created	\N	{"id":18,"orderCode":"O-00003","orgId":30,"leadId":null,"salespersonId":null,"orderName":"Test Order yd5","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"manufacturerId":null,"estDelivery":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-03T06:54:58.104Z","updatedAt":"2025-10-03T06:54:58.104Z","lineItems":[{"id":19,"orderId":18,"variantId":20,"itemName":"Order Prod aC - ORD-VAR-ON (Red)","colorNotes":"Red","imageUrl":null,"yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":0,"m":10,"l":0,"xl":0,"xxl":0,"xxxl":0,"unitPrice":"29.99","qtyTotal":10,"lineTotal":"299.90","notes":null,"createdAt":"2025-10-03T06:54:58.104Z","updatedAt":"2025-10-03T06:54:58.104Z"}]}	2025-10-03 06:54:58.282158
103	admin_id	order	18	updated	{"id":18,"orderCode":"O-00003","orgId":30,"leadId":null,"salespersonId":null,"orderName":"Test Order yd5","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"manufacturerId":null,"estDelivery":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-03T06:54:58.104Z","updatedAt":"2025-10-03T06:54:58.104Z","salespersonName":null}	{"id":18,"orderCode":"O-00003","orgId":30,"leadId":null,"salespersonId":null,"orderName":"Test Order yd5","status":"production","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":"","orderFolder":"","sizeFormLink":"","manufacturerId":null,"estDelivery":"2025-10-15","trackingNumber":"","priority":"normal","createdAt":"2025-10-03T06:54:58.104Z","updatedAt":"2025-10-03T06:56:21.708Z"}	2025-10-03 06:56:21.733578
104	final-mfg-test	variant	20	updated	{"id":20,"productId":42,"variantCode":"ORD-VAR-ON","color":"Red","size":"M","material":"Cotton","msrp":"29.99","cost":"15.00","imageUrl":"","defaultManufacturerId":3,"backupManufacturerId":null,"createdAt":"2025-10-03T06:50:44.945Z","updatedAt":"2025-10-03T06:50:44.945Z"}	{"id":20,"productId":42,"variantCode":"ORD-VAR-ON","color":"Red","size":"M","material":"Cotton","msrp":"29.99","cost":"15.00","imageUrl":"","defaultManufacturerId":3,"backupManufacturerId":null,"createdAt":"2025-10-03T06:50:44.945Z","updatedAt":"2025-10-03T07:03:47.880Z"}	2025-10-03 07:03:47.909193
126	admin-Yjy6Tw	quote	10	created	\N	{"id":10,"quoteCode":"Q-1759947639150-LCR5H","orgId":31,"contactId":null,"salespersonId":"admin-Yjy6Tw","quoteName":"Test Quote lIZNIM","status":"draft","validUntil":null,"subtotal":"35.00","taxRate":"0.0875","taxAmount":"3.06","total":"38.06","discount":"0.00","customerAddress":"123 Main St\\nApt 4B\\nNew York, NY 10001","customerShippingAddress":"456 Oak Ave\\nSuite 100\\nLos Angeles, CA 90001","notes":"","internalNotes":null,"termsAndConditions":null,"createdAt":"2025-10-08T18:20:39.412Z","updatedAt":"2025-10-08T18:20:39.512Z"}	2025-10-08 18:20:39.553972
105	41090967	order	15	updated	{"id":15,"orderCode":"O-00001","orgId":27,"leadId":null,"salespersonId":"0c17b360-653e-4581-9444-d21613863b48","orderName":"Homewood","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"manufacturerId":null,"estDelivery":"2025-10-01","trackingNumber":null,"priority":"normal","createdAt":"2025-09-30T19:23:09.470Z","updatedAt":"2025-09-30T19:23:09.470Z","salespersonName":"KG"}	{"id":15,"orderCode":"O-00001","orgId":27,"leadId":null,"salespersonId":"0c17b360-653e-4581-9444-d21613863b48","orderName":"Homewood","status":"waiting_sizes","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"manufacturerId":null,"estDelivery":"2025-10-01","trackingNumber":null,"priority":"normal","createdAt":"2025-09-30T19:23:09.470Z","updatedAt":"2025-10-03T15:49:55.801Z"}	2025-10-03 15:49:55.833237
106	41090967	order	15	updated	{"id":15,"orderCode":"O-00001","orgId":27,"leadId":null,"salespersonId":"0c17b360-653e-4581-9444-d21613863b48","orderName":"Homewood","status":"waiting_sizes","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"manufacturerId":null,"estDelivery":"2025-10-01","trackingNumber":null,"priority":"normal","createdAt":"2025-09-30T19:23:09.470Z","updatedAt":"2025-10-03T15:49:55.801Z","salespersonName":"KG"}	{"id":15,"orderCode":"O-00001","orgId":27,"leadId":null,"salespersonId":"0c17b360-653e-4581-9444-d21613863b48","orderName":"Homewood","status":"waiting_sizes","designApproved":true,"sizesValidated":true,"depositReceived":true,"invoiceUrl":"","orderFolder":"","sizeFormLink":"","manufacturerId":null,"estDelivery":"2025-10-01","trackingNumber":"","priority":"normal","createdAt":"2025-09-30T19:23:09.470Z","updatedAt":"2025-10-03T15:50:18.448Z"}	2025-10-03 15:50:18.478639
107	41090967	order_line_item	14	deleted	\N	\N	2025-10-03 15:50:20.534342
108	ADiI7O	order	19	created	\N	{"id":19,"orderCode":"O-00004","orgId":30,"leadId":null,"salespersonId":"ADiI7O","orderName":"Test Order - Line Item Flow","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"manufacturerId":null,"estDelivery":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-03T16:06:59.306Z","updatedAt":"2025-10-03T16:06:59.306Z","lineItems":[{"id":21,"orderId":19,"variantId":20,"itemName":"Order Prod aC - ORD-VAR-ON (Red)","colorNotes":"Red","imageUrl":null,"yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":0,"m":0,"l":0,"xl":0,"xxl":2,"xxxl":0,"unitPrice":"29.99","qtyTotal":2,"lineTotal":"59.98","notes":null,"createdAt":"2025-10-03T16:06:59.306Z","updatedAt":"2025-10-03T16:06:59.306Z"}]}	2025-10-03 16:06:59.505361
109	ADiI7O	order_line_item	21	deleted	\N	\N	2025-10-03 16:07:49.2082
110	yVAU78	order	20	created	\N	{"id":20,"orderCode":"O-00005","orgId":30,"leadId":null,"salespersonId":"yVAU78","orderName":"Test Order - Price Break Removal","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"manufacturerId":null,"estDelivery":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-03T17:22:00.693Z","updatedAt":"2025-10-03T17:22:00.693Z","lineItems":[{"id":22,"orderId":20,"variantId":20,"itemName":"Order Prod aC - ORD-VAR-ON (Red)","colorNotes":"Red","imageUrl":null,"yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":0,"m":10,"l":0,"xl":0,"xxl":0,"xxxl":0,"unitPrice":"29.99","qtyTotal":10,"lineTotal":"299.90","notes":null,"createdAt":"2025-10-03T17:22:00.693Z","updatedAt":"2025-10-03T17:22:00.693Z"}]}	2025-10-03 17:22:00.91458
111	xSPvRt	order	21	created	\N	{"id":21,"orderCode":"O-00006","orgId":30,"leadId":null,"salespersonId":"xSPvRt","orderName":"Test Automated Manufacturing - t5FmYd","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":null,"trackingNumber":null,"priority":"high","createdAt":"2025-10-03T18:21:54.268Z","updatedAt":"2025-10-03T18:21:54.268Z","lineItems":[{"id":26,"orderId":21,"variantId":21,"itemName":"Performance Wrestling Singlet - SINGLET-RH-PURP (Purple)","colorNotes":"Purple","imageUrl":null,"yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":0,"m":10,"l":0,"xl":0,"xxl":0,"xxxl":0,"unitPrice":"35.00","qtyTotal":10,"lineTotal":"350.00","notes":null,"createdAt":"2025-10-03T18:21:54.268Z","updatedAt":"2025-10-03T18:21:54.268Z"}]}	2025-10-03 18:21:54.478521
112	t3onPB	order	22	created	\N	{"id":22,"orderCode":"O-00007","orgId":30,"leadId":null,"salespersonId":"t3onPB","orderName":"E2E Test Order 1759516655750","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-03T18:38:35.375Z","updatedAt":"2025-10-03T18:38:35.375Z","lineItems":[{"id":27,"orderId":22,"variantId":21,"itemName":"Performance Wrestling Singlet - SINGLET-RH-PURP (Purple)","colorNotes":"Purple","imageUrl":null,"yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":0,"m":1,"l":0,"xl":0,"xxl":0,"xxxl":0,"unitPrice":"35.00","qtyTotal":1,"lineTotal":"35.00","notes":null,"createdAt":"2025-10-03T18:38:35.375Z","updatedAt":"2025-10-03T18:38:35.375Z"}]}	2025-10-03 18:38:35.564259
113	admin_id	variant	21	updated	{"id":21,"productId":9,"variantCode":"SINGLET-RH-PURP","color":"Purple","size":null,"material":"Sublimated","msrp":"35.00","cost":"18.00","imageUrl":null,"defaultManufacturerId":null,"backupManufacturerId":null,"createdAt":"2025-10-03T17:51:05.586Z","updatedAt":"2025-10-03T17:51:05.586Z"}	{"id":21,"productId":9,"variantCode":"SINGLET-RH-PURP","color":"Purple","size":"","material":"Sublimated","msrp":"35.00","cost":"18.00","imageUrl":"","defaultManufacturerId":3,"backupManufacturerId":null,"createdAt":"2025-10-03T17:51:05.586Z","updatedAt":"2025-10-03T18:46:55.779Z"}	2025-10-03 18:46:55.812025
114	admin_id	order	22	updated	{"id":22,"orderCode":"O-00007","orgId":30,"leadId":null,"salespersonId":"t3onPB","orderName":"E2E Test Order 1759516655750","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-03T18:38:35.375Z","updatedAt":"2025-10-03T18:38:35.375Z","salespersonName":"John Doe"}	{"id":22,"orderCode":"O-00007","orgId":30,"leadId":null,"salespersonId":"t3onPB","orderName":"E2E Test Order 1759516655750","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":"","orderFolder":"","sizeFormLink":"","estDelivery":"2025-10-15","trackingNumber":"","priority":"normal","createdAt":"2025-10-03T18:38:35.375Z","updatedAt":"2025-10-03T18:54:51.527Z"}	2025-10-03 18:54:51.557401
127	xa9662	invoice	1	created	\N	{"id":1,"invoiceNumber":"INV-8od8oL","orderId":null,"orgId":null,"salespersonId":null,"issueDate":"2025-10-08","dueDate":"2025-11-07","status":"draft","subtotal":"100.00","discount":"0.00","taxRate":"0.0000","taxAmount":"0.00","totalAmount":"100.00","amountPaid":"0.00","amountDue":"100.00","paymentTerms":null,"notes":null,"internalNotes":null,"sentAt":null,"paidAt":null,"createdBy":"xa9662","createdAt":"2025-10-08T18:48:19.979Z","updatedAt":"2025-10-08T18:48:19.979Z"}	2025-10-08 18:48:20.030642
115	test_admin_mfg	order	23	created	\N	{"id":23,"orderCode":"O-00008","orgId":30,"leadId":null,"salespersonId":"test_admin_mfg","orderName":"Test Order 001","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-03T19:07:42.789Z","updatedAt":"2025-10-03T19:07:42.789Z","lineItems":[{"id":28,"orderId":23,"variantId":21,"itemName":"Performance Wrestling Singlet - SINGLET-RH-PURP (Purple)","colorNotes":"Purple","imageUrl":null,"yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":0,"m":2,"l":1,"xl":0,"xxl":0,"xxxl":0,"unitPrice":"35.00","qtyTotal":3,"lineTotal":"105.00","notes":null,"createdAt":"2025-10-03T19:07:42.789Z","updatedAt":"2025-10-03T19:07:42.789Z"},{"id":29,"orderId":23,"variantId":21,"itemName":"Performance Wrestling Singlet - SINGLET-RH-PURP (Purple)","colorNotes":"Purple","imageUrl":null,"yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":0,"m":1,"l":1,"xl":0,"xxl":0,"xxxl":0,"unitPrice":"35.00","qtyTotal":2,"lineTotal":"70.00","notes":null,"createdAt":"2025-10-03T19:07:42.789Z","updatedAt":"2025-10-03T19:07:42.789Z"}]}	2025-10-03 19:07:43.038151
116	admin_id	user	574301428	created	\N	{"id":"05ce585e-fd96-4cdd-a9e8-ebd149ac92df","email":"testuser-S5U0mZ@test.com","firstName":"Test","lastName":"User","profileImageUrl":null,"name":"Test User","role":"sales","passwordHash":"$2b$10$9UjvAbDhJ6gC2S19cJqc3OtfFCnp6BRusnZsO8o9cdVEEwtgZXXb2","isActive":true,"phone":"","avatarUrl":null,"isInvited":false,"hasCompletedSetup":false,"invitedAt":null,"invitedBy":null,"createdAt":"2025-10-04T00:16:38.848Z","updatedAt":"2025-10-04T00:16:38.848Z"}	2025-10-04 00:16:38.882859
117	admin_id	organization	31	created	\N	{"id":31,"name":"Test Org wT8c","sports":"Football","city":"","state":"","shippingAddress":"","notes":"","logoUrl":null,"territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-10-04T00:17:40.197Z","updatedAt":"2025-10-04T00:17:40.197Z"}	2025-10-04 00:17:40.227365
118	admin_id	category	25	created	\N	{"id":25,"name":"E2E Cat 2YJqH0","description":"","createdAt":"2025-10-04T00:18:17.279Z","updatedAt":"2025-10-04T00:18:17.279Z"}	2025-10-04 00:18:17.31257
119	admin_id	order	21	updated	{"id":21,"orderCode":"O-00006","orgId":30,"leadId":null,"salespersonId":"xSPvRt","orderName":"Test Automated Manufacturing - t5FmYd","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":null,"trackingNumber":null,"priority":"high","createdAt":"2025-10-03T18:21:54.268Z","updatedAt":"2025-10-03T18:21:54.268Z","salespersonName":"John Doe"}	{"id":21,"orderCode":"O-00006","orgId":30,"leadId":null,"salespersonId":null,"orderName":"Test Automated Manufacturing - t5FmYd","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":null,"trackingNumber":null,"priority":"high","createdAt":"2025-10-03T18:21:54.268Z","updatedAt":"2025-10-04T00:19:12.142Z"}	2025-10-04 00:19:12.168157
120	a0eJC3	lead	8	created	\N	{"id":8,"leadCode":"L-00005","orgId":31,"contactId":11,"ownerUserId":"a0eJC3","stage":"unclaimed","source":"website","notes":"","claimedAt":null,"score":50,"createdAt":"2025-10-04T00:25:55.875Z","updatedAt":"2025-10-04T00:25:55.875Z"}	2025-10-04 00:25:55.909506
121	a0eJC3	order	24	created	\N	{"id":24,"orderCode":"O-00009","orgId":31,"leadId":null,"salespersonId":"a0eJC3","orderName":"Test Order vDH9","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-04T00:28:26.326Z","updatedAt":"2025-10-04T00:28:26.326Z","lineItems":[{"id":30,"orderId":24,"variantId":21,"itemName":"Performance Wrestling Singlet - SINGLET-RH-PURP (Purple)","colorNotes":"Purple","imageUrl":null,"yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":2,"m":1,"l":0,"xl":0,"xxl":0,"xxxl":0,"unitPrice":"35.00","qtyTotal":3,"lineTotal":"105.00","notes":null,"createdAt":"2025-10-04T00:28:26.326Z","updatedAt":"2025-10-04T00:28:26.326Z"}]}	2025-10-04 00:28:26.514368
122	designer1_sub	design_job	21	updated	{"id":21,"jobCode":"DJ-00002","orgId":17,"leadId":null,"orderId":null,"salespersonId":null,"brief":"Fix Black Singlets to look more like 2023 singlets.","requirements":"Black, navy band on chest.","urgency":"high","status":"pending","assignedDesignerId":null,"renditionCount":0,"renditionUrls":null,"renditionMockupUrl":null,"renditionProductionUrl":null,"finalLink":null,"referenceFiles":null,"deadline":"2025-10-01","priority":"high","internalNotes":"","clientFeedback":null,"statusChangedAt":"2025-09-30T16:46:24.944Z","createdAt":"2025-09-30T16:46:24.944Z","updatedAt":"2025-09-30T16:46:24.944Z","organization":{"id":17,"name":"Homewood High School","sports":"Wrestling","city":"Homewood","state":"AL","shippingAddress":"","notes":"","logoUrl":null,"territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-09-26T23:48:51.790Z","updatedAt":"2025-09-26T23:48:51.790Z"}}	{"id":21,"jobCode":"DJ-00002","orgId":17,"leadId":null,"orderId":null,"salespersonId":null,"brief":"Fix Black Singlets to look more like 2023 singlets.","requirements":"Black, navy band on chest.","urgency":"high","status":"in_progress","assignedDesignerId":null,"renditionCount":0,"renditionUrls":null,"renditionMockupUrl":null,"renditionProductionUrl":null,"finalLink":null,"referenceFiles":null,"deadline":"2025-10-01","priority":"high","internalNotes":"","clientFeedback":"","statusChangedAt":"2025-10-04T00:39:27.904Z","createdAt":"2025-09-30T16:46:24.944Z","updatedAt":"2025-10-04T00:39:27.904Z"}	2025-10-04 00:39:27.943431
123	41090967	quote	8	created	\N	{"id":8,"quoteCode":"Q-1759771037714-LO9XO","orgId":19,"contactId":null,"salespersonId":null,"quoteName":"Oak Mountain High School Wrestling","status":"draft","validUntil":"2025-10-07","subtotal":"350.00","taxRate":"0.0000","taxAmount":"0.00","total":"350.00","discount":"0.00","notes":"","internalNotes":null,"termsAndConditions":null,"createdAt":"2025-10-06T17:17:18.132Z","updatedAt":"2025-10-06T17:17:18.251Z"}	2025-10-06 17:17:18.316622
124	Q6p2py	quote	9	created	\N	{"id":9,"quoteCode":"Q-1759859579263-SDAJI","orgId":31,"contactId":null,"salespersonId":"Q6p2py","quoteName":"Test PDF Quote y5o0x_","status":"draft","validUntil":null,"subtotal":"175.00","taxRate":"0.0875","taxAmount":"15.31","total":"190.31","discount":"0.00","notes":"","internalNotes":null,"termsAndConditions":null,"createdAt":"2025-10-07T17:52:59.377Z","updatedAt":"2025-10-07T17:52:59.470Z"}	2025-10-07 17:52:59.517176
125	41090967	product	17	updated	{"id":17,"sku":"BAG-DEB-8929","name":"OIDC Debug Product km-kdV","categoryId":10,"style":"Debug","description":null,"basePrice":"12.99","minOrderQty":1,"sizes":null,"primaryImageUrl":null,"additionalImages":null,"status":"active","active":true,"createdAt":"2025-09-27T01:04:49.516Z","updatedAt":"2025-09-27T01:04:49.516Z"}	{"id":17,"sku":"BagARH","name":"OIDC Debug Product km-kdV","categoryId":10,"style":"Debug","description":"","basePrice":"12.99","minOrderQty":1,"sizes":null,"primaryImageUrl":null,"additionalImages":null,"status":"active","active":true,"createdAt":"2025-09-27T01:04:49.516Z","updatedAt":"2025-10-08T13:55:59.050Z"}	2025-10-08 13:55:59.10374
128	u4pDYW	invoice	2	created	\N	{"id":2,"invoiceNumber":"INV-00001","orderId":null,"orgId":null,"salespersonId":null,"issueDate":"2025-10-08","dueDate":"2025-11-07","status":"draft","subtotal":"100.00","discount":"0.00","taxRate":"0.0000","taxAmount":"0.00","totalAmount":"100.00","amountPaid":"0.00","amountDue":"100.00","paymentTerms":"","notes":"","internalNotes":null,"sentAt":null,"paidAt":null,"createdBy":"u4pDYW","createdAt":"2025-10-08T19:19:21.472Z","updatedAt":"2025-10-08T19:19:21.472Z"}	2025-10-08 19:19:21.509703
129	XMOE4G	order	25	created	\N	{"id":25,"orderCode":"O-00010","orgId":32,"leadId":null,"salespersonId":"XMOE4G","orderName":"E2E Test Order","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":null,"manufacturerId":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-11T03:08:31.298Z","updatedAt":"2025-10-11T03:08:31.298Z","lineItems":[{"id":31,"orderId":25,"variantId":21,"itemName":"Performance Wrestling Singlet - SINGLET-RH-PURP (Purple)","colorNotes":"Purple","imageUrl":null,"yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":0,"m":1,"l":0,"xl":0,"xxl":0,"xxxl":0,"unitPrice":"35.00","qtyTotal":1,"lineTotal":"35.00","notes":null,"createdAt":"2025-10-11T03:08:31.298Z","updatedAt":"2025-10-11T03:08:31.298Z"}]}	2025-10-11 03:08:31.515805
130	XMOE4G	order	25	updated	{"id":25,"orderCode":"O-00010","orgId":32,"leadId":null,"salespersonId":"XMOE4G","orderName":"E2E Test Order","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":null,"manufacturerId":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-11T03:08:31.298Z","updatedAt":"2025-10-11T03:08:31.298Z","salespersonName":"John Doe"}	{"id":25,"orderCode":"O-00010","orgId":32,"leadId":null,"salespersonId":"XMOE4G","orderName":"E2E Test Order","status":"waiting_sizes","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":null,"manufacturerId":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-11T03:08:31.298Z","updatedAt":"2025-10-11T03:09:39.362Z"}	2025-10-11 03:09:39.391709
131	XMOE4G	order	25	updated	{"id":25,"orderCode":"O-00010","orgId":32,"leadId":null,"salespersonId":"XMOE4G","orderName":"E2E Test Order","status":"waiting_sizes","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":null,"manufacturerId":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-11T03:08:31.298Z","updatedAt":"2025-10-11T03:09:39.362Z","salespersonName":"John Doe"}	{"id":25,"orderCode":"O-00010","orgId":32,"leadId":null,"salespersonId":"XMOE4G","orderName":"E2E Test Order","status":"production","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":"","orderFolder":"","sizeFormLink":"","estDelivery":"2025-10-30","manufacturerId":null,"trackingNumber":"","priority":"normal","createdAt":"2025-10-11T03:08:31.298Z","updatedAt":"2025-10-11T03:16:05.519Z"}	2025-10-11 03:16:05.540586
132	test-admin-automated-auth	manufacturing	7	updated	{"id":7,"orderId":25,"status":"pending","assignedTo":null,"manufacturerId":null,"startDate":null,"estCompletion":null,"actualCompletion":null,"qcNotes":null,"trackingNumber":null,"batchNumber":null,"batchSize":1,"priority":"normal","specialInstructions":null,"productionNotes":"Auto-created when order moved to production","qualityNotes":null,"attachmentUrls":null,"estimatedHours":null,"actualHours":null,"scheduledStartDate":null,"scheduledEndDate":null,"createdAt":"2025-10-11T03:15:47.701Z","updatedAt":"2025-10-11T03:15:47.701Z","order":{"id":25,"orderCode":"O-00010","orgId":32,"leadId":null,"salespersonId":"XMOE4G","orderName":"E2E Test Order","status":"production","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":"","orderFolder":"","sizeFormLink":"","estDelivery":"2025-10-30","manufacturerId":null,"trackingNumber":"","priority":"normal","createdAt":"2025-10-11T03:08:31.298Z","updatedAt":"2025-10-11T03:16:05.519Z"}}	{"id":7,"orderId":25,"status":"in_progress","assignedTo":null,"manufacturerId":null,"startDate":null,"estCompletion":null,"actualCompletion":"2025-10-11","qcNotes":null,"trackingNumber":"","batchNumber":null,"batchSize":1,"priority":"normal","specialInstructions":null,"productionNotes":"Auto-created when order moved to production","qualityNotes":"","attachmentUrls":null,"estimatedHours":null,"actualHours":null,"scheduledStartDate":null,"scheduledEndDate":null,"createdAt":"2025-10-11T03:15:47.701Z","updatedAt":"2025-10-11T03:23:44.165Z"}	2025-10-11 03:23:44.243697
133	test-admin-automated-auth	manufacturing	7	updated	{"id":7,"orderId":25,"status":"in_progress","assignedTo":null,"manufacturerId":null,"startDate":null,"estCompletion":null,"actualCompletion":"2025-10-11","qcNotes":null,"trackingNumber":"","batchNumber":null,"batchSize":1,"priority":"normal","specialInstructions":null,"productionNotes":"Auto-created when order moved to production","qualityNotes":"","attachmentUrls":null,"estimatedHours":null,"actualHours":null,"scheduledStartDate":null,"scheduledEndDate":null,"createdAt":"2025-10-11T03:15:47.701Z","updatedAt":"2025-10-11T03:23:44.165Z","order":{"id":25,"orderCode":"O-00010","orgId":32,"leadId":null,"salespersonId":"XMOE4G","orderName":"E2E Test Order","status":"production","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":"","orderFolder":"","sizeFormLink":"","estDelivery":"2025-10-30","manufacturerId":null,"trackingNumber":"","priority":"normal","createdAt":"2025-10-11T03:08:31.298Z","updatedAt":"2025-10-11T03:16:05.519Z"}}	{"id":7,"orderId":25,"status":"complete","assignedTo":null,"manufacturerId":null,"startDate":null,"estCompletion":null,"actualCompletion":"2025-10-11","qcNotes":null,"trackingNumber":"","batchNumber":null,"batchSize":1,"priority":"normal","specialInstructions":null,"productionNotes":"Auto-created when order moved to production","qualityNotes":"","attachmentUrls":null,"estimatedHours":null,"actualHours":null,"scheduledStartDate":null,"scheduledEndDate":null,"createdAt":"2025-10-11T03:15:47.701Z","updatedAt":"2025-10-11T03:24:52.085Z"}	2025-10-11 03:24:52.172479
134	admin-test-123	order	26	created	\N	{"id":26,"orderCode":"O-00011","orgId":32,"leadId":null,"salespersonId":null,"orderName":"Test Order - No Manufacturer Assignment","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":null,"manufacturerId":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-11T21:35:07.211Z","updatedAt":"2025-10-11T21:35:07.211Z","lineItems":[{"id":32,"orderId":26,"variantId":21,"itemName":"Performance Wrestling Singlet - SINGLET-RH-PURP (Purple)","colorNotes":"Purple","imageUrl":null,"yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":10,"m":10,"l":5,"xl":0,"xxl":0,"xxxl":0,"unitPrice":"35.00","qtyTotal":25,"lineTotal":"875.00","notes":null,"createdAt":"2025-10-11T21:35:07.211Z","updatedAt":"2025-10-11T21:35:07.211Z"}]}	2025-10-11 21:35:07.420432
142	41090967	manufacturing	12	created	\N	{"id":12,"orderId":22,"status":"pending","assignedTo":null,"manufacturerId":null,"startDate":null,"estCompletion":"2025-11-12","actualCompletion":null,"qcNotes":null,"trackingNumber":null,"batchNumber":null,"batchSize":1,"priority":"normal","specialInstructions":"","productionNotes":null,"qualityNotes":null,"attachmentUrls":null,"estimatedHours":null,"actualHours":null,"scheduledStartDate":null,"scheduledEndDate":null,"createdAt":"2025-10-13T14:21:23.805Z","updatedAt":"2025-10-13T14:21:23.805Z"}	2025-10-13 14:21:23.890284
135	admin-test-123	order	26	updated	{"id":26,"orderCode":"O-00011","orgId":32,"leadId":null,"salespersonId":null,"orderName":"Test Order - No Manufacturer Assignment","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":null,"manufacturerId":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-11T21:35:07.211Z","updatedAt":"2025-10-11T21:35:07.211Z","salespersonName":null}	{"id":26,"orderCode":"O-00011","orgId":32,"leadId":null,"salespersonId":null,"orderName":"Test Order - No Manufacturer Assignment","status":"invoiced","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":null,"manufacturerId":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-11T21:35:07.211Z","updatedAt":"2025-10-11T21:37:40.621Z"}	2025-10-11 21:37:40.647404
136	admin-test-123	order	26	updated	{"id":26,"orderCode":"O-00011","orgId":32,"leadId":null,"salespersonId":null,"orderName":"Test Order - No Manufacturer Assignment","status":"invoiced","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":null,"manufacturerId":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-11T21:35:07.211Z","updatedAt":"2025-10-11T21:37:40.621Z","salespersonName":null}	{"id":26,"orderCode":"O-00011","orgId":32,"leadId":null,"salespersonId":null,"orderName":"Test Order - No Manufacturer Assignment","status":"production","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":null,"manufacturerId":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-11T21:35:07.211Z","updatedAt":"2025-10-11T21:37:50.056Z"}	2025-10-11 21:37:50.082677
137	admin-test-123	order	26	updated	{"id":26,"orderCode":"O-00011","orgId":32,"leadId":null,"salespersonId":null,"orderName":"Test Order - No Manufacturer Assignment","status":"production","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":null,"manufacturerId":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-11T21:35:07.211Z","updatedAt":"2025-10-11T21:37:50.056Z","salespersonName":null}	{"id":26,"orderCode":"O-00011","orgId":32,"leadId":null,"salespersonId":null,"orderName":"Test Order - No Manufacturer Assignment","status":"shipped","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":null,"manufacturerId":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-11T21:35:07.211Z","updatedAt":"2025-10-11T21:38:03.140Z"}	2025-10-11 21:38:03.167085
138	admin-test-123	order	26	updated	{"id":26,"orderCode":"O-00011","orgId":32,"leadId":null,"salespersonId":null,"orderName":"Test Order - No Manufacturer Assignment","status":"shipped","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":null,"manufacturerId":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-11T21:35:07.211Z","updatedAt":"2025-10-11T21:38:03.140Z","salespersonName":null}	{"id":26,"orderCode":"O-00011","orgId":32,"leadId":null,"salespersonId":null,"orderName":"Test Order - No Manufacturer Assignment","status":"completed","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":null,"manufacturerId":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-11T21:35:07.211Z","updatedAt":"2025-10-11T21:38:12.458Z"}	2025-10-11 21:38:12.484202
139	admin_id	design_job	19	archived	{"id":19,"jobCode":"DJ-00001","orgId":4,"leadId":null,"orderId":null,"salespersonId":null,"brief":"Test design job for salesperson 1","requirements":"","urgency":"normal","status":"pending","assignedDesignerId":null,"renditionCount":0,"renditionUrls":null,"renditionMockupUrl":null,"renditionProductionUrl":null,"finalLink":null,"referenceFiles":null,"deadline":null,"priority":"normal","internalNotes":"","clientFeedback":null,"archived":false,"archivedAt":null,"statusChangedAt":"2025-09-30T14:53:57.398Z","createdAt":"2025-09-30T14:53:57.398Z","updatedAt":"2025-09-30T14:53:57.398Z","organization":{"id":4,"name":"East Hamilton High School","sports":"Wrestling","city":"Chattanooga","state":"TN","shippingAddress":null,"notes":"Spirit pack client","logoUrl":null,"territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-09-26T20:25:32.069Z","updatedAt":"2025-09-26T20:25:32.069Z"}}	{"id":19,"jobCode":"DJ-00001","orgId":4,"leadId":null,"orderId":null,"salespersonId":null,"brief":"Test design job for salesperson 1","requirements":"","urgency":"normal","status":"pending","assignedDesignerId":null,"renditionCount":0,"renditionUrls":null,"renditionMockupUrl":null,"renditionProductionUrl":null,"finalLink":null,"referenceFiles":null,"deadline":null,"priority":"normal","internalNotes":"","clientFeedback":null,"archived":true,"archivedAt":"2025-10-11T22:02:03.218Z","statusChangedAt":"2025-09-30T14:53:57.398Z","createdAt":"2025-09-30T14:53:57.398Z","updatedAt":"2025-10-11T22:02:03.218Z"}	2025-10-11 22:02:03.245228
140	admin_id	design_job	19	unarchived	{"id":19,"jobCode":"DJ-00001","orgId":4,"leadId":null,"orderId":null,"salespersonId":null,"brief":"Test design job for salesperson 1","requirements":"","urgency":"normal","status":"pending","assignedDesignerId":null,"renditionCount":0,"renditionUrls":null,"renditionMockupUrl":null,"renditionProductionUrl":null,"finalLink":null,"referenceFiles":null,"deadline":null,"priority":"normal","internalNotes":"","clientFeedback":null,"archived":true,"archivedAt":"2025-10-11T22:02:03.218Z","statusChangedAt":"2025-09-30T14:53:57.398Z","createdAt":"2025-09-30T14:53:57.398Z","updatedAt":"2025-10-11T22:02:03.218Z","organization":{"id":4,"name":"East Hamilton High School","sports":"Wrestling","city":"Chattanooga","state":"TN","shippingAddress":null,"notes":"Spirit pack client","logoUrl":null,"territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-09-26T20:25:32.069Z","updatedAt":"2025-09-26T20:25:32.069Z"}}	{"id":19,"jobCode":"DJ-00001","orgId":4,"leadId":null,"orderId":null,"salespersonId":null,"brief":"Test design job for salesperson 1","requirements":"","urgency":"normal","status":"pending","assignedDesignerId":null,"renditionCount":0,"renditionUrls":null,"renditionMockupUrl":null,"renditionProductionUrl":null,"finalLink":null,"referenceFiles":null,"deadline":null,"priority":"normal","internalNotes":"","clientFeedback":null,"archived":false,"archivedAt":null,"statusChangedAt":"2025-09-30T14:53:57.398Z","createdAt":"2025-09-30T14:53:57.398Z","updatedAt":"2025-10-11T22:02:49.371Z"}	2025-10-11 22:02:49.395451
141	41090967	invoice	3	created	\N	{"id":3,"invoiceNumber":"INV-00001","orderId":24,"orgId":31,"salespersonId":null,"issueDate":"2025-10-11","dueDate":"2025-11-10","status":"draft","subtotal":"1000.00","discount":"0.00","taxRate":"0.0000","taxAmount":"0.00","totalAmount":"1000.00","amountPaid":"0.00","amountDue":"1000.00","paymentTerms":"","notes":"","internalNotes":null,"sentAt":null,"paidAt":null,"createdBy":"41090967","createdAt":"2025-10-11T23:47:43.976Z","updatedAt":"2025-10-11T23:47:43.976Z"}	2025-10-11 23:47:44.002236
143	_aKz-M	design_job	24	created	\N	{"id":24,"jobCode":"DJ-00003","orgId":34,"leadId":null,"orderId":null,"salespersonId":null,"brief":"Test attachment job for QA","requirements":"Test requirements","urgency":"normal","status":"pending","assignedDesignerId":null,"renditionCount":0,"renditionUrls":null,"renditionMockupUrl":null,"renditionProductionUrl":null,"finalLink":null,"referenceFiles":null,"logoUrls":null,"designReferenceUrls":null,"additionalFileUrls":null,"designStyleUrl":"https://example.com/style-guide-test","deadline":null,"priority":"normal","internalNotes":"","clientFeedback":null,"archived":false,"archivedAt":null,"statusChangedAt":"2025-10-13T14:58:27.745Z","createdAt":"2025-10-13T14:58:27.745Z","updatedAt":"2025-10-13T14:58:27.745Z"}	2025-10-13 14:58:27.809937
144	41090967	order_line_item	17	deleted	\N	\N	2025-10-13 15:44:49.134064
145	-TcOyb	manufacturer	5	created	\N	{"id":5,"name":"Test Manufacturer Auto 2rRDhw","contactName":null,"email":null,"phone":null,"notes":null,"leadTimeDays":14,"minOrderQty":1,"createdAt":"2025-10-13T19:36:11.111Z","updatedAt":"2025-10-13T19:36:11.111Z"}	2025-10-13 19:36:11.137002
146	j96Jh6	product	43	created	\N	{"id":43,"sku":"E2E-E2E-7949","name":"E2E Product ZaXE-d","categoryId":25,"style":null,"description":"Created by E2E test","basePrice":"29.99","minOrderQty":1,"sizes":null,"primaryImageUrl":null,"additionalImages":null,"status":"active","active":true,"createdAt":"2025-10-13T19:38:14.174Z","updatedAt":"2025-10-13T19:38:14.174Z"}	2025-10-13 19:38:14.22114
147	j96Jh6	variant	23	created	\N	{"id":23,"productId":43,"variantCode":"VAR-pi7VWP","color":"Red","size":"M","material":"Cotton","msrp":"29.99","cost":"15.00","imageUrl":"","defaultManufacturerId":null,"backupManufacturerId":null,"createdAt":"2025-10-13T19:40:23.408Z","updatedAt":"2025-10-13T19:40:23.408Z"}	2025-10-13 19:40:23.441804
148	j96Jh6	variant	23	updated	{"id":23,"productId":43,"variantCode":"VAR-pi7VWP","color":"Red","size":"M","material":"Cotton","msrp":"29.99","cost":"15.00","imageUrl":"","defaultManufacturerId":null,"backupManufacturerId":null,"createdAt":"2025-10-13T19:40:23.408Z","updatedAt":"2025-10-13T19:40:23.408Z"}	{"id":23,"productId":43,"variantCode":"VAR-pi7VWP","color":"Red","size":"M","material":"Cotton","msrp":"29.99","cost":"15.00","imageUrl":"","defaultManufacturerId":5,"backupManufacturerId":null,"createdAt":"2025-10-13T19:40:23.408Z","updatedAt":"2025-10-13T19:41:08.204Z"}	2025-10-13 19:41:08.231282
149	admin_id	manufacturer	6	created	\N	{"id":6,"name":"AutoAssign Test ylSk3a","contactName":null,"email":null,"phone":null,"notes":null,"leadTimeDays":14,"minOrderQty":1,"createdAt":"2025-10-13T19:50:30.863Z","updatedAt":"2025-10-13T19:50:30.863Z"}	2025-10-13 19:50:30.88529
150	admin_id	product	44	created	\N	{"id":44,"sku":"APP-TES-2939","name":"Test Product EAiNyP","categoryId":1,"style":null,"description":null,"basePrice":"19.99","minOrderQty":1,"sizes":null,"primaryImageUrl":null,"additionalImages":null,"status":"active","active":true,"createdAt":"2025-10-13T19:50:52.085Z","updatedAt":"2025-10-13T19:50:52.085Z"}	2025-10-13 19:50:52.105909
151	admin_id	variant	24	created	\N	{"id":24,"productId":44,"variantCode":"VAR-18QKZY","color":"Red","size":"M","material":null,"msrp":null,"cost":null,"imageUrl":null,"defaultManufacturerId":6,"backupManufacturerId":null,"createdAt":"2025-10-13T19:52:10.478Z","updatedAt":"2025-10-13T19:52:10.478Z"}	2025-10-13 19:52:10.502597
152	admin_id	order	30	created	\N	{"id":30,"orderCode":"O-00012","orgId":4,"leadId":null,"salespersonId":null,"orderName":"Test 0kJYwd","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":null,"manufacturerId":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-13T19:53:10.691Z","updatedAt":"2025-10-13T19:53:10.691Z","lineItems":[{"id":34,"orderId":30,"variantId":24,"itemName":"Test Item","colorNotes":null,"imageUrl":null,"yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":0,"m":5,"l":0,"xl":0,"xxl":0,"xxxl":0,"unitPrice":"29.99","qtyTotal":5,"lineTotal":"149.95","notes":null,"createdAt":"2025-10-13T19:53:10.691Z","updatedAt":"2025-10-13T19:53:10.691Z"}]}	2025-10-13 19:53:10.934238
153	41090967	order_line_item	26	updated	\N	{"id":26,"orderId":21,"variantId":21,"itemName":"Performance Wrestling Singlet - SINGLET-RH-PURP (Purple)","colorNotes":"Purple","imageUrl":null,"yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":0,"m":10,"l":0,"xl":0,"xxl":0,"xxxl":0,"unitPrice":"35.00","qtyTotal":10,"lineTotal":"350.00","notes":null,"createdAt":"2025-10-03T18:21:54.268Z","updatedAt":"2025-10-14T05:07:18.158Z"}	2025-10-14 05:07:18.188887
154	Lve3hd	organization	34	updated	{"id":34,"name":"Test Org","sports":null,"city":null,"state":null,"shippingAddress":null,"notes":null,"logoUrl":null,"territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-10-13T02:00:43.638Z","updatedAt":"2025-10-13T02:00:43.638Z"}	{"id":34,"name":"Test Org","sports":"","city":"","state":"","shippingAddress":"","notes":"","logoUrl":"/public-objects/products/2025/10/img_1760476900490_turmm5","territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-10-13T02:00:43.638Z","updatedAt":"2025-10-14T21:22:29.034Z"}	2025-10-14 21:22:29.060405
155	RrrHfL	lead	9	created	\N	{"id":9,"leadCode":"L-00006","orgId":34,"contactId":null,"ownerUserId":"RrrHfL","stage":"future_lead","source":"test_pipeline","notes":"","claimedAt":null,"score":75,"archived":false,"archivedAt":null,"archivedBy":null,"createdAt":"2025-10-15T05:21:12.918Z","updatedAt":"2025-10-15T05:21:12.918Z"}	2025-10-15 05:21:12.950965
156	RrrHfL	lead	9	updated	{"id":9,"leadCode":"L-00006","orgId":34,"contactId":null,"ownerUserId":"RrrHfL","stage":"future_lead","source":"test_pipeline","notes":"","claimedAt":null,"score":75,"archived":false,"archivedAt":null,"archivedBy":null,"createdAt":"2025-10-15T05:21:12.918Z","updatedAt":"2025-10-15T05:21:12.918Z","organization":{"id":34,"name":"Test Org","sports":"","city":"","state":"","shippingAddress":"","notes":"","logoUrl":"/public-objects/products/2025/10/img_1760476900490_turmm5","territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-10-13T02:00:43.638Z","updatedAt":"2025-10-14T21:22:29.034Z"},"owner":{"id":"RrrHfL","email":"RrrHfL@example.com","firstName":"John","lastName":"Doe","profileImageUrl":null,"name":"John Doe","role":"sales","passwordHash":null,"isActive":true,"phone":null,"active":true,"avatarUrl":null,"isInvited":false,"hasCompletedSetup":false,"invitedAt":null,"invitedBy":null,"createdAt":"2025-10-15T05:19:03.946Z","updatedAt":"2025-10-15T05:19:03.946Z"}}	{"id":9,"leadCode":"L-00006","orgId":34,"contactId":null,"ownerUserId":"RrrHfL","stage":"lead","source":"test_pipeline","notes":"","claimedAt":null,"score":75,"archived":false,"archivedAt":null,"archivedBy":null,"createdAt":"2025-10-15T05:21:12.918Z","updatedAt":"2025-10-15T05:22:45.317Z"}	2025-10-15 05:22:45.343808
157	RrrHfL	contact	12	created	\N	{"id":12,"orgId":null,"name":"Automated Test Contact","email":"xutDFu@example.com","phone":"555-999-0000","roleTitle":null,"role":"other","isPrimary":false,"createdAt":"2025-10-15T05:26:22.294Z","updatedAt":"2025-10-15T05:26:22.294Z"}	2025-10-15 05:26:22.319403
187	nyAcqv	order	34	created	\N	{"id":34,"orderCode":"O-00016","orgId":36,"leadId":null,"salespersonId":"nyAcqv","orderName":"Image Sync Test 7H8jj3","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":null,"manufacturerId":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-16T19:44:45.493Z","updatedAt":"2025-10-16T19:44:45.493Z"}	2025-10-16 19:44:45.519285
158	RrrHfL	lead	9	updated	{"id":9,"leadCode":"L-00006","orgId":34,"contactId":null,"ownerUserId":"RrrHfL","stage":"lead","source":"test_pipeline","notes":"","claimedAt":null,"score":75,"archived":false,"archivedAt":null,"archivedBy":null,"createdAt":"2025-10-15T05:21:12.918Z","updatedAt":"2025-10-15T05:22:45.317Z","organization":{"id":34,"name":"Test Org","sports":"","city":"","state":"","shippingAddress":"","notes":"","logoUrl":"/public-objects/products/2025/10/img_1760476900490_turmm5","territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-10-13T02:00:43.638Z","updatedAt":"2025-10-14T21:22:29.034Z"},"owner":{"id":"RrrHfL","email":"RrrHfL@example.com","firstName":"John","lastName":"Doe","profileImageUrl":null,"name":"John Doe","role":"sales","passwordHash":null,"isActive":true,"phone":null,"active":true,"avatarUrl":null,"isInvited":false,"hasCompletedSetup":false,"invitedAt":null,"invitedBy":null,"createdAt":"2025-10-15T05:19:03.946Z","updatedAt":"2025-10-15T05:19:03.946Z"}}	{"id":9,"leadCode":"L-00006","orgId":34,"contactId":12,"ownerUserId":"RrrHfL","stage":"lead","source":"test_pipeline","notes":"","claimedAt":null,"score":75,"archived":false,"archivedAt":null,"archivedBy":null,"createdAt":"2025-10-15T05:21:12.918Z","updatedAt":"2025-10-15T05:27:30.743Z"}	2025-10-15 05:27:30.775797
159	8pj4HX	lead	10	created	\N	{"id":10,"leadCode":"L-00007","orgId":34,"contactId":null,"ownerUserId":"8pj4HX","stage":"future_lead","source":"pipeline_test","notes":"","claimedAt":null,"score":80,"archived":false,"archivedAt":null,"archivedBy":null,"createdAt":"2025-10-15T05:36:16.198Z","updatedAt":"2025-10-15T05:36:16.198Z"}	2025-10-15 05:36:16.216078
160	8pj4HX	lead	10	updated	{"id":10,"leadCode":"L-00007","orgId":34,"contactId":null,"ownerUserId":"8pj4HX","stage":"future_lead","source":"pipeline_test","notes":"","claimedAt":null,"score":80,"archived":false,"archivedAt":null,"archivedBy":null,"createdAt":"2025-10-15T05:36:16.198Z","updatedAt":"2025-10-15T05:36:16.198Z","organization":{"id":34,"name":"Test Org","sports":"","city":"","state":"","shippingAddress":"","notes":"","logoUrl":"/public-objects/products/2025/10/img_1760476900490_turmm5","territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-10-13T02:00:43.638Z","updatedAt":"2025-10-14T21:22:29.034Z"},"owner":{"id":"8pj4HX","email":"8pj4HX@example.com","firstName":"John","lastName":"Doe","profileImageUrl":null,"name":"John Doe","role":"sales","passwordHash":null,"isActive":true,"phone":null,"active":true,"avatarUrl":null,"isInvited":false,"hasCompletedSetup":false,"invitedAt":null,"invitedBy":null,"createdAt":"2025-10-15T05:33:30.775Z","updatedAt":"2025-10-15T05:33:30.775Z"}}	{"id":10,"leadCode":"L-00007","orgId":34,"contactId":null,"ownerUserId":"8pj4HX","stage":"lead","source":"pipeline_test","notes":"","claimedAt":null,"score":80,"archived":false,"archivedAt":null,"archivedBy":null,"createdAt":"2025-10-15T05:36:16.198Z","updatedAt":"2025-10-15T05:37:26.529Z"}	2025-10-15 05:37:26.55496
161	41090967	organization	34	updated	{"id":34,"name":"Test Org","sports":"","city":"","state":"","shippingAddress":"","notes":"","logoUrl":"/public-objects/products/2025/10/img_1760476900490_turmm5","territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-10-13T02:00:43.638Z","updatedAt":"2025-10-14T21:22:29.034Z"}	{"id":34,"name":"Test Org","sports":"","city":"","state":"","shippingAddress":"","notes":"","logoUrl":"/public-objects/products/2025/10/img_1760545765639_svg4yl","territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-10-13T02:00:43.638Z","updatedAt":"2025-10-15T16:29:32.575Z"}	2025-10-15 16:29:32.601645
162	41090967	organization	17	updated	{"id":17,"name":"Homewood High School","sports":"Wrestling","city":"Homewood","state":"AL","shippingAddress":"","notes":"","logoUrl":null,"territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-09-26T23:48:51.790Z","updatedAt":"2025-09-26T23:48:51.790Z"}	{"id":17,"name":"Homewood High School","sports":"Wrestling","city":"Homewood","state":"AL","shippingAddress":"","notes":"","logoUrl":"/public-objects/products/2025/10/img_1760547964137_1a4vjv","territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-09-26T23:48:51.790Z","updatedAt":"2025-10-15T17:06:08.223Z"}	2025-10-15 17:06:08.248697
163	41090967	order_line_item	36	created	\N	{"id":36,"orderId":15,"variantId":13,"itemName":"","colorNotes":"","imageUrl":null,"yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":0,"m":0,"l":0,"xl":0,"xxl":0,"xxxl":0,"unitPrice":"20.00","qtyTotal":0,"lineTotal":"0.00","notes":"","createdAt":"2025-10-15T20:05:14.208Z","updatedAt":"2025-10-15T20:05:14.208Z"}	2025-10-15 20:05:14.249173
164	41090967	order_line_item	23	updated	\N	{"id":23,"orderId":15,"variantId":2,"itemName":"Heavy Tee (Black)","colorNotes":"Purple/white print","imageUrl":"https://storage.googleapis.com/replit-objstore-84676dcc-ba6c-4de1-8d43-7810e5954e44/public/products/2025/10/img_1760558722557_js92hr","yxs":2,"ys":6,"ym":10,"yl":12,"xs":4,"s":10,"m":14,"l":14,"xl":8,"xxl":4,"xxxl":2,"unitPrice":"25.00","qtyTotal":86,"lineTotal":"2150.00","notes":"","createdAt":"2025-10-03T17:51:06.178Z","updatedAt":"2025-10-15T20:05:28.058Z"}	2025-10-15 20:05:28.082147
165	test-user	order	31	created	\N	{"id":31,"orderCode":"O-00013","orgId":34,"leadId":null,"salespersonId":"test-user","orderName":"E2E Test Order 1760560104156","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":null,"manufacturerId":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-15T20:32:28.901Z","updatedAt":"2025-10-15T20:32:28.901Z","lineItems":[{"id":37,"orderId":31,"variantId":24,"itemName":"Test Product EAiNyP - VAR-18QKZY (Red)","colorNotes":"Red","imageUrl":null,"yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":0,"m":1,"l":0,"xl":0,"xxl":0,"xxxl":0,"unitPrice":"0.00","qtyTotal":1,"lineTotal":"0.00","notes":null,"createdAt":"2025-10-15T20:32:28.901Z","updatedAt":"2025-10-15T20:32:28.901Z"}]}	2025-10-15 20:32:29.188887
166	admin-test-user	order_line_item	27	updated	{"id":27,"orderId":22,"variantId":21,"itemName":"Performance Wrestling Singlet - SINGLET-RH-PURP (Purple)","colorNotes":"Purple","imageUrl":null,"yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":0,"m":1,"l":0,"xl":0,"xxl":0,"xxxl":0,"unitPrice":"35.00","qtyTotal":1,"lineTotal":"35.00","notes":null,"createdAt":"2025-10-03T18:38:35.375Z","updatedAt":"2025-10-03T18:38:35.375Z"}	{"id":27,"orderId":22,"variantId":21,"itemName":"Custom Product Name OmfgoW","colorNotes":"Purple","imageUrl":null,"yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":0,"m":1,"l":0,"xl":0,"xxl":0,"xxxl":0,"unitPrice":"35.00","qtyTotal":1,"lineTotal":"35.00","notes":null,"createdAt":"2025-10-03T18:38:35.375Z","updatedAt":"2025-10-15T23:04:11.225Z"}	2025-10-15 23:04:11.249145
167	admin-test-user	manufacturing	12	archived	\N	{"id":12,"orderId":22,"status":"pending","assignedTo":null,"manufacturerId":null,"startDate":null,"estCompletion":"2025-11-12","actualCompletion":null,"qcNotes":null,"trackingNumber":null,"batchNumber":null,"batchSize":1,"priority":"normal","specialInstructions":"","productionNotes":null,"qualityNotes":null,"attachmentUrls":null,"estimatedHours":null,"actualHours":null,"scheduledStartDate":null,"scheduledEndDate":null,"archived":true,"archivedAt":"2025-10-15T23:04:53.893Z","archivedBy":"admin-test-user","completedProductImages":null,"createdAt":"2025-10-13T14:21:23.805Z","updatedAt":"2025-10-15T23:04:53.893Z"}	2025-10-15 23:04:53.924186
168	41090967	manufacturing	9	updated	{"id":9,"orderId":16,"status":"pending","assignedTo":null,"manufacturerId":null,"startDate":null,"estCompletion":"2025-11-11","actualCompletion":null,"qcNotes":null,"trackingNumber":null,"batchNumber":null,"batchSize":1,"priority":"normal","specialInstructions":"Created by automated test","productionNotes":null,"qualityNotes":null,"attachmentUrls":null,"estimatedHours":null,"actualHours":null,"scheduledStartDate":null,"scheduledEndDate":null,"archived":false,"archivedAt":null,"archivedBy":null,"completedProductImages":null,"createdAt":"2025-10-12T00:31:33.978Z","updatedAt":"2025-10-12T00:31:33.978Z","order":{"id":16,"orderCode":"O-00002","orgId":26,"leadId":null,"salespersonId":"dee15298-a714-408c-bacd-09a9e1af5b68","orderName":"Homewood","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":"2025-09-30","manufacturerId":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-09-30T20:06:04.642Z","updatedAt":"2025-09-30T20:06:04.642Z"}}	{"id":9,"orderId":16,"status":"in_progress","assignedTo":null,"manufacturerId":null,"startDate":null,"estCompletion":"2025-11-11","actualCompletion":null,"qcNotes":null,"trackingNumber":"","batchNumber":null,"batchSize":1,"priority":"normal","specialInstructions":"Created by automated test","productionNotes":"","qualityNotes":"","attachmentUrls":null,"estimatedHours":null,"actualHours":null,"scheduledStartDate":null,"scheduledEndDate":null,"archived":false,"archivedAt":null,"archivedBy":null,"completedProductImages":null,"createdAt":"2025-10-12T00:31:33.978Z","updatedAt":"2025-10-15T23:05:26.707Z"}	2025-10-15 23:05:26.802736
169	41090967	order_line_item	23	updated	\N	{"id":23,"orderId":15,"variantId":2,"itemName":"Heavy Tee (Black)","colorNotes":"Purple/white print","imageUrl":"/public-objects/products/2025/10/img_1760558722557_js92hr","yxs":2,"ys":6,"ym":10,"yl":12,"xs":4,"s":10,"m":14,"l":14,"xl":8,"xxl":4,"xxxl":2,"unitPrice":"25.00","qtyTotal":86,"lineTotal":"2150.00","notes":"","createdAt":"2025-10-03T17:51:06.178Z","updatedAt":"2025-10-15T23:05:35.696Z"}	2025-10-15 23:05:35.727243
170	4NQtH-	order_line_item	27	updated	{"id":27,"orderId":22,"variantId":21,"itemName":"Custom Product Name OmfgoW","colorNotes":"Purple","imageUrl":null,"yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":0,"m":1,"l":0,"xl":0,"xxl":0,"xxxl":0,"unitPrice":"35.00","qtyTotal":1,"lineTotal":"35.00","notes":null,"createdAt":"2025-10-03T18:38:35.375Z","updatedAt":"2025-10-15T23:04:11.225Z"}	{"id":27,"orderId":22,"variantId":21,"itemName":"Custom Product Name w9PQw7","colorNotes":"Purple","imageUrl":null,"yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":0,"m":1,"l":0,"xl":0,"xxl":0,"xxxl":0,"unitPrice":"35.00","qtyTotal":1,"lineTotal":"35.00","notes":null,"createdAt":"2025-10-03T18:38:35.375Z","updatedAt":"2025-10-15T23:18:12.228Z"}	2025-10-15 23:18:12.273915
171	4NQtH-	manufacturing	12	unarchived	\N	{"id":12,"orderId":22,"status":"pending","assignedTo":null,"manufacturerId":null,"startDate":null,"estCompletion":"2025-11-12","actualCompletion":null,"qcNotes":null,"trackingNumber":null,"batchNumber":null,"batchSize":1,"priority":"normal","specialInstructions":"","productionNotes":null,"qualityNotes":null,"attachmentUrls":null,"estimatedHours":null,"actualHours":null,"scheduledStartDate":null,"scheduledEndDate":null,"archived":false,"archivedAt":null,"archivedBy":null,"completedProductImages":null,"createdAt":"2025-10-13T14:21:23.805Z","updatedAt":"2025-10-15T23:18:37.571Z"}	2025-10-15 23:18:37.59658
172	4NQtH-	manufacturing	12	archived	\N	{"id":12,"orderId":22,"status":"pending","assignedTo":null,"manufacturerId":null,"startDate":null,"estCompletion":"2025-11-12","actualCompletion":null,"qcNotes":null,"trackingNumber":null,"batchNumber":null,"batchSize":1,"priority":"normal","specialInstructions":"","productionNotes":null,"qualityNotes":null,"attachmentUrls":null,"estimatedHours":null,"actualHours":null,"scheduledStartDate":null,"scheduledEndDate":null,"archived":true,"archivedAt":"2025-10-15T23:20:42.715Z","archivedBy":"4NQtH-","completedProductImages":null,"createdAt":"2025-10-13T14:21:23.805Z","updatedAt":"2025-10-15T23:20:42.715Z"}	2025-10-15 23:20:42.739849
173	CTFAxZ	order_line_item	32	updated	{"id":32,"orderId":26,"variantId":21,"itemName":"Performance Wrestling Singlet - SINGLET-RH-PURP (Purple)","colorNotes":"Purple","imageUrl":null,"yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":10,"m":10,"l":5,"xl":0,"xxl":0,"xxxl":0,"unitPrice":"35.00","qtyTotal":25,"lineTotal":"875.00","notes":null,"createdAt":"2025-10-11T21:35:07.211Z","updatedAt":"2025-10-11T21:35:07.211Z"}	{"id":32,"orderId":26,"variantId":21,"itemName":"Test Product P_Aydu","colorNotes":"Purple","imageUrl":null,"yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":10,"m":10,"l":5,"xl":0,"xxl":0,"xxxl":0,"unitPrice":"35.00","qtyTotal":25,"lineTotal":"875.00","notes":null,"createdAt":"2025-10-11T21:35:07.211Z","updatedAt":"2025-10-15T23:30:35.411Z"}	2025-10-15 23:30:35.436661
174	CTFAxZ	manufacturing	7	archived	\N	{"id":7,"orderId":25,"status":"complete","assignedTo":null,"manufacturerId":null,"startDate":null,"estCompletion":null,"actualCompletion":"2025-10-11","qcNotes":null,"trackingNumber":"","batchNumber":null,"batchSize":1,"priority":"normal","specialInstructions":null,"productionNotes":"Auto-created when order moved to production","qualityNotes":"","attachmentUrls":null,"estimatedHours":null,"actualHours":null,"scheduledStartDate":null,"scheduledEndDate":null,"archived":true,"archivedAt":"2025-10-15T23:31:37.153Z","archivedBy":"CTFAxZ","completedProductImages":null,"createdAt":"2025-10-11T03:15:47.701Z","updatedAt":"2025-10-15T23:31:37.153Z"}	2025-10-15 23:31:37.182441
175	CTFAxZ	manufacturing	7	updated_completed_images	\N	{"id":7,"orderId":25,"status":"complete","assignedTo":null,"manufacturerId":null,"startDate":null,"estCompletion":null,"actualCompletion":"2025-10-11","qcNotes":null,"trackingNumber":"","batchNumber":null,"batchSize":1,"priority":"normal","specialInstructions":null,"productionNotes":"Auto-created when order moved to production","qualityNotes":"","attachmentUrls":null,"estimatedHours":null,"actualHours":null,"scheduledStartDate":null,"scheduledEndDate":null,"archived":true,"archivedAt":"2025-10-15T23:31:37.153Z","archivedBy":"CTFAxZ","completedProductImages":["https://storage.googleapis.com/replit-objstore-84676dcc-ba6c-4de1-8d43-7810e5954e44/public/products/2025/10/img_1760571277315_j34wt3"],"createdAt":"2025-10-11T03:15:47.701Z","updatedAt":"2025-10-15T23:34:37.987Z"}	2025-10-15 23:34:38.013499
176	gBk7gq	design_job	25	created	\N	{"id":25,"jobCode":"DJ-00004","orgId":34,"leadId":null,"orderId":null,"salespersonId":null,"brief":"Test design job with attachments","requirements":"","urgency":"normal","status":"pending","assignedDesignerId":null,"renditionCount":0,"renditionUrls":null,"renditionMockupUrl":null,"renditionProductionUrl":null,"finalLink":null,"referenceFiles":null,"deadline":null,"priority":"normal","internalNotes":"","clientFeedback":null,"logoUrls":null,"designReferenceUrls":null,"additionalFileUrls":null,"designStyleUrl":null,"archived":false,"archivedAt":null,"statusChangedAt":"2025-10-16T05:06:36.674Z","createdAt":"2025-10-16T05:06:36.674Z","updatedAt":"2025-10-16T05:06:36.674Z"}	2025-10-16 05:06:36.695509
188	nyAcqv	order_line_item	41	created	\N	{"id":41,"orderId":34,"variantId":24,"itemName":null,"colorNotes":null,"imageUrl":"/public-objects/test-image-1.jpg","yxs":0,"ys":0,"ym":0,"yl":0,"xs":10,"s":10,"m":10,"l":0,"xl":0,"xxl":0,"xxxl":0,"unitPrice":"10.00","qtyTotal":30,"lineTotal":"300.00","notes":null,"createdAt":"2025-10-16T19:45:22.689Z","updatedAt":"2025-10-16T19:45:22.689Z"}	2025-10-16 19:45:22.765177
177	41090967	design_job	24	reassigned	{"id":24,"jobCode":"DJ-00003","orgId":34,"leadId":null,"orderId":null,"salespersonId":null,"brief":"Test attachment job for QA","requirements":"Test requirements","urgency":"normal","status":"pending","assignedDesignerId":null,"renditionCount":0,"renditionUrls":null,"renditionMockupUrl":null,"renditionProductionUrl":null,"finalLink":null,"referenceFiles":null,"deadline":null,"priority":"normal","internalNotes":"","clientFeedback":null,"logoUrls":null,"designReferenceUrls":null,"additionalFileUrls":null,"designStyleUrl":null,"archived":false,"archivedAt":null,"statusChangedAt":"2025-10-13T14:58:27.745Z","createdAt":"2025-10-13T14:58:27.745Z","updatedAt":"2025-10-13T14:58:27.745Z","organization":{"id":34,"name":"Test Org","sports":"","city":"","state":"","shippingAddress":"","notes":"","logoUrl":"/public-objects/products/2025/10/img_1760545765639_svg4yl","territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-10-13T02:00:43.638Z","updatedAt":"2025-10-15T16:29:32.575Z"}}	{"id":24,"jobCode":"DJ-00003","orgId":34,"leadId":null,"orderId":null,"salespersonId":null,"brief":"Test attachment job for QA","requirements":"Test requirements","urgency":"normal","status":"pending","assignedDesignerId":"d611f424-250b-4120-9352-099171fe0bac","renditionCount":0,"renditionUrls":null,"renditionMockupUrl":null,"renditionProductionUrl":null,"finalLink":null,"referenceFiles":null,"deadline":null,"priority":"normal","internalNotes":"","clientFeedback":null,"logoUrls":null,"designReferenceUrls":null,"additionalFileUrls":null,"designStyleUrl":null,"archived":false,"archivedAt":null,"statusChangedAt":"2025-10-13T14:58:27.745Z","createdAt":"2025-10-13T14:58:27.745Z","updatedAt":"2025-10-16T05:15:27.107Z"}	2025-10-16 05:15:27.132559
178	41090967	order	31	updated	{"id":31,"orderCode":"O-00013","orgId":34,"leadId":null,"salespersonId":"test-user","orderName":"E2E Test Order 1760560104156","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":null,"manufacturerId":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-15T20:32:28.901Z","updatedAt":"2025-10-15T20:32:28.901Z","salespersonName":"Test User"}	{"id":31,"orderCode":"O-00013","orgId":34,"leadId":null,"salespersonId":"test-user","orderName":"E2E Test Order 1760560104156","status":"waiting_sizes","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":null,"manufacturerId":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-15T20:32:28.901Z","updatedAt":"2025-10-16T13:42:38.570Z"}	2025-10-16 13:42:38.598204
179	41090967	order	31	updated	{"id":31,"orderCode":"O-00013","orgId":34,"leadId":null,"salespersonId":"test-user","orderName":"E2E Test Order 1760560104156","status":"waiting_sizes","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":null,"manufacturerId":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-15T20:32:28.901Z","updatedAt":"2025-10-16T13:42:38.570Z","salespersonName":"Test User"}	{"id":31,"orderCode":"O-00013","orgId":34,"leadId":null,"salespersonId":"test-user","orderName":"E2E Test Order 1760560104156","status":"invoiced","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":null,"manufacturerId":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-15T20:32:28.901Z","updatedAt":"2025-10-16T13:42:40.599Z"}	2025-10-16 13:42:40.622127
180	41090967	order	31	updated	{"id":31,"orderCode":"O-00013","orgId":34,"leadId":null,"salespersonId":"test-user","orderName":"E2E Test Order 1760560104156","status":"invoiced","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":null,"manufacturerId":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-15T20:32:28.901Z","updatedAt":"2025-10-16T13:42:40.599Z","salespersonName":"Test User"}	{"id":31,"orderCode":"O-00013","orgId":34,"leadId":null,"salespersonId":"test-user","orderName":"E2E Test Order 1760560104156","status":"production","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":null,"manufacturerId":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-15T20:32:28.901Z","updatedAt":"2025-10-16T13:42:43.249Z"}	2025-10-16 13:42:43.271743
181	test-viewer-user	order	32	created	\N	{"id":32,"orderCode":"O-00014","orgId":34,"leadId":null,"salespersonId":"test-viewer-user","orderName":"Test Order for Image Viewer","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":null,"manufacturerId":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-16T13:49:32.883Z","updatedAt":"2025-10-16T13:49:32.883Z","lineItems":[{"id":38,"orderId":32,"variantId":24,"itemName":"Test Product EAiNyP - VAR-18QKZY (Red)","colorNotes":"Red","imageUrl":null,"yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":0,"m":1,"l":0,"xl":0,"xxl":0,"xxxl":0,"unitPrice":"0.00","qtyTotal":1,"lineTotal":"0.00","notes":null,"createdAt":"2025-10-16T13:49:32.883Z","updatedAt":"2025-10-16T13:49:32.883Z"}]}	2025-10-16 13:49:33.120342
182	test-viewer-user	order_line_item	38	updated	\N	{"id":38,"orderId":32,"variantId":24,"itemName":"Test Product EAiNyP - VAR-18QKZY (Red)","colorNotes":"Red","imageUrl":null,"yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":0,"m":1,"l":0,"xl":0,"xxl":0,"xxxl":0,"unitPrice":"0.00","qtyTotal":1,"lineTotal":"0.00","notes":null,"createdAt":"2025-10-16T13:49:32.883Z","updatedAt":"2025-10-16T13:52:58.216Z"}	2025-10-16 13:52:58.25216
183	test-viewer-user	order_line_item	38	updated	\N	{"id":38,"orderId":32,"variantId":24,"itemName":"Test Product EAiNyP - VAR-18QKZY (Red)","colorNotes":"Red","imageUrl":"https://via.placeholder.com/800","yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":0,"m":1,"l":0,"xl":0,"xxl":0,"xxxl":0,"unitPrice":"0.00","qtyTotal":1,"lineTotal":"0.00","notes":null,"createdAt":"2025-10-16T13:49:32.883Z","updatedAt":"2025-10-16T13:53:14.854Z"}	2025-10-16 13:53:14.887057
184	zkfHLJ	organization	35	created	\N	{"id":35,"name":"Image Sync Test Org 6Ga0fM","sports":null,"city":null,"state":null,"shippingAddress":null,"notes":null,"logoUrl":null,"territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-10-16T19:37:14.694Z","updatedAt":"2025-10-16T19:37:14.694Z"}	2025-10-16 19:37:14.717116
185	zkfHLJ	order	33	created	\N	{"id":33,"orderCode":"O-00015","orgId":35,"leadId":null,"salespersonId":"zkfHLJ","orderName":"Image Sync Test KgMHd3","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":null,"manufacturerId":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-16T19:38:12.403Z","updatedAt":"2025-10-16T19:38:12.403Z"}	2025-10-16 19:38:12.421477
186	nyAcqv	organization	36	created	\N	{"id":36,"name":"Image Sync Test Org OfRgCA","sports":null,"city":null,"state":null,"shippingAddress":null,"notes":null,"logoUrl":null,"territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-10-16T19:42:51.955Z","updatedAt":"2025-10-16T19:42:51.955Z"}	2025-10-16 19:42:51.986038
189	admin_auto	manufacturing_update	9	created	\N	{"id":9,"manufacturingId":9,"orderId":34,"status":"pending","notes":null,"updatedBy":"admin_auto","manufacturerId":null,"productionNotes":null,"qualityNotes":null,"trackingNumber":null,"estimatedCompletion":null,"actualCompletionDate":null,"specialInstructions":null,"attachmentUrls":null,"progressPercentage":0,"createdAt":"2025-10-16T19:50:33.650Z","updatedAt":"2025-10-16T19:50:33.650Z"}	2025-10-16 19:50:33.776738
190	admin_auto	order_line_item	41	updated	\N	{"id":41,"orderId":34,"variantId":24,"itemName":null,"colorNotes":null,"imageUrl":"/public-objects/test-image-2.jpg","yxs":0,"ys":0,"ym":0,"yl":0,"xs":10,"s":10,"m":10,"l":0,"xl":0,"xxl":0,"xxxl":0,"unitPrice":"10.00","qtyTotal":30,"lineTotal":"300.00","notes":null,"createdAt":"2025-10-16T19:45:22.689Z","updatedAt":"2025-10-16T19:52:15.900Z"}	2025-10-16 19:52:15.928364
191	41090967	order	35	created	\N	{"id":35,"orderCode":"O-00017","orgId":22,"leadId":null,"salespersonId":"b7f37c3a-b1cf-4309-a9f7-6db2ba2b34b5","orderName":"2025 Test Order","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":"2025-10-23","manufacturerId":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-17T03:56:12.683Z","updatedAt":"2025-10-17T03:56:12.683Z","lineItems":[{"id":42,"orderId":35,"variantId":23,"itemName":"E2E Product ZaXE-d - VAR-pi7VWP (Red)","colorNotes":"Red","imageUrl":null,"yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":2,"m":0,"l":0,"xl":2,"xxl":0,"xxxl":0,"unitPrice":"29.99","qtyTotal":4,"lineTotal":"119.96","notes":null,"createdAt":"2025-10-17T03:56:12.683Z","updatedAt":"2025-10-17T03:56:12.683Z"},{"id":43,"orderId":35,"variantId":21,"itemName":"Performance Wrestling Singlet - SINGLET-RH-PURP (Purple)","colorNotes":"Purple","imageUrl":null,"yxs":0,"ys":0,"ym":0,"yl":0,"xs":3,"s":0,"m":0,"l":0,"xl":0,"xxl":0,"xxxl":0,"unitPrice":"35.00","qtyTotal":3,"lineTotal":"105.00","notes":null,"createdAt":"2025-10-17T03:56:12.683Z","updatedAt":"2025-10-17T03:56:12.683Z"}]}	2025-10-17 03:56:12.979493
192	41090967	organization	22	updated	{"id":22,"name":"Sam Everett High School","sports":"Wrestling","city":"Maryville","state":"Tennessee","shippingAddress":"1308 E Lamar Alexander Dr Maryville, TN 37804 \\n","notes":"","logoUrl":null,"territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-09-29T19:06:18.091Z","updatedAt":"2025-09-29T19:06:18.091Z"}	{"id":22,"name":"Sam Everett High School","sports":"Wrestling","city":"Maryville","state":"Tennessee","shippingAddress":"1308 E Lamar Alexander Dr Maryville, TN 37804 \\n","notes":"","logoUrl":"/public-objects/products/2025/10/img_1760673396252_vool1x","territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-09-29T19:06:18.091Z","updatedAt":"2025-10-17T03:56:39.781Z"}	2025-10-17 03:56:39.805305
193	41090967	order	35	updated	{"id":35,"orderCode":"O-00017","orgId":22,"leadId":null,"salespersonId":"b7f37c3a-b1cf-4309-a9f7-6db2ba2b34b5","orderName":"2025 Test Order","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":"2025-10-23","manufacturerId":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-17T03:56:12.683Z","updatedAt":"2025-10-17T03:56:12.683Z","salespersonName":"Charlie Reeves"}	{"id":35,"orderCode":"O-00017","orgId":22,"leadId":null,"salespersonId":"b7f37c3a-b1cf-4309-a9f7-6db2ba2b34b5","orderName":"2025 Test Order","status":"waiting_sizes","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":"2025-10-23","manufacturerId":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-17T03:56:12.683Z","updatedAt":"2025-10-17T04:00:55.659Z"}	2025-10-17 04:00:55.68981
194	41090967	order	35	updated	{"id":35,"orderCode":"O-00017","orgId":22,"leadId":null,"salespersonId":"b7f37c3a-b1cf-4309-a9f7-6db2ba2b34b5","orderName":"2025 Test Order","status":"waiting_sizes","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":"2025-10-23","manufacturerId":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-17T03:56:12.683Z","updatedAt":"2025-10-17T04:00:55.659Z","salespersonName":"Charlie Reeves"}	{"id":35,"orderCode":"O-00017","orgId":22,"leadId":null,"salespersonId":"b7f37c3a-b1cf-4309-a9f7-6db2ba2b34b5","orderName":"2025 Test Order","status":"invoiced","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":"2025-10-23","manufacturerId":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-17T03:56:12.683Z","updatedAt":"2025-10-17T04:00:58.921Z"}	2025-10-17 04:00:58.949269
195	41090967	order	35	updated	{"id":35,"orderCode":"O-00017","orgId":22,"leadId":null,"salespersonId":"b7f37c3a-b1cf-4309-a9f7-6db2ba2b34b5","orderName":"2025 Test Order","status":"invoiced","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":"2025-10-23","manufacturerId":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-17T03:56:12.683Z","updatedAt":"2025-10-17T04:00:58.921Z","salespersonName":"Charlie Reeves"}	{"id":35,"orderCode":"O-00017","orgId":22,"leadId":null,"salespersonId":"b7f37c3a-b1cf-4309-a9f7-6db2ba2b34b5","orderName":"2025 Test Order","status":"production","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":"2025-10-23","manufacturerId":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-17T03:56:12.683Z","updatedAt":"2025-10-17T04:01:01.206Z"}	2025-10-17 04:01:01.235355
196	41090967	order_line_item	42	updated	\N	{"id":42,"orderId":35,"variantId":23,"itemName":"E2E Product ZaXE-d - VAR-pi7VWP (Red)","colorNotes":"Red","imageUrl":"/public-objects/products/2025/10/img_1760676290757_fzvcu1","yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":2,"m":0,"l":0,"xl":2,"xxl":0,"xxxl":0,"unitPrice":"29.99","qtyTotal":4,"lineTotal":"119.96","notes":null,"createdAt":"2025-10-17T03:56:12.683Z","updatedAt":"2025-10-17T04:44:54.946Z"}	2025-10-17 04:44:54.973477
197	qpp8Vz	order	36	created	\N	{"id":36,"orderCode":"O-00018","orgId":36,"leadId":null,"salespersonId":"qpp8Vz","orderName":"Test Order 8RItHu","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":null,"manufacturerId":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-17T05:23:46.518Z","updatedAt":"2025-10-17T05:23:46.518Z","lineItems":[{"id":44,"orderId":36,"variantId":24,"itemName":"Test Product EAiNyP - VAR-18QKZY (Red)","colorNotes":"Red","imageUrl":null,"yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":0,"m":1,"l":0,"xl":0,"xxl":0,"xxxl":0,"unitPrice":"0.00","qtyTotal":1,"lineTotal":"0.00","notes":null,"createdAt":"2025-10-17T05:23:46.518Z","updatedAt":"2025-10-17T05:23:46.518Z"}]}	2025-10-17 05:23:46.735609
198	qpp8Vz	order_line_item	44	updated	\N	{"id":44,"orderId":36,"variantId":24,"itemName":"Test Custom Item SEiz_g","colorNotes":"Red","imageUrl":null,"yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":0,"m":1,"l":0,"xl":0,"xxl":0,"xxxl":0,"unitPrice":"0.00","qtyTotal":1,"lineTotal":"0.00","notes":null,"createdAt":"2025-10-17T05:23:46.518Z","updatedAt":"2025-10-17T05:24:46.236Z"}	2025-10-17 05:24:46.284099
199	8d2HSy	order	37	created	\N	{"id":37,"orderCode":"O-00019","orgId":36,"leadId":null,"salespersonId":"8d2HSy","orderName":"Custom Test Order zIP8pJ","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":null,"manufacturerId":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-17T05:30:33.223Z","updatedAt":"2025-10-17T05:30:33.223Z","lineItems":[{"id":45,"orderId":37,"variantId":24,"itemName":"Test Product EAiNyP - VAR-18QKZY (Red)","colorNotes":"Red","imageUrl":null,"yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":0,"m":1,"l":0,"xl":0,"xxl":0,"xxxl":0,"unitPrice":"0.00","qtyTotal":1,"lineTotal":"0.00","notes":null,"createdAt":"2025-10-17T05:30:33.223Z","updatedAt":"2025-10-17T05:30:33.223Z"}]}	2025-10-17 05:30:33.438694
200	8d2HSy	order_line_item	45	updated	\N	{"id":45,"orderId":37,"variantId":24,"itemName":"Custom Test Item 3WEXfH","colorNotes":"Red","imageUrl":null,"yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":0,"m":1,"l":0,"xl":0,"xxl":0,"xxxl":0,"unitPrice":"0.00","qtyTotal":1,"lineTotal":"0.00","notes":null,"createdAt":"2025-10-17T05:30:33.223Z","updatedAt":"2025-10-17T05:33:16.740Z"}	2025-10-17 05:33:16.804715
201	41090967	manufacturing_update	10	created	\N	{"id":10,"manufacturingId":14,"orderId":35,"status":"pending","notes":"Initial manufacturing update created","updatedBy":"41090967","manufacturerId":null,"productionNotes":null,"qualityNotes":null,"trackingNumber":null,"estimatedCompletion":null,"actualCompletionDate":null,"specialInstructions":null,"attachmentUrls":null,"progressPercentage":0,"createdAt":"2025-10-17T05:41:37.317Z","updatedAt":"2025-10-17T05:41:37.317Z"}	2025-10-17 05:41:37.405479
202	41090967	manufacturing_attachment	1	created	\N	{"id":1,"manufacturingId":14,"batchId":null,"qualityCheckpointId":null,"fileName":"71y38JJuSSL.jpg","fileType":"image/jpeg","fileSize":161112,"fileUrl":"/public-objects/products/2025/10/img_1760680834315_wjmrgx","uploadedBy":"41090967","description":null,"category":"logos","isPublic":false,"createdAt":"2025-10-17T06:00:34.901Z","updatedAt":"2025-10-17T06:00:34.901Z"}	2025-10-17 06:00:34.921644
203	laird-sales-test	organization	37	created	\N	{"id":37,"name":"Test Org for Laird","sports":"Football","city":"Test City","state":"","shippingAddress":"","notes":"","logoUrl":null,"territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-10-21T21:53:09.910Z","updatedAt":"2025-10-21T21:53:09.910Z"}	2025-10-21 21:53:09.936096
204	laird-sales-test	lead	11	created	\N	{"id":11,"leadCode":"L-00008","orgId":37,"contactId":null,"ownerUserId":"laird-sales-test","stage":"future_lead","source":"website","notes":"","claimedAt":null,"score":50,"archived":false,"archivedAt":null,"archivedBy":null,"createdAt":"2025-10-21T21:56:53.690Z","updatedAt":"2025-10-21T21:56:53.690Z"}	2025-10-21 21:56:53.715123
205	laird-sales-test	organization	37	updated	{"id":37,"name":"Test Org for Laird","sports":"Football","city":"Test City","state":"","shippingAddress":"","notes":"","logoUrl":null,"territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-10-21T21:53:09.910Z","updatedAt":"2025-10-21T21:53:09.910Z"}	{"id":37,"name":"Test Org for Laird","sports":"Football","city":"Test City","state":"","shippingAddress":"Edited by Laird at 2025-10-21T22:00:47.120Z","notes":"","logoUrl":null,"territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-10-21T21:53:09.910Z","updatedAt":"2025-10-21T22:00:51.678Z"}	2025-10-21 22:00:51.70887
206	jacA_A	organization	37	updated	{"id":37,"name":"Test Org for Laird","sports":"Football","city":"Test City","state":"","shippingAddress":"Test Address Value","notes":"Test Notes Value","logoUrl":null,"territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-10-21T21:53:09.910Z","updatedAt":"2025-10-21T22:00:51.678Z"}	{"id":37,"name":"Test Org for Laird","sports":"Football","city":"Test City","state":"","shippingAddress":"UNIQUE_ADDRESS_TEST_p2p9ux7p","notes":"UNIQUE_NOTES_TEST_BQ2JaQtq","logoUrl":null,"territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-10-21T21:53:09.910Z","updatedAt":"2025-10-21T22:12:07.819Z"}	2025-10-21 22:12:07.850865
207	Ly4-z1	organization	38	created	\N	{"id":38,"name":"Test Sales Org _I5x6W","sports":"","city":"Test City","state":"TS","shippingAddress":"","notes":"","logoUrl":null,"territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-10-22T04:49:22.555Z","updatedAt":"2025-10-22T04:49:22.555Z"}	2025-10-22 04:49:22.580578
208	UvMMXN	order	38	created	\N	{"id":38,"orderCode":"O-00020","orgId":38,"leadId":null,"salespersonId":"UvMMXN","orderName":"Automated Test Order 1","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":null,"manufacturerId":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-30T03:32:13.176Z","updatedAt":"2025-10-30T03:32:13.176Z","lineItems":[{"id":46,"orderId":38,"variantId":24,"itemName":"Test Product EAiNyP - VAR-18QKZY (Red)","colorNotes":"Red","imageUrl":null,"yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":0,"m":1,"l":0,"xl":0,"xxl":0,"xxxl":0,"unitPrice":"0.00","qtyTotal":1,"lineTotal":"0.00","notes":null,"createdAt":"2025-10-30T03:32:13.176Z","updatedAt":"2025-10-30T03:32:13.176Z"}]}	2025-10-30 03:32:13.39347
209	UvMMXN	order	38	tracking_added	\N	{"id":1,"orderId":38,"trackingNumber":"TEST-TRACK-001","carrierCompany":"UPS","createdAt":"2025-10-30T03:33:12.255Z"}	2025-10-30 03:33:12.278997
210	UvMMXN	order	38	tracking_added	\N	{"id":2,"orderId":38,"trackingNumber":"TEST-TRACK-002","carrierCompany":"FedEx","createdAt":"2025-10-30T03:33:56.481Z"}	2025-10-30 03:33:56.502726
211	9XVdOb	order	39	created	\N	{"id":39,"orderCode":"O-00021","orgId":38,"leadId":null,"salespersonId":"9XVdOb","orderName":"TEST Order for Tracking","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":null,"manufacturerId":null,"trackingNumber":null,"priority":"normal","createdAt":"2025-10-30T03:38:37.926Z","updatedAt":"2025-10-30T03:38:37.926Z","lineItems":[{"id":47,"orderId":39,"variantId":24,"itemName":"Test Product EAiNyP - VAR-18QKZY (Red)","colorNotes":"Red","imageUrl":null,"yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":0,"m":1,"l":0,"xl":0,"xxl":0,"xxxl":0,"unitPrice":"0.00","qtyTotal":1,"lineTotal":"0.00","notes":null,"createdAt":"2025-10-30T03:38:37.926Z","updatedAt":"2025-10-30T03:38:37.926Z"}]}	2025-10-30 03:38:38.180567
212	9XVdOb	order	39	tracking_added	\N	{"id":3,"orderId":39,"trackingNumber":"TEST-TRACK-100","carrierCompany":"UPS Test","createdAt":"2025-10-30T03:39:21.030Z"}	2025-10-30 03:39:21.051193
213	9XVdOb	order	39	tracking_added	\N	{"id":4,"orderId":39,"trackingNumber":"TEST-TRACK-200","carrierCompany":"FedEx Test","createdAt":"2025-10-30T03:40:13.223Z"}	2025-10-30 03:40:13.242932
214	41090967	organization	38	updated	{"id":38,"name":"Test Sales Org _I5x6W","sports":"","city":"Test City","state":"TS","shippingAddress":"","notes":"","logoUrl":null,"territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-10-22T04:49:22.555Z","updatedAt":"2025-10-22T04:49:22.555Z"}	{"id":38,"name":"Test Sales Org _I5x6W","sports":"","city":"Test City","state":"TS","shippingAddress":"","notes":"","logoUrl":"/public-objects/products/2025/10/img_1761938645300_cach7r","territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-10-22T04:49:22.555Z","updatedAt":"2025-10-31T19:24:09.062Z"}	2025-10-31 19:24:09.09594
215	41090967	design_job	25	updated	{"id":25,"jobCode":"DJ-00004","orgId":34,"leadId":null,"orderId":null,"salespersonId":null,"brief":"Test design job with attachments","requirements":"","urgency":"normal","status":"pending","assignedDesignerId":null,"renditionCount":0,"renditionUrls":null,"renditionMockupUrl":null,"renditionProductionUrl":null,"finalLink":null,"referenceFiles":null,"deadline":null,"priority":"normal","internalNotes":"","clientFeedback":null,"logoUrls":null,"designReferenceUrls":null,"additionalFileUrls":null,"designStyleUrl":null,"archived":false,"archivedAt":null,"statusChangedAt":"2025-10-16T05:06:36.674Z","createdAt":"2025-10-16T05:06:36.674Z","updatedAt":"2025-10-16T05:06:36.674Z","organization":{"id":34,"name":"Test Org","sports":"","city":"","state":"","shippingAddress":"","notes":"","logoUrl":"/public-objects/products/2025/10/img_1760545765639_svg4yl","territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"createdAt":"2025-10-13T02:00:43.638Z","updatedAt":"2025-10-15T16:29:32.575Z"}}	{"id":25,"jobCode":"DJ-00004","orgId":34,"leadId":null,"orderId":null,"salespersonId":null,"brief":"Test design job with attachments","requirements":"","urgency":"normal","status":"pending","assignedDesignerId":null,"renditionCount":0,"renditionUrls":null,"renditionMockupUrl":null,"renditionProductionUrl":null,"finalLink":null,"referenceFiles":null,"deadline":null,"priority":"normal","internalNotes":"","clientFeedback":"","logoUrls":["/public-objects/products/2025/11/img_1762286957088_xbcvli"],"designReferenceUrls":null,"additionalFileUrls":null,"designStyleUrl":null,"archived":false,"archivedAt":null,"statusChangedAt":"2025-11-04T20:09:22.817Z","createdAt":"2025-10-16T05:06:36.674Z","updatedAt":"2025-11-04T20:09:22.817Z"}	2025-11-04 20:09:22.853092
216	41090967	team_store	1	created	\N	{"id":1,"storeCode":"TS-1762295124354","customerName":"ddd","storeName":"Image Sync Test Org OfRgCA Team Store","orderId":37,"orgId":null,"salespersonId":null,"stage":"Team Store Pending","status":"pending","storeOpenDate":"2025-10-30","storeCloseDate":"2025-12-03","notes":"","specialInstructions":"","archived":false,"archivedAt":null,"archivedBy":null,"createdAt":"2025-11-04T22:25:24.363Z","updatedAt":"2025-11-04T22:25:24.363Z"}	2025-11-04 22:25:24.385389
217	41090967	team_store	1	refreshed_line_items	\N	{"updatedCount":0,"createdCount":1}	2025-11-04 22:25:27.96529
218	test-user-BDEgqO	quote	11	created	\N	{"id":11,"quoteCode":"Q-1762814103673-O8VUS","orgId":38,"contactId":null,"salespersonId":"test-user-BDEgqO","quoteName":"Test Quote Kcnsx_","status":"draft","validUntil":null,"subtotal":"157.49","taxRate":"0.0875","taxAmount":"12.91","total":"160.40","discount":"10.00","customerAddress":"","customerShippingAddress":"","notes":"","internalNotes":null,"termsAndConditions":null,"createdAt":"2025-11-10T22:35:04.034Z","updatedAt":"2025-11-10T22:35:04.188Z"}	2025-11-10 22:35:04.234698
219	test-user-BDEgqO	quote	12	created	\N	{"id":12,"quoteCode":"Q-1762814542170-CXVDU","orgId":38,"contactId":null,"salespersonId":"test-user-BDEgqO","quoteName":"Test Quote xCmuHF","status":"draft","validUntil":null,"subtotal":"157.49","taxRate":"0.0875","taxAmount":"12.91","total":"160.40","discount":"10.00","customerAddress":"","customerShippingAddress":"","notes":"","internalNotes":null,"termsAndConditions":null,"createdAt":"2025-11-10T22:42:22.347Z","updatedAt":"2025-11-10T22:42:22.437Z"}	2025-11-10 22:42:22.481673
220	test-user-BDEgqO	quote	12	updated	{"id":12,"quoteCode":"Q-1762814542170-CXVDU","orgId":38,"contactId":null,"salespersonId":"test-user-BDEgqO","quoteName":"Test Quote xCmuHF","status":"draft","validUntil":null,"subtotal":"157.49","taxRate":"0.0875","taxAmount":"12.91","total":"160.40","discount":"10.00","customerAddress":"","customerShippingAddress":"","notes":"","internalNotes":null,"termsAndConditions":null,"createdAt":"2025-11-10T22:42:22.347Z","updatedAt":"2025-11-10T22:42:22.437Z"}	{"id":12,"quoteCode":"Q-1762814542170-CXVDU","orgId":38,"contactId":null,"salespersonId":"test-user-BDEgqO","quoteName":"Test Quote xCmuHF","status":"draft","validUntil":null,"subtotal":"157.49","taxRate":"0.0875","taxAmount":"12.91","total":"160.40","discount":"10.00","customerAddress":"","customerShippingAddress":"","notes":"","internalNotes":"","termsAndConditions":"","createdAt":"2025-11-10T22:42:22.347Z","updatedAt":"2025-11-10T22:44:28.845Z"}	2025-11-10 22:44:28.885555
221	test-user-BDEgqO	quote	13	created	\N	{"id":13,"quoteCode":"Q-1762815024123-LCDNV","orgId":38,"contactId":null,"salespersonId":"test-user-BDEgqO","quoteName":"Final Test dsIZK-","status":"draft","validUntil":null,"subtotal":"157.49","taxRate":"0.0875","taxAmount":"12.91","total":"160.40","discount":"10.00","customerAddress":"","customerShippingAddress":"","notes":"","internalNotes":null,"termsAndConditions":null,"createdAt":"2025-11-10T22:50:24.467Z","updatedAt":"2025-11-10T22:50:24.549Z"}	2025-11-10 22:50:24.593938
222	test-user-BDEgqO	quote	13	updated	{"id":13,"quoteCode":"Q-1762815024123-LCDNV","orgId":38,"contactId":null,"salespersonId":"test-user-BDEgqO","quoteName":"Final Test dsIZK-","status":"draft","validUntil":null,"subtotal":"157.49","taxRate":"0.0875","taxAmount":"12.91","total":"160.40","discount":"10.00","customerAddress":"","customerShippingAddress":"","notes":"","internalNotes":null,"termsAndConditions":null,"createdAt":"2025-11-10T22:50:24.467Z","updatedAt":"2025-11-10T22:50:24.549Z"}	{"id":13,"quoteCode":"Q-1762815024123-LCDNV","orgId":38,"contactId":null,"salespersonId":"test-user-BDEgqO","quoteName":"Final Test dsIZK-","status":"draft","validUntil":null,"subtotal":"157.49","taxRate":"0.0875","taxAmount":"12.91","total":"160.40","discount":"10.00","customerAddress":"","customerShippingAddress":"","notes":"","internalNotes":"","termsAndConditions":"","createdAt":"2025-11-10T22:50:24.467Z","updatedAt":"2025-11-10T22:51:59.084Z"}	2025-11-10 22:51:59.12242
223	test-admin-automated-auth	contact	13	created	\N	{"id":13,"orgId":null,"name":"Test Contact for Deletion 6Hgxug","email":"delete-test-6Hgxug@example.com","phone":null,"roleTitle":null,"role":"customer","isPrimary":false,"imageUrl":null,"createdAt":"2025-11-11T17:40:08.256Z","updatedAt":"2025-11-11T17:40:08.256Z"}	2025-11-11 17:40:08.29439
224	test-admin-automated-auth	contact	13	deleted	{"id":13,"orgId":null,"name":"Test Contact for Deletion 6Hgxug","email":"delete-test-6Hgxug@example.com","phone":null,"roleTitle":null,"role":"customer","isPrimary":false,"imageUrl":null,"createdAt":"2025-11-11T17:40:08.256Z","updatedAt":"2025-11-11T17:40:08.256Z"}	\N	2025-11-11 17:43:05.641829
225	41090967	user	960582432	created	\N	{"id":"3f35cb86-89b4-4359-a87a-4da43fd2eb96","email":"testmanu@rich-habits.com","firstName":"Test","lastName":"Manufacturing","profileImageUrl":null,"name":"TM Test","role":"manufacturer","passwordHash":"$2b$10$nxYGDWilDM3192qeHxs53uWSD8SEcwihSxs5NNkWNOTxQW2YFtjJe","isActive":true,"phone":"","active":true,"avatarUrl":null,"isInvited":false,"hasCompletedSetup":false,"invitedAt":null,"invitedBy":null,"createdAt":"2025-11-14T19:16:39.360Z","updatedAt":"2025-11-14T19:16:39.360Z"}	2025-11-14 19:16:39.389729
226	i37Vjf	organization	38	updated	{"id":38,"name":"Test Sales Org _I5x6W","sports":"","city":"Test City","state":"TS","shippingAddress":"","notes":"","logoUrl":"/public-objects/products/2025/10/img_1761938645300_cach7r","territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"brandPrimaryColor":null,"brandSecondaryColor":null,"brandPantoneCode":null,"brandGuidelinesUrl":null,"archived":false,"archivedAt":null,"archivedBy":null,"createdAt":"2025-10-22T04:49:22.555Z","updatedAt":"2025-10-31T19:24:09.062Z"}	{"id":38,"name":"Test Sales Org _I5x6W","sports":"","city":"Test City","state":"TS","shippingAddress":"","notes":"","logoUrl":"/public-objects/products/2025/10/img_1761938645300_cach7r","territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"brandPrimaryColor":"#FF5733","brandSecondaryColor":"#3366FF","brandPantoneCode":"123C","brandGuidelinesUrl":"https://example.com/guidelines.pdf","archived":false,"archivedAt":null,"archivedBy":null,"createdAt":"2025-10-22T04:49:22.555Z","updatedAt":"2025-11-16T05:49:34.099Z"}	2025-11-16 05:49:34.129838
227	zweyLM	organization	38	updated	{"id":38,"name":"Test Sales Org _I5x6W","sports":"","city":"Test City","state":"TS","shippingAddress":"","notes":"","logoUrl":"/public-objects/products/2025/10/img_1761938645300_cach7r","territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"brandPrimaryColor":"#FF5733","brandSecondaryColor":"#3366FF","brandPantoneCode":"123C","brandGuidelinesUrl":"https://example.com/guidelines.pdf","archived":false,"archivedAt":null,"archivedBy":null,"createdAt":"2025-10-22T04:49:22.555Z","updatedAt":"2025-11-16T05:49:34.099Z"}	{"id":38,"name":"Test Sales Org _I5x6W","sports":"","city":"Test City","state":"TS","shippingAddress":"","notes":"","logoUrl":"/public-objects/products/2025/10/img_1761938645300_cach7r","territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"brandPrimaryColor":"#FF5733","brandSecondaryColor":"#3366FF","brandPantoneCode":"123C","brandGuidelinesUrl":"https://example.com/guidelines","archived":false,"archivedAt":null,"archivedBy":null,"createdAt":"2025-10-22T04:49:22.555Z","updatedAt":"2025-11-16T06:01:17.064Z"}	2025-11-16 06:01:17.098333
228	41090967	order	15	updated	{"id":15,"orderCode":"O-00001","orgId":27,"leadId":null,"salespersonId":"0c17b360-653e-4581-9444-d21613863b48","orderName":"Homewood","status":"waiting_sizes","designApproved":true,"sizesValidated":true,"depositReceived":true,"invoiceUrl":"","orderFolder":"","sizeFormLink":"","estDelivery":"2025-10-01","manufacturerId":null,"trackingNumber":"","priority":"normal","shippingAddress":null,"billToAddress":null,"contactName":null,"contactEmail":null,"contactPhone":null,"createdAt":"2025-09-30T19:23:09.470Z","updatedAt":"2025-10-03T15:50:18.448Z","salespersonName":"KG"}	{"id":15,"orderCode":"O-00001","orgId":27,"leadId":null,"salespersonId":"0c17b360-653e-4581-9444-d21613863b48","orderName":"Homewood","status":"invoiced","designApproved":true,"sizesValidated":true,"depositReceived":true,"invoiceUrl":"","orderFolder":"","sizeFormLink":"","estDelivery":"2025-10-01","manufacturerId":null,"trackingNumber":"","priority":"normal","shippingAddress":null,"billToAddress":null,"contactName":null,"contactEmail":null,"contactPhone":null,"createdAt":"2025-09-30T19:23:09.470Z","updatedAt":"2025-11-16T06:20:59.525Z"}	2025-11-16 06:20:59.563473
229	41090967	order	15	updated	{"id":15,"orderCode":"O-00001","orgId":27,"leadId":null,"salespersonId":"0c17b360-653e-4581-9444-d21613863b48","orderName":"Homewood","status":"invoiced","designApproved":true,"sizesValidated":true,"depositReceived":true,"invoiceUrl":"","orderFolder":"","sizeFormLink":"","estDelivery":"2025-10-01","manufacturerId":null,"trackingNumber":"","priority":"normal","shippingAddress":null,"billToAddress":null,"contactName":null,"contactEmail":null,"contactPhone":null,"createdAt":"2025-09-30T19:23:09.470Z","updatedAt":"2025-11-16T06:20:59.525Z","salespersonName":"KG"}	{"id":15,"orderCode":"O-00001","orgId":27,"leadId":null,"salespersonId":"0c17b360-653e-4581-9444-d21613863b48","orderName":"Homewood","status":"production","designApproved":true,"sizesValidated":true,"depositReceived":true,"invoiceUrl":"","orderFolder":"","sizeFormLink":"","estDelivery":"2025-10-01","manufacturerId":null,"trackingNumber":"","priority":"normal","shippingAddress":null,"billToAddress":null,"contactName":null,"contactEmail":null,"contactPhone":null,"createdAt":"2025-09-30T19:23:09.470Z","updatedAt":"2025-11-16T06:21:17.360Z"}	2025-11-16 06:21:17.387156
230	41090967	order	39	updated	{"id":39,"orderCode":"O-00021","orgId":38,"leadId":null,"salespersonId":"9XVdOb","orderName":"TEST Order for Tracking","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":null,"manufacturerId":null,"trackingNumber":null,"priority":"normal","shippingAddress":null,"billToAddress":null,"contactName":null,"contactEmail":null,"contactPhone":null,"createdAt":"2025-10-30T03:38:37.926Z","updatedAt":"2025-10-30T03:38:37.926Z","salespersonName":"Operations Ops"}	{"id":39,"orderCode":"O-00021","orgId":38,"leadId":null,"salespersonId":"9XVdOb","orderName":"TEST Order for Tracking","status":"new","designApproved":true,"sizesValidated":false,"depositReceived":false,"invoiceUrl":"","orderFolder":"","sizeFormLink":null,"estDelivery":null,"manufacturerId":null,"trackingNumber":"","priority":"normal","shippingAddress":null,"billToAddress":null,"contactName":null,"contactEmail":null,"contactPhone":null,"createdAt":"2025-10-30T03:38:37.926Z","updatedAt":"2025-11-19T01:30:11.225Z"}	2025-11-19 01:30:11.25795
231	41090967	manufacturing_update	11	created	\N	\N	2025-11-19 20:06:08.376064
232	41090967	manufacturing_update	10	refreshed_line_items	\N	\N	2025-11-19 20:52:47.672424
233	41090967	manufacturing_update	10	refreshed_line_items	\N	\N	2025-11-19 20:58:25.768846
234	41090967	manufacturing_update	10	updated	\N	\N	2025-11-19 20:58:30.17215
235	41090967	manufacturing_update	10	updated	\N	\N	2025-11-19 20:58:38.04746
236	41090967	order	42	created	\N	{"id":42,"orderCode":"O-00022","orgId":37,"leadId":null,"salespersonId":"dee15298-a714-408c-bacd-09a9e1af5b68","orderName":"Skull and Crossbones Singlet Order, 2025","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":"2025-12-04","manufacturerId":null,"trackingNumber":null,"priority":"normal","shippingAddress":null,"billToAddress":null,"contactName":null,"contactEmail":null,"contactPhone":null,"createdAt":"2025-11-24T07:15:14.765Z","updatedAt":"2025-11-24T07:15:14.765Z","lineItems":[{"id":48,"orderId":42,"variantId":22,"itemName":"Classic T-Shirt - VAR-TEST","colorNotes":null,"imageUrl":null,"yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":0,"m":0,"l":2,"xl":0,"xxl":0,"xxxl":0,"xxxxl":0,"unitPrice":"19.99","qtyTotal":2,"lineTotal":"39.98","notes":null,"createdAt":"2025-11-24T07:15:14.765Z","updatedAt":"2025-11-24T07:15:14.765Z"}]}	2025-11-24 07:15:14.979044
237	test-user	order	31	tracking_added	\N	{"id":5,"orderId":31,"trackingNumber":"1Z999AA10123456784","carrierCompany":"UPS","trackingNotes":null,"createdAt":"2025-11-24T17:37:57.919Z"}	2025-11-24 17:37:57.991326
238	41090967	manufacturing_update	10	refreshed_line_items	\N	{"updatedCount":2,"createdCount":0}	2025-11-26 02:15:02.917986
239	41090967	manufacturing	13	updated	{"id":13,"orderId":31,"status":"awaiting_admin_confirmation","assignedTo":null,"manufacturerId":null,"startDate":null,"estCompletion":null,"actualCompletion":null,"qcNotes":null,"trackingNumber":null,"batchNumber":null,"batchSize":1,"priority":"normal","specialInstructions":null,"productionNotes":"Auto-created when order moved to production","qualityNotes":null,"attachmentUrls":null,"estimatedHours":null,"actualHours":null,"scheduledStartDate":null,"scheduledEndDate":null,"archived":false,"archivedAt":null,"archivedBy":null,"completedProductImages":null,"createdAt":"2025-10-16T13:42:43.234Z","updatedAt":"2025-11-19T20:06:08.325Z","order":{"id":31,"orderCode":"O-00013","orgId":34,"leadId":null,"salespersonId":"test-user","orderName":"E2E Test Order 1760560104156","status":"production","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":null,"manufacturerId":null,"trackingNumber":null,"priority":"normal","shippingAddress":null,"billToAddress":null,"contactName":null,"contactEmail":null,"contactPhone":null,"createdAt":"2025-10-15T20:32:28.901Z","updatedAt":"2025-10-16T13:42:43.249Z"}}	{"id":13,"orderId":31,"status":"confirmed_awaiting_manufacturing","assignedTo":null,"manufacturerId":null,"startDate":null,"estCompletion":null,"actualCompletion":null,"qcNotes":null,"trackingNumber":"","batchNumber":null,"batchSize":1,"priority":"normal","specialInstructions":null,"productionNotes":"Auto-created when order moved to production","qualityNotes":"","attachmentUrls":null,"estimatedHours":null,"actualHours":null,"scheduledStartDate":null,"scheduledEndDate":null,"archived":false,"archivedAt":null,"archivedBy":null,"completedProductImages":null,"createdAt":"2025-10-16T13:42:43.234Z","updatedAt":"2025-11-29T21:33:08.628Z"}	2025-11-29 21:33:08.764262
240	41090967	order_line_item	49	created	\N	{"id":49,"orderId":36,"variantId":13,"itemName":"Shorts","colorNotes":"","imageUrl":null,"yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":0,"m":0,"l":0,"xl":0,"xxl":0,"xxxl":0,"xxxxl":0,"unitPrice":"20.00","qtyTotal":0,"lineTotal":"0.00","notes":"","createdAt":"2025-12-01T02:39:02.425Z","updatedAt":"2025-12-01T02:39:02.425Z"}	2025-12-01 02:39:02.483993
241	41090967	order_line_item	50	created	\N	{"id":50,"orderId":42,"variantId":6,"itemName":"Performance Wrestling Singlet - SINGLET-RH","colorNotes":"","imageUrl":null,"yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":0,"m":0,"l":0,"xl":0,"xxl":0,"xxxl":0,"xxxxl":0,"unitPrice":"50.00","qtyTotal":0,"lineTotal":"0.00","notes":"","createdAt":"2025-12-01T02:51:29.706Z","updatedAt":"2025-12-01T02:51:29.706Z"}	2025-12-01 02:51:29.744327
242	41090967	order_line_item	51	created	\N	{"id":51,"orderId":42,"variantId":6,"itemName":"Performance Wrestling Singlet - SINGLET-RH","colorNotes":"","imageUrl":null,"yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":0,"m":0,"l":0,"xl":0,"xxl":0,"xxxl":0,"xxxxl":0,"unitPrice":"50.00","qtyTotal":0,"lineTotal":"0.00","notes":"","createdAt":"2025-12-01T02:58:22.513Z","updatedAt":"2025-12-01T02:58:22.513Z"}	2025-12-01 02:58:22.57188
243	41090967	order_line_item	52	created	\N	{"id":52,"orderId":42,"variantId":6,"itemName":"Performance Wrestling Singlet - SINGLET-RH","colorNotes":"","imageUrl":null,"yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":0,"m":0,"l":0,"xl":0,"xxl":0,"xxxl":0,"xxxxl":0,"unitPrice":"50.00","qtyTotal":0,"lineTotal":"0.00","notes":"","createdAt":"2025-12-01T03:02:10.442Z","updatedAt":"2025-12-01T03:02:10.442Z"}	2025-12-01 03:02:10.481247
244	41090967	order_line_item	53	created	\N	{"id":53,"orderId":42,"variantId":6,"itemName":"Performance Wrestling Singlet - SINGLET-RH","colorNotes":"","imageUrl":null,"yxs":0,"ys":0,"ym":0,"yl":0,"xs":0,"s":0,"m":0,"l":0,"xl":0,"xxl":0,"xxxl":0,"xxxxl":0,"unitPrice":"50.00","qtyTotal":0,"lineTotal":"0.00","notes":"","createdAt":"2025-12-01T03:07:17.609Z","updatedAt":"2025-12-01T03:07:17.609Z"}	2025-12-01 03:07:17.668631
245	41090967	manufacturing	9	updated	{"id":9,"orderId":16,"status":"awaiting_admin_confirmation","assignedTo":null,"manufacturerId":null,"startDate":null,"estCompletion":"2025-11-11","actualCompletion":null,"qcNotes":null,"trackingNumber":"","batchNumber":null,"batchSize":1,"priority":"normal","specialInstructions":"Created by automated test","productionNotes":"","qualityNotes":"","attachmentUrls":null,"estimatedHours":null,"actualHours":null,"scheduledStartDate":null,"scheduledEndDate":null,"archived":false,"archivedAt":null,"archivedBy":null,"completedProductImages":null,"createdAt":"2025-10-12T00:31:33.978Z","updatedAt":"2025-10-16T19:50:33.737Z","order":{"id":16,"orderCode":"O-00002","orgId":26,"leadId":null,"salespersonId":"dee15298-a714-408c-bacd-09a9e1af5b68","orderName":"Homewood","status":"new","designApproved":false,"sizesValidated":false,"depositReceived":false,"invoiceUrl":null,"orderFolder":null,"sizeFormLink":null,"estDelivery":"2025-09-30","manufacturerId":null,"trackingNumber":null,"priority":"normal","shippingAddress":"Another Location\\n456 New Street\\nNew City, NC 67890\\nUSA","billToAddress":null,"contactName":"Test Customer Updated","contactEmail":"testcustomer@example.com","contactPhone":"(555) 999-8888","createdAt":"2025-09-30T20:06:04.642Z","updatedAt":"2025-12-03T06:39:34.872Z"}}	{"id":9,"orderId":16,"status":"confirmed_awaiting_manufacturing","assignedTo":null,"manufacturerId":null,"startDate":null,"estCompletion":"2025-11-11","actualCompletion":null,"qcNotes":null,"trackingNumber":"","batchNumber":null,"batchSize":1,"priority":"normal","specialInstructions":"Created by automated test","productionNotes":"","qualityNotes":"","attachmentUrls":null,"estimatedHours":null,"actualHours":null,"scheduledStartDate":null,"scheduledEndDate":null,"archived":false,"archivedAt":null,"archivedBy":null,"completedProductImages":null,"createdAt":"2025-10-12T00:31:33.978Z","updatedAt":"2025-12-04T21:19:48.396Z"}	2025-12-04 21:19:48.503665
246	41090967	manufacturing_update	12	refreshed_line_items	\N	{"updatedCount":0,"createdCount":1}	2025-12-09 22:17:54.110905
247	41090967	manufacturing_update	14	created	\N	{"id":14,"manufacturingId":8,"orderId":26,"status":"awaiting_admin_confirmation","notes":"Initial manufacturing update created","updatedBy":"41090967","manufacturerId":null,"productionNotes":null,"qualityNotes":null,"trackingNumber":null,"estimatedCompletion":null,"actualCompletionDate":null,"specialInstructions":null,"attachmentUrls":null,"progressPercentage":0,"createdAt":"2025-12-09T22:18:23.921Z","updatedAt":"2025-12-09T22:18:23.921Z"}	2025-12-09 22:18:23.985612
248	41090967	manufacturing_update	14	refreshed_line_items	\N	{"updatedCount":0,"createdCount":1}	2025-12-09 22:18:26.546678
249	41090967	manufacturing_update	10	refreshed_line_items	\N	{"updatedCount":2,"createdCount":0}	2025-12-09 22:18:32.974775
250	41090967	design_job	25	updated	{"id":25,"jobCode":"DJ-00004","orgId":34,"leadId":null,"orderId":null,"salespersonId":null,"brief":"Test design job with attachments","requirements":"","urgency":"normal","status":"pending","assignedDesignerId":null,"renditionCount":0,"renditionUrls":null,"renditionMockupUrl":null,"renditionProductionUrl":null,"finalLink":null,"referenceFiles":null,"deadline":null,"priority":"normal","internalNotes":"","clientFeedback":"","logoUrls":["/public-objects/products/2025/11/img_1762286957088_xbcvli"],"designReferenceUrls":null,"additionalFileUrls":null,"designStyleUrl":null,"finalDesignUrls":null,"archived":false,"archivedAt":null,"statusChangedAt":"2025-11-04T20:09:22.817Z","createdAt":"2025-10-16T05:06:36.674Z","updatedAt":"2025-11-04T20:09:22.817Z","organization":{"id":34,"name":"Test Org","sports":"","city":"","state":null,"shippingAddress":"","notes":"","logoUrl":"/public-objects/products/2025/10/img_1760545765639_svg4yl","territory":null,"clientType":null,"annualVolume":null,"preferredSalespersonId":null,"brandPrimaryColor":null,"brandSecondaryColor":null,"brandPantoneCode":null,"brandGuidelinesUrl":null,"archived":false,"archivedAt":null,"archivedBy":null,"createdAt":"2025-10-13T02:00:43.638Z","updatedAt":"2025-10-15T16:29:32.575Z"}}	{"id":25,"jobCode":"DJ-00004","orgId":34,"leadId":null,"orderId":null,"salespersonId":null,"brief":"Test design job with attachments","requirements":"","urgency":"normal","status":"pending","assignedDesignerId":null,"renditionCount":0,"renditionUrls":null,"renditionMockupUrl":null,"renditionProductionUrl":null,"finalLink":null,"referenceFiles":null,"deadline":null,"priority":"normal","internalNotes":"","clientFeedback":"","logoUrls":["/public-objects/products/2025/11/img_1762286957088_xbcvli"],"designReferenceUrls":["/public-objects/products/2025/12/img_1765512792393_v62667"],"additionalFileUrls":["/public-objects/products/2025/12/img_1765512784446_4c09pt"],"designStyleUrl":null,"finalDesignUrls":["/public-objects/products/2025/12/img_1765512702151_v2h7m7"],"archived":false,"archivedAt":null,"statusChangedAt":"2025-12-12T04:13:17.825Z","createdAt":"2025-10-16T05:06:36.674Z","updatedAt":"2025-12-12T04:13:17.825Z"}	2025-12-12 04:13:17.858144
251	41090967	manufacturing_update	2	refreshed_line_items	\N	{"updatedCount":0,"createdCount":4}	2025-12-12 10:13:00.66637
\.


ALTER TABLE public.audit_logs ENABLE TRIGGER ALL;

--
-- Data for Name: budgets; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.budgets DISABLE TRIGGER ALL;

COPY public.budgets (id, name, type, period, period_type, total_budget, spent_amount, category_breakdown, status, owner_id, approved_by, approved_at, notes, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.budgets ENABLE TRIGGER ALL;

--
-- Data for Name: commission_payments; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.commission_payments DISABLE TRIGGER ALL;

COPY public.commission_payments (id, salesperson_id, payment_number, payment_date, period, total_amount, payment_method, reference_number, commission_ids, notes, processed_by, created_at, updated_at) FROM stdin;
1	XMOE4G	COM-00001	2025-10-11	2025-10	10.00	check	\N	\N		\N	2025-10-11 19:58:49.731589	2025-10-11 19:58:49.731589
3	sales_test_user	COM-00002	2025-10-11	2025-10	100.00	check	\N	\N		\N	2025-10-11 23:59:09.998119	2025-10-11 23:59:09.998119
\.


ALTER TABLE public.commission_payments ENABLE TRIGGER ALL;

--
-- Data for Name: quotes; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.quotes DISABLE TRIGGER ALL;

COPY public.quotes (id, quote_code, org_id, contact_id, salesperson_id, quote_name, status, valid_until, subtotal, tax_rate, tax_amount, total, discount, notes, internal_notes, terms_and_conditions, created_at, updated_at, customer_address, customer_shipping_address) FROM stdin;
24	QT-SEED-011	47	\N	54c442d2-114e-444d-9832-0eeb719f7bed	Soccer Quote	sent	2026-01-12	2725.00	0.0800	218.00	2943.00	0.00	Quote for Jackson High School - Soccer Quote	\N	\N	2025-12-12 11:40:26.427013	2025-12-12 11:40:26.427013	Atlanta, GA	\N
25	QT-SEED-012	48	\N	54c442d2-114e-444d-9832-0eeb719f7bed	Swimming Team Quote	draft	2026-01-12	1589.00	0.0800	127.12	1716.12	0.00	Quote for Monroe Prep - Swimming Team Quote	\N	\N	2025-12-12 11:40:26.456976	2025-12-12 11:40:26.456976	Miami, FL	\N
9	Q-1759859579263-SDAJI	31	\N	Q6p2py	Test PDF Quote y5o0x_	draft	\N	175.00	0.0875	15.31	190.31	0.00		\N	\N	2025-10-07 17:52:59.377208	2025-10-07 17:52:59.47	\N	\N
10	Q-1759947639150-LCR5H	31	\N	admin-Yjy6Tw	Test Quote lIZNIM	draft	\N	35.00	0.0875	3.06	38.06	0.00		\N	\N	2025-10-08 18:20:39.412785	2025-10-08 18:20:39.512	123 Main St\nApt 4B\nNew York, NY 10001	456 Oak Ave\nSuite 100\nLos Angeles, CA 90001
11	Q-1762814103673-O8VUS	38	\N	test-user-BDEgqO	Test Quote Kcnsx_	draft	\N	157.49	0.0875	12.91	160.40	10.00		\N	\N	2025-11-10 22:35:04.034033	2025-11-10 22:35:04.188		
12	Q-1762814542170-CXVDU	38	\N	test-user-BDEgqO	Test Quote xCmuHF	draft	\N	284.99	0.0875	24.06	299.05	10.00				2025-11-10 22:42:22.347168	2025-11-10 22:44:29.29		
13	Q-1762815024123-LCDNV	38	\N	test-user-BDEgqO	Final Test dsIZK-	draft	\N	539.99	0.0875	46.37	576.36	10.00				2025-11-10 22:50:24.4673	2025-11-10 22:51:59.751		
8	Q-1759771037714-LO9XO	19	\N	\N	Oak Mountain High School Wrestling	expired	2025-10-07	350.00	0.0000	0.00	350.00	0.00		\N	\N	2025-10-06 17:17:18.132322	2025-10-06 17:17:18.251	\N	\N
14	QT-SEED-001	42	\N	54c442d2-114e-444d-9832-0eeb719f7bed	Basketball Season Quote	draft	2026-01-12	2157.00	0.0800	172.56	2329.56	0.00	Quote for Washington Prep - Basketball Season Quote	\N	\N	2025-12-12 11:40:26.120864	2025-12-12 11:40:26.120864	Chicago, IL	\N
15	QT-SEED-002	43	\N	54c442d2-114e-444d-9832-0eeb719f7bed	Swimming Team Estimate	sent	2026-01-12	2280.00	0.0800	182.40	2462.40	0.00	Quote for Kennedy High School - Swimming Team Estimate	\N	\N	2025-12-12 11:40:26.155901	2025-12-12 11:40:26.155901	Sacramento, CA	\N
16	QT-SEED-003	44	\N	54c442d2-114e-444d-9832-0eeb719f7bed	Track & Field Quote	accepted	2026-01-12	1581.00	0.0800	126.48	1707.48	0.00	Quote for Franklin High School - Track & Field Quote	\N	\N	2025-12-12 11:40:26.186737	2025-12-12 11:40:26.186737	Nashville, TN	\N
17	QT-SEED-004	45	\N	54c442d2-114e-444d-9832-0eeb719f7bed	Baseball Spring 2025	draft	2026-01-12	2402.00	0.0800	192.16	2594.16	0.00	Quote for Madison Academy - Baseball Spring 2025	\N	\N	2025-12-12 11:40:26.215055	2025-12-12 11:40:26.215055	Phoenix, AZ	\N
18	QT-SEED-005	46	\N	54c442d2-114e-444d-9832-0eeb719f7bed	Football Package Quote	sent	2026-01-12	5353.00	0.0800	428.24	5781.24	0.00	Quote for Adams High School - Football Package Quote	\N	\N	2025-12-12 11:40:26.244562	2025-12-12 11:40:26.244562	Dallas, TX	\N
19	QT-SEED-006	97	\N	54c442d2-114e-444d-9832-0eeb719f7bed	Golf Team Apparel	accepted	2026-01-12	4652.00	0.0800	372.16	5024.16	0.00	Quote for Valley Tech Institute - Golf Team Apparel	\N	\N	2025-12-12 11:40:26.274241	2025-12-12 11:40:26.274241	Phoenix, AZ	\N
20	QT-SEED-007	98	\N	54c442d2-114e-444d-9832-0eeb719f7bed	Hockey Season Quote	draft	2026-01-12	2498.00	0.0800	199.84	2697.84	0.00	Quote for Great Lakes College - Hockey Season Quote	\N	\N	2025-12-12 11:40:26.304839	2025-12-12 11:40:26.304839	Detroit, MI	\N
21	QT-SEED-008	99	\N	54c442d2-114e-444d-9832-0eeb719f7bed	Football Program	sent	2026-01-12	1316.00	0.0800	105.28	1421.28	0.00	Quote for Central Plains University - Football Program	\N	\N	2025-12-12 11:40:26.333775	2025-12-12 11:40:26.333775	Dallas, TX	\N
22	QT-SEED-009	100	\N	54c442d2-114e-444d-9832-0eeb719f7bed	Ski Team Bundle	draft	2026-01-12	3502.00	0.0800	280.16	3782.16	0.00	Quote for Mountain State College - Ski Team Bundle	\N	\N	2025-12-12 11:40:26.368891	2025-12-12 11:40:26.368891	Salt Lake City, UT	\N
23	QT-SEED-010	101	\N	54c442d2-114e-444d-9832-0eeb719f7bed	Baseball Quote 2025	accepted	2026-01-12	3666.00	0.0800	293.28	3959.28	0.00	Quote for Gulf Coast University - Baseball Quote 2025	\N	\N	2025-12-12 11:40:26.398321	2025-12-12 11:40:26.398321	Houston, TX	\N
\.


ALTER TABLE public.quotes ENABLE TRIGGER ALL;

--
-- Data for Name: commissions; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.commissions DISABLE TRIGGER ALL;

COPY public.commissions (id, salesperson_id, order_id, quote_id, commission_type, base_amount, rate, commission_amount, status, period, approved_by, approved_at, paid_at, notes, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.commissions ENABLE TRIGGER ALL;

--
-- Data for Name: communication_logs; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.communication_logs DISABLE TRIGGER ALL;

COPY public.communication_logs (id, lead_id, user_id, type, subject, message, status, metadata, created_at) FROM stdin;
1	8	test_sales_1	email	Test communication Rwd8e_	Testing communication logging feature	sent	{}	2025-10-13 17:21:17.606639
\.


ALTER TABLE public.communication_logs ENABLE TRIGGER ALL;

--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.events DISABLE TRIGGER ALL;

COPY public.events (id, event_code, name, event_type, status, start_date, end_date, timezone, location, venue_id, thumbnail_url, branding_config, organization_id, created_by, created_at, updated_at) FROM stdin;
1	EVT-1760475637657	Test Event dWga2i	small-scale	draft	\N	\N	America/New_York	\N	\N	\N	\N	\N	test_event_fix	2025-10-14 21:00:37.665381	2025-10-14 21:00:37.665381
2	EVT-1761178612608	Basketball Tournament P_fyiW	small-scale	draft	2025-12-01 00:00:00	2025-12-05 00:00:00	America/New_York	Sports Center	\N	\N	\N	\N	XYyx5A	2025-10-23 00:16:52.616472	2025-10-23 00:16:52.616472
3	EVT-TOUR-001	Summer Music Fest 2025	large-scale	planning	2026-01-12 11:40:24.713	2026-01-26 11:40:24.713	America/New_York	Various Cities, USA	\N	\N	\N	\N	062a8195-70f4-48a6-bc6d-30cd313c8cfa	2025-12-12 11:40:24.72893	2025-12-12 11:40:24.72893
4	EVT-TOUR-002	Rock Festival Tour	large-scale	planning	2026-02-12 11:40:24.759	2026-02-26 11:40:24.759	America/New_York	Stadium Circuit, USA	\N	\N	\N	\N	062a8195-70f4-48a6-bc6d-30cd313c8cfa	2025-12-12 11:40:24.766884	2025-12-12 11:40:24.766884
5	EVT-TOUR-003	Country Roads Tour 2025	large-scale	planning	2026-03-12 11:40:24.79	2026-03-26 11:40:24.79	America/New_York	Southern States, USA	\N	\N	\N	\N	062a8195-70f4-48a6-bc6d-30cd313c8cfa	2025-12-12 11:40:24.799041	2025-12-12 11:40:24.799041
6	EVT-TOUR-004	Hip Hop Unity Tour	large-scale	planning	2026-04-12 11:40:24.823	2026-04-26 11:40:24.823	America/New_York	Major Cities, USA	\N	\N	\N	\N	062a8195-70f4-48a6-bc6d-30cd313c8cfa	2025-12-12 11:40:24.829999	2025-12-12 11:40:24.829999
7	EVT-TOUR-005	Indie Vibes Festival	small-scale	planning	2026-05-12 11:40:24.852	2026-05-26 11:40:24.852	America/New_York	Pacific Northwest, USA	\N	\N	\N	\N	062a8195-70f4-48a6-bc6d-30cd313c8cfa	2025-12-12 11:40:24.861251	2025-12-12 11:40:24.861251
8	EVT-TOUR-006	Metal Mayhem Tour 2025	large-scale	planning	2026-06-12 11:40:24.885	2026-06-26 11:40:24.885	America/New_York	Northeast Circuit, USA	\N	\N	\N	\N	062a8195-70f4-48a6-bc6d-30cd313c8cfa	2025-12-12 11:40:24.89308	2025-12-12 11:40:24.89308
9	EVT-TOUR-007	Jazz & Soul Experience	seminar	planning	2026-07-12 11:40:24.916	2026-07-26 11:40:24.916	America/New_York	New Orleans, LA	\N	\N	\N	\N	062a8195-70f4-48a6-bc6d-30cd313c8cfa	2025-12-12 11:40:24.923065	2025-12-12 11:40:24.923065
10	EVT-TOUR-008	Electronic Dance Festival	large-scale	planning	2026-08-12 11:40:24.945	2026-08-26 11:40:24.945	America/New_York	Las Vegas, NV	\N	\N	\N	\N	062a8195-70f4-48a6-bc6d-30cd313c8cfa	2025-12-12 11:40:24.952005	2025-12-12 11:40:24.952005
11	EVT-TOUR-009	Reggae Sunshine Tour	small-scale	planning	2026-09-12 11:40:24.972	2026-09-26 11:40:24.972	America/New_York	Florida, USA	\N	\N	\N	\N	062a8195-70f4-48a6-bc6d-30cd313c8cfa	2025-12-12 11:40:24.978976	2025-12-12 11:40:24.978976
12	EVT-TOUR-010	Punk Revival Festival 2025	small-scale	planning	2026-10-12 11:40:25	2026-10-26 11:40:25	America/New_York	California, USA	\N	\N	\N	\N	062a8195-70f4-48a6-bc6d-30cd313c8cfa	2025-12-12 11:40:25.006979	2025-12-12 11:40:25.006979
\.


ALTER TABLE public.events ENABLE TRIGGER ALL;

--
-- Data for Name: event_contractors; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.event_contractors DISABLE TRIGGER ALL;

COPY public.event_contractors (id, event_id, name, role, specialty, email, phone, social_media, contract_type, payment_amount, commission_percentage, payment_status, tax_form_url, travel_info, lodging_reimbursement, bio_text, bio_image_url, media_consent, approval_status, approved_by, quickbooks_ref, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.event_contractors ENABLE TRIGGER ALL;

--
-- Data for Name: contractor_files; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.contractor_files DISABLE TRIGGER ALL;

COPY public.contractor_files (id, contractor_id, file_type, file_name, file_url, file_size, uploaded_by, created_at) FROM stdin;
\.


ALTER TABLE public.contractor_files ENABLE TRIGGER ALL;

--
-- Data for Name: contractor_payments; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.contractor_payments DISABLE TRIGGER ALL;

COPY public.contractor_payments (id, contractor_id, payment_date, amount, payment_method, quickbooks_ref, notes, created_by, created_at) FROM stdin;
\.


ALTER TABLE public.contractor_payments ENABLE TRIGGER ALL;

--
-- Data for Name: custom_financial_entries; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.custom_financial_entries DISABLE TRIGGER ALL;

COPY public.custom_financial_entries (id, order_id, entry_type, description, amount, date, category, notes, created_by, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.custom_financial_entries ENABLE TRIGGER ALL;

--
-- Data for Name: customer_comments; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.customer_comments DISABLE TRIGGER ALL;

COPY public.customer_comments (id, order_id, message, is_from_customer, created_at) FROM stdin;
\.


ALTER TABLE public.customer_comments ENABLE TRIGGER ALL;

--
-- Data for Name: design_job_comments; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.design_job_comments DISABLE TRIGGER ALL;

COPY public.design_job_comments (id, job_id, user_id, comment, is_internal, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.design_job_comments ENABLE TRIGGER ALL;

--
-- Data for Name: design_portfolios; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.design_portfolios DISABLE TRIGGER ALL;

COPY public.design_portfolios (id, design_job_id, designer_id, title, client, category, completed_date, image_urls, rating, feedback_count, revisions, is_featured, archived, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.design_portfolios ENABLE TRIGGER ALL;

--
-- Data for Name: design_resources; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.design_resources DISABLE TRIGGER ALL;

COPY public.design_resources (id, name, category, file_type, file_url, description, downloads, uploaded_by, created_at, updated_at, file_size) FROM stdin;
\.


ALTER TABLE public.design_resources ENABLE TRIGGER ALL;

--
-- Data for Name: event_budgets; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.event_budgets DISABLE TRIGGER ALL;

COPY public.event_budgets (id, event_id, category_name, budgeted_amount, actual_amount, approval_status, approved_by, notes, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.event_budgets ENABLE TRIGGER ALL;

--
-- Data for Name: event_campaigns; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.event_campaigns DISABLE TRIGGER ALL;

COPY public.event_campaigns (id, event_id, campaign_name, campaign_type, channel, content, media_urls, scheduled_at, sent_at, metrics, created_by, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.event_campaigns ENABLE TRIGGER ALL;

--
-- Data for Name: event_merchandise; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.event_merchandise DISABLE TRIGGER ALL;

COPY public.event_merchandise (id, event_id, variant_id, allocated_qty, sold_qty, returned_qty, price_override, discount_config, sales_target, actual_revenue, notes, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.event_merchandise ENABLE TRIGGER ALL;

--
-- Data for Name: event_inventory_movements; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.event_inventory_movements DISABLE TRIGGER ALL;

COPY public.event_inventory_movements (id, event_id, merchandise_id, movement_type, quantity, from_location, to_location, moved_by, notes, created_at) FROM stdin;
\.


ALTER TABLE public.event_inventory_movements ENABLE TRIGGER ALL;

--
-- Data for Name: event_registrations; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.event_registrations DISABLE TRIGGER ALL;

COPY public.event_registrations (id, event_id, attendee_name, attendee_email, attendee_phone, attendee_info, ticket_type, ticket_price, payment_status, referral_source, check_in_status, check_in_time, registered_at, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.event_registrations ENABLE TRIGGER ALL;

--
-- Data for Name: event_staff; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.event_staff DISABLE TRIGGER ALL;

COPY public.event_staff (id, event_id, user_id, role, responsibilities, notification_preferences, assigned_at, assigned_by, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.event_staff ENABLE TRIGGER ALL;

--
-- Data for Name: event_stages; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.event_stages DISABLE TRIGGER ALL;

COPY public.event_stages (id, event_id, stage_number, stage_name, status, stage_data, completed_at, completed_by, validation_errors, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.event_stages ENABLE TRIGGER ALL;

--
-- Data for Name: fabrics; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.fabrics DISABLE TRIGGER ALL;

COPY public.fabrics (id, name, gsm, blend, vendor_name, vendor_location, vendor_country, fabric_type, weight, stretch_type, color_options, notes, is_approved, approved_by, approved_at, created_by, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.fabrics ENABLE TRIGGER ALL;

--
-- Data for Name: manufacturing; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.manufacturing DISABLE TRIGGER ALL;

COPY public.manufacturing (id, order_id, status, assigned_to, manufacturer_id, start_date, est_completion, actual_completion, qc_notes, tracking_number, created_at, updated_at, batch_number, batch_size, priority, special_instructions, production_notes, quality_notes, attachment_urls, estimated_hours, actual_hours, scheduled_start_date, scheduled_end_date, archived, archived_at, archived_by, completed_product_images, first_piece_image_urls, first_piece_status, first_piece_uploaded_by, first_piece_uploaded_at, first_piece_approved_by, first_piece_approved_at, first_piece_rejection_notes) FROM stdin;
3	18	awaiting_admin_confirmation	\N	3	\N	\N	\N	\N	\N	2025-10-03 06:55:41.145882	2025-10-03 06:55:41.145882	\N	1	normal	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	pending	\N	\N	\N	\N	\N
6	15	awaiting_admin_confirmation	\N	1	\N	\N	\N	\N	\N	2025-10-03 17:51:06.411873	2025-10-03 17:51:06.411873	\N	1	normal	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	pending	\N	\N	\N	\N	\N
12	22	awaiting_admin_confirmation	\N	\N	\N	2025-11-12	\N	\N	\N	2025-10-13 14:21:23.805844	2025-10-15 23:20:42.715	\N	1	normal		\N	\N	\N	\N	\N	\N	\N	t	2025-10-15 23:20:42.715	4NQtH-	\N	\N	pending	\N	\N	\N	\N	\N
11	28	cutting_sewing	\N	\N	\N	\N	\N	\N	\N	2025-10-13 02:00:43.638547	2025-10-13 02:00:43.638547	\N	1	normal	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	pending	\N	\N	\N	\N	\N
7	25	complete	\N	\N	\N	\N	2025-10-11	\N		2025-10-11 03:15:47.70168	2025-10-15 23:34:37.987	\N	1	normal	\N	Auto-created when order moved to production		\N	\N	\N	\N	\N	t	2025-10-15 23:31:37.153	CTFAxZ	{https://storage.googleapis.com/replit-objstore-84676dcc-ba6c-4de1-8d43-7810e5954e44/public/products/2025/10/img_1760571277315_j34wt3}	\N	pending	\N	\N	\N	\N	\N
14	35	awaiting_admin_confirmation	\N	\N	\N	\N	\N	\N	\N	2025-10-17 04:01:01.189808	2025-11-19 20:58:37.984	\N	1	normal	\N	Auto-created when order moved to production	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	pending	\N	\N	\N	\N	\N
13	31	confirmed_awaiting_manufacturing	\N	\N	\N	\N	\N	\N		2025-10-16 13:42:43.234557	2025-11-29 21:33:08.628	\N	1	normal	\N	Auto-created when order moved to production		\N	\N	\N	\N	\N	f	\N	\N	\N	\N	pending	\N	\N	\N	\N	\N
9	16	confirmed_awaiting_manufacturing	\N	\N	\N	2025-11-11	\N	\N		2025-10-12 00:31:33.978997	2025-12-04 21:19:48.396	\N	1	normal	Created by automated test			\N	\N	\N	\N	\N	f	\N	\N	\N	\N	pending	\N	\N	\N	\N	\N
8	26	awaiting_admin_confirmation	\N	\N	\N	\N	\N	\N	\N	2025-10-11 21:37:50.042267	2025-12-09 22:18:23.94	\N	1	normal	\N	Auto-created when order moved to production	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	pending	\N	\N	\N	\N	\N
\.


ALTER TABLE public.manufacturing ENABLE TRIGGER ALL;

--
-- Data for Name: order_line_items; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.order_line_items DISABLE TRIGGER ALL;

COPY public.order_line_items (id, order_id, variant_id, item_name, color_notes, yxs, ys, ym, yl, xs, s, m, l, xl, xxl, xxxl, unit_price, notes, created_at, updated_at, image_url, xxxxl) FROM stdin;
19	18	20	Order Prod aC - ORD-VAR-ON (Red)	Red	0	0	0	0	0	0	10	0	0	0	0	29.99	\N	2025-10-03 06:54:58.104221	2025-10-03 06:54:58.104221	\N	0
22	20	20	Order Prod aC - ORD-VAR-ON (Red)	Red	0	0	0	0	0	0	10	0	0	0	0	29.99	\N	2025-10-03 17:22:00.693738	2025-10-03 17:22:00.693738	\N	0
24	15	3	Crewneck (Charcoal)	Purple chest print	0	4	8	10	2	8	12	12	6	3	1	28.50		2025-10-03 17:51:06.259012	2025-10-03 17:51:06.259012	\N	0
25	15	7	Team Backpack	Logo on pocket	0	0	0	0	0	10	15	15	0	0	0	28.50		2025-10-03 17:51:06.337352	2025-10-03 17:51:06.337352	\N	0
28	23	21	Performance Wrestling Singlet - SINGLET-RH-PURP (Purple)	Purple	0	0	0	0	0	0	2	1	0	0	0	35.00	\N	2025-10-03 19:07:42.789521	2025-10-03 19:07:42.789521	\N	0
29	23	21	Performance Wrestling Singlet - SINGLET-RH-PURP (Purple)	Purple	0	0	0	0	0	0	1	1	0	0	0	35.00	\N	2025-10-03 19:07:42.789521	2025-10-03 19:07:42.789521	\N	0
30	24	21	Performance Wrestling Singlet - SINGLET-RH-PURP (Purple)	Purple	0	0	0	0	0	2	1	0	0	0	0	35.00	\N	2025-10-04 00:28:26.326381	2025-10-04 00:28:26.326381	\N	0
31	25	21	Performance Wrestling Singlet - SINGLET-RH-PURP (Purple)	Purple	0	0	0	0	0	0	1	0	0	0	0	35.00	\N	2025-10-11 03:08:31.298053	2025-10-11 03:08:31.298053	\N	0
33	28	22	Test Line Item	\N	0	0	0	0	2	3	4	3	2	0	0	10.00	\N	2025-10-13 02:00:43.638547	2025-10-13 02:00:43.638547	\N	0
34	30	24	Test Item	\N	0	0	0	0	0	0	5	0	0	0	0	29.99	\N	2025-10-13 19:53:10.691692	2025-10-13 19:53:10.691692	\N	0
26	21	21	Performance Wrestling Singlet - SINGLET-RH-PURP (Purple)	Purple	0	0	0	0	0	0	10	0	0	0	0	35.00	\N	2025-10-03 18:21:54.268887	2025-10-14 05:07:18.158	\N	0
36	15	13			0	0	0	0	0	0	0	0	0	0	0	20.00		2025-10-15 20:05:14.208171	2025-10-15 20:05:14.208171	\N	0
43	35	21	Performance Wrestling Singlet - SINGLET-RH-PURP (Purple)	Purple	0	0	0	0	3	0	0	0	0	0	0	35.00	\N	2025-10-17 03:56:12.683759	2025-10-17 03:56:12.683759	\N	0
42	35	23	E2E Product ZaXE-d - VAR-pi7VWP (Red)	Red	0	0	0	0	0	2	0	0	2	0	0	29.99	\N	2025-10-17 03:56:12.683759	2025-10-17 04:44:54.946	/public-objects/products/2025/10/img_1760676290757_fzvcu1	0
23	15	2	Heavy Tee (Black)	Purple/white print	2	6	10	12	4	10	14	14	8	4	2	25.00		2025-10-03 17:51:06.178282	2025-10-15 23:05:35.696	/public-objects/products/2025/10/img_1760558722557_js92hr	0
27	22	21	Custom Product Name w9PQw7	Purple	0	0	0	0	0	0	1	0	0	0	0	35.00	\N	2025-10-03 18:38:35.375748	2025-10-15 23:18:12.228	\N	0
32	26	21	Test Product P_Aydu	Purple	0	0	0	0	0	10	10	5	0	0	0	35.00	\N	2025-10-11 21:35:07.211284	2025-10-15 23:30:35.411	\N	0
41	34	24	\N	\N	0	0	0	0	10	10	10	0	0	0	0	10.00	\N	2025-10-16 19:45:22.689252	2025-10-16 19:52:15.9	/public-objects/test-image-2.jpg	0
18	16	16	Performance Wrestling Singlet - WomensCut (Sublimated)	Sublimated	0	0	0	0	0	0	0	0	0	0	0	1.00	\N	2025-09-30 20:06:04.642217	2025-09-30 20:06:04.642217	\N	0
37	31	24	Test Product EAiNyP - VAR-18QKZY (Red)	Red	0	0	0	0	0	0	1	0	0	0	0	1.00	\N	2025-10-15 20:32:28.901784	2025-10-15 20:32:28.901784	\N	0
38	32	24	Test Product EAiNyP - VAR-18QKZY (Red)	Red	0	0	0	0	0	0	1	0	0	0	0	1.00	\N	2025-10-16 13:49:32.883098	2025-10-16 13:53:14.854	https://via.placeholder.com/800	0
44	36	24	Test Custom Item SEiz_g	Red	0	0	0	0	0	0	1	0	0	0	0	1.00	\N	2025-10-17 05:23:46.518608	2025-10-17 05:24:46.236	\N	0
45	37	24	Custom Test Item 3WEXfH	Red	0	0	0	0	0	0	1	0	0	0	0	1.00	\N	2025-10-17 05:30:33.223982	2025-10-17 05:33:16.74	\N	0
46	38	24	Test Product EAiNyP - VAR-18QKZY (Red)	Red	0	0	0	0	0	0	1	0	0	0	0	1.00	\N	2025-10-30 03:32:13.176761	2025-10-30 03:32:13.176761	\N	0
47	39	24	Test Product EAiNyP - VAR-18QKZY (Red)	Red	0	0	0	0	0	0	1	0	0	0	0	1.00	\N	2025-10-30 03:38:37.926794	2025-10-30 03:38:37.926794	\N	0
48	42	22	Classic T-Shirt - VAR-TEST	\N	0	0	0	0	0	0	0	2	0	0	0	19.99	\N	2025-11-24 07:15:14.765782	2025-11-24 07:15:14.765782	\N	0
49	36	13	Shorts		0	0	0	0	0	0	0	0	0	0	0	20.00		2025-12-01 02:39:02.425828	2025-12-01 02:39:02.425828	\N	0
50	42	6	Performance Wrestling Singlet - SINGLET-RH		0	0	0	0	0	0	0	0	0	0	0	50.00		2025-12-01 02:51:29.706881	2025-12-01 02:51:29.706881	\N	0
51	42	6	Performance Wrestling Singlet - SINGLET-RH		0	0	0	0	0	0	0	0	0	0	0	50.00		2025-12-01 02:58:22.513759	2025-12-01 02:58:22.513759	\N	0
52	42	6	Performance Wrestling Singlet - SINGLET-RH		0	0	0	0	0	0	0	0	0	0	0	50.00		2025-12-01 03:02:10.442083	2025-12-01 03:02:10.442083	\N	0
53	42	6	Performance Wrestling Singlet - SINGLET-RH		0	0	0	0	0	0	0	0	0	0	0	50.00		2025-12-01 03:07:17.609483	2025-12-01 03:07:17.609483	\N	0
\.


ALTER TABLE public.order_line_items ENABLE TRIGGER ALL;

--
-- Data for Name: fabric_submissions; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.fabric_submissions DISABLE TRIGGER ALL;

COPY public.fabric_submissions (id, manufacturing_id, line_item_id, submitted_by, fabric_name, gsm, blend, vendor_name, vendor_location, vendor_country, fabric_type, weight, stretch_type, notes, status, reviewed_by, reviewed_at, review_notes, created_fabric_id, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.fabric_submissions ENABLE TRIGGER ALL;

--
-- Data for Name: favorites; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.favorites DISABLE TRIGGER ALL;

COPY public.favorites (id, user_id, entity_type, entity_id, created_at) FROM stdin;
\.


ALTER TABLE public.favorites ENABLE TRIGGER ALL;

--
-- Data for Name: financial_alerts; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.financial_alerts DISABLE TRIGGER ALL;

COPY public.financial_alerts (id, alert_type, title, message, severity, threshold, current_value, entity_type, entity_id, recipient_id, is_read, read_at, resolved_at, metadata, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.financial_alerts ENABLE TRIGGER ALL;

--
-- Data for Name: financial_reports; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.financial_reports DISABLE TRIGGER ALL;

COPY public.financial_reports (id, report_name, report_type, period_start, period_end, generated_by, status, report_data, file_url, parameters, summary, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.financial_reports ENABLE TRIGGER ALL;

--
-- Data for Name: financial_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.financial_transactions DISABLE TRIGGER ALL;

COPY public.financial_transactions (id, transaction_number, type, status, amount, currency, description, category, order_id, quote_id, salesperson_id, payment_method, external_transaction_id, fees, tax_amount, processed_by, processed_at, due_date, notes, metadata, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.financial_transactions ENABLE TRIGGER ALL;

--
-- Data for Name: invitations; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.invitations DISABLE TRIGGER ALL;

COPY public.invitations (id, user_id, token, email, expires_at, status, sent_at, accepted_at, email_sent_successfully, email_error, retry_count, created_by, created_at, updated_at, name, role) FROM stdin;
1	\N	qKL4_p_LfS2zjdbVAoj-E_aX2PY9-_NH	suttonsam862@gmail.com	2025-10-03 16:42:42.297	pending	\N	\N	f	\N	0	\N	2025-10-01 16:42:42.305557	2025-10-01 16:42:42.305557	Sam Sutton	designer
\.


ALTER TABLE public.invitations ENABLE TRIGGER ALL;

--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.invoices DISABLE TRIGGER ALL;

COPY public.invoices (id, invoice_number, order_id, org_id, salesperson_id, issue_date, due_date, status, subtotal, tax_rate, tax_amount, total_amount, amount_paid, payment_terms, notes, internal_notes, sent_at, paid_at, created_by, created_at, updated_at, discount) FROM stdin;
1	INV-8od8oL	\N	\N	\N	2025-10-08	2025-11-07	draft	100.00	0.0000	0.00	100.00	100.00	\N	\N	\N	\N	\N	xa9662	2025-10-08 18:48:19.979719	2025-10-11 23:16:42.01	0.00
3	INV-00001	24	31	\N	2025-10-11	2025-11-10	draft	1000.00	0.0000	0.00	1000.00	1000.00			\N	\N	\N	41090967	2025-10-11 23:47:43.976995	2025-10-11 23:58:53.186	0.00
\.


ALTER TABLE public.invoices ENABLE TRIGGER ALL;

--
-- Data for Name: invoice_payments; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.invoice_payments DISABLE TRIGGER ALL;

COPY public.invoice_payments (id, invoice_id, payment_number, payment_date, amount, payment_method, reference_number, notes, processed_by, created_at, updated_at) FROM stdin;
1	1	PMT-00001	2025-10-11	100.00	cash	TEST-REF-123	Test payment	\N	2025-10-11 23:16:41.969545	2025-10-11 23:16:41.969545
4	3	PMT-00002	2025-10-11	1000.00	cash			\N	2025-10-11 23:58:53.154753	2025-10-11 23:58:53.154753
\.


ALTER TABLE public.invoice_payments ENABLE TRIGGER ALL;

--
-- Data for Name: manufacturer_jobs; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.manufacturer_jobs DISABLE TRIGGER ALL;

COPY public.manufacturer_jobs (id, manufacturing_id, order_id, manufacturer_id, manufacturer_status, public_status, required_delivery_date, promised_ship_date, event_date, latest_arrival_date, manufacturing_start_deadline, sample_required, specs_locked, specs_locked_at, specs_locked_by, artwork_urls, pantone_codes_json, fabric_type, print_method, special_instructions, internal_notes, priority, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.manufacturer_jobs ENABLE TRIGGER ALL;

--
-- Data for Name: manufacturer_events; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.manufacturer_events DISABLE TRIGGER ALL;

COPY public.manufacturer_events (id, manufacturer_job_id, event_type, title, description, previous_value, new_value, metadata, created_by, created_at) FROM stdin;
\.


ALTER TABLE public.manufacturer_events ENABLE TRIGGER ALL;

--
-- Data for Name: manufacturing_batches; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.manufacturing_batches DISABLE TRIGGER ALL;

COPY public.manufacturing_batches (id, batch_number, manufacturer_id, batch_name, status, batch_size, priority, scheduled_start_date, scheduled_end_date, actual_start_date, actual_end_date, estimated_hours, actual_hours, qc_notes, special_instructions, assigned_team, notes, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.manufacturing_batches ENABLE TRIGGER ALL;

--
-- Data for Name: manufacturing_quality_checkpoints; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.manufacturing_quality_checkpoints DISABLE TRIGGER ALL;

COPY public.manufacturing_quality_checkpoints (id, manufacturing_id, checkpoint_name, checkpoint_stage, status, checked_by, check_date, notes, attachment_urls, requirements, result, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.manufacturing_quality_checkpoints ENABLE TRIGGER ALL;

--
-- Data for Name: manufacturing_attachments; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.manufacturing_attachments DISABLE TRIGGER ALL;

COPY public.manufacturing_attachments (id, manufacturing_id, batch_id, quality_checkpoint_id, file_name, file_type, file_size, file_url, uploaded_by, description, category, is_public, created_at, updated_at) FROM stdin;
1	14	\N	\N	71y38JJuSSL.jpg	image/jpeg	161112	/public-objects/products/2025/10/img_1760680834315_wjmrgx	41090967	\N	logos	f	2025-10-17 06:00:34.901814	2025-10-17 06:00:34.901814
\.


ALTER TABLE public.manufacturing_attachments ENABLE TRIGGER ALL;

--
-- Data for Name: manufacturing_batch_items; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.manufacturing_batch_items DISABLE TRIGGER ALL;

COPY public.manufacturing_batch_items (id, batch_id, manufacturing_id, order_id, quantity, priority, notes, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.manufacturing_batch_items ENABLE TRIGGER ALL;

--
-- Data for Name: manufacturing_notifications; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.manufacturing_notifications DISABLE TRIGGER ALL;

COPY public.manufacturing_notifications (id, manufacturing_id, batch_id, recipient_id, notification_type, title, message, priority, is_read, read_at, scheduled_for, sent_at, metadata, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.manufacturing_notifications ENABLE TRIGGER ALL;

--
-- Data for Name: manufacturing_updates; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.manufacturing_updates DISABLE TRIGGER ALL;

COPY public.manufacturing_updates (id, manufacturing_id, status, notes, updated_by, manufacturer_id, created_at, order_id, production_notes, quality_notes, tracking_number, estimated_completion, actual_completion_date, special_instructions, attachment_urls, progress_percentage, updated_at) FROM stdin;
\.


ALTER TABLE public.manufacturing_updates ENABLE TRIGGER ALL;

--
-- Data for Name: manufacturing_update_line_items; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.manufacturing_update_line_items DISABLE TRIGGER ALL;

COPY public.manufacturing_update_line_items (id, manufacturing_update_id, line_item_id, mockup_image_url, mockup_uploaded_at, mockup_uploaded_by, sizes_confirmed, sizes_confirmed_at, sizes_confirmed_by, manufacturer_completed, manufacturer_completed_at, manufacturer_completed_by, notes, created_at, updated_at, actual_cost, descriptors, product_name, variant_code, variant_color, image_url, yxs, ys, ym, yl, xs, s, m, l, xl, xxl, xxxl, xxxxl) FROM stdin;
\.


ALTER TABLE public.manufacturing_update_line_items ENABLE TRIGGER ALL;

--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.notifications DISABLE TRIGGER ALL;

COPY public.notifications (id, user_id, title, message, type, is_read, link, metadata, created_at, read_at) FROM stdin;
3	test-admin-automated-auth	Read Notification	This was already read	warning	t	\N	\N	2025-10-03 04:31:53.92806	\N
1	test-admin-automated-auth	Test Notification 1	This is a test notification	info	t	\N	\N	2025-10-03 04:31:53.92806	2025-10-03 04:32:29.205
2	test-admin-automated-auth	Test Notification 2	Another test notification	success	t	\N	\N	2025-10-03 04:31:53.92806	2025-10-03 04:32:29.205
5	cb0bd046-7c15-4823-aa32-192243120de1	New Manufacturing Update	samsutton@rich-habits.com created a new manufacturing update: awaiting_admin_confirmation - Initial manufacturing update created	info	f	/manufacturing/13	\N	2025-11-19 20:06:08.418762	\N
6	dcc51a50-8488-4461-aec3-aa266992e1e2	New Manufacturing Update	samsutton@rich-habits.com created a new manufacturing update: awaiting_admin_confirmation - Initial manufacturing update created	info	f	/manufacturing/13	\N	2025-11-19 20:06:08.446139	\N
7	d33441ea-4eae-4e49-923f-26e05e058c0e	New Manufacturing Update	samsutton@rich-habits.com created a new manufacturing update: awaiting_admin_confirmation - Initial manufacturing update created	info	f	/manufacturing/13	\N	2025-11-19 20:06:08.463582	\N
8	5nEJcV	New Manufacturing Update	samsutton@rich-habits.com created a new manufacturing update: awaiting_admin_confirmation - Initial manufacturing update created	info	f	/manufacturing/13	\N	2025-11-19 20:06:08.481977	\N
9	-TcOyb	New Manufacturing Update	samsutton@rich-habits.com created a new manufacturing update: awaiting_admin_confirmation - Initial manufacturing update created	info	f	/manufacturing/13	\N	2025-11-19 20:06:08.503425	\N
10	test-manufacturer-LfZX70	New Manufacturing Update	samsutton@rich-habits.com created a new manufacturing update: awaiting_admin_confirmation - Initial manufacturing update created	info	f	/manufacturing/13	\N	2025-11-19 20:06:08.52101	\N
11	3f35cb86-89b4-4359-a87a-4da43fd2eb96	New Manufacturing Update	samsutton@rich-habits.com created a new manufacturing update: awaiting_admin_confirmation - Initial manufacturing update created	info	f	/manufacturing/13	\N	2025-11-19 20:06:08.538492	\N
12	cb0bd046-7c15-4823-aa32-192243120de1	Manufacturing Update Changed	samsutton@rich-habits.com updated a manufacturing update: awaiting_admin_confirmation - Initial manufacturing update created	info	f	/manufacturing/14	\N	2025-11-19 20:58:30.20781	\N
13	dcc51a50-8488-4461-aec3-aa266992e1e2	Manufacturing Update Changed	samsutton@rich-habits.com updated a manufacturing update: awaiting_admin_confirmation - Initial manufacturing update created	info	f	/manufacturing/14	\N	2025-11-19 20:58:30.231411	\N
14	d33441ea-4eae-4e49-923f-26e05e058c0e	Manufacturing Update Changed	samsutton@rich-habits.com updated a manufacturing update: awaiting_admin_confirmation - Initial manufacturing update created	info	f	/manufacturing/14	\N	2025-11-19 20:58:30.24898	\N
15	5nEJcV	Manufacturing Update Changed	samsutton@rich-habits.com updated a manufacturing update: awaiting_admin_confirmation - Initial manufacturing update created	info	f	/manufacturing/14	\N	2025-11-19 20:58:30.266063	\N
16	-TcOyb	Manufacturing Update Changed	samsutton@rich-habits.com updated a manufacturing update: awaiting_admin_confirmation - Initial manufacturing update created	info	f	/manufacturing/14	\N	2025-11-19 20:58:30.283556	\N
17	test-manufacturer-LfZX70	Manufacturing Update Changed	samsutton@rich-habits.com updated a manufacturing update: awaiting_admin_confirmation - Initial manufacturing update created	info	f	/manufacturing/14	\N	2025-11-19 20:58:30.30063	\N
18	3f35cb86-89b4-4359-a87a-4da43fd2eb96	Manufacturing Update Changed	samsutton@rich-habits.com updated a manufacturing update: awaiting_admin_confirmation - Initial manufacturing update created	info	f	/manufacturing/14	\N	2025-11-19 20:58:30.318174	\N
19	cb0bd046-7c15-4823-aa32-192243120de1	Manufacturing Update Changed	samsutton@rich-habits.com updated a manufacturing update: awaiting_admin_confirmation - Initial manufacturing update created	info	f	/manufacturing/14	\N	2025-11-19 20:58:38.079135	\N
20	dcc51a50-8488-4461-aec3-aa266992e1e2	Manufacturing Update Changed	samsutton@rich-habits.com updated a manufacturing update: awaiting_admin_confirmation - Initial manufacturing update created	info	f	/manufacturing/14	\N	2025-11-19 20:58:38.098862	\N
21	d33441ea-4eae-4e49-923f-26e05e058c0e	Manufacturing Update Changed	samsutton@rich-habits.com updated a manufacturing update: awaiting_admin_confirmation - Initial manufacturing update created	info	f	/manufacturing/14	\N	2025-11-19 20:58:38.114567	\N
22	5nEJcV	Manufacturing Update Changed	samsutton@rich-habits.com updated a manufacturing update: awaiting_admin_confirmation - Initial manufacturing update created	info	f	/manufacturing/14	\N	2025-11-19 20:58:38.131011	\N
23	-TcOyb	Manufacturing Update Changed	samsutton@rich-habits.com updated a manufacturing update: awaiting_admin_confirmation - Initial manufacturing update created	info	f	/manufacturing/14	\N	2025-11-19 20:58:38.147341	\N
24	test-manufacturer-LfZX70	Manufacturing Update Changed	samsutton@rich-habits.com updated a manufacturing update: awaiting_admin_confirmation - Initial manufacturing update created	info	f	/manufacturing/14	\N	2025-11-19 20:58:38.163419	\N
25	3f35cb86-89b4-4359-a87a-4da43fd2eb96	Manufacturing Update Changed	samsutton@rich-habits.com updated a manufacturing update: awaiting_admin_confirmation - Initial manufacturing update created	info	f	/manufacturing/14	\N	2025-11-19 20:58:38.17825	\N
26	d33441ea-4eae-4e49-923f-26e05e058c0e	New Manufacturing Update	samsutton@rich-habits.com created a new manufacturing update: awaiting_admin_confirmation - Initial manufacturing update created	info	f	/manufacturing/8	\N	2025-12-09 22:18:24.019735	\N
27	5nEJcV	New Manufacturing Update	samsutton@rich-habits.com created a new manufacturing update: awaiting_admin_confirmation - Initial manufacturing update created	info	f	/manufacturing/8	\N	2025-12-09 22:18:24.04354	\N
28	-TcOyb	New Manufacturing Update	samsutton@rich-habits.com created a new manufacturing update: awaiting_admin_confirmation - Initial manufacturing update created	info	f	/manufacturing/8	\N	2025-12-09 22:18:24.060871	\N
29	test-manufacturer-LfZX70	New Manufacturing Update	samsutton@rich-habits.com created a new manufacturing update: awaiting_admin_confirmation - Initial manufacturing update created	info	f	/manufacturing/8	\N	2025-12-09 22:18:24.07829	\N
30	cb0bd046-7c15-4823-aa32-192243120de1	New Manufacturing Update	samsutton@rich-habits.com created a new manufacturing update: awaiting_admin_confirmation - Initial manufacturing update created	info	f	/manufacturing/8	\N	2025-12-09 22:18:24.096194	\N
31	dcc51a50-8488-4461-aec3-aa266992e1e2	New Manufacturing Update	samsutton@rich-habits.com created a new manufacturing update: awaiting_admin_confirmation - Initial manufacturing update created	info	f	/manufacturing/8	\N	2025-12-09 22:18:24.115607	\N
32	3f35cb86-89b4-4359-a87a-4da43fd2eb96	New Manufacturing Update	samsutton@rich-habits.com created a new manufacturing update: awaiting_admin_confirmation - Initial manufacturing update created	info	f	/manufacturing/8	\N	2025-12-09 22:18:24.133099	\N
\.


ALTER TABLE public.notifications ENABLE TRIGGER ALL;

--
-- Data for Name: order_form_submissions; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.order_form_submissions DISABLE TRIGGER ALL;

COPY public.order_form_submissions (id, order_id, contact_name, contact_email, contact_phone, shipping_name, shipping_address, shipping_city, shipping_state, shipping_zip, shipping_country, billing_name, billing_address, billing_city, billing_state, billing_zip, billing_country, same_as_shipping, organization_name, purchase_order_number, special_instructions, uploaded_files, status, submitted_at, reviewed_at, reviewed_by, created_at, updated_at) FROM stdin;
1	15	Test Customer	testcustomer@example.com	(555) 123-4567	Test Organization LLC	123 Test Street	Test City	TS	12345	USA	Test Organization LLC	123 Test Street	Test City	TS	12345	USA	t	Test Organization LLC	\N	Please expedite shipping	\N	submitted	2025-12-03 06:39:06.367882	\N	\N	2025-12-03 06:39:06.367882	2025-12-03 06:39:06.367882
2	16	Test Customer Updated	testcustomer@example.com	(555) 999-8888	Another Location	456 New Street	New City	NC	67890	USA	\N	\N	\N	\N	\N	USA	t	Another Location	\N	\N	\N	submitted	2025-12-03 06:39:34.899505	\N	\N	2025-12-03 06:39:34.899505	2025-12-03 06:39:34.899505
3	18	New Person	newperson@neworg.com	(555) 111-2222	Brand New Organization	789 New Org Way	New Org City	NO	99999	USA	\N	\N	\N	\N	\N	USA	t	Brand New Organization	\N	\N	\N	submitted	2025-12-03 06:39:53.381436	\N	\N	2025-12-03 06:39:53.381436	2025-12-03 06:39:53.381436
\.


ALTER TABLE public.order_form_submissions ENABLE TRIGGER ALL;

--
-- Data for Name: order_form_line_item_sizes; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.order_form_line_item_sizes DISABLE TRIGGER ALL;

COPY public.order_form_line_item_sizes (id, submission_id, line_item_id, yxs, ys, ym, yl, xs, s, m, l, xl, xxl, xxxl, xxxxl, item_notes, created_at) FROM stdin;
\.


ALTER TABLE public.order_form_line_item_sizes ENABLE TRIGGER ALL;

--
-- Data for Name: order_line_item_manufacturers; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.order_line_item_manufacturers DISABLE TRIGGER ALL;

COPY public.order_line_item_manufacturers (id, line_item_id, manufacturer_id, assigned_at, estimated_completion, status, notes, created_at, updated_at) FROM stdin;
1	19	3	2025-10-03 06:55:41.17934	\N	pending	\N	2025-10-03 06:55:41.17934	2025-10-03 06:55:41.17934
2	19	3	2025-10-03 06:55:51.901131	\N	pending	\N	2025-10-03 06:55:51.901131	2025-10-03 06:55:51.901131
3	19	3	2025-10-03 06:56:21.679958	\N	pending	\N	2025-10-03 06:56:21.679958	2025-10-03 06:56:21.679958
4	33	4	2025-10-13 02:00:43.638547	\N	pending	\N	2025-10-13 02:00:43.638547	2025-10-13 02:00:43.638547
5	34	6	2025-10-13 19:53:10.691692	\N	pending	\N	2025-10-13 19:53:10.691692	2025-10-13 19:53:10.691692
6	37	6	2025-10-15 20:32:28.901784	\N	pending	\N	2025-10-15 20:32:28.901784	2025-10-15 20:32:28.901784
7	38	6	2025-10-16 13:49:32.883098	\N	pending	\N	2025-10-16 13:49:32.883098	2025-10-16 13:49:32.883098
8	41	6	2025-10-16 19:45:22.735742	\N	pending	\N	2025-10-16 19:45:22.735742	2025-10-16 19:45:22.735742
9	42	5	2025-10-17 03:56:12.683759	\N	pending	\N	2025-10-17 03:56:12.683759	2025-10-17 03:56:12.683759
10	43	3	2025-10-17 03:56:12.683759	\N	pending	\N	2025-10-17 03:56:12.683759	2025-10-17 03:56:12.683759
11	44	6	2025-10-17 05:23:46.518608	\N	pending	\N	2025-10-17 05:23:46.518608	2025-10-17 05:23:46.518608
12	45	6	2025-10-17 05:30:33.223982	\N	pending	\N	2025-10-17 05:30:33.223982	2025-10-17 05:30:33.223982
13	46	6	2025-10-30 03:32:13.176761	\N	pending	\N	2025-10-30 03:32:13.176761	2025-10-30 03:32:13.176761
14	47	6	2025-10-30 03:38:37.926794	\N	pending	\N	2025-10-30 03:38:37.926794	2025-10-30 03:38:37.926794
\.


ALTER TABLE public.order_line_item_manufacturers ENABLE TRIGGER ALL;

--
-- Data for Name: order_tracking_numbers; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.order_tracking_numbers DISABLE TRIGGER ALL;

COPY public.order_tracking_numbers (id, order_id, tracking_number, carrier_company, created_at, tracking_notes) FROM stdin;
1	38	TEST-TRACK-001	UPS	2025-10-30 03:33:12.255874	\N
2	38	TEST-TRACK-002	FedEx	2025-10-30 03:33:56.481891	\N
3	39	TEST-TRACK-100	UPS Test	2025-10-30 03:39:21.030979	\N
4	39	TEST-TRACK-200	FedEx Test	2025-10-30 03:40:13.223924	\N
\.


ALTER TABLE public.order_tracking_numbers ENABLE TRIGGER ALL;

--
-- Data for Name: pantone_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.pantone_assignments DISABLE TRIGGER ALL;

COPY public.pantone_assignments (id, line_item_id, manufacturing_update_id, pantone_code, pantone_name, pantone_type, hex_value, rgb_r, rgb_g, rgb_b, usage_location, usage_notes, match_quality, match_distance, sampled_from_image_url, assigned_by, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.pantone_assignments ENABLE TRIGGER ALL;

--
-- Data for Name: printful_sync_records; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.printful_sync_records DISABLE TRIGGER ALL;

COPY public.printful_sync_records (id, order_id, manufacturing_id, printful_order_id, printful_external_id, status, synced_line_items, tracking_info, error_message, last_sync_attempt, sync_attempts, printful_response, synced_by, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.printful_sync_records ENABLE TRIGGER ALL;

--
-- Data for Name: product_cogs; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.product_cogs DISABLE TRIGGER ALL;

COPY public.product_cogs (id, variant_id, unit_cost, last_updated, updated_by, notes, created_at, updated_at) FROM stdin;
1	21	5.00	2025-10-11 19:59:47.085981	\N	\N	2025-10-11 19:59:47.085981	2025-10-11 19:59:47.085981
\.


ALTER TABLE public.product_cogs ENABLE TRIGGER ALL;

--
-- Data for Name: product_variant_fabrics; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.product_variant_fabrics DISABLE TRIGGER ALL;

COPY public.product_variant_fabrics (id, variant_id, fabric_id, assigned_at, assigned_by) FROM stdin;
\.


ALTER TABLE public.product_variant_fabrics ENABLE TRIGGER ALL;

--
-- Data for Name: production_schedules; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.production_schedules DISABLE TRIGGER ALL;

COPY public.production_schedules (id, manufacturer_id, schedule_name, schedule_type, start_date, end_date, capacity, current_load, status, notes, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.production_schedules ENABLE TRIGGER ALL;

--
-- Data for Name: quick_action_logs; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.quick_action_logs DISABLE TRIGGER ALL;

COPY public.quick_action_logs (id, action_id, action_title, hub_id, user_id, status, current_step, step_data, result_data, error_message, entity_type, entity_id, duration, metadata, started_at, completed_at, created_at) FROM stdin;
\.


ALTER TABLE public.quick_action_logs ENABLE TRIGGER ALL;

--
-- Data for Name: quote_line_items; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.quote_line_items DISABLE TRIGGER ALL;

COPY public.quote_line_items (id, quote_id, variant_id, item_name, description, quantity, unit_price, notes, created_at, updated_at) FROM stdin;
1	8	21	SINGLET-RH-PURP	Purple  Sublimated	10	35.00	\N	2025-10-06 17:17:18.132322	2025-10-06 17:17:18.132322
2	9	21	SINGLET-RH-PURP	Purple  Sublimated	5	35.00	\N	2025-10-07 17:52:59.377208	2025-10-07 17:52:59.377208
3	10	21	SINGLET-RH-PURP	Purple  Sublimated	1	35.00	\N	2025-10-08 18:20:39.412785	2025-10-08 18:20:39.412785
4	11	24	VAR-18QKZY	Red M	5	25.50	\N	2025-11-10 22:35:04.034033	2025-11-10 22:35:04.034033
5	11	23	VAR-pi7VWP	Red M Cotton	1	29.99	\N	2025-11-10 22:35:04.034033	2025-11-10 22:35:04.034033
6	12	24	VAR-18QKZY	Red M	10	25.50	\N	2025-11-10 22:42:22.347168	2025-11-10 22:42:22.347168
7	12	23	VAR-pi7VWP	Red M Cotton	1	29.99	\N	2025-11-10 22:42:22.347168	2025-11-10 22:42:22.347168
9	13	24	VAR-18QKZY	Red M	10	25.50	\N	2025-11-10 22:50:24.4673	2025-11-10 22:50:24.4673
10	13	23	VAR-pi7VWP	Red M Cotton	1	29.99	\N	2025-11-10 22:50:24.4673	2025-11-10 22:50:24.4673
11	13	24	VAR-18QKZY	Red M	10	25.50	\N	2025-11-10 22:51:59.688073	2025-11-10 22:51:59.688073
\.


ALTER TABLE public.quote_line_items ENABLE TRIGGER ALL;

--
-- Data for Name: requests; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.requests DISABLE TRIGGER ALL;

COPY public.requests (id, type, category, priority, subject, description, entity_type, entity_id, entity_code, status, submitted_by, submitted_by_name, assigned_to, resolution, resolved_at, resolved_by, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.requests ENABLE TRIGGER ALL;

--
-- Data for Name: resources; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.resources DISABLE TRIGGER ALL;

COPY public.resources (id, name, display_name, description, resource_type, parent_resource_id, path, created_at, updated_at) FROM stdin;
1	dashboard	Dashboard	Main dashboard view	page	\N	/	2025-09-30 15:42:23.580741	2025-09-30 15:42:23.580741
2	leads	Leads	Lead management	page	\N	/leads	2025-09-30 15:42:23.625296	2025-09-30 15:42:23.625296
3	organizations	Organizations	Organization management	page	\N	/organizations	2025-09-30 15:42:23.660959	2025-09-30 15:42:23.660959
4	contacts	Contacts	Contact management	feature	\N	\N	2025-09-30 15:42:23.697052	2025-09-30 15:42:23.697052
5	catalog	Catalog	Product catalog	page	\N	/catalog	2025-09-30 15:42:23.733481	2025-09-30 15:42:23.733481
6	designJobs	Design Jobs	Design job management	page	\N	/design-jobs	2025-09-30 15:42:23.770512	2025-09-30 15:42:23.770512
7	orders	Orders	Order management	page	\N	/orders	2025-09-30 15:42:23.8055	2025-09-30 15:42:23.8055
8	manufacturing	Manufacturing	Manufacturing operations	page	\N	/manufacturing	2025-09-30 15:42:23.847177	2025-09-30 15:42:23.847177
9	salespeople	Salespeople	Salesperson management	page	\N	/salespeople	2025-09-30 15:42:23.886935	2025-09-30 15:42:23.886935
10	settings	Settings	System settings	page	\N	/settings	2025-09-30 15:42:23.923075	2025-09-30 15:42:23.923075
11	users	Users	User management	feature	\N	\N	2025-09-30 15:42:23.959289	2025-09-30 15:42:23.959289
12	designerManagement	Designer Management	Designer workflow management	page	\N	/designer-management	2025-09-30 15:42:23.994765	2025-09-30 15:42:23.994765
13	manufacturerManagement	Manufacturer Management	Manufacturer management	page	\N	/manufacturer-management	2025-09-30 15:42:24.031381	2025-09-30 15:42:24.031381
15	finance	Finance	Financial management	page	\N	/finance	2025-09-30 15:42:24.102091	2025-09-30 15:42:24.102091
16	quotes	Quotes	Quote management	page	\N	/quotes	2025-09-30 15:42:24.138081	2025-09-30 15:42:24.138081
27	tasks	Tasks	Task management system	page	\N	/tasks	2025-10-14 14:42:33.996463	2025-10-14 14:42:33.996463
28	events	Events	Event management system	page	\N	/events	2025-10-14 14:42:36.539741	2025-10-14 14:42:36.539741
18	salesAnalytics	Sales Analytics	Sales performance analytics	page	\N	/sales-analytics	2025-10-03 02:32:25.417457	2025-10-15 19:37:30.767
19	leadsTracker	Sales Tracker	Sales tracking and pipeline	page	\N	/sales-tracker	2025-10-03 02:32:25.417457	2025-10-15 19:37:30.8
20	designPortfolio	Design Portfolio	Design portfolio showcase	page	\N	/design-portfolio	2025-10-03 02:32:25.417457	2025-10-15 19:37:30.833
21	designResources	Design Resources	Design resources and assets	page	\N	/design-resources	2025-10-03 02:32:25.417457	2025-10-15 19:37:30.865
22	sizeChecker	Size Checker	Size validation tool	feature	\N	\N	2025-10-03 02:32:25.417457	2025-10-15 19:37:30.897
23	capacityDashboard	Capacity Dashboard	Manufacturing capacity overview	page	\N	/capacity-dashboard	2025-10-03 02:32:25.417457	2025-10-15 19:37:30.929
24	orderSpecifications	Order Specifications	Order specification details	page	\N	/order-specifications	2025-10-03 02:32:25.417457	2025-10-15 19:37:30.962
25	systemAnalytics	System Analytics	System-wide analytics	page	\N	/system-analytics	2025-10-03 02:32:25.417457	2025-10-15 19:37:30.994
26	connectionHealth	Connection Health	System connection monitoring	page	\N	/connection-health	2025-10-03 02:32:25.417457	2025-10-15 19:37:31.027
14	userManagement	User Management	User administration	page	\N	/user-management	2025-09-30 15:42:24.066186	2025-12-02 01:47:43.385
29	teamStores	Team Stores	Team store management	page	\N	/team-stores	2025-12-02 01:47:43.716016	2025-12-02 01:47:43.716016
\.


ALTER TABLE public.resources ENABLE TRIGGER ALL;

--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.roles DISABLE TRIGGER ALL;

COPY public.roles (id, name, display_name, description, is_system, created_at, updated_at) FROM stdin;
1	admin	Administrator	Full system access with all permissions	t	2025-09-30 15:42:23.385522	2025-09-30 15:42:23.385522
2	sales	Sales Person	Manage leads, orders, and quotes	t	2025-09-30 15:42:23.430427	2025-09-30 15:42:23.430427
3	designer	Designer	Manage design jobs and assets	t	2025-09-30 15:42:23.466293	2025-09-30 15:42:23.466293
4	ops	Operations	Manage operations, manufacturing, and fulfillment	t	2025-09-30 15:42:23.501019	2025-09-30 15:42:23.501019
5	manufacturer	Manufacturer	Manage manufacturing processes	t	2025-09-30 15:42:23.53628	2025-09-30 15:42:23.53628
6	test_custom_role_itnuvo	Test Custom Role	A test role for e2e verification	f	2025-10-14 20:45:32.161781	2025-10-14 20:45:32.161781
7	finance	Finance	Manage financial operations and invoicing	t	2025-10-15 19:37:30.452653	2025-10-15 19:37:30.452653
\.


ALTER TABLE public.roles ENABLE TRIGGER ALL;

--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.role_permissions DISABLE TRIGGER ALL;

COPY public.role_permissions (id, role_id, resource_id, can_view, can_create, can_edit, can_delete, created_at, updated_at, page_visible) FROM stdin;
19	2	3	t	t	t	f	2025-09-30 16:15:55.202457	2025-12-02 01:47:44.975	t
23	2	16	t	t	t	f	2025-09-30 16:15:55.202457	2025-12-02 01:47:45.405	t
3	1	3	t	t	t	t	2025-09-30 16:15:55.202457	2025-12-02 01:47:43.83	t
50	3	15	f	f	f	f	2025-10-02 19:38:57.439588	2025-12-02 01:47:46.359	f
107	3	23	f	f	f	f	2025-10-03 19:16:37.511701	2025-12-02 01:47:46.761	f
47	3	11	f	f	f	f	2025-10-02 19:38:57.439588	2025-12-02 01:47:46.227	f
44	3	8	f	f	f	f	2025-10-02 19:38:57.439588	2025-12-02 01:47:46.128	f
56	4	2	f	f	f	f	2025-10-02 19:55:33.854792	2025-12-02 01:47:47.008	f
106	3	22	f	f	f	f	2025-10-03 19:16:37.47765	2025-12-02 01:47:46.731	f
110	3	26	f	f	f	f	2025-10-03 19:16:37.608611	2025-12-02 01:47:46.87	f
46	3	10	f	f	f	f	2025-10-02 19:38:57.439588	2025-12-02 01:47:46.188	f
25	3	5	t	f	f	f	2025-09-30 16:15:55.202457	2025-12-02 01:47:46.011	t
72	5	6	f	f	f	f	2025-10-02 19:55:38.793936	2025-12-02 01:47:47.985	f
65	4	3	t	f	f	f	2025-10-02 19:55:35.837288	2025-12-02 01:47:47.039	t
111	4	18	f	f	f	f	2025-10-03 19:16:38.17931	2025-12-02 01:47:47.475	f
28	4	5	t	t	t	t	2025-09-30 16:15:55.202457	2025-12-02 01:47:47.104	t
55	3	12	t	f	f	f	2025-10-02 19:38:59.063218	2025-12-02 01:47:46.261	t
81	2	18	t	f	f	f	2025-10-03 02:32:37.757779	2025-12-02 01:47:45.436	t
80	5	16	f	f	f	f	2025-10-02 19:55:38.793936	2025-12-02 01:47:48.316	f
51	3	16	f	f	f	f	2025-10-02 19:38:57.439588	2025-12-02 01:47:46.508	f
86	5	23	t	f	f	f	2025-10-03 02:32:42.443899	2025-12-02 01:47:48.538	t
74	5	9	f	f	f	f	2025-10-02 19:55:38.793936	2025-12-02 01:47:48.098	f
84	3	21	t	f	f	f	2025-10-03 02:32:39.740316	2025-12-02 01:47:46.69	t
83	3	20	t	t	t	f	2025-10-03 02:32:39.740316	2025-12-02 01:47:46.652	t
38	2	12	f	f	f	f	2025-10-02 19:38:24.937827	2025-12-02 01:47:45.27	f
59	4	11	f	f	f	f	2025-10-02 19:55:33.854792	2025-12-02 01:47:47.289	f
61	4	13	t	t	t	f	2025-10-02 19:55:33.854792	2025-12-02 01:47:47.352	t
114	4	21	f	f	f	f	2025-10-03 19:16:38.278052	2025-12-02 01:47:47.568	f
30	4	8	t	t	t	f	2025-09-30 16:15:55.202457	2025-12-02 01:47:47.197	t
85	4	22	t	t	t	f	2025-10-03 02:32:41.262762	2025-12-02 01:47:47.598	t
112	4	19	f	f	f	f	2025-10-03 19:16:38.21262	2025-12-02 01:47:47.506	f
57	4	9	t	f	f	f	2025-10-02 19:55:33.854792	2025-12-02 01:47:49.855	t
22	2	7	t	t	t	f	2025-09-30 16:15:55.202457	2025-12-02 01:47:45.108	t
60	4	12	t	f	f	f	2025-10-02 19:55:33.854792	2025-12-02 01:47:47.32	t
4	1	4	t	t	t	t	2025-09-30 16:15:55.202457	2025-12-02 01:47:43.862	t
24	3	1	t	f	f	f	2025-09-30 16:15:55.202457	2025-12-02 01:47:45.851	t
58	4	10	f	f	f	f	2025-10-02 19:55:33.854792	2025-12-02 01:47:47.258	f
97	2	20	f	f	f	f	2025-10-03 19:16:36.585006	2025-12-02 01:47:45.504	f
16	1	16	t	t	t	t	2025-09-30 16:15:55.202457	2025-12-02 01:47:44.451	t
108	3	24	f	f	f	f	2025-10-03 19:16:37.543767	2025-12-02 01:47:46.793	f
109	3	25	f	f	f	f	2025-10-03 19:16:37.576219	2025-12-02 01:47:46.836	f
113	4	20	f	f	f	f	2025-10-03 19:16:38.244908	2025-12-02 01:47:47.537	f
7	1	7	t	t	t	t	2025-09-30 16:15:55.202457	2025-12-02 01:47:43.964	t
17	2	1	t	f	f	f	2025-09-30 16:15:55.202457	2025-12-02 01:47:44.868	t
69	5	3	f	f	f	f	2025-10-02 19:55:38.793936	2025-12-02 01:47:47.888	f
10	1	10	t	t	t	f	2025-09-30 16:15:55.202457	2025-12-02 01:47:44.257	t
9	1	9	t	t	t	t	2025-09-30 16:15:55.202457	2025-12-02 01:47:49.793	t
79	5	15	f	f	f	f	2025-10-02 19:55:38.793936	2025-12-02 01:47:48.285	f
78	5	14	f	f	f	f	2025-10-02 19:55:38.793936	2025-12-02 01:47:48.255	f
87	5	24	t	t	t	f	2025-10-03 02:32:42.443899	2025-12-02 01:47:48.569	t
76	5	11	f	f	f	f	2025-10-02 19:55:38.793936	2025-12-02 01:47:48.161	f
67	4	6	t	t	t	f	2025-10-02 19:55:35.837288	2025-12-02 01:47:47.135	t
70	5	4	f	f	f	f	2025-10-02 19:55:38.793936	2025-12-02 01:47:47.923	f
71	5	5	t	f	f	f	2025-10-02 19:55:38.793936	2025-12-02 01:47:47.954	t
77	5	12	f	f	f	f	2025-10-02 19:55:38.793936	2025-12-02 01:47:48.192	f
32	5	8	t	t	t	f	2025-09-30 16:15:55.202457	2025-12-02 01:47:48.05	t
29	4	7	t	t	t	f	2025-09-30 16:15:55.202457	2025-12-02 01:47:47.166	t
14	1	14	t	t	t	t	2025-09-30 16:15:55.202457	2025-12-02 01:47:44.39	t
64	4	16	t	f	f	f	2025-10-02 19:55:33.854792	2025-12-02 01:47:47.444	t
93	1	21	t	t	t	f	2025-10-03 19:16:35.791054	2025-12-02 01:47:44.586	t
42	2	9	t	f	f	f	2025-10-02 19:38:28.200349	2025-12-02 01:47:49.824	t
92	1	20	t	f	f	f	2025-10-03 19:16:35.758473	2025-12-02 01:47:44.555	t
6	1	6	t	t	t	t	2025-09-30 16:15:55.202457	2025-12-02 01:47:43.931	t
13	1	13	t	t	t	t	2025-09-30 16:15:55.202457	2025-12-02 01:47:44.358	t
94	1	22	t	t	t	f	2025-10-03 19:16:35.823633	2025-12-02 01:47:44.627	t
99	2	22	f	f	f	f	2025-10-03 19:16:36.650035	2025-12-02 01:47:45.602	f
88	1	25	t	f	f	f	2025-10-03 02:32:46.860032	2025-12-02 01:47:44.727	t
12	1	12	t	t	t	t	2025-09-30 16:15:55.202457	2025-12-02 01:47:44.326	t
90	1	18	t	f	f	f	2025-10-03 19:16:35.686071	2025-12-02 01:47:44.49	t
96	1	24	t	t	t	f	2025-10-03 19:16:35.888724	2025-12-02 01:47:44.696	t
26	3	6	t	t	t	f	2025-09-30 16:15:55.202457	2025-12-02 01:47:46.044	t
34	2	15	f	f	f	f	2025-10-02 19:38:01.188049	2025-12-02 01:47:45.374	f
35	2	8	f	f	f	f	2025-10-02 19:38:24.937827	2025-12-02 01:47:45.14	f
41	2	6	t	t	t	f	2025-10-02 19:38:26.560703	2025-12-02 01:47:45.073	t
18	2	2	t	t	t	f	2025-09-30 16:15:55.202457	2025-12-02 01:47:44.905	t
40	2	14	f	f	f	f	2025-10-02 19:38:24.937827	2025-12-02 01:47:45.342	f
98	2	21	f	f	f	f	2025-10-03 19:16:36.617328	2025-12-02 01:47:45.553	f
103	2	26	f	f	f	f	2025-10-03 19:16:36.784288	2025-12-02 01:47:45.741	f
43	3	2	f	f	f	f	2025-10-02 19:38:57.439588	2025-12-02 01:47:45.886	f
1	1	1	t	t	t	f	2025-09-30 16:15:55.202457	2025-12-02 01:47:43.762	t
101	2	24	f	f	f	f	2025-10-03 19:16:36.715921	2025-12-02 01:47:45.677	f
37	2	11	f	f	f	f	2025-10-02 19:38:24.937827	2025-12-02 01:47:45.238	f
49	3	14	f	f	f	f	2025-10-02 19:38:57.439588	2025-12-02 01:47:46.327	f
104	3	18	f	f	f	f	2025-10-03 19:16:37.3444	2025-12-02 01:47:46.569	f
53	3	4	t	f	f	f	2025-10-02 19:38:59.063218	2025-12-02 01:47:45.967	t
115	4	23	f	f	f	f	2025-10-03 19:16:38.344567	2025-12-02 01:47:47.631	f
100	2	23	f	f	f	f	2025-10-03 19:16:36.682782	2025-12-02 01:47:45.646	f
48	3	13	f	f	f	f	2025-10-02 19:38:57.439588	2025-12-02 01:47:46.295	f
54	3	7	t	f	f	f	2025-10-02 19:38:59.063218	2025-12-02 01:47:46.085	t
52	3	3	t	f	f	f	2025-10-02 19:38:59.063218	2025-12-02 01:47:45.922	t
45	3	9	f	f	f	f	2025-10-02 19:38:57.439588	2025-12-02 01:47:46.159	f
105	3	19	f	f	f	f	2025-10-03 19:16:37.376884	2025-12-02 01:47:46.608	f
27	4	1	t	f	f	f	2025-09-30 16:15:55.202457	2025-12-02 01:47:46.972	t
33	5	13	t	f	f	f	2025-09-30 16:15:55.202457	2025-12-02 01:47:48.224	t
73	5	7	t	f	f	f	2025-10-02 19:55:38.793936	2025-12-02 01:47:48.019	t
75	5	10	f	f	f	f	2025-10-02 19:55:38.793936	2025-12-02 01:47:48.129	f
62	4	14	f	f	f	f	2025-10-02 19:55:33.854792	2025-12-02 01:47:47.382	f
66	4	4	t	f	f	f	2025-10-02 19:55:35.837288	2025-12-02 01:47:47.074	t
63	4	15	t	f	f	f	2025-10-02 19:55:33.854792	2025-12-02 01:47:47.413	t
102	2	25	f	f	f	f	2025-10-03 19:16:36.750008	2025-12-02 01:47:45.709	f
39	2	13	f	f	f	f	2025-10-02 19:38:24.937827	2025-12-02 01:47:45.302	f
20	2	4	t	t	t	f	2025-09-30 16:15:55.202457	2025-12-02 01:47:45.009	t
21	2	5	t	f	f	f	2025-09-30 16:15:55.202457	2025-12-02 01:47:45.042	t
36	2	10	f	f	f	f	2025-10-02 19:38:24.937827	2025-12-02 01:47:45.205	f
82	2	19	t	t	t	f	2025-10-03 02:32:37.757779	2025-12-02 01:47:45.47	t
136	6	13	f	f	f	f	2025-10-14 20:45:32.231429	2025-10-14 20:45:32.231429	f
137	6	16	t	t	t	f	2025-10-14 20:45:32.255128	2025-10-14 20:45:32.255128	t
138	6	5	t	f	f	f	2025-10-14 20:45:32.27372	2025-10-14 20:45:32.27372	t
139	6	3	t	f	f	f	2025-10-14 20:45:32.285741	2025-10-14 20:45:32.285741	t
140	6	26	f	f	f	f	2025-10-14 20:45:32.290501	2025-10-14 20:45:32.290501	f
141	6	14	f	f	f	f	2025-10-14 20:45:32.291091	2025-10-14 20:45:32.291091	f
142	6	23	f	f	f	f	2025-10-14 20:45:32.295358	2025-10-14 20:45:32.295358	f
143	6	11	f	f	f	f	2025-10-14 20:45:32.298336	2025-10-14 20:45:32.298336	f
144	6	8	f	f	f	f	2025-10-14 20:45:32.308562	2025-10-14 20:45:32.308562	f
145	6	20	f	f	f	f	2025-10-14 20:45:32.311309	2025-10-14 20:45:32.311309	f
146	6	24	f	f	f	f	2025-10-14 20:45:32.312108	2025-10-14 20:45:32.312108	f
147	6	7	t	t	t	f	2025-10-14 20:45:32.30818	2025-10-14 20:45:32.30818	t
148	6	18	t	f	f	f	2025-10-14 20:45:32.314904	2025-10-14 20:45:32.314904	t
149	6	4	t	f	f	f	2025-10-14 20:45:32.317645	2025-10-14 20:45:32.317645	t
150	6	6	t	t	t	f	2025-10-14 20:45:32.319141	2025-10-14 20:45:32.319141	t
151	6	25	f	f	f	f	2025-10-14 20:45:32.316847	2025-10-14 20:45:32.316847	f
152	6	12	f	f	f	f	2025-10-14 20:45:32.319556	2025-10-14 20:45:32.319556	f
153	6	19	t	t	t	f	2025-10-14 20:45:32.32317	2025-10-14 20:45:32.32317	t
154	6	15	f	f	f	f	2025-10-14 20:45:32.328897	2025-10-14 20:45:32.328897	f
155	6	21	f	f	f	f	2025-10-14 20:45:32.329232	2025-10-14 20:45:32.329232	f
156	6	2	t	t	t	f	2025-10-14 20:45:32.332561	2025-10-14 20:45:32.332561	f
157	6	1	t	f	f	f	2025-10-14 20:45:32.333323	2025-10-14 20:45:32.333323	t
158	6	22	f	f	f	f	2025-10-14 20:45:32.333644	2025-10-14 20:45:32.333644	f
159	6	9	t	f	f	f	2025-10-14 20:45:32.336935	2025-10-14 20:45:32.336935	t
160	6	10	f	f	f	f	2025-10-14 20:45:32.337784	2025-10-14 20:45:32.337784	f
161	6	27	t	t	t	f	2025-10-14 20:45:32.338863	2025-10-14 20:45:32.338863	t
162	6	28	t	t	t	f	2025-10-14 20:45:32.338788	2025-10-14 20:45:32.338788	t
130	3	27	t	t	t	f	2025-10-14 14:43:49.2482	2025-12-02 01:47:46.94	t
116	4	24	f	f	f	f	2025-10-03 19:16:38.377536	2025-12-02 01:47:47.662	f
117	4	25	f	f	f	f	2025-10-03 19:16:38.410286	2025-12-02 01:47:47.693	f
118	4	26	f	f	f	f	2025-10-03 19:16:38.443338	2025-12-02 01:47:47.723	f
133	4	28	t	t	t	f	2025-10-14 14:43:49.2482	2025-12-02 01:47:47.754	t
132	4	27	t	t	t	f	2025-10-14 14:43:49.2482	2025-12-02 01:47:47.785	t
31	5	1	t	f	f	f	2025-09-30 16:15:55.202457	2025-12-02 01:47:47.817	t
68	5	2	f	f	f	f	2025-10-02 19:55:38.793936	2025-12-02 01:47:47.851	f
119	5	18	f	f	f	f	2025-10-03 19:16:39.020708	2025-12-02 01:47:48.348	f
120	5	19	f	f	f	f	2025-10-03 19:16:39.053309	2025-12-02 01:47:48.38	f
121	5	20	f	f	f	f	2025-10-03 19:16:39.084602	2025-12-02 01:47:48.425	f
122	5	21	f	f	f	f	2025-10-03 19:16:39.117574	2025-12-02 01:47:48.465	f
123	5	22	f	f	f	f	2025-10-03 19:16:39.150218	2025-12-02 01:47:48.507	f
167	7	5	t	f	f	f	2025-10-15 19:37:35.635734	2025-12-02 01:47:48.847	t
168	7	6	f	f	f	f	2025-10-15 19:37:35.671061	2025-12-02 01:47:48.879	f
169	7	7	t	f	f	f	2025-10-15 19:37:35.70364	2025-12-02 01:47:48.91	t
170	7	8	f	f	f	f	2025-10-15 19:37:35.735787	2025-12-02 01:47:48.949	f
171	7	9	t	f	f	f	2025-10-15 19:37:35.768066	2025-12-02 01:47:48.981	t
172	7	10	f	f	f	f	2025-10-15 19:37:35.800239	2025-12-02 01:47:49.012	f
173	7	11	t	f	f	f	2025-10-15 19:37:35.832261	2025-12-02 01:47:49.043	t
174	7	12	f	f	f	f	2025-10-15 19:37:35.864474	2025-12-02 01:47:49.073	f
175	7	13	f	f	f	f	2025-10-15 19:37:35.896447	2025-12-02 01:47:49.107	f
176	7	14	f	f	f	f	2025-10-15 19:37:35.929047	2025-12-02 01:47:49.14	f
177	7	15	t	t	t	f	2025-10-15 19:37:35.960091	2025-12-02 01:47:49.171	t
178	7	16	t	t	t	f	2025-10-15 19:37:35.991886	2025-12-02 01:47:49.204	t
179	7	18	t	f	f	f	2025-10-15 19:37:36.024666	2025-12-02 01:47:49.234	t
180	7	19	f	f	f	f	2025-10-15 19:37:36.057235	2025-12-02 01:47:49.312	f
181	7	20	f	f	f	f	2025-10-15 19:37:36.089458	2025-12-02 01:47:49.387	f
182	7	21	f	f	f	f	2025-10-15 19:37:36.121487	2025-12-02 01:47:49.459	f
183	7	22	f	f	f	f	2025-10-15 19:37:36.154069	2025-12-02 01:47:49.527	f
184	7	23	f	f	f	f	2025-10-15 19:37:36.186017	2025-12-02 01:47:49.571	f
188	7	28	t	f	f	f	2025-10-15 19:37:36.314686	2025-12-02 01:47:49.731	t
189	7	27	t	t	t	f	2025-10-15 19:37:36.345471	2025-12-02 01:47:49.762	t
185	7	24	f	f	f	f	2025-10-15 19:37:36.218094	2025-12-02 01:47:49.603	f
186	7	25	t	f	f	f	2025-10-15 19:37:36.250062	2025-12-02 01:47:49.669	t
187	7	26	f	f	f	f	2025-10-15 19:37:36.28206	2025-12-02 01:47:49.7	f
124	5	25	f	f	f	f	2025-10-03 19:16:39.249629	2025-12-02 01:47:48.599	f
125	5	26	f	f	f	f	2025-10-03 19:16:39.2822	2025-12-02 01:47:48.63	f
135	5	28	f	f	f	f	2025-10-14 14:43:49.2482	2025-12-02 01:47:48.661	f
134	5	27	t	t	t	f	2025-10-14 14:43:49.2482	2025-12-02 01:47:48.692	t
2	1	2	t	t	t	t	2025-09-30 16:15:55.202457	2025-12-02 01:47:43.799	t
5	1	5	t	t	t	t	2025-09-30 16:15:55.202457	2025-12-02 01:47:43.894	t
8	1	8	t	t	t	t	2025-09-30 16:15:55.202457	2025-12-02 01:47:44.159	t
11	1	11	t	t	t	t	2025-09-30 16:15:55.202457	2025-12-02 01:47:44.288	t
15	1	15	t	t	t	f	2025-09-30 16:15:55.202457	2025-12-02 01:47:44.421	t
91	1	19	t	t	t	f	2025-10-03 19:16:35.725886	2025-12-02 01:47:44.522	t
95	1	23	t	f	f	f	2025-10-03 19:16:35.856268	2025-12-02 01:47:44.658	t
89	1	26	t	f	f	f	2025-10-03 02:32:46.860032	2025-12-02 01:47:44.761	t
127	1	28	t	t	t	t	2025-10-14 14:43:49.2482	2025-12-02 01:47:44.802	t
126	1	27	t	t	t	t	2025-10-14 14:43:49.2482	2025-12-02 01:47:44.836	t
129	2	28	t	t	t	f	2025-10-14 14:43:49.2482	2025-12-02 01:47:45.774	t
128	2	27	t	t	t	f	2025-10-14 14:43:49.2482	2025-12-02 01:47:45.815	t
131	3	28	f	f	f	f	2025-10-14 14:43:49.2482	2025-12-02 01:47:46.908	f
163	7	1	t	f	f	f	2025-10-15 19:37:35.467363	2025-12-02 01:47:48.723	t
164	7	2	f	f	f	f	2025-10-15 19:37:35.506221	2025-12-02 01:47:48.754	f
165	7	3	t	f	f	f	2025-10-15 19:37:35.540395	2025-12-02 01:47:48.785	t
166	7	4	t	f	f	f	2025-10-15 19:37:35.590124	2025-12-02 01:47:48.815	t
\.


ALTER TABLE public.role_permissions ENABLE TRIGGER ALL;

--
-- Data for Name: sales_resources; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.sales_resources DISABLE TRIGGER ALL;

COPY public.sales_resources (id, name, description, file_url, file_type, file_size, category, uploaded_by, downloads, created_at, updated_at) FROM stdin;
1	Q4 Product Catalog	2024 Q4 sports apparel catalog	https://example.com/catalog.pdf	pdf	\N	\N	test-admin-automated-auth	0	2025-10-14 03:24:49.163	2025-10-14 03:24:49.163
2	Test Resource	Test description	https://example.com/test.pdf	pdf	\N	\N	admin-test-123	2	2025-10-14 03:30:59.037927	2025-10-14 03:30:59.037927
\.


ALTER TABLE public.sales_resources ENABLE TRIGGER ALL;

--
-- Data for Name: salespersons; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.salespersons DISABLE TRIGGER ALL;

COPY public.salespersons (id, user_id, territory, quota_monthly, active, notes, default_org_scope, created_at, updated_at, commission_rate, max_leads_per_week, auto_assign_leads, workload_score, last_assigned_at, preferred_client_types, skills) FROM stdin;
1	54c442d2-114e-444d-9832-0eeb719f7bed	National / Ops assist	30000.00	t	Co-founder; daily ops & reviews.	\N	2025-09-26 20:25:31.859448	2025-09-26 20:25:31.859448	0.1000	50	t	0.00	\N	\N	\N
3	1afdf7c4-c2d6-458f-8a8e-b8242d366024	Low-income focus (AL)	12000.00	t	HS wrestling coach.	\N	2025-09-26 20:25:31.976881	2025-09-26 20:25:31.976881	0.1000	50	t	0.00	\N	\N	\N
4	0c17b360-653e-4581-9444-d21613863b48	Central Texas (DFW)	15000.00	t	New rep; handles Upwork creatives sync.	\N	2025-09-26 20:25:32.028678	2025-09-26 20:25:32.028678	0.1000	50	t	0.00	\N	\N	\N
6	dee15298-a714-408c-bacd-09a9e1af5b68	Southwest	30000.00	t			2025-09-27 17:09:05.619845	2025-09-27 17:09:05.619845	0.1000	50	t	0.00	\N	\N	\N
8	b7f37c3a-b1cf-4309-a9f7-6db2ba2b34b5	Southeast (AL/GA/FL)	20000.00	t	Director of Sales; strong HS football/tennis network.	\N	2025-09-30 15:42:20.454563	2025-09-30 15:42:20.454563	0.1000	50	t	0.00	\N	\N	\N
9	sales_user_test	Northwest	0.00	t	\N	\N	2025-10-10 18:24:15.250788	2025-10-10 18:24:15.250788	0.1000	50	t	0.00	\N	\N	\N
\.


ALTER TABLE public.salespersons ENABLE TRIGGER ALL;

--
-- Data for Name: saved_views; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.saved_views DISABLE TRIGGER ALL;

COPY public.saved_views (id, user_id, page_key, name, query_blob, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.saved_views ENABLE TRIGGER ALL;

--
-- Data for Name: schema_version; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.schema_version DISABLE TRIGGER ALL;

COPY public.schema_version (version) FROM stdin;
\.


ALTER TABLE public.schema_version ENABLE TRIGGER ALL;

--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.sessions DISABLE TRIGGER ALL;

COPY public.sessions (sid, sess, expire) FROM stdin;
jE8UktYWUqnVMkGJWoAZ5PC1MJkbB1PN	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-16T21:19:51.018Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "JE56pMlZKMhIVEMahFsrNzGVXMY4BohLrxGXQBPkBZM"}}	2025-12-16 21:19:52
c760ae1383c9dc1a3ce0f927c2ea4b1f03bc4cdcdf4aa1ecd3c7d00569c68eb5	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-19T05:59:14.267Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "test-audience", "exp": 1766123954, "iat": 1765519154, "iss": "test-issuer", "sub": "test-sales-automated-auth", "role": "sales", "email": "test-sales@automated-testing.local", "last_name": "Sales", "first_name": "Test"}, "userData": {"id": "test-sales-automated-auth", "name": "Test Sales (Automated)", "role": "sales", "email": "test-sales@automated-testing.local", "phone": null, "isActive": true, "lastName": "Sales", "avatarUrl": null, "createdAt": "2025-12-12T05:59:14.267Z", "firstName": "Test", "updatedAt": "2025-12-12T05:59:14.267Z", "passwordHash": null, "profileImageUrl": null}, "expires_at": 1766123954, "access_token": "test_access_token_1765519154267", "refresh_token": "test_refresh_token_1765519154267"}}}	2025-12-19 05:59:14.267
Z7-YPBHL0qUDtfsR5cWXWltQNz4xskCT	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-19T05:03:13.571Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "eusUVJQM6ulPT5sQBbeR1oOX3SXu6lhQoAI2lHlcLP8"}}	2025-12-19 05:03:14
aprtjQY8tMtPRQE3kGMoxhLg3ImHro8K	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-16T21:13:13.187Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "6POUtPue1I9YuCrRJI6m2YuhnV7iPpueil3yeRC9whE"}}	2025-12-16 21:13:14
LmIuHmvadmQTEk3vBJOTfnz2OLqzF0JS	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-18T17:23:27.257Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "49RJvnXxJQMgdJZVk5AVGqZUQNeyjkf80LAD0uABJpY"}}	2025-12-18 17:23:28
ceb9580d13b5736f58802d2385daa5a7aba4d357de0ccbb32c5cc0cc208d35dc	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-19T06:02:56.043Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "test-audience", "exp": 1766124173, "iat": 1765519373, "iss": "test-issuer", "sub": "test-manufacturer-automated-auth", "role": "manufacturer", "email": "test-manufacturer@automated-testing.local", "last_name": "Manufacturer", "first_name": "Test"}, "userData": {"id": "test-manufacturer-automated-auth", "name": "Test Manufacturer (Automated)", "role": "manufacturer", "email": "test-manufacturer@automated-testing.local", "phone": null, "active": true, "isActive": true, "lastName": "Manufacturer", "avatarUrl": null, "createdAt": "2025-12-12T06:02:53.133Z", "firstName": "Test", "invitedAt": null, "invitedBy": null, "isInvited": false, "updatedAt": "2025-12-12T06:02:53.133Z", "passwordHash": "$2b$10$m/RfDTwFhulSDKxwJNYAsO2TDcqOUV4unJwDrgIMjBxcomDE3dZ5q", "profileImageUrl": null, "hasCompletedSetup": false}, "expires_at": 1766124173, "access_token": "test_access_token_1765519373152", "refresh_token": "test_refresh_token_1765519373152"}}}	2025-12-19 06:02:57
QTXlEE_Xs6x15nOjsRYe2Vw9UPAeVjZ3	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-19T00:42:01.250Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "poXZphosqotw3gWuQLM3aSlDnjIH-TpHeIJpRE2xPac"}}	2025-12-19 00:42:02
VcAI5DLy1i5eJXovF1oV6G2e5xAroZTx	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-19T04:55:19.656Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "r8BYXgO5uvvUjMeFImfLm_2tRtQe-ryGPg2qrp81Opw"}}	2025-12-19 04:55:20
ekUkYsP2oYmF6ll9NUMttTOkNerC9pTZ	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-16T21:02:15.020Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "jNUW1hm4cLk7wFiNdEFZV5YAthDMz736G30euPWQgPc"}}	2025-12-16 21:02:28
TOcZzw6QUDZIa0Rb3UzAqUGSOe7OUt8O	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-16T21:08:50.982Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "pvc4eBILnmsPizn5J26EmwPDP4X7ZOkJQEyQcF-QeBM"}}	2025-12-16 21:08:51
64954c3283b8698e66e24f750ea48f2e73b2a8d6049940d53e481bf4e38e8e19	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-19T06:10:27.917Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "test-audience", "exp": 1766124599, "iat": 1765519799, "iss": "test-issuer", "sub": "test-sales-automated-auth", "role": "sales", "email": "test-sales@automated-testing.local", "last_name": "Sales", "first_name": "Test"}, "userData": {"id": "test-sales-automated-auth", "name": "Test Sales (Automated)", "role": "sales", "email": "test-sales@automated-testing.local", "phone": null, "active": true, "isActive": true, "lastName": "Sales", "avatarUrl": null, "createdAt": "2025-12-12T05:59:14.243Z", "firstName": "Test", "invitedAt": null, "invitedBy": null, "isInvited": false, "updatedAt": "2025-12-12T05:59:14.243Z", "passwordHash": "$2b$10$KJH1uhrkcAGuq8xPSdApAurdlmfygl60F7hK5ap2dE8SVQ0HrrqES", "profileImageUrl": null, "hasCompletedSetup": false}, "expires_at": 1766124599, "access_token": "test_access_token_1765519799502", "refresh_token": "test_refresh_token_1765519799502"}}}	2025-12-19 06:10:39
3d3673e1987609f5ef2b2ba0e434647b632724a204d69911398e7bc90f6b02a4	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-19T06:02:38.825Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "test-audience", "exp": 1766124109, "iat": 1765519309, "iss": "test-issuer", "sub": "test-sales-automated-auth", "role": "sales", "email": "test-sales@automated-testing.local", "last_name": "Sales", "first_name": "Test"}, "userData": {"id": "test-sales-automated-auth", "name": "Test Sales (Automated)", "role": "sales", "email": "test-sales@automated-testing.local", "phone": null, "active": true, "isActive": true, "lastName": "Sales", "avatarUrl": null, "createdAt": "2025-12-12T05:59:14.243Z", "firstName": "Test", "invitedAt": null, "invitedBy": null, "isInvited": false, "updatedAt": "2025-12-12T05:59:14.243Z", "passwordHash": "$2b$10$KJH1uhrkcAGuq8xPSdApAurdlmfygl60F7hK5ap2dE8SVQ0HrrqES", "profileImageUrl": null, "hasCompletedSetup": false}, "expires_at": 1766124109, "access_token": "test_access_token_1765519309323", "refresh_token": "test_refresh_token_1765519309323"}}}	2025-12-19 06:02:54
ACEDEA4PoNrZUF4mE3ok_Wot0qxSw_ix	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-22T04:57:39.185Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604799997}, "passport": {"user": {"claims": {"aud": "d26b14ad-4aa5-411a-9f01-b990b9b30135", "exp": 1765775874, "iat": 1765772274, "iss": "https://replit.com/oidc", "sub": "41090967", "email": "samsutton@rich-habits.com", "at_hash": "PGuhOrmKo4etQ6CnU49JEw", "username": "samsutton", "auth_time": 1765532188, "last_name": null, "first_name": null}, "userData": {"id": "41090967", "name": "samsutton@rich-habits.com", "role": "admin", "email": "samsutton@rich-habits.com", "phone": null, "active": true, "isActive": true, "lastName": null, "avatarUrl": null, "createdAt": "2025-09-26T18:30:32.672Z", "firstName": null, "invitedAt": null, "invitedBy": null, "isInvited": false, "updatedAt": "2025-12-12T09:36:28.751Z", "passwordHash": null, "profileImageUrl": null, "salesMapEnabled": false, "hasCompletedSetup": false}, "expires_at": 1765775874, "access_token": "L173LgpiL1ZKSNw_lWMYbxBOi8LjD6hE2-jsigvWVig", "refresh_token": "0q2EB_eUMG9sroE2252ZKluZhTfhO7jvANTFFISniFo"}}}	2025-12-22 04:57:40
46535b6bb4b0476f0b7f00006cb2420738fe2b872cd4b4f22c3648b0802813fa	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-19T06:14:18.042Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "test-audience", "exp": 1766124858, "iat": 1765520058, "iss": "test-issuer", "sub": "test-designer-automated-auth", "role": "designer", "email": "test-designer@automated-testing.local", "last_name": "Designer", "first_name": "Test"}, "userData": {"id": "test-designer-automated-auth", "name": "Test Designer (Automated)", "role": "designer", "email": "test-designer@automated-testing.local", "phone": null, "isActive": true, "lastName": "Designer", "avatarUrl": null, "createdAt": "2025-12-12T06:14:18.042Z", "firstName": "Test", "updatedAt": "2025-12-12T06:14:18.042Z", "passwordHash": null, "profileImageUrl": null}, "expires_at": 1766124858, "access_token": "test_access_token_1765520058042", "refresh_token": "test_refresh_token_1765520058042"}}}	2025-12-19 06:14:18.042
7cc65f0d4feec7ce1b159eba72f3f926dc10daad298355e6ea3d5e8069e23081	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-19T06:14:54.695Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "test-audience", "exp": 1766124892, "iat": 1765520092, "iss": "test-issuer", "sub": "test-designer-automated-auth", "role": "designer", "email": "test-designer@automated-testing.local", "last_name": "Designer", "first_name": "Test"}, "userData": {"id": "test-designer-automated-auth", "name": "Test Designer (Automated)", "role": "designer", "email": "test-designer@automated-testing.local", "phone": null, "active": true, "isActive": true, "lastName": "Designer", "avatarUrl": null, "createdAt": "2025-12-12T06:14:18.018Z", "firstName": "Test", "invitedAt": null, "invitedBy": null, "isInvited": false, "updatedAt": "2025-12-12T06:14:18.018Z", "passwordHash": "$2b$10$daNore8YPB0yPYFamoubGeGRHCsHnsDAGW7PWf3X01oUL3Ro1OmMK", "profileImageUrl": null, "hasCompletedSetup": false}, "expires_at": 1766124892, "access_token": "test_access_token_1765520092740", "refresh_token": "test_refresh_token_1765520092740"}}}	2025-12-19 06:15:11
cWUhuarS6dMfhGuaMn1xTI9Dh2_IvQH4	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-16T22:17:08.105Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "jKg1LJkWbRiu2O0wJD7osmGrfceB7pvB2-W0U4cgYJs"}}	2025-12-16 22:17:09
fbf0acc0d6294cf6db2e12a830e1e0b95b41e5695b3a326a7517791697b81218	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-19T06:11:09.664Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "test-audience", "exp": 1766124638, "iat": 1765519838, "iss": "test-issuer", "sub": "test-manufacturer-automated-auth", "role": "manufacturer", "email": "test-manufacturer@automated-testing.local", "last_name": "Manufacturer", "first_name": "Test"}, "userData": {"id": "test-manufacturer-automated-auth", "name": "Test Manufacturer (Automated)", "role": "manufacturer", "email": "test-manufacturer@automated-testing.local", "phone": null, "active": true, "isActive": true, "lastName": "Manufacturer", "avatarUrl": null, "createdAt": "2025-12-12T06:02:53.133Z", "firstName": "Test", "invitedAt": null, "invitedBy": null, "isInvited": false, "updatedAt": "2025-12-12T06:02:53.133Z", "passwordHash": "$2b$10$m/RfDTwFhulSDKxwJNYAsO2TDcqOUV4unJwDrgIMjBxcomDE3dZ5q", "profileImageUrl": null, "hasCompletedSetup": false}, "expires_at": 1766124638, "access_token": "test_access_token_1765519838274", "refresh_token": "test_refresh_token_1765519838274"}}}	2025-12-19 06:11:10
8c3cd7ec2a81bd88d9ebb26210d1435d978bf5c06a273cc27c3d730ae6180304	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-19T06:15:10.403Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "test-audience", "exp": 1766124910, "iat": 1765520110, "iss": "test-issuer", "sub": "test-ops-automated-auth", "role": "ops", "email": "test-ops@automated-testing.local", "last_name": "Ops", "first_name": "Test"}, "userData": {"id": "test-ops-automated-auth", "name": "Test Ops (Automated)", "role": "ops", "email": "test-ops@automated-testing.local", "phone": null, "isActive": true, "lastName": "Ops", "avatarUrl": null, "createdAt": "2025-12-12T06:15:10.403Z", "firstName": "Test", "updatedAt": "2025-12-12T06:15:10.403Z", "passwordHash": null, "profileImageUrl": null}, "expires_at": 1766124910, "access_token": "test_access_token_1765520110403", "refresh_token": "test_refresh_token_1765520110403"}}}	2025-12-19 06:15:10.403
3bb5eb35f13c100228e966a66bc4a5cca4d787522de321966e93c306177961e7	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-19T06:13:45.405Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "test-audience", "exp": 1766124825, "iat": 1765520025, "iss": "test-issuer", "sub": "test-admin-automated-auth", "role": "admin", "email": "test-admin@automated-testing.local", "last_name": "Admin", "first_name": "Test"}, "userData": {"id": "test-admin-automated-auth", "name": "Test Admin", "role": "admin", "email": "test-admin@automated-testing.local", "phone": null, "isActive": true, "lastName": "Admin", "avatarUrl": null, "createdAt": "2025-12-12T06:13:45.405Z", "firstName": "Test", "updatedAt": "2025-12-12T06:13:45.405Z", "passwordHash": null, "profileImageUrl": null}, "expires_at": 1766124825, "access_token": "test_access_token_1765520025405", "refresh_token": "test_refresh_token_1765520025405"}}}	2025-12-19 06:14:19
2Y8u6aYZWaiaUaWQouztsp3t1YZ2vd78	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-22T02:25:56.811Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "6_TMdbaZnOnVs1SaZHV9Q22_F5M7XiMxnY2sSSQZJYU"}}	2025-12-22 02:25:57
J_Pp-2lVptL51LPemkSc2Ta39Oal3NP6	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-19T11:48:33.011Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "UVmwQGSuSmQjjfYvj1JZaHks86SJ0YOFcJCi9qIR48o"}}	2025-12-19 11:48:34
e6vIzBF4TEpQLw24lSVuav_EuUfINzSO	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-22T04:57:39.908Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604799999}, "passport": {"user": {"claims": {"aud": "local-auth", "exp": 1766372627, "iat": 1765767827, "iss": "local-auth", "sub": "3f35cb86-89b4-4359-a87a-4da43fd2eb96", "role": "manufacturer", "email": "testmanu@rich-habits.com", "last_name": "Manufacturing", "first_name": "Test"}, "userData": {"id": "3f35cb86-89b4-4359-a87a-4da43fd2eb96", "name": "TM Test", "role": "manufacturer", "email": "testmanu@rich-habits.com", "phone": null, "active": true, "isActive": true, "lastName": "Manufacturing", "avatarUrl": null, "createdAt": "2025-11-14T19:16:39.360Z", "firstName": "Test", "invitedAt": null, "invitedBy": null, "isInvited": false, "updatedAt": "2025-11-14T19:16:39.360Z", "passwordHash": "$2b$10$nxYGDWilDM3192qeHxs53uWSD8SEcwihSxs5NNkWNOTxQW2YFtjJe", "profileImageUrl": null, "salesMapEnabled": false, "hasCompletedSetup": false}, "authMethod": "local", "expires_at": 1766372627, "access_token": "local_access_token_1765767827339", "refresh_token": "local_refresh_token_1765767827339"}}}	2025-12-22 04:57:40
7eoOXnGWfQn59dUNDcRENzV6WasWgJLg	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-19T09:59:08.424Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "xr_tCYhoLE436ubv04oboPjtfPpenwrv1oXPHO0SlO4"}}	2025-12-19 09:59:20
hks3_9wqa0OJY2VcMflz6nDpSiiV6rp0	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-19T10:00:50.972Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "5TFzVtJYDF0jfWl0DmTFA-QWt_ebAmFAh-LdfJe4ZBQ"}}	2025-12-19 10:00:51
c070148244729b01aae01bdb07c2d5ee3ab5bac53835dd179d2f6cfd2b6f0025	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-19T06:16:23.236Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "test-audience", "exp": 1766124921, "iat": 1765520121, "iss": "test-issuer", "sub": "test-ops-automated-auth", "role": "ops", "email": "test-ops@automated-testing.local", "last_name": "Ops", "first_name": "Test"}, "userData": {"id": "test-ops-automated-auth", "name": "Test Ops (Automated)", "role": "ops", "email": "test-ops@automated-testing.local", "phone": null, "active": true, "isActive": true, "lastName": "Ops", "avatarUrl": null, "createdAt": "2025-12-12T06:15:10.384Z", "firstName": "Test", "invitedAt": null, "invitedBy": null, "isInvited": false, "updatedAt": "2025-12-12T06:15:10.384Z", "passwordHash": "$2b$10$UQ1EXHZMGpru3rrmrH7HnOuIp/t1h0xe8ZzOaVpRcWtuAQ6Nppf.K", "profileImageUrl": null, "hasCompletedSetup": false}, "expires_at": 1766124921, "access_token": "test_access_token_1765520121311", "refresh_token": "test_refresh_token_1765520121311"}}}	2025-12-19 06:16:24
\.


ALTER TABLE public.sessions ENABLE TRIGGER ALL;

--
-- Data for Name: size_adjustment_requests; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.size_adjustment_requests DISABLE TRIGGER ALL;

COPY public.size_adjustment_requests (id, order_id, request_message, status, admin_response, responded_by, responded_at, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.size_adjustment_requests ENABLE TRIGGER ALL;

--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.tasks DISABLE TRIGGER ALL;

COPY public.tasks (id, title, description, status, priority, assigned_to_user_id, created_by_user_id, page_key, due_date, completed_at, created_at, updated_at) FROM stdin;
1	Test Task with Due Date	This is a test task to verify date handling	pending	medium	\N	5iK9Ry	\N	2025-11-15 00:00:00	\N	2025-10-17 06:22:51.101483	2025-10-17 06:22:51.101483
2	Task Without Due Date	\N	pending	medium	\N	5iK9Ry	\N	\N	\N	2025-10-17 06:23:31.011408	2025-10-17 06:23:31.011408
3	Unassigned Task	\N	pending	medium	\N	5iK9Ry	\N	2025-12-01 00:00:00	\N	2025-10-17 06:24:01.520586	2025-10-17 06:24:01.520586
4	Valid Task Test	\N	pending	medium	\N	test-user-1	\N	2025-11-20 00:00:00	\N	2025-10-17 06:28:38.802242	2025-10-17 06:28:38.802242
5	No Date Task	\N	pending	medium	\N	test-user-1	\N	\N	\N	2025-10-17 06:29:10.920205	2025-10-17 06:29:10.920205
\.


ALTER TABLE public.tasks ENABLE TRIGGER ALL;

--
-- Data for Name: team_stores; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.team_stores DISABLE TRIGGER ALL;

COPY public.team_stores (id, store_code, store_name, order_id, org_id, salesperson_id, status, store_open_date, store_close_date, notes, special_instructions, archived, archived_at, archived_by, created_at, updated_at, customer_name, stage) FROM stdin;
1	TS-1762295124354	Image Sync Test Org OfRgCA Team Store	37	\N	\N	pending	2025-10-30	2025-12-03			f	\N	\N	2025-11-04 22:25:24.363614	2025-11-04 22:25:24.363614	ddd	Team Store Pending
\.


ALTER TABLE public.team_stores ENABLE TRIGGER ALL;

--
-- Data for Name: team_store_line_items; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.team_store_line_items DISABLE TRIGGER ALL;

COPY public.team_store_line_items (id, team_store_id, line_item_id, product_name, variant_code, variant_color, image_url, yxs, ys, ym, yl, xs, s, m, l, xl, xxl, xxxl, unit_price, notes, created_at, updated_at, xxxxl) FROM stdin;
1	1	45	Custom Test Item 3WEXfH	VAR-18QKZY	Red	\N	0	0	0	0	0	0	1	0	0	0	0	\N	\N	2025-11-04 22:25:27.944617	2025-11-04 22:25:27.944617	0
\.


ALTER TABLE public.team_store_line_items ENABLE TRIGGER ALL;

--
-- Data for Name: tour_merch_bundles; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.tour_merch_bundles DISABLE TRIGGER ALL;

COPY public.tour_merch_bundles (id, bundle_code, event_id, team_store_id, name, description, status, bundle_config, design_variant_ids, qr_code_url, marketing_asset_urls, store_close_date, total_allocated, total_sold, revenue, created_by, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.tour_merch_bundles ENABLE TRIGGER ALL;

--
-- Data for Name: user_manufacturer_associations; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.user_manufacturer_associations DISABLE TRIGGER ALL;

COPY public.user_manufacturer_associations (id, user_id, manufacturer_id, is_active, created_at, updated_at) FROM stdin;
1	test-user	3	t	2025-10-03 16:58:22.790648	2025-10-03 16:58:22.790648
2	test-manufacturer-LfZX70	4	t	2025-10-13 01:57:24.378056	2025-10-13 01:57:24.378056
\.


ALTER TABLE public.user_manufacturer_associations ENABLE TRIGGER ALL;

--
-- Data for Name: user_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.user_permissions DISABLE TRIGGER ALL;

COPY public.user_permissions (id, user_id, resource_id, can_view, can_create, can_edit, can_delete, page_visible, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.user_permissions ENABLE TRIGGER ALL;

--
-- Data for Name: variant_specifications; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.variant_specifications DISABLE TRIGGER ALL;

COPY public.variant_specifications (id, variant_id, specifications, dimensions, materials, print_area, weight, notes, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.variant_specifications ENABLE TRIGGER ALL;

--
-- Name: ai_design_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ai_design_sessions_id_seq', 1, false);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 251, true);


--
-- Name: budgets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.budgets_id_seq', 1, false);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categories_id_seq', 26, true);


--
-- Name: commission_payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.commission_payments_id_seq', 3, true);


--
-- Name: commissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.commissions_id_seq', 1, false);


--
-- Name: communication_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.communication_logs_id_seq', 1, true);


--
-- Name: contacts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.contacts_id_seq', 35, true);


--
-- Name: contractor_files_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.contractor_files_id_seq', 1, false);


--
-- Name: contractor_payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.contractor_payments_id_seq', 1, false);


--
-- Name: custom_financial_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.custom_financial_entries_id_seq', 1, false);


--
-- Name: customer_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customer_comments_id_seq', 1, false);


--
-- Name: design_job_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.design_job_comments_id_seq', 1, false);


--
-- Name: design_jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.design_jobs_id_seq', 32, true);


--
-- Name: design_portfolios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.design_portfolios_id_seq', 1, false);


--
-- Name: design_resources_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.design_resources_id_seq', 1, false);


--
-- Name: event_budgets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.event_budgets_id_seq', 1, false);


--
-- Name: event_campaigns_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.event_campaigns_id_seq', 1, false);


--
-- Name: event_contractors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.event_contractors_id_seq', 1, false);


--
-- Name: event_inventory_movements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.event_inventory_movements_id_seq', 1, false);


--
-- Name: event_merchandise_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.event_merchandise_id_seq', 1, false);


--
-- Name: event_registrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.event_registrations_id_seq', 1, false);


--
-- Name: event_staff_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.event_staff_id_seq', 1, false);


--
-- Name: event_stages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.event_stages_id_seq', 1, false);


--
-- Name: events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.events_id_seq', 12, true);


--
-- Name: fabric_submissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fabric_submissions_id_seq', 1, false);


--
-- Name: fabrics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fabrics_id_seq', 1, false);


--
-- Name: favorites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.favorites_id_seq', 2, true);


--
-- Name: financial_alerts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.financial_alerts_id_seq', 1, false);


--
-- Name: financial_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.financial_reports_id_seq', 1, false);


--
-- Name: financial_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.financial_transactions_id_seq', 1, false);


--
-- Name: invitations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.invitations_id_seq', 1, true);


--
-- Name: invoice_payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.invoice_payments_id_seq', 7, true);


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.invoices_id_seq', 3, true);


--
-- Name: leads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.leads_id_seq', 11, true);


--
-- Name: manufacturer_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.manufacturer_events_id_seq', 1, false);


--
-- Name: manufacturer_jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.manufacturer_jobs_id_seq', 1, false);


--
-- Name: manufacturers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.manufacturers_id_seq', 6, true);


--
-- Name: manufacturing_attachments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.manufacturing_attachments_id_seq', 1, true);


--
-- Name: manufacturing_batch_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.manufacturing_batch_items_id_seq', 1, false);


--
-- Name: manufacturing_batches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.manufacturing_batches_id_seq', 1, false);


--
-- Name: manufacturing_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.manufacturing_id_seq', 15, true);


--
-- Name: manufacturing_notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.manufacturing_notifications_id_seq', 1, false);


--
-- Name: manufacturing_quality_checkpoints_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.manufacturing_quality_checkpoints_id_seq', 1, false);


--
-- Name: manufacturing_update_line_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.manufacturing_update_line_items_id_seq', 11, true);


--
-- Name: manufacturing_updates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.manufacturing_updates_id_seq', 14, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 32, true);


--
-- Name: order_form_line_item_sizes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.order_form_line_item_sizes_id_seq', 1, false);


--
-- Name: order_form_submissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.order_form_submissions_id_seq', 3, true);


--
-- Name: order_line_item_manufacturers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.order_line_item_manufacturers_id_seq', 14, true);


--
-- Name: order_line_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.order_line_items_id_seq', 53, true);


--
-- Name: order_tracking_numbers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.order_tracking_numbers_id_seq', 5, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.orders_id_seq', 55, true);


--
-- Name: organizations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.organizations_id_seq', 109, true);


--
-- Name: pantone_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pantone_assignments_id_seq', 1, false);


--
-- Name: printful_sync_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.printful_sync_records_id_seq', 1, false);


--
-- Name: product_cogs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.product_cogs_id_seq', 1, true);


--
-- Name: product_variant_fabrics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.product_variant_fabrics_id_seq', 1, false);


--
-- Name: product_variants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.product_variants_id_seq', 24, true);


--
-- Name: production_schedules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.production_schedules_id_seq', 1, false);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.products_id_seq', 44, true);


--
-- Name: quick_action_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.quick_action_logs_id_seq', 1, false);


--
-- Name: quote_line_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.quote_line_items_id_seq', 11, true);


--
-- Name: quotes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.quotes_id_seq', 25, true);


--
-- Name: requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.requests_id_seq', 1, false);


--
-- Name: resources_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.resources_id_seq', 29, true);


--
-- Name: role_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.role_permissions_id_seq', 189, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.roles_id_seq', 7, true);


--
-- Name: sales_resources_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sales_resources_id_seq', 2, true);


--
-- Name: salespersons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.salespersons_id_seq', 9, true);


--
-- Name: saved_views_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.saved_views_id_seq', 2, true);


--
-- Name: size_adjustment_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.size_adjustment_requests_id_seq', 1, false);


--
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tasks_id_seq', 5, true);


--
-- Name: team_store_line_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.team_store_line_items_id_seq', 1, true);


--
-- Name: team_stores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.team_stores_id_seq', 1, true);


--
-- Name: tour_merch_bundles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tour_merch_bundles_id_seq', 1, false);


--
-- Name: user_manufacturer_associations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_manufacturer_associations_id_seq', 2, true);


--
-- Name: user_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_permissions_id_seq', 1, false);


--
-- Name: variant_specifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.variant_specifications_id_seq', 1, false);


--
-- PostgreSQL database dump complete
--

\unrestrict 7AJE29Mmpx42aRfBt1edNYAmcbLkCNOANYOSchMOlh0bfHRiHSNJlsaCI9gTR0C

