import axiosInstance from "../../utils/axios/request";

export type LevelCode =
  | "intern"
  | "fresher"
  | "junior"
  | "middle"
  | "senior"
  | "lead"
  | "manager"
  | "pm"
  | "student"
  | "lecturer";

export interface LevelInfo {
  code: LevelCode;
  label: string;
  multiplier: number;
}

export interface PositionInfo {
  code: string;
  label: string;
  defaultLevel: LevelCode;
}

export interface IndustryInfo {
  code: string;
  label: string;
  positions: PositionInfo[];
  availableLevels: LevelCode[];
  levels?: LevelInfo[];
}

export interface CatalogResponse {
  industries: IndustryInfo[];
  levels: LevelInfo[];
}

let cache: CatalogResponse | null = null;
let pending: Promise<CatalogResponse> | null = null;

export const getCatalog = async (): Promise<CatalogResponse> => {
  if (cache) return cache;
  if (pending) return pending;
  pending = axiosInstance
    .get<CatalogResponse>("/catalog/industries")
    .then((r) => {
      cache = r.data;
      pending = null;
      return r.data;
    })
    .catch((err) => {
      pending = null;
      throw err;
    });
  return pending;
};

export const getIndustryInfo = (
  catalog: CatalogResponse,
  code: string | undefined | null,
): IndustryInfo | null =>
  catalog.industries.find((i) => i.code === code) || null;

export const getPositionInfo = (
  catalog: CatalogResponse,
  industryCode: string | undefined | null,
  positionCode: string | undefined | null,
): PositionInfo | null => {
  const ind = getIndustryInfo(catalog, industryCode);
  if (!ind || !positionCode) return null;
  return ind.positions.find((p) => p.code === positionCode) || null;
};

export const getLevelInfo = (
  catalog: CatalogResponse,
  levelCode: string | undefined | null,
): LevelInfo | null => {
  if (!levelCode) return null;
  return catalog.levels.find((l) => l.code === levelCode) || null;
};
