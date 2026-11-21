PRAGMA foreign_keys = ON;
CREATE TABLE account (
  id TEXT PRIMARY KEY NOT NULL,
  display_name TEXT NOT NULL,
  platform_role TEXT NOT NULL DEFAULT 'member' CHECK(platform_role IN ('member','admin'))
);
CREATE TABLE project (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  deadline TEXT,
  state TEXT NOT NULL DEFAULT 'active' CHECK(state IN ('active','archived')),
  revision INTEGER NOT NULL DEFAULT 0 CHECK(revision >= 0)
);
CREATE TABLE membership (
  project_id TEXT NOT NULL REFERENCES project(id),
  account_id TEXT NOT NULL REFERENCES account(id),
  role TEXT NOT NULL CHECK(role IN ('owner','editor','viewer')),
  PRIMARY KEY(project_id,account_id)
);
CREATE UNIQUE INDEX one_owner ON membership(project_id) WHERE role='owner';
CREATE TABLE source_version (
  project_id TEXT NOT NULL REFERENCES project(id),
  version INTEGER NOT NULL CHECK(version > 0),
  body TEXT NOT NULL CHECK(length(trim(body)) BETWEEN 1 AND 18000),
  PRIMARY KEY(project_id,version)
);
CREATE TABLE requirement (
  project_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  quote TEXT NOT NULL CHECK(length(trim(quote)) > 0),
  acceptance TEXT NOT NULL,
  priority TEXT NOT NULL CHECK(priority IN ('P0','P1','P2')),
  PRIMARY KEY(project_id,version,code),
  FOREIGN KEY(project_id,version) REFERENCES source_version(project_id,version)
);
CREATE TABLE task (
  project_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  code TEXT NOT NULL,
  requirement_code TEXT NOT NULL,
  title TEXT NOT NULL,
  assignee_id TEXT,
  due TEXT,
  status TEXT NOT NULL CHECK(status IN ('todo','doing','done')),
  evidence TEXT NOT NULL DEFAULT '',
  PRIMARY KEY(project_id,version,code),
  FOREIGN KEY(project_id,version,requirement_code) REFERENCES requirement(project_id,version,code),
  FOREIGN KEY(project_id,assignee_id) REFERENCES membership(project_id,account_id)
);
CREATE INDEX task_requirement ON task(project_id,version,requirement_code);
CREATE INDEX task_assignee ON task(project_id,assignee_id);
CREATE TABLE audit_event (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES project(id),
  actor_id TEXT NOT NULL REFERENCES account(id),
  action TEXT NOT NULL CHECK(action IN ('archive','restore')),
  created_at TEXT NOT NULL
);
CREATE INDEX audit_timeline ON audit_event(project_id,created_at,id);
