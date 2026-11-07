export type Locale = 'en' | 'ne';
export type Overflow = 'constrain' | 'reject';
/** Months and days are 1-based; weekday is 0=Sunday through 6=Saturday. */
export interface CivilDate { readonly year: number; readonly month: number; readonly day: number; }
export interface FormatOptions { locale?: Locale; numerals?: 'latin' | 'ne'; }
export interface ParseOptions { locale?: Locale; }
export interface TimeFields { hour?: number; minute?: number; second?: number; millisecond?: number; }
export interface FiscalYear { readonly startYear: number; readonly endYear: number; readonly label: string; readonly quarter: number; }
export interface Tithi { readonly number: number; readonly day: number; readonly paksha: 'shukla' | 'krishna'; readonly name: string; }
export interface TithiRecord { start: string; end: string; number: number; source: string; }
export interface TithiInterval extends Tithi { readonly start: string; readonly end: string; readonly source: string; }
export interface Holiday { readonly id: string; readonly date: string; readonly name: string; readonly nameNe?: string; readonly scope: string; readonly source: string; }
export interface CalendarInfo { readonly version: string; readonly minYear: number; readonly maxYear: number; readonly anchorBS: string; readonly anchorAD: string; readonly lastAD: string; readonly totalDays: number; readonly source: string; readonly sourceRevision: string; readonly sourceSha256: string; readonly monthsSha256: string; readonly status: string; }
export interface HolidayCoverage { readonly version: string; readonly sourcePdf: string; readonly sourceSha256: string; readonly pendingObservances: readonly string[]; readonly years: readonly number[]; readonly complete: boolean; readonly description: string; readonly source: string; }
export const NEPAL_TIMEZONE: 'Asia/Kathmandu';
export class BSDate implements CivilDate {
  readonly year: number; readonly month: number; readonly day: number; readonly weekday: number;
  constructor(year: number, month: number, day: number);
  static parse(text: string, pattern?: string, options?: ParseOptions): BSDate;
  static fromAD(date: CivilDate): BSDate;
  static fromInstant(value: Date | string, timeZone?: string): BSDate;
  static today(timeZone?: string): BSDate;
  toAD(): CivilDate;
  /** Resolves wall time using IANA rules; throws for nonexistent or ambiguous times. */
  toInstant(time?: TimeFields, timeZone?: string): Date;
  toString(): string; toJSON(): string;
  format(pattern?: string, options?: FormatOptions): string;
  addDays(amount: number): BSDate;
  addMonths(amount: number, overflow?: Overflow): BSDate;
  addYears(amount: number, overflow?: Overflow): BSDate;
  differenceInDays(other: CivilDate): number;
  compare(other: CivilDate): number;
  fiscalYear(): FiscalYear;
}
export function bsToAD(date: CivilDate): CivilDate;
export function adToBS(date: CivilDate): BSDate;
export function fromInstant(value: Date | string, timeZone?: string): BSDate;
export function toInstant(date: CivilDate, time?: TimeFields, timeZone?: string): Date;
export function parseBS(text: string, pattern?: string, options?: ParseOptions): BSDate;
export function formatBS(date: CivilDate, pattern?: string, options?: FormatOptions): string;
export function daysInMonth(year: number, month: number): number;
export function isValidBS(value: unknown): value is CivilDate;
export function addDays(date: CivilDate, amount: number): BSDate;
export function addMonths(date: CivilDate, amount: number, overflow?: Overflow): BSDate;
export function addYears(date: CivilDate, amount: number, overflow?: Overflow): BSDate;
/** Signed left minus right in civil calendar days. */
export function differenceInDays(left: CivilDate, right: CivilDate): number;
export function compare(left: CivilDate, right: CivilDate): number;
export function startOfMonth(date: CivilDate): BSDate;
export function endOfMonth(date: CivilDate): BSDate;
export function startOfYear(date: CivilDate): BSDate;
export function endOfYear(date: CivilDate): BSDate;
export function fiscalYear(date: CivilDate): FiscalYear;
/** Throws if either complete boundary lies outside the supported calendar. */
export function fiscalYearBounds(startYear: number): Readonly<{start: BSDate; end: BSDate}>;
export function monthGrid(year: number, month: number, weekStartsOn?: number): (BSDate | null)[][];
export function eachDayOfInterval(start: CivilDate, end: CivilDate): BSDate[];
export function isWithinInterval(date: CivilDate, start: CivilDate, end: CivilDate): boolean;
export function isWeekend(date: CivilDate): boolean;
export function toLatinDigits(value: string | number): string;
export function toNepaliDigits(value: string | number): string;
export function tithi(number: number, locale?: Locale): Tithi;
/** Classifies supplied Sun/Moon ecliptic longitudes in degrees; does not compute an ephemeris. */
export function tithiFromLongitudes(sun: number, moon: number, locale?: Locale): Tithi;
export class TithiCalendar {
  constructor(records?: readonly TithiRecord[]);
  /** Intervals are start-inclusive, end-exclusive; null means missing data. */
  at(value: Date | string, locale?: Locale): TithiInterval | null;
}
export class HolidayCalendar {
  constructor(records?: readonly Holiday[]);
  forDate(date: CivilDate, scope?: string): Holiday[];
  forYear(year: number, scope?: string): Holiday[];
  /** false means no matching record; it does not certify a working day. */
  isHoliday(date: CivilDate, scope?: string): boolean;
}
export function calendarInfo(): CalendarInfo;
export function holidayCoverage(): HolidayCoverage;
