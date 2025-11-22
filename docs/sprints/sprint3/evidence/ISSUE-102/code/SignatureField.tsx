'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Controller, Control, FieldError } from 'react-hook-form';
import { Button, Image, Group, Stack, Text, Paper } from '@mantine/core';
import { IconTrash, IconRefresh } from '@tabler/icons-react';
import { FieldWrapper } from './FieldWrapper';
import { FormField } from '../types';
import { notifications } from '@mantine/notifications';

interface SignatureFieldProps {
  field: FormField;
  control: Control<any>;
  error?: FieldError;
  disabled?: boolean;
}

export function SignatureField({ field, control, error, disabled }: SignatureFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_timestamp, setTimestamp] = useState<string>(''); // Reserved for future timestamp display

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 500;
    canvas.height = 150;

    // Set drawing style
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (disabled) return;
    setIsDrawing(true);
    setIsEmpty(false);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    setTimestamp('');
  };

  const embedTimestamp = async (dataUrl: string, timestampStr: string): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrl;

    const img = new window.Image();
    return new Promise((resolve) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height + 30;

        ctx.drawImage(img, 0, 0);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, img.height, canvas.width, 30);

        ctx.fillStyle = 'white';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          `Signed: ${new Date(timestampStr).toLocaleString()}`,
          canvas.width / 2,
          img.height + 20
        );

        resolve(canvas.toDataURL('image/png'));
      };
      img.src = dataUrl;
    });
  };

  const saveSignature = async (onChange: (value: string) => void) => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) {
      notifications.show({
        title: 'Signature Required',
        message: 'Please provide a signature',
        color: 'red',
      });
      return;
    }

    const dataUrl = canvas.toDataURL('image/png');
    const now = new Date();
    const timestampStr = now.toISOString();
    setTimestamp(timestampStr);

    // Embed timestamp
    const signatureWithTimestamp = await embedTimestamp(dataUrl, timestampStr);
    onChange(signatureWithTimestamp);

    notifications.show({
      title: 'Signature Saved',
      message: 'Signature saved successfully',
      color: 'green',
    });
  };

  return (
    <FieldWrapper id={field.id} label={field.label} required={field.required}>
      <Controller
        name={field.id}
        control={control}
        render={({ field: formField }) => {
          const value = formField.value as string | undefined;

          return (
            <Stack gap="sm">
              {!value ? (
                <Stack gap="sm">
                  <Paper
                    p="md"
                    style={{
                      border: '2px solid #2d3748',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      position: 'relative',
                    }}
                  >
                    <canvas
                      ref={canvasRef}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      style={{
                        display: 'block',
                        touchAction: 'none',
                        cursor: disabled ? 'not-allowed' : 'crosshair',
                        width: '100%',
                        maxWidth: '500px',
                        height: '150px',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 40,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '80%',
                        height: '1px',
                        backgroundColor: '#cbd5e0',
                        pointerEvents: 'none',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 20,
                        left: '10%',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: '#4a5568',
                      }}
                    >
                      X
                    </div>
                  </Paper>
                  <Group gap="sm">
                    <Button
                      leftSection={<IconRefresh size={16} />}
                      variant="light"
                      size="sm"
                      onClick={clearSignature}
                      disabled={disabled || isEmpty}
                    >
                      Clear
                    </Button>
                    <Button
                      variant="filled"
                      color="green"
                      size="sm"
                      onClick={() => saveSignature(formField.onChange)}
                      disabled={disabled || isEmpty}
                    >
                      Save Signature
                    </Button>
                  </Group>
                </Stack>
              ) : (
                <Stack gap="sm">
                  <div
                    style={{
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      backgroundColor: 'white',
                    }}
                  >
                    <Image src={value} alt="Signature" width={500} height={180} fit="contain" />
                  </div>
                  <Button
                    leftSection={<IconTrash size={16} />}
                    variant="light"
                    color="red"
                    size="sm"
                    onClick={() => {
                      formField.onChange('');
                      setTimestamp('');
                      clearSignature();
                    }}
                    disabled={disabled}
                  >
                    Redo Signature
                  </Button>
                </Stack>
              )}

              {error && (
                <Text size="12px" c="red">
                  {error.message}
                </Text>
              )}
            </Stack>
          );
        }}
      />
    </FieldWrapper>
  );
}
