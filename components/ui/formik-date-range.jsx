import { useField, useFormikContext } from 'formik';
import { DatePickerWithRange } from '@/components/ui/date-range';

const FormikDatePickerWithRange = ({ name }) => {
  const { setFieldValue } = useFormikContext();
  const [field, meta] = useField(name);

  const handleChange = (range) => {
    setFieldValue(name, range);
  };

  return (
    <>
      <DatePickerWithRange value={field.value} onChange={handleChange} />
      {meta.touched && meta.error && (
        <>
          {meta.error.startDate && (
            <div className="text-red-500 text-sm">{meta.error.startDate}</div>
          )}
          {meta.error.endDate && (
            <div className="text-red-500 text-sm">{meta.error.endDate}</div>
          )}
        </>
      )}
    </>
  );
};

export default FormikDatePickerWithRange;