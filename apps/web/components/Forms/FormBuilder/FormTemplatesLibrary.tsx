'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Stack,
  Group,
  SimpleGrid,
  Card,
  Text,
  Badge,
  Button,
  TextInput,
  Modal,
  ActionIcon,
  ScrollArea,
  Alert,
} from '@mantine/core';
import {
  IconSearch,
  IconTemplate,
  IconCheck,
  IconStar,
  IconStarFilled,
  IconEye,
  IconDownload,
  IconShieldCheck,
  IconHelmet,
  IconClipboard,
  IconInfoCircle,
} from '@tabler/icons-react';
import { useSnapshot } from 'valtio';
import { formBuilderStore, loadForm } from '@/lib/stores/form-builder-store';
import type { FieldDefinition, FormTemplate } from '@brave-forms/types';

// ============================================================================
// Template Types
// ============================================================================

interface FormTemplateData {
  id: string;
  name: string;
  description: string;
  category: 'EPA_CGP' | 'EPA_SWPPP' | 'OSHA_SAFETY' | 'STATE_PERMIT' | 'CUSTOM';
  tags: string[];
  fields: Partial<FieldDefinition>[];
  isFavorite?: boolean;
  createdAt?: string;
}

// ============================================================================
// Pre-built Templates
// ============================================================================

const EPA_TEMPLATES: FormTemplateData[] = [
  {
    id: 'epa-daily-inspection',
    name: 'EPA CGP Daily Inspection',
    description: 'Daily construction site inspection per EPA CGP requirements',
    category: 'EPA_CGP',
    tags: ['daily', 'inspection', 'required'],
    fields: [
      {
        id: 'inspector',
        type: 'inspector',
        name: 'inspector',
        label: 'Inspector Name',
        order: 0,
        validation: { required: true },
      },
      {
        id: 'date',
        type: 'date',
        name: 'inspectionDate',
        label: 'Inspection Date',
        order: 1,
        validation: { required: true },
      },
      {
        id: 'time',
        type: 'time',
        name: 'inspectionTime',
        label: 'Inspection Time',
        order: 2,
        validation: { required: true },
      },
      {
        id: 'gps',
        type: 'gpsLocation',
        name: 'location',
        label: 'Inspection Location',
        order: 3,
        validation: { required: true },
      },
      {
        id: 'weather',
        type: 'weather',
        name: 'weather',
        label: 'Current Weather',
        order: 4,
        validation: { required: true },
      },
      {
        id: 'rain24h',
        type: 'number',
        name: 'rain24h',
        label: 'Rain Last 24h (inches)',
        order: 5,
        validation: { required: true, min: 0, max: 20 },
      },
      {
        id: 'bmpStatus',
        type: 'bmpChecklist',
        name: 'bmpStatus',
        label: 'BMP Inspection Status',
        order: 6,
        validation: { required: true },
      },
      {
        id: 'deficiencies',
        type: 'textarea',
        name: 'deficiencies',
        label: 'Deficiencies Found',
        order: 7,
      },
      {
        id: 'corrective',
        type: 'textarea',
        name: 'correctiveAction',
        label: 'Corrective Actions',
        order: 8,
      },
      {
        id: 'photos',
        type: 'photo',
        name: 'inspectionPhotos',
        label: 'Inspection Photos',
        order: 9,
        validation: { required: true },
      },
      {
        id: 'signature',
        type: 'signature',
        name: 'inspectorSignature',
        label: 'Inspector Signature',
        order: 10,
        validation: { required: true },
      },
    ],
  },
  {
    id: 'epa-rain-event',
    name: 'EPA Rain Event Inspection',
    description: '0.25 inch rain event inspection within 24 hours (EPA CGP requirement)',
    category: 'EPA_CGP',
    tags: ['rain', 'event', '0.25 inch', 'required'],
    fields: [
      {
        id: 'inspector',
        type: 'inspector',
        name: 'inspector',
        label: 'Inspector Name',
        order: 0,
        validation: { required: true },
      },
      {
        id: 'date',
        type: 'date',
        name: 'inspectionDate',
        label: 'Inspection Date',
        order: 1,
        validation: { required: true },
      },
      {
        id: 'rainEventDate',
        type: 'date',
        name: 'rainEventDate',
        label: 'Rain Event Date',
        order: 2,
        validation: { required: true },
      },
      {
        id: 'totalRainfall',
        type: 'number',
        name: 'totalRainfall',
        label: 'Total Rainfall (inches)',
        order: 3,
        validation: { required: true, min: 0.25 },
      },
      {
        id: 'rainDuration',
        type: 'number',
        name: 'rainDuration',
        label: 'Rain Duration (hours)',
        order: 4,
        validation: { required: true, min: 0 },
      },
      {
        id: 'stormwaterDischarge',
        type: 'radio',
        name: 'stormwaterDischarge',
        label: 'Stormwater Discharge Observed?',
        order: 5,
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
        validation: { required: true },
      },
      {
        id: 'dischargeLocation',
        type: 'textarea',
        name: 'dischargeLocation',
        label: 'Discharge Location Description',
        order: 6,
      },
      {
        id: 'bmpEffectiveness',
        type: 'select',
        name: 'bmpEffectiveness',
        label: 'BMP Effectiveness',
        order: 7,
        options: [
          { label: 'Effective', value: 'effective' },
          { label: 'Needs Maintenance', value: 'maintenance' },
          { label: 'Failed', value: 'failed' },
        ],
        validation: { required: true },
      },
      {
        id: 'erosionAreas',
        type: 'textarea',
        name: 'erosionAreas',
        label: 'Erosion Areas Identified',
        order: 8,
      },
      {
        id: 'photos',
        type: 'photo',
        name: 'photos',
        label: 'Event Photos',
        order: 9,
        validation: { required: true },
      },
      {
        id: 'signature',
        type: 'signature',
        name: 'signature',
        label: 'Inspector Signature',
        order: 10,
        validation: { required: true },
      },
    ],
  },
  {
    id: 'epa-weekly-inspection',
    name: 'EPA Weekly Site Inspection',
    description: 'Weekly inspection for sites without 0.25 inch rain events',
    category: 'EPA_CGP',
    tags: ['weekly', 'inspection'],
    fields: [
      {
        id: 'inspector',
        type: 'inspector',
        name: 'inspector',
        label: 'Inspector Name',
        order: 0,
        validation: { required: true },
      },
      {
        id: 'weekEnding',
        type: 'date',
        name: 'weekEnding',
        label: 'Week Ending Date',
        order: 1,
        validation: { required: true },
      },
      {
        id: 'rainThisWeek',
        type: 'radio',
        name: 'rainThisWeek',
        label: 'Rain Event (0.25+ inches) This Week?',
        order: 2,
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
        validation: { required: true },
      },
      {
        id: 'weather',
        type: 'weather',
        name: 'weather',
        label: 'Current Conditions',
        order: 3,
        validation: { required: true },
      },
      {
        id: 'bmpStatus',
        type: 'bmpChecklist',
        name: 'bmpStatus',
        label: 'BMP Status Check',
        order: 4,
        validation: { required: true },
      },
      {
        id: 'stabilization',
        type: 'textarea',
        name: 'stabilization',
        label: 'Stabilization Progress',
        order: 5,
      },
      {
        id: 'photos',
        type: 'photo',
        name: 'photos',
        label: 'Weekly Photos',
        order: 6,
        validation: { required: true },
      },
      {
        id: 'signature',
        type: 'signature',
        name: 'signature',
        label: 'Signature',
        order: 7,
        validation: { required: true },
      },
    ],
  },
  {
    id: 'epa-swppp-amendment',
    name: 'SWPPP Amendment Record',
    description: 'Document changes to Stormwater Pollution Prevention Plan',
    category: 'EPA_SWPPP',
    tags: ['swppp', 'amendment', 'documentation'],
    fields: [
      {
        id: 'amendmentDate',
        type: 'date',
        name: 'amendmentDate',
        label: 'Amendment Date',
        order: 0,
        validation: { required: true },
      },
      {
        id: 'preparedBy',
        type: 'text',
        name: 'preparedBy',
        label: 'Prepared By',
        order: 1,
        validation: { required: true },
      },
      {
        id: 'amendmentType',
        type: 'select',
        name: 'amendmentType',
        label: 'Amendment Type',
        order: 2,
        options: [
          { label: 'BMP Addition', value: 'bmp_add' },
          { label: 'BMP Removal', value: 'bmp_remove' },
          { label: 'Site Change', value: 'site_change' },
          { label: 'Schedule Change', value: 'schedule' },
          { label: 'Contact Update', value: 'contact' },
        ],
        validation: { required: true },
      },
      {
        id: 'description',
        type: 'textarea',
        name: 'description',
        label: 'Amendment Description',
        order: 3,
        validation: { required: true },
      },
      {
        id: 'justification',
        type: 'textarea',
        name: 'justification',
        label: 'Justification',
        order: 4,
        validation: { required: true },
      },
      {
        id: 'effectiveDate',
        type: 'date',
        name: 'effectiveDate',
        label: 'Effective Date',
        order: 5,
        validation: { required: true },
      },
      {
        id: 'signature',
        type: 'signature',
        name: 'signature',
        label: 'Authorized Signature',
        order: 6,
        validation: { required: true },
      },
    ],
  },
  {
    id: 'epa-corrective-action',
    name: 'Corrective Action Log',
    description: 'Track corrective actions for BMP deficiencies',
    category: 'EPA_CGP',
    tags: ['corrective', 'action', 'deficiency'],
    fields: [
      {
        id: 'dateIdentified',
        type: 'date',
        name: 'dateIdentified',
        label: 'Date Identified',
        order: 0,
        validation: { required: true },
      },
      {
        id: 'identifiedBy',
        type: 'text',
        name: 'identifiedBy',
        label: 'Identified By',
        order: 1,
        validation: { required: true },
      },
      {
        id: 'deficiencyType',
        type: 'select',
        name: 'deficiencyType',
        label: 'Deficiency Type',
        order: 2,
        options: [
          { label: 'BMP Damage', value: 'damage' },
          { label: 'BMP Missing', value: 'missing' },
          { label: 'Erosion', value: 'erosion' },
          { label: 'Sediment Discharge', value: 'discharge' },
          { label: 'Other', value: 'other' },
        ],
        validation: { required: true },
      },
      {
        id: 'location',
        type: 'textarea',
        name: 'location',
        label: 'Location Description',
        order: 3,
        validation: { required: true },
      },
      {
        id: 'correctiveAction',
        type: 'textarea',
        name: 'correctiveAction',
        label: 'Corrective Action Required',
        order: 4,
        validation: { required: true },
      },
      {
        id: 'deadline',
        type: 'date',
        name: 'deadline',
        label: 'Completion Deadline',
        order: 5,
        validation: { required: true },
      },
      {
        id: 'completedDate',
        type: 'date',
        name: 'completedDate',
        label: 'Date Completed',
        order: 6,
      },
      { id: 'photos', type: 'photo', name: 'photos', label: 'Before/After Photos', order: 7 },
      {
        id: 'signature',
        type: 'signature',
        name: 'signature',
        label: 'Signature',
        order: 8,
        validation: { required: true },
      },
    ],
  },
];

const OSHA_TEMPLATES: FormTemplateData[] = [
  {
    id: 'osha-daily-safety',
    name: 'OSHA Daily Safety Inspection',
    description: 'Daily jobsite safety walkthrough checklist',
    category: 'OSHA_SAFETY',
    tags: ['daily', 'safety', 'inspection'],
    fields: [
      {
        id: 'inspector',
        type: 'inspector',
        name: 'inspector',
        label: 'Safety Inspector',
        order: 0,
        validation: { required: true },
      },
      {
        id: 'date',
        type: 'date',
        name: 'date',
        label: 'Inspection Date',
        order: 1,
        validation: { required: true },
      },
      {
        id: 'projectArea',
        type: 'text',
        name: 'projectArea',
        label: 'Project Area Inspected',
        order: 2,
        validation: { required: true },
      },
      {
        id: 'ppe',
        type: 'checkbox',
        name: 'ppeCompliance',
        label: 'PPE Compliance Observed',
        order: 3,
      },
      {
        id: 'fallProtection',
        type: 'select',
        name: 'fallProtection',
        label: 'Fall Protection Status',
        order: 4,
        options: [
          { label: 'Adequate', value: 'adequate' },
          { label: 'Needs Improvement', value: 'improve' },
          { label: 'Deficient', value: 'deficient' },
          { label: 'N/A', value: 'na' },
        ],
        validation: { required: true },
      },
      {
        id: 'scaffolding',
        type: 'select',
        name: 'scaffolding',
        label: 'Scaffolding Status',
        order: 5,
        options: [
          { label: 'Adequate', value: 'adequate' },
          { label: 'Needs Improvement', value: 'improve' },
          { label: 'Deficient', value: 'deficient' },
          { label: 'N/A', value: 'na' },
        ],
        validation: { required: true },
      },
      {
        id: 'electrical',
        type: 'select',
        name: 'electrical',
        label: 'Electrical Safety',
        order: 6,
        options: [
          { label: 'Adequate', value: 'adequate' },
          { label: 'Needs Improvement', value: 'improve' },
          { label: 'Deficient', value: 'deficient' },
          { label: 'N/A', value: 'na' },
        ],
        validation: { required: true },
      },
      {
        id: 'housekeeping',
        type: 'select',
        name: 'housekeeping',
        label: 'Housekeeping',
        order: 7,
        options: [
          { label: 'Adequate', value: 'adequate' },
          { label: 'Needs Improvement', value: 'improve' },
          { label: 'Deficient', value: 'deficient' },
        ],
        validation: { required: true },
      },
      {
        id: 'hazards',
        type: 'textarea',
        name: 'hazardsIdentified',
        label: 'Hazards Identified',
        order: 8,
      },
      {
        id: 'corrective',
        type: 'textarea',
        name: 'correctiveActions',
        label: 'Corrective Actions',
        order: 9,
      },
      { id: 'photos', type: 'photo', name: 'photos', label: 'Safety Photos', order: 10 },
      {
        id: 'signature',
        type: 'signature',
        name: 'signature',
        label: 'Inspector Signature',
        order: 11,
        validation: { required: true },
      },
    ],
  },
  {
    id: 'osha-incident-report',
    name: 'Incident/Accident Report',
    description: 'OSHA recordable incident documentation',
    category: 'OSHA_SAFETY',
    tags: ['incident', 'accident', 'injury'],
    fields: [
      {
        id: 'reportDate',
        type: 'date',
        name: 'reportDate',
        label: 'Report Date',
        order: 0,
        validation: { required: true },
      },
      {
        id: 'incidentDate',
        type: 'date',
        name: 'incidentDate',
        label: 'Incident Date',
        order: 1,
        validation: { required: true },
      },
      {
        id: 'incidentTime',
        type: 'time',
        name: 'incidentTime',
        label: 'Incident Time',
        order: 2,
        validation: { required: true },
      },
      {
        id: 'location',
        type: 'textarea',
        name: 'location',
        label: 'Incident Location',
        order: 3,
        validation: { required: true },
      },
      {
        id: 'employeeName',
        type: 'text',
        name: 'employeeName',
        label: 'Employee Name',
        order: 4,
        validation: { required: true },
      },
      {
        id: 'incidentType',
        type: 'select',
        name: 'incidentType',
        label: 'Incident Type',
        order: 5,
        options: [
          { label: 'Injury', value: 'injury' },
          { label: 'Near Miss', value: 'nearmiss' },
          { label: 'Property Damage', value: 'property' },
          { label: 'Environmental', value: 'environmental' },
        ],
        validation: { required: true },
      },
      {
        id: 'description',
        type: 'textarea',
        name: 'description',
        label: 'Incident Description',
        order: 6,
        validation: { required: true },
      },
      { id: 'injuries', type: 'textarea', name: 'injuries', label: 'Injuries Sustained', order: 7 },
      {
        id: 'treatment',
        type: 'textarea',
        name: 'treatment',
        label: 'Treatment Provided',
        order: 8,
      },
      { id: 'witnesses', type: 'textarea', name: 'witnesses', label: 'Witnesses', order: 9 },
      {
        id: 'rootCause',
        type: 'textarea',
        name: 'rootCause',
        label: 'Root Cause Analysis',
        order: 10,
      },
      {
        id: 'preventive',
        type: 'textarea',
        name: 'preventiveActions',
        label: 'Preventive Actions',
        order: 11,
      },
      { id: 'photos', type: 'photo', name: 'photos', label: 'Incident Photos', order: 12 },
      {
        id: 'supervisorSig',
        type: 'signature',
        name: 'supervisorSignature',
        label: 'Supervisor Signature',
        order: 13,
        validation: { required: true },
      },
    ],
  },
  {
    id: 'osha-toolbox-talk',
    name: 'Toolbox Talk Record',
    description: 'Daily safety briefing documentation',
    category: 'OSHA_SAFETY',
    tags: ['toolbox', 'talk', 'training'],
    fields: [
      {
        id: 'date',
        type: 'date',
        name: 'date',
        label: 'Date',
        order: 0,
        validation: { required: true },
      },
      {
        id: 'conductor',
        type: 'text',
        name: 'conductor',
        label: 'Conducted By',
        order: 1,
        validation: { required: true },
      },
      {
        id: 'topic',
        type: 'text',
        name: 'topic',
        label: 'Topic',
        order: 2,
        validation: { required: true },
      },
      {
        id: 'description',
        type: 'textarea',
        name: 'description',
        label: 'Discussion Summary',
        order: 3,
        validation: { required: true },
      },
      {
        id: 'attendees',
        type: 'textarea',
        name: 'attendees',
        label: 'Attendee Names',
        order: 4,
        validation: { required: true },
      },
      {
        id: 'attendeeCount',
        type: 'number',
        name: 'attendeeCount',
        label: 'Number of Attendees',
        order: 5,
        validation: { required: true, min: 1 },
      },
      {
        id: 'questions',
        type: 'textarea',
        name: 'questions',
        label: 'Questions/Concerns Raised',
        order: 6,
      },
      {
        id: 'signature',
        type: 'signature',
        name: 'conductorSignature',
        label: 'Conductor Signature',
        order: 7,
        validation: { required: true },
      },
    ],
  },
  {
    id: 'osha-excavation',
    name: 'Excavation Safety Checklist',
    description: 'Pre-excavation and daily excavation safety inspection',
    category: 'OSHA_SAFETY',
    tags: ['excavation', 'trenching', 'safety'],
    fields: [
      {
        id: 'inspector',
        type: 'inspector',
        name: 'competentPerson',
        label: 'Competent Person',
        order: 0,
        validation: { required: true },
      },
      {
        id: 'date',
        type: 'date',
        name: 'date',
        label: 'Inspection Date',
        order: 1,
        validation: { required: true },
      },
      {
        id: 'location',
        type: 'text',
        name: 'excavationLocation',
        label: 'Excavation Location',
        order: 2,
        validation: { required: true },
      },
      {
        id: 'depth',
        type: 'number',
        name: 'excavationDepth',
        label: 'Excavation Depth (feet)',
        order: 3,
        validation: { required: true, min: 0 },
      },
      {
        id: 'soilType',
        type: 'select',
        name: 'soilType',
        label: 'Soil Classification',
        order: 4,
        options: [
          { label: 'Type A (Stable)', value: 'a' },
          { label: 'Type B', value: 'b' },
          { label: 'Type C (Unstable)', value: 'c' },
        ],
        validation: { required: true },
      },
      {
        id: 'shoring',
        type: 'radio',
        name: 'shoringInstalled',
        label: 'Shoring/Shielding Installed',
        order: 5,
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
          { label: 'N/A', value: 'na' },
        ],
        validation: { required: true },
      },
      {
        id: 'egress',
        type: 'radio',
        name: 'egressProvided',
        label: 'Egress Within 25 ft',
        order: 6,
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
        validation: { required: true },
      },
      {
        id: 'utilities',
        type: 'radio',
        name: 'utilitiesMarked',
        label: 'Utilities Located/Marked',
        order: 7,
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
        validation: { required: true },
      },
      {
        id: 'waterAccum',
        type: 'radio',
        name: 'waterAccumulation',
        label: 'Water Accumulation',
        order: 8,
        options: [
          { label: 'None', value: 'none' },
          { label: 'Present - Controlled', value: 'controlled' },
          { label: 'Present - Uncontrolled', value: 'uncontrolled' },
        ],
        validation: { required: true },
      },
      {
        id: 'notes',
        type: 'textarea',
        name: 'additionalNotes',
        label: 'Additional Notes',
        order: 9,
      },
      { id: 'photos', type: 'photo', name: 'photos', label: 'Excavation Photos', order: 10 },
      {
        id: 'signature',
        type: 'signature',
        name: 'signature',
        label: 'Competent Person Signature',
        order: 11,
        validation: { required: true },
      },
    ],
  },
];

const GENERAL_TEMPLATES: FormTemplateData[] = [
  {
    id: 'daily-construction-log',
    name: 'Daily Construction Log',
    description: 'Daily project progress and activity record',
    category: 'CUSTOM',
    tags: ['daily', 'log', 'progress'],
    fields: [
      {
        id: 'date',
        type: 'date',
        name: 'date',
        label: 'Date',
        order: 0,
        validation: { required: true },
      },
      {
        id: 'weather',
        type: 'weather',
        name: 'weather',
        label: 'Weather Conditions',
        order: 1,
        validation: { required: true },
      },
      {
        id: 'temperature',
        type: 'number',
        name: 'temperature',
        label: 'Temperature (F)',
        order: 2,
      },
      {
        id: 'crewSize',
        type: 'number',
        name: 'crewSize',
        label: 'Crew Size',
        order: 3,
        validation: { required: true, min: 0 },
      },
      {
        id: 'workPerformed',
        type: 'textarea',
        name: 'workPerformed',
        label: 'Work Performed Today',
        order: 4,
        validation: { required: true },
      },
      {
        id: 'materials',
        type: 'textarea',
        name: 'materialsUsed',
        label: 'Materials Used',
        order: 5,
      },
      {
        id: 'equipment',
        type: 'textarea',
        name: 'equipmentUsed',
        label: 'Equipment Used',
        order: 6,
      },
      {
        id: 'visitors',
        type: 'textarea',
        name: 'visitors',
        label: 'Visitors/Inspectors',
        order: 7,
      },
      { id: 'delays', type: 'textarea', name: 'delays', label: 'Delays/Issues', order: 8 },
      { id: 'notes', type: 'textarea', name: 'notes', label: 'Additional Notes', order: 9 },
      { id: 'photos', type: 'photo', name: 'photos', label: 'Progress Photos', order: 10 },
      {
        id: 'signature',
        type: 'signature',
        name: 'signature',
        label: 'Superintendent Signature',
        order: 11,
        validation: { required: true },
      },
    ],
  },
  {
    id: 'equipment-checklist',
    name: 'Equipment Pre-Use Checklist',
    description: 'Daily equipment inspection before operation',
    category: 'CUSTOM',
    tags: ['equipment', 'inspection', 'pre-use'],
    fields: [
      {
        id: 'date',
        type: 'date',
        name: 'date',
        label: 'Date',
        order: 0,
        validation: { required: true },
      },
      {
        id: 'operator',
        type: 'text',
        name: 'operator',
        label: 'Operator Name',
        order: 1,
        validation: { required: true },
      },
      {
        id: 'equipment',
        type: 'text',
        name: 'equipmentId',
        label: 'Equipment ID/Number',
        order: 2,
        validation: { required: true },
      },
      {
        id: 'equipmentType',
        type: 'select',
        name: 'equipmentType',
        label: 'Equipment Type',
        order: 3,
        options: [
          { label: 'Excavator', value: 'excavator' },
          { label: 'Loader', value: 'loader' },
          { label: 'Crane', value: 'crane' },
          { label: 'Forklift', value: 'forklift' },
          { label: 'Aerial Lift', value: 'aerial' },
          { label: 'Other', value: 'other' },
        ],
        validation: { required: true },
      },
      { id: 'hourMeter', type: 'number', name: 'hourMeter', label: 'Hour Meter Reading', order: 4 },
      {
        id: 'visualInspection',
        type: 'checkbox',
        name: 'visualInspection',
        label: 'Visual Inspection Complete',
        order: 5,
      },
      { id: 'fluids', type: 'checkbox', name: 'fluidsChecked', label: 'Fluids Checked', order: 6 },
      {
        id: 'controls',
        type: 'checkbox',
        name: 'controlsChecked',
        label: 'Controls Functional',
        order: 7,
      },
      {
        id: 'safety',
        type: 'checkbox',
        name: 'safetyDevices',
        label: 'Safety Devices Working',
        order: 8,
      },
      { id: 'defects', type: 'textarea', name: 'defects', label: 'Defects Found', order: 9 },
      {
        id: 'safeToOperate',
        type: 'radio',
        name: 'safeToOperate',
        label: 'Safe to Operate?',
        order: 10,
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
        validation: { required: true },
      },
      {
        id: 'signature',
        type: 'signature',
        name: 'operatorSignature',
        label: 'Operator Signature',
        order: 11,
        validation: { required: true },
      },
    ],
  },
  {
    id: 'delivery-receipt',
    name: 'Material Delivery Receipt',
    description: 'Document material deliveries and verify quantities',
    category: 'CUSTOM',
    tags: ['delivery', 'materials', 'receipt'],
    fields: [
      {
        id: 'date',
        type: 'date',
        name: 'date',
        label: 'Delivery Date',
        order: 0,
        validation: { required: true },
      },
      {
        id: 'time',
        type: 'time',
        name: 'time',
        label: 'Delivery Time',
        order: 1,
        validation: { required: true },
      },
      {
        id: 'supplier',
        type: 'text',
        name: 'supplier',
        label: 'Supplier Name',
        order: 2,
        validation: { required: true },
      },
      { id: 'poNumber', type: 'text', name: 'poNumber', label: 'PO Number', order: 3 },
      {
        id: 'material',
        type: 'text',
        name: 'material',
        label: 'Material Description',
        order: 4,
        validation: { required: true },
      },
      {
        id: 'quantity',
        type: 'number',
        name: 'quantity',
        label: 'Quantity',
        order: 5,
        validation: { required: true, min: 0 },
      },
      {
        id: 'unit',
        type: 'select',
        name: 'unit',
        label: 'Unit',
        order: 6,
        options: [
          { label: 'Each', value: 'each' },
          { label: 'Cubic Yards', value: 'cy' },
          { label: 'Tons', value: 'tons' },
          { label: 'Linear Feet', value: 'lf' },
          { label: 'Square Feet', value: 'sf' },
        ],
        validation: { required: true },
      },
      {
        id: 'condition',
        type: 'select',
        name: 'condition',
        label: 'Condition',
        order: 7,
        options: [
          { label: 'Acceptable', value: 'acceptable' },
          { label: 'Damaged', value: 'damaged' },
          { label: 'Rejected', value: 'rejected' },
        ],
        validation: { required: true },
      },
      { id: 'notes', type: 'textarea', name: 'notes', label: 'Notes', order: 8 },
      { id: 'photos', type: 'photo', name: 'photos', label: 'Delivery Photos', order: 9 },
      {
        id: 'receiverSig',
        type: 'signature',
        name: 'receiverSignature',
        label: 'Receiver Signature',
        order: 10,
        validation: { required: true },
      },
    ],
  },
];

const ALL_TEMPLATES = [...EPA_TEMPLATES, ...OSHA_TEMPLATES, ...GENERAL_TEMPLATES];

// ============================================================================
// Custom Template Storage
// ============================================================================

const CUSTOM_TEMPLATES_KEY = 'braveforms_custom_templates';
const FAVORITES_KEY = 'braveforms_favorite_templates';

function loadCustomTemplates(): FormTemplateData[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCustomTemplates(templates: FormTemplateData[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(templates));
}

function loadFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveFavorites(ids: string[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
}

// ============================================================================
// Main Component
// ============================================================================

interface FormTemplatesLibraryProps {
  onSelectTemplate?: (template: FormTemplateData) => void;
}

/**
 * Form Templates Library Component
 *
 * Browse, search, and use pre-built EPA/OSHA compliance templates.
 */
export function FormTemplatesLibrary({ onSelectTemplate }: FormTemplatesLibraryProps) {
  const snap = useSnapshot(formBuilderStore);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<FormTemplateData | null>(null);
  const [customTemplates, setCustomTemplates] = useState<FormTemplateData[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Load custom templates and favorites from localStorage
  useEffect(() => {
    setCustomTemplates(loadCustomTemplates());
    setFavorites(loadFavorites());
  }, []);

  // All templates including custom
  const allTemplates = useMemo(() => {
    return [...ALL_TEMPLATES, ...customTemplates].map((t) => ({
      ...t,
      isFavorite: favorites.includes(t.id),
    }));
  }, [customTemplates, favorites]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return allTemplates.filter((template) => {
      const matchesSearch =
        searchQuery === '' ||
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = !selectedCategory || template.category === selectedCategory;
      const matchesFavorites = !showFavoritesOnly || template.isFavorite;

      return matchesSearch && matchesCategory && matchesFavorites;
    });
  }, [allTemplates, searchQuery, selectedCategory, showFavoritesOnly]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allTemplates.forEach((t) => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return counts;
  }, [allTemplates]);

  /**
   * Load template into form builder
   */
  const handleUseTemplate = (template: FormTemplateData) => {
    if (snap.isDirty) {
      // eslint-disable-next-line no-alert
      const confirmed = window.confirm(
        'You have unsaved changes. Loading a template will replace your current form. Continue?'
      );
      if (!confirmed) return;
    }

    // Convert template to FormTemplate format
    const formTemplate: Partial<FormTemplate> = {
      name: template.name,
      description: template.description,
      category: template.category,
      fields: template.fields as FieldDefinition[],
    };

    loadForm(formTemplate as FormTemplate);
    setPreviewTemplate(null);

    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
  };

  /**
   * Toggle favorite status
   */
  const toggleFavorite = (templateId: string) => {
    const newFavorites = favorites.includes(templateId)
      ? favorites.filter((id) => id !== templateId)
      : [...favorites, templateId];

    setFavorites(newFavorites);
    saveFavorites(newFavorites);
  };

  /**
   * Get category icon
   */
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'EPA_CGP':
      case 'EPA_SWPPP':
        return <IconShieldCheck size={16} />;
      case 'OSHA_SAFETY':
        return <IconHelmet size={16} />;
      default:
        return <IconClipboard size={16} />;
    }
  };

  /**
   * Get category color
   */
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'EPA_CGP':
        return 'green';
      case 'EPA_SWPPP':
        return 'teal';
      case 'OSHA_SAFETY':
        return 'orange';
      case 'STATE_PERMIT':
        return 'blue';
      default:
        return 'gray';
    }
  };

  /**
   * Get category label
   */
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'EPA_CGP':
        return 'EPA CGP';
      case 'EPA_SWPPP':
        return 'EPA SWPPP';
      case 'OSHA_SAFETY':
        return 'OSHA Safety';
      case 'STATE_PERMIT':
        return 'State Permit';
      case 'CUSTOM':
        return 'Custom';
      default:
        return category;
    }
  };

  return (
    <Stack gap="md">
      {/* Search and Filters */}
      <TextInput
        placeholder="Search templates..."
        leftSection={<IconSearch size={16} />}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {/* Category Tabs */}
      <ScrollArea>
        <Group gap="xs" wrap="nowrap">
          <Button
            size="xs"
            variant={!selectedCategory && !showFavoritesOnly ? 'filled' : 'light'}
            onClick={() => {
              setSelectedCategory(null);
              setShowFavoritesOnly(false);
            }}
          >
            All ({allTemplates.length})
          </Button>

          <Button
            size="xs"
            variant={showFavoritesOnly ? 'filled' : 'light'}
            leftSection={<IconStarFilled size={14} />}
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          >
            Favorites ({favorites.length})
          </Button>

          {Object.entries(categoryCounts).map(([category, count]) => (
            <Button
              key={category}
              size="xs"
              variant={selectedCategory === category ? 'filled' : 'light'}
              color={getCategoryColor(category)}
              leftSection={getCategoryIcon(category)}
              onClick={() => {
                setSelectedCategory(category);
                setShowFavoritesOnly(false);
              }}
            >
              {getCategoryLabel(category)} ({count})
            </Button>
          ))}
        </Group>
      </ScrollArea>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card withBorder padding="xl" ta="center">
          <Stack align="center" gap="md">
            <IconTemplate size={48} color="gray" />
            <Text c="dimmed">No templates match your search</Text>
          </Stack>
        </Card>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
          {filteredTemplates.map((template) => (
            <Card key={template.id} withBorder padding="md" style={{ position: 'relative' }}>
              <Stack gap="xs">
                {/* Header */}
                <Group justify="space-between">
                  <Badge
                    size="sm"
                    color={getCategoryColor(template.category)}
                    leftSection={getCategoryIcon(template.category)}
                  >
                    {getCategoryLabel(template.category)}
                  </Badge>

                  <ActionIcon
                    variant="subtle"
                    color={template.isFavorite ? 'yellow' : 'gray'}
                    onClick={() => toggleFavorite(template.id)}
                    aria-label={template.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {template.isFavorite ? <IconStarFilled size={16} /> : <IconStar size={16} />}
                  </ActionIcon>
                </Group>

                {/* Content */}
                <div>
                  <Text size="sm" fw={600} lineClamp={1}>
                    {template.name}
                  </Text>
                  <Text size="xs" c="dimmed" lineClamp={2}>
                    {template.description}
                  </Text>
                </div>

                {/* Tags */}
                <Group gap={4}>
                  {template.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} size="xs" variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </Group>

                {/* Footer */}
                <Group gap="xs" mt="xs">
                  <Text size="xs" c="dimmed">
                    {template.fields.length} fields
                  </Text>
                </Group>

                {/* Actions */}
                <Group gap="xs">
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconEye size={14} />}
                    onClick={() => setPreviewTemplate(template)}
                    style={{ flex: 1 }}
                  >
                    Preview
                  </Button>
                  <Button
                    size="xs"
                    leftSection={<IconCheck size={14} />}
                    onClick={() => handleUseTemplate(template)}
                    style={{ flex: 1 }}
                  >
                    Use
                  </Button>
                </Group>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      )}

      {/* Preview Modal */}
      <Modal
        opened={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        title={previewTemplate?.name}
        size="lg"
      >
        {previewTemplate && (
          <Stack gap="md">
            <Text size="sm">{previewTemplate.description}</Text>

            <Badge color={getCategoryColor(previewTemplate.category)}>
              {getCategoryLabel(previewTemplate.category)}
            </Badge>

            <Card withBorder padding="md">
              <Stack gap="xs">
                <Text size="sm" fw={600}>
                  Fields ({previewTemplate.fields.length})
                </Text>
                <ScrollArea h={300}>
                  <Stack gap="xs">
                    {previewTemplate.fields.map((field, index) => (
                      <Group key={field.id || index} gap="xs">
                        <Badge size="xs" variant="light">
                          {field.type}
                        </Badge>
                        <Text size="sm">
                          {field.label}
                          {field.validation?.required && (
                            <Text span c="red" ml={4}>
                              *
                            </Text>
                          )}
                        </Text>
                      </Group>
                    ))}
                  </Stack>
                </ScrollArea>
              </Stack>
            </Card>

            <Button
              fullWidth
              leftSection={<IconDownload size={16} />}
              onClick={() => handleUseTemplate(previewTemplate)}
            >
              Use This Template
            </Button>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}

// ============================================================================
// Save As Template Component
// ============================================================================

interface SaveAsTemplateButtonProps {
  onSave?: (template: FormTemplateData) => void;
}

/**
 * Save current form as a custom template
 */
export function SaveAsTemplateButton({ onSave }: SaveAsTemplateButtonProps) {
  const snap = useSnapshot(formBuilderStore);
  const [opened, setOpened] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSave = () => {
    if (!name.trim()) return;

    const template: FormTemplateData = {
      id: `custom_${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      category: 'CUSTOM',
      tags: ['custom'],
      fields: snap.fields.map((f) => ({
        ...f,
        options: f.options ? [...f.options.map((o) => ({ ...o }))] : undefined,
        conditional: f.conditional
          ? {
              ...f.conditional,
              conditions: [...f.conditional.conditions.map((c) => ({ ...c }))],
              actions: [...f.conditional.actions.map((a) => ({ ...a }))],
            }
          : undefined,
      })),
      createdAt: new Date().toISOString(),
    };

    // Save to localStorage
    const existing = loadCustomTemplates();
    saveCustomTemplates([...existing, template]);

    setOpened(false);
    setName('');
    setDescription('');

    if (onSave) {
      onSave(template);
    }
  };

  return (
    <>
      <Button
        variant="light"
        leftSection={<IconStar size={16} />}
        onClick={() => setOpened(true)}
        disabled={snap.fields.length === 0}
      >
        Save as Template
      </Button>

      <Modal opened={opened} onClose={() => setOpened(false)} title="Save as Template">
        <Stack gap="md">
          <TextInput
            label="Template Name"
            placeholder="My Custom Template"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <TextInput
            label="Description"
            placeholder="Brief description of this template"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Alert icon={<IconInfoCircle size={16} />} color="blue">
            Your template will include {snap.fields.length} fields and be saved locally.
          </Alert>

          <Group justify="flex-end">
            <Button variant="light" onClick={() => setOpened(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!name.trim()}>
              Save Template
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}

export default FormTemplatesLibrary;
