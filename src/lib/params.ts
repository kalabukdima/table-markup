"use client"

export type UrlParams = {
  page: number | undefined;
  datasetHash: string | undefined;
}

export function tryParseInt(s: string): number | undefined {
  const result = Number(s)
  return isFinite(result) ? result : undefined;
}

const pageKey = "page";
const datasetKey = "d";

export function getParamsFromUrl(): UrlParams {
  const params = new URL(document.location.href).searchParams;
  let page = params.has(pageKey) ? tryParseInt(params.get(pageKey)!) ?? undefined : undefined;
  let datasetHash = params.get(datasetKey) ?? undefined;
  return { page, datasetHash };
}

export function saveParamsToUrl(params: UrlParams) {
  const parts = [
    ...(params.datasetHash ? [`${datasetKey}=${params.datasetHash}`] : []),
    ...(params.page ? [`${pageKey}=${params.page}`] : []),
  ];
  document.title = `Table Markup | ${params.datasetHash}`;
  if (history.state && !history.state.__NA && history.state.datasetHash != params.datasetHash) {
    history.pushState(params, "", `/?${parts.join("&")}`);
  } else {
    history.replaceState(params, "", `/?${parts.join("&")}`);
  }
}
