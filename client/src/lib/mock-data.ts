import { Laptop, Smartphone, Monitor, Mouse } from 'lucide-react';
import type { InventoryTask, Asset, Employee, Subscription, GWS } from '@/lib/types';

export const inventoryTasks: InventoryTask[] = [
  { id: 'q3-2024-eng', name: 'Q3 2024 Engineering Asset Audit' },
  { id: 'q3-2024-design', name: 'Q3 2024 Design Team Audit' },
  { id: 'ad-hoc-2024-08', name: 'Ad-hoc August 2024 Laptop Refresh' },
];

export const userAssets: Asset[] = [
  {
    id: 'asset-001',
    name: 'MacBook Pro 16"',
    type: 'Laptop',
    serialNumber: 'C02Z123ABCDE',
    assignedTo: 'user@example.com',
    icon: Laptop,
  },
  {
    id: 'asset-002',
    name: 'iPhone 15 Pro',
    type: 'Smartphone',
    serialNumber: 'F17Z123FGHIJ',
    assignedTo: 'user@example.com',
    icon: Smartphone,
  },
  {
    id: 'asset-003',
    name: 'Dell UltraSharp 27"',
    type: 'Monitor',
    serialNumber: 'U2721DE-KLMNO',
    assignedTo: 'user@example.com',
    icon: Monitor,
  },
  {
    id: 'asset-004',
    name: 'Logitech MX Master 3S',
    type: 'Other',
    serialNumber: 'N/A',
    assignedTo: 'user@example.com',
    icon: Mouse,
  },
];

export const employees: Employee[] = [
  { id: '1', name: 'Taro Tanaka', email: 'taro.tanaka@example.com', department: 'Sales' },
  { id: '2', name: 'Ichiro Suzuki', email: 'ichiro.suzuki@example.com', department: 'Development' },
  { id: '3', name: 'Hanako Sato', email: 'hanako.sato@example.com', department: 'Marketing' },
  { id: '4', name: 'Jiro Takahashi', email: 'jiro.takahashi@example.com', department: 'Development' },
  { id: '5', name: 'Saburo Ito', email: 'saburo.ito@example.com', department: 'Human Resources' },
  { id: '6', name: 'Kumiko Watanabe', email: 'kumiko.watanabe@example.com', department: 'Sales' },
  { id: '7', name: 'Shiro Yamamoto', email: 'shiro.yamamoto@example.com', department: 'Development' },
  { id: '8', name: 'Misaki Nakamura', email: 'misaki.nakamura@example.com', department: 'Marketing' },
  { id: '9', name: 'Goro Kobayashi', email: 'goro.kobayashi@example.com', department: 'General Affairs' },
  { id: '10', name: 'Rokuro Kato', email: 'rokuro.kato@example.com', department: 'Development' },
];

export const subscriptions: Subscription[] = [
  {
    id: 'sub-1',
    name: 'Salesforce',
    status: 'active',
    licenseType: 'subscription',
    pricingType: 'per-license',
    vendor: 'Salesforce, Inc.',
    category: 'CRM',
    paymentMethod: 'Invoice',
    website: 'https://www.salesforce.com/',
    supportPage: 'https://www.salesforce.com/support/contact-us/',
    notes: 'Main CRM for the sales department.',
    accounts: [
      { accountId: 'SF-001', assignedUser: '1', startDate: '2023-01-15', renewalDate: '2025-01-15', amount: 120, currency: 'USD', billingCycle: { unit: 'month', period: 1 }, licenseKey: 'SF-LIC-A1B2-C3D4-E5F6' },
      { accountId: 'SF-002', assignedUser: '6', startDate: '2023-02-01', renewalDate: '2025-02-01', amount: 160, currency: 'USD', billingCycle: { unit: 'month', period: 1 }, licenseKey: 'SF-LIC-A1B2-C3D4-E5F7' },
      { accountId: 'SF-003', startDate: '2023-01-15', renewalDate: '2025-01-15', amount: 120, currency: 'USD', billingCycle: { unit: 'month', period: 1 }, licenseKey: 'SF-LIC-A1B2-C3D4-E5F8' },
      { accountId: 'SF-004', startDate: '2024-03-01', renewalDate: '2026-03-01', amount: 1440, currency: 'USD', billingCycle: { unit: 'year', period: 1 } },
      { accountId: 'SF-005', startDate: '2024-03-01', renewalDate: '2026-03-01', amount: 1440, currency: 'USD', billingCycle: { unit: 'year', period: 1 }, licenseKey: 'SF-LIC-A1B2-C3D4-E5F9' },
    ]
  },
  {
    id: 'sub-2',
    name: 'Google Workspace',
    status: 'active',
    licenseType: 'subscription',
    pricingType: 'per-license',
    vendor: 'Google LLC',
    category: 'Groupware',
    paymentMethod: 'Credit Card',
    notes: 'Company-wide communication tool. 15 licenses purchased under an annual contract.',
    accounts: [
      ...employees.map((e, index) => ({
        accountId: `GW-${String(index + 1).padStart(3, '0')}`,
        assignedUser: e.id,
        startDate: '2023-04-01',
        renewalDate: '2025-04-01',
        amount: 12,
        currency: 'USD' as const,
        billingCycle: { unit: 'month', period: 1 } as const,
        licenseKey: `GW-LIC-${String(index + 1).padStart(3, '0')}`
      })),
      ...Array.from({ length: 5 }, (_, index) => ({
        accountId: `GW-${String(employees.length + index + 1).padStart(3, '0')}`,
        startDate: '2023-04-01',
        renewalDate: '2025-04-01',
        amount: 144,
        currency: 'USD' as const,
        billingCycle: { unit: 'year', period: 1 } as const,
        licenseKey: `GW-LIC-${String(employees.length + index + 1).padStart(3, '0')}`
      }))
    ]
  },
  {
    id: 'sub-3',
    name: 'Adobe Creative Cloud',
    status: 'active',
    licenseType: 'subscription',
    pricingType: 'per-license',
    vendor: 'Adobe Inc.',
    category: 'Design',
    paymentMethod: 'Invoice',
    website: 'https://www.adobe.com/creativecloud.html',
    notes: 'For design production in the marketing department.',
    accounts: [
      { accountId: 'AD-001', assignedUser: '3', startDate: '2023-03-20', renewalDate: '2025-03-20', amount: 60, currency: 'USD', billingCycle: { unit: 'month', period: 1 }, licenseKey: 'AD-LIC-X1Y2-Z3A4-B5C6' },
      { accountId: 'AD-002', assignedUser: '8', startDate: '2023-04-01', renewalDate: '2025-04-01', amount: 720, currency: 'USD', billingCycle: { unit: 'year', period: 1 }, licenseKey: 'AD-LIC-X1Y2-Z3A4-B5C7' },
    ]
  },
  {
    id: 'sub-4',
    name: 'Microsoft 365',
    status: 'active',
    licenseType: 'subscription',
    pricingType: 'per-seat',
    perUserPricing: { monthly: 12.50, currency: 'USD' },
    vendor: 'Microsoft Corporation',
    category: 'Office Suite',
    paymentMethod: 'Credit Card',
    website: 'https://www.microsoft.com/en-us/microsoft-365',
    accounts: [],
    assignedUsers: employees.map(e => ({ employeeId: e.id, assignedDate: '2023-05-10' }))
  },
  {
    id: 'sub-5',
    name: 'Slack',
    status: 'active',
    licenseType: 'subscription',
    pricingType: 'per-seat',
    perUserPricing: { yearly: 87, currency: 'USD' },
    vendor: 'Salesforce, Inc.',
    category: 'Communication',
    paymentMethod: 'Credit Card',
    website: 'https://slack.com/',
    accounts: [],
    assignedUsers: employees.map(e => ({ employeeId: e.id, assignedDate: '2023-06-01' }))
  },
  {
    id: 'sub-6',
    name: 'Zoom',
    status: 'inactive',
    licenseType: 'subscription',
    pricingType: 'per-license',
    vendor: 'Zoom Video Communications',
    category: 'Web Conferencing',
    paymentMethod: 'Credit Card',
    accounts: [
      { accountId: 'ZM-001', startDate: '2023-07-01', renewalDate: '2024-07-01', amount: 20, currency: 'USD', billingCycle: { unit: 'month', period: 1 } }
    ]
  },
  {
    id: 'sub-7',
    name: 'Figma',
    status: 'active',
    licenseType: 'subscription',
    pricingType: 'per-license',
    vendor: 'Figma, Inc.',
    category: 'Design',
    paymentMethod: 'Credit Card',
    website: 'https://www.figma.com/',
    notes: 'UI/UX design tool for the development department.',
    accounts: [
      { accountId: 'FG-001', assignedUser: '2', startDate: '2023-09-15', renewalDate: '2024-09-15', amount: 15, currency: 'USD', billingCycle: { unit: 'month', period: 1 }, licenseKey: 'FG-LIC-P1Q2-R3S4-T5U6' },
      { accountId: 'FG-002', assignedUser: '4', startDate: '2023-09-15', renewalDate: '2024-09-15', amount: 15, currency: 'USD', billingCycle: { unit: 'month', period: 1 }, licenseKey: 'FG-LIC-P1Q2-R3S4-T5U7' },
      { accountId: 'FG-003', assignedUser: '7', startDate: '2023-10-01', renewalDate: '2024-10-01', amount: 180, currency: 'USD', billingCycle: { unit: 'year', period: 1 }, licenseKey: 'FG-LIC-P1Q2-R3S4-T5U8' },
      { accountId: 'FG-004', startDate: '2023-09-15', renewalDate: '2024-09-15', amount: 15, currency: 'USD', billingCycle: { unit: 'month', period: 1 }, licenseKey: 'FG-LIC-P1Q2-R3S4-T5U9' },
    ]
  },
  {
    id: 'sub-8',
    name: 'HubSpot',
    status: 'active',
    licenseType: 'subscription',
    pricingType: 'per-seat',
    perUserPricing: { monthly: 50, currency: 'USD' },
    vendor: 'HubSpot, Inc.',
    category: 'Marketing',
    paymentMethod: 'Invoice',
    accounts: [],
    assignedUsers: [
      { employeeId: '3', assignedDate: '2023-10-01' },
      { employeeId: '8', assignedDate: '2023-10-01' },
    ]
  },
  {
    id: 'sub-9',
    name: 'Zendesk',
    status: 'inactive',
    licenseType: 'subscription',
    pricingType: 'per-license',
    vendor: 'Zendesk, Inc.',
    category: 'Customer Support',
    paymentMethod: 'Credit Card',
    accounts: []
  },
  {
    id: 'sub-10',
    name: 'GitHub',
    status: 'active',
    licenseType: 'subscription',
    pricingType: 'per-seat',
    perUserPricing: { monthly: 4, currency: 'USD' },
    vendor: 'GitHub, Inc.',
    category: 'Development Tool',
    paymentMethod: 'Credit Card',
    website: 'https://github.com/',
    notes: 'For managing development source code.',
    accounts: [],
    assignedUsers: [
      ...['2', '4', '7', '10'].map((userId) => ({ employeeId: userId, assignedDate: '2023-11-01' })),
      { employeeId: '5', assignedDate: '2023-11-01' }
    ]
  },
  {
    id: 'soft-1',
    name: 'Final Cut Pro',
    status: 'active',
    licenseType: 'perpetual',
    pricingType: 'per-license',
    vendor: 'Apple Inc.',
    category: 'Video Editing',
    paymentMethod: 'App Store',
    website: 'https://www.apple.com/final-cut-pro/',
    notes: 'For video production in the marketing department. Managed by linking to PCs.',
    accounts: [
      { accountId: 'FCP-001', assignedDevice: 'MKTG-PC-01', version: '10.7.1', startDate: '2023-12-01', amount: 299, currency: 'USD', licenseKey: 'FCP-KEY-1111-2222-3333-4444' },
      { accountId: 'FCP-002', assignedDevice: 'MKTG-PC-05', version: '10.7.1', startDate: '2023-12-01', amount: 299, currency: 'USD', licenseKey: 'FCP-KEY-1111-2222-3333-5555' },
    ]
  }
];

export const gwsAccounts: GWS[] = [
  { id: 'gws-1', domain: 'primary-domain.com', adminEmail: 'admin@primary-domain.com', plan: 'Business Standard', notes: 'Main production environment for all employees.' },
  { id: 'gws-2', domain: 'secondary-group.co.jp', adminEmail: 'admin@secondary-group.co.jp', plan: 'Business Starter', notes: 'For subsidiary company employees.' },
  { id: 'gws-3', domain: 'dev-sandbox.net', adminEmail: 'dev-admin@dev-sandbox.net', plan: 'Enterprise Plus', notes: 'Development and testing sandbox with all features enabled.' },
];
