import { inputClass, labelClass } from "@/components/forms/formStyles";

export function FieldError({ errors, field }: { errors?: Record<string, string[]>; field: string }) {
  const msgs = errors?.[field];
  if (!msgs?.length) return null;
  return <p className="mt-1 text-xs text-red-600 dark:text-red-400">{msgs[0]}</p>;
}

/**
 * One named contact on the project form: name, phone and email inputs whose
 * field names are `${prefix}_name` and so on, matching the projects columns
 * (superintendent, foreman, pm, owner_rep, waterway_contact).
 */
export default function ContactGroup({
  title,
  prefix,
  errors,
  showAddress,
  defaults,
}: {
  title: string;
  prefix: string;
  errors?: Record<string, string[]>;
  showAddress?: boolean;
  defaults?: Record<string, string | null>;
}) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</h4>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor={`${prefix}_name`} className={labelClass}>Name</label>
          <input id={`${prefix}_name`} name={`${prefix}_name`} type="text" defaultValue={defaults?.[`${prefix}_name`] ?? ""} className={inputClass} />
          <FieldError errors={errors} field={`${prefix}_name`} />
        </div>
        <div>
          <label htmlFor={`${prefix}_phone`} className={labelClass}>Phone</label>
          <input id={`${prefix}_phone`} name={`${prefix}_phone`} type="tel" defaultValue={defaults?.[`${prefix}_phone`] ?? ""} className={inputClass} />
          <FieldError errors={errors} field={`${prefix}_phone`} />
        </div>
        <div>
          <label htmlFor={`${prefix}_email`} className={labelClass}>Email</label>
          <input id={`${prefix}_email`} name={`${prefix}_email`} type="email" defaultValue={defaults?.[`${prefix}_email`] ?? ""} className={inputClass} />
          <FieldError errors={errors} field={`${prefix}_email`} />
        </div>
      </div>
      {showAddress && (
        <div>
          <label htmlFor={`${prefix}_address`} className={labelClass}>Address</label>
          <input id={`${prefix}_address`} name={`${prefix}_address`} type="text" defaultValue={defaults?.[`${prefix}_address`] ?? ""} className={inputClass} />
          <FieldError errors={errors} field={`${prefix}_address`} />
        </div>
      )}
    </div>
  );
}
