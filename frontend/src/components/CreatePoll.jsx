import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

function CreatePoll() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [endDate, setEndDate] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    if (!title.trim()) newErrors.title = 'Title is required';
    if (title.length > 100) newErrors.title = 'Title must be less than 100 characters';
    
    if (description.length > 500) newErrors.description = 'Description must be less than 500 characters';
    
    const filteredOptions = options.filter(opt => opt.trim() !== '');
    if (filteredOptions.length < 2) {
      newErrors.options = 'At least two options are required';
    }
    
    options.forEach((option, index) => {
      if (option.trim() && option.length > 100) {
        newErrors[`option-${index}`] = 'Option must be less than 100 characters';
      }
    });

    if (!endDate) {
      newErrors.endDate = 'End date is required';
    } else {
      const selectedDate = new Date(endDate);
      const now = new Date();
      if (selectedDate <= now) {
        newErrors.endDate = 'End date must be in the future';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    
    // Clear any error for this specific option
    if (errors[`option-${index}`]) {
      const newErrors = {...errors};
      delete newErrors[`option-${index}`];
      setErrors(newErrors);
    }
  };

  const addOption = () => {
    setOptions([...options, '']);
  };

  const removeOption = (index) => {
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const filteredOptions = options
        .filter(option => option.trim() !== '')
        .map(text => ({ text, votes: 0 }));
        
      const response = await axios.post('http://localhost:3001/api/polls', {
        title,
        description,
        options: filteredOptions,
        end_date: endDate,
        is_private: isPrivate
      });
      
      navigate(`/poll/${response.data.id}`);
    } catch (err) {
      setErrors({ submit: 'Failed to create poll. Please try again.' });
      setIsSubmitting(false);
    }
  };

  // Calculate tomorrow's date for min date on the datepicker
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="create-poll-container">
      <h2>Create a New Poll</h2>
      
      {errors.submit && (
        <div className="error-message global">{errors.submit}</div>
      )}
      
      <form onSubmit={handleSubmit} className="poll-form">
        <div className="form-group">
          <label htmlFor="title">
            Poll Question <span className="required">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) {
                const newErrors = {...errors};
                delete newErrors.title;
                setErrors(newErrors);
              }
            }}
            placeholder="What do you want to ask?"
            className={errors.title ? 'error' : ''}
          />
          {errors.title && <div className="error-message">{errors.title}</div>}
          <div className="character-count">
            <span className={title.length > 90 ? 'warning' : ''}>
              {title.length}/100
            </span>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description (Optional)</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) {
                const newErrors = {...errors};
                delete newErrors.description;
                setErrors(newErrors);
              }
            }}
            placeholder="Add more context to your question"
            rows="3"
            className={errors.description ? 'error' : ''}
          />
          {errors.description && <div className="error-message">{errors.description}</div>}
          <div className="character-count">
            <span className={description.length > 450 ? 'warning' : ''}>
              {description.length}/500
            </span>
          </div>
        </div>
        
        <div className="form-group">
          <label>
            Poll Options <span className="required">*</span>
          </label>
          {errors.options && <div className="error-message">{errors.options}</div>}
          
          <AnimatePresence>
            {options.map((option, index) => (
              <motion.div 
                key={index} 
                className="option-input"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className={errors[`option-${index}`] ? 'error' : ''}
                />
                {options.length > 2 && (
                  <button 
                    type="button" 
                    className="remove-option" 
                    onClick={() => removeOption(index)}
                    aria-label="Remove option"
                  >
                    ×
                  </button>
                )}
                {errors[`option-${index}`] && (
                  <div className="error-message">{errors[`option-${index}`]}</div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          <button 
            type="button" 
            className="add-option-button" 
            onClick={addOption}
          >
            + Add Option
          </button>
        </div>
        
        <div className="form-group">
          <label htmlFor="endDate">
            End Date <span className="required">*</span>
          </label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            min={minDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              if (errors.endDate) {
                const newErrors = {...errors};
                delete newErrors.endDate;
                setErrors(newErrors);
              }
            }}
            className={errors.endDate ? 'error' : ''}
          />
          {errors.endDate && <div className="error-message">{errors.endDate}</div>}
        </div>
        
        <div className="form-group checkbox-group">
          <label htmlFor="isPrivate" className="checkbox-label">
            <input
              type="checkbox"
              id="isPrivate"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
            />
            <span className="checkbox-text">Private poll (results visible only after voting)</span>
          </label>
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-button"
            onClick={() => navigate('/')}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Poll'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreatePoll;

