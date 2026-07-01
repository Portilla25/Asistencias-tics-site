# Migración Firebase -> Supabase

Este paquete prepara la migración sin subir secretos al repositorio.

## 1. Crear proyecto en Supabase

1. Crea un proyecto nuevo en Supabase.
2. En `Project Settings > API`, copia:
   - `Project URL`
   - `anon public`
   - `service_role` (solo local, nunca en la web)
3. En `Authentication > Providers`, configura Google si quieres reemplazar Firebase Auth.

## 2. Crear esquema

En Supabase SQL Editor ejecuta:

```sql
-- Copia y ejecuta el contenido de:
-- supabase/migrations/20260701000100_initial_attendance_schema.sql
```

El esquema usa tablas normalizadas y RLS:

- `careers`, `modules`
- `students`, `student_modules`
- `attendance`
- `class_sessions`
- `grades`
- `custom_students`, `custom_classes`
- `legacy_raw_modules`
- `migration_runs`

## 3. Exportar datos legacy

Desde `institute-attendance-management-system`:

```powershell
npm run supabase:export
```

Opcionalmente, usando un backup JSON exportado desde la app:

```powershell
npm run supabase:export -- --backup C:\ruta\backup_asistencias.json
```

El archivo queda en `migration-output/`.

## 4. Probar importación sin escribir

Copia `.env.supabase.example` como `.env.supabase.local` y completa `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.

```powershell
npm run supabase:import -- --file .\migration-output\supabase-normalized-ARCHIVO.json --dry-run
```

## 5. Importar

```powershell
npm run supabase:import -- --file .\migration-output\supabase-normalized-ARCHIVO.json
```

El importador usa `upsert`, así que se puede volver a ejecutar sin duplicar asistencias.

## 6. Validar

Después de importar, revisa en Supabase:

```sql
select count(*) from public.students;
select count(*) from public.student_modules;
select count(*) from public.attendance;
select module_id, fecha, count(*) from public.attendance group by module_id, fecha order by fecha desc;
```

Para el caso crítico de junio:

```sql
select m.name, a.fecha, s.full_name, a.status
from public.attendance a
join public.students s on s.id = a.student_id
join public.modules m on m.id = a.module_id
where a.fecha between date '2026-06-01' and date '2026-06-30'
  and extract(isodow from a.fecha) = 1
order by a.fecha, m.id, s.full_name;
```

## Pendiente para activar Supabase en producción

Cuando el import esté validado:

1. Cambiar la app para leer/escribir desde Supabase.
2. Configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en el build.
3. Reemplazar Firebase Auth por Supabase Auth o dejar Firebase solo como login temporal con una capa backend segura.

No se debe publicar `SUPABASE_SERVICE_ROLE_KEY`.
