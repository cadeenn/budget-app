import { useState, useCallback } from 'react';

/**
 * Custom hook for form handling with validation
 * @param {Object} initialValues - The initial form values
 * @param {Function} validate - Validation function that returns an errors object
 * @returns {Object} Form state and handlers
 */
const useForm = (initialValues = {}, validate = () => ({})) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input change
  const handleChange = useCallback((name, value) => {
    setValues(prevValues => ({
      ...prevValues,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: undefined
      }));
    }
  }, [errors]);

  // Handle field blur (mark as touched)
  const handleBlur = useCallback((name) => {
    setTouched(prevTouched => ({
      ...prevTouched,
      [name]: true
    }));
    
    // Validate on blur
    const validationErrors = validate(values);
    if (validationErrors[name]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: validationErrors[name]
      }));
    }
  }, [validate, values]);

  // Reset form to initial values
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Validate all fields and return result
  const validateForm = useCallback(() => {
    const validationErrors = validate(values);
    setErrors(validationErrors);
    setTouched(
      Object.keys(values).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {})
    );
    return Object.keys(validationErrors).length === 0;
  }, [validate, values]);

  // Submit handler
  const handleSubmit = useCallback(async (onSubmit) => {
    setIsSubmitting(true);
    
    if (validateForm()) {
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      }
    }
    
    setIsSubmitting(false);
  }, [validateForm, values]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setValues
  };
};

export default useForm; 