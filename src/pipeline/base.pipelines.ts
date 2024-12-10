import { cleanNumberString } from "../utils/number-helper.ts";

export const createBasePipeline = (startDate: Date, endDate: Date) => {
  return [
    {
      $match: {
        claim_date: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $addFields: {
        cleaned_total: {
          $function: {
            body: cleanNumberString.toString(),
            args: ["$total"],
            lang: "js",
          },
        },
      },
    },
    {
      $unwind: {
        path: "$diag_nosis",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: {
          hcode: "$hcode",
          hname: "$hname",
        },
        transactions: {
          $push: {
            cid: "$cid",
            transaction_uid: "$transaction_uid",
            claim_date: "$claim_date",
            total: "$cleaned_total",
            diagnosis: "$diag_nosis",
            dob: "$pat.dob",
            procedure: "$procedure",
          },
        },
      },
    },
  ];
};
