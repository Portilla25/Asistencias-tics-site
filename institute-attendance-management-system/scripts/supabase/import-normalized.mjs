import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index];
  if (!arg.startsWith('--')) continue;
  const key = arg.slice(2);
  const next = process.argv[index + 1];
  if (next && !next.startsWith('--')) {
    args.set(key, next);
    index += 1;
  } else {
    args.set(key, 'true');
  }
}

const envFile = args.get('env') || '.env.supabase.local';
if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...valueParts] = trimmed.split('=');
    if (!process.env[key]) process.env[key] = valueParts.join('=').trim();
  }
}

const requiredEnv = (key) => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing ${key}. Do not commit secrets; load them from your local shell or .env file.`);
  return value;
};

const file = args.get('file') || process.env.MIGRATION_FILE;
if (!file) throw new Error('Use --file migration-output/supabase-normalized-....json');

const dryRun = args.has('dry-run');
const input = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));

const counts = {
  adminEmails: input.adminEmails?.length || 0,
  careers: input.careers?.length || 0,
  modules: input.modules?.length || 0,
  students: input.students?.length || 0,
  studentModules: input.studentModules?.length || 0,
  attendance: input.attendance?.length || 0,
  sessions: input.sessions?.length || 0,
  grades: input.grades?.length || 0,
  customStudents: input.customStudents?.length || 0,
  customClasses: input.customClasses?.length || 0,
  rawModules: input.rawModules?.length || 0,
};

if (dryRun) {
  console.log(JSON.stringify({ ok: true, dryRun: true, file: path.resolve(file), sourceHash: input.metadata?.sourceHash, counts }, null, 2));
  process.exit(0);
}

const supabase = createClient(requiredEnv('SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_ROLE_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
});

const chunk = (rows, size = 500) => {
  const chunks = [];
  for (let index = 0; index < rows.length; index += size) chunks.push(rows.slice(index, index + size));
  return chunks;
};

const fail = (label, error) => {
  if (!error) return;
  throw new Error(`${label}: ${error.message || JSON.stringify(error)}`);
};

const upsertTable = async (label, table, rows, options = {}) => {
  if (!rows?.length) return;
  let imported = 0;
  for (const batch of chunk(rows, options.batchSize || 500)) {
    const { error } = await supabase.from(table).upsert(batch, options);
    fail(label, error);
    imported += batch.length;
  }
  console.log(`${label}: ${imported}`);
};

const adminEmailRows = (input.adminEmails || []).map((email) => ({ email }));

await upsertTable('admin emails', 'app_admin_emails', adminEmailRows, { onConflict: 'email' });
await upsertTable('careers', 'careers', input.careers || [], { onConflict: 'id' });
await upsertTable('modules', 'modules', input.modules || [], { onConflict: 'id' });
await upsertTable('students', 'students', input.students || [], { onConflict: 'id' });
await upsertTable('student modules', 'student_modules', input.studentModules || [], { onConflict: 'student_id,module_id' });
await upsertTable('attendance', 'attendance', input.attendance || [], { onConflict: 'module_id,student_id,fecha' });
await upsertTable('sessions', 'class_sessions', input.sessions || [], { onConflict: 'module_id,fecha' });
await upsertTable('grades', 'grades', input.grades || [], { onConflict: 'module_id,student_id' });
await upsertTable('custom students', 'custom_students', input.customStudents || [], { onConflict: 'id' });
await upsertTable('custom classes', 'custom_classes', input.customClasses || [], {
  onConflict: 'custom_student_id,fecha,start_time,end_time',
});
await upsertTable('raw modules', 'legacy_raw_modules', input.rawModules || [], { onConflict: 'module_id', batchSize: 100 });

const { error: runError } = await supabase.from('migration_runs').insert({
  source: input.metadata?.source || path.resolve(file),
  source_hash: input.metadata?.sourceHash || null,
  counts,
  notes: input.metadata?.notes || 'Supabase migration import.',
});
fail('migration run', runError);

console.log(JSON.stringify({ ok: true, imported: counts, sourceHash: input.metadata?.sourceHash }, null, 2));
