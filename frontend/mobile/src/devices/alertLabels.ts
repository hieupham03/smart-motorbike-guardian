export const alertReasonLabel = (reason: string) => ({
  MOTION_WHILE_ARMED: 'Rung lắc khi đang canh giữ',
  FALL_DETECTED: 'Phát hiện nghiêng/ngã',
  WHEEL_MOVEMENT_WHILE_ARMED: 'Bánh quay khi đang canh giữ',
  SPEED_LIMIT_EXCEEDED: 'Vượt ngưỡng tốc độ',
  LOW_BATTERY: 'Điện áp thấp',
} as Record<string, string>)[reason] ?? reason;
