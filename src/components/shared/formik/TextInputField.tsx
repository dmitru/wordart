import { TextInput } from 'components/shared/TextInput'
import { FieldConfig, useField } from 'formik'

export const TextInputField: React.FC<
  { label?: string } & FieldConfig<string>
> = ({ label, ...props }) => {
  const [field, meta, { setValue }] = useField(props)
  return (
    <>
      <label>
        {label}
        <TextInput {...field} {...props} onChange={setValue} />
      </label>
      {meta.touched && meta.error ? (
        <div className="error">{meta.error}</div>
      ) : null}
    </>
  )
}
