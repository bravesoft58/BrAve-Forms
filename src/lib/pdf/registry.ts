import React from "react";
import type { FormType } from "@/lib/constants/permits";
import { DustLogPdf } from "./dust-log";
import { NdepStormwaterPdf } from "./ndep-stormwater";
import { NdotStormwaterPdf } from "./ndot-stormwater";
import { NdepSadPdf } from "./ndep-sad";
import { NnphDustPermitPdf } from "./nnph-dust-permit";

interface PdfContext {
  data: Record<string, unknown>;
  projectName: string;
  permitNumber?: string;
  companyName?: string;
  formDate: string;
}

type PdfComponent = (ctx: PdfContext) => React.ReactElement;

const registry: Record<FormType, PdfComponent> = {
  daily_dust_log: (ctx) =>
    React.createElement(DustLogPdf, {
      data: ctx.data as Parameters<typeof DustLogPdf>[0]["data"],
      projectName: ctx.projectName,
      permitNumber: ctx.permitNumber,
      companyName: ctx.companyName,
    }),

  ndep_weekly_stormwater: (ctx) =>
    React.createElement(NdepStormwaterPdf, {
      data: ctx.data as Parameters<typeof NdepStormwaterPdf>[0]["data"],
      projectName: ctx.projectName,
      permitNumber: ctx.permitNumber,
      formDate: ctx.formDate,
    }),

  ndot_weekly_stormwater: (ctx) =>
    React.createElement(NdotStormwaterPdf, {
      data: ctx.data as Parameters<typeof NdotStormwaterPdf>[0]["data"],
      projectName: ctx.projectName,
      permitNumber: ctx.permitNumber,
      formDate: ctx.formDate,
    }),

  ndep_sad_application: (ctx) =>
    React.createElement(NdepSadPdf, {
      data: ctx.data as Parameters<typeof NdepSadPdf>[0]["data"],
      projectName: ctx.projectName,
      formDate: ctx.formDate,
    }),

  nnph_dust_permit: (ctx) =>
    React.createElement(NnphDustPermitPdf, {
      data: ctx.data as Parameters<typeof NnphDustPermitPdf>[0]["data"],
      projectName: ctx.projectName,
      formDate: ctx.formDate,
    }),
};

export function getPdfComponent(formType: FormType): PdfComponent | null {
  return registry[formType] ?? null;
}

/** Generate a descriptive filename */
export function getPdfFilename(formType: FormType, projectName: string, formDate: string): string {
  const typeMap: Record<FormType, string> = {
    daily_dust_log: "DustLog",
    ndep_weekly_stormwater: "NDEP-Stormwater",
    ndot_weekly_stormwater: "NDOT-Stormwater",
    ndep_sad_application: "NDEP-SAD",
    nnph_dust_permit: "NNPH-DustPermit",
  };
  const safeName = projectName.replace(/[^a-zA-Z0-9]+/g, "-").replace(/-+$/, "");
  return `${typeMap[formType]}_${safeName}_${formDate}.pdf`;
}
