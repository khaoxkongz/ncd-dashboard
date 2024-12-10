export interface Procedure {
  doctor_license: string;
  oper: string;
}

export interface Diagnosis {
  diag: string;
  doctor_license: string;
  dx_type: string | undefined;
}

export interface Transaction {
  cid: string;
  transaction_uid: string;
  claim_date: Date;
  total: number;
  diagnosis: Diagnosis;
  dob: Date;
  procedure: Procedure[] | undefined;
}

export interface HospitalData {
  _id: { hcode: string; hname: string };
  transactions: Transaction[];
}

export interface HospitalMonthlyData extends HospitalData {
  hcode: string;
  hname: string;
  year: number;
  month: number;
}
