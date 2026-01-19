import {
  AlertTriangle,
  Calendar,
  Car,
  CarFront,
  CalendarClock,
  ClipboardList,
  FilePlus,
  FileImage,
  LayoutDashboard,
  Lock,
  MapPin,
  ReceiptText,
  ShieldUser,
  UserCog,
  UserRound,
} from 'lucide-react';

export const resourceIcons = {
  createRental: Car,
  dashboard: LayoutDashboard,
  calendar: Calendar,
  rentals: ClipboardList,
  createInvoice: FilePlus,
  invoices: ReceiptText,
  clients: UserRound,
  carModels: CarFront,
  security: Lock,
  adminUsers: ShieldUser,
  adminEmployees: UserCog,
  cars: CarFront,
  longTermRentals: CalendarClock,
  gpsLiveMap: MapPin,
  gpsAlerts: AlertTriangle,
  pdfTemplates: FileImage,
};

export type ResourceIconKey = keyof typeof resourceIcons;

export function getResourceIcon(key: ResourceIconKey) {
  return resourceIcons[key];
}
