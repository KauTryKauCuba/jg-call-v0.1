export interface ColumnIndices {
  dataBy: number
  dummyEmail: number
  companyName: number
  jobTitle: number
  jobDescription: number
  location: number
  fullPartTime: number
  salaryRange: number
  contactNo: number
  ingested: number
  called: number
  calledBy: number
  callAnswered: number
  accepted: number
  acceptOnboard: number
  companyEmail: number
  reasonReject: number
  jobLink: number
}

export function getCombinedHeader(rows: string[][]): string[] {
  if (!rows || rows.length === 0) return []
  const r0 = rows[0] || []
  const r1 = rows[1] || []
  const len = Math.max(r0.length, r1.length)
  const combined = []
  for (let i = 0; i < len; i++) {
    const val0 = (r0[i] || "").trim()
    const val1 = (r1[i] || "").trim()
    combined.push(val1 || val0)
  }
  return combined
}

export function getColumnIndices(_headerRow: string[]): ColumnIndices {
  void _headerRow;
  return {
    dataBy: 0,
    dummyEmail: 2,
    companyName: 3,
    jobTitle: 4,
    jobDescription: 5,
    location: 6,
    fullPartTime: 7,
    salaryRange: 8,
    contactNo: 9,
    ingested: 10,
    called: 11,
    calledBy: 12,
    callAnswered: 13,
    accepted: 14,
    acceptOnboard: 14,
    companyEmail: 15,
    reasonReject: 16,
    jobLink: 18
  }
}

export function getColumnLetter(colIndex: number): string {
  let temp = colIndex
  let letter = ""
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter
    temp = Math.floor(temp / 26) - 1
  }
  return letter
}

