import { useState, useEffect } from 'react';

interface BatteryStatus {
  batteryLevel: number | null;
  isCharging: boolean;
  isLowBattery: boolean;
  chargingTime: number | null;
  dischargingTime: number | null;
}

/**
 * Hook to monitor device battery status for construction site use
 */
export function useBatteryStatus(): BatteryStatus {
  const [batteryStatus, setBatteryStatus] = useState<BatteryStatus>({
    batteryLevel: null,
    isCharging: false,
    isLowBattery: false,
    chargingTime: null,
    dischargingTime: null,
  });

  useEffect(() => {
    let battery: any = null;

    const updateBatteryStatus = (batteryManager: any) => {
      const level = batteryManager.level;
      const charging = batteryManager.charging;
      const chargingTime = batteryManager.chargingTime;
      const dischargingTime = batteryManager.dischargingTime;

      setBatteryStatus({
        batteryLevel: level,
        isCharging: charging,
        isLowBattery: level < 0.2 && !charging, // 20% threshold
        chargingTime: charging ? chargingTime : null,
        dischargingTime: !charging ? dischargingTime : null,
      });
    };

    const setupBatteryMonitoring = async () => {
      try {
        // Try to get battery API (not available in all browsers)
        if ('getBattery' in navigator) {
          battery = await (navigator as any).getBattery();
          updateBatteryStatus(battery);

          // Listen for battery changes
          battery.addEventListener('chargingchange', () => updateBatteryStatus(battery));
          battery.addEventListener('levelchange', () => updateBatteryStatus(battery));
          battery.addEventListener('chargingtimechange', () => updateBatteryStatus(battery));
          battery.addEventListener('dischargingtimechange', () => updateBatteryStatus(battery));
        } else {
          // Fallback for browsers without battery API
          console.warn('Battery API not supported');
          setBatteryStatus(prev => ({
            ...prev,
            batteryLevel: 1.0, // Assume full battery
            isCharging: false,
            isLowBattery: false,
          }));
        }
      } catch (error) {
        console.error('Failed to access battery status:', error);
        setBatteryStatus(prev => ({
          ...prev,
          batteryLevel: 1.0,
          isCharging: false,
          isLowBattery: false,
        }));
      }
    };

    setupBatteryMonitoring();

    // Cleanup
    return () => {
      if (battery) {
        try {
          battery.removeEventListener('chargingchange', () => updateBatteryStatus(battery));
          battery.removeEventListener('levelchange', () => updateBatteryStatus(battery));
          battery.removeEventListener('chargingtimechange', () => updateBatteryStatus(battery));
          battery.removeEventListener('dischargingtimechange', () => updateBatteryStatus(battery));
        } catch (error) {
          console.error('Failed to cleanup battery listeners:', error);
        }
      }
    };
  }, []);

  return batteryStatus;
}