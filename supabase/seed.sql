-- test@example.com password

INSERT INTO auth.users (instance_id,id,aud,"role",email,encrypted_password,email_confirmed_at,last_sign_in_at,raw_app_meta_data,raw_user_meta_data,is_super_admin,created_at,updated_at,phone,phone_confirmed_at,confirmation_token,email_change,email_change_token_new,recovery_token) VALUES
	('00000000-0000-0000-0000-000000000000'::uuid,'f76629c5-a070-4bbc-9918-64beaea48848'::uuid,'authenticated','authenticated','test@example.com','$2a$10$q4VfrgQUrGNAKI2irn943eWk9hWhbRB8eU0gVtv569BMQLV0WJRWu','2022-02-11 21:02:04.547','2022-02-11 22:53:12.520','{"provider": "email", "providers": ["email"]}','{}',FALSE,'2022-02-11 21:02:04.542','2022-02-11 21:02:04.542',NULL,NULL,'','','','');

INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at) VALUES
	('f76629c5-a070-4bbc-9918-64beaea48848','f76629c5-a070-4bbc-9918-64beaea48848'::uuid,'{"sub": "f76629c5-a070-4bbc-9918-64beaea48848"}','email','2022-02-11 21:02:04.545','2022-02-11 21:02:04.545','2022-02-11 21:02:04.545');

INSERT INTO public.profile (id, username) VALUES
    ('f76629c5-a070-4bbc-9918-64beaea48848', 'zak');

INSERT INTO public.user_role (user_id, role) VALUES
    ('f76629c5-a070-4bbc-9918-64beaea48848', 'admin');
