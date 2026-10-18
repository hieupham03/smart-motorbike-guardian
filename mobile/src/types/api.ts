export type AccountRole = 'OWNER' | 'VIEWER' | 'ADMIN';

export interface User {
  userId: string;
  email: string;
  fullName: string;
  role: AccountRole;
  status: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer' | string;
  /** Backend configuration value in milliseconds. */
  expiresIn: number;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  fullName: string;
  role: Exclude<AccountRole, 'ADMIN'>;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export type LifecycleState = 'REGISTERED' | 'ACTIVE' | 'REVOKED' | 'DECOMMISSIONED';
export type SecurityState = 'PARKED' | 'ARMED' | 'ALARM' | 'THEFT_LOCK';
export type DataSource = 'HARDWARE' | 'SIMULATED' | 'LEGACY';

export interface Device {
  deviceId: string;
  deviceUuid: string;
  name: string;
  licensePlate: string | null;
  vehicleModel: string | null;
  lifecycleState: LifecycleState;
  securityState: SecurityState;
  firmwareVersion: string | null;
  hwVersion: string | null;
  dataSource: DataSource;
  sensorConnected: boolean | null;
  imuValid: boolean | null;
  speedValid: boolean | null;
  gpsValid: boolean | null;
  gpsAgeMs: number | null;
  lastTelemetryAt: string | null;
  lastLocationReceivedAt: string | null;
  lastSpeedKmh: number | null;
  lastBatteryV: number | null;
  lastLatitude: number | null;
  lastLongitude: number | null;
  speedThresholdKmh: number | null;
  batteryLowThresholdV: number | null;
  tiltThresholdDeg: number | null;
  lastSeenAt: string | null;
  createdAt: string;
  currentUserRole: AccountRole | null;
}

export interface Telemetry {
  readingId: string;
  deviceId: string;
  dataSource: DataSource;
  sensorConnected: boolean | null;
  imuValid: boolean | null;
  speedValid: boolean | null;
  gpsValid: boolean | null;
  gpsAgeMs: number | null;
  deviceUptimeS: number | null;
  receivedAt: string;
  speedKmh: number | null;
  batteryV: number | null;
  accelX: number | null;
  accelY: number | null;
  accelZ: number | null;
  latitude: number | null;
  longitude: number | null;
  state: SecurityState | string;
  /** Backend epoch seconds, not firmware uptime. */
  ts: number;
}

export type CommandType = 'ARM' | 'DISARM' | 'LOCK_ENGINE' | 'UNLOCK_ENGINE' | 'SIREN_ON' | 'SIREN_OFF' | 'REBOOT';
export type CommandStatus = 'PENDING' | 'EXECUTED' | 'REJECTED' | 'TIMEOUT';

export interface DeviceCommand {
  cmdId: string;
  deviceId: string;
  type: CommandType;
  status: CommandStatus;
  payload: string | null;
  reasonIfFailed: string | null;
  issuedByEmail: string;
  issuedByName: string;
  issuedAt: string;
  ackAt: string | null;
  lateAckResult: string | null;
  lateAckReason: string | null;
  lateAckAt: string | null;
}

export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface DeviceAlert {
  alertId: string;
  sourceAlertId: string | null;
  deviceId: string;
  deviceName: string;
  reason: string;
  severity: AlertSeverity;
  status: AlertStatus;
  actionTaken: string | null;
  details: string | null;
  resolvedByEmail: string | null;
  createdAt: string;
  resolvedAt: string | null;
  deviceUptimeS: number | null;
  dataSource: DataSource;
}
