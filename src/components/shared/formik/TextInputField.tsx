import { FieldConfig, useField } from 'formik'
import { Input } from '@chakra-ui/core'

export const TextInputField: React.FC<
  { label?: string } & FieldConfig<string>
> = ({ label, ...props }) => {
  const [field, meta, { setValue }] = useField(props)
  return (
    <>
      <label>
        {label}
        {/* 
        // @ts-ignore */}
        <Input
          {...field}
          {...props}
          // @ts-ignore
          onChange={(e) => setValue(e.target.value)}
        />
      </label>
      {meta.touched && meta.error ? (
        <div className="error">{meta.error}</div>
      ) : null}
    </>
  )
}
