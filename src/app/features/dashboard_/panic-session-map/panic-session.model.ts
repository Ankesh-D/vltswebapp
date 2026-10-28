import moment from 'moment';

export interface PanicSession {
  sessionId: string;
  vehicleId?: string;
  vehicleNumber: string;
  chassisNumber: string;
  imeiNumber: string;
  vehicleClass: string;
  rto: string;
  ownerName: string;
  ownerPhone: string;
  lastEventTime: string;
  lastEventLocation: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
  vendorName?: string;
  modelName?: string;
  deviceSerialNo?: string;
  iccid?: string;
  primaryMsisdn?: string;
  primaryNetwork?: string;
  fallbackMsisdn?: string;
  fallbackNetwork?: string;
  deviceActivationDate?: string;
  deviceActivatedUpto?: string;
  dealerName?: string;
}
export interface HistoryPoint {
  latitude: number;
  longitude: number;
  time: Date;
  speed: number | null;
}
export interface HistoryRequest { param1: string; param2: string; param3: string; param4: string; }

export function apiField(row: any, index: number): unknown {
  return row?.['Param' + index] ?? row?.['param' + index];
}
export function numericValue(value: unknown): number | null {
  if (value == null || String(value).trim() === '') return null;
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
}
export function validCoordinates(latitude: number | null, longitude: number | null): boolean {
  return latitude !== null && longitude !== null && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 && (latitude !== 0 || longitude !== 0);
}
export function parsePanicTime(value: unknown): Date | null {
  const text = String(value ?? '').trim();
  if (!text) return null;
  // Unzoned API timestamps represent Indian local time; zoned ISO values keep their instant.
  if (/T.*(?:Z|[+-]\d{2}:?\d{2})$/i.test(text)) {
    const zoned = moment.parseZone(text, moment.ISO_8601, true);
    return zoned.isValid() ? zoned.toDate() : null;
  }
  const parsed = moment.utc(text, [
    'DD-MMM-YYYY hh:mm:ss A', 'DD-MMM-YYYY hh:mm A',
    'DD MMM YYYY, hh:mm A', 'DD MMM YYYY, hh:mm:ss A',
    'DD-MM-YYYY HH:mm:ss', 'DD-MM-YYYY hh:mm:ss A',
    'YYYY-MM-DD HH:mm:ss.SSS', 'YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD HH:mm',
    'YYYY-MM-DDTHH:mm:ss', 'YYYY-MM-DDTHH:mm:ss.SSS'
  ], true).utcOffset(330, true);
  return parsed.isValid() ? parsed.toDate() : null;
}
export function historyRequests(vehicleNumber: string, start: Date, end: Date): HistoryRequest[] {
  if (start > end) return [];
  const first = moment(start).utcOffset(330);
  const last = moment(end).utcOffset(330);
  const requests: HistoryRequest[] = [];
  for (let day = first.clone().startOf('day'); day.isSameOrBefore(last, 'day'); day.add(1, 'day')) {
    requests.push({
      param1: vehicleNumber, param2: day.format('DD-MMM-YYYY'),
      param3: day.isSame(first, 'day') ? first.format('hh:mm A') : '12:00 AM',
      param4: day.isSame(last, 'day') ? last.format('hh:mm A') : '11:59 PM'
    });
  }
  return requests;
}
export function historyPoints(rows: any[], start: Date, end: Date): HistoryPoint[] {
  const points: HistoryPoint[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const latitude = numericValue(apiField(row, 4) ?? row?.latitude);
    const longitude = numericValue(apiField(row, 5) ?? row?.longitude);
    const time = parsePanicTime(apiField(row, 3) ?? row?.pollingdate);
    if (!validCoordinates(latitude, longitude) || !time || time < start || time > end) continue;
    const key = `${time.getTime()}:${latitude}:${longitude}`;
    if (seen.has(key)) continue;
    seen.add(key);
    points.push({ latitude: latitude!, longitude: longitude!, time, speed: numericValue(apiField(row, 6) ?? row?.speed) });
  }
  return points.sort((a, b) => a.time.getTime() - b.time.getTime());
}
