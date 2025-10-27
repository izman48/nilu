import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Edit2,
  X,
  Check,
  GripVertical,
} from 'lucide-react';
import { TemplateField, FieldType } from '@/types';

interface TemplateFieldBuilderProps {
  fields: Partial<TemplateField>[];
  onChange: (fields: Partial<TemplateField>[]) => void;
}

const TemplateFieldBuilder: React.FC<TemplateFieldBuilderProps> = ({ fields, onChange }) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<Partial<TemplateField> | null>(null);

  const fieldTypes: { value: FieldType; label: string }[] = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'datetime', label: 'Date & Time' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'file', label: 'File Upload' },
    { value: 'car_select', label: 'Car Selector' },
    { value: 'driver_select', label: 'Driver Selector' },
    { value: 'customer_select', label: 'Customer Selector' },
    { value: 'tour_rep_select', label: 'Tour Rep Selector' },
  ];

  const handleAddField = () => {
    const newField: Partial<TemplateField> = {
      field_name: '',
      field_label: '',
      field_type: 'text',
      is_required: false,
      order: fields.length,
      options: [],
      placeholder: '',
      help_text: '',
    };
    setEditingField(newField);
    setEditingIndex(fields.length);
  };

  const handleSaveField = () => {
    if (!editingField || editingIndex === null) return;

    if (!editingField.field_name || !editingField.field_label) {
      alert('Field name and label are required');
      return;
    }

    const newFields = [...fields];
    if (editingIndex < fields.length) {
      newFields[editingIndex] = editingField;
    } else {
      newFields.push(editingField);
    }

    onChange(newFields);
    setEditingIndex(null);
    setEditingField(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingField(null);
  };

  const handleEditField = (index: number) => {
    setEditingIndex(index);
    setEditingField({ ...fields[index] });
  };

  const handleDeleteField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    onChange(newFields);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newFields = [...fields];
    [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
    newFields.forEach((field, i) => (field.order = i));
    onChange(newFields);
  };

  const handleMoveDown = (index: number) => {
    if (index === fields.length - 1) return;
    const newFields = [...fields];
    [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
    newFields.forEach((field, i) => (field.order = i));
    onChange(newFields);
  };

  const updateEditingField = (updates: Partial<TemplateField>) => {
    if (!editingField) return;
    setEditingField({ ...editingField, ...updates });
  };

  const handleOptionsChange = (optionsText: string) => {
    const options = optionsText
      .split('\n')
      .map((opt) => opt.trim())
      .filter((opt) => opt.length > 0);
    updateEditingField({ options });
  };

  const generateFieldName = (label: string) => {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  return (
    <div className="space-y-4">
      {/* Existing Fields List */}
      {fields.map((field, index) => {
        if (editingIndex === index) {
          // Edit Mode
          return (
            <div
              key={index}
              className="border border-blue-300 bg-blue-50 rounded-lg p-4 space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Field Label *
                  </label>
                  <input
                    type="text"
                    value={editingField?.field_label || ''}
                    onChange={(e) => {
                      const label = e.target.value;
                      updateEditingField({
                        field_label: label,
                        field_name: editingField?.field_name || generateFieldName(label),
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="e.g., Pickup Location"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Field Name (Internal) *
                  </label>
                  <input
                    type="text"
                    value={editingField?.field_name || ''}
                    onChange={(e) =>
                      updateEditingField({
                        field_name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                    placeholder="e.g., pickup_location"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Field Type *
                  </label>
                  <select
                    value={editingField?.field_type || 'text'}
                    onChange={(e) =>
                      updateEditingField({ field_type: e.target.value as FieldType })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    {fieldTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingField?.is_required || false}
                      onChange={(e) => updateEditingField({ is_required: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Required field</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Placeholder Text
                </label>
                <input
                  type="text"
                  value={editingField?.placeholder || ''}
                  onChange={(e) => updateEditingField({ placeholder: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Placeholder text shown in the field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Help Text</label>
                <input
                  type="text"
                  value={editingField?.help_text || ''}
                  onChange={(e) => updateEditingField({ help_text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Additional help text shown below the field"
                />
              </div>

              {editingField?.field_type === 'dropdown' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dropdown Options (one per line) *
                  </label>
                  <textarea
                    value={editingField?.options?.join('\n') || ''}
                    onChange={(e) => handleOptionsChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                    rows={4}
                    placeholder="Empty&#10;1/4&#10;1/2&#10;3/4&#10;Full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter each option on a new line
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2 border-t border-blue-200">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveField}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Save Field
                </button>
              </div>
            </div>
          );
        }

        // Display Mode
        return (
          <div
            key={index}
            className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center space-x-3 flex-1">
              <GripVertical className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{field.field_label}</span>
                  {field.is_required && <span className="text-red-500 text-sm">*</span>}
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                    {fieldTypes.find((t) => t.value === field.field_type)?.label}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  <span className="font-mono">{field.field_name}</span>
                  {field.placeholder && (
                    <span className="ml-2">• Placeholder: {field.placeholder}</span>
                  )}
                  {field.field_type === 'dropdown' && field.options && (
                    <span className="ml-2">
                      • {field.options.length} option{field.options.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => handleMoveUp(index)}
                disabled={index === 0}
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Move up"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleMoveDown(index)}
                disabled={index === fields.length - 1}
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Move down"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleEditField(index)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Edit"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDeleteField(index)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}

      {/* New Field Form */}
      {editingIndex === fields.length && editingField && (
        <div className="border border-green-300 bg-green-50 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-gray-900">Add New Field</h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field Label *
              </label>
              <input
                type="text"
                value={editingField?.field_label || ''}
                onChange={(e) => {
                  const label = e.target.value;
                  updateEditingField({
                    field_label: label,
                    field_name: editingField?.field_name || generateFieldName(label),
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="e.g., Pickup Location"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field Name (Internal) *
              </label>
              <input
                type="text"
                value={editingField?.field_name || ''}
                onChange={(e) =>
                  updateEditingField({
                    field_name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                placeholder="e.g., pickup_location"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Field Type *</label>
              <select
                value={editingField?.field_type || 'text'}
                onChange={(e) => updateEditingField({ field_type: e.target.value as FieldType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                {fieldTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingField?.is_required || false}
                  onChange={(e) => updateEditingField({ is_required: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Required field</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Placeholder Text
            </label>
            <input
              type="text"
              value={editingField?.placeholder || ''}
              onChange={(e) => updateEditingField({ placeholder: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Placeholder text shown in the field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Help Text</label>
            <input
              type="text"
              value={editingField?.help_text || ''}
              onChange={(e) => updateEditingField({ help_text: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Additional help text shown below the field"
            />
          </div>

          {editingField?.field_type === 'dropdown' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dropdown Options (one per line) *
              </label>
              <textarea
                value={editingField?.options?.join('\n') || ''}
                onChange={(e) => handleOptionsChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                rows={4}
                placeholder="Empty&#10;1/4&#10;1/2&#10;3/4&#10;Full"
              />
              <p className="text-xs text-gray-500 mt-1">Enter each option on a new line</p>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-2 border-t border-green-200">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-3 py-1.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center"
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveField}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center"
            >
              <Check className="h-4 w-4 mr-1" />
              Add Field
            </button>
          </div>
        </div>
      )}

      {/* Add Field Button */}
      {editingIndex === null && (
        <button
          type="button"
          onClick={handleAddField}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Field
        </button>
      )}

      {fields.length === 0 && editingIndex === null && (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-2">No fields added yet</p>
          <p className="text-sm">Click "Add Field" to create your first template field</p>
        </div>
      )}
    </div>
  );
};

export default TemplateFieldBuilder;
