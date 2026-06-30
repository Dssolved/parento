alter table courses add column if not exists is_published boolean;
alter table lessons add column if not exists is_published boolean;

update courses set is_published = true where is_published is null;
update lessons set is_published = true where is_published is null;

alter table courses alter column is_published set default false;
alter table lessons alter column is_published set default false;

alter table courses alter column is_published set not null;
alter table lessons alter column is_published set not null;
