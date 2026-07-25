import * as XLSX from 'xlsx';

const WORKSHOP_LABELS = {
  '1': 'Cube Sat Workshop',
  '2': 'Launch Vehicle Workshop',
  '3': 'Agentic AI Workshop',
  '4': 'Python ML Workshop',
  '5': 'Space Merch',
  c1: 'Space Combo',
  c2: 'AI Combo',
  c3: 'Mega Combo',
  c4: 'Ultimate Combo',
};

function workshopLabels(ids) {
  if (!ids?.length) return '';
  return ids.map((id) => WORKSHOP_LABELS[id] || id).join('; ');
}

/**
 * Flatten a registration row into one Excel row (all useful columns).
 * @param {object} row - normalized admin row
 */
export function registrationToExcelRow(row) {
  const d = row.details && typeof row.details === 'object' ? row.details : {};
  const ids = row.workshopIds || [];

  return {
    email: row.email || '',
    name: d.name || row.name || '',
    phone: d.phone || row.phone || '',
    status: row.status || '',
    payment_status: row.payment_status || '',
    amount: row.amount ?? '',
    payment_id: row.payment_id || '',
    order_id: row.order_id || '',
    updated_at: row.updated_at || '',
    workshop_ids: ids.join(', '),
    workshops: workshopLabels(ids),
    class: d.class || '',
    school_college: d.college || '',
    city: d.city || '',
    school_id: d.schoolId || '',
    merch_size: d.merch_size || '',
    merch_house_number: d.merch_house_number || '',
    merch_lane_name: d.merch_lane_name || '',
    merch_landmark: d.merch_landmark || '',
    merch_city: d.merch_city || '',
    merch_pincode: d.merch_pincode || '',
    merch_address: d.merch_address || '',
    tiqr_booking_uid: d.tiqr_booking_uid || '',
    tiqr_booking_id: d.tiqr_booking_id || '',
    tiqr_participant_identification_id:
      d.tiqr_participant_identification_id || '',
    details_json: JSON.stringify(d),
  };
}

/**
 * @param {object[]} rows - normalized rows
 * @param {{ paidOnly?: boolean }} options
 */
export function downloadRegistrationsExcel(rows, options = {}) {
  const { paidOnly = true } = options;

  let data = rows;
  if (paidOnly) {
    data = rows.filter(
      (r) =>
        String(r.status).toLowerCase() === 'confirmed' &&
        String(r.payment_status).toLowerCase() === 'paid'
    );
  }

  const sheetRows = data.map(registrationToExcelRow);
  const worksheet = XLSX.utils.json_to_sheet(sheetRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `conscientia-registrations-${date}.xlsx`);
}
