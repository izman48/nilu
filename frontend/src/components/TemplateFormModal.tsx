import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from '@/api';
import { Template, TemplateField } from '@/types';
import TemplateFieldBuilder from './TemplateFieldBuilder';
import { toast } from 'react-hot-toast';

interface TemplateFormModalProps {
  template: Template | null;
  onClose: (saved: boolean) => void;
}

const TemplateFormModal: React.FC<TemplateFormModalProps> = ({ template, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'file-text',
    color: '#3B82F6',
    is_active: true,
  });
  const [fields, setFields] = useState<Partial<TemplateField>[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || '',
        icon: template.icon || 'file-text',
        color: template.color || '#3B82F6',
        is_active: template.is_active,
      });
      setFields(template.fields || []);
    }
  }, [template]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    if (fields.length === 0) {
      toast.error('Please add at least one field to the template');
      return;
    }

    // Validate fields
    for (const field of fields) {
      if (!field.field_name || !field.field_label || !field.field_type) {
        toast.error('All fields must have a name, label, and type');
        return;
      }
      if (field.field_type === 'dropdown' && (!field.options || field.options.length === 0)) {
        toast.error(`Dropdown field "${field.field_label}" must have at least one option`);
        return;
      }
    }

    try {
      setSaving(true);

      const payload: any = {
        ...formData,
        fields: fields.map((field, index) => ({
          field_name: field.field_name,
          field_label: field.field_label,
          field_type: field.field_type,
          is_required: field.is_required || false,
          order: field.order !== undefined ? field.order : index,
          options: field.options || [],
          placeholder: field.placeholder || '',
          help_text: field.help_text || '',
        })),
      };

      if (template) {
        await api.templates.update(template.id, payload);
        toast.success('Template updated successfully');
      } else {
        await api.templates.create(payload);
        toast.success('Template created successfully');
      }

      onClose(true);
    } catch (error: any) {
      console.error('Failed to save template:', error);
      toast.error(error.response?.data?.detail || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleFieldsChange = (newFields: Partial<TemplateField>[]) => {
    setFields(newFields);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {template ? 'Edit Template' : 'Create Template'}
          </h2>
          <button
            onClick={() => onClose(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Rent a Car, Tour Package"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Brief description of this template"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="file-text">File Text</option>
                    <option value="car">Car</option>
                    <option value="car-side">Car Side</option>
                    <option value="map">Map</option>
                    <option value="package">Package</option>
                    <option value="calendar">Calendar</option>
                    <option value="users">Users</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full h-10 px-1 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.is_active ? 'active' : 'inactive'}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.value === 'active' })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Template Fields */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Template Fields</h3>
              <p className="text-sm text-gray-600 mb-4">
                Define the fields that will appear in the booking form when this template is selected
              </p>
              <TemplateFieldBuilder fields={fields} onChange={handleFieldsChange} />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TemplateFormModal;
