# data:repair-fk command

The `data:repair-fk` Artisan command scans every foreign key in the current database, reports missing parent references, and either inserts placeholder parent rows or removes orphans. It is intended to run immediately after importing a data-only SQL dump so the local database matches the schema enforced by migrations.

## Usage

```
php artisan data:repair-fk [--mode=placeholder|delete] [--dry-run]
```

- `--mode=placeholder` (default): inserts placeholder parent rows for every missing reference.
- `--mode=delete`: removes orphaned child rows instead of creating placeholders.
- `--dry-run`: shows the work that would be performed without mutating the database.

The command prints a table of every foreign key and the action taken. When running in dry-run mode, no writes occur.

## Placeholder strategy

When `--mode=placeholder` is used, the command:

1. Queries `information_schema.KEY_COLUMN_USAGE` to find every foreign key relationship in the current schema.
2. Finds every distinct child value that no longer exists in the referenced parent table.
3. Builds a minimal insert payload for the parent table by:
   - Always setting the referenced primary key/unique key to the missing value.
   - Skipping columns that are nullable or have defaults.
   - Populating required columns without defaults with sensible fallbacks (e.g., `Placeholder` strings, `0` for numeric columns, current timestamp for date/time columns).
4. Inserts one placeholder row per missing parent ID.

## Deleting instead of inserting

If `--mode=delete` is provided, the command deletes child rows whose foreign keys point to missing parents. This is helpful when placeholder parent records would break business rules or reporting. Combine with `--dry-run` to review the exact impact before applying deletes.

## Recommended workflow after importing data

1. Drop and recreate the database (if needed).
2. Run your migrations to ensure the schema matches the application (e.g., `php artisan migrate --force`).
3. Import the data-only SQL dump.
4. Execute `php artisan data:repair-fk` in `placeholder` mode (the default) to backfill missing parent rows and keep constraints satisfied.
5. Optionally re-run the command with `--mode=delete --dry-run` to see if any orphaned rows remain that you prefer to remove instead of patching with placeholders.

## Sample output

```
Scanning 4 foreign key relationship(s)...
+-------------------+-------------------+-----------+-------------------------------+
| Child FK          | Parent PK         | Action    | Details                       |
+-------------------+-------------------+-----------+-------------------------------+
| rentals.car_id    | cars.id           | Inserted  | 2 placeholder parent row(s) added |
| cars.model_id     | car_models.id     | None      | No missing references         |
| facture_items.id  | factures.id       | Would delete | 1 orphan row(s) removed    |
| role_user.role_id | roles.id          | Inserted  | 3 placeholder parent row(s) added |
+-------------------+-------------------+-----------+-------------------------------+
```

Running with `--dry-run` will replace `Inserted/Deleted` with `Would insert/Would delete` so you can preview the work before making changes.
