import {
  ACS_CODES,
  CKD_CODES,
  DIABETES_CODES,
  DIABETES_DKA_CODES,
  DIABETES_DN_CODES,
  DIABETES_MAIN_CODES,
  HYPERTENSION_CODES,
  NEPHROPATHY_CODES,
  STROKE_CODES,
} from "../utils/constants.ts";
import { HospitalData } from "../utils/types.ts";

// Service metric calculations

export function calculateDiabetesServiceMetrics(
  transactions: HospitalData["transactions"],
) {
  const diabetesTransactions = transactions.filter((t) =>
    t.diagnosis?.dx_type === "1" &&
    DIABETES_CODES.some((code) => t.diagnosis.diag.startsWith(code))
  );

  const uniquePatients = new Set(diabetesTransactions.map((t) => t.cid));
  const uniqueVisits = new Set(
    diabetesTransactions.map((t) => t.transaction_uid),
  );

  // Calculate distribution based on conditions doc
  const dkaPatients = new Set(
    diabetesTransactions
      .filter((t) => DIABETES_DKA_CODES.includes(t.diagnosis.diag))
      .map((t) => t.cid),
  );

  const dnPatients = new Set(
    diabetesTransactions
      .filter((t) => {
        const hasMainCode = t.diagnosis.diag &&
          t.diagnosis?.dx_type === "1" &&
          DIABETES_MAIN_CODES.includes(t.diagnosis.diag);

        const hasSecondaryN18 = t.diagnosis.diag &&
          t.diagnosis?.dx_type !== "1" &&
          NEPHROPATHY_CODES.includes(t.diagnosis.diag);

        const hasDNCode = t.diagnosis.diag &&
          t.diagnosis?.dx_type === "1" &&
          DIABETES_DN_CODES.includes(t.diagnosis.diag);

        return (hasMainCode && hasSecondaryN18) || hasDNCode;
      })
      .map((t) => t.cid),
  );

  const acsPatients = new Set(
    diabetesTransactions
      .filter((t) => {
        const hasMainCode = t.diagnosis.diag &&
          t.diagnosis?.dx_type === "1" &&
          DIABETES_MAIN_CODES.includes(t.diagnosis.diag);

        const hasSecondaryACS = t.diagnosis.diag &&
          t.diagnosis?.dx_type !== "1" &&
          ACS_CODES.some((code) => t.diagnosis.diag.startsWith(code));

        return hasMainCode && hasSecondaryACS;
      })
      .map((t) => t.cid),
  );

  const strokePatients = new Set(
    diabetesTransactions
      .filter((t) => {
        const hasMainCode = t.diagnosis.diag &&
          t.diagnosis?.dx_type === "1" &&
          DIABETES_MAIN_CODES.includes(t.diagnosis.diag);

        const hasSecondaryStroke = t.diagnosis.diag &&
          t.diagnosis?.dx_type !== "1" &&
          STROKE_CODES.some((code) => t.diagnosis.diag.startsWith(code));

        return hasMainCode && hasSecondaryStroke;
      })
      .map((t) => t.cid),
  );

  // Other diabetes patients (those not in any specific category)
  const categorizedPatients = new Set([
    ...dkaPatients,
    ...dnPatients,
    ...acsPatients,
    ...strokePatients,
  ]);

  const otherPatients = new Set(
    [...uniquePatients].filter((cid) => !categorizedPatients.has(cid)),
  );

  return {
    total_patients: uniquePatients.size,
    total_visits: uniqueVisits.size,
    avg_visits_per_patient: uniquePatients.size
      ? uniqueVisits.size / uniquePatients.size
      : 0,
    distribution: {
      dm_with_dka: dkaPatients.size,
      dm_with_dn: dnPatients.size,
      dm_with_acs: acsPatients.size,
      dm_with_stroke: strokePatients.size,
      other_dm: otherPatients.size,
    },
  };
}

export function calculateHypertensionServiceMetrics(
  transactions: HospitalData["transactions"],
) {
  const htTransactions = transactions.filter((t) =>
    t.diagnosis?.dx_type === "1" &&
    HYPERTENSION_CODES.some((code) => t.diagnosis.diag.startsWith(code))
  );

  const uniquePatients = new Set(htTransactions.map((t) => t.cid));
  const uniqueVisits = new Set(htTransactions.map((t) => t.transaction_uid));

  // Age-based categorization
  const under65Patients = new Set(
    htTransactions.filter((t) => {
      const birthDate = new Date(t.dob);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      return age < 65;
    }).map((t) => t.cid),
  );

  const over65Patients = new Set(
    htTransactions.filter((t) => {
      const birthDate = new Date(t.dob);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      return age >= 65;
    }).map((t) => t.cid),
  );

  const otherPatients = new Set(
    [...uniquePatients].filter((cid) =>
      !under65Patients.has(cid) && !over65Patients.has(cid)
    ),
  );

  return {
    total_patients: uniquePatients.size,
    total_visits: uniqueVisits.size,
    avg_visits_per_patient: uniquePatients.size
      ? uniqueVisits.size / uniquePatients.size
      : 0,
    distribution: {
      well_controlled_under_65: under65Patients.size,
      well_controlled_65_and_above: over65Patients.size,
      other_ht: otherPatients.size,
    },
  };
}

export function calculateCKDServiceMetrics(
  transactions: HospitalData["transactions"],
) {
  const ckdTransactions = transactions.filter((t) =>
    t.diagnosis?.dx_type === "1" &&
    CKD_CODES.some((code) => t.diagnosis.diag.startsWith(code))
  );

  const uniquePatients = new Set(ckdTransactions.map((t) => t.cid));
  const uniqueVisits = new Set(ckdTransactions.map((t) => t.transaction_uid));

  // Stage-specific categorization
  const stage3Patients = new Set(
    ckdTransactions
      .filter((t) => t.diagnosis.diag === "N183")
      .map((t) => t.cid),
  );

  const stage4Patients = new Set(
    ckdTransactions
      .filter((t) => t.diagnosis.diag === "N184")
      .map((t) => t.cid),
  );

  const stage5Patients = new Set(
    ckdTransactions
      .filter((t) => t.diagnosis.diag === "N185")
      .map((t) => t.cid),
  );

  const stage5NonDialysisPatients = new Set(
    ckdTransactions
      .filter((t) => {
        const hasN185 = t.diagnosis.diag === "N185" &&
          t.diagnosis?.dx_type === "1";

        const hasNoDialysisCodes = !["Z491", "Z492"].includes(
          t.diagnosis.diag,
        );

        const hasNoDialysisProcedures = !t.procedure
          ?.some((p) => ["3995", "Z5489"].includes(p.oper));

        return hasN185 && hasNoDialysisCodes && hasNoDialysisProcedures;
      })
      .map((t) => t.cid),
  );

  const stage5DialysisPatients = new Set(
    ckdTransactions
      .filter((t) => {
        const hasN185 = t.diagnosis?.dx_type === "1" &&
          t.diagnosis.diag === "N185";

        const hasDialysisCodes = ["Z491", "Z492"].includes(t.diagnosis.diag);

        const hasDialysisProcedures = t.procedure?.some((p) =>
          ["3995", "Z5490"].includes(p.oper)
        );

        return hasN185 && (hasDialysisCodes || hasDialysisProcedures);
      })
      .map((t) => t.cid),
  );

  return {
    total_patients: uniquePatients.size,
    total_visits: uniqueVisits.size,
    avg_visits_per_patient: uniquePatients.size
      ? uniqueVisits.size / uniquePatients.size
      : 0,
    distribution: {
      stage_3: stage3Patients.size,
      stage_4: stage4Patients.size,
      stage_5: stage5Patients.size,
      stage_5_non_dialysis: stage5NonDialysisPatients.size,
      stage_5_dialysis: stage5DialysisPatients.size,
    },
  };
}

// Cost metric calculations

export function calculateDiabetesCostMetrics(
  transactions: HospitalData["transactions"],
) {
  const diabetesTransactions = transactions.filter((t) =>
    t.diagnosis?.dx_type === "1" &&
    DIABETES_CODES.some((code) => t.diagnosis.diag.startsWith(code))
  );

  const totalCost = diabetesTransactions.reduce((sum, t) => sum + t.total, 0);

  const calculateDiabetesCostDistribution = (
    transactions: HospitalData["transactions"],
  ) => {
    // DKA costs
    const dkaCosts = transactions
      .filter((t) => DIABETES_DKA_CODES.includes(t.diagnosis.diag))
      .reduce((sum, t) => sum + t.total, 0);

    // DN costs
    const dnCosts = transactions
      .filter((t) => {
        const hasMainCode = t.diagnosis?.dx_type === "1" &&
          DIABETES_MAIN_CODES.includes(t.diagnosis.diag);

        const hasSecondaryN18 = t.diagnosis?.dx_type !== "1" &&
          NEPHROPATHY_CODES.includes(t.diagnosis.diag);

        const hasDNCode = t.diagnosis?.dx_type === "1" &&
          DIABETES_DN_CODES.includes(t.diagnosis.diag);

        return (hasMainCode && hasSecondaryN18) || hasDNCode;
      })
      .reduce((sum, t) => sum + t.total, 0);

    // ACS costs
    const acsCosts = transactions
      .filter((t) => {
        const hasMainCode = t.diagnosis?.dx_type === "1" &&
          DIABETES_MAIN_CODES.includes(t.diagnosis.diag);
        const hasSecondaryACS = t.diagnosis?.dx_type !== "1" &&
          ACS_CODES.some((code) => t.diagnosis.diag.startsWith(code));
        return hasMainCode && hasSecondaryACS;
      })
      .reduce((sum, t) => sum + t.total, 0);

    // Stroke costs
    const strokeCosts = transactions
      .filter((t) => {
        const hasMainCode = t.diagnosis?.dx_type === "1" &&
          DIABETES_MAIN_CODES.includes(t.diagnosis.diag);
        const hasSecondaryStroke = t.diagnosis?.dx_type !== "1" &&
          STROKE_CODES.some((code) => t.diagnosis.diag.startsWith(code));
        return hasMainCode && hasSecondaryStroke;
      })
      .reduce((sum, t) => sum + t.total, 0);

    // Calculate other diabetes costs (total - sum of specific conditions)
    const totalCost = transactions.reduce((sum, t) => sum + t.total, 0);
    const otherCosts = totalCost -
      (dkaCosts + dnCosts + acsCosts + strokeCosts);

    return {
      dm_with_dka: dkaCosts,
      dm_with_dn: dnCosts,
      dm_with_acs: acsCosts,
      dm_with_stroke: strokeCosts,
      other_dm: otherCosts,
    };
  };

  return {
    total_cost: totalCost,
    avg_cost_per_visit: diabetesTransactions.length
      ? totalCost / diabetesTransactions.length
      : 0,
    distribution: calculateDiabetesCostDistribution(diabetesTransactions),
  };
}

export function calculateHypertensionCostMetrics(
  transactions: HospitalData["transactions"],
) {
  const htTransactions = transactions.filter((t) =>
    t.diagnosis?.dx_type === "1" &&
    HYPERTENSION_CODES.some((code) => t.diagnosis.diag.startsWith(code))
  );

  const totalCost = htTransactions.reduce((sum, t) => sum + t.total, 0);

  const calculateHypertensionCostDistribution = (
    transactions: HospitalData["transactions"],
  ) => {
    // Under 65 costs
    const under65Costs = transactions
      .filter((t) => {
        const birthDate = new Date(t.dob);
        const age = new Date().getFullYear() - birthDate.getFullYear();
        return age < 65;
      })
      .reduce((sum, t) => sum + t.total, 0);

    // 65 and above costs
    const over65Costs = transactions
      .filter((t) => {
        const birthDate = new Date(t.dob);
        const age = new Date().getFullYear() - birthDate.getFullYear();
        return age >= 65;
      })
      .reduce((sum, t) => sum + t.total, 0);

    // Calculate other HT costs
    const totalCost = transactions.reduce((sum, t) => sum + t.total, 0);
    const otherCosts = totalCost - (under65Costs + over65Costs);

    return {
      well_controlled_under_65: under65Costs,
      well_controlled_65_and_above: over65Costs,
      other_ht: otherCosts,
    };
  };

  return {
    total_cost: totalCost,
    avg_cost_per_visit: htTransactions.length
      ? totalCost / htTransactions.length
      : 0,
    distribution: calculateHypertensionCostDistribution(htTransactions),
  };
}

export function calculateCKDCostMetrics(
  transactions: HospitalData["transactions"],
) {
  const ckdTransactions = transactions.filter((t) =>
    t.diagnosis?.dx_type === "1" &&
    CKD_CODES.some((code) => t.diagnosis.diag.startsWith(code))
  );

  const totalCost = ckdTransactions.reduce((sum, t) => sum + t.total, 0);

  const calculateCKDCostDistribution = (
    transactions: HospitalData["transactions"],
  ) => {
    // Stage 3 costs
    const stage3Costs = transactions
      .filter((t) => t.diagnosis.diag === "N183")
      .reduce((sum, t) => sum + t.total, 0);

    // Stage 4 costs
    const stage4Costs = transactions
      .filter((t) => t.diagnosis.diag === "N184")
      .reduce((sum, t) => sum + t.total, 0);

    // Stage 5 costs
    const stage5Costs = transactions
      .filter((t) => t.diagnosis.diag === "N185")
      .reduce((sum, t) => sum + t.total, 0);

    // Stage 5 non-dialysis costs
    const stage5NonDialysisCosts = transactions
      .filter((t) => {
        const hasN185 = t.diagnosis?.dx_type === "1" &&
          t.diagnosis.diag === "N185";
        const hasNoDialysisCodes = !["Z491", "Z492"].includes(
          t.diagnosis.diag,
        );
        const hasNoDialysisProcedures = !t.procedure?.some((p) =>
          ["3995", "Z5489"].includes(p.oper)
        );
        return hasN185 && hasNoDialysisCodes && hasNoDialysisProcedures;
      })
      .reduce((sum, t) => sum + t.total, 0);

    // Stage 5 dialysis costs
    const stage5DialysisCosts = transactions
      .filter((t) => {
        const hasN185 = t.diagnosis?.dx_type === "1" &&
          t.diagnosis.diag === "N185";
        const hasDialysisCodes = ["Z491", "Z492"].includes(
          t.diagnosis.diag,
        );
        const hasDialysisProcedures = t.procedure?.some((p) =>
          ["3995", "Z5490"].includes(p.oper)
        );
        return hasN185 && (hasDialysisCodes || hasDialysisProcedures);
      })
      .reduce((sum, t) => sum + t.total, 0);

    return {
      stage_3: stage3Costs,
      stage_4: stage4Costs,
      stage_5: stage5Costs,
      stage_5_non_dialysis: stage5NonDialysisCosts,
      stage_5_dialysis: stage5DialysisCosts,
    };
  };

  return {
    total_cost: totalCost,
    avg_cost_per_visit: ckdTransactions.length
      ? totalCost / ckdTransactions.length
      : 0,
    distribution: calculateCKDCostDistribution(ckdTransactions),
  };
}
