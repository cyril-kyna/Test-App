import { useField } from 'formik';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const FormikSelect = ({ name, placeholder, children }) => {
  const [field, meta, helpers] = useField(name);

  return (
    <>
      <Select onValueChange={(value) => helpers.setValue(value)}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder}>
            {field.value || placeholder}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
      {meta.touched && meta.error && (
        <div className="text-red-500 text-sm">{meta.error}</div>
      )}
    </>
  );
};

export default FormikSelect;