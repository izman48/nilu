import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  FileText,
  Car,
  MapPin,
  Package,
  Calendar,
  Users,
  Power,
  PowerOff,
} from 'lucide-react';
import { api } from '@/api';
import { Template } from '@/types';
import TemplateFormModal from '@/components/TemplateFormModal';
import { toast } from 'react-hot-toast';

const Templates: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.templates.list();
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setShowModal(true);
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setShowModal(true);
  };

  const handleDelete = async (template: Template) => {
    if (!window.confirm(`Are you sure you want to delete "${template.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.templates.delete(template.id);
      toast.success('Template deleted successfully');
      loadTemplates();
    } catch (error: any) {
      console.error('Failed to delete template:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete template');
    }
  };

  const handleToggleActive = async (template: Template) => {
    try {
      await api.templates.update(template.id, { is_active: !template.is_active });
      toast.success(`Template ${!template.is_active ? 'activated' : 'deactivated'}`);
      loadTemplates();
    } catch (error: any) {
      console.error('Failed to toggle template status:', error);
      toast.error(error.response?.data?.detail || 'Failed to update template');
    }
  };

  const handleModalClose = (saved: boolean) => {
    setShowModal(false);
    setEditingTemplate(null);
    if (saved) {
      loadTemplates();
    }
  };

  const getIcon = (icon?: string) => {
    const iconMap: Record<string, any> = {
      car: Car,
      'car-side': Car,
      map: MapPin,
      package: Package,
      calendar: Calendar,
      users: Users,
      'file-text': FileText,
    };
    const IconComponent = icon ? iconMap[icon] || FileText : FileText;
    return <IconComponent className="h-8 w-8" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
          <p className="text-gray-600 mt-1">Manage booking form templates and their fields</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first booking template</p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`bg-white rounded-lg border-2 transition-all hover:shadow-lg ${
                template.is_active ? 'border-gray-200' : 'border-gray-300 opacity-60'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: template.color || '#3B82F6' }}
                  >
                    <div className="text-white">{getIcon(template.icon)}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleActive(template)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        template.is_active
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                      title={template.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {template.is_active ? (
                        <Power className="h-4 w-4" />
                      ) : (
                        <PowerOff className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(template)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(template)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
                {template.description && (
                  <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                )}

                <div className="space-y-2 border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Fields:</span>
                    <span className="font-medium text-gray-900">{template.fields?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        template.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {template.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {template.fields && template.fields.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Template fields:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.fields.slice(0, 5).map((field) => (
                        <span
                          key={field.id}
                          className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
                        >
                          {field.field_label}
                          {field.is_required && <span className="ml-1 text-red-500">*</span>}
                        </span>
                      ))}
                      {template.fields.length > 5 && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                          +{template.fields.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <TemplateFormModal
          template={editingTemplate}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default Templates;
