import React, { useState, useCallback, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Card,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Grid,
  ActionIcon,
  Badge,
  Modal,
  TextInput,
  Textarea,
  Select,
  Tabs,
  ScrollArea,
  Center,
  Loader,
  Alert,
  Divider,
  Box,
  Tooltip,
} from '@mantine/core';
import {
  IconForms,
  IconPlus,
  IconEdit,
  IconEye,
  IconTrash,
  IconCopy,
  IconDeviceFloppy,
  IconGripVertical,
  IconPhoto,
  IconCalendar,
  IconMapPin,
  IconAlertTriangle,
  IconCheck,
  IconArrowLeft,
  IconTouchApp,
} from '@tabler/icons-react';
import { useDisclosure, useViewportSize } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from '@dnd-kit/modifiers';

// Mobile-optimized components
import { TouchFieldPalette } from './TouchFieldPalette';
import { TouchFormCanvas } from './TouchFormCanvas';
import { TouchFieldProperties } from './TouchFieldProperties';
import { MobileFormPreview } from './MobileFormPreview';
import { FormTemplateList } from './FormTemplateList';

// Types and utilities
import type { FieldDefinition, FormTemplate } from '@brave-forms/types';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';
import { useMobileStore } from '../../hooks/useMobileStore';

interface MobileFormBuilderProps {
  className?: string;
}

export function MobileFormBuilder({ className }: MobileFormBuilderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { width } = useViewportSize();
  const { addToQueue } = useOfflineQueue();
  const { currentProject } = useMobileStore();

  // Local state
  const [activeForm, setActiveForm] = useState<Partial<FormTemplate> | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'templates' | 'builder' | 'preview'>('templates');
  const [previewOpened, { open: openPreview, close: closePreview }] = useDisclosure(false);
  const [saving, setSaving] = useState(false);
  const [draggedField, setDraggedField] = useState<FieldDefinition | null>(null);

  // Touch-optimized drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Larger distance for better touch handling
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // Delay to distinguish from scrolling
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Check if we're on a mobile device for layout optimization
  const isMobile = width < 768;
  const isTabletPortrait = width >= 768 && width < 1024;

  // Initialize new form for construction use
  const createNewForm = useCallback(() => {
    const newForm: Partial<FormTemplate> = {
      id: `form_${Date.now()}`,
      name: 'New Construction Form',
      description: 'Created on mobile device',
      category: 'CUSTOM',
      fields: [],
      version: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      projectId: currentProject?.id,
    };

    setActiveForm(newForm);
    setActiveTab('builder');
    setSelectedFieldId(null);
  }, [currentProject]);

  // Add field with mobile-optimized defaults
  const handleAddField = useCallback((fieldType: string) => {
    if (!activeForm) return;

    const newField: FieldDefinition = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: fieldType as any,
      label: `New ${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)} Field`,
      name: `field_${Date.now()}`,
      description: '',
      placeholder: isMobile ? 'Tap to enter...' : 'Enter value...',
      defaultValue: undefined,
      validation: { required: false },
      order: activeForm.fields?.length || 0,
      width: isMobile ? 'full' : 'full', // Default to full width on mobile
      isMobileOptimized: true,
    };

    // Mobile-specific field optimizations
    if (['select', 'multiSelect', 'radio'].includes(fieldType)) {
      newField.options = [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' },
      ];
    }

    if (fieldType === 'number') {
      newField.validation = {
        required: false,
        min: 0,
        step: 0.01,
      };
    }

    if (fieldType === 'date') {
      newField.defaultValue = new Date().toISOString().split('T')[0];
    }

    if (fieldType === 'signature') {
      newField.validation = {
        required: true,
      };
    }

    setActiveForm(prev => ({
      ...prev,
      fields: [...(prev?.fields || []), newField],
    }));

    setSelectedFieldId(newField.id);

    // Mobile-optimized notification
    notifications.show({
      title: 'Field Added',
      message: `${fieldType} field ready for configuration`,
      color: 'green',
      icon: <IconCheck size={20} />,
      autoClose: 3000,
    });
  }, [activeForm, isMobile]);

  // Update field with mobile considerations
  const handleUpdateField = useCallback((fieldId: string, updates: Partial<FieldDefinition>) => {
    if (!activeForm) return;

    setActiveForm(prev => ({
      ...prev,
      fields: (prev?.fields || []).map(field =>
        field.id === fieldId 
          ? { 
              ...field, 
              ...updates,
              isMobileOptimized: true, // Ensure mobile optimization flag
            }
          : field
      ),
    }));
  }, [activeForm]);

  // Delete field with confirmation
  const handleDeleteField = useCallback((fieldId: string) => {
    if (!activeForm) return;

    setActiveForm(prev => ({
      ...prev,
      fields: (prev?.fields || []).filter(field => field.id !== fieldId),
    }));

    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }

    notifications.show({
      title: 'Field Removed',
      message: 'Field deleted successfully',
      color: 'orange',
      icon: <IconTrash size={20} />,
      autoClose: 2000,
    });
  }, [activeForm, selectedFieldId]);

  // Handle drag end for field reordering
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    setDraggedField(null);

    if (!activeForm?.fields || !over || active.id === over.id) {
      return;
    }

    const fields = activeForm.fields;
    const oldIndex = fields.findIndex(field => field.id === active.id);
    const newIndex = fields.findIndex(field => field.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedFields = arrayMove(fields, oldIndex, newIndex).map((field, index) => ({
      ...field,
      order: index,
    }));

    setActiveForm(prev => ({
      ...prev,
      fields: reorderedFields,
    }));

    // Provide haptic feedback on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }, [activeForm]);

  // Save form with offline support
  const handleSaveForm = useCallback(async () => {
    if (!activeForm || !activeForm.name) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please enter a form name',
        color: 'red',
        icon: <IconAlertTriangle size={20} />,
      });
      return;
    }

    if (!activeForm.fields?.length) {
      notifications.show({
        title: 'No Fields',
        message: 'Please add at least one field',
        color: 'red',
        icon: <IconAlertTriangle size={20} />,
      });
      return;
    }

    setSaving(true);

    try {
      // Add to offline queue with mobile context
      await addToQueue({
        type: 'form_submission',
        payload: {
          ...activeForm,
          updatedAt: new Date(),
          deviceInfo: {
            isMobile: true,
            screenWidth: width,
            userAgent: navigator.userAgent,
          },
        },
        priority: 'medium',
        retryCount: 0,
        maxRetries: 3,
        timestamp: new Date(),
      });

      notifications.show({
        title: 'Form Saved',
        message: 'Form saved successfully (will sync when online)',
        color: 'green',
        icon: <IconDeviceFloppy size={20} />,
        autoClose: 4000,
      });

      // Navigate back to templates list
      setTimeout(() => {
        setActiveTab('templates');
        setActiveForm(null);
        setSelectedFieldId(null);
      }, 1000);

    } catch (error) {
      console.error('Failed to save form:', error);
      notifications.show({
        title: 'Save Failed',
        message: 'Unable to save form. Please try again.',
        color: 'red',
        icon: <IconAlertTriangle size={20} />,
      });
    } finally {
      setSaving(false);
    }
  }, [activeForm, width, addToQueue]);

  // Get selected field object
  const selectedField = useMemo(() => {
    return selectedFieldId 
      ? activeForm?.fields?.find(field => field.id === selectedFieldId)
      : null;
  }, [selectedFieldId, activeForm?.fields]);

  // Render form builder header
  const renderBuilderHeader = () => (
    <Card shadow="sm" p="md" mb="md" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
      <Group justify="space-between" wrap="nowrap">
        <Group gap="sm">
          <ActionIcon
            variant="subtle"
            size="lg"
            onClick={() => {
              setActiveTab('templates');
              setActiveForm(null);
              setSelectedFieldId(null);
            }}
          >
            <IconArrowLeft size={24} />
          </ActionIcon>
          
          <div>
            <Title order={3} size="h4">
              {activeForm?.name || 'Form Builder'}
            </Title>
            <Text size="sm" c="dimmed">
              Touch and drag to reorder • Tap to configure
            </Text>
          </div>
        </Group>

        <Group gap="xs">
          <Tooltip label="Preview form">
            <ActionIcon
              variant="light"
              color="blue"
              size="lg"
              onClick={openPreview}
              disabled={!activeForm?.fields?.length}
            >
              <IconEye size={20} />
            </ActionIcon>
          </Tooltip>

          <Button
            leftSection={<IconDeviceFloppy size={20} />}
            loading={saving}
            size={isMobile ? 'md' : 'sm'}
            onClick={handleSaveForm}
          >
            Save
          </Button>
        </Group>
      </Group>
    </Card>
  );

  // Main form builder interface
  const renderFormBuilder = () => (
    <div className="mobile-form-builder">
      {renderBuilderHeader()}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
      >
        {isMobile ? (
          // Mobile: Tabbed interface
          <Tabs value={activeTab} onTabChange={(value) => setActiveTab(value as any)}>
            <Tabs.List grow mb="md">
              <Tabs.Tab 
                value="builder" 
                leftSection={<IconForms size={18} />}
              >
                Fields
              </Tabs.Tab>
              <Tabs.Tab 
                value="palette" 
                leftSection={<IconPlus size={18} />}
              >
                Add
              </Tabs.Tab>
              {selectedField && (
                <Tabs.Tab 
                  value="properties" 
                  leftSection={<IconEdit size={18} />}
                >
                  Edit
                </Tabs.Tab>
              )}
            </Tabs.List>

            <Tabs.Panel value="builder">
              <TouchFormCanvas
                fields={activeForm?.fields || []}
                selectedFieldId={selectedFieldId}
                onSelectField={setSelectedFieldId}
                onDeleteField={handleDeleteField}
                onUpdateField={handleUpdateField}
              />
            </Tabs.Panel>

            <Tabs.Panel value="palette">
              <TouchFieldPalette 
                onAddField={handleAddField}
                onTabChange={setActiveTab}
              />
            </Tabs.Panel>

            {selectedField && (
              <Tabs.Panel value="properties">
                <TouchFieldProperties
                  field={selectedField}
                  onUpdate={(updates) => handleUpdateField(selectedField.id, updates)}
                  onDelete={() => handleDeleteField(selectedField.id)}
                  onClose={() => setSelectedFieldId(null)}
                />
              </Tabs.Panel>
            )}
          </Tabs>
        ) : (
          // Tablet: Side-by-side layout
          <Grid gutter="md">
            <Grid.Col span={3}>
              <TouchFieldPalette 
                onAddField={handleAddField}
                compact
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <TouchFormCanvas
                fields={activeForm?.fields || []}
                selectedFieldId={selectedFieldId}
                onSelectField={setSelectedFieldId}
                onDeleteField={handleDeleteField}
                onUpdateField={handleUpdateField}
              />
            </Grid.Col>

            <Grid.Col span={3}>
              {selectedField ? (
                <TouchFieldProperties
                  field={selectedField}
                  onUpdate={(updates) => handleUpdateField(selectedField.id, updates)}
                  onDelete={() => handleDeleteField(selectedField.id)}
                  onClose={() => setSelectedFieldId(null)}
                />
              ) : (
                <Card p="xl" ta="center">
                  <IconTouchApp size={48} style={{ opacity: 0.5 }} />
                  <Text c="dimmed" mt="md">
                    Select a field to configure its properties
                  </Text>
                </Card>
              )}
            </Grid.Col>
          </Grid>
        )}
      </DndContext>
    </div>
  );

  return (
    <Container 
      size="xl" 
      className={`mobile-form-builder-container ${className || ''}`}
      p={isMobile ? 'xs' : 'md'}
    >
      <Routes>
        <Route path="/" element={
          <div>
            {/* Main templates view */}
            {activeTab === 'templates' && !activeForm && (
              <div>
                <Group justify="space-between" mb="lg">
                  <div>
                    <Title order={2}>Construction Forms</Title>
                    <Text c="dimmed">
                      Mobile-optimized forms for field inspections
                    </Text>
                  </div>
                  
                  <Button
                    leftSection={<IconPlus size={20} />}
                    size={isMobile ? 'md' : 'lg'}
                    onClick={createNewForm}
                  >
                    New Form
                  </Button>
                </Group>

                <FormTemplateList
                  onEdit={setActiveForm}
                  onCreateNew={createNewForm}
                />
              </div>
            )}

            {/* Form builder interface */}
            {activeForm && activeTab !== 'templates' && renderFormBuilder()}
          </div>
        } />
      </Routes>

      {/* Form preview modal */}
      <Modal
        opened={previewOpened}
        onClose={closePreview}
        size="lg"
        title="Form Preview"
        centered
        scrollAreaComponent={ScrollArea.Autosize}
      >
        {activeForm && (
          <MobileFormPreview 
            form={activeForm}
            onClose={closePreview}
          />
        )}
      </Modal>
    </Container>
  );
}